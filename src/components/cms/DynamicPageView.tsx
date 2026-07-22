/** DynamicPageView — the "dynamic page" half of the Wix CMS pattern: ONE template
 *  bound to whichever item is open, shared across every item in the collection,
 *  with Prev/Next to walk the collection without leaving the template. */
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsField } from '../../lib/cms/types';
import { Badge } from '../../apps/_ui/kit';

interface DynamicPageViewProps {
  collectionId: string;
  itemId: string;
  onBack: () => void;
  onNavigate: (itemId: string) => void;
}

function formatValue(value: unknown, type: CmsField['type']): ReactNode {
  if (value === undefined || value === null || value === '') return <span className="text-stone-300">—</span>;
  if (type === 'currency') return `$${Number(value).toLocaleString('en-US')}`;
  if (type === 'badge') return <Badge tone="neutral">{String(value)}</Badge>;
  return String(value);
}

export function DynamicPageView({ collectionId, itemId, onBack, onNavigate }: DynamicPageViewProps) {
  const def = useCmsStore(s => s.collections[collectionId]);
  const items = useCmsStore(s => s.items[collectionId]) ?? [];
  const index = items.findIndex(it => it.id === itemId);
  const item = items[index];

  if (!def || !item) return null;

  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;

  const prev = items[index - 1];
  const next = items[index + 1];

  return (
    <div className="p-7">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All {def.name.toLowerCase()}
      </button>

      <div className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--hairline)]" style={{ background: `${def.accent}0d` }}>
          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: def.accent }}>{def.singular}</div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight font-outfit mt-0.5">{title}</h2>
          {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
        </div>

        <div className="divide-y divide-[var(--hairline)]">
          {def.fields.map(f => (
            <div key={f.key} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">{f.label}</span>
              <span className="text-sm text-stone-800 text-right max-w-[60%]">{formatValue(item[f.key], f.type)}</span>
            </div>
          ))}
        </div>

        {/* Prev/Next — same template, different bound item */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--canvas)] border-t border-[var(--panel-border-subtle)]">
          <button
            disabled={!prev}
            onClick={() => prev && onNavigate(prev.id)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {prev ? String(prev[def.titleField]) : 'Start'}
          </button>
          <span className="text-[11px] text-stone-300 tabular-nums">{index + 1} / {items.length}</span>
          <button
            disabled={!next}
            onClick={() => next && onNavigate(next.id)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {next ? String(next[def.titleField]) : 'End'} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
