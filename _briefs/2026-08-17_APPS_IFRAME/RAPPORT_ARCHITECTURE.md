---
type: Architecture
title: Architecture des apps embarquées — multi-tenant, partage, mises à jour
description: Document de conception couvrant Q1 (où vivent les apps) à Q5 (mises à jour), avec constats mesurés et recommandations tranchées.
generated: { by: claude, at: 2026-08-17T17:30:00Z }
verified: []
sources:
  - id: fa-its-2026-08-17
    resource: file
    title: _briefs/2026-08-17_APPS_IFRAME/FAITS.md
    last_modified: 2026-08-17
  - id: stores-2026-08-17
    resource: file
    title: src/stores/threeApp.store.ts (174 l.), src/lib/saas-builder/ledger.store.ts (184 l.)
    last_modified: 2026-08-17
  - id: appspec-2026-08-17
    resource: file
    title: src/lib/saas-builder/appSpec.schema.ts (112 l.)
    last_modified: 2026-08-17
  - id: three-program-2026-08-17
    resource: file
    title: src/apps/three-program/ThreeProgramApp.tsx (122 l.)
    last_modified: 2026-08-17
  - id: saas-builder-2026-08-17
    resource: file
    title: src/apps/saas-builder/SaaSBuilderApp.tsx (440 l.), src/lib/tooling/catalog/saasBuilder.ts (170 l.)
    last_modified: 2026-08-17
  - id: cust-policies-2026-08-17
    resource: file
    title: supabase/migrations/2026-08-17_customers_organizations_profiles.sql, 2026-08-17_customers_policies.sql, 2026-08-17_customers_workspace_audit_policies.sql
    last_modified: 2026-08-17
  - id: canon-rls-uuid-2026-08-17
    resource: file
    title: supabase/migrations/2026-08-17_canon_rls_uuid.sql, 2026-08-17_memberships_alignement_contrat.sql
    last_modified: 2026-08-17
  - id: notion-oauth
    resource: url
    title: Notion — Authorization, Capabilities, Request limits
    last_modified: 2026-08-17
  - id: airtable-oauth
    resource: url
    title: Airtable — OAuth reference, Rate limits
    last_modified: 2026-08-17
  - id: clickup-oauth
    resource: url
    title: ClickUp — Authentication, Rate limits
    last_modified: 2026-08-17
okf_version: "0.2"
---

# RAPPORT_ARCHITECTURE — apps embarquées, multi-tenant, partage

> **Auteur** : Claude, session 2026-08-17. **Statut** : document de conception.
> **Audience** : arbitrage utilisateur (A0). **Pas du code** — des choix accompagnés
> d'un *pourquoi*. Respecte le `GARDE-FOU` du brief d'entrée.

## 0. Le trou béant — à régler avant toute Q

`src/lib/tooling/catalog/saasBuilder.ts:92` produit un AppSpec avec
`outputs: { 'text/html': 'https://placeholder.invalid/<slug>.html' }`. Puis
`saasAppSpecPublish` (ligne 117–143) appelle `appSpecToThreeApp(spec)` qui
prend la première URL (`appSpec.schema.ts:99`) et la pose comme `iframeUrl`.
L'iframe pointe donc dans le vide et le navigateur affiche « server IP
address could not be found ».

**Qui compile ? Personne.** **Qui héberge ? Personne.** **Le SaaS Builder
produit un AppSpec, point.** Tant que ce trou n'est pas nommé, Q1–Q5
travaillent sur du vide.

Trois voies possibles, et le rapport tranche en §0.3.

### 0.1 Ce qu'on sait construire dans Coach OS aujourd'hui

- Le client de l'AppSpec (`appSpecToThreeApp`) **exige** `level='easy'` (sinon
  throw, `appSpec.schema.ts:96`). Il extrait `outputs['text/html']` et le pose
  en `iframeUrl`. **Aucun code n'est compilé, aucun bundle n'est servi.**
- Le store (`threeApp.store.ts:90`) persiste la ligne en `localStorage`
  sous `coach-os:<userId>:<tenantId>:three-apps-v1`. **Zéro appel Supabase**
  sur la chaîne (§FAITS §1).
- Le rendu (`ThreeProgramApp.tsx:65-90`) est un `<iframe src={url} sandbox="...">`
  direct. Si `url` ne répond pas ou que l'en-tête `X-Frame-Options` du site
  refuse, l'utilisateur voit un écran blanc sans message.

### 0.2 Ce qu'il manque pour fermer la chaîne

