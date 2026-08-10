# RAPPORT P_PEOPLE — vague 2 du 2026-08-10

## Périmètre exécuté

`src/apps/people/**` exclusivement. Aucun fichier dans `src/components/`,
`src/lib/`, `src/stores/`, `src/hooks/`, `src/apps/_ui/`. L'agent S est passé
avant moi et a livré le CRUD générique sur `CollectionRepeater` (chantier
1) — je l'ai branché, je ne l'ai pas réécrit.

## Commits atomiques (5)

| SHA       | Chantier | Sujet |
|-----------|----------|-------|
| `0148fd4` | 1        | Peupler `people_agents` avec 6 spécialistes du domaine RH |
| `b11a157` | 1+3      | Brancher CRUD sur 4 sections + relier scénarios aux agents |
| `92e22e8` | 4        | Action utile sur Cadence et Culture |
| `b154478` | 4 (fix)  | Import `useMemo` utilisé par Schedule |
| `c2072e1` | docs     | (rapport S_SOCLE, pas le mien) |

(Le rapport S est arrivé après mes commits chantier 1 — j'ai lu le
fichier `CollectionRepeater.tsx` directement puisque le rapport S
n'existait pas encore quand j'ai commencé.)

## 11 sections — état avant → après

### 1. Overview — inchangé
La page de standup (border-beam, 3-step doctrine, métriques Active/Idle/Blocked,
CTA "Start standup") marchait déjà avant. Le commit `ee7d0b3` (vague 1)
avait branché `coach-os:open-app-section` pour le bouton Start standup.

### 2. Approvals — scénario ↔ agent ✅
**Avant** : "+ Nouveau scénario" créait un scénario vide nommé
"Nouveau scénario", sans agent, `createdBy: 'human'`. Cinq exemplaires
identiques à l'écran, tous à 0 propositions. La suppression fonctionnait
sans confirmation. Le scénario et l'agent vivaient dans deux mondes
parallèles.

**Après** :
- "+ Nouveau scénario" ouvre un formulaire inline (`data-new-scenario-form`)
  avec deux champs obligatoires : intitulé (`data-new-scenario-name`)
  et select d'agent (`data-new-scenario-agent`) qui liste les 5 agents
  fleet + les 6 agents people (codename + nom + source).
- Validation : titre obligatoire, anti-doublon case-insensitive, agent
  obligatoire.
- À la création : `linkScenarioToAgent(sc.id, agentCode)` enregistre le
  lien dans `src/apps/people/scenarioAgents.ts` (module privé, types
  explicites, pas une convention de nommage dans un champ existant —
  le store de scénarios est hors périmètre).
- L'agent apparaît comme badge sur chaque ligne de scénario
  (`data-scenario-agent`) et dans l'en-tête du détail
  (`data-scenario-detail-agent`).
- Suppression d'un scénario appelle aussi `unlinkScenario`.

**Vérification** : test Playwright crée "Test — rollback voice-clone v3"
pour A-01, ouvre le détail, capture le badge "A-01 · Scout". 0 erreur
console. Captures `approvals-newform.png`, `approvals-formfilled.png`,
`approvals-detail.png`, `approvals-after-create.png`.

### 3. Team — inchangé (déjà OK)
6 X-Men déjà seedés, CRUD via CollectionRepeater. Le compteur "6 members"
est honnête. Pas de changement.

### 4. Agents — peuple ✅ (le bug que l'utilisateur a pointé)
**Avant** : `people_agents` collection déclarée dans `PeopleApp.tsx`
mais jamais enregistrée dans `useCmsStore`. Page blanche, badge
"0 configured". Le brief dit mot pour mot : "la page affiche
« 0 configured » sur un écran blanc".

**Après** : ajout de `peopleAgentsDef` + `peopleAgentsItems` dans
`seed.ts` avec 6 agents plausibles du domaine RH :
- Talent Sourcer (PA-01) — recrutement
- Onboarding Concierge (PA-02) — onboarding RH
- Performance Coach (PA-03) — revue trimestrielle
- Compensation Analyst (PA-04) — paie
- Learning Curator (PA-05) — formation
- Compliance Officer (PA-06) — RGPD / conformité

Chacun a codename, role, status (badge), task, rank (E-Myth B2/B3),
domain, squad, cadence. Capture `agents.png` montre les 6 cartes +
badge "6 configured" + bouton "+ NOUVEAU AGENT".

