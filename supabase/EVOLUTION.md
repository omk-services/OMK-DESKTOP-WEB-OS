# EVOLUTION.md — Du PoC au Souverain : quatre paliers, ce qui change

> Une page. Pas dix. Le but : que toute décision technique ou
> commerciale sache à quel palier elle s'applique, et ce qu'elle
> implique si on change de palier.

---

## Vue d'ensemble

| Palier | Infrastructure | Isolation | Cas d'usage |
|---|---|---|---|
| **PoC** (celui d'aujourd'hui) | 1–2 projets Supabase partagés (INTERN + CUSTOMERS) | Multi-tenant par `org_id` (RLS) | Démonstration, validation commerciale, prospection |
| **SaaS** | 1 projet Supabase partagé, beaucoup de tenants | Multi-tenant strict (RLS + tests adversariaux automatisés) | Commercialisation PME, 10–500 clients |
| **White Label** | 1 projet Supabase par client | DB physique par client, mais codebase partagée | Clients qui veulent leur marque, 5–50 clients à fort ARR |
| **Souveraineté** | Infra chez le client (Render, Coolify, on-prem) | Pas de Supabase partagé : DB dans le réseau du client | Grands comptes, santé, legal, pays avec contraintes de résidence |

Le passage d'un palier à l'autre est **unidirectionnel par coût décroissant
de risque** : on peut toujours descendre (split un projet), pas toujours
monter (fusionner des DB sans casse applicative).

---

## Palier 1 — PoC (déjà en place)

### Ce qui tourne
- 2 projets Supabase (Cloud) : `omk-internal` (le compte de démo) et
  `omk-customers` (preuve de concept avant SaaS).
- 1 codebase React qui parle aux deux via `VITE_SUPABASE_URL`.
- RLS activée sur 23 tables CMS + memberships + organizations.
- JWT hook provisionné (le piège neutralisé).
- Repli local via seed TypeScript — la démo vidéo fonctionne même
  sans réseau.

### Ce qui change si on monte en SaaS
- Activation de `sign-up-organization` edge function (création d'org
  + membership côté DB lors de chaque signup).
- Passage à un seul projet Supabase Cloud (`omk-saas`) partagé.
- Tests adversariaux pgTAP dans la CI (cf. VERIFICATION_RLS.md §3
  automatisable).
- Limites de connexions par `org_id` (rate limiting côté API).

---

## Palier 2 — SaaS (cible court terme)

### Ce qui change techniquement

| Domaine | Avant (PoC) | Après (SaaS) |
|---|---|---|
| **Multi-tenant** | RLS uniquement | RLS + tests pgTAP obligatoires à chaque PR qui touche un schema |
| **Sign-up** | Manuel ou hardcodé | Edge function `sign-up-organization` crée `organizations` + `memberships` atomiquement |
| **Billing** | Stripe sandbox, manual | Stripe Billing + webhook `customer.subscription.created` ↔ org |
| **Observabilité** | Logs Supabase bruts | PostHog (`mcp__gateway__posthog`) + Sentry (erreurs API) + Vercel Analytics |
| **Support** | Inbox partagé | Tenant visible dans chaque ticket, SLA par tier |
| **Hébergement app** | Render 25 services gratuits (cible) | Render paid plan (25 $/mois) + Vercel pro |
| **DB** | 1 projet partagé | 1 projet partagé + read-replica + PITR |

### Ce qui ne change PAS
- Codebase React (les 19 apps).
- Le modèle `org_id` (déjà bon).
- Le seed local (toujours là pour la démo).

### Coût marginal estimé par client
- DB : ~0,02 $/mois/client (1 Go de Postgres partagé, 100 clients).
- Edge compute : ~0,50 $/mois/client actif.
- Stripe : 2,9 % + 0,30 $ par transaction.

### Critère de bascule PoC → SaaS
- 3 clients payants signés en PoC, OU
- 1 client dont le SLA demande un read-replica.

---

## Palier 3 — White Label

### Pourquoi ce palier existe
Un client « gros » veut son URL, son branding, son logo, ses couleurs.
Le multi-tenant RLS partage la DB, ce qui complique :
- Les exports de données (CSV) qui doivent sortir avec le branding du
  client, pas celui de l'éditeur.
