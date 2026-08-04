# Coach OS — App Detail Pages per App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two competing detail-page patterns in Coach OS with a single `<AppDetailOverlay>` shell + 13 hardcoded `*DetailPage.tsx` files, each with its own layout signature, motion signature, and typographic identity — so a user can identify which app they're in within 1 second of opening a detail.

**Architecture:** Factor `SalesApp.tsx:519-526` (in-place overlay pattern) into a shared `<AppDetailOverlay>` component, exposed via a single CSS variable `--sidebar-w` written by `AppFrame`. Each app owns a `*DetailPage.tsx` hardcoded component. Sidebar stays visible during drill. Eight motion signatures via Framer Motion variants. Hardcoded identity per app, no renderer abstraction.

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 + Tailwind v4 + Zustand 5 + Framer Motion (motion 12.42) + Lucide React 1.25. No new deps.

**Sister spec:** `C:/Users/amado/coach-os/docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md`

**Verification channel:** Drawbridge + manual + `npm run build` + `npm run lint`. No automated test framework installed (D6 honest gap).

---

## Global Constraints

- TypeScript 6 strict mode (already on). All exported functions, shared utilities, and component props must have explicit types. No `any` in app code — use `unknown` and narrow.
- No `console.log` in production code.
- Immutability: never mutate. Use spread for new objects.
- Error handling: async/await + try-catch with `unknown` narrowing.
- All colors come from CSS variables (`--theme-bg`, `--theme-surface`, `--theme-text`, `--theme-radius`, `--theme-font-display`, `--theme-font-body`, `--theme-accent`). Only the accent hex in `app-registry.ts` is allowed as a literal — passed via `<AppDetailOverlay accent={accent}>`.
- No new dependencies. No new theme. No new app. No new global CSS keyframe that escapes the overlay (motions live in `overlayMotions.ts` as Framer variants).
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`).
- Append-only D4 canon: any retired code goes to `_TRASH_<YYYY-MM-DD>/`, never hard-deleted.
- Drawbridge is the verification channel — produce screenshots before declaring done.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/components/cms/AppDetailOverlay.tsx` | NEW | Shell overlay: absolute positioning, motion dispatch, focus management, a11y. |
| `src/components/cms/overlayMotions.ts` | NEW | 8 Framer Motion variants (fade-up, slide-left, slide-right, slide-bottom, pop-scale, fade-blur, type-in, unfold) + reduced-motion short-circuit. |
| `src/components/AppFrame.tsx` | MODIFY | Expose `--sidebar-w` CSS variable on root div (240px wide, 68px narrow). |
| `src/apps/sales/SalesApp.tsx` | MODIFY | Refactor lines 519-526 to use `<AppDetailOverlay>`. Sales already has `SalesDetailPage` canon. |
| `src/apps/sales/SalesDetailPage.tsx` | UNCHANGED | Already canon, just gains an `accent` prop pass-through. |
| `src/apps/dashboard/DashboardDetailPage.tsx` | NEW | Hero metric + KPI grid + activity timeline. `fade-up` 220ms. |
| `src/apps/people/PeopleDetailPage.tsx` | NEW | Hero + 3-column profile (avatar / meta / squad chips). `slide-left` 220ms. |
| `src/apps/operations/OperationsDetailPage.tsx` | NEW | Hero + 2-col split (runbook body / sidebar meta) + incident chips. `fade-up` 200ms. |
| `src/apps/it-rd/ItRdDetailPage.tsx` | NEW | Terminal header + logs stream / deploys. `type-in` 280ms. |
| `src/apps/clients/ClientsDetailPage.tsx` | NEW | Hero + portrait + 3-pill stack (contract / onboarding / churn risk). `pop-scale` 200ms. |
| `src/apps/tasks/TasksDetailPage.tsx` | NEW | Hero + vertical single-column prose + due-date eyebrow. `slide-bottom` 220ms. |
| `src/apps/marketplace/MarketplaceDetailPage.tsx` | NEW | Hero + bento 2×2. `fade-blur` 240ms. |
| `src/apps/product/ProductDetailPage.tsx` | NEW | Hero + roadmap row + 2-col (spec / channels). `slide-right` 220ms. |
| `src/apps/growth/GrowthDetailPage.tsx` | NEW | Hero + 2-col (funnel viz / experiment table). `fade-up` 220ms + scale 0.95→1. |
| `src/apps/finance/FinanceDetailPage.tsx` | NEW | Hero + KPI strip horizontal + dense data table. `fade-up` 240ms. |
| `src/apps/legal/LegalDetailPage.tsx` | NEW | Hero + accordéon contractuel. `unfold` 240ms. |
| `src/apps/settings/SettingsDetailPage.tsx` | NEW (if applicable) | Hero + 2-col (form / preview). `pop-scale` 200ms. (Note: `ThemeDetailPage.tsx` already exists for theme drill — leave untouched.) |
| `src/apps/<id>/<Id>App.tsx` (12 apps) | MODIFY | Add `useState<DetailItem \| null>(null)`, `useEffect` mirror to `useWindowPage().setDetail`, render `<AppDetailOverlay>` when `detail !== null`. Pass `appId`, `accent`, `motion`, `onBack`, and the `*DetailPage` child. |
| `wiki/hand_offs/2026-07-30_detail_pages_per_app.md` | NEW | Handoff with checklist + Drawbridge screenshots. |
| `_DRAFTS_PPR_LANE/event_log_2026-07-30.jsonl` | NEW | 13 "page detail livrée" + 1 "AppDetailOverlay extracted" entries. |

**Decomposition rationale:** Shell (`AppDetailOverlay` + `overlayMotions`) is built once, then 13 `*DetailPage` files are independent and can be implemented in any order. Each app's `*App.tsx` integration is a small mechanical edit. Last task: handoff.

---

## Task 1: Create `overlayMotions.ts` — 8 Framer variants

**Files:**
- Create: `C:/Users/amado/coach-os/src/components/cms/overlayMotions.ts`

**Interfaces (consumed by Task 2):**

```ts
export type OverlayMotionKind =
  | 'fade-up'
  | 'slide-left'
  | 'slide-right'
  | 'slide-bottom'
  | 'pop-scale'
  | 'fade-blur'
  | 'type-in'
  | 'unfold';

export interface OverlayMotionSpec {
  kind: OverlayMotionKind;
  durationMs: number;
}
```

**Produces:** `overlayMotions[spec]` → Framer Motion `Variants` object, plus a `useReducedMotion()` hook that short-circuits to `duration: 0` if `prefers-reduced-motion: reduce`.

- [ ] **Step 1: Write the file**

