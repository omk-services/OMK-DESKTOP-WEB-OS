/**
 * Cost — dépense à date, projection fin de mois, mois précédent, bandeau rouge
 * si le budget est dépassé (cf. 11-cost-spend.png du brief), et répartition
 * « où part l'argent » (cf. 12-cost-repartition.png).
 */
import type { JSX } from 'react';
import { AlertOctagon, Coins, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { COST_BUCKETS, COST_TREND, MONTH_SUMMARY } from '../seed';
import { IconChip, KpiTile, Panel, Pill, ProgressBar, SectionTitle, Sparkline } from '../Primitives';

export function Cost(): JSX.Element {
  const monthlyPct = (MONTH_SUMMARY.monthToDateUsd / MONTH_SUMMARY.monthBudgetUsd) * 100;
  const overBy = MONTH_SUMMARY.monthToDateUsd - MONTH_SUMMARY.monthBudgetUsd;
  const variancePct = ((MONTH_SUMMARY.monthToDateUsd - MONTH_SUMMARY.monthPreviousUsd) / MONTH_SUMMARY.monthPreviousUsd) * 100;

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Operations"
        title="Cost"
        subtitle="Dépense à date, projection fin de mois, mois précédent, répartition par poste."
      />

      {/* Over-budget red banner — appears only when over */}
      {monthlyPct > 100 ? (
        <Panel
          pad="p-5"
          className="flex flex-wrap items-center gap-4"
          style={{
            border: '1px solid #b91c1c',
            background: 'rgba(185,28,28,0.10)',
          }}
        >
          <IconChip tone="danger" size={48}>
            <AlertOctagon className="h-5 w-5" />
          </IconChip>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b91c1c' }}>
              Budget mensuel dépassé
            </div>
            <p className="mt-1 text-[14px] font-semibold" style={{ color: 'var(--theme-text)' }}>
              Tu as consommé <span className="font-bold tabular-nums">${overBy.toFixed(0)}</span> au-dessus du budget —
              la trajectoire continue à ${MONTH_SUMMARY.monthProjectionUsd.toFixed(0)} d'ici la fin du mois.
            </p>
          </div>
          <Pill tone="danger">+{monthlyPct.toFixed(0)}% du budget</Pill>
        </Panel>
      ) : monthlyPct > 80 ? (
        <Panel
          pad="p-5"
          className="flex flex-wrap items-center gap-4"
          style={{ border: '1px solid #b45309', background: 'rgba(180,83,9,0.10)' }}
        >
          <IconChip tone="warn" size={48}>
            <AlertOctagon className="h-5 w-5" />
          </IconChip>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b45309' }}>
              Approche du plafond
            </div>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--theme-text)' }}>
              {monthlyPct.toFixed(0)}% du budget consommé · projection ${MONTH_SUMMARY.monthProjectionUsd.toFixed(0)}.
            </p>
          </div>
        </Panel>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="Ce mois · à date"
          value={`$${MONTH_SUMMARY.monthToDateUsd.toFixed(0)}`}
          tone="accent"
          hint={`vs $${MONTH_SUMMARY.monthPreviousUsd.toFixed(0)} mois dernier`}
          trend={{ dir: variancePct >= 0 ? 'up' : 'down', value: `${Math.abs(variancePct).toFixed(1)}%` }}
        />
        <KpiTile
          label="Projection fin de mois"
          value={`$${MONTH_SUMMARY.monthProjectionUsd.toFixed(0)}`}
          tone={MONTH_SUMMARY.overBudget ? 'danger' : 'warn'}
          hint="sur la trajectoire actuelle"
        />
        <KpiTile
          label="Mois précédent"
          value={`$${MONTH_SUMMARY.monthPreviousUsd.toFixed(0)}`}
          tone="neutral"
        />
        <KpiTile
          label="Budget"
          value={`$${MONTH_SUMMARY.monthBudgetUsd.toFixed(0)}`}
          tone={MONTH_SUMMARY.overBudget ? 'danger' : 'ok'}
          hint={MONTH_SUMMARY.overBudget ? `+$${overBy.toFixed(0)} au-dessus` : 'plafond mensuel'}
        />
      </div>

      <Panel pad="p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
              Consommation vs budget
            </div>
            <div className="mt-1 text-[16px] font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>
              ${MONTH_SUMMARY.monthToDateUsd.toFixed(0)} / ${MONTH_SUMMARY.monthBudgetUsd.toFixed(0)}
            </div>
          </div>
          <Pill tone={MONTH_SUMMARY.overBudget ? 'danger' : monthlyPct > 80 ? 'warn' : 'ok'}>
            {monthlyPct.toFixed(0)}%
          </Pill>
        </div>
        <ProgressBar value={Math.min(150, monthlyPct)} tone={MONTH_SUMMARY.overBudget ? 'danger' : monthlyPct > 80 ? 'warn' : 'ok'} />
      </Panel>

      {/* Trend chart + breakdown */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Tendance"
            title="8 derniers jours"
            subtitle="Dépense quotidienne, modèle réel."
            action={<Pill tone="info">coût agrégé</Pill>}
          />
          <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface-hover)' }}>
            <Sparkline values={COST_TREND.map((p) => p.value)} width={520} height={140} />
            <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
              {COST_TREND.map((p) => (
                <span key={p.day}>{p.day.split(' ')[1]}</span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Small label="Moyenne / jour" value={`$${(COST_TREND.reduce((a, b) => a + b.value, 0) / COST_TREND.length).toFixed(2)}`} />
            <Small label="Pic" value={`$${Math.max(...COST_TREND.map((p) => p.value)).toFixed(2)}`} />
            <Small label="Plus bas" value={`$${Math.min(...COST_TREND.map((p) => p.value)).toFixed(2)}`} />
          </div>
        </Panel>

        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Répartition"
            title="Où va l'argent · mois en cours"
            subtitle={`Top fournisseur : ${MONTH_SUMMARY.topVendor}`}
          />
          <ul className="flex flex-col gap-3">
            {COST_BUCKETS.map((b) => {
              const sharePct = (b.value / COST_BUCKETS.reduce((a, x) => a + x.value, 0)) * 100;
              return (
                <li key={b.label} className="rounded-xl p-3" style={{ background: 'var(--theme-surface-hover)' }}>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
                    <span className="flex-1 truncate font-semibold" style={{ color: 'var(--theme-text)' }}>{b.label}</span>
                    <span className="font-mono tabular-nums" style={{ color: 'var(--theme-text)' }}>${b.value.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--theme-surface)' }}>
                      <div className="h-full rounded-full" style={{ width: `${sharePct}%`, background: b.color }} />
                    </div>
                    <span className="text-[10.5px] tabular-nums" style={{ color: 'var(--theme-text-dim)' }}>{sharePct.toFixed(0)}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3 w-3" /> 5 fournisseurs
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3 w-3" /> total jour ${COST_BUCKETS.reduce((a, b) => a + b.value, 0).toFixed(2)}
            </span>
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

// Icons reserved for future breakdowns.
void TrendingUp; void TrendingDown;
