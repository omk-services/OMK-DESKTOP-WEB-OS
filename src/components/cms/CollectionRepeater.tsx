/**
 * CollectionRepeater — renders a CMS collection as a grid of real cards (not
 * horizontal rows). Each card has a title, optional subtitle, optional badge,
 * and a chevron affordance. Used by every app that lists a CMS collection.
 *
 * Generic CRUD (S_SOCLE chantier 1, 2026-08-10):
 *  - "+ Nouveau <singular>" header button opens an auto-generated form.
 *  - Form controls are picked from `def.fields` (text/number/currency/date/
 *    longtext/badge). Badge fields become a select when the collection already
 *    carries items (their distinct values are the options); otherwise they
 *    fall back to a free-text input.
 *  - Submission requires the title (def.titleField) and blocks exact-match
 *    duplicates (case-insensitive). Errors surface inline; successes push a
 *    toast and the form clears.
 *  - Each card exposes a delete button with a 4-second two-step confirm —
 *    no `window.confirm`. Delete failure surfaces a toast without losing
 *    the card.
 *  - Empty state renders a clear sentence + the same create button, so an
 *    empty list is never a dead end.
 *  - `allowCreate` and `allowDelete` default to true. Pass false to opt out
 *    of either without breaking the existing public surface.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsField, CmsItem } from '../../lib/cms/types';
import { badgeTone } from '../../lib/badgeTone';
import { useShellStore } from '../../stores/shell.store';

interface CollectionRepeaterProps {
  collectionId: string;
  onOpen: (itemId: string) => void;
  /** optional pre-filtered subset — when omitted, renders the whole collection */
  filter?: (item: CmsItem) => boolean;
  /** Show the "+ Nouveau" create button. Default true. */
  allowCreate?: boolean;
  /** Show the per-card delete button. Default true. */
  allowDelete?: boolean;
}

const CONFIRM_TIMEOUT_MS = 4000;

/** Pick the right HTML control for a CMS field. Badge fields derive their
 *  options from items already in the collection (so the dropdown tracks
 *  reality without forcing schema changes); on an empty collection we fall
 *  back to a plain text input so the user can type the first value freely. */
