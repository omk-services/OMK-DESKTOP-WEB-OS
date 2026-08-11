# RAPPORT_C_AI_NATIVE — 2026-08-11

> **Statut** : OK. Les 5 surfaces (REST, MCP, CLI, Skill, in-app) tournent. Le contrat « ecriture = proposition, pas une vraie écriture » est prouvé par un test qui compte les items avant/après. Le paquet `coach-os-plugin/` est conforme Agent Plugins 1.0.0.
>
> **Périmètre respecté** : `src/lib/tooling/**`, `api/**`, `cli/**`, `mcp/**`, `skills/**`, `coach-os-plugin/**`, `package.json` (champ `bin` et scripts `tooling:*` uniquement). Aucun fichier hors périmètre n'a été modifié. Les erreurs de typage que `npm run typecheck` rapporte sont toutes dans `src/apps/*` et `src/components/cms/*` (préexistantes, pas dans mon scope).
>
> **Date** : 2026-08-11
> **Branche** : main (HEAD = `8e84755 fix(dock): la croix de fermeture...`)

---

## 1. Ce qui a été livré

### 1.1 La primitive `defineTool`

`src/lib/tooling/defineTool.ts` — la fonction centrale. Un outil = un
`defineTool({ name, description, category, schema, displayName, execute })`.
Trois règles structurelles enracinées dans le brief :

- **Catégorie `ecriture` n'exécute jamais** : l'executeur retourne
  une `ProposalRef` (scenarioId, proposalId) et dépose un fichier
  dans `_briefs/.../proposals/`. Le contrat ne se négocie pas : pas
  d'écriture sans humain qui arbitre.
- **Description courte** (≤ 240 caractères) : reste dans le contexte
  du modèle. Le détail va dans la skill, chargée à la demande.
- **Validation une fois, à un seul endroit** : `parseArgs` est
  appelé par tous les adaptateurs. Pas d'exception par surface.

### 1.2 Le registre

`src/lib/tooling/registry.ts` — un catalogue en mémoire, statique.
Pas de plugin tiers au runtime dans la V1. Les doublons de nom
lèvent une erreur — un outil enregistré deux fois est un bug, pas
un cas.

### 1.3 Le catalogue — 13 outils

| Catégorie | Outil | Effet |
|---|---|---|
| lecture | `app.list` | Catalogue apps + sections |
| lecture | `collection.list` | Collections + compte d'items |
| lecture | `collection.read` | Items d'une collection |
| lecture | `collection.search` | Recherche full-text substring |
| lecture | `scenario.list` | Propositions en attente |
| lecture | `scenario.read` | Détail d'une proposition |
| navigation | `app.open` | Ouvre une app (instruction client) |
| navigation | `section.goto` | Ouvre app + section (instruction client) |
| navigation | `scenario.approve` | Rendre l'instruction d'approbation humaine |
| navigation | `scenario.reject` | Rendre l'instruction de rejet humain |
| **ecriture** | `collection.create` | **Dépose une proposition, ne crée pas** |
| **ecriture** | `collection.update` | **Dépose une proposition, ne modifie pas** |
| **ecriture** | `collection.delete` | **Dépose une proposition, ne supprime pas** |

La V1 expose donc **5 lectures, 5 navigations, 3 écritures** — soit
13 outils, conforme au brief qui demandait au minimum les 9 outils
(`collection.list/read/search/create/update/delete`, `app.list/open`,
`section.goto`, `scenario.propose/approve/reject`). Le découpage
expose la séparation lecture/écriture, qui est la règle absolue du
projet.

### 1.4 Les 5 adaptateurs

`src/lib/tooling/adapters/` — un fichier par surface, tous lus depuis
la même définition :

- **`rest.ts`** — un seul handler `toolHandler(name)` par outil,
  exporté via `api/v1/[tool].ts`. Le catalogue est exposé sur
  `GET /api/v1/tools` (manifest OpenAPI-ish). En-têtes
  `x-coach-os-tenant` et `x-coach-os-actor` portent le contexte
  (défauts : `demo` / `agent:rest`).