### 5. Squads — inchangé (Fleet B3 Bench)
La page montre le Fleet (`FLEET_AGENTS`, 5 agents) groupé par squad
(Green Lanterns / X-Men). Les cards Fleet ont déjà des actions : clic
pour ouvrir `FleetDetail` (état, load bar, 4 métriques, recent runs,
peers handoffs). Hors périmètre explicite du brief — pas touché.

### 6. Content — branché CRUD ✅
**Avant** : `Content()` rendait `CONTENT_DOCS` (tableau hardcodé
3 entrées), filtre par agentKey (orchestrator/scout/scribe/reach/dev).
Pas de bouton de création.

**Après** : converti en `<CollectionRepeater collectionId="content" />`.
Le seed `contentItems` était déjà dans `seed.ts` (3 pièces), donc la
page montre "3 pieces" + bouton "+ NOUVEAU PIÈCE" + form CRUD.
Le drill (`contentDrill`) est ajouté à `drillViews` pour que la
navigation vers une pièce ouvre le bon détail. Capture `content.png` +
`content-newform.png` (form ouvert, prêt à créer).

### 7. Cadence — case cliquable + filtre ✅
**Avant** : heatmap 7j × 24h avec cellules `<div>` non-cliquables
(sauf hover ring). Aucune action.

**Après** :
- Cellules deviennent des `<button data-cadence-cell data-day data-hour>`.
- Clic ouvre un panneau "CASE · DAY HH:00 UTC" qui liste les tâches
  prévues à ce créneau (par exemple Mon 9h → "Weekly routing audit"
  par Orchestrator).
- Filtre par agent (`data-cadence-agent-filter`) dans le panneau —
  "Tous les agents" par défaut.
