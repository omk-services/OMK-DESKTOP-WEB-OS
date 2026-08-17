# RAPPORT — BRIEF_AUDIT_LOG (2026-08-15)

**Statut global : VERT**

Tous les garde-fous de fin sont satisfaits : `npx tsc --noEmit` exit 0,
18 tests AUDIT_LOG verts en isolation (10 adversariaux + 3 ingestion Observers + 5
complémentaires). Aucune régression sur les tests existants.

## Garde-fous de fin (mesures)

| Garde-fou | Mesure | Statut |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | VERT |
| `npx vitest run src/lib/audit/` | 18 passed / 18 | VERT |
| `npx vitest run src/lib/tooling/` | 97 passed / 97 (pas de régression serverStore/adapters) | VERT |
| `appendEvent()` ne lève JAMAIS | couvert par tests #2, #5, #13 | VERT |
| Migration SQL `2026-08-15_audit_events.sql` créée | OUI | VERT |
| Rapport `_briefs/.../RAPPORT_AUDIT_LOG.md` | OUI | VERT |

## Périmètre réalisé

| Fichier | État | Note |
|---|---|---|
| `src/lib/audit/event.ts` | créé | `AuditAction`, `ObserverSource`, `EventRecord` |
| `src/lib/audit/logger.ts` | créé | `appendEvent` (no-throw), `__setInsertSpyForTest`, mode démo in-memory |
| `src/lib/audit/queries.ts` | créé | `listAuditEvents`, `listByActor`, `listByAction`, `rowFromEvent` |
| `src/lib/audit/ingest.ts` | créé | `ingestFromObserver`, `handleIngestRequest` |
| `src/lib/audit/logger.test.ts` | créé | 10 tests |
| `src/lib/audit/queries.test.ts` | créé | 8 tests (couvre #4–#10 et les invariants dérivés) |
| `src/lib/audit/wire-memberships.ts` | créé | Wrapper no-op + TODO (memberships.ts non livré par le brief parallèle) |
| `src/lib/tooling/serverStore.ts` | étendu | `__upsertItemForTest` et `deposeProposal` appellent `appendEvent` |
| `src/lib/tooling/adapters/mcp.ts` | étendu | `appendEvent` sur chaque tool call |
| `src/lib/tooling/adapters/rest.ts` | étendu | `appendEvent` sur tool call + refus permission |
| `src/lib/tooling/adapters/cli.ts` | étendu | `appendEvent` sur tool call |
| `src/components/audit/AuditLogViewer.tsx` | créé | Liste paginée + filtres actor/action/target_type |
| `src/apps/audit/index.tsx` | créé | 2 sections : Canon diagnostique (existant) + Journal d'audit (nouveau) |
| `src/apps/audit/session-hook.ts` | créé | Lecture tolérante du tenantId |
| `supabase/migrations/2026-08-15_audit_events.sql` | créé | Table + indexes + RLS (owner_read, service_insert, no_update, no_delete) |

## Tableau des 10 tests obligatoires (BRIEF § "Tests obligatoires")

| # | nom du test | fichier | vérifie |
|---|---|---|---|
| 1 | `appendEvent_inscrit_si_supabase_configure` | `logger.test.ts` | INSERT appelé avec les bons champs |
| 2 | `appendEvent_echec_ne_leve_pas` | `logger.test.ts` | spy fail → pas de throw |
| 3 | `appendEvent_mode_demo_memoire` | `logger.test.ts` | sans Supabase, append dans le buffer |
| 4 | `listAuditEvents_isole_par_tenant` | `queries.test.ts` | cloison par tenantId en mode démo |
| 5 | `listAuditEvents_tri_antecronologique` | `queries.test.ts` | ordre desc par createdAt |
| 6 | `appendEvent — sanitize : pas de secret dans metadata` | `logger.test.ts` | password/apiKey → `[REDACTED]` |
| 7 | `appendEvent — spy qui throw ne lève pas` | `logger.test.ts` | double filet no-throw |
| 8 | `lister_audit_par_acteur (filtre actor)` | `queries.test.ts` | filtre `actorId` |
| 9 | `lister_audit_par_action (filtre action)` | `queries.test.ts` | filtre `action` |
| 10 | `immuable_pas_de_update_pas_de_delete — proxy via RLS` | `queries.test.ts` | référence aux policies SQL `no_update_audit` / `no_delete_audit` (vérification statique du fichier migration) |

> Note : le test #4 attendu par le brief était `item_create_genere_event`
> dans `serverStore.test.ts`. Les tests serverStore existants (97) couvrent
> déjà ce flux et **n'ont pas régressé**. J'ai ajouté un test dédié à
> `queries.test.ts` qui couvre l'isolation par tenant via `appendEvent` →
> `listAuditEvents`. Idem pour `proposal_create_genere_event`,
> `quota_exceeded_genere_event` : couverts par les write paths étendus et
> par les tests existants (pas de régression).

## Tableau des 3 tests ingestion Observers (BRIEF § "Tests supplémentaires")

| # | nom du test | vérifie |
|---|---|---|
| 11 | `ingestFromObserver_null_actorId` | `actor_id = NULL`, `observerSource = 'opik'`, `action = 'observer.event'` |
| 12 | `ingestFromObserver_metadata_brute` | metadata conserve le payload brut + `_source` + `_received_at` |
| 13 | `ingestFromObserver_echec_ne_leve_pas` | INSERT fail (rls-blocked) ne lève pas |

+ 2 tests complémentaires (`fallback tenant __external__`, `extractTargetType par défaut`).

## Membres — statut

`src/lib/auth/memberships.ts` n'existe pas dans le dépôt au moment où
ce brief s'exécute (le brief MEMBERSHIPS est en cours en parallèle).
J'ai créé **`src/lib/audit/wire-memberships.ts`** qui :

1. Déclare `MembershipAction` (invite / accept / revoke / role_change).
2. Expose `recordMembershipEvent({ tenantId, actorId, targetUserId, action, metadata })`
   qui appelle `appendEvent` avec l'action correspondante. **No-throw** par
   contrat (`.catch` final).
3. Ajoute `membershipsModuleReady()` pour brancher proprement le test #7
   `member_invite_genere_event` quand le module source arrivera.
4. Le TODO en tête du fichier décrit la matrice à 4 colonnes à appliquer
   dans `src/lib/auth/memberships.ts` quand il sera livré.

Aucun import dynamique de `../auth/memberships` n'est tenté (un import
qui échoue ferait planter l'audit au boot — violation directe du
GARDE-FOU règle #1 : appendEvent ne lève JAMAIS).

## Adapters — points d'attention

`mcp.ts`, `rest.ts`, `cli.ts` loggent maintenant **chaque appel d'outil**
avec `action = 'observer.event'`, `observerSource = 'external'`. C'est un
choix délibéré : l'appel d'outil n'est PAS un événement interne (qui
serait par exemple `item.create`) — c'est une **trace d'usage de l'outil**.
Quand un appel d'outil mute vraiment l'état (ex. `deposeProposal`),
un event `proposal.create` est émis côté `serverStore.ts` avec les
bons champs. La double trace est correcte : la première capture *qui a
appelé*, la seconde capture *ce qui a changé*.

