/** OMK Finance canvas — ledger table + billing schedule + ROI numbers.
 *
 *  Why this layout, not the landing template:
 *  Finance is the most data-dense of the 8 domaines. The proof isn't a
 *  testimonial — it's a ledger you can scan, a billing schedule that drops
 *  on the same day each month, and ROI numbers you can read at a glance.
 *  So the canvas is a flat, dense, financial-feeling surface: a ledger table
 *  on top, a billing schedule underneath, then 4 oversized KPIs (the only
 *  place large numbers earn their keep). The invoice mock is the artifact
 *  you'd actually send — not a pricing card.
 *
 *  Sections, in order:
 *    top      — split hero (copy left, mini-stats right)
 *    ledger   — table of retainers (real-feeling rows)
 *    billing  — billing schedule (calendar strip)
 *    roi      — 4 oversized KPIs
 *    invoice  — invoice mock
 *    proof    — 1 testimonial + compact stats
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, Receipt, Banknote, TrendingUp, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PageChrome, BackToTop, scrollToAnchor } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function FinanceCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'ledger', label: 'Grand livre' },
    { id: 'billing', label: 'Facturation' },
    { id: 'roi', label: 'ROI' },
    { id: 'invoice', label: 'Facture' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const ledger = [
    { client: 'Helena Coaching Co.', tier: '$1k/mo', since: 'Mar 24', status: 'ok', next: 'Sep 1' },
    { client: 'Lattice Performance', tier: '$1k/mo', since: 'Jan 24', status: 'ok', next: 'Sep 1' },
    { client: 'Lighthouse Practice', tier: '$2.5k/mo', since: 'Mai 24', status: 'ok', next: 'Sep 1' },
    { client: 'Forte Labs', tier: '$8k/mo', since: 'Feb 24', status: 'ok', next: 'Sep 1' },
    { client: 'Two Chairs', tier: '$4k/mo', since: 'Jun 24', status: 'retry', next: 'Sep 4' },
    { client: 'TY Coaching', tier: '$1k/mo', since: 'Jul 24', status: 'ok', next: 'Sep 1' },
    { client: 'Helena Coaching Co.', tier: '$1k/mo (2e siège)', since: 'Aug 24', status: 'pending', next: 'Sep 1' },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#10b981"
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
              <button type="button" data-cta="hero" onClick={() => scrollToAnchor(bodyRef.current, 'cta')} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { value: '14j', label: 'DSO (vs 41j avant)', tone: 'var(--ok)' },
              { value: '96%', label: 'encaissé à l\'heure', tone: 'var(--ok)' },
              { value: '$0', label: 'frais Stripe cachés', tone: 'var(--theme-accent)' },
              { value: '4.7×', label: 'lisibilité ROI', tone: 'var(--theme-accent)' },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-4 flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)', color: k.tone }}>{k.value}</div>
                <div className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider leading-tight">{k.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LEDGER · table ──────────────────────────────────────────── */}
        <section data-anchor="ledger" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Grand livre · ce mois</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">7 retainers actifs · $18.5k MRR · USD only</span>
          </div>

          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[var(--theme-canvas)] border-b border-[var(--panel-border)] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
              <span className="col-span-5">Client</span>
              <span className="col-span-2">Tier</span>
              <span className="col-span-2">Depuis</span>
              <span className="col-span-1 text-center">Statut</span>
              <span className="col-span-2 text-right">Prochain</span>
            </div>
            {ledger.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[var(--panel-border-subtle)] last:border-0 text-sm">
                <span className="col-span-5 text-[var(--theme-text)] font-semibold truncate">{row.client}</span>
                <span className="col-span-2 text-[var(--theme-text-muted)] tabular-nums">{row.tier}</span>
                <span className="col-span-2 text-[var(--theme-text-muted)]">{row.since}</span>
                <span className="col-span-1 flex justify-center">
                  {row.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />}
                  {row.status === 'retry' && <Clock className="w-4 h-4 text-[var(--warn)]" />}
                  {row.status === 'pending' && <AlertCircle className="w-4 h-4 text-[var(--theme-accent)]" />}
                </span>
                <span className="col-span-2 text-right text-[var(--theme-text)] tabular-nums">{row.next}</span>
              </div>
            ))}
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas encore 10 retainers. Le ledger automatisé vaut pour la routine — pas pour 3 lignes copiées à la main.
          </div>
        </section>

        {/* ── BILLING · schedule ──────────────────────────────────────── */}
        <section data-anchor="billing" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Facturation $1k/mo · calendrier</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Même jour chaque mois · retry 3× sur 5j · 0 relance manuelle</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5">
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
              {Array.from({ length: 14 }).map((_, i) => {
                const day = i + 18;
                const isPayDay = day === 1;
                const isRetry = day === 2 || day === 3 || day === 4;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--panel-border-subtle)] bg-[var(--theme-bg)] min-h-[60px]">
                    <span className="text-[10px] font-bold text-[var(--theme-text-dim)]">{day}</span>
                    {isPayDay && (
                      <span className="w-2 h-2 rounded-full bg-[var(--ok)]" title="Pay day" />
                    )}
                    {isRetry && (
                      <span className="w-2 h-2 rounded-full bg-[var(--warn)]" title="Retry" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[var(--theme-text-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--ok)]" />Pay day</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--warn)]" />Retry auto</span>
              <span className="ml-auto">Prochaine facture : <span className="text-[var(--theme-text)] font-semibold">1 sept · $18.5k attendu</span></span>
            </div>
          </div>
        </section>

        {/* ── ROI · 4 oversized KPIs ───────────────────────────────────── */}
        <section data-anchor="roi" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">ROI · ce que ton heure de coach a rapporté</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Chaque dollar de temps tagué à un outcome client</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { value: '$2,847', label: 'par heure de coach taguée', sub: '+ 22% YoY' },
              { value: '4.7×', label: 'multiplicateur ROI cohort', sub: 'médiane Q3' },
              { value: '14j', label: 'DSO consolidé', sub: 'vs 41j secteur' },
              { value: '$212k', label: 'ARR tracké ce trimestre', sub: '116 retainers' },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-1">
                <TrendingUp className="w-4 h-4 text-[var(--theme-accent)]" />
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>{k.value}</div>
                <div className="text-[12px] text-[var(--theme-text-muted)] leading-snug">{k.label}</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase tracking-wider">{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── INVOICE · mock ──────────────────────────────────────────── */}
        <section data-anchor="invoice" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">La facture · telle qu'elle part</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Générée le 1er · envoyée le 1er · encaissée le 1er</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] overflow-hidden max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--theme-accent)' }}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--theme-text)]">Invoice #INV-2026-09-001</div>
                  <div className="text-[10px] text-[var(--theme-text-dim)]">Émise le 1er sept 2026 · payable en 14j</div>
                </div>
              </div>
              <span className="text-2xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>$1,000.00</span>
            </div>
            <div className="grid grid-cols-2 gap-6 px-6 py-4 border-b border-[var(--panel-border-subtle)]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">De</div>
                <div className="text-sm text-[var(--theme-text)] mt-1">Coach OS · OMK Services</div>
                <div className="text-xs text-[var(--theme-text-muted)]">US-hosted · CCPA + Colorado AI Act</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">À</div>
                <div className="text-sm text-[var(--theme-text)] mt-1">Helena Coaching Co.</div>
                <div className="text-xs text-[var(--theme-text-muted)]">Helena H. · billing@helena-coaching.co</div>
              </div>
            </div>
            <div className="px-6 py-3 border-b border-[var(--panel-border-subtle)] text-sm">
              <div className="flex justify-between text-[var(--theme-text)]">
                <span>Retainer · septembre 2026</span>
                <span className="tabular-nums">$1,000.00</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-[10px] text-[var(--theme-text-dim)]">Carte •••• 4242 · auto-debit · succès attendu J+0</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ok)]">
                <CheckCircle2 className="w-3 h-3" />
                Prête à partir
              </span>
            </div>
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <Banknote className="w-6 h-6 text-[var(--theme-accent)]" />
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
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section data-anchor="cta" className="rounded-3xl px-10 py-14 text-center" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }}>
          <Receipt className="w-7 h-7 text-white mx-auto mb-3" />
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
