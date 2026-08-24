/**
 * CognitionApp — bureau complet de la couche Cognition.
 *
 * 5 sections (sidebar), chacune extraite dans ./sections :
 *  - Overview    : bandeau souverainete + compteurs + apercu routines
 *  - Routines    : CRUD complet via CMS store (bouton de creation, toggle actif)
 *  - Journal     : evenements systeme, en lecture seule
 *  - Graphe      : manifeste (version, scope, prochaine revision)
 *  - Souverainete: les 4 paliers produit (PoC / SaaS / White Label / Souverainete)
 *
 * Sources de donnees (cf. src/lib/cognition/queries.ts) :
 *  - Supabase Cloud si configure et joignable
 *  - Sinon seed local (mode demonstration)
 *
 * `CognitionOverviewContent` reste exporte pour les autres apps qui
 * voulaient un apercu inline (Dashboard, etc.).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, CircleDashed, Clock, ShieldCheck, Sparkles, Target, TrendingUp,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { useCmsStore } from '../../lib/cms/cms.store';
import { COGNITION_TRUST_FLOOR } from '../../lib/observability';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { COGNITION_ORG_ID } from '../../lib/cognition/queries';
import {
  fetchRoutinesSafe, fetchLatestManifestSafe,
  fetchEventCountSafe, fetchEventTypeCountsSafe,
  type EventTypeCount, type Manifest, type Routine,
} from '../../lib/cognition/queries';
import { ACCENT } from './sections/Primitives';
import { OverviewSection, type OverviewData } from './sections/OverviewSection';
import { RoutinesSection, ROUTINE_COLLECTION } from './sections/RoutinesSection';
import { JournalSection } from './sections/JournalSection';
import { GrapheSection } from './sections/GrapheSection';
import { SouveraineteSection } from './sections/SouveraineteSection';

const APP_TITLE = 'Cognition';
const APP_SUBTITLE = 'Sovereign Gate';

const STUB_DATA: OverviewData = {
  routines: [],
  manifest: null,
  eventCount: 0,
  eventTypeCounts: [],
  trustScore: 0,
  live: false,
};

/* ─── Hydration : routines/manifest/events depuis Supabase ou le seed local ── */

