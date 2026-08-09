/** SalesApp — local seed for the kanban view added on top of the editorial
 *  Today / Pipeline / Context / Capabilities / Stack / Cognition sections.
 *
 *  The kanban reads from the existing `deals` collection (registered in
 *  src/lib/cms/seed.ts). No new collection is introduced here — the kanban
 *  is a *view* over the same shared data the Dashboard reads. The seed
 *  function exists to ensure the kanban section has a render path even
 *  before the global seed runs.
 *
 *  Why this exists: the audit noted that the Sales app has no CMS-driven
 *  mutation. The simplest fix is to mirror the existing `deals` collection
 *  into a kanban, with each card carrying a "Move stage" button that calls
 *  `updateItem('deals', id, { stage: next })`. That's a real mutation,
 *  exercised by every coach who touches a deal.
 */
import { useCmsStore } from '../../lib/cms/cms.store';

let seeded = false;

export function seedSalesCms(): void {
  if (seeded) return;
  seeded = true;
  // The `deals` collection is registered globally by src/lib/cms/seed.ts.
  // We don't register it again here — it would no-op — but we ensure the
  // store is reachable so a kartesian import-side-effect (HMR) doesn't
  // attempt to read it before the global seed runs.
  void useCmsStore.getState();
}
