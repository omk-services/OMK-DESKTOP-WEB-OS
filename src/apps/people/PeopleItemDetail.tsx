/** PeopleItemDetail — aurora layout for the People app.
 *
 * Canon: spec §4 #2 People — "Hero + 3-column profile (Avatar block /
 *         Meta stack / Squad chips)".
 *
 * Covers: team + people_agents collections. Branches on def.id because
 * the two carry very different fields.
 */
import { useMemo } from 'react';
import type { JSX } from 'react';
import { Briefcase, Sparkles, Users } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function rankTone(rank: string | undefined): { label: string; tone: 'solid' | 'soft' } {
  switch (rank) {
    case 'B1': return { label: 'B1 · Entrepreneur', tone: 'solid' };
    case 'B2': return { label: 'B2 · Manager',      tone: 'soft' };
    case 'B3': return { label: 'B3 · Technician',   tone: 'soft' };
    default:   return { label: 'Roster',           tone: 'soft' };
  }
}

export function PeopleItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;

  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const rank = typeof item.rank === 'string' ? item.rank : undefined;
  const focus = typeof item.focus === 'string' ? item.focus : undefined;
  const bio = typeof item.bio === 'string' ? item.bio : undefined;
  const task = typeof item.task === 'string' ? item.task : undefined;
  const status = typeof item.status === 'string' ? item.status : undefined;
  const domain = typeof item.domain === 'string' ? item.domain : undefined;
  const squad = typeof item.squad === 'string' ? item.squad : undefined;
  const cadence = typeof item.cadence === 'string' ? item.cadence : undefined;
  const skills = useMemo(() => {
    if (Array.isArray(item.skills)) return item.skills.filter((s): s is string => typeof s === 'string');
    if (typeof item.skills === 'string') return item.skills.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }, [item.skills]);

  const isAgent = collection === 'people_agents';
  const tone = rankTone(isAgent ? undefined : rank);
  const initials = title.split(/\s+/).map(w => w.charAt(0).toUpperCase()).filter(Boolean).slice(0, 2).join('') || '?';
  const bodyText = isAgent ? task : bio;

  return (
    <div
      className="min-h-full p-7 relative"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{ background: `radial-gradient(60% 80% at 50% 0%, ${accent}26 0%, transparent 70%)` }}
      />

      <div className="relative">
        <BackAffordance label={isAgent ? 'Back to agents' : 'Back to roster'} onBack={onBack} accent={accent} />

        <div className="mt-5 flex items-start gap-5">
          <div
            className="shrink-0 w-24 h-24 rounded-3xl flex items-center justify-center font-extrabold text-3xl"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
              color: '#ffffff',
              boxShadow: `0 12px 32px -16px ${accent}80, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {!isAgent && <PillBadge accent={accent} tone={tone.tone}>{tone.label}</PillBadge>}
              <PillBadge accent={accent}>{isAgent ? 'AI agent' : 'Member'}</PillBadge>
              {status && <PillBadge accent={accent}>{status}</PillBadge>}
              {domain && (
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--theme-muted)' }}>
                  {domain}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold font-outfit tracking-tight" style={{ color: 'var(--theme-text)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {isAgent ? 'Identity' : 'Profile'}
              </span>
            </div>
            <dl className="space-y-2.5">
              {def.fields
                .filter(f => !['rank', 'focus', 'bio', 'task', 'status', 'domain', 'squad', 'cadence', 'skills', def.titleField, def.subtitleField, def.badgeField].includes(f.key))
                .map(f => (
                  <div key={f.key} className="flex flex-col">
                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                      {f.label}
                    </dt>
                    <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                      {formatField(item[f.key], f.type)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {isAgent ? 'Live task' : (focus ? 'Focus & bio' : 'Bio')}
              </span>
            </div>

            {!isAgent && focus && (
              <div
                className="rounded-xl px-3.5 py-3 mb-3"
                style={{ background: `${accent}0f`, border: `1px solid ${accent}33` }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
                  Primary focus
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{focus}</div>
              </div>
            )}

            {bodyText ? (
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{bodyText}</p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--theme-muted)' }}>
                {isAgent ? 'No live task set.' : 'No bio recorded.'}
              </p>
            )}

            {!isAgent && skills.length > 0 && (
              <div className="mt-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-muted)' }}>
                  Toolkit
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--canvas)', color: 'var(--theme-text)', border: '1px solid var(--panel-border-subtle)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isAgent && cadence && (
              <div
                className="mt-4 rounded-xl px-3.5 py-3"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                  Cadence
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{cadence}</div>
              </div>
            )}
          </div>

          {!isAgent && (
            <div
              className="md:col-span-3 rounded-2xl p-5"
              style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
            >
              <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Squad & business OS rank</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {squad && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: `${accent}26`, color: accent, border: `1px solid ${accent}40` }}>
                    Squad · {squad}
                  </span>
                )}
                {rank && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--canvas)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}>
                    Cascade E-Myth · {rank}
                  </span>
                )}
                {domain && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--canvas)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}>
                    Domain · {domain}
                  </span>
                )}
                {cadence && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--canvas)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}>
                    Artefact · {cadence}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
