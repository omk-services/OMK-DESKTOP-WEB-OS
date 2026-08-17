// src/apps/saas-builder/SaaSBuilderApp.tsx
// UI SaaS builder. SPEC §5.
//
// FORM : sidebar Macro-style (cf. AppStoreApp.tsx comme reference).
// 3 sections : Models / Prompt / Output. Palette accent #7c3aed.
//
// LE LEGERTICKER EN HAUT : inspire de Ledger.jsx:18-22 (Bench public) :
// 3 cases 'All-time spend' / 'Completed runs' / 'Average per run'.
// C'est ce que la barre du haut affiche, recalcule a chaque render.
//
// LES TOOLS : on appelle directement les exports de catalog/saasBuilder
// (saasAppSpecGenerate, saasAppSpecPublish). C'est l'integration in-app
// -- le MCP tool est le meme code, expose aux clients externes via
// l'adaptateur MCP.

import { useEffect, useMemo, useState } from 'react';
import { Box, Code2, FileText, Plus } from 'lucide-react';
import {
  engines,
  type EngineSummary,
} from '../../lib/saas-builder/engines';
import {
  useLedgerStore,
} from '../../lib/saas-builder/ledger.store';
import { ledgerMarkdown } from '../../lib/saas-builder/ledger.export';
import {
  saasAppSpecGenerate,
  saasAppSpecPublish,
  saasLedgerRead,
} from '../../lib/tooling/catalog/saasBuilder';
import { parseAppSpec, type AppSpec } from '../../lib/saas-builder/appSpec.schema';

type SectionId = 'models' | 'prompt' | 'output';

