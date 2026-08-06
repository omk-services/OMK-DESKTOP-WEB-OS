/** FinanceItemDetail — trust layout for invoices + dedicated surfaces for the
 *  four pricing collections introduced for the v2 expansion:
 *    - plancher_marges : cost / floor / price bar, gap and margin
 *    - courbe_demande  : price-scenario ladder, sweet-spot marker
 *    - budget_tokens   : model spend vs FTE it replaces (ratio)
 *    - formes_prix     : billing shape, cashflow + commitment pills
 *
 *  Canon: spec §4 #11 Finance — "Hero + horizontal KPI strip (3 figures)
 *         + dense data table". The four new surfaces keep the same shell but
 *         swap the data table for a tailored body that matches the primitive
 *         each collection actually carries.
 */
import type { JSX } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator, Wallet, TrendingDown, TrendingUp, LineChart, Coins, Receipt, Scale, CircleDollarSign } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

function readNumber(item: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

const PLANCHER_TONE: Record<string, { fg: string; bg: string; border: string; label: string }> = {
  ok:     { fg: '#15803d', bg: '#dcfce7', border: '#86efac', label: 'AU-DESSUS DU PLANCHER' },
  warn:   { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'TANGENTE — SURVEILLER' },
  danger: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', label: 'SOUS LE PLANCHER' },
};

const ELASTICITY_TONE: Record<string, { fg: string; bg: string; border: string; label: string }> = {
  low:  { fg: '#15803d', bg: '#dcfce7', border: '#86efac', label: 'INÉLASTIQUE' },
  med:  { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'ÉLASTICITÉ MOYENNE' },
  high: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', label: 'TRÈS ÉLASTIQUE' },
};

const CASHFLOW_TONE: Record<string, { fg: string; bg: string; border: string }> = {
  immediate: { fg: '#15803d', bg: '#dcfce7', border: '#86efac' },
  upfront:   { fg: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  recurring: { fg: '#0d9488', bg: '#ccfbf1', border: '#5eead4' },
  event:     { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  deferred:  { fg: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
};

export function FinanceItemDetail(props: ItemDetailProps): JSX.Element {
  const { def } = props;
  const collection = def.id;

  if (collection === 'invoices') return <InvoiceDetail {...props} />;
  if (collection === 'plancher_marges') return <PlancherDetail {...props} />;
  if (collection === 'courbe_demande') return <CourbeDetail {...props} />;
  if (collection === 'budget_tokens') return <BudgetTokensDetail {...props} />;
  if (collection === 'formes_prix') return <FormesPrixDetail {...props} />;

  return <GenericFinanceDetail {...props} />;
}

/* ═══ Invoices — original AR aging layout ═══ */

interface InvoiceRow {
  id: string;
  client: string;
  amount: number;
  due: string;
  status: string;
}

function InvoiceDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const amount = readNumber(item, 'amount');
  const due = readString(item, 'due');
  const status = readString(item, 'status') ?? 'Open';

  const items = (props.def && (props as unknown as { items?: InvoiceRow[] }).items) || [];
  const allRows: InvoiceRow[] = Array.isArray(items) && items.length > 0
    ? items
    : [{ id: item.id, client: title, amount: amount ?? 0, due: due ?? '—', status }];

  const paidTotal   = allRows.filter(r => (r.status || '').toLowerCase() === 'paid').reduce((s, r) => s + (r.amount || 0), 0);
  const openTotal   = allRows.filter(r => (r.status || '').toLowerCase() !== 'paid').reduce((s, r) => s + (r.amount || 0), 0);
  const grandTotal  = allRows.reduce((s, r) => s + (r.amount || 0), 0);

  const thisIsPaid = status.toLowerCase() === 'paid';
  const isThisOpen = !thisIsPaid;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to ledger" onBack={onBack} accent={accent} />

      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              FINANCE · {def.singular.toUpperCase()}
            </span>
            <PillBadge accent={accent}>{status}</PillBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
        </div>
        {amount !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Amount</div>
            <div className="text-5xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: accent }}>
              ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {due && <div className="text-xs mt-1.5" style={{ color: 'var(--theme-muted)' }}>Due {due}</div>}
          </div>
        )}
      </header>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Paid (whole ledger)', icon: ArrowDownRight, value: `$${paidTotal.toLocaleString('en-US')}`, color: '#15803d', sub: thisIsPaid ? 'This invoice is paid.' : 'Across all invoices.' },
          { label: 'Open (whole ledger)', icon: ArrowUpRight, value: `$${openTotal.toLocaleString('en-US')}`, color: isThisOpen ? accent : '#d97706', sub: isThisOpen ? 'Outstanding on this one.' : 'Other invoices still open.' },
          { label: 'Total billed', icon: Calculator, value: `$${grandTotal.toLocaleString('en-US')}`, color: accent, sub: `${allRows.length} invoices` },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl p-4"
              style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>{k.label}</div>
                <Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <div className="mt-1.5 text-2xl font-extrabold tabular-nums" style={{ color: k.color }}>{k.value}</div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-muted)' }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-5 rounded-xl overflow-hidden"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--panel-border-subtle)', background: 'var(--canvas)' }}>
          <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--theme-muted)' }} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Accounts receivable · every invoice</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--panel-border-subtle)' }}>
              <th className="text-left px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Client</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Due</th>
              <th className="text-right px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Amount</th>
              <th className="text-right px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, i) => {
              const isFocused = String(row.id) === String(item.id);
              return (
                <tr
                  key={row.id ?? i}
                  style={{ background: isFocused ? `${accent}12` : 'transparent', borderBottom: i === allRows.length - 1 ? 'none' : '1px solid var(--panel-border-subtle)' }}
                >
                  <td className="px-4 py-2 font-semibold" style={{ color: isFocused ? accent : 'var(--theme-text)' }}>
                    {row.client ?? '—'}
                    {isFocused && (
                      <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
                        ← this one
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--theme-text)' }}>{row.due ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--theme-text)' }}>${(row.amount ?? 0).toLocaleString('en-US')}</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2 py-0.5"
                      style={{
                        background: (row.status ?? '').toLowerCase() === 'paid' ? 'rgba(21,128,61,0.12)' : `${accent}1f`,
                        color: (row.status ?? '').toLowerCase() === 'paid' ? '#15803d' : accent,
                        borderRadius: 0,
                      }}
                    >
                      {row.status ?? '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--theme-text)' }}>
              <td className="px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }} colSpan={2}>Total</td>
              <td className="px-3 py-2 text-right text-sm font-extrabold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                ${grandTotal.toLocaleString('en-US')}
              </td>
              <td className="px-4 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5 tabular-nums" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

