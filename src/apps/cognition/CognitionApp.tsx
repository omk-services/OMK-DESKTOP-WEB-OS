/**
 * CognitionApp — bureau complet de la couche Cognition.
 *
 * 5 sections (sidebar) :
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
  AlertCircle, Calendar, CircleDashed, Clock, Cpu, Pencil, Plus, RefreshCcw, ShieldCheck,
  ShieldHalf, Sparkles, Target, Trash2, TrendingUp, X, type LucideIcon,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { COGNITION_TRUST_FLOOR } from '../../lib/observability';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { COGNITION_ORG_ID } from '../../lib/cognition/queries';
import {
  fetchRoutinesSafe, fetchEventsSafe, fetchLatestManifestSafe,
  fetchEventCountSafe, fetchEventTypeCountsSafe,
  type CognEvent, type EventTypeCount, type Manifest, type Routine,
} from '../../lib/cognition/queries';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { SOVEREIGNTY_TIERS, getCurrentSovereigntyTier } from '../legal/sovereignty';

const ACCENT = '#7c3aed';
const APP_TITLE = 'Cognition';
const APP_SUBTITLE = 'Sovereign Gate';
const ROUTINE_COLLECTION = 'cognition_routines';

const CADENCES = ['daily', 'weekly', 'monthly', 'event-trigger'] as const;
type CadenceValue = (typeof CADENCES)[number];

interface OverviewData {
  routines: Routine[];
  manifest: Manifest | null;
  eventCount: number;
  eventTypeCounts: EventTypeCount[];
  trustScore: number;
  live: boolean;
}

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

/* ─── Section 1 — Overview ───────────────────────────────────────────────── */

function OverviewSection({ data }: { data: OverviewData }): import('react').ReactNode {
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

function StatCard({ icon: Icon, label, value, accent, hint }: {
  icon: LucideIcon; label: string; value: string; accent: string; hint: string;
}): import('react').ReactNode {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-3 text-[28px] font-extrabold tracking-tight"
        style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
        {hint}
      </div>
    </div>
  );
}

/* ─── Section 2 — Routines ───────────────────────────────────────────────── */

const CADENCE_LABEL: Record<CadenceValue, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  'event-trigger': 'Sur evenement',
};