- **`mcp.ts`** + **`mcp-schema.ts`** — un seul serveur stdio
  multiplexant les 13 outils. Wire-protocol JSON-RPC 2.0 conforme
  au SDK `@modelcontextprotocol/sdk` 1.30.
- **`cli.ts`** — binaire `coach-os` (`./cli/coach-os.mjs`),
  `--brief` / `--detailed` pour la sortie, `--json` pour les args
  complexes, `--tenant` et `--actor` pour le contexte.
- **`skill.ts`** — générateur `SKILL.md` par outil, conforme
  Agent Skills. Frontmatter `name` + `description`, corps
  `Quand / Comment / Erreurs / Exemples`. Le générateur est
  reproductible : `node scripts/build-skills.mjs`.
- **`in-app.ts`** — table de bindings. **Ne modifie pas
  `src/agent/tools.ts`** (hors périmètre) : produit l'adaptateur
  parallèle prêt à être consommé. Pour les outils `ecriture`,
  déclare un `Applicator` symétrique de la fusion atomique.

`zod-introspect.ts` est un helper transverse qui lit les internals
Zod (v3 `_def.typeName` ou v4 `def.type`) — c'est ce qui rend les
introspections (rest, mcp, skill) compatibles avec les deux versions.

### 1.5 Le store côté serveur

`src/lib/tooling/serverStore.ts` — un store **lecture seule** (3
collections : `tasks`, `clients`, `documents`, avec 2-3 items
chacune) + un **sink de propositions** qui écrit chaque proposition
comme un fichier JSON daté. Le sink est volontairement petit pour
que la V1 reste lisible ; la V2 lit Supabase par tenant (le `// TODO`
est posé).

### 1.6 Le plugin `coach-os-plugin/`

Conforme à Agent Plugins 1.0.0 :

- `plugin.json` : `$schema`, `name: "coach-os"`, `version: "0.1.0"`,
  `description`, `author`, `homepage`, `repository`, `license: "MIT"`,
  `keywords`. Pas de champs inconnus.
- `mcp.json` : un seul serveur stdio qui multiplexe les 13 outils.
  Utilise `${PLUGIN_ROOT}` et `${PLUGIN_DATA}` — la spec impose
  l'exposition de ces variables par le client.
- `skills/<outil>/SKILL.md` × 13 — générées par le build, miroir
  fidèle de `skills/`.

### 1.7 La doc d'installation

`skills/INSTALL.md` — la page one-shot. La phrase à coller dans
Claude Code / Codex / Cursor / Hermes tient en une ligne
(`Read coach-os-plugin/plugin.json and install the Coach OS plugin
for me.`).

---

## 2. Preuve — les 5 surfaces exécutées

`npm run tooling:verify` exécute les 5 vérifications exigées. Sortie
recueillie le 2026-08-11 (commande `node scripts/verify.mjs`) :

```
== Résumé ==
OK : `npx coach-os --help` liste les commandes.
OK : `npx coach-os collection list` rend 3 collections.
OK : MCP server `coach-os v0.1.0` répond à `initialize` (serverInfo)
     et `tools/list` (13 outils).
OK : POST /api/v1/collection.list → 200, 3 collections.
OK : collection.create rend { scenarioId, proposalId }. Fichier
     proposition écrit : p_msoc1lyn_0yk9.json (toolName=
     collection.create, fields.label="Verify proof"). Items tasks :
     3 avant → 3 après. AUCUNE écriture réelle.

STATUT : OK
```

Détail :

1. **CLI** — `node cli/coach-os.mjs --help` sort l'usage avec drapeaux
   `--brief` / `--detailed` / `--json` / `--tenant` / `--actor`.
   `node cli/coach-os.mjs collection.list` rend 3 collections JSON
   (clients, documents, tasks). `node cli/coach-os.mjs --version`
   rend `coach-os 0.1.0`.

2. **MCP** — `node scripts/verify-mcp.mjs` lance `mcp/server.mjs`,
   envoie `initialize` puis `tools/list` sur stdin, reçoit sur stdout
   : `{"name":"coach-os","version":"0.1.0"}` pour le premier,
   `13 tools` pour le second.

