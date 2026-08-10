/**
 * PostureSection.tsx — security readiness criteria, three states each.
 *
 * Conform / partial / gap. The total score is shown for context — the value
 * is the list of gaps that the operator can act on.
 *
 * Filters: category (5 buckets) and level (conform / partial / gap). The
 * summary badge at the top reflects the filtered set so the operator can
 * scope the score to a single category without losing the gap count.
 */
import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { POSTURE_CRITERIA, type PostureCriterion, type PostureLevel } from './seed';
import { ChokepointStrip, Pill, SectionHeader, type Tone } from './shared';

const LEVEL_META: Record<PostureLevel, Tone> = {
  conform: 'ok',
  partial: 'warn',
  gap: 'danger',
};

const LEVEL_LABEL: Record<PostureLevel, string> = {
  conform: 'Conform',
  partial: 'Partial',
  gap: 'Gap',
};

const CATEGORY_LABEL: Record<PostureCriterion['category'], string> = {
  'access-control': 'Access Control',
  'audit-trail': 'Audit Trail',
  'encryption': 'Encryption',
  'monitoring': 'Monitoring',
  'data-handling': 'Data Handling',
};

type CategoryFilter = 'all' | PostureCriterion['category'];
type LevelFilter = 'all' | PostureLevel;

export function PostureSection() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const filtered = useMemo(() => {
    return POSTURE_CRITERIA.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      return true;
    });
  }, [categoryFilter, levelFilter]);

  const summary = useMemo(() => {
    const counts: Record<PostureLevel, number> = { conform: 0, partial: 0, gap: 0 };
    filtered.forEach((c) => counts[c.level]++);
    const score = filtered.length === 0 ? 0 : Math.round((counts.conform / filtered.length) * 100);
    return { counts, score };
  }, [filtered]);

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Security Posture"
        subtitle="Five control categories, nine verifiable criteria. The total score is shown for context — the value is the list of gaps. Each gap maps to a fix on the Compliance page."
        icon={ShieldCheck}
        badge={
          <div className="flex gap-1.5">
            <Pill tone={summary.score >= 80 ? 'ok' : summary.score >= 50 ? 'warn' : 'danger'}>
              {summary.score}%
            </Pill>
            <Pill tone="ok">{summary.counts.conform} conform</Pill>
            <Pill tone="warn">{summary.counts.partial} partial</Pill>
            <Pill tone="danger">{summary.counts.gap} gap</Pill>
          </div>
        }
      />

      <div className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">
          Turn chokepoint (single pipe, fails-closed cost cap)
        </div>
        <ChokepointStrip />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">
          Category
        </span>
        {(['all', 'access-control', 'audit-trail', 'encryption', 'monitoring', 'data-handling'] as CategoryFilter[]).map((c) => {
          const on = categoryFilter === c;
          const count = c === 'all' ? POSTURE_CRITERIA.length : POSTURE_CRITERIA.filter((x) => x.category === c).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              aria-pressed={on}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: on ? 'var(--theme-accent)' : 'var(--theme-surface-hover)',
                color: on ? '#ffffff' : 'var(--theme-text-muted)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {c === 'all' ? 'Toutes' : CATEGORY_LABEL[c]} <span className="opacity-70 tabular-nums">({count})</span>
            </button>
          );
        })}
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-muted)] ml-3">
          Level
        </span>
        {(['all', 'conform', 'partial', 'gap'] as LevelFilter[]).map((l) => {
          const on = levelFilter === l;
          const count = l === 'all' ? POSTURE_CRITERIA.length : POSTURE_CRITERIA.filter((x) => x.level === l).length;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLevelFilter(l)}
              aria-pressed={on}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: on ? 'var(--theme-accent)' : 'var(--theme-surface-hover)',
                color: on ? '#ffffff' : 'var(--theme-text-muted)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {l === 'all' ? 'Tous' : LEVEL_LABEL[l]} <span className="opacity-70 tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-[var(--theme-surface-hover)] text-left text-[10.5px] uppercase tracking-wider text-[var(--theme-text-muted)]">
              <th className="font-semibold px-4 py-2.5 w-[110px]">Category</th>
              <th className="font-semibold px-4 py-2.5">Criterion</th>
              <th className="font-semibold px-4 py-2.5 w-[110px]">Level</th>
              <th className="font-semibold px-4 py-2.5">Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Aucun critère ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t border-[var(--panel-border-subtle)]">
                  <td className="px-4 py-3 text-[var(--theme-text-muted)] text-[11px] font-mono uppercase tracking-wide">
                    {CATEGORY_LABEL[c.category]}
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text)]">{c.label}</td>
                  <td className="px-4 py-3">
                    <Pill tone={LEVEL_META[c.level]}>{LEVEL_LABEL[c.level]}</Pill>
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)] text-[11.5px] leading-snug">
                    {c.note}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[11px] text-[var(--theme-text-muted)]">
        {summary.counts.gap === 0 ? (
          <span className="text-green-700 font-semibold">No gaps in this filter. Keep the criteria up to date as the system changes.</span>
        ) : (
          <span>
            <span className="text-red-600 font-bold tabular-nums">{summary.counts.gap}</span> gap(s) to close.
            See the Compliance page for the remediation brief to paste into Claude Code.
          </span>
        )}
      </div>
    </div>
  );
}