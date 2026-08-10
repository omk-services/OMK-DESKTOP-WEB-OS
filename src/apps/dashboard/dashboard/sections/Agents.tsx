/**
 * Agents — grid of agent cards. Click opens the AgentDetailPage in an
 * AppDetailOverlay (mounted as a sibling of AppFrame in DashboardApp).
 *
 * Theming: every surface / text / border reads from `--theme-*` tokens.
 * Status pills use semantic colors (green = healthy, amber = degraded,
 * red = tripped) via the Tone primitive, not Tailwind palette classes.
 *
 * Brief D (vague 3 2026-08-10) — CRUD on the agent collection. The previous
 * render read AGENTS from a static seed; the user had no way to add a new
 * agent. The list now reads from the CMS partition via `useDashboardAgents`,
 * and `CollectionRepeater` provides the canonical create / delete form.
 * Rich visual signal (gradient bar, sessions 24h, etc.) is preserved by
 * the `meta` slot of the FleetItemCard it renders.
 */
import { Bot, Sparkles } from 'lucide-react';
import { AGENTS_COLLECTION_ID, useDashboardAgents } from '../cmsAgents';
import { Panel, SectionTitle } from '../Primitives';
import { CollectionRepeater } from '../../../../components/cms/CollectionRepeater';

export function Agents({ onSelect }: { onSelect: (agentId: string) => void }) {
  // The hook hydrates and registers the dashboard_agents collection if it
  // isn't already. The list read by CollectionRepeater comes from the same
  // CMS partition, so create / delete here are immediately reflected.
  const agents = useDashboardAgents();

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Core"
        title="Agents"
        subtitle="Grille de fiches — chaque fiche ouvre un détail à onglets (invite, conversation, sessions, mémoires, connexions, réglages)."
        action={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" style={{ color: 'var(--theme-text-muted)' }} />
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
              {agents.length} actifs
            </span>
          </span>
        }
      />

      {agents.length === 0 ? (
        <Panel pad="p-10" className="flex flex-col items-center gap-3 text-center">
          <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text)' }}>
            Aucun agent pour l'instant
          </div>
          <p className="max-w-sm text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            Crée ton premier agent : il apparaîtra ici, et tu pourras éditer son invite système,
            ses réglages, et lui parler depuis la fiche de détail.
          </p>
        </Panel>
      ) : (
        <CollectionRepeater
          collectionId={AGENTS_COLLECTION_ID}
          onOpen={onSelect}
          allowCreate
          allowDelete
        />
      )}
    </div>
  );
}

// Suppress unused import warning for the kept icon (Bot was the card glyph;
// CollectionRepeater supplies its own per-card icon from the items map).
void Bot;
