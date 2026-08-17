# CORRECTIF 8 — un état persisté périmé casse l'app (la cause de « Legal »)

## Périmètre EXCLUSIF en écriture

```
src/stores/appVisibility.store.ts
src/stores/canvasFx.store.ts
src/stores/desktopLayout.store.ts
src/stores/threeApp.store.ts
src/stores/dock.store.ts
src/stores/shell.store.ts
src/stores/tenant.store.ts
src/lib/themes/store.ts
src/lib/saas-builder/ledger.store.ts
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_8.md`.

Rien d'autre. **Ne touche pas** à `src/lib/auth/` (storage-scope vient d'être
écrit et fonctionne), ni à `src/lib/cms/`, `src/apps/`, `api/`, `package.json`
— d'autres agents y travaillent.

## Le défaut, et comment il a été trouvé

L'utilisateur voit « This app hit a snag » sur **Legal › Conformité**, en
production, en mode démo.

Un diagnostic automatisé a ouvert la même app sur la même URL, parcouru ses
**13 sections dont Conformité**, et n'a trouvé **aucune section cassée**.

La seule différence : le diagnostic **purge `localStorage` avant de commencer**.
Le navigateur de l'utilisateur porte l'état accumulé de dizaines de sessions,
écrit par des versions successives de l'app.

Mesure qui confirme : sur les **11 stores** qui appellent `persist()`, **4
seulement déclarent une `version`**, **2 une `migrate`**, **3 un `merge`
défensif**.

Les autres réinjectent la charge persistée telle quelle. Si la forme a changé
entre deux versions — un champ renommé, un tableau devenu objet — le code lit
une structure qu'il n'attend pas, et jette.

**Ce n'est donc pas un défaut de Legal.** Legal est la première section où
l'état périmé rencontre un code qui ne le tolère pas. D'autres suivront.

## Ce qu'on attend

### 1. Une version sur chaque store persisté

Chaque `persist()` de ton périmètre reçoit un `version: 1` (ou l'incrément
suivant s'il en a déjà un).

### 2. Un `migrate` qui jette ce qu'il ne comprend pas

Pour chacun, un `migrate(persisted, versionPersistee)` qui :

- si `versionPersistee` est inférieure à la version courante → **rend l'état
  par défaut**, sans tenter de rattraper les champs ;
- si la charge n'a pas la forme attendue → **rend l'état par défaut**.

Perdre une préférence de fond d'écran est sans gravité. Casser l'app ne l'est
pas. **Le défaut est toujours préférable à l'échec**, et c'est le seul arbitrage
qui compte ici.

### 3. Un `merge` défensif

`merge(persisted, courant)` doit valider **champ par champ** avant d'accepter.
Un champ absent ou du mauvais type reprend sa valeur par défaut, il n'écrase pas.

Trois stores le font déjà — `assistant.store.ts`, `scenarios.store.ts`,
`src/lib/ontology/scope-store.ts`. **Lis-les et reprends leur forme** plutôt que
d'en inventer une quatrième. `scope-store.ts` porte même un test
`(d+) merge defensive` qui montre exactement ce qu'on attend.

### 4. Un helper partagé, pas neuf copies

Neuf `migrate` recopiés à la main divergeront. Écris **un** helper — par exemple
`migrationDefensive(defaut, valider)` — et fais-le utiliser par les neuf.

Place-le dans un fichier de ton périmètre.

### 5. Ne casse pas le cloisonnement par compte

`src/lib/auth/storage-scope.ts` vient d'être posé : les clés sont préfixées par
utilisateur et tenant, via un `Storage` enveloppé. **Tu ne dois pas le défaire.**
Ton `migrate` s'ajoute à ce mécanisme, il ne le remplace pas. Lis
`storage-scope.ts` avant d'écrire une ligne.

## Le test qui verrouille

Pour chaque store touché, au minimum :

1. une charge persistée de version antérieure → le store démarre **sur son
   défaut**, sans jeter ;
2. une charge corrompue (`{ toto: 1 }`, `null`, un tableau là où un objet est
   attendu) → le store démarre **sur son défaut**, sans jeter ;
3. une charge valide de la version courante → elle est **respectée**.

Le cas 2 est le plus important : c'est celui qui reproduit l'écran de
l'utilisateur.

Lance **uniquement** tes propres tests, avec `--maxWorkers=1`.

## Ce que tu ne fais pas

Tu ne purges pas `localStorage` au démarrage. Ce serait effacer les préférences
de tout le monde à chaque déploiement. La migration défensive suffit, et elle
est ciblée.

## Rappel

Périmètre exclusif. Aucun compteur global. Rapport partiel obligatoire.
