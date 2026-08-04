/**
 * Changelog — dev log for the TopBar's Changelog dropdown.
 *
 * Two kinds:
 *  - 'milestone': shipped work (newest first, what you'd call a release note)
 *  - 'roadmap':   known follow-up, scoped for V0.2+
 *
 * Append-only (D4). When a roadmap item ships, promote it to a milestone
 * rather than mutating history.
 */
export interface ChangelogMilestone {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export interface RoadmapItem {
  /** target version — e.g. 'V0.2', 'V0.3' */
  target: string;
  /** coarse status — open, in_progress, blocked, deferred */
  status: 'open' | 'in_progress' | 'blocked' | 'deferred';
  /** one-line subject */
  title: string;
  /** long-form rationale — what the user said, what we accepted, why */
  context: string;
  /** concrete acceptance criteria — when we tick them all, promote to milestone */
  acceptance: string[];
  /** who owns the work right now — the rank of the E-Myth cascade (B1/B2/B3) */
  owner: 'B1' | 'B2' | 'B3';
}

export const CHANGELOG: ChangelogMilestone[] = [
  {
    version: 'v0.1',
    date: '2026-08-02',
    title: 'Item detail pages — per-app dispatch',
    highlights: [
      'DynamicPageView delegates to per-app `<App>ItemDetail` via registry',
      '12 distinct item-detail layouts aligned with spec §4 (one per app)',
      'Spec-aligned layout signatures: aurora · dark-oled · brutalism · cyberpunk · claymorphism · editorial · glassmorphism · vibrant-block · liquid-glass · trust · warm-paper',
      'AppDetailOverlay accepts the parent content area (left:0) so the sidebar stays visible during drill',
      'Sales content plate stays opaque (fix 5b8fc74 preserved)',
      'Zero hardcoded neutrals in the new code — everything themed via runtime CSS vars',
    ],
  },
  {
    version: 'v0.0.1',
    date: '2026-08-02',
    title: 'Item detail pages — pre-fix rollback',
    highlights: [
      'Dashboard drill crashed the browser (render loop in handleDrill)',
      'AppDetailOverlay hardcoded `bg-white` — broke the runtime theme system',
      'DynamicPageView rendered one generic template for every collection in every sub-page',
      'All hardcoded neutrals (`text-stone-*`, `bg-white`, `#fff`) replaced with theme CSS vars',
    ],
  },
  {
    version: 'v2.0',
    date: '2026-07-30',
    title: 'Per-app detail pages',
    highlights: [
      '13 distinct `*DetailPage` layouts (one per app)',
      'Shared `AppDetailOverlay` shell with motion + a11y',
      '8 Framer Motion variants + reduced-motion short-circuit',
    ],
  },
  {
    version: 'v1.9',
    date: '2026-07-29',
    title: 'Sales Sanctum + Cognition wiring',
    highlights: [
      'SalesApp 6-tab layout (Today, Pipeline, Context, Capabilities, Stack)',
      'Sovereign Gate integration for cognition gating',
      '7 sales routines canon from Supabase',
    ],
  },
  {
    version: 'v1.5',
    date: '2026-07-26',
    title: 'App Detail Pages hotfix',
    highlights: [
      'PeopleApp FleetCard wires to `PeopleDetailPage`',
      '10 apps: drill.openId routes through setDetail',
      'Onboarding auto-launch disabled on plain URL',
    ],
  },
  {
    version: 'v1.0',
    date: '2026-07-15',
    title: 'Coach OS launch',
    highlights: [
      '18 apps registered',
      '12 themes runtime (warm-paper, glassmorphism, brutalism, etc.)',
      'Desktop-web shell with WindowFrame + AppFrame',
      'CMS collections + DynamicPageView + DetailPage',
    ],
  },
];

/**
 * Roadmap — known follow-ups not yet shipped. Each item is scoped tightly
 * enough to be promoted to a milestone on completion rather than mutated.
 */
export const ROADMAP: RoadmapItem[] = [
  {
    target: 'V0.2',
    status: 'open',
    title: 'Sidebar stays visible during item-detail drill',
    context:
      'User feedback (2026-08-02): "j voulais garder la sidebar visible meme quand on est sur les page de details". ' +
      'In V0.1 we shipped the per-app dispatch first because the prior implementation was crashing the browser ' +
      '(render loop in handleDrill) and a generic page for every collection. AppDetailOverlay therefore ' +
      'covers the parent content area (left:0) and the AppFrame sidebar slides under it.',
    acceptance: [
      'AppFrame sidebar (240px wide, 68px in narrow mode) remains interactive when an item-detail is open',
      'AppDetailOverlay only covers the content slot, not the sidebar',
      'Spec §6.1 NARROW_BREAKPOINT = 640 still respected',
      'No regression on the V0.1 dispatch (sidebar interactive + overlay over content, never over the sidebar)',
      'Visual review on at least 3 apps at both sidebar widths',
    ],
    owner: 'B2',
  },
];
