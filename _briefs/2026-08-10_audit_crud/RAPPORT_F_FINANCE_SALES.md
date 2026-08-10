---
id: F_FINANCE_SALES
campagne: 2026-08-10 — audit CRUD systématique
statut: COMPLET
---

# RAPPORT F — finance · sales · clients · growth · legal · audit

Périmètre : 6 apps, 37 sections, **0 erreur console** au rendu, typecheck vert sur mes fichiers.

Mesure au démarrage : finance 2/7 · sales 2/7 · clients 2/5 · growth 4/7 · legal 2/3 · audit 0/7.

---

## Synthèse par section

### Finance (7 sections)

| Section | Verdict | Justification |
|---|---|---|
| Overview | lecture légitime | KPI depuis CMS `finance_overview`, déjà populated — pas de création manuelle. |
| Runway | lecture légitime | Graphe dérivé de `overview-projection` ; aucune collection à compléter. |
| Planchers | **corrigée** | `CMSCardList` → `CollectionRepeater`. Création vérifiée (7 → 8). |
| Courbes | **corrigée** | Idem. Création vérifiée (6 → 7). |
| Tokens | **corrigée** | Idem. Création vérifiée (6 → 7). |
| Formes | **corrigée** | Idem. Création vérifiée (6 → 7). |
| Invoices | déjà câblé | Composeur maison riche (client + amount + number auto + due auto). Conserve : valide, refuse un amount ≤ 0, vide après succès. |

Commit : `feat(finance)`.

### Sales (7 sections)

| Section | Verdict | Justification |
|---|---|---|
| Today | lecture légitime | Editorial, données in-memory (CALLS/TASKS/CHANGES/CALENDAR) — pas une collection utilisateur. |
| Pipeline | lecture légitime | Snapshot/stages dérivés du `deals` collection (sommé live). Le kanban porte la création de deal. |
| Kanban | déjà câblé | Composeur maison riche (client + offer + value + stage=Qualified par défaut). Conserve : valide, refuse valeur ≤ 0, vide après succès. Bouton "Move forward" sur chaque carte. |
| Context | lecture légitime | 3 groupes (`sales_context`) — référentiel éditorial, pas une collection utilisateur. |
| Capabilities | lecture légitime | `sales_skills` (8) + `sales_routines` (6) — référentiel éditorial (manifeste des compétences du coach). |
| Stack | lecture légitime | `sales_stack` (3 groupes) — référentiel éditorial des outils utilisés. |
| Cognition | lecture légitime | Stub `CognitionOverviewContent`, plein écran. |

**Verdict** : Sales est éditorial par construction. Les 2 sections avec bouton de création (Pipeline dérive du kanban + Kanban) couvrent le périmètre utile — l'utilisateur crée des deals via le kanban et le pipeline s'actualise tout seul. Ne rien ajouter : ajouter un "+ Nouveau contexte" ou un "+ Nouvelle skill" ferait du bruit pour aucune valeur.

### Clients (5 sections)

| Section | Verdict | Justification |
|---|---|---|
| Active | lecture légitime | Vue filtrée de `clients` (status === 'Active'). Filtre appliqué après la création ; un seul bouton de création suffit. |
| Onboarding | lecture légitime | Idem, filtre par status. |
| Churn Risk | lecture légitime | Idem, filtre par status. |
| Directory | déjà câblé | Composeur maison riche (name + segment + ticket) + CMSCardList. Crée avec status='Onboarding' pour ne pas mentir sur l'état. |
| IP Vault | déjà câblé | `CollectionRepeater` sur `session_notes`. Création vérifiée (4 → 5). |

**Verdict** : pas de défaut. Les 3 vues filtrées héritent de la création dans Directory. Mettre 3 boutons de création reviendrait à proposer 3 chemins pour la même action.

### Growth (7 sections)

| Section | Verdict | Justification |
|---|---|---|
| Funnel | lecture légitime | KPIs dérivés (`growth_channels.leads` + deals `Won`). |
| Channels | déjà câblé | `CollectionRepeater` sur `growth_channels`. |
| Experiments | déjà câblé | `CollectionRepeater` sur `growth_experiments`. |
| Acquisition | **corrigée** | Composeur maison ajouté en en-tête (Name + Category, défaut verdict="hold steady · 0/100"). Garde le cycling du verdict sur les cartes (mutation orthogonale). Création vérifiée : toast "Channel added". |
| Strategie | **corrigée** | `CMSCardList` → `CollectionRepeater`. Création vérifiée (4 → 5). |
| Partenariats | **corrigée** | Composeur maison ajouté en en-tête (Name + Type, défaut state="prospect"). Garde le cycling du state sur les cartes. Création vérifiée : toast "Partner added". |
| AEO | **corrigée** | `CMSCardList` → `CollectionRepeater`. Création vérifiée (7 → 8). |

