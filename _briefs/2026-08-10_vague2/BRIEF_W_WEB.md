---
id: W_WEB
campagne: 2026-08-10 vague 2 — fonctionnalités oubliées
ordre: 3 — après S
---

# BRIEF W — Welcome, Marketplace, et l'audit du reste

## Ton périmètre exclusif

```
src/apps/welcome/**
src/apps/marketplace/**
src/apps/onboarding/**
src/apps/design/**
src/apps/ontology/**
src/apps/settings/**
src/apps/legal/**
src/apps/audit/**
src/apps/cognition/**
```

**Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`, `src/apps/_ui/`,
et les apps confiées aux autres agents (`dashboard`, `people`, `sales`, `finance`, `clients`,
`growth`, `operations`, `tasks`, `product`, `it-rd`).

---

## CHANTIER 1 — Welcome : la page Demo doit passer en 2ᵉ position

`src/apps/welcome/landing/landingPages.ts` déclare neuf pages dans cet ordre :

```
1. domaine-1-rh-meta-gouvernance
2. domaine-2-operations
3. domaine-3-growth
4. domaine-4-cognition-savoir
5. domaine-5-people-scalabilite
6. domaine-6-finance
7. domaine-7-it-rd
8. domaine-8-legal-conformite
9. onboarding-demo        ← la Demo, en dernier
```

`onboarding-demo` (affichée « OMK Coach Demo ») doit passer **en 2ᵉ position**, juste après
l'Arrivée et avant `domaine-1`. C'est la page qu'un prospect doit trouver en premier ; elle est
aujourd'hui enterrée en bas du rail.

Déplace la **déclaration** dans le tableau — ne renomme pas son `id`, d'autres endroits peuvent
le référencer (vérifie par grep avant). Contrôle que le rail latéral, la navigation par ancres
et le fil d'Ariane suivent tous le nouvel ordre.

---

## CHANTIER 2 — Marketplace : la navigation meurt quand un détail est ouvert

Reproduit par l'utilisateur : dans Marketplace, une fiche de détail ouverte, cliquer une autre
section du rail (`Browse` / `Installed` / `Featured`) ne fait rien.

L'agent S a traité la cause côté socle (`--sidebar-w` non publiée ⇒ `AppDetailOverlay` retombe
sur `left: 0` et recouvre le rail). **Lis son rapport avant de commencer.**

Ton travail ici : vérifier que Marketplace en bénéficie réellement, et corriger ce qui reste
**côté app** — notamment le fait que changer de section pendant qu'un détail est ouvert doit
**fermer le détail** (sinon on navigue derrière un calque). Le motif correct est déjà en place
dans `AppFrame.navigateToSection` (`detail?.onBack(); setDetail(null);`) : assure-toi que
Marketplace publie bien son détail via `useWindowPage().setDetail`, comme le font Clients et
Dashboard, plutôt que via un `useState` local que le frame ne connaît pas.

**Vérification par le rendu, obligatoire** : ouvrir Marketplace → ouvrir une fiche → cliquer
`Installed` → prouver que la section a changé et que le détail s'est fermé. Playwright est dans
`~/gauntlet-eyes` (voir `tools/shot.mjs` pour le chargement).

Applique le même test à **chaque app de ton périmètre** qui a des pages de détail : le défaut
est générique, il y a peu de chances qu'il ne touche que Marketplace.

---

## CHANTIER 3 — L'audit des fonctionnalités oubliées

Sur chaque app de ton périmètre, cherche ce que l'utilisateur appelle « les manquements » :

1. **Collections sans CRUD** — l'agent S a ajouté un CRUD générique à `CollectionRepeater`
   (lis son rapport, section « API du CRUD générique »). Toute page de ton périmètre qui rend
   une collection sans pouvoir y ajouter d'item doit être branchée.
2. **Écrans vides sans issue** — un « No items yet » sans bouton de création est un cul-de-sac.
3. **Pages de détail squelettiques** — le niveau attendu est celui de
   `src/apps/clients/ClientsDetailPage.tsx` : en-tête + statut, métriques, sections, actions.
4. **Boutons qui ne font qu'un toast** — un toast n'est pas une fonctionnalité. Soit l'action
   produit un effet observable (mutation, navigation, téléchargement), soit le bouton disparaît.
5. **Formulaires incomplets** — champ non contrôlé, validation absente, pas de retour d'erreur,
   liste qui ne se rafraîchit pas.

Range tes trouvailles **par cause**, corrige la cause qui explique le plus de symptômes d'abord.

---

## Ta boucle

```
passe 1 : chantiers 1 et 2 (les deux bugs nommés par l'utilisateur), d'abord
passe 2 : chantier 3, app par app, défauts rangés PAR CAUSE
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU
passe 5 : reparcours tout ton périmètre à neuf
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

**Neuf apps dans ton périmètre = neuf apps dans ton rapport.**
Écris `_briefs/2026-08-10_vague2/RAPPORT_W_WEB.md` — partiel si tu dois t'arrêter.
