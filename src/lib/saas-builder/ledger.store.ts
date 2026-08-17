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
import { createScopedStorage } from '../auth/storage-scope';
import { registerPersistedStore } from '../auth/auth-scope-bridge';
import { defensiveMerge, defensiveMigrate } from '../../stores/migrationDefensive';

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

/** Valide une entree du ledger. Les champs numeriques ou enum
 *  invalides sont ecartes ; un champ optionnel (requestId) absent
 *  reste absent. Le ledger est append-only : on n'invalide pas
 *  l'historique. Si une entree est corrompue, on la saute et on
 *  garde les autres — l'utilisateur prefere un ledger abrege a
 *  une appli qui ne demarre pas. */
function sanitizeEntry(value: unknown): LedgerEntry | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.id.length === 0) return undefined;
  if (typeof v.ts !== 'string') return undefined;
  if (typeof v.routeId !== 'string') return undefined;
  if (typeof v.promptSnippet !== 'string') return undefined;
  if (typeof v.outputPath !== 'string') return undefined;
  if (typeof v.costUsd !== 'number' || !Number.isFinite(v.costUsd)) return undefined;
  if (v.costConfidence !== 'verified' && v.costConfidence !== 'estimated') return undefined;
  if (typeof v.vendor !== 'string') return undefined;
  const out: LedgerEntry = {
    id: v.id,
    ts: v.ts,
    routeId: v.routeId,
    promptSnippet: v.promptSnippet,
    outputPath: v.outputPath,
    costUsd: v.costUsd,
    costConfidence: v.costConfidence,
    vendor: v.vendor,
  };
  if (typeof v.requestId === 'string') out.requestId = v.requestId;
  return out;
}

/** Valide le tableau d'entrees. Toute entree corrompue est sautee ;
 *  les autres survivent. */
function sanitizeEntries(value: unknown): LedgerEntry[] {
  if (!Array.isArray(value)) return [];
  const out: LedgerEntry[] = [];
  for (const v of value) {
    const entry = sanitizeEntry(v);
    if (entry) out.push(entry);
  }
  return out;
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
      name: 'saas-ledger-v1',
      storage: createJSONStorage(() => createScopedStorage()),
      partialize: (s) => ({ entries: s.entries }),
      // FIX-8 (2026-08-17) — version + migrate. Cf. migrationDefensive.ts.
      version: 1,
      migrate: defensiveMigrate<LedgerState>(1),
      merge: defensiveMerge<LedgerState>({
        validators: { entries: sanitizeEntries },
      }),
    },
  ),
);

registerPersistedStore({
  name: 'useLedgerStore',
  persist: useLedgerStore.persist,
});

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
