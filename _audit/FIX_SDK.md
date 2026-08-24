# Correction — contrat SDK

## Avant / après

| Mesure | Avant | Après |
|---|---|---|
| erreurs tsc totales | 60 | 0 (build final, apres les 4 agents en parallele) |
| erreurs dans mon périmètre | 6 (5 domain.ts + 1 acp.ts) | 0 |
| tests tooling | 104/104 attendu | 103/104 (1 echec hors perimetre, voir plus bas) |

Mesure intermediaire, immediatement apres mes corrections et avant que les
autres agents ne terminent : 55 erreurs totales, dont 1 seule dans mon
perimetre (`acp.ts`). Le grep `src/lib/tooling/` sur la sortie complete de
`npm run typecheck` ne remonte plus rien apres correction.

## Ce que j'ai corrigé

### `src/lib/tooling/catalog/domain.ts` — 5 erreurs

Les cinq outils rendaient un objet brut au lieu d'un `ToolResult<T>`
(`{ ok: true, data } | { ok: false, error }`), contrat impose par
`ToolExecutor` dans `types.ts` et verifie contre le modele qui compile,
`catalog/app.ts`.

- **`domain.list`** : `execute: async () => ({ domaines: DOMAINES })` →
  `execute: async () => ({ ok: true, data: { domaines: DOMAINES } })`.
- **`domain.state`** : le corps retournait directement l'objet d'etat.
  Enveloppe dans `{ ok: true, data: { ... } }`, contenu inchange.
- **`harness.list`** : appelait `chargerBridge()` et deconstruisait
  directement `{ HARNAIS }`, puis rendait `{ harnais: [...] }` sans
  enveloppe. Corrige pour lire `bridge.data.HARNAIS` (voir plus bas pour
  `chargerBridge`) et rendre `{ ok: true, data: { harnais: [...] } }`.
- **`avatar.dispatch`** : deux bugs.
  1. Meme defaut d'enveloppe que les precedents.
  2. **Bug reel** : la branche d'echec ne portait pas le champ `error` exige
     par `ToolFailure` — elle rendait `{ ok: false, motif: r.motif,
     diagnostic: r.diagnostic ?? null }`. Corrige en
     `{ ok: false, error: r.motif ?? 'Routage refuse.' }`. Le detail
     diagnostic du routeur (`r.diagnostic`) n'etait pas repris dans le
     nouveau message faute d'un canal prevu par `ToolFailure` pour un
     diagnostic structure — `ToolFailure.error` n'est qu'une `string` ; je
     n'ai pas invente un champ supplementaire pour ne pas m'ecarter du
     contrat sans le modifier (hors perimetre : `types.ts`).
- **`workflow.run`** : meme defaut d'enveloppe, corrige a l'identique.

### `chargerBridge()` — chargement du bridge, `catalog/domain.ts`

Avant :
```ts
async function chargerBridge(): Promise<any> {
  // @ts-expect-error resolution au runtime, hors du graphe de build
  return import('../../../../_runtime/bridge/bridge.mjs');
}
```
Deux problemes : (1) le point 3 du brief demandait de verifier la
profondeur relative et de remplacer un `import()` opaque par un echec
propre si le chargement echoue. La profondeur `../../../../` **etait
correcte** — verifie par mesure directe : `catalog/` → `tooling/` → `lib/`
→ `src/` → racine du projet, ou vit reellement
`_runtime/bridge/bridge.mjs` (confirme par `find`). (2) tout appelant qui
faisait `const { X } = await chargerBridge()` propageait une exception
opaque si le module manquait, sans jamais produire de `ToolResult`.

Apres :
```ts
async function chargerBridge(): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    // @ts-expect-error resolution au runtime, hors du graphe de build
    const mod = await import('../../../../_runtime/bridge/bridge.mjs');
    return { ok: true, data: mod };
  } catch (e) {
    return {
      ok: false,
      error: `Bridge introuvable (_runtime/bridge/bridge.mjs) : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
```
Les deux appelants (`harness.list`, `avatar.dispatch`) font maintenant
`const bridge = await chargerBridge(); if (!bridge.ok) return bridge;`
avant de deconstruire — l'echec de chargement se propage comme un
`ToolFailure` normal au lieu d'une exception non geree.

### `src/lib/tooling/adapters/acp.ts` — 1 erreur

`handleAcp(methode, params, id)` : `params` n'est jamais lu dans le
`switch` actuel (seul `tools/call`, absent de ce switch, en aurait
besoin). `tsc` : `TS6133: 'params' is declared but its value is never
read.`

Correctif : renomme en `_params` avec un commentaire expliquant pourquoi
le parametre reste dans la signature publique (routeur ACP appelant,
`tools/call` a activer plus tard). Aucune signature exportee changee,
aucun type affaibli.

## Erreurs hors périmètre

Aucune restante au moment du rapport : le build final (`npm run
typecheck`) rend 0 erreur au total, les trois autres agents ayant
termine leur propre perimetre en parallele. Au moment de ma propre mesure
intermediaire (55 erreurs totales), toutes etaient hors de mon perimetre
(apps/, components/, lib/audit, lib/auth, lib/supabase.ts,
onboarding/TourOverlay.tsx) — aucune ne touchait `catalog/domain.ts` ni
mes 15 adaptateurs, donc rien a signaler nommement a un agent precis.

## Ce que je n'ai pas su corriger

`npx vitest run --pool=threads src/lib/tooling` : 103/104 tests passent.
Le seul echec est **hors de mon perimetre** :

```
FAIL src/lib/tooling/identity.test.ts > whitelists publiées (référence)
  > roles : exactement owner, admin, member, guest
AssertionError: expected [ 'owner', 'admin', 'member', …(2) ] to deeply equal
  [ 'owner', 'admin', 'member', 'guest' ]
- Expected
+ Received
  [ "owner", "admin", "member", + "client", "guest" ]
```

`ROLES` dans `identity.ts` contient maintenant `'client'` en plus des
quatre roles attendus par le test. Ni `identity.ts` ni `identity.test.ts`
sont dans mon perimetre (interdits explicitement par le brief) — le role
`client` a probablement ete ajoute par un agent en parallele
(`audit-rbac` ou `audit-doctrine`) sans mettre a jour ce test de
reference. Je n'ai pas touche a ces fichiers ; a signaler a l'agent qui a
modifie `identity.ts`.
