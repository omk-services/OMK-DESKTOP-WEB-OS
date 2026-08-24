/**
 * SalesApp — section Capabilities : les skills sur demande et les
 * routines sur horloge du second cerveau. Extrait de SalesApp.tsx.
 */
import {
  BriefcaseBusiness, Calendar, ClipboardList, FileText, Layers, Mail, MessageSquare, Mic,
  Phone, Target, Users, type LucideIcon,
} from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import type { DetailItem } from '../SalesDetailPage';
import {
  Eyebrow, FONT_BODY, FONT_DISPLAY, FONT_MONO, PageHeader,
  type RoutineRecord, type SkillRecord,
} from './Primitives';

const SKILLS: SkillRecord[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void SKILLS;

const ROUTINES: RoutineRecord[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void ROUTINES;

function skillDetail(skill: SkillRecord): DetailItem {
  return {
    id: skill.id, kind: 'routine', title: skill.name, subtitle: 'Skill · available on demand', status: 'available', summary: skill.description,
    fields: [
      { label: 'Kind', value: 'On-demand skill' },
      { label: 'Description', value: skill.description },
    ],
  };
}

function routineDetail(routine: RoutineRecord): DetailItem {
  return {
    id: routine.id, kind: 'routine', title: routine.name, subtitle: routine.trigger, status: routine.isActive ? 'active' : 'paused', summary: `${routine.kind} · last ran ${routine.last}.`,
    fields: [
      { label: 'Trigger', value: routine.trigger },
      { label: 'Last run', value: routine.last },
      { label: 'Kind', value: routine.kind },
    ],
  };
}

export function CapabilitiesPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory SKILLS + ROUTINES from the CMS store. Icon
  // is stored as a string identifier; the renderer maps it to a Lucide
  // component. Routines' `kind` is also a string enum.
  const skillItems = useCmsStore(s => s.items['sales_skills']) ?? [];
  const routineItems = useCmsStore(s => s.items['sales_routines']) ?? [];
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  // Map icon string identifiers to Lucide components. Add new icons here
  // when extending the sales_skills collection.
  const iconMap: Record<string, LucideIcon> = {
    Phone, FileText, Target, Users, Mail, ClipboardList, MessageSquare, BriefcaseBusiness,
  };
  void onSelect;
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Capabilities"
        title="Sales OS"
        subtitle="The skills and routines that run the second brain. Eight skills on demand, six routines on a clock — each one is the kind of thing you used to do at 9am before you had an OS."
        meta={{ label: 'Skills', value: `${skillItems.length}`, sub: `${routineItems.length} routines` }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Capabilities' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Capabilities' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Skills
            </h2>
          </div>
          <Eyebrow>on demand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {skillItems.map((s) => {
            // Map icon string (stored in CMS) to Lucide component.
            // If the icon name doesn't match, fall back to Phone.
            const iconName = txt(s, 'icon') || 'Phone';
            const Icon = iconMap[iconName] ?? Phone;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => onSelect(skillDetail({
                  id: String(s.id),
                  name: txt(s, 'name') || '—',
                  description: txt(s, 'description') || '',
                  icon: Icon,
                }))}
                className="group flex items-start gap-3 rounded-2xl p-5 text-left"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[15px] font-extrabold tracking-tight"
                    style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                  >
                    {txt(s, 'name') || '—'}
                  </span>
                  <span className="mt-0.5 block text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {txt(s, 'description') || '—'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >02</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Routines
            </h2>
          </div>
          <Eyebrow>{`${routineItems.length} routines`}</Eyebrow>
        </div>
        <article
          className="rounded-2xl"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul>
            {routineItems.map((r, i) => {
              const kind = txt(r, 'kind');
              const KindIcon = kind === 'event' ? Layers : kind === 'time' ? Calendar : Mic;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(routineDetail({
                      id: String(r.id),
                      name: txt(r, 'name') || '—',
                      trigger: txt(r, 'trigger') || '',
                      last: txt(r, 'last') || '',
                      kind: (kind === 'event' || kind === 'time' || kind === 'manual' ? kind : 'time') as 'event' | 'time' | 'manual',
                      isActive: Boolean(r['isActive']),
                    }))}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md"
                      style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                    >
                      <KindIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[14.5px] font-extrabold tracking-tight"
                        style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                      >
                        {txt(r, 'name') || '—'}
                      </span>
                      <span
                        className="mt-0.5 block text-[10.5px] font-bold uppercase"
                        style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                      >
                        {txt(r, 'trigger') || '—'}
                      </span>
                    </span>
                  </button>
                  <div className="text-right">
                    <Eyebrow>last run</Eyebrow>
                    <div
                      className="mt-1 text-[12.5px] font-bold"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {txt(r, 'last') || '—'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </div>
  );
}
