/**
 * Tests de l'app ontology — story 2 de l'epic couche-ontologie.
 *
 *  Couvre :
 *   (a) le module compile ;
 *   (b) `listEntities()` renvoie bien 12 entites ;
 *   (c) `validateRegistry()` renvoie 0 incoherence sur le registre
 *       actuel ;
 *   (d) `validate()` (helper pur extrait dans PATCH 3) — branches
 *       individuelles exercees via des surfaces synthetiques defectueuses.
 *       Les tests ne touchent JAMAIS `src/lib/ontology/` en ecriture :
 *       ils passent des objets locaux (EntityDef / Relation / contrat
 *       minimal) que le helper consomme. C'est precisement l'interet
 *       de la separation `validate(entities, relations, contracts)`
 *       vs `validateRegistry()` (qui passe par l'API publique) —
 *       patch review 3 (MEDIUM).
 */
import { describe, it, expect } from 'vitest';

import { listEntities, contractOf, relationsOf } from '../../lib/ontology';
import { validateRegistry, validate } from './OntologyApp';
import type { EntityDef, Relation, EntityId } from '../../lib/ontology';

describe('OntologyApp — module', () => {
  it('(a) le module compile et expose validateRegistry / validate comme helpers purs', () => {
    expect(typeof validateRegistry).toBe('function');
    expect(typeof validate).toBe('function');
  });

  it('(b) listEntities() retourne 13 entites', () => {
    const entities = listEntities();
    expect(entities).toHaveLength(13);
  });

  it('(c) validateRegistry() retourne 0 incoherence sur le registre actuel', () => {
    // La story 1 verrouille 12 entites / 12 contrats / 15-25 relations /
    // cardinalites dans l'union / refs resolues / verbe non vide /
    // identifiants uniques. On *reexecute* ces invariants cote UI (la
    // fermeture empeche d'importer `ontology.test.ts`) ; un retour vide
    // signifie que l'app peut afficher le panneau "coherent" sans
    // anomalie listee. Spec §Acceptance.
    const issues = validateRegistry();
    expect(issues, issues.map((i) => i.message).join(' ; ')).toEqual([]);
  });

  it('(b-bis) chaque entite expose un contrat non vide (sanity du helper)', () => {
    // Sanity check : `validateRegistry` repose sur `contractOf`. Ce
    // test ferme la boucle : pour chaque entite, `contractOf` rend un
    // contrat avec `triggers.length > 0` et `allowedActions.length > 0`.
    const entities = listEntities();
    for (const e of entities) {
      const c = contractOf(e.id);
      expect(c, `pas de contrat pour ${e.id}`).toBeDefined();
      expect(c!.triggers.length).toBeGreaterThan(0);
      expect(c!.allowedActions.length).toBeGreaterThan(0);
    }
  });
});

