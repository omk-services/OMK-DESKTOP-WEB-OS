/**
 * SalesApp — section Kanban : vue CMS-driven du pipeline de deals. Chaque
 * carte porte un bouton 'Move forward' qui avance le deal au stage
 * suivant et ecrit dans le store. Extrait de SalesApp.tsx.
 */
import { useState, type ReactElement } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import { useShellStore } from '../../../stores/shell.store';
import type { DetailItem } from '../SalesDetailPage';
import { KanbanBoard } from '../../_ui/widgets';
import { ACCENT, FONT_BODY, LOSE, PageHeader, RELANCE, WIN } from './Primitives';

const DEAL_STAGES = ['Qualified', 'Proposal', 'Won', 'Lost'] as const;
type DealStageValue = typeof DEAL_STAGES[number];

function nextStage(current: string): DealStageValue {
  const idx = DEAL_STAGES.indexOf(current as DealStageValue);
  if (idx === -1) return 'Qualified';
  const nextIdx = Math.min(idx + 1, DEAL_STAGES.length - 1);
  return DEAL_STAGES[nextIdx];
}

export function KanbanPanel({ onSelect }: { onSelect: (item: DetailItem) => void }): ReactElement {
  const deals = useCmsStore(s => s.items['deals']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const addItem = useCmsStore(s => s.addItem);
  const addToast = useShellStore(s => s.addToast);

  const advance = (id: string, name: string, current: string): void => {
    const next = nextStage(current);
    if (next === current) {
      addToast({ source: 'Sales', type: 'warning', message: `${name} is already at the final stage.` });
      return;
    }
    updateItem('deals', id, { stage: next });
    addToast({ source: 'Sales', type: 'success', message: `${name} → ${next}` });
  };

  /** Compose a new deal inline. The coach enters the client name, picks an
   *  offer and a value; the stage defaults to "Qualified" (first stage) so
   *  the new card lands in the leftmost column of the kanban. The mutation
   *  flows through addItem so the new row appears without a refresh. */
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerClient, setComposerClient] = useState('');
  const [composerOffer, setComposerOffer] = useState<'Citadelle' | 'Programme'>('Citadelle');
  const [composerValue, setComposerValue] = useState('1800');

  const submitNewDeal = (): void => {
    const client = composerClient.trim();
    if (client.length === 0) {
      addToast({ source: 'Sales', type: 'warning', message: 'Client name is required.' });
      return;
    }
    const valueNum = Number(composerValue);
    if (!Number.isFinite(valueNum) || valueNum <= 0) {
      addToast({ source: 'Sales', type: 'warning', message: 'Deal value must be a positive number.' });
      return;
    }
    const result = addItem('deals', {
      client,
      offer: composerOffer,
      value: valueNum,
      stage: 'Qualified',
    });
    if (result.ok) {
      addToast({ source: 'Sales', type: 'success', message: `Deal added: ${client} ($${valueNum.toLocaleString('en-US')}).` });
      setComposerClient('');
      setComposerOffer('Citadelle');
      setComposerValue('1800');
      setComposerOpen(false);
    } else {
      addToast({ source: 'Sales', type: 'warning', message: result.error ?? 'Could not create deal.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerClient('');
    setComposerOffer('Citadelle');
    setComposerValue('1800');
    setComposerOpen(false);
  };

  // Bucket deals: 4 known stages + an "Other" bucket for deals whose stage
  // string doesn't match — previously they were silently hidden, leaving the
  // kanban out of sync with the store.
  const knownStageSet = new Set<string>(DEAL_STAGES);
  const otherDeals = deals.filter((d) => !knownStageSet.has(String(d.stage)));
  const hasOther = otherDeals.length > 0;

  const allColumns: { title: string; accent: string; items: { id: string; stage: string; clientName: string; offer: string; value: number }[] }[] = DEAL_STAGES.map((stage) => ({
    title: stage,
    accent: stage === 'Won' ? WIN : stage === 'Lost' ? LOSE : stage === 'Proposal' ? ACCENT : RELANCE,
    items: deals
      .filter((d) => String(d.stage) === stage)
      .map((d) => ({
        id: String(d.id),
        stage: String(d.stage),
        clientName: String(d.client ?? 'Untitled'),
        offer: String(d.offer ?? ''),
        value: Number(d.value ?? 0),
      })),
  }));
  if (hasOther) {
    allColumns.push({
      title: 'Other',
      accent: 'var(--theme-text-dim)',
      items: otherDeals.map((d) => ({
        id: String(d.id),
        stage: String(d.stage ?? '—'),
        clientName: String(d.client ?? 'Untitled'),
        offer: String(d.offer ?? ''),
        value: Number(d.value ?? 0),
      })),
    });
  }

  const columns = allColumns.map((col) => ({
    title: col.title,
    accent: col.accent,
    items: col.items.map((d) => (
      <div
        key={d.id}
        className="rounded-lg border p-3 shadow-sm"
        style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
      >
        <button
          type="button"
          onClick={() => onSelect({
            id: d.id,
            kind: 'deal',
            title: d.clientName,
            subtitle: d.offer,
            status: d.stage,
            summary: `Deal valued at $${d.value.toLocaleString('en-US')}. Move forward to track progress.`,
            fields: [
              { label: 'Offer', value: d.offer },
              { label: 'Value', value: `$${d.value.toLocaleString('en-US')}` },
              { label: 'Stage', value: d.stage },
            ],
          })}
          className="block w-full text-left"
          aria-label={`Open ${d.clientName} detail`}
        >
          <span className="block text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{d.clientName}</span>
          <span className="block text-[11.5px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{d.offer}</span>
          <span className="block text-[10.5px] font-mono mt-1" style={{ color: 'var(--theme-text-dim)' }}>
            ${d.value.toLocaleString('en-US')}
          </span>
        </button>
        {col.title !== 'Other' && col.title !== 'Won' && col.title !== 'Lost' ? (
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => advance(d.id, d.clientName, d.stage)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'var(--theme-surface-hover)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
              aria-label={`Move ${d.clientName} to ${nextStage(col.title)}`}
            >
              <ArrowRight className="w-3 h-3" />
              Move to {nextStage(col.title)}
            </button>
          </div>
        ) : null}
        {/* Open detail reuses the same fiche as the card itself — the
            previous "useCollectionDrill('deals', 'Deals')" was a dead
            link (no 'Deals' section in SalesApp), so the overlay never
            opened and the toast-less click read as a no-op. */}
        <button
          type="button"
          onClick={() => onSelect({
            id: d.id,
            kind: 'deal',
            title: d.clientName,
            subtitle: d.offer,
            status: d.stage,
            summary: `Deal valued at $${d.value.toLocaleString('en-US')}. Move forward to track progress.`,
            fields: [
              { label: 'Offer', value: d.offer },
              { label: 'Value', value: `$${d.value.toLocaleString('en-US')}` },
              { label: 'Stage', value: d.stage },
            ],
          })}
          className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-mono"
          style={{ color: 'var(--theme-text-dim)' }}
          aria-label={`Reopen ${d.clientName} detail`}
        >
          <ChevronRight className="w-3 h-3" />
          Open detail
        </button>
      </div>
    )),
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Kanban"
        title="Sales OS"
        subtitle="A CMS-driven view of the deal pipeline. Each card is a writable mutation — the coach's edits flow back to the store."
        meta={{ label: 'Deals', value: `${deals.length}`, sub: 'Updated live' }}
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
          Move a deal from column to column as it progresses. A Won deal exposes
          a Generate invoice action in its dossier.
        </p>
        {!composerOpen ? (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: ACCENT,
              color: '#ffffff',
              border: '1px solid var(--panel-border)',
            }}
            aria-label="Create a new deal"
          >
            + New deal
          </button>
        ) : null}
      </div>
      {composerOpen ? (
        <div
          className="mt-3 rounded-xl border p-4"
          style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-client"
              >
                Client
              </label>
              <input
                id="deals-composer-client"
                autoFocus
                value={composerClient}
                onChange={(e) => setComposerClient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewDeal();
                  if (e.key === 'Escape') cancelComposer();
                }}
                placeholder="Elena Marquez"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-offer"
              >
                Offer
              </label>
              <select
                id="deals-composer-offer"
                value={composerOffer}
                onChange={(e) => setComposerOffer(e.target.value as 'Citadelle' | 'Programme')}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <option value="Citadelle">Citadelle</option>
                <option value="Programme">Programme</option>
              </select>
            </div>
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-value"
              >
                Value (USD)
              </label>
              <input
                id="deals-composer-value"
                type="number"
                inputMode="numeric"
                min="0"
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewDeal();
                  if (e.key === 'Escape') cancelComposer();
                }}
                placeholder="1800"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={cancelComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  color: 'var(--theme-text-dim)',
                  border: '1px solid var(--panel-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewDeal}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ACCENT,
                  color: '#ffffff',
                }}
              >
                Create deal
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-6">
        <KanbanBoard columns={columns} />
      </div>
    </div>
  );
}