function RoutinesSection(): import('react').ReactNode {
  const items = useCmsStore((s) => s.items[ROUTINE_COLLECTION]) ?? [];
  const addItem = useCmsStore((s) => s.addItem);
  const updateItem = useCmsStore((s) => s.updateItem);
  const removeItem = useCmsStore((s) => s.removeItem);
  const addToast = useShellStore((s) => s.addToast);
  const { openId, open, close } = useCollectionDrill(ROUTINE_COLLECTION, ['Routines']);
  const detailItem = useMemo(() => items.find((it) => it.id === openId), [items, openId]);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [cadence, setCadence] = useState<CadenceValue>('daily');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [skills, setSkills] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreate = (): void => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setSubmitError('Le nom est obligatoire.');
      return;
    }
    const dup = items.some((it) => String(it.name).toLowerCase() === trimmedName.toLowerCase());
    if (dup) {
      setSubmitError(`Une routine "${trimmedName}" existe deja.`);
      return;
    }
    const skillList = skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    const result = addItem(ROUTINE_COLLECTION, {
      name: trimmedName,
      cadence,
      time_of_day: timeOfDay || null,
      prompt_template: promptTemplate.trim() || null,
      skills_invoked: skillList,
      is_active: true,
    });
    if (!result.ok) {
      setSubmitError(result.error ?? 'Creation impossible.');
      return;
    }
    addToast({ source: 'Cognition', type: 'success', message: `Routine "${trimmedName}" creee.` });
    setName('');
    setCadence('daily');
    setTimeOfDay('');
    setPromptTemplate('');
    setSkills('');
    setSubmitError(null);
    setCreating(false);
  };

  const handleToggleActive = (id: string, currentName: string, isActive: boolean): void => {
    updateItem(ROUTINE_COLLECTION, id, { is_active: !isActive });
    addToast({
      source: 'Cognition',
      type: 'info',
      message: `"${currentName}" ${!isActive ? 'activee' : 'mise en pause'}.`,
    });
  };

  const handleDelete = (id: string, currentName: string): void => {
    const result = removeItem(ROUTINE_COLLECTION, id);
    if (!result.ok) {
      addToast({ source: 'Cognition', type: 'error', message: result.error ?? 'Suppression impossible.' });
      return;
    }
    addToast({ source: 'Cognition', type: 'success', message: `Routine "${currentName}" supprimee.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHead
          title="Routines"
          subtitle={`${items.length} routine${items.length === 1 ? '' : 's'} — ${items.filter((r) => r.is_active).length} active${items.filter((r) => r.is_active).length === 1 ? '' : 's'}`}
        />
        {!creating ? (
          <button
            type="button"
            data-cms-action={`create-${ROUTINE_COLLECTION}`}
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: ACCENT,
              color: '#fff',
              boxShadow: `0 2px 8px ${ACCENT}40`,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle routine
          </button>
        ) : null}
      </div>

      {creating ? (
        <form
          data-cms-form={`create-${ROUTINE_COLLECTION}`}
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="rounded-2xl border p-4 flex flex-col gap-3"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text)' }}
            >
              Nouvelle routine
            </div>
            <button
              type="button"
              onClick={() => { setCreating(false); setSubmitError(null); }}
              aria-label="Annuler"
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--theme-surface-hover)]"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Nom <span style={{ color: ACCENT }}>*</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Morning Routine"
                autoFocus
                required
                className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--panel-border)',
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Cadence
              </span>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as CadenceValue)}
                className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--panel-border)',
                }}
              >
                {CADENCES.map((c) => (
                  <option key={c} value={c}>{CADENCE_LABEL[c]}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Heure (optionnelle)
              </span>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--panel-border)',
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Competences (virgules)
              </span>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="pipeline-review, call-prep"
                className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--panel-border)',
                }}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
              Invite
            </span>
            <textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              rows={2}
              placeholder="Walk the last 24h, update the second brain, surface the one thing."
              className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none resize-y"
              style={{
                background: 'var(--theme-bg)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
            />
          </label>

          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg px-3 py-2 text-[11.5px]"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setCreating(false); setSubmitError(null); }}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              data-cms-action={`submit-${ROUTINE_COLLECTION}`}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              Creer
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {items.map((r) => {
          const skillList = Array.isArray(r.skills_invoked)
            ? (r.skills_invoked as unknown[]).filter((s): s is string => typeof s === 'string')
            : [];
          const isActive = Boolean(r.is_active);
          return (
            <article
              key={r.id}
              data-cms-card={r.id}
              className="group rounded-2xl border p-4"
              style={{
                background: 'var(--theme-surface)',
                borderColor: 'var(--panel-border)',
              }}
            >
              <button
                type="button"
                onClick={() => open(r.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold" style={{ color: 'var(--theme-text)' }}>
                    {String(r.name)}
                  </div>
                  <div
                    className="mt-1 text-[10.5px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--theme-text-dim)', fontFamily: 'ui-monospace, monospace' }}
                  >
                    {String(r.cadence)} · {r.time_of_day ? String(r.time_of_day) : 'declencheur'}
                  </div>
                  {r.prompt_template ? (
                    <p
                      className="mt-2 text-[12px] leading-relaxed"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {String(r.prompt_template)}
                    </p>
                  ) : null}
                  {skillList.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skillList.map((s) => (
                        <span
                          key={s}
                          className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: 'rgba(124,58,237,0.12)',
                            color: '#7c3aed',
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(120,113,108,0.12)',
                    color: isActive ? '#047857' : '#57534e',
                  }}
                >
                  {isActive ? 'Active' : 'En pause'}
                </span>
              </button>
              <div
                className="mt-3 flex items-center gap-1.5 border-t pt-3"
                style={{ borderColor: 'var(--panel-border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleActive(String(r.id), String(r.name), isActive)}
                  data-cms-action={`toggle-${ROUTINE_COLLECTION}-${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--theme-surface-hover)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--panel-border)',
                  }}
                >
                  <RefreshCcw className="w-3 h-3" />
                  {isActive ? 'Mettre en pause' : 'Activer'}
                </button>
                <button
                  type="button"
                  onClick={() => open(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--theme-surface-hover)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--panel-border)',
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  Voir le detail
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(String(r.id), String(r.name))}
                  data-cms-action={`delete-${ROUTINE_COLLECTION}-${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'transparent',
                    color: '#b91c1c',
                    border: '1px solid var(--panel-border)',
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </button>
              </div>
            </article>
          );
        })}
        {items.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 px-5 text-center"
            style={{
              borderColor: 'var(--panel-border)',
              background: 'var(--theme-surface)',
              color: 'var(--theme-text-muted)',
            }}
          >
            <div className="text-[13px]">Aucune routine pour l'instant.</div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-dim)' }}>
              Creez la premiere routine pour amorcer la SovereignGate.
            </div>
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                data-cms-action={`create-empty-${ROUTINE_COLLECTION}`}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, color: '#fff' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Creer la premiere routine
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {openId && detailItem ? (
        <AppDetailOverlay
          appId="cognition"
          accent={ACCENT}
          onBack={close}
          motion={{ kind: 'slide-right', durationMs: 200 }}
        >
          <RoutineDetail item={detailItem} onClose={close} />
        </AppDetailOverlay>
      ) : null}
    </div>
  );
}

function RoutineDetail({ item, onClose }: { item: { id: string; name?: unknown; cadence?: unknown; time_of_day?: unknown; prompt_template?: unknown; skills_invoked?: unknown; is_active?: unknown }; onClose: () => void }): import('react').ReactNode {
  const skillList = Array.isArray(item.skills_invoked)
    ? (item.skills_invoked as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            Routine
          </div>
          <h2
            className="mt-1 text-[24px] font-extrabold tracking-tight"
            style={{ color: 'var(--theme-text)' }}
          >
            {String(item.name ?? '—')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--theme-surface-hover)]"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <dl className="divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
        <Row label="Cadence" value={String(item.cadence ?? '—')} />
        <Row label="Heure" value={item.time_of_day ? String(item.time_of_day) : '—'} />
        <Row label="Active" value={item.is_active ? 'Oui' : 'Non'} />
        <Row label="Competences" value={skillList.length > 0 ? skillList.join(', ') : '—'} />
        <Row
          label="Invite"
          value={item.prompt_template ? String(item.prompt_template) : '—'}
          multiline
        />
      </dl>
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }): import('react').ReactNode {
  return (
    <div className="py-2.5">
      <dt
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[12.5px] ${multiline ? 'leading-relaxed' : ''}`}
        style={{ color: 'var(--theme-text)' }}
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── Section 3 — Journal (lecture seule) ─────────────────────────────────── */

