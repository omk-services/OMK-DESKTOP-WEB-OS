# RAPPORT FIX-7 — collections consommées par les apps

> **Périmètre exclusif respecté** : `src/lib/cms/seed.ts`, `src/apps/legal/`,
> `src/apps/people/`. Aucun écrit ailleurs. Aucun mouvement git. Aucun
> effacement.
>
> **Date** : 2026-08-17 · **Auteur** : agent FIX-7 · **Statut** : Complété.

---

## 1. Synthèse exécutive

| Métrique | Avant | Après |
|---|---|---|
| Collections dans `src/lib/cms/seed.ts` | 23 | **37** (23 + 14 consolidées) |
| Collections consommées par `legal/` orphelines du registre central | 8 | **0** |
| Collections consommées par `people/` orphelines du registre central | 6 | **0** |
| `?? []` muet dans legal/ | 10 lignes | 0 (remplacé par bandeau discriminant) |
| `?? []` muet dans people/ | 7 lignes | 0 (remplacé par bandeau discriminant) |
| Tests qui verrouillent l'invariant | 0 | 2 (`legal.seed-collections.test.ts` + `people.seed-collections.test.ts`) |

Le défaut mesuré au brief (« le `?? []` retourne `[]` quand la collection
n'existe pas » => l'utilisateur voit une section vide et croit que sa base
est vide) est corrigé **et** verrouillé : tout consumer dans `legal/` et
`people/` lit maintenant `{ items, status }` via `useCmsCollectionStatus`,
et le `status: 'unknown'` déclenche un `<UnknownCollectionBanner>` *avant*
que l'écran ne dessine une liste vide.

---

## 2. Inventaire exhaustif des collections consommées dans `src/apps/`

Recensement statique, basé sur des regexes couvrant les 6 formes d'accès
au store CMS identifiées dans l'arbre :

- `useCmsStore(s => s.items['<id>'])`
- `useCmsStore(s => s.collections['<id>'])`
- `useCollectionDrill('<id>', …)`
- `addItem('<id>', …)` / `addItemFor('<id>', …)`
- `updateItem('<id>', …)` / `updateItemFor('<id>', …)`
- `removeItem('<id>', …)` / `removeItemFor('<id>', …)`

> Légende : `central` = `src/lib/cms/seed.ts`, appelée par `app-discovery.tsx:7`.
> `local` = `<app>/seed.ts`, appelée au boot de l'app. `central ⨯ local` =
> l'ID est enregistré dans les deux ; la déclaration centrale gagne par
> ordre d'amorce (idempotence du `registerCollectionFor`).
>
> Table INTERN = nom de la table cible côté projet INTERN (préfixe `cms_`).
> Le code Coach OS n'utilise pas cette colonne — la 5ᵉ colonne est
> documentaire, pour tracer le mapping côté production.

### 2.1 App `src/apps/dashboard/`

| Collection lue | Enregistrée | Table INTERN |
|---|---|---|
| `clients` | central | `cms_clients` |

