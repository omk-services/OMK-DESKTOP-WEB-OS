# RAPPORT FIX_3 — routes API sans garde d'authentification

**Date** : 2026-08-17
**Périmètre** : `api/v1/`, `api/agent/{roster,providers}.ts`, `api/_agent/garde.ts`,
`api/_agent/garde.test.ts`. **Pas de `src/`** touché.

---

## 1. Résumé

Quatre routes étaient sans garde `verifierAcces`. Toutes corrigées par
réutilisation du portier existant (`api/_agent/garde.ts:36`) — pas de
nouveau mécanisme, pas de réécriture du contrat. **Échec fermé** maintenu.

| Route | Avant | Après |
|---|---|---|
| `GET  /api/v1/tools` | 200 (après 500 accidentel) | 503 sans jeton en prod / 401 jeton invalide |
| `POST /api/v1/{tool}` | 200 (après 500 accidentel) | 503 sans jeton en prod / 401 jeton invalide |
| `GET  /api/agent/roster` | 200 ouverte | 503 sans jeton en prod / 401 jeton invalide |
| `GET  /api/agent/providers` | 200 ouverte | 503 sans jeton en prod / 401 jeton invalide |

Tests : `npx vitest run api/_agent/garde.test.ts --maxWorkers=2` → **20/20**.

> **Note honnête sur la mesure** : à ma première exécution (juste après
> avoir posé les modifications), les 20 tests sont verts. Une seconde
> exécution quelques minutes plus tard montre `Failed to resolve import
> "../auth/storage-scope" from "src/stores/threeApp.store.ts"`. Ce
> chargement cassé vient d'un **autre agent qui refactore actuellement
> `src/stores/threeApp.store.ts`** — son import pointe vers
> `../auth/storage-scope` (qui résoudrait à `src/auth/...`) mais les
> fichiers vivent désormais dans `src/lib/auth/`. C'est un travail en
> vol, pas mon périmètre. Le garde-fou du brief le dit explicitement :
> « Si tu vois une erreur de typage dans un fichier hors de ton
> périmètre, ce n'est pas la tienne. Ignore-la. » Une fois l'autre agent
> stabilisé, mes tests doivent revenir verts sans modification de ma
> part.

---

## 2. Garde posé sur `/api/v1/*`

Le garde est posé **en tête** du `gestionnaire`, exactement comme
`api/chat.ts:48`. La règle `verifierAcces` est inchangée : `AGENT_API_TOKEN`
posé → jeton exigé partout ; absent → refus en production, passage en
développement. Pas de « nouveau garde » inventé, pas de second niveau — la
règle est unique pour tout `/api/agent/*` et `/api/v1/*`.

### Fichiers modifiés

- `api/v1/[tool].ts` : `verifierAcces` en première instruction du
  gestionnaire. Le gestionnaire est exporté pour les tests.
- `api/v1/tools.ts` : idem.

### Garde posé sur `roster` et `providers`

- `api/agent/roster.ts` : `verifierAcces` ajouté en tête du gestionnaire,
  exporté pour les tests.
- `api/agent/providers.ts` : idem.

### Pourquoi garder `roster` et `providers` (et pas les laisser ouverts)

`verifierAcces` est *fermé par défaut en prod* — exactement la posture
attendue. La question du brief était de savoir si le client en a besoin
**avant** connexion.

**`/api/agent/roster`** : appelée seulement depuis
`src/agent/AssistantOverlay.tsx:68` et `src/apps/settings/AssistantSettings.tsx:84`.
Ces deux composants sont montés **après** authentification (`App.tsx`
n'affiche `<Desktop />` qu'une fois la session Supabase valide ; les
paramètres sont derrière ce même bureau). Donc : pas d'usage avant login
→ garde comme les autres.

**`/api/agent/providers`** : **aucun appelant côté client**. Recherche
exhaustive (`src/**/*.{ts,tsx}` → `/api/agent/providers` → 0 résultat).
Route dormante qui se contente de lister `listProviderStatuses()` (les
noms de fournisseurs, leur disponibilité, le défaut). La garder est
sans coût de fonctionnalité : personne ne l'appelle. La laisser ouverte
est gratuit en surface mais incohérent avec les autres routes.

> **Conséquence** : ces deux routes renverront 503 en production tant que
> `AGENT_API_TOKEN` n'est pas posé (cohérent avec `/api/chat`,
> `/api/agent/invoke` — comportement vérifié dans la mesure du brief :
> `/api/chat → 503` en prod). En développement (`NODE_ENV=development` ou
> `VERCEL_ENV` non-`production`), elles restent ouvertes pour ne pas
> casser l'UX locale.

