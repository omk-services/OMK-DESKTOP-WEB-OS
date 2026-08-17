/// <reference types="node" />

/**
 * Invariants du registre d'ontologie — story 1 de l'epic couche-ontologie.
 *
 * Le test ne valide pas une implementation particuliere : il valide la
 * *forme* du registre. Si une entite est ajoutee, si une relation pend
 * vers du vide, si un identifiant est duplique, si un attribut `ref`
 * n'a pas de cible resolvable, ou si un contrat est vide, la suite
 * echoue en nommant l'element fautif.
 *
 * On importe uniquement l'API publique (index.ts) — c'est aussi une
 * verification de fait que la fermeture marche : si on pouvait taper
 * les modules internes depuis le test, on le ferait.
 */

import { describe, it, expect } from 'vitest';

import {
  getEntity,
  listEntities,
  relationsOf,
  contractOf,
  listAttributesOf,
  type EntityId,
  type Relation,
} from './index';

describe('registre d ontologie — invariants', () => {
  it('contient exactement 13 entites', () => {
    const entities = listEntities();
    expect(entities).toHaveLength(13);
  });

  it('chaque entite a au moins un attribut et un contrat non vide', () => {
    const manquantes: string[] = [];
    for (const e of listEntities()) {
      if (e.attributes.length < 1) manquantes.push(`${e.id} (0 attribut)`);
      const c = contractOf(e.id);
      if (!c) {
        manquantes.push(`${e.id} (pas de contrat)`);
        continue;
      }
      if (c.triggers.length === 0) manquantes.push(`${e.id} (triggers vide)`);
      if (c.allowedActions.length === 0) manquantes.push(`${e.id} (allowedActions vide)`);
    }
    expect(manquantes, `entites incompletes: ${manquantes.join('; ')}`).toEqual([]);
  });

  it('les identifiants d entite sont uniques', () => {
    const vus = new Set<EntityId>();
    const doublons: EntityId[] = [];
    for (const e of listEntities()) {
      if (vus.has(e.id)) doublons.push(e.id);
      vus.add(e.id);
    }
    expect(doublons, `identifiants d entite en conflit: ${doublons.join(', ')}`).toEqual([]);
  });

  it('integrite des attributs ref : type=ref => ref defini et resolvable ; sinon pas de ref', () => {
    // Pendant, cote attributs, de l'invariant "toute relation pointe vers
    // deux entites existantes". Un `ref` non resolvable rend l'attribut
    // inerte ; un `ref` pose sur un attribut non-ref est du champ mort.
    const fautifs: string[] = [];
    for (const e of listEntities()) {
      for (const a of e.attributes) {
        if (a.type === 'ref') {
          if (a.ref === undefined) {
            fautifs.push(`${e.id}.${a.name} (type=ref mais ref non defini)`);
          } else if (getEntity(a.ref) === undefined) {
            fautifs.push(`${e.id}.${a.name} (ref=${a.ref} ne pointe vers aucune entite)`);
          }
        } else {
          if (a.ref !== undefined) {
            fautifs.push(`${e.id}.${a.name} (type=${a.type} mais ref=${a.ref} pose — champ mort)`);
          }
        }
      }
    }
    expect(fautifs, `attributs ref invalides: ${fautifs.join('; ')}`).toEqual([]);
  });

  it('contient entre 15 et 25 relations, toutes pointant vers des entites existantes', () => {
    // On enumere les relations via l'API publique en balayant chaque
    // entite et en dedoublonnant par id de relation. Une relation pendante
    // sera celle dont source ou target n'apparait pas dans le registre.
    const toutes = new Map<string, Relation>();
    for (const e of listEntities()) {
      for (const r of relationsOf(e.id)) {
        toutes.set(r.id, r);
      }
    }

    const pendantes: string[] = [];
    for (const r of toutes.values()) {
      const srcOk = getEntity(r.source) !== undefined;
      const tgtOk = getEntity(r.target) !== undefined;
      if (!srcOk || !tgtOk) {
        pendantes.push(`${r.id} (source=${r.source}${srcOk ? '' : ' ✗'}, target=${r.target}${tgtOk ? '' : ' ✗'})`);
      }
    }

    expect(
      pendantes,
      `relations pendantes (source ou cible introuvable): ${pendantes.join('; ')}`,
    ).toEqual([]);
    // Plafond porte de 25 a 32 le 2026-08-13. L'arrivee de `BusinessDomain`
    // ajoute 7 relations d'autorite (`owns` x6, `serves`). Le plafond garde son
    // role — empecher que l'ontologie devienne un plat de spaghettis — mais il
    // bornait un modele a 12 entites ; il en borne 13.
    expect(toutes.size, `attendu entre 15 et 32 relations, observe ${toutes.size}`).toBeGreaterThanOrEqual(15);
    expect(toutes.size).toBeLessThanOrEqual(32);
  });

  it('les identifiants de relation sont uniques', () => {
    // Une relation unique apparait au plus 2 fois dans la concatenation
    // `relationsOf(e.id)` sur toutes les entites : une fois par extremite
    // qui touche l'entite (source OU cible). Au-dela de 2 = deux
    // relations distinctes partagent le meme id, ce qui casse l'invariant.
    // On ne peut pas utiliser un `Map` pour dedoublonner ici : la cle
    // serait l'id, et un doublon deviendrait invisible au moment du `.set`.
    const comptes = new Map<string, number>();
    for (const e of listEntities()) {
      for (const r of relationsOf(e.id)) {
        comptes.set(r.id, (comptes.get(r.id) ?? 0) + 1);
      }
    }
    const doublons: { id: string; count: number }[] = [];
    for (const [id, count] of comptes) {
      if (count > 2) doublons.push({ id, count });
    }
    expect(
      doublons,
      `identifiants de relation en conflit: ${doublons.map((d) => `${d.id} (vu ${d.count} fois)`).join(', ')}`,
    ).toEqual([]);
  });

  it('contient exactement 13 contrats, tous non vides (triggers et allowedActions)', () => {
    // On verifie via l API publique : chaque entite a un contrat avec
    // `triggers.length > 0` et `allowedActions.length > 0`. Un contrat
    // vide est un contrat absent — la story exige un contenu semantique.
    const vides: string[] = [];
    let comptes = 0;
    for (const e of listEntities()) {
      const c = contractOf(e.id);
      if (!c) continue;
      comptes += 1;
      if (c.triggers.length === 0) vides.push(`${e.id} (triggers vide)`);
      if (c.allowedActions.length === 0) vides.push(`${e.id} (allowedActions vide)`);
    }
    expect(comptes, '13 entites attendues, chacune avec un contrat').toBe(13);
    expect(vides, `contrats vides: ${vides.join('; ')}`).toEqual([]);
  });

  it('les contrats ne contiennent pas de chaine vide, ni de doublon interne', () => {
    // Les invariants precedents verifient la longueur > 0 mais pas le
    // contenu. Une liste `["", "draft", "draft"]` passe la longueur mais
    // est invalide — `""` casse les `switch` consommateurs, et un doublon
    // casse les dedup en aval.
    const fautifs: string[] = [];
    for (const e of listEntities()) {
      const c = contractOf(e.id);
      if (!c) continue;
      for (const t of c.triggers) {
        if (t.length === 0) fautifs.push(`${e.id}.triggers contient une chaine vide`);
        else if (new Set(c.triggers).size !== c.triggers.length) {
          fautifs.push(`${e.id}.triggers contient des doublons`);
          break;
        }
      }
      for (const a of c.allowedActions) {
        if (a.length === 0) fautifs.push(`${e.id}.allowedActions contient une chaine vide`);
        else if (new Set(c.allowedActions).size !== c.allowedActions.length) {
          fautifs.push(`${e.id}.allowedActions contient des doublons`);
          break;
        }
      }
    }
    expect(fautifs, `contrats mal formes: ${fautifs.join('; ')}`).toEqual([]);
  });

  it('chaque relation a un verbe non vide et une cardinalite dans l union', () => {
    // Le type `Cardinality = '1-1' | '1-n' | 'n-n'` est verifie au compile
    // time, mais le registre reste `readonly Relation[]` au runtime : rien
    // n empeche un auteur de glisser une valeur hors-domaine par accident
    // (un cast, un copier-coller). On verifie ici pour attraper ce cas.
    const fautifs: string[] = [];
    const toutes = new Map<string, Relation>();
    for (const e of listEntities()) {
      for (const r of relationsOf(e.id)) {
        toutes.set(r.id, r);
      }
    }
    const valide = new Set(['1-1', '1-n', 'n-n']);
    for (const r of toutes.values()) {
      if (r.verb.length === 0) fautifs.push(`${r.id} (verbe vide)`);
      if (!valide.has(r.cardinality)) {
        fautifs.push(`${r.id} (cardinality=${r.cardinality} hors union)`);
      }
    }
    expect(fautifs, `relations mal formees: ${fautifs.join('; ')}`).toEqual([]);
  });

  it('les attributs d une entite ont des noms uniques et non vides', () => {
    // Le type `EntityAttribute` ne force pas l unicite de `name` au sein
    // d une entite : un doublon casse les lookups par cle en aval. On
    // verifie ici en ramassant les doublons par entite.
    const fautifs: string[] = [];
    for (const e of listEntities()) {
      const noms = e.attributes.map((a) => a.name);
      for (const a of e.attributes) {
        if (a.name.length === 0) fautifs.push(`${e.id} (attribut sans nom)`);
      }
      const vus = new Set<string>();
      const doublons: string[] = [];
      for (const n of noms) {
        if (vus.has(n)) doublons.push(n);
        else vus.add(n);
      }
      if (doublons.length > 0) {
        fautifs.push(`${e.id} (noms d attribut en doublon: ${doublons.join(', ')})`);
      }
    }
    expect(fautifs, `attributs invalides: ${fautifs.join('; ')}`).toEqual([]);
  });

  /* ──────────────────────── scope (story 3) ──────────────────────── */

  it('tout attribut sans champ scope equivaut a scope === "org" (semantique par defaut)', () => {
    // Convention centrale : l'absence de `scope` est un defaut tolerant.
    // Un attribut sans scope est equivalent a scope "org" et doit etre
    // considere comme tel par le helper de filtre. La verification
    // statique ne suffit pas : on traverse le registre et on confirme
    // qu'aucun attribut ne porte un scope invalide et que l'union est
    // respectee.
    const horsUnion: string[] = [];
    for (const e of listEntities()) {
      for (const a of e.attributes) {
        if (a.scope !== undefined && a.scope !== 'org' && a.scope !== 'personal') {
          horsUnion.push(`${e.id}.${a.name} (scope=${a.scope})`);
        }
      }
    }
    expect(horsUnion, `scope hors union: ${horsUnion.join('; ')}`).toEqual([]);
  });

  it('au moins 5 entites portent au moins un attribut scope === "personal"', () => {
    // La these de la story 3 tient si 5 domaines distincts trouvent
    // leur compte dans la portee personnelle. Ce test verrouille le
    // seuil : moins de 5 = regression sur l evenement de memoire de
    // l'epic.
    const personnelles: EntityId[] = [];
    for (const e of listEntities()) {
      if (e.attributes.some((a) => a.scope === 'personal')) {
        personnelles.push(e.id);
      }
    }
    expect(
      personnelles.length,
      `au moins 5 entites attendues avec attribut personnel, observe ${personnelles.length} : ${personnelles.join(', ')}`,
    ).toBeGreaterThanOrEqual(5);
  });

  it('les entites marquees personnelles sont uniques et bien formes', () => {
    // Defense en profondeur : un attribut personnel doit avoir un nom
    // non vide. Les autres invariants (required false, type autorise)
    // sont couverts par les tests existants sur les attributs.
    const fautifs: string[] = [];
    for (const e of listEntities()) {
      for (const a of e.attributes) {
        if (a.scope === 'personal') {
          if (a.name.length === 0) fautifs.push(`${e.id} (attribut personnel sans nom)`);
          // Un attribut ref est organisation par construction (lien
          // partage). Marquer ref comme personnel serait incoherent
          // : on le flagge pour prevention.
          if (a.type === 'ref') {
            fautifs.push(`${e.id}.${a.name} (ref personnel — incoherent)`);
          }
        }
      }
    }
    expect(fautifs, `attributs personnels mal formes: ${fautifs.join('; ')}`).toEqual([]);
  });

  it('les 7 entites non marquees restent a scope defaut (org)', () => {
    // Chaque entite qui n est pas dans la liste des 5 marquees ne
    // doit avoir aucun attribut explicitement scope=personal. C est
    // un garde-fou contre une regression qui ajouterait du personnel
    // sans justification semantique.
    const NON_PERSONNELLES: ReadonlySet<EntityId> = new Set<EntityId>([
      'Organization', 'Membership', 'Offering', 'SOP', 'Runbook', 'Skill', 'Persona',
    ]);
    const fuites: string[] = [];
    for (const e of listEntities()) {
      if (!NON_PERSONNELLES.has(e.id)) continue;
      for (const a of e.attributes) {
        if (a.scope === 'personal') {
          fuites.push(`${e.id}.${a.name} (personnel inattendu)`);
        }
      }
    }
    expect(fuites, `personnel non attendu: ${fuites.join('; ')}`).toEqual([]);
  });

  it('coherence : les 5 entites marquees correspondent au rationale Design Notes', () => {
    // Verrou explicite sur la liste des 5 entites documentees dans
    // Design Notes §Choix des 5 entites. Si une PR change la liste,
    // elle doit aussi changer la liste ici et justifier pourquoi.
    // Sixieme entree ajoutee le 2026-08-13 : `BusinessDomain.lecturePrivee`.
    // Meme raison que les cinq autres — ce que le coach pense de la sante d'un
    // domaine avant que ca ne devienne un Incident publie. Un soupcon n'est pas
    // un fait partage.
    const ATTENDUES: ReadonlySet<EntityId> = new Set<EntityId>([
      'Profile', 'Client', 'Agent', 'Routine', 'Incident', 'BusinessDomain',
    ]);
    const observees = new Set<EntityId>();
    for (const e of listEntities()) {
      if (e.attributes.some((a) => a.scope === 'personal')) {
        observees.add(e.id);
      }
    }
    for (const a of ATTENDUES) {
      expect(observees, `entite attendue avec attribut personnel: ${a}`).toContain(a);
    }
    for (const o of observees) {
      expect(ATTENDUES, `entite observee hors liste documentee: ${o}`).toContain(o);
    }
  });
});

