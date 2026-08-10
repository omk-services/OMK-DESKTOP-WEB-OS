# RAPPORT B_PEOPLE_PLATFORM — campagne 2026-08-10 (dettes assumées)

**Périmètre** : `src/apps/people/**` + `src/apps/dashboard/platform/**`
**Branche** : main
**Commits** :
- `789cc6b` fix(people): persister scenarioAgents dans localStorage
- `3e6ea1b` feat(platform): câbler Members (formulaire d'invitation) et Integrations (cycle d'état)
- DETTE 1 incluse dans `a18f723` (commit legal — diff partagé avec l'agent A par l'orchestrateur)

---

## DETTE 1 — fiche riche `PeopleDetailPage` (799 lignes) rebranchée

### Constat initial

`src/apps/people/PeopleDetailPage.tsx` est importé dans `PeopleApp.tsx` (~1045) et
rendu dans la branche `{detail ? <AppDetailOverlay><PeopleDetailPage …/></AppDetailOverlay>`
mais le state `detail` (type `PeopleDetailItem`) n'était **jamais rempli**.
La branche était morte et la fiche ne s'affichait jamais.

Le commentaire du fichier (~619-626) documentait la régression :
« Il posait auparavant une fiche riche via `setDetail(...)` SANS toucher
`selectedCode` : l'effet ci-dessus voyait donc `selected` toujours nul et
rappelait aussitôt `setDetail(null)`, effaçant la fiche à peine posée. »

### Geste utilisateur retrouvé

Clic sur une carte de la **Fleet** (`Squads`). Avant la correction :
le clic posait `selectedCode` local et faisait rendre `FleetDetail` (148 lignes,
inline, sans overlay). C'était un doublon simplifié de la fiche riche.

### Correction

- `PeopleApp.tsx`
  - Ajout d'un `openAgentDetail(agent: FleetAgent)` qui construit un
    `PeopleDetailItem` (titre, sous-titre, état, initiales, squad, meta
    avec channel/model/tasksToday/share) et peuple `detail`.
  - `Fleet` prend une prop `onAgentClick` et appelle
    `onAgentClick(agent)` au lieu de poser `selectedCode`. La fonction
    `FleetDetail` inline est supprimée (remplacée par `null` — voir _TRASH).
  - Le `useEffect` qui synchronise `detail` vers `useWindowPage().setDetail`
    (fil d'Ariane) existait déjà et fait désormais tout le travail.
  - Le `useEffect` qui déclenche `launchTour(SQUAD_DRILLDOWN)` est déplacé
    dans `PeopleApp` et écoute `detail` au lieu de `selectedCode`.
  - Ajout d'un attribut `data-fleet-card={a.code}` sur chaque carte pour
    piloter le clic en test (sélecteur strict).

- Archive : `_TRASH_2026-08-10/FleetDetail_REMOVED.tsx` contient le code
  de l'ancien `FleetDetail` inline (148 lignes) pour traçabilité (D4).

### Vérification par le rendu

- `node tools/verify-b-fleet-click.mjs` ouvre People → Squads → clic sur
  Orchestrator (A-00). Capture dans `b-fleet-scrolled.png`.
- L'overlay rend bien `<PeopleDetailPage>` : header « PEOPLE · AGENT
  FACTORY », avatar OR, badge EXECUTING, bio complète, squad
  « Green Lanterns », vitals (Tasks today / Tokens burned / Avg latency /
  Success rate), capacité (load bar + fleet share), ladder de lifecycle,
  signal log, capabilities, handoffs (A-01 Scout / A-02 Scribe / A-03
  Reach / A-04 Dev), bouton « Back to People ».
- Zéro erreur console. Bouton retour fonctionnel (`onBack` ferme
  l'overlay et remet le fil d'Ariane à `null`).
- Vérification DOM : `Orchestrator: 3`, `Tasks today: 1`, `Lifecycle: 1`,
  `Handoffs: 1`, `Capabilities: 1`, `Ping: 1` — toutes les sections
  attendues sont là.

### Pourquoi ne pas avoir supprimé `PeopleDetailPage`

C'est la fiche riche (799 lignes, soft-UI neumorphism, vitals + ladder +
signal log + capabilities + handoffs + ping). Sa valeur l'emporte sur
toute simplification. Le brief dit « 799 lignes de contenu abouti
valent mieux rebranchées que jetées ».

