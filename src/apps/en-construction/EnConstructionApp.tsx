/**
 * EnConstructionApp — remplace l'interface d'une app pas encore prete.
 *
 * Pourquoi ce composant existe. Deux apps (SaaS Builder, App Store) sont
 * visibles sur le bureau mais ne sont pas livrables : le SaaS Builder
 * produit une specification que rien ne construit ni n'heberge, et le
 * niveau « Easy » de l'App Store embarque des URL externes que sept
 * editeurs sur huit refusent d'afficher en iframe.
 *
 * Le blocage se pose **dans le registre d'apps**, en remplacant le
 * `component` du manifeste. C'est le seul point de passage : toute
 * ouverture, d'ou qu'elle vienne (icone du bureau, dock, menu Apps,
 * `openApp` appele par une autre app), rend ce composant. Masquer un
 * bouton d'entree n'aurait ferme qu'une porte sur plusieurs.
 *
 * Consequence voulue : la sidebar « Sections » disparait avec le reste.
 * Elle est rendue **a l'interieur** de chaque app, pas par la coquille de
 * fenetre — donc remplacer le composant la retire, sans avoir a la
 * neutraliser separement.
 */

import { HardHat } from 'lucide-react';
import type { ComponentType } from 'react';

export interface PageEnConstructionOptions {
  /** Nom affiche de l'app bloquee. */
  nom: string;
  /** Une phrase, en francais simple : ce qui manque pour ouvrir. Pas de
   *  jargon, pas de promesse de date qu'on ne tiendra pas. */
  raison: string;
}

/**
 * Fabrique le composant a poser dans `registerApp({ component })`.
 *
 * Une fabrique plutot qu'un composant a props, parce que `AppManifest.component`
 * est un `ComponentType` sans props : la coquille de fenetre l'instancie
 * sans rien lui passer.
 */
export function creerPageEnConstruction(
  options: PageEnConstructionOptions,
): ComponentType {
  function PageEnConstruction(): import('react').ReactNode {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-5 px-8 text-center text-[var(--theme-text)]"
        data-testid="page-en-construction"
        data-app={options.nom}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)',
          }}
        >
          <HardHat className="h-8 w-8 text-[var(--theme-accent)]" aria-hidden />
        </div>

        <div className="flex flex-col gap-2 max-w-[440px]">
          <h1
            className="text-[22px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--theme-font-display)' }}
          >
            {options.nom} est en construction
          </h1>
          <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
            {options.raison}
          </p>
        </div>

        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
          Indisponible pour le moment
        </p>
      </div>
    );
  }

  PageEnConstruction.displayName = `PageEnConstruction(${options.nom})`;
  return PageEnConstruction;
}