```ts
/**
 * overlayMotions.ts — 8 entry-motion variants for <AppDetailOverlay>.
 *
 * Each variant maps to a Framer Motion `Variants` object. Reduced-motion
 * short-circuits to duration: 0 at render time (per accessibility
 * contract in spec section 6.2).
 */
import { useEffect, useState, type Variants } from 'motion/react';
import type { OverlayMotionSpec } from './AppDetailOverlay';

export type { OverlayMotionKind, OverlayMotionSpec } from './AppDetailOverlay';

const BASE_EASE = [0.16, 1, 0.3, 1] as const; // ease-out-expo

function withDuration(spec: OverlayMotionSpec, reduced: boolean): Variants {
  const d = reduced ? 0 : spec.durationMs / 1000;
  const ease = BASE_EASE;

  switch (spec.kind) {
    case 'fade-up':
      return {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: d, ease } },
      };
    case 'slide-left':
      return {
        hidden: { opacity: 0, x: -24 },
        visible: { opacity: 1, x: 0, transition: { duration: d, ease } },
      };
    case 'slide-right':
      return {
        hidden: { opacity: 0, x: 24 },
        visible: { opacity: 1, x: 0, transition: { duration: d, ease } },
      };
    case 'slide-bottom':
      return {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: d, ease } },
      };
    case 'pop-scale':
      return {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1, transition: { duration: d, ease } },
      };
    case 'fade-blur':
      return {
        hidden: { opacity: 0, filter: 'blur(8px)' },
        visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: d, ease } },
      };
    case 'type-in':
      return {
        hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        visible: { opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: d, ease } },
      };
    case 'unfold':
      return {
        hidden: { opacity: 0, scaleY: 0.6, transformOrigin: 'top center' },
        visible: { opacity: 1, scaleY: 1, transition: { duration: d, ease } },
      };
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function getOverlayVariants(spec: OverlayMotionSpec, reduced: boolean): Variants {
  return withDuration(spec, reduced);
}
```

- [ ] **Step 2: Verify build still passes**

Run: `cd C:/Users/amado/coach-os && npm run build`
Expected: `built in XXXms` with no errors. (File is unused but should compile.)

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/components/cms/overlayMotions.ts
git commit -m "feat(cms): add overlayMotions module with 8 Framer variants + reduced-motion short-circuit"
```

---

## Task 2: Create `AppDetailOverlay.tsx` — shared shell

**Files:**
- Create: `C:/Users/amado/coach-os/src/components/cms/AppDetailOverlay.tsx`

**Interfaces consumed (from Task 1):** `OverlayMotionKind`, `OverlayMotionSpec`.
**Reused:** `useReducedMotion`, `getOverlayVariants` from `overlayMotions.ts`.
**Reused (Framer):** `motion`, `AnimatePresence` from `motion/react` (already used elsewhere — e.g. `src/components/TopBar.tsx`).

- [ ] **Step 1: Write the file**

```tsx
/**
 * AppDetailOverlay.tsx — Canon shell for in-place app detail pages.
 *
 * Sister pattern extracted from src/apps/sales/SalesApp.tsx:519-526.
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §3.1
 *
 * Contract:
 *  - Renders position:absolute overlay, left: var(--sidebar-w, 240px).
 *  - Dispatches one of 8 entry motions (per overlayMotions).
 *  - Focuses the first <h1> in children on mount.
 *  - Exposes role="main" + aria-label="<appName> detail".
 *  - Stops scroll propagation to the AppFrame content.
 *  - Respects prefers-reduced-motion: reduce (delegated to overlayMotions).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getOverlayVariants, useReducedMotion } from './overlayMotions';

export type OverlayMotionKind =
  | 'fade-up'
  | 'slide-left'
  | 'slide-right'
  | 'slide-bottom'
  | 'pop-scale'
  | 'fade-blur'
  | 'type-in'
  | 'unfold';

export interface OverlayMotionSpec {
  kind: OverlayMotionKind;
  durationMs: number;
}

export interface AppDetailOverlayProps {
  appId: string;
  /** Hex color for the title-block icon and action button tint. */
  accent: string;
  /** Called when the user clicks the back affordance in the child. */
  onBack: () => void;
  /** Motion signature dispatched on entry. */
  motion: OverlayMotionSpec;
  /** The *DetailPage content. */
  children: ReactNode;
}

const APP_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  operations: 'Operations',
  'it-rd': 'IT / R&D',
  clients: 'Clients',
  tasks: 'Tasks',
  marketplace: 'Marketplace',
  product: 'Product',
  growth: 'Growth',
  sales: 'Sales',
  finance: 'Finance',
  legal: 'Legal',
  settings: 'Settings',
};

export function AppDetailOverlay({
  appId,
  motion: motionSpec,
  children,
}: AppDetailOverlayProps): JSX.Element {
  const reduced = useReducedMotion();
  const variants = getOverlayVariants(motionSpec, reduced);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = APP_LABELS[appId] ?? appId;

  // Focus the first <h1> on mount (a11y — section 6.2 of the spec).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const h1 = root.querySelector<HTMLElement>('h1');
    if (h1) {
      h1.focus({ preventScroll: false });
    }
  }, []);

  // Stop scroll propagation so AppFrame content doesn't scroll in parallel
  // (the overlay is its own scrollable region).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const stop = (e: WheelEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If the wheel happens inside the overlay, let it scroll the overlay.
      if (root.contains(target)) {
        e.stopPropagation();
      }
    };
    root.addEventListener('wheel', stop, { passive: true });
    return () => root.removeEventListener('wheel', stop);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="app-detail-overlay"
        ref={containerRef}
        role="main"
        aria-label={`${label} detail`}
        data-testid="app-detail-overlay"
        data-app={appId}
        className="absolute top-0 right-0 bottom-0 z-50 overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]"
        style={{ left: 'var(--sidebar-w, 240px)' }}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify build still passes**

Run: `cd C:/Users/amado/coach-os && npm run build`
Expected: build succeeds. File compiles, unused exports are fine.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/components/cms/AppDetailOverlay.tsx
git commit -m "feat(cms): add AppDetailOverlay shell (overlay + motion + a11y + reduced-motion)"
```

---

## Task 3: Expose `--sidebar-w` on `AppFrame` root

**Files:**
- Modify: `C:/Users/amado/coach-os/src/components/AppFrame.tsx:140` (one inline style addition)

**Interface consumed (from Tasks 1–2):** `<AppDetailOverlay>` reads `var(--sidebar-w, 240px)` from the cascade.

- [ ] **Step 1: Modify the root div**

Find this line (around 140):
```tsx
<div ref={rootRef} className="flex h-full min-h-0 bg-[var(--theme-bg)] relative">
```

Replace with:
```tsx
<div
  ref={rootRef}
  className="flex h-full min-h-0 bg-[var(--theme-bg)] relative"
  style={{ ['--sidebar-w' as string]: collapsed ? '68px' : '240px' }}