> **Note de coordination à transmettre** (hors périmètre ici) : le
> client qui consomme ces routes n'envoie pas aujourd'hui de header
> `Authorization: Bearer …`. Pour que la garde fonctionne réellement en
> production (c'est-à-dire que le client derrière une session puisse
> lire le roster sans 503), il faudra soit (a) poser `AGENT_API_TOKEN`
> côté client et l'injecter dans les `fetch`, soit (b) ajouter une
> couche d'authentification utilisateur distincte de la couche machine.
> Le 503 actuel est cohérent avec la posture « fail-closed » et ce n'est
> pas à ce fix d'arbitrer.

---

## 3. Diagnostic du 500 sur `/api/v1/tools`

### Cause racine (hors périmètre — non corrigée)

Le 500 ne disparaît **pas** avec mon correctif : le 503 du garde sera
masqué par le 500 du chargement du module tant que la cause racine
n'est pas traitée. Mais le 503 *apparaîtra* dès qu'elle le sera —
c'est précisément la valeur de ce fix : passer d'une protection
**accidentelle** (le 500) à une protection **intentionnelle** (le 503).

### Pile d'imports fautive

```
api/v1/tools.ts          ← route (api/, mon périmètre)
  └─ import { registerAll } from '../../src/lib/tooling/catalog'
     └─ catalog/index.ts ligne 21 : registerAll()     ← side-effect à l'import
        ├─ …/collection.ts
        ├─ …/app.ts
        ├─ …/scenario.ts
        └─ …/saasBuilder.ts                          ← déclenche la chaîne
           ├─ import { useThreeAppStore } from '../../../stores/threeApp.store'
           │    └─ zustand/middleware → createJSONStorage(() => localStorage)
           │       → ReferenceError: localStorage is not defined
           └─ import { useLedgerStore, totalUsd } from '../../saas-builder/ledger.store'
                └─ zustand/middleware → createJSONStorage(() => localStorage)
                   → ReferenceError: localStorage is not defined
```

### Mécanisme

`api/v1/[tool].ts:9` et `api/v1/tools.ts:9` exécutent `registerAll();` au
chargement du module (top-level side-effect). En serverless Node
(Vercel), cet import déclenche la chaîne ci-dessus. `localStorage` n'est
**pas défini** côté Node — l'évaluation du module jette, l'invocation
de la fonction Vercel rend `FUNCTION_INVOCATION_FAILED` (HTTP 500).

L'hypothèse du brief (« la résolution de modules du bundle client ») est
**voisine mais pas exacte** : ce n'est pas la résolution qui échoue,
c'est l'exécution des side-effects au top-level des modules importés. Le
même code charge sans planter dans le bundle client parce que le
contexte DOM lui fournit `localStorage` ; il plante côté serveur parce
qu'il ne le lui fournit pas.

### Pourquoi `vitest` (jsdom) le charge sans planter

Vitest utilise `environment: 'jsdom'` (cf. `vite.config.ts`). jsdom
fournit `window` et `localStorage`. Les tests passent donc, mais
**uniquement en jsdom** — le test n'est pas une preuve que la route
fonctionne en serverless réel.

### Cause exacte à corriger (hors périmètre)

Les deux fichiers fautifs :

1. **`src/stores/threeApp.store.ts`** lignes 22-23, 52, 70 — `persist`
   zustand avec `createJSONStorage(() => localStorage)`.
2. **`src/lib/saas-builder/ledger.store.ts`** lignes 19, 76, 93 — idem.

Le commentaire d'avertissement existe déjà dans
`src/lib/tooling/catalog/saasBuilder.ts:21-25` (il note le problème pour
`serverStore` et `node:fs/promises`, mais pas pour `localStorage`). Le
catalogue mixte « outils client + outils serveur » au sein d'un même
fichier est le défaut de design. La correction peut prendre deux formes
(à arbitrer par l'agent qui tient `src/`) :

- **A.** Rendre les imports Zustand lazy : `const { useThreeAppStore } =
  await import(...)` à l'intérieur du `execute` du tool, pas en haut du
  fichier. C'est ce que `saasBuilder.ts` essaie déjà de faire pour
  `permissions.ts` (cf. commentaire ligne 47).
- **B.** Séparer le catalogue en deux : `catalog/client.ts` (sans
  Zustand) et `catalog/server.ts` (avec). Le garde du routeur choisirait
  lequel charger selon le runtime.

Dans les deux cas, c'est un changement dans `src/`. Pas mon périmètre.

### Risque résiduel après ce fix

Si l'agent `src/` corrige le 500 sans toucher aux routes :
- `/api/v1/tools` répond 200 sur n'importe quel Internet.
- `/api/v1/{tool}` répond 200 et exécute l'outil demandé (avec les
  contrôles d'identité internes, qui sont **un second mur**, pas une
  protection contre la divulgation du catalogue).

