// src/lib/tooling/serverStore.ts
// Côté serveur : un store en lecture seule, plus un sink pour les
// propositions. La serverStore rend les outils indépendants du client
// (qui vit dans le navigateur) — c'est ce qui permet à un exécutable
// MCP ou à une route REST de tourner sans navigateur ouvert.
//
// CLOISON PAR TENANT (campagne 2026-08-14, étape 1)
// Chaque fonction publique prend un `tenantId` OBLIGATOIRE. Un défaut
// silencieux est interdit : appeler sans tenant lève. La raison est
// dans RAPPORT_SECURITY_ARCHITECTURE_V1 §1 (cloison avant tout le
// reste) et Melbourne (août 2026) : l'API qui ne vérifie pas *qui*
// annule finit par annuler les réservations des autres.
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
import { appendEvent } from '../audit/logger';
import { consumeQuotaOrThrow, __resetQuotaRegistryForTest as __resetQuotaRegistry } from './quota';

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

/** Tenant qui porte le seed de démonstration. La V2 lira Supabase par
 *  tenant ; en attendant, les autres tenants ont une ardoise vierge. */
export const SEED_TENANT = 'demo';

/** Format strict du tenantId : kebab/snake, 1-64 caractères, [a-z0-9_-].
 *  Refuser tout le reste évite qu'un attaquant forge `__proto__` ou un
 *  nom qui traverse les couches d'isolation (path traversal, etc.). */
const TENANT_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export class TenantIdRequiredError extends Error {
  readonly code = 'TENANT_ID_REQUIRED';
  constructor(detail: string) {
    super(`tenantId obligatoire : ${detail}`);
    this.name = 'TenantIdRequiredError';
  }
}

/** Vérifie qu'un tenantId est utilisable. Toute fonction publique du
 *  store appelle ce helper en première ligne. Un tenantId invalide ou
 *  absent lève — pas de repli silencieux. */
export function assertTenantId(tenantId: unknown): asserts tenantId is string {
  if (typeof tenantId !== 'string') {
    throw new TenantIdRequiredError(`reçu ${tenantId === null ? 'null' : typeof tenantId}, attendu string.`);
  }
  const trimmed = tenantId.trim();
  if (trimmed.length === 0) {
    throw new TenantIdRequiredError('chaîne vide.');
  }
  if (!TENANT_KEY_RE.test(trimmed)) {
    throw new TenantIdRequiredError(
      `"${trimmed}" ne matche pas ^[a-z0-9][a-z0-9_-]{0,63}$.`,
    );
  }
}

interface ServerState {
  /** Définitions de collections, partagées entre tenants (la forme d'un
   *  « tasks » ne dépend pas du locataire). */
  collections: Record<string, CmsCollectionDef>;
  /** Items partitionnés par tenant puis par collection. Tenant absent =
   *  ardoise vierge (un tenant jamais vu n'a aucun item). */
  itemsByTenant: Record<string, Record<string, CmsItem[]>>;
}

let _state: ServerState | null = null;

function load(): ServerState {
  if (_state) return _state;
  const collections: Record<string, CmsCollectionDef> = {};
  for (const d of COLLECTIONS) {
    collections[d.id] = d;
  }
  const itemsByTenant: Record<string, Record<string, CmsItem[]>> = {};
  // Seed : seul le tenant `demo` porte le dataset de démo.
  itemsByTenant[SEED_TENANT] = {};
  for (const d of COLLECTIONS) {
    itemsByTenant[SEED_TENANT][d.id] = [...(ITEMS_BY_COLLECTION[d.id] ?? [])];
  }
  _state = { collections, itemsByTenant };
  return _state;
}

/** Réinitialise le singleton interne. **Réservé aux tests** — appeler
 *  en production ramènerait l'état à sa seed d'origine et effacerait
 *  tous les ajouts en mémoire. Le préfixe `__` marque l'usage interne.
 *
 *  Réinitialise aussi le `QuotaRegistry` (cf. W13, 2026-08-15).
 *  Sinon un test rejouant 100 écritures s'arrête à la 61ᵉ sur un
 *  faux positif — la fenêtre du compteur précédent ferait refuser
 *  les écritures légitimes du test suivant. */
export function __resetServerStoreForTest(): void {
  _state = null;
  __resetQuotaRegistry();
}

