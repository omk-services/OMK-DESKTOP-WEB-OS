/**
 * Routines — CRUD complet via CMS store (creation, toggle actif, suppression,
 * detail). Extrait de CognitionApp.tsx (section 2 / 5).
 */
import { useMemo, useState } from 'react';
import { AlertCircle, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { SectionHead } from '../../../components/AppFrame';
import { useCmsStore } from '../../../lib/cms/cms.store';
import { useShellStore } from '../../../stores/shell.store';
import { useCollectionDrill } from '../../../hooks/useCollectionDrill';
import { AppDetailOverlay } from '../../../components/cms/AppDetailOverlay';
import { ACCENT, Row } from './Primitives';

export const ROUTINE_COLLECTION = 'cognition_routines';

export const CADENCES = ['daily', 'weekly', 'monthly', 'event-trigger'] as const;
export type CadenceValue = (typeof CADENCES)[number];

const CADENCE_LABEL: Record<CadenceValue, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  'event-trigger': 'Sur evenement',
};

export function RoutinesSection(): import('react').ReactNode {
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
