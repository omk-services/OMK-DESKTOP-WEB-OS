/** FleetItemCard — canonical item card used across every Coach OS app.
 *  Pattern: rounded card with state pill + primary metric + secondary metrics
 *  + meta footer. Clickable → opens the item's detail page. NO vertical
 *  line-separated list views — every item is a Card, period. */

import * as React from 'react';
import { ChevronRight } from 'lucide-react';

const CARD_BG = 'var(--theme-surface)';
const CARD_TEXT = 'var(--theme-text)';
const CARD_TEXT_MUTED = 'var(--theme-text-muted)';
const CARD_TEXT_DIM = 'var(--theme-text-dim)';
const CARD_BORDER = 'var(--panel-border)';

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

export function FleetItemCard(props: FleetItemCardProps): import('react').ReactNode {
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
      className={`rounded-2xl border shadow-sm p-${compact ? 3 : 4} flex items-start gap-${compact ? 3 : 4} text-left transition-all w-full ${
        isClickable ? 'cursor-pointer hover:scale-[1.012] hover:shadow-md active:scale-[0.99]' : ''
      }`}
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      {/* Avatar / icon */}
      {icon !== undefined ? (
        <div
          className={`shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-[var(--theme-on-accent)]`}
          style={{ background: accent ?? 'var(--theme-accent)' }}
        >
          {icon}
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* En-tete : titre + pastille de statut.
         *
         *  `flex-wrap` et le `min-w` du bloc titre vont ensemble. Sans eux, la
         *  pastille est en `shrink-0` et le titre en `min-w-0` : c'est donc
         *  TOUJOURS le titre qui cede. En grille de 3 colonnes il ne lui restait
         *  qu'une centaine de pixels, et « Supabase » devenait « Sup ». Passer
         *  le titre en `line-clamp-2` n'y suffisait pas — deux lignes de rien
         *  restent rien.
         *
         *  Avec un plancher de 9rem, la pastille passe a la ligne des que le
         *  titre ne tient plus a cote d'elle. Sur les cartes larges, rien ne
         *  bouge : elle reste en haut a droite. */}
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[9rem] flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`${compact ? 'text-[13px]' : 'text-[14px]'} font-bold`}
                style={{ color: CARD_TEXT, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {title}
              </span>
            </div>
            {subtitle && (
              <div
                className={`${compact ? 'text-[10.5px]' : 'text-[11.5px]'} truncate mt-0.5`}
                style={{ color: CARD_TEXT_MUTED }}
              >
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
          <p
            className={`${compact ? 'text-[11px]' : 'text-[12px]'} leading-snug line-clamp-2 mt-1.5`}
            style={{ color: CARD_TEXT_MUTED }}
          >
            {description}
          </p>
        )}

        {/* Meta footer */}
        {(meta || metricValue !== undefined) && (
          <div
            className={`flex items-center gap-3 ${compact ? 'text-[9.5px]' : 'text-[10.5px]'} font-mono mt-2.5 pt-2 border-t`}
            style={{ color: CARD_TEXT_DIM, borderColor: 'var(--panel-border-subtle)' }}
          >
            {metricValue !== undefined && (
              <span className="font-semibold tabular-nums" style={{ color: CARD_TEXT }}>
                {metricLabel && <span className="mr-1" style={{ color: CARD_TEXT_DIM }}>{metricLabel}</span>}
                {metricValue}
              </span>
            )}
            {meta && <span className="truncate flex-1">{meta}</span>}
          </div>
        )}
      </div>

      {/* Trailing (default: chevron) */}
      {trailing !== undefined ? trailing : isClickable ? <ChevronRight className="w-4 h-4 shrink-0 self-center" style={{ color: CARD_TEXT_DIM }} /> : null}
    </button>
  ) : (
    <div
      className={`rounded-2xl border shadow-sm p-${compact ? 3 : 4} flex items-start gap-${compact ? 3 : 4} text-left transition-all`}
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      {/* Avatar / icon */}
      {icon !== undefined ? (
        <div
          className={`shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-[var(--theme-on-accent)]`}
          style={{ background: accent ?? 'var(--theme-accent)' }}
        >
          {icon}
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* En-tete : titre + pastille de statut.
         *
         *  `flex-wrap` et le `min-w` du bloc titre vont ensemble. Sans eux, la
         *  pastille est en `shrink-0` et le titre en `min-w-0` : c'est donc
         *  TOUJOURS le titre qui cede. En grille de 3 colonnes il ne lui restait
         *  qu'une centaine de pixels, et « Supabase » devenait « Sup ». Passer
         *  le titre en `line-clamp-2` n'y suffisait pas — deux lignes de rien
         *  restent rien.
         *
         *  Avec un plancher de 9rem, la pastille passe a la ligne des que le
         *  titre ne tient plus a cote d'elle. Sur les cartes larges, rien ne
         *  bouge : elle reste en haut a droite. */}
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[9rem] flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`${compact ? 'text-[13px]' : 'text-[14px]'} font-bold`}
                style={{ color: CARD_TEXT, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {title}
              </span>
            </div>
            {subtitle && (
              <div
                className={`${compact ? 'text-[10.5px]' : 'text-[11.5px]'} truncate mt-0.5`}
                style={{ color: CARD_TEXT_MUTED }}
              >
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
          <p
            className={`${compact ? 'text-[11px]' : 'text-[12px]'} leading-snug line-clamp-2 mt-1.5`}
            style={{ color: CARD_TEXT_MUTED }}
          >
            {description}
          </p>
        )}

        {/* Meta footer */}
        {(meta || metricValue !== undefined) && (
          <div
            className={`flex items-center gap-3 ${compact ? 'text-[9.5px]' : 'text-[10.5px]'} font-mono mt-2.5 pt-2 border-t`}
            style={{ color: CARD_TEXT_DIM, borderColor: 'var(--panel-border-subtle)' }}
          >
            {metricValue !== undefined && (
              <span className="font-semibold tabular-nums" style={{ color: CARD_TEXT }}>
                {metricLabel && <span className="mr-1" style={{ color: CARD_TEXT_DIM }}>{metricLabel}</span>}
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
export function FleetItemGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }): import('react').ReactNode {
  // Stay single-column until 2xl (1536px) so cards don't stretch thin when
  // the OSWindow is maximized. At xl they still sit side-by-side at a
  // comfortable 2-up density; 3-up only on truly wide viewports.
  const cls =
    cols === 1
      ? 'grid grid-cols-1 gap-3'
      : cols === 3
        ? 'grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3'
        : 'grid grid-cols-1 2xl:grid-cols-2 gap-3';
  return <div className={cls}>{children}</div>;
}
