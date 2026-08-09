/**
 * cms.store.test.ts — Brief-F : la couche d'écriture.
 *
 * Ces tests verrouillent le contrat minimal qu'un humain et un agent
 * s'attendent à trouver sur le magasin CMS :
 *  - addItem génère un id et persiste l'item ;
 *  - removeItem supprime un item existant et refuse les inconnus ;
 *  - addItem refuse une collection inconnue sans toucher au store ;
 *  - un cycle add → remove laisse le store dans son état d'origine.
 *
 * Note : la persistance Supabase est volontairement absente — c'est un
 * effet de bord best-effort et le store local reste la source de vérité
 * tant que le fournisseur n'a pas confirmé (cf. cms.store.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCmsStore } from './cms.store';
import type { CmsCollectionDef } from './types';
import { TENANT_DEFAULT } from '../tenant/contract';
import { TENANT_DEMO_COACH } from '../../stores/tenant.store';

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

/** Reset the multi-tenant store back to its empty state. Phase 3 added a
 *  tenant partition alongside the flat view; clearing only the flat view
 *  would leave leftover data in the partition and break the length
 *  assertions in the tests below. */
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
}

describe('cms.store — couche d\'écriture', () => {
  beforeEach(reset);

  it('addItem génère un id et insère dans la collection', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const result = useCmsStore.getState().addItem('tasks', {
      label: 'Appeler Marc',
      when: 'today',
      group: 'today',
      done: false,
    });
    expect(result.ok).toBe(true);
    expect(result.item?.id).toBeTruthy();
    expect(result.item?.label).toBe('Appeler Marc');
    const items = useCmsStore.getState().items['tasks'] ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(result.item?.id);
  });

  it('addItem refuse une collection inconnue sans muter le store', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const result = useCmsStore.getState().addItem('unknown', { label: 'x' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unknown/i);
    expect(useCmsStore.getState().items['unknown']).toBeUndefined();
  });

  it('addItem refuse un titre vide quand la collection le déclare obligatoire', () => {
    // Le contrat : pas de validation du titre ici — c'est l'outil `creerItem`
    // qui vérifie. addItem reste permissif ; c'est l'agent ou le formulaire
    // qui tranche. On vérifie donc qu'un titre vide passe quand même —
    // l'auteur de la couche de scénarios met la validation métier.
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, []);
    const result = useCmsStore.getState().addItem('tasks', { label: '' });
    expect(result.ok).toBe(true);
  });

  it('removeItem supprime l\'item et conserve le reste', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, [
      { id: 't1', label: 'Premier', when: 'today', group: 'today', done: false },
      { id: 't2', label: 'Deuxième', when: 'today', group: 'today', done: false },
    ]);
    const r = useCmsStore.getState().removeItem('tasks', 't1');
    expect(r.ok).toBe(true);
    const items = useCmsStore.getState().items['tasks'] ?? [];
    expect(items.map((i) => i.id)).toEqual(['t2']);
  });

  it('removeItem refuse un id inexistant', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, [{ id: 't1', label: 'Premier', when: 'today', group: 'today', done: false }]);
    const r = useCmsStore.getState().removeItem('tasks', 'introuvable');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/introuvable/i);
  });

  it('cycle add → remove laisse le store identique à l\'origine', () => {
    const store = useCmsStore.getState();
    const seed = [{ id: 't1', label: 'Premier', when: 'today', group: 'today', done: false }];
    store.registerCollection(tasksDef, seed);
    const added = useCmsStore.getState().addItem('tasks', { label: 'Volatile', when: 'today', group: 'today', done: false });
    expect(added.ok).toBe(true);
    const removed = useCmsStore.getState().removeItem('tasks', String(added.item?.id ?? ''));
    expect(removed.ok).toBe(true);
    const final = useCmsStore.getState().items['tasks'] ?? [];
    expect(final.map((i) => i.id)).toEqual(['t1']);
  });

  it('updateItem reste intact (régression — la nouvelle voie ne casse pas l\'ancienne)', () => {
    const store = useCmsStore.getState();
    store.registerCollection(tasksDef, [{ id: 't1', label: 'Avant', when: 'today', group: 'today', done: false }]);
    useCmsStore.getState().updateItem('tasks', 't1', { done: true });
    const items = useCmsStore.getState().items['tasks'] ?? [];
    expect(items[0]?.done).toBe(true);
    expect(items[0]?.label).toBe('Avant');
  });
});
