# Audit — SDK unifié et reproductible

**Couverture : 38 fichiers lus (tooling/*, adapters/*24, catalog/*6, tsconfig*4, package.json, vite build output), 9 commandes exécutées** (`npm install`, `npx tsc --noEmit -p tsconfig.json`, `npx tsc -b`, `npx tsc -p tsconfig.tooling.json --noEmit`, `npx vitest run src/lib/tooling` ×2 pools, `npx vitest run` complet, `npx vite build`, plusieurs `grep`/`node -e` de résolution de chemin).

## Verdict global

Ce dépôt compile chez son auteur (le build Vite passe) mais **ne typecheck pas** : la commande que `package.json` désigne elle-même comme le typecheck (`tsc -b`) rend 60 erreurs sur tout le dépôt, dont 5 dans le fichier même que ce brief visait (`catalog/domain.ts`) — et le build réussit malgré ça parce que Vite ne typecheck jamais, il transpile. Un tiers qui clone, lance `npm run build`, voit un succès, et ignore que `npm run typecheck` casse. Ce n'est pas un SDK reproductible ; c'est un dépôt où deux commandes normalement redondantes (build, typecheck) racontent deux histoires différentes, et où rien ne force la seconde à passer.

## Le typecheck

**Piège méthodologique trouvé en premier** : la commande demandée dans le brief, `npx tsc --noEmit -p tsconfig.json`, **rend une sortie vide et un exit code 0** — pas parce que le code est propre, mais parce que `tsconfig.json` racine est un fichier de solution (`"files": [], "references": [...]`) et que `--noEmit` seul ne déclenche pas la construction des références. La commande a l'air de dire « tout va bien » alors qu'elle n'a rien vérifié. C'est le premier point de rupture de reproductibilité : quiconque suit l'intuition naturelle (`tsc --noEmit`) reçoit un faux vert.

Le vrai typecheck est celui que `package.json` déclare lui-même :

```json
"typecheck": "tsc -b"
```

Exécuté, il rend **exit code 2, 60 erreurs** (`grep -c "error TS"` sur la sortie complète). Extrait pertinent au périmètre de cet audit :

```
src/lib/tooling/adapters/acp.ts(70,3): error TS6133: 'params' is declared but its value is never read.
src/lib/tooling/catalog/domain.ts(56,24): error TS2322: Type 'Promise<{ domaines: ... }>' is not assignable to type 'ToolResult<unknown> | Promise<ToolResult<unknown>>'.
src/lib/tooling/catalog/domain.ts(69,3): error TS2322: [même famille — execute() ne rend pas { ok, data }]
src/lib/tooling/catalog/domain.ts(94,3): error TS2322: [idem, harnessList]
src/lib/tooling/catalog/domain.ts(114,3): error TS2322: [idem, avatarDispatch — en plus, la branche d'échec ('ok:false, motif, diagnostic') n'a pas le champ 'error' requis par ToolFailure]
src/lib/tooling/catalog/domain.ts(148,3): error TS2322: [idem, workflowRun]
```

**Gravité — bloquante, pas cosmétique.** `defineTool` (src/lib/tooling/defineTool.ts:34-37) exige que `execute` retourne `ToolResult<TOut> | Promise<ToolResult<TOut>>`, c'est-à-dire `{ ok: true, data } | { ok: false, error }`. Les 5 outils de `domain.ts` (`domain.list`, `domain.state`, `harness.list`, `avatar.dispatch`, `workflow.run` — src/lib/tooling/catalog/domain.ts:50-163) retournent directement l'objet métier (`{ domaines: [...] }`, `{ domaine, vp, ... }`, etc.) sans l'envelopper dans `{ ok: true, data: ... }`. C'est exactement le genre d'erreur que le typechecker existe pour attraper avant l'exécution — 5 des 6 outils MCP présentés dans le brief comme « le plan de contrôle du Business OS » (domain.ts, lignes 1-19) ne respectent pas le contrat qu'ils prétendent implémenter. `avatarDispatch` a en plus un vrai bug : sa branche d'échec `{ ok: false, motif, diagnostic }` (ligne 120) n'a pas le champ `error` qu'exige `ToolFailure` — un appelant qui fait `if (!result.ok) console.log(result.error)` reçoit `undefined`.

Sur les 60 erreurs totales, 6 sont dans `src/lib/tooling/` (5 dans domain.ts + 1 dans acp.ts) ; le reste (54) est ailleurs dans le dépôt et hors du périmètre de cet audit, mais confirme que le typecheck n'est vérifié par personne : aucune de ces 60 erreurs n'a de raison de survivre à un seul `tsc -b` lancé avant commit.

**`tsconfig.tooling.json` — configuration morte ou trompeuse.** Un troisième fichier de config existe spécifiquement pour ce module (`rootDir: "src/lib/tooling"`), mais lancé seul (`npx tsc -p tsconfig.tooling.json --noEmit`) il rend **21 erreurs `TS6059`** : presque tous les fichiers du module importent hors de `src/lib/tooling` (`../supabase`, `../../env`, `../../../_config/cms/quota`, `../tenant/contract`, `../saas-builder/...`), ce qui viole son propre `rootDir`. Cette config ne peut donc jamais tourner isolément sans échouer — elle donne l'illusion d'un module qui pourrait se builder à part (cohérent avec l'ambition SDK), alors qu'il est en réalité entrelacé avec le reste de l'app (`_config/`, `auth/`, `saas-builder/`) et ne l'a jamais été.

**Le build masque tout ça.** `npx vite build` réussit en 15,9 s, produit un bundle de 2,49 Mo, zéro erreur. Vite/esbuild transpile sans vérifier les types : un CI qui ne lance que `npm run build` (ce qui est le cas ici — aucun fichier `.github/workflows/*.yml` n'existe, cf. section Reproductibilité) laisse passer les 60 erreurs sans jamais les voir.

## Code mort et fausses surfaces

| Adaptateur | Exporté depuis index.ts ? | Importé ailleurs dans src (hors son propre fichier) ? | Appelle `list()`/`registerAll()` ? | Verdict |
|---|---|---|---|---|
| rest | oui | 2 fichiers | oui | branché |
| mcp | oui | 5 fichiers | oui | branché (surface principale, `api/v1`, `mcp/server.ts`) |
| mcp-apps | non (absent de index.ts) | 4 fichiers | oui | branché mais **pas ré-exporté** — incohérence avec le README du module qui dit « une définition, cinq surfaces » |
| cli | oui | 0 (hors adapters/index) | oui | exporté mais jamais importé côté app ; consommé par `cli/coach-os.ts` séparément (hors périmètre grep src/) |
| harness | non (absent de index.ts) | 1 fichier | oui | code présent, non exposé par le point d'entrée public |
| acp | oui | 1 fichier | oui | branché a minima |
| a2a | oui | 0 | oui (s'auto-appelle) | exporté, jamais consommé — surface fantôme |
| a2p | oui | 0 | non | exporté, jamais consommé, **n'appelle même pas `list()`** — invente sa propre source, ne projette pas le registre |
| a2ui | oui | 0 | oui | exporté, jamais consommé |
| acp-ibm | oui | 0 | oui | exporté, jamais consommé |
| agentos | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre |
| agp | oui | 0 | oui | exporté, jamais consommé |
| agui | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre |
| fcp | oui | 0 | oui | exporté, jamais consommé |
| in-app | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre — notable car c'est l'adaptateur cité dans defineTool.ts comme le garde-fou humain sur les écritures |
| oap | oui | 0 | oui | exporté, jamais consommé |
| rdf-agent | oui | 0 | oui | exporté, jamais consommé |
| skill | oui | 0 | oui | exporté, jamais consommé |
| tap | oui | 0 | oui | exporté, jamais consommé |
| tdf | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre |
| ucp | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre |
| webmcp | oui | 0 | oui | exporté, jamais consommé |
| mcp-schema | oui | 0 | non | exporté, jamais consommé, ne projette pas le registre — utilitaire de schéma, pas un adaptateur au sens strict |
| zod-introspect | non (absent de index.ts) | 0 | non | ni exporté ni consommé — mort à 100% |

**Chiffres bruts** : sur 24 fichiers dans `adapters/`, **6 seulement** (rest, mcp, mcp-apps, cli, harness, acp) sont importés par au moins un autre fichier du dépôt en dehors d'eux-mêmes et de `index.ts`. Les **18 autres** (a2a, a2p, a2ui, acp-ibm, agentos, agp, agui, fcp, in-app, oap, rdf-agent, skill, tap, tdf, ucp, webmcp, mcp-schema, zod-introspect) sont écrits, exportés (sauf mcp-apps, harness, zod-introspect qui ne le sont même pas), s'auto-testent parfois en s'appelant eux-mêmes, mais **ne sont appelés par aucun code applicatif, aucun test, aucun script**. Sur ces 18, 7 (a2p, agentos, agui, in-app, tdf, ucp, mcp-schema) n'appellent même pas `list()` du registre — ils ne projettent rien, ils existent en tant que fichiers.

C'est une surface de 24 protocoles qui, mesurée, se réduit à 6 réellement branchés dans le produit. Les 18 autres donnent l'illusion d'un SDK universel multi-protocole (« une définition, cinq/neuf surfaces ») alors qu'ils ne sont vérifiés par rien — ni un test qui les appelle depuis l'extérieur, ni un consommateur réel.

## Points de rupture

**1. Deux commandes de « typecheck » qui ne se contredisent pas — elles racontent des histoires différentes sans le dire.** `tsc --noEmit -p tsconfig.json` (la commande la plus intuitive) rend un faux succès silencieux ; `tsc -b` (celle que `package.json` désigne) est la seule qui échoue vraiment. Un tiers qui ne lit pas `package.json` mot à mot conclut, à tort, que le typage est propre.

**2. `catalog/domain.ts` charge le bridge par un `import()` littéral vers `../../../../_runtime/bridge/bridge.mjs`.** Le chemin résout correctement depuis les sources (`node -e` de résolution confirmé : `<racine>/_runtime/bridge/bridge.mjs`, fichier présent). Mais le build Vite produit un bundle de 2,49 Mo dans lequel **aucune trace de `bridge.mjs`, `chargerBridge`, `domain.list` ou `avatar.dispatch` n'apparaît** (`grep -c "bridge.mjs" dist/assets/*.js` → 0). Ce n'est pas une rupture du chemin relatif en tant que tel — c'est que **`catalog/domain.ts` n'est jamais importé par le code qui compose le bundle client** ; il n'est atteint que côté serveur/CLI/MCP (`api/v1/tools.ts`, `api/v1/[tool].ts`, `mcp/server.ts`, `cli/coach-os.ts`), qui ne passent pas par Vite. **Le point de rupture réel est donc ailleurs : si un jour quelqu'un bundle ce module pour un paquet publié via un bundler qui ne laisse pas d'`import()` dynamique non résolu tel quel (Rollup en mode `noExternal`, esbuild en mode single-file, etc.), ce chemin à 4 niveaux vers un dossier hors de `src/` cassera à la première tentative.** Le fait qu'il « marche » aujourd'hui tient à ce que le seul runtime qui l'exécute (Node, via les scripts serveur) résout les chemins relatifs sur disque, pas à travers un bundle.

**3. `zod` n'est pas dans `dependencies`, seulement dans `package-lock.json` comme dépendance transitive** (via `@ai-sdk/*`, `zod-to-json-schema`, etc.) — `grep -n "\"zod\""` sur `package.json` ne rend rien, alors que 12 fichiers du module tooling en dépendent directement (`import { z } from 'zod'` dans `types.ts`, `defineTool.ts`, `catalog/domain.ts`, etc.). `npm install` réussit aujourd'hui parce qu'une dépendance transitive suffisamment récente satisfait l'import — mais c'est un accident de résolution, pas un contrat. Si la version de `@ai-sdk/anthropic` ou d'une autre dépendance bouge et cesse d'exiger `zod`, le module tooling casse silencieusement sans qu'aucune ligne de `package.json` n'ait changé. Un SDK reproductible déclare ses propres dépendances directes ; celui-ci emprunte celle d'un tiers.

**4. `tsconfig.tooling.json` ne peut pas tourner seul** (21 erreurs `TS6059`, rootDir violé par la moitié des imports du module) — cf. section typecheck. Toute promesse de « le module tooling se build indépendamment » est fausse en l'état.

**5. Aucun CI.** `find .github/workflows -name "*.yml"` → aucun résultat. Rien ne force `tsc -b`, `vitest`, ou même `vite build` à passer avant un merge. Le seul filet est humain.

**6. `package.json.files` référence `INSTALL.md`** (`"files": ["dist", "cli", "mcp", "coach-os-plugin", "server.js", "README.md", "INSTALL.md"]`) **qui n'existe pas à la racine du dépôt.** Si ce paquet était publié tel quel (`npm publish`), npm avertirait ou omettrait silencieusement ce fichier — mais la promesse documentaire faite dans `package.json` (« il y a un guide d'installation ») est déjà rompue avant publication.

## Reproductibilité — le test du franchisé

Étapes qu'un tiers peut suivre aujourd'hui, dans l'ordre où il les découvrirait :

1. `npm install` — **fonctionne**. 262 paquets, 0 vulnérabilité, ~1 min. Un `package-lock.json` existe et est cohérent.
2. `npm run build` — **fonctionne**, 15,9 s, avertit sur la taille du bundle (2,49 Mo) mais n'échoue pas.
3. `npm run typecheck` — **échoue**, 60 erreurs, exit 2. Un franchisé qui suit l'ordre naturel (install → build → typecheck, ou pire, ne lance jamais typecheck parce que le build a semblé suffire) ne le découvre jamais.
4. `npm test` (`vitest run`) — **échoue partiellement dans cet environnement pour une raison d'infrastructure, pas de code** : le pool par défaut (`forks`) ne démarre pas ses workers ici (`Timeout waiting for worker to respond` sur 6 fichiers, dont les 6 fichiers de test du module tooling). Avec `--pool=threads`, tout passe (543/544 tests, la suite complète). **Rien dans `package.json`, `vite.config.ts` ou une doc ne mentionne cette bascule** — un tiers sur un environnement où `forks` ne démarre pas (conteneur restreint, certains CI managés) voit `npm test` échouer sur *tous* les fichiers sans texte d'erreur pointant vers une cause de code, et n'a aucune indication qu'il faut essayer `--pool=threads`.
5. Pas de `.env.example` à la racine (vérifié par `Glob`) — les variables d'environnement nécessaires (Supabase, clés d'IA pour saas-builder, `AGENT_API_TOKEN` vu dans `api/_agent/garde.test.ts`) ne sont documentées nulle part de façon centralisée pour un tiers.
6. Pas de `.nvmrc` — aucune version de Node n'est fixée ; le champ `engines` est absent de `package.json`.
7. Pas de CI (`.github/workflows/` absent) — rien ne vérifie automatiquement les points 2 à 4 avant qu'un changement soit intégré.
8. `INSTALL.md`, référencé dans `package.json.files`, n'existe pas à la racine.

**Ce qui manque pour qu'un franchisé démarre seul** : un `.env.example` listant les variables requises par domaine (Supabase, IA, quota), un `.nvmrc` ou un champ `engines`, un CI minimal qui lance au moins `tsc -b` et `vitest run` (avec le bon `--pool`), et soit la suppression de la référence à `INSTALL.md` soit sa création.

## Ce qui tient

- **`npm install` est propre et reproductible** : lockfile cohérent, 0 vulnérabilité, aucune dépendance native cassée.
- **Le contrat `defineTool` est bien conçu et fait respecter des règles réelles** : nom kebab-case validé par regex (`defineTool.ts:43`), description plafonnée à 240 caractères avec message d'erreur explicite (`defineTool.ts:53-57`), `displayName` obligatoire pour toute catégorie `ecriture` (`defineTool.ts:58-62`). Ce ne sont pas des contraintes cosmétiques — elles sont vérifiées à la définition, pas à l'exécution, et lèvent une exception si violées.
- **Les 6 fichiers de test du module tooling (harness, identity, mcp-apps, permissions, quota, serverStore) passent intégralement** — 104 tests, 0 échec (`--pool=threads`).
- **Le registre est réellement le pivot pour les 6 adaptateurs branchés** (rest, mcp, mcp-apps, cli, harness, acp) : ils appellent `list()`/`registerAll()` et projettent ce que le catalogue contient, pas une source inventée.
- **La suite de tests complète du dépôt est à 543/544** ; le seul échec (`api/_agent/garde.test.ts`, timeout sur un test réseau, hors périmètre) n'est pas lié au module tooling.
- **`registry.ts` refuse les doublons silencieux** (`register()` lève si le nom existe déjà, ligne 23) — un vrai garde-fou de catalogue, pas une promesse en l'air.

## Questions ouvertes

- Les 18 adaptateurs jamais consommés (a2a, a2p, a2ui, acp-ibm, agentos, agp, agui, fcp, in-app, oap, rdf-agent, skill, tap, tdf, ucp, webmcp, mcp-schema, zod-introspect) sont-ils un inventaire volontaire pour de futures surfaces, ou du code écrit en avance sur son usage ? Aucun ticket, aucune date, aucun commentaire de fichier ne tranche cette question dans le périmètre lu.
- `mcp-apps.ts` et `harness.ts` sont consommés (4 et 1 imports) mais absents de `index.ts` — export oublié, ou volontairement privés à l'usage interne du dépôt ? Si privés, pourquoi `zod-introspect.ts` (également absent de `index.ts`) est-il rangé dans le même dossier `adapters/` que les surfaces publiques ?
- Pourquoi `tsconfig.tooling.json` existe-t-il si personne ne peut le lancer seul sans 21 erreurs ? A-t-il jamais fonctionné, ou est-il resté d'une intention antérieure au moment où le module s'est entrelacé avec `_config/`, `auth/` et `saas-builder/` ?
- Le pool `vitest` par défaut échoue systématiquement dans cet environnement d'audit (sandbox Windows) mais pas dans l'environnement de l'auteur, vraisemblablement. Est-ce documenté ailleurs dans le dépôt (hors du périmètre de lecture de cet audit) ou une connaissance tacite non écrite — exactement le type de savoir qu'un SDK reproductible ne devrait jamais présupposer ?
