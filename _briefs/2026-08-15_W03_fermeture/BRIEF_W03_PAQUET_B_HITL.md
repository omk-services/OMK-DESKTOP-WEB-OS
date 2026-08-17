---
id: W03_FERMETURE_PAQUET_B
campagne: 2026-08-15
préconditions: |
  Aucune — c'est le HITL humain. Tu le fais dans la console UI.
artifact_obligatoire: |
  _briefs/2026-08-15_W03_fermeture/RAPPORT_PAQUET_B_HITL.md
---

# W03 — FERMETURE — Paquet B (HITL humain)

> **Ce paquet n'est pas déléguable.** Les trois conditions vivent dans
> la console UI Vercel et Supabase Cloud. M3 n'y a pas accès. Tu les
> fais toi-même, tu coches, tu écris le rapport. Sans ces trois ✅, le
> Paquet A (code) sera correct mais **inopérant** — le JWT ne sera pas
> signé côté Supabase, ou les previews Vercel seront bloquées par
> l'auth Vercel par défaut.

## Pourquoi ce paquet existe

ADR-OMK-004 §Verification liste trois conditions nommées A, B, D — sans
elles, le pivot Vercel + Supabase Cloud est un déploiement qui *semble*
fonctionner mais qui ne sert aucune donnée. Les trois conditions sont
**HITL** : il faut cliquer dans l'UI.

Aujourd'hui, le 2026-08-15, ces conditions sont :
- **Condition B** : `custom_access_token_hook` re-provisionné sur
  Supabase Cloud OMK Org → sans lui, RLS `org_id = (auth.jwt() ->>
  'org_id')::uuid` retourne 0 lignes silencieusement.
- **Condition D** : Vercel Authentication OFF × 4 projets → sinon les
  URLs preview retournent 401 même quand READY.
- **Condition E** : rotation 2 PATs Cloud OMK + ABC → Test Key Pragma.
  Indépendante de W03, mais c'est dans la même campagne de durcissement.

## Les trois vérifications — chacune avec sa commande

### Condition B — Hook JWT Supabase Cloud

**Objectif** : quand un utilisateur se connecte, Supabase ajoute `org_id`
dans le JWT. Le hook lit `memberships` et injecte la claim.

**Ce que tu fais** :
1. Va sur https://supabase.com/dashboard → ton organisation OMK Services
   → projet `omk-saas-os`.
2. **Authentication** → **Hooks** → active
   **Custom Access Token Hook**.
3. Le hook est une fonction Edge Supabase déjà déployée. Vérifie
   qu'elle lit bien `memberships` pour le `user_id` connecté et
   injecte `org_id` dans le payload.
4. Si la fonction n'existe pas dans le projet Cloud (elle existait en
   self-host, archivé), redéploie-la depuis le code :
   `supabase/functions/custom-access-token-hook/index.ts`.
5. **Vérification mécanique** :

```bash
# Tu te connectes via l'app, puis tu inspectes le JWT.
# Méthode : ouvrir DevTools → Network → une requête authentifiée →
# Authorization: Bearer eyJ... → copier le payload (milieu du JWT,
# après le premier point), base64-decode.
#
# Tu DOIS voir "org_id": "<uuid>" dans le payload.
# Si le champ n'apparaît pas, le hook n'injecte rien.
```

Coche **`✅`** uniquement si `org_id` apparaît dans le payload.

> ⚠️ **OAuth Google n'est PAS requis pour W03.** coach-os utilise
> Supabase Auth (email/mot de passe, magic link, ou providers OAuth
> configurés côté Supabase). Si tu te logges via un de ces moyens,
> le JWT est posé dans `Authorization: Bearer …` sur chaque requête
> authentifiée — c'est suffisant pour la vérification DevTools.
>
> Le blocage OAuth Google observé le 2026-08-15 (`redirect_uri_mismatch`)
> est un incident isolé, hors périmètre W03. Ne sauvegarde pas un URI
> avec un `<HASH>` littéral ou un tiret orphelin.

> ⚠️ **Piège n°3 — ENABLED ≠ injection.** Le badge vert « Enabled »
> dans Auth Hooks signifie que le hook **sera appelé**. Il ne dit pas
> ce qu'il retourne. Un hook peut être actif et renvoyer le payload
> intact (sans `org_id`) — c'est exactement le bloquant silencieux
> qu'ADR-OMK-004 Condition B décrit. La preuve par DevTools est la
> seule qui compte.

### Condition D — Deployment Protection OFF × 4 projets

**Objectif** : Vercel active par défaut **Standard Protection** sur les
previews (auth SSO pour les visiteurs). Sans la couper, les URLs
`*.vercel.app` retournent 401 avant même le contenu applicatif.