/** Remplace la liste d'items d'une collection pour un tenant. **Réservé
 *  aux tests** — c'est ce qui permet à un test d'écrire un item sous
 *  le tenant A puis de vérifier que le tenant B ne le voit pas. */
export function __seedItemsForTest(
  tenantId: string,
  collectionId: string,
  items: CmsItem[],
): void {
  assertTenantId(tenantId);
  const state = load();
  if (!state.collections[collectionId]) {
    throw new Error(`Collection inconnue : "${collectionId}".`);
  }
  if (!state.itemsByTenant[tenantId]) {
    state.itemsByTenant[tenantId] = {};
  }
  state.itemsByTenant[tenantId][collectionId] = items.map((it) => ({ ...it }));
}

/** Écrit un item dans la collection d'un tenant. **Réservé aux tests**
 *  en V1 — en V2, ce sera Supabase. La signature est déjà conforme à
 *  la cloison : tenantId est obligatoire. Le quota `write` est
 *  comptabilisé **ici** (W13, 2026-08-15) — toute nouvelle écriture
 *  future doit suivre le même schéma. */
export function __upsertItemForTest(
  tenantId: string,
  collectionId: string,
  item: CmsItem,
): void {
  assertTenantId(tenantId);
  consumeQuotaOrThrow(tenantId, 'write');
  const state = load();
  if (!state.collections[collectionId]) {
    throw new Error(`Collection inconnue : "${collectionId}".`);
  }
  if (!state.itemsByTenant[tenantId]) {
    state.itemsByTenant[tenantId] = {};
  }
  if (!state.itemsByTenant[tenantId][collectionId]) {
    state.itemsByTenant[tenantId][collectionId] = [];
  }
  const bucket = state.itemsByTenant[tenantId][collectionId];
  const idx = bucket.findIndex((it) => String(it.id) === String(item.id));
  const isUpdate = idx >= 0;
  if (isUpdate) bucket[idx] = { ...item };
  else bucket.push({ ...item });

  // Audit log (NOUVEAU 2026-08-15). appendEvent ne lève JAMAIS par
  // construction ; double filet avec catch synchrone au cas où.
  try {
    void appendEvent({
      tenantId,
      actorId: '__test__',
      actorRole: 'owner',
      action: isUpdate ? 'item.update' : 'item.create',
      targetType: 'item',
      targetId: String(item.id),
      metadata: {
        collectionId,
        label: typeof item.label === 'string' ? item.label : null,
      },
    });
  } catch {
    /* no-throw contract — filet supplémentaire */
  }
}

/** Liste les collections visibles d'un tenant. Les définitions sont
 *  partagées ; le tenantId reste obligatoire pour que le contrat soit
 *  homogène avec les autres lectures et qu'aucun chemin n'oublie de
 *  cloisonner. */
export function listCollections(tenantId: string): CmsCollectionDef[] {
  assertTenantId(tenantId);
  return Object.values(load().collections).sort((a, b) => a.name.localeCompare(b.name));
}

/** Lit la définition d'une collection pour un tenant. */
export function getCollection(tenantId: string, id: string): CmsCollectionDef | undefined {
  assertTenantId(tenantId);
  return load().collections[id];
}

/** Liste les items d'une collection, **cloisonnés par tenant**. Un
 *  item écrit sous le tenant A est invisible depuis le tenant B — c'est
 *  le contrat qui ferme W07. */
export function listItems(tenantId: string, collectionId: string): CmsItem[] {
  assertTenantId(tenantId);
  const state = load();
  if (!state.collections[collectionId]) return [];
  return (state.itemsByTenant[tenantId]?.[collectionId] ?? []).map((it) => ({ ...it }));
}

export interface SearchHit {
  collectionId: string;
  itemId: string;
  title: string;
  snippet: string;
  score: number;
}

/** Recherche textuelle, cloisonnée par tenant. La requête traverse
 *  uniquement les items du tenant demandé. */
