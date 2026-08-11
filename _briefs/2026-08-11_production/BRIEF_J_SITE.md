---
id: J_SITE
campagne: 2026-08-11 — production
supersede: BRIEF_I_LANDING_V2.md
---

# BRIEF J — le site web : un style par section, deux niveaux de navigation, Canvas UI

## Ton perimetre exclusif

```
src/site/**                (a creer — remplace src/landing/)
public/site/**             (a creer — remplace public/landing/)
package.json               (dependances Canvas UI uniquement)
```

**Interdit** : `src/apps/**`, `src/onboarding/**`, `src/components/auth/**`, `supabase/**`.
Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Le verdict de l'utilisateur sur l'existant

> « la landing page et la page d'auth sont de pure AI Slop autant sur les contenus que sur le
> design d'interface »

Il a raison, et le diagnostic est precis : la page actuelle decline **une seule grammaire
visuelle** sur six sections. Meme fond creme, memes cartes, meme rythme. C'est reproductible
sans effort, donc sans valeur.

Sa doctrine, a prendre au serieux :

> « Avec la commoditisation de l'IA je n'ai pas d'autre choix que la diversification et la
> complexification a outrance pour combattre l'IA slop, qui n'est que la fatigue de la
> banalisation que tout le monde reproduit aussi facilement que sans effort. »

**Attention au contresens.** « Complexification » ne veut pas dire « charge ». Une page lente,
illisible ou tape-a-l'oeil est une autre forme de banalite. Ce qu'il faut viser : une richesse
**qu'on ne peut pas obtenir en une invite** — des choix argumentes, une densite d'intention,
des transitions entre registres qui ont un sens.

## Ce que ce n'est PAS

> « ce que je demande n'est pas juste une landing page [...] autant que mon Coach OS n'est pas
> un simple dashboard comme le Foundry de Palantir »

Tu construis un **site**, pas une page. Plusieurs pages, une identite par section, et une
architecture de navigation a deux etages.

---

## Ressources, toutes LOCALES — n'ouvre aucun site distant

### 1. UI UX Pro Max — `C:\Users\amado\ui-ux-pro-max\`

Ce n'est pas une bibliotheque de composants : c'est un **corpus de renseignement de conception**.
Version 2.13.0, MIT. Contenu mesure :

`src/ui-ux-pro-max/data/` :
- **`styles.csv`** — **84 styles**, 22 colonnes chacun. Les colonnes decisives :
  `Best For`, `Do Not Use For`, `Light Mode`, `Dark Mode`, `Performance`, `Accessibility`,
  `Conversion-Focused`, `Complexity`, `AI Prompt Keywords`, `CSS/Technical Keywords`,
  `Implementation Checklist`, `Design System Variables`.
- `colors.csv` (192 palettes) · `typography.csv` (74 appariements) · `ux-guidelines.csv`
  (98 regles) · `landing.csv` · `motion.csv` · `ui-reasoning.csv` · `products.csv` ·
  `icons.csv` · `charts.csv`.

`projects/saas-landing/` — un projet de reference complet. **Lis-le avant d'ecrire.**

### 2. Canvas UI — `C:\Users\amado\canvas-ui\`

Composants « html-in-canvas » : Ripple, Liquid, Glass, Frost, Shatter, Displacement, Glitch,
Particle Reveal, Decrypt Reveal, Peel, Magnify, Force Field, Laser, VHS, Retro Dither, Bend,
Cloth, Clouds, Bubble, Blaze, Flame Wrap, Hex Float, Grid, Ascii... Ils vivent dans
`src/components/`. Le depot est en Next.js — **tu adaptes a Vite/React 19**, tu ne portes pas
Next.

L'utilisateur precise : Canvas UI **n'a pas pu etre integre au Web Desktop** a cause de sa
complexite, mais **doit** l'etre sur le site. C'est ici qu'il a sa place.

---

## Chantier 1 — l'architecture a deux etages

Deux barres distinctes, qui ne font pas le meme travail :

- **En-tete — navigation multi-pages.** Persistante, sobre, identique partout. Elle porte les
  pages du site et l'entree vers l'application.
