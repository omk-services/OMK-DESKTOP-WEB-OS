// src/lib/tooling/serverStore.ts
// Côté serveur : un store en lecture seule, plus un sink pour les
// propositions. La serverStore rend les outils indépendants du client
// (qui vit dans le navigateur) — c'est ce qui permet à un exécutable
// MCP ou à une route REST de tourner sans navigateur ouvert.
//
// Lecture : un sous-ensemble représentatif des collections. Pas le seed
// complet (le seed vit dans le navigateur, pas sur Vercel). Suffisant
// pour prouver les cinq surfaces, et c'est explicite : la V2 lit
// Supabase par tenant, et ce fichier est l'endroit qui changera.
//
// Écriture : les outils 'ecriture' du catalogue appellent `depose`
// ici, qui écrit une proposition dans un fichier du workspace. Aucune
// mutation du dataset. C'est ce qui rend le contrat « ecriture =
// proposition déposée » testable sans navigateur ni agent.

import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Miroir local des types CMS. On ne dépend pas de `../cms/types.ts`
 *  parce que ce module est compilé indépendamment (cf. tsconfig.tooling).
 *  Si la V2 aligne les types en un seul endroit, ce bloc disparaît. */
export interface CmsField {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'badge' | 'date' | 'currency' | 'number';
}

export interface CmsItem {
  id: string;
  [key: string]: unknown;
}

export interface CmsCollectionDef {
  id: string;
  name: string;
  singular: string;
  accent: string;
  titleField: string;
  subtitleField?: string;
  badgeField?: string;
  fields: CmsField[];
}

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

// ── Dataset de démonstration ─────────────────────────────────────────
//
// Un sous-ensemble réduit des collections que Coach OS expose. La forme
// est conforme au seed — la V1 du serveur n'a pas besoin de plus pour
// prouver l'aller-retour REST/MCP/CLI. La V2 lira Supabase par tenant.

