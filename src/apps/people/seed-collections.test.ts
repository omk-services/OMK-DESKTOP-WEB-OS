/**
 * seed-collections.test.ts — verrou de non-régression, app `people`.
 *
 * Voir `src/apps/legal/seed-collections.test.ts` pour la justification
 * détaillée. Le présent test applique exactement la même logique à
 * l'app People : les IDs consommés sont extraits statiquement du code
 * source, puis comparés à ce que `seedCms()` (central seul) rend
 * disponible. Le seed local de People est exclu de l'extraction pour
 * que le test mesure précisément « ce que le central sait faire ».
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { useCmsStore } from '../../lib/cms/cms.store';
import { seedCms } from '../../lib/cms/seed';
import { TENANT_DEMO_COACH } from '../../stores/tenant.store';
import { TENANT_DEFAULT } from '../../lib/tenant/contract';

function listSourceFiles(): string[] {
  const here = resolve(__dirname);
  return readdirSync(here).filter(
    (name) => /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts'),
  );
}

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

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

function consumedByPeople(): Set<string> {
  const out = new Set<string>();
  for (const name of listSourceFiles()) {
    if (name === 'seed.ts') continue;
    for (const id of extractCollectionIds(resolve(__dirname, name))) {
      out.add(id);
    }
  }
  return out;
}

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

describe('FIX-7 — collections consommées par l\'app People', () => {
  beforeEach(resetStore);

  it('chaque collection consommée est déclarée dans seedCms (central)', () => {
    const consumed = consumedByPeople();
    expect(consumed.size, 'aucune collection consommée trouvée dans apps/people/').toBeGreaterThan(0);

    seedCms();

    const registered = new Set(Object.keys(useCmsStore.getState().collections));

    const missing: string[] = [];
    for (const id of consumed) {
      if (!registered.has(id)) missing.push(id);
    }

    expect(
      missing,
      `Collections consommées par apps/people/ mais absentes du registre central :\n` +
        missing.map((id) => `  - ${id}`).join('\n') +
        `\n\nDéclarer ces collections dans src/lib/cms/seed.ts (id, fields, items)`,
    ).toEqual([]);
  });
});