- **Sous l'en-tete — navigation intra-page, horizontale.** Elle liste les sections de la page
  courante, suit le defilement, et marque la section active. Elle change de page en page.

C'est la demande explicite : *« le menu in-page en horizontal et un menu multipage en header »*.

Pages proposees, a trancher et justifier : `/` · `/methode` (le diagnostic de l'audit) ·
`/paliers` (les quatre paliers et la souverainete) · `/engagements` · `/demo`.

## Chantier 2 — un style par section, choisi et non tire au sort

**La regle qui separe la diversite du patchwork :** chaque section recoit un style de
`styles.csv` choisi parce que sa colonne `Best For` correspond au propos de la section, et que
sa colonne `Do Not Use For` ne l'exclut pas. **Tu cites les deux colonnes dans ton rapport pour
chaque choix.** Un style pris pour son allure, sans cet argument, sera refuse.

Applique ses `Design System Variables` et sa `Implementation Checklist` — ils sont dans le CSV,
ne les invente pas.

**La colonne vertebrale** — ce qui ne change jamais, sinon le site se disloque :

- la grille et la largeur maximale du contenu ;
- le comportement des deux barres de navigation ;
- le temps de transition entre sections (une seule valeur pour tout le site) ;
- la forme et la position de l'appel a l'action principal ;
- le pied de page.

Tout le reste — typographie, palette, cartes, ombres, texture, mouvement — **varie par
section**. Le passage d'une section a l'autre doit se sentir comme un changement de chapitre,
pas comme un changement de site.

## Chantier 3 — Canvas UI, un effet par section, jamais decoratif

Chaque effet doit **dire quelque chose**. Quelques associations a challenger :
`Decrypt Reveal` sur une section qui parle de donnees illisibles rendues lisibles ;
`Frost` ou `Glass` sur la souverainete (on voit a travers, mais c'est protege) ;
`Shatter` sur les engagements (ce qu'on refuse de faire) ; `Particle Reveal` sur l'entree en
demonstration.

Trois garde-fous non negociables :
1. **Un seul effet lourd visible a la fois.** Les autres se montent a l'approche et se
   demontent en sortie de champ (`IntersectionObserver`).
2. **`prefers-reduced-motion` fige tout.** Un repli statique doit exister pour chaque effet.
3. **Aucun effet ne se met entre le lecteur et le texte.** Si un effet gene la lecture d'un
   paragraphe, il passe en arriere-plan ou il saute.

Mesure le cout : si une page depasse **2,5 s** de rendu utile sur un portable ordinaire, allege.

## Chantier 4 — le contenu, aussi

L'utilisateur juge le contenu « slop » autant que le design. Le fond actuel vient de
`audit.pdf` et des documents APOLLO — la matiere est bonne, c'est **l'ecriture** qui est plate.

Reprends chaque section : une idee par phrase, un chiffre ou un fait verifiable par argument,
zero formule de brochure. Bannis « revolutionnaire », « puissant », « sans effort »,
« transformez ». Si une phrase pourrait figurer sur le site d'un concurrent sans changer un
mot, elle est a reecrire.

## Chantier 5 — la repartition par app

L'utilisateur demande « une repartition des composants par sections et par app ». Produis
`src/site/REPARTITION.md` : un tableau qui associe chaque section du site et chaque app de
Coach OS a son style `styles.csv` et a son composant Canvas UI. C'est la carte qui evitera que
la prochaine passe reparte de zero — et elle servira aussi a diversifier les 19 apps plus tard.

---

## Preuve exigee

- une capture par page, en 1280 px et 375 px ;
- **le tableau des choix** : section -> style retenu -> citation de `Best For` -> effet Canvas
  UI -> pourquoi ;
- contraste mesure sur le texte courant de **chaque** registre, avec le chiffre ;
- `prefers-reduced-motion` actif : capture prouvant que tout est fige ;
- zero erreur console sur chaque page ;
- la navigation a deux etages fonctionne : on change de page par l'en-tete, de section par la
  barre horizontale, et la section active est marquee au defilement.

Rapport : `_briefs/2026-08-11_production/RAPPORT_J_SITE.md`, ecrit au fil de l'eau.
