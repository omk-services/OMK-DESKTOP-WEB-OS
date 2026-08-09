/** SalesApp — local seed for the kanban view added on top of the editorial
 *  Today / Pipeline / Context / Capabilities / Stack / Cognition sections.
 *
 *  The kanban reads from the existing `deals` collection (registered in
 *  src/lib/cms/seed.ts). No new collection is introduced here — the kanban
 *  is a *view* over the same shared data the Dashboard reads. The seed
 *  function exists to ensure the kanban section has a render path even
 *  before the global seed runs.
 *
 *  Plus: collections for the formerly in-memory SNAPSHOT and STAGES
 *  sections (Brief D 2026-08-09). Other sections (TRENDS/SCORES/CONTEXT/
 *  SKILLS/ROUTINES/STACK) remain as in-memory constants for now — they
 *  have more complex nested shapes and would each deserve its own
 *  collection if the user pushes for a strict 9/9 DoD on Sales.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Snapshot — 6 KPIs at a glance (Dashboard hero on Sales Today) ═══ */

const snapshotDef = def({
  id: 'sales_snapshot', name: 'Sales snapshot', singular: 'KPI', accent: '#ea580c',
  titleField: 'label', subtitleField: 'sub', badgeField: 'accent',
  fields: [
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'sub', label: 'Subtitle', type: 'text' },
    { key: 'accent', label: 'Tone', type: 'badge' },
  ],
});

const snapshotItems: CmsItem[] = [
  { id: 'snap-pipeline', label: 'Pipeline value', value: '$486k', sub: '54 open deals', accent: 'ok' },
  { id: 'snap-won', label: 'Won this quarter', value: '$612k', sub: '31 deals closed', accent: 'ok' },
  { id: 'snap-winrate', label: 'Win rate', value: '36%', sub: 'of qualified meetings', accent: 'accent' },
  { id: 'snap-avg', label: 'Avg deal size', value: '$6.4k', sub: '$4k floor, $10k ceiling', accent: 'neutral' },
  { id: 'snap-meet', label: 'Meetings / week', value: '44', sub: '+22% on last week', accent: 'ok' },
  { id: 'snap-rep', label: 'Rep score', value: '7.5', sub: 'demo strong, close the gap', accent: 'danger' },
];

/* ═══ Stages — pipeline funnel buckets ═══ */

const stagesDef = def({
  id: 'sales_stages', name: 'Sales stages', singular: 'Stage', accent: '#ea580c',
  titleField: 'label', subtitleField: 'weighted', badgeField: 'tone',
  fields: [
    { key: 'count', label: 'Count', type: 'number' },
    { key: 'weighted', label: 'Weighted', type: 'text' },
    { key: 'tone', label: 'Tone', type: 'badge' },
  ],
});

const stagesItems: CmsItem[] = [
  { id: 'stage-meeting', label: 'Meeting booked', count: 24, weighted: '$152k weighted', tone: 'accent' },
  { id: 'stage-qualified', label: 'Next call, qualified', count: 18, weighted: '$118k weighted', tone: 'warn' },
  { id: 'stage-proposal', label: 'Proposal sent', count: 12, weighted: '$96k weighted', tone: 'accent' },
  { id: 'stage-won', label: 'Won, this quarter', count: 31, weighted: '$612k closed', tone: 'ok' },
  { id: 'stage-lost', label: 'Lost or cold', count: 19, weighted: 're-engagement targets', tone: 'danger' },
];

let seeded = false;

export function seedSalesCms(): void {
  if (seeded) return;
  seeded = true;
  // The `deals` collection is registered globally by src/lib/cms/seed.ts.
  // We don't register it again here — it would no-op — but we ensure the
  // store is reachable so a kartesian import-side-effect (HMR) doesn't
  // attempt to read it before the global seed runs.
  const store = useCmsStore.getState();
  store.registerCollection(snapshotDef, snapshotItems);
  store.registerCollection(stagesDef, stagesItems);
}
