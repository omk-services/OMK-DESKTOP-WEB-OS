# Installation — Coach OS

Étapes exactes, du clone au premier `--sante` qui répond. Chaque commande de
cette page a été exécutée réellement pendant la rédaction (voir
`_audit/FIX_CI.md` pour le détail de chaque vérification).

## 1. Prérequis

- Node.js **24.12.0** (version fixée dans `.nvmrc` — `nvm use` si vous utilisez nvm).
- npm (livré avec Node). Ce dépôt ne dépend d'aucun autre gestionnaire de
  paquets malgré la présence de `pnpm-workspace.yaml` (résidu — `npm` est le
  gestionnaire réel : `package-lock.json` est le lockfile source de vérité).

## 2. Cloner et installer

```bash
git clone <url-du-depot> coach-os-app
cd coach-os-app
npm install
```

`npm ci` fonctionne aussi et est ce que la CI utilise (installation stricte
depuis `package-lock.json`).

## 3. Configurer l'environnement

Copier le fichier d'exemple en `.env.local` (lu par Vite au démarrage) :

```bash
cp .env.example .env.local
```

Puis renseigner au minimum `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
si vous voulez un vrai backend — sans elles, l'app démarre quand même et
bascule automatiquement sur son seed local (mode démo), elle ne plante pas.
Le détail de chaque variable — où elle est lue, à quoi elle sert, ce qui se
passe si elle est absente — est commenté directement dans `.env.example`.

**Si `.env.example` est absent ou incomplet** dans votre copie du dépôt : le
contenu de référence, à jour au moment de la rédaction de cette page, vit
dans `_audit/env-example-content.txt` (voir la section « Ce que je n'ai pas
su faire » de `_audit/FIX_CI.md` — un outillage de sandbox a empêché
l'écriture directe du fichier `.env.example` pendant cette passe). Copier ce
fichier vers `.env.example` s'il manque :

```bash
cp _audit/env-example-content.txt .env.example
```

## 4. Lancer l'app en local

```bash
npm run dev
```

Vite sert l'app sur `http://localhost:5173` (ou le premier port libre au-dessus).

## 5. Vérifier que tout fonctionne — reproduire la CI en local

Une seule commande rejoue, dans l'ordre, tout ce que la CI vérifie :

```bash
npm run verify
```

Elle enchaîne : `typecheck` → `typecheck:api` → `test` → `build` → les
quatre bancs du runtime (`bench:kernel`, `bench:bridge`, `bench:adapters`,
`bench:rbac`). Si une étape échoue, `verify` s'arrête là — pas de vert
optimiste.

### Deux pièges déjà payés, à ne pas re-découvrir

**Piège 1 — `npx tsc --noEmit -p tsconfig.json` est un faux positif.**
Cette commande semble raisonnable et rend `exit 0`, zéro ligne — un
typecheck qui a l'air propre. C'est un mirage : `tsconfig.json` à la racine
n'est qu'une **solution de références** (`"files": []`, `"references": [...]`
vers `tsconfig.app.json` et `tsconfig.node.json`). Un `tsc --noEmit -p` dessus
ne compile RIEN par lui-même — il ne suit pas les références en mode
`--noEmit` simple. C'est ce mirage qui a laissé vivre 54 erreurs `tsc` dans
le dépôt sans qu'aucune vérification locale ne les voie.

La vraie commande, celle que la CI exécute, est :

```bash
npm run typecheck    # tsc -b — suit les references, type-checke reellement
```

Vérifié pendant cette passe : la fausse commande rend `exit 0` en silence ;
`npm run typecheck` rend une liste d'erreurs réelles (54 mesurées au moment
de l'audit — un autre chantier en cours les corrige dans `src/**`).

**Piège 2 — le pool `vitest` par défaut (`forks`) peut perdre des fichiers
en silence.** Pendant la vérification de ce brief, une exécution de
`npx vitest run` (pool par défaut) a vu un worker crasher, perdant 6 fichiers
de test — et a quand même rendu `exit 0`. Une exécution suivante, identique,
n'a rien perdu. C'est intermittent, donc dangereux : un run de CI vert ne
garantit rien. Le script `test` du `package.json` est câblé sur
`vitest run --pool=threads`, qui s'est montré stable sur les runs répétés
pendant cette vérification (52 fichiers, 544 tests, deux fois de suite). Ne
pas repasser au pool par défaut sans re-mesurer.

## 6. Les bancs du runtime — ce que `vite build` ne couvre pas

`_runtime/` porte des invariants (kernel causal, routage de harnais,
matrice RBAC) vérifiés par leurs propres bancs de tests, hors de `vitest`.
Sans les scripts npm ci-dessous, un contributeur ne peut pas savoir qu'ils
existent :

```bash
npm run bench:kernel     # node _runtime/kernel.mjs --autotest        (27 tests)
npm run bench:bridge     # node _runtime/bridge/bridge.mjs --autotest (20 tests)
npm run bench:adapters   # node _runtime/bridge/adapters.mjs --autotest (39 tests)
npm run bench:rbac       # node _runtime/bridge/rbac-test.mjs         (16 tests)
npm run bench            # les quatre, dans cet ordre
```

Comptes vérifiés pendant cette passe : 27 / 20 / 39 / 16 réussites, 0 échec.

## 7. Santé du noyau runtime

```bash
node _runtime/kernel.mjs --sante
```

Rend l'âge du dernier battement de coeur, l'âge du dernier traitement, et un
diagnostic DORMANT / MORT. `DORMANT` est légitime tant qu'aucune boucle
`--watch` n'a été démarrée — voir `_runtime/GATES.md` (G13) pour la preuve du
comportement DORMANT ↔ MORT.

## 8. Construire pour la production

```bash
npm run build
```

Important : `vite build` **ne type-checke pas**. C'est voulu — c'est
`npm run typecheck` qui a cette responsabilité, en amont, dans `verify` et
dans la CI. Un `build` vert après un `typecheck` rouge n'est pas une preuve
de qualité, seulement une preuve que le bundler a réussi à produire des
fichiers.

## Ce que la CI (`.github/workflows/ci.yml`) exécute, dans l'ordre

1. `npm ci`
2. `npm run typecheck`
3. `npm run typecheck:api`
4. `npm test` (= `vitest run --pool=threads`)
5. `npm run build`
6. `npm run bench:kernel`, `bench:bridge`, `bench:adapters`, `bench:rbac`

Chaque étape échoue bruyamment ; aucune n'a de flag qui masque un échec pour
faire passer le vert.