const TASKS = def({
  id: 'tasks',
  name: 'Tasks',
  singular: 'Task',
  accent: '#7c3aed',
  titleField: 'label',
  subtitleField: 'due',
  badgeField: 'status',
  fields: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'due', label: 'Due', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const TASKS_ITEMS: CmsItem[] = [
  { id: 'task-1', label: 'Relecture contrat Acme', due: '2026-08-15', status: 'open' },
  { id: 'task-2', label: 'Onboarding Ava Chen', due: '2026-08-12', status: 'in_progress' },
  { id: 'task-3', label: 'Brief vidéo Q3', due: '2026-08-20', status: 'open' },
];

const CLIENTS = def({
  id: 'clients',
  name: 'Clients',
  singular: 'Client',
  accent: '#2563eb',
  titleField: 'name',
  subtitleField: 'segment',
  badgeField: 'status',
  fields: [
    { key: 'segment', label: 'Segment', type: 'text' },
    { key: 'ticket', label: 'Ticket', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const CLIENTS_ITEMS: CmsItem[] = [
  { id: 'ava-chen', name: 'Ava Chen', segment: 'Citadelle', ticket: 1800, status: 'Active' },
  { id: 'marcus-reyes', name: 'Marcus Reyes', segment: 'Programme 12w', ticket: 2500, status: 'Active' },
];

const DOCUMENTS = def({
  id: 'documents',
  name: 'Documents',
  singular: 'Document',
  accent: '#0ea5e9',
  titleField: 'title',
  subtitleField: 'kind',
  fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'kind', label: 'Kind', type: 'text' },
  ],
});

const DOCUMENTS_ITEMS: CmsItem[] = [
  { id: 'doc-1', title: 'SOP Onboarding 12 semaines', kind: 'SOP' },
  { id: 'doc-2', title: 'Brief pré-séance diagnostic', kind: 'Brief' },
];

const COLLECTIONS: CmsCollectionDef[] = [TASKS, CLIENTS, DOCUMENTS];
const ITEMS_BY_COLLECTION: Record<string, CmsItem[]> = {
  tasks: TASKS_ITEMS,
  clients: CLIENTS_ITEMS,
  documents: DOCUMENTS_ITEMS,
};

interface ServerState {
  collections: Record<string, CmsCollectionDef>;
  items: Record<string, CmsItem[]>;
}

let _state: ServerState | null = null;

function load(): ServerState {
  if (_state) return _state;
  const collections: Record<string, CmsCollectionDef> = {};
  const items: Record<string, CmsItem[]> = {};
  for (const d of COLLECTIONS) {
    collections[d.id] = d;
    items[d.id] = ITEMS_BY_COLLECTION[d.id] ?? [];
  }
  _state = { collections, items };
  return _state;
}

export function listCollections(): CmsCollectionDef[] {
  return Object.values(load().collections).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCollection(id: string): CmsCollectionDef | undefined {
  return load().collections[id];
}

export function listItems(collectionId: string): CmsItem[] {
  const state = load();
  if (!state.collections[collectionId]) return [];
  return state.items[collectionId] ?? [];
}

export interface SearchHit {
  collectionId: string;
  itemId: string;
  title: string;
  snippet: string;
  score: number;
}

/** Recherche textuelle simple : match substring case-insensitive sur
 *  la valeur stringifiée de chaque champ. Pas de ranking évolué — la
 *  V1 d'un outil catalog ne fait pas ElasticSearch. */
export function searchItems(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const state = load();
  const hits: SearchHit[] = [];
  for (const [collectionId, items] of Object.entries(state.items)) {
    const def = state.collections[collectionId];
    if (!def) continue;
    for (const item of items) {
      let first = '';
      let score = 0;
      for (const [k, v] of Object.entries(item)) {
        if (k === 'id') continue;
        const s = String(v ?? '');
        const idx = s.toLowerCase().indexOf(q);
        if (idx >= 0) {
          score += s.length - idx;
          if (!first) {
            const start = Math.max(0, idx - 20);
            const end = Math.min(s.length, idx + q.length + 40);
            first = (start > 0 ? '…' : '') + s.slice(start, end) + (end < s.length ? '…' : '');
          }
        }
      }
      if (score > 0) {
        const title = String(item[def.titleField] ?? item.id);
        hits.push({ collectionId, itemId: String(item.id), title, snippet: first, score });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

// ── Proposal sink ──────────────────────────────────────────────────
//
// Chaque proposition est un fichier JSON dans `_briefs/.../proposals/`
// Le chemin est choisi pour qu'il survive aux commits et qu'un humain
// puisse grep les « pas encore approuvées ». Le nom du fichier est
// daté pour qu'un `ls` donne le temps relatif.

const PROPOSAL_DIR = path.resolve(
  process.env.COACH_OS_PROPOSAL_DIR ??
    path.join(process.cwd(), '_briefs', '2026-08-11_production', 'proposals'),
);

export interface ProposalRecord {
  id: string;
  scenarioId: string;
  toolName: string;
  args: Record<string, unknown>;
  displayName: string;
  rationale?: string;
  actorId: string;
  createdAt: string;
}

export async function deposeProposal(input: {
  scenarioId: string;
  toolName: string;
  args: Record<string, unknown>;
  displayName: string;
  rationale?: string;
  actorId: string;
}): Promise<ProposalRecord> {
  await mkdir(PROPOSAL_DIR, { recursive: true });
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const record: ProposalRecord = {
    id,
    scenarioId: input.scenarioId,
    toolName: input.toolName,
    args: input.args,
    displayName: input.displayName,
    rationale: input.rationale,
    actorId: input.actorId,
    createdAt: new Date().toISOString(),
  };
  const file = path.join(PROPOSAL_DIR, `${id}.json`);
  await writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function listProposals(): Promise<ProposalRecord[]> {
  if (!existsSync(PROPOSAL_DIR)) return [];
  const files = (await readdir(PROPOSAL_DIR)).filter((f) => f.endsWith('.json'));
  const out: ProposalRecord[] = [];
  for (const f of files) {
    try {
      const txt = await readFile(path.join(PROPOSAL_DIR, f), 'utf8');
      out.push(JSON.parse(txt) as ProposalRecord);
    } catch {
      // Skip malformed — pas de crash sur un fichier corrompu.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProposal(id: string): Promise<ProposalRecord | null> {
  if (!existsSync(PROPOSAL_DIR)) return null;
  const file = path.join(PROPOSAL_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  try {
    const txt = await readFile(file, 'utf8');
    return JSON.parse(txt) as ProposalRecord;
  } catch {
    return null;
  }
}
