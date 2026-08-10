/**
 * AuditApp — Manuel de Diagnostic IA canon (extract from C:\Users\amado\Downloads\audit.pdf).
 * Source: 8-page PDF, 6 grilles diagnostiques (Maturité / Arbitrage / Contexte / Données / Automatabilité / ROI).
 * Sister to Drawbridge Task 4 (2026-07-28): icons d'autres systems d'audit pour intégrer le manuel.
 * D4 append-only — chaque grille est en lecture seule, ne mute pas d'état.
 *
 * 2026-08-06 — 5 grilles suivantes ajoutees : Arbitrage, Contexte, Données,
 *               Automatabilité, Arbitrage & ROI. Chacune est une collection CMS
 *               (audit_*), affichée via CMSCardList, drill via DynamicPageView,
 *               detail rendu par AuditItemDetail. Statique Maturité conservée.
 */
import { useMemo } from 'react';
import {
  BrainCircuit, FileText, Layers, Lock, Repeat, Shield,
  TrendingUp, Database, Cog, Languages, CheckCircle2, type LucideIcon,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { AuditItemDetail } from './AuditItemDetail';
import { seedAuditCms, FREQ_BADGE_ACCENT } from './seed';

seedAuditCms();
registerItemDetail('audit', AuditItemDetail);

const ACCENT = '#b91c1c'; // red — diagnostic / audit canon

type Level = 'discuter' | 'connecter' | 'deleguer';

interface MaturiteRow {
  level: Level;
  title: string;
  tagline: string;
  signs: string;
  plafond: string;
  nextStep: string;
}

const MATURITE_GRID: MaturiteRow[] = [
  {
    level: 'discuter',
    title: 'Discuter',
    tagline: "L'humain fait tout le transport de l'information.",
    signs: "Abonnements individuels, prompts copies-colles, « sa » methode a chacun.",
    plafond: "Le gain s'arrete au temps de frappe. Rien n'est capitalise.",
    nextStep: "Ecrire le contexte UNE fois pour toutes et brancher l'IA sur la source, pas sur le copier-coller.",
  },
  {
    level: 'connecter',
    title: 'Connecter',
    tagline: "Les outils se parlent. L'IA est une etape du flux.",
    signs: "Des scenarios tournent (n8n, Make, Zapier) et un humain sait dire ce qui se declenche.",
    plafond: "Tout cas non prevu casse le flux. Une seule personne sait reparer.",
    nextStep: "Remplacer les branches conditionnelles par une decision confiant au modele.",
  },
  {
    level: 'deleguer',
    title: 'Déléguer',
    tagline: 'Un agent tient une tache de bout en bout.',
    signs: "Perimetre ecrit noir sur blanc, criteres d'escalade, suivi des cas traites / rattrapes.",
    plafond: "La confiance. Sans taux d'erreur, l'equipe reverifie tout a la main.",
    nextStep: 'Instrumenter volume traite, taux de reprise, cout par cas. Elargir le perimetre quand les 3 sont stables.',
  },
];

interface GrilleDef {
  id: string;
  page: number;
  title: string;
  icon: LucideIcon;
  accent: string;
  tagline: string;
  collectionId: string;
}

const GRILLES: GrilleDef[] = [
  { id: 'maturite',        page: 2, title: 'Maturité',          icon: BrainCircuit, accent: '#6366f1', tagline: 'Trois niveaux, trois plafonds de verre.',                                              collectionId: '' },
  { id: 'arbitrage',       page: 3, title: 'Arbitrage',         icon: Layers,       accent: '#0891b2', tagline: 'Ce qui doit rester une decision humaine, et pourquoi.',                                collectionId: 'audit_arbitrage' },
  { id: 'contexte',        page: 4, title: 'Contexte',          icon: Languages,    accent: '#10b981', tagline: 'Ce que l\'agent doit savoir du metier pour agir juste.',                                collectionId: 'audit_contexte' },
  { id: 'donnees',         page: 5, title: 'Données',           icon: Database,     accent: '#ec4899', tagline: 'Qualite, fraicheur et provenance de ce qu\'il consomme.',                              collectionId: 'audit_donnees' },
  { id: 'automatabilite',  page: 6, title: 'Automatabilité',    icon: Repeat,       accent: '#f59e0b', tagline: '5 tests qui separent une tache delegable.',                                            collectionId: 'audit_automatabilite' },
  { id: 'roi',             page: 7, title: 'Arbitrage & ROI',   icon: TrendingUp,   accent: '#7c3aed', tagline: 'Ce que coute une decision humaine, ce qu\'elle evite.',                                collectionId: 'audit_arbitrage_roi' },
];

interface CriterionItem extends Record<string, unknown> {
  id: string;
  criterion: string;
  question: string;
  axis: string;
  frequency: string;
  observe: string;
  level0: string;
  level1: string;
  level2: string;
}

interface CollectionDrill {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
}

export function AuditApp() {
  /* Le 2e argument de useCollectionDrill est le LABEL DE SECTION, pas le nom
   * de la collection. Le hook compare ce label a `activePage` (qu'AppFrame
   * alimente avec `active.label`) pour savoir s'il est visible ; quand il ne
   * l'est pas, il referme toute fiche ouverte. Un label qui ne correspond a
   * aucune section rend donc les cartes de cette grille definitivement
   * inertes — c'etait le cas de ROI, declaree ici « Arbitrage & ROI » (le
   * nom de la collection dans le seed) alors que sa section s'appelle « ROI ».
   * Les quatre autres grilles ouvraient leur fiche, la cinquieme non. */
  const arbitrageDrill = useCollectionDrill('audit_arbitrage', 'Arbitrage');
  const contexteDrill = useCollectionDrill('audit_contexte', 'Contexte');
  const donneesDrill = useCollectionDrill('audit_donnees', 'Données');
  const automatabiliteDrill = useCollectionDrill('audit_automatabilite', 'Automatabilité');
  const roiDrill = useCollectionDrill('audit_arbitrage_roi', 'ROI');

  /* Brief-F — couche d'écriture. Le manuel est D4 append-only sur le fond,
   * mais une fiche par critère gagne un état "relue" (signé humain). C'est
   * la seule mutation : on pose un timestamp + un actor sur l'item, sans
   * toucher au contenu canonique. Toast global au résultat.
   *
   * `updateItem` (active tenant, vue plate) renvoie `void` dans cette
   * codebase — le verdict est « la fonction n'a pas jete ». Si elle
   * jetait un jour (collection inconnue), on garderait le silence et
   * l'utilisateur reverrait son item : c'est l'echec attendu, pas un
   * toast d'erreur. Le check `result !== undefined` du passe
   * precedent etait faux : `void` est toujours `undefined`, donc le
   * toast partait toujours — qu'il y ait eu ecriture ou pas. */
  const updateItem = useCmsStore(s => s.updateItem);
  const addToast = useShellStore(s => s.addToast);
  const markReviewed = (collectionId: string, id: string, label: string): void => {
    const reviewedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    updateItem(collectionId, id, { reviewedAt, reviewedBy: 'human:ops' });
    addToast({ source: 'Audit', type: 'success', message: `Critère marqué relu : ${label}` });
  };

  const sections: AppSection[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      render: () => <OverviewContent />,
    },
    {
      id: 'maturite',
      label: 'Maturité',
      icon: BrainCircuit,
      render: () => <MaturiteContent />,
    },
    {
      id: 'arbitrage',
      label: 'Arbitrage',
      icon: Layers,
      render: () => (
        <CriterionGrid
          title="Arbitrage"
          subtitle={GRILLES[1].tagline}
          accent={GRILLES[1].accent}
          icon={GRILLES[1].icon}
          collectionId="audit_arbitrage"
          drill={arbitrageDrill}
          onMarkReviewed={(id, label) => markReviewed('audit_arbitrage', id, label)}
        />
      ),
    },
    {
      id: 'contexte',
      label: 'Contexte',
      icon: Languages,
      render: () => (
        <CriterionGrid
          title="Contexte"
          subtitle={GRILLES[2].tagline}
          accent={GRILLES[2].accent}
          icon={GRILLES[2].icon}
          collectionId="audit_contexte"
          drill={contexteDrill}
          onMarkReviewed={(id, label) => markReviewed('audit_contexte', id, label)}
        />
      ),
    },
    {
      id: 'donnees',
      label: 'Données',
      icon: Database,
      render: () => (
        <CriterionGrid
          title="Données"
          subtitle={GRILLES[3].tagline}
          accent={GRILLES[3].accent}
          icon={GRILLES[3].icon}
          collectionId="audit_donnees"
          drill={donneesDrill}
          onMarkReviewed={(id, label) => markReviewed('audit_donnees', id, label)}
        />
      ),
    },
    {
      id: 'automatabilite',
      label: 'Automatabilité',
      icon: Repeat,
      render: () => (
        <CriterionGrid
          title="Automatabilité"
          subtitle={GRILLES[4].tagline}
          accent={GRILLES[4].accent}
          icon={GRILLES[4].icon}
          collectionId="audit_automatabilite"
          drill={automatabiliteDrill}
          onMarkReviewed={(id, label) => markReviewed('audit_automatabilite', id, label)}
        />
      ),
    },
    {
      id: 'roi',
      label: 'ROI',
      icon: TrendingUp,
      render: () => (
        <CriterionGrid
          title="Arbitrage & ROI"
          subtitle={GRILLES[5].tagline}
          accent={GRILLES[5].accent}
          icon={GRILLES[5].icon}
          collectionId="audit_arbitrage_roi"
          drill={roiDrill}
          onMarkReviewed={(id, label) => markReviewed('audit_arbitrage_roi', id, label)}
        />
      ),
    },
  ], [arbitrageDrill, contexteDrill, donneesDrill, automatabiliteDrill, roiDrill]);

  const drillViews: ReadonlyArray<{
    drill: CollectionDrill;
    collectionId: string;
  }> = [
    { drill: arbitrageDrill, collectionId: 'audit_arbitrage' },
    { drill: contexteDrill, collectionId: 'audit_contexte' },
    { drill: donneesDrill, collectionId: 'audit_donnees' },
    { drill: automatabiliteDrill, collectionId: 'audit_automatabilite' },
    { drill: roiDrill, collectionId: 'audit_arbitrage_roi' },
  ];
  const activeDrill = drillViews.find((entry) => entry.drill.openId) ?? null;

  return (
    <>
      <AppFrame
        title="Audit Diagnostic IA"
        subtitle="Manuel · 6 grilles canon · source audit.pdf"
        accent={ACCENT}
        icon={Shield}
        sections={sections}
        canvasNuance={1}
      />
      {activeDrill?.drill.openId ? (
        <AppDetailOverlay
          appId="audit"
          accent={ACCENT}
          onBack={() => activeDrill.drill.close()}
          motion={{ kind: 'fade-up', durationMs: 220 }}
        >
          <DynamicPageView
            collectionId={activeDrill.collectionId}
            itemId={activeDrill.drill.openId}
            onBack={() => activeDrill.drill.close()}
            onNavigate={activeDrill.drill.open}
          />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}

function OverviewContent() {
  const navigateToSection = (label: string): void => {
    if (typeof document === 'undefined') return;
    const target = document.querySelector(`[data-section="${label}"]`);
    if (target instanceof HTMLElement) target.click();
  };

  return (
    <div className="space-y-6">
      <SectionHead
        title="Manuel de Diagnostic IA"
        subtitle="Lire une entreprise avant de lui vendre de l'IA. 6 grilles, dans l'ordre où on les utilise."
      />

      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[var(--theme-muted)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text)]">
            Ce que ce document n'est pas
          </h2>
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--theme-muted)]">
          Une bible de diagnostic : indicateurs observables, seuils, arbres de decision, ordres de grandeur.
          Ni un catalogue d'outils, ni un formulaire a remplir.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Cog className="h-4 w-4 text-[var(--theme-muted)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text)]">
            Les six grilles
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GRILLES.map((g) => {
            const Icon = g.icon;
            // Map grille ID to the sidebar label (which is what `data-section`
            // carries on the AppFrame buttons). Maturité is the special case
            // — it's a static grid, the other five have a CMS drill.
            const sectionLabel =
              g.id === 'maturite' ? 'Maturité'
              : g.id === 'arbitrage' ? 'Arbitrage'
              : g.id === 'contexte' ? 'Contexte'
              : g.id === 'donnees' ? 'Données'
              : g.id === 'automatabilite' ? 'Automatabilité'
              : g.id === 'roi' ? 'ROI'
              : '';
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => navigateToSection(sectionLabel)}
                aria-label={`Ouvrir la grille ${g.title}`}
                className="text-left rounded-xl border border-[var(--panel-border)] bg-[var(--theme-bg)] p-3 transition-all hover:border-[var(--theme-text-dim)] hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: g.accent, color: 'var(--theme-bg)' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-[var(--theme-text)]">{g.title}</span>
                </div>
                <p className="text-[11px] leading-snug text-[var(--theme-muted)]">{g.tagline}</p>
                <p className="mt-1 text-[10px] font-mono text-[var(--theme-text-dim)]">p. {g.page}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="rounded-2xl p-5"
        style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)' }}
      >
        <p className="text-[13px] leading-relaxed">
          Une entreprise n'a pas un probleme d'IA. Elle a des taches qui coutent cher et dont personne ne parle.
          L'IA n'est que la <em className="not-italic" style={{ color: 'var(--theme-bg)' }}>reponse eventuelle</em>.
        </p>
      </section>
    </div>
  );
}

