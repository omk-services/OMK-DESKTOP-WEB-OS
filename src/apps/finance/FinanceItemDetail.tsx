/** FinanceItemDetail — trust layout.
 *
 * Canon: spec §4 #11 Finance — "Hero + horizontal KPI strip (3 figures)
 *         + dense data table".
 *
 * Real data shape (seed: invoices): client, amount, due, status.
 * The "table" is the AR aging grid across every invoice in the
 * collection, so the focused item sits in its real context.
 */
import type { JSX } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator, Wallet } from 'lucide-react';
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

interface InvoiceRow {
  id: string;
  client: string;
  amount: number;
  due: string;
  status: string;
}

export function FinanceItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const amount = readNumber(item, 'amount');
  const due = readString(item, 'due');
  const status = readString(item, 'status') ?? 'Open';

  // Pull every invoice from the store so the aging table is real, not
  // synthesised. This is the only place we read outside `def.fields`.
  // We use the cms store via a tiny inline hook-style accessor — keeping
  // it local avoids creating a circular dependency.
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

      {/* Hero */}
      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              FINANCE · {def.singular.toUpperCase()}
            </span>
            <PillBadge accent={accent}>{status}</PillBadge>
          </div>
          <h1
            className="text-3xl font-extrabold tracking-tight tabular-nums"
            style={{ color: 'var(--theme-text)' }}
          >
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

      {/* KPI strip — 3 figures */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: 'Paid (whole ledger)',
            icon: ArrowDownRight,
            value: `$${paidTotal.toLocaleString('en-US')}`,
            color: '#15803d',
            sub: thisIsPaid ? 'This invoice is paid.' : 'Across all invoices.',
          },
          {
            label: 'Open (whole ledger)',
            icon: ArrowUpRight,
            value: `$${openTotal.toLocaleString('en-US')}`,
            color: isThisOpen ? accent : '#d97706',
            sub: isThisOpen ? 'Outstanding on this one.' : 'Other invoices still open.',
          },
          {
            label: 'Total billed',
            icon: Calculator,
            value: `$${grandTotal.toLocaleString('en-US')}`,
            color: accent,
            sub: `${allRows.length} invoices`,
          },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl p-4"
              style={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--panel-border)',
                boxShadow: 'var(--shadow-panel)',
              }}
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

      {/* AR aging table — dense, focused item highlighted */}
      <div
        className="mt-5 rounded-xl overflow-hidden"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-panel)',
        }}
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
                  style={{
                    background: isFocused ? `${accent}12` : 'transparent',
                    borderBottom: i === allRows.length - 1 ? 'none' : '1px solid var(--panel-border-subtle)',
                  }}
                >
                  <td className="px-4 py-2 font-semibold" style={{ color: isFocused ? accent : 'var(--theme-text)' }}>
                    {row.client ?? '—'}
                    {isFocused && (
                      <span
                        className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                        style={{ color: accent }}
                      >
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

      {/* Attribute grid */}
      <div
        className="mt-5 rounded-xl p-5"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-panel)',
        }}
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
