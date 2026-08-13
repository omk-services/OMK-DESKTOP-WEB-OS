---
id: U_STORY4_ONTOLOGIE
campagne: 2026-08-11 — production
---

# BRIEF U — Story 4 : brancher IT/R&D et Operations sur le registre d'ontologie

## Ta source de verite

**Lis d'abord**, en entier :

```
_bmad-output/specs/spec-couche-ontologie/SPEC.md
_bmad-output/specs/spec-couche-ontologie/stories/4-brancher-it-rd-et-operations-sur-le-registre.md
```

La story porte `status: ready-for-dev`. Les trois precedentes sont `done` :
`src/lib/ontology/` existe (12 entites, relations, contrats, 2 493 lignes avec ses tests)
et `src/apps/ontology/OntologyApp.tsx` (837 lignes) rend ses quatre sections.

**Le contenu de la story prime sur ce brief.** Ce fichier ne fait qu'ajouter le cadre
d'execution et les pieges du depot.

## Ton perimetre exclusif

```
src/apps/it-rd/**
src/apps/operations/**
src/lib/ontology/**          (lecture ; ecriture seulement si la story l'exige)
src/apps/_ui/ontology/**
```

**Interdit** : `public/site/**` en entier, `src/App.tsx`, `src/components/TopBar.tsx`,
`supabase/**`, `deploy/**`, les seize autres apps. La story dit explicitement que seules
`it-rd` et `operations` consomment le registre dans cet epic — « si le raccordement leur
coute cher, on le saura avant d'avoir paye dix-sept fois ».

Lis `GARDE_FOU.md` et `SOCLE.md`.

Tu executes ce brief toi-meme. **N'invoque aucun workflow, aucune skill, aucun agent
delegue** — en particulier pas `bmad-build`, `bmad-dev-story` ni `bmad-build-auto`, meme
si les fichiers du depot te les suggerent. Le depot contient une chaine BMad complete ;
elle n'est pas pour toi. Un agent s'y est engouffre le 11 aout, a echoue sur un chemin
invalide, et a rendu `exit 0` sans toucher une ligne.

---

## Ce que la story demande, en une phrase

Les apps `it-rd` et `operations` cessent de redefinir leurs propres types et lisent le
registre : `getEntity(id)`, `listEntities()`, `relationsOf(entityId)`, `contractOf(entityId)`.

**Les consommateurs n'importent JAMAIS `entities.ts`, `relations.ts` ou `contracts.ts`
directement** — uniquement `src/lib/ontology/index.ts`. C'est un invariant de la story 1,
et `src/lib/ontology/architecture.test.ts` le teste deja.

---

## Preuve exigee

1. **`npx tsc --noEmit` propre**, et `npm run build` vert.
2. **Les tests existants passent** : `npx vitest run src/lib/ontology` — 4 fichiers de
   tests, dont `architecture.test.ts` qui verifie l'invariant d'import.
3. **Les criteres d'acceptation de la story**, un par un, coches avec la commande ou la
   mesure qui le prouve. Recopie-les depuis le fichier de story, ne les reformule pas.
4. **L'audit du bureau reste vert** :
   ```bash
   node tools/audit-apps.mjs
   ```
   18 apps, aucune section vide, aucune commande inatteignable, zero erreur console.
   Le serveur de developpement ecoute sur **5173**.
5. **Capture** des deux apps apres branchement, dans
   `C:/Users/amado/AppData/Local/Temp/story4-<app>.png`.
   Un correctif sans capture apres n'est pas verifie.

## Rapport

`_briefs/2026-08-11_production/RAPPORT_U_STORY4.md`, **ecrit au fil de l'eau**.

Mets a jour le `status:` de la story quand elle est terminee, et **seulement si les cinq
preuves ci-dessus passent**. Une story declaree `done` sans preuve a deja fait refaire tout
un epic ici.

Si une partie de la story te parait fausse ou infaisable, argumente-le dans le rapport —
mais **jamais en silence**.