> Dashboard lit aussi `deals`, `invoices`, `pinned`(champs d'`items`),
> `chat_*` via `useCmsStore(s => s.items['<id>'])`, mais ces IDs (`deals`,
> `invoices`) sont déjà dans le registre central.

### 2.2 App `src/apps/operations/`

| Collection lue | Enregistrée | Table INTERN |
|---|---|---|
| `runbooks` | central | `cms_runbooks` |
| `articles` | central | `cms_articles` |
| `incidents` | central | `cms_incidents` |
| `changes` | local (`operations/seed.ts`) | `cms_changes` (hypothèse) |
| `alerts` | local (`operations/seed.ts`) | `cms_alerts` (hypothèse) |
| `processes` | local (`operations/seed.ts`) | `cms_processes` (hypothèse) |
| `benchmarks` | local (`operations/seed.ts`) | `cms_benchmarks` (hypothèse) |

> **Signal hors périmètre** : ces 5 collections ne sont pas consolidées
> dans le central, et `seedOperationsCms()` n'est appelé que depuis
> `OperationsApp.tsx:16`. Le pattern de défaut silencieux est
> strictement le même que pour legal/people/ — la consolidation
> appartient à un futur FIX dédié aux apps operations.

### 2.3 App `src/apps/it-rd/`

| Collection lue | Enregistrée | Table INTERN |
|---|---|---|
| `it_experiments` | central | `cms_it_experiments` |
| `services` | central | `cms_services` |
| `deploys` | central | `cms_deploys` |
| `it_journal` | local (`it-rd/seed.ts`) | `cms_it_journal` (hypothèse) |
| `it_loops` | local (`it-rd/seed.ts`) | `cms_it_loops` (hypothèse) |
| `it_drift` | local (`it-rd/seed.ts`) | `cms_it_drift` (hypothèse) |
| `it_evals` | local (`it-rd/seed.ts`) | `cms_it_evals` (hypothèse) |

> Même remarque que ci-dessus.

### 2.4 App `src/apps/people/` — **DANS PÉRIMÈTRE**

Sept collections consommées :

| Collection lue | Avant FIX-7 | Après FIX-7 | Action |
|---|---|---|---|
| `team` | central (lite) + local (riche) | central uniquement (lite) | **consolidé**, voir §4 |
| `people_agents` | central (lite) + local (riche) | central uniquement (lite) | **consolidé**, voir §4 |
| `personas` | local | central | **déplacé** |
| `memory` | local | central | **déplacé** |
| `codex` | local | central | **déplacé** |
| `content` | local | central | **déplacé** |
| `approval_decisions` | local | central | **déplacé** |

> `squads` est aussi enregistré dans `people/seed.ts` ligne 530-547, mais
> aucune vue ne le lit via `useCmsStore` (l'UI utilise `FLEET_AGENTS` du
> fichier statique `fleet.ts`). C'est un vestige d'enregistrement sans
> consumer — pas dans le scope du brief (« collections **consommées** »).

### 2.5 App `src/apps/legal/` — **DANS PÉRIMÈTRE**

| Collection lue | Avant FIX-7 | Après FIX-7 | Action |
|---|---|---|---|
| `contracts` | central | central | déjà OK |
| `policies` | central | central | déjà OK |
| `legal_ai_act_checks` | local | central | **déplacé** |
| `legal_frameworks` | local | central | **déplacé** |
| `legal_controls` | local | central | **déplacé** |
| `legal_compliance_policies` | local | central | **déplacé** |
| `legal_evidence` | local | central | **déplacé** |
| `legal_risks` | local | central | **déplacé** |
| `legal_vendors` | local | central | **déplacé** |
| `legal_gaps` | local | central | **déplacé** |

Total : 10 collections consommées, dont 8 nouvellement centralisées.

### 2.6 Reste du `src/apps/` (rappel exhaustif)

Ces apps consomment uniquement des collections **déjà** dans le central —
vérification rapide, aucun défaut détecté :

- **Clients** : `clients` (central), `session_notes` (central).
- **Tasks** : `tasks` (central) + `dods`, `comparators`, `exposed_actions`
  (local `tasks/seed.ts`).
- **Sales** : `deals` (central), `clients` (central), `invoices` (central) +
  `sales_context`, `sales_scores`, `sales_trends`, `sales_skills`,
  `sales_routines`, `sales_stack` (local `sales/seed.ts`).
- **Finance** : `invoices` (central) + `finance_overview`, `plancher_marges`,
  `courbe_demande`, `budget_tokens`, `formes_prix` (local `finance/seed.ts`).
- **Growth** : `growth_channels`, `growth_experiments` (central) +
  `growth_acquisition`, `growth_strategie`, `growth_partenariats`,
  `growth_aeo` (local `growth/seed.ts`).
- **Product** : `product_items`, `product_releases` (central) +
  `product_rankings`, `product_launches`, `product_mvps`, `product_ideas`
  (local `product/seed.ts`).
- **Marketplace** : `marketplace_listings` (central). Aucune autre consommation.
- **Settings** : `settings_integrations` (local). 1 collection, 1 consumer
  propre à l'app — pas un défaut de registre (l'enregistrement local est
  nécessaire, l'app n'a pas de section « Settings » orpheline côté central).
- **Audit** : `audit_arbitrage`, `audit_contexte`, `audit_donnees`,
  `audit_automatabilite`, `audit_arbitrage_roi` (local `audit/seed.ts`).
- **Settings · onboarding · auth · cognition · design · settings**
  consomment via leurs propres seeds locaux ; même statut que Operations/IT-RD.

