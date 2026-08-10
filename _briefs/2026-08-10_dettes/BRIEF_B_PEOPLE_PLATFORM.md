---
id: B_PEOPLE_PLATFORM
campagne: 2026-08-10 — dettes assumées
---

# BRIEF B — la fiche inatteignable, le lien volatil, les boutons décoratifs

## Ton périmètre exclusif

```
src/apps/people/**
src/apps/dashboard/platform/**
```

**Interdit** : le socle (`src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
`src/apps/_ui/`), le reste de `src/apps/dashboard/` (sections CORE, OPERATIONS, `security/`),
et toute autre app. Lis `SOCLE_ACQUIS.md` avant de commencer.

Trois dettes, localisées. Ce ne sont pas des hypothèses.

---

## DETTE 1 — 799 lignes de fiche riche que personne ne voit jamais

`src/apps/people/PeopleDetailPage.tsx` fait 799 lignes. Il **est** importé et **est** rendu
dans `PeopleApp.tsx` (~ligne 1045) :

```tsx
{detail ? (
  <AppDetailOverlay …>
    <PeopleDetailPage item={detail} onBack={() => setDetail(null)} />
  </AppDetailOverlay>
) : …}
```

Mais le state `detail` (type `PeopleDetailItem`) n'est **jamais rempli** : `setDetail` n'est
appelé qu'avec `null`. La branche est donc morte, et la fiche ne s'affiche jamais.

Un commentaire du fichier (~lignes 619-626) raconte l'histoire : *« Il posait auparavant une
fiche riche via `setDetail(...)` … `setDetail(null)`, effaçant la fiche à peine posée. »*
C'est une **régression**, pas un abandon volontaire.

**Ce que tu fais** — dans cet ordre :

1. **Ouvre le fichier et regarde ce qu'il rend.** S'il affiche une fiche plus riche que celle
   servie aujourd'hui par `PeopleItemDetail`, alors **rebranche-le** : trouve quel geste
   utilisateur devait le déclencher (une carte de la Fleet ? un agent ? un membre ?) et
   rétablis l'appel `setDetail({...})` correspondant.
2. **Si et seulement si** son contenu fait doublon avec `PeopleItemDetail` et n'apporte rien,
   déplace-le vers `src/apps/people/_TRASH_2026-08-10/` — le dépôt interdit le `hard-delete`,
   on archive.

**Ne supprime pas par défaut.** 799 lignes de contenu abouti valent mieux rebranchées que
jetées. Écris dans le rapport ce que la fiche affichait et ce que tu as tranché.

---

## DETTE 2 — Le lien scénario ↔ agent s'évapore au rechargement

`src/apps/people/scenarioAgents.ts` tient la correspondance `scenarioId → agentCode` dans un
**état de module** : un simple `Record` en mémoire. Il disparaît au `F5`. L'utilisateur crée
un scénario rattaché à « Talent Sourcer », recharge la page, et le rattachement n'existe plus.

Le store des scénarios (`src/stores/scenarios.store.ts`) est **hors de ton périmètre** : tu
n'y touches pas.

**Ce que tu fais** : persiste la table dans `localStorage`, en suivant le motif déjà en place
dans `src/apps/dashboard/dashboard/sections/Chat.tsx` :

- une clé versionnée (par exemple `coach-os:scenario-agents:v1`) ;
- lecture sous `try/catch` (mode privé, quota plein, JSON corrompu → retomber sur un objet
  vide, jamais planter) ;
- écriture après chaque `linkScenarioToAgent` / `unlinkScenario` ;
- au chargement du module, réhydratation depuis le stockage.

**Vérifie par le rendu** : crée un scénario avec un agent, recharge la page, et **prouve que
le badge de l'agent est toujours là**. C'est le seul test qui compte ici.

---

## DETTE 3 — Deux boutons décoratifs dans platform

Dans `src/apps/dashboard/platform/` :

- **Members** → « Inviter un membre » : ne fait qu'un `addToast`.
- **Integrations** → les cartes de connecteurs : ne font qu'un `addToast`.

L'agent précédent les a laissés en l'état en arguant que l'invitation réelle demande du RBAC
serveur et que l'autorisation d'un connecteur passe par le gateway MCP. **C'est vrai, et ça
ne change rien au problème** : à l'écran, un bouton qui affiche « invitation envoyée » sans
que rien ne se passe est un mensonge.

**Ce que tu fais** — la règle du dépôt est « soit tu le câbles, soit tu le retires ». Ici,
câble-les **localement**, ce qui est honnête pour un produit de démonstration :

- **Inviter un membre** : ouvre un formulaire (email + rôle), valide l'email, refuse les
  doublons, et **ajoute réellement une ligne** à la liste des membres avec le statut
  `Invitation en attente` — un statut qui dit la vérité, puisque rien n'est envoyé. Le
  compteur de membres doit bouger.
- **Integrations** : un clic sur une carte doit **changer son état** (connecté /
  déconnecté) et le refléter visuellement, comme le fait déjà l'install/uninstall de
  Marketplace. Si l'autorisation réelle passera plus tard par le gateway, écris-le dans un
  commentaire du code — pas dans un toast qui prétend l'avoir fait.

Le vocabulaire à l'écran doit rester exact : « Invitation en attente » et non « Membre
ajouté ».

---

## Vérification

```bash
node tools/shot.mjs --app people --section "Approvals" --theme glassmorphism --w 1440 --h 900 --out /tmp/b1.png
node tools/shot.mjs --app dashboard --section "Members" --theme glassmorphism --w 1440 --h 900 --out /tmp/b2.png
```

Pour les trois dettes, la capture ne suffit pas. Pilote le navigateur (Playwright dans
`~/gauntlet-eyes`, voir `tools/shot.mjs`) et prouve :

1. la fiche People s'ouvre sur le geste que tu as rebranché ;
2. le lien scénario↔agent **survit à un `page.reload()`** ;
3. inviter un membre **augmente le compteur**, et connecter une intégration **change son état**.

## Ta boucle

```
passe 1 : dette 1 (la fiche) — commence par LIRE ce qu'elle affiche avant de trancher
passe 2 : dettes 2 et 3
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU, avec un reload pour la dette 2
passe 5 : reparcours ton périmètre à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

Écris `_briefs/2026-08-10_dettes/RAPPORT_B_PEOPLE_PLATFORM.md` — partiel si tu dois t'arrêter.
