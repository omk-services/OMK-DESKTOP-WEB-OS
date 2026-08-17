// src/apps/app-store/AppStoreApp.tsx
// App Store — catalogue des mini-programmes 3D, inspire de la sidebar
// gauche de macro.com : trois sections (Easy / Hard / Expert), une
// grille droite par section.
//
// POURQUOI CETTE FORME :
//   1. Les trois sections correspondent aux trois niveaux du store
//      `threeApp.store.ts` (URL externe / code compile runtime / bundle
//      signe). C'est le meme contrat que tu m'as donne : Easy en
//      premier, Hard ensuite, Expert en 3e page de sidebar.
//   2. La sidebar a gauche est aussi le prototype du futur Sandbox
//      Gateway (8e adaptateur AI Native). Une fois validee ici, la
//      meme forme sert pour piloter les 8 domaines G1-G8 de Coach OS.
//   3. Pour l'instant, on n'a que Easy. Hard et Expert rendent un
//      placeholder explicite — pas un spinner, pas une zone vide.
//
// CE QUE CE COMPOSANT NE FAIT PAS :
//   - Il ne cree PAS un mini-programme (c'est le role d'App Builder,
//     pas en core ecrit).
//   - Il n'edite PAS le store directement : pour installer, il ouvre
//     l'app dans une fenetre via `openApp('three:<slug>', name)`.
//     Le mini-programme est deja dans le store (seed ou ajoute par
//     App Builder) ; App Store sert de vitrine, pas d'installateur.

import { useState } from 'react';
import { Globe, Code2, ShieldCheck, Box, Plus } from 'lucide-react';
import { useThreeAppStore, type ThreeAppLevel } from '../../stores/threeApp.store';
import { useShellStore } from '../../stores/shell.store';

interface Section {
  id: ThreeAppLevel;
  label: string;
  description: string;
  Icon: typeof Globe;
  /** Placeholder rendu quand la section n'a pas encore de programmes. */
  placeholder: string;
}

const SECTIONS: Section[] = [
  {
    id: 'easy',
    label: 'Easy',
    description: 'URL externe dans un iframe. Niveau par defaut.',
    Icon: Globe,
    placeholder: 'Aucun programme "Easy" pour l\'instant. App Builder publiera ici.',
  },
  {
    id: 'hard',
    label: 'Hard',
    description: 'Code three.js compile et execute au runtime.',
    Icon: Code2,
    placeholder: 'Niveau "Hard" en construction. Le runtime est prevu mais pas implemente.',
  },
  {
    id: 'expert',
    label: 'Expert',
    description: 'Bundle pre-compile, signe, charge en sandbox.',
    Icon: ShieldCheck,
    placeholder: 'Niveau "Expert" en construction. Signature et sandbox a specifier.',
  },
];

export function AppStoreApp(): import('react').ReactNode {
  const [section, setSection] = useState<ThreeAppLevel>('easy');
  const apps = useThreeAppStore((s) => s.apps);
  const openApp = useShellStore((s) => s.openApp);
  const installedSlugs = Object.keys(apps);

  // Filtrage par section : pour l'instant on n'a que 'easy' qui a des
  // programmes (le seed). Hard/Expert sont vides par construction.
  const visibles = Object.values(apps).filter((a) => a.level === section);
  const sectionActuelle = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div className="flex h-full w-full text-[var(--theme-text)]">
      {/* SIDEBAR — modele du futur Sandbox Gateway. Trois sections,
          navigation par onglets, icones + libelles. Pas de menu deroulant,
          pas de hover gere : le clic bascule, c'est tout. */}
      <aside className="w-[180px] shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)]/40 backdrop-blur-sm flex flex-col">
        <div className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
          Sections
        </div>
        <nav className="flex flex-col gap-0.5 px-1.5">
          {SECTIONS.map((s) => {
            const actif = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  actif
                    ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-text)] font-semibold'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]/60'
                }`}
              >
                <s.Icon className={`w-4 h-4 ${actif ? 'text-[var(--theme-accent)]' : ''}`} />
                <span className="text-[13px]">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-[var(--theme-border)]">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)] mb-2">
            Statut
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)] space-y-0.5">
            <div>Programmes installes : {installedSlugs.length}</div>
            <div>Sections actives : 1 / 3</div>
          </div>
        </div>
      </aside>

      {/* CONTENU DROIT — header de section + grille des programmes */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="px-6 pt-5 pb-4 border-b border-[var(--theme-border)]">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold">{sectionActuelle.label}</h1>
            <span className="text-xs text-[var(--theme-text-dim)] uppercase tracking-wider">
              {section}
            </span>
          </div>
          <p className="text-sm text-[var(--theme-text-muted)] mt-1">
            {sectionActuelle.description}
          </p>
        </header>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-6">
          {visibles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-[var(--theme-text-dim)]">
              <Box className="w-12 h-12" />
              <p className="text-sm max-w-md">{sectionActuelle.placeholder}</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {visibles.map((a) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => openApp(`three:${a.slug}`, a.name)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left transition-all hover:border-[var(--theme-accent)]/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Box className="w-5 h-5 text-[var(--theme-accent)]" />
                    <h3 className="font-semibold text-sm flex-1 truncate">{a.name}</h3>
                  </div>
                  <div className="text-[11px] text-[var(--theme-text-dim)]">
                    {a.category}
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-dim)] font-mono">
                    {a.level} · {a.slug}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" />
                    Open
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
