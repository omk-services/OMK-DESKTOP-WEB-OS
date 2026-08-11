---
id: I_LANDING_V2
campagne: 2026-08-11 — production
---

# Rapport I — la page d'atterrissage devient un site

> Brief : `BRIEF_I_LANDING_V2.md`
> Périmètre exclusif : `src/landing/**`, `public/landing/**`, et l'outil de preuve
> `tools/landing-v2-check.mjs` (cohabite avec les autres `shot.mjs`).
> Date : 2026-08-11. Écrit au fil de l'eau.

---

## 0. Décisions de cadrage

### URLs — choix de l'emplacement

Le brief liste les URLs « logiques » du site : `/`, `/diagnostic`, `/paliers`,
`/engagements`, `/demo`. Mais l'app shell de Coach OS occupe déjà `/` (route
SPA). Et le brief dit aussi : « Le site est servi en statique depuis
`public/landing/`. Un routage par fichiers (`/diagnostic/index.html`...)
suffit ». J'ai donc gardé le périmètre historique et placé les pages sous
`/landing/*` :

| Page | Fichier | URL en dev (Vite) | URL en prod (Vercel) |
|---|---|---|---|
| Accueil | `public/landing/index.html` | `/landing/index.html` | `/landing/` |
| Diagnostic | `public/landing/diagnostic/index.html` | `/landing/diagnostic/index.html` | `/landing/diagnostic/` |
| Paliers | `public/landing/paliers/index.html` | `/landing/paliers/index.html` | `/landing/paliers/` |
| Engagements | `public/landing/engagements/index.html` | `/landing/engagements/index.html` | `/landing/engagements/` |
| Démo | `public/landing/demo/index.html` | `/landing/demo/index.html` | `/landing/demo/` |

J'utilise **l'extension `.html` dans tous les liens internes** pour deux
raisons : (1) le serveur de dev de Vite (mode SPA, `appType: 'spa'`)
n'envoie pas `public/landing/<x>/index.html` quand on navigue vers
`/landing/<x>/` sans extension — il retombe sur l'app shell. Le défaut
est connu et documenté par Vite. (2) Vercel sert correctement les deux
formes, mais l'extension explicite rend le comportement dev/prod
identique, ce qui évite une surprise au moment de tester.

### Registres visuels — assignations

Cinq pages, cinq registres tirés des vingt `dockSkins` de
`src/lib/dockSkins.ts`. Choix justifiés un par un :

| Page | Style | Justification |
|---|---|---|
| `/landing/` (accueil) | **Glassmorphism** | Porte d'entrée douce, surface vitrée qui laisse respirer la promesse sans bruit visuel. Le verre garde la lisibilité de la typographie éditoriale sans concourir avec elle. |
| `/landing/diagnostic/` | **Editorial Mag** | Le diagnostic est un raisonnement, il se lit, il ne se parcourt pas. Liseré noir, papier crème, ombres « 2 px décalées » : on lit comme un manuel de référence, pas comme une landing. |
| `/landing/paliers/` | **Bento** | Quatre paliers = une comparaison côte-à-côte. La grille propre, bordures fines, fond neutre, souligne la lecture en tableau. La grille Bento (papier crème + accent rouille, dérivé de Bento du dock) reste cohérente avec la marque. |
| `/landing/engagements/` | **Neo-brutalist** | Les engagements sont des affirmations tranchantes : « Pas de SaaS qui vous enferme », « Pas de prix inventé ». Le registre neo-brutalist (cadres noirs épais, ombres décalées) assume le conflit visuel et le rend lisible. Cartes paires (blanc) et impaires (jaune pâle) pour le rythme. |
| `/landing/demo/` | **Soft UI / Neu** | L'entrée en démo doit être tactile et accueillante. Soft UI donne du relief (inset + extrudé) sans crier. L'accent passe au sarcelle (teal `#0f766e`) pour différencier visuellement la démo du reste du site sans rompre la marque. |

### Ce qui ne change jamais

La règle qui empêche le patchwork, appliquée strictement :

- **Typographie** : Georgia (serif système) + Inter (sans). Mêmes tailles,
  même rythme vertical, mêmes `clamp()` partout.
- **Largeur** : 1140 px max, padding latéral 28 px / 18 px mobile.
- **Top bar** : mêmes liens, même marque, même alignement, sur les 5 pages.
- **CTA** : mêmes classes `.btn`, `.btn--primary`, `.btn--secondary`. La
  forme du bouton est la même partout — c'est le décor qui change, pas le geste.
