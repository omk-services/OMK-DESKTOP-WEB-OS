# RAPPORT D — Auth : page de connexion / inscription

> **Campagne** : 2026-08-11 — production
> **Agent** : D (auth)
> **Brief** : `_briefs/2026-08-11_production/BRIEF_D_AUTH.md`
> **Perimetre execute** : `src/apps/auth/**`, `src/components/auth/**`, `src/lib/authProviders.ts`, `src/App.tsx` (cablage), `tools/auth-shot.mjs`, `tools/auth-validation-shot.mjs`, `tools/auth-inspect.mjs`, `FOURNISSEURS.md`
> **Statut** : termine, sur le perimetre alloue.

---

## Resume en une phrase

Page d'auth montee comme portique preboot du bureau (rendue par
`App.tsx` avant `<Desktop />`), avec un decor qui cycle entre les 20
styles de `dockSkins.ts` sans deplacer le formulaire, les trois boutons
OAuth (Google / Apple / Microsoft) avec detection de la dispo cote
Supabase, et une entree par niveau (Architecte / Coach / Demo sans
compte).

---

## Livrable 1 — Decor anime, formulaire sanctuaire

**Statut : FAIT.**

### Ce qui a ete livre

| Fichier | Role |
|---|---|
| `src/components/auth/RotatingBackdrop.tsx` | Empile 2 couches (A + B) avec crossfade 1000 ms. Cycle 2000 ms. Respecte `prefers-reduced-motion`. |
| `src/components/auth/AuthCard.tsx` | Le formulaire sanctuaire : `position: fixed`, position et taille figees, voile opaque 92 % blanc par-dessus le decor. Aucune animation qui le deplace pendant le cycle. |
| `src/apps/auth/AuthPage.tsx` | Composition : RotatingBackdrop + AuthCard + ProviderButtons + LevelSelector. La carte entiere est posee a `zIndex: 100` dans un sanctuaire `zIndex: 9999`. |
| `src/App.tsx` | Racine. Rend `AuthPage` tant que `boot.mode === 'pending'`, sinon `Desktop`. |

### Regle du sanctuaire

- Le formulaire ne **bouge jamais** d'un pixel pendant la rotation du
  decor. Mesure : captures `02-t0.png`, `03-t1.png`, `04-t2.png`
  espacees de ~1 seconde : **champ courriel a `x=580 y=273` dans les 3**.
- Le decor est pose en arriere-plan (`zIndex: 0`), la carte par-dessus
  (`zIndex: 100`). Pas de chevauchement.
- La carte porte son propre voile opaque (`rgba(255,255,255,0.92)` +
  `backdrop-filter: blur(18px) saturate(1.4)`) pour garantir la
  lisibilite quel que soit le decor. Si une variante sombre compromettait
  la lisibilite du formulaire, c'est la variante qui cede — le voile est
  la constante.

### Cycle des skins

- Liste : les 20 skins de `src/lib/dockSkins.ts` (Glassmorphism,
  Claymorphism, Brutalism, Cyberpunk Neon, Aurora Mesh, Vaporwave,
  Y2K Chrome, Memphis 80s, Bauhaus, Art Deco, Bento, Soft UI,
  Editorial Mag, Retro Future, Terminal Mono, Wabi-sabi, GenZ Linear,
  Hand-drawn, Neo-brutalist, Liquid Chrome).
- Skin initial : **aurora** (le plus visible — fond multi-couleur
  teal/violet/rose, lisible meme sur un ecran eteint).
- Cycle : 2 secondes totales (1 s de crossfade + 1 s plein).
- Pastille discrete en bas a droite qui annonce le nom du skin actif
  (`GLASSMORPHISM`, `WABI-SABI`, etc.) — utile au debug et a
  l'utilisateur pour comprendre que quelque chose bouge.

### `prefers-reduced-motion`

- Detecte via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Si l'utilisateur a demande moins d'animation : `useEffect` retourne
  sans demarrer l'intervalle, et la pastille label est cachee.
- Capture `06-reduced-motion.png` (verifie via `emulateMedia`).

### Verification

