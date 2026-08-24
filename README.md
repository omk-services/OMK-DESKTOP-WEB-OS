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

Full step-by-step setup (clone to first `--sante` check) lives in
[`INSTALL.md`](./INSTALL.md) — it documents two already-paid traps (a
false-positive `tsc` command, and a flaky default `vitest` pool) so nobody
re-discovers them. Short version:

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

Node version is pinned in [`.nvmrc`](./.nvmrc).

## Verify / CI

```bash
npm run verify
```

Runs, in order: `typecheck` (`tsc -b` — the only command that actually
type-checks; `npx tsc --noEmit -p tsconfig.json` alone is a silent
false-positive), `typecheck:api`, `test` (vitest with `--pool=threads`),
`build`, and the four runtime benches (`_runtime/kernel.mjs`,
`_runtime/bridge/{bridge,adapters,rbac-test}.mjs`). This is exactly what
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push
and pull request.

## Docs

- [`INSTALL.md`](./INSTALL.md) — full local setup, verification, and known traps
- [`MIGRATION_SUPABASE.md`](./MIGRATION_SUPABASE.md) — data-layer migration plan, 3-stage tenancy model
- [`PHASE0_RECEIPT.md`](./PHASE0_RECEIPT.md) — Supabase Phase 0 provisioning receipt
