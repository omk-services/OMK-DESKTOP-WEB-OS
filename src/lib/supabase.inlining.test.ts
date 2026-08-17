/**
 * supabase.inlining.test.ts — la configuration Supabase DOIT être lue par
 * accès statique, sinon elle disparaît du bundle.
 *
 * L'INCIDENT QUE CE FICHIER EMPÊCHE DE REVIVRE
 *
 * Le 2026-08-17, `src/lib/supabase.ts` est passé de
 *
 *     import.meta.env.VITE_SUPABASE_URL          (accès statique)
 *
 * à
 *
 *     viteEnv('VITE_SUPABASE_URL')               (accès dynamique via helper)
 *
 * L'intention était bonne — rendre le module chargeable dans une fonction
 * serverless Node, où `import.meta.env` vaut `undefined`.
 *
 * L'effet a été catastrophique et invisible aux tests : **Vite ne remplace
 * que le motif LITTÉRAL** `import.meta.env.VITE_XXX`. Un helper qui aliase
 * `import.meta` casse ce remplacement. La valeur n'est plus inlinée, l'app
 * démarre en croyant Supabase non configuré, l'écran de connexion affiche
 * « Supabase non configuré — seule l'entrée Découvrir sans compte est
 * disponible », et **aucun compte ne fonctionne plus**.
 *
 * Rien ne l'a attrapé : `tsc` passe, les 527 tests passaient, le build
 * réussissait, et le déploiement était vert. Seul l'écran le disait.
 *
 * LA SOLUTION RETENUE
 *
 *     import.meta.env?.VITE_SUPABASE_URL
 *
 * L'optional chaining protège Node sans empêcher l'inlining — vérifié
 * empiriquement : un build avec une valeur sentinelle la retrouve 3 fois
 * dans `dist/`.
 *
 * CE QUE CE TEST PEUT ET NE PEUT PAS FAIRE
 *
 * Il ne peut pas vérifier l'inlining : vitest s'exécute à travers Vite en
 * mode dev, pas sur un bundle de production. Il vérifie donc la PROPRIÉTÉ
 * SOURCE qui garantit l'inlining — l'accès statique — et refuse tout retour
 * à un accès dynamique.
 *
 * Pour vérifier l'inlining pour de vrai :
 *   VITE_SUPABASE_URL=https://SENTINELLE.supabase.co npm run build
 *   grep -c "SENTINELLE" dist/assets/*.js     # doit être >= 1
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const FICHIER = path.resolve(__dirname, 'supabase.ts');

/** Lignes de code effectives — commentaires retirés. Les commentaires de ce
 *  module parlent justement de `import.meta.env` pour expliquer la règle. */
function lignesDeCode(src: string): string[] {
  return src.split('\n').filter((l) => {
    const t = l.trim();
    return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
  });
}

describe('supabase.ts lit sa configuration par acces statique', () => {
  const src = fs.readFileSync(FICHIER, 'utf8');
  const code = lignesDeCode(src);

  it('utilise le motif litteral import.meta.env pour les deux variables', () => {
    for (const cle of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
      const trouve = code.some(
        (l) => l.includes(`import.meta.env`) && l.includes(cle),
      );
      expect(
        trouve,
        `${cle} n est plus lue par un motif litteral import.meta.env.${cle}. ` +
        'Vite ne remplacera pas la valeur au build : elle disparaitra du bundle ' +
        'et l app demarrera en croyant Supabase non configure.',
      ).toBe(true);
    }
  });

  it('ne passe PAS par un helper d environnement', () => {
    // `viteEnv` / `envBrut` aliasent `import.meta` et cassent le remplacement.
    // Ils restent legitimes AILLEURS (code purement serveur), pas ici.
    const fautives = code.filter(
      (l) => /\bviteEnv\s*\(/.test(l) || /\bviteEnvDefinie\s*\(/.test(l),
    );
    expect(
      fautives,
      'supabase.ts passe par un helper pour lire ses variables. ' +
      'Un helper aliase import.meta et empeche l inlining Vite. ' +
      'Utiliser import.meta.env?.VITE_XXX directement.',
    ).toEqual([]);
  });

  it('protege quand meme Node — optional chaining ou garde equivalente', () => {
    // Ce module est importe transitivement par `api/v1/*`, qui tourne dans
    // Node. Sans protection, `import.meta.env.X` y jette un TypeError.
    const acces = code.filter((l) => l.includes('import.meta.env'));
    expect(acces.length).toBeGreaterThan(0);
    for (const l of acces) {
      expect(
        l.includes('import.meta.env?.'),
        `acces non protege dans "${l.trim()}" — utiliser import.meta.env?.X, ` +
        'sinon la route api/v1 rend un 500 opaque au chargement du module.',
      ).toBe(true);
    }
  });
});
