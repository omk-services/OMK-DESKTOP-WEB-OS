/** SalesItemDetail — liquid-glass layout.
 *
 * Canon: spec §4 #10 Sales — "Hero + 2-col (Context card / Action stack)
 *         — content plate MUST stay opaque (fix 5b8fc74)".
 *
 * Real data shape (seed: deals): client, offer, value, stage.
 * We branch on the offer (Citadelle vs Programme) and on the stage to
 * give each deal a distinct surface — they're not interchangeable.
 *
 * Cause D — chaînage deal Won : sur un deal au stade 'Won', le bouton
 * « Mark Paid · Send onboarding » crée réellement un client (s'il
 * n'existe pas) ET une facture miroir du montant/deal/client, puis
 * confirme par un toast. Avant, c'était un toast vide — la
 * fonctionnalité la plus attendue de cette famille d'app.
 */
import { Building2, Handshake, Sparkles, Target } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';

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

/** Crude probability guess from the stage — real deals carry this elsewhere. */
function probabilityFor(stage: string | undefined, value: number | undefined): number {
  const s = (stage ?? '').toLowerCase();
  if (s.includes('won') || s.includes('closed')) return 100;
  if (s.includes('proposal')) return 60;
  if (s.includes('qualified')) return 30;
  if (s.includes('discovery')) return 15;
  return value ? Math.min(50, Math.round(value / 50)) : 0;
}

const OFFER_BLURBS: Record<string, string> = {
  Citadelle:
    'Flagship high-touch engagement — weekly sessions, async voice memos, the full Citadel OS at the client\'s service.',
  Programme:
    'Twelve-week cohort programme — group coaching plus async support, the on-ramp into the practice.',
};

