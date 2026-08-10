---
id: C_BUSINESS
campagne: 2026-08-09 production-ready
ordre: 2 — en parallèle de B
---

# BRIEF C — les apps du chiffre d'affaires

## Ton périmètre exclusif

```
src/apps/sales/**
src/apps/finance/**
src/apps/clients/**
src/apps/growth/**
src/apps/marketplace/**
```

Cinq apps. **Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
`src/apps/_ui/`, et toute app hors de cette liste. Un défaut vu ailleurs se **note au rapport**,
il ne se corrige pas — un autre agent y travaille en ce moment même.

Le dossier `src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` est de l'archive.
Ne le corrige pas, ne le supprime pas.

## Ce qui est déjà fait — ne le refais pas

- **Sales OS** : le nom a été unifié partout (registre, Settings, DesktopIcons). L'app s'appelle
  « Sales OS », sous-titre « Control Center ». Ses sections : `Today`, `Pipeline`, `Kanban`,
  `Context`, `Capabilities`, `Stack`, `Cognition`. Les eyebrows suivent le motif
  `Sales OS · live operating layer · <Section>`. **Ne renomme rien.**
- **Marketplace** : install **et** uninstall câblés avec toast, drill vers le détail,
  3 sections (Browse / Installed / Featured). Fonctionne.
- **Clients** : composeur de nouveau client avec valeurs par défaut Citadelle, drill CMS,
  section `Directory`.
- **Finance** : composeur de facture, section `Overview`.
- La collection CMS `deals` contient 5 items (`deal-marcus`, `deal-amara`, `deal-dara`,
  `deal-ava`, `deal-priya`) avec `client`, `offer`, `value`, `stage`. Le Dashboard s'en sert
  déjà pour son CEO Cockpit — **ne change pas la forme de ces items**, tu casserais son calcul.

## Spécificités de ton périmètre

### Le chaînage inter-apps

Ces cinq apps sont reliées : un `deal` gagné dans Sales devient une `invoice` dans Finance et
un `client` dans Clients. Vérifie que les chiffres se répondent d'une app à l'autre. Si Sales
annonce 2 deals gagnés et que Finance n'a aucune facture correspondante, l'un des deux ment.

### Le drill entrant

Le CEO Cockpit du Dashboard envoie un événement `coach-os:open-app-section` avec ces cibles :

| app | sectionId attendu |
|---|---|
| `sales` | `pipeline` |
| `finance` | `overview` |
| `clients` | `directory` |
| `operations` | `incidents` |

`AppFrame` consomme l'événement et cherche une section dont l'`id` correspond. Vérifie que ces
`id` existent toujours dans tes apps — si tu renommes un `id` de section, tu casses le drill du
Dashboard sans le voir.

### Les montants

Toute somme affichée doit venir d'un `reduce` sur une collection, jamais d'une constante. Vérifie
les arrondis (`toFixed`), les devises (`$` partout, pas de mélange `€`/`$`), et les cas où la
collection est vide (`$NaN` à l'écran = bug).

## Rappel de la boucle

Tu ne t'arrêtes pas après la première app. **Cinq apps dans ton périmètre = cinq apps dans ton
rapport.** Deux passes consécutives sans rien de neuf, et seulement là, tu rends la main.
