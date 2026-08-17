// src/apps/three-program/ThreeProgramApp.tsx
// Composant app pour les mini-programmes 3D installes dynamiquement.
//
// UN SEUL COMPOSANT, TROIS NIVEAUX :
//   - easy   : <iframe> vers une URL externe (threejs.org/examples, etc.)
//   - hard   : code three.js compile et execute au runtime (a venir)
//   - expert : bundle pre-compile signe (a venir)
//
// L'appId est de la forme `three:<slug>`. Le composant lit le manifest
// dans `useThreeAppStore`, branche sur `level`, et rend le bon composant.
//
// SANDBOX IFRAME :
//   `sandbox="allow-scripts allow-same-origin"` est le minimum pour
//   qu'un exemple three.js fonctionne (besoin de WebGL, de pointer
//   events, et generalement de localStorage pour le state du demo).
//   `allow-same-origin` est NECESSAIRE pour WebGL sur certains
//   navigateurs (Chrome refuse WebGL sans origin distincte). C'est
//   aussi pour ca que les exemples threejs.org sont servis en HTTPS.
//   Le risque : l'iframe peut acceder au localStorage de Coach OS via
//   `localStorage.getItem('coach-os-themes-v1')` etc. On l'accepte
//   pour le niveau easy — c'est la consequence du choix "iframe".
//   Le niveau hard (runtime compile) et expert (bundle signe)
//   n'auront pas ce probleme.

import { Box } from 'lucide-react';
import { useThreeAppStore, appIdPour } from '../../stores/threeApp.store';

/** Forme des props que WindowFrame injecte via openApp(id, name).
 *  On recupere le slug via `useThreeAppStore` directement — le shell.store
 *  ne stocke pas le manifest, juste l'appId. */
export interface ThreeProgramAppProps {
  /** L'appId virtuel 'three:<slug>'. */
  appId: string;
}

export function ThreeProgramApp({ appId }: ThreeProgramAppProps): import('react').ReactNode {
  // Extraire le slug : 'three:tearable' → 'tearable'.
  const slug = appId.startsWith('three:') ? appId.slice('three:'.length) : appId;
  const manifest = useThreeAppStore((s) => s.apps[slug]);

  if (!manifest) {
    // Cas rare : l'app a ete desinstalle alors que la fenetre est ouverte.
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
        <Box className="w-12 h-12 text-[var(--theme-text-dim)]" />
        <h3 className="text-base font-bold text-[var(--theme-text)]">Programme introuvable</h3>
        <p className="text-sm text-[var(--theme-text-dim)] max-w-xs">
          Ce mini-programme a ete desinstalle pendant que sa fenetre etait ouverte.
          Ferme-la et ouvre-en un autre depuis l'App Store.
        </p>
      </div>
    );
  }

  switch (manifest.level) {
    case 'easy':
      return <EasyIframe url={manifest.iframeUrl} />;
    case 'hard':
      return <HardPlaceholder />;
    case 'expert':
      return <ExpertPlaceholder />;
  }
}

function EasyIframe({ url }: { url?: string }): import('react').ReactNode {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
        <Box className="w-12 h-12 text-[var(--theme-text-dim)]" />
        <h3 className="text-base font-bold">URL manquante</h3>
        <p className="text-sm text-[var(--theme-text-dim)]">
          Le manifest de ce mini-programme n'a pas d'URL iframe.
        </p>
      </div>
    );
  }
  return (
    <iframe
      title="3D program"
      src={url}
      // allow-scripts : pour que le demo JS tourne.
      // allow-same-origin : WebGL exige une origin stable (Chrome refuse
      //   sinon). Le revers : l'iframe peut lire notre localStorage.
      //   On l'accepte pour le niveau easy — c'est inherent au choix iframe.
      // allow-pointer-lock : certains demos threejs bloquent le curseur.
      sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
      className="w-full h-full border-0 bg-[var(--theme-bg)]"
    />
  );
}

function HardPlaceholder(): import('react').ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
      <Box className="w-12 h-12 text-[var(--theme-text-dim)]" />
      <h3 className="text-base font-bold">Niveau "Hard" — a venir</h3>
      <p className="text-sm text-[var(--theme-text-dim)] max-w-md">
        Code three.js compile et execute au runtime. Le store est pret
        (`level: 'hard'`, `codeSource: '...'`), le composant viendra
        apres la validation du niveau easy.
      </p>
    </div>
  );
}

function ExpertPlaceholder(): import('react').ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
      <Box className="w-12 h-12 text-[var(--theme-text-dim)]" />
      <h3 className="text-base font-bold">Niveau "Expert" — a venir</h3>
      <p className="text-sm text-[var(--theme-text-dim)] max-w-md">
        Bundle pre-compile signe. La sidebar d'App Builder aura une
        troisieme page pour ce mode.
      </p>
    </div>
  );
}

/** Helper exporte : permet au caller (DesktopIcons, App Store, etc.)
 *  de retrouver l'appId virtuel d'un slug sans dupliquer la logique. */
export { appIdPour };