function selectOptionsFor(field: CmsField, items: CmsItem[]): string[] | null {
  if (field.type !== 'badge') return null;
  const set = new Set<string>();
  for (const it of items) {
    const v = it[field.key];
    if (typeof v === 'string' && v.trim() !== '') set.add(v);
    if (typeof v === 'number') set.add(String(v));
  }
  if (set.size === 0) return null;
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function emptyValuesFor(def: CmsCollectionDef): Record<string, string> {
  const v: Record<string, string> = {};
  for (const f of def.fields) v[f.key] = '';
  return v;
}

function parseSubmitValue(field: CmsField, raw: string): string | number {
  const trimmed = raw.trim();
  if (field.type === 'currency' || field.type === 'number') {
    if (trimmed === '') return '';
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  return trimmed;
}

export function CollectionRepeater({
  collectionId,
  onOpen,
  filter,
  allowCreate = true,
  allowDelete = true,
}: CollectionRepeaterProps): import('react').ReactNode {
  const def = useCmsStore(s => s.collections[collectionId]);
  const allItems = useCmsStore(s => s.items[collectionId]) ?? [];
  const addItem = useCmsStore(s => s.addItem);
  const removeItem = useCmsStore(s => s.removeItem);
  const addToast = useShellStore(s => s.addToast);
  const items = filter ? allItems.filter(filter) : allItems;

  /* ── Create form state ─────────────────────────────────────────────── */
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /* ── Two-step delete confirm state ─────────────────────────────────── */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  // Reset transient state whenever the active collection changes (defensive:
  // a parent re-mounting with a new collectionId would otherwise leak state).
  useEffect(() => {
    setCreating(false);
    setValues({});
    setSubmitError(null);
    setConfirmDeleteId(null);
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, [collectionId]);

  // Click outside the form closes it (and clears values, like Cancel).
  useEffect(() => {
    if (!creating) return;
    const onDown = (e: MouseEvent): void => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setCreating(false);
        setValues({});
        setSubmitError(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [creating]);

  // Auto-cancel the confirm-delete prompt after CONFIRM_TIMEOUT_MS.
  useEffect(() => {
    if (!confirmDeleteId) return;
    if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = window.setTimeout(() => {
      setConfirmDeleteId(null);
      confirmTimerRef.current = null;
    }, CONFIRM_TIMEOUT_MS);
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    };
  }, [confirmDeleteId]);

  const titleOptions = useMemo(() => {
    if (!def) return [];
    return items
      .map((it) => String(it[def.titleField] ?? '').trim())
      .filter((s) => s !== '')
      .map((s) => s.toLowerCase());
  }, [def, items]);

  if (!def) return null;

  function openCreate(): void {
    setValues(emptyValuesFor(def!));
    setSubmitError(null);
    setCreating(true);
  }

  function closeCreate(): void {
    setCreating(false);
    setValues({});
    setSubmitError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitError(null);
    const titleRaw = String(values[def!.titleField] ?? '').trim();
    if (!titleRaw) {
      setSubmitError(`Le titre est obligatoire.`);
      return;
    }
    const titleKey = titleRaw.toLowerCase();
    if (titleOptions.includes(titleKey)) {
      setSubmitError(`"${titleRaw}" existe déjà dans ${def!.name}.`);
      return;
    }
    const partial: Record<string, string | number> = {};
    for (const f of def!.fields) {
      partial[f.key] = parseSubmitValue(f, values[f.key] ?? '');
    }
    const result = addItem(collectionId, partial as Omit<CmsItem, 'id'>);
    if (!result.ok) {
      const msg = result.error ?? 'Création échouée.';
      setSubmitError(msg);
      addToast({ source: def!.name, type: 'error', message: msg });
      return;
    }
    addToast({
      source: def!.name,
      type: 'success',
      message: `${def!.singular} « ${titleRaw} » créé.`,
    });
    // Keep the form open? No — clear and close; if the user wants to add
    // several, the empty-state / header button is one click away.
    setValues({});
    setCreating(false);
  }

  function handleDelete(itemId: string, itemTitle: string): void {
    if (confirmDeleteId !== itemId) {
      setConfirmDeleteId(itemId);
      return;
    }
    const result = removeItem(collectionId, itemId);
    if (!result.ok) {
      addToast({
        source: def!.name,
        type: 'error',
        message: result.error ?? 'Suppression échouée.',
      });
      setConfirmDeleteId(null);
      return;
    }
    addToast({
      source: def!.name,
      type: 'success',
      message: `${def!.singular} « ${itemTitle} » supprimé.`,
    });
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header — "+ Nouveau" trigger. Hidden when allowCreate is false. */}
      {allowCreate && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] uppercase tracking-wider font-semibold" style={{ color: 'var(--theme-text-dim)' }}>
            {items.length} {items.length > 1 ? def.name.toLowerCase() : def.name.toLowerCase()}
          </div>
          {!creating && (
            <button
              type="button"
              onClick={openCreate}
              data-cms-action={`create-${collectionId}`}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: def.accent,
                color: '#fff',
                boxShadow: `0 2px 8px ${def.accent}40`,
              }}
            >
              <Plus className="w-3 h-3" />
              Nouveau {def.singular.toLowerCase()}
            </button>
          )}
        </div>
      )}

      {/* Create form — modal-style inline panel */}
      {allowCreate && creating && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          data-cms-form={`create-${collectionId}`}
          className="rounded-2xl border p-4 flex flex-col gap-3"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text)' }}>
              Nouveau {def.singular.toLowerCase()}
            </div>
            <button
              type="button"
              onClick={closeCreate}
              aria-label="Annuler"
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--theme-surface-hover)]"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {def.fields.map((f) => {
            const options = selectOptionsFor(f, items);
            const isTitleField = f.key === def.titleField;
            return (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                  {f.label}
                  {isTitleField && (
                    <span aria-label="obligatoire" style={{ color: def.accent }}> *</span>
                  )}
                </span>
                {f.type === 'longtext' ? (
                  <textarea
                    name={f.key}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    rows={3}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none resize-y"
                    style={{
                      background: 'var(--theme-bg)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                  />
                ) : options ? (
                  <select
                    name={f.key}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                    style={{
                      background: 'var(--theme-bg)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    <option value="">— choisir —</option>
                    {options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={f.key}
                    type={f.type === 'date' ? 'date' : f.type === 'currency' || f.type === 'number' ? 'number' : 'text'}
                    step={f.type === 'currency' ? '0.01' : undefined}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    required={isTitleField}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
                    style={{
                      background: 'var(--theme-bg)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                  />
                )}
              </label>
            );
          })}

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg px-3 py-2 text-[11.5px]"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={closeCreate}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              data-cms-action={`submit-${collectionId}`}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: def.accent }}
            >
              Créer
            </button>
          </div>
        </form>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => {
          const title = String(item[def.titleField] ?? '');
          const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;
          const badge = def.badgeField ? item[def.badgeField] : undefined;
          const isConfirming = confirmDeleteId === item.id;
          return (
            <div
              key={item.id}
              data-cms-card={item.id}
              className="group relative rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)]"
            >
              <button
                onClick={() => onOpen(item.id)}
                className="flex flex-col items-start gap-2 text-left w-full"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-[var(--theme-text)] line-clamp-2">{title}</div>
                    {subtitle && (
                      <div className="mt-1 text-xs text-[var(--theme-text-muted)] line-clamp-2">{subtitle}</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] shrink-0 transition-colors" />
                </div>
                {badge != null && badge !== '' && (() => {
                  const tone = badgeTone(String(badge));
                  return (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      {String(badge)}
                    </span>
                  );
                })()}
              </button>

              {allowDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(String(item.id), title);
                  }}
                  aria-label={isConfirming ? `Confirmer la suppression de ${title}` : `Supprimer ${title}`}
                  data-cms-action={isConfirming ? `confirm-delete-${collectionId}-${item.id}` : `delete-${collectionId}-${item.id}`}
                  className="absolute top-2 right-2 h-6 px-2 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-all"
                  style={
                    isConfirming
                      ? { background: '#dc2626', color: '#fff' }
                      : {
                          background: 'transparent',
                          color: 'var(--theme-text-dim)',
                          opacity: 0,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isConfirming) (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    if (!isConfirming) (e.currentTarget as HTMLButtonElement).style.opacity = '0';
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  {isConfirming ? 'Confirmer ?' : ''}
                </button>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div
            className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 px-5 text-center"
            style={{
              borderColor: 'var(--panel-border)',
              background: 'var(--theme-surface)/50',
              color: 'var(--theme-text-muted)',
            }}
          >
            <div className="text-[13px]">
              Aucun {def.singular.toLowerCase()} pour l'instant.
            </div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-dim)' }}>
              Ajoutez le premier pour remplir cette collection.
            </div>
            {allowCreate && !creating && (
              <button
                type="button"
                onClick={openCreate}
                data-cms-action={`create-empty-${collectionId}`}
                className="mt-1 flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: def.accent,
                  color: '#fff',
                  boxShadow: `0 2px 8px ${def.accent}40`,
                }}
              >
                <Plus className="w-3 h-3" />
                Créer le premier {def.singular.toLowerCase()}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