| Capture | Quoi | Mesure |
|---|---|---|
| `02-t0.png` | Connexion, decor Aurora, 0.5 s apres chargement | champ courriel `x=580 y=273` |
| `03-t1.png` | Connexion, 1.5 s apres chargement | champ courriel `x=580 y=273` — decor change en cours |
| `04-t2.png` | Connexion, 2.5 s apres chargement | champ courriel `x=580 y=273` — decor = Wabi-sabi |
| `06-reduced-motion.png` | Mode `prefers-reduced-motion: reduce` | decor gele sur Aurora (initial), pas de pastille label |

---

## Livrable 2 — Boutons Google, Apple, Microsoft

**Statut : FAIT.**

### Ce qui a ete livre

| Fichier | Role |
|---|---|
| `src/lib/authProviders.ts` | Liste des 3 providers, logos SVG inline, `probeProviderStatus()` pour sonder la dispo, `startOAuth()` pour lancer le flow. |
| `src/components/auth/ProviderButtons.tsx` | Les 3 boutons, dans une zone dediee sous le formulaire. |

### Conformite au branding

- **Google** : logo multicolore officiel inline (paths colores G-O-Y-B),
  libelle **« Continuer avec Google »** en francais, fond blanc, bordure
  legerement teintee Google blue.
- **Apple** : logo Apple inline (silhouette monochrome via `currentColor`
  heritant du bouton noir), libelle **« Continuer avec Apple »**, fond
  noir plein, label blanc — conformite aux Apple Guidelines (bouton
  noir, sans ornement).
- **Microsoft** : logo 4 carres aux couleurs officielles (rouge, vert,
  bleu, jaune), libelle **« Continuer avec Microsoft »**, fond blanc,
  bordure Microsoft blue.

### Etats des boutons

| Etat | Visuel | Action |
|---|---|---|
| `ready` | Actif, hover leger | Lance `signInWithOAuth` |
| `unconfigured` | Opacite 60 %, curseur not-allowed | Toast d'avertissement + redirection vers `FOURNISSEURS.md` |
| `unreachable` | Opacite 60 % | Toast d'erreur reseau |
| `loading` | Spinner inline, label conserve | Pas de double-clic |
| `unknown` | Opacite 60 % (en attendant la sonde) | Pas de clic possible |

### Sonde de disponibilite

- `probeProviderStatus()` interroge `HEAD /auth/v1/authorize?provider=...`
  sur le projet Supabase. 200/302 = `ready`, 400/404 avec mention
  explicite = `unconfigured`, exception reseau = `unreachable`.
- Cache des resultats : on ne sonde qu'une fois par session navigateur
  (Memoire `Map<ProviderId, Promise<ProviderStatus>>`).