/* ═══ Plancher de marge — cost / floor / price bar + gap ═══ */

function PlancherDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const status = (readString(item, 'status') ?? 'ok').toLowerCase();
  const tone = PLANCHER_TONE[status] ?? PLANCHER_TONE.ok;

  const realCost = readNumber(item, 'realCost') ?? 0;
  const floor = readNumber(item, 'floor') ?? 0;
  const price = readNumber(item, 'price') ?? 0;
  const gap = readNumber(item, 'gap') ?? (price - floor);
  const marginPct = readNumber(item, 'marginPct') ?? (floor > 0 ? Math.round(((price - floor) / floor) * 100) : 0);
  const unit = readString(item, 'unit') ?? 'unit';
  const note = readString(item, 'note') ?? '';

  const scale = Math.max(price, floor, realCost) * 1.15;
  const pct = (v: number): string => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to planchers" onBack={onBack} accent={accent} />

      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
              FINANCE · PLANCHER DE MARGE
            </span>
            <PillBadge accent={accent}>{status.toUpperCase()}</PillBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle} · {unit}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Margin over floor</div>
          <div className="text-5xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: tone.fg }}>
            {marginPct}%
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--theme-muted)' }}>{tone.label}</div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <PriceTile
          label="Coût réel / unité"
          icon={TrendingDown}
          value={`$${realCost.toLocaleString('en-US')}`}
          color="#b91c1c"
          sub="Le minimum incompressible — sans ça, on ne vit pas."
        />
        <PriceTile
          label="Plancher / unité"
          icon={Scale}
          value={`$${floor.toLocaleString('en-US')}`}
          color="#b45309"
          sub="Le seuil en dessous duquel on ne vend pas. On le casse = on perd."
        />
        <PriceTile
          label="Prix pratiqué / unité"
          icon={CircleDollarSign}
          value={`$${price.toLocaleString('en-US')}`}
          color={accent}
          sub={gap >= 0 ? `Marge ${gap.toLocaleString('en-US')}€ au-dessus du plancher.` : `${Math.abs(gap).toLocaleString('en-US')}€ SOUS le plancher.`}
        />
      </div>

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LineChart className="w-3.5 h-3.5" style={{ color: 'var(--theme-muted)' }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Coût · plancher · prix · sur une même échelle
            </span>
          </div>
          <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-muted)' }}>échelle 0 → ${Math.round(scale).toLocaleString('en-US')}</span>
        </div>

        <div className="relative h-14 rounded-lg overflow-hidden" style={{ background: 'var(--canvas)' }}>
          <div
            className="absolute left-0 top-0 h-full"
            style={{ width: pct(realCost), background: '#b91c1c33', borderRight: '2px solid #b91c1c' }}
          />
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(realCost), width: `calc(${pct(floor)} - ${pct(realCost)})`, background: '#f59e0b22' }}
          />
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(floor), width: '2px', background: '#b45309' }}
          />
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(price), width: '3px', background: accent }}
          />
          <div
            className="absolute -bottom-5 text-[10px] font-extrabold uppercase tracking-wider tabular-nums"
            style={{ left: pct(price), transform: 'translateX(-50%)', color: accent }}
          >
            ${price.toLocaleString('en-US')}
          </div>
          <div
            className="absolute -bottom-5 text-[10px] font-extrabold uppercase tracking-wider tabular-nums"
            style={{ left: pct(floor), transform: 'translateX(-50%)', color: '#b45309' }}
          >
            ${floor.toLocaleString('en-US')}
          </div>
          <div
            className="absolute -top-4 text-[10px] font-extrabold uppercase tracking-wider tabular-nums"
            style={{ left: pct(realCost), transform: 'translateX(-50%)', color: '#b91c1c' }}
          >
            coût
          </div>
        </div>
        <div className="h-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <LegendDot color="#b91c1c" label="Coût réel" />
          <LegendDot color="#b45309" label="Plancher — seuil de vente" />
          <LegendDot color={accent} label="Prix pratiqué" />
        </div>
      </div>

      {note && (
        <div
          className="mt-5 rounded-xl p-5"
          style={{
            background: status === 'danger' ? '#fee2e2' : status === 'warn' ? '#fef3c7' : '#f0fdfa',
            borderLeft: `4px solid ${tone.fg}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Receipt className="w-3.5 h-3.5" style={{ color: tone.fg }} />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.fg }}>
              {status === 'danger' ? 'Sous le plancher — décision humaine requise' : status === 'warn' ? 'Tangente — surveille la prochaine vente' : 'Ce qu\'il faut savoir avant de toucher au prix'}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{note}</p>
        </div>
      )}

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5 tabular-nums" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

function PriceTile({ label, icon: Icon, value, color, sub }: { label: string; icon: typeof TrendingDown; value: string; color: string; sub: string }): JSX.Element {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>{label}</div>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="mt-1.5 text-2xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
      <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-muted)' }}>{sub}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-[11px]" style={{ color: 'var(--theme-text)' }}>{label}</span>
    </div>
  );
}

/* ═══ Courbe de demande — price scenarios ladder ═══ */

interface ScenarioPoint { price: number; volume: number; }

function parseScenarios(raw: string): ScenarioPoint[] {
  return raw
    .split('·')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const m = s.match(/(\d[\d\s]*)\s*(?:€|\$|euros?)?\s*[→\-–>]\s*(\d[\d\s]*)/i);
      if (!m) return null;
      const price = Number(m[1].replace(/\s/g, ''));
      const volume = Number(m[2].replace(/\s/g, ''));
      if (!Number.isFinite(price) || !Number.isFinite(volume)) return null;
      return { price, volume };
    })
    .filter((p): p is ScenarioPoint => p !== null);
}

function CourbeDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const rawScenarios = readString(item, 'scenarios') ?? '';
  const scenarios = parseScenarios(rawScenarios);
  const elasticity = (readString(item, 'elasticity') ?? 'med').toLowerCase();
  const eTone = ELASTICITY_TONE[elasticity] ?? ELASTICITY_TONE.med;
  const sweetSpot = readNumber(item, 'sweetSpot') ?? 0;
  const sensitivity = (readString(item, 'sensitivity') ?? 'ok').toLowerCase();
  const sensTone = PLANCHER_TONE[sensitivity] ?? PLANCHER_TONE.ok;
  const notes = readString(item, 'notes') ?? '';

  const bestIdx = scenarios.length > 0
    ? scenarios.reduce((best, p, i) => Math.abs(p.price - sweetSpot) < Math.abs(scenarios[best]!.price - sweetSpot) ? i : best, 0)
    : -1;
  const best = bestIdx >= 0 ? scenarios[bestIdx]! : null;

  const revenues = scenarios.map(p => p.price * p.volume);
  const maxRevenue = revenues.length > 0 ? Math.max(...revenues) : 1;
  const maxVolume = scenarios.length > 0 ? Math.max(...scenarios.map(p => p.volume)) : 1;
  const maxPrice = scenarios.length > 0 ? Math.max(...scenarios.map(p => p.price)) : 1;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to courbes" onBack={onBack} accent={accent} />

      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
              FINANCE · COURBE DE DEMANDE
            </span>
            <PillBadge accent={accent}>{elasticity.toUpperCase()}</PillBadge>
            <PillBadge accent={sensTone.fg}>{sensitivity.toUpperCase()}</PillBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Sweet spot</div>
          <div className="text-5xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: accent }}>
            ${sweetSpot.toLocaleString('en-US')}
          </div>
          {best && <div className="text-xs mt-1.5" style={{ color: 'var(--theme-muted)' }}>~{best.volume} unités / mois</div>}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <PriceTile label="Élasticité" icon={TrendingDown} value={eTone.label} color={eTone.fg} sub="Combien le volume réagit au prix." />
        <PriceTile label="Scénarios testés" icon={LineChart} value={`${scenarios.length}`} color={accent} sub="Points de prix observés sur cette offre." />
        <PriceTile
          label="Revenu max observé"
          icon={TrendingUp}
          value={`$${maxRevenue.toLocaleString('en-US')}`}
          color="#15803d"
          sub={best ? `Au point ${best.price}€ × ${best.volume} ventes.` : 'Pas de scénarios.'}
        />
      </div>

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="w-3.5 h-3.5" style={{ color: 'var(--theme-muted)' }} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
            Volume estimé par prix · sweet spot marqué
          </span>
        </div>

        <div className="space-y-2.5">
          {scenarios.map((p, i) => {
            const revenue = p.price * p.volume;
            const isSweet = best !== null && p.price === best.price;
            const volPct = maxVolume > 0 ? (p.volume / maxVolume) * 100 : 0;
            const pricePct = maxPrice > 0 ? (p.price / maxPrice) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-right tabular-nums text-[11px] font-bold" style={{ color: isSweet ? accent : 'var(--theme-text)' }}>
                  ${p.price.toLocaleString('en-US')}
                </div>
                <div className="flex-1 relative h-7 rounded-md overflow-hidden" style={{ background: 'var(--canvas)', border: isSweet ? `2px solid ${accent}` : '1px solid var(--panel-border-subtle)' }}>
                  <div
                    className="absolute left-0 top-0 h-full transition-all"
                    style={{ width: `${volPct}%`, background: isSweet ? accent : `${accent}55` }}
                  />
                  <div
                    className="absolute top-0 h-full"
                    style={{ left: `${pricePct}%`, width: '2px', background: isSweet ? '#ffffff' : 'var(--theme-text)' }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-end pr-2 text-[10.5px] font-extrabold tabular-nums"
                    style={{ color: isSweet ? '#ffffff' : 'var(--theme-text)' }}
                  >
                    {p.volume} ventes · ${revenue.toLocaleString('en-US')}
                  </div>
                </div>
              </div>
            );
          })}
          {scenarios.length === 0 && (
            <div className="text-sm" style={{ color: 'var(--theme-muted)' }}>Aucun scénario lisible pour cette offre.</div>
          )}
        </div>
      </div>

      {notes && (
        <div
          className="mt-5 rounded-xl p-5"
          style={{
            background: sensitivity === 'warn' ? '#fef3c7' : sensitivity === 'danger' ? '#fee2e2' : '#f0fdfa',
            borderLeft: `4px solid ${sensTone.fg}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Coins className="w-3.5 h-3.5" style={{ color: sensTone.fg }} />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: sensTone.fg }}>
              Ce que la pente raconte
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{notes}</p>
        </div>
      )}

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5 tabular-nums" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

