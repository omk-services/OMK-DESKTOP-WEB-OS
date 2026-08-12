---
id: S_PALIERS_REGISTRES
campagne: 2026-08-11 — production
---

# BRIEF S — Paliers : Bento, Drawn, Aurora, Liquid, Retro 57

## Ton perimetre exclusif

```
public/site/paliers.html      (styles uniquement — le contenu ne bouge pas)
public/site/paliers.css       (NOUVEAU fichier, a creer et a lier depuis paliers.html)
tools/site-paliers.mjs        (nouveau — ta preuve)
```

**Interdit absolu** : `public/site/styles.css` et `public/site/engagements.css` —
**un autre agent travaille en parallele**. Toute regle que tu poses va dans
`paliers.css`, lie apres `styles.css` dans le `<head>` de `paliers.html` uniquement.
Egalement interdits : les quatre autres pages HTML, `src/**` (tu **lis**
`src/apps/design/DesignApp.tsx`, tu ne le modifies jamais), `supabase/**`, `deploy/**`.

Lis `GARDE_FOU.md`, `SOCLE.md` et **`public/site/BARRE.md`**.

Tu executes ce brief toi-meme. N'invoque aucun workflow, aucune skill, aucun agent delegue.

---

## L'etat

`paliers.html` a **six sections** deja nommees et mesurees vertes : `#offre`, `#poc`,
`#saas`, `#marque-blanche`, `#souverainete`, `#sortie`. Le dégradé violet-magenta a ete
retire ce matin, ainsi qu'un prix indicatif invente qui contredisait la page Engagements.

**Le contenu est arbitre et ne se reecrit pas.** Ce brief est visuel.

## Les registres — `src/apps/design/DesignApp.tsx`, lecture seule

| Section | Registre | Legende d'origine · pourquoi celui-la |
|---|---|---|
| `#offre` | **Bento** | *« chaque case tient exactement une chose · la grille est l'agenda »*. Quatre paliers, quatre cases. Rice paper + encre + ocre. |
| `#poc` | **Drawn** | *« traits tremblés · anti-parfait comme choix »*. C'est un essai, pas un contrat. |
| `#saas` | **Aurora** | *« dégradés de maillage + orbes flous · chaleur sans la saturation »*. Le régime courant, celui où l'on reste. |
| `#marque-blanche` | **Liquid** | *« une surface qui se reflète elle-même »*. Le produit prend vos couleurs — littéralement. |
| `#souverainete` | **Retro 57** | *« orbitales atomiques + demi-teintes + pastels »*. Le seul palier qui parle de machines. |
| `#sortie` | inchangé | La bande orange marche. N'y touche pas. |

**Emprunte les valeurs reelles du fichier** — hex, graisses, rythmes. Le site et le bureau
doivent se ressembler.

---

## Deux contraintes qui priment sur les registres

### 1. Aucun violet, malgre Aurora et Liquid

Ces deux registres tirent naturellement vers le magenta. **La page en sortait ce matin.**

Borne-les : aucune couleur appliquée avec une teinte HSL entre **250 et 330** et une
saturation > 25 %. Aurora se fait en teal / ambre / sable ; Liquid en chrome froid,
ardoise et cuivre. Ils gardent leur mecanique — maillage, orbes, reflets — sans leur
palette par defaut.

C'est verifie mecaniquement par ton outil. Une seule occurrence fait echouer.

### 2. Drawn ne decredibilise pas le palier d'entree

Le tremblé reste sur **les traits, les cadres, les soulignements**. Jamais sur la
typographie des engagements, ni sur les mentions `EXISTE AUJOURD'HUI`. Un coach qui evalue
un outil a 500 $/h de facturation ne doit pas lire « brouillon » la ou on lui dit ce qui
existe.

---

## Ce que tu ne changes pas

- **Un seul mot du contenu.** Si un texte manque, tire-le de l'existant, ne l'invente pas.
  Un prix invente a deja du etre retire de cette page aujourd'hui.
- Les mentions `PRÉVU — PAS ENCORE OUVERT À LA COMMERCIALISATION`, en toutes lettres.
- Les balises `<head>` hors l'ajout du `<link>` vers `paliers.css`.
- Les `id` et `data-section` des six sections, et les ancres de la nav de page.

---

## Preuve exigee

`tools/site-paliers.mjs`, **exit non nul au moindre echec** :

1. **Six sections** intactes, chaque ancre de la nav resout et amene la section en vue.
2. **Cinq registres distincts** : les sections `#offre`, `#poc`, `#saas`,
   `#marque-blanche`, `#souverainete` different deux a deux sur au moins **trois**
   proprietes calculees parmi `font-family`, `background-color`, `background-image`,
   `color`, `border-*`, `box-shadow`.
3. **Pas de violet** : echec si une couleur appliquee a une teinte HSL 250–330 avec
   saturation > 25 %. Nomme l'element fautif, pas juste un compte.
4. **Contraste** ≥ 4.5:1 texte courant, ≥ 3:1 titres ≥ 24 px gras, aux trois largeurs.
   Aurora et Retro 57 sont les points a surveiller : leurs fonds clairs avalent le texte.
5. **Aucun effet sur du texte** : rien ne recouvre le rectangle d'un bloc de texte
   (BARRE §4.1 — c'est le defaut qui a coute la page d'accueil ce matin).
6. **`styles.css` inchange** : `git diff --stat public/site/styles.css` vide de ton fait.
   Colle la sortie.
7. **Non-regression** : `node tools/site-rail.mjs` et `node tools/site-sections.mjs`
   restent verts.
8. **Zero erreur console, zero requete en echec.**

Captures pleine hauteur a **1440 x 900, 900 x 1000, 390 x 844** dans
`C:/Users/amado/AppData/Local/Temp/paliers-<largeur>.png`.

**Hauteurs reelles obligatoires** : un harnais de ce depot deduisait la hauteur de la
largeur et capturait le telephone en 390 x 242 — une fente, pas un ecran — et le verdict
qui en sortait etait faux.

**Le serveur de developpement est sur le port 5173.** Ne code pas 4173 en dur : un outil
de cette campagne l'a fait et rend `ERR_CONNECTION_REFUSED`, donc un faux rouge.

---

## Rapport

`_briefs/2026-08-11_production/RAPPORT_S_PALIERS_REGISTRES.md`, **ecrit au fil de l'eau**.
Sortie des outils, liste des captures, ce que tu n'as pas reussi a faire.

Si une partie de ce brief te parait fausse, argumente dedans — mais **jamais en silence**.
