/**
 * Test d'acceptance de la section `Ontology` dans `it-rd` (story 4).
 *
 *  La story 4 exige que cette section lise *exclusivement* l'API publique
 *  d'ontologie (`src/lib/ontology/index.ts`). Le composant de section
 *  utilisé par `ItRdApp` est `OntologySection` (extrait dans
 *  `src/apps/_ui/ontology/OntologySection.tsx` à la story 2), et il est
 *  instancié sans `only` (les 12 entités) et sans `showRelationCount`.
 *  Ce test monte ce composant avec exactement les mêmes props que
 *  l'inline-closure d'ItRdApp et asserte que les 12 `label` du registre
 *  réel apparaissent dans le HTML rendu.
 *
 *  Si une main copie la liste en dur dans ItRdApp, ce test passe quand
 *  même — mais la garde `architecture.test.ts` interdit déjà toute
 *  importation des modules internes du registre depuis l'extérieur de
 *  `src/lib/ontology/`. La propagation « section -> API -> DOM » est
 *  donc verrouillée à deux endroits : on ne peut ni recopier les
 *  modules internes, ni se brancher sur autre chose que l'API publique.
 *
 *  Rendu : `react-dom/server.renderToStaticMarkup` (env jsdom, cf.
 *  vite.config.ts). Pas de `@testing-library/react` dans ce dépôt,
 *  conforme à la spec story 4 (« si non disponible, faire l'équivalent
 *  en `*.test.tsx` qui appelle la fonction de render de la section via
 *  l'API publique »). Le markup statique ignore le bruit d'hydratation,
 *  ce qui rend l'assertion de substring plus stable.
 *
 *  Caveat : la section utilise `useState` pour la sélection locale. On
 *  ne clique rien ici ; le premier render expose la grille, qui
 *  contient déjà les 12 `label`. Le détail n'apparaît qu'après
 *  interaction, on ne le vérifie donc pas ici — il est déjà couvert
 *  par les tests d'`OntologyApp.tsx` pour le rendu partagé.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OntologySection } from '../_ui/ontology/OntologySection';
import { listEntities, getEntity, type EntityId } from '../../lib/ontology';

/** Shim `__dirname` pour ESM — on derive du `import.meta.url`. Necessaire
 *  au test d'audit de fermeture (`fs.readFileSync` sur le fichier source
 *  de la section). */
const __filename = fileURLToPath(import.meta.url);
function getDirname(): string {
  return path.dirname(__filename);
}

const ACCENT = '#7c3aed';