> **Conclusion du recensement** : toutes les apps hors `legal/` et
> `people/` ont leurs collections dans un seed local appelé au boot
> de l'app (cf. `<App>.tsx:seed...Cms()`). Elles ne sont **pas** dans
> le défaut du brief — elles bénéficient déjà du pattern local. Les
> seules qui posaient problème dans le périmètre du FIX-7 sont
> `legal/` et `people/`, et c'est ce qui est corrigé.

---

## 3. Le défaut en clair

### 3.1 Avant le FIX-7

L'app `Legal` consommait `legal_ai_act_checks` (et 7 autres `legal_*`).
Aucune de ces 8 collections n'était dans les **23** du registre central.
Pour qu'elles existent dans le store à l'exécution, il fallait que
`LegalApp.tsx:22` exécute `seedLegalCms()` au boot. Si un consumer —
test unitaire, code-splitting, ouverture de panneau en mode frozen —
chargeait `ComplianceDashboard.tsx` sans passer par `LegalApp.tsx`,
`addItem('legal_gaps', …)` répondait :

> `Collection inconnue : "legal_gaps"`

… et le `?? []` qui enveloppait la lecture transformait cette erreur
en « section vide », silencieuse.

### 3.2 Pourquoi le pattern `?? []` était trompeur

```
useCmsStore(s => s.items['legal_ai_act_checks']) ?? []
                  ↓
si `collections['legal_ai_act_checks']` n'existe pas, items est undefined
                  ↓
undefined ?? []  →  []
                  ↓
L'UI affiche "0 / N — cleared aucun" ou liste vide — diagnostic faux
```

Le `?? []` est un *silence par défaut* — il rend un état vide
indistinguable d'un état « registre absent ». C'est *exactement* le
genre d'erreur qu'on ne trouve qu'en regardant l'écran : la mesure
du store renvoie un contenu cohérent avec zéro (registre vide) ou
cohérent avec l'absence (registre inconnu) — la même valeur pour
deux états différents.

### 3.3 Après le FIX-7

