// src/lib/saas-builder/ledger.store.ts
// Ledger append-only du SaaS builder. SPEC §2.4.
//
// FORME : inspiree de bench-studio-public-main/src/Ledger.jsx:11-49.
// On garde la distinction 'verified' / 'estimated' parce que c'est le
// standard du repo public (cf. Ledger.jsx:49 commentaire).
//
// APPEND-ONLY STRICT :
//   - append() est le seul mutateur. Pas de setEntries, pas de
//     deleteEntry.
//   - totalUsd() et summary() sont des GETTERS qui recalculent a
//     chaque appel (cf. generate.py:99 dans le kit). Pas d'agregation
//     incrementale qui se tromperait sur les suppressions manuelles.
//
// PERSISTANCE : localStorage sous 'coach-os-saas-ledger-v1', cle
// distincte de 'coach-os-three-apps-v1' (cf. SPEC §3).

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CostConfidence = 'verified' | 'estimated';

export interface LedgerEntry {
  /** UUID v4, genere par append(). */
  id: string;
  /** ISO 8601. */
  ts: string;
  /** Identifiant de la route fal (ex. 'fal-ai/veo3.1/fast'). */
  routeId: string;
  /** Premier 60 chars du prompt (cf. generate.py:85). */
  promptSnippet: string;
  /** Chemin du fichier produit par l'engine. */
  outputPath: string;
  /** Cout en USD, granularite 0.001. */
  costUsd: number;
  /** 'verified' si le provider a retourne le cout final, 'estimated' sinon. */
  costConfidence: CostConfidence;
  /** ID de l'appel provider (optionnel, pour audit). */
  requestId?: string;
  /** Vendor ('fal', 'google', 'openai', 'minimax', 'kling', 'qwen-cloud'). */
  vendor: string;
}

export interface LedgerSummary {
  /** Nombre total de generations. */
  totalGenerations: number;
  /** Somme cumulee en USD. */
  allTimeUsd: number;
  /** Moyenne par generation en USD (0 si aucune). */
  averageUsd: number;
  /** Compteur par confidence. */
  verifiedCount: number;
  estimatedCount: number;
}

interface LedgerState {
  entries: LedgerEntry[];
  /** Append une entree. Retourne l'entiere ajoutee (avec id/ts). */
  append: (entry: Omit<LedgerEntry, 'id' | 'ts'>) => LedgerEntry;
  /** Reset explicite. Jamais automatique. */
  reset: () => void;
}

/** Genere un UUID v4 simple. Pas de dep crypto pour rester portable. */
function uuid(): string {
  // Format : xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (RFC 4122 v4 simplifie).
  const hex = (): string =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  const part = (): string => hex();
  return `${part()}${part()}-${part()}-4${part().slice(1)}-${part()}-${part()}${part()}${part()}`;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      entries: [],
      append: (input) => {
        const entry: LedgerEntry = {
          ...input,
          id: uuid(),
          ts: new Date().toISOString(),
        };
        // Append-only strict : on ne mute pas, on recree.
        set({ entries: [...get().entries, entry] });
        return entry;
      },
      reset: () => set({ entries: [] }),
    }),
    {
      name: 'coach-os-saas-ledger-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

/** GETTERS derives — recalcules a chaque appel. SPEC §2.4 / §6.5. */
export function totalUsd(): number {
  return useLedgerStore
    .getState()
    .entries.reduce((sum, e) => sum + e.costUsd, 0);
}

export function summary(): LedgerSummary {
  const entries = useLedgerStore.getState().entries;
  if (entries.length === 0) {
    return {
      totalGenerations: 0,
      allTimeUsd: 0,
      averageUsd: 0,
      verifiedCount: 0,
      estimatedCount: 0,
    };
  }
  const allTimeUsd = entries.reduce((s, e) => s + e.costUsd, 0);
  return {
    totalGenerations: entries.length,
    allTimeUsd,
    averageUsd: allTimeUsd / entries.length,
    verifiedCount: entries.filter((e) => e.costConfidence === 'verified').length,
    estimatedCount: entries.filter((e) => e.costConfidence === 'estimated').length,
  };
}
