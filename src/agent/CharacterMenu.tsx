/** CharacterMenu — qui est pose sur le bureau.
 *
 *  C'est la Visibilite du bureau, mais pour les agents : une bascule par agent,
 *  le meme geste que pour les apps. Les douze s'ouvraient tous au demarrage —
 *  une foule qui recouvre le bureau alors qu'on en veut un.
 *
 *  La selection est persistee (cf. `agentsVisibles` dans le magasin) : au
 *  demarrage suivant on retrouve exactement ceux qu'on avait laisses. Au tout
 *  premier lancement, un seul.
 *
 *  Le choix du PERSONNAGE de chaque agent vit dans Settings > Assistant : c'est
 *  un reglage, pas un geste quotidien.
 */
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CHARACTERS } from './characters';
import { useAssistantStore } from '../stores/assistant.store';

export function CharacterMenu() {
  const [ouvert, setOuvert] = useState(false);
  const actif = useAssistantStore((s) => s.active);
  const toggleActive = useAssistantStore((s) => s.toggleActive);
  const agents = useAssistantStore((s) => s.agents);
  const agentOrder = useAssistantStore((s) => s.agentOrder);
  const agentsVisibles = useAssistantStore((s) => s.agentsVisibles);
  const basculerVisible = useAssistantStore((s) => s.basculerVisible);
  const seulementVisible = useAssistantStore((s) => s.seulementVisible);
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    window.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', dehors);
      window.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  const nb = agentsVisibles.length;

  return (
    <div className="relative" ref={boite}>
      <button
        onClick={() => setOuvert((o) => !o)}
        title={actif ? `${nb} agent${nb > 1 ? 's' : ''} sur le bureau` : 'Assistants éteints'}
        aria-label="Choisir les agents posés sur le bureau"
        aria-expanded={ouvert}
        className="h-7 px-2 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--theme-surface-hover)]"
        style={{ color: actif && nb > 0 ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
      >
        <Sparkles className="w-3 h-3" />
        <span className="hidden sm:inline">Agents{actif && nb > 0 ? ` · ${nb}` : ''}</span>
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-50 w-72 overflow-hidden rounded-xl border shadow-xl"
          style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
        >
          <div
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            Sur le bureau
          </div>

          <div className="max-h-80 overflow-y-auto pb-1">
            {agentOrder.length === 0 && (
              <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
                Aucun agent — le roster n'a pas répondu.
              </div>
            )}
            {agentOrder.map((id) => {
              const a = agents[id];
              if (!a) return null;
              const perso = CHARACTERS.find((c) => c.id === a.personnageId);
              const visible = agentsVisibles.includes(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[var(--theme-surface-hover)]"
                >
                  <button
                    role="menuitemcheckbox"
                    aria-checked={visible}
                    onClick={() => basculerVisible(id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title={visible ? 'Retirer du bureau' : 'Poser sur le bureau'}
                  >
                    {/* Interrupteur, comme la Visibilite du bureau. */}
                    <span
                      aria-hidden
                      className="relative h-4 w-7 shrink-0 rounded-full transition-colors"
                      style={{ background: visible ? 'var(--theme-accent)' : 'var(--panel-border)' }}
                    >
                      <span
                        className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
                        style={{ left: visible ? 14 : 2 }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12px] font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {a.name}
                      </span>
                      <span
                        className="block truncate text-[10px]"
                        style={{ color: 'var(--theme-text-dim)' }}
                      >
                        {perso?.name ?? a.personnageId} · {a.backend}
                        {a.backendAvailable ? '' : ' · indisponible'}
                      </span>
                    </span>
                  </button>

                  {/* « Seulement lui » — le geste le plus frequent quand on a
                      douze agents et qu'on en veut un. */}
                  <button
                    onClick={() => seulementVisible(id)}
                    title={`N'afficher que ${a.name}`}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-[var(--theme-surface-hover)]"
                    style={{ color: 'var(--theme-text-dim)' }}
                  >
                    seul
                  </button>
                </div>
              );
            })}
          </div>

          <div className="h-px" style={{ background: 'var(--panel-border)' }} />
          <button
            role="menuitem"
            onClick={() => toggleActive()}
            className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-medium transition-colors hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text)' }}
          >
            {actif ? 'Éteindre les assistants' : 'Allumer les assistants'}
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: actif ? 'var(--theme-accent)' : 'transparent' }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
