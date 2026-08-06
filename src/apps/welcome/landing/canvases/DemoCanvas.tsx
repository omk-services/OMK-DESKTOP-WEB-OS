/** OMK Coach Demo canvas — 4-question quiz overlay + citadel preview.
 *
 *  Why this layout, not the landing template:
 *  The Demo page has a unique purpose: it's the lowest-friction door. No
 *  pricing tiers, no features bulleted, no testimonials to scroll past. The
 *  page IS the demo: a 4-question quiz that, when you submit, opens 4
 *  floating windows over the citadel. So the canvas previews exactly that
 *  moment — the citadel background, four windows hovering on top, the quiz
 *  panel asking the first question. No testimonials, no stats — the demo
 *  itself is the proof.
 *
 *  Sections, in order:
 *    top      — centered hero with the demo's promise (4 windows in 4 min)
 *    quiz     — the 4-question panel (one per canvas section)
 *    citadel  — citadel background with 4 floating window previews
 *    rules    — 4 rules of the demo (no PII, no signup, etc.)
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, Play, Sparkles, MessageSquare, ShieldCheck, Brain, Lock } from 'lucide-react';
import { PageChrome, BackToTop } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function DemoCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'quiz', label: '4 questions' },
    { id: 'citadel', label: 'Citadelle' },
    { id: 'rules', label: 'Règles' },
    { id: 'cta', label: 'Go' },
  ];

  const questions = [
    { n: 1, q: 'Combien de clients payants as-tu signé ?', note: 'On cale le ton — pas un interrogatoire.' },
    { n: 2, q: 'Qu\'est-ce qui te prend le plus de temps hors des calls ?', note: 'Pour savoir quel agent t\'économiserait le plus.' },
    { n: 3, q: 'Tu utilises déjà des outils (Notion, Drive, Slack) ?', note: 'On voit ce qu\'on branche, ce qu\'on ne branche pas.' },
    { n: 4, q: 'Si tu avais ton vendredi soir à toi, tu ferais quoi ?', note: 'La réponse qu\'on n\'oublie pas.' },
  ];

  const windows = [
    { label: 'Vault', tone: 'var(--theme-accent)', top: '10%', left: '6%', rot: -3 },
    { label: 'Compliance', tone: 'var(--theme-accent-hover)', top: '14%', right: '8%', rot: 2 },
    { label: 'Audit log', tone: 'var(--theme-accent)', bottom: '14%', left: '12%', rot: 2 },
    { label: 'Agents', tone: 'var(--theme-accent-hover)', bottom: '10%', right: '10%', rot: -3 },
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

        {/* ── TOP · centered hero with the demo promise ──────────────── */}
        <section data-anchor="top" className="text-center flex flex-col items-center gap-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)] max-w-3xl" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {page.hero.headline}
          </h1>
          <p className="text-base text-[var(--theme-text-muted)] leading-relaxed max-w-2xl">{page.hero.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#cta" className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-[color:#fff] px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
              <Play className="w-4 h-4 fill-current" /> {page.hero.primaryCta.label}
            </a>
            <span className="text-xs text-[var(--theme-text-muted)]">4 min · 0 signup · 0 PII</span>
          </div>
        </section>

        {/* ── QUIZ · 4-question panel ─────────────────────────────────── */}
        <section data-anchor="quiz" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Les 4 questions · pas un quiz de maths</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">On n'enregistre rien · on ne te maille pas</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] divide-y divide-[var(--panel-border-subtle)]">
            {questions.map(q => (
              <div key={q.n} className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[color:#fff] text-sm font-extrabold shrink-0" style={{ background: 'var(--theme-accent)' }}>
                  {q.n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[var(--theme-text)]">{q.q}</p>
                  <p className="text-xs text-[var(--theme-text-muted)] mt-1 italic">{q.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CITADEL · 4 floating windows preview ────────────────────── */}
        <section data-anchor="citadel" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">La citadelle · après ton submit</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">4 fenêtres flottantes, repositionnables, redimensionnables</span>
          </div>

          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--panel-border)]" style={{ background: 'linear-gradient(135deg, var(--theme-canvas), var(--theme-bg))' }}>
            {/* Faint band stripes — abstract citadel */}
            <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 16px, var(--theme-accent-soft) 16px 17px)' }} />

            {/* The 4 floating windows, positioned absolute */}
            {windows.map((w, i) => (
              <div
                key={i}
                className="absolute rounded-xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-xl p-3 w-44 flex flex-col gap-2"
                style={{
                  top: w.top, left: w.left, right: w.right, bottom: w.bottom,
                  transform: `rotate(${w.rot}deg)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: w.tone }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text)]">{w.label}</span>
                </div>
                <div className="h-1.5 rounded bg-[var(--theme-surface-hover)]" />
                <div className="h-1.5 rounded bg-[var(--theme-surface-hover)] w-3/4" />
                <div className="h-1.5 rounded bg-[var(--theme-surface-hover)] w-1/2" />
              </div>
            ))}

            {/* Center pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full px-5 py-2.5 bg-[var(--theme-accent)] text-[color:#fff] text-xs font-bold shadow-2xl">
                Coach OS · en cours
              </div>
            </div>
          </div>
        </section>

        {/* ── RULES · 4 rules of the demo ─────────────────────────────── */}
        <section data-anchor="rules" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Les 4 règles du demo</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Ce que tu n'auras JAMAIS à faire</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { Icon: Lock, title: '0 PII collectée', body: 'Aucune adresse, aucun numéro, aucune carte. Jamais.' },
              { Icon: Sparkles, title: '0 signup', body: 'Pas de formulaire, pas de magic link, pas de vérification email.' },
              { Icon: MessageSquare, title: '0 call de 30 min', body: 'Tu fais le demo toi-même. Le call, c\'est après — si tu veux.' },
              { Icon: ShieldCheck, title: '0 data dans le training', body: 'Tes inputs restent synthétiques, isolés, jamais réutilisés.' },
            ].map((r, i) => (
              <div key={i} className="rounded-xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[color:#fff] shrink-0" style={{ background: 'var(--theme-accent)' }}>
                  <r.Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--theme-text)]">{r.title}</div>
                  <p className="text-xs text-[var(--theme-text-muted)] mt-0.5 leading-snug">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA · simple, soft ───────────────────────────────────────── */}
        <section data-anchor="cta" className="rounded-3xl px-10 py-14 text-center" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }}>
          <Brain className="w-7 h-7 text-[color:#fff] mx-auto mb-3" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[color:#fff] tracking-tight" style={{ fontFamily: 'var(--theme-font-display)' }}>{page.closing.headline}</h2>
          <p className="text-[color:#fff] text-sm mt-2 max-w-xl mx-auto opacity-90">{page.closing.sub}</p>
          <a href="#cta" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:#fff] px-6 py-3 text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ color: 'var(--theme-accent)' }}>
            <Play className="w-4 h-4 fill-current" />
            {page.closing.cta.label} <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[color:#fff] text-[11px] mt-4 opacity-75">Si ça ne parle pas à ton vendredi soir, tu fermes l'onglet. Personne ne te relance.</p>
        </section>

        <BackToTop onClick={() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
        <footer className="text-center text-xs text-[var(--theme-text-dim)] pb-2">{page.brand} · {page.domain} · Coach OS · OMK AaaS canon</footer>
      </div>
    </PageChrome>
  );
}
