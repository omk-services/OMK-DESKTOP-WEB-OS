---
id: AUDIT_LOG
campagne: 2026-08-15
phase: 4 — qui a touché quoi, et quand
préconditions: |
  AUTH_FIX doit être vert (sinon actorId = null, l'événement est vide).
  MEMBERSHIPS doit être vert (sinon les événements d'invitation
  n'ont pas de contexte membership).
perimetre_exclusif: |
  src/lib/audit/event.ts                  (nouveau — type EventRecord)
  src/lib/audit/logger.ts                (nouveau — appendEvent)
  src/lib/audit/logger.test.ts           (nouveau)
  src/lib/audit/queries.ts               (nouveau — lister par tenant/user/action)
  src/lib/audit/queries.test.ts          (nouveau)
  src/lib/tooling/serverStore.ts         (étendu — appelle logger sur chaque write)
  src/lib/tooling/adapters/mcp.ts        (étendu — log appel outil)
  src/lib/tooling/adapters/rest.ts       (étendu — log appel outil)
  src/lib/tooling/adapters/cli.ts        (étendu — log appel outil)
  src/lib/auth/memberships.ts            (étendu — log invite/accept/revoke/role change)
  src/components/audit/AuditLogViewer.tsx (nouveau — UI lecture)
  src/apps/audit/index.tsx               (étendu — vue serveur)
  supabase/migrations/2026-08-15_audit_events.sql   (nouveau — schema SQL)
interdit: |
  src/lib/cms/**
  src/apps/_ui/**
  src/components/auth/**
artifact_obligatoire: |
  _briefs/2026-08-15_AUDIT_LOG/RAPPORT_AUDIT_LOG.md
  supabase/migrations/2026-08-15_audit_events.sql
---

# BRIEF_AUDIT_LOG — qui a touché quoi, et quand

## La phrase qui commande ce brief

> **Tant qu'il n'y a pas d'audit log, le diagnostic d'incident est de la
> mémoire humaine. Et la mémoire humaine ment — pas par malhonnêteté,
> par oubli. Le client qui demande « qui a fait ça » mérite mieux.**

## Architecture

### Table Supabase `audit_events`

```sql
-- supabase/migrations/2026-08-15_audit_events.sql
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  actor_id text,                            -- peut être null si l'événement est système (ex: quota dépassé par un script)
  actor_role text,                           -- snapshot du rôle au moment de l'action
  action text not null,                      -- 'item.create' | 'item.update' | 'item.delete' | 'proposal.create' | 'proposal.approve' | 'proposal.reject' | 'auth.signin' | 'auth.signup' | 'auth.signout' | 'member.invite' | 'member.accept' | 'member.revoke' | 'member.role_change' | 'workspace.branch_create' | 'workspace.merge' | 'quota.exceeded'
  target_type text,                          -- 'item' | 'proposal' | 'collection' | 'membership' | 'workspace'
  target_id text,                            -- id de la cible si applicable
  metadata jsonb not null default '{}',      -- diff partiel, paramètres non-sensibles
  ip_address inet,                           -- null en local
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

-- Lecture : uniquement les owners du tenant.
create policy "owner_read_audit" on public.audit_events
  for select using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = audit_events.tenant_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
        and m.status = 'active'
    )
  );

-- Écriture : seul le service_role peut insérer (via Edge Function ou backend).
create policy "service_insert_audit" on public.audit_events
  for insert with check (auth.role() = 'service_role');

-- Pas de update ni delete — l'audit est immuable.

create index audit_events_tenant_id_created_at_idx on public.audit_events (tenant_id, created_at desc);
create index audit_events_actor_id_idx on public.audit_events (actor_id);
create index audit_events_action_idx on public.audit_events (action);
```

### Type `EventRecord`

```ts
// src/lib/audit/event.ts
export type AuditAction =
  | 'item.create' | 'item.update' | 'item.delete'
  | 'proposal.create' | 'proposal.approve' | 'proposal.reject'
  | 'auth.signin' | 'auth.signup' | 'auth.signout'
  | 'member.invite' | 'member.accept' | 'member.revoke' | 'member.role_change'
  | 'workspace.branch_create' | 'workspace.merge' | 'workspace.pr_open' | 'workspace.pr_review' | 'workspace.pr_merge'
  | 'quota.exceeded'
  | 'observer.event';                              // <-- NOUVEAU 2026-08-15

export interface EventRecord {
  tenantId: string;
  actorId: string | null;
  actorRole: string | null;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  // NOUVEAU 2026-08-15 — pour les events issus d'un Observer
  observerSource?: 'opik' | 'agentpulse' | 'agents-observe' | 'agent-super-spy' | 'langsmith' | 'phoenix' | 'pocketbase-vec' | 'sssf' | 'aios' | 'posthog' | 'external';
}
```

### Logger `src/lib/audit/logger.ts`

```ts
// Pseudo-code.
import { supabase, supabaseConfigured } from '../supabase';

export async function appendEvent(rec: EventRecord): Promise<void> {
  if (!supabaseConfigured) {
    // Mode démo : append en mémoire, exportable pour debug.
    appendToInMemoryLog(rec);
    return;
  }
  // INSERT INTO audit_events ...
  // Si l'INSERT échoue (réseau, RLS, table absente), on LOG dans
  // console.warn — pas de throw. Un audit qui casse l'app est pire
  // qu'un audit qui perd un événement.
}
```

**Règle non négociable** : `appendEvent()` **ne lève jamais**. Un
échec d'écriture de l'audit ne doit pas casser l'opération métier.
Il doit être visible (toast, log), pas bloquant.

### Wire-up — qui appelle `appendEvent`

| événement | où |
|---|---|
| `item.create`/`update`/`delete` | `serverStore.ts:__upsertItemForTest` + helpers internes |
| `proposal.create`/`approve`/`reject` | `serverStore.ts:deposeProposal/listProposals` + `catalog/scenario.ts` |
| `auth.signin`/`signup`/`signout` | `AuthPage.tsx:handleSubmit` + `TopBar.tsx` (signOut) |
| `member.invite`/`accept`/`revoke`/`role_change` | `lib/auth/memberships.ts` (chaque fonction) |
| `workspace.branch_create`/`merge`/`pr_*` | `lib/workspace/branches.ts` (cf. WORKSPACE_BRANCHES) |
| `quota.exceeded` | `lib/tooling/quota.ts` (chaque refus) |

### UI `AuditLogViewer.tsx`

Une vue accessible depuis l'app Audit déjà existante
(`src/apps/audit/index.tsx`) :

- Liste paginée par 50, défilement infini.
- Filtres : `actor`, `action`, `target_type`, fenêtre temporelle.
- Chaque ligne : `[2026-08-15 09:24] amdkn777 → item.create sur item_xyz`.

**Lecture seule**, conformément à la policy RLS.

## Tests obligatoires (10)

| # | nom | vérifie |
|---|---|---|
| 1 | `appendEvent_inscrit_si_supabase_configure` | INSERT appelé avec les bons champs |
| 2 | `appendEvent_echec_ne_leve_pas` | si INSERT fail, pas de throw |
| 3 | `appendEvent_mode_demo_memoire` | sans config, append dans le buffer in-memory |
| 4 | `item_create_genere_event` | test d'intégration `serverStore.test.ts` |
| 5 | `proposal_create_genere_event` | idem |
| 6 | `quota_exceeded_genere_event` | test `quota.test.ts` |
| 7 | `member_invite_genere_event` | test `memberships.test.ts` |
| 8 | `lister_audit_par_tenant_filtre_owner` | RLS enforced en test |
| 9 | `lister_audit_par_action` | filtre `action` |
| 10 | `immuable_pas_de_update_pas_de_delete` | RLS refuse |

## Garde-fous de fin

- `npx tsc --noEmit` → exit 0
- `npx vitest run` → baseline 209/211 + 10 tests AUDIT_LOG verts
- Migration SQL testable localement
- Rapport `_briefs/2026-08-15_AUDIT_LOG/RAPPORT_AUDIT_LOG.md` avec le
  tableau des 10 tests.

## Lien avec les autres briefs

- **AUTH_FIX** : prérequis (`actorId` non null).
- **MEMBERSHIPS** : prérequis (les événements d'invitation portent
  un actorId valide).
- **W13_QUOTAS** : `quota.exceeded` est l'événement qui te dit
  *qui* a saturé *combien de fois*.
- **WORKSPACE_BRANCHES** : `workspace.branch_create`/`merge`/etc. sont
  les événements qui rendent l'arbre Git traçable.

## Source Observers — ingestion d'événements externes (NOUVEAU 2026-08-15)

Le REGISTRY des Observers (`ASpace_OS_V3/00_Amadeus/10_Observers/REGISTRY.json`,
genere_le 2026-08-06) liste 11 outils : opik, agentpulse, AIOS,
agents-observe, agent-super-spy, langsmith, opik (doublon), phoenix,
pocketbase-vec, super-simple-software-factory, agent-os. **PostHog
n'est PAS dans la liste** (vérifié 2026-08-15) ; si tu veux PostHog
dans la chaîne, il faut l'ajouter au REGISTRY d'abord.

L'idée : coach-os **absorbe** les événements Observers comme une
seconde source, en plus des événements internes. La table `audit_events`
les reçoit, avec `actor_id = NULL` et `observer_source = '<id>'`.

### Wire-up par observer (à coder)

| observer | source d'événements | protocole |
|---|---|---|
| `opik` | traces d'agents (LLM calls, tool calls) | webhook HTTP POST → ingestion endpoint |
| `agentpulse` | health/heartbeat des agents déployés | webhook ou polling GET |
| `agents-observe` | sessions complètes d'agents | export JSON → S3 + import |
| `agent-super-spy` | screenshots + actions UI | polling ou push |
| `langsmith` | traces LLM (similaire à opik) | webhook |
| `phoenix` | traces d'agents (Arize Phoenix) | webhook |
| `pocketbase-vec` | base vectorielle locale | export périodique |
| `sssf` (super-simple-software-factory) | events des ADWs | webhook |
| `aios` | events AIOS | webhook |

Pour l'ingestion, créer `src/lib/audit/ingest.ts` :

```ts
// Pseudo-code. Chaque observer a son endpoint, mais tous tapent
// appendEvent() avec `observerSource` rempli. Le `actor_id` est null
// (l'event vient de l'exterieur, pas d'un humain).
export async function ingestFromObserver(
  source: EventRecord['observerSource'],
  raw: Record<string, unknown>
): Promise<void> {
  await appendEvent({
    tenantId: extractTenantId(raw),
    actorId: null,
    actorRole: null,
    action: 'observer.event',
    targetType: extractTargetType(raw),
    targetId: extractTargetId(raw),
    metadata: { ...raw, _source: source, _received_at: new Date().toISOString() },
    observerSource: source,
  });
}
```

### Pourquoi c'est important

Aujourd'hui, si opik ou agentpulse observent que ton agent boucle,
tu ne le sais **que** parce que tu vas regarder ces outils
manuellement. Demain, `observer.event` apparaît dans ton audit log
coach-os, et tu vois **dans la même timeline** que le `quota.exceeded`
aussi déclenché par le même agent. Tu obtiens la corrélation sans
ouvrir 4 dashboards.

### Tests supplémentaires (3)

| # | nom | vérifie |
|---|---|---|
| 11 | `ingestFromObserver_null_actorId` | `actor_id = NULL` dans la table |
| 12 | `ingestFromObserver_metadata_brute` | `metadata` contient le payload brut + `_source` |
| 13 | `ingestFromObserver_echec_ne_leve_pas` | pas de throw sur INSERT fail (cf. règle 5) |

## Macro — dépendance aval

Quand Macro sera implémentée (squelette posé 2026-08-15 dans
`src/apps/Macro/`), elle consommera `appendEvent()` pour les événements
`observer.event` qu'elle produit localement. C'est la même primitive,
le même code, le même audit log.
