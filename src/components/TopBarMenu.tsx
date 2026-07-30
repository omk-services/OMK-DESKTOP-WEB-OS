/**
 * TopBarMenu — reusable dropdown shell for the TopBar's 3 action menus
 * (Profile, App Visibility, Changelog). Standardizes position, backdrop,
 * width, and outside-click handling.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface TopBarMenuProps {
  /** Trigger label rendered inside the soft pill (e.g. "Profile", "Apps", "Changelog"). */
  triggerLabel: string;
  /** Lucide icon for the trigger pill. */
  triggerIcon: ReactNode;
  /** Dropdown width in px. */
  width: number;
  /** Dropdown content. */
  children: ReactNode;
  /** Theme tokens for backdrop. */
  isDark: boolean;
  /** Accessibility label. */
  ariaLabel: string;
}

export function TopBarMenu({
  triggerLabel,
  triggerIcon,
  width,
  children,
  isDark,
  ariaLabel,
}: TopBarMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="px-2.5 h-7 text-[11.5px] font-medium rounded-lg transition-colors hover:bg-[var(--theme-surface-hover)] flex items-center gap-1.5"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {triggerIcon}
        {triggerLabel}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1.5 z-[5100] rounded-2xl p-2"
          style={{
            width,
            background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
