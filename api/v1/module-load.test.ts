// api/v1/module-load.test.ts
//
// Verrou FIX_5 (2026-08-17) — les routes `/api/v1/*` se chargent sans
// exception au top-level en environnement Node.
//
// Pourquoi ce test existe :
//   Avant FIX_5, `api/v1/tools.ts` faisait
//   `import { registerAll } from '../../src/lib/tooling/catalog'` au
//   top level. Le fichier `catalog/index.ts` exécute `registerAll()` à
//   l'évaluation du module, ce qui charge `saasBuilderTools` →
//   `useThreeAppStore` (zustand + persist avec `localStorage`). En
//   serverless Node, `localStorage` n'est pas défini : le module jette
//   à l'import, et Vercel rend `FUNCTION_INVOCATION_FAILED` (500).
//
//   Vitest avec `environment: 'jsdom'` ne reproduit pas la condition
//   prod : `localStorage` est défini, l'import passe, et le test
//   importait le module sans rien signaler. C'est exactement le mode
//   de défaillance qu'a eu le déploiement : un test « vert » en
//   jsdom, un 500 en prod.
//
//   Ce fichier force `environment: 'node'`. En Node, `localStorage`
//   n'est pas un global ; importer l'ancien `tools.ts` faisait planter
//   l'import. Avec FIX_5, la chaîne catalog/zustand n'est plus
//   déclenchée au top level : le module charge dans les deux
//   environnements.
//
// Référence : RAPPORT_FIX_3 §3 (diagnostic) et RAPPORT_FIX_5 §1
// (correctif).
//
// @vitest-environment node

import { describe, it, expect } from 'vitest';

describe('module load en environnement Node (FIX_5)', () => {
  it('api/v1/tools.ts charge sans exception', async () => {
    // L'import dynamique en environnement Node est le moment où
    // l'ancien code jetait. Aujourd'hui, seul `verifierAcces` est
    // importé statiquement (le catalogue est différé dans le
    // gestionnaire).
    await expect(import('./tools')).resolves.toBeDefined();
  });

  it('api/v1/[tool].ts charge sans exception', async () => {
    // Idem : `toolHandler` (depuis adapters/rest.ts) et `verifierAcces`
    // sont les seuls imports statiques. Aucun ne déclenche la chaîne
    // catalog → zustand → localStorage.
    await expect(import('./[tool]')).resolves.toBeDefined();
  });
});
