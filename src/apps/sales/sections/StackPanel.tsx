/**
 * SalesApp — section Stack : les outils que l'OS lit et actionne, groupes
 * par le job qu'ils font. Extrait de SalesApp.tsx.
 */
import type { ReactElement } from 'react';
import {
  BriefcaseBusiness, Cloud, Cpu, Database, FileText, Mail, MessageSquare, Mic, PhoneCall,
  Plug, Sparkles, Target, Users,
} from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import type { DetailItem } from '../SalesDetailPage';
import {
  Eyebrow, FONT_BODY, FONT_DISPLAY, FONT_MONO, RELANCE, PageHeader, WIN,
  type StackGroup, type ToolStatus,
} from './Primitives';

const STACK: StackGroup[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void STACK;

function stackDetail(tool: { id: string; name: string; role: string; cost?: string; status: ToolStatus }, groupName: string): DetailItem {
  return {
    id: tool.id, kind: 'tool', title: tool.name, subtitle: groupName, status: tool.status, summary: tool.role,
    fields: [
      { label: 'Role', value: tool.role },
      { label: 'Status', value: tool.status },
      { label: 'Cost', value: tool.cost ?? '—' },
    ],
  };
}

export function StackPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory STACK from the CMS store. Tools are
  // JSON-serialized in a longtext field; parsed here. Falls back to the
  // legacy STACK constant if the collection isn't registered yet (HMR).
  const cmsStack = useCmsStore(s => s.items['sales_stack']) ?? [];
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  type StackTool = { id: string; name: string; role: string; cost?: string; status: ToolStatus };
  const toolsOf = (item: CmsItem | undefined): StackTool[] => {
    if (!item) return [];
    const raw = item['tools'];
    if (typeof raw !== 'string' || raw.length === 0) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((t): t is StackTool =>
        t && typeof t === 'object' && typeof t.id === 'string' && typeof t.name === 'string' && typeof t.role === 'string'
      );
    } catch {
      return [];
    }
  };
  // Use the CMS data if any group is present, else fall back to in-memory.
  const useCms = cmsStack.length > 0;
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Stack"
        title="Sales OS"
        subtitle="The tools the OS reads from and acts through, grouped by the job they do. Attio is the system of record, everything else feeds it or runs off it."
        meta={{ label: 'Status', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), sub: 'Live, connected, pending, dormant' }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Stack' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Stack' ? 'var(--theme-bg)' : 'var(--theme-text)',
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
              The stack
            </h2>
          </div>
        </div>
        <p className="max-w-[640px] text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          The tools the OS reads from and acts through, grouped by the job they do. Attio is the system of record, everything else feeds it or runs off it.
        </p>
      </section>

      <div className="mt-8 space-y-10">
        {(useCms ? cmsStack : STACK).map((group, gi) => {
          // When using CMS data, hydrate tools from the JSON-serialized field.
          // Otherwise use the in-memory STACK tools directly.
          const tools = useCms
            ? toolsOf(cmsStack[gi])
            : (group as StackGroup).tools;
          const groupId = String((group as { id: string }).id);
          const groupName = useCms ? txt(cmsStack[gi], 'name') || '—' : (group as StackGroup).name;
          const groupCaption = useCms ? txt(cmsStack[gi], 'caption') || '' : (group as StackGroup).caption;
          return (
          <section key={groupId}>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
                >
                  {String(gi + 2).padStart(2, '0')}
                </span>
                <h2
                  className="text-[20px] font-extrabold tracking-tight"
                  style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                >
                  {groupName}
                </h2>
              </div>
              <Eyebrow>{groupCaption}</Eyebrow>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <button
                  type="button"
                  key={tool.id}
                  onClick={() => onSelect(stackDetail(tool, groupName))}
                  className="group flex items-start gap-3 rounded-2xl p-5 text-left"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                  >
                    <StackIcon id={tool.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className="text-[15px] font-extrabold tracking-tight"
                        style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                      >
                        {tool.name}
                      </span>
                      {tool.cost ? (
                        <span
                          className="text-[10.5px] font-bold uppercase"
                          style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                        >
                          {tool.cost}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      {tool.role}
                    </span>
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        background: tool.status === 'live' || tool.status === 'connected' ? 'rgba(21,128,61,0.10)' : tool.status === 'pending' ? 'rgba(180,83,9,0.10)' : 'rgba(120,113,108,0.10)',
                        color: tool.status === 'live' || tool.status === 'connected' ? WIN : tool.status === 'pending' ? RELANCE : 'var(--theme-text-muted)',
                        letterSpacing: '0.16em',
                        fontFamily: FONT_MONO,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tool.status === 'live' || tool.status === 'connected' ? WIN : tool.status === 'pending' ? RELANCE : 'var(--theme-text-dim)' }}
                        aria-hidden
                      />
                      {tool.status}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}

export function StackIcon({ id }: { id: string }): ReactElement {
  const map: Record<string, typeof Database> = {
    't-attio': Database,
    't-pandadoc': FileText,
    't-fireflies': Mic,
    't-aircall': PhoneCall,
    't-gws': Cloud,
    't-slack': MessageSquare,
    't-vibe': Sparkles,
    't-apify': Plug,
    't-apollo': Target,
    't-li': Users,
    't-vain': BriefcaseBusiness,
    't-amf': Mail,
    't-instantly': Mail,
    't-lemnlist': BriefcaseBusiness,
  };
  const I = map[id] ?? Cpu;
  return <I className="h-4 w-4" />;
}
