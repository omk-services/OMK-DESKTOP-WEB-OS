/** TopBar — Coach OS global bar: brand, ecosystem seal, bell, clock (light skin) */
import { useState, useEffect } from 'react';
import { Bell, RotateCcw, Leaf } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const bootClean = useShellStore(s => s.bootClean);
  const notificationCount = useShellStore(s => s.notificationCount);
  const clearNotifications = useShellStore(s => s.clearNotifications);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 w-full z-[5000] select-none top-bar">
      <div className="h-full w-full glass border-b border-[var(--panel-border-subtle)] flex items-center justify-between px-4 text-xs font-medium text-stone-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[var(--panel-border-subtle)]">
            <span className="w-4 h-4 rounded-[5px] bg-emerald-600 flex items-center justify-center text-white">
              <Leaf className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold tracking-tight text-stone-800 font-outfit">Coach OS</span>
          </div>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">File</span>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">View</span>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">Window</span>
          <button
            onClick={() => { if (window.confirm('Reset window layout?')) bootClean(); }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all"
            title="Reset window layout"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ecosystem healthy · 24/7
          </span>

          <button onClick={clearNotifications} className="relative group p-1" title="Notifications">
            <Bell className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[var(--theme-accent)] text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 shadow">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px] tracking-tight pl-3 border-l border-[var(--panel-border-subtle)]">
            <span className="text-stone-700 font-semibold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-stone-400 uppercase">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
