/**
 * Souverainete — les 4 paliers produit (PoC / SaaS / White Label / Souverainete).
 * Extrait de CognitionApp.tsx (section 5 / 5).
 */
import { useMemo } from 'react';
import { SectionHead } from '../../../components/AppFrame';
import { SOVEREIGNTY_TIERS, getCurrentSovereigntyTier } from '../../legal/sovereignty';
import { ACCENT, Meta } from './Primitives';

export function SouveraineteSection(): import('react').ReactNode {
  const current = useMemo(() => getCurrentSovereigntyTier(), []);
  return (
    <div className="space-y-4">
      <SectionHead
        title="Souverainete du savoir"
        subtitle="Quatre paliers produit — le meme escalier que l'infrastructure, applique au savoir"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SOVEREIGNTY_TIERS.map((tier) => {
          const isCurrent = current?.index === tier.index;
          return (
            <article
              key={tier.index}
              className="rounded-2xl border p-5"
              style={{
                background: 'var(--theme-surface)',
                borderColor: isCurrent ? ACCENT : 'var(--panel-border)',
                boxShadow: isCurrent ? `0 0 0 1px ${ACCENT}30` : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-extrabold"
                    style={{
                      background: isCurrent ? ACCENT : 'var(--theme-surface-hover)',
                      color: isCurrent ? '#fff' : 'var(--theme-text)',
                    }}
                  >
                    {tier.index}
                  </span>
                  <h3
                    className="text-[15px] font-extrabold tracking-tight"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {tier.name}
                  </h3>
                </div>
                {isCurrent ? (
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `${ACCENT}1a`, color: ACCENT }}
                  >
                    Palier actuel
                  </span>
                ) : null}
              </div>
              <p
                className="mt-3 text-[12.5px] leading-relaxed"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {tier.one}
              </p>
              <dl className="mt-4 space-y-2">
                <Meta label="Ou vit le savoir" value={tier.dataLocation} />
                <Meta label="Modele heberge" value={tier.modelHost} />
                <Meta label="Isolation" value={tier.isolation} />
                <Meta label="Prochaine montee" value={tier.upgrade} />
                <Meta label="Prix indicatif" value={tier.price} />
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
