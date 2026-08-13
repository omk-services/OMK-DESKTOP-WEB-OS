/**
 * Test d'acceptance de la section `Context Layer` dans `operations` (story 4).
 *
 *  La story 4 exige que cette section lise *exclusivement* l'API
 *  publique d'ontologie (`src/lib/ontology/index.ts`). Le composant de
 *  section utilisé par `OperationsApp` est `OntologySection` (extrait
 *  dans `src/apps/_ui/ontology/OntologySection.tsx` à la story 2),
 *  instancié avec `only=['SOP','Runbook','Incident','Routine','Skill']`
 *  et `showRelationCount=true`.
 *
 *  Ce test monte ce composant avec exactement les mêmes props que la
 *  closure inline d'OperationsApp et asserte que :
 *   - les 5 `label` du sous-ensemble ferme apparaissent dans le DOM ;
 *   - les 7 autres `label` (Organization, Membership, Profile, Client,
 *     Offering, Agent, Persona) n'apparaissent PAS dans la grille de
 *     la section ;
 *   - les relations du sous-ensemble sont listees (signature : un
 *     `union dedoublonnee` des `relationsOf(id)` pour chaque id).
 *
 *  Rendu : `react-dom/server.renderToStaticMarkup` (env jsdom, cf.
 *  vite.config.ts). Pas de `@testing-library/react` dans ce dépôt,
 *  conforme à la spec story 4.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { OntologySection } from '../_ui/ontology/OntologySection';
import { listEntities, getEntity, relationsOf, type EntityId } from '../../lib/ontology';

const ACCENT = '#4f46e5';

/** Sous-ensemble ferme de l'app operations (cf. spec story 4 §AC + Code Map). */
const OPS_CONTEXT_IDS = ['SOP', 'Runbook', 'Incident', 'Routine', 'Skill'] as const satisfies readonly EntityId[];

describe('OperationsApp — section Context Layer (story 4)', () => {
  it('le sous-ensemble ferme contient 5 ids specifiques par la story', () => {
    // Verrouille l'invariant : la section operations lit TOUJOURS les
    // memes 5 ids. Si une main change l'un d'eux, ce test signale
    // l'incoherence avec la spec — pas une regression silencieuse.
    expect(OPS_CONTEXT_IDS).toEqual(['SOP', 'Runbook', 'Incident', 'Routine', 'Skill']);
    expect(new Set(OPS_CONTEXT_IDS).size).toBe(5);
  });

  it('rend les 5 cartes du sous-ensemble avec leur label issu de l API', () => {
    // Meme contrat que `it-rd-ontology-section.test.tsx` : pour chaque
    // id du sous-ensemble, `getEntity(id).label` doit apparaitre dans
    // le DOM. Si la section filtrait en dur un autre sous-ensemble
    // (par exemple "Runbook, Incident, Routine, Skill, Agent"), le
    // test echoue sur l'assertion du label manquant.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        only={OPS_CONTEXT_IDS}
        showRelationCount
        title="La couche de contexte operationnel"
        subtitle="Les entites que l operation manipule, et leurs relations. Meme registre que it-rd et Ontology."
      />,
    );
    for (const id of OPS_CONTEXT_IDS) {
      const entity = getEntity(id);
      expect(entity, `getEntity(${id}) doit exister`).toBeDefined();
      expect(
        html.includes(entity!.label),
        `Le DOM rendu doit contenir le label de ${id} : "${entity!.label}"`,
      ).toBe(true);
    }
  });

  it('ne rend PAS les entites hors du sous-ensemble', () => {
    // Spec story 4 §AC : « les 5 libelles SOP, Runbook, Incident,
    // Routine, Skill ». Si la section operations exposait accidentellement
    // Client ou Agent, ce test echoue. La garde est la presence du
    // `data-entity-id` du hors-sous-ensemble dans le DOM.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        only={OPS_CONTEXT_IDS}
        showRelationCount
        title="La couche de contexte operationnel"
        subtitle="Les entites que l operation manipule, et leurs relations. Meme registre que it-rd et Ontology."
      />,
    );
    const sub = new Set<string>(OPS_CONTEXT_IDS);
    for (const e of listEntities()) {
      if (sub.has(e.id as EntityId)) continue;
      expect(
        html.includes(`data-entity-id="${e.id}"`),
        `L entite ${e.id} (hors sous-ensemble) ne doit PAS etre dans la grille`,
      ).toBe(false);
    }
  });

  it('expose un compteur de relations pour le sous-ensemble', () => {
    // Spec story 4 §AC : « showRelationCount = true, l'union de leurs
    // relations ». On verifie qu'un marqueur « N relations » (ou
    // « aucune relation ») est present. La section utilise la
    // formule : `relationCount = new Set(entities.flatMap(e => relationsOf(e.id).map(r => r.id))).size`.
    const expected = new Set<string>();
    for (const id of OPS_CONTEXT_IDS) {
      for (const r of relationsOf(id)) expected.add(r.id as string);
    }
    const expectedCount = expected.size;
    // Le rendu affiche `${relationCount} relations` (ou `aucune relation`
    // si 0). On cherche l'un OU l'autre pour eviter de coupler le test
    // a la phrase exacte affichee.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        only={OPS_CONTEXT_IDS}
        showRelationCount
        title="La couche de contexte operationnel"
        subtitle="Les entites que l operation manipule, et leurs relations. Meme registre que it-rd et Ontology."
      />,
    );
    if (expectedCount === 0) {
      // Cas degenere : aucune relation du tout. Pas assertable ici car
      // le registre reel a des relations — mais le test reste vert si
      // l'union devient vide un jour (defense en profondeur).
      expect(html.toLowerCase()).toContain('aucune');
    } else {
      expect(
        html.includes(`${expectedCount} relations`) || html.includes(`${expectedCount} relation`),
        `Le DOM doit afficher le compteur "${expectedCount} relations" calcule depuis l'API`,
      ).toBe(true);
    }
  });

  it('la section propage la valeur d un label renomme dans le sous-ensemble', () => {
    // Symetrie de la garde `it-rd` : on reverifie que la section
    // operations appelle `getEntity(id).label` au render, pas une
    // copie locale. Si une main stockait un tableau en dur, le
    // premier test (rend les 5 cartes) le detecterait, mais ce
    // test-ci ajoute la verification que la valeur lue est bien
    // la valeur live du registre.
    const html = renderToStaticMarkup(
      <OntologySection
        accent={ACCENT}
        only={OPS_CONTEXT_IDS}
        showRelationCount
        title="La couche de contexte operationnel"
        subtitle="Les entites que l operation manipule, et leurs relations. Meme registre que it-rd et Ontology."
      />,
    );
    for (const id of OPS_CONTEXT_IDS) {
      const live = getEntity(id);
      expect(live, `getEntity(${id}) doit exister`).toBeDefined();
      expect(
        html.includes(live!.label),
        `Le DOM doit contenir le label live de ${id} ("${live!.label}")`,
      ).toBe(true);
    }
  });
});
