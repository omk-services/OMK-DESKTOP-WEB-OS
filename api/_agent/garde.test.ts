/** Le portier des routes d'agent.
 *
 *  Ce test existe parce que le sens du defaut est tout : une securite qui
 *  echoue en s'ouvrant n'est pas une securite. Oublier de poser
 *  `AGENT_API_TOKEN` doit couper le service en production, jamais l'ouvrir.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { verifierAcces, verifierTaille, TAILLE_MAX_CORPS } from './garde';

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
