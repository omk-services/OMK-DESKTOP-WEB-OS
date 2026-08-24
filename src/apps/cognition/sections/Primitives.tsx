/**
 * Primitives partages entre les sections de CognitionApp : accent de
 * marque, petites cellules d'affichage (Row/Meta/StatCard) et helpers de
 * formatage. Extrait de CognitionApp.tsx pour garder chaque section sous
 * ~300 lignes, meme convention que src/apps/dashboard/dashboard/Primitives.tsx.
 */
import type { LucideIcon } from 'lucide-react';

export const ACCENT = '#7c3aed';

export function StatCard({ icon: Icon, label, value, accent, hint }: {
  icon: LucideIcon; label: string; value: string; accent: string; hint: string;
}): import('react').ReactNode {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-3 text-[28px] font-extrabold tracking-tight"
        style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
        {hint}
      </div>
    </div>
  );
}

export function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }): import('react').ReactNode {
  return (
    <div className="py-2.5">
      <dt
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[12.5px] ${multiline ? 'leading-relaxed' : ''}`}
        style={{ color: 'var(--theme-text)' }}
      >
        {value}
      </dd>
    </div>
  );
}

export function Meta({ label, value }: { label: string; value: string }): import('react').ReactNode {
  return (
    <div>
      <div
        className="text-[9.5px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {label}
      </div>
      <div className="mt-0.5 text-[12px]" style={{ color: 'var(--theme-text)' }}>
        {value}
      </div>
    </div>
  );
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