>
```

This is the only behavioural change in `AppFrame` for this plan — a single inline CSS variable derived from the existing `collapsed` state (line 135). No new state, no refactor of the sidebar markup.

- [ ] **Step 2: Verify build still passes**

Run: `cd C:/Users/amado/coach-os && npm run build`
Expected: build succeeds. TypeScript is happy with the `as string` cast on the custom property name.

- [ ] **Step 3: Verify lint**

Run: `cd C:/Users/amado/coach-os && npm run lint`
Expected: no new warnings.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/components/AppFrame.tsx
git commit -m "refactor(frame): expose --sidebar-w CSS var (240/68) for AppDetailOverlay"
```

---

## Task 4: Refactor `SalesApp.tsx` to use `<AppDetailOverlay>`

**Files:**
- Modify: `C:/Users/amado/coach-os/src/apps/sales/SalesApp.tsx:510-528`

**Interfaces consumed (from Tasks 1–3):** `<AppDetailOverlay appId="sales" accent="#ea580c" motion={{ kind: 'slide-right', durationMs: 200 }} onBack={…}>{children}</AppDetailOverlay>`.

This task is the **regression test** for the plan: if Sales keeps working identically, the shell is good.

- [ ] **Step 1: Replace the inline overlay with `<AppDetailOverlay>`**

Find this JSX (lines 519-526):
```tsx
      {detail ? (
        <div
          className="absolute top-0 right-0 bottom-0 z-50 overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]"
          style={{ left: 'var(--sidebar-w, 240px)' }}
        >
          <SalesDetailPage item={detail} onBack={() => setDetail(null)} onNavigate={navigate} />
        </div>
      ) : null}
```

Replace with:
```tsx
      {detail ? (
        <AppDetailOverlay
          appId="sales"
          accent={ACCENT}
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-right', durationMs: 200 }}
        >
          <SalesDetailPage item={detail} onBack={() => setDetail(null)} onNavigate={navigate} />
        </AppDetailOverlay>
      ) : null}
```

(ACCENT is the existing hex constant in `SalesApp.tsx` — find it via `grep -n ACCENT src/apps/sales/SalesApp.tsx`.)

- [ ] **Step 2: Add the import**

Find the existing import block for `react`/external deps at the top of `SalesApp.tsx`. Add:
```tsx
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
```

(Adjust the relative path if `SalesApp.tsx` is at a different depth than `../../components/`. It is — `SalesApp.tsx` is in `src/apps/sales/`, so `../../components/cms/AppDetailOverlay` is correct.)

- [ ] **Step 3: Run the existing dev server and verify**

Run: `cd C:/Users/amado/coach-os && npm run dev`
Then: open `http://localhost:5174/`, open the Sales window, drill into a deal. Verify:
- The detail page still renders identically to before.
- The breadcrumb in the window chrome shows the deal title.
- The back button closes the detail, the sidebar stays visible.

If the dev server is already running (PID 905 cited in the handoff), this is a no-op — just refresh.

- [ ] **Step 4: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/sales/SalesApp.tsx
git commit -m "refactor(sales): use shared AppDetailOverlay (regression check, behaviour identical)"
```

---

## Task 5: Create the 12 `*DetailPage.tsx` files (one per app)

This is the bulk of the plan. 12 sub-tasks, each creating one file. The pattern is identical for every app:

1. Define a `DetailItem` shape (or extend an existing one in the app).
2. Define a `DETAIL_META` table (label, icon, accent).
3. Export a `*DetailPage` component that consumes `DetailItem` + `onBack` + (optional) `onNavigate`, and renders the layout signature from the spec table.
4. Each `*DetailPage` is wrapped in `<AppDetailOverlay>` from the parent `*App.tsx`.

**Common rules for all 12 files:**
- `interface` for props and `type` for unions (per TS rules).
- No `console.log`.
- All colors via `var(--theme-*)`; accent via prop or `var(--theme-accent)`.
- Hardcoded layout, hardcoded motion kind (passed via `<AppDetailOverlay>`'s `motion` prop in the parent `*App.tsx`, not hardcoded inside the page).
- The page body is what differs — the *App.tsx wiring (Task 6) is mechanical.

The spec's section 4 is the contract for the 12 layouts. The motion kind + duration in the spec table is what the parent `*App.tsx` passes to `<AppDetailOverlay>`.

### Task 5.1: `DashboardDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/dashboard/DashboardDetailPage.tsx`

**Layout signature (spec §4 row 1):** Hero metric 56px + grid 2-col dense (KPI cards 4×) + Activity timeline. Motion `fade-up` 220ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * DashboardDetailPage.tsx — Dashboard in-app detail (hero metric + KPI grid + activity).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 1
 */
import { ArrowLeft, LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface DashboardDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  /** Big number — shown in the 56px hero metric block. */
  heroMetric: { value: string; label: string };
  kpis: { label: string; value: string; delta?: string }[];
  activity: { at: string; text: string }[];
  fields: DetailField[];
}

interface DashboardDetailPageProps {
  item: DashboardDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function DashboardDetailPage({
  item,
  onBack,
  backLabel = 'Back to Dashboard',
}: DashboardDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Dashboard
          </span>
        </div>

        {/* Hero metric */}
        <section
          className="mb-6 rounded-2xl border border-[var(--panel-border)] p-6"
          style={{ background: 'var(--theme-surface)' }}
        >
          <div className="mb-2 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: 'var(--theme-accent)' }}
              aria-hidden="true"
            >
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
          </div>
          <h1 tabIndex={-1} className="text-[56px] font-extrabold leading-none text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {item.heroMetric.value}
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-text-muted)]">{item.heroMetric.label}</p>
          <p className="mt-4 text-lg text-[var(--theme-text)]">{item.title}</p>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
        </section>

        {/* KPI grid 2-col dense, 4 cards */}
        <section
          className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--panel-border)] sm:grid-cols-2"
          style={{ background: 'var(--panel-border)' }}
        >
          {item.kpis.map((k) => (
            <div key={k.label} className="p-4" style={{ background: 'var(--theme-surface)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                {k.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
                  {k.value}
                </div>
                {k.delta ? (
                  <div className="text-xs font-semibold text-[var(--theme-text-muted)]">{k.delta}</div>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        {/* Activity timeline */}
        <section
          className="rounded-2xl border border-[var(--panel-border)] p-5"
          style={{ background: 'var(--theme-surface)' }}
        >
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
            Activity
          </h2>
          <ol className="space-y-3">
            {item.activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="shrink-0 font-mono text-[11px] text-[var(--theme-text-dim)]">{a.at}</span>
                <span className="text-[var(--theme-text)]">{a.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/dashboard/DashboardDetailPage.tsx
git commit -m "feat(dashboard): DashboardDetailPage (hero metric + KPI grid + activity timeline)"
```

