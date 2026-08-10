/** OMK IT & R&D canvas — layered infra stack + MCP wiring + vault log.
 *
 *  Why this layout, not the landing template:
 *  IT is the only domaine where the proof is the architecture itself. Coaches
 *  hiring agents care about: where does the data live, who can read what,
 *  can I bring my own model, what's the egress story. So the canvas IS a
 *  stack diagram — layered top-to-bottom (UI → Agents → MCP → Data) with
 *  annotations on each layer. The MCP wiring shows the readable / observable
 *  / reversible contract per tool. The vault log is a real-feeling terminal
 *  feed of access events.
 *
 *  Sections, in order:
 *    top      — split hero (copy left, stack preview right)
 *    stack    — full layered infra diagram (5 layers)
 *    mcp      — MCP wiring cards (3 internal tools × 3 contracts)
 *    vault    — vault access log (terminal)
 *    regions  — US-only compliance row
 *    proof    — 1 testimonial + stats
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, ServerCog, ShieldCheck, Database, Cpu, Lock, Layers, GitBranch, CheckCircle2, Globe } from 'lucide-react';
import { PageChrome, BackToTop, scrollToAnchor } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function ItRdCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'stack', label: 'Stack' },
    { id: 'mcp', label: 'MCP' },
    { id: 'vault', label: 'Vault' },
    { id: 'regions', label: 'US-only' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const layers = [
    { name: 'Coach OS UI', desc: 'Thin client · Vercel edge · ton laptop, ton navigateur', tone: 'var(--theme-accent)', icon: Cpu },
    { name: 'Agent Mesh', desc: 'Orchestrator · Scout · Scribe · Reach · Dev · mandats vérifiés', tone: 'var(--theme-accent-hover)', icon: ServerCog },
    { name: 'MCP Layer', desc: 'Model Context Protocol · chaque outil interne, structuré, observable', tone: 'var(--theme-accent)', icon: GitBranch },
    { name: 'Data Layer', desc: 'Supabase · Postgres · Vault par workspace · chiffré at-rest', tone: 'var(--theme-accent-hover)', icon: Database },
    { name: 'Sovereign Infra', desc: 'Coolify · nodes US-hosted · US-egress · tu tiens les clés', tone: 'var(--theme-accent)', icon: ShieldCheck },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#06b6d4"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">

        {/* ── TOP · split hero ─────────────────────────────────────────── */}
        <section data-anchor="top" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {page.hero.headline}
            </h1>
            <p className="text-base text-[var(--theme-text-muted)] leading-relaxed">{page.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" data-cta="hero" onClick={() => scrollToAnchor(bodyRef.current, 'cta')} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-[var(--theme-text-muted)]">BYO Supabase · BYO Coolify · tu tiens les clés</span>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">SLA · ce matin</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3">
                <div className="text-xl font-extrabold text-[var(--ok)] tabular-nums">99.97%</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">uptime YTD</div>
              </div>
              <div className="rounded-lg bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3">
                <div className="text-xl font-extrabold text-[var(--theme-text)] tabular-nums">0 ms</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">PII dans le training</div>
              </div>
              <div className="rounded-lg bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3">
                <div className="text-xl font-extrabold text-[var(--theme-text)] tabular-nums">1-click</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">audit pack</div>
              </div>
              <div className="rounded-lg bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3">
                <div className="text-xl font-extrabold text-[var(--theme-text)] tabular-nums">US-only</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">hosted + egress</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STACK · 5 layers ─────────────────────────────────────────── */}
        <section data-anchor="stack" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Stack · 5 couches, tu tiens les clés</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Aucune couche ne lit ce qu'elle ne devrait pas</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-2">
            {layers.map((l, i) => (
              <div key={i} className="flex items-stretch gap-3">
                <div className="flex flex-col items-center pt-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: l.tone }}>
                    <l.icon className="w-4 h-4" />
                  </div>
                  {i < layers.length - 1 && <div className="w-px flex-1 bg-[var(--panel-border)] mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-bg)] p-3">
                    <div className="text-sm font-bold text-[var(--theme-text)]">{l.name}</div>
                    <div className="text-xs text-[var(--theme-text-muted)] mt-0.5">{l.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas de PII à protéger. La souveraineté, c'est ce qui ferme un deal enterprise — pas ce qui plaît sur un Twitter thread.
          </div>
        </section>

        {/* ── MCP · 3 tools × 3 contracts ──────────────────────────────── */}
        <section data-anchor="mcp" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">MCP · tes outils internes en lecture/observation/réversibilité</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Chaque tool expose 3 contrats · aucun n'est implicite</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'notion.search', desc: 'Indexation cross-workspace · scope par client', contracts: ['Observable read', 'Citation export', 'No write'] },
              { name: 'stripe.charge', desc: 'Retainer auto-debit · retry policy par défaut', contracts: ['Reversible', 'Audit log', 'Idempotent'] },
              { name: 'vault.session', desc: 'Notes de session chiffrées au champ · scope par workspace', contracts: ['Field encryption', 'Per-client scope', '1-click audit'] },
            ].map((mcp, i) => (
              <div key={i} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span className="font-mono text-xs font-bold text-[var(--theme-text)]">{mcp.name}</span>
                </div>
                <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">{mcp.desc}</p>
                <div className="flex flex-col gap-1.5 mt-1">
                  {mcp.contracts.map(c => (
                    <div key={c} className="flex items-center gap-2 text-[11px] text-[var(--theme-text)]">
                      <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── VAULT · access log ───────────────────────────────────────── */}
        <section data-anchor="vault" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Vault log · les 24 dernières heures</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Field-level encryption · per-client scope</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-canvas)] border border-[var(--panel-border)] p-4 font-mono text-[11px] flex flex-col gap-1 text-[var(--theme-text-muted)]">
            {[
              { ts: '14:18', agent: 'Scribe', op: 'READ', tgt: 'workspace:helena-coaching/notes/session-12.md', ok: 'allowed', extra: 'AES-256 · scope OK' },
              { ts: '14:18', agent: 'Verif', op: 'AUDIT', tgt: 'workspace:lighthouse/seats/012', ok: 'allowed', extra: 'read-only' },
              { ts: '14:17', agent: '?', op: 'READ', tgt: 'workspace:helena-coaching/notes/*', ok: 'denied', extra: 'wrong scope · Sentry alerted' },
              { ts: '14:16', agent: 'Reach', op: 'WRITE', tgt: 'workspace:lattice/crm/opportunity-082', ok: 'reversible', extra: 'rolled back in 200ms' },
              { ts: '14:15', agent: 'Dev', op: 'EXEC', tgt: 'sandbox:feature/scout-v3', ok: 'sandboxed', extra: 'no prod write' },
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-baseline">
                <span className="text-[var(--theme-text-dim)] shrink-0">{line.ts}</span>
                <span className="text-[var(--theme-text)] shrink-0 w-20 truncate">{line.agent}</span>
                <span
                  className={`shrink-0 w-16 ${
                    line.op === 'READ' ? 'text-[var(--theme-text-muted)]'
                    : line.op === 'WRITE' ? 'text-[var(--warn)]'
                    : line.op === 'AUDIT' ? 'text-[var(--ok)]'
                    : 'text-[var(--theme-accent)]'
                  }`}
                >{line.op}</span>
                <span className="truncate flex-1 text-[var(--theme-text)]">{line.tgt}</span>
                <span className={`shrink-0 ${line.ok === 'denied' ? 'text-[var(--danger)]' : line.ok === 'reversible' ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>· {line.ok}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── REGIONS · US-only compliance row ────────────────────────── */}
        <section data-anchor="regions" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Hébergement · US-only, point</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">CCPA · Colorado AI Act · AI-Act ready</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[var(--theme-accent)]" />
              <div>
                <div className="text-sm font-bold text-[var(--theme-text)]">US-hosted</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">Supabase Cloud · Vercel Edge</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[var(--theme-accent)]" />
              <div>
                <div className="text-sm font-bold text-[var(--theme-text)]">AES-256 at-rest</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">TLS 1.3 in-transit</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--theme-accent)]" />
              <div>
                <div className="text-sm font-bold text-[var(--theme-text)]">AI-Act 2026-08-02</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">audit pack 1-click</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <ServerCog className="w-6 h-6 text-[var(--theme-accent)]" />
            <p className="text-lg leading-relaxed text-[var(--theme-text)] font-medium">&ldquo;{page.testimonials[0].quote}&rdquo;</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[var(--theme-text)]">{page.testimonials[0].author}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">{page.testimonials[0].role} · {page.testimonials[0].company}</div>
              </div>
              {page.testimonials[0].metric && (
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[var(--theme-text)] tabular-nums">{page.testimonials[0].metric.value}</div>
                  <div className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider">{page.testimonials[0].metric.label}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {page.stats.map(s => (
              <div key={s.label} className="rounded-xl bg-[var(--theme-surface)] border border-[var(--panel-border)] px-4 py-3 flex flex-col gap-0.5">
                <span className="text-2xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>{s.value}</span>
                <span className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section data-anchor="cta" className="rounded-3xl px-10 py-14 text-center" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }}>
          <Layers className="w-7 h-7 text-white mx-auto mb-3" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--theme-font-display)' }}>{page.closing.headline}</h2>
          <p className="text-white text-sm mt-2 max-w-xl mx-auto opacity-90">{page.closing.sub}</p>
          <button type="button" data-cta="closing"
            onClick={() => onSelectPage('onboarding-demo')}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:#fff] px-6 py-3 text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ color: 'var(--theme-accent)' }}>
            {page.closing.cta.label} <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        <BackToTop onClick={() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
        <footer className="text-center text-xs text-[var(--theme-text-dim)] pb-2">{page.brand} · {page.domain} · Coach OS · OMK AaaS canon</footer>
      </div>
    </PageChrome>
  );
}
