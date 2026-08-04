/** ClientsItemDetail — claymorphism layout.
 *
 * Canon: spec §4 #5 Clients — "Hero + portrait + 3-pill stack
 *         (Active contract / Onboarding step / Churn risk)".
 * Theme: claymorphism (puffy 3D, thick soft shadows, oversized radius).
 * Motion: pop-scale 200ms.
 *
 * Covers: session_notes (the IP Vault). Designed so any client-derived
 * item still feels claymorphic.
 */
import type { JSX } from 'react';
import { Heart, IdCard, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

export function ClientsItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const contract = readString(item, 'contract', 'plan', 'tier') ?? 'Active';
  const onboarding = readString(item, 'onboardingStep', 'onboarding', 'phase') ?? 'Kickoff';
  const churn = readString(item, 'churnRisk', 'risk') ?? 'Low';
  const summary = readString(item, 'summary', 'note', 'body');
  const initials = title.split(/\s+/).map(w => w.charAt(0).toUpperCase()).filter(Boolean).slice(0, 2).join('') || '?';

  const churnTone =
    churn.toLowerCase().includes('high') ? '#dc2626' :
    churn.toLowerCase().includes('med')  ? '#d97706' :
    '#15803d';

  return (
    <div
      className="min-h-full p-7"
      style={{
        color: 'var(--theme-text)',
        background: 'var(--theme-bg)',
      }}
    >
      <BackAffordance label="Back to clients" onBack={onBack} accent={accent} />

      {/* Hero — puffy portrait block, oversized rounded corners */}
      <div
        className="mt-5 rounded-[28px] p-7 flex items-center gap-6"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          borderRadius: 28,
          boxShadow: `
            0 1px 2px var(--panel-border-subtle),
            0 18px 36px -16px ${accent}55,
            inset 0 1px 0 rgba(255, 255, 255, 0.35)
          `,
        }}
      >
        <div
          className="shrink-0 w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-extrabold"
          style={{
            background: `linear-gradient(140deg, ${accent} 0%, ${accent}aa 100%)`,
            color: '#ffffff',
            borderRadius: 24,
            boxShadow: `0 14px 30px -12px ${accent}88, inset 0 2px 0 rgba(255,255,255,0.35)`,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {def.singular}
            </span>
            <PillBadge accent={accent}>{contract}</PillBadge>
          </div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--theme-text)', fontVariantCaps: 'all-small-caps' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* 3-pill stack */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, label: 'Active contract',  value: contract,   accent },
          { icon: Rocket,      label: 'Onboarding step',  value: onboarding, accent },
          { icon: Heart,       label: 'Churn risk',       value: churn,      accent: churnTone },
        ].map(p => {
          const Icon = p.icon;
          const pa = p.accent;
          return (
            <div
              key={p.label}
              className="rounded-[22px] p-5"
              style={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--panel-border)',
                borderRadius: 22,
                boxShadow: `0 2px 0 var(--panel-border-subtle), 0 12px 28px -18px ${pa}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: pa }}>
                <Icon className="w-4 h-4" />
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.15em]">{p.label}</span>
              </div>
              <div className="text-lg font-extrabold" style={{ color: 'var(--theme-text)' }}>{p.value}</div>
            </div>
          );
        })}
      </div>

      {/* Body / context */}
      {summary && (
        <div
          className="mt-6 rounded-[22px] p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            borderRadius: 22,
            boxShadow: '0 1px 2px var(--panel-border-subtle), 0 14px 30px -22px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Notes</span>
          </div>
          <p className="text-[13.5px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text)' }}>{summary}</p>
        </div>
      )}

      {/* Attribute grid */}
      <div
        className="mt-6 rounded-[22px] p-5"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          borderRadius: 22,
          boxShadow: '0 1px 2px var(--panel-border-subtle), 0 14px 30px -22px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
          <IdCard className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Account attributes</span>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  {f.label}
                </dt>
                <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>
                  {formatField(item[f.key], f.type)}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
