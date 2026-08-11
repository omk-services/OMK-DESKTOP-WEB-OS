---
id: M_AUDIT
campagne: 2026-08-11 — production
---

# BRIEF M — l'app Onboarding est refaite de zero et devient « Audit »

## Ton perimetre exclusif

```
src/apps/audit/**              (a creer)
src/apps/onboarding/**         (a SUPPRIMER apres migration)
src/lib/app-discovery.tsx      (UNIQUEMENT la ligne d'enregistrement de l'app)
src/onboarding/TourOverlay.tsx (UNIQUEMENT l'en-tete de documentation)
package.json                   (dependances de visite uniquement)
```

**Interdit** : `src/site/**` et `public/site/**`, `src/apps/legal/**`, `deploy/**`,
`src/components/Desktop.tsx`, `supabase/**`. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Le verdict de l'utilisateur

> « tout est a refaire dans l'app onboarding, c'est une accumulation de dette technique qui
> n'etait pas prioritaire avant mais maintenant si, et son app interne de zero-PII sandbox ne
> peut meme pas etre deplacee pour pouvoir cliquer sur le bouton Next. C'est une tres mauvaise
> representation interne du web desktop. »

**Tu refais de zero.** Ne repare pas l'existant : il porte une erreur d'architecture.

## La cause racine, mesuree — a comprendre avant d'ecrire

`src/apps/onboarding/citadel/` **simule un bureau a fenetres a l'interieur du bureau a
fenetres**. Un faux dock (`MiniDock.tsx`), de fausses fenetres (`DemoWindowFrame.tsx`), un faux
gestionnaire de deplacement.

Et ce gestionnaire est faux jusque dans sa contrainte de bord, `DemoWindowFrame.tsx` ligne 45 :

```js
const y = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.dy));
```

Il borne sur **`window.innerHeight`** — la hauteur du navigateur entier — alors que la fausse
fenetre vit dans une app qui n'occupe qu'une partie de l'ecran. Elle peut donc descendre sous
la zone visible de sa propre app, et rien ne la ramene. D'ou le bouton `Next` inatteignable.

C'est exactement le defaut deja paye sur l'avatar d'agent cette nuit : **une contrainte de bord
calculee dans le mauvais referentiel**. La lecon vaut d'etre retenue : quand on reimplemente un
mecanisme que le socle fournit deja, on en reimplemente aussi les bugs.

**La correction n'est pas de reparer ce calcul. C'est de supprimer le gestionnaire en double.**

## Chantier 1 — supprimer la citadelle

Coach OS **est** un bureau a fenetres deplacables, gere par `useShellStore` et `AppFrame`. En
simuler un second a l'interieur produit forcement une version degradee du vrai.

Supprime `src/apps/onboarding/citadel/` en entier. L'app Audit devient une app **normale**,
avec ses sections dans la barre laterale, comme les dix-huit autres. Elle utilise le vrai
systeme de fenetres : celui qui fonctionne.

Si tu veux montrer a quoi ressemblera l'instance du coach, montre-le comme **contenu** — une
illustration, une liste, une grille de cartes. Pas comme un faux systeme d'exploitation.

## Chantier 2 — le renommage

Enregistrement actuel, `src/lib/app-discovery.tsx` :

```
id: 'onboarding', name: 'Onboarding', description: '4-question fit · demo-coach citadel'
```

Devient `id: 'audit'`, `name: 'Audit'`, avec une description **en francais** qui dit ce que
l'app fait.

**Piege a desamorcer** : l'identifiant `onboarding` est persiste dans le `localStorage` de
l'utilisateur (`coach-os-shell-layout-v1`, `coach-os:dock:v1`). Sans redirection silencieuse
`onboarding` -> `audit` a la lecture, une fenetre restauree pointera dans le vide. Ecris cette
redirection et **prouve-la** : poser une disposition contenant `onboarding`, recharger, montrer
que l'app Audit s'ouvre sans erreur.

## Chantier 3 — le fond : les six grilles d'audit.pdf

`C:\Users\amado\Downloads\audit.pdf` porte **six grilles de diagnostic** — maturite, donnees,
nature de tache, automatisabilite, contexte, arbitrage & ROI. Le site les presente publiquement
sur `/site/methode.html` ; **lis cette page**, elle est deja ecrite et validee.

L'app doit faire passer ce diagnostic au coach sur sa propre pratique. Aujourd'hui elle pose
quatre questions de qualification commerciale : c'est un entonnoir de vente deguise en audit.

Ce que tu livres :
- un parcours par grille, avec les questions qui permettent reellement de trancher ;
- a la fin, **un verdict argumente par grille** : ce qui est automatisable, ce qui ne l'est pas,
  et pourquoi. **Pas de score sur 100** — un jugement qu'un coach peut contester ;
- le resultat enregistre dans une collection CMS, relisible plus tard. Le CRUD generique existe
  (`src/components/cms/CollectionRepeater.tsx`) : la chaine complete doit etre prouvee, compteur
  avant et apres.

## Chantier 4 — la pile d'accueil, remise a sa place

L'agent G a elimine Usertour, Shepherd et Joyride au profit d'un moteur maison. Son argument
etait juste pour **un seul cas** : sur un bureau a fenetres flottantes, une bulle ancree au DOM
par `getBoundingClientRect()` ne peut pas suivre une fenetre deplacee dans un store Zustand.

Mais il a generalise cette elimination a tout, et l'orchestrateur l'a valide trop vite.
L'utilisateur a nomme le risque : *« il a cree le piege de l'abandon du stack d'onboarding que
je craignais »*. Ce qu'on perd en jetant Usertour, c'est **la possibilite pour un
non-technicien de modifier un parcours sans developpeur** — exactement la capacite dont il a
besoin.

Repartition a etablir, et a **ecrire en tete de `src/onboarding/TourOverlay.tsx`** pour
qu'aucune passe suivante ne refasse l'erreur :

| Surface | Nature | Outil |
|---|---|---|
| Bureau Coach OS | fenetres flottantes | **moteur maison** — le seul qui suive le store |
| Site `/site/` | document qui defile | **pile standard** |
| App Audit | flux lineaire en etapes | **pile standard** |

Tranche entre `usertour.js` (deja en dependance) et Shepherd. Critere dominant :
**l'utilisateur peut-il modifier un parcours sans ouvrir un editeur de code ?** Si aucune ne le
permet sans compte heberge, dis-le franchement au lieu de faire semblant.

---

## Preuve exigee

- l'app apparait sous le nom **Audit** sur le bureau — capture ;
- **plus aucun composant de `citadel/`** dans le depot — `git status` a l'appui ;
- une disposition persistee contenant `onboarding` se restaure sans casse — capture ;
- le parcours traverse les **six grilles** et rend un verdict argumente — capture de la fin ;
- le resultat apparait dans le CMS : compteur avant, compteur apres ;
- **le defaut d'origine est mort** : aucun element de l'app ne peut sortir de sa zone visible.
  Prouve-le en pilotant le navigateur — deplace ce qui est deplacable, verifie que tout reste
  atteignable ;
- `npx tsc --noEmit` propre sur TES fichiers, zero erreur console.

Rapport : `_briefs/2026-08-11_production/RAPPORT_M_AUDIT.md`, **ecrit au fil de l'eau**.
Si tu juges qu'une partie de ce brief est une mauvaise idee, dis-le et argumente dans le
rapport — c'est ainsi que G a eu raison sur le moteur maison. Mais jamais en silence.
