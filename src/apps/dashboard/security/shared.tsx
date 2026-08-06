/**
 * shared.tsx — small primitives shared across every security section.
 *
 * No hardcoded palette classes here either — only var(--theme-*) plus the
 * semantic ok / warn / danger palette names that the brief allows (green,
 * amber, red, orange). The semantic names carry meaning, not identity.
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type Tone = 'ok' | 'warn' | 'danger' | 'neutral';

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-green-700',
  warn: 'text-amber-700',
  danger: 'text-red-600',
  neutral: 'text-[var(--theme-text-muted)]',
};

export const TONE_BG: Record<Tone, string> = {
  ok: 'bg-green-100',
  warn: 'bg-amber-100',
  danger: 'bg-red-100',
  neutral: 'bg-[var(--theme-surface-hover)]',
};

export const TONE_TEXT_INVERTED: Record<Tone, string> = {
  ok: 'text-green-800',
  warn: 'text-amber-800',
  danger: 'text-red-700',
  neutral: 'text-[var(--theme-text-muted)]',
};

interface PillProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

/** Inline status pill — same palette rules as the rest of the dashboard app. */
export function Pill({ tone = 'neutral', children, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${TONE_BG[tone]} ${TONE_TEXT_INVERTED[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

interface ToggleProps {
  on: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

/** Toggle switch that matches the AppFrame style — themed surface, white knob. */
export function Toggle({ on, onClick, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={ariaLabel}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${
        on ? 'bg-green-500' : 'bg-[var(--theme-surface-hover)]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
        style={{ background: 'var(--theme-surface)' }}
      />
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Accent strip on the left (e.g. for danger highlights). */
  accent?: string;
}

/** Themed card. Optional colored accent strip down the left edge. */
export function Card({ children, className = '', accent }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] shadow-sm ${className}`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

interface GroupHeadProps {
  title: string;
  count?: number;
  hint?: string;
}

/** Group heading used inside the Kill Switches page. */
export function GroupHead({ title, count, hint }: GroupHeadProps) {
  return (
    <div className="flex items-baseline gap-3 px-1 pt-4 pb-2">
      <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
        {title}
      </h3>
      {typeof count === 'number' && (
        <span className="text-[10px] font-mono text-[var(--theme-text-dim)]">{count}</span>
      )}
      {hint && (
        <span className="text-[10.5px] text-[var(--theme-text-dim)]">{hint}</span>
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  hint?: string;
}

/** Small stat row — used inside Panic, Compliance, Posture pages. */
export function StatRow({ label, value, tone = 'neutral', hint }: StatRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-[var(--panel-border-subtle)] last:border-b-0">
      <span className="text-[12px] font-medium text-[var(--theme-text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <div className="text-right">
        <span className={`text-[15px] font-bold tabular-nums ${TONE_TEXT[tone]}`}>{value}</span>
        {hint && (
          <span className="block text-[10.5px] text-[var(--theme-text-dim)] mt-0.5">{hint}</span>
        )}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

/** Page-style header inside a security section. */
export function SectionHeader({ title, subtitle, icon: Icon, badge }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--theme-text-muted)]"
            style={{ background: 'var(--theme-surface-hover)' }}
          >
            <Icon className="w-4 h-4" />
          </span>
        )}
        <h2 className="text-[19px] font-bold tracking-tight text-[var(--theme-text)]">{title}</h2>
        {badge}
      </div>
      {subtitle && (
        <p className="text-[12.5px] text-[var(--theme-muted)] leading-relaxed max-w-3xl">{subtitle}</p>
      )}
    </div>
  );
}

interface ChokepointStripProps {
  current?: string;
}

/**
 * The turn chokepoint (Enterprise OS blueprint §3) — single-pipe order that
 * every agent action passes through. The cost cap fails closed.
 */
export function ChokepointStrip({ current }: ChokepointStripProps) {
  const steps = [
    'rate limit',
    'load agent',
    'model kill switch',
    'cost cap (fail-closed)',
    'tool switch',
    'guardrail',
    'converse loop',
    'tool dispatch',
    'DLP scan',
    'audit',
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 text-[10.5px] font-mono">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span
            className={`px-1.5 py-0.5 rounded ${
              current === s
                ? 'bg-amber-100 text-amber-800 font-semibold'
                : 'bg-[var(--theme-surface-hover)] text-[var(--theme-text-muted)]'
            }`}
            title={s === 'cost cap (fail-closed)' ? 'Fails closed if spend cannot be computed.' : undefined}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <span className="text-[var(--theme-text-dim)]">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}