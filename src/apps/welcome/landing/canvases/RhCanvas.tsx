/** OMK RH canvas — hierarchy + mandate stack.
 *
 *  Why this layout, not the landing template:
 *  RH & Meta-Gouvernance is about WHO reports to WHOM and WHAT each agent is
 *  permitted to do. The proof is structural — an org chart, not a testimonial.
 *  So we render an actual hierarchy (you at the top, three squads under you,
 *  one fleet per squad) and a mandate register (the contracts each agent
 *  ships with). Testimonials at the bottom, because RH is rare in the canon
 *  to need social proof at all.
 *
 *  Sections, in order:
 *    top      — split hero (complaint left, mini-tree right)
 *    tree     — the full org chart (you → squads → agents)
 *    mandates — 3 mandate pillars + 1 kill-switch callout
 *    fleet    — agent cards by squad
 *    audit    — B1 Gatekeeper log feed
 *    proof    — 1 testimonial + 1 stat strip (compact, not the standard one)
 *    cta      — single, soft
 */

import { useRef } from 'react';
import { ArrowRight, Shield, ShieldCheck, ShieldAlert, GitBranch, Crown, Users } from 'lucide-react';
import { PageChrome, BackToTop } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function RhCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'tree', label: 'Hiérarchie' },
    { id: 'mandates', label: 'Mandats' },
    { id: 'fleet', label: 'Effectif' },
    { id: 'audit', label: 'Audit' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const squads = [
    { name: 'Green Lanterns', role: 'Agent Factory', count: 5, tone: 'var(--theme-accent)' },
    { name: 'X-Men', role: 'Sprints', count: 4, tone: 'var(--theme-accent-hover)' },
    { name: 'Avengers', role: 'Sentinelle', count: 3, tone: 'var(--theme-accent)' },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#4f46e5"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">

        {/* ── TOP · split hero ─────────────────────────────────────────── */}
        <section data-anchor="top" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {page.hero.headline}
            </h1>
            <p className="text-base text-[var(--theme-text-muted)] leading-relaxed max-w-xl">{page.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#cta" className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-[color:#fff] px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </a>
              <span className="text-xs text-[var(--theme-text-muted)]">Mandate on file · kill switch in the box · 0 carte requise</span>
            </div>
          </div>

          {/* Mini-tree, right side. The point is to give shape immediately. */}
          <div className="lg:col-span-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">Ton arbre, ce matin</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] text-[color:#fff] px-3 py-2 text-sm font-semibold shadow-sm">
                <Crown className="w-4 h-4" />
                Toi · la décision finale
              </div>
              <div className="ml-4 h-4 border-l-2 border-dashed border-[var(--panel-border)]" />
              {squads.map(s => (
                <div key={s.name} className="flex items-center gap-2 rounded-xl border border-[var(--panel-border)] px-3 py-2 text-sm">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.tone }} />
                  <span className="font-semibold text-[var(--theme-text)]">{s.name}</span>
                  <span className="text-[var(--theme-text-muted)] text-xs">· {s.role}</span>
                  <span className="ml-auto text-[10px] font-bold text-[var(--theme-text-dim)]">{s.count} agents</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TREE · the full hierarchy ─────────────────────────────────── */}
        <section data-anchor="tree" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">L'arbre complet</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">3 squads · 12 agents · 0 freelances fantômes</span>
          </div>

          <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-6 flex flex-col gap-5">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] text-[color:#fff] px-4 py-2 text-sm font-bold shadow-md">
                <Crown className="w-4 h-4" />
                Toi
              </div>
            </div>
            <div className="flex justify-center gap-1 h-6">
              <div className="w-px h-full border-l-2 border-dashed border-[var(--panel-border)]" />
              <div className="w-px h-full border-l-2 border-dashed border-[var(--panel-border)] translate-x-6" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {squads.map(s => (
                <div key={s.name} className="flex flex-col gap-2 rounded-2xl border border-[var(--panel-border)] p-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[var(--theme-accent)]" />
                    <span className="text-sm font-bold text-[var(--theme-text)]">{s.name}</span>
                  </div>
                  <span className="text-[11px] text-[var(--theme-text-muted)]">{s.role}</span>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {Array.from({ length: s.count }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--theme-surface-hover)] px-2 py-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.tone }} />
                        <span className="text-[var(--theme-text)] font-medium">Agent {s.name.split(' ').slice(-1)[0]}-{i + 1}</span>
                        <span className="ml-auto text-[10px] text-[var(--ok)]">●</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pushback — who this isn't for */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas encore signé 5 clients payants. Un agent sans roster à servir, c'est du salaire à fonds perdus.
          </div>
        </section>

        {/* ── MANDATES · the three pillars + kill switch ─────────────────── */}
        <section data-anchor="mandates" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Le mandat, ce qui change tout</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">3 piliers · 1 kill switch</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { Icon: Shield, name: 'Identity Vault', body: 'Chaque agent naît avec une identité signée. Pas de SSN, pas de compte fantôme, pas de Slack DM avec ton nom de domaine.' },
              { Icon: ShieldCheck, name: 'Mandate Doc', body: 'Ce que l\'agent a le droit de faire, en clair. Lecture seule, écriture conditionnelle, kill switch explicite.' },
              { Icon: ShieldAlert, name: 'Audit Log', body: 'Chaque décision, datée et signée. Tu rejoues la conversation, tu vois l\'action, tu approuves ou tu revois.' },
            ].map(p => (
              <div key={p.name} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
                  <p.Icon className="w-5 h-5" />
                </span>
                <span className="text-base font-bold text-[var(--theme-text)]">{p.name}</span>
                <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FLEET · agent cards by squad ──────────────────────────────── */}
        <section data-anchor="fleet" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">L'effectif ce matin</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Tous présents · 0 incident</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Orchestrator', squad: 'Green Lanterns', state: 'Active' },
              { name: 'Scout', squad: 'Green Lanterns', state: 'Active' },
              { name: 'Scribe', squad: 'X-Men', state: 'Active' },
              { name: 'Reach', squad: 'Avengers', state: 'Idle' },
              { name: 'Dev', squad: 'X-Men', state: 'Active' },
              { name: 'Verifier', squad: 'Green Lanterns', state: 'Active' },
              { name: 'Hunter', squad: 'Avengers', state: 'Active' },
              { name: 'Lookout', squad: 'X-Men', state: 'Idle' },
            ].map(a => (
              <div key={a.name} className="rounded-xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[color:#fff] text-[10px] font-extrabold" style={{ background: 'var(--theme-accent)' }}>
                    {a.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--theme-text)] truncate">{a.name}</div>
                    <div className="text-[10px] text-[var(--theme-text-muted)] truncate">{a.squad}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 self-start ${a.state === 'Active' ? 'text-[var(--ok)] bg-[var(--ok)]/10' : 'text-[var(--theme-text-muted)] bg-[var(--theme-surface-hover)]'}`}>
                  {a.state}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── AUDIT · B1 Gatekeeper feed ────────────────────────────────── */}
        <section data-anchor="audit" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">B1 Gatekeeper · log</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Drift détecté avant qu'il ne parte</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-canvas)] border border-[var(--panel-border)] p-5 font-mono text-[12px] flex flex-col gap-1.5 text-[var(--theme-text-muted)]">
            {[
              { ts: '09:14:02', agent: 'Scout', msg: 'enriched 3 leads · matches ICP · ok' },
              { ts: '09:14:18', agent: 'Scribe', msg: 'drafted recap · awaiting approval' },
              { ts: '09:14:35', agent: 'Reach', msg: 'paused · prospect replied in 38s · handback to A+' },
              { ts: '09:15:01', agent: 'Dev', msg: 'pushed 2 features · sandbox · no prod write' },
              { ts: '09:15:22', agent: 'Gatekeeper', msg: 'caught 1 drift · Reach would have sent 4th email · blocked · ok' },
              { ts: '09:15:48', agent: 'Orchestrator', msg: 'rolled next sprint · Mon 9am standup scheduled' },
            ].map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[var(--theme-text-dim)] shrink-0">{line.ts}</span>
                <span className="text-[var(--theme-accent)] shrink-0">{line.agent.padEnd(13)}</span>
                <span className="text-[var(--theme-text)]">{line.msg}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROOF · one testimonial, four KPIs (compact strip) ────────── */}
        <section data-anchor="proof" className="flex flex-col gap-5">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <p className="text-lg leading-relaxed text-[var(--theme-text)] font-medium">&ldquo;{page.testimonials[0].quote}&rdquo;</p>
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }} />
                <div>
                  <div className="text-sm font-bold text-[var(--theme-text)]">{page.testimonials[0].author}</div>
                  <div className="text-xs text-[var(--theme-text-muted)]">{page.testimonials[0].role} · {page.testimonials[0].company}</div>
                </div>
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

        {/* ── CTA · single, soft ────────────────────────────────────────── */}
        <section data-anchor="cta" className="rounded-3xl px-10 py-14 text-center" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }}>
          <Users className="w-7 h-7 text-[color:#fff] mx-auto mb-3" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[color:#fff] tracking-tight" style={{ fontFamily: 'var(--theme-font-display)' }}>{page.closing.headline}</h2>
          <p className="text-[color:#fff] text-sm mt-2 max-w-xl mx-auto opacity-90">{page.closing.sub}</p>
          <a href="#cta" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:#fff] px-6 py-3 text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ color: 'var(--theme-accent)' }}>
            {page.closing.cta.label} <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        <BackToTop onClick={() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
        <footer className="text-center text-xs text-[var(--theme-text-dim)] pb-2">{page.brand} · {page.domain} · Coach OS · OMK AaaS canon</footer>
      </div>
    </PageChrome>
  );
}
