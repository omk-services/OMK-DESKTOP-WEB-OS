# CORRECTIF 1 — l'identité est forgeable (CRITIQUE)

## ⚠️ REPRISE — du travail existe déjà, ne repars pas de zéro

Un premier passage a été **tué en cours** par un redémarrage de la machine.
Son travail est **sur le disque, non commité**. Il compile (`tsc` à 0) et
26 tests sur 27 passent.

**Lis d'abord ce qui existe** avant d'écrire quoi que ce soit :

```
git diff src/lib/tooling/
```

Ce qui est **fait** :
- `identity.ts` — `resolveIdentityWithMembership` étoffée ;
- `adapters/cli.ts` — câblé ;
- `adapters/mcp.ts` — câblé ;
- `identity.test.ts` — 27 tests, dont 26 passent.

Ce qui **reste** :

1. **`adapters/rest.ts` n'est pas câblé du tout.** C'est l'adaptateur exposé
   sur Internet — c'est le plus important des trois.

2. **Un test échoue et révèle une contradiction non tranchée** :
   `resolveIdentityWithMembership — cloison par membership > mode démo sans
   aucun lookup configuré → accepte` attend `true`, obtient `false`.

   Le passage précédent a implémenté le refus fermé **partout**, puis écrit un
   test attendant que le mode démo reste permissif. Les deux ne peuvent pas
   être vrais.

   **Tranche, et justifie.** La règle : le mode démo peut rester permissif,
   mais il doit être **explicite et impossible à déclencher depuis une entrée
   réseau**. Si le mode démo n'est atteignable que par la CLI locale, un
   `accepte` est défendable. S'il peut être demandé par un en-tête HTTP ou un
   champ JSON-RPC, il doit refuser. Va **lire** comment le mode démo est
   déclenché avant de choisir. Corrige soit le test, soit le code — pas les
   deux au hasard.

Ne défais pas le travail existant sans raison écrite dans ton rapport.

## Périmètre EXCLUSIF en écriture

```
src/lib/tooling/identity.ts
src/lib/tooling/identity.test.ts
src/lib/tooling/adapters/cli.ts
src/lib/tooling/adapters/mcp.ts
src/lib/tooling/adapters/rest.ts
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_1.md`.

Rien d'autre. Trois autres agents touchent `src/lib/auth/`, `src/stores/`,
`api/`, `src/apps/`. **Ne les touche pas.**

## Le défaut, pour mémoire

`resolveIdentity()` accepte l'identité que l'appelant déclare.
`resolveIdentityWithMembership()` existe pour la vérifier contre la table
`memberships` — elle n'était jamais appelée, et `setMembershipLookup()`
jamais invoquée.

Conséquence : `cli.ts` acceptait `--role owner` sans authentification, le
serveur MCP acceptait un `__role: "owner"` forgé, la route REST aussi. Toute
la matrice de `permissions.ts` repose sur ce rôle : s'il est déclaré par
l'appelant, `assertPermission` vérifie une affirmation contre elle-même.

## Les règles qui tiennent

1. **Le rôle effectif vient de la consultation, jamais de l'entrée.** Déclaré
   `owner`, table dit `member` → c'est `member`.
2. **Table muette → refus**, pas rétrogradation silencieuse en `guest`. Refus,
   avec un message qui dit pourquoi.
3. **Consultation non configurée ou en échec → refus en production.**

La base est alignée : `public.memberships` porte `user_id`, `tenant_id`,
`role`, `status` (migration du 2026-08-17). Une adhésion ne compte que si
`status = 'active'`. Rôles valides : `owner`, `admin`, `member`, `guest`.

Tu n'as **pas** le droit de modifier `src/lib/supabase.ts` (hors périmètre).
Importe le client, ne le réécris pas.

## `assertMembershipRolePresent`

Cette fonction existe et n'est jamais câblée. Détermine si elle doit l'être,
ou si `resolveIdentityWithMembership` la rend inutile. Dis-le dans le rapport.

## Le test qui verrouille

Les 27 tests existants + au minimum, pour `rest.ts` :

- un appel REST déclarant `owner` alors que la consultation rend `member`
  n'obtient que les droits de `member` ;
- un appel REST dont la consultation ne rend rien est **refusé** ;
- un appel REST sans consultation configurée est **refusé**.

Lance **uniquement** :

```
npx vitest run src/lib/tooling/identity.test.ts --maxWorkers=1
```

`--maxWorkers=1` : la machine vient de redémarrer et le pool de forks Windows
est fragile. Un `Failed to start forks worker` n'est pas un échec de test.

## Rappel

Périmètre exclusif. Aucun compteur global sur tout le dépôt. Rapport partiel
obligatoire si tu t'arrêtes — et si tu laisses le code non compilable, dis-le
**en tête** de rapport.
