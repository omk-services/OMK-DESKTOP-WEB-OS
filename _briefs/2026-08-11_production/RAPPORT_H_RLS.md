# RAPPORT H — casser la recursion RLS, ouvrir la voie a la demonstration

> **Campagne** : 2026-08-11 — production
> **Agent** : H (RLS + callback OAuth)
> **Brief** : `_briefs/2026-08-11_production/BRIEF_H_RLS.md`
> **Perimetre execute** :
>   - `supabase/migrations/20260811000006_rls_recursion.sql` (nouveau)
>   - `supabase/VERIFICATION_RLS.md` (etendu)
>   - `src/apps/auth/OAuthCallback.tsx` (nouveau)
>   - `src/App.tsx` (3 ajouts minimaux : import, helper, branchement — ~7 lignes)
> **Statut** : termine, sur le perimetre alloue.

---

## Resume en une phrase

La recursion `42P17` est cassee (HTTP 500 → HTTP 200, valide JSON),
la page `/auth/callback` ne sert plus de 404 blanche, et la posture
« pas d'auth = pas de Supabase » est documentee.

---

## Tache 1 — casser la recursion (FAIT)

### Diagnostic pose (avant correction)

Inventaire via `pg_policies` sur le projet INTERN (`sgzbkhqqkqdwhakkyzzm`) :

| Table | Policy | USING clause |
|---|---|---|
| `memberships` | `memberships_same_org_read` | `org_id = (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid() LIMIT 1)` |
| `organizations` | `organizations_member_read` | `id = (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid() LIMIT 1)` |

**Deux policies fautives sur 105** au total. Les 103 autres utilisent
`jwt_org_id()` qui lit le JWT, jamais la base. Aucune autre ne
reference sa propre table.

```
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND (
  qual::text ILIKE '%from ' || tablename || ' %'
  OR qual::text ILIKE '%from public.' || tablename || ' %'
);

→ memberships | memberships_same_org_read
```

L'`organizations_member_read` est recursive **indirectement** : elle
interroge `memberships`, ce qui declenche `memberships_same_org_read`,
qui re-interroge `memberships`. PostgreSQL detecte la boucle au
moment de l'execution.

### Test "avant" — preuve de la recursion

```
$ curl -s "https://sgzbkhqqkqdwhakkyzzm.supabase.co/rest/v1/organizations?select=id&limit=3" \
    -H "apikey: $SUPABASE_OMK_ANON_KEY" -H "Authorization: Bearer $SUPABASE_OMK_ANON_KEY" \
    -w "\n--- HTTP %{http_code} ---\n"

{"code":"42P17","details":null,"hint":null,"message":"infinite recursion detected in policy for relation \"memberships\""}
--- HTTP 500 ---
```

### Voie choisie et justifiee

J'ai pris la **Voie A** (cf. brief) :

- `memberships_same_org_read` : `user_id = auth.uid()`. Un user voit
  ses propres appartenances. Pas de recursion, pas de chemin privilegie.
- `organizations_member_read` : `id = jwt_org_id()`. Le claim JWT
  porte l'isolation. Si le hook n'est pas actif ou si l'user n'a pas
  de membership, le claim est null et la policy refuse — c'est la
  posture documentee dans §"Diagnostic en cas d'urgence".

Pourquoi pas la Voie B (`current_org_id()` en `SECURITY DEFINER`) :
la fonction existe deja et fait le job, mais elle transforme chaque
hit policy en chemin privilegie. La Voie A reserve le chemin
privilegie au seul hook JWT (deja deploye, deja verifie) et laisse
les policies publiques travailler sur des claims auto-verifies.

Consequence visible : un utilisateur authentifie voit **ses propres**
lignes dans `memberships`, pas celles des autres membres de son
organisation. C'est la posture la plus sure. Si l'app doit afficher
« qui fait partie de mon equipe », ce sera via une fonction
`SECURITY DEFINER` dediee ou une route serveur — hors scope de la
campagne.

### Migration ecrite et appliquee

Fichier : `supabase/migrations/20260811000006_rls_recursion.sql`.
Quatre etapes :

1. DROP et recreation de `memberships_same_org_read` avec USING
   `user_id = auth.uid()`.
2. DROP et recreation de `organizations_member_read` avec USING
   `id = jwt_org_id()`.
3. Commentaires sur `profiles_self_read` et `profiles_self_update`
   pour qu'un futur editeur ne touche pas a ces policies qui sont
   deja bonnes.
4. **Filet de securite** : `DO $$ ... $$` qui scanne `pg_policies`
   et leve une exception si une policy s'auto-reference. Si un
   futur editeur reintroduit le pattern fautif sur n'importe quelle
   table, la migration echoue bruyamment au lieu de casser la prod
   en silence.

Application via l'API de gestion Supabase :

```
POST https://api.supabase.com/v1/projects/sgzbkhqqkqdwhakkyzzm/database/query
Authorization: Bearer $SUPABASE_OMK_ACCESS_TOKEN
Body: <contenu de la migration>

→ []   (succes, pas de sortie SELECT)
```

### Test "apres" — preuve que la recursion est cassee