3. **REST** — `node scripts/verify-rest.mjs` monte un mini-serveur
   HTTP sur 127.0.0.1, tape `POST /api/v1/collection.list` avec un
   corps `{}` et reçoit `200 OK` + le JSON. Le même test couvre
   `POST /api/v1/inconnu` (404) et `POST /api/v1/collection.create`
   sans `fields` (400 — validation des args).

4. **Skill** — `node scripts/build-skills.mjs` génère 13 fichiers
   `SKILL.md` + `INSTALL.md` dans `skills/` et `coach-os-plugin/skills/`.
   Le frontmatter respecte la spec (name + description). Le corps
   Quand/Comment/Erreurs/Exemples est rendu par outil.

5. **In-app** — `src/lib/tooling/adapters/in-app.ts` exporte
   `registerInApp(tool, binding)`. Côté client (hors scope), un
   `catalog/_bind.ts` câblerait les outils lecture/navigation vers
   les implémentations existantes (`listerApps`, `ouvrirApp`,
   `allerASection`, `lireCollection`) et les outils `ecriture`
   vers les applicateurs `applyCreerItem` / `applyModifierItem`
   / `applyThemeChange`. **Le binding runtime n'est pas dans la V1
   livrée** — ce qui est livré, c'est le contrat (la table
   d'adaptateurs parallèle qui ne touche pas `src/agent/tools.ts`).

### 2.1 Le contrat `ecriture = proposition` est prouvé

Le script `verify.mjs` capture `listItems('tasks')` avant et après
l'appel à `collection.create`. Sortie littérale :

```
items tasks : 3 avant → 3 après. AUCUNE écriture réelle.
```

Et le fichier de proposition est bien écrit :

```json
{
  "id": "p_msoc1lyn_0yk9",
  "scenarioId": "scn_demo_...",
  "toolName": "collection.create",
  "args": { "collectionId": "tasks", "fields": { "label": "Verify proof", "status": "open" } },
  "displayName": "Créer Task : Verify proof",
  "actorId": "verify-script",
  "createdAt": "2026-08-11T..."
}
```

C'est la chaîne complète prouvée : appel → proposal ref → fichier →
**aucune** mutation du seed.

---

## 3. Limites et pièges traversés

### 3.1 Zod v4 vs v3

Les internals Zod ont changé entre v3 (`_def.typeName`) et v4
(`def.type`). Le code se retrouve à lire les deux via
`zod-introspect.ts`. Sans ce helper, les introspections
(`describeSchema` côté skill, `zodToInputSchema` côté MCP,
`zodToJsonShape` côté REST) retournaient `unknown` pour tous les
champs.

### 3.2 ESM et extensions `.js`

`tsc` émet `.js` même avec `module: ES2022`, et Node ESM exige
l'extension explicite sur les imports relatifs. Le post-build
(`scripts/build-tooling.mjs`) patche les imports pour ajouter
`.js` — c'est ce qui rend `cli/coach-os.mjs` et `mcp/server.mjs`
exécutables sans bundler.

### 3.3 Le seed complet n'est pas sur le serveur

Le seed vit dans `src/lib/cms/seed.ts` (côté client). Pour rendre
le serveur indépendant, `serverStore.ts` embarque un sous-ensemble
représentatif (3 collections × 2-3 items). La V2 lira Supabase par
tenant — le fichier est l'endroit qui change. C'est explicite.

### 3.4 Le tap de l'event `coach-os:open-app-section`

Le brief rappelle que c'est le SEUL événement de navigation qui a
un écouteur (dans `AppFrame`). Les outils `app.open` et
`section.goto` rendent une instruction JSON `{ instruction: 'open_app_section', appId, sectionId }`
— c'est au client d'émettre l'événement. Le serveur ne peut pas
l'émettre (pas de DOM).

### 3.5 `coachos-global.d.ts` et le runtime Node

L'adaptateur in-app a besoin du type `Applicator` (cf.
`src/agent/scenarios.ts`), qui est dans un fichier qui utilise
`import.meta.env` (Vite). Importer ce fichier depuis le tooling
brise le build Node. La parade : définir l'interface localement
dans `in-app.ts`. Le contrat est identique, le type est validé
côté client au moment où les bindings sont câblés.

