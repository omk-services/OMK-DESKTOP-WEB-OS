---
title: 'Enrichir People avec Personas, Mémoire et Codex'
type: 'feature'
created: '2026-08-05'
status: 'draft'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L’app `people` ne formalise ni les profils synthétiques issus du terrain, ni la mémoire vérifiée de l’organisation, ni les pratiques reproductibles. Ces apprentissages restent donc dispersés et sans détail exploitable.

**Approach:** Ajouter trois collections CMS locales — Personas, Mémoire et Codex — avec des données métier cohérentes. Chaque section utilise `CMSCardList` et ouvre un détail People via le registre existant.

## Boundaries & Constraints

**Always:** Conserver les sept sections existantes et leur ordre; fournir 4 à 8 entrées crédibles par section dans `src/apps/people/seed.ts`; exposer objectifs, blocages, vocabulaire et ancrage des personas; signaler tout ancrage absent; exposer fait, provenance, date et vérification des mémoires; exposer situation, action, justification et applications du Codex; utiliser les variables de thème hors couleurs sémantiques; rendre chaque carte cliquable.

**Ask First:** Modifier une autre app, `src/lib/ontology/`, `src/components/AppFrame.tsx`, `src/lib/app-discovery.ts` ou `src/components/canvasui/`; ajouter une dépendance; dépasser 79 erreurs TypeScript.

**Never:** Supprimer ou réécrire une section existante; mélanger seed et composant; créer un autre système de cartes; rendre une section vide; committer ou pousser; inventer l’ancrage manquant d’un persona.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Collections | 4–8 entrées valides par seed | Trois grilles dont chaque carte ouvre son détail | Le test échoue si volume ou champ requis manque |
| Persona non ancré | `anchor` vide, statut `Sans ancrage` | Carte et détail affichent l’absence en alerte | Aucun fallback n’invente une source |
| Mémoire disputée | `contredit` ou `à vérifier` | Statut, provenance et date restent visibles | Jamais présentée comme confirmée |
| Navigation | Clic, précédent/suivant, retour | Le détail People conserve sa collection | Fallback générique sans crash |

</frozen-after-approval>

## Code Map

- `src/apps/operations/OperationsApp.tsx:63-250` — modèle lu: store CMS, `CMSCardList`, ouverture et sections.
- `src/apps/people/PeopleApp.tsx:775-848` — ajouter drills, rendus et sections après les sept entrées actuelles.
- `src/apps/people/seed.ts` — nouvelles définitions, entrées et enregistrement de `people_personas`, `people_memory`, `people_codex`.
- `src/apps/people/PeopleItemDetail.tsx:23-225` — étendre le détail enregistré sans altérer Team/Agents.
- `src/components/cms/itemDetailRegistry.ts:55-89` — attribuer les trois collections à `people`.
- `src/apps/_ui/CMSCardList.tsx:28-58` — grille en lecture seule à réutiliser; `onOpen` rend la carte interactive.
- `src/lib/cms/cms.store.ts:21-36` — `registerCollection` idempotent, fichier en lecture seule.

## Tasks & Acceptance

**Execution:**
- [ ] `src/apps/people/seed.ts` — exporter trois contrats CMS, 4–8 entrées chacun et leur enregistrement idempotent.
- [ ] `src/apps/people/seed.test.ts` — verrouiller volumes, champs, statuts et présence d’un persona volontairement non ancré.
- [ ] `src/apps/people/PeopleApp.tsx` — enregistrer les collections; ajouter drills et sections avec `SectionHead` + `CMSCardList`; préserver les sept sections.
- [ ] `src/apps/people/PeopleItemDetail.tsx` — rendre tous les champs et distinguer ancrage, vérification et récurrence.
- [ ] `src/components/cms/itemDetailRegistry.ts` — relier les trois IDs à `people` pour déléguer au composant enregistré.

**Acceptance Criteria:**
- Given People chargée, when la navigation apparaît, then les sept sections restent dans leur ordre et les trois nouvelles suivent.
- Given une nouvelle section, when son seed est rendu, then 4 à 8 cartes crédibles apparaissent sans état vide.
- Given une carte de chaque section, when elle est ouverte, then le détail complet offre retour et précédent/suivant.
- Given le persona non ancré, when sa carte ou son détail apparaît, then « Sans ancrage » est visible sans provenance inventée.
- Given les nouveaux rendus, when leurs couleurs non sémantiques sont inspectées, then elles viennent des variables de thème ou de l’accent CMS `#0891b2`, sans palette Tailwind ajoutée.

## Spec Change Log

## Design Notes

Les collections restent dans l’app, pas dans le seed global. `DynamicPageView` garde l’intégration du drill: le registre résout les nouveaux IDs vers `people`, puis `PeopleItemDetail` branche le rendu selon `def.id`. Les surfaces et textes utilisent les variables de thème; seuls les états métier portent une couleur sémantique.

## Verification

**Commands:**
- `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"` — attendu: ≤ 79.
- `npm test` — attendu: toutes les suites passent.

**Manual checks:**
- Dans le navigateur, parcourir les trois sections, ouvrir une carte de chacune, tester retour/précédent/suivant et vérifier le persona sans ancrage.
