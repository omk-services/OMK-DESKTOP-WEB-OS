/**
 * Journal — evenements systeme, en lecture seule.
 * Extrait de CognitionApp.tsx (section 3 / 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { SectionHead } from '../../../components/AppFrame';
import { useShellStore } from '../../../stores/shell.store';
import { supabase, supabaseConfigured } from '../../../lib/supabase';
import { fetchEventsSafe, type CognEvent } from '../../../lib/cognition/queries';
import { ACCENT, formatTimestamp } from './Primitives';

export function JournalSection(): import('react').ReactNode {
  const [events, setEvents] = useState<CognEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useShellStore((s) => s.addToast);

  useEffect(() => {
    let cancelled = false;
    const client = supabaseConfigured ? supabase : null;
    setLoading(true);
    void fetchEventsSafe(client, 50).then((es) => {
      if (cancelled) return;
      setEvents(es);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, CognEvent[]> = {};
    for (const e of events) {
      const key = e.event_type ?? 'unknown';
      (map[key] ??= []).push(e);
    }
    return map;
  }, [events]);

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    const client = supabaseConfigured ? supabase : null;
    const es = await fetchEventsSafe(client, 50);
    setEvents(es);
    setLoading(false);
    refresh({ source: 'Cognition', type: 'info', message: 'Journal rafraichi.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHead
          title="Journal"
          subtitle={`${events.length} evenements systeme — pas de boutons de creation, c'est un journal`}
        />
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all hover:opacity-80"
          style={{
            background: 'var(--theme-surface)',
            color: 'var(--theme-text)',
            border: '1px solid var(--panel-border)',
          }}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Rafraichir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(grouped).map(([type, list]) => (
          <div
            key={type}
            className="rounded-2xl border p-3"
            style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-dim)' }}
            >
              {type}
            </div>
            <div
              className="mt-1 text-[20px] font-extrabold"
              style={{ color: 'var(--theme-text)' }}
            >
              {list.length}
            </div>
          </div>
        ))}
      </div>

      <section
        className="rounded-2xl border"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <ul>
          {events.map((e, i) => (
            <li
              key={e.id}
              className="flex items-start gap-4 px-4 py-3"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)',
              }}
            >
              <span
                className="w-32 shrink-0 text-[10.5px] font-mono"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                {formatTimestamp(e.created_at)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: `${ACCENT}1a`,
                      color: ACCENT,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    {e.event_type}
                  </span>
                  {e.member ? (
                    <span
                      className="text-[10.5px] font-mono"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {e.member}
                    </span>
                  ) : null}
                </div>
                {Object.keys(e.payload ?? {}).length > 0 ? (
                  <p
                    className="mt-1 text-[11.5px] font-mono leading-relaxed"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {JSON.stringify(e.payload)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {events.length === 0 && !loading ? (
            <li className="px-4 py-8 text-center text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              Aucun evenement dans <span className="font-mono">cognition.events</span>.
            </li>
          ) : null}
          {loading ? (
            <li className="px-4 py-8 text-center text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              Chargement…
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