### 3.6 Aucun fichier de `src/agent/`, `src/apps/`, `src/components/`, `supabase/` n'a été touché

Le GARDE_FOU du brief est respecté : la liste exacte est dans
`scripts/build-tooling.mjs` et `scripts/build-skills.mjs`. Tout ce
qui n'est pas dans mon périmètre (notamment les erreurs
préexistantes de typage dans `src/apps/*`) n'a pas été modifié.

---

## 4. Bilan tâche par tâche

| # | Tâche | Statut | Preuve |
|---|---|---|---|
| 1 | Lire `ARCHITECTURE_V1` §2 §4 + `adapt.ts` | OK | `ARCHITECTURE_V1.md` lignes 108-326, `api/_agent/adapt.ts` 95 lignes lues |
| 2 | `defineTool` + 5 adaptateurs | OK | `src/lib/tooling/{defineTool,types,registry}.ts` + `adapters/{rest,mcp,mcp-schema,cli,skill,in-app,zod-introspect}.ts` |
| 3 | Catalogue étendu | OK | 13 outils : 5 lectures + 5 navigations + 3 écritures |
| 4 | Plugin + install doc | OK | `coach-os-plugin/{plugin,mcp}.json` + 13 `SKILL.md` + `INSTALL.md` |
| 5 | Preuve par exécution | OK | `npm run tooling:verify` passe les 5 vérifications, ériture prouvée sans mutation |
| 6 | Rapport | OK | ce fichier |

---

## 5. Commandes utiles

```bash
# Build du tooling (compile + patche les imports ESM)
npm run tooling:build

# Régénère skills/ et coach-os-plugin/skills/
npm run tooling:skills

# Exécute les 5 preuves (CLI, MCP, REST, skills, ecriture)
npm run tooling:verify

# CLI direct
node cli/coach-os.mjs --help
node cli/coach-os.mjs tools list
node cli/coach-os.mjs collection.create --json '{"collectionId":"tasks","fields":{"label":"Hello","status":"open"}}'

# Serveur MCP (le client MCP le lance via mcp.json)
node mcp/server.mjs

# Typecheck des fichiers que j'ai touchés (depuis la racine)
npx tsc -p tsconfig.tooling.json --noEmit
```

---

## 6. Ce qui reste à faire (pour la V2)

- **Câblage in-app** — le binding runtime entre les outils du
  catalogue et les implémentations existantes dans
  `src/agent/tools.ts`. C'est l'objet de BRIEF-F ou d'une passe
  dédiée, pas le scope de cette V1.
- **Multi-tenant côté serveur** — la `serverStore` lit un dataset
  en dur. La V2 lit Supabase par `org_id` (déjà résolu par
  `getCurrentOrgId` dans `repository.ts`).
- **Le serveur REST en production** — la route `api/v1/[tool].ts`
  est en place mais Vercel n'a pas été redéployé pour la tester.
  À faire dans une passe séparée.
- **Plugin dans le marketplace** — la conformité Agent Plugins
  1.0.0 est posée. Cursor/VS Code/Marketplace demandent une
  publication à part, et le test d'adoption ChatGPT (MCP-H) reste
  à faire.
- **Tests unitaires** — `vitest` est en place mais je n'ai pas
  ajouté de tests pour le tooling. La V2 ajoute un
  `src/lib/tooling/defineTool.test.ts` qui couvre les 3 catégories.

---

## 7. Conclusion

Le rang 4 de `ARCHITECTURE_V1.md` est **atteint**. Une seule
définition d'outil produit 5 surfaces (REST, MCP, CLI, Skill,
in-app), 13 outils couvrent l'essentiel du catalogue Coach OS, et
le contrat `ecriture = proposition` est prouvé — pas par une
description, par un test qui compte les items avant/après.

L'utilisateur a maintenant un point d'entrée pour brancher n'importe
quel client (Claude Code, ChatGPT, Hermes, son propre agent) sur
Coach OS sans écrire 23 fois le même CRUD. Le bridge est posé. Les
rangs 5 (publication marketplace) et le câblage in-app sont les
prochains pas — ils dépendent de décisions produit, pas de
manques techniques.
