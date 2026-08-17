---
id: RAPPORT_WORKSPACE_BRANCHES
campagne: 2026-08-15
phase: 5 — WorkSpaces versionnés, branche/PR/merge
artifacts: |
  _briefs/2026-08-15_WORKSPACE_BRANCHES/RAPPORT_WORKSPACE_BRANCHES.md
  supabase/migrations/2026-08-15_workspace_branches.sql
perimetre_exclusif_respecte: |
  src/lib/workspace/branches.ts            (nouveau)
  src/lib/workspace/branches.test.ts       (nouveau)
  src/lib/workspace/diff.ts                (nouveau)
  src/lib/workspace/diff.test.ts           (nouveau)
  src/lib/workspace/merge.ts               (nouveau)
  src/lib/workspace/merge.test.ts          (nouveau)
  src/lib/workspace/permissions.ts         (nouveau)
  src/lib/workspace/permissions.test.ts    (nouveau)
  src/lib/workspace/pr.ts                  (nouveau)
  src/lib/workspace/pr.test.ts             (nouveau)
  src/lib/workspace/snapshot.ts            (nouveau)
  src/lib/workspace/snapshot.test.ts       (nouveau)
  src/lib/workspace/store.ts               (nouveau — adaptateur in-memory)
  src/lib/workspace/types.ts               (nouveau — types partagés)
  src/components/workspace/BranchTree.tsx          (nouveau)
  src/components/workspace/InviteReviewer.tsx      (nouveau)
  src/components/workspace/PrViewer.tsx            (nouveau)
  src/apps/workspace/index.tsx                     (nouveau)
  src/stores/branches.store.ts                     (nouveau)
  src/components/ProfileWorkspaceSection.tsx       (étendu — bouton « Brancher »)
  _config/cms/workspace.ts                         (nouveau)
  supabase/migrations/2026-08-15_workspace_branches.sql
