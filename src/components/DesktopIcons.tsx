/** DesktopIcons — real openable icons sitting on the wallpaper.
 *  Single click = select, double click = open the app window. */
import { useEffect, useState } from 'react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';
import { useAppVisibility } from '../stores/appVisibility.store';
import { HAUTEUR_DOCK } from './Dock';

/** Hauteur d'une case, calee sur la PLUS HAUTE : pastille 48 + libelle sur deux
 *  lignes + gouttieres. « People / Agents » et « Sales OS » passent a la
 *  ligne ; caler sur une case a une ligne sous-estimerait la rangee et ferait
 *  se chevaucher les libelles. */
const HAUTEUR_CASE = 104;
/** Barre du haut. */
const HAUTEUR_BARRE = 44;
/** Dock + respiration au-dessus. */
const MARGE_BASSE = HAUTEUR_DOCK + 12;

/** Nombre de rangees qui tiennent reellement dans la fenetre.
 *
 *  C'etait `repeat(7, max-content)` — sept rangees en dur. Sur un ecran haut ca
 *  passait ; dans un navigateur integre, ou la zone utile descend sous 600 px, la
 *  septieme rangee tombait hors cadre. Marketplace et Onboarding devenaient
 *  inatteignables, et dezoomer n'y changeait rien : le nombre de rangees ne
 *  dependait pas de la place disponible.
 *
 *  Les icones debordent maintenant en COLONNES, comme sur un bureau classique.
 */
function calculeRangees(): number {
  if (typeof window === 'undefined') return 7;
  const utile = window.innerHeight - HAUTEUR_BARRE - MARGE_BASSE;
  return Math.max(1, Math.floor(utile / HAUTEUR_CASE));
}

function useRangees(): number {
  const [rangees, setRangees] = useState(calculeRangees);
  useEffect(() => {
    const surRedimensionnement = () => setRangees(calculeRangees());
    window.addEventListener('resize', surRedimensionnement);
    return () => window.removeEventListener('resize', surRedimensionnement);
  }, []);
  return rangees;
}

export function DesktopIcons() {
  const openApp = useShellStore(s => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);
  const userHidden = useAppVisibility((s) => s.hidden);
  const rangees = useRangees();
  // Hide apps flagged with hidden: true (sister Drawbridge Task 1 2026-07-28) OR toggled off by the user.
  const apps = getAllApps().filter(a => !a.hidden && userHidden[a.id] !== true);

  return (
    <div
      className="absolute left-0 top-11 z-0 p-4 pointer-events-none"
      style={{ bottom: MARGE_BASSE }}
      onClick={() => setSelected(null)}
    >
      <div
        className="grid grid-flow-col gap-x-2 gap-y-2 content-start"
        style={{ gridTemplateRows: `repeat(${rangees}, max-content)` }}
      >
        {apps.map(app => {
          const Icon = app.icon;
          const accent = app.accent ?? 'var(--theme-accent)';
          const isSel = selected === app.id;
          return (
            <button
              key={app.id}
              onClick={(e) => { e.stopPropagation(); openApp(app.id, app.name); }}
              onDoubleClick={(e) => { e.stopPropagation(); openApp(app.id, app.name); }}
              title={`${app.name} — click to open`}
              className={`pointer-events-auto w-[86px] flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-xl transition-all group ${
                isSel ? 'bg-white/55 ring-1 ring-[var(--theme-accent)]/40' : 'hover:bg-white/35'
              }`}
            >
              <span
                className="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(41,37,36,0.4)] border border-white/60 group-hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(160deg, #ffffff, ${accent}22)` }}
              >
                <Icon className="w-6 h-6" style={{ color: accent }} />
              </span>
              {/* Pastille sous le libelle.
               *
               *  Le libelle etait en `text-stone-700` avec une ombre blanche :
               *  lisible sur l'ancienne scene pastel, illisible des que le fond
               *  est devenu une photo. Un texte clair sur un voile sombre tient
               *  sur n'importe quelle image — y compris celle que l'utilisateur
               *  televerse, qu'on ne peut pas connaitre a l'avance. */}
              <span className="max-w-[76px] rounded-md bg-black/45 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-tight text-white backdrop-blur-[2px]">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