- Les noms de domaine (`coach-os.client.com` au lieu de
  `client.coach-os.app`).
- Les contrats légaux (le DPA doit être un par client, pas mutualisé).

### Ce qui change techniquement

| Domaine | Avant (SaaS) | Après (White Label) |
|---|---|---|
| **DB** | 1 projet partagé | 1 projet Supabase par client (le multi-tenant RLS disparaît pour ces clients) |
| **App** | 1 déploiement | 1 déploiement par client OU multi-build par variables d'env |
| **DNS** | `*.coach-os.app` | `coach-os.client.com` (CNAME vers Vercel) |
| **Auth** | Supabase Auth partagé | Chaque client a son Supabase Auth séparé, ou on garde partagé + branding par UI |
| **Thème** | `dockSkins.ts` global | `dockSkins.ts` + override par `org_id` |
| **Pricing** | Forfait mutualisé | Forfait par client, facturation directe |

### Ce qui ne change PAS
- La structure des tables (toujours `cms_*` + `memberships`).
- Le hook JWT (toujours nécessaire, mais `org_id` = leur unique org).
- La codebase React (variables d'env suffisent).

### Coût marginal estimé par client
- DB dédiée : 25 $/mois/client (Supabase Pro minimum).
- Déploiement Vercel : 20 $/mois/client.
- Maintenance : c'est là que le coût humain entre — pas automatisable.

### Critère de bascule SaaS → White Label
- 1 client > 5 000 €/mois, OU
- 1 client qui demande son propre DPA / branding / DNS.

---

## Palier 4 — Souveraineté

### Pourquoi ce palier existe
- Santé (HDS en France).
- Legal (données avocat, secret professionnel).
- Pays hors UE (résidence imposée).
- Clients qui ne font confiance à aucun Cloud US.

### Ce qui change techniquement

| Domaine | Avant (White Label) | Après (Souveraineté) |
|---|---|---|
| **DB** | Supabase Cloud | Postgres self-hosté (Render, Coolify sur VPS, ou on-prem) |
| **App** | Vercel | Render ou Coolify |
| **Auth** | Supabase Auth | Supabase Auth self-hosté ou Keycloak |
| **MCP** | `mcp__gateway__supabase-*` | MCP custom qui parle au Postgres local via tunnel SSH |
| **Observabilité** | PostHog + Sentry Cloud | PostHog self-hosté ou logs structurés sur disque |
| **Codebase** | 1 fork | 1 fork par client (sinon on ne peut pas auditer les patches) |

### Ce qui ne change PAS
- Le modèle de données (les migrations SQL sont les mêmes).
- Le contrat RLS (la frontière `org_id` reste, juste exécutée ailleurs).

### Coût marginal estimé par client
- Infra : 100–500 €/mois/client selon SLA.
- Setup initial : 5–15 jours homme par client (audit réseau, tunnel,
  certificats).
- Run : 0,5 jour/mois/client (maintenance, mises à jour).

### Critère de bascule White Label → Souveraineté
- 1 client avec contrainte légale de résidence, OU
- 1 client avec un audit sécurité qui refuse le Cloud partagé.

---

## Tableau de décision rapide

```
"Je signe ce client, je reste à quel palier ?"
    │
    ├─ Startup, < 50 personnes, EU, OK Cloud  → SaaS
    ├─ PME, branding custom, EU, OK Cloud     → White Label
    ├─ HDS / santé / legal / hors UE          → Souveraineté
    └─ Pas encore signé, juste démo           → PoC
```

Ce n'est pas un escalier à monter par principe. **Chaque palier coûte
plus cher que le précédent** (en setup + en run). On y va quand le
client le demande, pas avant.

---

## Anti-patterns à éviter

- **Fusionner des DB White Label** pour "économiser" : le multi-tenant
  RLS est plus risqué qu'une DB séparée quand le client exige de
  l'isolation prouvable.
- **Couper le seed local** quand Supabase arrive : la démo vidéo doit
  toujours pouvoir tourner offline.
- **Activer le hook JWT sans membership créée** : c'est exactement le
  bug zéro-ligne-silencieux.
- **Pousser les migrations `collections.sql` sans `rls.sql`** : tables
  en accès libre = data leak.
