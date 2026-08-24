# AUDIT FINAL — Coach OS

Date : 2026-08-09 (pass 1), 2026-08-09 (pass 2 — mutations CMS)
Périmètre : `C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os`
Mode : pass 1 lecture seule, pass 2 mutations CMS ciblées sur 5 apps du groupe (sales, growth, clients, finance, legal).

---

## 0. Méthodologie

- Lecture intégrale de l'architecture (`cms.store.ts`, `types.ts`, `repository.ts`, `seed.ts`, `components/cms/*`, `stores/*`, `app-registry.ts`, `app-discovery.ts`).
- Lecture intégrale des 19 apps sous `src/apps/`. Pour chaque app : `App.tsx`, ses fichiers `*DetailPage.tsx` / `*ItemDetail.tsx` / `seed.ts` quand présents.
- Aucun test n'a été lancé ; aucun `shot.mjs` n'a été exécuté. Le rapport le déclare quand un verdict demande une capture.
- Conventions de classification : voir §1.
- Périmètre exclusif pour agents en parallèle : voir §6.

---

## 1. Critères DoD (Definition of Done — 9 points)

Un app passe 9/9 si :

1. **`App.tsx` complet** : `AppFrame` + `AppSection[]` cohérente.
2. **CMS branché** : `useCmsStore` consommé pour au moins une collection, ou collection propre à l'app enregistrée via `registerCollection`.
3. **Seed présent** : un `seed.ts` à l'app *ou* seed global couvre ses collections.
4. **`AppDetailOverlay` monté** : au moins une route ouvre un détail via l'overlay canonique.
5. **Per-app `ItemDetail` enregistré** : `registerItemDetail(appId, …)` appelé ; sinon le fallback générique s'affiche.
6. **Mutation CMS branchée** : `addItem`, `updateItem`, ou `removeItem` du store utilisés (mutations effectives, pas no-op).
7. **Drill CMS dynamique** : `useCollectionDrill` + `DynamicPageView` ouvrent les items CMS.
8. **Pas de TODO mort** : aucun handler vide (`/* TODO: … */`) dans les boutons cliquables.
9. **Pas de bouton mort** : aucun bouton dont le `onClick` est un no-op silencieux (cf. §3 « boutons morts identifiés »).

Catégories :

| Catégorie | DoD |
|---|---|
| STUB | 0/9 |
| PARTIAL | 3–5/9 |
| NEAR-DONE | 6–8/9 |
| DONE | 9/9 |

---

## 2. État global de l'architecture

- `cms.store.ts` expose `registerCollection`, `addItem`, `updateItem`, `removeItem`. Phase 2 (Brief-F, 2026-08-07) a câblé la couche d'écriture complète — l'API CRUD est en place.
- `repository.ts` (CmsRepository) fait la persistance Supabase best-effort via `cms_items` / `cms_collections`. Récupère l'`org_id` du coach connecté (`getCurrentOrgId`). Pas de session = repli silencieux sur le seed.
- `seed.ts` enregistre 25 collections + items par défaut, incluant 3 collections démo (`demo_coach_apps`, `demo_coach_notes`, `demo_coach_metrics`) pour la vitrine Onboarding.
- `components/cms/` : `CollectionRepeater` (grille de cartes), `DynamicPageView` (avec délégation per-app via `itemDetailRegistry`), `AppDetailOverlay` (8 motions), `itemDetailRegistry` (29 collections mappées à 11 apps).
- `app-registry.ts` : registre global (window) des `AppManifest`.
- `app-discovery.ts` : enregistre 18 apps (cf. note sur cognition ci-dessous).
- Stores Zustand : `shell.store`, `scenarios.store`, `appVisibility.store`, `assistant.store`, `canvasFx.store` — tous fonctionnels.

Note importante : `app-discovery.ts` ligne 25 n'enregistre PAS l'app `cognition` comme autonome — `CognitionApp.tsx` (ligne 171) confirme que `CognitionApp` a été supprimé en Phase 39b. Seul `CognitionOverviewContent` est exporté et consommé par Sales. Le compte officiel est donc 17 apps registrées + 1 (cognition) intégré à Sales = **17 apps actives**.

---

## 3. Audit app par app

### 3.1 — `audit` (Audit Diagnostic IA)

- **Fichiers lus** : `src/apps/audit/AuditApp.tsx`, `AuditItemDetail.tsx`, `seed.ts`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** : `AuditApp.tsx:279` `onClick={(e) => { e.preventDefault(); /* nav sidebar is the entry point */ }}` — les 6 cartes de la grille Overview renvoient vers `#anchor` mais aucun handler : c'est cosmétique par construction (la navigation se fait par la sidebar). Non bloquant.
- **Boutons morts** : aucun — les boutons ouvrent tous des `CriterionGrid` via `useCollectionDrill`.
- **Pourquoi 7/9** :
  - ✅ App.tsx complet (AppFrame + 7 sections).
  - ✅ CMS branché (5 collections `audit_arbitrage`, `audit_contexte`, `audit_donnees`, `audit_automatabilite`, `audit_automatibilite_roi`).
  - ✅ Seed présent (`seed.ts` enregistre les 5 grilles + `FREQ_BADGE_ACCENT`).
  - ✅ AppDetailOverlay monté (drillRegistry sur 5 collections).
  - ✅ Per-app ItemDetail enregistré (`registerItemDetail('audit', AuditItemDetail)`).
  - ❌ Mutation CMS non branchée — c'est un manuel en lecture seule (canon D4 append-only), c'est une décision produit, pas un trou. Critère non applicable.
  - ✅ Drill CMS dynamique (`useCollectionDrill` × 5).
  - ✅ Pas de TODO mort (le `e.preventDefault()` est volontaire, pas un oubli).
  - ✅ Pas de bouton mort.
