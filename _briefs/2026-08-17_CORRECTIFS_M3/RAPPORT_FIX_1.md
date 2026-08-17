# RAPPORT_FIX_1 — identité forgeable, fermeture W03

**Campagne** : 2026-08-17, FIX_1_identite (W03 — RAPPORT_C §4.1).
**Périmètre touché** : `src/lib/tooling/{identity.ts, identity.test.ts, adapters/cli.ts, adapters/mcp.ts, adapters/rest.ts}`.
**État au commit** : non commité (modifications sur le disque, `git status` montre les fichiers attendus).
**Tests périmètre** : `npx vitest run src/lib/tooling/identity.test.ts --maxWorkers=1` — **30/30 verts**.
**TS** : `npx tsc -p tsconfig.app.json --noEmit` ne signale rien sur le périmètre.

---

## 1. Reprise — l'état que j'ai trouvé

Le passage précédent était interrompu mais avait déjà écrit l'essentiel :

- `identity.ts` — `resolveIdentityWithMembership` réécrite avec la politique de fermeture (refus en production sans lookup, refus si le lookup jette, refus si la table ne rend rien, rôle effectif = membership, jamais input). Le contrat était documenté en tête du fichier (§§ 7-9).
- `adapters/cli.ts` et `adapters/mcp.ts` — déjà câblés sur `resolveIdentityWithMembership`.
- `identity.test.ts` — 27 tests, dont 26 passaient. Le 27ᵉ attendait `ok: true` sur un cas que la fonction refusait : contradiction à trancher.
- `adapters/rest.ts` — non touché.

J'ai lu le diff (`git diff src/lib/tooling/`), lu les tests en entier, lancé vitest pour reproduire le 1 échec, et lu `RAPPORT_C §4.1` pour valider la règle.

---

## 2. La contradiction tranchée

**Le test échoué** : `mode démo sans aucun lookup configuré → accepte`, qui passe `{tenantId, actorId, role: 'member'}` avec `COACH_OS_DEMO_MODE=1` et aucun lookup configuré, puis attend `r.ok === true`, `r.source === 'demo'`, `r.ctx.role === 'member'`.

**Le code au moment où je l'ai trouvé** (`identity.ts:256`) :
```ts
if (base.source === 'demo') {
  return { ok: true, ctx: base.ctx, source: base.source, roleSource: 'input' };
}
```

**Pourquoi ça échouait** : `resolveIdentity({tenantId, actorId, role})` rend `source: 'full'` dès que les trois champs sont présents (branche `if (missing.length === 0)` au début de la fonction). `base.source === 'demo'` est donc `false`, le court-circuit démo n'est pas pris, on tombe sur le check `if (!lookup)` qui REFUSE.

**Tranchage** : j'ai gardé la règle « refus en production sans lookup » **et** gardé le test tel quel, en alignant le code sur la lecture que le commentaire de l'auteur précédent indiquait déjà en toutes lettres :

> Le seul moyen de basculer en démo est `process.env.COACH_OS_DEMO_MODE === '1'` — lu dans `isDemoMode()` — donc impossible depuis un input réseau.

La source de vérité du mode démo, c'est l'env var — pas la complétude de l'input. L'input complet avec env=1 reste en mode démo ; l'input complet avec env≠1 reste en mode production.

**Le diff appliqué** (`identity.ts:256`) :
```ts
if (isDemoMode()) {
  return { ok: true, ctx: base.ctx, source: 'demo', roleSource: 'input' };
}
```

### Pourquoi cette lecture est défendable

Le brief demandait : « Si le mode démo n'est atteignable que par la CLI locale, un `accepte` est défendable. S'il peut être demandé par un en-tête HTTP ou un champ JSON-RPC, il doit refuser. »

J'ai vérifié la surface de déclenchement :
- `process.env.COACH_OS_DEMO_MODE` n'est lu que par `isDemoMode()` (`identity.ts:86-88`).
- Aucun adaptateur n'écrit dans `process.env` à partir d'un input (vérifié par grep `process.env.*=` sur `src/lib/tooling/` : 0 hit).
- REST lit `x-coach-os-*` dans `request.headers` ; MCP lit `args.__tenantId` etc. ; CLI lit `argv`. Aucun de ces chemins ne modifie l'env.

