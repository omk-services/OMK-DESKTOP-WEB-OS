/** CharacterMenu — le choix du personnage depuis la barre du haut.
 *
 *  Doublon assume avec la page Settings > Assistant : c'est le geste qu'on fait
 *  souvent, et RyOS le place au meme endroit. Settings garde les reglages
 *  (parole, position, effacer la conversation) ; ici on ne fait que changer de
 *  personnage et l'allumer ou l'eteindre.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { CHARACTERS } from './characters';
import { useAssistantStore } from '../stores/assistant.store';

export function CharacterMenu() {
  const [ouvert, setOuvert] = useState(false);
  const actif = useAssistantStore((s) => s.active);
  const characterId = useAssistantStore((s) => s.characterId);
  const toggleActive = useAssistantStore((s) => s.toggleActive);
  const setCharacter = useAssistantStore((s) => s.setCharacter);
  const boite = useRef<HTMLDivElement>(null);

  // Fermer au clic dehors et a Echap — sans quoi le menu reste ouvert sous les
  // fenetres et devient un piege a clics.
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

  const courant = CHARACTERS.find((c) => c.id === characterId);

  return (
    <div className="relative" ref={boite}>
      <button
        onClick={() => setOuvert((o) => !o)}
        title={actif ? `Assistant · ${courant?.name ?? characterId}` : 'Assistant éteint'}
        aria-label="Choisir le personnage de l'assistant"
        aria-expanded={ouvert}
        className="h-7 px-2 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--theme-surface-hover)]"
        style={{ color: actif ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
      >
        <Sparkles className="w-3 h-3" />
        <span className="hidden sm:inline">{actif ? courant?.name ?? 'Assistant' : 'Assistant'}</span>
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-xl border shadow-xl"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
          }}
        >
          <button
            role="menuitem"
            onClick={() => toggleActive()}
            className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-medium transition-colors hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text)' }}
          >
            {actif ? "Éteindre l'assistant" : "Allumer l'assistant"}
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: actif ? 'var(--theme-accent)' : 'transparent' }}
            />
          </button>

          <div className="h-px" style={{ background: 'var(--panel-border)' }} />

          <div className="max-h-72 overflow-y-auto py-1">
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                role="menuitemradio"
                aria-checked={c.id === characterId}
                onClick={() => { setCharacter(c.id); setOuvert(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--theme-surface-hover)]"
                style={{ color: 'var(--theme-text)' }}
              >
                <span className="w-3.5 shrink-0">
                  {c.id === characterId ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--theme-accent)' }} /> : null}
                </span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