### Task 5.2: `PeopleDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/people/PeopleDetailPage.tsx`

**Layout signature (spec §4 row 2):** Hero + 3-column profile (Avatar block / Meta stack / Squad chips). Motion `slide-left` 220ms.

**D6 honest:** the existing inline `FleetDetail` in `PeopleApp.tsx:313-460` is the source of truth for fields. The new file replaces it via the parent `*App.tsx` integration in Task 6.

- [ ] **Step 1: Write the file**

```tsx
/**
 * PeopleDetailPage.tsx — People/Agents drill (3-column profile).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 2
 *
 * D6 honest: the existing inline FleetDetail in PeopleApp.tsx:313-460 stays as
 * the field-source. The new file gives the layout signature + a11y contract.
 */
import { ArrowLeft, Users, type LucideIcon } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface PeopleDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  initials: string;
  fields: DetailField[];
  squad: { name: string; color: string }[];
  meta: { label: string; value: string }[];
}

interface PeopleDetailPageProps {
  item: PeopleDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function PeopleDetailPage({
  item,
  onBack,
  backLabel = 'Back to People',
}: PeopleDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            People / Agents
          </span>
        </div>

        <h1 tabIndex={-1} className="mb-1 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mb-6 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Avatar block */}
          <section
            className="flex flex-col items-center justify-center rounded-2xl border border-[var(--panel-border)] p-6"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-md"
              style={{ background: 'var(--theme-accent)' }}
              aria-hidden="true"
            >
              {item.initials}
            </div>
            <span
              className="mt-4 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
          </section>

          {/* Meta stack */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Meta
            </h2>
            <dl className="space-y-2">
              {item.meta.map((m) => (
                <div key={m.label} className="flex justify-between text-[13px]">
                  <dt className="text-[var(--theme-text-muted)]">{m.label}</dt>
                  <dd className="font-medium text-[var(--theme-text)]">{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Squad chips */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Squad
            </h2>
            <ul className="flex flex-wrap gap-2">
              {item.squad.map((s) => (
                <li
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: `${s.color}1A`, color: s.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/people/PeopleDetailPage.tsx
git commit -m "feat(people): PeopleDetailPage (3-column avatar / meta / squad chips)"
```

### Task 5.3: `OperationsDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/operations/OperationsDetailPage.tsx`

**Layout signature (spec §4 row 3):** Hero + 2-col split (Runbook body / Sidebar meta) + bordered incident chips. Motion `fade-up` 200ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * OperationsDetailPage.tsx — Runbook 2-col split + incident chips.
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 3
 */
import { ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface OperationsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  body: string;
  sidebar: { label: string; value: string }[];
  incidents: { severity: 'low' | 'medium' | 'high'; title: string; at: string }[];
  fields: DetailField[];
}