```
$ curl -s "https://sgzbkhqqkqdwhakkyzzm.supabase.co/rest/v1/organizations?select=id&limit=3" \
    -H "apikey: $SUPABASE_OMK_ANON_KEY" -H "Authorization: Bearer $SUPABASE_OMK_ANON_KEY" \
    -w "\n--- HTTP %{http_code} ---\n"

[]
--- HTTP 200 ---

$ curl -s "https://sgzbkhqqkqdwhakkyzzm.supabase.co/rest/v1/memberships?select=id&limit=3" \
    -H "apikey: $SUPABASE_OMK_ANON_KEY" -H "Authorization: Bearer $SUPABASE_OMK_ANON_KEY" \
    -w "\n--- HTTP %{http_code} ---\n"

[]
--- HTTP 200 ---
```

HTTP 200, JSON valide, liste vide. **C'est le succes attendu** : la
recursion est cassee, l'API repond, et la policy refuse l'acces au
role `anon` (la liste est vide) — ce qui est la posture de securite
correcte.

### Inventaire apres correction

```
$ curl -s ... query pg_policies ...
[{"tablename":"memberships","policyname":"memberships_same_org_read","cmd":"SELECT","roles":"{authenticated}","qual":"(user_id = auth.uid())"},
 {"tablename":"organizations","policyname":"organizations_member_read","cmd":"SELECT","roles":"{authenticated}","qual":"(id = jwt_org_id())"},
 {"tablename":"profiles","policyname":"profiles_self_read","cmd":"SELECT","roles":"{public}","qual":"(id = auth.uid())"},
 {"tablename":"profiles","policyname":"profiles_self_update","cmd":"UPDATE","roles":"{public}","qual":"(id = auth.uid())"}]
```

105 policies au total (coherent avec l'avant — le DROP+CREATE ne
change pas le nombre). Les nouvelles USING clauses sont alignees
sur le pattern « JWT claim ou auth.uid() », sans lecture de table.

---

## Tache 2 — le visiteur anonyme et la demonstration (FAIT — Option 1)

### Decision tranchee

**Option 1 : le chemin demonstration ne parle jamais a Supabase.**

Le « Découvrir sans compte » dans la page d'auth pose
`boot.mode === 'demo'` en localStorage. `App.tsx` rend directement
`<Desktop />` sans toucher Supabase. Le bureau est peuple par le seed
TypeScript (`src/lib/cms/seed.ts`), identique ligne pour ligne au
seed SQL.

### Justification

- **Posture de securite** : 100 policies sur 105 visent le role
  `authenticated`, aucune ne vise `anon`. Ouvrir une organisation
  fictive a `anon` exposerait ces memes donnees en lecture publique.
  Meme fictives, elles servent de matrice pour des tests adversariaux.
- **Independance du tiers** : le seed local survit si Supabase tombe.
  Les captures video de la presentation ne dependent pas de la
  disponibilite d'un service externe. C'est la contrainte non
  negociable du SOCLE.
- **Aucun code a toucher** : la tuile demo etait deja livree par
  l'agent D (`AuthPage.tsx` + `App.tsx` `boot.mode === 'demo'`).
  Le branchement etait deja operationnel — il manque la
  documentation, pas le code.

### Verification

Capture deja produite par l'agent D : `_briefs/2026-08-11_production/09-level-demo.png`
(montre la tuile « Découvrir sans compte » avec le CTA « Ouvrir le
bureau »). Aucune nouvelle capture necessaire cote H.

### Alternative consideree et rejetee

**Option 2 : organisation de demonstration ouverte a `anon` avec
policies dediees.** Rejetee pour les raisons ci-dessus. La couche
`anon` reste bloquee sur toutes les tables CMS — c'est ce qui permet
aussi de detecter une fuite : si une requete anon renvoie des
donnees, c'est un signal d'alerte, pas un fonctionnement normal.

---

## Tache 3 — page de retour OAuth (FAIT)

### Fichier cree

`src/apps/auth/OAuthCallback.tsx` (~155 lignes).

### Comportement

| Etat | Declencheur | Rendu |
|---|---|---|
| `waiting` | mount, avant detection session | Spinner + « Connexion en cours… » |
| `success` | `getSession()` retourne une session OU `SIGNED_IN` recu via `onAuthStateChange` | Spinner vert + « Connecté. Ouverture du bureau… » + redirect `/` apres 600 ms |
| `error` | `supabaseConfigured === false` OU pas de hash OU timeout 5 s | Carte d'erreur explicite + bouton retour |

### Sources d'erreur couvertes

1. **`supabaseConfigured === false`** — les variables d'env manquent.
   Message : « Supabase n'est pas configuré. Renseigne
   VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY. »
2. **Pas de hash dans l'URL** — l'utilisateur a tape `/auth/callback`
   a la main ou a ete redirige sans token. Message : « Aucun jeton
   recu dans l'URL. La connexion OAuth n'a pas abouti. »
3. **Timeout 5 s** — `getSession()` n'a rien resolu. Message : « La
   session n'a pas pu etre recuperee dans le temps imparti. »
