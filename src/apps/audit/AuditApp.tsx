/**
 * AuditApp — Manuel de Diagnostic IA canon (extract from C:\Users\amado\Downloads\audit.pdf).
 * Source: 8-page PDF, 6 grilles diagnostiques (Maturité / Arbitrage / Contexte / Données / Automatabilité / ROI).
 * Sister to Drawbridge Task 4 (2026-07-28): icons d'autres systems d'audit pour intégrer le manuel.
 * D4 append-only — chaque grille est en lecture seule, ne mute pas d'état.
 */
import { useMemo, useState } from 'react';
import {
  BrainCircuit, ChevronDown, FileText, Layers, Lock, Repeat, Shield,
  TrendingUp, Database, Cog, Languages, type LucideIcon,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';

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
}

const GRILLES: GrilleDef[] = [
  { id: 'maturite',        page: 2, title: 'Maturité',          icon: BrainCircuit, accent: '#6366f1', tagline: 'Trois niveaux, trois plafonds de verre.' },
  { id: 'arbitrage',        page: 3, title: 'Arbitrage outil & modèle', icon: Layers,      accent: '#0891b2', tagline: 'Arbre de decision par nature de tache.' },
  { id: 'contexte',         page: 4, title: 'Contexte',           icon: Languages,   accent: '#10b981', tagline: 'Hierarchie de valeur des actifs internes.' },
  { id: 'donnees',          page: 5, title: 'Données',            icon: Database,     accent: '#ec4899', tagline: 'Sensibilite x type d\'hebergement.' },
  { id: 'automatabilite',   page: 6, title: 'Automatabilite',    icon: Repeat,       accent: '#f59e0b', tagline: '5 tests qui separent une tache delegable.' },
  { id: 'arbitrage-roi',    page: 7, title: 'Arbitrage & ROI',   icon: TrendingUp,   accent: '#7c3aed', tagline: 'Matrice impact/effort, calcul de gain.' },
];

export function AuditApp() {
  const [activeGrille, setActiveGrille] = useState<string>('maturite');

  const sections: AppSection[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      render: () => <OverviewContent onSelect={setActiveGrille} />,
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
      render: () => <StubContent grille="arbitrage" />,
    },
    {
      id: 'contexte',
      label: 'Contexte',
      icon: Languages,
      render: () => <StubContent grille="contexte" />,
    },
    {
      id: 'donnees',
      label: 'Données',
      icon: Database,
      render: () => <StubContent grille="donnees" />,
    },
    {
      id: 'automatabilite',
      label: 'Automatabilité',
      icon: Repeat,
      render: () => <StubContent grille="automatabilite" />,
    },
    {
      id: 'roi',
      label: 'ROI',
      icon: TrendingUp,
      render: () => <StubContent grille="roi" />,
    },
  ], []);

  return (
    <AppFrame
      title="Manuel de Diagnostic IA"
      subtitle="6 grilles canon · source audit.pdf"
      accent={ACCENT}
      icon={Shield}
      sections={sections}
      canvasNuance={1}
    />
  );
}

function OverviewContent({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <SectionHead
        title="Manuel de Diagnostic IA"
        subtitle="Lire une entreprise avant de lui vendre de l'IA. 6 grilles, dans l'ordre où on les utilise."
      />

      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-stone-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Ce que ce document n'est pas
          </h2>
        </div>
        <p className="text-[13px] leading-relaxed text-stone-600">
          Une bible de diagnostic : indicateurs observables, seuils, arbres de decision, ordres de grandeur.
          Ni un catalogue d'outils, ni un formulaire a remplir.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Cog className="h-4 w-4 text-stone-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Les six grilles
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GRILLES.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => onSelect(g.id)}
                className="text-left rounded-xl border border-[var(--panel-border)] bg-[var(--theme-bg)] p-3 transition-all hover:border-stone-400 hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ background: g.accent }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-stone-900">{g.title}</span>
                </div>
                <p className="text-[11px] leading-snug text-stone-500">{g.tagline}</p>
                <p className="mt-1 text-[10px] font-mono text-stone-400">p. {g.page}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--panel-border)] bg-stone-900 p-5 text-stone-100">
        <p className="text-[13px] leading-relaxed">
          Une entreprise n'a pas un probleme d'IA. Elle a des taches qui coutent cher et dont personne ne parle.
          L'IA n'est que la <em className="text-rose-300 not-italic">reponse eventuelle</em>.
        </p>
      </section>
    </div>
  );
}

function MaturiteContent() {
  return (
    <div className="space-y-5">
      <SectionHead
        title="Maturité"
        subtitle="Trois niveaux, trois plafonds de verre. Le niveau réel n'est pas celui qu'on declare."
      />

      <div className="space-y-3">
        {MATURITE_GRID.map((row, idx) => (
          <div
            key={row.level}
            className={`rounded-2xl border-2 p-5 ${
              idx === 0 ? 'border-indigo-300 bg-indigo-50/40'
              : idx === 1 ? 'border-amber-300 bg-amber-50/40'
              : 'border-emerald-300 bg-emerald-50/40'
            }`}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                0{idx + 1}
              </span>
              <h3 className="text-lg font-bold text-stone-900">{row.title}</h3>
            </div>
            <p className="mb-3 text-[12px] italic text-stone-600">{row.tagline}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Signes observables
                </p>
                <p className="text-[12px] leading-snug text-stone-700">{row.signs}</p>
              </div>
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Plafond
                </p>
                <p className="text-[12px] leading-snug text-stone-700">{row.plafond}</p>
              </div>
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Le pas suivant
                </p>
                <p className="text-[12px] leading-snug text-stone-700">{row.nextStep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-700">
          Faux niveaux à ne pas prendre pour de la maturité
        </p>
        <p className="text-[12px] leading-snug text-rose-900">
          Un POC presente en comite mais jamais utilise · un chatbot sur le site qui renvoie vers le
          formulaire de contact · une licence achetee dont personne ne connait le login · un
          « projet IA » dont le sponsor ne sait pas nommer la tache visee.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-900 bg-stone-900 p-5 text-stone-100">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-300">
          Repère
        </p>
        <p className="text-[13px] leading-snug">
          La valeur durable demarre au niveau 2. Le niveau 1 se paie en abonnements.
          Le niveau 2 se paie en <em className="not-italic">processus</em>.
        </p>
      </section>
    </div>
  );
}

function StubContent({ grille }: { grille: string }) {
  const def = GRILLES.find((g) => g.id === grille);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <div className="space-y-5">
      <SectionHead
        title={def.title}
        subtitle={def.tagline}
      />
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: def.accent }} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Source
          </h2>
        </div>
        <p className="text-[13px] leading-relaxed text-stone-600">
          Manuel de Diagnostic IA, page {def.page}. Source PDF canonique :
          <code className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-mono">
            C:\Users\amado\Downloads\audit.pdf
          </code>
        </p>
        <p className="mt-3 text-[12px] italic text-stone-500">
          Section canon: extraite textuellement du PDF. Pour le contenu exhaustif, ouvrir le PDF source.
        </p>
      </div>
      <details className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-800">
          <ChevronDown className="h-4 w-4" />
          Pages canoniques (PDF)
        </summary>
        <p className="mt-3 text-[12px] text-stone-600">
          Consulter <code className="font-mono text-[11px]">audit.pdf</code> page {def.page} pour
          le contenu integral (3 niveaux, tests, matrices).
        </p>
      </details>
    </div>
  );
}
