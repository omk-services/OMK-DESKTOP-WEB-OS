import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare,
  Cpu,
  ExternalLink,
  RotateCw,
  X,
  type LucideIcon,
} from 'lucide-react';

export type DetailKind = 'deal' | 'call' | 'task' | 'doc' | 'routine' | 'tool';

export interface DetailField {
  label: string;
  value: string;
}

interface DetailBase {
  id: string;
  kind: DetailKind;
  title: string;
  subtitle: string;
  summary: string;
  status: string;
  fields: DetailField[];
}

export interface DealDetail extends DetailBase {
  kind: 'deal';
}

export interface CallDetail extends DetailBase {
  kind: 'call';
}

export interface TaskDetail extends DetailBase {
  kind: 'task';
}

export interface DocDetail extends DetailBase {
  kind: 'doc';
}

export interface RoutineDetail extends DetailBase {
  kind: 'routine';
}

export interface ToolDetail extends DetailBase {
  kind: 'tool';
}

export type DetailItem = DealDetail | CallDetail | TaskDetail | DocDetail | RoutineDetail | ToolDetail;

interface SalesDetailDrawerProps {
  item: DetailItem | null;
  onClose: () => void;
  onNavigate?: (appId: string) => void;
}

interface DrawerMeta {
  label: string;
  icon: LucideIcon;
  accent: string;
  action?: { label: string; appId: string };
}

const DRAWER_META: Record<DetailKind, DrawerMeta> = {
  deal: { label: 'Deal workspace', icon: BriefcaseBusiness, accent: '#ea580c' },
  call: {
    label: 'Call intelligence',
    icon: CalendarClock,
    accent: '#2563eb',
    action: { label: 'Review Sovereign Gate', appId: 'cognition' },
  },
  task: {
    label: 'Execution task',
    icon: CheckSquare,
    accent: '#0d9488',
    action: { label: 'Open in Tasks', appId: 'tasks' },
  },
  doc: {
    label: 'Context document',
    icon: BookOpen,
    accent: '#7c3aed',
    action: { label: 'Return to Context', appId: 'sales' },
  },
  routine: { label: 'Cognition routine', icon: RotateCw, accent: '#c2410c' },
  tool: {
    label: 'Stack connector',
    icon: Cpu,
    accent: '#475569',
    action: { label: 'Open connector settings', appId: 'settings' },
  },
};

function navigateToAction(item: DetailItem, onNavigate: (appId: string) => void, onClose: () => void): void {
  const action = DRAWER_META[item.kind].action;
  if (!action) return;
  onNavigate(action.appId);
  onClose();
}

export function SalesDetailDrawer({ item, onClose, onNavigate }: SalesDetailDrawerProps) {
  if (!item) return null;

  const meta = DRAWER_META[item.kind];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-labelledby="sales-detail-title">
      <button
        type="button"
        aria-label="Return to Sales OS"
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/35 backdrop-blur-[1px]"
      />
      <aside className="absolute inset-y-0 right-0 w-[300px] max-w-[88vw] overflow-y-auto bg-white shadow-2xl border-l border-stone-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{meta.label}</span>
          <button
            type="button"
            aria-label="Return to Sales OS"
            title="Return to Sales OS"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: meta.accent }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${meta.accent}16`, color: meta.accent }}
              >
                {item.status}
              </span>
              <h2 id="sales-detail-title" className="mt-1.5 text-lg font-bold leading-tight text-stone-900">
                {item.title}
              </h2>
              <p className="mt-1 text-xs text-stone-500">{item.subtitle}</p>
            </div>
          </div>

          <section className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Full context</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-stone-700">{item.summary}</p>
          </section>

          <dl className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200 px-3.5">
            {item.fields.map((field) => (
              <div key={field.label} className="py-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{field.label}</dt>
                <dd className="mt-0.5 text-[12.5px] font-medium leading-snug text-stone-800">{field.value}</dd>
              </div>
            ))}
          </dl>

          {meta.action && onNavigate ? (
            <button
              type="button"
              onClick={() => navigateToAction(item, onNavigate, onClose)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: meta.accent }}
            >
              {meta.action.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
