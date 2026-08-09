/**
 * Agents — grid of agent cards. Click opens the AgentDetailPage in an
 * AppDetailOverlay (mounted as a sibling of AppFrame in DashboardApp).
 *
 * Theming: every surface / text / border reads from `--theme-*` tokens.
 * Status pills use semantic colors (green = healthy, amber = degraded,
 * red = tripped) via the Tone primitive, not Tailwind palette classes.
 */
import { Bot, ChevronRight, MessageSquare, Plug, ShieldCheck, Sparkles } from 'lucide-react';
import { AGENTS } from '../seed';
import { Panel, IconChip, Pill, ProgressBar, SectionTitle } from '../Primitives';

export function Agents({ onSelect }: { onSelect: (agentId: string) => void }) {
  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Core"
        title="Agents"
        subtitle="Grille de fiches — chaque fiche ouvre un détail à onglets (invite, conversation, sessions, mémoires, connexions, réglages)."
        action={<Pill tone="ok">{AGENTS.length} actifs</Pill>}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => {
          const tone =
            a.state === 'healthy' ? 'ok'
            : a.state === 'degraded' ? 'warn'
            : 'danger';
          return (
            <Panel
              key={a.id}
              pad="p-5"
              className="group flex flex-col gap-3 text-left transition-all hover:-translate-y-0.5"
              style={{ cursor: 'pointer' }}
            >
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="flex flex-col gap-3 text-left"
                aria-label={`open ${a.name}`}
              >
                <div className="flex items-start gap-3">
                  <IconChip tone={tone}>
                    <Bot className="h-4.5 w-4.5" />
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-bold" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
                        {a.name}
                      </span>
                      <Pill tone={tone}>{a.state}</Pill>
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                      {a.role}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--theme-text-dim)' }} />
                </div>

                <p className="text-[12.5px] leading-snug" style={{ color: 'var(--theme-text)' }}>
                  {a.purpose}
                </p>

                <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {a.model}
                  </span>
                  <span>{a.health}% santé</span>
                </div>
                <ProgressBar value={a.health} tone={tone} />

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Stat label="sessions 24h" value={a.sessionsLast24h} />
                  <Stat label="coût 24h" value={`$${a.costLast24h.toFixed(2)}`} />
                  <Stat label="mémoires" value={a.memories} />
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-[10px] uppercase tracking-wider" style={{ borderColor: 'var(--panel-border-subtle)', color: 'var(--theme-text-dim)' }}>
                  <span className="inline-flex items-center gap-1">
                    <Plug className="h-3 w-3" /> {a.connections.length} connexion{a.connections.length > 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {a.guardrails.length} garde-fou{a.guardrails.length > 1 ? 's' : ''}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="-mx-2 -mb-2 mt-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  background: 'var(--theme-surface-hover)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <MessageSquare className="h-3 w-3" /> Discuter avec cet agent
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="rounded-lg p-2"
      style={{ background: 'var(--theme-surface-hover)' }}
    >
      <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-extrabold tabular-nums" style={{ color: 'var(--theme-text)' }}>
        {value}
      </div>
    </div>
  );
}
