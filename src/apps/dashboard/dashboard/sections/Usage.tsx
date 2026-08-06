/**
 * Usage — consommation & facturation du jour. Plafond journalier, projection
 * 24 h, distribution par fournisseur, et projection fin de mois.
 */
import type { JSX } from 'react';
import { AlertTriangle, Coins, Gauge, Timer, TrendingUp } from 'lucide-react';
import { AGENTS, COST_BUCKETS, MONTH_SUMMARY, USAGE_TODAY } from '../seed';
import { ACCENT, IconChip, KpiTile, Panel, ProgressBar, SectionTitle, Sparkline } from '../Primitives';

export function Usage(): JSX.Element {
  const overRate = USAGE_TODAY.costUsd / USAGE_TODAY.budgetUsd;
  const remaining = USAGE_TODAY.budgetUsd - USAGE_TODAY.costUsd;
  const tokensTotal = USAGE_TODAY.tokensIn + USAGE_TODAY.tokensOut;
  const monthlyProjected = MONTH_SUMMARY.monthProjectionUsd;

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Operations"
        title="Usage"
        subtitle="Consommation & facturation · plafond journalier, projection fin de mois."
      />

      {/* Daily cap banner */}
      <Panel
        pad="p-5"
        className="flex flex-wrap items-center gap-5"
        style={{ borderLeft: `3px solid ${overRate > 0.8 ? '#dc2626' : overRate > 0.6 ? ACCENT : '#15803d'}` }}
      >
        <IconChip tone={overRate > 0.8 ? 'danger' : overRate > 0.6 ? 'warn' : 'ok'} size={48}>
          <Gauge className="h-5 w-5" />
        </IconChip>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
            Plafond journalier · {Math.round(overRate * 100)}% consommé
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
              ${USAGE_TODAY.costUsd.toFixed(2)}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
              sur ${USAGE_TODAY.budgetUsd.toFixed(2)}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold tabular-nums" style={{ color: overRate > 0.8 ? '#dc2626' : '#15803d' }}>
              {remaining >= 0 ? `reste $${remaining.toFixed(2)}` : `dépassé $${Math.abs(remaining).toFixed(2)}`}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={Math.min(120, overRate * 100)} tone={overRate > 0.8 ? 'danger' : overRate > 0.6 ? 'warn' : 'ok'} />
          </div>
        </div>
      </Panel>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="Tokens · 24 h"
          value={tokensTotal.toLocaleString()}
          tone="accent"
          hint={`in ${USAGE_TODAY.tokensIn.toLocaleString()} · out ${USAGE_TODAY.tokensOut.toLocaleString()}`}
        />
        <KpiTile
          label="Coût · 24 h"
          value={`$${USAGE_TODAY.costUsd.toFixed(2)}`}
          tone="ok"
          trend={{ dir: 'down', value: '−23% vs 7j' }}
        />
        <KpiTile
          label="Projection 24 h"
          value={`$${USAGE_TODAY.projectionUsd.toFixed(2)}`}
          tone="warn"
          hint="sur la trajectoire actuelle"
        />
        <KpiTile
          label="Mois en cours"
          value={`$${MONTH_SUMMARY.monthToDateUsd.toFixed(0)}`}
          tone={MONTH_SUMMARY.overBudget ? 'danger' : 'accent'}
          hint={`projection $${monthlyProjected.toFixed(0)}`}
        />
      </div>

      {/* Hourly curve + providers */}
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Trajectoire"
            title="Dépense horaire · 12 h glissantes"
            subtitle="Sparkline cumulée depuis minuit, lissée sur la fenêtre."
          />
          <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface-hover)' }}>
            <Sparkline values={USAGE_TODAY.costPerHourUsd} width={520} height={140} />
            <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>now</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Small label="Coût moyen / h" value={`$${(USAGE_TODAY.costUsd / 12).toFixed(2)}`} />
            <Small label="Pic / h" value={`$${Math.max(...USAGE_TODAY.costPerHourUsd).toFixed(2)}`} />
            <Small label="Plus bas / h" value={`$${Math.min(...USAGE_TODAY.costPerHourUsd).toFixed(2)}`} />
          </div>
        </Panel>

        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Mix"
            title="Par fournisseur"
            subtitle="Répartition de la dépense du jour par modèle."
          />
          <ul className="flex flex-col gap-2.5">
            {COST_BUCKETS.map((b) => {
              const pct = (b.value / USAGE_TODAY.costUsd) * 100;
              return (
                <li key={b.label}>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.color }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--theme-text)' }}>{b.label}</span>
                    <span className="font-mono tabular-nums" style={{ color: 'var(--theme-text)' }}>${b.value.toFixed(2)}</span>
                    <span className="w-12 text-right tabular-nums" style={{ color: 'var(--theme-text-dim)' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--theme-surface-hover)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center gap-2 text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
            <AlertTriangle className="h-3 w-3" /> {AGENTS.length} agents · tous comptés
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--theme-surface-hover)' }}>
      <div className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
        {label}
      </div>
      <div className="mt-1 text-[14px] font-extrabold tabular-nums" style={{ color: 'var(--theme-text)' }}>
        {value}
      </div>
    </div>
  );
}

// Suppress unused import warnings for icons kept for future use.
void Coins; void Timer; void TrendingUp;
