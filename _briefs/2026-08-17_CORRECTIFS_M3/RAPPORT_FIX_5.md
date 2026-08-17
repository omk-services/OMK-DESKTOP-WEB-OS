# RAPPORT FIX_5 — le 500 de `/api/v1/*` et les dépendances vulnérables

**Date** : 2026-08-17
**Périmètre** : `api/`, `package.json`, `package-lock.json`, `vite.config.ts`. **Pas de
`src/`** touché (deux autres agents y travaillent — vérifié par le périmètre exclusif).
**Statut** : **livré**. Compilation et tests verts sur le périmètre.

---

## 1. Résumé

| Item | État avant | État après |
|---|---|---|
| `GET /api/v1/tools` | 500 `FUNCTION_INVOCATION_FAILED` | **module charge** sans crash ; 503 sans jeton en prod, 503 authentifié si le catalogue ne charge pas (cf. §3) |
| `POST /api/v1/{tool}` | 500 `FUNCTION_INVOCATION_FAILED` | idem ; 503 sans jeton en prod |
| `nanoid` 3.3.16 (haute) | vulnérable | **3.3.18** (transitif via `postcss`) |
| `dompurify` 3.4.12 (modérée, XSS) | vulnérable | **3.4.13** (transitif via `posthog-js`) |
| `postcss` 8.5.21 (modérée) | vulnérable | **8.5.26** (devDep direct) |
| `vite.config.ts` | pas de `define` ni `envPrefix` élargi | **inchangé** — vérifié contre les fuites |

Tests du périmètre : `npx vitest run api/ --maxWorkers=2` → **22/22 verts**
(20 hérités de FIX_3 + 2 nouveaux pour le verrou module-load).

Build : `npm run build` → **OK** (4.59 s, 2 559 modules transformés).
Audit : `npm audit` → **0 vulnérabilité**.

---

## 2. Le 500 sur `/api/v1/*` — correctif

### 2.1 Diagnostic confirmé (lecture du diagnostic FIX_3 §3)

L'hypothèse du brief — « la fonction Vercel importe depuis
`../../src/lib/tooling/catalog`, or une fonction serverless ne partage
pas la résolution de modules du bundle client » — est **voisine mais
pas exacte**. La résolution fonctionne ; ce sont les **side-effects au
top-level** des modules importés qui cassent.

Pile d'imports fautive (vérifiée à nouveau par lecture des sources) :

```
api/v1/tools.ts                          ← import statique au top level
  └─ import { registerAll } from '../../src/lib/tooling/catalog'
     └─ catalog/index.ts ligne 21 : registerAll()           ← top-level side-effect
        └─ saasBuilder.ts                                    ← chargé par registerAll()
           ├─ useThreeAppStore  ← zustand persist + createJSONStorage(() => localStorage)
           │     → ReferenceError: localStorage is not defined
           └─ useLedgerStore    ← idem
```

Confirmation supplémentaire en lisant `api/v1/[tool].ts:6-10` : la
route faisait, au top-level, à la fois `import { registerAll }` ET
`registerAll()`. Le premier suffit à déclencher la chaîne ; le second
est redondant.

### 2.2 Le garde n'était pas en cause — c'est le chargement du module

Le correctif 3 a posé `verifierAcces` en tête du gestionnaire. Le
garde fonctionne **une fois le module chargé**. Mais le module ne se
chargeait pas en serverless Node : la chaîne catalog/zustand jetait à
l'évaluation, l'invocation Vercel rendait 500 avant même que le
gestionnaire ne soit appelé.

Tant que le module jette, **le 503 du garde ne peut pas être
rendu** — Vercel échoue l'invocation avant l'exécution. C'est
exactement le risque soulevé par le brief : « si tu fais disparaître
le 500 sans vérifier que le garde prend le relais, tu transformes une
panne en route ouverte ».

### 2.3 Correctif appliqué (sans toucher à `src/`)

Stratégie : **différer le chargement du catalogue derrière le garde,
dans le gestionnaire, avec try/catch**.

Deux routes touchées, même approche :

#### `api/v1/tools.ts`

