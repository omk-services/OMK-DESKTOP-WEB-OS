/** NotificationsDropdown — bell-button dropdown.
 *
 *  S_SOCLE chantier 2 (2026-08-10) — replaced the previous bell-on-click-
 *  clears-the-counter with a real panel that lists the persistent
 *  notification history. Closes on outside click and on Escape, like
 *  the other TopBar menus (Theme, Profile, Apps, Changelog). */
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check, Trash2 } from 'lucide-react';
import { useShellStore, type Notification } from '../stores/shell.store';

const TYPE_ICONS: Record<Notification['type'], typeof Info> = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle,
};
const TYPE_COLORS: Record<Notification['type'], string> = {
  info: '#2563eb', success: '#16a34a', warning: '#d97706', error: '#dc2626',
};

function formatRelative(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const sec = Math.floor(delta / 1000);
  if (sec < 5) return 'à l’instant';
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  return `il y a ${day} j`;
}

interface NotificationsDropdownProps {
  isDark: boolean;
}

export function NotificationsDropdown({ isDark }: NotificationsDropdownProps): import('react').ReactNode {
  const notifications = useShellStore((s) => s.notifications);
  const unreadCount = useShellStore((s) => s.notificationCount);
  const clearNotifications = useShellStore((s) => s.clearNotifications);
  const dismissAllNotifications = useShellStore((s) => s.dismissAllNotifications);
  const dismissNotification = useShellStore((s) => s.dismissNotification);

  const [open, setOpenOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape, mirroring TopBarMenu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpenOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpenOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        data-testid="notifications-bell"
        className="relative h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--theme-surface-hover)]"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-[var(--theme-on-accent)] text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
            style={{ background: 'var(--theme-accent)', boxShadow: '0 0 0 2px white' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          data-testid="notifications-panel"
          className="absolute right-0 top-full mt-1.5 z-[5100] w-[340px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)',
            maxHeight: 'min(60vh, 480px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-wider"
            style={{
              color: 'var(--theme-text-muted)',
              borderBottom: '1px solid var(--theme-border-subtle)',
            }}
          >
            <span>Notifications</span>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearNotifications}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold normal-case tracking-normal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: 'var(--theme-text-muted)' }}
                  title="Tout marquer comme lu"
                >
                  <Check className="w-3 h-3" />
                  Tout marquer comme lu
                </button>
                <button
                  type="button"
                  onClick={dismissAllNotifications}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold normal-case tracking-normal transition-colors"
                  style={{ color: 'var(--theme-text-dim)' }}
                  title="Effacer l'historique"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div
                className="px-4 py-8 text-center text-[11.5px]"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type];
                return (
                  <div
                    key={n.id}
                    data-testid="notification-row"
                    className="flex items-start gap-2.5 px-3 py-2.5 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--theme-border-subtle)',
                      background: n.read ? 'transparent' : 'rgba(99,102,241,0.06)',
                    }}
                  >
                    <div
                      className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center mt-0.5"
                      style={{ background: `${TYPE_COLORS[n.type]}1a`, color: TYPE_COLORS[n.type] }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider truncate"
                          style={{ color: 'var(--theme-text-dim)' }}
                        >
                          {n.source || 'Citadelle'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                          · {formatRelative(n.timestamp)}
                        </span>
                        {!n.read && (
                          <span
                            aria-label="non lue"
                            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: 'var(--theme-accent)' }}
                          />
                        )}
                      </div>
                      <div
                        className="text-[11.5px] mt-0.5 leading-snug"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {n.message}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissNotification(n.id)}
                      aria-label="Retirer cette notification"
                      className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center hover:bg-[var(--theme-surface-hover)]"
                      style={{ color: 'var(--theme-text-dim)' }}
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