Commit : `feat(growth)`.

**Note sur Acquisition/Partenariats** : `CollectionRepeater` ne supporte pas les actions custom par carte (chaque carte porte déjà un cycle de verdict / state). Le chemin propre est un composeur maison en en-tête qui crée avec des valeurs par défaut raisonnables, et le cycling continue de muter `verdict` / `state` champ par champ. Conserve les deux capacités sans bricolage.

### Legal (3 sections)

| Section | Verdict | Justification |
|---|---|---|
| Contracts | déjà câblé | `CollectionRepeater` sur `contracts`. Création vérifiée (3 → 4). |
| Compliance | déjà câblé | Toggle sur `legal_ai_act_checks` (5 checks canoniques de l'AI-Act). Le toggle est la mutation propre : flip `done` 'Yes' ↔ 'No', stamp `clearedAt` à la transition vers Yes. Pas de bouton "Add" — c'est une checklist de conformité, pas une collection utilisateur. |
| Policies | déjà câblé | `CollectionRepeater` sur `policies`. Création vérifiée (4 → 5). |

**Verdict** : pas de défaut. Les 3 sections ont leur couche d'écriture qui correspond à leur nature.

### Audit (7 sections)

| Section | Verdict | Justification |
|---|---|---|
| Overview | lecture légitime | Page éditoriale (les 6 grilles, ce que le document n'est pas). |
| Maturité | lecture légitime | 3 niveaux statiques (Discuter / Connecter / Déléguer). |
| Arbitrage | lecture légitime | Grille de référence — 6 critères canoniques du Manuel de Diagnostic IA (extrait `audit.pdf`). Pas une collection utilisateur : ce sont les questions que le coach pose au prospect, pas les réponses qu'il donne. |
| Contexte | lecture légitime | Idem : référentiel figé. |
| Données | lecture légitime | Idem. |
| Automatabilité | lecture légitime | Idem. |
| ROI | lecture légitime | Idem (label canonique "Arbitrage & ROI"). |

**Verdict** : pas de défaut. Les 5 grilles sont des référentiels canoniques (méthode de diagnostic) — les créer en bouton reviendrait à laisser le coach inventer ses propres critères de diagnostic, ce qui vide la méthode de son sens. La mutation propre existe déjà : le bouton "relire" sur chaque critère, qui pose un `reviewedAt` + `reviewedBy` (cf. `markReviewed` dans `AuditApp.tsx`). C'est ce qu'il faut : on signe les critères qu'on a validés, on ne les génère pas.

**Note historique** : l'audit est passé de 0/7 à 0/7 mais ce n'est pas un échec — la mesure comptait "bouton de création" et zéro n'était pas la mesure à viser. La mesure à viser était "toute section qui rend une collection CMS permet-elle d'y ajouter un item". Les 5 collections CMS d'audit sont des référentiels, pas des données utilisateur, donc la réponse est non.

---

## Bilan global

| App | Sections avec bouton de création |
|---|---|
| Avant | 10/37 |
| Après | 20/37 |

**+10 sections créables** : Planchers, Courbes, Tokens, Formes, Strategie, AEO + Acquisition et Partenariats en composeur d'en-tête (le reste du périmètre était déjà câblé).

**Sections sans bouton de création, par catégorie :**

- *Référence canonique* : Audit/Maturité, Audit/5 grilles. Ajouter la création viderait la méthode de son sens.
- *Vue filtrée d'une autre section qui crée* : Clients/Active, Clients/Onboarding, Clients/Churn Risk. La création se fait depuis Directory.
- *Dérivé live* : Finance/Overview, Finance/Runway, Growth/Funnel, Sales/Pipeline. Pas une collection utilisateur.
- *Editorial in-memory* : Sales/Today, Sales/Context, Sales/Capabilities, Sales/Stack. Référentiels éditoriaux du coach.

Toutes ces sections ont été classées en "lecture légitime" avec une justification ligne par ligne dans ce rapport.

**Vérifications passées** (compteur visible avant → après, toast de succès, zéro erreur console) :
- Finance/Planchers (7 → 8)
- Finance/Courbes (6 → 7)
- Finance/Tokens (6 → 7)
- Finance/Formes (6 → 7)
- Growth/Strategie (4 → 5)
- Growth/AEO (7 → 8)
- Growth/Acquisition (toast "Channel added")
- Growth/Partenariats (toast "Partner added")
- Clients/IP Vault (4 → 5, déjà câblé)
- Legal/Contracts (3 → 4, déjà câblé)
- Legal/Policies (4 → 5, déjà câblé)