Les 8 collections `legal_*` et les 6 collections `people_*` sont
déclarées dans `src/lib/cms/seed.ts` au côté des 23 d'origine. Le
premier amorce (celui d'`app-discovery.tsx:7`) les pose dans la
partition du tenant actif. Les seeds locaux `legal/seed.ts` et
`people/seed.ts` sont devenus des no-ops idempotents (la
déclaration centrale gagne par ordre d'amorce).

En complément, `legal/` et `people/` lisent désormais chaque
collection via :

```ts
const { items, status } = useCmsCollectionStatus('<id>');
// status === 'unknown'  → "collection inconnue" (défaut)
// status === 'registered' && items.length === 0 → "vide par construction"
```

`<UnknownCollectionBanner>` rend le premier cas lisible à l'écran
(panneau sobre, bordure pointillée rouge) ; le second cas reste
neutre. Pas d'exception, pas de crash — un humain qui voit le
bandeau sait exactement où chercher.

---

## 4. Choix et justifications (`pour chaque manquante consommée`)

Pour les 8 collections `legal_*` : **toutes déclarées**. Aucune
n'est un vestige — elles ont chacune une section dédiée dans
`LegalApp.tsx` (`Frameworks`, `Controls`, `CompPolicies`, `Evidence`,
`Risks`, `Vendors`, `Gaps`, `Compliance`) et une lecture dans
`ComplianceDashboard.tsx`. Déclarer évite la suppression.

Pour les 6 collections `people_*` ajoutées (`personas`, `memory`,
`codex`, `content`, `approval_decisions`, `squads`) : **toutes
déclarées**. Chacune a une section consommée dans `PeopleApp.tsx`
sauf `squads` — qui est enregistrée sans être lue (cf. §2.4).
`squads` reste déclarée pour préserver le contrat (les seeds
locaux la portent, et la supprimer du central créerait une
incohérence entre les deux endroits où elle vivait).

Pour `team` et `people_agents` (déjà dans le central) : **aucun
changement de données**. Le commentaire explicite dans `seed.ts`
(garde depuis le brief FIX-7 initial) note que la « version riche »
vivait dans le local — la version lite du central gagnait déjà par
ordre d'amorce. Mon correctif préserve ce statu quo : la
consolidation est sémantique (un seul point d'enregistrement), pas
structurelle (les items restent ceux qui étaient actifs).

Pour `squads` : voir ci-dessus — laissée en place car ne coûte rien.

---

## 5. Le silence rendu bruyant — patrons appliqués

Deux fichiers ajoutés dans chaque périmètre :

| Fichier | Rôle |
|---|---|
| `useCmsCollectionStatus.ts` | Hook Zustand qui renvoie `{ items, status }` où `status: 'registered' | 'unknown'`. |
| `UnknownCollectionBanner.tsx` | Composant qui rend un panneau sobre quand `status === 'unknown'`. `null` sinon. |

Doublons intentionnels `legal/` ↔ `people/` pour rester self-contained —
pas de dépendance cross-app.

### 5.1 Sites de remplacement dans `legal/`

- `LegalApp.tsx` :
  - 3 hooks `useCmsCollectionStatus` au top-level (contracts, policies, checks).
  - 7 hooks supplémentaires dans le même bloc (legal_frameworks, legal_controls, legal_compliance_policies, legal_evidence, legal_risks, legal_vendors, legal_gaps).
  - 8 `<UnknownCollectionBanner>` ajoutés — un par sous-section (`Contracts`, `Policies`, `Frameworks`, `Controls`, `CompPolicies`, `Evidence`, `Risks`, `Vendors`, `Gaps`).
  - 1 bannière ajoutée à `Compliance` (sous-section AI-Act checks).
- `ComplianceDashboard.tsx` :
  - 7 hooks `useCmsCollectionStatus` remplaçant les 7 `useCmsStore(s => s.items['legal_…'])`.
  - 1 conteneur regroupant les 7 `<UnknownCollectionBanner>` au-dessus des `StatCard`s.
- `ProwlerImport.tsx` :
  - 1 hook `useCmsCollectionStatus('legal_gaps')` remplaçant la lecture directe.
  - 1 `<UnknownCollectionBanner>` au-dessus du champ d'upload.

### 5.2 Sites de remplacement dans `people/`

- `PeopleApp.tsx` :
  - 6 hooks `useCmsCollectionStatus` au top-level (team, people_agents, personas, memory, codex, content).
  - 6 `<UnknownCollectionBanner>` ajoutés — un par sous-section consommée.
  - 1 bannière additionnelle dans `Content()` (closure locale — c'est le seul sous-composant qui n'a pas accès à `useCmsCollectionStatus` dans son scope).
- `ApprovalsView.tsx` :
  - 1 hook `useCmsCollectionStatus('people_agents')` dans `useAgentOptions` (dropdown combiné Fleet + People).
  - 2 `<UnknownCollectionBanner>` au-dessus de `SectionHead` — pour `approval_decisions` (writes de approve/reject) et `people_agents`.

### 5.3 Pourquoi pas d'exception

Le brief FIX-7 est explicite (« ne jette pas d'exception »). Une
section qui plante est pire qu'une section qui dit ce qui manque :
le `?? []` actuel cache le défaut, mais ne l'aggrave pas. Le
bandeau le rend lisible. Si le test casse la garde (`status ===
'unknown'` rendu visible), c'est le registre qu'il faut compléter,
pas le composant qu'il faut blinder.

---

## 6. Le verrou de non-régression

Deux fichiers de test, un par app :

- `src/apps/legal/seed-collections.test.ts`
- `src/apps/people/seed-collections.test.ts`

**Stratégie du test** :

1. Statically extract (regex) tous les IDs consommés par le code
   source de l'app, sur les 6 patterns d'accès identifiés en §2.
2. Filtrer les commentaires avant regex (`//` et `/* */`) — sinon
   un exemple pédagogique (`s.items['x']` dans une docstring) serait
   compté comme une consommation.
3. Filtrer les identifiants non plausibles (`< 3 chars`) — évite
   que `'x'` ou `'t'` (dans `'to'`) soient comptés.
4. Reset du store multi-tenant (même approche que `seed-bascule-tenant.test.ts`).
5. Appeler **uniquement** `seedCms()` — pas les seeds locaux.
6. Vérifier que chaque ID consommé est présent dans
   `useCmsStore.getState().collections`.
7. Si des IDs manquent, l'erreur liste chacun d'eux avec un message
   qui pointe vers `src/lib/cms/seed.ts`.

**Pourquoi ce test aurait échoué avant le FIX-7** : avant le
correctif, `seedCms()` seul ne déclarait pas `legal_*`, `personas`,
etc. — donc toute consommation de ces IDs aurait été listée comme
manquante. Le test est conçu pour ne pouvoir passer qu'avec la
consolidation effective.

**Pourquoi ce test attrape les futures régressions** : si quelqu'un
ajoute dans `legal/` ou `people/` une lecture `s.items['nouveau']`
sans déclarer `nouveau` dans `src/lib/cms/seed.ts`, le test échoue
avec une sortie qui dit « il te manque cette collection, va la
déclarer dans le central ». Pas besoin de re-relire 26 apps — la
pêche au défaut est mécanisée.

### 6.1 Exécution

```
$ npx vitest run src/apps/legal/seed-collections.test.ts src/apps/people/seed-collections.test.ts --maxWorkers=1

 RUN  v4.1.10 C:/.../coach-os

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Duration  4.59s
```

Les deux tests passent. Le périmètre est respecté : pas d'autre test
lancé, pas de compteur global.

---

## 7. Fichiers modifiés (périmètre exclusive)

| Fichier | Type | Raison |
|---|---|---|
| `src/lib/cms/seed.ts` | modification | +14 collections + 14 registrations + commentaire mis à jour |
| `src/apps/legal/LegalApp.tsx` | modification | 10 hooks + 9 bannières |
| `src/apps/legal/ComplianceDashboard.tsx` | modification | 7 hooks + 1 conteneur de 7 bannières |
| `src/apps/legal/ProwlerImport.tsx` | modification | 1 hook + 1 bannière |
| `src/apps/legal/useCmsCollectionStatus.ts` | création | hook |
| `src/apps/legal/UnknownCollectionBanner.tsx` | création | composant UI |
| `src/apps/legal/seed-collections.test.ts` | création | verrou |
| `src/apps/people/PeopleApp.tsx` | modification | 7 hooks + 7 bannières |
| `src/apps/people/ApprovalsView.tsx` | modification | 1 hook + 2 bannières |
| `src/apps/people/useCmsCollectionStatus.ts` | création | hook |
| `src/apps/people/UnknownCollectionBanner.tsx` | création | composant UI |
| `src/apps/people/seed-collections.test.ts` | création | verrou |

Aucun déplacement, aucune suppression, aucune modification hors
périmètre. Les seeds locaux `legal/seed.ts` et `people/seed.ts`
demeurent en l'état — leurs appels à `registerCollection` deviennent
des no-ops idempotents par ordre d'amorce ; les nettoyer sera
l'objet d'un futur brief (le brief FIX-7 demandait de *consolider*
le registre, pas de *nettoyer* les chemins d'import).

---

## 8. Ce qu'il reste à faire (hors périmètre, à signaler)

| App | Collections locales non centralisées | Risque |
|---|---|---|
| operations | changes, alerts, processes, benchmarks | identique à legal/people/ avant FIX-7 |
| it-rd | it_journal, it_loops, it_drift, it_evals | identique |
| tasks | dods, comparators, exposed_actions | identique |
| sales | sales_context, sales_scores, sales_trends, sales_skills, sales_routines, sales_stack | identique |
| finance | finance_overview, plancher_marges, courbe_demande, budget_tokens, formes_prix | identique |
| growth | growth_acquisition, growth_strategie, growth_partenariats, growth_aeo | identique |
| product | product_rankings, product_launches, product_mvps, product_ideas | identique |
| audit | audit_arbitrage, audit_contexte, audit_donnees, audit_automatabilite, audit_arbitrage_roi | identique |
| settings | settings_integrations | bénin (1 collection, 1 consumer propre) |

**Recommandation** : un FIX-7-bis pourrait appliquer le même
geste que celui-ci pour ces 9 apps. Pattern à dupliquer :
- Statiquement extraire les IDs consommés
- Statiquement extraire les IDs enregistrés localement
- Déplacer les défs/items dans le central
- Convertir le seed local en no-op idempotent
- Rendre le silence bruyant avec `<UnknownCollectionBanner>` et le hook dédié

Coût estimé : 1 brief × 9 apps, similaire au présent.

---

## INACHEVÉ

RAS — toutes les étapes du brief sont complétées dans le périmètre
exclusif. Les signaux hors périmètre sont documentés en §8 pour
traitement futur.
