---
id: A_SOCLE
campagne: 2026-08-09 production-ready
ordre: 1 — passe SEUL, avant tous les autres
---

# BRIEF A — le socle commun

Tu passes **seul et en premier**. Les quatre agents suivants dépendent de ce que tu livres pour
se vérifier. Ne traîne pas, mais ne bâcle pas : une régression ici casse les 19 apps.

## Ton périmètre exclusif

```
src/components/**
src/lib/**
src/stores/**
src/hooks/**
src/contexts/**
src/apps/_ui/**
src/data/**
tools/**
```

**Interdit** : tout ce qui est sous `src/apps/<nom-d-app>/` (sauf `_ui/`). C'est le périmètre des
autres agents. Si tu vois un bug dans `src/apps/dashboard/…`, **note-le dans ton rapport**, ne le
corrige pas.

## Ce qui est déjà mesuré — ne le refais pas

- `npx tsc --noEmit` sortait **exit 0** avant le lancement de cette campagne.
- Les 19 apps s'ouvrent sans **aucune** erreur console ni `pageerror` (vérifié Playwright,
  16 apps ouvertes d'affilée).
- Le serveur de dev **tourne déjà** sur `http://localhost:5173`. Ne le relance pas.
- `tools/shot.mjs` fonctionne, sélecteur strict `[data-section="Label"]`, exit 4 si introuvable.
- `TenantPill` est bien monté dans `TopBar.tsx` (ligne ~302) et son dropdown s'ouvre.
- `FleetItemGrid` (`src/apps/_ui/FleetItemCard.tsx`) a déjà été durci : `2xl:grid-cols-2`.
- `AppFrame.tsx` écoute déjà `coach-os:open-app-section` et navigue vers la section demandée.
- `WindowFrame.tsx` : fenêtre par défaut 920×600, `overflow-auto` sur le contenu.

## Ce que tu cherches

### 1. Dette de typage et de contrat

- `any` implicite ou explicite, `as unknown as`, `@ts-ignore`, `@ts-expect-error` sans
  justification écrite juste au-dessus.
- Props optionnelles qui devraient être requises, unions élargies pour faire taire le compilateur.
- Fonctions exportées sans type de retour.

### 2. Pièges React déjà payés dans ce dépôt

- **Instantané dans un store externe** : un sélecteur Zustand qui construit un **objet neuf**
  à chaque appel fait boucler React (`useSyncExternalStore` détecte un changement d'identité à
  chaque rendu). Ce piège a été rencontré **quatre fois** ici. Cherche les
  `useXStore((s) => ({ ... }))` et `useXStore((s) => s.items.filter(...))` — tout sélecteur qui
  ne retourne pas une **référence stable**.
- Composant défini **dans** le corps d'un autre composant : nouvelle identité de type à chaque
  rendu → React démonte/remonte et perd le `useState` local. `AppFrame.tsx` a déjà été corrigé
  sur ce point (`ActiveSection` hissé au module) — vérifie qu'il n'en reste pas ailleurs.
- `useEffect` sans tableau de dépendances, ou avec un tableau qui ment.
- Écouteurs `window.addEventListener` sans `removeEventListener` dans le retour du `useEffect`.
- `setTimeout` / `setInterval` sans `clearTimeout` / `clearInterval`.

### 3. Fuites et robustesse

- `localStorage` lu sans `try/catch` (mode privé, quota plein → throw).
- `JSON.parse` sans garde.
- `URL.createObjectURL` sans `revokeObjectURL`.
- Accès `array[0].champ` sans vérifier la longueur.
- Division par une valeur qui peut être 0.

### 4. Accessibilité

- `<button>` sans texte accessible ni `aria-label`.
- `<div onClick>` qui devrait être un `<button>` (pas focusable au clavier).
- `<input>` / `<select>` sans `<label>` associé ni `aria-label`.
- Contrastes : les jetons de thème doivent rester lisibles sur les **12 thèmes**, pas seulement
  sur le thème par défaut.

### 5. Cohérence des jetons de thème

Le contrat du dépôt est **zéro classe de palette Tailwind en dur**. Cherche dans ton périmètre :
`bg-white`, `bg-stone-*`, `text-slate-*`, `border-zinc-*`, `text-gray-*`, `bg-neutral-*`, etc.
Chacune doit devenir une variable `var(--theme-*)` ou `var(--panel-*)`.

**Exception légitime** : les vignettes de prévisualisation de thème dans Settings affichent
volontairement les couleurs d'un *autre* thème. Ne les touche pas (et de toute façon Settings
est hors de ton périmètre).

Les couleurs **sémantiques** (vert = sain, ambre = alerte, rouge = incident, bleu = info) restent
en hex explicite via une prop `tone`. C'est le canon, ne le convertis pas.

## Ta boucle

```
passe 1 : lis tout ton périmètre, liste les défauts, range-les PAR CAUSE (pas par fichier)
passe 2 : corrige cause par cause, en commençant par celle qui explique le plus de symptômes
passe 3 : npx tsc --noEmit → 0 erreur sur tes fichiers
passe 4 : relis tout ton périmètre à neuf
si passe 4 remonte du neuf → retour en passe 2
sinon → passe 5 : dernière relecture, puis rapport
```

**Deux passes consécutives sans rien de neuf** = tu as fini. Pas avant.

## Ce que tu livres

- Des commits atomiques, message français, préfixe conventionnel.
- `_briefs/2026-08-09_prod/RAPPORT_A_SOCLE.md` : les causes trouvées, ce qui a été corrigé,
  ce que tu as vu **hors périmètre** et laissé aux autres (liste de fichiers + une ligne chacun).
