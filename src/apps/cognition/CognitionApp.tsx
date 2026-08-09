/**
 * CognitionApp — Cognition SovereignGate.
 * Exports both <CognitionApp> (full window with AppFrame) and <CognitionOverviewContent>
 * (content-only, drop-in for sibling apps like Sales that want the Overview panel
 *  in their own sidebar — keeps the deep canon UI inline without double AppFrame).
 *
 * Phase 39 — Overview only. Future sections (Routines, Manifest, Events) live as
 * additional AppSection entries when the data layer needs them.
 *
 * Sister: src/lib/cognition/queries.ts (Supabase cognition schema).
 */

import { ShieldCheck, AlertCircle, Sparkles, Cpu } from 'lucide-react';
import { SectionHead } from '../../components/AppFrame';
import { StatCard } from '../_ui/kit';
import { COGNITION_TRUST_FLOOR } from '../../lib/observability';
import { COGNITION_ORG_ID } from '../../lib/cognition/queries';
import { supabaseConfigured } from '../../lib/supabase';
import type { EventTypeCount, Manifest, Routine } from '../../lib/cognition/queries';

// Stub data shape (Phase 39a) — live fetch wired in 39b.
export interface CognitionOverviewData {
  routines: Routine[];
  manifest: Manifest | null;
  eventCount: number;
  eventTypeCounts: EventTypeCount[];
  trustScore: number;
}

const STUB_DATA: CognitionOverviewData = {
  routines: [],
  manifest: null,
  eventCount: 0,
  eventTypeCounts: [],
  trustScore: 0,
};

/**
 * CognitionOverviewContent — pure content (no AppFrame wrapper).
 * Use this from sibling apps' sections, or from <CognitionApp>'s Overview section.
 */
export function CognitionOverviewContent({ data = STUB_DATA }: { data?: CognitionOverviewData }) {
  return (
    <div className="space-y-6">
      <SectionHead
        title="Cognition SovereignGate"
        subtitle="Knowledge sovereignty + routines + audit trail for the cognition schema"
      />

      {/* Knowledge sovereignty banner */}
      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Knowledge sovereignty
            </h2>
          </div>
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: data.manifest ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: data.manifest ? '#047857' : '#b45309',
            }}
          >
            {data.manifest
              ? `${Math.round(data.manifest.knowledge_sovereignty_score * 100)}%`
              : 'not published'}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-stone-600">
          {data.manifest
            ? `Manifest v${data.manifest.graph_version} from scope "${data.manifest.source_scope ?? 'unknown'}" — gates open below the trust floor ${COGNITION_TRUST_FLOOR}.`
            : 'No manifest published yet. The SovereignGate stays locked until at least one routine + manifest ships to the cognition schema.'}
        </p>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Sparkles}
          label="Active routines"
          value={String(data.routines.filter((r) => r.is_active).length)}
          accent="#7c3aed"
          hint={`${data.routines.length} total in cognition.routines`}
        />
        <StatCard
          icon={Cpu}
          label="Trust score"
          value={data.trustScore.toFixed(2)}
          accent={data.trustScore >= COGNITION_TRUST_FLOOR ? '#059669' : '#dc2626'}
          hint={data.trustScore >= COGNITION_TRUST_FLOOR ? 'Above gate floor' : 'Below gate floor'}
        />
        <StatCard
          icon={AlertCircle}
          label="Events recorded"
          value={String(data.eventCount)}
          accent="#0891b2"
          hint={
            data.eventTypeCounts.length > 0
              ? data.eventTypeCounts.slice(0, 3).map((e) => `${e.eventType}: ${e.count}`).join(' · ')
              : 'No cognition.events yet'
          }
        />
      </div>

      {/* Schema metadata */}
      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
          Schema metadata
        </h2>
        <dl className="divide-y divide-stone-100">
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Supabase schema</dt>
            <dd className="mt-0.5 text-[12.5px] font-mono font-medium text-stone-800">cognition</dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Org ID</dt>
            <dd className="mt-0.5 break-all text-[12px] font-mono text-stone-700">{COGNITION_ORG_ID}</dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Live connection</dt>
            <dd className="mt-0.5 text-[12.5px] font-medium text-stone-800">
              {supabaseConfigured ? 'Configured (Supabase env present)' : 'Offline — data shown is stub fallback'}
            </dd>
          </div>
          {data.manifest && (
            <div className="py-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Next review</dt>
              <dd className="mt-0.5 text-[12.5px] font-medium text-stone-800">
                {data.manifest.next_review_at ?? '—'}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Routines list */}
      {data.routines.length > 0 ? (
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">Routines</h2>
          <ul className="divide-y divide-stone-100">
            {data.routines.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13px] font-semibold text-stone-900">{r.name}</div>
                  <div className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    {r.cadence} · {r.time_of_day ?? 'unscheduled'}
                  </div>
                </div>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: r.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(120,113,108,0.12)',
                    color: r.is_active ? '#047857' : '#57534e',
                  }}
                >
                  {r.is_active ? 'Active' : 'Paused'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** NOTE: CognitionApp (the standalone AppFrame wrapper) was deleted in Phase 39b.
 *  Cognition now lives ONLY as <CognitionOverviewContent> dwelled inside the
 *  Sales Sanctum app. The standalone registerApp() entry was removed from
 *  src/lib/app-discovery.ts. This file now exports only the OverviewContent
 *  (and its data type) for Sales to consume as a sidebar tab. */
