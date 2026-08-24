/**
 * Overview — bandeau souverainete + compteurs + apercu routines.
 * Extrait de CognitionApp.tsx (section 1 / 5).
 */
import { Cpu, ShieldCheck, ShieldHalf, Sparkles, TrendingUp } from 'lucide-react';
import { SectionHead } from '../../../components/AppFrame';
import { COGNITION_TRUST_FLOOR } from '../../../lib/observability';
import { COGNITION_ORG_ID } from '../../../lib/cognition/queries';
import type { EventTypeCount, Manifest, Routine } from '../../../lib/cognition/queries';
import { ACCENT, StatCard } from './Primitives';

export interface OverviewData {
  routines: Routine[];
  manifest: Manifest | null;
  eventCount: number;
  eventTypeCounts: EventTypeCount[];
  trustScore: number;
  live: boolean;
}

export function OverviewSection({ data }: { data: OverviewData }): import('react').ReactNode {
  const activeRoutines = data.routines.filter((r) => r.is_active).length;
  const score = data.manifest?.knowledge_sovereignty_score ?? 0;
  const scorePct = Math.round(score * 100);
  const gateArmed = score >= COGNITION_TRUST_FLOOR;

  return (
    <div className="space-y-6">
      <SectionHead
        title="Cognition SovereignGate"
        subtitle={`Souverainete du savoir · ${data.routines.length} routines · ${data.eventCount} evenements`}
      />

      {/* Banniere souverainete */}
      <section
        className="rounded-2xl border p-5"
        style={{
          borderColor: 'var(--panel-border)',
          background: gateArmed
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {gateArmed
              ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
              : <ShieldHalf className="h-4 w-4 text-amber-600" />}
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Souverainete du savoir
            </h2>
          </div>
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: gateArmed ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)',
              color: gateArmed ? '#047857' : '#b45309',
            }}
          >
            {data.manifest ? `${scorePct}%` : 'manifeste absent'}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          {data.manifest
            ? `Manifeste v${data.manifest.graph_version} porte sur "${data.manifest.source_scope ?? 'cognition'}". La SovereignGate est ${gateArmed ? 'ouverte' : 'fermee'} (plancher ${COGNITION_TRUST_FLOOR * 100}%).`
            : "Aucun manifeste publie. La SovereignGate reste fermee tant qu'un manifeste n'est pas pose dans le schema cognition."}
        </p>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Sparkles}
          label="Routines actives"
          value={String(activeRoutines)}
          accent={ACCENT}
          hint={`${data.routines.length} routines au total`}
        />
        <StatCard
          icon={Cpu}
          label="Score de souverainete"
          value={data.manifest ? `${scorePct}%` : '—'}
          accent={gateArmed ? '#059669' : '#dc2626'}
          hint={gateArmed ? 'Au-dessus du plancher' : 'En dessous du plancher'}
        />
        <StatCard
          icon={TrendingUp}
          label="Evenements"
          value={String(data.eventCount)}
          accent="#0891b2"
          hint={data.eventTypeCounts.length > 0
            ? data.eventTypeCounts.slice(0, 3).map((e) => `${e.eventType}: ${e.count}`).join(' · ')
            : 'Aucun evenement enregistre'}
        />
      </div>

      {/* Apercu routines */}
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <h2
          className="mb-3 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          Apercu des routines
        </h2>
        {data.routines.length > 0 ? (
          <ul className="divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {data.routines.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {r.name}
                  </div>
                  <div
                    className="mt-0.5 text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--theme-text-dim)' }}
                  >
                    {r.cadence} · {r.time_of_day ?? 'declencheur'}
                  </div>
                </div>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: r.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(120,113,108,0.12)',
                    color: r.is_active ? '#047857' : '#57534e',
                  }}
                >
                  {r.is_active ? 'Active' : 'En pause'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            Aucune routine dans <span className="font-mono">cognition.routines</span>. Allez sur la
            section Routines pour en creer.
          </p>
        )}
      </section>

      {/* Metadata */}
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <h2
          className="mb-3 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          Schema & connexion
        </h2>
        <dl className="divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>
              Schema Supabase
            </dt>
            <dd className="mt-0.5 text-[12.5px] font-mono font-medium" style={{ color: 'var(--theme-text)' }}>
              cognition
            </dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>
              Organisation
            </dt>
            <dd
              className="mt-0.5 break-all text-[12px] font-mono"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {COGNITION_ORG_ID}
            </dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>
              Connexion
            </dt>
            <dd className="mt-0.5 text-[12.5px] font-medium" style={{ color: 'var(--theme-text)' }}>
              {data.live ? 'Live — Supabase Cloud' : 'Mode demonstration — seed local'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
