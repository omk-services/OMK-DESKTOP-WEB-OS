/** WelcomeApp — landing page of the Coach OS Desktop.
 *
 *  Layout (single window, internal sidebar):
 *   - Sidebar (AppFrame): one entry "Arrivée" + one entry per landing-page
 *     preview. The Arrivée is the magnetic landing; each entry opens a
 *     preview canvas focused on that page.
 *   - Header Menu (sticky top of the canvas): per-section anchor nav of the
 *     active preview, Circle.so style.
 *   - Canvas (right): either the magnetic Arrivée, or the active preview
 *     rendered as one long scroll with smooth-scroll + scroll-spy.
 *
 *  Copy follows the magnetic-message framework (Tom Youngs):
 *    1. Repousser — write the reader's inner complaint, signal who this is
 *       not for. A page that pushes no one out attracts no one.
 *    2. Dissoudre — show what a week with the system looks like, not a
 *       pitch. Show, don't claim.
 *    3. Inviter — soft, from the back foot. One door, no urgency, no timer.
 *
 *  All colors come from theme tokens (`var(--theme-*)`) so the app follows
 *  whichever theme the user picks in Settings. */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass, Sparkles, ClipboardList, Play, ArrowRight,
  Atom, Rocket, BrainCircuit, Banknote, ServerCog, ShieldCheck, Users,
  ArrowDownToLine, MessageCircle, FileSignature, BookOpen,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { LANDING_PAGES } from './landing/landingPages';
import { useThemeStore, applyThemeTokens } from '../../lib/themes/store';
import { THEMES } from '../../lib/themes/tokens';
import { RhCanvas } from './landing/canvases/RhCanvas';
import { OpsCanvas } from './landing/canvases/OpsCanvas';
import { GrowthCanvas } from './landing/canvases/GrowthCanvas';
import { CognitionCanvas } from './landing/canvases/CognitionCanvas';
import { PeopleCanvas } from './landing/canvases/PeopleCanvas';
import { FinanceCanvas } from './landing/canvases/FinanceCanvas';
import { ItRdCanvas } from './landing/canvases/ItRdCanvas';
import { LegalCanvas } from './landing/canvases/LegalCanvas';
import { DemoCanvas } from './landing/canvases/DemoCanvas';

const ACCENT = '#4f46e5';

/** Welcome is a special case in the canon: the sidebar keeps the app identity
 *  (so Welcome looks like Welcome from the rail), but the page content follows
 *  the *global* theme chosen in Settings — the same theme the top bar uses.
 *
 *  AppFrame writes the app's tokens on its own root div, so any content
 *  rendered inside inherits the app theme. We re-apply the global theme on
 *  this wrapper, which sits inside AppFrame's content slot. CSS vars inherit
 *  downward, so every descendant follows.
 *
 *  Three pitfalls already paid in this repo, kept in mind:
 *   - selector must be SCALAR (globalTheme string), not an object/tuple — a
 *     fresh reference each render would make useSyncExternalStore loop.
 *   - never write to the theme store from here (would clobber user choice).
 *   - CSS vars inherit downward; one re-application is enough. */
function GlobalThemedCanvas({ children }: { children: React.ReactNode }) {
  const globalTheme = useThemeStore((s) => s.globalTheme);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      applyThemeTokens(ref.current, THEMES[globalTheme] ?? THEMES['warm-paper']);
    }
  }, [globalTheme]);
  return (
    <div ref={ref} className="h-full bg-[var(--theme-bg)]">
      {children}
    </div>
  );
}

const PAGE_ICON: Record<string, typeof Compass> = {
  'domaine-1-rh-meta-gouvernance': Atom,
  'domaine-2-operations': ClipboardList,
  'domaine-3-growth': Rocket,
  'domaine-4-cognition-savoir': BrainCircuit,
  'domaine-5-people-scalabilite': Users,
  'domaine-6-finance': Banknote,
  'domaine-7-it-rd': ServerCog,
  'domaine-8-legal-conformite': ShieldCheck,
  'onboarding-demo': Play,
};

/** Pick the right canvas for a landing page.
 *  Each canvas owns its OWN structural rhythm — order, density, proof type.
 *  No two canvases share section order; that's the whole point of the brief. */
function PageCanvas({ page, activePageId, onSelectPage }: {
  page: import('./landing/pageSchema').LandingPage;
  activePageId: string;
  onSelectPage: (id: string) => void;
}) {
  switch (page.id) {
    case 'domaine-1-rh-meta-gouvernance':     return <RhCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-2-operations':              return <OpsCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-3-growth':                  return <GrowthCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-4-cognition-savoir':        return <CognitionCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-5-people-scalabilite':      return <PeopleCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-6-finance':                 return <FinanceCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-7-it-rd':                   return <ItRdCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'domaine-8-legal-conformite':        return <LegalCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    case 'onboarding-demo':                   return <DemoCanvas page={page} activePageId={activePageId} onSelectPage={onSelectPage} />;
    default:                                  return null;
  }
}