export function searchItems(tenantId: string, query: string, limit = 20): SearchHit[] {
  assertTenantId(tenantId);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const state = load();
  const tenantItems = state.itemsByTenant[tenantId] ?? {};
  const hits: SearchHit[] = [];
  for (const [collectionId, items] of Object.entries(tenantItems)) {
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

const PROPOSAL_DIR_DEFAULT = path.join(process.cwd(), '_briefs', '2026-08-11_production', 'proposals');

/** Résout le répertoire de propositions à chaque appel. Un module qui
 *  capturerait la valeur à l'import ne verrait jamais un `COACH_OS_PROPOSAL_DIR`
 *  posé par un test après import — c'est l'erreur que cette fonction
 *  évite. La résolution est faite en synchrone (pas d'I/O). */
function proposalDir(): string {
  const raw = process.env.COACH_OS_PROPOSAL_DIR ?? PROPOSAL_DIR_DEFAULT;
  return path.resolve(raw);
}

export interface ProposalRecord {
  id: string;
  scenarioId: string;
  /** Tenant qui possède la proposition. Écrit à la racine pour que
   *  listProposals puisse filtrer sans relire les args. */
  tenantId: string;
  toolName: string;
  args: Record<string, unknown>;
  displayName: string;
  rationale?: string;
  actorId: string;
  createdAt: string;
}

export interface DeposeProposalInput {
  scenarioId: string;
  toolName: string;
  args: Record<string, unknown>;
  displayName: string;
  rationale?: string;
  actorId: string;
}

/** Dépose une proposition dans la file du tenant. Le tenantId est
 *  OBLIGATOIRE : pas de proposition orpheline qui flotte entre deux
 *  files. C'est la moitié du correctif W08 (l'autre moitié est l'étape
 *  2, identité non forgeable). */
export async function deposeProposal(
  tenantId: string,
  input: DeposeProposalInput,
): Promise<ProposalRecord> {
  assertTenantId(tenantId);
  // Rate-limit par tenant (W13, 2026-08-15). Lève QuotaExceededError
  // si le tenant dépasse `proposals_per_minute`. La fenêtre est
  // glissante ; au-dessus du seuil, retry_after_sec indique quand
  // retenter.
  consumeQuotaOrThrow(tenantId, 'proposal');
  const dir = proposalDir();
  await mkdir(dir, { recursive: true });
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const record: ProposalRecord = {
    id,
    scenarioId: input.scenarioId,
    tenantId,
    toolName: input.toolName,
    args: input.args,
    displayName: input.displayName,
    rationale: input.rationale,
    actorId: input.actorId,
    createdAt: new Date().toISOString(),
  };
  const file = path.join(dir, `${id}.json`);
  await writeFile(file, JSON.stringify(record, null, 2), 'utf8');

  // Audit log (NOUVEAU 2026-08-15). appendEvent ne lève JAMAIS.
  try {
    await appendEvent({
      tenantId,
      actorId: input.actorId,
      actorRole: null,
      action: 'proposal.create',
      targetType: 'proposal',
      targetId: id,
      metadata: {
        scenarioId: input.scenarioId,
        toolName: input.toolName,
        displayName: input.displayName,
      },
    });
  } catch {
    /* no-throw contract — filet supplémentaire */
  }

  return record;
}

/** Liste les propositions du tenant. Les autres tenants sont invisibles —
 *  c'est le filet de W10 et W11. */
export async function listProposals(tenantId: string): Promise<ProposalRecord[]> {
  assertTenantId(tenantId);
  const dir = proposalDir();
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const out: ProposalRecord[] = [];
  for (const f of files) {
    try {
      const txt = await readFile(path.join(dir, f), 'utf8');
      const rec = JSON.parse(txt) as ProposalRecord;
      if (rec.tenantId === tenantId) out.push(rec);
    } catch {
      // Skip malformed — pas de crash sur un fichier corrompu.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lit une proposition précise du tenant. Un appelant qui devine un id
 *  d'un autre tenant reçoit `null` — c'est le filet de W11. */
export async function getProposal(tenantId: string, id: string): Promise<ProposalRecord | null> {
  assertTenantId(tenantId);
  const dir = proposalDir();
  if (!existsSync(dir)) return null;
  const file = path.join(dir, `${id}.json`);
  if (!existsSync(file)) return null;
  try {
    const txt = await readFile(file, 'utf8');
    const rec = JSON.parse(txt) as ProposalRecord;
    if (rec.tenantId !== tenantId) return null;
    return rec;
  } catch {
    return null;
  }
}