| Acteur | Rôle | Existe ? |
|---|---|---|
| Builder de l'AppSpec | SaaS Builder, client-side | ✅ V1 (stub) |
| Compiler / builder HTML | (Hard = three.js compiler ; Expert = signed bundle) | ❌ non implémenté |
| Hébergeur des apps | (CDN statique + origin isolé) | ❌ n'existe pas |
| Catalogue persistant | localStorage | ❌ partiel (localStorage only) |
| Authentification partagée | (OAuth tiers ou storage crypté) | ❌ non implémenté |

### 0.3 Recommandation — figer la promesse V1

**V1 = `level: 'easy'` seulement, et l'utilisateur fournit une `iframeUrl` réelle.**
Pas de placeholder. Pas de « génère un iframe » automatique. On retire
`https://placeholder.invalid/...` du moteur de génération et on exige
qu'à la publication l'utilisateur ait copié une URL qui répond.

**Les autres voies perdent :**

- **Compiler + héberger côté Coach OS** = un service de build, un CDN,
  un mécanisme d'upload, une « pipeline Vercel-lite ». C'est le chantier
  **SaaS builder complet** (§6.4 du brief PARENT et SPEC §4.2). Pas un
  pré-requis pour répondre à Q1–Q5.
- **Compiler côté client** (wasm + runtime three.js) = viable pour
  Hard/Expert, mais V1 n'implémente ni le runtime ni le sandbox
  (`ThreeProgramApp.tsx:92-117`). Hors-périmètre.

**Conséquence sur le code source (à traiter après lecture du rapport) :**
modifier `saasBuilder.ts:92` pour exiger `iframeUrl` en paramètre du
`appSpecGenerate` ou refuser l'output si l'URL ne passe pas un
`new URL()` non-localhost. Pas dans ce rapport — un fichier modifié.

---

## 1. Q1 — Où doivent vivre les apps publiées ?

### 1.1 Ce qui dicte la réponse

- **Aucun partage multi-navigateur possible en localStorage.** §FAITS §1
  le constate. Aucune parade côté client.
- **Le code utilise deux identifiants :** `TenantId` (slug, pour
  partitionner le cache local) et `OrgId` (uuid, pour la RLS Supabase).
  `src/lib/tenant/contract.ts:40-67` distingue les deux. Le côté DB
  (`supabase/migrations/2026-08-17_memberships_alignement_contrat.sql`) est
  en `tenant_id uuid` sur INTERN, et `tenant_id text` (slug) sur
  CUSTOMERS. **C'est la cible — CUSTOMERS.** Une app Coach OS publiée
  par un client vit côté CUSTOMERS, pas INTERN.
