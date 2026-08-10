/** OMK Cognition canvas — warehouse tree (left) + session cards (right).
 *
 *  Why this layout, not the landing template:
 *  Cognition is about turning sessions into a queryable asset. The proof is
 *  the warehouse itself — its folder structure, its extraction, its citation
 *  discipline. So the canvas is a 2-column IDE-style split: folder tree on
 *  the left (the warehouse), session cards on the right (the IP, extracted
 *  with citations). No giant testimonial block. The Sales Second Brain
 *  surfaces as a slim, ongoing citation log — it learns every call.
 *
 *  Sections, in order:
 *    top       — split hero (copy left, mini-warehouse right)
 *    warehouse — full IDE-style split (tree + session cards)
 *    second    — Sales Second Brain pattern log (compact)
 *    citations — citation log feed (small terminal)
 *    proof     — 1 testimonial + stats
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, Folder, FolderOpen, FileText, Brain, Quote, Hash, Sparkles, BrainCircuit } from 'lucide-react';
import { PageChrome, BackToTop, scrollToAnchor } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function CognitionCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'warehouse', label: 'Entrepôt' },
    { id: 'second', label: '2nd Brain' },
    { id: 'citations', label: 'Citations' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const tree = [
    {
      folder: 'Sessions 2026-Q3', open: true,
      files: [
        { name: '2026-08-04_helena-h.md', tag: 'framework' },
        { name: '2026-08-03_marcus-l.md', tag: 'objection' },
        { name: '2026-08-01_sarah-k.md', tag: 'case-study' },
      ],
    },
    { folder: 'Framework library', open: false, files: [] },
    { folder: 'Objections closes', open: false, files: [] },
    { folder: 'Case studies', open: false, files: [] },
    { folder: 'ICP patterns', open: false, files: [] },
  ];

  const sessions = [
    {
      title: 'Helena H. · session 12 · "le pivot des 6 semaines"',
      tag: 'framework',
      excerpt: '« Le déclic, c\'est quand elle a compris qu\'elle pouvait facturer $2k sans 10 ans d\'expérience. »',
      frameworks: ['Pricing par paliers', 'Objection "pas assez senior"', 'Discovery des croyances limitantes'],
      citations: 3,
    },
    {
      title: 'Marcus L. · session 8 · "objection conjoint"',
      tag: 'objection',
      excerpt: '« Il hésitait à signer à cause de sa femme. On a travaillé le "qui d\'autre dans la décision" sans le braquer. »',
      frameworks: ['Décision multi-acteurs', 'Reformulation du conjoint', 'Lettre de cadrage'],
      citations: 2,
    },
    {
      title: 'Sarah K. · session 22 · "scale $200 → $200k"',
      tag: 'case-study',
      excerpt: '« Son premier client à $8k est arrivé sans qu\'elle change de canal — juste de posture. »',
      frameworks: ['Posture vs pipeline', 'Pricing anchoring', 'Cas client testimonial'],
      citations: 4,
    },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#8b5cf6"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">

        {/* ── TOP · split hero ─────────────────────────────────────────── */}
        <section data-anchor="top" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{page.hero.eyebrow}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {page.hero.headline}
            </h1>
            <p className="text-base text-[var(--theme-text-muted)] leading-relaxed">{page.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" data-cta="hero" onClick={() => scrollToAnchor(bodyRef.current, 'cta')} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">L'entrepôt, ce matin</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ok)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                Synchro live
              </span>
            </div>
            <div className="rounded-xl bg-[var(--theme-canvas)] border border-[var(--panel-border)] p-4 font-mono text-[11px] leading-relaxed text-[var(--theme-text-muted)]">
              <div><span className="text-[var(--theme-accent)]">1 247</span> sources indexées</div>
              <div><span className="text-[var(--theme-accent)]">3.8k</span> sessions taggées</div>
              <div><span className="text-[var(--theme-accent)]">92</span> frameworks extraits</div>
              <div><span className="text-[var(--theme-accent)]">0</span> citation hallucinée (vérifié à l'audit)</div>
            </div>
          </div>
        </section>

        {/* ── WAREHOUSE · IDE split ────────────────────────────────────── */}
        <section data-anchor="warehouse" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">L'entrepôt · la session devient asset</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Tree + cards · 1.2k sources · 92 frameworks</span>
          </div>

          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] overflow-hidden grid grid-cols-1 lg:grid-cols-5">
            {/* Folder tree (left) */}
            <div className="lg:col-span-2 border-r border-[var(--panel-border)] p-4 flex flex-col gap-1 bg-[var(--theme-canvas)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)] mb-2">/ warehouse</span>
              {tree.map((node, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-semibold text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)] cursor-pointer">
                    {node.open ? <FolderOpen className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> : <Folder className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />}
                    {node.folder}
                    <span className="ml-auto text-[10px] text-[var(--theme-text-dim)]">{node.files.length || '—'}</span>
                  </div>
                  {node.open && node.files.length > 0 && (
                    <div className="ml-5 flex flex-col gap-0.5">
                      {node.files.map((f, j) => (
                        <div key={j} className={`flex items-center gap-2 rounded-md px-2 py-1 text-[11px] ${j === 0 ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] font-semibold' : 'text-[var(--theme-text-muted)]'}`}>
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{f.name}</span>
                          <span className="ml-auto text-[9px] text-[var(--theme-accent)] uppercase tracking-wider">{f.tag}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Session cards (right) */}
            <div className="lg:col-span-3 p-4 flex flex-col gap-3">
              {sessions.map((s, i) => (
                <div key={i} className="rounded-xl border border-[var(--panel-border-subtle)] bg-[var(--theme-bg)] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
                    <span className="text-sm font-bold text-[var(--theme-text)] truncate">{s.title}</span>
                  </div>
                  <p className="text-[12px] text-[var(--theme-text-muted)] leading-relaxed italic">{s.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.frameworks.map(f => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] px-2 py-0.5 text-[10px] font-semibold">
                        <Hash className="w-2.5 h-2.5" />{f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--theme-text-dim)]">
                    <span>{s.citations} citations vérifiées</span>
                    <span>extrait · tagué · indexé</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas déjà un fonds de sessions. L'IP extraction transforme ce que tu as déjà dit, pas ce que tu n'as pas encore inventé.
          </div>
        </section>

        {/* ── SECOND BRAIN · pattern log ──────────────────────────────── */}
        <section data-anchor="second" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Sales Second Brain · il apprend à chaque call</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Patterns que tu n'avais pas vus toi-même</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[var(--theme-accent)]">
              <Brain className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">3 patterns repérés cette semaine</span>
            </div>
            {[
              { p: '« Pas le temps »', m: 'apparaît dans 4 objections sur 7 · taux de conversion après pivot : 71%' },
              { p: '« Mon conjoint décide »', m: 'cas multi-acteurs · lettre de cadrage corrige 6/8 fois' },
              { p: '« Trop tôt pour investir »', m: 'souvent levé par un cas client du même secteur · +28% de close' },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3">
                <Sparkles className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--theme-text)]">{p.p}</div>
                  <div className="text-[11px] text-[var(--theme-text-muted)]">{p.m}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CITATIONS · log feed ─────────────────────────────────────── */}
        <section data-anchor="citations" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Citation log · hier</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Chaque réponse pointe sa source</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-canvas)] border border-[var(--panel-border)] p-4 font-mono text-[11px] flex flex-col gap-1 text-[var(--theme-text-muted)]">
            {[
              { q: '"comment je facture $2k sans 10 ans d\'XP"', src: 'sessions/2026-08-04_helena-h.md#pricing-paliers', ok: true },
              { q: '"objection conjoint"', src: 'sessions/2026-08-03_marcus-l.md#multi-acteurs', ok: true },
              { q: '"comment closer en discovery"', src: 'framework-library/closing-in-discovery.md#croyances-limitantes', ok: true },
              { q: '"tarif premium"', src: 'warehouse empty · agent says so, no fabrication', ok: 'warn' as const },
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-baseline">
                <span className="text-[var(--theme-text-dim)] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[var(--theme-text)] shrink-0">Q:</span>
                <span className="truncate flex-1">{line.q}</span>
                <span className="text-[var(--theme-text-dim)]">→</span>
                <span className={line.ok === 'warn' ? 'text-[var(--warn)] truncate' : 'text-[var(--ok)] truncate'}>{line.src}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <BrainCircuit className="w-6 h-6 text-[var(--theme-accent)]" />
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
          <BrainCircuit className="w-7 h-7 text-white mx-auto mb-3" />
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