describe('validate() — branches individuelles (PATCH 3)', () => {
  // On construit des surfaces minimales mais conformes au type pour
  // chaque branche. Toutes les variantes defectueuses ci-dessous
  // partent d'un snapshot *local* du registre reel (cote test), jamais
  // d'une mutation du registre source. Le registre reste sous la
  // fermeture : on n'ecrit dans aucun fichier de `src/lib/ontology/`.

  /** Snapshot local du registre reel. Le helper `snapshot()` importe
   *  l'API publique en haut du module ; ici on l'utilise en interne
   *  pour hydrater une copie en JS plat (cote test). Aucune mutation
   *  du registre : on copie chaque champ en objet plain. */
  function snapshot(): {
    entities: EntityDef[];
    relations: Relation[];
    contracts: Record<EntityId, { triggers: string[]; allowedActions: string[] }>;
  } {
    const entities: EntityDef[] = listEntities().map((e) => ({
      id: e.id,
      label: e.label,
      description: e.description,
      attributes: e.attributes.map((a) => ({ ...a })),
    }));
    const seen = new Set<string>();
    const relations: Relation[] = [];
    // On utilise l'API publique ici (dans le test, on est sous la
    // fermeture de l'app, pas du test lui-meme) pour iterer les
    // relations via relationsOf.
    for (const e of entities) {
      for (const r of relationsOf(e.id)) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        relations.push({
          id: r.id,
          source: r.source,
          target: r.target,
          verb: r.verb,
          cardinality: r.cardinality,
        });
      }
    }
    const contracts = {} as Record<EntityId, { triggers: string[]; allowedActions: string[] }>;
    for (const e of entities) {
      const c = contractOf(e.id);
      contracts[e.id] = c
        ? { triggers: [...c.triggers], allowedActions: [...c.allowedActions] }
        : (undefined as unknown as { triggers: string[]; allowedActions: string[] });
    }
    return { entities, relations, contracts };
  }

  it('registre sain : 0 issue', () => {
    const s = snapshot();
    const issues = validate(s.entities, s.relations, s.contracts);
    expect(issues, issues.map((i) => i.message).join(' ; ')).toEqual([]);
  });

  it('compte d entites different de 13 -> au moins une issue `count`', () => {
    const s = snapshot();
    const truncated = s.entities.slice(0, 8);
    // 8 entites -> contratCount != 12 aussi, et au moins une relation
    // pointe dans le vide. On s'attend a voir AU MINIMUM le compte
    // d'entites ; on filtre ce qu'on cherche plutot que d'egalite
    // stricte (les autres defauts sont du bonus informatif).
    const issues = validate(truncated, s.relations, s.contracts);
    const countIssues = issues.filter((i) => i.kind === 'count');
    expect(countIssues.length).toBeGreaterThanOrEqual(1);
    // Le message source utilise une apostrophe courbe : `d'entites`.
    // On cherche une sous-chaine stable quel que soit le glyphe.
    expect(countIssues.some((i) => i.message.startsWith('Compte d'))).toBe(true);
  });

  it('compte de relations hors plage 15-25 -> issue `count`', () => {
    const s = snapshot();
    // On garde 1 seule relation ; 1 < 15 -> flag.
    const issues = validate(s.entities, s.relations.slice(0, 1), s.contracts);
    expect(
      issues.some((i) => i.kind === 'count' && i.message.includes('Compte de relations hors plage')),
      `issues observees : ${issues.map((i) => i.message).join(' ; ')}`,
    ).toBe(true);
  });

  it('compte de contrats different de 13 -> issue `count`', () => {
    const s = snapshot();
    // On retire un contrat -> contractCount = 11.
    const c = { ...s.contracts };
    const firstId = s.entities[0].id;
    delete c[firstId];
    const issues = validate(s.entities, s.relations, c);
    expect(
      issues.some((i) => i.kind === 'count' && i.message.includes('Compte de contrats')),
    ).toBe(true);
  });

  it('relation pendante (source inconnue) -> issue `integrity`', () => {
    const s = snapshot();
    // Cast `source` vers EntityId pour tromper le type ; le helper
    // travaille en runtime, donc le test est legitime.
    const broken: Relation = {
      id: 'broken-pendante',
      source: 'UnknownEntity' as unknown as EntityDef['id'],
      target: 'Organization',
      verb: 'tests',
      cardinality: '1-n',
    };
    const issues = validate(s.entities, [...s.relations, broken], s.contracts);
    expect(
      issues.some((i) => i.kind === 'integrity' && i.message.includes('broken-pendante')),
    ).toBe(true);
  });

  it('cardinalite hors union -> issue `shape`', () => {
    const s = snapshot();
    const broken: Relation = {
      id: 'broken-card',
      source: 'Organization',
      target: 'Membership',
      verb: 'has',
      cardinality: 'X-Y' as unknown as Relation['cardinality'],
    };
    const issues = validate(s.entities, [...s.relations, broken], s.contracts);
    expect(
      issues.some(
        (i) => i.kind === 'shape' && i.message.includes('broken-card') && i.message.includes('cardinality'),
      ),
      `issues : ${issues.map((i) => i.message).join(' ; ')}`,
    ).toBe(true);
  });

  it('verbe vide -> issue `shape`', () => {
    const s = snapshot();
    const broken: Relation = {
      id: 'broken-verb',
      source: 'Organization',
      target: 'Membership',
      verb: '',
      cardinality: '1-n',
    };
    const issues = validate(s.entities, [...s.relations, broken], s.contracts);
    expect(
      issues.some((i) => i.kind === 'shape' && i.message.includes('broken-verb') && i.message.includes('verbe')),
    ).toBe(true);
  });

  it('verbe whitespace uniquement -> issue `shape` (verrouille la garde `trim()`)', () => {
    // Verrouille la garde `r.verb.trim().length === 0` : sans `trim()`,
    // un verbe uniquement whitespace (`'   '`, `'\t'`, ...) passe la
    // garde `r.verb.length === 0` et laisse fuiter une relation mal
    // formee. Ce test aurait echoue avec l'ancien code (sans `trim()`).
    const s = snapshot();
    const broken: Relation = {
      id: 'broken-verb-ws',
      source: 'Organization',
      target: 'Membership',
      verb: '   \t  ',
      cardinality: '1-n',
    };
    const issues = validate(s.entities, [...s.relations, broken], s.contracts);
    expect(
      issues.some((i) => i.kind === 'shape' && i.message.includes('broken-verb-ws') && i.message.includes('verbe')),
      `issues : ${issues.map((i) => i.message).join(' ; ')}`,
    ).toBe(true);
  });

  it('attribut ref non resoluble -> issue `integrity`', () => {
    const s = snapshot();
    // On cherche la premiere entite ayant un attribut `ref` (la
    // premiere entite du registre — Organization — n'en a pas). On
    // prend Membership (index 1) qui a 2 refs : profile et organization.
    const mutated = s.entities.map((e, i) => {
      if (i !== 1) return e;
      const newAttrs = e.attributes.map((a) => ({ ...a }));
      const refIdx = newAttrs.findIndex((a) => a.type === 'ref');
      if (refIdx >= 0) {
        newAttrs[refIdx] = { ...newAttrs[refIdx], ref: 'UnknownRef' as unknown as EntityDef['id'] };
      }
      return { ...e, attributes: newAttrs };
    });
    const issues = validate(mutated, s.relations, s.contracts);
    expect(
      issues.some((i) => i.kind === 'integrity' && i.message.includes('ref=UnknownRef')),
      `issues : ${issues.map((i) => i.message).join(' ; ')}`,
    ).toBe(true);
  });

  it('doublon d identifiant d entite -> issue `integrity`', () => {
    const s = snapshot();
    // On duplique la premiere entite ; le Set EntityId devient incoherent.
    const dup: EntityDef = { ...s.entities[0], label: 'Dup' };
    const issues = validate([dup, ...s.entities], s.relations, s.contracts);
    expect(
      issues.some((i) => i.kind === 'integrity' && i.message.includes('en doublon')),
    ).toBe(true);
  });

  it('surface synthetique completement defectueuse -> issues non vides', () => {
    // Spec review patch 3 : "asserts the helper returns a non-empty
    // array of issues for a constructed broken input". On construit
    // la surface la plus defectueuse possible (0 entite, 0 relation,
    // 0 contrat) et on verifie que le helper remonte au moins une
    // issue — preuve qu'aucune branche ne court-circuite silencieusement.
    const issues = validate([], [], {} as Record<EntityId, { triggers: string[]; allowedActions: string[] }>);
    expect(issues.length).toBeGreaterThan(0);
  });
});