- **HPublish + install = deux écritures distinctes.** Une app publiée
  (= catalogue) et une app installée (= bureau d'un utilisateur) sont
  deux faits différents. Une même app publiée peut être installée par
  plusieurs utilisateurs de plusieurs tenants.

### 1.2 Recommendation — deux tables séparées

```
apps                 -- catalogue d'une app publiée (par tenant)
app_installations    -- bureau d'un utilisateur (pointe vers une version)
```

**Pourquoi séparées :**
- Une mise à jour de l'auteur **ne doit pas muter** les installations
  existantes (cf. Q5). Si on stockait l'état de l'installation dans la
  ligne `apps`, une mise à jour casserait les contracts existants.
- Une installation doit pouvoir survivre à la suppression de l'app
  source (le bureau reste ouvert, l'app est marquée « plus disponible »).
- Une app peut être **installée par des utilisateurs hors du tenant de
  l'auteur** (cas du catalogue public). Sans table de jointure, on ne
  sait pas qui l'a installée.

### 1.3 Schéma proposé

Tous les tableaux suivants sont à poser sur **CUSTOMERS**, dans une
migration AJOUTÉE à `supabase/migrations/2026-08-17_apps_spec.sql`.

```sql
-- apps : le catalogue, par tenant
create table public.apps (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null references public.organizations(slug) on delete cascade,
  slug            text not null,
  name            text not null,
  version         text not null,                              -- '0.1.0'
  level           text not null check (level in ('easy','hard','expert')),
  category        text not null,
  description     text,
  -- source URL ou chemin vers l'artefact heberge (cf. §0.3)
  -- Pour 'easy' : iframeUrl. Pour 'hard'/'expert' : URL bundle.
  manifest_url    text not null,
  visibility      text not null default 'private'
                    check (visibility in ('private','tenant','public')),
  status          text not null default 'draft'
                    check (status in ('draft','pending','published','archived')),
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- un tenant ne peut pas avoir deux apps avec le meme slug
  unique (tenant_id, slug)
);

-- versions : on garde l'historique pour permettre les rollback + pinned install
create table public.app_versions (
  id              uuid primary key default gen_random_uuid(),
  app_id          uuid not null references public.apps(id) on delete cascade,
  version         text not null,
  manifest_url    text not null,                              -- snapshot du manifest
  spec_json       jsonb not null,                             -- AppSpec complet
  changelog       text,
  created_at      timestamptz not null default now(),
  unique (app_id, version)
);

-- installations : le bureau d'un user
create table public.app_installations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null references public.organizations(slug) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  app_id          uuid not null references public.apps(id) on delete set null,
  -- version pointee. Quasi toujours la version installee a l'origine,
  -- sauf MAJ explicite par l'utilisateur (cf. Q5).
  pinned_version_id uuid not null references public.app_versions(id),
  installed_at    timestamptz not null default now(),
  unique (tenant_id, user_id, app_id)
);
```

**Trois visibilités, dans cet ordre d'implémentation :**

- `private` (auteur seul) — défaut. **Implémenter en premier.**
- `tenant` (membres du tenant) — seconde itération.
- `public` (catalogue global) — troisième itération, après mise en place
  d'un mécanisme de validation (cf. Q2).

### 1.4 Policies RLS — inspirations et pièges

**Piège documenté (`2026-08-17_memberships_alignement_contrat.sql:103-105`) :**
« Une policy posée SUR `memberships` qui interroge `memberships` provoque
une récursion infinie de RLS. D'où ce SECURITY DEFINER. » Même piège
à éviter ici : ne pas faire que la policy de `apps` lise `memberships`
directement. Passer par `est_membre_du_tenant(tenant_id)` et
`est_admin_du_tenant(tenant_id)` (déjà en place dans la migration
`2026-08-17_customers_workspace_audit_policies.sql`).

**Policies minimales :**

```sql
-- SELECT : la complexite depend de visibility
--   private : tenant_id = mon tenant ET created_by = moi
--   tenant :  tenant_id = mon tenant
--   public :  status = 'published'
--          AND visibility = 'public'
-- Cette logique OU est traduite par plusieurs policies SELECT
-- combinees par RLS.

-- INSERT : auteur = auth.uid(); tenant_id = mon tenant
-- (un user peut publier une app dans son tenant)

-- UPDATE : auteur OU admin du tenant
-- (un membre ne peut pas modifier une app qu'il n'a pas creee)

-- DELETE : personne ne detruit une app avec installations.
-- On passe en `status = 'archived'` au lieu. (cf. Q5)
```

**Les fonctions `est_membre_du_tenant` / `est_admin_du_tenant` sont
déjà dispos** (`2026-08-17_customers_workspace_audit_policies.sql:23-58`).
Les réutiliser, ne pas en écrire une quatrième.

---

## 2. Q2 — Comment publier sans mélanger les espaces ?

### 2.1 Que voit un utilisateur de l'App Store ?

Trois sources, concaténées côté client, chaque ligne étiquetée :

1. **Ses apps installées** — `app_installations` filtrées par
   `tenant_id = current AND user_id = auth.uid()`.
2. **Les apps de son tenant** — `apps` filtrées par
   `tenant_id = current AND visibility IN ('tenant','public')`,
   moins celles déjà installées.
3. **Le catalogue public** — `apps` filtrées par `visibility = 'public'
   AND status = 'published'`, moins les précédentes.

**C'est l'union, pas l'intersection.** Une app privée est invisible
hors de son tenant, même pour les admins Coach OS. C'est la RLS qui
fait le tri — le client n'a pas à décider.

### 2.2 Qui publie dans le catalogue public ?

**Statut `pending` + revue manuelle.**

- Toute bascule `visibility = 'public'` passe l'app en `status =
  'pending'` côté serveur (trigger ou RPC). Un job ou un humain
  (`status = 'published'`) l'ouvre au monde.
- **Pourquoi une validation :** un client qui publie vite fait mal —
  une URL piégée, une app qui scrape, un bundle malveillant. Le
  catalogue public est lu par des utilisateurs d'autres tenants.
  Laisser tout passer est une dette de sécurité.
- **Pourquoi pas un autre humain dans la chaîne :** Coach OS est un
  produit solo. Le owner est lui-même le validateur. La règle
  minimale : verrou côté RLS — `update apps set status = 'published'
  ... using (status = 'pending' AND created_by = auth.uid())` n'est
  PAS suffisamment protégé. Un trigger RPC avec `auth.uid()` + une
  liste d'owners « Curator » est plus solide. À creuser.

### 2.3 Une app publique référence-t-elle des données du tenant ?

**Oui, si on n'y prend pas garde.** Concrètement, une app `easy` embarque
une `iframeUrl`. Cette URL est une chaîne statique ; **tant qu'elle est
constante, aucune fuite.** Mais :

- Si `outputs['text/html']` est générée en concaténant
  `https://mon-app.com/?org=<slug_source>` côté SaaS Builder, **chaque
  iframe ouverte chez un autre tenant envoie l'identifiant source dans
  l'URL**. La cible peut le lire, le logger, le vendre.
- Si `manifest_url` est construite à partir d'un hash du tenant
  (`@tenant_id`), une fuite similaire existe.

**Mitigation obligatoire, à poser côté builder :**

1. **L'AppSpec publié DOIT être une URL absolue, non paramétrée par le
   tenant.** `appSpecToThreeApp` doit refuser un `outputs['text/html']`
   qui contient `tenant_id` ou `user_id` interpolés.
2. **Si l'app a besoin d'un contexte runtime** (token, scope), c'est
   un contrat V2 — pas une interpolation d'URL. Le runner (`EasyIframe`)
   **injecte** le contexte via `postMessage` chiffré, pas via URL.
3. **Côté `EasyIframe`**, surcharger l'URL au runtime est une corde à
   linge : on l'interdit dans le contrat V1.

### 2.4 Recommendation — ce qu'on pose, et ce qu'on s'interdit

- **V1** : `private` + `tenant` seulement. Pas de `public`. Pas de
  validation, juste la RLS. Le client peut faire une app dans son
  tenant ; il ne peut pas la pousser au monde.
- **V2** : `public` + validation manuelle + `manifest_url` constant.
- **V3** : runtime postMessage chiffré pour les apps qui ont besoin
  d'un contexte utilisateur. **Hors-périmètre Q1–Q5.**

---

## 3. Q3 — Les OAuth Notion / Airtable / ClickUp

### 3.1 Faits mesurés (sources citées — recherche du 2026-08-17)

| Service | Unité d'isolation | Ce que couvre l'OAuth utilisateur | Rate limit (par ?) |
|---|---|---|---|
| **Notion** | 1 user → N workspaces | **Sélection page par page** au consentement. « a page picker interface opens » `docs/authorization` | **3 req/s par connexion**, headers `Retry-After` (secondes). `reference/request-limits` |
| **Airtable** | 1 user → N workspaces + bases | **Sélection base par base** au consentement. Scopes `resource:action` (`schema.bases:read`, `data.records:read`, etc.). `developers/web/api/oauth-reference` | **5 req/s par base** (OAuth). `developers/web/api/rate-limits` |
| **ClickUp** | 1 user → N workspaces ; **Workspace = atomique** | **Tout ou rien par workspace.** Pas de scope énuméré publiquement. « Users can authorize one or more Workspaces » `docs/authentication` | **Par token** (pas par user/workspace). **100 req/min Free**, **1 000 Business Plus**, **10 000 Enterprise**. `docs/rate-limits` |

**Citations complètes dans la note annexe (sources de cette recherche).**

### 3.2 Quatre points qui se déduisent

1. **Notion et Airtable sont multi-tenant ready.** Un user peut autoriser
   3 bases Airtable spécifiques sans toucher aux 47 autres. Le futur
   Coach OS multi-tenant s'y prête.
2. **ClickUp est grossier.** Si un client A est sur 3 workspaces
   ClickUp, il faut OAuth × 3 pour installer l'app Coach OS. À dire
   à l'utilisateur — l'UX ne peut pas masquer ça.
3. **Les quotas ne sont PAS par workspace CLIENT ; ils sont par
   connexion OAuth.** Ce qui veut dire : si un client A fait exploser
   la limite (loop, bug), c'est SON application Coach OS qui se fait
   throttler, pas celles des autres clients. **Pas de fuite de quota
   inter-clients.** Bonne nouvelle.
4. **Tokens Airtable et Notion n'expirent pas** aujourd'hui (ou
   expirent long). ClickUp : doc dit « does not expire — subject to
   change ». **Toujours chiffrer au repos**, toujours offrir un bouton
   « Révoquer ».

### 3.3 Où vit le token, et qui peut le lire ?

**Le piège principal : un jeton OAuth d'un client dans une table lisible
par un autre client est la faute la plus grave possible.**

L'architecture cible :

```
table : oauth_tokens
  user_id          uuid (references auth.users)
  provider         text ('notion' | 'airtable' | 'clickup')
  scope            jsonb (ce qui a été accordé)
  access_token     bytea (chiffré côté serveur)
  refresh_token    bytea (chiffré côté serveur)
  granted_resources jsonb (ids des bases/workspaces/pages accordés)
  expires_at       timestamptz
  created_at       timestamptz
  unique (user_id, provider)
```

**Policies RLS :**

- `select` : `user_id = auth.uid()` — chaque user ne voit que ses tokens.
- `update` : `user_id = auth.uid()`.
- `delete` : `user_id = auth.uid()`.
- `insert` : `user_id = auth.uid()`.

**Aucun moyen pour un user A de lister, lire, ou même tester
l'existence d'un token du user B.** La policy « own row only » est
la plus stricte et la plus simple.

**Chiffrement au repos :** `bytea` + `pgcrypto` côté serveur. Pas
de chiffrement côté client (le browser ne peut pas cacher grand-chose
à un user qui fouille sa propre machine). Le secret réside dans la
clé de chiffrement Postgres — elle-même dans `vault` ou variables
d'environnement, jamais dans la policy.

### 3.4 Ce qu'on NE FAIT PAS

- **Stocker en `localStorage`** comme les apps actuels. **Aucun
  token OAuth en localStorage.** C'est la couchemerde classique.
- **Stocker dans le même scope que le tenant.** Le token OAuth est
  une liaison **user ↔ provider**, pas tenant ↔ provider. Si un user
  change de tenant, son token le suit.
- **Permettre à l'app SERVER-SIDE de Coach OS d'agir au nom d'un
  user côté Notion sans un consentement par action.** L'OAuth a un
  scope. On ne le déborde pas.

### 3.5 Recommandation — V1 minimale

V1 OAuth porte **Notion et Airtable seulement**. ClickUp est documenté
comme « workspace-entier, opt-in explicite » dans l'UI d'onboarding,
mais pas câblé. On garde les migrations pour ajouter ClickUp quand il
y a un client qui le demande.

---

## 4. Q4 — Que faire du niveau « Easy » ?

### 4.1 Tableau mesuré (curl -I, 2026-08-17)

| Service | Verdict | En-tête mesuré | Source |
|---|---|---|---|
| **macro.com** | ❌ REFUSE TOTAL | `X-Frame-Options: DENY` + `Cross-Origin-Embedder-Policy: require-corp` | (FAITS §2) |
| **threejs.org** | ✅ EMBARQUABLE | aucun en-tête X-Frame-Options/CSP frame-ancestors | mesure directe |
| **Notion — `www.notion.so`** | ❌ REFUSE TIERS | CSP `frame-ancestors 'self' https://app.notion.com notion:// ...` (mesure : présence dans la CSP du 2026-08-17) | mesure directe |
| **Notion — `*.notion.site` (pages publiées)** | ✅ EMBARQUABLE | aucun en-tête, aucune CSP frame-ancestors | mesure directe (`acme.notion.site` répond 200 propre) |
| **Airtable** | ❌ REFUSE TIERS | `X-Frame-Options: SAMEORIGIN` | mesure directe |
| **ClickUp** | ❌ REFUSE TIERS | CSP `frame-ancestors 'self' https://clickup.com https://stage1-landing.clickup.com` | mesure directe |
| **Linear** | ❌ REFUSE TIERS | CSP `frame-ancestors 'self' https://cms.linear.app` | mesure directe |
| **Figma** | ❌ REFUSE TIERS | `X-Frame-Options: SAMEORIGIN` | mesure directe |
| **Google Docs** | ❌ REFUSE TIERS | `X-Frame-Options: SAMEORIGIN` | mesure directe |
| **Trello** | ❌ REFUSE TOTAL | CSP `frame-ancestors 'none'` | mesure directe |
| **Asana** | ❌ REFUSE TIERS | `X-Frame-Options: SAMEORIGIN` | mesure directe |
| **Replit** | ❌ REFUSE TOTAL | `X-Frame-Options: DENY` | mesure directe |
| **Miro** | ✅ possible (à confirmer) | aucun en-tête X-Frame-Options visible ; CSP permissive | mesure directe |
| **jsFiddle** | ✅ EMBARQUABLE | aucun en-tête X-Frame-Options | mesure directe |
| **Excalidraw** | ✅ EMBARQUABLE | aucun en-tête X-Frame-Options ; CORS explicite `Access-Control-Allow-Origin: https://excalidraw.com` | mesure directe |
| **Loom** | ✅ EMBARQUABLE | aucun en-tête X-Frame-Options | mesure directe |
| **Calendly** | ✅ EMBARQUABLE (à confirmer en prod) | aucun en-tête X-Frame-Options | mesure directe |
| **Substack** | ✅ EMBARQUABLE (à confirmer) | aucun en-tête X-Frame-Options | mesure directe |
| **Notion `embed.notion.co`** | ⚠️ 302 vers iframely.com | redirect HTTP | mesure directe |

**Ce qui se dégage :** la majorité des SaaS auteurs de documents
professionnels (Notion, Airtable, ClickUp, Linear, Figma, Asana,
Google Docs) refusent l'embarquement tiers. Les sites de code/dessin
détente (threejs, Excalidraw, jsFiddle, Loom) l'autorisent.

### 4.2 Le niveau Easy a-t-il encore un sens ?

**Oui, sous trois conditions strictes :**

1. **Liste blanche connue au moment de la publication.** L'UI SaaS
   Builder demande « URL de l'app » et refuse toute URL dont le
   domaine n'est pas dans la liste blanche. En V1, la liste est
   maintenue à la main dans le code (`src/lib/saas-builder/allowed-
   embed-origins.ts`), pas scrapée à runtime.
2. **Probe réel au moment de la publication.** L'UI envoie un `fetch`
   `HEAD` à l'URL, lit `X-Frame-Options` et `Content-Security-Policy:
   frame-ancestors`. Si l'un des deux refuse, la publication est
   refusée avec un message précis. **Ne pas faire cette vérification
   côté serveur à ce stade** — c'est l'UI cliente qui s'occupe, et
   l'utilisateur qui voit le message.
3. **Le mode « iframeUrl au hazard » est retiré.** Concrètement, le
   `iframeUrl` doit être validé à la publication ; pas de placeholder,
   pas d'URL forgée par le builder.

### 4.3 Détection des pannes côté `EasyIframe`

`ThreeProgramApp.tsx:65-90` n'informe pas l'utilisateur d'un échec.
Trois écoutes à ajouter :

- `onLoad` sur l'iframe — beaucoup de sites qui refusent l'embarquement
  émettent quand même un load. **L'astuce :** écouter `onError` ET
  chronométrer. Si 5 s sans `onLoad`, c'est probablement refusé.
- `sandbox="allow-scripts allow-same-origin allow-pointer-lock
  allow-forms"` — déjà en place. **Aucune restriction à relâcher.**
- **Stratégie propre :** un `fetch` `HEAD` (côté client, mais avec
  `mode: 'no-cors'`) AVANT le mount ; si la réponse arrive avec
  `x-frame-options: deny` ou `frame-ancestors` excluant `coach-os`,
  on n'affiche PAS l'iframe du tout — un message « Cette app refuse
  l'embarquement tiers. Ouvre-la dans un nouvel onglet. » s'affiche
  à la place.

**Le `code HTTP` seul ne suffit pas** (cf. §FAITS §3 sur `?q=tearable`).
La vraie indication, c'est la **présence d'un en-tête restrictif**.
Le `fetch` en `mode: 'no-cors'` permet de lire les en-têtes sans
déclencher de CORS côté serveur.

### 4.4 Recommendation — Easy est conservé, mais borné

- **Liste blanche d'origines autorisées** en V1 : threejs.org,
  `*.notion.site` (pages publiques Notion), Excalidraw, jsFiddle,
  Loom, Calendly (vrai subdomain utilisateur), miro.com (à
  re-vérifier), Substack. **Pas** macro.com, **pas** Notion
  workspace, **pas** ClickUp, **pas** Linear, **pas** Airtable,
  **pas** Figma, **pas** Google Docs, **pas** Replit, **pas** Trello.
- **Message clair à l'utilisateur** quand l'URL sort de la liste
  blanche : « Cette source refuse l'embarquement dans Coach OS. Voici
  pourquoi : la majorité des SaaS sérieux protègent leurs pages
  contre l'iframe. » Lien vers la doc.
- **Le SaaS Builder V1** ne crée pas d'AppSpec « à la volée » ; il
  demande une URL validée par l'utilisateur.

---

## 5. Q5 — Les mises à jour

### 5.1 Le contrat cible

**Chaque installation pointe vers une version figée.** Pourquoi :

- Une mise à jour de l'auteur ne casse pas les installations
  existantes. C'est la garantie de base.
- L'utilisateur peut **upgrader à la main** — un bouton « Passer à
  v0.2.0 » apparaît quand l'app en a une nouvelle.
- Le contrat est asymétrique : l'auteur peut **rétrograder** ou
  **archiver** une version cassée, et les installations qui pointent
  dessus restent telles quelles.

### 5.2 Schéma

Déjà posé en §1.3 :

- `apps.version` = la dernière version publiée, affichée au catalogue.
- `app_versions` = historique, une ligne par version.
- `app_installations.pinned_version_id` = la version à charger.

`appSpecToThreeApp` ne lit pas l'`AppSpec` actuel de l'auteur ; il lit
celui de la **ligne `app_versions` pointée par l'installation**. C'est
la différence avec l'état actuel, où la version installée est écrasée
par toute re-installation.

### 5.3 Que se passe-t-il si l'auteur supprime ?

**Aucune ligne `apps` n'est jamais hard-delete.** Le statut passe à
`archived`. Le `app_id` reste valide dans `app_installations` (la FK
est `on delete set null`, ce qui est plus prudent que cascade).

- Côté UI, l'installation reste sur le bureau mais marquée
  « Indisponible — l'auteur a archivé cette app. » avec un bouton
  « Désinstaller ».
- Une ré-`unarchive` par l'auteur rétablit l'usage — mais pour les
  installations qui pointent sur une version retirée, **on ne restaure
  pas la ligne `app_versions`** automatiquement. C'est une décision
  explicite : «
  yes, republish v0.1.0 » recrée une ligne `app_versions` à partir
  d'un dépôt interne (`spec_json` est en jsonb, on peut le
  re-charger).

### 5.4 Mises à jour de sécurité

Un auteur qui a publié un patch de sécurité doit pouvoir **forcer la
montée de version** pour les installations concernées. Recommandation
V2 :

- Ajouter un champ `app_versions.security_update_for` (uuid, optionnel)
  pointant vers la version qui doit être remplacée. Si l'installation
  pointe dessus ET l'user n'a pas explicitement épinglé, l'UI propose
  la mise à jour en bandeau persistant.

**Hors-périmètre V1.** V1 = mises à jour volontaires uniquement.

### 5.5 Recommendation — V1

- **Versionning obligatoire** : `app_versions` inséré en même temps
  que `apps` à chaque publication, identifié par `version` (semver).
- **Installations épinglées** : `pinned_version_id` toujours rempli ;
  aucune installation n'est « flottante » par défaut.
- **Suppression = archive** : `status = 'archived'`, jamais `DELETE`.
- **Aucune migration forcée** : l'utilisateur choisit. C'est V2.

---

## 6. Ordre de bataille

### 6.1 V1 — ce qui rend le chantier utile (1 à 2 sprints)

1. **Fermer le trou béant** (§0.3) : retirer le placeholder `placeholder.invalid`.
   Modifier `saasBuilder.ts:92` pour qu'il exige une URL réelle ou qu'il
   refuse la publication. Mesure immédiate : un app publiée au catalogue
   répond quelque chose dans l'iframe.
2. **Migrations `apps` + `app_versions` + `app_installations`** (§1.3).
   Sur CUSTOMERS, comme `2026-08-17_customers_*.sql`. Réutilise
   `est_membre_du_tenant` / `est_admin_du_tenant`. Pas de visibilité
   `public` en V1.
3. **Migration des `threeApp.store.ts` et `ledger.store.ts`** vers
   Supabase. Les installs actuelles en localStorage restent lisibles
   jusqu'à désinstallation, mais toute installation nouvelle passe
   par `app_installations`. Cela résout §FAITS §1 (apps perdues entre
   navigateurs).
4. **Liste blanche `allowed-embed-origins.ts`** + probe `HEAD` à la
   publication (§4.2 et §4.3). Refus avec message clair.
5. **Détection côté `EasyIframe`** : `fetch HEAD` `mode: 'no-cors'`
   avant mount, message « cette source refuse l'embarquement » si
   nécessaire.

### 6.2 V2 — Catalogue public + OAuth

- Visibilité `public` + workflow `pending → published` (§2.2).
- Traitement de l'OAuth (`oauth_tokens`, encryption pgp, UI
  d'onboarding) (§3.3).
- ClickUp câblé (si besoin client).
- Mises à jour de sécurité avec `security_update_for` (§5.4).

### 6.3 V3 — Runtime postMessage chiffré

- Pas en V1. Décrit dans §2.4.

---

## 7. Ce que je n'ai pas pu trancher

- **Quel user est Curator.** Le §2.2 suppose un validateur humain pour
  passer `pending → published`. Coach OS est mono-utilisateur pour
  l'instant. La règle V1 pourrait être : *toute app d'un user X peut
  être publiée par X lui-même, sans Curator.* Mais c'est exactement le
  cas d'abus que la validation était censée empêcher. **À trancher
  avec A0.**
- **Chiffrement `pgcrypto` : clé où ?** Le chiffrement au repos des
  jetons OAuth (§3.3) exige une clé de chiffrement Postgres. Vault
  Supabase, KMS AWS, variable d'environnement de l'Edge Function ? Pas
  tranché. **À voir avec A0 et le chantier auth.**
- **Cout de Supabase Storage.** Un bundle `hard` ou `expert` peut peser
  plusieurs Mo. Le prix du Storage sur Cloud est-il pris en compte ?
  Pas mesuré. **À chiffrer.**
- **Page picker Notion : niveau d'UX.** Ce que l'UI Coach OS doit
  afficher dépend de ce que l'API Notion renvoie. Si l'user autorise
  3 pages, l'app Notion doit savoir *lesquelles*. PostMessage V3 ou
  paramètre d'URL statique V2 ? V1 = URL statique uniquement.
- **Le delta `tenant_id` text vs `tenant_id` uuid.** INTERN a été
  converti en uuid (cf. `2026-08-17_canon_rls_uuid.sql`), CUSTOMERS
  est resté en text slug. Si une app doit éventuellement publier
  depuis INTERN aussi, le schéma §1.3 ne fonctionne pas tel quel sur
  INTERN. **À harmoniser avant le premier déploiement.**

---

## 8. Anti-patterns que ce rapport refuse explicitement

- **Stocker des apps en `localStorage` partagées entre comptes.** Fait
  aujourd'hui, cause directe des trois symptômes observés par A0. Le
  correctif 2026-08-17 (préfixage `coach-os:<userId>:<tenantId>:`)
  est un pansement ; la migration §6.1 #3 est le cureur.
- **Interpoler `tenant_id` dans une URL iframe.** Fait explicitement
  par le code de placeholder. À interdire en dur dans `appSpecToThreeApp`.
- **Un token OAuth rendu lisible par RLS d'un autre user.** Pas de
  débat — la policy `user_id = auth.uid()` est non-négociable.
- **Liste blanche Open Arena.** Pas de « on accepte tout et on prie ».

---

## 9. Annexe — sources OAuth citées

Recherche du 2026-08-17 via les pages officielles :

- Notion : `developers.notion.com/docs/authorization`,
  `developers.notion.com/reference/capabilities`,
  `developers.notion.com/reference/request-limits`.
- Airtable : `airtable.com/developers/web/api/oauth-reference`,
  `airtable.com/developers/web/api/rate-limits`,
  `airtable.com/developers/web/api/scopes`.
- ClickUp : `developer.clickup.com/docs/authentication`,
  `developer.clickup.com/docs/rate-limits`.

**Non trouvé explicitement dans la doc publique ClickUp** : la liste
de scopes OAuth et la procédure de révocation utilisateur. Tout
traitement de ClickUp en V2 demandera un test réel, pas une déduction.

---

## 10. État vérifié

- `FAITS.md` (mesures du 2026-08-17) — vérifié sur source.
- `threeApp.store.ts` (174 l.), `ledger.store.ts` (184 l.) — lecture
  + grep `supabase` zéro match.
- `appSpec.schema.ts` (112 l.) — lecture intégrale.
- `ThreeProgramApp.tsx` (122 l.) — lecture intégrale.
- `SaaSBuilderApp.tsx` (440 l.) et `saasBuilder.ts` (170 l.) —
  lecture intégrale.
- 16 mesures HTTP `curl -I` directes sur 18 cibles.
- 3 docs OAuth officiels lus.

**À vérifier après implémentation :** la RLS concrète des tables
`apps` / `app_versions` / `app_installations` sur le projet
CUSTOMERS (la théorie ici ne fait pas la migration réelle).
