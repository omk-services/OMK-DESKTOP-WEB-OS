---
id: P_PEOPLE
campagne: 2026-08-10 vague 2 — fonctionnalités oubliées
ordre: 2 — après S
---

# BRIEF P — l'app People, la plus incomplète des dix-neuf

## Ton périmètre exclusif

```
src/apps/people/**
```

**Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`, `src/apps/_ui/`,
et toute autre app. L'agent S est passé avant toi et a ajouté un **CRUD générique** à
`CollectionRepeater` — lis `_briefs/2026-08-10_vague2/RAPPORT_S_SOCLE.md`, section
« API du CRUD générique », avant de commencer. Tu **branches** ce CRUD, tu ne le réécris pas.

## Ce que l'utilisateur a constaté, mot pour mot

> « Le bouton new Scénarios et la page Approval de l'app People ne sont pas correctement
> intégrés aux Agents, autant que les pages Teams et Agents de l'app People sont vides sans
> pouvoir y ajouter des items avec des boutons et formulaires complets, je ne te parle même pas
> de leurs pages de détails qui sont ultra minimalistes oubliées par dette technique — pareil
> pour les pages d'en bas. »

Quatre chantiers en découlent.

---

## CHANTIER 1 — Les collections vides et sans issue

`Team` rend `<CollectionRepeater collectionId="team" />`, `Agents` rend
`<CollectionRepeater collectionId="people_agents" />`. La collection `people_agents` est
**déclarée sans items** : la page affiche « 0 configured » sur un écran blanc.

À traiter pour **chaque** section de l'app qui rend une collection — `Team`, `Agents`,
`Personas`, `Content`, `Mémoire`, `Codex`, et toutes celles que tu trouveras :

1. Branche le CRUD générique livré par S (création, suppression, état vide avec issue).
2. **Peuple les collections vides d'un seed plausible et cohérent** avec le reste du produit :
   `people_agents` doit contenir des agents du domaine People (recrutement, onboarding RH,
   revue de performance…), avec les mêmes champs que la définition de collection. Ne recopie
   pas les agents du Dashboard : ce sont d'autres agents, sur un autre domaine.
3. Un compteur d'en-tête qui dit la vérité (`{n} members`, `{n} configured`) — il est déjà là,
   vérifie qu'il suit bien la collection après une création.

---

## CHANTIER 2 — Les pages de détail « ultra minimalistes »

Ouvre chaque fiche de chaque collection de l'app et regarde ce que voit l'utilisateur. Une
fiche qui n'affiche qu'un titre et deux lignes est de la dette, pas un design.

Le dépôt a déjà des pages de détail riches et abouties : regarde
`src/apps/clients/ClientsDetailPage.tsx` et `src/apps/sales/SalesItemDetail.tsx` pour le
niveau attendu — en-tête avec statut, métriques, sections thématiques, actions en pied de page,
navigation précédent/suivant. **Aligne les détails de People sur ce niveau**, en gardant
l'identité de l'app (accent cyan `#0891b2` pour les trois sections de profondeur).

Chaque détail doit porter au minimum : un en-tête identifiant + statut, deux à quatre
métriques dérivées de l'item, une section de contenu propre à l'entité, et **au moins une
action** qui fait quelque chose d'observable.

---

## CHANTIER 3 — « Nouveau scénario » et Approvals décrochés des Agents

La page `Approvals` est la file d'approbation du B1 Gatekeeper : les outils d'écriture des
agents y déposent des propositions, l'humain valide, la fusion est atomique. C'est le bon
modèle. Le problème est le raccord :

- Le bouton **« + Nouveau scénario »** crée un scénario vide, sans agent associé, nommé
  « Nouveau scénario » — l'utilisateur en a cinq identiques à l'écran, tous à « 0 propositions ».
  Un scénario doit être **rattaché à un agent** et porter un intitulé qui dit ce qu'il fait.
  À la création : demande l'agent concerné et l'intitulé, ou dérive-les du contexte.
- Depuis la fiche d'un agent, on doit pouvoir **voir ses scénarios** et en ouvrir un.
- Depuis un scénario, on doit pouvoir **remonter à l'agent** qui l'a produit.
- Les scénarios vides et jamais utilisés doivent être supprimables (le bouton corbeille existe,
  vérifie qu'il fonctionne et qu'il confirme avant d'agir).

Le lien entre un scénario et un agent doit être **une vraie donnée** (un champ `agentId` sur le
scénario), pas une convention de nommage.

---

## CHANTIER 4 — « les pages d'en bas »

Les dernières sections du rail (`Cadence`, `Culture`, `Personas`, `Mémoire`, `Codex`) sont
celles que l'utilisateur désigne par « les pages d'en bas ». Passe-les au même crible que les
autres : collection branchée au CRUD, état vide avec issue, détail au niveau attendu,
au moins une action utile par page.

---

## Vérification obligatoire

Le rendu se vérifie **à l'écran**. Le serveur de dev tourne sur `http://localhost:5173`.

```bash
node tools/shot.mjs --app people --section "Team" --theme glassmorphism --out /tmp/p1.png
```

Labels exacts du rail : `Overview`, `Approvals`, `Team`, `Agents`, `Squads`, `Content`,
`Cadence`, `Culture`, `Personas`, `Mémoire`, `Codex`.

Pour une création, une capture ne suffit pas : pilote le navigateur (Playwright est dans
`~/gauntlet-eyes`, voir `tools/shot.mjs` pour le chargement), remplis le formulaire, soumets,
et **prouve que l'item apparaît dans la liste**. Un bouton qui ouvre un formulaire qui ne crée
rien, c'est le bug qu'on corrige — ne le reproduis pas.

## Ta boucle

```
passe 1 : parcours les 11 sections, liste les manques, range PAR CAUSE
passe 2 : chantier 1 (CRUD branché + seeds), c'est ce qui débloque le reste
passe 3 : chantiers 2, 3, 4
passe 4 : npx tsc --noEmit, ne lis que TES fichiers
passe 5 : reparcours les 11 sections à neuf
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

**Onze sections dans ton périmètre = onze sections dans ton rapport.**
Écris `_briefs/2026-08-10_vague2/RAPPORT_P_PEOPLE.md` — partiel si tu dois t'arrêter.
