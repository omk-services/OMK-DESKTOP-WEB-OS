---
id: I_LANDING_V2
campagne: 2026-08-11 — production
---

# BRIEF I — la page d'atterrissage devient un site : plusieurs pages, un registre par section

## Ton perimetre exclusif

```
src/landing/**
public/landing/**
```

**Interdit** : `src/onboarding/**` et `src/apps/it-rd/embedded/**` (agent G y travaille en ce
moment), toute app, `supabase/**`. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## L'existant, qu'il ne faut PAS jeter

L'agent E a livre une page qui tient. **Le fond est bon et se conserve** : les trois fuites, les
six grilles du diagnostic tirees de `audit.pdf`, le tableau des quatre paliers avec la colonne
« ou vivent vos donnees », et les quatre engagements formules en negatif. Le ton aussi — sobre,
sans superlatif, chaque phrase verifiable.

Structure actuelle mesuree, six sections sur **une seule page** :

| # | id | titre |
|---|---|---|
| 0 | hero | Le bureau qui tient votre methode — pas l'inverse. |
| 1 | (probleme) | Trois fuites qui vident une pratique sans qu'on les voie |
| 2 | diagnostic | Le diagnostic avant l'outil |
| 3 | paliers | Quatre paliers. Pas de piege. |
| 4 | engagement | Ce qu'on ne fait pas |
| 5 | cta | Deux entrees |

Zero erreur console. La page rend en 1280 px et en 375 px.

## Ce que l'utilisateur demande

> « je veux des designs differents par sections avec differents pages »

Deux chantiers distincts. Ne confonds pas.

---

## Chantier 1 — un site de plusieurs pages

Aujourd'hui la navigation haute pointe des **ancres** dans un document unique. Il faut de
vraies pages, chacune avec sa propre URL, son propre titre et sa propre meta-description.

Decoupage propose — **tranche-le toi-meme si tu vois mieux, en justifiant** :

- `/` — l'accueil : la promesse, les trois fuites, et les deux entrees. Court, il doit se lire
  en moins d'une minute.
- `/diagnostic` — les six grilles de l'audit. Elles meritent leur page : c'est la piece qui
  prouve qu'il y a une methode derriere l'outil, et elle est actuellement compressee.
- `/paliers` — les quatre paliers et la souverainete des donnees. C'est l'argument commercial
  le plus fort ; noye au milieu d'une page longue, il se perd.
- `/engagements` — ce qu'on ne fait pas. Une page qui peut se citer et s'envoyer telle quelle.
- `/demo` — l'entree en demonstration, avec les identifiants publics affiches (voir chantier 3).

Chaque page porte une navigation coherente, un fil d'Ariane, et un enchainement vers la
suivante — un visiteur ne doit jamais se retrouver en cul-de-sac.

**Contrainte technique** : le site est servi en statique depuis `public/landing/`. Un routage
par fichiers (`/diagnostic/index.html`...) suffit et evite d'ajouter un routeur. Si tu preferes
la version React de `src/landing/`, alors **branche-la reellement au routage** — E l'a laissee
inatteignable, ce qui est le pire des deux mondes.

## Chantier 2 — un registre visuel par section

Chaque section doit avoir **son propre traitement**, sans que le site cesse d'etre un seul site.

Puise dans les **vingt styles deja declares** dans `src/lib/dockSkins.ts` — Glassmorphism,
Claymorphism, Brutalism, Cyberpunk Neon, Soft UI, Editorial Mag, Y2K Chrome, Memphis,
Vaporwave, Bauhaus, Art Deco, Bento, Retro Future, Aurora Mesh, Terminal Mono, Wabi-sabi,
GenZ Linear, Hand-drawn, Neo-brutalist, Liquid Chrome. Ils existent, ils sont deja coherents
avec le produit, et les reutiliser evite d'inventer une vingt-et-unieme grammaire.

**La regle qui empeche le patchwork** : ce qui change est le *decor* — fond, cartes, bordures,
ombres, accents. Ce qui ne change **jamais** :

- l'echelle typographique et la famille de caracteres ;
- la largeur de la colonne de texte et le rythme vertical ;
- le traitement des appels a l'action — meme forme, meme place, meme comportement partout ;
- la barre de navigation.

Un lecteur doit sentir qu'il change de piece, pas de maison.

Associe chaque style au propos de sa section, ne tire pas au hasard. Quelques pistes, a
challenger : *Editorial Mag* pour le diagnostic (c'est un raisonnement, il se lit) ; *Bento*
pour les paliers (une grille de comparaison) ; *Brutalism* ou *Neo-brutalist* pour les
engagements (des affirmations franches, sans ornement) ; *Aurora Mesh* ou *Glassmorphism* pour
l'accueil. Justifie chaque choix en une ligne dans le rapport.

**Le contraste des textes principaux reste conforme dans TOUS les registres.** Mesure-le, ne
l'estime pas. Un style sombre qui rend un paragraphe illisible est un style qu'on ecarte.

## Chantier 3 — l'entree en demonstration, avec identifiants publics

Le compte de demonstration **existe et fonctionne**, verifie par une connexion reelle :

```
demo@coach-os.app  /  demo-coach-os
```

Il est rattache a l'organisation `demo-coach` du projet INTERN, son jeton porte bien
`org_id`, et il lit les vraies donnees du seed (6 clients, 5 affaires, 6 membres).

Sur la page `/demo`, affiche ces identifiants **derriere un bouton**, comme le fait CasaOS :
un encart sobre qui les revele au clic, avec un bouton « Ouvrir la demonstration » qui mene a
l'application. Pas de connexion automatique : l'utilisateur doit voir qu'il se connecte, c'est
ce qui rend la demonstration credible.

Ajoute une phrase qui desamorce l'inquietude : ce compte est public, partage, remis a zero
regulierement, et personne ne doit y deposer de donnee reelle.

---

## Preuve exigee

- **une capture par page**, en 1280 px et en 375 px ;
- le **contraste mesure** sur le texte courant de chaque registre, avec le chiffre ;
- zero erreur console sur chaque page ;
- la navigation : depuis l'accueil, on atteint les quatre autres pages et on revient ;
- si tu branches la version React, prouve qu'elle est **reellement atteignable** — E ne l'avait
  pas fait, et une page que personne ne peut ouvrir ne compte pas.

Rapport : `_briefs/2026-08-11_production/RAPPORT_I_LANDING_V2.md`, ecrit au fil de l'eau.