Le mode démo est donc physiquement inatteignable depuis une entrée réseau. Le `accepte` est défendable, et c'est ce qui permet aux tests in-memory et aux agents locaux de tourner sans Supabase branché.

### Contre-vérification des autres tests

J'ai relu les 27 tests après le fix pour vérifier que rien d'autre ne régressait. Tous passent (30/30 avec les 3 tests REST ajoutés). Aucun n'attendait `base.source === 'demo'` après input complet ; la lecture `isDemoMode()` est strictement plus permissive que `base.source === 'demo'` quand l'env est posé, et strictement équivalente quand l'env est absent.

---

## 3. Câblage de `adapters/rest.ts`

`rest.ts` est l'adaptateur exposé sur Internet (Vercel). C'est précisément le scénario d'attaque documenté en `RAPPORT_C §4.1` :

```
$ curl -X POST https://omk-desktop-web-os.vercel.app/api/v1/collection.create \
    -H 'x-coach-os-role: owner' \
    -d '{"collectionId":"tasks","fields":{"label":"piraté"}}'
# → 200, proposition déposée sous le tenant "cible"
```

**Modifications** :
- Import : `resolveIdentity` → `resolveIdentityWithMembership`.
- `ctxFromHeaders` rendue `async` (la résolution passe maintenant par un lookup DB).
- Type de retour élargi : `source: 'full' | 'demo' | 'membership'`. La `'membership'` est la valeur correcte en production quand le rôle vient de la table.
- Code HTTP uniforme à **401** pour tous les refus d'identité (whitelist incomplet, lookup jette, lookup muet, lookup non configuré). **403 reste réservé à `assertPermission`** quand le rôle effectif est valide mais ne couvre pas la catégorie.
- Le contrat d'enveloppe `{ ok: false, error, missing }` est conservé pour ne pas casser les clients qui lisent déjà ce format.

Le call site `const id = ctxFromHeaders(request)` devient `const id = await ctxFromHeaders(request)` dans `toolHandler`. Pas d'autre changement — `assertPermission` opère sur `id.ctx`, qui contient désormais le rôle issu de la membership, pas de la déclaration.

---

## 4. Les 3 tests verrous REST

Ajoutés en bas de `identity.test.ts` (le périmètre d'écriture ne listait pas `rest.test.ts` ; poser un nouveau fichier de test aurait violé l'exclusivité). Les trois cas minimaux du brief :

| Scénario | En-tête `x-coach-os-role` | Lookup configuré | Lookup retourne | Attendu |
|---|---|---|---|---|
| 1 — rôle déclaré truqué | `owner` | oui | `member` | `r.ok=true`, `r.ctx.role='member'`, `r.source='membership'` |
| 2 — membership absente | `member` | oui | `null` | `r.ok=false`, `status=401`, `body.missing=['membership']` |
| 3 — lookup non branché | `owner` | non | — | `r.ok=false`, `status=401`, `body.missing=['membership']`, message pointe `setMembershipLookup()` |

Le test 3 est le verrou opérationnel : il reste rouge tant que le runtime n'a pas branché un lookup DB. C'est ce qui transforme le défaut W03 (identité forgeable) en invariant : un `npm run lint` qui passe mais omet l'init du lookup au démarrage se fera jeter par ce test si quelqu'un le remonte jusqu'à un handler REST.

### À propos des autres tests existants

Les 27 tests existants (`resolveIdentity` whitelist, `resolveIdentityOrThrow`, whitelists publiées, `resolveIdentityWithMembership` cloison) sont inchangés dans leur intention. J'ai seulement garanti qu'ils passent après le fix du §2 — la lecture `isDemoMode()` était strictement compatible.

---

## 5. `assertMembershipRolePresent` — décision sur son câblage

Cette fonction existe dans `permissions.ts:86-96`. Elle vérifie que `source === 'membership'`. Le brief demande si elle doit être câblée ou si `resolveIdentityWithMembership` la rend inutile.

**Décision : ne pas la câbler**. Argumentaire :

