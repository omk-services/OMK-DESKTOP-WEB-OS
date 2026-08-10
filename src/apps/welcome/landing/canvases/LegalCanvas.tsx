/** OMK Legal canvas — NDA pipeline + compliance matrix + shield log + audit pack.
 *
 *  Why this layout, not the landing template:
 *  Legal's proof is regulatory, not aspirational. A coach hiring agents cares
 *  about: NDAs on file before session 1, regulator-grade audit pack on
 *  demand, PII redacted before egress, CCPA + Colorado AI Act posture on
 *  autopilot. So the canvas IS the compliance surface — a 3-step NDA flow,
 *  a checklist matrix of regulatory obligations, a shield log feed of every
 *  redaction event, and a regulator-ready audit pack preview at the end.
 *  No testimonials at the top — the artefact is the trust.
 *
 *  Sections, in order:
 *    top      — split hero (copy left, 4 reg badges right)
 *    nda      — 3-step horizontal NDA pipeline
 *    matrix   — compliance matrix checklist (status grid)
 *    shield   — shield log feed (per-egress redaction events)
 *    pack     — audit pack preview (collapsed file tree)
 *    proof    — 1 testimonial + stats
 *    cta
 */

import { useRef } from 'react';
import { ArrowRight, ShieldCheck, FileSignature, Lock, ClipboardCheck, FileText, FolderOpen, CheckCircle2, Clock, PenLine } from 'lucide-react';
import { PageChrome, BackToTop } from '../PageChrome';
import type { LandingPage } from '../pageSchema';

