// src/stores/branches.store.ts
// Zustand store — surface UI pour les branches WorkSpaces.
//
// Conserve la liste des branches pour le tenant actif + la branche
// courante (sur laquelle l'utilisateur travaille). Le code du domaine
// (lib/workspace/*) est la source de vérité ; ce store n'est qu'un
// miroir pour l'UI.
//
// Le selector rule : chaque selector expose un scalaire ou une ref
// stable (cf. memory note « piège de l'instantané »). On évite de
// rendre des tableaux frais à chaque appel.

import { create } from 'zustand';
import type { Branch, Pr } from '../lib/workspace/types';

interface BranchesState {
  branches: Branch[];
  activeBranchId: string | null;
  prs: Pr[];
  loading: boolean;
  error: string | null;
}

interface BranchesActions {
  setBranches(branches: Branch[]): void;
  setActiveBranch(branchId: string | null): void;
  setPrs(prs: Pr[]): void;
  addBranch(b: Branch): void;
  removeBranch(branchId: string): void;
  upsertPr(p: Pr): void;
  reset(): void;
}

const initial: BranchesState = {
  branches: [],
  activeBranchId: null,
  prs: [],
  loading: false,
  error: null,
};

export const useBranchesStore = create<BranchesState & BranchesActions>(
  (set) => ({
    ...initial,

    setBranches: (branches) => set({ branches }),

    setActiveBranch: (branchId) => set({ activeBranchId: branchId }),

    setPrs: (prs) => set({ prs }),

    addBranch: (b) =>
      set((s) => ({
        branches: s.branches.some((x) => x.id === b.id)
          ? s.branches
          : [...s.branches, b],
      })),

    removeBranch: (branchId) =>
      set((s) => ({
        branches: s.branches.filter((b) => b.id !== branchId),
        activeBranchId: s.activeBranchId === branchId ? null : s.activeBranchId,
      })),

    upsertPr: (p) =>
      set((s) => ({
        prs: s.prs.some((x) => x.id === p.id)
          ? s.prs.map((x) => (x.id === p.id ? p : x))
          : [...s.prs, p],
      })),

    reset: () => set({ ...initial }),
  }),
);