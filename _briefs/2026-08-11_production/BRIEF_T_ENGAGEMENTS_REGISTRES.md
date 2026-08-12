---
id: T_ENGAGEMENTS_REGISTRES
campagne: 2026-08-11 — production
---

# BRIEF T — Engagements : Bauhaus, Brutalism, Neo-brutal, Memphis, Vapor

## Ton perimetre exclusif

```
public/site/engagements.html   (styles uniquement — le contenu ne bouge pas)
public/site/engagements.css    (NOUVEAU fichier, a creer et a lier depuis engagements.html)
tools/site-engagements.mjs     (nouveau — ta preuve)
```

**Interdit absolu** : `public/site/styles.css` et `public/site/paliers.css` —
**un autre agent travaille en parallele**. Toute regle va dans `engagements.css`, lie
apres `styles.css` dans le `<head>` de `engagements.html` uniquement. Egalement
interdits : les quatre autres pages HTML, `src/**` (tu **lis** `DesignApp.tsx`, tu ne le
modifies jamais), `supabase/**`, `deploy/**`.

Lis `GARDE_FOU.md`, `SOCLE.md` et **`public/site/BARRE.md`**.

Tu executes ce brief toi-meme. N'invoque aucun workflow, aucune skill, aucun agent delegue.

---

## L'etat

Six sections nommees et mesurees vertes : `#objections`, `#refus-01`, `#refus-02`,
`#refus-03`, `#refus-04`, `#tests`. **C'est la meilleure page du site** — jaune et noir,
cartes a polarite alternee, et surtout des lignes `TEST —` verifiables que personne ne peut
copier-coller. On l'amplifie, on ne la casse pas.

Un defaut de grille y a ete corrige aujourd'hui : `#refus-03` avait ses paragraphes dans
une colonne de 80 px. Ne le reintroduis pas.

**Le contenu est arbitre et ne se reecrit pas.** Ce brief est visuel.

## Les registres — `src/apps/design/DesignApp.tsx`, lecture seule

| Section | Registre | Legende d'origine · pourquoi celui-la |
|---|---|---|
| `#objections` | **Bauhaus** | *« Less is boring. Less is more. » · grilles asymetriques, primitives geometriques, primaires*. Une ouverture qui affirme. Rouge `#dc2626`, jaune `#facc15`, bleu `#1d4ed8`, noir. |
| `#refus-01` | **Brutalism** | *« refuse le degrade poli · bordures 6px, aucun angle arrondi »*. C'est l'ADN actuel de la page — on le garde et on l'assume. |
| `#refus-02` | **Neo-brutal** | *« plus gros, plus fort que l'ancien brutalisme · blocs primaires, 5px, aucun fondu »*. Le refus le plus categorique de la page merite le registre le plus fort. |
| `#refus-03` | **Memphis** | *« le chaos est un systeme · gribouillis, points, triangles · le motif comme principe »*. Le deroule en quatre temps y gagne une structure vivante — **sans casser la grille 3 par ligne**. |
| `#refus-04` | **inchangé** | Papier austere, une colonne etroite. C'est le seul endroit calme, et c'est voulu : sur le prix, le ton haut dessert. Voir la note ci-dessous. |
| `#tests` | **Vapor** | *« nostalgie d'un futur qui n'a jamais ete livre »*. Les quatre tests verifiables ferment la page : le futur qui, lui, est livre. |

---

## Trois contraintes qui priment sur les registres

### 1. Pourquoi Vapor n'est PAS sur la section du prix

C'est un arbitrage, pas un oubli. `#refus-04` dit « PAS DE PRIX INVENTÉ ». Vaporwave est
ironique et nostalgique par definition — sur la question de l'argent, devant un acheteur
qui facture 500 a 2 000 $/h, ce registre ferait lire « on ne se prend pas au serieux » a
l'endroit exact ou il faut etre credible.

