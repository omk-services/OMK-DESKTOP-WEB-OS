/** CollectionRepeater — renders a CMS collection as a clickable list (Wix "repeater"
 *  bound to a collection). Same component works for any collection definition. */
import { ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsItem } from '../../lib/cms/types';
import { Badge } from '../../apps/_ui/kit';

interface CollectionRepeaterProps {
  collectionId: string;
  onOpen: (itemId: string) => void;
  /** optional pre-filtered subset — when omitted, renders the whole collection */
  filter?: (item: CmsItem) => boolean;
}

export function CollectionRepeater({ collectionId, onOpen, filter }: CollectionRepeaterProps) {
  const def = useCmsStore(s => s.collections[collectionId]);
  const allItems = useCmsStore(s => s.items[collectionId]) ?? [];
  const items = filter ? allItems.filter(filter) : allItems;

  if (!def) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm overflow-hidden">
      {items.map((item, i) => {
        const title = String(item[def.titleField] ?? '');
        const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;
        const badge = def.badgeField ? item[def.badgeField] : undefined;
        return (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50 transition-colors ${
              i !== items.length - 1 ? 'border-b border-[var(--hairline)]' : ''
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-stone-800 truncate">{title}</div>
              {subtitle && <div className="text-xs text-stone-500 truncate mt-0.5">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {badge !== undefined && <Badge tone="accent">{String(badge)}</Badge>}
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </div>
          </button>
        );
      })}
      {items.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-stone-400">No {def.name.toLowerCase()} yet.</div>
      )}
    </div>
  );
}