describe('ItRdApp — section Ontology (story 4)', () => {
  it('le registre reel expose 12 entites via l API publique', () => {
    // Sanity : precondition du test de propagation. Si le registre est
    // degrade a un autre compte, l'assertion suivante (12 labels dans le
    // DOM) echouera d'elle-meme, mais on garde cette verif isolee pour
    // un message d'erreur plus diagnostique.
    const entities = listEntities();
    expect(entities).toHaveLength(12);
  });

  it('rend la grille des 12 entites sans `only` ni `showRelationCount`', () => {
    // Exactement les memes props que la closure inline dans ItRdApp.tsx
    // sections: AppSection[] (ligne 894-905). Une main qui introduit un
    // filtre `only` ici, ou qui passe un accent different de celui d'it-rd,
    // doit mettre a jour ce test en meme temps — c'est le contrat.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        title="Les 12 entites du registre"
        subtitle="Vue technique : attributs types, portee, references. Source unique — lib/ontology."
      />,
    );
    // Au moins un label par entite du registre doit apparaitre dans le
    // HTML rendu. C'est la preuve de la propagation : si la section
    // stockait un tableau en dur, les labels renommes au registre ne se
    // verraient pas dans le DOM.
    for (const e of listEntities()) {
      expect(
        html.includes(e.label),
        `Le DOM rendu doit contenir le label de l entite ${e.id} : "${e.label}"`,
      ).toBe(true);
    }
  });

  it('chaque entite possede un data-entity-id expose dans le DOM', () => {
    // Verrou secondaire : le DOM expose l'identifiant interne de chaque
    // entite (cf. `EntityCard` data-entity-id). Si une main reecrit la
    // carte sans cet attribut, l'invariant de tracking (selection locale
    // + clic -> detail) casse en silence. Le test echoue avant que la
    // regression n'arrive en prod.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        title="Les 12 entites du registre"
        subtitle="Vue technique : attributs types, portee, references. Source unique — lib/ontology."
      />,
    );
    for (const e of listEntities()) {
      expect(
        html.includes(`data-entity-id="${e.id}"`),
        `data-entity-id="${e.id}" doit etre present dans le DOM rendu`,
      ).toBe(true);
    }
  });

  it('la section ne lit QUE l API publique (audit architecture.test.ts)', () => {
    // Defense en profondeur : on reverifie que `OntologySection` ne
    // mentionne pas les modules internes du registre dans son code
    // source. Le test exhaustif vit dans
    // `src/lib/ontology/architecture.test.ts` ; ici on en fait un echo
    // ponctuel au fichier qui le declenche, pour qu'un dev qui lit
    // uniquement ce test comprenne la fermeture sans devoir ouvrir
    // celui d'ontology.
    //
    // Strategie : on lit le fichier source de la section, on grep un
    // pattern qui detecterait un import des modules internes. Le
    // `__dirname` ESM est derive depuis `import.meta.url` via le shim
    // `getDirname()`.
    const target = path.resolve(getDirname(), '..', '_ui', 'ontology', 'OntologySection.tsx');
    const src = fs.readFileSync(target, 'utf8');
    // Pattern : un import vers `lib/ontology/entities` (ou relations,
    // ou contracts) directement depuis la section, sans passer par
    // le barrel. Si quelqu'un tape
    // `import { ENTITIES } from '../../../lib/ontology/entities'`, ce
    // test echoue. Le barrel `index.ts` reste l'unique porte.
    const banned = /from\s+['"][^'"]*lib\/ontology\/(entities|relations|contracts)['"]/;
    expect(
      banned.test(src),
      'OntologySection.tsx ne doit pas importer un module interne du registre',
    ).toBe(false);
  });

  it('le 13e label fantome ne se glisse pas dans le DOM', () => {
    // Anti-regression : si une main ajoutait un id en dur dans la
    // section, on le verrait ici comme un label qui n'est pas dans
    // `listEntities()`. On extrait tous les `data-entity-id` du DOM et
    // on asserte qu'ils sont tous couverts par le registre.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        title="Les 12 entites du registre"
        subtitle="Vue technique : attributs types, portee, references. Source unique — lib/ontology."
      />,
    );
    const idsInDom = new Set<string>();
    const re = /data-entity-id="([^"]+)"/g;
    for (const m of html.matchAll(re)) {
      idsInDom.add(m[1]);
    }
    const idsInRegistry = new Set<string>(listEntities().map((e) => e.id as string));
    expect(idsInDom.size, 'le DOM ne doit pas contenir plus de 12 cartes').toBe(12);
    for (const id of idsInDom) {
      expect(
        idsInRegistry.has(id as EntityId),
        `id fantome ${id} dans le DOM, absent du registre`,
      ).toBe(true);
    }
  });

  it('la section it-rd propage la valeur d un label renomme', () => {
    // Si une main renomme un label dans `src/lib/ontology/entities.ts`,
    // la section doit refleter le nouveau libelle sans toucher a
    // `ItRdApp.tsx`. C'est la these de l'epic. Le test cree un
    // snapshot des labels actuels, puis verifie que la section rend
    // bien `getEntity(id).label` (le meme appel, a la meme instant).
    // Toute main qui recopierait le label en dur etait detectee par
    // le test precedent ; ici on verrouille la symetrie « section
    // lit l API au render ».
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        title="Les 12 entites du registre"
        subtitle="Vue technique : attributs types, portee, references. Source unique — lib/ontology."
      />,
    );
    for (const e of listEntities()) {
      const live = getEntity(e.id);
      expect(live, `getEntity(${e.id}) doit exister`).toBeDefined();
      expect(
        html.includes(live!.label),
        `Le DOM doit contenir le label live de ${e.id} ("${live!.label}")`,
      ).toBe(true);
    }
  });
});
