/**
 * AssistantOverlay.tsx — le bureau de l'assistant.
 *
 * Avant : un seul personnage (un seul AssistantOverlay). Maintenant : un
 * AgentTile par agent actif, monte cote a cote sur le bureau.
 *
 * Le chargement du roster se fait au montage par fetch /api/agent/roster.
 * L'echec de fetch n'est pas catastrophique : l'utilisateur voit un bureau
 * vide, et la reglage (Settings > Assistant) reste utilisable une fois la
 * requete reussie. Le roster est mis a jour a chaque focus de fenetre pour
 * rattraper un demarrage a froid du serveur.
 *
 * Trois pieges connus (deja payes sur ce projet) :
 *  - le roster peut etre vide cote serveur : le bureau rend juste rien.
 *  - un select Zustand qui rend un tableau frais a chaque appel fait boucler
 *    React : on passe par `useShallow` pour les derives.
 *  - la position en dur `1180, 700` rendait le sprite invisible sous le bord
 *    bas : AgentTile borne sa propre position.
 */
import { useCallback, useEffect, useState } from 'react';
import { AgentTile } from './AgentTile';
import { useAssistantStore } from '../stores/assistant.store';

interface RosterResponse {
  agents: Array<{
    id: string;
    name: string;
    description: string;
    personnageId: string;
    backend: 'modele' | 'multica' | 'buzz';
    available: boolean;
    provider: string | null;
    buzzModel: string | null;
    multicaAgentId: string | null;
  }>;
}

export function AssistantOverlay() {
  const active = useAssistantStore((s) => s.active);
  const agents = useAssistantStore((s) => s.agents);
  const agentOrder = useAssistantStore((s) => s.agentOrder);
  // On ne rend que les agents POSES sur le bureau. `agentOrder` reste le
  // roster complet — il sert au menu de selection, pas a l'affichage.
  const agentsVisibles = useAssistantStore((s) => s.agentsVisibles);
  const hydraterRoster = useAssistantStore((s) => s.hydraterRoster);

  const toggleAgentBubble = useAssistantStore((s) => s.toggleAgentBubble);
  const setAgentBubbleOpen = useAssistantStore((s) => s.setAgentBubbleOpen);
  const setAgentPosition = useAssistantStore((s) => s.setAgentPosition);
  const appendAgentTurn = useAssistantStore((s) => s.appendAgentTurn);
  const clearAgentHistory = useAssistantStore((s) => s.clearAgentHistory);

  // Chargement du roster au montage + a chaque focus. Si le serveur est
  // indisponible, on garde ce qu'on a en memoire (probablement vide).
  const [rosterErreur, setRosterErreur] = useState<string | null>(null);

  const chargerRoster = useCallback(async () => {
    try {
      const r = await fetch('/api/agent/roster');
      if (!r.ok) {
        setRosterErreur(`Roster HTTP ${r.status}`);
        return;
      }
      const json = (await r.json()) as RosterResponse;
      hydraterRoster(json.agents);
      setRosterErreur(null);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setRosterErreur(`Roster injoignable : ${m}`);
    }
  }, [hydraterRoster]);

  useEffect(() => {
    void chargerRoster();
    const onFocus = () => void chargerRoster();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [chargerRoster]);

  if (!active) return null;

  // Ordre stable : on lit agentOrder (defini au moment de l'hydratation).
  // Chaque AgentTile est independant et monte son propre useChat / stream.
  return (
    <>
      {agentOrder.filter((id) => agentsVisibles.includes(id)).map((id) => {
        const agent = agents[id];
        if (!agent) return null;
        return (
          <AgentTile
            key={id}
            agent={agent}
            onToggleBubble={toggleAgentBubble}
            onSetBubbleOpen={setAgentBubbleOpen}
            onSetPosition={setAgentPosition}
            onAppendTurn={appendAgentTurn}
            onClearHistory={clearAgentHistory}
          />
        );
      })}
      {agentsVisibles.length === 0 && rosterErreur && (
        <div
          className="fixed z-[4500] left-4 bottom-4 rounded-lg px-3 py-2 text-[11px] shadow-md"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
          data-assistant-roster-error
        >
          {rosterErreur}
        </div>
      )}
    </>
  );
}