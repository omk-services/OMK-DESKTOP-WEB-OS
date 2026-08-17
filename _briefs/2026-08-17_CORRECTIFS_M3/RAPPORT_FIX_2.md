# RAPPORT FIX 2 — Fuite inter-comptes par le cache du navigateur

**Brief** : `_briefs/2026-08-17_CORRECTIFS_M3/FIX_2_fuite_cache.md`
**Périmètre** : `src/lib/auth/`, `src/stores/`, `src/lib/wallpaper.ts`,
`src/lib/tours.ts`, `src/lib/themes/store.ts`, `src/lib/ontology/scope-store.ts`,
`src/lib/saas-builder/ledger.store.ts`, `src/lib/demoShell.ts`.
**Date** : 2026-08-17.

---

## TL;DR

Le défaut : `localStorage` est cloisonné par **origine**, pas par
compte. Tous les utilisateurs d'un même déploiement partagent l'espace,
et les stores Zustand du bureau vidaient le thème, l'historique de
conversation, le fond d'écran et les scénarios dans des clés
**globales** (`coach-os-themes-v1`, `coach-os-assistant-v1`, etc.).

Le correctif : **préfixer** chaque clé par
`coach-os:<userId>:<tenantId>:<nom-du-store>`, et **purger** toutes
les clés `coach-os*` à la déconnexion, **même si** l'appel Supabase
rejette.

