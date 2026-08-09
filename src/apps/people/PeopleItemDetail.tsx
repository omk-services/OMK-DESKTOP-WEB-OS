/** PeopleItemDetail — aurora layout for the People app.
 *
 * Canon: spec §4 #2 People — "Hero + 3-column profile (Avatar block /
 *         Meta stack / Squad chips)".
 *
 * Covers: team, people_agents, personas, memory, codex. Branches on
 * def.id because each collection carries its own semantic shape:
 *   - team         → human roster (rank + skills + bio)
 *   - people_agents → AI worker (task + capabilities)
 *   - personas     → first-class profile (anchor + wants + blockers)
 *   - memory       → curated fact (provenance + verification)
 *   - codex        → proven pattern (situation + recipe + count)
 */
import { useMemo } from 'react';
import { Briefcase, Sparkles, Users, UserSearch, Brain, BookMarked, AlertTriangle, ShieldCheck, Anchor, Quote, Repeat2 } from 'lucide-react';
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

/* Semantic tones for the 3 depth collections. Status / verification / count
 * carry meaning, not theme — these are domain data. */
function anchorTone(kind: string | undefined): { label: string; fg: string; bg: string; border: string } {
  switch (kind) {
    case 'entretien': return { label: 'Anchored · entretien', fg: '#0e7490', bg: '#ecfeff', border: '#67e8f9' };
    case 'appel':     return { label: 'Anchored · appel',     fg: '#0e7490', bg: '#ecfeff', border: '#67e8f9' };
    case 'atelier':   return { label: 'Anchored · atelier',   fg: '#0e7490', bg: '#ecfeff', border: '#67e8f9' };
    case 'ticket':    return { label: 'Anchored · ticket',    fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
    case 'informel':  return { label: 'Soft anchor',          fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' };
    case 'no-anchor': return { label: 'No anchor — invention',fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' };
    default:          return { label: 'Anchor · unknown',     fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
  }
}

function verifyTone(verification: string | undefined): { label: string; fg: string; bg: string; border: string } {
  switch (verification) {
    case 'confirmed':    return { label: 'Confirmed',    fg: '#15803d', bg: '#dcfce7', border: '#86efac' };
    case 'contradicted': return { label: 'Contradicted', fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' };
    case 'to-verify':    return { label: 'To verify',    fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' };
    default:             return { label: 'Unverified',   fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
  }
}

export function PeopleItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;

  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;

  /* The 3 depth collections each carry a distinct semantic shape. Render
   * them with their own composed surface and skip the team/agents logic. */
  if (collection === 'personas') {
    return <PersonaSurface def={def} item={item} accent={accent} onBack={onBack} prev={prev} next={next} onNavigate={onNavigate} index={index} total={total} />;
  }
  if (collection === 'memory') {
    return <MemorySurface def={def} item={item} accent={accent} onBack={onBack} prev={prev} next={next} onNavigate={onNavigate} index={index} total={total} />;
  }
  if (collection === 'codex') {
    return <CodexSurface def={def} item={item} accent={accent} onBack={onBack} prev={prev} next={next} onNavigate={onNavigate} index={index} total={total} />;
  }

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
                .filter(f => !['rank', 'focus', 'bio', 'domain', 'squad', 'cadence', 'skills', def.titleField, def.subtitleField, def.badgeField].includes(f.key))
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

/* ═══════════════════════════════════════════════════════════════════════════
 *  PERSONAS surface — first-class profile, anchored or it does not exist
 * ═══════════════════════════════════════════════════════════════════════════ */

function PersonaSurface({
  def, item, accent, onBack, prev, next, onNavigate, index, total,
}: ItemDetailProps) {
  const name = String(item.name ?? '');
  const role = String(item.role ?? '');
  const pronouns = String(item.pronouns ?? '');
  const wants = String(item.wants ?? '');
  const blockers = String(item.blockers ?? '');
  const vocabulary = String(item.vocabulary ?? '');
  const anchor = String(item.anchor ?? '');
  const anchorKind = String(item.anchorKind ?? '');
  const anchorDate = String(item.anchorDate ?? '');
  const domain = String(item.domain ?? '');

  const tone = anchorTone(anchorKind);
  const initials = name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).filter(Boolean).slice(0, 2).join('') || '?';

  const vocab = useMemo(
    () => vocabulary.split(/[·•]/).map(s => s.trim()).filter(Boolean),
    [vocabulary]
  );

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
        <BackAffordance label="Back to personas" onBack={onBack} accent={accent} />

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
              <PillBadge accent={accent}>Persona</PillBadge>
              {domain && (
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--theme-muted)' }}>
                  {domain}
                </span>
              )}
              {pronouns && pronouns !== '—' && (
                <span className="text-[11px] font-medium" style={{ color: 'var(--theme-muted)' }}>
                  · {pronouns}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold font-outfit tracking-tight" style={{ color: 'var(--theme-text)' }}>
              {name || 'Unnamed persona'}
            </h1>
            {role && (
              <p className="mt-1 text-sm" style={{ color: 'var(--theme-muted)' }}>{role}</p>
            )}
          </div>
        </div>

        {/* Anchor band — the whole point of a persona */}
        <div
          className="mt-6 rounded-2xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: tone.bg, border: `1.5px solid ${tone.border}` }}
        >
          <Anchor className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tone.fg }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: tone.fg }}
              >
                {tone.label}
              </span>
              {anchorDate && anchorDate !== '—' && (
                <span className="text-[10.5px] font-mono" style={{ color: tone.fg }}>
                  · {anchorDate}
                </span>
              )}
            </div>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: anchorKind === 'no-anchor' ? '#7f1d1d' : 'var(--theme-text)' }}
            >
              {anchor || (anchorKind === 'no-anchor'
                ? 'No source recorded. A persona without an anchor is an invention — render it visible, do not pretend it exists.'
                : 'No anchor detail recorded.')}
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <UserSearch className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Wants &amp; blockers</span>
            </div>

            {wants && (
              <div
                className="rounded-xl px-3.5 py-3 mb-3"
                style={{ background: `${accent}0f`, border: `1px solid ${accent}33` }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
                  What they want
                </div>
                <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{wants}</div>
              </div>
            )}

            {blockers && (
              <div
                className="rounded-xl px-3.5 py-3"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                  What blocks them
                </div>
                <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{blockers}</div>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Quote className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Vocabulary</span>
            </div>
            {vocab.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {vocab.map(v => (
                  <span
                    key={v}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--canvas)', color: 'var(--theme-text)', border: '1px solid var(--panel-border-subtle)' }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--theme-muted)' }}>No vocabulary recorded.</p>
            )}
          </div>
        </div>

        <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MEMORY surface — curated fact, semantic status band
 * ═══════════════════════════════════════════════════════════════════════════ */

function MemorySurface({
  def, item, accent, onBack, prev, next, onNavigate, index, total,
}: ItemDetailProps) {
  const fact = String(item.fact ?? '');
  const provenance = String(item.provenance ?? '');
  const retainedOn = String(item.retainedOn ?? '');
  const verification = String(item.verification ?? '');
  const verifiedBy = String(item.verifiedBy ?? '');
  const recheckOn = String(item.recheckOn ?? '');
  const domain = String(item.domain ?? '');
  const notes = String(item.notes ?? '');

  const tone = verifyTone(verification);
  const firstSentence = fact.split(/(?<=\.)/)[0]?.trim() ?? fact;
  const rest = fact.split(/(?<=\.)/).slice(1).join(' ').trim();

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
        <BackAffordance label="Back to mémoire" onBack={onBack} accent={accent} />

        <div className="mt-5 flex items-start gap-4">
          <div
            className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${tone.fg}1a`,
              border: `1.5px solid ${tone.border}`,
              color: tone.fg,
            }}
          >
            {verification === 'contradicted' ? <AlertTriangle className="w-7 h-7" /> : <Brain className="w-7 h-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PillBadge accent={accent}>Mémoire</PillBadge>
              {domain && (
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--theme-muted)' }}>
                  {domain}
                </span>
              )}
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1 rounded-md"
                style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}
              >
                {tone.label}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold font-outfit tracking-tight leading-tight" style={{ color: 'var(--theme-text)' }}>
              {firstSentence || 'Fact'}
            </h1>
            {provenance && (
              <p className="mt-1.5 text-sm" style={{ color: 'var(--theme-muted)' }}>
                <span className="font-semibold">Provenance · </span>{provenance}
                {retainedOn && <span className="font-mono text-[var(--theme-text-dim)]"> · retained {retainedOn}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Brain className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Fact</span>
            </div>
            {firstSentence && (
              <p className="text-[15px] font-semibold leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                {firstSentence}
              </p>
            )}
            {rest && (
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                {rest}
              </p>
            )}

            {notes && (
              <div
                className="mt-5 rounded-xl px-3.5 py-3"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                  Notes
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{notes}</div>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Verification</span>
            </div>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  Status
                </dt>
                <dd
                  className="text-sm font-semibold mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  {tone.label}
                </dd>
              </div>
              {verifiedBy && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Verified by
                  </dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{verifiedBy}</dd>
                </div>
              )}
              {recheckOn && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Re-check on
                  </dt>
                  <dd className="text-sm font-mono font-medium" style={{ color: 'var(--theme-text)' }}>{recheckOn}</dd>
                </div>
              )}
              {retainedOn && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Retained on
                  </dt>
                  <dd className="text-sm font-mono font-medium" style={{ color: 'var(--theme-text)' }}>{retainedOn}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  CODEX surface — proven pattern, count is what makes it a method
 * ═══════════════════════════════════════════════════════════════════════════ */

function CodexSurface({
  def, item, accent, onBack, prev, next, onNavigate, index, total,
}: ItemDetailProps) {
  const situation = String(item.situation ?? '');
  const recipe = String(item.recipe ?? '');
  const why = String(item.why ?? '');
  const appliedCount = Number(item.appliedCount ?? 0);
  const lastApplied = String(item.lastApplied ?? '');
  const domain = String(item.domain ?? '');
  const owners = String(item.owners ?? '');
  const caveats = String(item.caveats ?? '');

  const firstSentence = situation.split(/(?<=\.)/)[0]?.trim() ?? situation;
  const rest = situation.split(/(?<=\.)/).slice(1).join(' ').trim();
  const recipeSteps = recipe.split(/\.\s+/).map(s => s.trim()).filter(Boolean);

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
        <BackAffordance label="Back to codex" onBack={onBack} accent={accent} />

        <div className="mt-5 flex items-start gap-5">
          <div
            className="shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
              color: '#ffffff',
              boxShadow: `0 12px 32px -16px ${accent}80`,
            }}
          >
            <Repeat2 className="w-5 h-5 opacity-80" />
            <div className="text-2xl font-extrabold leading-none tabular-nums mt-0.5">{appliedCount}×</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider opacity-90 mt-0.5">applied</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PillBadge accent={accent}>Codex</PillBadge>
              {domain && (
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--theme-muted)' }}>
                  {domain}
                </span>
              )}
              {lastApplied && (
                <span className="text-[11px] font-mono" style={{ color: 'var(--theme-muted)' }}>
                  · last {lastApplied}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold font-outfit tracking-tight leading-tight" style={{ color: 'var(--theme-text)' }}>
              {firstSentence || 'Pattern'}
            </h1>
            {rest && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-muted)' }}>
                {rest}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <BookMarked className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">What we do</span>
            </div>
            {recipeSteps.length > 0 ? (
              <ol className="space-y-2.5">
                {recipeSteps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-extrabold tabular-nums"
                      style={{ background: `${accent}1a`, color: accent }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--theme-muted)' }}>No recipe recorded.</p>
            )}

            {why && (
              <div
                className="mt-5 rounded-xl px-3.5 py-3"
                style={{ background: `${accent}0f`, border: `1px solid ${accent}33` }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
                  Why it works
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{why}</div>
              </div>
            )}

            {caveats && (
              <div
                className="mt-3 rounded-xl px-3.5 py-3"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                  Caveats
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{caveats}</div>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Repeat2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Record</span>
            </div>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  Times applied
                </dt>
                <dd
                  className="text-[28px] font-extrabold tabular-nums leading-none mt-1"
                  style={{ color: accent }}
                >
                  {appliedCount}
                </dd>
              </div>
              {lastApplied && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Last applied
                  </dt>
                  <dd className="text-sm font-mono font-medium" style={{ color: 'var(--theme-text)' }}>{lastApplied}</dd>
                </div>
              )}
              {owners && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Owners
                  </dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{owners}</dd>
                </div>
              )}
              {domain && (
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Domain
                  </dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{domain}</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-[11px] leading-snug" style={{ color: 'var(--theme-muted)' }}>
              A success repeated once is an anecdote. A pattern is a success repeated enough times to be a method.
            </p>
          </div>
        </div>

        <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
