# CORRECTIF 4 — deux pages cassent, et la cause est invisible (ÉLEVÉ)

## Périmètre EXCLUSIF en écriture

```
src/apps/legal/
src/apps/people/
src/components/ErrorBoundary.tsx
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_4.md`.

Rien d'autre. **Ne touche ni à `src/lib/cms/`** (corrigé il y a une heure),
**ni à `src/lib/tooling/`, `src/lib/auth/`, `src/stores/`, `api/`** — trois
autres agents y travaillent.

## Le défaut — reproduit à l'écran

Écran « This app hit a snag » sur :

- **Legal › Conformité**
- **People / Agents › Approvals**

## Ce qui est déjà su, et qu'il ne faut pas refaire

Un audit précédent a affirmé que la frontière d'erreur « avale la cause ».
**C'est faux, vérifie-le toi-même** : `ErrorBoundary.componentDidCatch`
(`src/components/ErrorBoundary.tsx:18-20`) fait bien
`console.error('Citadelle app error:', error, errorInfo)`.

La cause **est** journalisée dans la console du navigateur. Le vrai défaut est
ailleurs, et il est double :

1. l'utilisateur ne reçoit aucun indice — ni identifiant d'erreur, ni nom de la
   section fautive — donc il ne peut rien rapporter d'exploitable ;
2. rien ne remonte au-delà de la console : une erreur en production chez un
   client est perdue.

Ne rejoue donc pas le mauvais diagnostic. Corrige le vrai.

## Ce qu'on attend

### 1. Trouver ce qui jette, réellement

Lis le code de `Legal › Conformité` et de `People / Agents › Approvals`.
Hypothèses à tester en priorité, dans cet ordre :

- accès à une propriété d'un objet absent ;
- `.map` / `.filter` sur `undefined` ;
- une entrée d'ontologie ou une collection attendue et absente ;
- une donnée de `seed.ts` dont la forme a changé.

**Une cause commune est probable.** Si une seule ligne explique les deux pages,
c'est le résultat le plus utile que tu puisses rendre — dis-le clairement.

### 2. Balayer les autres sections

Ces deux pages sont celles que l'utilisateur a ouvertes. Il y en a très
probablement d'autres. Balaye **toutes** les sections de `src/apps/legal/` et
`src/apps/people/` à la recherche du même motif, et corrige-les toutes.

Range ton rapport **par cause**, pas par page.

### 3. Rendre la frontière d'erreur utile

Sans la transformer en système de télémétrie :

- affiche à l'utilisateur le **nom de la section** qui a échoué et un
  identifiant d'erreur court, qu'il puisse citer ;
- garde le `console.error` existant, et enrichis-le du contexte (quelle app,
  quelle section) ;
- **n'affiche jamais** la trace d'exécution brute à l'utilisateur — elle peut
  contenir des données.

Le message actuel — « The rest of your Citadelle is unaffected — only this
window needs a reload » — est bon. Garde ce ton.

### 4. Ne masque pas le défaut

Un `try/catch` autour du composant fautif, ou un `?.` posé jusqu'à ce que
l'écran cesse de rougir, **n'est pas un correctif** : c'est le défaut rendu
invisible. Corrige la donnée ou le contrat, pas le symptôme. Si la donnée est
légitimement absente, alors la page doit afficher un **état vide assumé**, pas
un écran d'erreur.

## Le test qui verrouille

Pour chaque page corrigée, un test qui la rend avec la donnée telle qu'elle est
réellement (y compris vide) et vérifie qu'elle ne jette pas. Ces tests doivent
échouer sur le code d'avant.

Lance **uniquement** tes propres tests, avec `--maxWorkers=2`.

## Rappel

Périmètre exclusif. Aucun compteur global. Rapport partiel obligatoire.
