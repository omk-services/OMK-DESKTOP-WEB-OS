/** FleetItemCard — canonical item card used across every Coach OS app.
 *  Pattern: rounded card with state pill + primary metric + secondary metrics
 *  + meta footer. Clickable → opens the item's detail page. NO vertical
 *  line-separated list views — every item is a Card, period. */

import * as React from 'react';
import { ChevronRight } from 'lucide-react';

export type FleetStatusTone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' | 'primary';

export interface FleetItemCardProps {
  /** Avatar / category icon (top-left) */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Subtitle / secondary text */
  subtitle?: string;
  /** Description / preview line (truncated to 2 lines) */
  description?: string;
  /** Status / category pill (right) */
  statusLabel?: string;
  statusTone?: FleetStatusTone;
  /** Optional accent color (for the avatar) */
  accent?: string;
  /** Primary metric (right side) */
  metricLabel?: string;
  metricValue?: string | number;
  /** Secondary meta line (bottom) */
  meta?: React.ReactNode;
  /** Click handler — when set, the card becomes a button */
  onClick?: () => void;
  /** Optional trailing element (override default chevron) */
  trailing?: React.ReactNode;
  /** Compact mode (smaller padding, fewer meta) */
  compact?: boolean;
}

const TONE_META: Record<FleetStatusTone, { color: string; bg: string }> = {
  ok:      { color: '#15803d', bg: '#dcfce7' },
  warn:    { color: '#b45309', bg: '#fef3c7' },
  danger:  { color: '#b91c1c', bg: '#fee2e2' },
  accent:  { color: '#1d4ed8', bg: '#dbeafe' },
  neutral: { color: '#57534e', bg: '#f5f5f4' },
  primary: { color: '#0c0a09', bg: '#fafaf9' },
};

export function FleetItemCard(props: FleetItemCardProps) {
  const {
    icon, title, subtitle, description, statusLabel, statusTone = 'neutral',
    accent, metricLabel, metricValue, meta, onClick, trailing, compact = false,
  } = props;
  const tone = TONE_META[statusTone];
  const isClickable = !!onClick;
  void isClickable; // referenced by the conditional return below

  return isClickable ? (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm p-${compact ? 3 : 4} flex items-start gap-${compact ? 3 : 4} text-left transition-all w-full ${
        isClickable ? 'cursor-pointer hover:scale-[1.012] hover:shadow-md active:scale-[0.99]' : ''
      }`}
    >
      {/* Avatar / icon */}
      {icon !== undefined ? (
        <div
          className={`shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-white`}
          style={{ background: accent ?? 'var(--theme-accent)' }}
        >
          {icon}
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`${compact ? 'text-[13px]' : 'text-[14px]'} font-bold text-stone-900 truncate`}>
                {title}
              </span>
            </div>
            {subtitle && (
              <div className={`${compact ? 'text-[10.5px]' : 'text-[11.5px]'} text-stone-500 truncate mt-0.5`}>
                {subtitle}
              </div>
            )}
          </div>

          {/* Status pill (top-right) */}
          {statusLabel && (
            <span
              className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: tone.color, background: tone.bg }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Description (2 lines max) */}
        {description && (
          <p className={`${compact ? 'text-[11px]' : 'text-[12px]'} text-stone-700 leading-snug line-clamp-2 mt-1.5`}>
            {description}
          </p>
        )}

        {/* Meta footer */}
        {(meta || metricValue !== undefined) && (
          <div className={`flex items-center gap-3 ${compact ? 'text-[9.5px]' : 'text-[10.5px]'} font-mono text-stone-400 mt-2.5 pt-2 border-t border-stone-100`}>
            {metricValue !== undefined && (
              <span className="text-stone-700 font-semibold tabular-nums">
                {metricLabel && <span className="text-stone-400 mr-1">{metricLabel}</span>}
                {metricValue}
              </span>
            )}
            {meta && <span className="truncate flex-1">{meta}</span>}
          </div>
        )}
      </div>

      {/* Trailing (default: chevron) */}
      {trailing !== undefined ? trailing : isClickable ? <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 self-center" /> : null}
    </button>
  ) : (
    <div
      className={`bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm p-${compact ? 3 : 4} flex items-start gap-${compact ? 3 : 4} text-left transition-all`}
    >
      {/* Avatar / icon */}
      {icon !== undefined ? (
        <div
          className={`shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-white`}
          style={{ background: accent ?? 'var(--theme-accent)' }}
        >
          {icon}
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`${compact ? 'text-[13px]' : 'text-[14px]'} font-bold text-stone-900 truncate`}>
                {title}
              </span>
            </div>
            {subtitle && (
              <div className={`${compact ? 'text-[10.5px]' : 'text-[11.5px]'} text-stone-500 truncate mt-0.5`}>
                {subtitle}
              </div>
            )}
          </div>

          {/* Status pill (top-right) */}
          {statusLabel && (
            <span
              className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: tone.color, background: tone.bg }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Description (2 lines max) */}
        {description && (
          <p className={`${compact ? 'text-[11px]' : 'text-[12px]'} text-stone-700 leading-snug line-clamp-2 mt-1.5`}>
            {description}
          </p>
        )}

        {/* Meta footer */}
        {(meta || metricValue !== undefined) && (
          <div className={`flex items-center gap-3 ${compact ? 'text-[9.5px]' : 'text-[10.5px]'} font-mono text-stone-400 mt-2.5 pt-2 border-t border-stone-100`}>
            {metricValue !== undefined && (
              <span className="text-stone-700 font-semibold tabular-nums">
                {metricLabel && <span className="text-stone-400 mr-1">{metricLabel}</span>}
                {metricValue}
              </span>
            )}
            {meta && <span className="truncate flex-1">{meta}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/** FleetItemGrid — responsive grid wrapper for FleetItemCard. */
export function FleetItemGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const cls = cols === 1 ? 'grid grid-cols-1 gap-3' : cols === 3 ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  return <div className={cls}>{children}</div>;
}