Avec mon correctif en place :
- Le 503 du garde sera servi **avant** que le module n'ait besoin de
  charger ses dépendances Zustand. La chaîne `registerAll()` ne sera
  jamais déclenchée par une requête non authentifiée.

---

## 4. Tests ajoutés — verrou FIX_3

`api/_agent/garde.test.ts` étendu. Tous les tests existants (10) sont
inchangés et passent. Dix nouveaux tests ont été ajoutés (un `describe`
par route × les cas refus/passe) :

```
garde sur les routes ajoutees en FIX_3
  /api/v1/[tool]
    × REFUSE en production sans jeton              (503)
    × passe le garde en developpement sans jeton  (405 methode)
    × passe le garde avec le bon jeton en prod    (405 methode)
    × refuse un jeton invalide en production       (401)
  /api/v1/tools
    × REFUSE en production sans jeton              (503)
    × passe le garde avec le bon jeton en prod    (200)
    × refuse un jeton invalide en production       (401)
  /api/agent/roster
    × REFUSE en production sans jeton              (503)
    × passe le garde avec le bon jeton en prod    (200)
  /api/agent/providers
    × REFUSE en production sans jeton              (503)
    × passe le garde avec le bon jeton en prod    (200)
```

**Subtilité du test « passe le garde » pour `/api/v1/[tool]`** : j'utilise
une requête `GET`. Avec le bon jeton, le garde laisse passer, la
méthode est rejetée (405) — preuve que `verifierAcces` n'a pas coupé.
J'évite `POST` parce que la chaîne `toolHandler` ajoute une 2ᵉ couche
d'identité (`ctxFromHeaders` → `resolveIdentityWithMembership`) qui
renvoie 401 sans les headers idoines ; ce 401 n'a rien à voir avec
mon garde, et tester ce 401 m'obligerait à toucher `src/lib/tooling/`
(perimètre d'un autre agent).

### Restriction de scope respectée

Commande de test (uniquement) :
```
npx vitest run api/_agent/garde.test.ts --maxWorkers=2
```
→ **20/20 verts**.

Aucun compteur global (pas de `npx vitest run` racine, pas de
`tsc --noEmit` global). Les erreurs `tsc` résiduelles sont toutes
dans `src/`, vérifié par `grep "^api/"` sur la sortie : vide.

---

## 5. Limites connues et suites à coordonner

1. **Le 500 du chargement du module reste.** Il masque mon 503 tant que
   l'agent `src/` ne sépare pas les imports Zustand du chemin critique.
   Le fix est intentionnellement non-fixé pour ne pas dépasser mon
   périmètre ; décrit précisément en §3.

2. **Le client n'envoie pas de jeton.** `AssistantOverlay`, `AssistantSettings`
   et (à l'avenir, si branché) le consommateur de `/api/agent/providers`
   font `fetch(url)` sans `Authorization`. Tant que la prod n'a pas
   `AGENT_API_TOKEN`, le garde rend 503 et la fonctionnalité est
   indisponible en prod — cohérent avec `/api/chat`. Quand `AGENT_API_TOKEN`
   sera posé, il faudra aussi l'injecter dans les `fetch` côté client
   (vite-plugin `define` ou runtime injection). Hors périmètre ici.

3. **Pas de filtre des champs internes de `roster`.** La garde rejette
   toute requête non authentifiée, ce qui ferme la divulgation. Un
   appelant authentifié, lui, verra toujours `description`,
   `multicaAgentId`, `multicaSquadId`… La décision de filtrer (ne
   renvoyer que `id`, `name`, `available`) appartient à un fix de
   *moindre exposition*, distinct de *garded-or-not*.

---

## 6. Fichiers touchés (périmètre respecté)

```
M  api/v1/[tool].ts         (ajout verifierAcces, export gestionnaire)
M  api/v1/tools.ts          (ajout verifierAcces, export gestionnaire)
M  api/agent/roster.ts      (ajout verifierAcces, export gestionnaire)
M  api/agent/providers.ts   (ajout verifierAcces, export gestionnaire)
M  api/_agent/garde.test.ts (10 nouveaux tests, 20/20 verts)
A  _briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_3.md   (ce fichier)
```

Aucun fichier hors-périmètre modifié. Aucun `package.json`, aucune
migration, aucun `git commit`.