/* ═══ Budget tokens — model spend vs FTE it replaces ═══ */

function BudgetTokensDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const status = (readString(item, 'status') ?? 'ok').toLowerCase();
  const tone = PLANCHER_TONE[status] ?? PLANCHER_TONE.ok;

  const monthlyTokens = readNumber(item, 'monthlyTokens') ?? 0;
  const modelCost = readNumber(item, 'modelCost') ?? 0;
  const fteSalary = readNumber(item, 'fteSalary') ?? 0;
  const coverage = readString(item, 'coverage') ?? '';
  const ratio = readString(item, 'ratio') ?? '';
  const monthlySaving = readNumber(item, 'monthlySaving') ?? 0;
  const fteRole = readString(item, 'fteRole') ?? '';
  const notes = readString(item, 'notes') ?? '';

  const fteMonthly = fteSalary > 0 ? Math.round(fteSalary / 12) : 0;
  const annualModelCost = modelCost * 12;

  const scale = Math.max(fteMonthly, modelCost) * 1.15;
  const pct = (v: number): string => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to budgets" onBack={onBack} accent={accent} />

      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
              FINANCE · BUDGET DE TOKENS
            </span>
            <PillBadge accent={accent}>{status.toUpperCase()}</PillBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle} · {fteRole}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Net saving / mois</div>
          <div className="text-5xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: tone.fg }}>
            ${monthlySaving.toLocaleString('en-US')}
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--theme-muted)' }}>après coût modèle</div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <PriceTile
          label="Coût modèle / mois"
          icon={Coins}
          value={`$${modelCost.toLocaleString('en-US')}`}
          color="#b45309"
          sub={`${monthlyTokens.toLocaleString('en-US')} tokens consommés`}
        />
        <PriceTile
          label="Coût ETP / mois"
          icon={Wallet}
          value={`$${fteMonthly.toLocaleString('en-US')}`}
          color="#b91c1c"
          sub={`${fteRole} · brut chargé`}
        />
        <PriceTile
          label="Ratio"
          icon={Scale}
          value={ratio || '—'}
          color={accent}
          sub={coverage}
        />
      </div>

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" style={{ color: 'var(--theme-muted)' }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Comparaison mensuelle · modèle vs ETP
            </span>
          </div>
          <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-muted)' }}>échelle 0 → ${Math.round(scale).toLocaleString('en-US')}</span>
        </div>

        <div className="relative h-10 rounded-lg overflow-hidden" style={{ background: 'var(--canvas)' }}>
          <div
            className="absolute left-0 top-0 h-full"
            style={{ width: pct(modelCost), background: '#b45309aa', borderRight: '2px solid #b45309' }}
          />
          <div
            className="absolute left-0 top-0 h-full opacity-30"
            style={{ width: pct(fteMonthly), background: '#b91c1c' }}
          />
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(fteMonthly), width: '2px', background: '#b91c1c' }}
          />
          <div
            className="absolute inset-0 flex items-center pl-2 text-[10.5px] font-extrabold tabular-nums"
            style={{ color: '#ffffff' }}
          >
            ${modelCost} modèle
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: '#b91c1c' }}>
          <span>0</span>
          <span style={{ color: 'var(--theme-muted)' }}>${fteMonthly.toLocaleString('en-US')} ETP brut mensuel</span>
          <span>${Math.round(scale).toLocaleString('en-US')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg p-3" style={{ background: 'var(--canvas)' }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Coût modèle annuel</div>
            <div className="text-lg font-extrabold tabular-nums mt-0.5" style={{ color: '#b45309' }}>${annualModelCost.toLocaleString('en-US')}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--canvas)' }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Coût ETP annuel</div>
            <div className="text-lg font-extrabold tabular-nums mt-0.5" style={{ color: '#b91c1c' }}>${fteSalary.toLocaleString('en-US')}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--canvas)' }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Économie nette annuelle</div>
            <div className="text-lg font-extrabold tabular-nums mt-0.5" style={{ color: tone.fg }}>${(monthlySaving * 12).toLocaleString('en-US')}</div>
          </div>
        </div>
      </div>

      {notes && (
        <div
          className="mt-5 rounded-xl p-5"
          style={{
            background: status === 'danger' ? '#fee2e2' : status === 'warn' ? '#fef3c7' : '#f0fdfa',
            borderLeft: `4px solid ${tone.fg}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Receipt className="w-3.5 h-3.5" style={{ color: tone.fg }} />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.fg }}>
              Pourquoi ce ratio tient (ou pas)
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{notes}</p>
        </div>
      )}

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5 tabular-nums" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

/* ═══ Formes de prix — billing shape with cashflow + commitment ═══ */

function FormesPrixDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const pricing = readString(item, 'pricing') ?? '';
  const cashflow = (readString(item, 'cashflow') ?? 'recurring').toLowerCase();
  const commitment = readString(item, 'commitment') ?? '';
  const risk = readString(item, 'risk') ?? '';
  const bestFor = readString(item, 'bestFor') ?? '';
  const cfTone = CASHFLOW_TONE[cashflow] ?? CASHFLOW_TONE.recurring;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to formes" onBack={onBack} accent={accent} />

      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
              FINANCE · FORME DE PRIX
            </span>
            <PillBadge accent={cfTone.fg}>{cashflow.toUpperCase()}</PillBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Cash flow</div>
          <div
            className="mt-1 inline-block text-2xl font-extrabold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ background: cfTone.bg, color: cfTone.fg }}
          >
            {cashflow}
          </div>
        </div>
      </header>

      {pricing && (
        <div
          className="mt-5 rounded-xl p-5"
          style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CircleDollarSign className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Comment ça se facture
            </span>
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{pricing}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Engagement client
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{commitment || '—'}</p>
        </div>
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-3.5 h-3.5" style={{ color: '#b91c1c' }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Risque côté coach
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{risk || '—'}</p>
        </div>
      </div>

      {bestFor && (
        <div
          className="mt-5 rounded-xl p-5"
          style={{ background: '#f0fdfa', borderLeft: `4px solid ${accent}` }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
              Pour qui cette forme marche
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{bestFor}</p>
        </div>
      )}

      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

/* ═══ Generic fallback — keeps the page readable if a new collection is added ═══ */

function GenericFinanceDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const badge = def.badgeField ? String(item[def.badgeField] ?? '') : '';
  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to finance" onBack={onBack} accent={accent} />
      <header className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>FINANCE · {def.singular.toUpperCase()}</span>
          {badge && <PillBadge accent={accent}>{badge}</PillBadge>}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
      </header>
      <div
        className="mt-5 rounded-xl p-5"
        style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>
      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