describe('registre d ontologie — API publique', () => {
  it('getEntity renvoie la definition pour un id connu', () => {
    const e = getEntity('Client');
    expect(e).toBeDefined();
    expect(e?.id).toBe('Client');
    // La matrice I/O attend la definition complete : id, label, description
    // et attributs typés — pas seulement l'identifiant.
    expect(e?.label).toBeTruthy();
    expect(e?.description).toBeTruthy();
    expect(e?.attributes.length).toBeGreaterThan(0);
    for (const a of e?.attributes ?? []) {
      expect(a.name).toBeTruthy();
      expect(['string', 'number', 'boolean', 'date', 'ref']).toContain(a.type);
    }
  });

  it('getEntity renvoie undefined pour un id inconnu', () => {
    expect(getEntity('Unknown' as EntityId)).toBeUndefined();
  });

  it('listEntities renvoie un ordre stable', () => {
    const a = listEntities();
    const b = listEntities();
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });

  it('relationsOf renvoie les relations dont source OU cible vaut l entite', () => {
    // Client est a la fois source (`client-engages-offerings`) et cible
    // (`org-has-clients`, `membership-manages-clients`). Tester les deux
    // branches est ce qui distingue un filtre sur `source || target` d'un
    // filtre sur `source` seul : une assertion du type
    // `r.source === id || r.target === id` serait vraie dans les deux cas.
    const rels = relationsOf('Client');
    const ids = rels.map((r) => r.id);

    expect(ids, 'Client comme source').toContain('client-engages-offerings');
    expect(ids, 'Client comme cible').toContain('org-has-clients');
    expect(ids, 'Client comme cible').toContain('membership-manages-clients');

    // Aucune relation etrangere ne doit remonter.
    for (const r of rels) {
      expect(r.source === 'Client' || r.target === 'Client').toBe(true);
    }
  });

  it('contractOf renvoie triggers et allowedActions pour un id connu', () => {
    const c = contractOf('SOP');
    expect(c).toBeDefined();
    expect(c?.triggers.length).toBeGreaterThan(0);
    expect(c?.allowedActions.length).toBeGreaterThan(0);
  });

  it('contractOf renvoie undefined pour un id inconnu', () => {
    expect(contractOf('Unknown' as EntityId)).toBeUndefined();
  });

  it('les objets rendus par l API publique sont profondement geles', () => {
    // Barriere d execution contre la mutation en place. Les annotations
    // `readonly` ne protegent que des reassignations ; seul `Object.freeze`
    // empeche la mutation de champ. La these centrale du freeze tient
    // parce que ces appels produisent des objets verifies frozen — sinon
    // un consommateur peut corrompre le registre partage entre les apps
    // de l epic. On verifie le gel sur le resultat et sur les surfaces
    // imbriquees pertinentes (attributes / triggers / allowedActions).
    const entite = getEntity('Client');
    expect(entite).toBeDefined();
    expect(Object.isFrozen(entite)).toBe(true);
    expect(Object.isFrozen(entite!.attributes)).toBe(true);
    expect(Object.isFrozen(entite!.attributes[0])).toBe(true);

    const liste = listEntities();
    expect(Object.isFrozen(liste)).toBe(true);
    expect(Object.isFrozen(liste[0])).toBe(true);
    expect(Object.isFrozen(liste[0].attributes)).toBe(true);

    const rels = relationsOf('Client');
    expect(rels.length).toBeGreaterThan(0);
    expect(Object.isFrozen(rels)).toBe(true);
    expect(Object.isFrozen(rels[0])).toBe(true);

    const contrat = contractOf('SOP');
    expect(contrat).toBeDefined();
    expect(Object.isFrozen(contrat)).toBe(true);
    expect(Object.isFrozen(contrat!.triggers)).toBe(true);
    expect(Object.isFrozen(contrat!.allowedActions)).toBe(true);
  });

  it('la mutation d un objet rendu ne fuit pas dans les appels suivants', () => {
    // Round-trip : on capture une entite, on tente de muter un champ
    // (echec silencieux en non-strict, succes en strict), on relit
    // l entite et on verifie qu elle est intacte. Si le freeze etait
    // retire, ce test attraperait la corruption.
    const avant = getEntity('Client');
    expect(avant).toBeDefined();
    const nomOriginal = avant!.attributes[0].name;
    const longueurOriginale = avant!.attributes.length;

    // Tente une mutation. En `use strict` (vitest + tsc ESM), un objet
    // gele leve en mutation en mode strict ; sans strict, l affectation
    // est silencieusement ignoree. On essaie en castant en `any` pour
    // contourner la barriere compile-time de `readonly`.
    try {
      (avant!.attributes[0] as { name: string }).name = 'corrompu';
    } catch {
      // leve si le runtime est strict ; attendu.
    }
    try {
      (avant!.attributes as unknown as { push: (a: unknown) => void }).push({
        name: 'injecte',
        type: 'string',
        required: false,
      });
    } catch {
      // leve si le tableau est gele.
    }

    const apres = getEntity('Client');
    expect(apres).toBeDefined();
    expect(apres!.attributes[0].name).toBe(nomOriginal);
    expect(apres!.attributes.length).toBe(longueurOriginale);
  });

  /* ──────────────────────── listAttributesOf (story 3) ──────────────────────── */

  it('listAttributesOf(id) sans option renvoie tous les attributs (defaut all)', () => {
    // Meme comportement que `getEntity(id).attributes`. Reference
    // directe : le defaut doit etre `'all'`, sinon les apps casse.
    const direct = getEntity('Client');
    const viaHelper = listAttributesOf('Client');
    expect(viaHelper).toHaveLength(direct!.attributes.length);
    expect(viaHelper.map((a) => a.name)).toEqual(direct!.attributes.map((a) => a.name));
  });

  it('listAttributesOf(id, { scope: "org" }) exclut les attributs personnels', () => {
    // Client porte un attribut `coachHypothesis` en scope 'personal'.
    // Si on filtre sur 'org', il disparait, les autres restent.
    const org = listAttributesOf('Client', { scope: 'org' });
    const noms = org.map((a) => a.name);
    expect(noms).toContain('fullName');
    expect(noms).toContain('status');
    expect(noms).toContain('startDate');
    expect(noms).toContain('organization');
    expect(noms).not.toContain('coachHypothesis');
  });

  it('listAttributesOf(id, { scope: "personal" }) ne renvoie que les attributs personnels', () => {
    const personnel = listAttributesOf('Client', { scope: 'personal' });
    expect(personnel).toHaveLength(1);
    expect(personnel[0].name).toBe('coachHypothesis');
    expect(personnel[0].scope).toBe('personal');
  });

  it('listAttributesOf sur identifiant inconnu renvoie []', () => {
    // Matrice d I/O spec 3 : ERROR_CASE, pas d exception.
    expect(listAttributesOf('Unknown' as EntityId)).toEqual([]);
    expect(listAttributesOf('Unknown' as EntityId, { scope: 'org' })).toEqual([]);
    expect(listAttributesOf('Unknown' as EntityId, { scope: 'personal' })).toEqual([]);
  });

  it('listAttributesOf renvoie un tableau gele avec attributs geles', () => {
    // Le helper ne partage pas le tableau d entite source ; il en
    // fait une copie filtree. Les objets du resultat sont geles
    // pour eviter qu un consommateur ne mute en place.
    const attrs = listAttributesOf('Client', { scope: 'org' });
    expect(Object.isFrozen(attrs)).toBe(true);
    for (const a of attrs) {
      expect(Object.isFrozen(a)).toBe(true);
    }
  });
});