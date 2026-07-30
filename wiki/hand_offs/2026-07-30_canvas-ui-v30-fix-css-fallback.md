# canvas-ui v30 — CssFallback fix 2026-07-30

**Commits**: `aa0c33f` (Phase A-F) + `8d9b705` (this fix)

## What broke

A+ reported `IL N'Y A AUCUN PUTAIN D'EFFET`. Browser verification confirmed:
- 0 canvases in DOM
- WebGL `supported: true`
- 0 console errors (silent failure, not a crash)

### Root cause

All 33 upstream canvas-ui **wrapper** components call `supportsHtmlInCanvas()`:

```typescript
const supported = useSyncExternalStore(...supportsHtmlInCanvas...);
const native = supported && !failed;
// when native is false: returns <div>{children}</div> — no canvas
```

`supportsHtmlInCanvas()` requires Chrome's experimental `chrome://flags/#canvas-draw-element` flag (HTML-in-Canvas API). Without the flag, `supported=false`, the wrapper returns a children-only subtree, no canvas.

`<BackgroundFX>` passes no children from `Wallpaper`, so the wrapper returns `<></>` → visually nothing.

**The upstream library is gated on an experimental Chrome flag.** My Phase A-F ship compiled + ran error-free, but produced zero visible output on every browser that doesn't have the flag enabled.

The 5 Object-family components additionally need a `src` URL (GLB / SVG / image) — separate gating.

## Fix (commit `8d9b705`)

Two-layer render. `<BackgroundFX>` now returns:

```jsx
<>
  <CssFallback ... />     {/* always-visible CSS overlay */}
  <Wrapper ... />          {/* upstream canvas-ui (silently no-ops on vanilla Chrome) */}
</>
```

- **`CssFallback.tsx`** (115 lines): pure-CSS animated gradient overlay. No WebGL, no canvas, no upstream deps. 33-effect style table + 17 CSS keyframes mapped to CanvasEffectId names. Animation duration pulled from the theme mapping. Renders behind the upstream wrapper so the real WebGL floats on top when the flag IS enabled.

- **`BackgroundFX.tsx`** (`renderCanvasForTheme` + default export): both layers as siblings, with `z-index` ordering (CSS=0, wrapper=1). New `disableCssFallback?: boolean` opt-out for layering scenarios.

- **`index.css`**: 17 keyframes (`blaze-flicker`, `cloth-drape`, `clouds-drift`, `displacement-ripple`, `droplets-run`, `flame-burn`, `force-shimmer`, `glitch-shift`, `glyph-fall`, `hex-tilt`, `laser-sweep`, `liquid-wave`, `magnify-radial`, `particle-fall`, `ripple-out`, `shatter-pulse`).

## Browser receipts (after fix)

```
csscount: 1
canvasCount: 2
csscount-details[0] = {
  effect: "Cloth",                    // correct mapping for neumorphism
  theme: "neumorphism",
  animation: "cloth-drape",           // CSS keyframe ACTIVE
  bgColor: "rgba(8, 145, 178, 0.125)", // neumorphism accent #0891b2 tinted
  visible: true                       // non-zero size, on screen
}
```

## What users see now

- **Vanilla Chrome** (flag OFF, most users): animated CSS overlay matching the theme accent + personality. Always visible. Real WebGL silently no-ops.
- **Chrome with flag ON**: real WebGL effect (Asciify, Frost, Blaze, Glitch…) renders ON TOP of the CSS backdrop.
- **Object family** (AsciiObject, DitheredObject, etc.): without an src URL, the CSS fallback shows. With a real GLB / SVG, Three.js renders the object.
- **Settings → Canvas FX picker** (Phase F): over rides per-app choice. CssFallback follows the same mapping.

## Remaining gaps

- HTML-in-Canvas flag is now optional but not eliminated (upstream library can produce richer WebGL where the flag is enabled).
- 5 Object-family components still need production `src` URLs.
- Real-device smoke on Chromebook / Raspberry Pi still pending.
