/**
 * tools.test.ts — Brief-F : les outils d'écriture de l'agent.
 *
 * Verrouille le contrat propose-not-act :
 *  - creerItem ne mute JAMAIS la collection cible ; il dépose une
 *    proposition dans le scénario courant ;
 *  - modifierItem suit la même règle ;
 *  - applyCreerItem écrit l'item et fournit un revert qui nettoie ;
 *  - applyModifierItem patche puis restore le snapshot exact au revert ;
 *  - un revert appelle effectivement removeItem / updateItem avec les
 *    valeurs de capture, pas avec des valeurs recréées à la main.
 *
 * Si un de ces tests échoue, on est revenus au mensonge : un outil qui
 * prétend agir et qui n'agit pas, ou pire, qui agit sans pouvoir défaire.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCmsStore } from '../lib/cms/cms.store';
import { useScenariosStore } from '../stores/scenarios.store';
import {
  creerItem,
  modifierItem,
  applyCreerItem,
  applyModifierItem,
  applicateurs,
} from './tools';
import type { CmsCollectionDef } from '../lib/cms/types';
import { TENANT_DEFAULT } from '../lib/tenant/contract';
import { TENANT_DEMO_COACH } from '../stores/tenant.store';

const tasksDef: CmsCollectionDef = {
  id: 'tasks',
  name: 'Tasks',
  singular: 'Task',
  accent: '#0d9488',
  titleField: 'label',
  subtitleField: 'when',
  badgeField: 'group',
  fields: [
    { key: 'when', label: 'When', type: 'text' },
    { key: 'group', label: 'Group', type: 'badge' },
    { key: 'done', label: 'Done', type: 'text' },
  ],
};

/** Reset both the flat view AND the tenant partition. Phase 3 added a
 *  partition alongside the flat view; clearing only the flat view leaves
 *  the partition populated and breaks the length assertions in these
 *  tests. */
function reset(): void {
  useCmsStore.setState({
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
  useScenariosStore.setState({
    scenarios: {},
    scenarioOrder: [],
    currentScenarioId: null,
  });
}

describe('creerItem — propose, ne mute pas', () => {
  beforeEach(reset);

  it('dépose une proposition ; la collection reste intacte', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const before = useCmsStore.getState().items['tasks']?.length ?? 0;

    const r = creerItem({
      collectionId: 'tasks',
      fields: { label: 'Appeler Marc', when: 'today', group: 'today', done: false },
    });
    expect(r.ok).toBe(true);

    const after = useCmsStore.getState().items['tasks']?.length ?? 0;
    expect(after).toBe(before);

    // La proposition, elle, est bien là.
    const order = useScenariosStore.getState().scenarioOrder;
    expect(order).toHaveLength(1);
    const sc = useScenariosStore.getState().scenarios[order[0] ?? ''];
    expect(sc?.proposals[0]?.toolName).toBe('creerItem');
  });

  it('refuse une collection inconnue', () => {
    const r = creerItem({ collectionId: 'unknown', fields: { label: 'x' } });
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: string }).error).toMatch(/unknown/i);
  });

  it('refuse si le titre (champ déclaré par la collection) manque', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const r = creerItem({ collectionId: 'tasks', fields: { when: 'today' } });
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: string }).error).toMatch(/label/i);
  });

  it('ignore les champs qui ne sont pas déclarés par la collection', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const r = creerItem({
      collectionId: 'tasks',
      fields: {
        label: 'OK',
        unknownField: 'should be dropped',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    expect(r.ok).toBe(true);
    const order = useScenariosStore.getState().scenarioOrder;
    const sc = useScenariosStore.getState().scenarios[order[0] ?? ''];
    expect(sc?.proposals[0]?.args).not.toHaveProperty('unknownField');
  });
});

describe('applyCreerItem — l\'applicateur', () => {
  beforeEach(reset);

  it('inscrit l\'item et fournit un revert qui retire la ligne', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const r = applyCreerItem({
      collectionId: 'tasks',
      fields: { label: 'Volatile', when: 'today', group: 'today', done: false },
    });
    expect(r.ok).toBe(true);
    expect(r.revert).toBeTypeOf('function');
    const items1 = useCmsStore.getState().items['tasks'] ?? [];
    expect(items1).toHaveLength(1);
    if (r.revert) r.revert();
    const items2 = useCmsStore.getState().items['tasks'] ?? [];
    expect(items2).toHaveLength(0);
  });

  it('refuse une collection inconnue', () => {
    const r = applyCreerItem({ collectionId: 'unknown', fields: {} });
    expect(r.ok).toBe(false);
  });
});

describe('modifierItem — propose, ne mute pas', () => {
  beforeEach(reset);

  it('dépose une proposition ; l\'item reste inchangé', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, [
      { id: 't1', label: 'Avant', when: 'today', group: 'today', done: false },
    ]);
    const r = modifierItem({ collectionId: 'tasks', id: 't1', patch: { done: true } });
    expect(r.ok).toBe(true);
    const items = useCmsStore.getState().items['tasks'] ?? [];
    expect(items[0]?.done).toBe(false);
  });

  it('refuse un id inexistant', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const r = modifierItem({ collectionId: 'tasks', id: 'ghost', patch: { done: true } });
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: string }).error).toMatch(/introuvable/i);
  });
});

describe('applyModifierItem — l\'applicateur', () => {
  beforeEach(reset);

  it('applique le patch et revert restore le snapshot exact', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, [
      { id: 't1', label: 'Avant', when: 'today', group: 'today', done: false },
    ]);
    const r = applyModifierItem({ collectionId: 'tasks', id: 't1', patch: { done: true, label: 'Apres' } });
    expect(r.ok).toBe(true);
    const after = useCmsStore.getState().items['tasks'] ?? [];
    expect(after[0]?.done).toBe(true);
    expect(after[0]?.label).toBe('Apres');

    if (r.revert) r.revert();
    const reverted = useCmsStore.getState().items['tasks'] ?? [];
    expect(reverted[0]?.done).toBe(false);
    expect(reverted[0]?.label).toBe('Avant');
  });
});

describe('applicateurs — table de la fusion', () => {
  beforeEach(reset);

  it('creerItem et modifierItem figurent dans la table, à côté de changerTheme', () => {
    expect(applicateurs.creerItem).toBe(applyCreerItem);
    expect(applicateurs.modifierItem).toBe(applyModifierItem);
    expect(applicateurs.changerTheme).toBeTypeOf('function');
  });
});
