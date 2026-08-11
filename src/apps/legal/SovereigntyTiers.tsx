/** SovereigntyTiers — the four product tiers, from PoC to full sovereignty.
 *
 *  Distinct from SOVEREIGNTY_LEVELS (IndyDevDan's six academic levels, see
 *  ./sovereignty.ts). The two coexist: one is the global academic scale,
 *  the other is the commercial staircase. This component renders the latter.
 *
 *  Each tier is rendered as a card: where the data lives, what model hosts
 *  the inference, what isolation is in place, and what it takes to climb
 *  one step. The current tier is highlighted (PoC today, per SOCLE.md).
 *
 *  Theme rules: theme-var colors only. Trust accent (#0f172a) for the
 *  "You are here" chip and the rule line.
 */
import { Landmark } from 'lucide-react';
import { SOVEREIGNTY_TIERS, type SovereigntyTier } from './sovereignty';

const APP_ACCENT = '#0f172a';

function Panel({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <section
      className="p-7 rounded-md"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
        borderRadius: 'calc(var(--theme-radius) * 1.4)',
      }}
    >
      {children}
    </section>
  );
}

function TierCard({ tier, isCurrent }: { tier: SovereigntyTier; isCurrent: boolean }): React.ReactNode {
  return (
    <article
      className="p-4 transition-colors"
      style={{
        borderRadius: 'var(--theme-radius-sm)',
        background: isCurrent ? `${APP_ACCENT}0a` : 'transparent',
        border: `1px solid ${isCurrent ? APP_ACCENT : 'var(--panel-border)'}`,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
          style={{ color: isCurrent ? APP_ACCENT : 'var(--theme-muted)' }}
        >
          Tier {tier.index}
        </span>
        {isCurrent && (
          <span
            className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: APP_ACCENT, color: '#ffffff' }}
          >
            You are here
          </span>
        )}
      </div>
      <h3
        className="text-[16px] font-semibold"
        style={{
          color: 'var(--theme-text)',
          fontFamily: 'var(--theme-font-display)',
        }}
      >
        {tier.name}
      </h3>
      <p
        className="mt-0.5 text-[12px] italic"
        style={{ color: 'var(--theme-muted)' }}
      >
        {tier.one}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-[12px]">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Données</dt>
          <dd style={{ color: 'var(--theme-text)' }}>{tier.dataLocation}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Modèle</dt>
          <dd style={{ color: 'var(--theme-text)' }}>{tier.modelHost}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Isolation</dt>
          <dd style={{ color: 'var(--theme-text)' }}>{tier.isolation}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Pour monter</dt>
          <dd style={{ color: 'var(--theme-text)' }}>{tier.upgrade}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--theme-muted)' }}
        >
          Prix
        </span>
        <span
          className="text-[11.5px] font-medium"
          style={{ color: 'var(--theme-text)' }}
        >
          {tier.price}
        </span>
      </div>
    </article>
  );
}

export function SovereigntyTiers() {
  const current = SOVEREIGNTY_TIERS.find((t) => t.isCurrent === true);
  return (
    <div className="p-7">
      <Panel>
        <header className="mb-5 border-b pb-4" style={{ borderColor: 'var(--panel-border)' }}>
          <div className="mb-2 flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5" />
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: 'var(--theme-muted)' }}
            >
              Souveraineté produit
            </span>
          </div>
          <h2
            className="text-[26px] font-semibold leading-tight"
            style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
          >
            Quatre paliers, du POC à la souveraineté
          </h2>
          <p className="mt-1 text-sm italic" style={{ color: 'var(--theme-muted)' }}>
            Où vivent les données à chaque étape, et ce qu'il faut pour passer au palier suivant.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SOVEREIGNTY_TIERS.map((tier) => (
            <TierCard key={tier.index} tier={tier} isCurrent={tier.isCurrent === true} />
          ))}
        </div>

        {current && (
          <p
            className="mt-6 border-l-2 pl-4 py-1 text-[12.5px] italic"
            style={{ borderColor: APP_ACCENT, color: 'var(--theme-muted)' }}
          >
            Coach OS operates today at <strong style={{ color: 'var(--theme-text)' }}>Tier {current.index} — {current.name}</strong>.
            {' '}{current.dataLocation}
          </p>
        )}
      </Panel>
    </div>
  );
}
