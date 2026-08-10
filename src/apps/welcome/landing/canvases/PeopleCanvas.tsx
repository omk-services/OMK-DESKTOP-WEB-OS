/** OMK People canvas — horizontal 12-week cohort timeline + seat cards.
 *
 *  Why this layout, not the landing template:
 *  People & Scalabilité is about the journey from 1:1 to 200 seats without
 *  losing the warmth. The proof is the cohort timeline — a horizontal strip
 *  across 12 weeks, with each week showing the system's intent (onboarding
 *  week, mid-cohort check-in, offboarding). Seat cards show real engagement
 *  signals, at-risk flags raise a 2-line brief before the seat churns.
 *  The Coach-to-CEO ladder makes the "warmth at scale" claim tangible.
 *
 *  Sections, in order:
 *    top      — split hero
 *    timeline — 12-week horizontal cohort timeline
 *    seats    — seat cards grid (with at-risk flags)
 *    ladder   — Coach to CEO journey (5 rungs, ladder visual)
 *    proof    — 1 testimonial + stats
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, AlertTriangle, Users, Heart } from 'lucide-react';
import { PageChrome, BackToTop } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function PeopleCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'timeline', label: 'Cohorte' },
    { id: 'seats', label: 'Sièges' },
    { id: 'ladder', label: 'Coach → CEO' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const weeks = [
    { w: 1, label: 'Onboarding', tone: 'var(--theme-accent)', beat: 'Kit envoyé · call de bienvenue planifié' },
    { w: 2, label: 'Onboarding', tone: 'var(--theme-accent)', beat: '1er livrable noté · premier feedback' },
    { w: 3, label: 'Onboarding', tone: 'var(--theme-accent)', beat: 'Premier sprint perso bouclé' },
    { w: 4, label: 'Check-in', tone: 'var(--ok)', beat: 'Mid-cohort · 1:1 30 min · brief engagement' },
    { w: 5, label: 'Cadence', tone: 'var(--theme-text-dim)', beat: 'Pair-à-pair · 2 buddies formés' },
    { w: 6, label: 'Cadence', tone: 'var(--theme-text-dim)', beat: 'Office hours hebdo · Q&A async' },
    { w: 7, label: 'Cadence', tone: 'var(--theme-text-dim)', beat: 'Webinaire blanc · live coach' },
    { w: 8, label: 'Pivot', tone: 'var(--theme-accent-hover)', beat: 'Brief mi-parcours · momentum réinjecté' },
    { w: 9, label: 'Cadence', tone: 'var(--theme-text-dim)', beat: 'Atelier pratique · cas réels' },
    { w: 10, label: 'Check-in', tone: 'var(--ok)', beat: 'Second 1:1 · brief engagement #2' },
    { w: 11, label: 'Closing', tone: 'var(--theme-accent-hover)', beat: 'Offre grad-up présentée · cas alumni' },
    { w: 12, label: 'Offboarding', tone: 'var(--theme-accent)', beat: 'Certificat · alumni · referral ask' },
  ];

  const seats = [
    { name: 'Sarah K.', signal: 92, state: 'engaged', since: 'S3' },
    { name: 'Anya P.', signal: 88, state: 'engaged', since: 'S1' },
    { name: 'Tom Y.', signal: 41, state: 'at-risk', since: 'S5' },
    { name: 'Helena H.', signal: 95, state: 'engaged', since: 'S2' },
    { name: 'Marcus L.', signal: 78, state: 'engaged', since: 'S6' },
    { name: 'Lila P.', signal: 32, state: 'at-risk', since: 'S4' },
    { name: 'Mark R.', signal: 81, state: 'engaged', since: 'S3' },
    { name: 'Joana M.', signal: 87, state: 'engaged', since: 'S1' },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#ec4899"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">

        {/* ── TOP · split hero ─────────────────────────────────────────── */}
        <section data-anchor="top" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {page.hero.headline}
            </h1>
            <p className="text-base text-[var(--theme-text-muted)] leading-relaxed">{page.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#cta" className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">Ton roster, ce matin</span>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3 text-center">
                <div className="text-2xl font-extrabold text-[var(--theme-text)] tabular-nums">180</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">sièges actifs</div>
              </div>
              <div className="rounded-xl bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3 text-center">
                <div className="text-2xl font-extrabold text-[var(--ok)] tabular-nums">94%</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">engagement</div>
              </div>
              <div className="rounded-xl bg-[var(--theme-bg)] border border-[var(--warn)]/30 p-3 text-center">
                <div className="text-2xl font-extrabold text-[var(--warn)] tabular-nums">2</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase">à risque</div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
              <span className="text-[var(--theme-accent)] font-semibold">2 sièges à risque</span> · l'agent t'a déjà écrit un brief de 2 lignes. Tu n'as qu'à dire oui ou non.
            </p>
          </div>
        </section>

        {/* ── TIMELINE · horizontal 12-week ────────────────────────────── */}
        <section data-anchor="timeline" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Cohorte · 12 semaines · automatique</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">L'agent tient le tempo, toi tu tiens le ton</span>
          </div>

          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 overflow-x-auto">
            <div className="grid grid-cols-12 gap-2 min-w-[720px]">
              {weeks.map((wk) => (
                <div key={wk.w} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                    S{wk.w}
                  </div>
                  <div
                    className="rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white text-center"
                    style={{ background: wk.tone }}
                  >
                    {wk.label}
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-muted)] leading-snug min-h-[40px]">{wk.beat}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas déjà un produit de cohorte. Un timeline, c'est ce qui tient un cohort-based business — pas ce qui le lance.
          </div>
        </section>

        {/* ── SEATS · seat cards with at-risk flags ────────────────────── */}
        <section data-anchor="seats" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Les sièges · signaux d'engagement</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Brief 2 lignes · sur les sièges à risque, avant qu'ils churn</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {seats.map(s => (
              <div
                key={s.name}
                className={`rounded-xl border p-3 flex flex-col gap-2 ${
                  s.state === 'at-risk' ? 'border-[var(--warn)]/40 bg-[var(--warn)]/5' : 'border-[var(--panel-border)] bg-[var(--theme-surface)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold" style={{ background: s.state === 'at-risk' ? 'var(--warn)' : 'var(--theme-accent)' }}>
                    {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--theme-text)] truncate">{s.name}</div>
                    <div className="text-[10px] text-[var(--theme-text-dim)]">depuis {s.since}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--theme-surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.signal}%`,
                        background: s.state === 'at-risk' ? 'var(--warn)' : 'var(--ok)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-[var(--theme-text)]">{s.signal}</span>
                </div>
                {s.state === 'at-risk' && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--warn)]/30 p-2">
                    <AlertTriangle className="w-3 h-3 text-[var(--warn)] shrink-0 mt-0.5" />
                    <span className="text-[10px] text-[var(--theme-text)] leading-snug">2 messages non lus · pas de login depuis 9 jours. Suggestion : nudge personnel.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── LADDER · Coach to CEO ────────────────────────────────────── */}
        <section data-anchor="ladder" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Coach → CEO · le même espace de travail</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Ton process grandit, l'interface ne bouge pas</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-6 flex flex-col gap-4">
            {[
              { tier: '$200', label: '1:1, première vente', note: 'Tu fais tout à la main. L\'espace est vide, il t\'attend.' },
              { tier: '$2k MRR', label: '5-10 clients récurrents', note: 'Le Scribe rédige tes recaps. Le Scout te trouve des leads.' },
              { tier: '$8k MRR', label: 'Cohorte pilote 30 sièges', note: 'Le timeline cohorte tourne. Ton premier brief engagement du lundi.' },
              { tier: '$30k MRR', label: 'Studio multi-coach', note: 'Multi-routing, multi-coach. Les briefs s\'empilent sur ton bureau.' },
              { tier: '$200k MRR', label: 'Firme · conformité Forte', note: 'Audit pack 1-click. AI-Act ready. Ton laptop se ferme le vendredi à 18h47.' },
            ].map((rung, i) => (
              <div key={i} className="flex items-stretch gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold" style={{ background: 'var(--theme-accent)' }}>{i + 1}</div>
                  {i < 4 && <div className="w-px flex-1 bg-[var(--panel-border)] mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-accent)] tabular-nums">{rung.tier}</span>
                    <span className="text-sm font-bold text-[var(--theme-text)]">{rung.label}</span>
                  </div>
                  <p className="text-[12px] text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">{rung.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <Heart className="w-6 h-6 text-[var(--theme-accent)]" />
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
          <Users className="w-7 h-7 text-white mx-auto mb-3" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--theme-font-display)' }}>{page.closing.headline}</h2>
          <p className="text-white text-sm mt-2 max-w-xl mx-auto opacity-90">{page.closing.sub}</p>
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
