/** LegalApp — local seed for the AI-Act compliance checklist.
 *
 *  The checklist lives in a CMS collection so the toggle state is persisted
 *  with the rest of the tenant data, not just in React state. That is the
 *  whole point of pushing this into the store: a coach who closes the tab
 *  and reopens the app sees the same AI-Act status they last left.
 *
 *  The collection's `badgeField` is `done` (a boolean → 'yes' / 'no') so the
 *  repeater renders the cleared state as a colored pill. The CMSItem also
 *  carries `label` and `description` so the per-item page can render the
 *  full text without the title being truncated.
 *
 *  `seedLegalCms()` is idempotent via the `seeded` flag — HMR-safe.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

const aiActChecksDef = def({
  id: 'legal_ai_act_checks', name: 'AI-Act checks', singular: 'AI-Act check', accent: '#64748b',
  titleField: 'label', subtitleField: 'category', badgeField: 'done',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'done', label: 'Cleared', type: 'badge' },
    { key: 'description', label: 'Description', type: 'longtext' },
    { key: 'clearedAt', label: 'Cleared at', type: 'text' },
  ],
});

const aiActChecksItems: CmsItem[] = [
  {
    id: 'aiact-1',
    label: 'Risk classification documented',
    category: 'Documentation',
    done: 'Yes',
    description: 'Each AI surface in the OS carries a documented risk tier (minimal, limited, high) with the rationale logged in the audit trail.',
    clearedAt: '2026-07-21',
  },
  {
    id: 'aiact-2',
    label: 'Human-in-the-loop on client-facing actions',
    category: 'Safeguards',
    done: 'Yes',
    description: 'Every outbound client action (send, sign, refund) routes through a human approval gate unless an explicit standing consent is on file.',
    clearedAt: '2026-07-21',
  },
  {
    id: 'aiact-3',
    label: 'Transparency notice on AI-drafted content',
    category: 'Disclosure',
    done: 'Yes',
    description: 'Client-facing emails, summaries, and proposals carry a footer tag identifying AI involvement and the model version used.',
    clearedAt: '2026-07-22',
  },
  {
    id: 'aiact-4',
    label: 'Data-processing register up to date',
    category: 'Documentation',
    done: 'No',
    description: 'The Article 30 register of processing activities must reflect every new model deployed in the last quarter. Audit is in progress, target completion 2026-08-15.',
    clearedAt: '—',
  },
  {
    id: 'aiact-5',
    label: 'Incident logging & reporting path',
    category: 'Operations',
    done: 'No',
    description: 'A formal incident-response path for AI-specific failures (output drift, prompt-injection attempts, data leakage) with notification thresholds. Runbook pending.',
    clearedAt: '—',
  },
];

let seeded = false;

export function seedLegalCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(aiActChecksDef, aiActChecksItems);
}
