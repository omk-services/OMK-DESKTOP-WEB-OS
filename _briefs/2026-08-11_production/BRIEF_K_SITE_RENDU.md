---
id: K_SITE_RENDU
campagne: 2026-08-11 — production
suite_de: BRIEF_J_SITE.md
---

# BRIEF K — le site : appliquer réellement ce que J a planifié

## Ton perimetre exclusif

```
src/site/**
public/site/**
```

**Interdit** : tout le reste. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Ce que J a fait, et ce qu'il n'a pas fait

J a produit `src/site/REPARTITION.md`, et **il est bon** : 8 styles retenus sur les 84 de
`styles.csv`, 5 effets Canvas UI sur 33, chacun justifie par le sens. Brutalism + Shatter sur
les refus. Glassmorphism + Glass sur la souverainete. Terminal CLI + GlyphRain sur les
identifiants. **Ne rejette rien de cette carte : applique-la.**

Il a aussi livre l'architecture a deux etages, qui fonctionne : en-tete multi-pages et barre de
sections, verifies presents sur les cinq pages.

**Mais le rendu ne porte pas la carte.** Mesure faite au navigateur, apres avoir parcouru toute
la page :

| Ce qui etait promis | Ce qui est mesure |
|---|---|
| Un style par section | **1 seule police** sur toute la page d'accueil (`ui-sans-serif`) |
| Registres visuels distincts | 2 fonds quasi identiques : `#FAFAF7` et `#F4F1EA` |
| 5 effets Canvas UI | **0 element `<canvas>`** monte, au chargement comme apres defilement |
| Marqueurs d'effet | **0 element** portant `data-effect` / `data-canvas` |
| Rapport au fil de l'eau | **absent** — `exit 0` sans une ligne ecrite |

`public/site/effects.js` existe (5 Ko) et est bien reference dans le HTML, mais il ne monte
rien. Hypothese a verifier en premier : **ses selecteurs ne trouvent aucune cible**. C'est le
piege deja paye trois fois sur ce depot — un selecteur muet qui retombe sur un repli silencieux
au lieu d'echouer bruyamment.

---

## Ta mission

### 1. Faire monter les effets, ou dire pourquoi c'est impossible

Diagnostique `effects.js` **en l'executant**, pas en le lisant. Ajoute-lui un echec bruyant :
si une cible declaree est introuvable, il doit crier dans la console, jamais se taire.

Canvas UI est a `C:\Users\amado\canvas-ui\src\components\`. Le depot est en Next.js — **tu
adaptes a du JS de navigateur**, tu ne portes pas Next. Si un effet demande WebGL et une
chaine de compilation trop lourde pour une page statique, **remplace-le par un equivalent
canvas 2D qui produit le meme sens** et note la substitution. Un effet simple qui tourne vaut
mieux qu'un effet ambitieux absent.

Garde-fous inchanges : un seul effet lourd visible a la fois (`IntersectionObserver`),
`prefers-reduced-motion` fige tout, aucun effet entre le lecteur et le texte.

### 2. Appliquer les styles pour de vrai

Un style de `styles.csv`, ce n'est pas une couleur de fond. Chaque section doit changer sur
**au moins quatre** de ces axes :

- famille et graisse typographiques ;
- rayon des angles ;
- ombres (presence, direction, durete) ;
- bordures (epaisseur, couleur, style) ;
- fond (couleur, degrade, texture) ;
- densite : interlignage et espacement vertical.

Applique les colonnes `Design System Variables` et `Implementation Checklist` du CSV — elles
sont ecrites, ne les reinvente pas. Brutalism impose une police de caracteres franche, des
bordures noires epaisses et des ombres dures decalees ; s'il ne se distingue pas au premier
coup d'oeil d'une section Editorial, c'est qu'il n'est pas applique.

**La colonne vertebrale ne bouge pas** : grille, largeur maximale, comportement des deux
barres, duree de transition unique, forme de l'appel a l'action, pied de page.

### 3. Le contenu

J n'a pas retouche l'ecriture. Reprends chaque section : une idee par phrase, un fait
verifiable par argument, aucune formule de brochure. **Si une phrase pourrait figurer telle
quelle sur le site d'un concurrent, elle est a reecrire.**

---

## Criteres d'acceptation — MESURES, pas declares

Ecris `tools/site-diversite.mjs` qui pilote un navigateur, parcourt les cinq pages, et rend ces
chiffres. **Colle sa sortie dans ton rapport.** Sans elle, le travail est refuse.

| Mesure | Seuil a atteindre |
|---|---|
| Polices distinctes sur l'ensemble du site | **>= 4** |
| Fonds distincts sur l'ensemble du site | **>= 6** |
| Rayons d'angle distincts | **>= 4** |
| Elements `<canvas>` montes apres defilement complet | **>= 4** |
| Erreurs console | **0** |
| Rendu utile par page | **< 2,5 s** |
| Contraste du texte courant, par registre | **>= 4.5:1**, chiffre par section |

Le script doit **echouer avec un code de sortie non nul** si un seuil n'est pas atteint. Un
script qui rend « vert » sans mesurer est pire que pas de script — trois verdicts faux ont deja
ete produits ainsi ici.

En plus : une capture par page en 1280 px et 375 px, plus une capture avec
`prefers-reduced-motion: reduce` prouvant que tout est fige.

## Le rapport n'est pas optionnel

`_briefs/2026-08-11_production/RAPPORT_K_SITE_RENDU.md`, **ecrit au fil de l'eau**, pas a la
fin. J a rendu `exit 0` sans rapport : impossible de savoir ce qu'il avait tente, renonce, ou
juge impossible. Si tu t'arretes en route, le rapport partiel doit deja dire ce qui tient et ce
qui ne tient pas.

**Dire « je n'ai pas reussi a monter les effets Canvas UI, voici pourquoi » est un resultat
acceptable. Rendre un succes silencieux ne l'est pas.**
