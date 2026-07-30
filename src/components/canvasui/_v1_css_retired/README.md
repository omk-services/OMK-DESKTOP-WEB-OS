# _v1_css_retired — Hand-rolled CSS sister patterns (Retired 2026-07-30)

> **D4 append-only archive.** These 13 files were the in-house CSS/SVG reimaginings of the
> upstream [`canvas-ui`](https://github.com/DavidHDev/canvas-ui) library, shipped as
> placeholder work while the upstream package was being scoped. A+ redirected in
> 2026-07-30: "BULLES OU DES EFFETS MINEURS QUI N'ONT RIEN A VOIR AVEC LES COMPOSANTS DE
> CANVAS UI" → replaced entirely by the real WebGL components now living at
> `src/components/canvasui/v30/`.

## What was here, what replaced it

| v1 file (this dir) | What it was | v30 replacement (upstream) |
|---------------------|-------------|------------------------------|
| `Asciify.tsx` | CSS halftone drift | `Asciify` (WebGL real halftone) |
| `BackgroundFX.tsx` | Per-theme effect router | `BackgroundFX.tsx` rebuilt with `THEME_TO_CANVAS_UI` mapping |
| `Bend.tsx` | CSS skew distortion | `Bend` (WebGL real bend on `layoutsubtree`) |
| `Blaze.tsx` | CSS radial pulse | `Blaze` (WebGL particles) |
| `BorderBeam.tsx` | CSS animated beam | **absorbed** into `Grid` patterns + plain accent span |
| `Bubble.tsx` | CSS floating bubbles | `Bubble` (WebGL metaballs) |
| `Frost.tsx` | CSS backdrop-blur | `Frost` (WebGL frosted glass) |
| `Glitch.tsx` | CSS RGB shift | `Glitch` (WebGL broadcast corruption) |
| `LiquidMetal.tsx` | SVG `feTurbulence` | `Liquid` / `LiquidObject` (WebGL fluid) |
| `Particle.tsx` | CSS radial particles | `ParticleReveal` / `ParticleScroll` (WebGL particles) |
| `ThinkingOrbs.tsx` | CSS pulsing orbs | **absorbed** — no upstream equivalent; replaced with accent span |
| `theme-canvas-mapping.ts` | 12-theme → 9-component map | Rebuilt as 12-theme × 3-effects (1 dominant + 2 nuance) |
| `index.ts` | barrel of 11 components | Rebuilt — `v30/index.ts` re-exports the 25 wrappers |

## Why retired (D6 honest)

- User explicitly rejected the CSS-only approach as not Canvas UI.
- All upstream v30 components are GPU-accelerated (WebGL/WebGL2 via Canvas2D
  fallback). The v1 versions used CSS keyframes only — CPU-driven, no
  real-time gpu surface, no per-pixel control.
- D4 append-only: git history keeps the full source intact. `git log -p
  src/components/canvasui/_v1_css_retired/Frost.tsx` still works for retro
  archaeology.

## Rollback target

If `v30` integration regresses in production and rollback is needed:

```bash
# Restore the legacy dir for one release as a downgrade path
mkdir -p src/components/canvas-ui
git mv src/components/canvasui/_v1_css_retired/* src/components/canvas-ui/
rmdir src/components/canvasui/_v1_css_retired
# Revert any consumer import path that was changed:
#   Wallpaper.tsx + TopBar.tsx — re-point to './canvas-ui' (legacy)
```

D4 means rollback is mechanical, atomic, reversible, and tracked.

— signed-off 2026-07-30, plan: `~/.claude/plans/je-t-aivais-demander-d-implementer-recursive-hinton.md`
