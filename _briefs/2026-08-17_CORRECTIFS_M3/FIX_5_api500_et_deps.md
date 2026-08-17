# CORRECTIF 5 — le 500 de `/api/v1/*` et les dépendances vulnérables

## Périmètre EXCLUSIF en écriture

```
api/                (tout le dossier)
package.json
package-lock.json
vite.config.ts
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_5.md`.

Rien d'autre. **Ne touche pas à `src/`** — deux autres agents y travaillent.
Si la cause du 500 est dans `src/`, tu la DÉCRIS sans la corriger.

## 1. Le 500 sur `/api/v1/*`

Mesuré en production : `GET /api/v1/tools` rend **500
`FUNCTION_INVOCATION_FAILED`**. La route est pourtant déployée.

Le correctif 3 a posé le garde d'authentification sur cette route et a
diagnostiqué le 500 sans y toucher, parce que la cause était hors de son
périmètre. **Lis `RAPPORT_FIX_3.md` §3 avant de commencer** — il contient la
pile d'imports fautive et le mécanisme. Ne refais pas ce diagnostic.

Point important qu'il soulève : tant que le 500 persiste, le **503 du garde
est masqué**. Il ne faut donc surtout pas faire disparaître le 500 sans
vérifier que le garde prend le relais — sinon on transforme une panne en
route ouverte sur Internet.

**Ordre imposé :**

1. corrige la cause du 500 ;
2. **vérifie immédiatement** que la route rend bien `503` (sans jeton, en
   production simulée) et non `200`. Si elle rend `200`, tu as ouvert une
   porte : arrête-toi et écris-le en tête de rapport.

Hypothèse principale du rapport 3 : la fonction Vercel importe depuis
`../../src/lib/tooling/catalog`, or une fonction serverless ne partage pas la
résolution de modules du bundle client. Vérifie-la avant de la retenir.

Si la seule correction possible passe par `src/`, **ne la fais pas** :
décris-la précisément (fichier, ligne, changement à faire) dans ton rapport.

## 2. Dépendances vulnérables

`npm audit` a relevé (cf. `RAPPORT_C.md §6`) :

| Paquet | Sévérité | Nature |
|---|---|---|
| `dompurify` ≤ 3.4.12 | moyenne | XSS |
| `nanoid` < 3.3.18 | **élevée** | déni de service |
| `postcss` ≤ 8.5.22 | moyenne | — |

Traite-les dans cet ordre : `nanoid` d'abord (la plus élevée).

**Règles :**

- Relance `npm audit` toi-même : le relevé date, il a pu changer.
- Préfère `npm audit fix` **sans** `--force`. Si `--force` est nécessaire, il
  introduit des changements de version majeure : **ne le lance pas**, liste
  ce qu'il ferait et laisse la décision.
- Ces paquets sont probablement des dépendances **transitives**. Si tu ne
  peux pas les relever sans casser leur parent, dis-le — un `overrides` dans
  `package.json` est une option, mais elle se justifie par écrit.
- Après toute modification de `package.json` : `npx tsc --noEmit` doit passer,
  et `npm run build` doit réussir. Ce sont les deux seules mesures globales
  que tu as le droit de lancer, parce qu'un changement de dépendance touche
  tout le monde par nature.

## 3. `vite.config.ts`

Vérifie qu'aucun `define` ni `envPrefix` élargi ne fait fuiter une variable
serveur dans le bundle client. Le rapport C conclut que non — **contre-vérifie**,
c'est cinq minutes et l'enjeu est un secret en clair chez tous les visiteurs.

## Le test qui verrouille

Pour le 500 : un test qui charge le module de la route et échoue si l'import
casse. C'est exactement ce que le déploiement ne savait pas détecter.

Pour le garde : les tests du correctif 3 existent déjà dans
`api/_agent/garde.test.ts` — vérifie qu'ils passent toujours après ta
correction, et ajoute le cas « route chargée + sans jeton → 503 ».

## Rappel

Périmètre exclusif : `api/`, `package.json`, `vite.config.ts`. Rapport partiel
obligatoire. Si tu laisses le dépôt non compilable, dis-le **en tête**.
