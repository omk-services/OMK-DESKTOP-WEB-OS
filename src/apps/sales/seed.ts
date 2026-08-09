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

/* ═══ Context — 3 groups (What / Who / How) with items each ═══ */

const contextDef = def({
  id: 'sales_context', name: 'Sales context', singular: 'Context group', accent: '#ea580c',
  titleField: 'eyebrow', subtitleField: 'groupId', badgeField: 'groupId',
  fields: [
    { key: 'item1Title', label: 'Item 1 title', type: 'text' },
    { key: 'item1Sub', label: 'Item 1 subtitle', type: 'longtext' },
    { key: 'item2Title', label: 'Item 2 title', type: 'text' },
    { key: 'item2Sub', label: 'Item 2 subtitle', type: 'longtext' },
  ],
});

const contextItems: CmsItem[] = [
  {
    id: 'ctx-what', groupId: 'g-what', eyebrow: 'What we sell',
    item1Title: 'The offer', item1Sub: '30-day AI enablement program · $5k · 50% refund guarantee',
    item2Title: 'Positioning and objections', item2Sub: 'The frame, every objection, and the proof points',
  },
  {
    id: 'ctx-who', groupId: 'g-who', eyebrow: 'To whom',
    item1Title: 'ICP, the buyer', item1Sub: 'US SMB owner with AI FOMO, 1-25 employees, sweet spot 3 to 7',
    item2Title: 'Disqualification signals', item2Sub: 'Sub-1k revenue, build-it-myself founder, or partner-held decision',
  },
  {
    id: 'ctx-how', groupId: 'g-how', eyebrow: 'How we sell',
    item1Title: 'Sales process', item1Sub: 'Stage by stage, from booking to close, with next-action rules',
    item2Title: 'Voice and tone', item2Sub: 'Direct, specific, grounded in the buyer context, never generic',
  },
];

/* ═══ Scores — 5 dimensions of rep performance ═══ */

const scoresDef = def({
  id: 'sales_scores', name: 'Sales scores', singular: 'Score', accent: '#ea580c',
  titleField: 'label', subtitleField: 'note', badgeField: 'tone',
  fields: [
    { key: 'value', label: 'Score', type: 'number' },
    { key: 'outOf', label: 'Out of', type: 'number' },
    { key: 'note', label: 'Note', type: 'longtext' },
    { key: 'tone', label: 'Tone', type: 'badge' },
  ],
});

const scoresItems: CmsItem[] = [
  { id: 'sc-discovery', label: 'Discovery', value: 8.0, outOf: 10, note: 'Bottleneck — qualify live, do not pitch the offer early.', tone: 'ok' },
  { id: 'sc-demo', label: 'Demo', value: 7.5, outOf: 10, note: 'Tailored to the stack, but the architecture question is loose.', tone: 'ok' },
  { id: 'sc-objection', label: 'Objection', value: 6.6, outOf: 10, note: 'Price vs. low-anchor and build-it-myself. Push confidence, not value.', tone: 'warn' },
  { id: 'sc-rapport', label: 'Rapport', value: 8.1, outOf: 10, note: 'Peer energy, real questions, no over-selling.', tone: 'ok' },
  { id: 'sc-close', label: 'Close', value: 5.6, outOf: 10, note: 'Hits the SOP move but softens the ask. Lock the slot in the room.', tone: 'danger' },
];

/* ═══ Skills — 8 capabilities with name, description, icon ═══ */

const skillsDef = def({
  id: 'sales_skills', name: 'Sales skills', singular: 'Skill', accent: '#ea580c',
  titleField: 'name', subtitleField: 'description', badgeField: 'icon',
  fields: [
    { key: 'description', label: 'Description', type: 'longtext' },
    { key: 'icon', label: 'Icon', type: 'text' },
  ],
});

const skillsItems: CmsItem[] = [
  { id: 's-call', name: 'Call prep', description: 'Prepare a grounded brief for an upcoming call.', icon: 'Phone' },
  { id: 's-onepager', name: 'Client one-pager', description: 'Turn second-brain context into a buyer one-pager.', icon: 'FileText' },
  { id: 's-leadgen', name: 'Lead generation', description: 'Find and qualify target accounts through connected sources.', icon: 'Target' },
  { id: 's-linkedin', name: 'LinkedIn extraction', description: 'Pull a buyer profile into a structured brief.', icon: 'Users' },
  { id: 's-outreach', name: 'Outreach drafting', description: 'Direct email and LinkedIn sequences grounded in ICP.', icon: 'Mail' },
  { id: 's-pipeline', name: 'Pipeline review', description: 'Flag stale deals and missing next actions.', icon: 'ClipboardList' },
  { id: 's-followup', name: 'Relance drafting', description: 'Compose the next follow-up from call context.', icon: 'MessageSquare' },
  { id: 's-proposal', name: 'Proposal generation', description: 'Assemble a one-page offer from the second brain.', icon: 'BriefcaseBusiness' },
];