/** Magnetic arrival — Repousser / Dissoudre / Inviter.
 *
 *  The hero writes the coach's own complaint ("j'en ai assez de..."). The
 *  pushback line signals who this is NOT for (a page that pushes no one
 *  attracts no one). The "vendredi 18h47" narrative shows, doesn't claim.
 *  The single CTA invites from the back foot, with no urgency. */
function OverviewPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const domainPages = useMemo(
    () => LANDING_PAGES.filter(p => p.id !== 'onboarding-demo'),
    [],
  );
  const demoPage = useMemo(
    () => LANDING_PAGES.find(p => p.id === 'onboarding-demo'),
    [],
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-10">

        {/* ─── 1 · REPOUSSER ────────────────────────────────────────────────
            Inner complaint of a premium coach ($500-$2,000/hr) who's still
            trading hours for tasks an agent should ship tonight. */}
        <section
          className="rounded-3xl border border-[var(--panel-border)] px-8 py-12 sm:px-14 sm:py-16 shadow-sm"
          style={{
            background: `linear-gradient(135deg, var(--theme-surface) 0%, var(--theme-surface-hover) 100%)`,
          }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">
            <Sparkles className="w-4 h-4" />
            Coach OS · Pour coach qui facture 500–2000 $/h
          </div>

          <h1
            className="mt-4 text-3xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]"
            style={{ fontFamily: 'var(--theme-font-display)' }}
          >
            Encore un <em className="not-italic underline decoration-[var(--theme-accent)] decoration-2 underline-offset-4">&laquo; je dois juste y réfléchir &raquo;</em> cette semaine&nbsp;?
          </h1>

          <p className="mt-5 text-[var(--theme-text-muted)] max-w-2xl text-base sm:text-lg leading-relaxed">
            Tu vaux 800&nbsp;$ de l’heure. Tu en passes 12 par semaine sur des emails
            que tu as déjà écrits cent fois. Tes DM partent à 23&nbsp;h parce que c’est
            le seul moment où personne ne te dérange. Et le vendredi soir, tu ouvres
            quand même ton laptop.
          </p>

          {/* Pushback — who this isn't for. A page that pushes no one out
              attracts no one. One sentence, no apology. */}
          <div className="mt-7 inline-flex items-start gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text-muted)] max-w-2xl">
            <span className="mt-0.5 text-[var(--theme-text-dim)] font-bold uppercase tracking-wider text-[10px] shrink-0">Ce n’est pas pour toi</span>
            <span>
              si tu n’as pas encore signé 5 clients payants. On n’est pas au même point,
              et les agents ne sont pas la solution à ce problème-là.
            </span>
          </div>

          {/* Three beats of the inner want — written as the coach would
              finish the sentence, not as a feature list. */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            {[
              { label: 'Tu veux', value: 'que ton vendredi soir ressemble à ton mardi soir.' },
              { label: 'Tu veux', value: 'que tes agents répondent à 23 h, pas toi.' },
              { label: 'Tu veux', value: 'approuver en 6 minutes, pas en 60.' },
            ].map((b, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-4 py-3"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{b.label}</div>
                <div className="mt-1 text-sm text-[var(--theme-text)] leading-snug">{b.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 2 · DISSOUDRE ───────────────────────────────────────────────
            Show, don't tell. One narrative moment of a Friday at 18h47, in
            three beats. This dissolves the silent fear ("will it actually
            work?") without claiming a result we don't prove. */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]"
              style={{ fontFamily: 'var(--theme-font-display)' }}
            >
              Un vendredi, à 18&nbsp;h&nbsp;47
            </h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Pas une promesse · un instantané</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                Icon: MessageCircle,
                when: 'Pendant tes deux derniers calls',
                beat: 'Ton Scout a booké 3 appels. Ton Scribe a déjà posté le récap du lundi à 9 clients — brouillon, tu approuves d’un swipe.',
                accent: 'var(--theme-accent)',
              },
              {
                Icon: ArrowDownToLine,
                when: 'À 18 h 12',
                beat: 'Ton Dev a poussé 3 features dans la sandbox. Aucune ne touche la prod sans ton OK. La queue est lisible, pas un Slack scrollback.',
                accent: 'var(--theme-accent-hover)',
              },
              {
                Icon: FileSignature,
                when: 'À 18 h 47',
                beat: 'Tu fermes le laptop. Ton prochain call est lundi 9 h. Ton week-end commence vendredi.',
                accent: 'var(--theme-accent)',
              },
            ].map((m, i) => (
              <article
                key={i}
                className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                  <m.Icon className="w-3.5 h-3.5" style={{ color: m.accent }} />
                  {m.when}
                </div>
                <p className="text-[15px] text-[var(--theme-text)] leading-relaxed">{m.beat}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── The 8 Domaines ─────────────────────────────────────────────
            Each card carries one inner-complaint microline. The card name
            stays technical; the subtitle says why this exists in the coach's
            words, not ours. */}
        <section id="domaines" className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Les 8 Domaines</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Un agent par sujet, un mandat par agent</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {domainPages.map(p => {
              const Icon = PAGE_ICON[p.id] ?? Compass;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="text-left rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white shrink-0"
                      style={{ background: ACCENT }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--theme-accent)]">{p.brand}</div>
                      <div className="text-sm font-bold text-[var(--theme-text)] truncate">{p.tagline}</div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] transition-colors">
                      Voir la page
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── 3 · INVITER ────────────────────────────────────────────────
            Soft, single, no urgency. The door is here; the user walks
            through it when they're ready. */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Pas sûr·e encore ?</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">Quatre questions · zéro PII · zéro carte</span>
          </div>

          {demoPage && (
            <button
              onClick={() => onSelect(demoPage.id)}
              className="text-left rounded-2xl border border-[var(--panel-border)] shadow-sm p-6 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-5"
              style={{ background: 'var(--theme-surface)' }}
            >
              <span
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                style={{ background: 'var(--theme-accent)', color: 'var(--theme-canvas)' }}
              >
                <Play className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--theme-accent)]">
                  Le test en 4 questions
                </div>
                <div className="text-base font-bold mt-0.5 text-[var(--theme-text)]">
                  Ouvre le citadel · regarde tes agents travailler.
                </div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  Pas de CRM à connecter. Pas de &laquo; réservez un call de 30 minutes &raquo;.
                  Si ça ne parle pas à ton vendredi soir, tu fermes l’onglet.
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--theme-text-dim)] shrink-0" />
            </button>
          )}
        </section>

        {/* ─── foot-note — bibliotheque ouverte ─────────────────────────────
            "Ce qui reste ouvert": the canonical coach docs live in three
            places (wiki, dox, graphify). Honest about scope, no fake seals. */}
        <footer className="text-xs text-[var(--theme-text-dim)] pt-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Coach OS · canevas ouvert · wiki · dox · graphify
          </span>
          <span>Si tu fermes cet onglet, il ne se passe rien. Promis.</span>
        </footer>
      </div>
    </div>
  );
}

export function WelcomeApp() {
  const initialId = LANDING_PAGES[0]?.id ?? '';
  const [activePageId, setActivePageId] = useState<string>(initialId);

  // Le bandeau PAGES du canvas et la barre latérale d'AppFrame lisent chacun
  // leur propre source de vérité : la sidebar suit `activeId` interne à
  // AppFrame, le bandeau suit `activePageId` interne à WelcomeApp. Sans pont,
  // cliquer la sidebar « OMK Coach Demo » laisse le bandeau surligner « OMK RH »,
  // et cliquer un onglet du bandeau ne déplace pas la sidebar. (cf. FIX-4.2.)
  //
  // Le pont le plus local possible :
  //   - à chaque clic sur un bouton sidebar (data-section={label}), on
  //     retrouve la page dont la marque porte ce label, et on synchronise
  //     activePageId. Le canvas réaffiche le bandeau avec le bon surlignage.
  //   - quand un onglet du bandeau est cliqué, on déclenche aussi un clic
  //     sur le bouton sidebar correspondant, ce qui pousse AppFrame à
  //     naviguer. Les deux états convergent en un seul cycle.
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('[data-section]');
      if (!(btn instanceof HTMLElement)) return;
      const label = btn.getAttribute('data-section');
      if (!label) return;
      const page = LANDING_PAGES.find(p => p.brand === label);
      if (page && page.id !== activePageId) setActivePageId(page.id);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [activePageId]);

  const navigateToPage = (id: string) => {
    setActivePageId(id);
    const page = LANDING_PAGES.find(p => p.id === id);
    if (!page) return;
    const btn = document.querySelector(`[data-section="${page.brand}"]`);
    if (btn instanceof HTMLButtonElement) btn.click();
  };

  const sections: AppSection[] = useMemo(() => {
    return [
      {
        id: 'overview',
        label: 'Arrivée',
        icon: Compass,
        render: () => (
          <GlobalThemedCanvas>
            <OverviewPanel onSelect={navigateToPage} />
          </GlobalThemedCanvas>
        ),
      },
      ...LANDING_PAGES.map(p => {
        const Icon = PAGE_ICON[p.id] ?? Compass;
        return {
          id: p.id,
          label: p.brand,
          icon: Icon,
          render: () => (
            <GlobalThemedCanvas>
              <PageCanvas page={p} activePageId={activePageId} onSelectPage={navigateToPage} />
            </GlobalThemedCanvas>
          ),
        } satisfies AppSection;
      }),
    ];
  }, [activePageId]);

  return (
    <AppFrame
      title="Welcome"
      subtitle="Page d'arrivée · 8 Domaines"
      icon={Compass}
      accent={ACCENT}
      sections={sections}
    />
  );
}