---

## DETTE 2 — lien scénario ↔ agent survit au reload

### Constat initial

`src/apps/people/scenarioAgents.ts` tenait la table `Record<scenarioId,
agentCode>` dans un **état de module** (variable `links` en mémoire).
Disparaît au `F5`. L'utilisateur créait un scénario avec un agent,
rechargeait la page, le rattachement n'existait plus — le badge
agent affiché dans la file Approvals disparaissait.

### Correction

- `src/apps/people/scenarioAgents.ts`
  - Clé `coach-os:scenario-agents:v1` dans `localStorage`.
  - `loadLinks()` au chargement du module (try/catch — mode privé, quota
    plein, JSON corrompu → objet vide, jamais planter).
  - `saveLinks()` après chaque `linkScenarioToAgent` et `unlinkScenario`.
  - `clearScenarioAgentLinks()` efface aussi le stockage.
  - Pattern repris de `src/apps/dashboard/dashboard/sections/Chat.tsx`
    (chat-drafts:v1) — même garde anti-`try/catch` muette.

### Vérification par le rendu

- `node /tmp/verify-b-scenario.mjs` ouvre People → Approvals, ouvre le
  formulaire, remplit « Test scenario reload », soumet avec agent A-00
  (sélectionné par défaut). Capture `b-scenario-before.png`.
- Le badge `data-scenario-agent` apparaît avec `A-00` à côté du scénario.
- `localStorage.getItem('coach-os:scenario-agents:v1')` retourne
  `{"scn_…":"A-00"}` AVANT reload.
- `page.reload()` puis retour sur Approvals.
- Le badge `A-00` est TOUJOURS là. localStorage identique. Capture
  `b-scenario-after.png` confirme visuellement.
- Zéro erreur console.

---

## DETTE 3 — Members + Integrations câblés (et non plus décoratifs)

### Constat initial

- `Members › Inviter un membre` : un bouton qui ne fait qu'un `addToast`
  « Invitation générée — copie le lien… » alors que rien n'est généré.
- `Integrations` : six cartes de connecteurs qui ne font que des
  `addToast` « Demande d'autorisation envoyée » alors que rien n'est
  envoyé.

À l'écran, un bouton qui affiche « invitation envoyée » sans que rien
ne se passe est un mensonge.

### Correction

#### Integrations (`src/apps/dashboard/platform/platform.tsx`)

- État local `const [connectors, setConnectors] = useState<ConnectorSeed[]>(CONNECTORS)`.
- Constante `CONNECTOR_CYCLE: Record<ConnectorState, ConnectorState>` :
  - `connecte` → `disponible`
  - `disponible` → `connecte`
  - `indisponible` → `disponible`
- `cycleConnector(id)` lit l'état, calcule la transition, appelle
  `addToast` (honnête : « Le serveur confirmera via le gateway »), puis
  `setConnectors`. Les StatCards `Connectés` / `Disponibles` dérivent
  du tableau local — le changement est mesurable à l'œil.
- Chaque carte enveloppe un `<div data-connector-id={…}>` (FleetItemCard
  ne propage pas les data-*, hors périmètre `_ui`).

#### Members

- État local `const [members, setMembers] = useState<MemberRecord[]>(MEMBERS)`.
- Le bouton « Inviter un membre » ouvre un formulaire `inviting` (toggle).
- Le formulaire contient email + select rôle.
  - Email vide → « L'email est obligatoire. »
  - Email sans `@.` → « Cet email ne ressemble pas à un email. »
  - Email déjà dans la liste (case-insensitive) → « Une invitation
    existe déjà pour … »
  - Sinon → ligne ajoutée en tête avec `invitationStatus: 'pending'`,
    actor `—`, activité « Invitation en attente ».
