/** Shared UI kit — coherent primitives across every Citadelle app (PostHog-light) */
import React from 'react';

export function AppShell({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="p-7 h-full flex flex-col text-[var(--theme-text)] bg-[var(--theme-bg)]">
      <div className="mb-6 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text)] font-outfit">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--theme-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon, accent }: {
  label: string; value: React.ReactNode; hint?: string; tone?: 'default' | 'ok' | 'warn' | 'danger' | 'accent';
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  accent?: string;
}) {
  const toneColor = {
    default: 'var(--theme-text)',
    ok: '#15803d',
    warn: '#b45309',
    danger: '#dc2626',
    accent: 'var(--theme-accent)',
  }[tone];
  return (
    <div className="bg-[var(--theme-surface)] p-4 rounded-xl border border-[var(--panel-border)] shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-[var(--theme-muted)] text-[13px] font-medium">{label}</div>
        {Icon && (
          <Icon
            className="w-4 h-4"
            strokeWidth={2}
            style={accent ? { color: accent } : undefined}
          />
        )}
      </div>
      <div className="text-[26px] leading-none font-extrabold" style={{ color: toneColor }}>{value}</div>
      {hint && <div className="text-xs text-[var(--theme-text-dim)] mt-1.5">{hint}</div>}
    </div>
  );
}

export function Card({ title, aside, children, className = '' }: {
  title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-[var(--theme-surface)] rounded-xl border border-[var(--panel-border)] shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-[var(--theme-muted)]">{title}</h3>
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }): import('react').ReactNode {
  const map = {
    ok: { background: '#dcfce7', color: '#166534' },
    warn: { background: '#fef3c7', color: '#92400e' },
    danger: { background: '#fee2e2', color: '#991b1b' },
    accent: { background: '#ffedd5', color: '#9a3412' },
    neutral: { background: 'var(--theme-surface-hover)', color: 'var(--theme-muted)' },
  }[tone];
  return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={map}>{children}</span>;
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }): import('react').ReactNode {
  return (
    <button
      onClick={onClick}
      className={`bg-[var(--theme-accent)] text-[var(--theme-on-accent)] px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[var(--theme-accent-hover)] active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }): import('react').ReactNode {
  return (
    <button
      onClick={onClick}
      className={`bg-[var(--theme-surface)] border border-[var(--panel-border)] text-[var(--theme-text)] px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[var(--theme-surface-hover)] active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

/** A REAL progress/score bar — value 0..100, never an empty placeholder */
export function ScoreBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'ok' | 'warn' | 'danger' }): import('react').ReactNode {
  const color = {
    accent: 'var(--theme-accent)',
    ok: '#16a34a',
    warn: '#d97706',
    danger: '#dc2626',
  }[tone];
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-[var(--theme-surface-hover)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}
