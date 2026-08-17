/** Le portier des routes d'agent.
 *
 *  Ce test existe parce que le sens du defaut est tout : une securite qui
 *  echoue en s'ouvrant n'est pas une securite. Oublier de poser
 *  `AGENT_API_TOKEN` doit couper le service en production, jamais l'ouvrir.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { verifierAcces, verifierTaille, TAILLE_MAX_CORPS } from './garde';
import { gestionnaire as gestionnaireTool } from '../v1/[tool]';
import { gestionnaire as gestionnaireTools } from '../v1/tools';
import { gestionnaire as gestionnaireRoster } from '../agent/roster';
import { gestionnaire as gestionnaireProviders } from '../agent/providers';

const initial = { ...process.env };
afterEach(() => {
  process.env = { ...initial };
});

function req(entetes: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/chat', { method: 'POST', headers: entetes });
}

describe('verifierAcces', () => {
  it('laisse passer en developpement quand aucun jeton n est configure', () => {
    delete process.env.AGENT_API_TOKEN;
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'development';
    expect(verifierAcces(req())).toBeNull();
  });

  it('REFUSE en production quand aucun jeton n est configure', () => {
    delete process.env.AGENT_API_TOKEN;
    process.env.VERCEL_ENV = 'production';
    const r = verifierAcces(req());
    expect(r?.status).toBe(503);
  });

  it('ne dit pas pourquoi il refuse', () => {
    delete process.env.AGENT_API_TOKEN;
    process.env.VERCEL_ENV = 'production';
    // Nommer la variable manquante renseignerait l'appelant sur la configuration.
    expect(verifierAcces(req())?.message).not.toMatch(/AGENT_API_TOKEN/);
  });

  it('exige le jeton des qu il est configure, meme hors production', () => {
    process.env.AGENT_API_TOKEN = 'secret-abc';
    process.env.NODE_ENV = 'development';
    expect(verifierAcces(req())?.status).toBe(401);
  });

  it('accepte le bon jeton', () => {
    process.env.AGENT_API_TOKEN = 'secret-abc';
    expect(verifierAcces(req({ authorization: 'Bearer secret-abc' }))).toBeNull();
  });

  it('refuse un jeton approchant', () => {
    process.env.AGENT_API_TOKEN = 'secret-abc';
    expect(verifierAcces(req({ authorization: 'Bearer secret-abd' }))?.status).toBe(401);
    expect(verifierAcces(req({ authorization: 'Bearer secret-ab' }))?.status).toBe(401);
    // Sans le prefixe Bearer, la valeur brute ne passe pas non plus.
    expect(verifierAcces(req({ authorization: 'secret-abc' }))?.status).toBe(401);
  });
});

describe('verifierTaille', () => {
  it('laisse passer sans en-tete de longueur', () => {
    expect(verifierTaille(req())).toBeNull();
  });

  it('laisse passer un corps sous le plafond', () => {
    expect(verifierTaille(req({ 'content-length': String(TAILLE_MAX_CORPS - 1) }))).toBeNull();
  });

  it('refuse un corps au-dela du plafond', () => {
    expect(verifierTaille(req({ 'content-length': String(TAILLE_MAX_CORPS + 1) }))?.status).toBe(413);
  });
});

/** Verrous FIX_3 (2026-08-17) : les routes `/api/v1/*`, `/api/agent/roster`
 *  et `/api/agent/providers` ne sont plus jamais en 200 sans presentation
 *  du jeton. La protection par défaut reste « ouvert en dev / fermé en
 *  prod » — cohérent avec `/api/chat` et `/api/agent/invoke`. */