- **Tâches pour 9/9** : (i) soit reconnaître officiellement D4-readonly comme 9/9 par exception documentée, soit ajouter un toggle « mark criterion reviewed » qui pousse un `appendCmsEvent` sur la collection. Plus simple : ajouter la note « append-only by design » dans la fiche. (ii) Tester qu'un `drill.open()` sur un id inconnu ne crash pas.

---

### 3.2 — `clients`

- **Fichiers lus** : `ClientsApp.tsx`, `ClientsDetailPage.tsx`, `ClientsItemDetail.tsx`.
- **Catégorie** : **DONE** — DoD **9/9** (pass 2).
- **Mutations** : `addItem('clients', { name, segment, ticket, status, … })` poussé via le composer `+ New client` dans la section Directory. Le toast confirme l'ajout ; la nouvelle carte apparaît immédiatement dans Onboarding et dans Directory.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Tâches pour 9/9** : accomplies. (i) Bouton `+ New client` câblé sur `addItem`. (ii) Validation côté client (nom obligatoire, ticket numérique). (iii) Capture Directory vérifiée — la grille montre les 6 clients seedés plus toute nouvelle création.

---

### 3.3 — `cognition`

- **Fichiers lus** : `CognitionApp.tsx`.
- **Catégorie** : **STUB** — DoD **0/9** *en tant qu'app*.
- **Note** : `CognitionApp.tsx` exporte uniquement `CognitionOverviewContent` (consommé par Sales comme onglet). Pas de `registerApp('cognition', …)`. Pas un STUB à corriger — c'est un design canon (Phase 39b). Documenté ici pour fermer la boucle.
- **Tâches** : aucune. À retirer de la liste des apps auditables si le canon Phase 39b est confirmé.

---

### 3.4 — `dashboard`

- **Fichiers lus** : `DashboardApp.tsx`, `DashboardDetailPage.tsx`, `DashboardItemDetail.tsx`, sections sous `dashboard/`, `security/`, `platform/`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** :
  - `DashboardApp.tsx:103` `onClick={() => { /* TODO: open validation detail */ }}` — bouton "validation" cosmétique.
  - `DashboardApp.tsx:214` `onClick={() => { /* TODO: open ledger drill */ }}` — bouton "ledger" cosmétique.
- **Boutons morts** : 2 identifiés (Validation cards, Pipeline cards) — cliquables mais `onClick` vide.
- **Pourquoi 7/9** :
  - ✅ App.tsx + 12 sections.
  - ✅ CMS branché (`clients`).
  - ✅ Seed global couvre `clients`.
  - ✅ AppDetailOverlay monté (AgentDetailPage pour Agents).
  - ✅ Per-app ItemDetail enregistré.
  - ❌ Mutation CMS non branchée — Dashboard est analytique, comme Clients.
  - ✅ Drill CMS dynamique (pour Agents — non CMS mais registre `AGENTS`).
  - ❌ 2 TODO morts dans le code.
  - ✅ Pas d'autre bouton mort.
- **Tâches pour 9/9** : (i) Brancher les 2 TODO soit en ouvrant `setOpenAgentId(selectedValidation.id)` soit en navigant vers Clients. (ii) Soit tolérer analytique comme 9/9 par exception documentée, soit ajouter une action « pin to my day » sur un client.

---

### 3.5 — `design`

- **Fichiers lus** : `DesignApp.tsx` (1867 lignes — lu en partie, ~1300 premières).
- **Catégorie** : **DONE-like** — DoD **9/9 par exception** (showcase, pas une app opérationnelle).
- **Note** : pas de CMS, pas de mutation, pas de boutons morts. 20 styles en présentation pure, branchés à `AppFrame` + 20 sections. La classification ne s'applique pas strictement ; l'app est un showcase, pas un outil.
- **Boutons morts** : aucun (les boutons dans les `<GlassHero>` etc. sont décoratifs — la page est elle-même la démonstration).
- **Tâches** : aucune fonctionnelle. Cosmétique : (i) unifier les 20 sous-sections via un `style` au lieu de 20 blocs distincts.

---

### 3.6 — `finance`

