/**
 * CollectionRepeater — renders a CMS collection as a grid of real cards (not
 * horizontal rows). Each card has a title, optional subtitle, optional badge,
 * and a chevron affordance. Used by every app that lists a CMS collection.
 */
import { ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsItem } from '../../lib/cms/types';
import { badgeTone } from '../../lib/badgeTone';

interface CollectionRepeaterProps {
  collectionId: string;
  onOpen: (itemId: string) => void;
  /** optional pre-filtered subset — when omitted, renders the whole collection */
  filter?: (item: CmsItem) => boolean;
}

export function CollectionRepeater({ collectionId, onOpen, filter }: CollectionRepeaterProps): import('react').ReactNode {
  const def = useCmsStore(s => s.collections[collectionId]);
  const allItems = useCmsStore(s => s.items[collectionId]) ?? [];
  const items = filter ? allItems.filter(filter) : allItems;

  if (!def) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((item) => {
        const title = String(item[def.titleField] ?? '');
        const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;
        const badge = def.badgeField ? item[def.badgeField] : undefined;
        return (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)] active:translate-y-0"
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-[var(--theme-text)] line-clamp-2">{title}</div>
                {subtitle && (
                  <div className="mt-1 text-xs text-[var(--theme-text-muted)] line-clamp-2">{subtitle}</div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] shrink-0 transition-colors" />
            </div>
            {badge != null && badge !== '' && (() => {
              const tone = badgeTone(String(badge));
              return (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  {String(badge)}
                </span>
              );
            })()}
          </button>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--theme-surface)]/50 px-5 py-8 text-center text-sm text-[var(--theme-text-dim)]">
          No {def.name.toLowerCase()} yet.
        </div>
      )}
    </div>
  );
}
