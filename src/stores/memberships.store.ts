/** memberships.store.ts — store Zustand des memberships visibles.
 *
 *  Phase 3 multi-utilisateurs par tenant (brief 2026-08-15 MEMBERSHIPS).
 *
 *  Cible : la UI doit pouvoir afficher "qui est dans ce tenant ?" et
 *  "invite un membre" sans round-trip réseau à chaque render. C'est
 *  un cache mémoire du résultat de `listerMemberships(ctx)`, sliced
 *  par tenant.
 *
 *  Architecture :
 *   - `byTenant` : map (tenantId) -> Map(membershipId) -> record.
 *   - `error` : dernière erreur rencontrée, pour affichage.
 *   - `isLoading` : signal pour les spinners.
 *
 *  Le store ne fait **pas** d'auth. Il est alimenté par le composant
 *  qui consomme la session (par exemple, `ProfileWorkspaceSection`)
 *  via `bootstrap()`. C'est intentionnel : le store ne dépend ni de
 *  Supabase, ni de l'authProvider — il sait juste "voici les rows
 *  pour ce tenant".
 *
 *  Invariant : `byTenant['__nonexistent__']` renvoie `[]`, jamais
 *  `undefined`. On ne veut pas qu'un oubli de bootstrap fasse
 *  crasher un composant.
 */
import { create } from 'zustand';
import type { MembershipRecord, TenantId } from '../lib/tenant/contract';
import { listerMemberships } from '../lib/auth/memberships';
import type { ToolContext } from '../lib/tooling/types';

export interface MembershipsState {
  /** Map tenantId -> liste des memberships. */
  byTenant: Record<string, MembershipRecord[]>;
  /** True pendant un appel `listerMemberships()`. */
  isLoading: boolean;
  /** Dernière erreur, ou null. */
  error: string | null;
  /** Dernière mise à jour par tenant (ISO 8601) — utile pour le swr. */
  lastFetchedAt: Record<string, string>;
}

export interface MembershipsActions {
  /** Lit les memberships du tenant actif et les met en cache. */
  bootstrap: (ctx: ToolContext, tenantId?: string) => Promise<void>;
  /** Invalide le cache d'un tenant (force une relecture). */
  invalidate: (tenantId: string) => void;
  /** Reset complet (logout). */
  reset: () => void;
  /** Selector helper. */
  forTenant: (tenantId: string) => MembershipRecord[];
}

export type MembershipsStore = MembershipsState & MembershipsActions;

const EMPTY: MembershipRecord[] = [];

export const useMembershipsStore = create<MembershipsStore>((set, get) => ({
  byTenant: {},
  isLoading: false,
  error: null,
  lastFetchedAt: {},

  bootstrap: async (ctx: ToolContext, tenantId?: string): Promise<void> => {
    const target = (tenantId ?? ctx.tenantId) as TenantId;
    set({ isLoading: true, error: null });
    try {
      const r = await listerMemberships(ctx, target);
      if (!r.ok) {
        set({
          isLoading: false,
          error: r.raison,
        });
        return;
      }
      set((s) => ({
        byTenant: { ...s.byTenant, [target]: r.data },
        isLoading: false,
        error: null,
        lastFetchedAt: { ...s.lastFetchedAt, [target]: new Date().toISOString() },
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  invalidate: (tenantId: string): void => {
    set((s) => {
      const next = { ...s.byTenant };
      delete next[tenantId];
      const last = { ...s.lastFetchedAt };
      delete last[tenantId];
      return { byTenant: next, lastFetchedAt: last };
    });
  },

  reset: (): void => {
    set({ byTenant: {}, lastFetchedAt: {}, error: null, isLoading: false });
  },

  forTenant: (tenantId: string): MembershipRecord[] => {
    return get().byTenant[tenantId] ?? EMPTY;
  },
}));

/** Selector compatible React. À utiliser dans un composant :
 *
 *    const members = useMembershipsStore((s) => s.forTenant('demo'));
 */
export const selectMembersFor =
  (tenantId: string) =>
  (s: MembershipsStore): MembershipRecord[] =>
    s.byTenant[tenantId] ?? EMPTY;