> ⚠️ **Piège déjà payé — confirmé sur capture 2026-08-15** :
>
> 1. **`Settings → Security` n'est PAS le bon onglet.** C'est OIDC
>    Federation (auth GCP/AWS). Tu ne touches pas.
> 2. **Le bon onglet est `Settings → Deployment Protection`.**
> 3. **Le menu déroulant n'a PAS d'option « No Protection »** sur le
>    plan Hobby. Il propose uniquement `Standard Protection` (par
>    défaut) et `All Deployments` (payant, $150/mois via Advanced
>    Deployment Protection). Le toggle bleu « Require Log In » est un
>    **interrupteur** sur la méthode (Vercel Authentication), pas sur
>    le scope.
> 4. **Sur Hobby, le seul levier gratuit** est le toggle bleu :
>    **couper Vercel Authentication** (toggle OFF). Avec
>    Standard Protection actif et Vercel Authentication OFF,
>    Standard Protection reste en place **mais ne protège rien** car
>    aucune méthode n'est sélectionnée. C'est l'effet recherché pour
>    W03 — la porte applicative reste ouverte, c'est le JWT qui
>    devient la seule porte.

**Ce que tu fais**, pour chaque projet Vercel qui sert coach-os.

> **Décision datée 2026-08-15** : seuls les projets coach-os sont dans
> le périmètre W03. Les autres projets de ton équipe (landing pages
> externes, projets ABC, etc.) sont **hors périmètre**. Tu ne touches
> pas à leurs toggles ici. Une campagne séparée s'en occupera si
> elle doit s'en occuper.

Liste à confirmer dans `https://vercel.com/omk-services` — c'est
**la liste des déploiements coach-os**, pas l'inventaire complet de
l'équipe :
- `omk-saas-os`
- `omk-landing-page`
- `omk-desktop-web-os` (confirmé par capture 2026-08-15)

Pour les projets qui n'apparaissent **pas** dans cette liste, tu ne
fais rien.

Étapes précises :
1. Va sur https://vercel.com → ton équipe → le projet.
2. **Settings** → **Deployment Protection** (PAS Security).
3. Toggle bleu **« Require Log In »** → **OFF** (le toggle vire au
   gris). C'est le seul levier gratuit sur Hobby.
4. **Save** (bouton gris à droite).

**Vérification mécanique** :

```bash
# La racine du projet doit retourner 200, pas un redirect vers /login
# ni 401.
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<projet>-<hash>-<team>.vercel.app/"
# Attendu : 200
```

**Note Hobby — confirmé** : « No Protection » n'apparaît PAS dans le
menu sur le plan Hobby. C'est un upgrade Pro à $150/mois. Sur Hobby,
le seul moyen est de couper la méthode (toggle OFF). C'est suffisant
pour Condition D — l'auth reste appliquée côté `api/v1/` (Paquet A).

Coche **`✅`** pour chaque projet dont la racine retourne **200**.

### Condition E — Rotation 2 PATs Cloud

**Objectif** : `sbp_f2af0f71…` (OMK) et `sbp_4121633e…` (ABC) ont été
exposés dans `.mcp.json` (Test Key Pragma). Rotation recommandée pour
la même campagne de durcissement.

**Ce que tu fais** :
1. Va sur https://supabase.com/dashboard → **Account** → **Access
   Tokens**.
2. Révoque les deux PATs existants.
3. Crée deux nouveaux PATs (User scope, expiration selon ta politique
   — tu m'as dit « non expire pour éviter les hallucinations de
   rotation » ; c'est OK).
4. Mets à jour `.mcp.json` côté Windows (env var ou valeur directe,
   selon ta config).
5. Vérifie que les MCP `mcp__supabase-omk__*` et `mcp__supabase-abc__*`
   répondent après le redémarrage.

```bash
# Verification mecanique : les MCP Supabase repondent apres le
# redemarrage du gateway.
grep -E "supabase-(omk|abc)" "$HOME/.mcp.json"  # ne pas echo la valeur
```

Coche **`✅`** une fois les deux PATs tournés et `.mcp.json` à jour.

## Le rapport Paquet B

`_briefs/2026-08-15_W03_fermeture/RAPPORT_PAQUET_B_HITL.md`. Pas plus
d'une page. Pour chaque condition :

```
### Condition B — Hook JWT Supabase Cloud
Statut : ✅ / ❌
Date : 2026-08-15
Preuve : <commande curl ou extrait DevTools, une ligne>
Note : <si KO, ce qui manque>
```

## Pourquoi cette check-list ne se délègue pas

Les MCP Supabase et Vercel dans `mcp_sources.json` couvrent une partie
des actions (lecture des projets, list des fonctions Edge). **Mais** :
- **Activer un hook dans l'UI** est un POST manuel que Vercel ne
  propose pas en API stable.
- **Désactiver Vercel Authentication** n'est pas dans les MCP Vercel
  que tu as (lis `mcp_sources.json` si tu doutes).
- **Révoquer et recréer des PATs** n'est pas une opération scriptée
  par défaut — Supabase le permet via API, mais c'est un secret, et un
  secret révoqué à distance reste un secret.

Si tu décides quand même de scripter la rotation des PATs (Condition E),
c'est un autre brief — **pas celui-ci**.

## Quand lancer le Paquet A

Une fois que les trois conditions sont ✅ dans
`RAPPORT_PAQUET_B_HITL.md`. Pas avant. Si l'une des trois est ❌, le
code que M3 produira sera correct mais inopérant — et tu auras payé
deux fois le même travail.

## Lien vers le Paquet A

`_briefs/2026-08-15_W03_fermeture/BRIEF_W03_PAQUET_A_CODE.md`.