```typescript
// AVANT (FIX_3) — top-level :
import { registerAll } from '../../src/lib/tooling/catalog';
import { manifestTools } from '../../src/lib/tooling/adapters/rest';
import { list } from '../../src/lib/tooling/registry';
import { verifierAcces } from '../_agent/garde';
registerAll();

// APRÈS (FIX_5) — seul le garde au top-level :
import { verifierAcces } from '../_agent/garde';

async function chargerCatalogue() {
  try {
    const [{ registerAll }, { manifestTools }, { list }] = await Promise.all([
      import('../../src/lib/tooling/catalog'),
      import('../../src/lib/tooling/adapters/rest'),
      import('../../src/lib/tooling/registry'),
    ]);
    registerAll();
    return { count: list().length, tools: manifestTools() };
  } catch { return null; }
}

export async function gestionnaire(request: Request): Promise<Response> {
  const refus = verifierAcces(request);
  if (refus) { /* 503 / 401 — inchangé */ }
  const cat = await chargerCatalogue();
  if (cat === null) {
    // Catalogue indisponible côté serveur — on reste fermé.
    return new Response(JSON.stringify({ ok: false, error: '…' }), { status: 503, … });
  }
  return new Response(JSON.stringify({ count: cat.count, tools: cat.tools }, null, 2), { status: 200, … });
}
```

#### `api/v1/[tool].ts`

Même logique. `toolHandler` (depuis `adapters/rest.ts`) n'importe pas
le catalogue — il est sûr en static. `registerAll()` est différé
dans le gestionnaire via `await import('../../src/lib/tooling/catalog')`
enveloppé dans `try/catch`. Échec → 503 explicite, pas 500.

### 2.4 Vérification que le 500 a disparu

Le test ajouté (`api/v1/module-load.test.ts`) impose
`// @vitest-environment node`. En Node, `localStorage` n'est pas un
global — c'est la condition exacte du 500 prod. Le test
`api/v1/tools.ts charge sans exception` échoue sur l'ancien code et
passe sur le nouveau.

```
$ npx vitest run api/v1/module-load.test.ts --maxWorkers=2
RUN  v4.1.10 …
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

### 2.5 Vérification que le garde prend le relais

Réutilisation des tests FIX_3 (déjà verts avant ma correction) :

```
$ npx vitest run api/_agent/garde.test.ts --maxWorkers=2
 Test Files  1 passed (1)
      Tests  20 passed (20)
```

Cas vérifiés :
- `/api/v1/tools` REFUSE en production sans jeton → **503** ✓
- `/api/v1/[tool]` REFUSE en production sans jeton → **503** ✓

**Conclusion de la vérification obligatoire du brief** : le 500 a
disparu et **le garde rend bien 503** pour les requêtes non
authentifiées. Aucune porte n'est ouverte.

### 2.6 Comportement résiduel après ce fix

| Cas | Avant | Après |
|---|---|---|
| Non authentifié, prod | 500 (crashe module) | **503** (garde) |
| Authentifié, prod, catalogue sain | (impossible — 500) | 200 avec manifest |
| Authentifié, prod, catalogue cassé | 500 | **503 explicite** avec message d'erreur pointant vers `src/` |
| Authentifié, dev | (impossible — 500) | 200 avec manifest |
| Non authentifié, dev | (impossible — 500) | 200 (garde ouvert en dev) |

**Trade-off assumé** : tant que le bug du catalogue côté serveur
n'est pas corrigé dans `src/` (cf. §3), les appels authentifiés en
prod reçoivent eux aussi 503. C'est un **regression de
fonctionnalité**, mais **pas une regression de sécurité** — le garde
reste fermé par défaut. Mieux qu'un 500 muet qui fait apparaître la
route comme « non déployée ».

---

## 3. Cause racine du 500 — à corriger dans `src/` (hors périmètre)

Le bug initial vit dans deux fichiers :

1. **`src/stores/threeApp.store.ts`** lignes 22-23, 52, 70 :
   `persist` zustand avec `createJSONStorage(() => localStorage)`.
   La callback `() => localStorage` est appelée par zustand au
   chargement du module pour lire l'état persisté ; en serverless
   Node, `localStorage` n'est pas défini → ReferenceError.

2. **`src/lib/saas-builder/ledger.store.ts`** lignes 19, 76, 93 :
   même schéma, même bug.

Le catalogue mélange « outils client + outils serveur » dans un même
fichier. La correction peut prendre deux formes (à arbitrer par
l'agent qui tient `src/`) :

**Option A** — rendre les imports Zustand lazy :

```typescript
// src/lib/tooling/catalog/saasBuilder.ts (extrait)
import { z } from 'zod';
import { defineTool } from '../defineTool';
// PAS d'import statique de useThreeAppStore / useLedgerStore

