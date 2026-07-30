/**
 * Changelog milestones — dev log for the TopBar's Changelog dropdown.
 * Append-only (D4). Newest first.
 */
export interface ChangelogMilestone {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const CHANGELOG: ChangelogMilestone[] = [
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
