# Coach OS

A desktop-web OS for solo premium coaches — 13 apps (Dashboard, People/Agents,
Operations, IT/R&D, Clients, Tasks, Marketplace, Product, Growth, Sales, Finance,
Legal, Settings), each with its own collapsible sidebar and CMS-driven content
(collections → repeater lists → dynamic detail pages, in the spirit of a
Wix-CMS-style content model).

Forked from the A'Space Life OS window shell (draggable/resizable windows,
Zustand-backed layout persistence, glass design system) and re-skinned in a
PostHog-light palette with a paper-garden wallpaper.

## Stack

- Vite + React 19 + TypeScript
- Zustand (shell/window state + CMS collections store)
- Tailwind v4
- Supabase (Postgres, RLS-scoped multi-tenant backend — see `MIGRATION_SUPABASE.md`)

## Local development

```bash
npm install
npm run dev
```

Copy `.env.local.example` (create one from your Supabase project keys) to `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Docs

- [`MIGRATION_SUPABASE.md`](./MIGRATION_SUPABASE.md) — data-layer migration plan, 3-stage tenancy model
- [`PHASE0_RECEIPT.md`](./PHASE0_RECEIPT.md) — Supabase Phase 0 provisioning receipt
