/**
 * RotatingBackdrop — le decor qui change derriere le formulaire d'auth.
 *
 * Regle de conception cle : le formulaire est une ZONE SANCTUAIRE.
 * Tout ce qui est ici ne touche jamais a la position, la taille, le
 * contraste ou l'ordre de tabulation des champs. On :
 *   1. occupe toute la fenetre SAUF la zone centrale (le formulaire)
 *   2. empile 2 couches (A et B) et on les alterne par crossfade
 *   3. respecte prefers-reduced-motion : tout se fige sur la 1re variante
 *
 * On puise dans les 20 skins declares dans `dockSkins.ts` — reutiliser
 * l'existant evite d'inventer une 21e grammaire visuelle. Pour chaque
 * skin, on extrait juste les proprietes de fond ; les bordures / ombres
 * appartiennent au formulaire, pas au decor.
 *
 * Cycle : 8 secondes par defaut. Crossfade : 800 ms — un utilisateur qui
 * tape dans le champ courriel voit le fond passer sans secousse.
 */

import { useEffect, useRef, useState } from 'react';
import { DOCK_SKINS, type DockSkin } from '../../lib/dockSkins';

interface BackdropLayerProps {
  skin: DockSkin;
  zIndex: number;
}

function BackdropLayer({ skin, zIndex }: BackdropLayerProps): import('react').ReactNode {
  // `currentColor` permet a Apple logo d'heriter du bouton parent.
  // On utilise un wrapper pour la couleur de repli (le shorthand `background`
  // du skin peut faire reference a des variables CSS non resolues dans le
  // contexte de la page d'auth, et atterrir sur transparent).
  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-opacity ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        zIndex,
        opacity: zIndex === 10 ? 1 : 0,
        backgroundColor: skin.dark ? '#0f172a' : '#f5f3ef',
        transitionDuration: '1000ms',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: skin.background,
          backdropFilter: skin.backdrop || undefined,
          WebkitBackdropFilter: skin.backdrop || undefined,
        }}
      />
      {/* Halo decoratif : selon le skin, un degrade radial qui suggere un
          mouvement. Le formulaire passe par-dessus (z plus haut). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            skin.dark
              ? 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.06), transparent 60%)'
              : 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.45), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.05), transparent 55%)',
        }}
      />
    </div>
  );
}

export interface RotatingBackdropProps {
  /** Identifiant du skin a afficher au premier rendu. Si non fourni, on
   *  prend le skin courant du dock ; sinon, le 1er de la liste. */
  initialSkinId?: string;
  /** Duree en ms entre deux changements de skin. Defaut : 8000. */
  intervalMs?: number;
  /** Liste des skins a utiliser. Defaut : tous les 20 declares. */
  skins?: DockSkin[];
}

/** Renvoie l'index d'un skin a partir de son id, ou 0 si introuvable. */
function skinIndex(id: string | undefined, pool: DockSkin[]): number {
  if (!id) return 0;
  const idx = pool.findIndex((s) => s.id === id);
  return idx === -1 ? 0 : idx;
}

export function RotatingBackdrop({
  initialSkinId,
  intervalMs = 8000,
  skins = DOCK_SKINS,
}: RotatingBackdropProps): import('react').ReactNode {
  const startIndex = skinIndex(initialSkinId, skins);
  const [aIndex, setAIndex] = useState(startIndex);
  const [bIndex, setBIndex] = useState(startIndex);
  // Quel calque est devant : 'A' ou 'B'. On swap a chaque tick.
  const [top, setTop] = useState<'A' | 'B'>('A');
  // Quand l'utilisateur demande moins d'animation, on gele sur le 1er skin.
  const [reducedMotion, setReducedMotion] = useState(false);
  const cursorRef = useRef(startIndex);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = (): void => setReducedMotion(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const handle = window.setInterval(() => {
      cursorRef.current = (cursorRef.current + 1) % skins.length;
      const next = cursorRef.current;
      if (top === 'A') {
        setBIndex(next);
        // passer 'B' devant apres le tick suivant pour declencher la transition
        requestAnimationFrame(() => setTop('B'));
      } else {
        setAIndex(next);
        requestAnimationFrame(() => setTop('A'));
      }
    }, intervalMs);
    return () => window.clearInterval(handle);
  }, [top, reducedMotion, intervalMs, skins.length]);

  const skinA = skins[aIndex];
  const skinB = skins[bIndex];
  if (!skinA || !skinB) return null;

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <BackdropLayer skin={skinA} zIndex={top === 'A' ? 10 : 5} />
      <BackdropLayer skin={skinB} zIndex={top === 'B' ? 10 : 5} />
      {/* Pastille d'indication discrete : aide a la verification visuelle
          et donne un repere a l'utilisateur. */}
      {!reducedMotion && (
        <div
          aria-hidden
          className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] font-semibold"
          style={{
            zIndex: 20,
            color: skinA.dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
          }}
        >
          {skinA.label}
        </div>
      )}
    </div>
  );
}