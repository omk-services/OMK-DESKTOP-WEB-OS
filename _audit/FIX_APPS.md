# Correction — applications de domaines

## Avant / après
| Fichier | Erreurs avant | Après |
|---|---|---|
| `src/apps/product/ProductApp.tsx` | 15 | 0 |
| `src/apps/operations/OperationsApp.tsx` | 8 | 0 |
| `src/apps/growth/GrowthApp.tsx` | 7 | 0 |
| `src/apps/it-rd/ItRdApp.tsx` | 3 | 0 |
| `src/apps/it-rd/embedded/ServiceFrame.tsx` | 2 | 0 |
| `src/apps/it-rd/embedded/EmbeddedServicesPanel.tsx` | 1 | 0 |
| `src/apps/audit/index.tsx` | 1 | 0 |
| `src/apps/cognition/CognitionApp.tsx` | 1 | 0 |
| `src/apps/dashboard/dashboard/sections/Overview.tsx` | 1 | 0 |
| `src/apps/design/DesignApp.tsx` | 1 | 0 |
| `src/apps/legal/UnknownCollectionBanner.tsx` | 1 | 0 |
| `src/apps/people/PeopleApp.tsx` | 1 | 0 |
| `src/apps/people/UnknownCollectionBanner.tsx` | 1 | 0 |
| `src/onboarding/TourOverlay.tsx` (+ `tourStore.ts`) | 1 | 0 |
| `src/lib/audit/queries.ts` | 2 | 0 |
| `src/lib/audit/wire-memberships.ts` | 1 | 0 |
| `src/lib/auth/backend.supabase.ts` | 1 | 0 |
| `src/lib/auth/memberships.ts` | 1 | 0 |
| `src/lib/supabase.ts` | 1 | 0 |
| Hors périmètre (`src/components/**`) — non traité | 4 | 4 |
| **total** | 54 | **4** (tous hors périmètre) |

Tout ce qui était dans mon périmètre exclusif (`src/apps/**`, `src/onboarding/**`,
`src/lib/audit/**`, `src/lib/supabase.ts`, `src/lib/auth/**`) est corrigé : 50 erreurs
sur 54. Les 4 restantes vivent dans `src/components/**`, hors périmètre — probablement
le lot de l'agent qui travaille en parallèle sur l'outillage/CI.

## Les vrais bugs trouvés

