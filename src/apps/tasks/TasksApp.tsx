import { CheckSquare, Sun, CalendarClock, CheckCheck, Check } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';

const ACCENT = '#0d9488';

export function TasksApp() {
  const tasks = useCmsStore(s => s.items['tasks']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const addToast = useShellStore(s => s.addToast);
  const drill = useCollectionDrill('tasks', ['Today', 'Upcoming', 'Done']);

  const toggle = (id: string) => {
    const current = tasks.find(t => t.id === id);
    if (current && !current.done) {
      addToast({ source: 'Tasks', type: 'success', message: `Done: ${current.label}` });
    }
    updateItem('tasks', id, { done: !current?.done });
  };

  const list = (filter: (t: typeof tasks[number]) => boolean, title: string, empty: string) => {
    const items = tasks.filter(filter);
    return (
      <div className="p-7">
        <SectionHead title={title} subtitle={`${items.length} item${items.length === 1 ? '' : 's'}`} />
        {items.length === 0 ? (
          <div className="text-sm text-stone-400 py-10 text-center">{empty}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-[var(--panel-border)] shadow-sm px-4 py-3">
                <button
                  onClick={() => toggle(String(t.id))}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors`}
                  style={t.done ? { background: ACCENT, borderColor: 'transparent' } : undefined}
                >
                  {t.done ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                </button>
                <button onClick={() => drill.open(String(t.id))} className={`flex-1 text-left text-sm ${t.done ? 'line-through text-stone-400' : 'text-stone-800 font-medium hover:text-[var(--theme-accent)]'} transition-colors`}>
                  {String(t.label)}
                </button>
                <span className="text-xs text-stone-400">{String(t.when)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isToday = (t: typeof tasks[number]) => t.group === 'today' && !t.done;
  const isUpcoming = (t: typeof tasks[number]) => t.group === 'upcoming' && !t.done;

  const Today = () => {
    if (drill.openId) return <DynamicPageView collectionId="tasks" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return list(isToday, 'Today', 'Nothing left today — nicely done.');
  };
  const Upcoming = () => {
    if (drill.openId) return <DynamicPageView collectionId="tasks" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return list(isUpcoming, 'Upcoming', 'Nothing on the horizon.');
  };
  const Done = () => {
    if (drill.openId) return <DynamicPageView collectionId="tasks" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return list(t => !!t.done, 'Done', 'No completed tasks yet.');
  };

  const sections: AppSection[] = [
    { id: 'today', label: 'Today', icon: Sun, render: Today },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, render: Upcoming },
    { id: 'done', label: 'Done', icon: CheckCheck, render: Done },
  ];

  return <AppFrame title="Tasks" subtitle="What needs you" icon={CheckSquare} accent={ACCENT} sections={sections} />;
}
