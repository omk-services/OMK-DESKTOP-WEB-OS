/**
 * Primitives — theme-aware primitives for the 9 sections of the new dashboard.
 *
 * Zero hardcoded Tailwind palette classes. Every surface / text / border reads
 * from the runtime theme CSS variables (`--theme-bg`, `--theme-text`,
 * `--theme-surface`, `--panel-border`, etc.).
 *
 * Colors that carry meaning are semantic: green = healthy, red = incident /
 * over budget, amber = warning, blue = informational. They are explicitly opted
 * into via `tone` props, never asserted as Tailwind classes.
 */
import type { CSSProperties, ReactNode } from 'react';

export const ACCENT = '#059669';

/** Status tone — drives semantic color via inline style (not Tailwind palette). */
export type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' | 'info';

export const TONE_META: Record<Tone, { fg: string; bg: string; border: string }> = {
  ok:      { fg: '#15803d', bg: 'rgba(21,128,61,0.10)',  border: 'rgba(21,128,61,0.35)' },
  warn:    { fg: '#b45309', bg: 'rgba(180,83,9,0.10)',  border: 'rgba(180,83,9,0.35)' },
  danger:  { fg: '#b91c1c', bg: 'rgba(185,28,28,0.10)',  border: 'rgba(185,28,28,0.35)' },
  accent:  { fg: ACCENT,    bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.35)' },
  info:    { fg: '#1d4ed8', bg: 'rgba(29,78,216,0.10)',  border: 'rgba(29,78,216,0.35)' },
  neutral: { fg: 'var(--theme-text-muted)', bg: 'var(--theme-surface-hover)', border: 'var(--panel-border)' },
};

/** A frosted / flat surface that reads theme variables. */
export function Panel({
  children,
  className = '',
  pad = 'p-5',
  flat = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  pad?: string;
  flat?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border ${pad} ${className}`}
      style={{
        background: flat ? 'var(--theme-surface)' : 'var(--theme-surface)',
        borderColor: 'var(--panel-border)',
        boxShadow: flat ? 'none' : 'var(--shadow-panel)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section header — same shape across all 9 sections. */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            {eyebrow}
          </div>
        ) : null}
        <h2 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Pill — a small status / category badge. */
export function Pill({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const meta = TONE_META[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{ color: meta.fg, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      {children}
    </span>
  );
}

/** KPI tile — single big number with a label and a hint. */
export function KpiTile({
  label,
  value,
  hint,
  tone = 'accent',
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  trend?: { dir: 'up' | 'down' | 'flat'; value: string };
}) {
  const meta = TONE_META[tone];
  return (
    <Panel pad="p-4" className="flex flex-col gap-1.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--theme-text-dim)' }}>
        {label}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-[26px] font-extrabold leading-none tabular-nums tracking-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
          {value}
        </div>
        {trend ? (
          <div
            className="text-[10.5px] font-bold tabular-nums"
            style={{ color: trend.dir === 'up' ? TONE_META.ok.fg : trend.dir === 'down' ? TONE_META.danger.fg : 'var(--theme-text-muted)' }}
          >
            {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→'} {trend.value}
          </div>
        ) : null}
      </div>
      {hint ? (
        <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          {hint}
        </div>
      ) : null}
      <div className="mt-1 h-0.5 w-10 rounded-full" style={{ background: meta.border }} />
    </Panel>
  );
}

/** Small sparkline — pure SVG, no D3. */
export function Sparkline({
  values,
  height = 28,
  width = 96,
  stroke,
  responsive = false,
}: {
  values: number[];
  height?: number;
  width?: number;
  stroke?: string;
  /** When true, the SVG stretches to fill its parent and the polyline uses
   *  preserveAspectRatio="none". This is what makes the curve track the
   *  card width at every breakpoint — without it, the sparkline stays
   *  pinned to its `width` prop and looks stranded inside a wider card. */
  responsive?: boolean;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`)
    .join(' ');
  if (responsive) {
    return (
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={stroke ?? ACCENT}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={stroke ?? ACCENT}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A tiny dot used as a presence / live indicator. */
export function LiveDot({ tone = 'ok', size = 6 }: { tone?: Tone; size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, background: TONE_META[tone].fg }}
      aria-hidden="true"
    />
  );
}

/** Icon chip — square rounded background with a tinted icon inside. */
export function IconChip({
  children,
  tone = 'accent',
  size = 36,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: number;
}) {
  const meta = TONE_META[tone];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: meta.bg,
        color: meta.fg,
        border: `1px solid ${meta.border}`,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** Primary CTA button — the green action used across the dashboard. */
export function PrimaryButton({
  children,
  onClick,
  size = 'md',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 ${
        size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-[12.5px]'
      }`}
      style={{
        background: ACCENT,
        color: '#ffffff',
        boxShadow: `0 8px 24px -10px ${ACCENT}80`,
      }}
    >
      {children}
    </button>
  );
}

/** Ghost button — secondary CTA. */
export function GhostButton({
  children,
  onClick,
  size = 'md',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 ${
        size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-[12.5px]'
      }`}
      style={{
        background: 'var(--theme-surface)',
        color: 'var(--theme-text)',
        border: '1px solid var(--panel-border)',
      }}
    >
      {children}
    </button>
  );
}

/** A simple key/value pair row, used in detail pages. */
export function KV({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--theme-surface-hover)' }}>
      <div className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
        {label}
      </div>
      <div
        className={`mt-1 text-[13px] font-semibold ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--theme-text)' }}
      >
        {value}
      </div>
    </div>
  );
}

/** Mini progress bar (0..100). */
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: Tone }) {
  const meta = TONE_META[tone];
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--theme-surface-hover)' }}
      role="img"
      aria-label={`progress ${value}%`}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: meta.fg }}
      />
    </div>
  );
}