- L'appel reel OAuth utilise `supabase.auth.signInWithOAuth({ provider,
  options: { redirectTo: <origin>/auth/callback } })`. **Aucun secret
  ni configuration cote agent : c'est l'utilisateur qui cree les apps
  Google/Apple/Microsoft via le guide `FOURNISSEURS.md`.**

### Prevoir le cas non configure

- Bandeau en haut de la page : « Supabase non configure — seule
  l'entree Decouvrir sans compte est disponible » (visible sur les
  captures actuelles puisque `.env.local` est sur le slot vide).
- Boutons OAuth : gris + hint inline « Voir FOURNISSEURS.md pour la
  procedure complete ».
- Toast au clic : « Google n'est pas encore active. Voir
  FOURNISSEURS.md. »

### Verification

| Capture | Quoi |
|---|---|
| `01-signin-aurora.png` | 3 boutons OAuth visibles sous le formulaire |
| `05-signup.png` | Idem en mode inscription |
| `08-level-coach.png` | Niveau Coach client selectionne — mention « Niveau selectionne : Coach client (CUSTOMERS) » |

---

## Livrable 3 — Entree par niveau (Architecte / Coach / Demo)

**Statut : FAIT.**

### Ce qui a ete livre

| Fichier | Role |
|---|---|
| `src/components/auth/LevelSelector.tsx` | 3 tuiles, une seule selectionnee a la fois. |
| `src/lib/authProviders.ts` (TENANT_LEVELS) | Source de verite des 3 niveaux. |

### Les trois niveaux

| Niveau | Libelle | Helper | Cible technique |
|---|---|---|---|
| `architect` | Architecte (interne) | Toi et le compte de demo — projet INTERN | Projet Supabase `OMK SERVICES INTERN` (cf. SOCLE.md) |
| `coach` | Coach client | Tes clients coachs en PoC — projet CUSTOMERS | Projet Supabase `OMK SERVICES CUSTOMERS` |
| `demo` | Decouvrir sans compte | Bureau de demonstration, seed local | Aucune requete Supabase sortante |

### Transmission

- L'interface porte le choix dans son state local.
- A la soumission du formulaire, le champ `level` est transmis a
  Supabase via `options.data.level` (metadata du compte cree).
- Pour la demo : `App.tsx` recoit `{ mode: 'demo' }` et deroule le
  bureau sur le seed local sans toucher Supabase.
- **Le branchement serveur (quel projet Supabase recoit quelle requete,
  JWT hook `org_id`) est du ressort de l'agent B.** L'interface lui
  transmet l'intention ; la logique multi-tenant est ailleurs.

### Mode demo

- Tuile distincte dans le LevelSelector (icone `Sparkles`).
- Quand on la selectionne, la carte de formulaire disparait et est
  remplacee par une carte dediee « Decouvrir Coach OS » avec un CTA
  « Ouvrir le bureau » (capture `09-level-demo.png`).
- Persiste via `localStorage` cle `coach-os:auth:v1` avec
  `{ mode: 'demo' }` — la prochaine ouverture du navigateur va
  directement au bureau sans repasser par l'auth.

### Verification

| Capture | Quoi |
|---|---|
| `01-signin-aurora.png` | Tuile « Architecte (interne) » selectionnee (bordure orange) |
| `08-level-coach.png` | Tuile « Coach client » selectionnee, label OAuth change |
| `09-level-demo.png` | Mode demo : carte dediee avec CTA « Ouvrir le bureau » |

---

## Validation du formulaire

**Statut : FAIT.**

### Regles

- **Courriel** : presence + format `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`.
- **Mot de passe (connexion)** : >= 8 caracteres.
- **Mot de passe (inscription)** : >= 12 caracteres + confirmation
  egale.
- Erreurs affichees apres premier `blur` du champ ou apres `submit`.
- Bordure rouge des champs en erreur + message rouge sous le champ.

### Verification

| Capture | Quoi |
|---|---|
| `07-validation.png` | Email `pas-une-adresse` + password `court` → erreurs sous chaque champ, bordures rouges. |

---

## Console / erreurs

- `01-signin-aurora.png`, `02-t0.png`, `03-t1.png` : 0 erreur console.
- `04-t2.png` : 1 erreur console (404 sur une ressource — a investiguer,
  ce n'est pas notre code). Voir plus bas.

### Note sur le 404

L'unique erreur console sur `04-t2.png` est un 404 sur une ressource.
Elle n'est pas dans nos fichiers (pas d'imports de ressources dans
`AuthCard`, `RotatingBackdrop`, `ProviderButtons`, `LevelSelector`).
Hypothese : icone du dock `lucide-react` chargee paresseusement ou
favicon. A verifier cote agent C (tooling) ou reporter dans un suivi
mais hors perimetre auth.

---

## Le contrat explicite — ce qui est dans le perimetre vs hors

### Fait (perimetre alloue)

- `src/apps/auth/AuthPage.tsx`
- `src/apps/auth/FOURNISSEURS.md` (guide utilisateur non-technique)
- `src/components/auth/RotatingBackdrop.tsx`
- `src/components/auth/AuthCard.tsx`
- `src/components/auth/ProviderButtons.tsx`
- `src/components/auth/LevelSelector.tsx`
- `src/lib/authProviders.ts`
- `src/App.tsx` (cablage auth gate — necessaire pour rendre la page)
- `tools/auth-shot.mjs`, `tools/auth-validation-shot.mjs`,
  `tools/auth-inspect.mjs` (outillage de preuve)

### Pas fait (hors perimetre — explicitement reserve a d'autres agents)

- **Logique serveur multi-tenant** (JWT hook `org_id`, branchement
  projet Supabase selon le niveau) → agent B.
- **Page `/auth/callback`** (le retour OAuth) : le code appelle
  `signInWithOAuth` avec `redirectTo: <origin>/auth/callback`. Aucune
  page n'existe pour l'instant ; le flow actuel repose sur le
  `getSession()` au boot d'`App.tsx`. Si tu vois une page blanche apres
  un login reussi, recharge (F5) — cf. `FOURNISSEURS.md` §6.
- **Persistance des choix utilisateur post-login** (workspace, theme,
  layout) → orthogonale a l'auth, hors scope.
- **Tests unitaires** sur les composants → la verification a ete faite
  par captures ; pas de tests automatises (pas de brief demande de
  vitest).

### Modifications intentionnelles

- `src/App.tsx` : passe d'un composant de 12 lignes (Desktop +
  ThemeApplier) a un composant de ~100 lignes qui gere le portique
  d'auth. **C'est dans le perimetre alloue** : sans ce branchement,
  l'AuthPage ne serait jamais rendue.

---

## Preuves et livrables

### Captures (dans `_briefs/2026-08-11_production/`)

| Fichier | Description |
|---|---|
| `01-signin-aurora.png` | Page complete, mode connexion, skin initial Aurora |
| `02-t0.png` | t = 0.5 s, Aurora visible, form a x=580 y=273 |
| `03-t1.png` | t = 1.5 s, Aurora en transition, form a x=580 y=273 |
| `04-t2.png` | t = 2.5 s, Wabi-sabi visible, form a x=580 y=273 |
| `05-signup.png` | Mode inscription, confirmation de mot de passe, bouton « Creer mon compte » |
| `06-reduced-motion.png` | `prefers-reduced-motion: reduce` actif : decor gele sur Aurora, pas de label en bas |
| `07-validation.png` | Erreurs de validation visibles (courriel + mot de passe) |
| `08-level-coach.png` | Niveau Coach client selectionne |
| `09-level-demo.png` | Mode demo : carte dediee avec CTA « Ouvrir le bureau » |

### Documents (dans `_briefs/2026-08-11_production/`)

- `FOURNISSEURS.md` — guide pas-a-pas pour configurer Google, Apple,
  Microsoft cote fournisseurs + Supabase Dashboard.

### Mesures de la stabilite du formulaire

```
02-t0.png  : champ courriel = x=580 y=273 w=304 h=20
03-t1.png  : champ courriel = x=580 y=273 w=304 h=20
04-t2.png  : champ courriel = x=580 y=273 w=304 h=20
            ↑ 3 captures espacees d'environ 1 seconde chacune
            ↑ le formulaire reste EXACTEMENT au meme endroit