export function SalesItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const offer = readString(item, 'offer') ?? '';
  const stage = readString(item, 'stage', 'status');
  const amount = readNumber(item, 'value', 'amount');
  const prob = probabilityFor(stage, amount);
  const weightedValue = amount !== undefined ? Math.round((amount * prob) / 100) : undefined;
  const offerBlurb = OFFER_BLURBS[offer] ?? `Coaching engagement for ${title}. Stage: ${stage ?? 'open'}.`;
  const addToast = useShellStore((s) => s.addToast);
  const clientsItems = useCmsStore((s) => s.items['clients']) ?? [];
  const addItem = useCmsStore((s) => s.addItem);
  /** Mark Paid · Send onboarding — wire the deal to a real invoice + client.
   *  Before, this button only pushed a toast. Now it derives an invoice number
   *  from the current ISO month, ensures the client exists (matches by
   *  case-insensitive name), and confirms each side via its own toast. */
  const onWonOnboard = (dealId: string): void => {
    if (amount === undefined || amount <= 0) {
      addToast({ source: 'Sales', type: 'warning', message: `Deal value is missing — cannot invoice.` });
      return;
    }
    const now = new Date();
    const due = new Date(now.getTime() + 30 * 86400_000);
    const isoMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const clientName = String(item['client'] ?? title).trim() || title;

    // Client — ensure one exists, match case-insensitive on the name.
    const existingClient = clientsItems.find((c) => String(c.name ?? '').trim().toLowerCase() === clientName.toLowerCase());
    if (!existingClient) {
      const clientResult = addItem('clients', {
        name: clientName,
        segment: `${offer || 'Coaching'} — ${offer ? 'Citadelle high ticket' : 'coaching'}`,
        ticket: amount,
        openThreads: 0,
        nextSession: 'Not scheduled',
        health: 100,
        onboardingStep: '1 / 7',
        status: 'Onboarding',
      });
      if (clientResult.ok) {
        addToast({ source: 'Sales', type: 'success', message: `Client « ${clientName} » créé.` });
      } else {
        addToast({ source: 'Sales', type: 'warning', message: `Client non créé : ${clientResult.error ?? 'erreur inconnue'}.` });
      }
    }

    const invoiceResult = addItem('invoices', {
      client: clientName,
      number: `INV-${isoMonth}-${dealId.slice(-4)}`,
      amount,
      status: 'Sent',
      due: due.toISOString().slice(0, 10),
      issued: now.toISOString().slice(0, 10),
      description: `Invoice line · ${offer || 'coaching engagement'} — deal ${dealId}`,
    });
    if (invoiceResult.ok) {
      addToast({
        source: 'Sales',
        type: 'success',
        message: `Facture créée pour ${clientName} ($${amount.toLocaleString('en-US')}).`,
      });
    } else {
      addToast({ source: 'Sales', type: 'warning', message: `Facture non créée : ${invoiceResult.error ?? 'erreur inconnue'}.` });
    }
  };
  const fireAction = (actionLabel: string, message: string, onClick?: () => void): void => {
    if (onClick) onClick();
    addToast({ source: 'Sales', type: 'success', message });
    void actionLabel;
  };
  const isWon = stage?.toLowerCase().includes('won') ?? false;

  return (
    <div
      className="min-h-full p-7 relative"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      {/* Refractive glass shell — bright wash, blurry */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(70% 60% at 30% 0%, ${accent}40 0%, transparent 60%), radial-gradient(60% 50% at 90% 30%, ${accent}30 0%, transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-16 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      <div className="relative">
        <BackAffordance label="Back to Sales OS" onBack={onBack} accent={accent} />

        {/* Hero — OPAQUE plate (fix 5b8fc74) */}
        <div
          className="mt-5 rounded-3xl p-6"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 24px 60px -28px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5" style={{ color: accent }} />
                <span
                  className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  Sales · {def.singular}
                </span>
                {offer && <PillBadge accent={accent}>{offer}</PillBadge>}
                {stage && <PillBadge accent={accent}>{stage}</PillBadge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm mt-1.5" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
              )}
            </div>
            {amount !== undefined && (
              <div className="text-right shrink-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Deal value</div>
                <div
                  className="text-5xl font-extrabold leading-none mt-1 tabular-nums"
                  style={{ color: accent }}
                >
                  ${amount.toLocaleString('en-US')}
                </div>
                {weightedValue !== undefined && (
                  <div className="text-xs font-semibold mt-2 flex items-center gap-1 justify-end" style={{ color: 'var(--theme-muted)' }}>
                    <Target className="w-3 h-3" /> {prob}% likely · ${weightedValue.toLocaleString('en-US')} weighted
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2-col: Offer blurb / Pipeline lane */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Context — OPAQUE */}
          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 18px 36px -22px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Offer & deal context</span>
            </div>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--theme-text)' }}
            >
              {offerBlurb}
            </p>

            {/* Probability bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  Stage probability
                </div>
                <div className="text-[11px] font-extrabold tabular-nums" style={{ color: accent }}>{prob}%</div>
              </div>
              <div
                className="h-2 overflow-hidden"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div
                  className="h-full"
                  style={{ width: `${prob}%`, background: accent }}
                />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {def.fields
                .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
                .map(f => (
                  <div key={f.key}>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                    <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Action stack — OPAQUE */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 18px 36px -22px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Handshake className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Move it forward</span>
            </div>

            <ul className="space-y-2.5">
              {[
                {
                  label: isWon ? 'Mark Paid · Send onboarding' : 'Send proposal',
                  message: isWon
                    ? `Onboarding packet queued for ${title}`
                    : `Proposal drafted for ${title}`,
                  onClick: isWon ? () => onWonOnboard(String(item.id)) : undefined,
                },
                {
                  label: 'Schedule 30-min check-in',
                  message: `Calendar invite drafted for ${title}`,
                  onClick: undefined,
                },
                {
                  label: 'Open in Sales pipeline',
                  message: `Already viewing ${title} in the Sales pipeline`,
                  onClick: undefined,
                },
                {
                  label: 'Open in Tasks as next action',
                  message: `Next action saved for ${title}`,
                  onClick: undefined,
                },
              ].map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    onClick={() => fireAction(a.label, a.message, a.onClick)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
                    style={{
                      background: 'var(--canvas)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border-subtle)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                    <span className="min-w-0 truncate">{a.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--panel-border-subtle)' }}>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                Weighted forecast
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: accent }}>
                {weightedValue !== undefined ? `$${weightedValue.toLocaleString('en-US')}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