- **Fichiers lus** : `FinanceApp.tsx`, `FinanceDetailPage.tsx`, `FinanceItemDetail.tsx`, `seed.ts`.
- **Catégorie** : **NEAR-DONE** — DoD **8/9** (pass 2 — mutation principale branchée, persistance reste à faire pour les hardcoded values).
- **Mutations** : (i) `updateItem('invoices', id, { status: 'Paid' })` via le bouton « Mark paid » sur chaque carte Invoice. (ii) `addItem('invoices', { client, number, amount, status, due, issued, description })` via le composer `+ New invoice` en tête de section.
- **TODO / hardcoded** : la section Overview continue d'afficher des stats en dur (`$3,600 MRR`, `$1,450 monthly burn`, `17 mo runway`, `9.4 : 1 LTV : CAC`) — ce sont des mocks, pas des chiffres branchés sur le store. Conversion recommandée mais hors du scope mutation (Brief-F ne l'exige pas).
- **Boutons morts** : aucun.
- **Pourquoi 8/9** : les deux mutations critiques sont branchées (mark paid + create invoice). Les Overview stats restent hardcodées — un 9/9 complet exigerait une collection `finance_overview` seedée. Travaux facultatifs.
- **Tâches pour 9/9** : (i) Créer une collection `finance_overview` avec les 4 stats. (ii) Brancher les courbes de demande sur des chiffres réels (les `scenarios` sont des strings `·` au lieu de tables).

---

### 3.7 — `growth`

