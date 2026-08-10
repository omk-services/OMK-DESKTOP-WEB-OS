/** OMK Growth canvas — pipeline kanban + reply inbox preview.
 *
 *  Why this layout, not the landing template:
 *  Growth is about volume and velocity. The proof isn't a single testimonial —
 *  it's a pipeline you can read across (Lead → Call → Close) with live counts
 *  and a reply inbox preview. The cadence dial turns the 3-step NO-FOLLOW-UP
 *  from an abstract promise into something you can see. The Monday forecast
 *  card is the artifact a human SDR manager would send, except it's already
 *  drafted by an agent before you wake up.
 *
 *  Sections, in order:
 *    top      — full-width centered hero with a Monday forecast chip
 *    pipeline — 3-column kanban (Lead / Call / Close) with live counts
 *    cadence  — 3-step NO-FOLLOW-UP dial visualization (horizontal)
 *    inbox    — reply inbox preview (split: thread list + selected thread)
 *    forecast — Monday standup email card (full-width)
 *    proof    — 1 testimonial + stats (compact)
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, Mail, MailOpen, Reply, TrendingUp, CalendarClock, Zap, Target } from 'lucide-react';
import { PageChrome, BackToTop, scrollToAnchor } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function GrowthCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'cadence', label: 'Cadence' },
    { id: 'inbox', label: 'Réponses' },
    { id: 'forecast', label: 'Lundi' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const pipeline = {
    lead: [
      { name: 'Anya Chen', co: 'Northstar Coaching', score: 92, note: 'ICP parfait · a ouvert 3x' },
      { name: 'Mark Reeve', co: 'Reeve Labs', score: 88, note: 'Semble chaud · pause 2 jours' },
      { name: 'Lila Patel', co: 'Coach Collective', score: 81, note: 'CEO fondateur · 12 employés' },
    ],
    call: [
      { name: 'Sarah K.', co: 'Lighthouse Practice', score: 95, note: 'RDV jeudi 14h · a payé avant' },
      { name: 'Tom Young', co: 'TY Coaching', score: 87, note: 'Reprogrammé 2x · motif voyage' },
    ],
    close: [
      { name: 'Helena H.', co: 'Helena Coaching Co.', score: 98, note: 'Signature ce matin · 3k MRR' },
      { name: 'Marcus L.', co: 'Lattice Performance', score: 94, note: 'Contrat en relecture · jeudi' },
    ],
  };

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#f59e0b"
      activePageId={activePageId}
      onSelectPage={onSelectPage}
      sections={sections}
      bodyRef={bodyRef}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">

        {/* ── TOP · centered hero + monday forecast chip ──────────────── */}
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
            <span className="text-xs text-[var(--theme-text-muted)]">Le SDR que tu n'auras jamais à manager</span>
          </div>
        </section>

        {/* ── PIPELINE · 3-col kanban ──────────────────────────────────── */}
        <section data-anchor="pipeline" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Pipeline · cette semaine</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">3.4× couverture · 7 deals en mouvement</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['lead', 'call', 'close'] as const).map(col => (
              <div key={col} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                    {col === 'lead' ? 'Lead' : col === 'call' ? 'Call' : 'Close'}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--theme-text)] tabular-nums">{pipeline[col].length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {pipeline[col].map((p, i) => (
                    <div key={i} className="rounded-xl bg-[var(--theme-bg)] border border-[var(--panel-border-subtle)] p-3 flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--theme-text)] truncate">{p.name}</span>
                        <span className="text-[11px] font-bold text-[var(--theme-accent)] tabular-nums shrink-0">{p.score}</span>
                      </div>
                      <span className="text-[11px] text-[var(--theme-text-muted)]">{p.co}</span>
                      <span className="text-[10px] text-[var(--theme-text-dim)] leading-snug">{p.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu vises moins de 5 calls de découverte par mois. Un SDR agent, ça se rentabilise à partir du 6e booked call.
          </div>
        </section>

        {/* ── CADENCE · 3-step dial ────────────────────────────────────── */}
        <section data-anchor="cadence" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">La cadence 3-step NO-FOLLOW-UP</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">3 touchpoints · 9 jours · 0 relance si la 1ère reste muette</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { day: 'J0', title: 'Premier contact', body: 'Personnalisé, ICP-scored. Première impression, pas un template.', gate: 'Aucun envoi sans ta relecture des 20 premiers.' },
                { day: 'J+3', title: 'Pivot de valeur', body: 'Apporte quelque chose de nouveau : cas client, ressource, retour d\'expérience.', gate: 'Conditionnel à zéro réponse.' },
                { day: 'J+9', title: 'Sortie propre', body: 'Si pas de réponse, séquence terminée. Aucun mail de relance caché.', gate: 'Auto-stop sur engagement, sous 90s.' },
              ].map((step, i) => (
                <div key={i} className="rounded-xl border border-[var(--panel-border-subtle)] p-4 flex flex-col gap-2 relative">
                  <span className="absolute -top-3 left-3 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--theme-accent)] text-white text-[11px] font-extrabold shadow-md">{i + 1}</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{step.day}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--theme-text)]">{step.title}</span>
                  <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">{step.body}</p>
                  <p className="text-[10px] text-[var(--theme-text-dim)] italic">{step.gate}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--theme-text-muted)]">
              <Reply className="w-3 h-3 text-[var(--ok)]" />
              Réponse détectée en moins de 90s · reprise humaine instantanée · l'agent s'arrête.
            </div>
          </div>
        </section>

        {/* ── INBOX · reply inbox preview ──────────────────────────────── */}
        <section data-anchor="inbox" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Inbox unifiée · les dernières 24h</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">SMS · mail · DM · en un seul fil</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* List */}
            <div className="lg:col-span-2 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] divide-y divide-[var(--panel-border-subtle)]">
              {[
                { name: 'Helena H.', co: 'Helena Coaching Co.', snippet: 'OK on signe ce matin, peux-tu envoyer le lien…', open: true, ch: 'mail' },
                { name: 'Mark Reeve', co: 'Reeve Labs', snippet: 'Pas dispo cette semaine, on reporte à ?', open: false, ch: 'mail' },
                { name: 'Lila Patel', co: 'Coach Collective', snippet: 'Intéressée. Quel est le prochain step concret ?', open: true, ch: 'dm' },
                { name: 'Sarah K.', co: 'Lighthouse', snippet: 'J\'ai eu le CEO, il dit oui. On booke jeudi.', open: false, ch: 'mail' },
              ].map((m, i) => (
                <div key={i} className={`p-3 flex items-start gap-3 ${i === 0 ? 'bg-[var(--theme-accent-soft)]' : ''}`}>
                  {m.open ? <MailOpen className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" /> : <Mail className="w-4 h-4 text-[var(--theme-text-dim)] shrink-0 mt-0.5" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--theme-text)] truncate">{m.name}</span>
                      <span className="text-[10px] text-[var(--theme-text-dim)] uppercase shrink-0">{m.ch}</span>
                    </div>
                    <div className="text-[11px] text-[var(--theme-text-muted)] truncate">{m.snippet}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Selected thread */}
            <div className="lg:col-span-3 rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[var(--theme-text)]">Helena H. · Helena Coaching Co.</div>
                  <div className="text-[10px] text-[var(--theme-text-dim)]">il y a 6 min · mail · ICP A1</div>
                </div>
                <span className="text-[10px] font-bold text-[var(--ok)] bg-[var(--ok)]/10 rounded-full px-2 py-0.5">chaleureuse</span>
              </div>
              <div className="flex flex-col gap-2 text-sm text-[var(--theme-text)] leading-relaxed">
                <p>OK on signe ce matin. Peux-tu m'envoyer le lien de paiement Stripe ?</p>
                <p>Mon comptable veut la facture avant le 15 — donc avant ce week-end, ce serait parfait.</p>
              </div>
              <div className="mt-2 rounded-xl border border-[var(--panel-border-subtle)] bg-[var(--theme-bg)] p-3 text-[12px] text-[var(--theme-text-muted)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-accent)] mb-1">Brouillon du Scribe · en attente d'approbation</div>
                Helena, voici le lien : [Stripe link]. Pour la facture, je te l'envoie d'ici ce soir 20h — ça te laisse le temps de la passer à ton comptable avant vendredi. On lance l'onboarding lundi 9h ?
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-accent)] text-white px-3 py-1.5 text-xs font-semibold shadow-sm">Approuver &amp; envoyer</button>
                <button className="rounded-full border border-[var(--panel-border)] px-3 py-1.5 text-xs text-[var(--theme-text-muted)]">Éditer</button>
                <span className="text-[10px] text-[var(--theme-text-dim)] ml-auto">7 mots rapportés · « peux-tu m'envoyer le lien »</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORECAST · Monday standup card ───────────────────────────── */}
        <section data-anchor="forecast" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Le mail du lundi · 9h dans ta boîte</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Même format qu'un manager SDR enverrait</span>
          </div>
          <div className="rounded-2xl border border-[var(--panel-border)] p-6" style={{ background: 'linear-gradient(135deg, var(--theme-surface), var(--theme-surface-hover))' }}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <CalendarClock className="w-3 h-3" />
              Lundi 9h · semaine 32
            </div>
            <h3 className="mt-2 text-xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>3 deals à risque de slip cette semaine</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--theme-text-muted)]">
              <li className="flex gap-2"><span className="text-[var(--theme-accent)]">·</span> Sarah K. — Lighthouse Practice — contrat en relecture depuis J+4,建议 un nudge mercredi.</li>
              <li className="flex gap-2"><span className="text-[var(--theme-accent)]">·</span> Tom Y. — TY Coaching — 2 reprogrammations d'affilée, motif voyage.提议 de basculer en async.</li>
              <li className="flex gap-2"><span className="text-[var(--theme-accent)]">·</span> Mark R. — Reeve Labs — ICP élevé, faible engagement email.提议 un switch LinkedIn.</li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-[var(--ok)]" />
              <span className="text-xs text-[var(--theme-text)]">Coverage ratio 3.4× · forecast pondéré $42k ce mois</span>
            </div>
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <Zap className="w-6 h-6 text-[var(--theme-accent)]" />
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
          <Target className="w-7 h-7 text-white mx-auto mb-3" />
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
