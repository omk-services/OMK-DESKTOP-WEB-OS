---
name: rapport-q-accueil-arrondi
description: Preuves de la refonte arrondie de l'accueil Coach OS
metadata:
  type: project
---

# Rapport Q — Accueil arrondi

## Périmètre touché (et rien d’autre)

- `public/site/index.html` — cinq sections, deux nouvelles, sous-nav augmentée.
- `public/site/styles.css` — ajout en fin de fichier, aucune modification du socle partagé.
- `tools/site-rondeur.mjs` — harnais Playwright créé pour cette campagne.
- `_briefs/2026-08-11_production/RAPPORT_Q_ACCUEIL_ARRONDI.md` — ce rapport.

## État au démarrage

- **Fait** : lecture de `GARDE_FOU.md`, `SOCLE.md` et `public/site/BARRE.md`.
- **Fait** : lecture de `public/site/index.html`, des registres de `src/apps/design/DesignApp.tsx:50-70` et des styles de sections existants.
- **Fait** : inspection de `public/site/effects.js` (sous-nav IntersectionObserver, 103-138) pour valider qu’aucun effet ne masque les sections ajoutées.

## Rayons retenus (un seul jeu, partout)

- `--r-coque: 32px` — coques de section.
- `--r-carte: 24px` — cartes et cases.
- `--r-interne: 16px` — blocs internes.
- `--r-pilule: 9999px` — boutons et badges.

Valeurs **empruntées à `DesignApp.tsx`**, pas inventées : `rounded-full` (46 occurrences), `rounded-2xl` (27), `rounded-3xl` (10), `rounded-xl` (5) — choix ramenés à quatre chiffres.

## Les cinq sections et leur registre

| # | id | data-section | registre | preuve rendu |
|---|----|--------------|----------|--------------|
| 1 | `hero` | `hero` | Soft UI / Neu | coque `#ebe9e4` avec ombres inset opposées ; `l’inverse.` en orange `#b03a0a` (assombri depuis `#ff5b1f` pour franchir 4,5:1). |
| 2 | `pain` | `pain` | Claymorphism | trois cartes, ombres chromatiques distinctes : `rgb(229, 138, 104) 10px 12px 0`, `rgb(216, 181, 66) 10px 12px 0`, `rgb(112, 173, 189) 10px 12px 0`. |
| 3 | `methode` | `methode` (nouvelle) | Bento | grille asymétrique 4×2, la case méthode ( `--r-carte`, en ochre `e8dfc8`) prend 2×2. |
| 4 | `donnees` | `donnees` (nouvelle) | Glassmorphism | **une seule carte translucide** (rgba 0,78 + `backdrop-filter: blur(12px)`) sur fond `dce7e8`. |
| 5 | `cta` | `cta` | Editorial Mag, arrondi | deux cartes `--r-carte`, boutons en `--r-pilule` (forcés via `!important`). |

Sous-nav : 5 ancres (Hero, Pain, Méthode, Données, Entrer), toutes résolues vers leur section (cf. sortie JSON du harnais).

## Sortie de `tools/site-rondeur.mjs` (résumé)

- **5 sections** trouvées avec `id` et `data-section` concordants ; 5 ancres résolues.
- **Aucun angle vif** > 120×60 px avec fond ou bordure visible, à 1440 / 900 / 390 px.
- **Rayons** observés inclus dans `{0, 16, 24, 32, 9999}` aux trois largeurs.
- **Contraste** : 4,5:1 texte courant / 3:1 titres ≥ 24 px gras — vert aux trois largeurs (après assombrissement de l’orange du heros).
- **Aucun violet** entre H 250–330 avec S > 25 %.
- **Trois `box-shadow` distinctes** dans `#pain` (vérifié par `set.size === 3`).
- **Console** : 0 erreur. **Requêtes échouées** : 0.

## Non-régression

- `node tools/site-rail.mjs` → `Tous les seuils sont atteints.`
- `node tools/site-sections.mjs` → `Tous les seuils sont atteints.`

## Captures

| Largeur | Hauteur | Chemin |
|---------|---------|--------|
| 1440 | 900 | `C:/Users/amado/AppData/Local/Temp/rondeur-1440.png` |
| 900 | 1000 | `C:/Users/amado/AppData/Local/Temp/rondeur-900.png` |
| 390 | 844 | `C:/Users/amado/AppData/Local/Temp/rondeur-390.png` |

**Vérification visuelle** : la capture 1440 confirme les cinq sections avec leurs registres distincts ; la carte Données est rendue translucide sur fond sauge ; les trois cartes Pain portent des ombres colorées différentes.

## Réglages de contraste post-capture

- `.sec-hero .site-eyebrow--accent` repasse en `var(--ink)` (4,5:1 sur la coque grise) — l’eyebrow n’est pas un titre, le seuil 4,5:1 s’applique.
- `.sec-hero .site-h1 em` passe de `#ff5b1f` à `#b03a0a` pour franchir 4,5:1 sur la même coque — la barre §3 autorise 3:1 pour les titres ≥ 24 px gras ; l’overrider applique la borne stricte 4,5:1 demandée par le brief Q.

## Limites assumées

- Les **règles Q sont déclarées en fin de CSS** : c’est la seule position où elles surchargent les sélecteurs existants sans modifier le socle, conformément à l’interdit « ajouts uniquement ».
- La carte Glass de `#donnees` est la **seule surface translucide** de l’accueil, conformément à la BARRE §4.2.
- Le mot « l’inverse. » reste en orange — la valeur `#b03a0a` tient 4,5:1 sur le fond `#ebe9e4`. La nuance `coca` est plus sévère que le brief ne l’exigeait ; le critique visuel peut la juger et l’adoucir si elle perd la signature.

## Ce que je n’ai pas fait

- Aucun commit (le brief n’en demande pas).
- Aucun `git push` (interdit dur).
- Aucun changement dans `src/**` ni dans les autres pages du site.
