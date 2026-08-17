/**
 * @vitest-environment node
 *
 * chaine-serveur.node.test.ts — ce que les routes `api/` importent doit
 * survivre à Node, sans navigateur et sans Vite.
 *
 * POURQUOI CE FICHIER EXISTE
 * `/api/v1/tools` a rendu 500 `FUNCTION_INVOCATION_FAILED` pendant des jours.
 * Deux causes s'empilaient :
 *
 *  1. `createScopedStorage(backend: Storage = localStorage)` — paramètre par
 *     défaut évalué à l'appel, et zustand appelle au chargement du module ;
 *  2. `import.meta.env.VITE_SUPABASE_URL` — invention de Vite. Dans Node,
 *     `import.meta.env` vaut `undefined` et lire dessus jette.
 *
 * UNE LIMITE QU'IL FAUT CONNAÎTRE
 * Vitest exécute les tests **à travers Vite**. `import.meta.env` y est donc
 * défini même avec `environment: node` — l'option ne change que les globales
 * du DOM, pas la transformation du bundler.
 *
 * Autrement dit : **aucun test vitest ne peut reproduire la cause n°2.** Une
 * première version de ce fichier prétendait le faire ; elle a échoué, et
 * c'est ce qui a révélé la limite.
 *
 * D'où la répartition ci-dessous, qui est le vrai sujet de ce fichier :
 *  - ce qui est reproductible (absence de `localStorage`) est TESTÉ ;
 *  - ce qui ne l'est pas (`import.meta.env`) est INTERDIT STATIQUEMENT, par
 *    lecture des sources.
 *
 * Un test qui prétend couvrir ce qu'il ne peut pas atteindre est pire qu'un
 * test absent : il donne un vert qui vaut « je n'ai pas regardé ».
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(__dirname, '..');

/** Fichiers importés — directement ou transitivement — par les routes
 *  `api/v1/*`. Toute construction propre au navigateur y est interdite.
 *
 *  Cette liste est tenue à la main, et c'est assumé : calculer la fermeture
 *  transitive donnerait une illusion d'exhaustivité qui se périmerait en
 *  silence. Une liste courte et vraie vaut mieux qu'un graphe approximatif. */
const CHEMIN_SERVEUR = [
  'lib/supabase.ts',
  'lib/tooling/catalog/index.ts',
  'lib/tooling/adapters/rest.ts',
  'lib/tooling/identity.ts',
  'lib/tooling/permissions.ts',
  'lib/tooling/quota.ts',
  'lib/auth/storage-scope.ts',
  'stores/threeApp.store.ts',
  'lib/saas-builder/ledger.store.ts',
];

describe('le contexte du test', () => {
  it('est bien Node pour le DOM', () => {
    expect(
      typeof localStorage,
      'localStorage defini : environnement non-node, le test ne prouve rien',
    ).toBe('undefined');
  });

  it('reste sous Vite pour import.meta — limite connue et documentee', () => {
    // On VERIFIE cette limite au lieu de la subir : si un jour vitest cesse
    // de transformer ce fichier, l'interdiction statique plus bas devient
    // superflue et on pourra tester la chose pour de vrai.
    expect(
      (import.meta as unknown as { env?: unknown }).env,
      'import.meta.env est desormais absent sous vitest : la cause n2 devient ' +
      'testable directement, remplacer l interdiction statique par un vrai test',
    ).toBeDefined();
  });
});

describe('interdiction statique — aucune construction Vite sur le chemin serveur', () => {
  for (const rel of CHEMIN_SERVEUR) {
    it(`${rel} n utilise pas import.meta.env directement`, () => {
      const abs = path.join(RACINE, rel);
      expect(fs.existsSync(abs), `fichier introuvable : ${rel} — liste a mettre a jour`).toBe(true);

      const src = fs.readFileSync(abs, 'utf8');
      // On tolère les mentions en commentaire : elles expliquent justement
      // pourquoi la construction est proscrite ici.
      const lignes = src.split('\n').filter((l) => {
        const t = l.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false;
        return l.includes('import.meta.env');
      });

      expect(
        lignes,
        `${rel} lit import.meta.env, qui vaut undefined dans une fonction ` +
        'Vercel. Passer par viteEnv() de src/lib/env.ts.',
      ).toEqual([]);
    });
  }
});

describe('la chaine se charge sans navigateur', () => {
  it('env.ts ne jette jamais', async () => {
    const { viteEnv, viteEnvDefinie } = await import('./env');
    expect(() => viteEnv('VITE_TOTO_INEXISTANT')).not.toThrow();
    expect(viteEnv('VITE_TOTO_INEXISTANT')).toBeUndefined();
    expect(viteEnvDefinie('VITE_TOTO_INEXISTANT')).toBe(false);
  });

  it('supabase.ts se charge', async () => {
    await expect(import('./supabase')).resolves.toBeTruthy();
  });

  it('les stores persistes se chargent — sans localStorage', async () => {
    await expect(import('../stores/threeApp.store')).resolves.toBeTruthy();
    await expect(import('./saas-builder/ledger.store')).resolves.toBeTruthy();
  });

  it('le catalogue d outils se charge — c est LUI que api/v1 importe', async () => {
    await expect(import('./tooling/catalog')).resolves.toBeTruthy();
  });

  it('l adaptateur REST se charge', async () => {
    await expect(import('./tooling/adapters/rest')).resolves.toBeTruthy();
  });
});