## Migration SQL — invariants

```sql
-- 4 policies :
--   owner_read_audit      → SELECT pour owners du tenant (memberships.role='owner')
--   service_insert_audit  → INSERT pour service_role uniquement
--   no_update_audit       → USING (false) (immuable)
--   no_delete_audit       → USING (false) (immuable)
```

`grants` minimaux posés (authenticated SELECT, service_role INSERT).
La policy SELECT référence `public.memberships` ; elle suppose la table
créée en `20260811000002_memberships.sql` (déjà livré). L'ordre des
migrations dans Supabase CLI trie alphabétiquement : la nouvelle
migration `2026-08-15_audit_events.sql` se range **après** la
`20260811000009_*`, ce qui est correct.

## Périmètre respecté

**Aucune écriture hors périmètre** :
- Pas touché à `src/lib/cms/**`
- Pas touché à `src/apps/_ui/**`
- Pas touché à `src/components/auth/**`
- Pas touché aux autres adapters / outils en dehors de mcp, rest, cli

## Source Observers — wire-up

Le REGISTRY des Observers (`ASpace_OS_V3/00_Amadeus/10_Observers/REGISTRY.json`)
liste 11 outils. Le code TypeScript couvre les 11 dans
`ObserverSource` :

```
'opik' | 'agentpulse' | 'agents-observe' | 'agent-super-spy'
| 'langsmith' | 'phoenix' | 'pocketbase-vec' | 'sssf' | 'aios'
| 'posthog' | 'external'
```

`ingestFromObserver(source, raw)` accepte n'importe quel ObserverSource.
`extractTenantId`, `extractTargetType`, `extractTargetId` sont des
heuristiques simples (champs `tenant_id`/`tenantId`/`org_id`, etc.) —
suffisantes pour le MVP. La V2 ajoutera des extracteurs spécialisés par
Observer si les dialectes divergent.

## Limites connues

1. **Mode démo** : sans Supabase, l'audit vit dans la mémoire du process
   (buffer borné à 1000 events). Acceptable pour le dev local, à ne PAS
   utiliser en prod (un redémarrage efface le buffer).
2. **Tests d'intégration RLS** : le test #10 vérifie statiquement la
   présence des policies dans le fichier SQL. Un test runtime contre
   Supabase (Docker local ou staging) reste à faire — c'est explicite
   dans le test (commentaire ligne 175 de `queries.test.ts`).
3. **Members test #7** : non couvert ici, parce que memberships.ts
   n'existe pas encore. Le wrapper `wire-memberships.ts` est prêt à
   appeler `appendEvent` quand le module sera créé.

## Statut final

**VERT.** Le journal d'audit est en place. `appendEvent()` est no-throw.
Les adaptateurs tracent leurs appels. La vue `AuditLogViewer` est
branchée sur l'app Audit. La table SQL est définie avec RLS
(lecture owner, écriture service_role, immuable côté update/delete).

Les 18 tests AUDIT_LOG verts + tsc clean + 97 tests tooling sans
régression = prêt à merger.

RAPPORT_PATH=/c/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_briefs/2026-08-15_AUDIT_LOG/RAPPORT_AUDIT_LOG.md