- **Footer** : même structure, mêmes liens, même alignement.
- **Fil d'Ariane** : ajouté sur les 4 sous-pages, absent de l'accueil
  (qui est l'origine). Format `Accueil › <page>` uniforme.

Un lecteur doit sentir qu'il change de pièce, pas de maison.

### Identifiants publics de la démo

`demo@coach-os.app` / `demo-coach-os` — vérifiés en connexion réelle par
l'agent A (cf. SOCLE.md §Le modèle à deux niveaux). Encart sobre avec
révélation au clic (comme le fait CasaOS) :

- État caché : `filter: blur(6px)` sur la liste des identifiants,
  bouton « Révéler les identifiants », `aria-expanded="false"`.
- État révélé : bouton « Masquer les identifiants », `aria-expanded="true"`.
- Phrase de désamorçage : « Ce compte est public, partagé, remis à zéro
  régulièrement. N'y déposez aucune donnée réelle. »
- Le bouton « Ouvrir la démonstration » mène à `/` (l'app shell), pas à
  une connexion automatique. L'utilisateur doit voir qu'il se connecte,
  c'est ce qui rend la démo crédible.

---

## 1. Livrable — les cinq pages

### Fichiers produits

```
public/landing/
  index.html             # Accueil (hero + pain + CTA) — registre Glassmorphism
  styles.css             # Source unique de tous les styles et des 5 thèmes
  favicon.svg            # (inchangé)
  og-image.svg           # (inchangé)
  diagnostic/
    index.html           # Diagnostic — registre Editorial Mag
  paliers/
    index.html           # Paliers — registre Bento
  engagements/
    index.html           # Engagements — registre Neo-brutalist
  demo/
    index.html           # Démo — registre Soft UI / Neu

src/landing/
  content.ts             # Source de vérité (miroir du contenu statique)
  Landing.tsx            # Composants partagés + page d'accueil React (miroir)
  index.ts               # Barrel pour imports externes
  styles.css             # Miroir exact de public/landing/styles.css

tools/
  landing-v2-check.mjs   # Capture + contraste + navigation + reveal démo
```

### Distribution du contenu (ancien site → nouveau)

| Section de l'ancien site (E) | Page de destination | Statut |
|---|---|---|
| Hero (promesse, 2 CTA, trust line) | `/landing/` (accueil) | conservé tel quel |
| Pain (3 fuites) | `/landing/` (accueil) | conservé tel quel |
| Diagnostic (6 grilles + coda) | `/landing/diagnostic/` | conservé tel quel |
| Ladder (4 paliers + footnote) | `/landing/paliers/` | conservé tel quel |
| Engagement (4 « on ne fait pas ») | `/landing/engagements/` | conservé tel quel |
| CTA (2 entrées) | `/landing/` (accueil) | conservé tel quel |

Le brief dit « Le fond est bon et se conserve ». C'est ce que j'ai fait —
aucun texte modifié. Seule la distribution change.

### Navigation entre les pages

Chaque page porte la même barre de navigation (Diagnostic, Paliers,
Engagements, Démo) avec `aria-current="page"` sur la page active. Un
fil d'Ariane `Accueil › <page>` apparaît sur les 4 sous-pages. Un bloc
« page-next » au bas de chaque page (sauf l'accueil) propose la page
suivante logique (ex. Diagnostic → Paliers) et un retour à l'accueil.

Preuve (cf. §3 ci-dessous) : depuis l'accueil, on atteint Diagnostic,
Paliers, Engagements, Démo et on revient — chaque page possède un lien
vers `/landing/index.html` dans son top bar ET dans son footer.

---

## 2. Registres — détails techniques

### Glassmorphism (accueil)

```css
body.theme-glass {
  --landing-canvas: #f4f1ea;
  --landing-surface: rgba(255, 255, 255, 0.72);
  --landing-radius: 16px;
  --landing-shadow: ...; /* inchangé */
}
body.theme-glass .pain-card,
body.theme-glass .engage-card,
body.theme-glass .cta-card { backdrop-filter: blur(14px) saturate(1.25); }
```

### Editorial Mag (diagnostic)

```css
body.theme-editorial {
  --landing-canvas: #fdfbf5;
  --landing-border: #111111;     /* noir dur */
  --landing-radius: 2px;
  --landing-shadow: 0 2px 0 0 #111111;
  --landing-shadow-lift: 0 4px 0 0 #111111;
}
body.theme-editorial .pain-card,
body.theme-editorial .diag-cell { box-shadow: 4px 4px 0 0 #111111; }
```

Fond quadrillé subtil (grille 28×28 px) rappelant la mise en page d'un
manuel. Sections et hero prennent du poids (`font-weight: 600`).

### Bento (paliers)

```css
body.theme-bento {
  --landing-canvas: #faf7f0;
  --landing-amber: #854d0e;       /* AMBER-700 → AMBER-800 pour AA */
  --landing-shadow: 0 8px 22px -14px rgba(41, 37, 36, 0.45);
}
body.theme-bento .ladder-state { border: 1px solid currentColor; background: transparent; }
```

La grille Bento prend deux dégradés radiaux (rouille + vert) en arrière-
plan. La table des paliers prend une bordure 2 px et un rayon 18 px. Les
pastilles « Existe aujourd'hui » / « Prévu » deviennent des contours
épais (Bento-style).

### Neo-brutalist (engagements)

```css
body.theme-neobrutal {
  --landing-canvas: #fefce8;     /* jaune papier */
  --landing-border: #000000;     /* noir dur */
  --landing-radius: 6px;
  --landing-shadow: 6px 6px 0 0 #000000;
  --landing-shadow-lift: 10px 10px 0 0 #000000;
}
body.theme-neobrutal .engage-card { border: 3px solid #000000; box-shadow: 8px 8px 0 0 #000000; }
body.theme-neobrutal .engage-card:nth-child(odd) { background: #fef9c3; }
body.theme-neobrutal .engage-card:nth-child(even) { background: #ffffff; }
body.theme-neobrutal .engage-card__mark {
  background: #000000; color: #fefce8; padding: 4px 10px; font-weight: 700;
}
```

Les marques « Engagement n°01 » deviennent des pastilles noires à
chapeau jaune. Le bouton primaire est jaune pâle sur cadre noir, avec
un hover qui translate de -2 px et agrandit l'ombre. Le bouton
secondaire est transparent à cadre noir 2 px. Le tout respire le
« manifeste imprimé ».

### Soft UI / Neu (démo)

```css
body.theme-softui {
  --landing-canvas: #e8e5e1;
  --landing-accent: #0f766e;     /* teal sarcelle */
  --landing-radius: 22px;
  --landing-radius-lg: 28px;
  --landing-shadow:
    inset 3px 3px 8px rgba(255, 255, 255, 0.85),
    inset -3px -3px 8px rgba(0, 0, 0, 0.10),
    0 14px 30px -18px rgba(0, 0, 0, 0.30);
}
body.theme-softui .diag-coda {
  background: #292524; color: #efebe6; border-radius: 28px;
}
```

Le relief vient des ombres inset + extrudées combinées. La carte
principale (`.demo-card`) prend le radius large (28 px) et un `shadow-lift`
plus appuyé. Le bloc identifiants caché utilise un bouton sobre
« Révéler les identifiants » avec une icône ▸.

---

## 3. Preuve — captures, console, contraste, navigation

### Outil

`tools/landing-v2-check.mjs` (cohabite avec `tools/landing-check.mjs` de
l'agent E). Sortie dans `_verify_proofs/landing-v2-check.json`,
captures dans `_briefs/2026-08-11_production/captures/landing-v2-*.png`.

Le script :
1. capture chaque page en 1280 px et en 375 px ;
2. capture la page `/demo` deux fois — état caché puis révélé après clic ;
3. compte les erreurs console par page par viewport ;
4. mesure le contraste WCAG sur ~22 combinaisons par page ;
5. teste la navigation : depuis l'accueil, suit chaque lien et vérifie
   qu'il existe un lien retour vers l'accueil sur la page cible.

### Captures

```
home         (1280)  _briefs/2026-08-11_production/captures/landing-v2-home-1280.png
diagnostic   (1280)  _briefs/2026-08-11_production/captures/landing-v2-diagnostic-1280.png
paliers      (1280)  _briefs/2026-08-11_production/captures/landing-v2-paliers-1280.png
engagements  (1280)  _briefs/2026-08-11_production/captures/landing-v2-engagements-1280.png
demo         (1280)  _briefs/2026-08-11_production/captures/landing-v2-demo-1280-hidden.png   ← état initial
demo         (1280)  _briefs/2026-08-11_production/captures/landing-v2-demo-1280.png          ← après clic
home         (375)   _briefs/2026-08-11_production/captures/landing-v2-home-375.png
diagnostic   (375)   _briefs/2026-08-11_production/captures/landing-v2-diagnostic-375.png
paliers      (375)   _briefs/2026-08-11_production/captures/landing-v2-paliers-375.png
engagements  (375)   _briefs/2026-08-11_production/captures/landing-v2-engagements-375.png
demo         (375)   _briefs/2026-08-11_production/captures/landing-v2-demo-375-hidden.png
demo         (375)   _briefs/2026-08-11_production/captures/landing-v2-demo-375.png
```

12 captures au total (5 pages × 2 viewports + 2 états démo en plus).

### Erreurs console : 0

Toutes pages, tous viewports : `count: 0`. Pas d'erreur, pas de
warning, pas de requête échouée.

### Contraste — tous AA, beaucoup AAA

| Page | Mesures | Min | Max | Échec AA |
|---|---|---|---|---|
| home | 8 | 4.83 (footer) | 15.71 (CTA primary) | **0** |
| diagnostic | 5 | 7.32 (footer) | 18.25 (H1 / coda quote) | **0** |
| paliers | 8 | 4.57 (pill verte) | 17.49 (ladder cell body) | **0** |
| engagements | 6 | 7.31 (footer) | 20.30 (engage card mark) | **0** |
| demo | 11 | 6.08 (footer) | 14.74 (creds dd / reveal btn) | **0** |

**0 échec AA sur 38 mesures**. La plus serrée est la pastille verte
« Existe aujourd'hui » sur Bento : `#15803d` (vert `green-700`) sur
`#dcfce7` (`green-100`) — 4.57:1, juste au-dessus du seuil 4.5:1.

Itération nécessaire : la première passe a échoué sur 4 combinaisons
(`ladder-state--amber` Bento à 4.42, footer Bento à 4.48, footer Soft
UI à 3.82, creds dt à 4.04). Cause : la palette Bento/Soft UI initiale
utilisait `#78716c` (`stone-500`) pour `--landing-text-faint`, trop
claire sur les fonds clairs. **Correctif** : ramené à `#57534e`
(`stone-600`) sur Bento et Soft UI ; passé `--landing-amber` de
`#a16207` (amber-700) à `#854d0e` (amber-800) sur Bento. Re-mesure : tout
passe.

### Navigation

```
Diagnostic       → /landing/diagnostic/index.html    backToHome=True
Paliers          → /landing/paliers/index.html       backToHome=True
Engagements      → /landing/engagements/index.html   backToHome=True
Démo             → /landing/demo/index.html          backToHome=True
Application      → /                                 backToHome=False   (volontaire : c'est l'app shell)
```

Les 4 pages `/landing/*` ont toutes un lien retour à l'accueil dans leur
top bar ET dans leur footer. Pas de cul-de-sac.

### Démo : révélation au clic

État initial :
```json
{
  "classes": "demo-creds demo-creds--hidden",
  "btnLabel": "Révéler les identifiants",
  "btnExpanded": "false"
}
```

État après clic :
```json
{
  "classes": "demo-creds",
  "btnLabel": "Masquer les identifiants",
  "btnExpanded": "true"
}
```

Le bouton bascule correctement, `aria-expanded` suit, et le `filter:
blur(6px)` se lève. Le clic est non-bloquant : la liste passe en
lecture naturelle (police monospace, fond crème) et reste sélectionnable.

---

## 4. React mirror — périmètre agent E conservé

`src/landing/` reste un miroir du statique, conformément à la convention
de l'agent E (« Toute modification de palette / espacement / typo doit
être reportée dans `src/landing/styles.css` — et inversement »). J'ai :

- recopié `public/landing/styles.css` vers `src/landing/styles.css` (diff
  vide, byte-identique) ;
- étendu `src/landing/content.ts` avec les nouvelles sections
  (`DEMO_CREDS`, `NAV_ORDER`) et les liens `/landing/<x>/index.html` ;
- décomposé `src/landing/Landing.tsx` en composants exportés
  (`TopBar`, `Breadcrumb`, `PageNext`, `Hero`, `Pain`, `Diagnostic`,
  `Ladder`, `Engagement`, `CTA`, `Footer`) pour qu'une page React
  puisse les assembler si le shell monte un jour une page de la
  collection.

**Vérif TypeScript** : `npx tsc --build --pretty` ne renvoie aucune
erreur sur `src/landing/`. (Les erreurs qui s'affichent concernent
`src/apps/dashboard/`, `src/apps/design/`, `src/apps/growth/` —
fichiers d'autres agents, hors périmètre.)

**Justification du « pas de routeur React »** : le brief dit « si tu
préfères la version React de `src/landing/`, alors branche-la
réellement au routage ». J'ai préféré la voie statique (routage par
fichiers) pour deux raisons :
1. la version statique est ce qui sert déjà en production ;
2. brancher un routeur React sur l'app shell est un changement
   d'architecture qui dépasse le périmètre `src/landing/**` /
   `public/landing/**` (il faudrait toucher `src/App.tsx` ou
   `src/router/`, qui sont hors périmètre exclusif).

Laisser `Landing.tsx` utilisable mais inatteignable n'est pas un
problème : le composant `Landing` exporté par défaut est complet
(rendant la home), et un futur shell qui voudrait monter la version
React n'aurait qu'à le poser. Le composant reste un miroir de
référence, pas un livrable bloquant.

---

## 5. Vérification finale

| Critère (Preuve exigée §BRIEF) | Statut | Mesure / chemin |
|---|---|---|
| Capture par page en 1280 px | ✓ | 6 captures PNG, `_briefs/.../captures/landing-v2-*-1280.png` |
| Capture par page en 375 px | ✓ | 6 captures PNG, `_briefs/.../captures/landing-v2-*-375.png` |
| Contraste mesuré sur le texte courant de chaque registre | ✓ | 38 mesures, 0 échec AA (cf. §3) |
| Zéro erreur console sur chaque page | ✓ | 0 sur 12 mesures (5 pages × 2 viewports + 2 démo) |
| Navigation : depuis l'accueil, atteindre les 4 autres pages et revenir | ✓ | 4/4 liens internes ramènent à l'accueil via top bar + footer |
| Page démo : identifiants derrière un bouton, phrase de désamorçage, pas de connexion auto | ✓ | `landing-v2-demo-1280-hidden.png` puis `landing-v2-demo-1280.png` montrent les deux états |

---

## 6. Hors-périmètre — ce que je n'ai pas touché

- `vite.config.ts` : le serveur de dev Vite retombe sur l'app shell pour
  `/landing/<x>/` (mode SPA). J'ai contourné en mettant l'extension
  `.html` dans les liens internes ; Vercel en prod sert correctement
  les deux formes. Changer le `appType` de Vite aurait touché hors
  périmètre.
- `src/onboarding/**` et `src/apps/it-rd/embedded/**` : agent G y
  travaillait en parallèle (cf. GARDE_FOU).
- `src/App.tsx` et tout routeur applicatif : la décision d'aller en
  statique rend ce toucher inutile (cf. §4).
- Le contenu textuel des 6 sections historiques : conservé tel quel
  (le brief insiste : « Le fond est bon et se conserve »).

---

## 7. Risques résiduels

- **Vite dev server et trailing slash** : `/landing/diagnostic/` (sans
  `.html`) ne sert pas la bonne page en dev. En prod Vercel ça marche.
  Si un autre agent veut des URLs sans extension, il faut configurer
  Vite — hors périmètre exclusif.
- **Glassmorphism sur Safari** : `backdrop-filter` est supporté depuis
  Safari 9 (2015), pas de risque mesuré. Mes captures Chrome ne
  montrent pas de défaut.
- **Neo-brutalist sur mobile** : les ombres 8 px décalées sont
  visuellement lourdes en 375 px — choix assumé, c'est l'identité du
  registre. La capture mobile le confirme.
- **Identifiants publics** : la sécurité repose sur (a) le
  `localStorage` reset côté navigateur quand on visite `/`, (b) la
  rotation régulière (à automatiser). Pas de risque de fuite de
  données : le compte vit sur le projet INTERN (séparation par
  organisation côté Supabase, cf. SOCLE.md §Le modèle à deux niveaux).

---

## 8. Suite suggérée (pour un autre agent)

- Brancher le routeur React si l'app shell doit servir `/landing/<x>/`
  depuis React (changement d'architecture, hors périmètre I).
- Configurer Vite pour servir les URLs sans extension en dev
  (`appType: 'mpa'` ou middleware custom).
- Ajouter un test E2E Playwright (cf. BRIEF H §RLS pour les patterns
  disponibles) qui ouvre `/landing/demo/`, clique le bouton reveal, et
  vérifie que les identifiants saisis mènent bien à l'app.
- Internationaliser (actuellement tout en français, pas de `data-i18n`).