// ============================================================
// LedgerTicker — bandeau en haut, toujours visible
// ============================================================
function LedgerTicker(): import('react').ReactNode {
  // SPEC §2.4 : 3 cases. On recalcule a chaque render (Zustand
  // selection sur entries + totalUsd() qui lit le store).
  const entries = useLedgerStore((s) => s.entries);
  const summary = useMemo(() => {
    if (entries.length === 0) {
      return { totalGenerations: 0, allTimeUsd: 0, averageUsd: 0 };
    }
    const all = entries.reduce((s, e) => s + e.costUsd, 0);
    return {
      totalGenerations: entries.length,
      allTimeUsd: all,
      averageUsd: all / entries.length,
    };
  }, [entries]);
  return (
    <div
      data-testid="ledger-ticker"
      className="flex items-stretch gap-2 px-6 py-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/40 text-[12px]"
    >
      <Stat label="All-time spend" value={`$${summary.allTimeUsd.toFixed(3)}`} />
      <Stat label="Completed runs" value={String(summary.totalGenerations)} />
      <Stat label="Average per run" value={`$${summary.averageUsd.toFixed(3)}`} />
      <div className="ml-auto flex items-center gap-2 text-[var(--theme-text-dim)]">
        <button
          type="button"
          className="ghost-btn"
          // SPEC §2.4 : export markdown sur demande.
          onClick={() => {
            const md = ledgerMarkdown(useLedgerStore.getState().entries);
            // V1 : on pose dans localStorage pour debug. V2 : clipboard
            // ou download. Le bouton existe ; le wiring reste simple.
            try {
              localStorage.setItem('coach-os-saas-ledger-export', md);
            } catch {
              // localStorage plein : on ignore, l'utilisateur ne perd rien.
            }
          }}
        >
          <FileText className="w-3 h-3 inline mr-1" />
          Export
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): import('react').ReactNode {
  return (
    <div className="flex flex-col px-3 py-1 rounded-md border border-[var(--theme-border)]/40 min-w-[120px]">
      <span className="text-[10px] uppercase tracking-wider text-[var(--theme-text-dim)]">{label}</span>
      <strong className="text-[14px] font-mono">{value}</strong>
    </div>
  );
}

// ============================================================
// Sidebar — modele Macro-style, 3 sections
// ============================================================
const SECTIONS: Array<{ id: SectionId; label: string; description: string }> = [
  { id: 'models', label: 'Models', description: 'Liste des engines et leur disponibilite.' },
  { id: 'prompt', label: 'Prompt', description: 'Intention + bouton Refine + preview.' },
  { id: 'output', label: 'Output', description: 'AppSpec JSON + bouton Publish.' },
];

function Sidebar({
  active,
  onSelect,
  availableCount,
  totalCount,
}: {
  active: SectionId;
  onSelect: (s: SectionId) => void;
  availableCount: number;
  totalCount: number;
}): import('react').ReactNode {
  return (
    <aside className="w-[180px] shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)]/40 backdrop-blur-sm flex flex-col">
      <div className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
        Sections
      </div>
      <nav className="flex flex-col gap-0.5 px-1.5">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-text)] font-semibold'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]/60'
              }`}
            >
              <span className="text-[13px]">{s.label}</span>
              <span className="text-[10.5px] text-[var(--theme-text-dim)]">{s.description}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-[var(--theme-border)]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)] mb-2">Statut</div>
        <div className="text-[11px] text-[var(--theme-text-muted)] space-y-0.5">
          <div>Engines : {availableCount} / {totalCount}</div>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Section : Models — liste des engines + prompt hint
// ============================================================
function ModelsSection({ list }: { list: EngineSummary[] }): import('react').ReactNode {
  return (
    <div className="space-y-3" data-testid="models-section">
      <header>
        <h1 className="text-2xl font-bold">Models</h1>
        <p className="text-sm text-[var(--theme-text-muted)] mt-1">
          6 engines. SPEC §2.2. Vert = cle dispo, gris = stub (V1).
        </p>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {list.map((e) => (
          <article
            key={e.id}
            data-testid={`engine-${e.id}`}
            className={`rounded-xl border p-4 ${
              e.available
                ? 'border-[var(--theme-accent)]/30 bg-[var(--theme-surface)]'
                : 'border-[var(--theme-border)] bg-[var(--theme-surface)]/40 opacity-60'
            }`}
          >
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-sm flex-1">{e.label}</h3>
              <span
                className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  e.available
                    ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
                    : 'bg-[var(--theme-text-dim)]/15 text-[var(--theme-text-dim)]'
                }`}
              >
                {e.available ? 'live' : 'stub'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--theme-text-dim)] mt-1">
              {e.vendor} · {e.output}
            </div>
            <div className="text-[11px] font-mono mt-2">
              ${e.costUsd.toFixed(3)} / generation
              {e.costConfidence === 'estimated' && (
                <span className="text-[var(--theme-text-dim)]"> (estimated)</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-2 italic">
              {e.promptHint}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Section : Prompt — intention + bouton Refine + preview
// ============================================================
function PromptSection({
  intent,
  setIntent,
  refined,
  isGenerating,
  onGenerate,
}: {
  intent: string;
  setIntent: (s: string) => void;
  refined: AppSpec | null;
  isGenerating: boolean;
  onGenerate: () => void;
}): import('react').ReactNode {
  return (
    <div className="space-y-3" data-testid="prompt-section">
      <header>
        <h1 className="text-2xl font-bold">Prompt</h1>
        <p className="text-sm text-[var(--theme-text-muted)] mt-1">
          Decrivez l'app que vous voulez creer. SPEC §5.
        </p>
      </header>
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="Une app qui affiche un dashboard de sessions, avec 4 KPIs et un graphique de tendance."
        rows={4}
        className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] focus:outline-none focus:border-[var(--theme-accent)]/50 resize-y"
      />
      <button
        type="button"
        onClick={onGenerate}
        disabled={intent.trim().length === 0 || isGenerating}
        className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] text-[var(--theme-on-accent)] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      >
        {isGenerating ? 'Generation...' : 'Generate AppSpec'}
      </button>
      {refined && (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-[var(--theme-accent)]" />
            <strong className="text-sm">AppSpec genere</strong>
          </div>
          <pre className="text-[11px] font-mono overflow-auto max-h-48 p-2 bg-[var(--theme-bg)] rounded">
            {JSON.stringify(refined, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section : Output — preview + bouton Publish
// ============================================================
function OutputSection({
  spec,
  onPublish,
  isPublishing,
  published,
}: {
  spec: AppSpec | null;
  onPublish: () => void;
  isPublishing: boolean;
  published: string | null;
}): import('react').ReactNode {
  if (!spec) {
    return (
      <div className="space-y-3" data-testid="output-section">
        <header>
          <h1 className="text-2xl font-bold">Output</h1>
        </header>
        <div className="flex flex-col items-center justify-center text-center gap-3 text-[var(--theme-text-dim)] py-16">
          <Box className="w-12 h-12" />
          <p className="text-sm">Aucun AppSpec a publier. Allez dans <strong>Prompt</strong> d'abord.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="output-section">
      <header>
        <h1 className="text-2xl font-bold">Output</h1>
        <p className="text-sm text-[var(--theme-text-muted)] mt-1">
          Validation finale avant publication dans App Store. SPEC §6.1.
        </p>
      </header>
      <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]/40 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-[var(--theme-accent)]" />
          <strong className="text-sm">{spec.name} v{spec.version}</strong>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]">
            {spec.level}
          </span>
        </div>
        <pre className="text-[11px] font-mono overflow-auto max-h-64 p-2 bg-[var(--theme-bg)] rounded">
          {JSON.stringify(spec, null, 2)}
        </pre>
      </div>
      <button
        type="button"
        onClick={onPublish}
        disabled={isPublishing || published !== null}
        className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] text-[var(--theme-on-accent)] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      >
        {published !== null
          ? `Publie dans App Store (slug: ${published})`
          : isPublishing
          ? 'Publication...'
          : 'Publish to App Store'}
      </button>
    </div>
  );
}

// ============================================================
// SaaSBuilderApp — racine
// ============================================================
export function SaaSBuilderApp(): import('react').ReactNode {
  const [section, setSection] = useState<SectionId>('models');
  const [intent, setIntent] = useState('');
  const [refined, setRefined] = useState<AppSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);

  // Engines : relu a chaque mount + apres chaque touche du ledger
  // (les engines dependent de import.meta.env qui ne change pas, mais
  // on garde le pattern de re-render pour V2 ou les env sont dynamiques).
  const [engineList, setEngineList] = useState<EngineSummary[]>(() => engines());
  useEffect(() => {
    setEngineList(engines());
  }, []);
  const availableCount = useMemo(() => engineList.filter((e) => e.available).length, [engineList]);

  const handleGenerate = async (): Promise<void> => {
    setIsGenerating(true);
    setPublished(null);
    try {
      // SPEC §4.4 + §6.1 : on appelle le tool via execute() direct.
      // En V1, pas de ToolContext reel (pas de session MCP). On
      // simule par un appel sans guard. V2 branchera ToolContext.
      const res = await saasAppSpecGenerate.execute(
        { intent, routeHint: undefined },
        // Pas de ToolContext ici : l'UI in-app bypass l'identity gate.
        // SPEC §2.5 dit que le tool a la garde ; ici on l'appelle
        // depuis un composant de confiance (le shell), pas depuis MCP.
        { tenantId: 'demo-coach', actorId: 'saas-builder-ui', role: 'owner' },
      );
      if (!res.ok) {
        setRefined(null);
        return;
      }
      const data = res.data as { spec: AppSpec };
      const parsed = parseAppSpec(data.spec);
      if (parsed.ok) {
        setRefined(parsed.spec);
        setSection('output');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    if (!refined) return;
    setIsPublishing(true);
    try {
      const res = await saasAppSpecPublish.execute(
        { spec: refined },
        { tenantId: 'demo-coach', actorId: 'saas-builder-ui', role: 'owner' },
      );
      if (res.ok) {
        const data = res.data as { slug: string };
        setPublished(data.slug);
        // Ledger : on append la generation.
        useLedgerStore.getState().append({
          routeId: refined.modelHints?.routeId ?? 'fal-ai/flux-2/flash',
          promptSnippet: intent,
          outputPath: refined.outputs['text/html'] ?? '',
          costUsd: 0.05, // V2 : lu de engine.costUsd
          costConfidence: 'estimated',
          vendor: refined.modelHints?.routeId?.startsWith('fal-') ? 'fal' : 'unknown',
          requestId: undefined,
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Premier render : on lit le ledger une fois pour la ticker.
  useEffect(() => {
    void saasLedgerRead.execute({}, { tenantId: 'demo-coach', actorId: 'init', role: 'owner' });
  }, []);

  return (
    <div className="flex flex-col h-full w-full text-[var(--theme-text)]">
      <LedgerTicker />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          active={section}
          onSelect={setSection}
          availableCount={availableCount}
          totalCount={engineList.length}
        />
        <main className="flex-1 min-w-0 overflow-auto custom-scrollbar p-6">
          {section === 'models' && <ModelsSection list={engineList} />}
          {section === 'prompt' && (
            <PromptSection
              intent={intent}
              setIntent={setIntent}
              refined={refined}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
          )}
          {section === 'output' && (
            <OutputSection
              spec={refined}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              published={published}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Re-export utilitaires pour les tests.
export { LedgerTicker };