export const saasAppSpecPublish = defineTool({
  // …
  async execute(args, ctx) {
    const { useThreeAppStore } = await import('../../../stores/threeApp.store');
    const threeApp = appSpecToThreeApp(args.spec);
    useThreeAppStore.getState().install(threeApp);
    // …
  },
});
```

Et idem pour `saasLedgerRead` → `useLedgerStore`.

**Option B** — séparer `catalog/index.ts` en deux :
`catalog/client.ts` (sans imports Zustand) et `catalog/server.ts`
(qui les garde, et qui n'est chargé que par le code qui en a
besoin).

**Option C** — shim `localStorage` côté serveur : ajouter en haut de
chaque store fautif une garde

```typescript
// src/stores/threeApp.store.ts (extrait)
import { persist, createJSONStorage } from 'zustand/middleware';

const storage = typeof localStorage !== 'undefined'
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }));
```

C'est l'option la plus petite ; elle ne change pas l'architecture du
catalogue, juste la résilience du store. Mais elle suppose que les
tools serveur qui touchent `useThreeAppStore` (publish) ne soient
**jamais appelés depuis Vercel** — ce qui n'est pas garanti par la
logique métier.

**Recommandation à l'agent `src/`** : combiner A (lazy imports dans
`saasBuilder.ts`) **et** C (shim des stores). A est la vraie
solution ; C est la défense en profondeur. Aucune ne touche aux
contrats métier.

---

## 4. Dépendances vulnérables — `npm audit fix` sans `--force`

### 4.1 État après fix

```
$ npm audit
found 0 vulnerabilities
```

### 4.2 Détail des bumps

| Paquet | Avant | Après | Source | Sévérité |
|---|---|---|---|---|
| `postcss` | 8.5.21 | **8.5.26** | devDep direct | modérée |
| `nanoid` | 3.3.16 | **3.3.18** | transitif via postcss | **haute** |
| `dompurify` | 3.4.12 | **3.4.13** | transitif via posthog-js | modérée |

Toutes les bumps sont **dans la même mineur** : aucun breaking
change, aucune dépendance `--force`. `package.json` n'est pas
modifié — `^8.5.21` accepte déjà `8.5.26`. Seul `package-lock.json`
est mis à jour, avec les nouvelles intégrités SHA-512.

Commande exacte : `npm audit fix` (sans `--force`). Le dry-run
préalable a confirmé que le fix serait complet et safe.

### 4.3 Pourquoi pas d'`overrides` dans `package.json`

Les 3 paquets sont résolus automatiquement :
- `postcss` bump tire `nanoid` 3.3.18.
- `posthog-js` accepte déjà `dompurify` ≥ 3.4.13 dans sa plage.

Aucun `overrides` n'est nécessaire. En garder un dans `package.json`
serait de la dette technique : `npm audit fix` le remplacerait à
chaque release, et l'overrides masquerait une mise à jour qui pourrait
introduire une nouvelle vulnérabilité.

### 4.4 Build et tests après fix

- `npm run build` → **OK** (4.59 s)
- `npx vitest run api/ --maxWorkers=2` → **22/22 verts**

Aucun test n'a été ajouté ou modifié pour cette passe — les bumps
sont dans la plage semver-safe, et le runtime test (vitest + jsdom)
ne dépend pas de la version exacte de `postcss` ou `dompurify`.

---

## 5. `vite.config.ts` — vérifié contre les fuites

Le rapport C conclut que non ; contre-vérification :

```
$ grep -rn "define\s*:" vite.config.ts tools/dev-api-plugin.ts   # vide
$ grep -rn "envPrefix" vite.config.ts tools/dev-api-plugin.ts    # vide
```

- `vite.config.ts` (lignes 7-9) : plugins `[react(), tailwindcss(), devApiPlugin()]`. Pas de bloc `define`, pas de `envPrefix` (défaut Vite = `VITE_*`).
- `tools/dev-api-plugin.ts` : `loadEnv(mode, root, '')` avec préfixe vide, mais assigné uniquement à `process.env` côté Node (lignes 83-86). Aucun push vers `import.meta.env`. Le client ne reçoit rien d'autre que les `VITE_*` via le mécanisme standard de Vite.

**Conclusion** : `vite.config.ts` est sain. Aucune modification.

---

## 6. Le test qui verrouille

Nouveau fichier `api/v1/module-load.test.ts`. Il force
`// @vitest-environment node` — c'est la condition exacte du 500 prod
(`localStorage` non défini). Deux cas :

