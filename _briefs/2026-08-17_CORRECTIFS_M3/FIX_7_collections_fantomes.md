# CORRECTIF 7 — les collections que les apps lisent et qui n'existent pas

## Périmètre EXCLUSIF en écriture

```
src/lib/cms/seed.ts
src/apps/legal/
src/apps/people/
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_7.md`.

Rien d'autre. **Ne touche pas** à `src/lib/cms/cms.store.ts` (corrigé il y a
peu), ni à `src/lib/auth/`, `src/stores/`, `src/lib/tooling/`, `api/`,
`package.json` — trois autres agents y travaillent.

## Le défaut

`seed.ts` enregistre **23 collections**. Or les apps en lisent d'autres, qui
ne sont enregistrées nulle part.

Exemple mesuré : `src/apps/legal/LegalApp.tsx:32` fait

```ts
const checks = useCmsStore(s => s.items['legal_ai_act_checks']) ?? [];
```

`legal_ai_act_checks` n'est pas dans les 23. Le `?? []` évite le plantage —
donc **la section s'affiche vide au lieu d'échouer**. C'est pire qu'une
erreur : l'utilisateur croit que sa base est vide, alors que la collection
n'a jamais existé.

Les 23 enregistrées sont : `agents, articles, clients, contracts, deals,
demo_coach_apps, demo_coach_metrics, demo_coach_notes, deploys,
growth_channels, growth_experiments, incidents, invoices, it_experiments,
items, marketplace_listings, people_agents, policies, product_items,
product_releases, runbooks, services, session_notes, tasks, team`
(vérifie cette liste toi-même dans `seed.ts`, ne me crois pas sur parole).

## Ce qu'on attend

### 1. Le recensement — c'est le livrable principal

Balaye **tout `src/apps/`** (en lecture ; tu n'écris que dans `legal/` et
`people/`) et relève **chaque** identifiant de collection consommé, via
`s.items['…']`, `useCollectionDrill('…')`, `addItem('…')`, ou toute autre
forme d'accès.

Rends un tableau :

| App | Collection lue | Enregistrée dans seed.ts ? | Table INTERN correspondante |

Les 25 tables du projet INTERN portent le préfixe `cms_` : `cms_articles,
cms_clients, cms_collections, cms_contracts, cms_deals, cms_demo_coach_apps,
cms_demo_coach_metrics, cms_demo_coach_notes, cms_deploys, cms_growth_channels,
cms_growth_experiments, cms_incidents, cms_invoices, cms_it_experiments,
cms_items, cms_marketplace_listings, cms_people_agents, cms_policies,
cms_product_items, cms_product_releases, cms_runbooks, cms_services,
cms_session_notes, cms_tasks, cms_team`.

Ce recensement vaut pour toutes les apps, même celles hors de ton périmètre
d'écriture. **Signale sans corriger** ce qui est ailleurs.

### 2. Les corrections, dans ton périmètre seulement

Pour chaque collection manquante consommée par `legal/` ou `people/`, deux
issues possibles — choisis et justifie :

- **la collection a du sens** → déclare-la dans `seed.ts` avec ses champs et
  un jeu de données de démonstration cohérent avec les voisines ;
- **la collection est un vestige** → retire sa lecture de l'app.

Ne choisis pas « déclarer » par réflexe : une collection vide de plus n'aide
personne. Regarde ce que la section en fait avant de trancher.

### 3. Rendre le silence bruyant

Le motif `useCmsStore(s => s.items['x']) ?? []` transforme une collection
absente en liste vide. Sur un écran, ça se lit « aucune donnée » — un
diagnostic faux.

Dans **`legal/` et `people/` uniquement**, remplace ce silence par quelque
chose de lisible : un état vide explicite qui distingue « collection inconnue,
c'est un défaut » de « collection connue mais sans élément, c'est normal ».

Ne jette pas d'exception : une section qui plante est pire qu'une section qui
dit clairement ce qui manque.

## Le test qui verrouille

Un test qui compare **l'ensemble des collections consommées** par `legal/` et
`people/` à **l'ensemble des collections enregistrées**, et échoue en listant
les manquantes. Ce test doit échouer sur le code d'avant.

C'est le verrou qui compte : il attrapera la prochaine collection oubliée sans
qu'un humain ait à relire 26 apps.

Lance **uniquement** tes propres tests, avec `--maxWorkers=1`.

## Rappel

Périmètre exclusif. Aucun compteur global. Rapport partiel obligatoire.
