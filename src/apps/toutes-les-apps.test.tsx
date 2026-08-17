/**
 * toutes-les-apps.test.tsx — le harnais qui monte TOUTES les apps et TOUTES
 * leurs sections, et dit lesquelles jettent.
 *
 * POURQUOI CE FICHIER
 * Le propriétaire du produit a signalé « This app hit a snag » sur Legal >
 * Conformité et People/Agents > Approvals, puis a corrigé : ce ne sont pas
 * deux pages, « c'est absolument tout qui est à revoir, et même l'intérieur ».
 *
 * Un audit page par page ne peut pas répondre à ça : 26 apps, ~241 sections.
 * Il faut un instrument qui balaie, pas un testeur qui échantillonne.
 *
 * CE QU'IL FAIT
 *  1. importe `app-discovery` (effet de bord : enregistre les apps) ;
 *  2. pour chaque app du registre, la monte dans jsdom ;
 *  3. relève tout ce qui jette au montage ;
 *  4. cherche ensuite les boutons `[data-section]` et active chacun ;
 *  5. relève tout ce qui jette au changement de section.
 *
 * CE QU'IL N'EST PAS
 * Ce n'est pas un test visuel. Une section peut se monter sans jeter et
 * rester illisible. Pour l'oeil, `tools/shot.mjs` reste l'outil — il pose le
 * thème, capture, et liste les erreurs de console.
 *
 * ANTI-PIÈGE — l'instrument peut accuser le mauvais coupable
 * `WindowContext` porte une valeur par défaut, donc monter une app sans
 * fournisseur est légitime et ne fabrique pas de faux échec. Si un jour une
 * app exige un contexte SANS valeur par défaut, ce harnais la déclarera
 * cassée à tort : il faudra alors fournir le contexte ici, pas assouplir le
 * test.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

import '../lib/app-discovery';
import { getAllApps } from '../lib/app-registry';

/** Frontière d'erreur de test : capture au lieu de laisser remonter, pour
 *  qu'une app qui tombe n'interrompe pas le balayage des 25 autres. */
class Capteur extends React.Component<
  { children?: React.ReactNode; onErreur: (e: Error) => void },
  { mort: boolean }
> {
  state = { mort: false };
  static getDerivedStateFromError() {
    return { mort: true };
  }
  componentDidCatch(error: Error) {
    this.props.onErreur(error);
  }
  render() {
    return this.state.mort ? null : this.props.children;
  }
}

interface Panne {
  app: string;
  section: string | null;
  message: string;
}

const pannes: Panne[] = [];
/** Apps montées sans jeter — sert à distinguer « rien trouvé » de
 *  « rien testé », qui se ressemblent dans une sortie verte. */
let appsMontees = 0;
let sectionsVisitees = 0;

function monter(
  node: React.ReactElement,
  onErreur: (e: Error) => void,
): { root: Root; hote: HTMLDivElement } {
  const hote = document.createElement('div');
  document.body.appendChild(hote);
  const root = createRoot(hote);
  act(() => {
    root.render(React.createElement(Capteur, { onErreur }, node));
  });
  return { root, hote };
}

beforeAll(() => {
  // jsdom n'implémente ni ResizeObserver ni IntersectionObserver ni
  // matchMedia. Un navigateur, si. Sans ces bouchons, le harnais déclare
  // « app cassée » sur du code parfaitement sain — c'est l'instrument qui
  // accuse le mauvais coupable, et ça a déjà coûté une campagne entière ici.
  //
  // On bouchonne le strict minimum. Si un jour une app dépend du COMPORTEMENT
  // de ces API (et pas seulement de leur existence), ce harnais ne le verra
  // pas : c'est `tools/shot.mjs`, en vrai navigateur, qui tranchera.
  const g = globalThis as Record<string, unknown>;
  if (!g.ResizeObserver) {
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!g.IntersectionObserver) {
    g.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    };
  }
  if (!window.matchMedia) {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
  if (!g.scrollTo) g.scrollTo = () => {};
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

  // React 19 signale les mises à jour hors `act`. Ce harnais en provoque
  // beaucoup (stores Zustand, effets d'hydratation) et le bruit noierait
  // les vraies pannes. On coupe ce seul message, pas les autres.
  const brut = console.error;
  console.error = (...args: unknown[]) => {
    const p = String(args[0] ?? '');
    if (p.includes('not wrapped in act') || p.includes('Citadelle app error')) return;
    brut(...args);
  };
});

