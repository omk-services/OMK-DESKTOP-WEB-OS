# Audit — RBAC, RLS et isolation multi-tenant

**Couverture : 26 fichiers lus, 20 tests exécutés (16 du banc existant `rbac-test.mjs` + 4 scénarios d'attaque écrits dans `%TEMP%\rbac_audit_attack.mjs`).**

## Verdict global

L'isolation qui protège réellement la production (`identity.ts` + `permissions.ts`,
consommés par `mcp.ts`/`rest.ts`/`cli.ts`) ne connaît ni workspace, ni sandbox, ni
client, ni `affectations` : c'est une matrice à deux axes (rôle × catégorie
d'outil), point. Le modèle décrit dans `rbac.ts` — perimètres, sandbox, promotion,
politiques RLS générées — **n'est appelé par aucun adaptateur de production**. Ce
n'est pas un trou dans le modèle de sécurité annoncé ; c'est un modèle de sécurité
annoncé qui n'existe pas encore dans le chemin d'exécution. La vraie isolation
tenant, elle, vit ailleurs : dans les migrations Supabase réelles
(`supabase/migrations/*.sql`), sur une frontière `org_id`/`memberships` qui ne
porte aucune notion de workspace/sandbox/client.

## Fuites trouvées

| # | Fuite | Fichier:ligne | Scénario d'exploitation | Gravité |
|---|---|---|---|---|
| 1 | Le modèle perimètre (`peut()`, `politiquesRLS()`, `sqlRLS()`, `peutPromouvoir()`) n'est appelé par **aucun** adaptateur de production. Seul `rbac-test.mjs` (banc) et `index.ts` (ré-export) y touchent. | `src/lib/tooling/rbac.ts` (tout le fichier) ; confirmé par `grep -r "from '../rbac'"` → 3 hits seulement (`index.ts`, `rbac-test.mjs`, lui-même) | N'importe quel appel MCP/REST/CLI passe par `assertPermission()` (`permissions.ts:100`), qui ne reçoit **jamais** de `Perimetre` ni d'`Affectation`. Un `member` qui a le droit d'`ecriture` sur son tenant peut écrire dans **n'importe quel** enregistrement de ce tenant — la distinction workspace/sandbox n'est vérifiée par aucun code appelé. | **Critique** |
| 2 | Le rôle `'client'` défini dans `RoleEtendu` (`rbac.ts:26`) n'existe ni dans `identity.ts:70` (`ROLES = ['owner','admin','member','guest']`) ni dans `MembershipRole` (`src/lib/tenant/contract.ts:323`). `resolveIdentity()` rejette toute valeur hors whitelist (`identity.ts:135-141`). | `src/lib/tooling/identity.ts:70`, `src/lib/tenant/contract.ts:323` | Un rôle `client` ne peut **jamais** être résolu par la vraie chaîne d'identité — donc le persona "Client" annoncé dans le brief (workspaces + sandbox pour clients) n'est protégé par rien parce qu'il n'est câblé nulle part. Ce n'est pas une fuite active aujourd'hui (le rôle est simplement inatteignable), mais c'est une fausse promesse de sécurité : le modèle qu'on pense avoir vérifié ne gouverne aucun appel réel. | **Élevée** (confiance trompeuse) |
| 3 | `peut()` ne lit jamais le champ `Perimetre.parent`. | `src/lib/tooling/rbac.ts:44-54` (déclaration du champ), `101-126` (`peut()`, aucune lecture de `.parent`) | Démontré par le banc d'attaque (scénario 1) : un `Perimetre` de type `sandbox` dont `parent` pointe vers un workspace qui n'est PAS celui de l'affectation (`ws-AUTRE-CLIENT-XYZ`) est **accepté sans réserve** dès lors que `per.id` correspond à une ligne dans `affectations`. La seule protection contre un sandbox mal rattaché est l'exactitude de la table `affectations` elle-même — aucune vérification structurelle ne recoupe `parent`. Une ligne d'affectation mal posée (copier-coller d'ID, ID réutilisé après suppression d'un sandbox) donne accès à un sandbox d'un autre client sans qu'aucun code ne le remarque. | **Élevée** (si jamais câblé) |
| 4 | `sqlRLS()` interpole le nom de table directement dans le SQL, sans quoting d'identifiant (`format('%I', …)`), contrairement aux migrations réelles du dépôt. | `src/lib/tooling/rbac.ts:144-189` (`politiquesRLS`, `sqlRLS`) vs. `supabase/migrations/20260811000003_rls.sql:39` (`format('%I', t)`) | Démontré par le banc d'attaque (scénario 4) : `sqlRLS(['items; drop table memberships; --'])` produit du SQL avec l'injection intacte. Aujourd'hui `sqlRLS()` n'est appelée par aucun script de migration réel (constat de la fuite #1), donc l'exploitation demande d'abord que quelqu'un relie cette fonction à une source de noms de table non maîtrisée — mais le générateur lui-même n'a aucune défense si ça arrive. | **Moyenne** (latente, sans chemin d'appel actuel) |
| 5 | `mcp.ts::ListToolsRequestSchema` projette `list()` (le registre complet, y compris les outils `ecriture`) à **tout** appelant, avant toute résolution d'identité. | `src/lib/tooling/adapters/mcp.ts:49-64` | Un client MCP qui ne fournit aucune identité obtient quand même la liste complète des outils (noms, descriptions, schémas d'entrée). Ce n'est pas une fuite de données tenant (les outils ne portent pas de payload), mais c'est une divergence avec la doctrine « REFUS PAR DEFAUT » du fichier `rbac.ts` — le catalogue entier (y compris les capacités d'écriture) est un renseignement gratuit sur la surface d'attaque, offert avant login. | **Faible** (fuite de métadonnées, pas de données) |

## Les surfaces qui contournent la matrice

| Adaptateur | Appelle `list()` ? | Filtre par rôle ? | Filtre par tenant ? | Verdict |
|---|---|---|---|---|
| `mcp.ts` (`ListToolsRequestSchema`) | Oui, brut | Non | Non | Liste complète exposée sans identité (finding #5). L'**exécution** (`CallToolRequestSchema`) est correctement gardée par `resolveIdentityWithMembership` + `assertPermission` — la fuite est limitée aux métadonnées. |
| `rest.ts` (`toolsIndexHandler` / `manifestTools`) | Oui, brut | Non | Non | Même chose côté REST : `GET /api/v1/tools` est public, mais `toolHandler()` (l'exécution POST) applique bien `ctxFromHeaders` + `assertPermission`. |
| `cli.ts` (`tools list`) | Oui, brut | Non | N/A (process local) | Sans conséquence : CLI local, pas une surface réseau tierce. |
| `webmcp.ts` | Oui, filtré par **catégorie seulement** (`CATEGORIES_SURES = {lecture, navigation}` par défaut, `ecriture` opt-in) | Non | Non | Filtre correct sur l'axe catégorie (une page web hostile ne voit pas les outils d'écriture par défaut), mais **aucun** filtre par rôle ou tenant. Pas d'exécution câblée ici (juste projection de métadonnées). |
| `acp.ts` | Oui, brut (`buildAcpTools`) | Non | Non | `handleAcp()` n'implémente que `initialize`, `tools/list`, `session/new` — **pas de `tools/call`** : aucune voie d'exécution existe encore dans ce fichier, donc pas de bypass actif, mais le jour où `tools/call` sera ajouté sans reprendre le garde MCP, ce sera un trou identique à celui que `mcp.ts` a fermé. |
| `a2a.ts` | Oui, brut (`buildCarteAgent`) | Non | Non | Idem : `recevoirTache()` ne fait qu'accuser réception d'une tâche pair, aucune exécution d'outil. Descriptif seulement. |
| `agp.ts` | Oui, brut, mais **filtré ensuite** par `buildPasserelle()` via `RegleAcces` avec `REGLE_VIDE` (`motif: '$^'`) comme défaut — refus explicite si aucune règle n'est fournie. | Oui (via `categories` dans la règle) | Oui (via `origines` dans la règle) | Le seul adaptateur parmi les huit lus qui applique un filtre explicite catégorie + origine avant projection, avec un défaut fermé documenté (« refus par défaut »). Bon exemple, à répliquer ailleurs. |
| `oap.ts` | Oui, brut (`buildOAP`) | Non | Non | Descriptif seulement (vocabulaire pivot inter-framework), pas d'exécution. |
| `fcp.ts` | Oui, brut (`buildFCP`, `resoudreAppel`) | Non | Non | Descriptif + résolution de nom ; pas d'exécution câblée dans ce fichier. |
| `tap.ts` | Oui, brut (`buildTAP`) | Non | Non | Descriptif (métadonnées d'idempotence/coût) uniquement. |
| `rdf-agent.ts` | Oui, brut (`tripletsOutils`) | Non | Non | Projection en triplets RDF, lecture seule sur le registre, pas d'exécution. |
| `a2p.ts` | N'appelle pas `list()` | N/A | N/A | Hors sujet outillage — gère des intentions de paiement, `executable_par_agent` figé à `false` par construction. Bon exemple de veto structurel. |
| `skill.ts` | Oui, brut (`buildAllSkills`) | Non | Non | Génération de fichiers statiques `SKILL.md`, aucune identité en jeu (commentaire du fichier l'assume explicitement). |
| `in-app.ts` | N'appelle pas `list()` directement | Dépend du binding client | Dépend du binding client | Table de bindings vide par défaut ; la garde est reportée aux appelants (non auditée ici, hors périmètre de lecture). |

**Point le plus grave mesuré : aucun des huit adaptateurs de projection
(`webmcp`, `acp`, `a2a`, `oap`, `fcp`, `tap`, `rdf-agent`, `skill`) ne filtre par
rôle ni par tenant — mais à la date de cet audit, aucun d'eux n'expose non plus de
voie d'exécution (`tools/call` ou équivalent) qui contournerait
`resolveIdentityWithMembership`/`assertPermission`. Le risque est structurel et
latent : le jour où l'un de ces adaptateurs gagnera un chemin d'exécution (par
exemple `acp.ts` ajoutant `tools/call`), le réflexe naturel sera de réutiliser
`buildAcpTools()`/`list()` tel quel — et d'hériter du même défaut que celui déjà
fermé dans `mcp.ts` pour la liste, mais jamais fermé pour l'exécution parce
qu'il n'existe pas encore de code à fermer.**

## Le SQL RLS, politique par politique (`rbac.ts::politiquesRLS`)

Rappel : ce SQL n'est généré par aucun script de migration réel du dépôt — il vit
uniquement dans `rbac.ts` et son banc de test. Analyse de ce qu'il ferait s'il
était appliqué tel quel :

- **SELECT** (`${tenant} and ${affecte}`) : correct dans sa forme — exige tenant
  ET une ligne `affectations` correspondante. Mais ne vérifie jamais `parent`
  (finding #3), et suppose que la table cible porte des colonnes `tenant` et
  `perimetre` — aucune garde ne vérifie que ces colonnes existent avant de générer
  la policy (`sqlRLS()` ne fait aucune introspection de schéma).
- **INSERT** (`with check`, rôle ∈ {owner, admin, member}) : la clause `with check`
  est correctement choisie (`rbac.ts:183`, `p.commande === 'INSERT' ? 'with check' : 'using'`)
  — c'est la bonne clause pour INSERT en Postgres RLS. Pas de défaut trouvé ici,
  au contraire de la crainte du brief.
- **UPDATE** : utilise `using` seul (`politiquesRLS` ne génère pas de `with check`
  séparé pour UPDATE dans `rbac.ts:163`, contrairement à
  `2026-08-15_workspace_branches.sql` qui, lui, n'a même pas de policy UPDATE du
  tout côté RLS réelle). En Postgres, une policy UPDATE sans `with check` retombe
  sur la clause `using` pour les deux phases (lecture des lignes ciblées ET
  validation post-update) — ce n'est pas une faille per se, mais ça laisse un
  `member` déplacer une ligne HORS de son périmètre d'origine si le nouveau
  `perimetre`/`tenant` écrit ne re-matche plus `using` seulement après coup (le
  moteur revérifie `using`, donc c'est en fait sûr — à condition que
  `${table}.tenant`/`${table}.perimetre` soient les colonnes réellement modifiées
  et non contournables). Pas de trou confirmé, mais l'absence de `with check`
  explicite le rend moins lisible en revue qu'un `INSERT`.
- **DELETE** : restreint à {owner, admin} (`rbac.ts:166-172`), cohérent avec le
  commentaire (« un employé qui se trompe doit pouvoir corriger, pas effacer »).
  Pas de défaut trouvé.
- **Injection d'identifiant** : confirmée en scénario 4 du banc d'attaque — `table`
  est concaténé brut, sans `format('%I', …)`. Contraste net avec
  `supabase/migrations/20260811000003_rls.sql:39` qui, lui, utilise correctement
  `format('%I', t)`. Le vrai code de migration est plus prudent que le générateur
  `rbac.ts`.

## La duplication de matrice

`rbac.ts:70-80` (TypeScript) et `_runtime/bridge/rbac-test.mjs:3-9` (JavaScript)
portent la même `MATRICE`, comparée ligne à ligne : **aucune divergence
constatée aujourd'hui** (les 5 rôles × 2 périmètres × listes de catégories sont
identiques caractère pour caractère). Le risque n'est pas dans l'état actuel mais
dans le mécanisme : rien ne lie ces deux fichiers. Un changement dans
`rbac.ts:70-80` (ex. retirer `'ecriture'` du sandbox `member`) ne casse aucun
test tant que `rbac-test.mjs` n'est pas édité en miroir — le banc continuerait de
valider une matrice obsolète en silence, avec un exit code 0 trompeur. Il
n'existe aucun test qui importe réellement `rbac.ts` compilé et compare sa
`MATRICE` exportée à celle du banc JS ; les deux sont recopiées à la main.

## Ce qui tient

- **`resolveIdentityWithMembership` refuse par défaut en production sans lookup
  branché** (`identity.ts:271-277`) — un appelant ne peut pas s'auto-déclarer un
  rôle. Vérifié par lecture directe du code et par la présence du test
  `identity.test.ts` (non lu en détail ici, hors périmètre d'écriture, mais visible
  dans le repo).
- **Le rôle effectif vient toujours de la membership, jamais de l'input**
  (`identity.ts:299-304`) : `roleSource: 'membership'` prime sur la déclaration
  cliente. C'est la garde qui ferme W03 pour les surfaces qui l'utilisent (mcp,
  rest, cli — vérifié par lecture de `mcp.ts:104-117`, `rest.ts:54-58`,
  `cli.ts:147-151`, qui appellent tous les trois `resolveIdentityWithMembership`).
- **Anti-auto-approbation** (`permissions.ts:114-133`) : un acteur ne peut pas
  approuver sa propre proposition sauf s'il est `owner`, et la lecture de la
  proposition se fait sous le tenant de l'appelant — un id d'un autre tenant rend
  `null`, donc aucune fuite d'information cross-tenant sur ce chemin précis.
- **`a2p.ts`** : veto structurel correct — `executable_par_agent` est un littéral
  `false` typé, pas une variable qu'un appelant pourrait faire basculer ; aucune
  fonction `executer()` n'existe dans le fichier.
- **`agp.ts`** : seul adaptateur de projection à appliquer un filtre catégorie +
  origine avant d'exposer quoi que ce soit, avec un défaut `REGLE_VIDE` qui
  n'autorise rien (`motif: '$^'`, une regex qui ne matche jamais).
- **Le SQL RLS réel appliqué** (`supabase/migrations/*.sql`) est distinct du
  modèle `rbac.ts` et, sur les tables où il existe, quote correctement les
  identifiants (`format('%I', t)`) et journalise l'absence de policy INSERT/UPDATE/
  DELETE sur `workspace_branches`/`workspace_prs`/etc. comme un choix documenté
  (écriture réservée au rôle service / couche applicative), pas un oubli — cf.
  commentaire `2026-08-15_workspace_branches.sql:116-117`.
- **16/16 tests du banc `rbac-test.mjs` passent** tels quels contre la `MATRICE`
  actuelle (ré-exécuté pendant cet audit, sortie confirmée : « 16 reussites, 0
  echecs »).

## Questions ouvertes

1. **`rbac.ts` est-il un design en attente de câblage, ou du code mort qu'on a
   oublié de retirer ?** Si l'intention est de vraiment livrer des workspaces et
   des sandbox par tenant, il manque : (a) le branchement de `peut()` dans
   `assertPermission()` ou en amont, (b) l'ajout de `'client'` à `ROLES`
   (`identity.ts`) et `MembershipRole` (`tenant/contract.ts`), (c) une vraie table
   `affectations` (ou le renommage vers le modèle `memberships` existant) avec ses
   propres policies RLS, (d) la vérification du champ `parent` dans `peut()`.
2. **La table `affectations` existe-t-elle en base ?** Aucune migration du dépôt
   ne la crée (recherché : `grep -r affectations supabase/migrations` → aucun
   résultat). Si elle n'existe pas, `sqlRLS()` génère des policies qui référencent
   une table absente — inapplicable telle quelle, ce qui explique peut-être
   pourquoi rien ne l'appelle encore.
3. **Faut-il une passe qui compile `rbac.ts` et importe sa `MATRICE` dans
   `rbac-test.mjs`** (au lieu de la recopier à la main), pour que la duplication
   actuellement inoffensive ne devienne pas un bug silencieux au prochain
   changement de matrice ?
4. **`webmcp.ts`, `acp.ts`, `a2a.ts`, `oap.ts`, `fcp.ts`, `tap.ts`, `rdf-agent.ts`
   doivent-ils recevoir le même traitement que `agp.ts`** (filtre catégorie +
   origine avant projection) avant que l'un d'eux ne gagne un chemin
   d'exécution réel ? Le risque est nul aujourd'hui (pas de `tools/call`
   implémenté sur ces surfaces) mais deviendrait critique dès l'ajout d'une
   exécution qui ne réutiliserait pas le garde de `mcp.ts`.