function JournalSection(): import('react').ReactNode {
  const [events, setEvents] = useState<CognEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useShellStore((s) => s.addToast);

  useEffect(() => {
    let cancelled = false;
    const client = supabaseConfigured ? supabase : null;
    setLoading(true);
    void fetchEventsSafe(client, 50).then((es) => {
      if (cancelled) return;
      setEvents(es);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, CognEvent[]> = {};
    for (const e of events) {
      const key = e.event_type ?? 'unknown';
      (map[key] ??= []).push(e);
    }
    return map;
  }, [events]);

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    const client = supabaseConfigured ? supabase : null;
    const es = await fetchEventsSafe(client, 50);
    setEvents(es);
    setLoading(false);
    refresh({ source: 'Cognition', type: 'info', message: 'Journal rafraichi.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHead
          title="Journal"
          subtitle={`${events.length} evenements systeme — pas de boutons de creation, c'est un journal`}
        />
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all hover:opacity-80"
          style={{
            background: 'var(--theme-surface)',
            color: 'var(--theme-text)',
            border: '1px solid var(--panel-border)',
          }}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Rafraichir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(grouped).map(([type, list]) => (
          <div
            key={type}
            className="rounded-2xl border p-3"
            style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-dim)' }}
            >
              {type}
            </div>
            <div
              className="mt-1 text-[20px] font-extrabold"
              style={{ color: 'var(--theme-text)' }}
            >
              {list.length}
            </div>
          </div>
        ))}
      </div>

      <section
        className="rounded-2xl border"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <ul>
          {events.map((e, i) => (
            <li
              key={e.id}
              className="flex items-start gap-4 px-4 py-3"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)',
              }}
            >
              <span
                className="w-32 shrink-0 text-[10.5px] font-mono"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                {formatTimestamp(e.created_at)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: `${ACCENT}1a`,
                      color: ACCENT,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    {e.event_type}
                  </span>
                  {e.member ? (
                    <span
                      className="text-[10.5px] font-mono"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {e.member}
                    </span>
                  ) : null}
                </div>
                {Object.keys(e.payload ?? {}).length > 0 ? (
                  <p
                    className="mt-1 text-[11.5px] font-mono leading-relaxed"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {JSON.stringify(e.payload)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {events.length === 0 && !loading ? (
            <li className="px-4 py-8 text-center text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              Aucun evenement dans <span className="font-mono">cognition.events</span>.
            </li>
          ) : null}
          {loading ? (
            <li className="px-4 py-8 text-center text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              Chargement…
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ─── Section 4 — Graphe (manifeste) ─────────────────────────────────────── */

function GrapheSection({ manifest }: { manifest: Manifest | null }): import('react').ReactNode {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Graphe — manifeste"
        subtitle="Version, perimetre des sources, prochaine revision"
      />
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        {manifest ? (
          <dl className="divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            <Row label="Version du graphe" value={`v${manifest.graph_version}`} />
            <Row label="Perimetre des sources" value={manifest.source_scope ?? '—'} />
            <Row
              label="Souverainete du savoir"
              value={`${Math.round(manifest.knowledge_sovereignty_score * 100)}%`}
            />
            <Row label="Prochaine revision" value={manifest.next_review_at ? formatTimestamp(manifest.next_review_at) : '—'} />
          </dl>
        ) : (
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Aucun manifeste publie dans <span className="font-mono">cognition.yggdrasil_manifest</span>.
            La SovereignGate reste fermee tant que le graphe n'est pas pose.
          </p>
        )}
      </section>
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <h2
          className="mb-3 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          Que mesure le score ?
        </h2>
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Le score de souverainete du savoir agrege : la couverture des sources, la
          fraicheur des routines, la cadence des evenements, et le respect du
          perimetre declare. Sa formule vit dans la spec Yggdrasil — pas dans
          l'UI. Toute montee de score demande une revue manuelle du manifeste.
        </p>
      </section>
    </div>
  );
}

/* ─── Section 5 — Souverainete (paliers produit) ──────────────────────────── */

function SovereigneteSection(): import('react').ReactNode {
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

function Meta({ label, value }: { label: string; value: string }): import('react').ReactNode {
  return (
    <div>
      <div
        className="text-[9.5px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {label}
      </div>
      <div className="mt-0.5 text-[12px]" style={{ color: 'var(--theme-text)' }}>
        {value}
      </div>
    </div>
  );
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
      render: () => <SovereigneteSection />,
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
