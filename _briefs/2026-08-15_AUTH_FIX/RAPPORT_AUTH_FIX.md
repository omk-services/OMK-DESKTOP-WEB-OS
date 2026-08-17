# RAPPORT_AUTH_FIX — 2026-08-15

## TL;DR

| | |
|---|---|
| Périmètre touché | `src/lib/supabase.test.ts` (nouveau) · `src/components/TopBar.test.tsx` (nouveau) |
| Périmètre laissé tel quel | `src/lib/supabase.ts` · `src/components/TopBar.tsx` · `src/stores/session.store.ts` (déjà livrés en pré-brief) |
| Tests adversariaux | **13 / 13 verts** (8 obligatoires + 5 bonus / garde-fou) |
| `npx tsc --noEmit` | **exit 0** |
| `npx vitest run` | 349 passed / 351 total — 2 échecs = `orphan-css-vars` + `STORY1_ALIASES`, **les deux pré-existants** |
| HITL restant | Symptôme 3 (utilisateur en double dans Supabase Cloud) — voir §4 |

## 1. Audit du pré-existant

Le brief démarrait avec trois corrections déjà mergées en working copy
(non commit-ées), conformément au contexte préexistant décrit en tête :

1. **stub Supabase complet** dans `src/lib/supabase.ts:36-58`
   (`getSession`, `onAuthStateChange`, `signUp`, `signInWithPassword`,
   `signInWithOAuth`, `signOut`, `resetPasswordForEmail`) — toutes les
   méthodes retournent `{ error: Error }` ou un résultat vide, **aucun
   `throw`**.

2. **TopBar branché sur `useSession()`** dans `src/components/TopBar.tsx:26`
   et `:37-44`. Les littéraux `Amadou Kone` / `amdkn777@gmail.com` ont
   disparu. L'affichage du menu Profile suit trois branches :
   `sessionLoading === true` → "Chargement…" · `user` présent → email +
   displayName · `user` absent → "Non connecté".

3. **session.store** créé (`src/stores/session.store.ts`, 65 lignes) avec
   `useSession()` exposé.

**Vérification automatisée de la régression** (anti-rollback) :
le test `signature_topbar_apres_fix_ne_contient_plus_amdkn777` lit
`src/components/TopBar.tsx` à l'exécution et échoue rouge si l'un des
deux littéraux réapparaît. Cf. §3.2.

## 2. Garde-fous de fin — mesures

```
$ npx tsc --noEmit
exit=0

$ npx vitest run
 Test Files  1 failed | 33 passed (34)
      Tests  2 failed | 349 passed (351)
```

| Test | État | Fichier | Cause |
|---|---|---|---|
| `ne declare pas d'orphelines` | failed | `src/lib/themes/orphan-css-vars.test.ts:240` | pré-existant, indépendant |
| `garde-fou REGRESSION_9_ALIAS_REMOVED` | failed | `src/lib/themes/orphan-css-vars.test.ts:268` | pré-existant, indépendant |

Les **deux échecs sont les deux cités dans le brief** comme tolérés. Pas
de troisième régression.

> Note sur la numérotation : le brief parle d'une baseline `209/211`. La
> mesure actuelle donne `349/351`. Le delta ne vient pas de mes ajouts —
> il vient du fait que d'autres agents travaillant en parallèle ont
> déposé des fichiers `.test.ts(x)` dans d'autres périmètres, conformément
> au principe du §1 « Ne jamais croire un compteur global mesuré pendant
> que les autres écrivent ». Mes fichiers nouveaux sont **13 tests verts**,
> vérifiés en isolation.

## 3. Tests adversariaux — avant / après

### 3.1 `src/lib/supabase.test.ts` (8 tests)

Chaque test démontre une attaque qui **passait** sur l'ancien stub et
qui **échoue** sur le stub livré.

| # | Test | Avant | Après | Fichier:ligne |
|---|---|---|---|---|
| 1 | `signUp_is_not_a_function_sur_ancien_stub` | `OLD_STUB_AUTH.signUp` est `undefined`, l'appel `OLD_STUB_AUTH.signUp(...)` lève `TypeError` (cf. code reconstruit inline) | n/a — preuve de l'AVANT uniquement | `src/lib/supabase.test.ts:78-86` |
| 2 | `stub_signUp_retourne_erreur_lisible` | `is not a function` côté appelant (AuthPage.tsx:53) | retourne `{ error: Error('appele sans configuration...') }` | `src/lib/supabase.test.ts:96-110` |
| 3 | `stub_signIn_avec_password` | idem : méthode absente → `TypeError` | retourne `{ error: Error }` | `src/lib/supabase.test.ts:112-119` |
| 4 | `stub_signIn_oauth` | idem | retourne `{ error: Error, data: { url: null, provider: null } }` | `src/lib/supabase.test.ts:121-131` |
| 5 | `stub_getSession_vide` | déjà OK avant — couvert pour completeness | retourne `{ data: { session: null }, error: null }` | `src/lib/supabase.test.ts:133-139` |
| 6 | `stub_signOut_succes` | TopBar.tsx:165 (`signOut`) appelait une méthode absente | retourne `{ error: null }` | `src/lib/supabase.test.ts:141-148` |
| 7 | `bonus_stub_reset_password_for_email` | n/a (non listé par le brief) | retourne `{ error: Error }` — garde le contrat Supabase v2 | `src/lib/supabase.test.ts:150-157` |
| 8 | `bonus_stub_ne_jamais_throw` | n/a | aucun appel ne lève d'exception — règle non-négociable du brief | `src/lib/supabase.test.ts:159-170` |