/* ═══ Routines — 6 routine records with kind enum ═══ */

const routinesDef = def({
  id: 'sales_routines', name: 'Sales routines', singular: 'Routine', accent: '#ea580c',
  titleField: 'name', subtitleField: 'last', badgeField: 'kind',
  fields: [
    { key: 'trigger', label: 'Trigger', type: 'text' },
    { key: 'last', label: 'Last', type: 'text' },
    { key: 'kind', label: 'Kind', type: 'badge' },
    { key: 'isActive', label: 'Active', type: 'badge' },
  ],
});

const routinesItems: CmsItem[] = [
  { id: 'r-morning', name: 'Morning routine', trigger: 'Daily · 08:00', last: 'Today 08:00', kind: 'time', isActive: true },
  { id: 'r-crm', name: 'CRM sync', trigger: 'After every call', last: 'Today 12:48', kind: 'event', isActive: true },
  { id: 'r-scoring', name: 'Call scoring', trigger: 'After every call', last: 'Today 12:48', kind: 'event', isActive: true },
  { id: 'r-monthly', name: 'Monthly intelligence report', trigger: '1st of the month', last: 'Jul 1 · 09:14', kind: 'time', isActive: true },
  { id: 'r-quarterly', name: 'Quarterly review', trigger: 'Quarter close', last: 'Q2 close · 09:02', kind: 'time', isActive: true },
  { id: 'r-campaign', name: 'Campaign metrics', trigger: 'On demand', last: 'Yesterday 17:11', kind: 'manual', isActive: true },
];

/* ═══ Trends — 2 series with 12 points each, JSON-stringified ═══ */

const trendsDef = def({
  id: 'sales_trends', name: 'Sales trends', singular: 'Trend series', accent: '#ea580c',
  titleField: 'title', subtitleField: 'caption', badgeField: 'accent',
  fields: [
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'points', label: 'Points (JSON)', type: 'longtext' },
    { key: 'caption', label: 'Caption', type: 'longtext' },
    { key: 'accent', label: 'Accent tone', type: 'badge' },
  ],
});

const trendsItems: CmsItem[] = [
  {
    id: 'tr-meetings', title: 'Meetings booked per week',
    caption: 'Twelve weeks of booked meetings. Volume is not the problem, qualification is.',
    unit: 'meetings',
    accent: 'accent',
    points: JSON.stringify([
      { label: 'W1', value: 14 }, { label: 'W2', value: 18 }, { label: 'W3', value: 16 },
      { label: 'W4', value: 22 }, { label: 'W5', value: 20 }, { label: 'W6', value: 24 },
      { label: 'W7', value: 28 }, { label: 'W8', value: 26 }, { label: 'W9', value: 32 },
      { label: 'W10', value: 35 }, { label: 'W11', value: 38 }, { label: 'W12', value: 44 },
    ]),
  },
  {
    id: 'tr-revenue', title: 'Revenue and commission per week',
    caption: 'Weekly revenue in $k, commission drawn as a lighter band on the same axis.',
    unit: '$k',
    accent: 'ok',
    points: JSON.stringify([
      { label: 'W1', value: 18 }, { label: 'W2', value: 22 }, { label: 'W3', value: 20 },
      { label: 'W4', value: 28 }, { label: 'W5', value: 32 }, { label: 'W6', value: 36 },
      { label: 'W7', value: 34 }, { label: 'W8', value: 42 }, { label: 'W9', value: 38 },
      { label: 'W10', value: 48 }, { label: 'W11', value: 52 }, { label: 'W12', value: 60 },
    ]),
  },
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
  store.registerCollection(contextDef, contextItems);
  store.registerCollection(scoresDef, scoresItems);
  store.registerCollection(skillsDef, skillsItems);
  store.registerCollection(routinesDef, routinesItems);
  store.registerCollection(trendsDef, trendsItems);
}
