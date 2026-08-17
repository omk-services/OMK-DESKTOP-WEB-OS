/**
 * seed-bascule-tenant.test.ts — verrou de non-regression.
 *
 * DEFAUT REPRODUIT A L'ECRAN le 2026-08-17 : apres bascule vers un second
 * espace de travail, le formulaire Finance > Invoices repondait
 * « Collection inconnue : "invoices" ». Les 19 apps affichaient des listes
 * vides.
 *
 * DEUX FAUTES SE COMPOSAIENT :
 *
 *  1. `seedCms()` gardait un drapeau booleen au niveau module
 *     (`let seeded = false`). Il ne s'executait donc qu'UNE fois par
 *     chargement de page. Au second appel — celui de la bascule — il rendait
 *     la main sans rien enregistrer.
 *
 *  2. `seedFor(tenantId)` recopiait ensuite
 *     `collectionsByTenant[activeTenantId]` vers `tenantId`. Or `setTenant`
 *     avait DEJA bascule `activeTenantId` sur le nouvel espace et lui avait
 *     pose une partition vide. La recopie lisait donc cette partition vide :
 *     elle copiait du vide dans du vide.
 *
 * Aucun test ne couvrait ce chemin — d'ou le present fichier. Le premier
 * test echoue sur le code d'avant le correctif ; c'est ce qui en fait un
 * verrou et non une decoration.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCmsStore } from './cms.store';
import { seedCms } from './seed';
import type { TenantId } from '../tenant/contract';

const ESPACE_A = 'espace-a' as TenantId;
const ESPACE_B = 'espace-b' as TenantId;

/** Les collections que tout espace amorce doit porter. `invoices` est celle
 *  que l'utilisateur a vue manquer ; les autres gardent le perimetre large. */
const ATTENDUES = ['invoices', 'clients', 'tasks', 'team', 'articles'] as const;

describe('amorcage a la bascule d espace de travail', () => {
  beforeEach(() => {
    useCmsStore.setState({
      activeTenantId: ESPACE_A,
      collectionsByTenant: {},
      itemsByTenant: {},
      collections: {},
      items: {},
    });
  });

  it('un second espace recoit bien les collections, pas une partition vide', async () => {
    seedCms(ESPACE_A);
    const apresA = useCmsStore.getState().collectionsByTenant[ESPACE_A] ?? {};
    expect(Object.keys(apresA).length).toBeGreaterThan(0);

    // La bascule telle que `setTenant` la joue : on pose l'espace actif AVANT
    // d'amorcer. C'est precisement l'ordre qui piegeait l'ancienne recopie.
    useCmsStore.setState({ activeTenantId: ESPACE_B });
    await useCmsStore.getState().seedFor(ESPACE_B);

    const apresB = useCmsStore.getState().collectionsByTenant[ESPACE_B] ?? {};
    expect(
      Object.keys(apresB).length,
      'le second espace est reste vide — le drapeau module a coupe l amorcage',
    ).toBeGreaterThan(0);

    for (const id of ATTENDUES) {
      expect(apresB[id], `collection "${id}" absente du second espace`).toBeDefined();
    }
  });

  it('addItem sur le second espace ne repond plus « Collection inconnue »', async () => {
    seedCms(ESPACE_A);
    useCmsStore.setState({ activeTenantId: ESPACE_B });
    await useCmsStore.getState().seedFor(ESPACE_B);

    const res = useCmsStore.getState().addItemFor(ESPACE_B, 'invoices', {
      client: 'Papa',
      amount: 50,
    } as never);

    expect(res.ok, `refus inattendu : ${'error' in res ? res.error : ''}`).toBe(true);
  });

  it('chaque espace garde ses items — l amorcage ne melange pas les partitions', async () => {
    seedCms(ESPACE_A);
    useCmsStore.setState({ activeTenantId: ESPACE_B });
    await useCmsStore.getState().seedFor(ESPACE_B);

    useCmsStore.getState().addItemFor(ESPACE_B, 'invoices', {
      client: 'Propre a B',
      amount: 1,
    } as never);

    const itemsA = useCmsStore.getState().itemsByTenant[ESPACE_A]?.invoices ?? [];
    const itemsB = useCmsStore.getState().itemsByTenant[ESPACE_B]?.invoices ?? [];

    expect(itemsB.length).toBe(itemsA.length + 1);
    expect(itemsA.some((it) => (it as { client?: string }).client === 'Propre a B')).toBe(false);
  });
});
