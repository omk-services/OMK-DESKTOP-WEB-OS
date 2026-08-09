/** AuditItemDetail — Manuel de Diagnostic IA, detail page.
 *
 *  Five grids share the same shape: each item is a CRITERION with a 3-level
 *  scale. The detail draws the same chrome (hero + criterion + scale bars +
 *  obligation list), then branches on `def.id` to set the tone:
 *    - audit_arbitrage      : when human decision is required
 *    - audit_contexte       : what the agent must know
 *    - audit_donnees        : quality / freshness / provenance
 *    - audit_automatabilite : what can pass to the machine
 *    - audit_arbitrage_roi  : cost / value of a human decision
 *
 *  Every neutral (text, surface, border, bg) comes from the runtime --theme-*
 *  CSS variables. The only fixed colours are the per-grid accent (mirror of
 *  the def / app accent) and the 3 frequency / level tones (domain data).
 */
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Eye,
  Layers,
  ShieldCheck,
  TrendingUp,
  Database,
  Languages,
  Repeat,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter } from '../../components/cms/itemDetailShared';

const GRID_META: Record<string, { label: string; accent: string; Icon: LucideIcon }> = {
  audit_arbitrage: { label: 'Arbitrage · decision humaine', accent: '#0891b2', Icon: ShieldCheck },
  audit_contexte: { label: 'Contexte · ce que l\'agent doit savoir', accent: '#10b981', Icon: Languages },
  audit_donnees: { label: 'Donnees · qualite / provenance', accent: '#ec4899', Icon: Database },
  audit_automatabilite: { label: 'Automatabilite · ce qui s\'automatise', accent: '#f59e0b', Icon: Repeat },
  audit_arbitrage_roi: { label: 'Arbitrage & ROI · cout de la decision', accent: '#7c3aed', Icon: TrendingUp },
};

const FREQ_ACCENT: Record<string, string> = {
  quotidien: '#dc2626',
  hebdo: '#f59e0b',
  mensuel: '#0d9488',
  ponctuel: '#6366f1',
};

const FREQ_LABEL: Record<string, string> = {
  quotidien: 'QUOTIDIEN',
  hebdo: 'HEBDO',
  mensuel: 'MENSUEL',
  ponctuel: 'PONCTUEL',
};

const LEVEL_ACCENT = ['#dc2626', '#f59e0b', '#10b981'];
const LEVEL_LABEL = ['Rouge', 'Orange', 'Vert'];

function longtext(item: Record<string, unknown>, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v : '';
}

function readString(item: Record<string, unknown>, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v : '';
}

function readField(item: Record<string, unknown>, def: ItemDetailProps['def'], key: string): ReactNode {
  const field = def.fields.find(f => f.key === key);
  if (!field) return '—';
  const raw = item[key];
  if (raw === undefined || raw === null || raw === '') {
    return <span style={{ color: 'var(--theme-muted)', opacity: 0.4 }}>—</span>;
  }
  return String(raw);
}