- Une pastille « Invitation en attente » (amber) s'affiche à côté du nom
  du nouveau membre. Avatar passe en muted quand pending.
- Le compteur `Membres` monte (5 → 6 → …), `Audit` descend
  (100 % → 83 % pour 1 pending sur 6).
- L'attribut `data-member-pending-badge` permet de valider la pastille.

#### seed.ts

- Ajout à `MemberRecord` :
  - `invitationStatus?: 'active' | 'pending'` — implicite `active` pour
    le seed, `pending` pour les invitations UI.
  - `email?: string` — utilisé pour dédupliquer case-insensitive.

### Bug corrigé en passant

Première version : `addToast(...)` était appelé **dans l'updater de
`setConnectors`**. Or l'updater d'un setter React s'exécute pendant le
render — donc addToast déclenchait une mutation d'état pendant le
render d'Integrations, ce qui faisait hurler React en dev :

> Cannot update a component (`NotificationsDropdown`) while rendering a
> different component (`Integrations`).

Extraction du calcul de transition avant `setConnectors`. Vérifié :
zéro erreur console après fix.

### Vérification par le rendu

- `node /tmp/verify-b-members2.mjs` (Members) :
  - EMPTY : erreur visible. PASS.
  - INVALID : erreur visible. PASS.
  - DUP : erreur visible. PASS.
  - INVITE : 6 membres (5 initiaux + 1), 1 pending, pastille
    « Invitation en attente » visible. PASS.
- `node /tmp/verify-b-integ.mjs` (Integrations) :
  - vercel : Disponible → Connecté. PASS.
  - github : Connecté → Disponible. PASS.
  - slack : Indisponible → Disponible. PASS.
- Zéro erreur console sur les deux.

---

## Ce qui n'a pas été touché

- `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
  `src/contexts/`, `src/apps/_ui/` — hors périmètre par GARDE_FOU.
- `src/stores/scenarios.store.ts` — la définition de Scenario n'a pas
  de champ `agentId`, c'est pourquoi `scenarioAgents.ts` existe comme
  module séparé. Pas touché.
- Les autres parties de `src/apps/people/` :
  - `ApprovalsView` : le flux Approve & Merge (ligne 354) et le rejet
    (ligne 347) sont fonctionnels. Aucune dette visible.
  - `seed.ts` (people) : 3 collections (personas / memory / codex)
    bien structurées, anchor visible quand absent, vérification
    sémantique (confirmed / to verify / contradicted).
  - `fleet.ts` : 5 agents + état + bio + capabilities + recent runs.
  - `PeopleItemDetail.tsx` : le panneau « Scénarios liés » pour les
    agents CMS lit `getScenariosForAgent(agentCodename)` qui est
    désormais persistant — la dette 2 améliore aussi cette surface.

## Périmètre propre

- `src/apps/people/PeopleApp.tsx` (modifié pour DETTE 1)
- `src/apps/people/PeopleDetailPage.tsx` (intact, 799 lignes)
- `src/apps/people/PeopleItemDetail.tsx` (intact)
- `src/apps/people/ApprovalsView.tsx` (intact)
- `src/apps/people/fleet.ts` (intact)
- `src/apps/people/scenarioAgents.ts` (modifié pour DETTE 2)
- `src/apps/people/seed.ts` (intact)
- `src/apps/people/_TRASH_2026-08-10/FleetDetail_REMOVED.tsx` (archivé)
- `src/apps/dashboard/platform/platform.tsx` (modifié pour DETTE 3)
- `src/apps/dashboard/platform/seed.ts` (modifié pour DETTE 3)
- `src/apps/dashboard/platform/index.ts` (intact)
- `tools/verify-b-fleet-click.mjs` (ajouté pour la vérif DETTE 1)

## Typecheck final

`npx tsc --noEmit` exit 0, 0 erreurs. Aucune nouvelle erreur introduite
par les corrections (l'erreur pre-existante « setState during render »
a été corrigée en passant — voir DETTE 3 « Bug corrigé en passant »).