export function LegalCanvas({ page, activePageId, onSelectPage }: {
  page: LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = [
    { id: 'top', label: 'Top' },
    { id: 'nda', label: 'NDA' },
    { id: 'matrix', label: 'Conformité' },
    { id: 'shield', label: 'Bouclier' },
    { id: 'pack', label: 'Audit pack' },
    { id: 'proof', label: 'Preuve' },
    { id: 'cta', label: 'Go' },
  ];

  const ndaSteps = [
    { num: 1, title: 'Génération', body: 'Aquaman tire le template, le remplit avec le contexte client, le pousse pour signature.', tone: 'var(--theme-accent)' },
    { num: 2, title: 'Signature', body: 'E-signature intégrée · rappel auto J+2 si non signé · pas de session 1 sans accord.', tone: 'var(--theme-accent-hover)' },
    { num: 3, title: 'Classement', body: 'NDA rangé dans le legal vault par client · exportable · auditable · 0 Slack ping.', tone: 'var(--theme-accent)' },
  ];

  const matrix = [
    { req: 'CCPA · right-to-know', deadline: '14j', state: 'ok' },
    { req: 'CCPA · right-to-delete', deadline: '30j', state: 'ok' },
    { req: 'Colorado AI Act · disclosure', deadline: 'permanent', state: 'ok' },
    { req: 'AI-Act 2026-08-02 · audit', deadline: '2026-08-02', state: 'ok' },
    { req: 'NDA on file avant session 1', deadline: 'par client', state: 'ok' },
    { req: 'PII redaction at egress', deadline: 'par message', state: 'ok' },
    { req: 'Subpoena response pack', deadline: 'sous 24h', state: 'drafting' },
    { req: 'DPA · modèle processor', deadline: 'à signer', state: 'drafting' },
  ];

  return (
    <PageChrome
      brand={page.brand}
      domain={page.domain}
      accent="#a855f7"
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
              <a href="#cta" className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all">
                {page.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </a>
              <span className="text-xs text-[var(--theme-text-muted)]">Le régulateur appelle le mardi · tu as le pack dans la boîte le mercredi matin</span>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { Icon: ShieldCheck, value: '0', label: 'PII leakage en 24 mois' },
              { Icon: FileSignature, value: '100%', label: 'NDA avant session 1' },
              { Icon: ClipboardCheck, value: '1-click', label: 'audit pack export' },
              { Icon: Lock, value: 'AI-Act', label: '2026-08-02 ready' },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-4 flex flex-col gap-2">
                <b.Icon className="w-5 h-5 text-[var(--theme-accent)]" />
                <div className="text-2xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>{b.value}</div>
                <div className="text-[10px] text-[var(--theme-text-dim)] uppercase tracking-wider leading-tight">{b.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── NDA · 3-step horizontal ──────────────────────────────────── */}
        <section data-anchor="nda" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">NDA · 3 étapes, zéro relance</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Le NDA est généré avant le premier call, pas après</span>
          </div>

          <div className="relative rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px bg-[var(--panel-border)]" aria-hidden />
              {ndaSteps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-extrabold shadow-md mb-3" style={{ background: s.tone }}>
                    {s.num}
                  </div>
                  <span className="text-sm font-bold text-[var(--theme-text)]">{s.title}</span>
                  <p className="text-xs text-[var(--theme-text-muted)] mt-1 leading-relaxed max-w-[220px]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pushback */}
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)] mr-2">Ce n'est pas pour toi</span>
            si tu n'as pas de clients corporate qui posent la question. La conformité est une assurance — pas un argumentaire pour la première vente.
          </div>
        </section>

        {/* ── MATRIX · compliance checklist ────────────────────────────── */}
        <section data-anchor="matrix" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Matrice de conformité · le statut à l'instant T</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">8 obligations · 6 ok · 2 en draft · mis à jour live</span>
          </div>

          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] divide-y divide-[var(--panel-border-subtle)]">
            {matrix.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-5 py-3 items-center">
                <div className="col-span-1">
                  {row.state === 'ok' ? <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" /> : <Clock className="w-4 h-4 text-[var(--warn)]" />}
                </div>
                <span className="col-span-7 text-sm text-[var(--theme-text)] font-medium">{row.req}</span>
                <span className="col-span-2 text-xs text-[var(--theme-text-muted)]">{row.deadline}</span>
                <span className="col-span-2 text-right">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    row.state === 'ok' ? 'text-[var(--ok)] bg-[var(--ok)]/10' : 'text-[var(--warn)] bg-[var(--warn)]/10'
                  }`}>
                    {row.state === 'ok' ? 'ok' : 'draft'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHIELD · redaction log ───────────────────────────────────── */}
        <section data-anchor="shield" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Bouclier Zero-PII · les 24 dernières egress</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">PII stoppée au champ · avant qu'elle ne quitte le vault</span>
          </div>
          <div className="rounded-2xl bg-[var(--theme-canvas)] border border-[var(--panel-border)] p-4 font-mono text-[11px] flex flex-col gap-1 text-[var(--theme-text-muted)]">
            {[
              { ts: '14:18', what: 'egress → openai.com', redacted: 'SSN, carte, adresse', status: 'blocked' },
              { ts: '14:16', what: 'egress → anthropic.com', redacted: 'téléphone, email', status: 'redacted' },
              { ts: '14:14', what: 'egress → notion.so', redacted: '— (scope allowed)', status: 'allowed' },
              { ts: '14:11', what: 'egress → anthropic.com', redacted: 'SSN', status: 'redacted' },
              { ts: '14:09', what: 'egress → drive.google.com', redacted: '— (scope allowed)', status: 'allowed' },
              { ts: '14:08', what: 'egress → openai.com', redacted: 'carte bancaire (BIN 4242)', status: 'redacted' },
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-baseline">
                <span className="text-[var(--theme-text-dim)] shrink-0">{line.ts}</span>
                <span className="text-[var(--theme-text)] truncate w-44">{line.what}</span>
                <span className="truncate flex-1 text-[var(--theme-text-muted)]">{line.redacted}</span>
                <span className={`shrink-0 ${
                  line.status === 'blocked' ? 'text-[var(--danger)]'
                  : line.status === 'redacted' ? 'text-[var(--warn)]'
                  : 'text-[var(--ok)]'
                }`}>· {line.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PACK · audit pack preview ───────────────────────────────── */}
        <section data-anchor="pack" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Audit pack · ce que le régulateur ouvre</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Généré à la demande · 1 click · exporté en PDF + CSV</span>
          </div>

          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--panel-border)] bg-[var(--theme-canvas)]">
              <FileText className="w-4 h-4 text-[var(--theme-accent)]" />
              <span className="font-mono text-xs font-bold text-[var(--theme-text)]">audit-pack-2026-08-06.zip</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[var(--ok)]"><CheckCircle2 className="w-3 h-3" /> prêt</span>
            </div>
            <div className="p-4 flex flex-col gap-1 font-mono text-[11px] text-[var(--theme-text-muted)]">
              {[
                { t: 'folder', name: '00_compliance-posture', extra: 'CCPA · Colorado AI Act · AI-Act 2026-08-02' },
                { t: 'folder', name: '01_nda-registry', extra: '12 NDA on file · exportable CSV' },
                { t: 'folder', name: '02_access-log', extra: '7j rolling · 1.2k events · audited' },
                { t: 'folder', name: '03_egress-shield', extra: 'PII redactions · 0 leakage 24 mois' },
                { t: 'file', name: 'signature-AquaMan-2026-08-06.md', extra: 'sceau cryptographique' },
              ].map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  {line.t === 'folder' ? <FolderOpen className="w-3 h-3 text-[var(--theme-accent)]" /> : <FileText className="w-3 h-3 text-[var(--theme-text-muted)]" />}
                  <span className="text-[var(--theme-text)]">{line.name}</span>
                  <span className="text-[var(--theme-text-dim)]">· {line.extra}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--panel-border-subtle)]">
              <span className="text-[10px] text-[var(--theme-text-dim)]">14 fichiers · 2.3 MB · sceau OMK signé · prêt à envoyer</span>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-accent)] text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-[var(--theme-accent-hover)]">
                <PenLine className="w-3 h-3" /> Exporter
              </button>
            </div>
          </div>
        </section>

        {/* ── PROOF · 1 testimonial + stats ───────────────────────────── */}
        <section data-anchor="proof" className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] p-7 flex flex-col gap-4">
            <ShieldCheck className="w-6 h-6 text-[var(--theme-accent)]" />
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
          <ShieldCheck className="w-7 h-7 text-white mx-auto mb-3" />
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
