/**
 * SalesApp — primitives partagees entre les 6 sections : accent, couleurs
 * semantiques, typographie, types/interfaces du domaine, et petits
 * composants d'affichage (Eyebrow, Frame, PageHeader). Extrait de
 * SalesApp.tsx.
 */
import type { ReactElement } from 'react';
import type { BookOpen, Phone } from 'lucide-react';

export const ACCENT = '#ea580c';

// ── Semantic colors — the ONLY non-theme hexes allowed by the brief ──
export const WIN = '#15803d';
export const LOSE = '#b91c1c';
export const RELANCE = '#b45309';
export const ICP_FIT = '#15803d';
export const ICP_EDGE = '#b45309';
export const ICP_OFF = '#b91c1c';

// ── Shared typography primitives (typography carries the editorial tone,
// not raw colors) ──
export const FONT_DISPLAY = 'var(--theme-font-display)';
export const FONT_BODY = 'var(--theme-font-body)';
export const FONT_MONO = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';

export type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral';
export type ToolStatus = 'live' | 'connected' | 'pending' | 'dormant';

export interface CallRecord { id: string; name: string; company: string; role: string; time: string; stage: string; score: number; badge: 'on-ICP' | 'ICP-edge' | 'off-ICP'; brief: string; links: { label: string; icon: typeof Phone }[]; }
export interface TaskRecord { id: string; title: string; when: string; priority: 'now' | 'next' | 'watch'; tone: Tone; note: string; }
export interface ChangeRecord { id: string; time: string; text: string; }
export interface CalendarRecord { id: string; label: string; detail: string; }
export interface SnapshotStat { id: string; label: string; value: string; sub: string; foot?: string; accent: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'; }
export interface DealStage { id: string; label: string; count: number; weighted: string; tone: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'; }
export interface TrendSeries { id: string; title: string; caption: string; unit: string; points: { label: string; value: number }[]; accent: 'ok' | 'accent' | 'warn' | 'danger'; }
export interface DimensionScore { id: string; label: string; value: number; outOf: number; note: string; tone: 'ok' | 'warn' | 'danger'; }
void (null as unknown as DimensionScore | null); // type kept for future re-migration
export interface ContextGroup { id: string; eyebrow: string; items: { id: string; title: string; subtitle: string; }[]; }
export interface SkillRecord { id: string; name: string; description: string; icon: typeof BookOpen; }
export interface RoutineRecord { id: string; name: string; trigger: string; last: string; kind: 'event' | 'time' | 'manual'; isActive: boolean; }
export interface StackGroup { id: string; name: string; caption: string; tools: { id: string; name: string; role: string; cost?: string; status: ToolStatus; }[]; }

// ─── Shared visual primitives ───

export function Eyebrow({ children, mono = true }: { children: React.ReactNode; mono?: boolean }): ReactElement {
  return (
    <span
      className="text-[10px] font-bold uppercase"
      style={{
        letterSpacing: '0.14em',
        color: 'var(--theme-text-dim)',
        fontFamily: mono ? FONT_MONO : FONT_DISPLAY,
      }}
    >
      {children}
    </span>
  );
}

export function Frame({ children, accent }: { children: React.ReactNode; accent?: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }): ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
        boxShadow: '0 1px 0 var(--panel-border-subtle)',
      }}
    >
      {accent ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: accent === 'ok' ? WIN : accent === 'warn' ? RELANCE : accent === 'danger' ? LOSE : ACCENT }}
        />
      ) : null}
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, meta }: { eyebrow: string; title: string; subtitle: string; meta: { label: string; value: string; sub: string } }): ReactElement {
  return (
    <header className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className="mt-2 text-[40px] font-extrabold leading-[1.05] tracking-tight whitespace-nowrap"
          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
        >
          {title}{' '}
          <span
            className="rounded-md px-1.5 py-0.5 align-middle whitespace-nowrap"
            style={{ background: 'rgba(187,247,208,0.55)', color: 'var(--theme-text)' }}
          >
            Control Center
          </span>
        </h1>
        <p
          className="mt-3 max-w-[640px] text-[14px] leading-relaxed"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {subtitle}
        </p>
      </div>
      <div className="text-right max-w-[180px] shrink-0">
        <Eyebrow>{meta.label}</Eyebrow>
        <div
          className="mt-1 text-[15px] font-extrabold break-words"
          style={{ fontFamily: FONT_MONO, color: 'var(--theme-text)' }}
        >
          {meta.value}
        </div>
        <div
          className="mt-1 text-[11.5px] leading-snug"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {meta.sub}
        </div>
      </div>
    </header>
  );
}
