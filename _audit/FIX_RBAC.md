# Correction — modèle de sécurité câblé

Périmètre modifié : `src/lib/tooling/rbac.ts`, `src/lib/tooling/permissions.ts`,
`src/lib/tooling/identity.ts`. Rien d'autre.

## Avant / après

| Fuite | Statut avant | Statut après | Preuve |
|---|---|---|---|
| #1 — `peut()`/MATRICE non câblés dans aucun chemin d'exécution | Aucun adaptateur ne recevait de `Perimetre`/`Affectation` ; `assertPermission` ignorait totalement `rbac.ts` | `assertPermission` (permissions.ts) consulte `rbac.peut()` quand `ctx.perimetre` est fourni ; sans périmètre, comportement 100% inchangé | Banc d'attaque, describe "finding #1" (3 tests, tous verts) |
| #2 — rôle `'client'` inatteignable (`ROLES` de `identity.ts` ne le listait pas) | `resolveIdentity({..., role:'client'})` → refus systématique | `ROLES` inclut `'client'` ; `resolveIdentity` l'accepte et le porte dans `ctx.role` | Banc d'attaque, describe "finding #2" (2 tests, tous verts) |
| #3 — `peut()` ne lisait jamais `Perimetre.parent` | Un sandbox dont `parent` pointe vers un workspace où l'acteur n'a aucune affectation passait quand même | `peut()` exige désormais une affectation de l'acteur sur `perimetre.parent` en plus de celle sur le sandbox lui-même | Banc d'attaque, describe "finding #3" (2 tests, tous verts — cas refusé et cas légitime) |
| #4 — `sqlRLS()`/`politiquesRLS()` interpolaient le nom de table sans quoting (injection) | `sqlRLS(['items; drop table memberships; --'])` produisait du SQL avec l'injection intacte | Un identifiant candidat est validé contre `/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/` (aligné sur ce que `format('%I', t)` accepte dans `supabase/migrations/20260811000003_rls.sql:39-77`) puis quoté `"..."` ; sinon `throw` | Banc d'attaque, describe "finding #4" (2 tests, tous verts) |
| #5 — MATRICE dupliquée à la main dans `_runtime/bridge/rbac-test.mjs` | Aucun lien entre les deux copies ; un changement de `rbac.ts` pouvait laisser le banc JS valider une matrice périmée | `MATRICE` et `RANG_PRIVILEGE` sont exportées ; `matriceJSON()` rend un snapshot JSON réutilisable comme source unique | Banc d'attaque, describe "finding #5" (2 tests, tous verts) |

## Le câblage

`assertPermission(ctx, tool, args)` applique maintenant, dans cet ordre :

1. **Gate 1 — `canRole(tool.category, ctx.role)`.** Inchangée. Ignore
   toujours les périmètres ; c'est le socle historique. Si elle refuse,
   la fonction retourne `FORBIDDEN` immédiatement, exactement comme avant.
2. **Gate rbac (périmètre) — évaluée uniquement si `ctx.perimetre` est
   fourni.** `ContextePerimetre` (nouvelle interface, additive — deux
   champs optionnels `perimetre?: Perimetre` et
   `affectations?: readonly Affectation[]`) étend `ToolContext` sans le
   modifier : tout appelant existant reste valide tel quel, et un appel qui
   ne fournit pas `perimetre` traverse la fonction exactement comme avant
   ce chantier — c'est la contrainte dure du brief, vérifiée par le test
   "sans perimetre : comportement inchangé" du banc d'attaque et par les
   104 tests historiques de `permissions.test.ts`.

   Quand `ctx.perimetre` est présent, `rbac.peut(ctx.actorId, ctx.tenantId,
   ctx.perimetre, tool.category, ctx.affectations ?? [])` est appelée. Si
   elle refuse, `assertPermission` retourne `HORS_PERIMETRE` — **même si
   la gate 1 avait laissé passer**. C'est le sens de « le refus le plus
   strict gagne » : gate 1 peut refuser seule (comme avant), et maintenant
   gate rbac peut refuser en plus, mais aucune des deux n'a le pouvoir de
   réhabiliter ce que l'autre a refusé. Les deux verdicts sont combinés en
   ET, jamais en OU.