export function AuditItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const frequency = readString(item, 'frequency').toLowerCase();
  const axis = readString(item, 'axis');
  const observe = longtext(item, 'observe');
  const levels = [longtext(item, 'level0'), longtext(item, 'level1'), longtext(item, 'level2')];

  const meta = GRID_META[def.id] ?? { label: def.name, accent: def.accent, Icon: Eye };
  const freqAccent = FREQ_ACCENT[frequency] ?? 'var(--theme-muted)';
  const freqLabel = FREQ_LABEL[frequency] ?? (frequency.toUpperCase() || '—');

  const skip = new Set([def.titleField, def.subtitleField, def.badgeField]);
  const metaFields = def.fields.filter(f => !skip.has(f.key) && f.type !== 'longtext' && f.key !== 'axis' && f.key !== 'frequency');

  return (
    <div className="min-h-full" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <header
        className="px-7 pt-6 pb-5"
        style={{
          background: 'var(--panel-solid)',
          borderBottom: '1px solid var(--theme-text)',
        }}
      >
        <BackAffordance label="Back to audit" onBack={onBack} accent={accent} />
        <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
                {meta.label}
              </span>
              {frequency && (
                <span
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
                  style={{
                    background: 'transparent',
                    color: freqAccent,
                    border: `1.5px solid ${freqAccent}`,
                    borderRadius: 0,
                  }}
                >
                  {freqLabel}
                </span>
              )}
              {axis && (
                <span
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
                  style={{
                    background: 'transparent',
                    color: 'var(--theme-text)',
                    border: '1.5px solid var(--panel-border-subtle)',
                    borderRadius: 0,
                  }}
                >
                  {axis}
                </span>
              )}
            </div>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight leading-[0.95]"
              style={{ color: 'var(--theme-text)', fontVariantCaps: 'all-small-caps' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13.5px] mt-2 max-w-2xl" style={{ color: 'var(--theme-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <meta.Icon className="w-12 h-12 shrink-0" style={{ color: accent }} strokeWidth={2.2} />
        </div>
      </header>

      <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--theme-text)' }}>
        <article className="md:col-span-2 md:pr-6 md:border-r space-y-6" style={{ borderColor: 'var(--theme-text)' }}>
          {observe && (
            <section>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--theme-muted)' }}>
                <Eye className="w-4 h-4" />
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">Ce qu&apos;on observe</span>
              </div>
              <p
                className="text-[14px] leading-relaxed p-4"
                style={{
                  background: 'var(--theme-surface)',
                  borderLeft: `4px solid ${accent}`,
                  color: 'var(--theme-text)',
                  borderRadius: 0,
                }}
              >
                {observe}
              </p>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Layers className="w-4 h-4" />
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">Echelle en 3 niveaux</span>
            </div>
            <div className="space-y-3">
              {levels.map((text, i) => {
                const tone = LEVEL_ACCENT[i] ?? accent;
                const label = LEVEL_LABEL[i] ?? `Niveau ${i}`;
                const Icon = i === 0 ? AlertTriangle : i === 1 ? CircleDashed : CheckCircle2;
                return (
                  <article
                    key={i}
                    className="flex items-stretch"
                    style={{
                      background: 'var(--theme-surface)',
                      border: `1.5px solid var(--theme-text)`,
                      borderRadius: 0,
                    }}
                  >
                    <span
                      aria-hidden
                      className="w-2 shrink-0"
                      style={{ background: tone }}
                    />
                    <div className="min-w-0 flex-1 px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-3.5 h-3.5" style={{ color: tone }} strokeWidth={3} />
                        <span
                          className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]"
                          style={{ color: tone }}
                        >
                          Niveau {i} — {label}
                        </span>
                      </div>
                      <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                        {text || <span style={{ color: 'var(--theme-muted)' }}>Niveau non renseigne.</span>}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="w-14 shrink-0 flex items-center justify-center text-[18px] font-black"
                      style={{
                        background: 'transparent',
                        color: 'var(--theme-text)',
                        borderLeft: '1.5px solid var(--theme-text)',
                      }}
                    >
                      0{i}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </article>

        <aside className="md:pl-6 mt-6 md:mt-0 space-y-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--theme-muted)' }}>
            <Database className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">Caracteristiques</span>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                Frequence
              </dt>
              <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                {freqLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                Axe
              </dt>
              <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                {axis || '—'}
              </dd>
            </div>
            {metaFields.map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  {f.label}
                </dt>
                <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                  {readField(item, def, f.key)}
                </dd>
              </div>
            ))}
          </dl>

          <section
            className="p-3.5"
            style={{
              background: 'var(--theme-surface)',
              border: '1.5px solid var(--theme-text)',
              borderRadius: 0,
            }}
          >
            <p
              className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2"
              style={{ color: 'var(--theme-muted)' }}
            >
              Source canonique
            </p>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--theme-text)' }}>
              Manuel de Diagnostic IA · grille {meta.label.split(' · ')[0]?.toLowerCase() ?? def.id}
            </p>
            <p className="text-[10.5px] font-mono mt-1.5" style={{ color: 'var(--theme-muted)' }}>
              <code>audit.pdf</code> — page de reference par axe
            </p>
          </section>
        </aside>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
