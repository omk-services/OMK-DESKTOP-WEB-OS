/** Shared UI kit — coherent primitives across every Citadelle app (PostHog-light) */
import React from 'react';

export function AppShell({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="p-7 h-full flex flex-col text-stone-800 bg-[var(--theme-bg)]">
      <div className="mb-6 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 font-outfit">{title}</h2>
          {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }: {
  label: string; value: React.ReactNode; hint?: string; tone?: 'default' | 'ok' | 'warn' | 'danger' | 'accent';
}) {
  const toneClass = {
    default: 'text-stone-900',
    ok: 'text-green-700',
    warn: 'text-amber-700',
    danger: 'text-red-600',
    accent: 'text-[var(--theme-accent)]',
  }[tone];
  return (
    <div className="bg-white p-4 rounded-xl border border-[var(--panel-border)] shadow-sm">
      <div className="text-stone-500 text-[13px] font-medium mb-1.5">{label}</div>
      <div className={`text-[26px] leading-none font-extrabold ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-stone-400 mt-1.5">{hint}</div>}
    </div>
  );
}

export function Card({ title, aside, children, className = '' }: {
  title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-[var(--panel-border)] shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-stone-500">{title}</h3>
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }) {
  const map = {
    ok: 'bg-green-100 text-green-800',
    warn: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    accent: 'bg-orange-100 text-orange-800',
    neutral: 'bg-stone-100 text-stone-600',
  }[tone];
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${map}`}>{children}</span>;
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[var(--theme-accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[var(--theme-accent-hover)] active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-[var(--panel-border)] text-stone-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-stone-50 active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

/** A REAL progress/score bar — value 0..100, never an empty placeholder */
export function ScoreBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'ok' | 'warn' | 'danger' }) {
  const color = {
    accent: 'var(--theme-accent)',
    ok: '#16a34a',
    warn: '#d97706',
    danger: '#dc2626',
  }[tone];
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}