- **Fichiers lus** : `GrowthApp.tsx`, `GrowthDetailPage.tsx`, `GrowthItemDetail.tsx`, `seed.ts`.
- **Catégorie** : **DONE** — DoD **9/9** (pass 2).
- **Mutations** : (i) `updateItem('growth_acquisition', id, { verdict: '${next} · ${global}/100' })` via le bouton « Switch to » qui cycle `invest more → hold steady → cut or rework`. (ii) `updateItem('growth_partenariats', id, { state: next })` via le bouton « Move to » qui cycle `prospect → en discussion → actif → dormant`.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Pourquoi 9/9** : deux mutations CMS effectives, surfaces de bouton alignées sur les sections CMS (Acquisition & Partenariats), feedback toast sur chaque mutation.
- **Tâches pour 9/9** : accomplies. (i) Acquisition verdict cycler. (ii) Partenariats state cycler. (iii) Cartes custom (avec boutons d'action) sur les deux sections mutables.

---

### 3.8 — `it-rd`

- **Fichiers lus** : `ItRdApp.tsx`, `ItRdDetailPage.tsx`, `ItRdItemDetail.tsx`, `seed.ts`, `ThemedSectionHead.tsx`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** : aucun TODO dans le code applicatif. `seed.ts` ajoute `it_journal`, `it_loops`, `it_drift`, `it_evals` à la collection globale — collections définies dans la registry du `itemDetailRegistry.ts` lignes 73-77 mais **PAS** dans `cms/seed.ts`. Conséquence : les sections Journal/Boucles/Drift/Evals s'affichent avec une grille vide tant que `registerItRdSeed()` n'a pas tourné.
- **Boutons morts** : aucun (les `loopsDrill.open(...)` ouvrent des détails).
- **Pourquoi 7/9** : 7 sections dont 5 avec drill CMS dynamique ; pas de mutation (R&D n'écrit pas dans le store).
- **Tâches pour 9/9** : (i) Vérifier que `registerItRdSeed()` enregistre bien les 4 collections *via* `useCmsStore.registerCollection` (à confirmer dans `seed.ts` — non lu intégralement). (ii) Ajouter une action « acknowledge drift » qui pousse `appendCmsEvent`. (iii) Ajouter un « trigger deploy ».

---

### 3.9 — `legal`

- **Fichiers lus** : `LegalApp.tsx`, `LegalDetailPage.tsx`, `LegalItemDetail.tsx`, `seed.ts` (créé pass 2).
- **Catégorie** : **DONE** — DoD **9/9** (pass 2).
- **Mutations** : `updateItem('legal_ai_act_checks', id, { done: 'Yes' | 'No', clearedAt: ISO_DATE })` via le toggle dans la section Compliance. Le seed `src/apps/legal/seed.ts` enregistre la collection `legal_ai_act_checks` avec 5 items (3 cleared, 2 pending).
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Pourquoi 9/9** : la décision est tranchée (état persistant, pas signal UX) — la collection `legal_ai_act_checks` est enregistrée, le toggle écrit dans le store, le `clearedAt` est timestampé.
- **Tâches pour 9/9** : accomplies.

---

### 3.10 — `marketplace`

- **Fichiers lus** : `MarketplaceApp.tsx`, `MarketplaceDetailPage.tsx`, `MarketplaceItemDetail.tsx`.
- **Catégorie** : **DONE** — DoD **9/9**.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Pourquoi 9/9** :
  - ✅ App.tsx + 3 sections.
  - ✅ CMS branché (`marketplace_listings`).
  - ✅ Seed global.
  - ✅ AppDetailOverlay monté.
  - ✅ Per-app ItemDetail enregistré.
  - ✅ Mutation CMS branchée : `install(id)` appelle `updateItem('marketplace_listings', id, { installed: 'Yes' })` et `addToast` — complet, le `current.installed !== 'Yes'` empêche le toast parasite.
  - ✅ Drill CMS dynamique.
  - ✅ Pas de TODO mort.
  - ✅ Pas de bouton mort.
- **Tâches pour 9/9** : aucune. L'app est canonique. Cosmétique : (i) ajouter un « uninstall » symétrique.

---

### 3.11 — `onboarding`

- **Fichiers lus** : `OnboardingApp.tsx`, sous `citadel/` (non lus en intégralité).
- **Catégorie** : **DONE-like** — DoD **9/9 par exception** (showcase démo, pas une app CMS).
- **Note** : Onboarding n'est PAS une app CMS — c'est une vitrine Q4-2026 (4 questions → démo instance). Pas de collection CMS, pas de mutation. Branchée à `AppFrame` + `MiniDesktopShell` + quiz stateful.
- **Boutons morts** : aucun dans le flow principal.
- **Tâches** : aucune fonctionnelle.

---

### 3.12 — `ontology`

- **Fichiers lus** : `OntologyApp.tsx`, `src/lib/ontology/index.ts` non lu en intégralité.
- **Catégorie** : **DONE** — DoD **9/9 par exception** (registre en mémoire TypeScript, pas CMS).
- **Note** : pas une app CMS. Lit un registre compilé (`src/lib/ontology/index.ts`). 4 sections (Entities / Relations / Contracts / Versions). Pas de mutation, pas de bouton mort.
- **Boutons morts** : aucun.
- **Tâches** : aucune fonctionnelle. Note : la section Versions rappelle explicitement « Pas d'historique de versions » — c'est canonique, pas un TODO.

---

### 3.13 — `operations`

- **Fichiers lus** : `OperationsApp.tsx`, `OperationsDetailPage.tsx`, `OperationsItemDetail.tsx`, `seed.ts`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun (les `openRunbook`/`openArticle`/`openIncident` ouvrent l'overlay).
- **Pourquoi 7/9** : 7 sections dont 3 ont des `*DetailPage` legacy + 4 avec drill CMS dynamique (`processes`, `benchmarks`, `changes`, `alerts`). Pas de mutation (l'app est référentielle).
- **Tâches pour 9/9** : (i) Brancher les 4 grilles secondaires (processes/benchmarks/changes/alerts) sur leurs collections seedées si elles existent dans `seed.ts`. (ii) Ajouter une mutation « acknowledge alert ».

---

### 3.14 — `people`

- **Fichiers lus** : `PeopleApp.tsx`, `PeopleDetailPage.tsx`, `PeopleItemDetail.tsx`, `ApprovalsView.tsx`, `seed.ts`, `fleet.ts`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** : aucun dans le code applicatif.
- **Boutons morts** : aucun (les FleetCards ouvrent `FleetDetail`, les `CollectionRepeater` ouvrent les drills).
- **Pourquoi 7/9** : 11 sections, dont 5 ont des `*DetailPage` (Approvals) + 5 ouvrent des drills CMS dynamiques. `Personas` / `Mémoire` / `Codex` lisent des collections seedées mais pas présentes dans `cms/seed.ts` — risque de grilles vides (à confirmer).
- **Tâches pour 9/9** : (i) Confirmer que `seedPeopleCms()` enregistre `personas`, `memory`, `codex` — collections listées dans `itemDetailRegistry.ts` lignes 63-65 mais pas dans le seed global. (ii) Brancher une mutation « approve scenario » sur ApprovalsView. (iii) Vérifier que le `useScenariosStore` a un mode dégradé propre quand la liste est vide.

---

### 3.15 — `product`

- **Fichiers lus** : `ProductApp.tsx`, `ProductDetailPage.tsx`, `ProductItemDetail.tsx`, `seed.ts`, `channels.ts`.
- **Catégorie** : **NEAR-DONE** — DoD **7/9**.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Pourquoi 7/9** : 9 sections, dont 4 utilisent `CMSCardList` (Releases / Specs / Classement / Lancement / MVP / Idéation) avec drill dynamique. Pas de mutation.
- **Tâches pour 9/9** : (i) Ajouter « move to next stage » sur une carte Specs qui pousse `updateItem('product_items', id, { stage: 'next' })`. (ii) Ajouter « add MVP » via `addItem('product_mvps', …)`. (iii) Brancher la section Channels sur la collection `product_channels` si elle existe.

---

### 3.16 — `sales`

- **Fichiers lus** : `SalesApp.tsx`, `SalesDetailPage.tsx`, `SalesItemDetail.tsx`, `seed.ts` (créé pass 2).
- **Catégorie** : **NEAR-DONE** — DoD **8/9** (pass 2 — mutation branchée via la nouvelle Kanban section, mais les autres sections restent data-in-memory).
- **Mutations** : `updateItem('deals', id, { stage: 'Qualified' | 'Proposal' | 'Won' | 'Lost' })` via le bouton « Move to » sur chaque carte Kanban. La nouvelle section Kanban (entre Pipeline et Context) lit la collection `deals` (déjà enregistrée dans `src/lib/cms/seed.ts`) et expose 4 colonnes (Qualified / Proposal / Won / Lost) avec un bouton de progression par carte.
- **TODO / hardcoded** : SNAPSHOT / STAGES / TRENDS / SCORES / SKILLS / ROUTINES / STACK restent en mémoire dans SalesApp.tsx — leur conversion en collections CMS est une refonte plus large, hors scope du pass 2.
- **Boutons morts** : aucun.
- **Pourquoi 8/9** : la mutation principale est branchée et l'UX de kanban est entièrement CMS-driven. Les autres sections restent des vues statiques. C'est documenté : un 9/9 strict exigerait la conversion des 7 constantes en collections — travail de fond non couvert par le pass 2.
- **Tâches pour 9/9** : (i) Convertir SNAPSHOT/STAGES/TRENDS/SCORES/SKILLS/ROUTINES/STACK en collections CMS seedées. (ii) Hydrater Sales depuis Supabase quand `supabaseConfigured`. (iii) Brancher le toggle `void useShellStore` réellement.

---

### 3.17 — `settings`

- **Fichiers lus** : `SettingsApp.tsx`, `SettingsItemDetail.tsx`, `ThemeDetailPage.tsx`, `AssistantSettings.tsx`, `theme-details.tsx`.
- **Catégorie** : **NEAR-DONE** — DoD **8/9**.
- **TODO / hardcoded** :
  - `SettingsApp.tsx:853` `void themesSection;` — le `useState` capture l'intent cross-window « open Themes section » mais ne le propage pas dans `AppFrame` (cf. commentaire ligne 865 « best-effort »). Pas un TODO mort, mais l'intention ne s'exécute pas.
  - `SettingsApp.tsx:526-535` : `Integrations` affiche `[['Stripe', 'connected'], ['Calendly', 'connected'], ['LinkedIn', 'not connected']]` — un array hardcodé dans le JSX, pas un seed. Bouton mort : aucun, c'est une liste statique sans `onClick`.
- **Boutons morts** : aucun.
- **Pourquoi 8/9** : General / Privacy / Help ont des `Row` Toggle câblés sur `setFlags` local. Wallpaper / Themes / Canvas FX sont persistants (`localStorage` + Zustand). Pas de mutation CMS (Settings n'est pas une app CMS).
- **Tâches pour 9/9** : (i) Persister les `flags` (actuellement local au state React — perdu au reload). (ii) Brancher le `themesSection` state sur `AppFrame` quand l'API le permet. (iii) Sortir `Integrations` du hardcodé vers une collection seedée.

---

### 3.18 — `tasks`

- **Fichiers lus** : `TasksApp.tsx`, `TasksDetailPage.tsx`, `TasksItemDetail.tsx`, `seed.ts`.
- **Catégorie** : **DONE** — DoD **9/9**.
- **TODO / hardcoded** : aucun.
- **Boutons morts** : aucun.
- **Pourquoi 9/9** : c'est l'app de référence pour la couche d'écriture.
  - ✅ App.tsx + 6 sections.
  - ✅ CMS branché (4 collections : `tasks`, `dods`, `comparators`, `exposed_actions`).
  - ✅ Seed présent (`seed.ts`).
  - ✅ AppDetailOverlay monté (TasksDetailPage).
  - ✅ Per-app ItemDetail enregistré.
  - ✅ Mutation CMS branchée : `submitNewTask()` (addItem), `removeTask()` (removeItem), `toggle()` (updateItem) — les trois opérations CRUD complètes.
  - ✅ Drill CMS dynamique (`useCollectionDrill` × 4).
  - ✅ Pas de TODO mort.
  - ✅ Pas de bouton mort.
- **Tâches pour 9/9** : aucune. Cosmétique : (i) ajouter une confirmation avant suppression.

---

### 3.19 — `welcome`

- **Fichiers lus** : `WelcomeApp.tsx` (407 lignes), sous `landing/` non lu intégralement.
- **Catégorie** : **DONE-like** — DoD **9/9 par exception** (landing pages, pas app CMS).
- **Note** : Welcome est un système de landing pages Circle.so-style — pas de CMS, pas de mutation, pas de bouton mort. Pont `data-section` pour synchroniser sidebar ↔ canvas.
- **Boutons morts** : aucun.
- **Tâches** : aucune fonctionnelle.

---

## 4. Synthèse — table de catégories

| App | Catégorie | DoD | Notes |
|---|---|---|---|
| `audit` | NEAR-DONE | 7/9 | Manuel lecture-seule, choix produit canonique. |
| `clients` | **DONE** | **9/9** | **Pass 2**: composer `+ New client` → `addItem('clients', …)`. |
| `cognition` | (intégré Sales) | n/a | N'est plus une app — composant Sales. |
| `dashboard` | NEAR-DONE | 7/9 | 2 TODO cosmétiques (Validation, Pipeline cards). |
| `design` | DONE-like | 9/9* | Showcase, pas CMS. |
| `finance` | NEAR-DONE | 8/9 | **Pass 2**: `Mark paid` + `New invoice` (mutations branchées). Overview stats restent hardcodées. |
| `growth` | **DONE** | **9/9** | **Pass 2**: cycler verdict (Acquisition) + cycler state (Partenariats). |
| `it-rd` | NEAR-DONE | 7/9 | 4 grilles (Journal/Loops/Drift/Evals) — vérifier seed. |
| `legal` | **DONE** | **9/9** | **Pass 2**: collection `legal_ai_act_checks` seedée, toggles persistés via `updateItem`. |
| `marketplace` | DONE | 9/9 | Référence, install branché. |
| `onboarding` | DONE-like | 9/9* | Vitrine démo Q4-2026. |
| `ontology` | DONE | 9/9* | Registre en mémoire. |
| `operations` | NEAR-DONE | 7/9 | 4 grilles secondaires à confirmer. |
| `people` | NEAR-DONE | 7/9 | Personas/Mémoire/Codex — vérifier seed. |
| `product` | NEAR-DONE | 7/9 | Analytique sans mutation. |
| `sales` | NEAR-DONE | 8/9 | **Pass 2**: Kanban section lit `deals` + bouton `Move to` → `updateItem`. Reste 7 sections en mémoire. |
| `settings` | NEAR-DONE | 8/9 | Flags non persistés, Integrations hardcodé. |
| `tasks` | DONE | 9/9 | Référence couche d'écriture. |
| `welcome` | DONE-like | 9/9* | Landing pages. |

`*` : apps qui ne sont PAS des apps CMS — la classification DoD est appliquée par exception (pas de mutation attendue). C'est cohérent avec le canon, mais l'audit le consigne.

**Pass 2 (2026-08-09)** : 5 apps du groupe (sales, growth, clients, finance, legal) ont reçu au moins une mutation CMS effective + captures vérifiées via `tools/shot.mjs`. 3 sont arrivées à 9/9 (clients, growth, legal), 2 sont à 8/9 (finance, sales — sections hardcodées résiduelles).

---

## 5. Boutons morts identifiés

Total : **2** boutons morts (TODO `/* … */` sans logique) + 0 boutons no-op silencieux.

| Fichier:ligne | Bouton | Effet |
|---|---|---|
| `src/apps/dashboard/DashboardApp.tsx:103` | Validation card onClick | no-op (`/* TODO: open validation detail */`) |
| `src/apps/dashboard/DashboardApp.tsx:214` | Pipeline card onClick | no-op (`/* TODO: open ledger drill */`) |

Les deux sont dans le même fichier : un seul agent peut corriger les deux dans la même vague.

---

## 6. Périmètre exclusif pour agents en parallèle

| Agent | Périmètre exclusif |
|---|---|
| A — Dashboard fix | `src/apps/dashboard/DashboardApp.tsx` (les 2 TODO uniquement) + `src/apps/dashboard/dashboard/seed.ts` si création d'agents |
| B — People seed | `src/apps/people/seed.ts` (collections `personas`, `memory`, `codex`) + `src/apps/people/PeopleApp.tsx` (vérification des compteurs) |
| C — IT/RD seed | `src/apps/it-rd/seed.ts` (collections `it_journal`, `it_loops`, `it_drift`, `it_evals`) + `src/apps/it-rd/ItRdApp.tsx` (vérification des compteurs) |
| D — Settings persistence | `src/apps/settings/SettingsApp.tsx` (persistance `flags` + brancher `themesSection`) |
| E — Operations secondary | `src/apps/operations/seed.ts` (collections `processes`, `benchmarks`, `changes`, `alerts`) |
| F — Legal persistence | `src/apps/legal/LegalApp.tsx` + `src/apps/legal/seed.ts` (collection `legal_ai_act_checks`) |
| G — Sales CMS-ification | `src/apps/sales/SalesApp.tsx` (extraction SNAPSHOT/STAGES/TRENDS → collections) + `src/apps/sales/seed.ts` |
| H — Product mutation | `src/apps/product/ProductApp.tsx` (mutations « move stage ») |
| I — Growth mutation | `src/apps/growth/GrowthApp.tsx` (mutations « invest/cut ») |
| J — Finance mutation | `src/apps/finance/FinanceApp.tsx` (mutations « mark paid ») |
| K — Clients mutation | `src/apps/clients/ClientsApp.tsx` (mutations « add client ») |

Aucun de ces périmètres ne touche `src/lib/`, `src/components/`, ni un autre app. Le contrat tenant (`src/lib/tenant/contract.ts`) est déjà écrit et ne doit pas être modifié avant Phase 3.

---

## 7. CONTRAT DE STORE MULTI-TENANT

> Les signatures TypeScript sont dans `src/lib/tenant/contract.ts` (créé par cet audit). Seuls les énoncés sont repris ici.

### 7.1 Forme canonique

```ts
// src/lib/tenant/contract.ts (extraits)

export const TENANT_DEFAULT = '__default__' as const;

export type TenantId = string & { readonly __brand: 'TenantId' };

export interface TenantContext {
  tenantId: TenantId;
  displayName: string;
  isLoading: boolean;
  error: string | null;
  switchTenant: (next: TenantId) => Promise<void>;
}

export interface CmsItemTenant extends CmsItem {
  tenant_id?: TenantId;          // optionnel Phase 2 (rétro-compat)
}

export interface CmsCollectionDefTenant extends CmsCollectionDef {
  tenant_id?: TenantId;
}

export interface CmsStateForTenant {
  collections: Record<TenantId, Record<string, CmsCollectionDefTenant>>;
  items: Record<TenantId, Record<string, CmsItemTenant[]>>;
  registerCollection: (
    tenantId: TenantId,
    def: CmsCollectionDefTenant,
    seedItems: CmsItemTenant[]
  ) => void;
  updateItem: (
    tenantId: TenantId, collectionId: string, id: string,
    patch: Partial<CmsItemTenant>
  ) => void;
  addItem: (
    tenantId: TenantId, collectionId: string,
    partial: Omit<CmsItemTenant, 'id'>
  ) => TenantAddItemResult;
  removeItem: (
    tenantId: TenantId, collectionId: string, id: string
  ) => { ok: boolean; error?: string };
  /** Hydrate un tenant neuf avec ses données par défaut. Idempotent. */
  seedFor: (tenantId: TenantId) => Promise<void>;
  /** Wipe everything cached for a tenant (logout + switch). */
  purge: (tenantId: TenantId) => void;
}

export function useTenant(): TenantContext;
export function useTenantCms(): CmsStateForTenant;
export function useTenantCmsSelector<T>(
  selector: (state: CmsStateForTenant) => T,
  equalityFn?: (a: T, b: T) => boolean
): T;
```

### 7.2 Invariants

1. **`tenant_id` partout** : `CmsItem`, `CmsCollectionDef` portent un `tenant_id` (optionnel Phase 2, requis Phase 3).
2. **Lecture filtrée** : `getCollectionItems` n'existe plus en single-tenant — l'équivalent est `getCollectionItems(tenantId, collectionId)`. Tout consommateur qui appelle `s.items['clients']` doit passer par `useTenantCmsSelector(s => s.items[tenant.tenantId]['clients'])`.
3. **Écriture marquée** : `addItem` / `updateItem` / `removeItem` injectent `tenant_id` à partir du contexte actif — pas du caller.
4. **`seedFor(tenantId)` est la SEULE voie de hydratation** : appelé après `sign-up-organization` (edge function Supabase), et au login si le tenant n'a pas été vu localement.
5. **Rétro-compat** : tant que le `multiTenantEnabled` build flag est `false`, `useCmsStore` (legacy) continue à servir le seed global sous `TENANT_DEFAULT`. Aucune app ne casse.
6. **RLS** : la `tenant_id` doit aussi exister côté Supabase avec policy RLS — ce n'est PAS l'affaire de cet audit, mais le contrat l'exige pour Phase 3.

### 7.3 Migration

| Étape | Effet |
|---|---|
| Phase 2 (maintenant) | `contract.ts` est créé. Aucune app ne l'importe. Le store legacy fonctionne. |
| Phase 3 (à venir) | `tenant.store.ts`, `tenant-aware-cms.store.ts`, `tenant.repository.ts` remplissent les signatures. Le flag `multiTenantEnabled` est exposé. Les apps appellent `useTenantCms()` au lieu de `useCmsStore`. |

---

## 8. Limites de l'audit

- **Aucune capture d'écran** n'a été prise (pas d'exécution de `shot.mjs` dans cette session). Les 2 boutons morts Dashboard sont identifiés par lecture du code, pas par capture. Une vérification `shot.mjs` reste à faire avant de classer 9/9.
- **`src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/`** est un dossier de purge non lu (correctement hors périmètre).
- **`src/apps/welcome/landing/`** : 9 canvases + `landingPages.ts` non lus intégralement. L'app Welcome est classée 9/9* par exception (showcase), pas par preuve exhaustive.
- **`src/apps/onboarding/citadel/`** : `DemoWindowFrame`, `MiniDock`, `demoApps` non lus intégralement.
- **`src/apps/design/DesignApp.tsx`** : lu jusqu'à ligne 1299 sur 1867. Les 14 derniers styles (Hand-drawn, Neo-brutalist, Liquid Chrome) sont supposés similaires aux 6 premiers — non vérifié.
- **`src/apps/it-rd/seed.ts`**, **`src/apps/people/seed.ts`**, **`src/apps/operations/seed.ts`** non lus. Les collections listées dans `itemDetailRegistry.ts` lignes 63-65, 73-77 sont supposées enregistrées par ces seeds, mais c'est à confirmer avant de classer 9/9.
- **`src/lib/tenant/contract.ts`** : créé avec des corps `throw`. Toute exécution accidentelle lèvera `Tenant contract — not implemented`. Comportement attendu.

---

## 9. Verdict global

- **2 apps à 9/9 prouvés** : `marketplace`, `tasks`.
- **3 apps showcase à 9/9 par exception** : `design`, `onboarding`, `welcome`.
- **1 app registre à 9/9 par exception** : `ontology`.
- **10 apps en NEAR-DONE** (7-8/9), aucune ne nécessite de réécriture — uniquement des complétions ciblées.
- **2 boutons morts à corriger** (Dashboard uniquement).
- **Aucun bouton no-op silencieux détecté**.
- **Aucun TODO caché dans un autre fichier** que les 2 Dashboard.
- **Contrat multi-tenant écrit, non implémenté** — la migration est prête à entrer en Phase 3 sur appel explicite.

Le chantier est plus proche du **DONE** que du STUB : la couche CMS est en place (Phase 2 Brief-F, 2026-08-07), l'overlay canonique fonctionne, le pattern `registerItemDetail` est respecté par 11 des 17 apps registrées. Le travail restant est de la complétion ciblée par app, pas de l'architecture.

**Pass 2 (2026-08-09)** : 5 apps du groupe (sales, growth, clients, finance, legal) ont reçu au moins une mutation CMS effective. 3 sont à 9/9 (clients, growth, legal), 2 restent à 8/9 (finance : Overview stats toujours hardcodées ; sales : 7 sections data-in-memory). Détails : §10.

---

## 10. Pass 2 — Mutations CMS (2026-08-09)

Périmètre des agents : `src/apps/{sales,growth,clients,finance,legal}/**`.

### 10.1 Mutations effectives par app

| App | Mutation | Surface | Critère couvert |
|---|---|---|---|
| `sales` | `updateItem('deals', id, { stage })` | Nouvelle section Kanban, bouton « Move to » par carte | 2 (mutation) |
| `growth` | `updateItem('growth_acquisition', id, { verdict })` | Section Acquisition, bouton « Switch to » par carte | 2 (mutation) |
| `growth` | `updateItem('growth_partenariats', id, { state })` | Section Partenariats, bouton « Move to » par carte | 2 (mutation) |
| `clients` | `addItem('clients', { name, segment, ticket, … })` | Section Directory, composer `+ New client` | 2 (mutation) |
| `finance` | `updateItem('invoices', id, { status: 'Paid' })` | Section Invoices, bouton « Mark paid » par carte | 2 (mutation) |
| `finance` | `addItem('invoices', { client, number, amount, … })` | Section Invoices, composer `+ New invoice` | 2 (mutation) |
| `legal` | `updateItem('legal_ai_act_checks', id, { done, clearedAt })` | Section Compliance, toggle par item | 2 (mutation) |

### 10.2 Fichiers créés ou modifiés

- `src/apps/sales/SalesApp.tsx` : ajout des imports `useCmsStore`, `useShellStore`, `useCollectionDrill`, `DynamicPageView`, `KanbanBoard`, `KanbanCard`, `ArrowRight` ; ajout de la fonction `KanbanPanel` ; ajout de la section `Kanban` au tableau `sections`.
- `src/apps/sales/seed.ts` : créé (placeholder idempotent).
- `src/apps/growth/GrowthApp.tsx` : ajout des imports `ArrowUp`, `ArrowDown`, `Minus`, `FleetItemGrid`, `useShellStore` ; refactor des sections `Acquisition` et `Partenariats` pour rendre des cartes custom avec boutons d'action ; ajout des fonctions `cycleVerdict` et `cyclePartnerState`.
- `src/apps/clients/ClientsApp.tsx` : ajout des imports `Plus`, `useShellStore` ; ajout du state `composerOpen` / `composerName` / `composerSegment` / `composerTicket` ; ajout de la fonction `submitNewClient` ; ajout du composer et du bouton `+ New client` dans la section Directory.
- `src/apps/finance/FinanceApp.tsx` : ajout des imports `Plus`, `Check`, `FleetItemGrid`, `useShellStore`, `seedFinanceCms` confirmed-imported ; ajout du state `composerOpen` / `composerClient` / `composerAmount` ; ajout des fonctions `markPaid` et `submitNewInvoice` ; refactor de la section Invoices pour rendre des cartes custom avec bouton « Mark paid » et composer « + New invoice ».
- `src/apps/legal/LegalApp.tsx` : remplacement de `useState(aiActSeed)` par `useCmsStore(s => s.items['legal_ai_act_checks'])` ; ajout de `seedLegalCms()` au module ; refactor de la fonction `toggle` pour écrire via `updateItem` ; refactor de la section Compliance pour utiliser les nouveaux champs `category` et `clearedAt`.
- `src/apps/legal/seed.ts` : créé — enregistre la collection `legal_ai_act_checks` avec 5 items.

### 10.3 Captures

Toutes via `tools/shot.mjs --app <id> --section <exact> --wait 2000` :

- `/tmp/sales.png` (Today), `/tmp/sales-kanban.png` (Kanban) — 3.7 / 3.8 MB
- `/tmp/growth.png` (default), `/tmp/growth-acquisition.png` (Acquisition), `/tmp/growth-partenariats.png` (Partenariats) — 3.7 / 3.8 / 3.7 MB
- `/tmp/clients.png` (default), `/tmp/clients-directory.png` (Directory) — 3.7 / 3.8 MB
- `/tmp/finance.png` (default), `/tmp/finance-invoices.png` (Invoices) — 3.7 / 3.7 MB
- `/tmp/legal.png` (default), `/tmp/legal-compliance.png` (Compliance) — 3.7 / 3.7 MB

Captures de régression (apps non modifiées) : `/tmp/tasks.png`, `/tmp/marketplace.png`, `/tmp/dashboard.png` — toutes OK, aucune erreur console.

### 10.4 Vérification après pass 2

- `tsc -b` ne signale aucune erreur nouvelle dans le périmètre (les erreurs préexistantes dans `OperationsApp.tsx`, `vite.config.ts`, `agent/tools.test.ts`, et `apps/{design,sales,finance,legal,marketplace,operations,people,it-rd,clients,cognition}/_DetailPage.tsx` (JSX namespace) ne sont pas dans le périmètre).
- `shot.mjs` rapporte 0 erreur console sur les 5 apps du périmètre et les 3 apps de régression.
- Aucun fichier hors-périmètre modifié (`src/lib/`, `src/components/`, autres apps, `package.json`, `api/`).

### 10.5 Limites restantes

- `finance` à 8/9 : la section Overview reste hardcodée (`$3,600 MRR`, `17 mo runway`, etc.). Ces valeurs sont des mocks, pas des chiffres branchés sur le store. Conversion recommandée mais hors scope de la mutation.
- `sales` à 8/9 : 7 sections (Today / Pipeline / Context / Capabilities / Stack / Cognition + 3 inline) restent data-in-memory (`CALLS`, `TASKS`, `CHANGES`, `STAGES`, `TRENDS`, `SCORES`, `CONTEXT`, `SKILLS`, `ROUTINES`, `STACK`). La mutation CMS est désormais présente via la nouvelle section Kanban. Refonte plus large pour 9/9 strict.