hors_perimetre: |
  src/lib/auth/memberships.ts (autre brief — MEMBERSHIPS)
  src/lib/audit/** (autre brief — AUDIT_LOG)
  src/lib/supabase.ts (autre brief — AUTH_FIX)
  src/lib/tenant/contract.ts (référencé par MEMBERSHIPS)
---

# RAPPORT_WORKSPACE_BRANCHES — 2026-08-15

## Ce qui a été livré

### Modules domain `src/lib/workspace/*`

Sept modules livrés, tous testés par 32 tests adversariaux (≥ 16 demandés).

| Module | Rôle | Tests |
|---|---|---|
| `types.ts` | Types partagés (Branch, Snapshot, Pr, PrReview, Diff, WorkspaceData) | — |
| `permissions.ts` | Matrice rôle × action + helpers (peutCreerBranche, etc.) | 7 |
| `snapshot.ts` | Sérialisation canonique + SHA-256 déterministe | 5 |
| `diff.ts` | Diff collections / items / membres | 6 |
| `branches.ts` | createBranch / listBranches / getMainBranch / snapshotBranch / deleteBranch | 8 |
| `pr.ts` | openPr / reviewPr / peutMerger | 4 |
| `merge.ts` | mergePr avec détection 3-way de conflits | 2 |
| `store.ts` | Adaptateur in-memory (sera remplacé par Supabase) | — |

### UI

| Fichier | Rôle |
|---|---|
| `src/components/workspace/BranchTree.tsx` | Vue arborescente des branches + PRs |
| `src/components/workspace/PrViewer.tsx` | Vue PR : titre, reviewers, diff inline, boutons |
| `src/components/workspace/InviteReviewer.tsx` | Modal d'invitation reviewers |
| `src/apps/workspace/index.tsx` | App WorkSpaces (AppFrame avec sections Aperçu / PRs) |
| `src/stores/branches.store.ts` | Zustand store UI pour les branches |
| `src/components/ProfileWorkspaceSection.tsx` | **étendu** : bouton « Brancher » en plus de « Enregistrer un espace » |

### Configuration & migration

| Fichier | Rôle |
|---|---|
| `_config/cms/workspace.ts` | Defaults : `MAIN_BRANCH_NAME`, `APPROVES_REQUIS = 2`, regex nom branche |
| `supabase/migrations/2026-08-15_workspace_branches.sql` | 4 tables + RLS + index + commentaires |

## Tableau des 16 tests obligatoires

| # | Nom dans brief | Test livré | État |
|---|---|---|---|
| 1 | `serialiser_deterministe` | `src/lib/workspace/snapshot.test.ts > serialiser_deterministe : même workspace → même hash` | OK |
| 2 | `restorer_inverse_serialiser` | `snapshot.test.ts > restorer_inverse_serialiser : aller-retour sans perte` | OK |
| 3 | `main_cree_automatiquement` | `branches.test.ts > main_cree_automatiquement : premier accès à un tenant crée main` | OK |
| 4 | `createBranch_owner_ok` | `branches.test.ts > createBranch_owner_ok : owner peut créer une branche` | OK |
| 5 | `createBranch_member_refuse` | `branches.test.ts > createBranch_member_refuse : member ne peut pas créer` | OK |
| 6 | `createBranch_nom_unique` | `branches.test.ts > createBranch_nom_unique : deux branches même nom → refus` | OK |
| 7 | `snapshot_incremente_HEAD` | `branches.test.ts > snapshot_incremente_HEAD : après snapshot, head_snapshot_id pointe sur le nouveau` | OK |
| 8 | `snapshot_pa_consolidation_immediate` | `branches.test.ts > snapshot_pa_consolidation_immediate : snapshot est indépendant, pas de rebuild` | OK |
| 9 | `diff_detecte_3_categories` | `diff.test.ts > diff_detecte_3_categories : collections / items / membres` | OK |
| 10 | `openPr_refuse_si_pas_open` | `pr.test.ts > openPr_refuse_si_pas_open : PR déjà fermée ne peut pas être rouverte` | OK |
| 11 | `reviewPr_auteur_ne_peut_pas_reviewer` | `pr.test.ts > reviewPr_auteur_ne_peut_pas_reviewer : auteur exclu` | OK |
| 12 | `peut_merger_apres_2_approve` | `pr.test.ts > peut_merger_apres_2_approve : règle des deux revues` | OK |
| 13 | `merge_sans_conflit_ok` | `merge.test.ts > merge_sans_conflit_ok : merge propre` | OK |
| 14 | `merge_avec_conflit_refuse` | `merge.test.ts > merge_avec_conflit_refuse : conflit → PR reste open` | OK |
| 15 | `peut_merger_owner_seulement` | `pr.test.ts > peut_merger_owner_seulement : admin refuse` | OK |
| 16 | `supprimer_branche_member_refuse` | `branches.test.ts > supprimer_branche_member_refuse : member ne peut pas supprimer` | OK |

**Total workspace : 32 tests verts** (au-delà du minimum de 16 demandés).

## Garde-fous de fin — vérification

### `npx tsc --noEmit -p tsconfig.app.json`

- 0 erreur dans le périmètre `src/lib/workspace/*`, `src/components/workspace/*`,
  `src/apps/workspace/*`, `src/stores/branches.store.ts`, `_config/cms/workspace.ts`,
  `src/components/ProfileWorkspaceSection.tsx`.
- 66 erreurs subsistent **hors périmètre** (fichiers `audit`, `cognition`, `dashboard`,
  `design`, `growth`, `it-rd`, `operations`, `people`, `product`, `sales`, `settings`,
  `tasks`, `tenant`, `themes`, `supabase.ts`, `TopBar.tsx`, `onboarding/TourOverlay.tsx`,
  `lib/cms/repository.ts`, etc.). Aucune dans un fichier que ce brief a écrit.
- Les erreurs restantes appartiennent aux périmètres des autres briefs parallèles
  (AUTH_FIX, MEMBERSHIPS, AUDIT_LOG, W13_QUOTAS, etc.) — non traitables ici.

### `npx vitest run`

- **Tests workspace : 32/32 verts** (100% du périmètre).
- **Total dépôt : 356 verts / 358 tests, 2 échecs préexistants**
  (`src/components/DesktopIcons.test.tsx`, `src/lib/themes/orphan-css-vars.test.ts`).
- Ces 2 échecs sont antérieurs au démarrage de ce brief (baseline mesurée à
  19:07 : `3 failed | 238 passed` avant ce brief, `2 failed | 356 passed`
  après — les 2 échecs restants sont hors périmètre).

### Migration SQL testable localement

`supabase/migrations/2026-08-15_workspace_branches.sql` :
- 4 tables (`workspace_branches`, `workspace_snapshots`, `workspace_prs`,
  `workspace_pr_reviews`).
- Indexes sur les colonnes clés (tenant, parent, status, payload_hash).
- 4 policies RLS (`workspace_*_tenant_read`) qui s'appuient sur la table
  `memberships` — référence forward compatible avec le brief MEMBERSHIPS.
- 1 contrainte d'unicité différée pour autoriser le seul `main` par tenant.
- Testable via `supabase db reset` une fois la migration appliquée.

## Choix d'architecture

### Adaptateur in-memory vs Supabase immédiat

Le module `src/lib/workspace/store.ts` expose une interface `WorkspaceStore`
et fournit une implémentation `InMemoryWorkspaceStore` pour la phase de
transition. Cela permet :
- d'écrire les 32 tests adversariaux sans dépendre de Supabase.
- de garder un contrat stable : un futur adaptateur Supabase (à brancher
  une fois les briefs AUTH_FIX, MEMBERSHIPS, AUDIT_LOG terminés) n'aura
  qu'à implémenter la même interface.

### Sérialisation déterministe

Le module `snapshot.ts` produit un JSON trié (clés triées, arrays triés
par id). Le hash SHA-256 (via SubtleCrypto avec fallback DJB2 si non
dispo) garantit que deux sérialisations d'un workspace inchangé donnent
le même hash — propriété indispensable pour le diff et le merge.

### Détection de conflit en 3-way

`merge.ts` calcule les conflits sur items en comparant :
- Hash du payload source
- Hash du payload target
- Hash du payload base (parent commun)

Un conflit est déclaré quand `source != target AND source != base AND
target != base` sur le même `item_id`. Si la PR est en `approved` au
moment du merge mais qu'on détecte un conflit, son statut revient à
`open` pour permettre la résolution par l'auteur.

### Bouton « Brancher » dans ProfileWorkspaceSection

Le bouton est ajouté en fin de section (sous « Enregistrer un espace »).
Visible uniquement si `peutCreerBranche(actorRole) === true`. Le rôle
par défaut est `'owner'` tant que MEMBERSHIPS n'est pas branché. La
prompte demande un nom en kebab-case, validé via `BRANCH_NAME_RE`.

## Intégration avec les autres briefs

| Brief | Dépendance | État |
|---|---|---|
| AUTH_FIX | `useSession()` pour l'`actorId` | Stub actif côté UI (`'local-user'`), intégration réelle dès qu'AUTH_FIX livre `useSession`. |
| MEMBERSHIPS | `MembershipRole` réel par tenant | Stub actif (`'owner'`), `ProfileWorkspaceSection` lit déjà `members.some(...)` quand MEMBERSHIPS livre `useMembershipsStore`. |
| AUDIT_LOG | Événements `workspace.*` | Pas émise depuis l'in-memory store — sera ajoutée quand AUDIT_LOG expose son API. |
| W13_QUOTAS | `createBranch` et `mergePr` sont des écritures | Pas comptées — la comptabilisation attendra l'API quotas. |

## Limites & dette intentionnelle

- **Le store est in-memory**. Un refresh de page perd tout. Acceptable pour
  la phase de transition ; le câblage Supabase viendra.
- **`getMainBranch` ne détecte pas le main créé en parallèle** par un autre
  agent dans la même fenêtre de boot (race condition théorique).
- **Le sélecteur de rôle est `actorRole = 'owner'`** dans `ProfileWorkspaceSection`
  et `src/apps/workspace/index.tsx`. C'est un stub temporaire — il sera
  remplacé par la vraie lecture MEMBERSHIPS dès que ce brief livre son API.
- **Tests adversariaux écrits mais pas exécutés contre Supabase réel** :
  ils sont robustes sur le store in-memory, qui mime le contrat final.

## Conclusion

- 32/32 tests workspace verts (≥ 16 demandés).
- 0 erreur tsc dans le périmètre exclusif.
- Migration SQL créée avec RLS, indexes, contraintes d'unicité.
- Bouton « Brancher » ajouté à `ProfileWorkspaceSection` ; app `WorkSpaces`
  crée, avec arborescence + PrViewer + InviteReviewer.
- Toutes les dépendances inter-briefs sont stubées de manière non invasive,
  avec commentaire explicite dans chaque fichier qui dépend d'un brief
  parallèle.

RAPPORT_PATH=/c/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_briefs/2026-08-15_WORKSPACE_BRANCHES/RAPPORT_WORKSPACE_BRANCHES.md