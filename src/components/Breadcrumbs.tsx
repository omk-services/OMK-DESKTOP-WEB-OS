/** Breadcrumbs — dynamic path trail for OS windows (Life OS canon, light skin).
 *  Renders App > Section, or App > Section > Item when a detail page is open —
 *  clicking Section (or the back arrow) returns to the list via onBackToActivePage. */
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  appTitle: string;
  activePage?: string;
  detailLabel?: string | null;
  onBackToActivePage?: () => void;
}

export function Breadcrumbs({ appTitle, activePage = 'Overview', detailLabel = null, onBackToActivePage }: BreadcrumbsProps) {
  const path = detailLabel ? [appTitle, activePage, detailLabel] : [appTitle, activePage];
  const sectionIndex = path.length - 2;

  return (
    <div className="flex items-center gap-2 h-full select-none overflow-hidden">
      <button
        onClick={() => onBackToActivePage?.()}
        disabled={!onBackToActivePage}
        className="p-1 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent"
        title={onBackToActivePage ? 'Back to list' : undefined}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3 bg-[var(--panel-border-subtle)] mx-1 shrink-0" />

      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        {path.map((segment, i) => {
          const isLast = i === path.length - 1;
          const isClickableSection = i === sectionIndex && !!detailLabel && !!onBackToActivePage;
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-stone-300" />}
              <button
                onClick={() => { if (isClickableSection) onBackToActivePage?.(); }}
                disabled={isLast || !isClickableSection}
                className={`text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
                  isLast
                    ? 'text-[var(--theme-accent)] cursor-default'
                    : isClickableSection
                      ? 'text-stone-400 hover:text-stone-700 cursor-pointer hover:bg-stone-100 px-1.5 py-0.5 rounded-md'
                      : 'text-stone-400 cursor-default'
                }`}
              >
                {segment}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
