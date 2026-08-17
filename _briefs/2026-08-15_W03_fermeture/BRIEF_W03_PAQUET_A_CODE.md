---
id: W03_FERMETURE_PAQUET_A
campagne: 2026-08-15
préconditions: |
  Paquet B (HITL humain) doit être vérifié AVANT que ce brief ne tourne,
  sinon le code livré est correct mais inopérant — la porte reste ouverte.
  Voir _briefs/2026-08-15_W03_fermeture/BRIEF_W03_PAQUET_B_HITL.md.
perimetre_exclusif: |
  api/v1/_auth.ts                    (nouveau — verifierAcces et middleware)
  api/v1/[tool].ts                  (modifié — applique verifierAcces)
  api/v1/tools.ts                   (modifié — applique verifierAcces)
  api/_middleware.ts                (nouveau — point d'entrée unique, OPTIONNEL)
  src/lib/auth/jwt.ts               (nouveau — vérif signature + extraction claims)
  src/lib/auth/jwt.test.ts          (nouveau)
  src/lib/auth/verifierAcces.ts     (nouveau — colle aux gardes existantes)
  src/lib/auth/verifierAcces.test.ts (nouveau — adversarial)
  api/v1/_auth.test.ts              (nouveau — adversarial sur les deux endpoints)
interdit: |
  src/lib/identity.ts                (déjà en place — ne pas le dupliquer)
  src/lib/serverStore.ts            (cloison OK — ne pas y toucher)
  src/lib/permissions.ts            (matrice OK — ne pas y toucher)
  src/lib/tooling/**                (périmètre de la campagne précédente)
  src/apps/**
  public/**
  .env*
artifact_obligatoire: |
  _briefs/2026-08-15_W03_fermeture/RAPPORT_W03_FERMETURE.md
---

# W03 — FERMETURE — Paquet A (code uniquement)

> **Ce brief est la moitié déléguable.** L'autre moitié — Paquet B, HITL
> humain Vercel/Supabase — doit être vérifiée avant que ce brief ne tourne.
> Sans elle, le code que tu vas écrire sera correct **mais inopérant** :
> la porte reste ouverte, parce que le hook JWT ne sera pas alimenté côté
> Supabase Cloud. Tu vérifies ce pré-requis **en premier**, sinon tu refuses
> de commencer et tu le dis dans le rapport.

## La phrase qui commande ce brief

> **W03 n'est pas un patch sur `api/v1/`. C'est l'élimination du vecteur
> par lequel l'identité forgable arrive jusqu'au serveur.**

L'identité existe (`identity.ts:resolveIdentity`). La cloison existe
(`serverStore.ts:assertTenantId`). Les permissions existent
(`permissions.ts:assertPermission`). **Aucune de ces trois gardes ne sert
à rien** si l'appelant peut poser lui-même son `tenantId` dans l'en-tête
de la requête. C'est ce que Melbourne a montré : un agent qui annule la
réservation d'un tiers parce que l'API ne vérifiait pas *qui* parle. Le
système tenait parce qu'aucun humain n'irait manipuler l'API à la main.
Les agents, eux, ne regardent jamais l'interface.

## Le précédent — à citer dans le rapport

Melbourne, août 2026 — un agent chargé de réserver un cours annule la
réservation d'un tiers. **Aucune intrusion.** L'API ne vérifiait pas *qui*
annule. Le système tenait parce qu'aucun humain n'irait manipuler l'API à
la main. Les agents ne regardent jamais l'interface.

C'est mot pour mot la situation de `api/v1/[tool].ts:20-35` aujourd'hui :
n'importe qui pose `x-coach-os-tenant: cible` dans une requête, le code
lit, croit, applique. La cloison par tenant (W07) **est en place**, mais
elle s'applique à ce qui arrive — pas à ce que l'attaquant forge.

## Ce qui est déjà mesuré — ne le refais pas

M3 a posé :
- `identity.ts:73-129` — `resolveIdentity` refuse sans tenantId/actorId/role
  valides, ou retourne un contexte signé (`source: 'full' | 'demo'`).
- `serverStore.ts:149-160` — `assertTenantId` lève sur tenant vide / hors
  whitelist.
- `permissions.ts:32-46` — `canRole(category, role)` rejette les rôles
  insuffisants.
- `rest.ts:34-46` — `ctxFromHeaders` lit l'en-tête (c'est le vecteur ;
  ne pas le réutiliser côté `api/v1/`).

Tu n'as **rien à ajouter** à ces fichiers. Tu ajoutes **devant**.

## Trois étapes, dans cet ordre — et pas un autre

### Étape 1 · Vérifier la précondition Paquet B

Avant la première ligne de code, ouvre
`_briefs/2026-08-15_W03_fermeture/BRIEF_W03_PAQUET_B_HITL.md` et suis les
trois vérifications. Si l'une des trois est `❌`, tu écris
`statut: bloque_paquet_B` dans le rapport et tu t'arrêtes là. Aucune
ligne de code écrite.

### Étape 2 · L'auth JWT

Crée `src/lib/auth/jwt.ts`. Trois responsabilités, pas plus :

```ts
// Pseudo-code. NE REINVENTE PAS la roue crypto : utilise `jose` (déjà
// dans les deps courantes) ou la primitive de ton choix. La règle : la
// signature DOIT être vérifiée. Aucune branche « si pas de signature,
// passer quand même ».
export async function verifierJwt(token: string): Promise<
  | { ok: true; claims: { sub: string; org_id: string; role: 'owner'|'admin'|'member'|'guest' } }
  | { ok: false; raison: 'absent' | 'expire' | 'signature_invalide' | 'claims_manquants' }
>
```

Ce qui DOIT tenir (tests écrits) :
- un JWT absent → `ok: false, raison: 'absent'`
- un JWT expiré (`exp < now`) → `ok: false, raison: 'expire'`
- un JWT signé avec une autre clé → `ok: false, raison: 'signature_invalide'`
- un JWT valide mais sans `sub` / sans `org_id` → `ok: false, raison: 'claims_manquants'`

### Étape 3 · Le middleware `verifierAcces`

Crée `src/lib/auth/verifierAcces.ts`. Trois responsabilités :

```ts
// Pseudo-code. La porte est ici. Pas de repli silencieux.
export async function verifierAcces(req: Request): Promise<
  | { ok: true; ctx: ToolContext }
  | { ok: false; statut: 401 | 403; raison: string }
>
```

Comportement attendu (tests adversariaux écrits dans
`verifierAcces.test.ts`) :

| requête | réponse |
|---|---|
| Sans `Authorization: Bearer …` | 401, `raison: 'token_absent'` |
| Bearer avec JWT invalide | 401, `raison: 'jwt_invalide'` |
| Bearer valide, JWT valide, mais le tenant de l'en-tête ne correspond pas au claim `org_id` | 403, `raison: 'tenant_mismatch'` |
| Bearer valide, claims valides | 200, `ctx = { tenantId: claims.org_id, actorId: claims.sub, role: claims.role }` |

**Trois points non négociables :**
- `verifierAcces` lit **uniquement** le JWT. Il ne lit **plus** les
  en-têtes `x-coach-os-tenant` / `x-coach-os-actor` / `x-coach-os-role`.
  S'il les lisait encore, le vecteur Melbourne rouvre la porte — c'est
  exactement la même attaque par un autre chemin.
- Le tenant vient **uniquement** du claim `org_id`. Pas de l'en-tête. Pas
  d'un argument `__tenantId` dans le body. **Une seule source.**
- Si `COACH_OS_DEMO_MODE` est `1` en production (variable définie
  ailleurs que `localhost`), la requête est **refusée**. Cette variable
  n'a pas sa place dans `api/`.

### Étape 4 · Brancher sur les deux endpoints

Modifie `api/v1/[tool].ts:20-35` et `api/v1/tools.ts:11-17` :
- **avant** toute logique métier, `await verifierAcces(req)`.
- Si `ok: false` → retourner `statut` et `raison` tels quels, **sans**
  exécuter l'outil.
- Si `ok: true` → propager `ctx` à l'adaptateur REST existant.

**Aucun autre fichier modifié.** Pas de refactor cosmétique.

## Les tests adversariaux — obligatoires

Crée `api/v1/_auth.test.ts` avec, au minimum :

| test | ce qui doit se passer |
|---|---|
| `en-tête_forgé_sans_jwt` | `Authorization` absent, mais `x-coach-os-tenant: cible` posé → 401, `token_absent` |
| `jwt_invalide_avec_en-tête_forgé` | Bearer pourri + `x-coach-os-tenant: cible` → 401, le tenant **n'est pas lu depuis l'en-tête** (vérifier dans le body du 401 qu'aucune trace de l'en-tête n'apparaît) |
| `jwt_valide_tenant_mismatch` | Bearer valide pour `org_id=A`, mais `x-coach-os-tenant: B` → 403, `tenant_mismatch` |
| `jwt_valide_claims_complets` | Bearer valide, claims `{ sub, org_id, role }` → 200, l'outil est exécuté avec `ctx.tenantId === org_id` |
| `jwt_expire` | Bearer avec `exp` passé → 401, `expire` |
| `demo_mode_refuse_en_prod` | `COACH_OS_DEMO_MODE=1` ET `NODE_ENV=production` → 401, **refus** |

**Un test qui passe ne prouve rien.** Ce qui prouve, c'est qu'il
**échoue avant** la correction. Pour chacun des six tests ci-dessus,
tu vérifies qu'avant ton correctif, le test échoue (ou que l'attaque
passe) ; après ton correctif, il passe.

Si tu n'arrives pas à prouver l'avant — par exemple parce que tu
travaille directement sur la branche où la correction est déjà faite —
tu écris dans le rapport **pourquoi l'avant ne pouvait pas être
reproduit** et tu justifies la confiance rétrospectivement.

## Garde-fous de fin

- `npx tsc --noEmit` → **exit 0** — bloquant.
- `npx vitest run src/lib/auth/ api/v1/` → **0 échec** — bloquant.
- La baseline connue (`npx vitest run` complet) reste à 209/211. Les 2
  échecs (`STORY1_ALIASES`, thème) sont antérieurs et hors périmètre.
  Si tu en as **3**, tu as cassé quelque chose : répare avant de rendre.
- Le rapport `_briefs/2026-08-15_W03_fermeture/RAPPORT_W03_FERMETURE.md`
  contient, pour chacun des six tests : `avant` (échec attendu) ·
  `après` (succès attendu) · `fichier:ligne` du correctif.

**Une trouvaille déclarée fermée sans ligne de code est une trouvaille
ouverte.**

## Ce qui ne te concerne pas

- Le hook JWT Supabase Cloud (Paquet B, HITL humain). Tu ne peux pas le
  faire depuis ce brief — l'UI Vercel/Supabase n'est pas dans ton
  périmètre. Tu vérifies que Paquet B est OK (étape 1), c'est tout.
- Les quotas (W13). Campagne différente.
- Le test de bout en bout contre Vercel. Tu testes contre `npm run dev`
  local, pas contre le déploiement. Paquet B teste le déploiement.

## Si tu bloques

- Paquet B non fait → `statut: bloque_paquet_B`, tu t'arrêtes, tu
  décris le manquant.
- `jose` ou équivalent n'est pas installé → tu le dis, tu ne
  réinventes pas la crypto.
- Un test ne reproduit pas l'avant → tu décris pourquoi, tu ne conclues
  pas « c'est bon quand même ».
- Tu dépasses le périmètre pour une raison valable → tu le documentes
  dans le rapport, avec le `fichier:ligne` exact.

**Un `exit 0` muet coûte plus cher qu'un échec déclaré.**