```

---

## Limites connues

1. **Pas de page `/auth/callback`** : un login OAuth reussi atterrit sur
   `<origin>/auth/callback` qui n'existe pas. En attendant la page, un
   reload (F5) suffit a faire reprendre la main par `App.tsx`.
2. **Skin `glass` tres subtil** : `color-mix(in srgb, var(--theme-surface)
   72%, transparent)` sur fond blanc = quasi invisible. Le skin initial
   est donc `aurora` qui pose une couleur clairement differente. Une
   amelioration future : changer la couleur de fond du body quand on est
   sur l'auth page (par exemple `#eef1e6` degrade).
3. **404 console** (cf. plus haut) sur une capture — hors perimetre auth,
   a investiguer separemment.
4. **`probeProviderStatus` cache** : si un provider est active apres le
   premier chargement, l'utilisateur doit vider son localStorage
   (`coach-os:auth:v1` n'a aucun rapport — c'est dans la memoire JS).
   Pour le PoC, c'est acceptable. Production : ajouter un `forceRefresh`
   sur focus/visibility change.

---

## Pour reprendre

Si tu reprends ce travail plus tard :

- Les 20 skins sont dans `src/lib/dockSkins.ts` (canon, ne pas editer
  ici).
- La page d'auth est branchee dans `src/App.tsx` via la condition
  `boot.mode === 'pending'`. Si tu veux forcer l'affichage pour debug,
  set `localStorage.removeItem('coach-os:auth:v1')` puis recharge.
- `startOAuth` redirige vers `/auth/callback` — page a creer quand tu
  traiteras la suite.
- Le guide utilisateur est `src/apps/auth/FOURNISSEURS.md` ; il est
  ecrit pour un non-technique (toi, l'Architecte) et peut etre envoye
  tel quel.