Vapor va donc sur `#tests`, ou l'ironie sert : la page se ferme sur ce qui **est**
verifiable, apres avoir listé ce qui ne le sera jamais.

Si tu juges cet arbitrage faux, **argumente-le dans ton rapport** — ne le change pas.

### 2. Vapor a droit au magenta. Rien d'autre sur cette page.

La BARRE §4.2 interdit le violet-magenta. Cette regle a ete ecrite contre un degrade
accidentel de generateur sur la page Paliers, pas contre un registre choisi.

**Exception documentee, une seule** : `#tests` peut utiliser la plage 250–330 HSL, parce
que Vaporwave n'existe pas sans elle. Ton outil doit donc verifier l'absence de violet sur
**les cinq autres sections** et l'autoriser dans `#tests` uniquement. Ecris cette exception
dans le code de l'outil, avec la raison.

Partout ailleurs, une seule occurrence fait echouer.

### 3. Le brutalisme reste a angles vifs

La page d'accueil a ete arrondie aujourd'hui — **pas celle-ci**. Brutalism et Neo-brutal
sont definis par leurs bordures epaisses et leurs angles droits ; les arrondir les detruit.
Les rayons de `styles.css` ne s'appliquent pas a tes sections, sauf au chassis (rail,
en-tete) qui ne t'appartient pas.

---

## Ce que tu ne changes pas

- **Un seul mot du contenu.** Les quatre lignes `TEST —` en particulier : ce sont les
  seules phrases du site qu'un prospect peut aller verifier lui-meme.
- La grille de `#refus-03` : **trois par ligne, deux lignes**. Verifie-le apres coup.
- Les `id`, `data-section`, et les ancres de la nav de page.
- Les balises `<head>` hors l'ajout du `<link>` vers `engagements.css`.

---

## Preuve exigee

`tools/site-engagements.mjs`, **exit non nul au moindre echec** :

1. **Six sections** intactes, chaque ancre resout et amene la section en vue.
2. **Cinq registres distincts** : `#objections`, `#refus-01`, `#refus-02`, `#refus-03`,
   `#tests` different deux a deux sur au moins **trois** proprietes calculees parmi
   `font-family`, `background-color`, `background-image`, `color`, `border-*`,
   `box-shadow`.
3. **Violet** : interdit sur les cinq sections hors `#tests`, autorise dans `#tests`.
   L'exception est ecrite et commentee dans l'outil.
4. **Contraste** ≥ 4.5:1 texte courant, ≥ 3:1 titres ≥ 24 px gras, aux trois largeurs.
   Memphis et Bauhaus sont les points a surveiller : leurs primaires saturees passent
   souvent juste sous le seuil.
5. **Grille de `#refus-03`** : exactement 3 cellules par ligne sur 2 lignes a 1440 px.
   Ce defaut a deja ete corrige aujourd'hui — un `grid-column: span 4` herite d'une
   ancienne grille de 12 colonnes mettait chaque carte seule sur sa ligne.
6. **Aucun effet sur du texte** (BARRE §4.1).
7. **`styles.css` inchange** : `git diff --stat public/site/styles.css` vide de ton fait.
8. **Non-regression** : `tools/site-rail.mjs` et `tools/site-sections.mjs` restent verts.
9. **Zero erreur console, zero requete en echec.**

Captures pleine hauteur a **1440 x 900, 900 x 1000, 390 x 844** dans
`C:/Users/amado/AppData/Local/Temp/engagements-<largeur>.png`.

**Hauteurs reelles obligatoires** — un harnais de ce depot capturait le telephone en
390 x 242, une fente, et rendait un verdict faux.

**Serveur de developpement sur le port 5173.** Ne code pas 4173 en dur.

---

## Rapport

`_briefs/2026-08-11_production/RAPPORT_T_ENGAGEMENTS_REGISTRES.md`, **au fil de l'eau**.
Sortie des outils, captures, ce que tu n'as pas reussi a faire, et ton avis sur
l'arbitrage Vapor si tu le contestes.
