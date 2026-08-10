/** SettingsItemDetail — warm-paper layout.
 *
 * Canon: spec §4 #13 Settings — "Hero + 2-col (Form / Preview)".
 * Theme: warm-paper.
 * Motion: pop-scale 200ms.
 */
import { useMemo, useState } from 'react';
import { Eye, Sliders } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

export function SettingsItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const status = readString(item, 'status') ?? 'Configured';

  // Pick a couple of the item fields as live form controls so the preview updates.
  const ctrlKeys = useMemo(() => def.fields
    .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
    .map(f => f.key), [def, item]);

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of def.fields) {
      const v = item[f.key];
      if (typeof v === 'string') o[f.key] = v;
    }
    return o;
  });

  // Reset defensif: si l'item change en arriere-plan (HMR, re-hydratation),
  // on resynchronise le brouillon avec les valeurs fraiches, mais seulement
  // si l'utilisateur n'a pas deja commence a editer. Sinon on perd son
  // travail.
  const updateItem = useCmsStore((s) => s.updateItem);
  const addToast = useShellStore((s) => s.addToast);

  /** Persiste le brouillon dans la collection CMS et confirme par un toast.
   *  `updateItem` retourne void — le verdict est « la fonction n'a pas
   *  jete ». La couche CMS est la seule source de verite pour ces fiches. */
  const handleSave = () => {
    updateItem(def.id, String(item.id), { ...draft });
    addToast({
      source: 'Settings',
      type: 'success',
      message: `${title} mis a jour`,
    });
  };

  /** Le Reset efface les champs editables du brouillon et le ramene aux
   *  valeurs de l'item telles qu'elles etaient a l'ouverture. On ne touche
   *  pas aux champs readonly (title / subtitle / badge). */
  const handleReset = () => {
    const fresh: Record<string, string> = {};
    for (const key of ctrlKeys) {
      const v = item[key];
      fresh[key] = typeof v === 'string' ? v : '';
    }
    setDraft(fresh);
  };

  return (
    <div
      className="min-h-full p-7"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      <BackAffordance label="Back to settings" onBack={onBack} accent={accent} />

      {/* Hero */}
      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.25em]"
              style={{ color: accent }}
            >
              SETTINGS · {def.singular.toUpperCase()}
            </span>
            <PillBadge accent={accent}>{status}</PillBadge>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1.5" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
          )}
        </div>
      </header>

      {/* 2-col: form / preview */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em]">Configuration</span>
          </div>

          <div className="space-y-3">
            {ctrlKeys.map(key => {
              const f = def.fields.find(ff => ff.key === key);
              if (!f) return null;
              const value = draft[key] ?? '';
              return (
                <label key={key} className="block">
                  <span
                    className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1"
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    {f.label}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--canvas)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: 'transparent',
                color: 'var(--theme-muted)',
                border: '1px solid var(--panel-border)',
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: accent,
                color: '#ffffff',
                border: 'none',
              }}
            >
              Save changes
            </button>
          </div>
        </div>

        {/* Preview */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em]">Live preview</span>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border-subtle)',
            }}
          >
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: accent }}>
              {def.singular} preview
            </div>
            <div className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>{title}</div>
            <dl className="space-y-2">
              {ctrlKeys.map(key => {
                const f = def.fields.find(ff => ff.key === key);
                if (!f) return null;
                const v = draft[key] ?? '';
                return (
                  <div key={key} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
                      {f.label}
                    </dt>
                    <dd className="text-sm font-medium tabular-nums" style={{ color: 'var(--theme-text)' }}>
                      {v ? String(v) : <span style={{ opacity: 0.4 }}>—</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
            Read-only fields
          </div>
          <dl className="mt-1 space-y-1.5">
            {def.fields
              .filter(f => f.key === def.titleField || f.key === def.subtitleField || f.key === def.badgeField)
              .map(f => (
                <div key={f.key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
                    {f.label}
                  </dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    {formatField(item[f.key], f.type)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
