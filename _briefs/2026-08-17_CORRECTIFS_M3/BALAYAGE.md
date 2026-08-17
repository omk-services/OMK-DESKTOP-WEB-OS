# Balayage production — toutes les apps, toutes les sections

Cible : https://omk-desktop-web-os.vercel.app

| Mesure | Valeur |
|---|---|
| Apps sur le bureau | 20 |
| Apps **reellement ouvertes** | 5 |
| Apps qui n ont pas pu s ouvrir | 15 |
| Apps montrant l ecran d erreur | 0 |
| Sections activees | 187 |
| Sections montrant l ecran d erreur | 0 |

> ⚠️ **Couverture partielle — ce rapport ne conclut rien sur ces apps.**
>
> 15 apps ne se sont pas ouvertes : People / Agents, Operations, IT / R&D, Clients, Tasks, Marketplace, App Store, SaaS Builder, Product, Growth, Settings, Welcome, Design, Ontology, Cognition.
>
> « 0 defaut » sur une app non ouverte veut dire « non teste », pas « sain ».

## Aucune app ne montre l ecran d erreur

Le balayage n a declenche aucun « hit a snag ». Si l utilisateur en voit,
c est que le declencheur depend de donnees reelles (session connectee,
tenant particulier) ou d une vue de detail que ce balayage n atteint pas.

## Erreurs de console et de reseau, par app

### People / Agents
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^People \/ Agents$/ }).firs`

### Operations
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Operations$/ }).first()[2`

### IT / R&D
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^IT \/ R&D$/ }).first()[22`

### Clients
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Clients$/ }).first()[22m
`

### Tasks
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Tasks$/ }).first()[22m
[`

### Marketplace
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Marketplace$/ }).first()[`

### App Store
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^App Store$/ }).first()[22`

### SaaS Builder
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^SaaS Builder$/ }).first()`

### Product
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Product$/ }).first()[22m
`

### Growth
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Growth$/ }).first()[22m
`

### Settings
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Settings$/ }).first()[22m`

### Welcome
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Welcome$/ }).first()[22m
`

### Design
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Design$/ }).first()[22m
`

### Ontology
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Ontology$/ }).first()[22m`

### Cognition
- `ouverture impossible : TimeoutError: locator.dblclick: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('[role="button"]').filter({ hasText: /^Cognition$/ }).first()[22`
