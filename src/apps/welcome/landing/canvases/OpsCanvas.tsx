/** OMK Operations canvas — vertical runbook timeline + incident feed.
 *
 *  Why this layout, not the landing template:
 *  Operations is procedural. The proof of an operations cockpit isn't a
 *  testimonial — it's a runbook you can read top-to-bottom. So the canvas
 *  becomes a vertical timeline, each row a checkpointed step, with the
 *  status indicators agents post in real time. Stats live next to each
 *  step (MTTR, retry count), not in a giant strip at the bottom.
 *
 *  Sections, in order:
 *    top      — narrow centered hero (the rhythm of the page is vertical)
 *    timeline — the live runbook (vertical, with checkpoint dots)
 *    stack    — knowledge + runbook library (split cards)
 *    incident — last 7 days, blame-free postmortem feed
 *    proof    — 1 testimonial, 1 stat strip (the operations rhythm, kept tight)
 *    cta      — soft
 */

import { useRef } from 'react';
import { ArrowRight, ClipboardList, AlertTriangle, Clock, BookOpen, GitBranch, Bell } from 'lucide-react';
import { PageChrome, BackToTop, scrollToAnchor } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function OpsCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'timeline', label: 'Runbook' },
    { id: 'stack', label: 'Bibliothèque' },
    { id: 'incident', label: 'Incidents' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const steps = [
    { t: '09:00', label: 'Trigger', detail: 'Une lead ouvre l\'email · le Scout capte l\'engage', state: 'done', ms: '1.2s' },
    { t: '09:00:01', label: 'Cite', detail: 'Le Scribe tire 3 sources du vault, cite les passages', state: 'done', ms: '0.4s' },
    { t: '09:00:02', label: 'Draft', detail: 'Brouillon prêt · en attente d\'approbation toi', state: 'hold', ms: '—' },
    { t: '09:01:18', label: 'Approve', detail: 'Tu approuves d\'un swipe · envoi programmé', state: 'done', ms: '76s' },
    { t: '09:01:19', label: 'Send', detail: 'Parti · suivi conditionnel sur réponse', state: 'done', ms: '0.1s' },
    { t: '14:23', label: 'Reply', detail: 'Prospect répond · séquence s\'arrête · reprise humaine', state: 'done', ms: '38s' },
    { t: '14:24', label: 'Handback', detail: 'Tu prends la main · contexte dans la fiche', state: 'live', ms: '—' },
  ];

  const incidents = [
    { day: 'Mar', what: 'Paiement récurrent en échec sur 3 sièges', action: 'Retry 3× · re-engage 2 / write-off 1', mttr: '4 min' },
    { day: 'Lun', what: 'Webhook Notion stale · 12 docs orphelins', action: 'Re-index · alerte diffusion · postmortem écrit', mttr: '11 min' },
    { day: 'Sam', what: 'SDR agent aurait envoyé un 4e follow-up', action: 'B1 l\'a bloqué · tu approuves l\'exception', mttr: '6 min' },
    { day: 'Ven', what: 'Tentative d\'envoi vers adresse en hard bounce', action: 'Shield a coupé · 0 message parti', mttr: 'instant' },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#0ea5e9"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-12 flex flex-col gap-14">

        {/* ── TOP · narrow centered hero ───────────────────────────────── */}
        <section data-anchor="top" className="text-center flex flex-col items-center gap-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)] max-w-3xl" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {page.hero.headline}
          </h1>
          <p className="text-base text-[var(--theme-text-muted)] leading-relaxed max-w-2xl">{page.hero.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button type="button" data-cta="hero" onClick={() => scrollToAnchor(bodyRef.current, 'cta')} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
              {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--theme-text-muted)]">Quand ton runbook te réveille, c'est qu'il est trop tard. Le nôtre te prévient.</span>
          </div>
        </section>

        {/* ── TIMELINE · vertical runbook ──────────────────────────────── */}
        <section data-anchor="timeline" className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Runbook en cours · 14:24</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ok)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
              Live · toi seul peux approuver
            </span>
          </div>

          <div className="relative pl-8">
            {/* Vertical rail */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-[var(--panel-border)]" />
            <div className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <span className={`absolute -left-[22px] top-3 w-3 h-3 rounded-full border-2 ${
                    s.state === 'done' ? 'bg-[var(--ok)] border-[var(--ok)]'
                    : s.state === 'hold' ? 'bg-[var(--theme-surface)] border-[var(--warn)]'
                    : 'bg-[var(--theme-accent)] border-[var(--theme-accent)] animate-pulse'
                  }`} />
                  <div className={`rounded-xl border p-3 ${
                    s.state === 'live' ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]'
                    : 'border-[var(--panel-border)] bg-[var(--theme-surface)]'
                  }`}>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                      <Clock className="w-3 h-3" />
                      {s.t}
                      <span className="text-[var(--theme-accent)]">·</span>
                      <span>{s.label}</span>
                      <span className="ml-auto text-[var(--theme-text-muted)]">{s.ms}</span>
                    </div>
                    <div className="mt-1 text-sm text-[var(--theme-text)] leading-relaxed">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si ton métier tient dans 3 Notion docs que personne ne lit. Un runbook, c'est un process déjà rodé qu'on automatise — pas un process qu'on invente.
          </div>
        </section>

        {/* ── STACK · knowledge + runbook library ──────────────────────── */}
        <section data-anchor="stack" className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Bibliothèque</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Tes sources, citées à chaque réponse</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[var(--theme-accent)]">
                <BookOpen className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Knowledge base</span>
              </div>
              <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">Drive · Notion · Looms · indexés une fois, cités à chaque réponse. Quand un doc devient obsolète, on te prévient.</p>
              <div className="flex items-center gap-3 text-[11px] text-[var(--theme-text-muted)]">
                <span>1 247 sources</span>
                <span>·</span>
                <span>3 alertes ce mois</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[var(--theme-accent)]">
                <GitBranch className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Runbooks</span>
              </div>
              <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">Scripts step-by-step que tes agents exécutent. Checkpoint + kill switch + status Slack par run.</p>
              <div className="flex items-center gap-3 text-[11px] text-[var(--theme-text-muted)]">
                <span>62 runbooks actifs</span>
                <span>·</span>
                <span>0 perdu en scrollback</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── INCIDENT · blame-free feed ───────────────────────────────── */}
        <section data-anchor="incident" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">7 derniers jours · sans blâme</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">MTTR médian · 6 min</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] divide-y divide-[var(--panel-border-subtle)]">
            {incidents.map((inc, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <Bell className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">{inc.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--theme-text)]">{inc.what}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-0.5">{inc.action}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[var(--theme-text)] tabular-nums">{inc.mttr}</div>
                  <div className="text-[10px] text-[var(--theme-text-dim)] uppercase tracking-wider">MTTR</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROOF · 1 testimonial, stats as inline chips ─────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-5">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <ClipboardList className="w-6 h-6 text-[var(--theme-accent)]" />
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
          <AlertTriangle className="w-7 h-7 text-white mx-auto mb-3" />
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