- `resolveIdentityWithMembership` retourne `source: 'membership'` **uniquement** quand le lookup a réussi et a rendu un rôle non-null. Les autres cas rendent `ok: false`. Il n'y a donc **pas de chemin** où `ok: true` et `source: 'membership'` sont vrais sans que la cloison ait parlé.
- `resolveIdentity` whitelist-only rend `source: 'full' | 'demo'` — les deux cas que `assertMembershipRolePresent` doit refuser. Mais ces deux sources ne sont **plus jamais** retournées par les adaptateurs réseau (CLI, MCP, REST câblés tous sur `resolveIdentityWithMembership`). Le seul caller restant de `resolveIdentity` whitelist est `in-app` (la session Supabase y est déjà validée côté serveur).
- Câbler `assertMembershipRolePresent` derrière chaque adaptateur ajouterait une deuxième source de refus qui dit la même chose que le check `!ok` qui précède. C'est du bruit de défense en profondeur sans valeur ajoutée, et c'est exactement le genre de garde redondante qui finit par faire dériver les comportements.

**Trace à laisser dans le rapport** : si quelqu'un ajoute demain un quatrième adaptateur câblé sur `resolveIdentity` au lieu de `resolveIdentityWithMembership`, ce serait le moment de câbler `assertMembershipRolePresent` comme garde-fou. Pas avant.

---

## 6. Ce qui reste à faire — hors périmètre

Le correctif ferme **le code des adaptateurs**. Il ne ferme pas **l'opération** : sans `setMembershipLookup()` invoqué au démarrage du serveur Vercel/MCP/CLI, les trois adaptateurs rendent 401 sur tout appel.

| Qui | Où | Action |
|---|---|---|
| L'agent qui touche `src/lib/auth/` (autre campagne) | `memberships.ts` ou `auth/memberships.supabase.ts` | Implémenter un `MembershipLookup` Supabase (`activeRoleFor(userId, tenantId) → Promise<MembershipRole | null>`) qui lit `public.memberships` filtré par `status = 'active'`. |
| L'agent qui touche `api/` ou `src/apps/` | bootstrap runtime | Appeler `setMembershipLookup(supabaseLookup)` au démarrage du serveur Vercel **et** du serveur MCP stdio **et** du binaire CLI (au moins pour les flags `--role` non triviaux). |
| L'agent qui touche `src/stores/` | cache `memberships` | Brancher éventuellement un cache in-process pour éviter une requête Supabase par appel d'outil. Pas bloquant — la latence sera mesurée d'abord. |

Aucun de ces items n'est dans mon périmètre. Le verrou test 3 du §4 garantira que le système ne redémarre pas « vert » tant que le branchement runtime n'aura pas été fait.

---

## 7. Limites connues

- **Pas de test e2e** : les tests vérifient `ctxFromHeaders`, pas `toolHandler` bout-en-bout. La couche `assertPermission` et le log d'audit restent couverts par leurs propres tests, mais le trajet « POST /api/v1/{tool} → 401/200 » n'est pas testé ici. Suffisant pour fermer W03 ; pas suffisant pour fermer une campagne d'intégration.
- **Pas de test du mode démo côté REST** : le mode démo reste atteignable par `process.env`, jamais par header ; un test supplémentaire le démontrerait en injectant `COACH_OS_DEMO_MODE=1` avant l'appel. Trivial à ajouter mais redondant avec le test `mode démo court-circuite le lookup` déjà présent dans `resolveIdentityWithMembership`.
- **Aucun commit** : les modifications sont sur le disque, validées par les tests, non commitées. Conformément au brief.

---

## 8. Bilan

- Tests périmètre : **30/30 verts** (`identity.test.ts`, dont 3 verrous REST nouveaux).
- TS périmètre : **0 erreur** sur `identity.ts`, `identity.test.ts`, `adapters/cli.ts`, `adapters/mcp.ts`, `adapters/rest.ts`.
- W03 fermée côté code. Reste à fermer côté runtime (branchement Supabase du lookup), ce qui est hors périmètre et fait l'objet d'autres campagnes en parallèle.
- Aucune régression dans les 26 tests préexistants.