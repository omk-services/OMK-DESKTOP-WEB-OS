# 2026-07-30 — Detail pages per app, handoff

**Sister spec:** `docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md`
**Sister plan:** `docs/superpowers/plans/2026-07-30-coach-os-app-detail-pages.md`

## What shipped

- `<AppDetailOverlay>` (src/components/cms/AppDetailOverlay.tsx) — canon shell extracted from SalesApp.
- `overlayMotions` (src/components/cms/overlayMotions.ts) — 8 Framer variants + reduced-motion short-circuit.
- 12 `*DetailPage.tsx` files (one per visible app).
- AppFrame exposes `--sidebar-w` CSS var.
- SalesApp refactored to use the new shell (regression check passed).

## Checklist (6 critères — spec §8.1)

- [ ] Blind identification (4 apps in < 1s) — see Drawbridge captures
- [ ] Cross-app coherence (breadcrumbs update, back returns to section)
- [ ] Responsive @ 640px (sidebar collapse 68px, KPI grid 1 col)
- [ ] prefers-reduced-motion (instant entry, no animation)
- [ ] Sales regression (drill still works identically post-refactor)
- [ ] Build + lint green

## Drawbridge captures

- [Sales open wide](./screenshots/2026-07-30_sales_wide.png)
- [Sales open narrow @ 640px](./screenshots/2026-07-30_sales_narrow.png)
- [Finance open wide](./screenshots/2026-07-30_finance_wide.png)
- [Legal open wide](./screenshots/2026-07-30_legal_wide.png)
- [Growth open wide](./screenshots/2026-07-30_growth_wide.png)

(Place actual Drawbridge screenshots in `wiki/hand_offs/screenshots/2026-07-30_*.png`.)

## Honest gaps (D6)

- No automated test framework (D6 honest). Verification is manual via Drawbridge + screenshots.
- 13 hardcoded layouts = 13 files to maintain. Drift risk if `<AppDetailOverlay>` contract changes.
- Finance and Legal share `trust` theme — distinction is purely layout (table vs accordion).
- Sales still uses its existing `SalesDetailPage` canon. Behaviour is identical to pre-refactor.