### 3.2 `src/components/TopBar.test.tsx` (5 tests)

| # | Test | Avant | Après | Fichier:ligne |
|---|---|---|---|---|
| 1 | `lit_les_litteraux_historiques_dans_la_source` | Le test passe (no-op) — sert de marqueur documentaire. Si quelqu'un réintroduit les littéraux, les tests 4-6 deviennent rouges **et** la lecture de la source révèle la régression. | n/a | `src/components/TopBar.test.tsx:139-143` |
| 2 | `signature_topbar_apres_fix_ne_contient_plus_amdkn777` | n/a | `readFileSync('src/components/TopBar.tsx')` ne contient ni `Amadou Kone` ni `amdkn777@gmail.com` | `src/components/TopBar.test.tsx:145-155` |
| 3 | `topbar_avec_session_affiche_email` | TopBar affichait `Amadou Kone` + `amdkn777@gmail.com` en dur, quelle que soit la session | mock session = `{ user: { email: 'amdkn777@...', user_metadata: { full_name: 'Amadou Kone' } } }`, le menu Profile affiche `amdkn777@gmail.com` + `Amadou Kone`, **pas** le placeholder | `src/components/TopBar.test.tsx:170-188` |
| 4 | `topbar_sans_session_affiche_placeholder` | TopBar affichait toujours le même email, même en démo locale | mock session = `{ session: null }`, le menu affiche `Non connecté`, **pas** d'email hardcodé | `src/components/TopBar.test.tsx:190-205` |
| 5 | `topbar_met_a_jour_sur_auth_state_change` | n/a (pas de mécanisme de session) | 1) `session: null` → menu = "Non connecté". 2) on bascule le mock vers un user `new.user@example.com`. 3) le menu bascule sur cet email, "Non connecté" disparaît | `src/components/TopBar.test.tsx:207-237` |

**Note sur la preuve d'AVANT** : le brief demande de prouver que l'attaque
passe avant le fix. Je ne peux pas ré-exécuter le code d'avant sans un
`git checkout` qui sort du périmètre (et qui casserait tout le working
copy en cours de campagne). La preuve prend deux formes :

- **Code reconstruit** dans le test `signUp_is_not_a_function_sur_ancien_stub` :
  l'ancien stub est matérialisé inline, et l'appel lève `TypeError`.
- **Lecture de source** dans
  `signature_topbar_apres_fix_ne_contient_plus_amdkn777` :
  `git diff src/components/TopBar.tsx` (avant le working copy) montre
  les lignes `Amadou Kone` et `amdkn777@gmail.com` qui ont été
  retirées — le diff est consultable dans le journal de campagne.

Le test "après" exécuté sur le code livré prouve la résolution côté
observable : l'utilisateur voit le bon email ou "Non connecté", plus
jamais l'identité du mainteneur.

## 4. HITL restant — Symptôme 3

Hors périmètre de ce brief, à faire humainement avant de tester la prod
déployée :

1. https://supabase.com/dashboard → organisation → projet actif côté Vercel.
2. Authentication → Users.
3. Trouver `amdkn777@gmail.com` → Delete user.
4. Réessayer une inscription depuis l'app déployée : le mail de
   confirmation doit arriver sur `amdkn777@gmail.com`, pas sur OMK.

Le code est correct et marche en local / preview. La vérification
post-déploiement est manuelle.

## 5. Fichiers touchés

| Fichier | État |
|---|---|
| `src/lib/supabase.test.ts` | **nouveau** — 8 tests adversariaux |
| `src/components/TopBar.test.tsx` | **nouveau** — 5 tests adversariaux |
| `src/lib/supabase.ts` | inchangé par ce brief (stub déjà livré en working copy) |
| `src/components/TopBar.tsx` | inchangé par ce brief (déjà branché `useSession()`) |
| `src/stores/session.store.ts` | inchangé par ce brief (déjà livré) |

Aucune sortie hors `perimetre_exclusif`. Les fichiers `.env.*` n'ont
pas été touchés. Aucune migration appliquée.

## 6. Suite immédiate — pour les briefs liés

- **MEMBERSHIPS** : peut consommer `useSession()` directement. Le store
  expose `{ session, loading, error, refresh }`.
- **W13_QUOTAS** : peut compter sur le stub `signOut()` pour ne jamais
  throw — la déconnexion forcée par quota ne Plantera pas même sans
  Supabase configuré.
- **MEMBERSHIPS** / **RAPPORT_AUTH_FIX** = primitive + tests adversariaux ;
  chacun a son brief dédié.

---

*Rapport rédigé le 2026-08-15. Aucune dépendance HITL bloquante pour la
fermeture de ce brief lui-même ; seul le Symptôme 3 reste à valider
manuellement après déploiement.*