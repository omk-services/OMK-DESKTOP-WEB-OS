/**
 * RateLimitsSection.tsx — per-agent and per-surface rate limits.
 *
 * Each row shows the surface, the window, the limit, the current usage, and
 * what happens at the cap (queue, throttle, or fail-closed).
 *
 * Filters: window (1m / 1h / 24h) and overflow behavior. The summary at the
 * top reflects the filtered set so the operator can drill without losing the
 * peak indicator.
 */
import { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import { RATE_LIMITS, type RateLimitRow } from './seed';
import { Pill, SectionHeader, type Tone } from './shared';

type WindowFilter = 'all' | '1m' | '1h' | '24h';
type OverflowFilter = 'all' | 'queue' | 'throttle' | 'fail-closed';

function usageTone(used: number, limit: number): Tone {
  const pct = used / limit;
  if (pct >= 0.9) return 'danger';
  if (pct >= 0.7) return 'warn';
  if (pct >= 0.4) return 'neutral';
  return 'ok';
}

function overflowTone(of: RateLimitRow['overflow']): Tone {
  if (of === 'fail-closed') return 'danger';
  if (of === 'throttle') return 'warn';
  return 'ok';
}

export function RateLimitsSection() {
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [overflowFilter, setOverflowFilter] = useState<OverflowFilter>('all');

  const filtered = useMemo(() => {
    return RATE_LIMITS.filter((r) => {
      if (windowFilter !== 'all' && r.window !== windowFilter) return false;
      if (overflowFilter !== 'all' && r.overflow !== overflowFilter) return false;
      return true;
    });
  }, [windowFilter, overflowFilter]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const above70 = filtered.filter((r) => r.used / r.limit >= 0.7).length;
    const failClosed = filtered.filter((r) => r.overflow === 'fail-closed').length;
    return { total, above70, failClosed };
  }, [filtered]);

  const maxUsage = filtered.length === 0 ? 0 : Math.max(...filtered.map((r) => r.used / r.limit));

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Rate Limits"
        subtitle="Per-agent and per-surface ceilings. At the cap, behavior is queue / throttle / fail-closed. Cost-bearing surfaces fail closed."
        icon={Gauge}
        badge={
          <div className="flex gap-1.5">
            <Pill tone="neutral">{summary.total} limits</Pill>
            <Pill tone={summary.above70 > 0 ? 'warn' : 'ok'}>{summary.above70} hot</Pill>
            <Pill tone="danger">{summary.failClosed} fail-closed</Pill>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">
          Window
        </span>
        {(['all', '1m', '1h', '24h'] as WindowFilter[]).map((w) => {
          const on = windowFilter === w;
          const count = w === 'all' ? RATE_LIMITS.length : RATE_LIMITS.filter((r) => r.window === w).length;
          return (
            <button
              key={w}
              type="button"
              onClick={() => setWindowFilter(w)}
              aria-pressed={on}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: on ? 'var(--theme-accent)' : 'var(--theme-surface-hover)',
                color: on ? '#ffffff' : 'var(--theme-text-muted)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {w === 'all' ? 'Tous' : w} <span className="opacity-70 tabular-nums">({count})</span>
            </button>
          );
        })}
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-muted)] ml-3">
          At cap
        </span>
        {(['all', 'queue', 'throttle', 'fail-closed'] as OverflowFilter[]).map((o) => {
          const on = overflowFilter === o;
          const count = o === 'all' ? RATE_LIMITS.length : RATE_LIMITS.filter((r) => r.overflow === o).length;
          return (
            <button
              key={o}
              type="button"
              onClick={() => setOverflowFilter(o)}
              aria-pressed={on}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: on ? 'var(--theme-accent)' : 'var(--theme-surface-hover)',
                color: on ? '#ffffff' : 'var(--theme-text-muted)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {o === 'all' ? 'Tous' : o} <span className="opacity-70 tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-[var(--theme-surface-hover)] text-left text-[10.5px] uppercase tracking-wider text-[var(--theme-text-muted)]">
              <th className="font-semibold px-4 py-2.5">Surface</th>
              <th className="font-semibold px-4 py-2.5">Window</th>
              <th className="font-semibold px-4 py-2.5 text-right">Used / Limit</th>
              <th className="font-semibold px-4 py-2.5">Usage</th>
              <th className="font-semibold px-4 py-2.5">At cap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Aucun plafond ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const pct = Math.round((r.used / r.limit) * 100);
                const tone = usageTone(r.used, r.limit);
                const overflow = overflowTone(r.overflow);
                const barColor =
                  tone === 'danger' ? '#dc2626' : tone === 'warn' ? '#d97706' : tone === 'ok' ? '#16a34a' : 'var(--theme-accent)';
                return (
                  <tr key={r.id} className="border-t border-[var(--panel-border-subtle)]">
                    <td className="px-4 py-2.5 text-[var(--theme-text)] font-mono text-[11.5px]">{r.surface}</td>
                    <td className="px-4 py-2.5 text-[var(--theme-text-muted)] font-mono text-[11.5px]">{r.window}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-[var(--theme-text)]">
                      {r.used} / {r.limit}
                    </td>
                    <td className="px-4 py-2.5 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--theme-surface-hover)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(2, pct)}%`, background: barColor }}
                          />
                        </div>
                        <span className={`text-[10.5px] font-mono tabular-nums ${tone === 'danger' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-[var(--theme-text-dim)]'}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone={overflow}>{r.overflow}</Pill>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11.5px]">
        <Pill tone="ok">queue</Pill>
        <Pill tone="warn">throttle</Pill>
        <Pill tone="danger">fail-closed</Pill>
        <span className="text-[var(--theme-text-muted)] col-span-full">
          Peak surface utilization this hour: <span className="font-bold tabular-nums text-[var(--theme-text)]">{Math.round(maxUsage * 100)}%</span>
        </span>
      </div>
    </div>
  );
}