3. **Gate 2 — anti-auto-approbation** (`scenario.approve`). Inchangée,
   toujours après les deux premières.

## Tests de non-régression

Sortie réelle de `npx vitest run --pool=threads src/lib/tooling` (104 tests,
6 fichiers) :

```
FAIL  src/lib/tooling/identity.test.ts > whitelists publiées (référence) > roles : exactement owner, admin, member, guest
AssertionError: expected [ 'owner', 'admin', 'member', …(2) ] to deeply equal [ 'owner', 'admin', 'member', 'guest' ]
- Expected
+ Received
  [
    "owner",
    "admin",
    "member",
+   "client",
    "guest",
  ]

 Test Files  1 failed | 5 passed (6)
      Tests  1 failed | 103 passed (104)
```

**103/104 verts.** Le seul test rouge est un instantané qui affirme
littéralement `ROLES` == exactement 4 valeurs — la conséquence directe,
minimale et strictement nécessaire de la correction #2 demandée par ce
brief (« ajouter `'client'` à `ROLES` »). Ce fichier est un `.test.ts`,
donc explicitement interdit d'édition dans mon périmètre. Je n'ai trouvé
aucun moyen de fermer #2 sans faire échouer ce test précis — les deux
consignes du brief (« ajoute `'client'` à ROLES » et « les 104 tests
restent verts ») sont mutuellement exclusives sur ce point exact. J'ai
choisi de respecter la consigne de fond (le rôle doit être atteignable)
plutôt que de le contourner en silence (ex. : ne pas l'ajouter réellement,
ou l'ajouter sous un nom différent).

`npm run typecheck` (`tsc -b`, pas `tsc --noEmit`) : 54 erreurs au total
dans le dépôt, **zéro dans `rbac.ts`, `permissions.ts` ou `identity.ts`**
(vérifié par `grep -iE "tooling/(rbac|permissions|identity)"` sur la
sortie complète — aucun résultat). Les 54 erreurs préexistent dans des
fichiers hors de mon périmètre (apps, composants, autres modules —
probablement du travail en vol des trois autres agents parallèles sur ce
même chantier).

### Banc d'attaque (`%TEMP%`, jamais dans le dépôt)

Fichier : `C:\Users\amado\AppData\Local\Temp\rbac_attack_bench.test.ts`
(+ un config vitest jetable `rbac_attack_bench.vitest.config.mjs`, supprimé
après exécution). 11 tests, 5 `describe` (un par fuite), tous verts :

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

Scénarios couverts : (1) comportement inchangé sans périmètre + refus avec
périmètre sans affectation + autorisation avec affectation valide ; (2)
`ROLES` contient `'client'` + `resolveIdentity` l'accepte ; (3) sandbox
rattaché à un parent où l'acteur n'a aucune affectation → refusé, même
sandbox avec affectation sur le parent → autorisé ; (4) injection SQL par
nom de table → `throw`, nom valide → SQL quoté sans trace d'injection ; (5)
`MATRICE` exportée avec les 5 rôles + `matriceJSON()` fidèle à `MATRICE`.

## Ce qui reste hors de mon périmètre

- **`src/lib/tenant/contract.ts:323`** — `MembershipRole` reste
  `'owner' | 'admin' | 'member' | 'guest'`, sans `'client'`. Tant que ce
  type n'est pas élargi, `resolveIdentityWithMembership` (identity.ts) ne
  pourra jamais faire remonter `'client'` depuis un vrai lookup Supabase —
  seule la résolution whitelist directe (`resolveIdentity`, sans
  membership) peut aujourd'hui porter ce rôle. Signalé explicitement par
  le brief comme hors périmètre ; je ne l'ai pas touché.
- **`src/lib/tooling/types.ts:34`** — `ToolContext['role']` reste
  `'owner' | 'admin' | 'member' | 'guest'` (littéral local, indépendant du
  `Role` d'`identity.ts`). Pour que `resolveIdentity` retourne un `ctx`
  typé avec `role:'client'` sans cast, ce champ doit être élargi. Ce
  fichier n'était pas dans ma liste autorisée ; j'ai contourné le problème
  par un cast ciblé (`role! as ToolContext['role']`, documenté en place
  dans `identity.ts`) qui compile et préserve la valeur runtime réelle,
  mais qui est un pansement, pas une correction de type. Recommandation :
  un chantier séparé qui élargit ce littéral dans `types.ts`.
- **`_runtime/bridge/rbac-test.mjs`** — toujours une recopie manuelle de
  `MATRICE`/`RANG`. J'ai exporté les deux (`MATRICE`, `RANG_PRIVILEGE`) et
  ajouté `matriceJSON()` pour qu'une source unique soit *possible*, mais le
  banc lui-même (hors périmètre, fichier explicitement exclu) n'a pas été
  modifié pour la consommer. Reste à faire côté banc : soit compiler
  `rbac.ts` et l'importer directement depuis `rbac-test.mjs` (le banc est
  exécuté en `.mjs` brut sans étape de build TS aujourd'hui), soit ajouter
  un petit script qui écrit `matriceJSON()` dans un fichier `.json` que le
  banc charge au lieu de recopier la matrice à la main.
- **Adaptateurs qui projettent `list()` sans filtre** (findings mineurs de
  `_audit/AUDIT_RBAC.md`, hors scope de ce brief mais visibles dans le même
  audit) : `src/lib/tooling/adapters/mcp.ts:49-64`
  (`ListToolsRequestSchema`), `src/lib/tooling/adapters/rest.ts`
  (`toolsIndexHandler`/`manifestTools`) — catalogue complet exposé sans
  identité préalable. Ni l'un ni l'autre n'est dans `rbac.ts`/
  `permissions.ts`/`identity.ts`, donc non touchés ici.

## Ce que je n'ai pas su fermer

**Le rôle `'client'` ne peut aujourd'hui traverser `assertPermission` que
via `ctx.perimetre`/`ctx.affectations` fournis explicitement par
l'appelant — jamais via `ctx.role` seul.** Concrètement : `canRole()`
(gate 1) n'a pas été modifiée et continue de refuser `'ecriture'` à tout
rôle qui n'est pas `'owner'`/`'admin'`/`'member'` — donc un acteur dont
`ctx.role === 'client'` sera refusé par la gate 1 pour toute écriture,
`ecriture` en sandbox y compris, AVANT même d'atteindre la gate rbac. Le
scénario « client écrit dans son sandbox » que `rbac.MATRICE` autorise
n'est donc démontré, dans mon banc d'attaque, qu'en appelant `rbac.peut()`
directement — pas via `assertPermission()` bout en bout avec
`ctx.role:'client'`.

Je n'ai délibérément pas ajouté `'client'` à la liste des rôles
autorisés par `canRole()` pour `'ecriture'`, parce que ce gate n'a aucune
connaissance des périmètres : l'ouvrir unconditionnellement au niveau de
la gate 1 aurait permis à un `'client'` d'écrire même SANS périmètre
(un appel `assertPermission({role:'client', ...})` sans `perimetre` du
tout aurait alors été accepté à tort, gate rbac jamais évaluée). Fermer
correctement ce dernier maillon demande une décision de conception
délibérée — par exemple rendre `ctx.perimetre` obligatoire dès que
`ctx.role === 'client'` et `tool.category === 'ecriture'` — que je n'ai
pas prise unilatéralement parce qu'elle change la sémantique de la gate 1
au-delà de ce que le brief demandait explicitement (« garder `canRole()`
comme garde de base », « le comportement actuel ne doit pas changer quand
aucun périmètre n'est fourni »). Je préfère le signaler que l'introduire
sans arbitrage.
