---
id: E_PERIPHERIE
campagne: 2026-08-09 production-ready
ordre: 3 — en parallèle de D
---

# BRIEF E — la périphérie et les portes d'entrée

## Ton périmètre exclusif

```
src/apps/settings/**
src/apps/welcome/**
src/apps/onboarding/**
src/apps/design/**
src/apps/ontology/**
src/apps/audit/**
src/apps/cognition/**
src/agent/**
```

Sept apps **plus le dossier `src/agent/`**. **Interdit** : `src/components/`, `src/lib/`,
`src/stores/`, `src/hooks/`, `src/apps/_ui/`, et toute app hors de cette liste. Un défaut vu
ailleurs se **note au rapport**.

`src/agent/` t'est rattaché parce que l'agent du socle l'a signalé sans pouvoir y toucher.
Il y a au moins deux dettes connues à cet endroit :

- `src/agent/voice.ts` — double assertion de typage sur l'API `SpeechRecognition`.
- `src/agent/tools.ts` — le handle DEV `window.__coachos` est typé par double assertion, alors
  qu'une déclaration globale propre existe désormais dans `src/lib/coachos-global.d.ts`.
  Sers-t'en au lieu de refaire un cast.

## Ce qui est déjà fait — ne le refais pas

- **Settings** : la liste d'apps du sélecteur de thème par app est à jour (« Sales OS »).
  L'app écoute `coach-os:open-app-section` pour sauter à la section `themes`.
- **Onboarding** : le bouton « Suivant » du quiz est cliquable, `CitadelPanel` enchaîne
  quiz → révélation, branding `demo-coach`.
- **Welcome** : une seule section au rail (`Arrivée`) plus une entrée par page d'atterrissage.
  C'est **voulu** — l'app est un canevas de prévisualisation multi-pages, pas une app à onglets.
  Ne la découpe pas en sections.
- **Design** : 1866 lignes, six styles de front-end sur un canevas de démonstration.
- **Ontology** : registre des 12 entités métier, avec son test `ontology-app.test.ts`.
- **Audit** et **Cognition** sont `hidden: true` au registre — invisibles au dock, mais
  toujours atteignables et donc toujours à vérifier.

## Spécificités de ton périmètre

### Settings est le point de contrôle du thème

C'est l'app qui pilote l'apparence des 18 autres. Une régression ici est visible partout.
Vérifie que chaque réglage écrit bien dans son store **et** que la valeur écrite est relue au
rechargement de la page. Un réglage qui ne survit pas au `F5` est un réglage mort.

**Exception au contrat « zéro palette en dur »** : les vignettes de prévisualisation de thème
affichent volontairement les couleurs d'un *autre* thème que celui actif. Elles doivent rester
en hex. Ne les convertis pas en `var(--theme-*)`.

### Welcome et Onboarding sont les premières impressions

Ce sont les deux apps qu'un prospect voit en premier. Le niveau d'exigence sur la prose, les
espacements et le responsive y est plus haut qu'ailleurs. Relis les textes : fautes, phrases
tronquées, promesses qui ne correspondent à rien dans le produit.

### Design et Ontology sont des vitrines techniques

Elles montrent des styles et un registre d'entités. Vérifie que ce qu'elles annoncent existe :
si Ontology déclare 12 entités, il doit y en avoir 12. Si Design annonce six styles, les six
doivent se rendre sans erreur console.

`src/apps/ontology/ontology-app.test.ts` existe : fais-le passer et garde-le vert.

### Les deux apps cachées

`audit` et `cognition` sont `hidden: true`. Vérifie qu'elles s'ouvrent quand même sans crash
(`useShellStore.getState().openApp('audit', 'Audit')`), et que leur description au registre
correspond à ce qu'elles font vraiment. `cognition` se décrit comme
« SovereignGate — now inside Sales » : vérifie que c'est toujours vrai.

## Rappel de la boucle

**Sept apps dans ton périmètre = sept apps dans ton rapport.** Tu ne t'arrêtes pas après la
première. Deux passes consécutives sans rien de neuf, et seulement là, tu rends la main.