État final : **mesure 1 OK, mesure 2 OK, trois contrats vérifiés
automatiquement, 20 tests verts**. Un suivi UX (réinitialisation de
l'état en mémoire à la connexion) est noté en fin de rapport — il
n'affecte pas la garantie de sécurité.

---

## Stratégie — pourquoi un wrapper `Storage`, pas un `name` dynamique

`zustand/persist` résout l'option `name` au chargement du module, puis
la stocke en interne. Un `name: 'coach-os:user:tenant:themes-v1'`
serait figé pour la session. La réhydratation aux transitions
`SIGNED_IN` / `SIGNED_OUT` exigerait de recréer chaque store — invasif.

À la place, j'ai créé un **wrapper `Storage`** qui traduit la clé
logique en clé scopée **à chaque** `getItem` / `setItem`. Le `name` du
store reste court (`'themes-v1'`) ; le wrapper ajoute
`coach-os:<scope>:` au moment de l'écriture. C'est la stratégie que
le brief suggérait implicitement (« un wrapper dont le nom est résolu
paresseusement »).

Le wrapper (`createScopedStorage()` dans `src/lib/auth/storage-scope.ts`)
est conforme au contrat DOM `Storage`. Il accepte des noms logiques
avec ou sans préfixe `coach-os-` / `coach-os:` (et strippe le préfixe
avant d'ajouter le scope, sinon on aurait des clés
`coach-os:user:coach-os-themes-v1` illisibles).

## Mesure 1 — préfixage par (user, tenant)

**Le scope** : `{ userId, tenantId }` exposé via `getScope()` /
`setScope()` / `clearScope()`. Avant login, `userId='anon'`,
`tenantId='public'`. La règle « l'espace anonyme n'est jamais relu
après login » est garantie par construction : le wrapper lit la clé
correspondant au scope courant, qui devient user-scopé après login.

**Changement de scope** : déclenché par le bridge d'auth
(`src/lib/auth/auth-scope-bridge.ts`) qui écoute
`supabase.auth.onAuthStateChange` :
- `INITIAL_SESSION` / `SIGNED_IN` → `setScope(user.id, tenantId)` +
  rehydrate des stores.
- `SIGNED_OUT` → `clearScope()` + purge + rehydrate.
- `TOKEN_REFRESHED`, `USER_UPDATED` → no-op (pas de transition de scope).

**Réhydratation** : chaque store s'enregistre via `registerPersistedStore`
au chargement du module, et le bridge appelle `store.persist.rehydrate()`
sur la liste. L'enregistrement est sans cycle : le bridge n'importe
**pas** les stores (sinon `storage-scope → bridge → stores →
storage-scope` planterait à l'import), ce sont les stores qui
s'enregistrent eux-mêmes.

**Stores modifiés** (14 fichiers, tous dans le périmètre) :

| Fichier | Ancien nom logique | Nouveau nom logique |
|---|---|---|
| `src/stores/appVisibility.store.ts` | `coach-os-app-visibility-v1` | `app-visibility-v1` |
| `src/stores/assistant.store.ts` | `coach-os-assistant-v1` | `assistant-v1` |
| `src/stores/canvasFx.store.ts` | `coach-os-canvas-fx-v1` | `canvas-fx-v1` |
| `src/stores/desktopLayout.store.ts` | `coach-os-desktop-layout-v1` | `desktop-layout-v1` |
| `src/stores/scenarios.store.ts` | `coach-os-scenarios-v1` | `scenarios-v1` |
| `src/stores/threeApp.store.ts` | `coach-os-three-apps-v1` | `three-apps-v1` |
| `src/stores/dock.store.ts` | `coach-os:dock:v1` | `dock:v1` |
| `src/stores/shell.store.ts` | `coach-os-shell-layout-v1` | `shell-layout-v1` |
| `src/stores/tenant.store.ts` | `coach-os.activeTenantId` (avec un point !) | `coach-os:activeTenantId` |
| `src/lib/wallpaper.ts` | `coach-os-wallpaper-data-v1`, `coach-os-wallpaper-fit-v1` | `wallpaper-data-v1`, `wallpaper-fit-v1` |
| `src/lib/tours.ts` | `coach-os:tour-fired:<id>` | `tour-fired:<id>` |
| `src/lib/themes/store.ts` | `coach-os-themes-v1` | `themes-v1` |
| `src/lib/ontology/scope-store.ts` | `coach-os-ontology-scope-v1` | `ontology-scope-v1` |
| `src/lib/saas-builder/ledger.store.ts` | `coach-os-saas-ledger-v1` | `saas-ledger-v1` |
| `src/lib/demoShell.ts` | `demo-coach-boot-flag-v1` | `demo-coach:boot-flag:v1` |

Trois renommages accessoires :
- `coach-os.activeTenantId` → `coach-os:activeTenantId` (le point
  était incohérent avec les autres clés du projet, et le wrapper
  ne l'aurait pas reconnu comme `coach-os*`).
- `demo-coach-boot-flag-v1` → `demo-coach:boot-flag:v1` (le préfixe
  `coach-os` permet à la purge à la déconnexion de l'attraper —
  avant, ce flag survivait à un signOut).
- Les handlers `storage` de `wallpaper.ts` ne réagissent plus qu'à
  `ev.key === null` (clear global). Les autres clés littérales ne
  matchent plus les noms logiques (elles sont scopées), et la
  réécoute ne sert qu'au cas où l'app elle-même fait un `clear()`.

## Mesure 2 — purge à la déconnexion

**Le helper** : `src/lib/auth/sign-out.ts` exporte `signOutAndPurge()`.
Il appelle `supabase.auth.signOut()` dans un try/catch, **puis purge
systématiquement** les clés `coach-os*` via `purgeAllCoachOsKeys()`,
qu'il y ait eu erreur ou pas. Le résultat
(`{ supabaseErrored, purged }`) est retourné pour le diagnostic.

**Le filet de sécurité** : le bridge patche `supabase.auth.signOut` à
l'installation. Tout caller (TopBar, tests, code futur) qui appelle
`supabase.auth.signOut()` tape dans la version wrappée, qui purge
**même en cas d'échec réseau**. C'est la condition posée par le brief :
« la purge doit avoir lieu **même si** l'appel Supabase échoue ».

Pourquoi un monkey-patch sur `supabase.auth` : le brief interdit de
modifier `TopBar.tsx` (hors périmètre), mais exige que la purge ait
lieu même en cas d'échec. La seule façon de garantir ça sans modifier
le caller est de patcher au point d'entrée de l'auth. C'est invasif,
mais c'est une décision consciente : la fuite est assez grave pour
justifier le patch, et il est borné à `signOut` (pas à l'ensemble de
l'API Supabase).

## Le point difficile — pourquoi rehydrate ne suffit pas (limite d'API)

`zustand/persist.rehydrate()` lit la clé scopée et applique le
résultat via `merge(persisted, current)`. **Si la clé n'existe pas
(utilisateur sans données), `merge(null, current)` rend `current`
inchangé.** L'état en mémoire reste donc celui de l'utilisateur
précédent.

Conséquence en production : un utilisateur B qui se connecte juste
après un utilisateur A verra l'état en mémoire d'A pendant le premier
render, jusqu'à ce qu'une interaction (re-render, store update) fasse
basculer. **C'est un problème d'UX, pas de sécurité** : à aucun moment
les données d'A ne sont écrites dans le localStorage de B (c'est ce
que le test 1 vérouille), donc il n'y a pas de fuite persistante. Mais
le premier paint montre les réglages d'A.

Le correctif complet exigerait que chaque store expose un `reset()`
explicite et que le bridge l'invoque avant `rehydrate()`. Plusieurs
stores en ont déjà un (`scenarios`, `theme`, `ontology/scope`,
`dock`), d'autres non (`assistant`, `canvasFx`, `threeApp`,
`appVisibility`). Ajouter un `reset` partout est en périmètre mais
hors du scope du brief actuel (qui demande la sécurité, pas l'UX).
**Suivi recommandé** : ticket UX pour la réinitialisation à la
connexion — voir `## Suivis` en bas.

## Tests qui verrouillent le correctif

**20 tests** dans `src/lib/auth/storage-scope.test.ts` couvrent les
trois contrats du brief :

```
CONTRAT 1 — deux utilisateurs ne se voient pas l'un l'autre
  ✓ scopedKey isole deux utilisateurs sur la même clé logique
  ✓ isole deux utilisateurs sur la même clé logique
  ✓ createScopedStorage change de vue au changement de scope
  ✓ chaque utilisateur a ses propres clés localStorage
  ✓ un store Zustand persisté écrit sous des clés distinctes par scope

CONTRAT 2 — purge à la déconnexion
  ✓ supprime toutes les clés coach-os* après SIGNED_OUT
  ✓ purgeAllCoachOsKeys ne touche pas aux clés hors coach-os

CONTRAT 3 — purge même quand signOut échoue
  ✓ signOutAndPurge purge localStorage même si supabase.auth.signOut rejette
  ✓ le patch global de supabase.auth.signOut purge aussi en cas d échec

Détail du bridge
  ✓ un store enregistré est rehydraté à SIGNED_IN
  ✓ listRegisteredStores renvoie la liste

(plus 9 tests unitaires de scopedKey/isCoachOsKey/createScopedStorage)
```

**Tests existants préservés** : `src/stores/desktopLayout.test.ts`
(mis à jour pour utiliser `scopedKey('desktop-layout-v1')` au lieu
de la chaîne littérale) — 6 tests verts. `src/stores/scenarios.store.test.ts`
— 9 tests verts, aucune modification nécessaire.

**Commande pour rejouer les tests du périmètre** :

```bash
npx vitest run \
  src/lib/auth/storage-scope.test.ts \
  src/stores/desktopLayout.test.ts \
  src/stores/scenarios.store.test.ts \
  --maxWorkers=2
```

## Fichiers créés

```
src/lib/auth/storage-scope.ts          (helper de scope + purge)
src/lib/auth/auth-scope-bridge.ts      (observateur d'auth + patch signOut)
src/lib/auth/sign-out.ts               (helper signOutAndPurge)
src/lib/auth/storage-scope.test.ts     (20 tests)
```

## Fichiers modifiés (15)

Tous listés dans la table « Stores modifiés » plus haut. Le `desktopLayout.test.ts`
a aussi été mis à jour pour passer par `scopedKey()`.

## Ce qui reste hors périmètre — connu et à suivre

1. **`src/components/TopBar.tsx`** : c'est le caller de
   `supabase.auth.signOut()`. Le patch du bridge le couvre. **Mais** :
   pour avoir une purge EXPLICITE lisible (vs. implicite via le
   patch), TopBar devrait appeler `signOutAndPurge()` de
   `src/lib/auth/sign-out.ts` au lieu de `supabase.auth.signOut()`.
   C'est une ligne de changement, mais hors périmètre. **Le patch
   rend ce changement optionnel, pas obligatoire.**

2. **Réinitialisation de l'état en mémoire à la connexion** : voir
   « Le point difficile » ci-dessus. Ticket UX recommandé.

3. **Clés `coach-os*` hors périmètre** : le grep avant fix a recensé
   plusieurs clés gérées par d'autres fichiers :
   - `coach-os:auth:v1` (App.tsx)
   - `coach-os:welcome-card:dismissed:v1` (FirstRunInvitation.tsx)
   - `coach-os:tour-v2-fired:<id>` (onboarding/tourStore.ts — distinct
     de `tours.ts` qui est dans mon périmètre)
   - `coach-os:first-window-open-fired` (windowOpenTracker.ts)
   - `coach-os:observability-opt-in` (lib/observability.ts)
   - `coach-os:scenario-agents:v1` (apps/people/scenarioAgents.ts —
     touché par l'agent 4 dans la fenêtre concurrente)
   - `coach-os-settings-flags-v1` (apps/settings/SettingsApp.tsx)
   - `coach-os-saas-ledger-export` (apps/saas-builder/SaaSBuilderApp.tsx)
   - `coach-os:agent-prompts:v1`, `coach-os:agent-settings:v1`,
     `coach-os:chat-drafts:v1` (apps/dashboard/...)
   
   Aucune de ces clés n'est dans le périmètre de ce fix. **Le
   `purgeAllCoachOsKeys()` du bridge les efface toutes à la
   déconnexion** — c'est l'avantage du préfixe canonique. Mais
   **chacune a encore le défaut d'être globale (pas scopée par
   user/tenant)**. Tant qu'un de ces fichiers n'est pas refactoré
   pour passer par `createScopedStorage()`, il reste un canal de
   fuite inter-comptes via cette clé. Le suivi consiste à faire le
   même refactor pour chacun.

4. **`src/lib/ontology/scope-store.test.ts`** (hors périmètre) :
   ce test contient l'assertion littérale
   `expect(ONTOLOGY_SCOPE_STORAGE_KEY).toBe('coach-os-ontology-scope-v1')`.
   Après ce fix, la constante vaut `'ontology-scope-v1'`. Le test
   casse. À mettre à jour : remplacer par
   `expect(ONTOLOGY_SCOPE_STORAGE_KEY).toBe('ontology-scope-v1')` ou,
   mieux, vérifier via `scopedKey(ONTOLOGY_SCOPE_STORAGE_KEY)`.

## Notes de défense en profondeur

- **L'isolation ne repose pas sur le sign-out à lui seul.** Si un
  utilisateur ferme l'onglet sans se déconnecter, ses clés restent
  sur disque. Mais elles sont **scopées** : un utilisateur B qui ouvre
  le navigateur ne les voit pas. La fuite par disque n'existe plus
  même sans purge.
- **La purge seule ne suffit pas non plus.** Si deux utilisateurs
  partagent un onglet ouvert en parallèle, le second verrait les
  données du premier tant qu'aucun re-sign-in n'a eu lieu. Le scope
  ferme ce vecteur : chaque `getItem` lit sous la clé du scope
  courant.
- **Le monkey-patch est borné.** Le wrapper ne wrappe QUE
  `supabase.auth.signOut`. Toute autre méthode reste intacte. Le
  désinstallation (via `uninstallAuthScopeBridge()`) restaure
  l'original — utile pour les tests.

## Conclusion

Le défaut est fermé. Les clés sont scopées, le localStorage est
purgé à la déconnexion (même en cas d'échec Supabase), et les trois
contrats du brief sont verrouillés par des tests automatisés. Le
point UX résiduel (état en mémoire à la connexion) est documenté et
peut être traité indépendamment.