describe('garde sur les routes ajoutees en FIX_3', () => {
  describe('/api/v1/[tool]', () => {
    it('REFUSE en production sans jeton', async () => {
      delete process.env.AGENT_API_TOKEN;
      process.env.VERCEL_ENV = 'production';
      const r = await gestionnaireTool(
        new Request('http://localhost/api/v1/collection.list', { method: 'POST' }),
      );
      expect(r.status).toBe(503);
    });

    it('passe le garde en developpement sans jeton', async () => {
      delete process.env.AGENT_API_TOKEN;
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = 'development';
      // 405 methode non autorisee prouve qu on a depasse le garde :
      // sans `verifierAcces` on aurait tente d executer l outil.
      const r = await gestionnaireTool(
        new Request('http://localhost/api/v1/collection.list', { method: 'GET' }),
      );
      expect(r.status).toBe(405);
    });

    it('passe le garde avec le bon jeton en production', async () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      // On utilise GET : sans le bon jeton, le garde repondrait 503.
      // Avec le bon jeton, le garde laisse passer et la methode est
      // rejetee (405) — preuve que `verifierAcces` n'a PAS coupe.
      // On evite POST qui tomberait ensuite sur la 2ᵉ couche d identite
      // (perimetre d un autre agent), sans rapport avec le test ici.
      const r = await gestionnaireTool(
        new Request('http://localhost/api/v1/collection.list', {
          method: 'GET',
          headers: { authorization: 'Bearer secret-abc' },
        }),
      );
      expect(r.status).toBe(405);
    });

    it('refuse un jeton invalide en production', async () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      const r = await gestionnaireTool(
        new Request('http://localhost/api/v1/collection.list', {
          method: 'POST',
          headers: { authorization: 'Bearer secret-abd' },
          body: '{}',
        }),
      );
      expect(r.status).toBe(401);
    });
  });

  describe('/api/v1/tools', () => {
    it('REFUSE en production sans jeton', async () => {
      delete process.env.AGENT_API_TOKEN;
      process.env.VERCEL_ENV = 'production';
      const r = await gestionnaireTools(
        new Request('http://localhost/api/v1/tools'),
      );
      expect(r.status).toBe(503);
    });

    it('passe le garde avec le bon jeton en production', async () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      const r = await gestionnaireTools(
        new Request('http://localhost/api/v1/tools', {
          headers: { authorization: 'Bearer secret-abc' },
        }),
      );
      // Le garde passe : la reponse depend du catalogue cote serveur.
      // Ce qui compte : aucun refus d authentification.
      expect(r.status).not.toBe(401);
      expect(r.status).not.toBe(503);
    });

    it('refuse un jeton invalide en production', async () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      const r = await gestionnaireTools(
        new Request('http://localhost/api/v1/tools', {
          headers: { authorization: 'Bearer mauvais' },
        }),
      );
      expect(r.status).toBe(401);
    });
  });

  describe('/api/agent/roster', () => {
    it('REFUSE en production sans jeton', () => {
      delete process.env.AGENT_API_TOKEN;
      process.env.VERCEL_ENV = 'production';
      const r = gestionnaireRoster(new Request('http://localhost/api/agent/roster'));
      expect(r.status).toBe(503);
    });

    it('passe le garde avec le bon jeton en production', () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      const r = gestionnaireRoster(
        new Request('http://localhost/api/agent/roster', {
          headers: { authorization: 'Bearer secret-abc' },
        }),
      );
      // Garde passe : on ne tient pas compte du contenu (les backends
      // sont peut-etre indisponibles en environnement de test).
      expect(r.status).not.toBe(401);
      expect(r.status).not.toBe(503);
    });
  });

  describe('/api/agent/providers', () => {
    it('REFUSE en production sans jeton', () => {
      delete process.env.AGENT_API_TOKEN;
      process.env.VERCEL_ENV = 'production';
      const r = gestionnaireProviders(new Request('http://localhost/api/agent/providers'));
      expect(r.status).toBe(503);
    });

    it('passe le garde avec le bon jeton en production', () => {
      process.env.AGENT_API_TOKEN = 'secret-abc';
      process.env.VERCEL_ENV = 'production';
      const r = gestionnaireProviders(
        new Request('http://localhost/api/agent/providers', {
          headers: { authorization: 'Bearer secret-abc' },
        }),
      );
      expect(r.status).not.toBe(401);
      expect(r.status).not.toBe(503);
    });
  });
});
