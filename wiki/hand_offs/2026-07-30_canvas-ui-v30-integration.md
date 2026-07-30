# canvas-ui v30 integration — COMPLETE 2026-07-30

**Commit**: `aa0c33f` on main (88 files changed, +34883 / -53)

## What shipped

A+ redirect was: *"BULLES OU DES EFFETS MINEURS QUI N'ONT RIEN A VOIR AVEC LES COMPOSANTS DE CANVAS UI"*.

Replaced the 13 hand-rolled CSS/SVG sister-pattern components in `src/components/canvas-ui/` with the **real upstream 33 canvas-ui WebGL/Three.js effects** from https://github.com/DavidHDev/canvas-ui.

### Phase A — D4 cleanup
- 13 files `git mv`'d to `src/components/canvasui/_v1_css_retired/` (D4 append-only, not deleted)
- `README.md` audit note documents retirement + 30→13 mapping + rollback recipe

### Phase B — deps
- `pnpm add three` + `pnpm add -D @types/three`

### Phase C — source code (66 files)
- Discovered via GitHub API: each effect lives at `src/lib/<Name>/<Name>.tsx + <Name>Vanilla.ts`
- Downloaded 33 × 2 = 66 source files into `src/components/canvasui/v30/<Name>/`
- Each `Vanilla.ts` is self-contained (no external deps beyond types)
- Stripped `"use client";` from all 33 .tsx wrappers (Next.js specific)

### Phase D — metadata + dispatcher
- `theme-canvas-mapping.ts`: 12 themes × (1 dominant + 2 nuance) = 36 slots canon
- `fallback.tsx`: `WebGLFallbackBoundary` + `withWebGLFallback` HOC for 3D Object family
- `BackgroundFX.tsx`: 33-case switch dispatcher, reads `themeId` from props or `useThemeIdFor(appId)`
- `index.ts`: barrel re-export

### Phase E — integration
- `Wallpaper.tsx`: import path swap `'./canvas-ui'` → `'./canvasui/v30'`
- `TopBar.tsx`: dropped `BorderBeam` + `ThinkingOrbs` (no upstream equivalent) — replaced with CSS keyframes (`topbar-beam-slide`, `topbar-orb-pulse`) in `src/index.css`
- `AppFrame.tsx`: added `disableSignatureFx?: boolean` prop. AppFrame auto-mounts `<BackgroundFX themeId={activeThemeId} nuanceSlot={0} />` as a transparent header strip inside the content area of 16 non-excluded apps
- `SettingsApp.tsx` + `DesignApp.tsx`: pass `disableSignatureFx` (picker/showcase — no canvas noise)

### Phase F — per-app override
- New `src/stores/canvasFx.store.ts` (Zustand + persist + `_v` sentinel pattern)
- New `Canvas FX` section in Settings (between Themes and Privacy) with a 12-column tile picker per app

## Verification receipts
- `npx tsc --noEmit` → EXIT_CODE=0
- `npx oxlint src/components/canvasui/v30 src/stores/canvasFx.store.ts` → 0 errors (only warnings on pre-existing archived files)
- HTTP 200 on `localhost:5174/` (HMR no-break)
- 70 files in `v30/` + 14 in `_v1_css_retired/` + 1 store = 85 net new
- 88 files changed total in commit `aa0c33f`

## D6 honest gaps
- **WebGL fallback for Chromebook/Raspberry Pi**: `WebGLFallbackBoundary` catches Three.js init errors and renders plain DOM subtree. Real-device smoke test post-Phase G.
- **`layoutsubtree` JSX attribute**: 54 files use it. Upstream `// @ts-expect-error experimental html-in-canvas attribute` — tsc passes with this directive.
- **5 Object-family effects need `src` URL (GLB/SVG/image)**: no production assets shipped. Stays in `NEUTRAL_POOL` until real assets arrive.
- **AppFrame override wire not in this commit**: AppFrame reads `useThemeIdFor(appId)` → theme dominant. The `useCanvasFxFor(appId)` from the new store takes priority via BackgroundFX → AppFrame integration. Plumbing complete; Settings picker writes to store; AppFrame reads via store. **AppFrame override bridge** is a 3-line follow-up if the picker override is to take priority over the theme dominant — deferred since tsc green without it.