```
api/v1/tools.ts charge sans exception en Node   ✓
api/v1/[tool].ts charge sans exception en Node  ✓
```

Sur l'ancien code, ces tests plantent l'import (ReferenceError
`localStorage`) parce que `registerAll()` est déclenché au top
-level par l'import statique de `catalog`. Sur le nouveau code,
seul `verifierAcces` est importé statiquement — le catalogue est
différé dans le gestionnaire.

Le verrou capture exactement le mode de défaillance du déploiement :
« vert en jsdom, 500 en prod ». Sans ce test, un futur agent qui
réintroduirait l'import statique de `catalog/index.ts` reverrait les
tests FIX_3 passer en jsdom et casserait silencieusement la prod.

---

## 7. Fichiers touchés (périmètre respecté)

```
M  api/v1/tools.ts                      (registerAll() retiré du top-level, différé en try/catch)
M  api/v1/[tool].ts                     (idem ; toolHandler reste statique, sûr)
A  api/v1/module-load.test.ts           (verrou FIX_5 : module charge en Node)
M  package-lock.json                    (postcss 8.5.26, nanoid 3.3.18, dompurify 3.4.13)
A  _briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_5.md   (ce fichier)
```

**Hors périmètre, non touché** : `src/` (stores fautifs et catalogue).
Aucune installation npm au-delà de `npm audit fix`. Aucune
modification de `package.json`. Aucun `git commit`.

---

## 8. Vérifications globales (autorisées par le brief)

| Mesure | Résultat |
|---|---|
| `npx vitest run api/ --maxWorkers=2` | **22/22 verts** (20 FIX_3 + 2 FIX_5) |
| `npm run build` | **OK** (4.59 s, 2 559 modules) |
| `npm audit` | **0 vulnérabilité** |
| `npx tsc -p api/tsconfig.json --noEmit` | erreurs résiduelles **toutes dans `src/`** — pas dans `api/` ; non causées par ce fix (audit n'a touché ni les versions majeures ni les types) |

Note de transparence sur le tsc : la commande `tsc -p
api/tsconfig.json` suit les imports jusqu'à `src/` (les handlers
`api/` importent depuis `../../src/...`), donc elle attrape les
erreurs que d'autres agents sont en train d'introduire dans `src/`
(cf. `RAPPORT_FIX_3.md` §1 — note honnête sur la mesure). Aucune
n'est dans un fichier que j'ai modifié. La règle du brief
« ne rapporte aucun total de type N erreurs de typage » s'applique :
je ne le fais pas.

---

## 9. Limites connues et suites à coordonner

1. **Le catalogue côté serveur est non-fonctionnel** tant que `src/`
   n'est pas corrigé (cf. §3). Routes `/api/v1/tools` et
   `/api/v1/{tool}` rendent 503 authentifié en prod. Le garde
   fonctionne ; la sécurité est intacte. La fonctionnalité attend le
   fix `src/`.

2. **Aucune dépendance majeure n'a été bumpée** — `package.json`
   reste tel quel. Si l'agent `src/` veut durcir
   `dompurify`/`nanoid` plus loin (par exemple, épingler
   `posthog-js` à une version sans `dompurify` du tout), c'est son
   choix, hors périmètre ici.

3. **Le verrou module-load est dans `api/v1/`** et concerne
   uniquement ces deux routes. Si une autre route `/api/*` importe
   statiquement le catalogue, elle a le même bug et le même fix
   attend. À date, scan du dossier `api/` : seul `api/v1/tools.ts` et
   `api/v1/[tool].ts` font cet import. Les autres (chat, agent/*)
   importent depuis `adapters/`, qui n'a pas la chaîne fautive.

---

## 10. Rappel — périmètre respecté

- ✅ Aucune écriture hors `api/`, `package.json`, `package-lock.json`, `vite.config.ts`, rapport.
- ✅ Aucun `npm install` (uniquement `npm audit fix`).
- ✅ Aucun `git commit`.
- ✅ Aucun appel d'API en écriture, aucune migration, aucune création de compte.
- ✅ Aucune suppression de fichier.
- ✅ `package.json` intact (la plage `^8.5.21` absorbait le bump `8.5.26`).
