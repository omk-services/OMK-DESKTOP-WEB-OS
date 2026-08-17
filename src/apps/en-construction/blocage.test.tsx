/**
 * Verrou : App Store et SaaS Builder restent bloques.
 *
 * Ces deux apps sont visibles sur le bureau mais ne sont pas livrables.
 * Le blocage tient a une seule ligne du registre (`component`), donc il
 * se defait par accident : un remaniement de `app-discovery.tsx`, un
 * conflit de fusion mal resolu, et les deux apps rouvrent sans que
 * personne ne s'en apercoive.
 *
 * Ce que le test verifie vraiment, et qui compte plus que la presence
 * d'un titre : que l'app **ne rend plus sa propre interface**. Une page
 * de construction posee par-dessus une sidebar toujours cliquable ne
 * serait pas un blocage. On controle donc aussi l'absence de la sidebar
 * « Sections » — c'est la demande exacte du proprietaire du produit :
 * « personne ne doit meme acceder aux sidebar ».
 *
 * Le test interroge `getApp()` et non un import direct du composant :
 * c'est le registre qui decide ce qui s'ouvre, donc c'est le registre
 * qu'il faut mesurer.
 *
 * Montage : `react-dom/client` + `act`, comme `toutes-les-apps.test.tsx`.
 * Pas de testing-library — elle n'est pas une dependance du projet, et un
 * verrou ne justifie pas d'en ajouter une.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

import '../../lib/app-discovery';
import { getApp } from '../../lib/app-registry';

/** Les deux apps bloquees, et le libelle attendu dans le titre. */
const BLOQUEES = [
  { id: 'app-store', nom: 'App Store' },
  { id: 'saas-builder', nom: 'SaaS Builder' },
] as const;

/** Une app temoin, qui doit continuer de s'ouvrir normalement. Sans elle,
 *  un test qui casserait tout le registre passerait au vert. */
const TEMOIN = 'dashboard';

let hote: HTMLDivElement | null = null;
let racine: Root | null = null;

function monter(Composant: React.ComponentType): HTMLDivElement {
  hote = document.createElement('div');
  document.body.appendChild(hote);
  racine = createRoot(hote);
  act(() => {
    racine!.render(React.createElement(Composant));
  });
  return hote;
}

afterEach(() => {
  if (racine) act(() => racine!.unmount());
  hote?.remove();
  racine = null;
  hote = null;
});

beforeAll(() => {
  // jsdom n'a ni ResizeObserver ni matchMedia. Sans ces bouchons, une app
  // saine serait declaree cassee — le harnais general documente deja ce
  // piege, on l'evite de la meme facon ici.
  const g = globalThis as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
});

describe('blocage des apps non livrables', () => {
  it.each(BLOQUEES)('$nom rend la page de construction', ({ id, nom }) => {
    const manifeste = getApp(id);
    expect(manifeste, `l'app "${id}" n'est plus dans le registre`).toBeDefined();

    const conteneur = monter(manifeste!.component);
    const page = conteneur.querySelector('[data-testid="page-en-construction"]');

    expect(page, `${nom} ne rend pas la page de construction`).not.toBeNull();
    expect(page!.getAttribute('data-app')).toBe(nom);
    expect(conteneur.textContent).toContain(`${nom} est en construction`);
  });

  it.each(BLOQUEES)('$nom ne rend plus sa sidebar Sections', ({ id, nom }) => {
    const conteneur = monter(getApp(id)!.component);

    // Chaque app rend sa propre sidebar, intitulee « Sections ». Si
    // l'intitule reapparait, c'est que le composant reel est revenu.
    expect(
      /sections/i.test(conteneur.textContent ?? ''),
      `${nom} affiche encore une sidebar « Sections » : le blocage ne tient pas.`,
    ).toBe(false);

    expect(
      conteneur.querySelector('aside'),
      `${nom} rend encore un <aside> : il reste une colonne de navigation.`,
    ).toBeNull();
  });

  it('une app non bloquee s ouvre toujours (temoin)', () => {
    const manifeste = getApp(TEMOIN);
    expect(manifeste).toBeDefined();
    const nomComposant = manifeste!.component.displayName ?? manifeste!.component.name;
    expect(
      nomComposant,
      "l'app temoin est bloquee elle aussi : le verrou mesure n'importe quoi",
    ).not.toMatch(/PageEnConstruction/);
  });

  it('les deux apps restent visibles dans le registre', () => {
    // Le blocage remplace le contenu ; il ne retire pas l'app du bureau.
    // Si on voulait les faire disparaitre, ce serait `hidden: true`, et ce
    // test dirait alors le contraire — volontairement.
    for (const { id } of BLOQUEES) {
      expect(getApp(id)?.hidden ?? false).toBe(false);
    }
  });
});