function useCognitionState(): OverviewData {
  const [data, setData] = useState<OverviewData>(STUB_DATA);

  useEffect(() => {
    let cancelled = false;
    const client = supabaseConfigured ? supabase : null;
    void (async () => {
      const [routines, manifest, eventCount, eventTypeCounts] = await Promise.all([
        fetchRoutinesSafe(client),
        fetchLatestManifestSafe(client),
        fetchEventCountSafe(client),
        fetchEventTypeCountsSafe(client),
      ]);
      if (cancelled) return;
      const trustScore = manifest?.knowledge_sovereignty_score ?? 0;
      setData({
        routines,
        manifest,
        eventCount,
        eventTypeCounts,
        trustScore,
        live: client !== null,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return data;
}

/* ─── Root — enregistrement de la collection routines + hydration ─────────── */

function useHydrateRoutines(): void {
  // Synchronise la collection CMS avec les donnees Supabase/seed.
  // Idempotent : la methode registerCollection est no-op si deja faite.
  useEffect(() => {
    const client = supabaseConfigured ? supabase : null;
    void fetchRoutinesSafe(client).then((routines) => {
      const items = routines.map((r) => ({
        id: r.id,
        name: r.name,
        cadence: r.cadence,
        time_of_day: r.time_of_day,
        prompt_template: r.prompt_template,
        skills_invoked: r.skills_invoked,
        is_active: r.is_active,
      }));
      useCmsStore.getState().registerCollection(
        {
          id: ROUTINE_COLLECTION,
          name: 'Routines',
          singular: 'Routine',
          accent: ACCENT,
          titleField: 'name',
          subtitleField: 'cadence',
          badgeField: 'cadence',
          fields: [
            { key: 'name', label: 'Nom', type: 'text' },
            { key: 'cadence', label: 'Cadence', type: 'badge' },
            { key: 'time_of_day', label: 'Heure', type: 'text' },
            { key: 'prompt_template', label: 'Invite', type: 'longtext' },
            { key: 'is_active', label: 'Active', type: 'text' },
          ],
        },
        items,
      );
    });
  }, []);
}

export function CognitionApp(): import('react').ReactNode {
  useHydrateRoutines();
  const data = useCognitionState();

  const sections: AppSection[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: ShieldCheck,
      render: () => <OverviewSection data={data} />,
    },
    {
      id: 'routines',
      label: 'Routines',
      icon: Calendar,
      render: () => <RoutinesSection />,
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: Clock,
      render: () => <JournalSection />,
    },
    {
      id: 'graphe',
      label: 'Graphe',
      icon: Target,
      render: () => <GrapheSection manifest={data.manifest} />,
    },
    {
      id: 'souverainete',
      label: 'Souverainete',
      icon: TrendingUp,
      render: () => <SouveraineteSection />,
    },
  ], [data]);

  return (
    <AppFrame
      title={APP_TITLE}
      subtitle={APP_SUBTITLE}
      accent={ACCENT}
      icon={Sparkles}
      sections={sections}
    />
  );
}

/* ─── Apercu en ligne (exporter pour les autres apps) ────────────────────── */

const FALLBACK_ROUTINES: Routine[] = [
  { id: 'fallback-morning', org_id: COGNITION_ORG_ID, name: 'Morning Routine', cadence: 'daily', time_of_day: '08:00:00', prompt_template: 'Walk the last 24h, update the second brain, surface the one thing.', skills_invoked: ['pipeline-review'], is_active: true },
  { id: 'fallback-hygiene', org_id: COGNITION_ORG_ID, name: 'Pipeline Hygiene', cadence: 'daily', time_of_day: '08:45:00', prompt_template: 'Find stale opportunities and assign next actions.', skills_invoked: ['pipeline-review'], is_active: true },
  { id: 'fallback-prep', org_id: COGNITION_ORG_ID, name: 'Call Prep', cadence: 'daily', time_of_day: null, prompt_template: 'Prepare the next prospect brief.', skills_invoked: ['call-prep', 'client-onepager'], is_active: true },
  { id: 'fallback-followup', org_id: COGNITION_ORG_ID, name: 'Post-Disc Followup', cadence: 'daily', time_of_day: null, prompt_template: 'Draft the next follow-up from call context.', skills_invoked: ['post-disc-followup', 'outreach'], is_active: true },
  { id: 'fallback-scoring', org_id: COGNITION_ORG_ID, name: 'Rep Scoring', cadence: 'weekly', time_of_day: null, prompt_template: 'Score recent sales conversations.', skills_invoked: ['sales-rep-analyzer'], is_active: true },
  { id: 'fallback-weekly', org_id: COGNITION_ORG_ID, name: 'Weekly Pipeline Review', cadence: 'weekly', time_of_day: null, prompt_template: 'Review conversion and stalled deals.', skills_invoked: ['pipeline-review', 'win-loss-analysis'], is_active: true },
  { id: 'fallback-monthly', org_id: COGNITION_ORG_ID, name: 'Monthly Intelligence Report', cadence: 'monthly', time_of_day: null, prompt_template: 'Extract recurring patterns from the month.', skills_invoked: ['win-loss-analysis'], is_active: false },
];

export interface CognitionOverviewData {
  routines: Routine[];
  manifest: Manifest | null;
  eventCount: number;
  eventTypeCounts: EventTypeCount[];
  trustScore: number;
}

const STUB_OVERVIEW: CognitionOverviewData = {
  routines: FALLBACK_ROUTINES,
  manifest: { id: 'fallback', org_id: COGNITION_ORG_ID, graph_version: '1.4.0', source_scope: 'cognition · sales · people', knowledge_sovereignty_score: 0.84, next_review_at: '2026-09-10T00:00:00Z' },
  eventCount: 12,
  eventTypeCounts: [
    { eventType: 'routine_run', count: 4 },
    { eventType: 'skill_invoked', count: 3 },
    { eventType: 'gate_armed', count: 1 },
    { eventType: 'manifest_published', count: 1 },
    { eventType: 'win_loss_analysis', count: 1 },
    { eventType: 'routine_paused', count: 1 },
    { eventType: 'post_disc_followup', count: 1 },
  ],
  trustScore: 0.84,
};

/** Apercu inline, sans AppFrame. Pour les autres apps qui veulent
 *  afficher une vignette Cognition sans ouvrir la fenetre dediee. */
export function CognitionOverviewContent({ data = STUB_OVERVIEW }: { data?: CognitionOverviewData }): import('react').ReactNode {
  const active = data.routines.filter((r) => r.is_active).length;
  const score = data.manifest?.knowledge_sovereignty_score ?? 0;
  const gateArmed = score >= COGNITION_TRUST_FLOOR;

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: 'var(--panel-border)',
          background: gateArmed
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {gateArmed
              ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
              : <CircleDashed className="h-4 w-4 text-amber-600" />}
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Souverainete du savoir
            </span>
          </div>
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: gateArmed ? '#047857' : '#b45309' }}
          >
            {data.manifest ? `${Math.round(score * 100)}%` : '—'}
          </span>
        </div>
        <div
          className="mt-2 text-[11.5px]"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {active} routines actives · {data.eventCount} evenements
        </div>
      </div>
    </div>
  );
}
