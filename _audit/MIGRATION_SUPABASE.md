# Coach OS → Supabase Migration Plan

> Status: PROPOSED — no cloud resources provisioned yet. This document is the plan;
> executing Phase 0 (creating the Supabase project) is a separate, explicit step.

## 1. Where we are today

Every app in Coach OS holds state in one of two places, both **volatile**:

| Layer | Mechanism | Persists across reload? | Multi-tenant? |
|---|---|---|---|
| Window layout (`shell.store.ts`) | Zustand + `localStorage` (`coach-os-shell-layout-v1`) | Yes, per-browser only | No — single implicit user |
| App data (`cms.store.ts` + 11 apps' local `useState`) | Zustand / React state, in-memory | **No** — resets on refresh | No |

Nothing is scoped to "which coach" or "which practice" — there is exactly one user, implicitly, and their data lives only in the current tab.

## 2. What already generalizes cleanly

The CMS engine built this session (`src/lib/cms/`) is **schema-driven**, not per-app:

```ts
CmsCollectionDef { id, name, singular, accent, titleField, subtitleField, badgeField, fields[] }
CmsItem { id, [key: string]: unknown }
```

`CollectionRepeater` and `DynamicPageView` read/write through this shape regardless of which app uses them (`clients`, `articles` today; `prospects`, `tasks`, `marketplace_installs`, `deals`, `invoices`, `ai_act_checklist` tomorrow). This is the leverage point: **one generic backend table pattern can serve every collection**, matching the Wix CMS model this was built from — content lives separate from the app code, one shared structure per collection.

## 3. Target architecture

Reuse the exact dual-write pattern already proven in the Life OS (`ASpace_OS_V2/_Life-OS-2026-clone/src/lib/idb.ts`): **IndexedDB is primary (instant paint, offline-safe), Supabase is the durable mirror, synced on every write.** Coach OS adds one thing Life OS doesn't need yet: **multi-tenancy**, because Coach OS is sold to many independent coaches, not run for one person.

```
Browser (per coach)
  IndexedDB (per-tenant cache, instant reads)
        ⇅  upsert on every write, hydrate on boot
  Supabase Postgres (source of truth, RLS-scoped by org_id)
```

### 3.1 Tenancy model

| Table | Purpose |
|---|---|
| `organizations` | One row per coaching practice ("tenant"). |
| `memberships` | `(org_id, user_id, role)` — who belongs to which org. Role: `owner` \| `member`. |
| `profiles` | 1:1 with `auth.users`, display name/avatar. |

Every business-data table carries `org_id` and is locked down by RLS to rows where the caller has a `memberships` row for that `org_id`.

### 3.2 Generic collection storage (maps 1:1 to the frontend CMS engine)

Instead of one Postgres table per collection (`clients`, `articles`, `deals`, …), use **two generic tables** — this mirrors the frontend's own genericity and means a new collection never needs a migration:

```sql
create table cms_collections (
  id            text primary key,          -- 'clients', 'articles', ...
  org_id        uuid not null references organizations(id),
  name          text not null,
  singular      text not null,
  accent        text not null,
  title_field   text not null,
  subtitle_field text,
  badge_field   text,
  fields        jsonb not null,            -- CmsField[]
  created_at    timestamptz default now()
);

create table cms_items (
  id            text not null,
  collection_id text not null,
  org_id        uuid not null references organizations(id),
  data          jsonb not null,            -- the CmsItem payload
  updated_at    timestamptz default now(),
  created_at    timestamptz default now(),
  primary key (collection_id, id)
);

create index cms_items_org_collection_idx on cms_items (org_id, collection_id);
```

RLS (sketch, both tables):

```sql
alter table cms_items enable row level security;
create policy "org members read/write their items"
  on cms_items for all
  using (org_id in (select org_id from memberships where user_id = auth.uid()))
  with check (org_id in (select org_id from memberships where user_id = auth.uid()));
```

App-specific tables that don't fit the generic collection shape (window layout, feature flags in `SettingsApp`, AI-Act checklist toggles in `LegalApp`, task list in `TasksApp`) get their **own small tables** rather than being forced into `cms_items` — the generic table is for *content collections*, not every piece of UI state. Candidates for dedicated tables:

```sql
create table shell_layouts (org_id uuid, user_id uuid, windows jsonb, updated_at timestamptz, primary key (org_id, user_id));
create table settings_flags (org_id uuid primary key, flags jsonb, updated_at timestamptz);
create table ai_act_checklist (org_id uuid primary key, checks jsonb, updated_at timestamptz);
create table tasks (id uuid primary key, org_id uuid, label text, when_text text, group_name text, done boolean, updated_at timestamptz);
```

### 3.3 Data access layer (mirrors `DomainDB` from Life OS)

Add `src/lib/supabase.ts` (client singleton) + a generic `CmsRepository` class parallel to Life OS's `DomainDB`:

```ts
class CmsRepository {
  async hydrate(collectionId: string, orgId: string): Promise<CmsItem[]> {
    // 1. read IndexedDB cache immediately (instant paint)
    // 2. fetch cms_items where org_id + collection_id, upsert into IndexedDB
    // 3. return merged/fresh result
  }
  async upsertItem(collectionId: string, orgId: string, item: CmsItem): Promise<void> {
    // 1. write IndexedDB immediately (optimistic)
    // 2. upsert to Supabase in background; on failure, queue retry (Life OS just warns+defers — fine for v1)
  }
}
```

`useCmsStore.registerCollection` becomes `hydrate()`-driven instead of hardcoded seed arrays; `seed.ts` becomes a **fallback/demo dataset** used only when no org is authenticated (local dev, screenshots, sales demos).

## 4. Auth

Supabase Auth, email/magic-link (simplest for solo coaches, no password reset support burden). On first sign-in: create `organizations` row + `memberships(role='owner')` row automatically via a Postgres trigger or Edge Function (same pattern as the OMK SaaS `sign-up-organization` Edge Function already live in production — reuse that function's shape rather than reinventing it).

## 5. Tenant isolation — RATIFIED: graduated 3-stage model (A+ 2026-07-22)

The Zero-PII app promises *"One private instance per practice — no pooling with other coaches."* This is not a binary A-vs-B infra choice — it's a **graduation path tied to the sales motion itself**: prove value pooled and cheap, then hand over ownership as the relationship matures, then go full white-label. Three stages, not two options:

| Stage | Infra | Who owns it | When |
|---|---|---|---|
| **1 — PoC SaaS (current)** | Shared Supabase project, RLS-enforced by `org_id` | OMK Services | Cycle 1 marketplace-coach PoC (10–100 first clients). Demonstrates the business-management value before asking for infra commitment. |
| **2 — Coach-owned cloud** | Dedicated Supabase Cloud project, **ownership transferred to the coach** | The coach (their own Supabase Cloud account/org) | Once a coach is proven-in and wants to own their client-business data directly — no more logical pooling, a real dedicated project, but still Supabase-hosted (no ops burden on the coach). |
| **3 — White-label self-host** | Supabase self-hosted inside the coach's own VPS, orchestrated via Coolify | The coach, fully | For coaches who want total infra sovereignty. **OMK SOB agents are the mechanics** — they build, maintain, and evolve this self-hosted stack on the coach's behalf (matches the existing `agent-os/citadel` runtime canon pattern already proven for OMK's own infra). |

Stage 1 is what Phase 0–3 below build. Stages 2 and 3 are **not built now** — they're the commercial roadmap this schema must not block: because the schema (§3.2, generic `cms_collections`/`cms_items` + small dedicated tables) is plain Postgres with no OMK-specific lock-in, a Stage-2 project migration is a `pg_dump`/`pg_restore` (or Supabase's own project-to-project migration tooling) plus repointing `VITE_SUPABASE_URL`/keys — no schema rewrite. Stage 3 is the same schema again, just self-hosted. Keep it that way: no OMK-only extensions, no hardcoded org assumptions beyond `org_id` scoping.

## 6. Rollout phases

| Phase | Scope | Depends on |
|---|---|---|
| **0** | Provision Supabase project, `organizations`/`memberships`/`profiles`, auth wired, sign-up Edge Function | A+ GO (creates billed cloud resource) |
| **1** | `cms_collections` + `cms_items` tables + RLS; `CmsRepository` replaces in-memory seed for `clients` + `articles` | Phase 0 |
| **2** | Dedicated tables for Tasks, Settings flags, Legal AI-Act checklist | Phase 1 |
| **3** | IndexedDB dual-write cache layer (offline-first, mirrors Life OS `idb.ts`) | Phase 1 |
| **4** | `shell_layouts` — window positions persist per coach across devices (optional; currently fine in `localStorage`) | Phase 1 |
| **5** | Realtime subscriptions (e.g. live Compliance Ledger stream, multi-seat orgs) | Phase 1–2, only if multi-user-per-org becomes real |

## 7. What does NOT move to Supabase (v1)

- `windows` z-index/position churn during drag (too high-frequency; only the *settled* layout persists, same as Life OS's `saveLayout` on `beforeunload`).
- Toast notifications (`shell.store.toasts`) — ephemeral by design, never persisted.
- Sidebar collapsed/expanded state per window — cosmetic, local-only.

## 8. Immediate next step (when A+ says go)

1. Confirm Option A vs. B (§5).
2. Provision Supabase project via `mcp__supabase__create_project` (or reuse an existing org's Supabase account if Coach OS ships under `omk-services`).
3. Apply the schema in §3.2/§3.2-adjacent tables via `apply_migration`.
4. Wire `src/lib/supabase.ts` + `CmsRepository`, migrate `seed.ts` to a dev-only fallback.
5. Re-verify every app that reads `useCmsStore` still renders (Clients Directory, Operations Knowledge Base) against live data before touching the rest.
