/**
 * seed-collections.test.ts — verrou de non-régression, app `legal`.
 *
 * Brief FIX-7 : avant la consolidation dans `src/lib/cms/seed.ts`, les 8
 * collections consommées ici (`legal_ai_act_checks`, `legal_frameworks`,
 * etc.) étaient déclarées dans `src/apps/legal/seed.ts` et rendues
 * disponibles uniquement parce que `LegalApp.tsx:22` appelait
 * `seedLegalCms()` au boot. Si cet import était cassé, ou si la fonction
 * n'était pas appelée (test unitaire, code-splitting), `ComplianceDashboard`
 * et les 6 sections « registre » se taisaient en présentant des listes
 * vides — un diagnostic faux.
 *
 * Le verrou :
 *   1. Extraire statiquement les IDs consommés par le code de l'app
 *      (`s.items['x']`, `useCollectionDrill('x')`, `addItem('x')`,
 *      `updateItem('x')`).
 *   2. Remettre le store à zéro.
 *   3. Appeler UNIQUEMENT `seedCms()` — pas les seeds locaux des apps.
 *   4. Vérifier que chaque ID consommé a bien sa déclaration dans le
 *      store central.
 *
 * Si le test échoue, il liste les IDs manquants. C'est la sortie qu'un
 * humain doit voir avant d'ajouter une collection sans la déclarer
 * dans `src/lib/cms/seed.ts`.
 *
 * Choix de périmètre : on ne touche pas à `apps/legal/seed.ts` (devenu
 * un no-op) ni aux apps en dehors de `legal/` et `people/`. Les autres
 * apps ont leur propre inventaire, ailleurs.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { useCmsStore } from '../../lib/cms/cms.store';
import { seedCms } from '../../lib/cms/seed';
import { TENANT_DEMO_COACH } from '../../stores/tenant.store';
import { TENANT_DEFAULT } from '../../lib/tenant/contract';

/* —— Extraction statique des IDs consommés par le code de l'app. —— */

/** Tous les fichiers source de l'app `legal/` (.ts/.tsx, hors .test.ts).
 *  Lecture statique — pas de compile, pas de runtime. */
function listSourceFiles(): string[] {
  const here = resolve(__dirname);
  return readdirSync(here).filter(
    (name) => /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts'),
  );
}

/** Extrait les IDs consommés par le code d'un fichier. Les patterns
 *  couverts : `s.items['x']`, `s.collections['x']`, `useCollectionDrill('x', …)`,
 *  `addItem('x', …)`, `addItemFor('x', …)`, `updateItem('x', …)`,
 *  `updateItemFor('x', …)`, `removeItem('x', …)`, `removeItemFor('x', …)`.
 *  On exclut les IDs qui apparaissent UNIQUEMENT dans la déclaration
 *  d'un seed local — pour cela, on filtre les fichiers `seed.ts` du
 *  calcul (le brief FIX-7 ne s'intéresse pas aux seeds locaux).
 *
 *  Les commentaires `//` et `/* *\/` sont retirés du source avant
 *  application des regex — sans ça, un commentaire qui dit
 *  `s.items['x']` (où `x` est juste un nom de variable pédagogique)
 *  serait compté comme une collection consommée. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Identifiant CMS plausible — au moins 3 caractères, commence par une
 *  lettre, contient lettres / chiffres / `_`. Ce filtre évite que des
 *  chaînes de doc type `'x'` soient comptées comme des collections. */
function isPlausibleCollectionId(s: string): boolean {
  return /^[a-z][a-z0-9_]{2,}$/.test(s);
}

function extractCollectionIds(filePath: string): Set<string> {
  const raw = readFileSync(filePath, 'utf-8');
  const src = stripComments(raw);
  const ids = new Set<string>();
  const patterns: RegExp[] = [
    /s\.items\[['"]([a-z_0-9]+)['"]\]/g,
    /s\.collections\[['"]([a-z_0-9]+)['"]\]/g,
    /useCollectionDrill\(\s*['"]([a-z_0-9]+)['"]/g,
    /addItem(?:For)?\s*\(\s*['"]([a-z_0-9]+)['"]/g,
    /updateItem(?:For)?\s*\(\s*['"]([a-z_0-9]+)['"]/g,
    /removeItem(?:For)?\s*\(\s*['"]([a-z_0-9]+)['"]/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (isPlausibleCollectionId(m[1])) ids.add(m[1]);
    }
  }
  return ids;
}

/** Agrège les IDs sur tous les fichiers source de l'app. */
function consumedByLegal(): Set<string> {
  const out = new Set<string>();
  for (const name of listSourceFiles()) {
    if (name === 'seed.ts') continue;
    for (const id of extractCollectionIds(resolve(__dirname, name))) {
      out.add(id);
    }
  }
  return out;
}

/* —— Reset propre du store multi-tenant (même approche que
 *    seed-bascule-tenant.test.ts). —— */

function resetStore(): void {
  useCmsStore.setState({
    activeTenantId: TENANT_DEMO_COACH,
    collections: {},
    items: {},
    collectionsByTenant: {
      [TENANT_DEMO_COACH]: {},
      [TENANT_DEFAULT]: {},
    } as Record<string, Record<string, never>>,
    itemsByTenant: {
      [TENANT_DEMO_COACH]: {},
      [TENANT_DEFAULT]: {},
    } as Record<string, Record<string, never>>,
  });
}

describe('FIX-7 — collections consommées par l\'app Legal', () => {
  beforeEach(resetStore);

  it('chaque collection consommée est déclarée dans seedCms (central)', () => {
    const consumed = consumedByLegal();
    // Vérif minimale : au moins une collection est consommée. Sinon le
    // test passe à vide, ce qui n'est pas une garantie utile.
    expect(consumed.size, 'aucune collection consommée trouvée dans apps/legal/').toBeGreaterThan(0);

    // On n'appelle QUE seedCms() — pas le seed local. C'est précisément
    // l'invariant que le brief FIX-7 cherche à verrouiller : un humain
    // (ou un test) qui importe uniquement le store central doit voir
    // toutes les collections dont l'app a besoin.
    seedCms();

    const registered = new Set(Object.keys(useCmsStore.getState().collections));

    const missing: string[] = [];
    for (const id of consumed) {
      if (!registered.has(id)) missing.push(id);
    }

    expect(
      missing,
      `Collections consommées par apps/legal/ mais absentes du registre central :\n` +
        missing.map((id) => `  - ${id}`).join('\n') +
        `\n\nDéclarer ces collections dans src/lib/cms/seed.ts (id, fields, items)`,
    ).toEqual([]);
  });
});