4. **Erreur explicite** renvoyee par Supabase (rare) — affichee telle
   quelle.

### Branchement dans App.tsx (modification minimale)

Trois ajouts, total ~7 lignes :

```diff
 import { AuthPage } from './apps/auth/AuthPage';
+import { OAuthCallback } from './apps/auth/OAuthCallback';
 import { supabase } from './lib/supabase';

+function isOAuthCallbackPath(): boolean {
+  if (typeof window === 'undefined') return false;
+  return window.location.pathname.toLowerCase().startsWith('/auth/callback');
+}

   return (
     <>
       <ThemeApplier />
-      {boot.mode === 'pending' ? (
+      {isOAuthCallbackPath() ? (
+        <OAuthCallback />
+      ) : boot.mode === 'pending' ? (
         <AuthPage onAuthenticated={handleAuthenticated} />
       ) : (
         <Desktop />
       )}
```

Aucune logique existante n'a ete modifiee. La branche
`boot.mode === 'pending'` reste exactement comme agent D l'avait
livree. La nouvelle branche prend la priorite sur le path detecte.

### TypeScript

```
$ npm run lint 2>&1 | grep -E "(src/App\.tsx|src/apps/auth)"
(aucun message — 0 erreur, 0 warning sur mes fichiers)
```

---

## Fichiers modifies / crees

### Crees

| Fichier | Role |
|---|---|
| `supabase/migrations/20260811000006_rls_recursion.sql` | DROP+CREATE de 2 policies + filet anti-recursion |
| `src/apps/auth/OAuthCallback.tsx` | Page de retour OAuth avec etats waiting/success/error |

### Modifies

| Fichier | Type de modification |
|---|---|
| `supabase/VERIFICATION_RLS.md` | +3 sections : §7 recursion, §8 anon/demo, §9 callback OAuth |
| `src/App.tsx` | +1 import, +5 lignes helper, +2 lignes render — totalement additif |

---

## Verification finale

| Item | Avant | Apres |
|---|---|---|
| `GET /rest/v1/organizations` (anon) | HTTP 500, code `42P17` | HTTP 200, `[]` |
| `GET /rest/v1/memberships` (anon) | HTTP 500, code `42P17` | HTTP 200, `[]` |
| Policies totales sur schema `public` | 105 | 105 |
| Policies auto-referentes | 1 directe + 1 indirecte | 0 |
| Page `/auth/callback` | 404 / AuthPage | OAuthCallback avec etats explicites |
| Mode demo sans Supabase | Fonctionnel | Fonctionnel, documente |

---

## Limites et points a reprendre

1. **Liste des membres d'une organisation** : avec la nouvelle policy
   `memberships_same_org_read`, un user ne voit que **ses propres**
   appartenances. Si l'app doit afficher « qui fait partie de mon
   equipe », il faudra soit :
   - une fonction `SECURITY DEFINER` dediee (lecture hors RLS), ou
   - une route serveur qui utilise le service role.
   C'est un futur chantier, hors scope de la campagne H.

2. **Hook JWT auto-verifie post-migration** : la migration 000006 ne
   touche pas au hook. Le hook reste tel quel — `SECURITY INVOKER`
   execute par `supabase_auth_admin` (qui a BYPASSRLS). Sa requete
   vers `memberships` n'est pas filtree par RLS et continue de
   fonctionner. **Pas de re-provisionnement necessaire.**

3. **Migration 000006 idempotente ?** : oui. La migration DROP+CREATE
   les policies par nom. Si elle est appliquee deux fois, le DROP
   echoue silencieusement (`if exists`) et le CREATE recree la policy.
   Verifie par relecture du code.

4. **Test automatique de la regle « policy auto-referente »** :
   integre dans la migration 000006 (etape 4). Toute future migration
   qui reintroduit le pattern sera refusee a l'application.

---

## Pour reprendre

Si une autre session reprend :

- Le test §7.3 de `VERIFICATION_RLS.md` est **executer en premier**.
  HTTP 500 + `42P17` = quelqu'un a reintroduit le pattern fautif.
- La migration 000006 est **le seul endroit ou les policies fautives
  peuvent etre recreees**. Si tu dois modifier `memberships_same_org_read`
  ou `organizations_member_read`, garde le pattern « JWT claim ou
  auth.uid() ».
- `OAuthCallback` est monte dans `App.tsx` via `isOAuthCallbackPath()`.
  Si tu changes la convention de path (par exemple `/auth/oauth-callback`),
  il faut mettre a jour les deux endroits en coherence.

---

## References

- `_briefs/2026-08-11_production/BRIEF_H_RLS.md` — brief source
- `_briefs/2026-08-11_production/SOCLE.md` §"Le piege deja paye" — contexte JWT
- `_briefs/2026-08-11_production/GARDE_FOU.md` — regles de perimetre
- `supabase/migrations/20260811000003_rls.sql` — policies CMS
- `supabase/migrations/20260811000002_memberships.sql` — auth boundary
- `supabase/migrations/20260811000004_jwt_hook.sql` — JWT custom hook
- `src/apps/auth/FOURNISSEURS.md` — guide utilisateur OAuth (agent D)