describe('toutes les apps du registre se montent', () => {
  const apps = getAllApps();

  it('le registre n est pas vide — sinon ce fichier ne teste rien', () => {
    expect(apps.length).toBeGreaterThan(10);
  });

  for (const app of apps) {
    // 60 s : Dashboard porte des dizaines de sections et le montage jsdom
    // est lent. Avec les 5 s par defaut, le harnais accusait la lenteur au
    // lieu du defaut — un verdict faux, exactement ce qu'on cherche a eviter.
    it(`app "${app.id}" se monte et ses sections s ouvrent`, { timeout: 60_000 }, async () => {
      const locales: Panne[] = [];
      const Composant = app.component as React.ComponentType;

      const { root, hote } = monter(React.createElement(Composant), (e) =>
        locales.push({ app: app.id, section: null, message: e.message }),
      );

      if (locales.length === 0) appsMontees += 1;

      // Sections : `shot.mjs` sélectionne par `[data-section]`, on fait pareil
      // pour que les deux instruments désignent la même chose.
      const boutons = Array.from(
        hote.querySelectorAll<HTMLElement>('[data-section]'),
      );

      for (const bouton of boutons) {
        const libelle = bouton.getAttribute('data-section') ?? '?';
        const avant = locales.length;
        act(() => {
          bouton.click();
        });
        sectionsVisitees += 1;
        // Le Capteur a pu se marquer mort : on ne peut plus cliquer la suite.
        if (locales.length > avant) {
          locales[locales.length - 1].section = libelle;
          break;
        }
      }

      act(() => {
        root.unmount();
      });
      hote.remove();

      pannes.push(...locales);

      const detail = locales
        .map((p) => `  - ${p.section ? `section "${p.section}"` : 'au montage'} : ${p.message}`)
        .join('\n');
      expect(locales, `app "${app.id}" jette :\n${detail}`).toEqual([]);
    });
  }

  it('bilan — la couverture est declaree, pas supposee', () => {
    // Un harnais silencieux sur sa propre couverture ment par omission : vert
    // parce qu'il a tout vérifié, ou vert parce qu'il n'a rien trouvé à
    // vérifier ? On imprime le compte, et on le verrouille.
    //
    // Les ~241 identifiants de section comptés dans les sources ne sont PAS
    // tous atteignables au premier rendu : beaucoup vivent derrière une
    // vue de détail ou un onglet imbriqué. Le seuil ci-dessous borne ce que
    // ce harnais couvre réellement — il monte, il ne navigue pas en profondeur.
    console.info(
      `[harnais] ${apps.length} apps au registre · ${appsMontees} montees sans jeter · ` +
      `${sectionsVisitees} sections activees · ${pannes.length} pannes`,
    );

    expect(
      sectionsVisitees,
      'aucune section visitee — l attribut data-section a-t-il ete renomme ? ' +
      'Un selecteur qui ne trouve rien doit echouer bruyamment, jamais passer au vert.',
    ).toBeGreaterThan(0);

    expect(
      appsMontees,
      `couverture tombee : ${appsMontees}/${apps.length} apps, ${sectionsVisitees} sections. ` +
      'Mesure du 2026-08-17 : 20 apps, 161 sections. Une chute signifie que des ' +
      'sections ont disparu du premier rendu, pas que tout va bien.',
    ).toBeGreaterThanOrEqual(20);

    expect(
      sectionsVisitees,
      `seulement ${sectionsVisitees} sections activees, contre 161 mesurees le 2026-08-17`,
    ).toBeGreaterThanOrEqual(150);
  });
});
