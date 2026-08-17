# CORRECTIF 3 — routes API sans garde d'authentification (ÉLEVÉ)

## Périmètre EXCLUSIF en écriture

```
api/v1/[tool].ts
api/v1/tools.ts
api/agent/roster.ts
api/agent/providers.ts
api/_agent/garde.ts
api/_agent/garde.test.ts
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_3.md`.

Rien d'autre. **Ne touche pas à `src/`** — trois autres agents y travaillent.
En particulier `src/lib/tooling/` est le périmètre d'un autre agent, même si
`api/v1/[tool].ts` en importe.

## Le défaut

`verifierAcces` (`api/_agent/garde.ts:36`) est le garde d'authentification. Il
est bien conçu : `AGENT_API_TOKEN` posé → il faut le présenter partout ;
absent → refus en production, passage en développement. **Échec fermé.**

Il est appelé par `api/agent/invoke.ts:57` et `api/chat.ts:48`.

Il n'est appelé **ni** par `api/v1/[tool].ts` **ni** par `api/v1/tools.ts`.

Mesures faites en production le 2026-08-17 :

| Route | HTTP | Lecture |
|---|---|---|
| `/api/chat` | **503** | gardée, refuse — correct |
| `/api/v1/tools` | **500** | `FUNCTION_INVOCATION_FAILED` |
| `/api/agent/roster` | **200** | ouverte, divulgue le roster complet |
| `/api/agent/providers` | **200** | ouverte, divulgue les fournisseurs |

`/api/v1/*` n'est donc pas exploitable **aujourd'hui** — mais uniquement parce
que la fonction plante. C'est une protection accidentelle : le jour où
quelqu'un répare ce 500, la route est ouverte sur Internet, et elle expose
`collection.create`, `scenario.approve` et le reste du catalogue d'outils.

## Ce qu'on attend

### 1. Garder `/api/v1/*`

Appelle `verifierAcces` en tête de `api/v1/[tool].ts` et `api/v1/tools.ts`,
exactement comme `api/chat.ts:48` le fait. Ne réinvente pas le garde : réutilise-le.

### 2. Trouver la cause du 500

`/api/v1/tools` plante à l'invocation. Diagnostique **pourquoi**. Hypothèse à
tester en premier : la route importe depuis `../../src/lib/tooling/catalog`, or
une fonction Vercel ne partage pas forcément la résolution de modules du bundle
client.

Si la cause est hors de ton périmètre, **ne la corrige pas** — décris-la
précisément dans ton rapport, avec le fichier en cause. Un 500 non diagnostiqué
qui redevient 200 après ton correctif serait le pire résultat possible.

### 3. Décider pour `roster` et `providers`

Ces deux routes répondent 200 sans authentification et divulguent l'architecture
interne : noms d'agents, descriptions, modèles, fournisseurs. **Aucun secret** —
tout est `available: false` en production.

Détermine si le client web en a besoin **avant** connexion :

- si oui, elles doivent rester ouvertes, mais ne renvoyer que le strict
  nécessaire — pas les descriptions internes ;
- si non, garde-les comme les autres.

Regarde qui les appelle côté client (tu peux **lire** `src/`) avant de trancher,
et justifie ton choix dans le rapport.

## Le test qui verrouille

`api/_agent/garde.test.ts` existe déjà. Ajoutes-y, ou dans un fichier voisin de
ton périmètre :

1. `/api/v1/[tool]` sans jeton, en production simulée → **refus** ;
2. `/api/v1/[tool]` avec le bon jeton → passe le garde ;
3. le même couple pour `/api/v1/tools`.

Lance **uniquement** :

```
npx vitest run api/_agent/garde.test.ts --maxWorkers=2
```

## Rappel

Périmètre exclusif, `api/` seulement. Aucun compteur global. Rapport partiel
obligatoire.