### `src/onboarding/tourStore.ts` — `computeBubble` déclarait un retour plus large que ce qu'il produit
`computeBubble()` a un paramètre d'entrée `anchor: Anchor` où `Anchor` inclut `'auto'`
(un anchor `'auto'` est une **demande** de l'appelant : "choisis pour moi"). Mais son
type de retour annonçait aussi `placement: Anchor` — donc potentiellement `'auto'` en
sortie. En réalité, chaque branche du switch (`explicit === 'top'/'bottom'/'left'/'right'`,
et le cas par défaut "auto") résout toujours vers une des 4 valeurs concrètes
(`'top' | 'bottom' | 'left' | 'right'`) : `computeBubble` ne retourne jamais `'auto'`.
Le code appelant, `TourOverlay.tsx`, a un type `BubbleGeometry.placement` volontairement
restreint aux 4 valeurs concrètes — correctement, puisque le composant ne sait pas quoi
faire d'un placement `'auto'` non résolu (aucune branche de rendu pour ce cas). Assigner
le retour de `computeBubble` (typé trop large) à `BubbleGeometry` (typé juste) cassait.

**Correctif** : introduction d'un type `ResolvedPlacement = 'top' | 'bottom' | 'left' |
'right'` et retypage de `computeBubble` (et de ses 4 fonctions internes
`placeTop/placeBottom/placeLeft/placeRight`) pour retourner ce type plus étroit — qui
reflète exactement ce que la fonction produit réellement. Aucune ligne de logique
changée : c'est une correction de signature, pas de comportement. Le scénario réel que
ça évite : si un futur appelant se fiait au type `Anchor` en sortie et ajoutait un
`switch` sur `placement` sans branche `'auto'`, il aurait un bug silencieux (bubble
jamais rendue) — le nouveau type empêche ce piège dès la compilation.

### `src/lib/auth/backend.supabase.ts` — mauvais point d'import pour `MembershipRecord`
Le fichier importait `type { MembershipBackend, MembershipRecord }` depuis `./memberships`,
mais `memberships.ts` ne fait que consommer `MembershipRecord` (importé lui-même depuis
`../tenant/contract`) sans le ré-exporter. Le code compilait quand même côté usage
(`ROW_TO_RECORD`, etc.) tant que personne ne vérifiait le type à la source — mais TS
signalait bien l'absence de l'export. Ce n'est pas qu'un problème de typage : si
`tenant/contract.ts` avait un jour changé la forme de `MembershipRecord` sans que
`memberships.ts` la ré-exporte correctement, ce fichier aurait silencieusement dérivé
sur un type stale sans avertissement. **Correctif** : importer `MembershipRecord`
directement depuis `../tenant/contract`, sa source réelle.

## Les corrections purement typographiques

- **`ProductApp.tsx`** : suppression de 15 imports/constantes/interfaces jamais
  référencés ailleurs dans le fichier (`Package`, `KanbanCard`, `FleetItemCard`,
  `Lightbulb`, `STAGE_TONE`, `STAGE_ICON`, `TIER_TONE`, `TIER_ACCENT`, `STAGE2_TONE`,
  `STAGE2_ACCENT`, `TREND_TONE`, `TREND_ACCENT`, interfaces `ReleaseItem`,
  `RankingItem`, `LaunchItem`, `IdeaItem`). Chaque suppression vérifiée par grep avant
  coup — aucun de ces symboles n'était consommé nulle part dans le fichier.
- **`OperationsApp.tsx`** : suppression de `CMSCardList` (import mort), `CATEGORY_ICON`,
  `CATEGORY_TONE`, `CATEGORY_ACCENT` (constantes mortes), et des icônes lucide qui ne
  servaient qu'à ces constantes (`GraduationCap`, `FileWarning`, `ShieldCheck`,
  `BookText`). `BENCHMARK_TONE`/`BENCHMARK_ACCENT` supprimées aussi : elles
  référençaient un type `BenchmarkItem` jamais déclaré dans le fichier (`TS2304`) et
  n'étaient elles-mêmes jamais utilisées — la section Benchmarks passe déjà par
  `CollectionRepeater` sans ces maps. Code mort qui référençait un type mort, pas un
  bug caché.
- **`GrowthApp.tsx`** : suppression de `CMSCardList` (import mort), des interfaces
  `StrategieItem`/`AeoItem` (jamais utilisées comme type), et des constantes
  `STRAT_PHASE_TONE`/`STRAT_PHASE_ACCENT`/`AEO_POSITION_TONE`/`AEO_POSITION_ACCENT`
  (jamais lues).
- **`ItRdApp.tsx`** : suppression de `KanbanCard` (import mort), `STATE_TONE`,
  `EVAL_TYPE_TONE` (constantes mortes, contrairement à `DRIFT_TONE`/`ACTION_TONE`
  conservées car utilisées plus bas dans le fichier).
- **`ServiceFrame.tsx`** : suppression de la fonction `ExternalHint` — déclarée mais
  jamais appelée nulle part dans le fichier (contrairement à `ExternalOnly`, sa voisine,
  qui l'est).
- **`EmbeddedServicesPanel.tsx`** : suppression de l'import `RotateCw` (icône jamais
  rendue).
- **`audit/index.tsx`, `legal/UnknownCollectionBanner.tsx`,
  `people/UnknownCollectionBanner.tsx`** : `JSX.Element` référençait le namespace
  global `JSX`, retiré par défaut avec React 19 + `@types/react` 19 (le mode
  `react-jsx` ne le déclare plus globalement). Correctif : `import type { JSX } from
  'react'` dans chacun des 3 fichiers plutôt que de changer le type de retour.
- **`design/DesignApp.tsx`** : le paramètre déstructuré `{ navigateToSection }` du
  callback `render` de la section "Overview" recevait un type implicite `any` malgré
  l'annotation `AppSection[]` sur le tableau englobant — l'inférence contextuelle
  n'atteignait pas cette entrée précise. Annotation explicite du paramètre
  (`{ navigateToSection }: { navigateToSection: (id: string) => void }`), copiée du
  type déjà déclaré dans `AppFrame.tsx`.
- **`people/PeopleApp.tsx`** : la fonction `_UnusedLegacyFleetDetail_REMOVED` porte un
  commentaire explicite interdisant sa suppression matérielle ("archivé... suppression
  matérielle interdite par la doctrine"). Respecté : au lieu de la supprimer, ajout
  d'un `void _UnusedLegacyFleetDetail_REMOVED;` juste après sa déclaration pour
  satisfaire `tsc` sans toucher au code archivé ni changer le rendu.
- **`cognition/CognitionApp.tsx`** : suppression de la variable locale `collection`
  dans `RoutinesSection` — lue depuis le store CMS mais jamais utilisée dans le corps
  de la fonction.
- **`dashboard/sections/Overview.tsx`** : suppression de l'import `useShellStore`,
  jamais appelé dans le fichier.
- **`lib/audit/queries.ts`** : la requête Supabase construisait la chaîne
  `select → eq → order → limit` par réaffectations successives sur `let q`, avec des
  casts `as typeof q` à chaque étape. Problème : `typeof q` se fige au type du premier
  maillon (`select`), donc réaffecter le résultat de `.eq()` (un type différent) en le
  forçant vers `typeof q` produisait une conversion "peut-être une erreur" (`TS2352`),
  puis un accès `.order()` sur un type qui ne l'avait plus (`TS2339`). Correctif :
  chaîne fluide en une seule expression (`client.from(...).select(...).eq(...)
  .order(...).limit(...)`), où chaque étape infère son propre type sans cast
  intermédiaire.
- **`lib/audit/wire-memberships.ts`** : la directive `@ts-expect-error` posée sur
  `require('../auth/memberships')` est devenue obsolète — le module existe désormais
  sur disque et le type-checker ne lève plus d'erreur à cet endroit, donc TS rejette
  la directive elle-même comme inutile (`TS2578`). Retirée, avec un commentaire
  expliquant pourquoi.
- **`lib/auth/memberships.ts`** : la fonction interne `hex(n: number)` dans
  `InMemoryBackend.__newId()` ignorait totalement son paramètre `n` (toujours appelée
  avec `hex(0)`, `n` jamais lu dans le corps). Paramètre supprimé, tous les appels
  passés en `hex()` — comportement inchangé (le générateur pseudo-UUID produit
  exactement les mêmes valeurs).
- **`lib/supabase.ts`** : `fetch(..., { headers: { apikey: anonKey } })` où `anonKey`
  est typé `string | undefined` au niveau module — incompatible avec `HeadersInit`.
  Le code est dans la branche `if (supabaseConfigured)`, qui garantit déjà `anonKey`
  non vide (même garde que la construction du client Supabase à la ligne 84, qui
  utilise déjà `anonKey!`). Assertion `anonKey!` ajoutée par cohérence avec ce
  précédent, avec commentaire explicite — pas un `any`, une affirmation d'un invariant
  déjà vérifié par le code environnant.

## Non-régression
- `npx vitest run --pool=threads src/lib/tooling` — mesuré après chaque fichier corrigé,
  toujours **104/104 passed**, aucune baisse à aucun moment de la campagne.
- `npx vite build` — succès (`✓ built in 5.89s`), avertissements pré-existants seulement
  (chunk >500 kB, dynamic import inefficace sur `seed.ts`) — aucun nouveau warning
  introduit par mes corrections.

## Ce que je n'ai pas su corriger
Rien dans mon périmètre. Les 4 erreurs restantes sont toutes hors périmètre exclusif
(`src/components/**`, explicitement en dehors de ma liste de fichiers modifiables) :

- `src/components/audit/AuditLogViewer.tsx(37,77)` — même défaut `JSX.Element` que les
  3 fichiers `apps/` corrigés ci-dessus ; le correctif serait identique
  (`import type { JSX } from 'react'`), mais le fichier est hors périmètre.
- `src/components/cms/CollectionRepeater.tsx(281,11)` — `ref` de type
  `RefObject<HTMLDivElement | null>` assigné à un `Ref<HTMLFormElement>` attendu.
- `src/components/ProfileWorkspaceSection.tsx(37,25)` — `MembershipRole` importé mais
  jamais utilisé.
- `src/components/TopBar.tsx(35,9)` — `addToast` déclaré mais jamais lu.

Ces 4 fichiers appartiennent probablement au périmètre de l'agent qui travaille en
parallèle sur l'outillage/CI — je ne les ai pas touchés pour ne pas écraser son travail.