function MaturiteContent() {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Maturité"
        subtitle="Trois niveaux, trois plafonds de verre. Le niveau réel n'est pas celui qu'on declare."
      />

      {/* Les trois cartes forment un tout indissociable — l'utilisateur doit
          pouvoir lire Discuter / Connecter / Déléguer d'un coup d'œil, sans
          devoir scroller. Avant le compact, p-5 + grid 3-col faisait déborder
          la troisième carte sous la ligne de flottaison en 1440x900. (FIX-4.5.) */}
      <div className="space-y-2.5">
        {MATURITE_GRID.map((row, idx) => (
          <div
            key={row.level}
            className={`rounded-xl border-2 p-4 ${
              idx === 0 ? 'border-indigo-300 bg-indigo-50/40'
              : idx === 1 ? 'border-amber-300 bg-amber-50/40'
              : 'border-emerald-300 bg-emerald-50/40'
            }`}
          >
            <div className="mb-1.5 flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                0{idx + 1}
              </span>
              <h3 className="text-base font-bold text-[var(--theme-text)]">{row.title}</h3>
            </div>
            <p className="mb-2 text-[11.5px] italic text-[var(--theme-muted)]">{row.tagline}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                  Signes observables
                </p>
                <p className="text-[11.5px] leading-snug text-[var(--theme-text)]">{row.signs}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                  Plafond
                </p>
                <p className="text-[11.5px] leading-snug text-[var(--theme-text)]">{row.plafond}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                  Le pas suivant
                </p>
                <p className="text-[11.5px] leading-snug text-[var(--theme-text)]">{row.nextStep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section
        className="rounded-xl p-4"
        style={{
          background: 'var(--theme-surface)',
          border: '1px solid var(--panel-border)',
          borderLeft: '4px solid #f59e0b',
        }}
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#b45309' }}>
          Faux niveaux à ne pas prendre pour de la maturité
        </p>
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--theme-text)' }}>
          Un POC presente en comite mais jamais utilise · un chatbot sur le site qui renvoie vers le
          formulaire de contact · une licence achetee dont personne ne connait le login · un
          « projet IA » dont le sponsor ne sait pas nommer la tache visee.
        </p>
      </section>

      <section
        className="rounded-xl p-4"
        style={{
          background: 'var(--theme-text)',
          color: 'var(--theme-bg)',
        }}
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-bg)' }}>
          Repère
        </p>
        <p className="text-[12px] leading-snug">
          La valeur durable demarre au niveau 2. Le niveau 1 se paie en abonnements.
          Le niveau 2 se paie en <em className="not-italic">processus</em>.
        </p>
      </section>
    </div>
  );
}

function CriterionGrid({
  title,
  subtitle,
  accent,
  icon: Icon,
  collectionId,
  drill,
  onMarkReviewed,
}: {
  title: string;
  subtitle: string;
  accent: string;
  icon: LucideIcon;
  collectionId: string;
  drill: CollectionDrill;
  onMarkReviewed: (id: string, label: string) => void;
}) {
  const items = useCmsStore(s => s.items[collectionId] ?? []) as CriterionItem[];
  return (
    <div className="p-7">
      <SectionHead title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <div className="text-center text-[12px] py-8" style={{ color: 'var(--theme-text-dim)' }}>No items yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((c) => {
            const freq = String(c.frequency ?? '').toLowerCase();
            const freqAccent = FREQ_BADGE_ACCENT[freq] ?? accent;
            const freqBg: Record<string, string> = { quotidien: '#fee2e2', hebdo: '#fef3c7', mensuel: '#ccfbf1', ponctuel: '#e0e7ff' };
            const freqFg: Record<string, string> = { quotidien: '#b91c1c', hebdo: '#b45309', mensuel: '#0f766e', ponctuel: '#4338ca' };
            const isReviewed = Boolean(c.reviewedAt);
            return (
              <div
                key={String(c.id)}
                className="rounded-2xl border shadow-sm p-4 flex flex-col gap-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
                onClick={() => drill.open(String(c.id))}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: freqAccent }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-[14px] font-bold flex-1 min-w-[9rem]" style={{ color: 'var(--theme-text)' }}>{String(c.criterion ?? '—')}</span>
                      <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: freqFg[freq] ?? 'var(--theme-text-muted)', background: freqBg[freq] ?? 'var(--theme-surface)' }}>
                        {freq || '—'}
                      </span>
                    </div>
                    <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{String(c.question ?? '')}</div>
                  </div>
                </div>
                <p className="text-[12px] leading-snug line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {String(c.observe ?? '').slice(0, 160)}
                </p>
                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                  <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                    axe <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>{String(c.axis ?? '—')}</span>
                    <span className="mx-2">·</span>
                    {isReviewed ? `relue ${String(c.reviewedAt ?? '')}` : `3 niveaux · ${String(c.id ?? '')}`}
                  </span>
                  {isReviewed ? (
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                      style={{ background: 'rgba(22,163,74,0.14)', color: '#15803d', border: '1px solid #86efac' }}
                      aria-label="Critère déjà relu"
                    >
                      <CheckCircle2 className="w-3 h-3" /> relu
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onMarkReviewed(String(c.id), String(c.criterion ?? c.id)); }}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90 shrink-0"
                      style={{ background: 'rgba(99,102,241,0.14)', color: '#4338ca', border: '1px solid #c7d2fe' }}
                      aria-label={`Marquer relu : ${c.criterion}`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> relire
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
