---
id: R_METHODE
campagne: 2026-08-11 — production
---

# BRIEF R — Méthode : Editorial, Art Deco, Wabi-sabi

## Ton perimetre exclusif

```
public/site/methode.html      (refonte du <main>)
public/site/methode.css       (NOUVEAU fichier, a creer et a lier depuis methode.html)
tools/site-methode.mjs        (nouveau — ta preuve)
```

**Interdit absolu** : `public/site/styles.css` — **un autre agent y ecrit en ce moment**.
Toute regle que tu poses va dans `public/site/methode.css`, lie apres `styles.css` dans le
`<head>` de `methode.html` uniquement. Egalement interdits : les quatre autres pages HTML,
`src/**` (tu **lis** `src/apps/design/DesignApp.tsx`, tu ne le modifies jamais),
`supabase/**`, `deploy/**`.

Lis `GARDE_FOU.md`, `SOCLE.md` et **`public/site/BARRE.md`** avant de commencer.

Tu executes ce brief toi-meme, avec tes propres outils. N'invoque aucun workflow, aucune
skill, aucun agent delegue.

---

## L'etat

`methode.html` porte trois entrees dans sa nav de page — INTRODUCTION, SIX GRILLES, CODA —
et **aucun `data-section`** : les ancres ne resolvent vers rien de nomme. La page est en
serif editorial uniforme du haut en bas, sans rupture.

Le contenu, lui, est bon et **ne se reecrit pas** : « Le diagnostic avant l'outil », les six
grilles (maturite, donnees, nature de tache, automatisabilite, contexte, arbitrage), la
source canonique « Manuel de diagnostic IA », et la coda « ne sautez aucun niveau,
n'oubliez aucun cout, ne confiez jamais a l'IA ce qui n'a pas ete d'abord trace sur
papier ». Tu gardes chaque mot.

## Ou sont les registres

`src/apps/design/DesignApp.tsx`, lignes 51 a 70 — **lecture seule**. Trois registres
imposes, avec leurs legendes d'origine :

- **Editorial Mag** — *« Fraunces serif · bento · fine rule · high contrast »*,
  palette *« ink black + cream + gold »*. Dans l'app : « The fine rule between beauty and
  restraint. »
- **Art Deco** — *« stepped forms · vertical symmetry · gold leaf »*. Dans l'app :
  « The golden age of geometry », eventail rayonnant, Didot, symetrie a degres.
- **Wabi-sabi** — *« Japanese restraint · intentional asymmetry »*, palette
  *« washi cream + sumi ink + clay »*. Dans l'app : « incompleteness », sumi-e, asymetrie.

**Emprunte les valeurs reelles du fichier** — couleurs, graisses, rythmes. Le site et le
bureau doivent se ressembler ; c'est tout l'interet.

---

## Les trois sections

### 1. `#introduction` — **Editorial Mag**

Garde le titre « Le diagnostic avant l'outil » et le chapeau. Passe la section en editorial
assume : lettrine, filet fin, colonne de texte a 65 caracteres, encadre « Source canonique »
en creme et or a droite. Contraste haut, noir d'encre.

C'est le registre le plus proche de l'existant — la rupture doit venir des deux suivantes.

### 2. `#six-grilles` — **Art Deco**

**Le coeur de la page, et la ou tout se joue.** Six grilles = six degres.

Art Deco donne exactement la forme dont ce contenu a besoin : **formes en escalier et
symetrie verticale**. Les six grilles se lisent comme une montee — on ne saute pas un
degre, ce qui est litteralement ce que dit la coda.

- Chaque grille prend son degre, numerote en chiffres romains (I a VI), aligne sur un axe
  vertical central.
- Or `#c8a44a` ou la valeur exacte trouvee dans `DesignApp.tsx`, sur creme. Didot ou la
  serif haute des jeux existants.
- Un motif rayonnant **une seule fois**, en tete de section, pas repete par grille.
- Chaque grille dit : ce qu'elle teste, la question a se poser, et ce qui fait echouer.

**Aucun effet derriere du texte.** BARRE §4.1 — c'est le defaut qui a couté la page
d'accueil ce matin.

### 3. `#coda` — **Wabi-sabi**

La coda dit la retenue : « ne sautez aucun niveau, n'oubliez aucun cout, ne confiez jamais a
l'IA ce qui n'a pas ete d'abord trace sur papier ».

Wabi-sabi est le seul registre du catalogue qui sait dire ca : creme washi, encre sumi,
**asymetrie intentionnelle**, beaucoup de vide. Le texte ne se centre pas, il se decale. Un
seul trait a l'encre, pose de travers. Rien ne crie.

C'est la fin de la page : elle doit ralentir, pas relancer. Un lien discret vers
`/site/paliers.html`, sans bouton criard.

---

## Ce que tu ne changes pas

- **Un seul mot du contenu.** Ce brief est visuel. Si un texte manque pour une grille,
  tire-le du contenu deja present, ne l'invente pas.
- Les balises `<head>` hors l'ajout du `<link>` vers `methode.css`.
- Le rail lateral, l'en-tete de page, la grille, les jetons `:root` — ils vivent dans
  `styles.css`, qui t'est interdit.

Tu **ajoutes** `data-section` et `id` aux trois sections, et tu alignes les trois ancres de
la nav de page dessus. C'est le seul changement structurel autorise.

---

## Preuve exigee — mesuree, pas declaree

`tools/site-methode.mjs` (Playwright dans `/Users/amado/gauntlet-eyes/node_modules/playwright`),
**exit non nul au moindre echec** :

1. **Trois sections** avec `id` **et** `data-section` ; chaque ancre de la nav resout et
   amene la section dans la fenetre.
2. **Trois registres distincts** : les trois sections different deux a deux sur au moins
   **trois** proprietes calculees parmi `font-family`, `background-color`, `color`,
   `border-*`, `text-align`. Une page qui « change de registre » sans que ca se mesure n'a
   pas change de registre.
3. **Contraste** ≥ 4.5:1 texte courant, ≥ 3:1 titres ≥ 24 px gras, aux trois largeurs.
   L'or sur creme de la section Art Deco est le point a surveiller — c'est la combinaison
   qui rate le seuil le plus souvent.
4. **Aucun effet sur du texte** : aucun canvas, aucun pseudo-element decoratif ne recouvre
   le rectangle d'un bloc de texte.
5. **Pas de violet** : echec si une couleur appliquee a une teinte HSL entre 250 et 330
   avec saturation > 25 %.
6. **`styles.css` inchange** : `git diff --stat public/site/styles.css` doit etre vide de
   ton fait. Verifie-le et colle la sortie.
7. **Non-regression** : `node tools/site-rail.mjs` reste vert.
8. **Zero erreur console, zero requete en echec.**

Captures pleine hauteur a **1440 x 900, 900 x 1000, 390 x 844** dans
`C:/Users/amado/AppData/Local/Temp/methode-<largeur>.png`.

**Hauteurs reelles obligatoires.** Un harnais de ce depot deduisait la hauteur de la largeur
et capturait le telephone en 390 x 242 — une fente, pas un ecran — et le verdict qui en
sortait etait faux.

**Un correctif visuel sans capture apres n'est pas verifie.**

---

## Rapport

`_briefs/2026-08-11_production/RAPPORT_R_METHODE.md`, **ecrit au fil de l'eau**.
Sortie des outils, liste des captures, et ce que tu n'as pas reussi a faire.

Si une partie de ce brief te parait fausse, argumente dedans — mais **jamais en silence** :
l'agent J a rendu `exit 0` sans rapport, et tout son travail a du etre refait.