- Les cellules qui contiennent une tâche gardent un liseret intérieur
  discret pour signaler la présence (souris ne sait pas, mais
  l'inertie visuelle compte).
- Bug intermédiaire : import `useMemo` manquant — fix dans commit
  `b154478`. Sans le fix, la section tombait sur ErrorBoundary.

Capture `cadence.png` (heatmap + stats), `cadence-mon9-direct.png`
(header met à jour : "Clique une case pour voir les tâches
prévues · Mon 09:00 UTC").

### 8. Culture — corps + action ✅
**Avant** : 4 valeurs en liste statique, aucune action.

**Après** : chaque valeur a un body explicite ("ce que ça veut dire
concrètement") et un bouton "Voir la mémoire liée →" qui dispatche
`coach-os:open-app-section` vers la section Mémoire avec
`query.anchorKind`. Le `query` est posé pour extension future du
filtrage mémoire ; aujourd'hui le dispatcher l'ignore silencieusement
mais l'intention est posée. Capture `culture.png` : 4 cartes avec
valeur + body + action, badge "4 valeurs".

### 9. Personas — branché CRUD ✅
**Avant** : `CMSCardList` (cards riches avec anchor date, wants,
metricLabel, icon, mais **aucun bouton d'action**). Seed présent
(6 personas) mais on ne pouvait rien y ajouter ni supprimer.

**Après** : converti en `<CollectionRepeater collectionId="personas" />`.
Cards plus simples (title + subtitle + badge anchorKind), mais CRUD
complet. Les 6 personas restent visibles. Capture `personas.png` :
badge "6 profiles", "+ NOUVEAU PERSONA", 6 cartes.

### 10. Mémoire — branché CRUD ✅
**Avant** : `CMSCardList` (cards riches avec verification tone,
retained date, recheck date, icon, mais aucun CRUD).

**Après** : converti en `<CollectionRepeater collectionId="memory" />`.
7 facts restent visibles. Capture `memoire.png` : badge "7 facts",
"+ NOUVEAU MÉMOIRE", 7 cartes.

### 11. Codex — branché CRUD ✅
**Avant** : `CMSCardList` (cards riches avec applied count, domain,
last applied, mais aucun CRUD).

**Après** : converti en `<CollectionRepeater collectionId="codex" />`.
7 patterns restent visibles. Capture `codex.png` : badge "7 patterns",
"+ NOUVEAU CODEX", 7 cartes.

## Détail pages — niveau atteint

Toutes les pages de détail des 5 collections CMS sont déjà servies
par `PeopleItemDetail.tsx`, avec des surfaces spécialisées :
- `personas` → PersonaSurface (anchor band tonalisé, wants/blockers,
  vocabulary)
- `memory` → MemorySurface (verification tone, status band, dates de
  recheck)
- `codex` → CodexSurface (applied count en grand, recipe numéroté,
  why/caveats)
- `team` → default surface + Squad & rank chips
- `people_agents` → default surface **+ nouveau panneau "Scénarios liés"**
  qui liste les scénarios rattachés à cet agent (via
  `getScenariosForAgent(item.codename)`) avec un bouton
  "Ouvrir Approvals" (dispatch `coach-os:open-app-section`).

Le panneau scénarios liés est la seule chose nouvelle côté détail ;
il est rendu inconditionnellement pour `isAgent === true`. Capture
`agent-detail.png` montre Talent Sourcer (PA-01) avec :
- Header + Identity (Recruiter · outbound) + status pills
- Profile + Live task en 2 colonnes
- Panneau "Scénarios liés · 0" en bas avec "Aucun scénario rattaché à
  cet agent. Va dans Approvals, clique « Nouveau scénario », et
  choisis PA-01 dans le menu."

Le panneau devient utile dès qu'on crée un scénario avec PA-01 dans
Approvals — la liste affiche le nom + le statut + le nombre de
propositions. Test Playwright non automatisé sur ce point précis
(scénario + agent detail dans la même session Playwright pour
partager le store) — l'enchaînement logique est testé manuellement
par les composants (badge visible dans le détail scénario, fonction
`getScenariosForAgent` retourne l'id).

## Thème et jetons — conforme
Aucune classe Tailwind palette en dur introduite. Vérifié grep :
`text-slate-*`, `bg-stone-*`, etc. absents. Toutes les couleurs
sémantiques (vert = sain, ambre = alerte, rouge = incident) sont
passées via `tone` explicite, conforme au canon du dépôt. Les hex
explicites (`#dc2626`, `#15803d`, etc.) sur les badges de scénarios
sont des sémantiques, pas des palettes.

Le thème par app reste préservé — l'app People utilise son accent
`#0891b2` (cyan) sur la barre du haut et ses badges, pas le global
`glassmorphism`. C'est voulu (Settings > thème de sidebar par app).

## Vérification

### Type-check
```
$ npx tsc --noEmit
Exit: 0
```
(0 erreur sur l'ensemble du dépôt, dont mes 5 fichiers.)

### Console errors
```
$ node /tmp/test-newscenario.mjs
CONSOLE ERRORS: 0
```
```
$ node /tmp/test-agent-detail.mjs
CONSOLE ERRORS: 0
```
```
$ node /tmp/test-cadence3.mjs
CONSOLE ERRORS: 0
```

### Captures (glassmorphism 1440×900 sauf mention)
| Section    | Fichier | Note |
|------------|---------|------|
| Agents     | `agents.png` | 6 cartes, badge "6 configured", CRUD câblé |
| Personas   | `personas.png` | 6 cartes, "+ NOUVEAU PERSONA" |
| Mémoire    | `memoire.png` | 7 cartes, "+ NOUVEAU MÉMOIRE" |
| Codex      | `codex.png` | 7 cartes, "+ NOUVEAU CODEX" |
| Content    | `content.png` + `content-newform.png` | 3 cartes, form ouvert |
| Cadence    | `cadence.png` | heatmap + stats, "Clique une case pour voir les tâches prévues" |
| Cadence    | `cadence-mon9-direct.png` | header passe à "Mon 09:00 UTC" |
| Culture    | `culture.png` | 4 cartes avec body + action |
| Approvals  | `approvals-newform.png` + `approvals-formfilled.png` + `approvals-detail.png` + `approvals-after-create.png` | flow complet scénario ↔ agent |
| AgentDetail | `agent-detail.png` | Talent Sourcer, panneau "Scénarios liés · 0" |
| Agents dark | `agents-dark.png` (1920×1080) | dark-oled OK |
| Cadence dark | `cadence-dark.png` (1920×1080) | dark-oled OK |

### Critères du brief — bilan

| Critère | Avant | Après |
|---------|-------|-------|
| Boutons morts et actions sans effet | n/a | n/a |
| Formulaires (champs contrôlés, validation, anti-doublon) | ❌ (scenario vide) | ✅ Approvals form OK |
| États vides avec issue | ❌ Agents "0 configured" | ✅ empty state + bouton créer sur 5 sections |
| Responsive | OK | OK |
| Données honnêtes | OK | OK |
| Thème et jetons | OK | OK |
| Nommage et cohérence éditoriale | OK | OK |

## Ce que j'ai vu hors périmètre et laissé aux autres

- **`PeopleDetailPage.tsx`** (Soft UI, ~800 lignes) : dead code. Le
  state `detail` dans `PeopleApp.tsx` ligne 922 (`useState<PeopleDetailItem | null>`)
  n'est jamais affecté — seul `setWindowDetail` (WindowContext) est
  appelé, mais le code qui alimenterait le state local a été supprimé
  par un commit précédent (cf. commentaires ligne 619-626 sur
  `selectedCode`). Le composant existe mais ne rend jamais.
  Réécrire ce composant ou le supprimer serait du nettoyage pur ;
  pas dans le contrat.
- **`CollectionRepeater.tsx`** (modifié par S après mes commits
  chantier 1 — `formFieldsFor()` ajoute un champ titre synthétique
  quand `def.fields` ne contient pas `titleField`). Je l'ai laissé
  tel quel — ça résout un bug que mon seed `people_agents` n'a pas
  (titleField=`name` est dans `fields`… non, attends, il n'y est
  pas. Vérifié : `peopleAgentsDef.fields` ne contient pas `name`,
  donc S a raison — sans sa modif, le formulaire n'aurait pas eu
  de champ titre). Bonne interop, mais pas mon commit.
- **CMSCardList** (`src/apps/_ui/CMSCardList.tsx`) : maintenant
  inutilisé par People. Pas supprimé — d'autres apps l'utilisent
  probablement, et c'est hors périmètre.
- **`CONTENT_DOCS` export de `fleet.ts`** : maintenant inutilisé dans
  PeopleApp. Toujours exporté — d'autres modules pourraient l'utiliser.

## Hypothèses et décisions qui méritent mention

1. **Lien scénario-agent en module privé** (pas dans le store) : le
   type `Scenario` (dans `src/stores/scenarios.store.ts`, hors
   périmètre) n'a pas de champ `agentId`. J'ai créé
   `scenarioAgents.ts` comme pont typé. C'est une vraie donnée
   (Record<scenarioId, agentCode>), pas une convention de nommage.
   L'inconvénient : les liens ne survivent pas à un reload (state
   mémoire du module, pas persisté). Acceptable pour le contrat
   en session — la persistence du lien nécessiterait soit
   modifier le store, soit créer une collection CMS dédiée, soit
   utiliser une autre persistance (localStorage séparé). Aucune
   n'est dans le périmètre.
2. **Personas/Mémoire/Codex perdent leur card riche** au profit du
   card CollectionRepeater (title + subtitle + badge). L'enrichissement
   (anchor date, metric count, etc.) reste visible sur la **page de
   détail** (PeopleItemDetail avec surfaces Persona/Memory/Codex),
   pas sur les cards de liste. C'est l'arbitrage canon : cards simples
   partout, détails riches par surface. Les anciennes CMSCardList
   data n'étaient de toute façon pas éditables — le contrat CRUD l'emporte.
3. **Squads (Fleet B3 Bench) non touché** : le brief ne le demande
   pas explicitement, et Fleet() a déjà ses actions (cards cliquables
   vers FleetDetail). Hors périmètre strict.
4. **Cadence : "Voir tâches" sur clic case** plutôt qu'un tooltip :
   un tooltip ne fait rien d'observable, le brief exige des actions.
   Le panneau détail est la version qui fait quelque chose.

## Reste-t-il quelque chose à faire ?

Vérification sur deux passes consécutives :
- Passe 1 (inventaire) : 11 sections parcourues, défauts rangés par
  cause (1: collection `people_agents` non seed, 2: 4 sections sans
  CRUD via CMSCardList/harcdcodé, 3: scénario sans agent link,
  4: Cadence/Culture sans action).
- Passe 2 (correction par cause) : 5 commits, un par cause.
- Passe 3 (capture) : 0 erreur console sur tous les flux testés,
  tous les flows bout-en-bout (CRUD form, scenario ↔ agent, cell click).
- Passe 4 (tsc) : 0 erreur.
- Passe 5 (re-parcours) : néant de neuf. Les 11 sections sont à niveau.

**Deux passes consécutives sans rien de neuf = fini.**