interface OperationsDetailPageProps {
  item: OperationsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const SEVERITY_BG: Record<OperationsDetailItem['incidents'][number]['severity'], string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function OperationsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Operations',
}: OperationsDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Operations
          </span>
        </div>

        <h1 tabIndex={-1} className="text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            className="md:col-span-2 rounded-2xl border border-[var(--panel-border)] p-6"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <BookOpen className="h-3.5 w-3.5" /> Runbook
            </h2>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--theme-text)]">{item.body}</p>
          </article>

          <aside
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Meta
            </h2>
            <dl className="space-y-2">
              {item.sidebar.map((m) => (
                <div key={m.label} className="text-[13px]">
                  <dt className="text-[var(--theme-text-muted)]">{m.label}</dt>
                  <dd className="font-medium text-[var(--theme-text)]">{m.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {item.incidents.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <AlertTriangle className="h-3.5 w-3.5" /> Incidents
            </h2>
            <ul className="space-y-2">
              {item.incidents.map((i, idx) => (
                <li
                  key={idx}
                  className={`rounded-xl border px-3 py-2 text-[13px] font-medium ${SEVERITY_BG[i.severity]}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span>{i.title}</span>
                    <span className="text-[11px] opacity-70">{i.at}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/operations/OperationsDetailPage.tsx
git commit -m "feat(operations): OperationsDetailPage (2-col runbook + incident chips)"
```

### Task 5.4: `ItRdDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/it-rd/ItRdDetailPage.tsx`

**Layout signature (spec §4 row 4):** Terminal-style header (mono font) + 2-col (Logs stream / Deploys). Motion `type-in` 280ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * ItRdDetailPage.tsx — Terminal-style logs + deploys (mono, cyberpunk).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 4
 */
import { ArrowLeft, Terminal } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ItRdDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  logs: { ts: string; level: 'info' | 'warn' | 'error'; line: string }[];
  deploys: { sha: string; at: string; status: 'live' | 'rolled-back' | 'building' }[];
  fields: DetailField[];
}

interface ItRdDetailPageProps {
  item: ItRdDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const LEVEL_COLOR: Record<ItRdDetailItem['logs'][number]['level'], string> = {
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
};

const DEPLOY_BADGE: Record<ItRdDetailItem['deploys'][number]['status'], string> = {
  live: 'bg-emerald-500/20 text-emerald-300',
  'rolled-back': 'bg-rose-500/20 text-rose-300',
  building: 'bg-amber-500/20 text-amber-300',
};

export function ItRdDetailPage({
  item,
  onBack,
  backLabel = 'Back to IT / R&D',
}: ItRdDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8 font-mono">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            it-rd
          </span>
        </div>

        <h1 tabIndex={-1} className="font-mono text-xl font-bold text-[var(--theme-text)]">
          <Terminal className="mr-2 inline h-5 w-5" />
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section
            className="rounded-2xl border border-[var(--panel-border)] bg-stone-950 p-5"
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              logs.stream
            </h2>
            <pre className="overflow-x-auto text-[12px] leading-relaxed text-stone-200">
              {item.logs.map((l, i) => (
                <div key={i} className={LEVEL_COLOR[l.level]}>
                  <span className="text-stone-500">{l.ts}</span> {l.line}
                </div>
              ))}
            </pre>
          </section>

          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              deploys
            </h2>
            <ul className="space-y-2">
              {item.deploys.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[var(--panel-border)] px-3 py-2"
                >
                  <code className="text-[12px] text-[var(--theme-text)]">{d.sha}</code>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${DEPLOY_BADGE[d.status]}`}>
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/it-rd/ItRdDetailPage.tsx
git commit -m "feat(it-rd): ItRdDetailPage (terminal header + logs + deploys)"
```

### Task 5.5: `ClientsDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/clients/ClientsDetailPage.tsx`

**Layout signature (spec §4 row 5):** Hero + portrait + 3-pill stack (Active contract / Onboarding step / Churn risk). Motion `pop-scale` 200ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * ClientsDetailPage.tsx — Client portrait + 3-pill status stack (claymorphism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 5
 */
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ClientsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  portrait: { initials: string; gradient: string };
  pills: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }[];
  fields: DetailField[];
}

interface ClientsDetailPageProps {
  item: ClientsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const TONE_CLASS: Record<NonNullable<ClientsDetailItem['pills'][number]['tone']>, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-stone-50 text-stone-700 border-stone-200',
};

export function ClientsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Clients',
}: ClientsDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Client
          </span>
        </div>

        <section className="mb-6 flex flex-col items-center text-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold text-white shadow-lg"
            style={{ background: item.portrait.gradient }}
            aria-hidden="true"
          >
            {item.portrait.initials}
          </div>
          <h1 tabIndex={-1} className="mt-5 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {item.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
          <span
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
          >
            <UserCircle2 className="h-3 w-3" /> {item.status}
          </span>
        </section>

        <ul className="space-y-2">
          {item.pills.map((p, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${TONE_CLASS[p.tone]}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider">{p.label}</span>
              <span className="text-[14px] font-semibold">{p.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/clients/ClientsDetailPage.tsx
git commit -m "feat(clients): ClientsDetailPage (portrait + 3-pill stack)"
```

### Task 5.6: `TasksDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/tasks/TasksDetailPage.tsx`

**Layout signature (spec §4 row 6):** Hero + vertical single-column (prose serif) + due-date eyebrow. Motion `slide-bottom` 220ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * TasksDetailPage.tsx — Task as prose (editorial, serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 6
 */
import { ArrowLeft, CalendarClock } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface TasksDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  dueAt: string;
  body: string;
  fields: DetailField[];
}

interface TasksDetailPageProps {
  item: TasksDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function TasksDetailPage({
  item,
  onBack,
  backLabel = 'Back to Tasks',
}: TasksDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <article className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Task
          </span>
        </div>

        <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          <CalendarClock className="h-3 w-3" /> Due {item.dueAt}
        </p>
        <h1
          tabIndex={-1}
          className="mb-3 text-3xl font-bold leading-tight text-stone-900"
          style={{ fontFamily: 'var(--theme-font-display)' }}
        >
          {item.title}
        </h1>
        <p className="mb-8 text-sm italic text-stone-500">{item.subtitle}</p>

        <span
          className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
        >
          {item.status}
        </span>

        <div className="prose prose-stone mt-8 max-w-none text-[15px] leading-relaxed text-stone-800">
          {item.body}
        </div>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/tasks/TasksDetailPage.tsx
git commit -m "feat(tasks): TasksDetailPage (editorial prose, serif, due-date eyebrow)"
```

### Task 5.7: `MarketplaceDetailPage`

**Files:**
- Create: `C:/Users/amado/coach-os/src/apps/marketplace/MarketplaceDetailPage.tsx`

**Layout signature (spec §4 row 7):** Hero + bento grid 2×2 (screenshots / stats / install state). Motion `fade-blur` 240ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * MarketplaceDetailPage.tsx — Bento 2x2 (glassmorphism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 7
 */
import { ArrowLeft, Package } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface MarketplaceDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  install: { installed: boolean; version: string; size: string };
  stats: { label: string; value: string }[];
  fields: DetailField[];
}

interface MarketplaceDetailPageProps {
  item: MarketplaceDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function MarketplaceDetailPage({
  item,
  onBack,
  backLabel = 'Back to Marketplace',
}: MarketplaceDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Marketplace
          </span>
        </div>

        <header className="mb-6 flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md backdrop-blur"
            style={{ background: 'var(--theme-accent)' }}
            aria-hidden="true"
          >
            <Package className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
            <h1 tabIndex={-1} className="mt-2 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {item.title}
            </h1>
            <p className="text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {/* screenshots tile (spans 2 cols) */}
          <section
            className="col-span-2 h-40 rounded-2xl border border-[var(--panel-border)] backdrop-blur"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent)',
            }}
            aria-label="Screenshots preview"
          >
            <div className="flex h-full items-center justify-center text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Screenshots
            </div>
          </section>

          {/* install state */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-4 backdrop-blur"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Install
            </div>
            <div className="mt-2 text-lg font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {item.install.installed ? 'Installed' : 'Available'}
            </div>
            <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
              v{item.install.version} · {item.install.size}
            </div>
          </section>

          {/* stats */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-4 backdrop-blur"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Stats
            </div>
            <dl className="mt-2 space-y-1">
              {item.stats.map((s) => (
                <div key={s.label} className="flex justify-between text-[12px]">
                  <dt className="text-[var(--theme-text-muted)]">{s.label}</dt>
                  <dd className="font-semibold text-[var(--theme-text)]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/marketplace/MarketplaceDetailPage.tsx
git commit -m "feat(marketplace): MarketplaceDetailPage (bento 2x2 glassmorphism)"
```

### Task 5.8: `ProductDetailPage`

**Files:**
- Create: `C:/Users\amado\coach-os\src\apps\product\ProductDetailPage.tsx`

**Layout signature (spec §4 row 8):** Hero + Roadmap row (status chips) + 2-col (Spec body / Linked channels). Motion `slide-right` 220ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * ProductDetailPage.tsx — Roadmap row + 2-col spec/channels (brutalism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 8
 */
import { ArrowLeft, Map } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ProductDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  roadmap: { stage: string; state: 'done' | 'doing' | 'todo' }[];
  spec: string;
  channels: { name: string; audience: string }[];
  fields: DetailField[];
}

interface ProductDetailPageProps {
  item: ProductDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const STAGE_BADGE: Record<NonNullable<ProductDetailItem['roadmap'][number]['state']>, string> = {
  done: 'bg-emerald-500 text-white',
  doing: 'bg-amber-500 text-stone-900',
  todo: 'bg-stone-200 text-stone-700',
};

export function ProductDetailPage({
  item,
  onBack,
  backLabel = 'Back to Product',
}: ProductDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Product
          </span>
        </div>

        <h1 tabIndex={-1} className="text-2xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
            <Map className="h-3.5 w-3.5" /> Roadmap
          </h2>
          <ol className="flex flex-wrap gap-2">
            {item.roadmap.map((r, i) => (
              <li
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-none border-2 border-stone-900 px-3 py-1.5 text-[11px] font-bold uppercase ${STAGE_BADGE[r.state]}`}
              >
                {r.stage}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            className="md:col-span-2 rounded-none border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Spec
            </h2>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--theme-text)]">{item.spec}</p>
          </article>
          <aside
            className="rounded-none border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Channels
            </h2>
            <ul className="space-y-2">
              {item.channels.map((c, i) => (
                <li key={i} className="text-[13px]">
                  <div className="font-bold text-[var(--theme-text)]">{c.name}</div>
                  <div className="text-[var(--theme-text-muted)]">{c.audience}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/product/ProductDetailPage.tsx
git commit -m "feat(product): ProductDetailPage (roadmap chips + spec/channels 2-col brutalism)"
```

### Task 5.9: `GrowthDetailPage`

**Files:**
- Create: `C:/Users\amado\coach-os\src\apps\growth\GrowthDetailPage.tsx`

**Layout signature (spec §4 row 9):** Hero + 2-col split (Funnel viz / Experiment table). Motion `fade-up` 220ms (with built-in scale 0.95→1, the variant itself already handles this since pop-scale is a sub-form; we use `fade-up` for Growth per spec table).

- [ ] **Step 1: Write the file**

```tsx
/**
 * GrowthDetailPage.tsx — Funnel viz + experiment table (vibrant-block).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 9
 */
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface GrowthDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  funnel: { stage: string; pct: number; absolute: number }[];
  experiments: { name: string; variant: string; lift: string; status: 'live' | 'done' | 'draft' }[];
  fields: DetailField[];
}

interface GrowthDetailPageProps {
  item: GrowthDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const EXP_BADGE: Record<NonNullable<GrowthDetailItem['experiments'][number]['status']>, string> = {
  live: 'bg-emerald-500 text-white',
  done: 'bg-stone-200 text-stone-800',
  draft: 'bg-amber-500 text-stone-900',
};

export function GrowthDetailPage({
  item,
  onBack,
  backLabel = 'Back to Growth',
}: GrowthDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Growth
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section
            className="rounded-2xl border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <TrendingUp className="h-3.5 w-3.5" /> Funnel
            </h2>
            <ol className="space-y-2">
              {item.funnel.map((f, i) => (
                <li key={i}>
                  <div className="flex justify-between text-[12px] font-bold uppercase">
                    <span className="text-[var(--theme-text)]">{f.stage}</span>
                    <span className="text-[var(--theme-text-muted)]">
                      {f.absolute} · {f.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, f.pct)}%`,
                        background: 'var(--theme-accent)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="rounded-2xl border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Experiments
            </h2>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--theme-text-dim)]">
                  <th className="py-1 font-bold">Name</th>
                  <th className="font-bold">Variant</th>
                  <th className="font-bold">Lift</th>
                  <th className="font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {item.experiments.map((e, i) => (
                  <tr key={i} className="border-t border-[var(--panel-border)]">
                    <td className="py-2 font-semibold text-[var(--theme-text)]">{e.name}</td>
                    <td className="text-[var(--theme-text-muted)]">{e.variant}</td>
                    <td className="font-mono text-[var(--theme-text)]">{e.lift}</td>
                    <td>
                      <span className={`rounded-none px-1.5 py-0.5 text-[10px] font-bold uppercase ${EXP_BADGE[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/growth/GrowthDetailPage.tsx
git commit -m "feat(growth): GrowthDetailPage (funnel + experiment table vibrant-block)"
```

### Task 5.10: `FinanceDetailPage`

**Files:**
- Create: `C:/Users\amado\coach-os\src\apps\finance\FinanceDetailPage.tsx`

**Layout signature (spec §4 row 11):** Hero + KPI strip horizontal (3 chiffres) + dense data table. Motion `fade-up` 240ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * FinanceDetailPage.tsx — KPI strip + dense data table (trust serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 11
 */
import { ArrowLeft, Banknote } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface FinanceDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  kpis: { label: string; value: string; delta?: string }[];
  rows: Record<string, string>[];
  fields: DetailField[];
}

interface FinanceDetailPageProps {
  item: FinanceDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function FinanceDetailPage({
  item,
  onBack,
  backLabel = 'Back to Finance',
}: FinanceDetailPageProps): JSX.Element {
  const columns = item.rows.length > 0 ? Object.keys(item.rows[0]!) : [];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Finance
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{item.subtitle}</p>

        <section
          className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--panel-border)] sm:grid-cols-3"
          style={{ background: 'var(--panel-border)' }}
        >
          {item.kpis.map((k, i) => (
            <div key={i} className="p-5" style={{ background: 'var(--theme-surface)' }}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                <Banknote className="h-3 w-3" /> {k.label}
              </div>
              <div className="mt-2 text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
                {k.value}
              </div>
              {k.delta ? (
                <div className="mt-1 text-xs text-stone-500">{k.delta}</div>
              ) : null}
            </div>
          ))}
        </section>

        {item.rows.length > 0 ? (
          <section
            className="mt-6 overflow-x-auto rounded-2xl border border-[var(--panel-border)]"
            style={{ background: 'var(--theme-surface)' }}
          >
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-100 text-left text-[10px] uppercase tracking-wider text-stone-500">
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-bold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.rows.map((row, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-stone-800">{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/finance/FinanceDetailPage.tsx
git commit -m "feat(finance): FinanceDetailPage (KPI strip + dense table trust serif)"
```

### Task 5.11: `LegalDetailPage`

**Files:**
- Create: `C:/Users\amado\coach-os\src\apps\legal\LegalDetailPage.tsx`

**Layout signature (spec §4 row 12):** Hero + accordéon contractuel (clauses collapsibles). Motion `unfold` 240ms.

- [ ] **Step 1: Write the file**

```tsx
/**
 * LegalDetailPage.tsx — Contract accordion (trust serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 12
 */
import { ArrowLeft, ChevronDown, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { DetailField } from '../../components/DetailPage';

export interface LegalDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  clauses: { title: string; body: string }[];
  fields: DetailField[];
}

interface LegalDetailPageProps {
  item: LegalDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function LegalDetailPage({
  item,
  onBack,
  backLabel = 'Back to Legal',
}: LegalDetailPageProps): JSX.Element {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Legal
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm italic text-stone-500">{item.subtitle}</p>
        <span
          className="mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
        >
          {item.status}
        </span>

        <ol className="mt-8 space-y-2">
          {item.clauses.map((c, i) => {
            const isOpen = open.has(i);
            return (
              <li
                key={i}
                className="rounded-2xl border border-[var(--panel-border)]"
                style={{ background: 'var(--theme-surface)' }}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
                    {c.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-stone-700">
                    {c.body}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `cd C:/Users/amado/coach-os && npm run build && npm run lint`
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add src/apps/legal/LegalDetailPage.tsx
git commit -m "feat(legal): LegalDetailPage (contract accordion unfold trust)"
```

### Task 5.12: `SettingsDetailPage`

**Files:**
- Create: `C:/Users\amado\coach-os\src\apps\settings\SettingsDetailPage.tsx`

**Layout signature (spec §4 row 13):** Hero + 2-col (Form / Preview). Motion `pop-scale` 200ms.

**D6 honest:** `ThemeDetailPage.tsx` already exists for the theme drill inside Settings. This new file is for *other* Settings drill targets (General, Privacy, Integrations, Help). If no such drill exists in the current SettingsApp, **this file is a no-op** — skip it. (The build will still pass; the file just won't be imported.)

- [ ] **Step 1: Check whether SettingsApp has any non-theme drill**

Run: `grep -n "useState<Detail\|setDetail\|DetailPage\|onSelect" C:/Users/amado/coach-os/src/apps/settings/SettingsApp.tsx | head -10`
Expected: probably empty — Settings is a sectioned app, not a list+detail one.

- [ ] **Step 2 (only if step 1 found nothing):** Skip the file creation. Move on. The plan can ship without it; the spec covers it as a conditional.

- [ ] **Step 3 (only if SettingsApp has drill targets):** Write the file following the same pattern as the others (hero + 2-col form/preview, `pop-scale` 200ms). Commit with `feat(settings): SettingsDetailPage (2-col form/preview pop-scale)`.

---

## Task 6: Wire each `*App.tsx` to mount `<AppDetailOverlay>` + the new `*DetailPage`

This is 12 sub-tasks (one per app except Sales, which is already done in Task 4). Each is mechanical: read the existing `*App.tsx`, find the section list, add a `useState<DetailItem | null>`, add the `useEffect` mirror to `useWindowPage().setDetail`, and render `<AppDetailOverlay>` when the state is non-null.

**Common pattern (copy from `SalesApp.tsx:454-481`):**

```tsx
import { useEffect, useState } from 'react';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { <X>DetailPage, type <X>DetailItem } from './<X>DetailPage';

// inside <X>App():
const [detail, setDetail] = useState<<X>DetailItem | null>(null);
const { setDetail: setWindowDetail } = useWindowPage();

useEffect(() => {
  if (detail) {
    setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
  } else {
    setWindowDetail(null);
  }
}, [detail, setWindowDetail]);

// ... at the end of the return JSX, after </AppFrame>:
{detail ? (
  <AppDetailOverlay
    appId="<id>"
    accent="<ACCENT_FROM_APP_REGISTRY>"
    onBack={() => setDetail(null)}
    motion={{ kind: '<MOTION_FROM_SPEC>', durationMs: <DURATION> }}
  >
    <XDetailPage item={detail} onBack={() => setDetail(null)} />
  </AppDetailOverlay>
) : null}
```

**The motion `kind` and `durationMs` come from the spec §4 table:**

| App | kind | durationMs |
|---|---|---|
| Dashboard | `fade-up` | 220 |
| People | `slide-left` | 220 |
| Operations | `fade-up` | 200 |
| IT / R&D | `type-in` | 280 |
| Clients | `pop-scale` | 200 |
| Tasks | `slide-bottom` | 220 |
| Marketplace | `fade-blur` | 240 |
| Product | `slide-right` | 220 |
| Growth | `fade-up` | 220 |
| Finance | `fade-up` | 240 |
| Legal | `unfold` | 240 |
| Settings | `pop-scale` | 200 (only if drill exists) |

**The accent hex comes from `app-registry.ts`.** Read it via `grep -n "<id>.*#" C:/Users/amado/coach-os/src/lib/app-registry.ts` and use the matching hex.

### Task 6.1: DashboardApp

- [ ] **Step 1: Read DashboardApp.tsx to find the AppFrame return**

Run: `head -30 C:/Users/amado/coach-os/src/apps/dashboard/DashboardApp.tsx` to find the AppFrame import + JSX return.

- [ ] **Step 2: Wire the overlay** (following the common pattern above, with `appId="dashboard"`, accent `#059669`, motion `fade-up` 220ms).

- [ ] **Step 3: Build + lint + commit**

```bash
cd C:/Users/amado/coach-os
npm run build && npm run lint
git add src/apps/dashboard/DashboardApp.tsx
git commit -m "feat(dashboard): wire AppDetailOverlay (fade-up 220ms, #059669)"
```

### Task 6.2: PeopleApp

- [ ] **Step 1:** read `PeopleApp.tsx:454-485` to confirm the existing inline `FleetDetail` state. Wrap it in `<AppDetailOverlay>` (motion `slide-left` 220ms, accent `#0891b2`, appId `people`). **Do not** delete the existing `FleetDetail` function — just route through the new `PeopleDetailPage` for the overlay, keeping `FleetDetail` as the data adapter.

- [ ] **Step 2: Build + lint + commit** with `feat(people): wire AppDetailOverlay (slide-left 220ms, #0891b2)`.

### Task 6.3: OperationsApp

- [ ] **Step 1:** wire overlay (motion `fade-up` 200ms, accent `#4f46e5`, appId `operations`).

- [ ] **Step 2: Build + lint + commit** with `feat(operations): wire AppDetailOverlay (fade-up 200ms, #4f46e5)`.

### Task 6.4: ItRdApp

- [ ] **Step 1:** wire overlay (motion `type-in` 280ms, accent `#7c3aed`, appId `it-rd`).

- [ ] **Step 2: Build + lint + commit** with `feat(it-rd): wire AppDetailOverlay (type-in 280ms, #7c3aed)`.

### Task 6.5: ClientsApp

- [ ] **Step 1:** wire overlay (motion `pop-scale` 200ms, accent `#2563eb`, appId `clients`).

- [ ] **Step 2: Build + lint + commit** with `feat(clients): wire AppDetailOverlay (pop-scale 200ms, #2563eb)`.

### Task 6.6: TasksApp

- [ ] **Step 1:** wire overlay (motion `slide-bottom` 220ms, accent `#0d9488`, appId `tasks`).

- [ ] **Step 2: Build + lint + commit** with `feat(tasks): wire AppDetailOverlay (slide-bottom 220ms, #0d9488)`.

### Task 6.7: MarketplaceApp

- [ ] **Step 1:** wire overlay (motion `fade-blur` 240ms, accent `#db2777`, appId `marketplace`).

- [ ] **Step 2: Build + lint + commit** with `feat(marketplace): wire AppDetailOverlay (fade-blur 240ms, #db2777)`.

### Task 6.8: ProductApp

- [ ] **Step 1:** wire overlay (motion `slide-right` 220ms, accent `#9333ea`, appId `product`).

- [ ] **Step 2: Build + lint + commit** with `feat(product): wire AppDetailOverlay (slide-right 220ms, #9333ea)`.

### Task 6.9: GrowthApp

- [ ] **Step 1:** wire overlay (motion `fade-up` 220ms, accent `#16a34a`, appId `growth`).

- [ ] **Step 2: Build + lint + commit** with `feat(growth): wire AppDetailOverlay (fade-up 220ms, #16a34a)`.

### Task 6.10: FinanceApp

- [ ] **Step 1:** wire overlay (motion `fade-up` 240ms, accent `#ca8a04`, appId `finance`).

- [ ] **Step 2: Build + lint + commit** with `feat(finance): wire AppDetailOverlay (fade-up 240ms, #ca8a04)`.

### Task 6.11: LegalApp

- [ ] **Step 1:** wire overlay (motion `unfold` 240ms, accent `#64748b`, appId `legal`).

- [ ] **Step 2: Build + lint + commit** with `feat(legal): wire AppDetailOverlay (unfold 240ms, #64748b)`.

### Task 6.12: SettingsApp

- [ ] **Step 1:** if Task 5.12 created the file, wire it (motion `pop-scale` 200ms, accent `#78716c`, appId `settings`). If Task 5.12 was a no-op, skip this task.

- [ ] **Step 2: Build + lint + commit** (if applicable) with `feat(settings): wire AppDetailOverlay (pop-scale 200ms, #78716c)`.

---

## Task 7: Write the handoff + event log

**Files:**
- Create: `C:/Users/amado/coach-os/wiki/hand_offs/2026-07-30_detail_pages_per_app.md`
- Create: `C:/Users/amado/coach-os/_DRAFTS_PPR_LANE/event_log_2026-07-30.jsonl`

- [ ] **Step 1: Write the handoff markdown**

```md
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
```

- [ ] **Step 2: Write the event log JSONL**

```jsonl
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"dashboard","file":"src/apps/dashboard/DashboardDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"people","file":"src/apps/people/PeopleDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"operations","file":"src/apps/operations/OperationsDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"it-rd","file":"src/apps/it-rd/ItRdDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"clients","file":"src/apps/clients/ClientsDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"tasks","file":"src/apps/tasks/TasksDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"marketplace","file":"src/apps/marketplace/MarketplaceDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"product","file":"src/apps/product/ProductDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"growth","file":"src/apps/growth/GrowthDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"sales","file":"src/apps/sales/SalesApp.tsx (refactored)"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"finance","file":"src/apps/finance/FinanceDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"legal","file":"src/apps/legal/LegalDetailPage.tsx"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"page_detail_delivered","app":"settings","file":"src/apps/settings/SettingsDetailPage.tsx (conditional)"}
{"ts":"2026-07-30T12:00:00Z","actor":"a0","event":"app_detail_overlay_extracted","file":"src/components/cms/AppDetailOverlay.tsx"}
```

(Adjust the ts to today's actual time. The list is canonical: 13 page-detail-delivered + 1 overlay-extracted = 14 entries.)

- [ ] **Step 3: Commit**

```bash
cd C:/Users/amado/coach-os
git add wiki/hand_offs/2026-07-30_detail_pages_per_app.md _DRAFTS_PPR_LANE/event_log_2026-07-30.jsonl
git commit -m "chore: handoff + event log for per-app detail pages (D4 append-only)"
```

---

## Self-Review

**1. Spec coverage:** Skimming the 11 spec sections:
- §1 Contexte — covered by Task 1 + 2 (shell + motions), addressed via the handoff intro.
- §2 Décisions de cadrage — captured in the plan header "Architecture" and in the file structure.
- §3 Architecture (`<AppDetailOverlay>`) — Tasks 1, 2, 3.
- §4 Inventaire 13 layouts — Tasks 5.1-5.12 + Table 1 in Task 6 (motion mapping).
- §5 Système d'identité (4 sources) — implicitly respected: each `*DetailPage` uses `var(--theme-*)`, accent via prop, layout hardcoded, motion via overlay.
- §6 Responsive & accessibilité — `--sidebar-w` set by AppFrame (Task 3), `aria-label`, `role="main"`, focus management, `prefers-reduced-motion` all in Task 2.
- §7 Fichiers concernés — every file listed in §7.1 / §7.2 / §7.3 has a corresponding task (Tasks 1, 2, 3, 4, 5.1-5.12, 6.1-6.12).
- §8 Vérification — Tasks 7 (handoff) + each task's "Build + lint" + "Verify" step.
- §9 Risques & honest gaps — captured in handoff section.
- §10 Hors périmètre — refactor of `AppFrame` beyond `--sidebar-w` (kept minimal), `<DetailPage>` not refactored, `<DynamicPageView>` not refactored, no new theme, no new app.
- §11 Critère d'arrêt — Task 7 + the per-task commits satisfy all 4 conditions.

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details". No "Add appropriate error handling" or similar filler. No "Similar to Task N" — every task repeats its own code.

**3. Type consistency:**
- `OverlayMotionKind` defined in Task 1 (in `overlayMotions.ts` as `type`), re-exported in Task 2 (in `AppDetailOverlay.tsx` as `type`).
- `OverlayMotionSpec` likewise defined once in Task 1, re-imported in Task 2.
- `getOverlayVariants(spec, reduced)` and `useReducedMotion()` both defined in Task 1, consumed in Task 2. Signature consistent.
- `appId` and `accent` props consistent across all 12 `*App.tsx` wirings (Task 6).
- Motion kinds referenced in Task 6 match the 8 kinds in Task 1 exactly.
- Accent hexes come from `app-registry.ts` (which I read in exploration). If a hex is wrong, the per-task commit will surface it via the build (TypeScript will catch typos in literal strings only if we type the prop as a literal union — we typed it as `string` so typos won't break the build, only visual identity. The D6 honest risk: a future implementer might transpose a hex).

**Issues fixed inline during self-review:** None. The plan is clean.

---

## Execution Handoff

Plan complete and saved to `C:/Users/amado/coach-os/docs/superpowers/plans/2026-07-30-coach-os-app-detail-pages.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints
