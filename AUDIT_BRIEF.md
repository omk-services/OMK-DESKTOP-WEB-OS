# BRIEF — Audit complet de Coach OS

## Objectif

Trouver **tous** les bugs et mauvaises pratiques de ce dépôt, et les livrer classés
par gravité avec le correctif exact. Le rapport sera exécuté ensuite.

Écrire dans `AUDIT_RAPPORT.md`, à la racine du dépôt.

## Le dépôt

`C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os`

Vite 8 · React 19 · TypeScript · Tailwind v4 · Zustand · motion · three ·
`@supabase/supabase-js` · posthog-js. 191 fichiers `.ts`/`.tsx`.
Shell type « OS de bureau » : fenêtres déplaçables, dock, apps montées dans des
`WindowFrame`, effets WebGL `canvasui/v30` (38 effets).

## Faits déjà mesurés — NE PAS REFAIRE

- **`npx tsc --noEmit -p tsconfig.app.json` → 88 erreurs.** Répartition :
  32× TS2503 (`Cannot find namespace 'JSX'`), 19× TS6133 (déclaré non utilisé),
  10× TS2339, 9× TS2591, 7× TS2322. **Les lister toutes et donner le correctif
  par famille**, pas fichier par fichier : les 32 TS2503 ont une seule cause
  (React 19 a retiré le namespace global `JSX`, il faut `React.JSX.Element`).
- **Déjà corrigé au commit `bc4a1d9`, ne pas re-signaler :**
  - `AppFrame.tsx` — le canvas `BackgroundFX` en `mix-blend-mode: screen` dans un
    conteneur scrollable forçait la recomposition de toute la fenêtre à chaque
    frame (tremblement visible). Corrigé par `isolation` + `contain: paint` +
    `will-change`.
  - `AppFrame.tsx` — `ResizeObserver` sans hystérésis observant l'élément dont il
    fait varier la largeur. Corrigé.
- `Desktop.tsx:102` — `<AnimatePresence>` enveloppe des `<div key>` **non-motion**.
  AnimatePresence ne pilote que des enfants `motion` directs : les animations de
  sortie ne se jouent jamais, en silence. **Confirmer et donner le correctif.**
- Le serveur de dev n'écoute **que sur IPv6 `[::1]`**, pas sur `127.0.0.1`.
- Aucun `.env.local` — seulement `.env.example`. Supabase, PostHog et Usertour
  sont donc inertes en local.

## Périmètre — par ordre de priorité

1. **Bugs de rendu et de performance.** Fuites de `requestAnimationFrame`,
   `useEffect` sans nettoyage, écouteurs jamais retirés, contextes WebGL créés
   sans être détruits (le navigateur en plafonne ~16 : au-delà il en tue de force,
   et il y a 38 effets montés par app), `ResizeObserver` en boucle,
   `mix-blend-mode` / `backdrop-filter` sur du contenu animé.
2. **Correction React.** Dépendances de hooks fausses ou supprimées par
   `eslint-disable`, état dérivé stocké au lieu d'être calculé, composants définis
   dans le corps du rendu (remontage à chaque frame), clés d'index sur listes
   mutables, `useEffect` qui écrit l'état qu'il lit.
3. **TypeScript.** Les 88 erreurs, plus les `any`, `as unknown as`, `@ts-ignore`,
   et les types de retour manquants sur les fonctions exportées.
4. **Accessibilité.** Éléments cliquables non focalisables, `aria-label` absents
   sur les boutons à icône seule, pièges de focus dans les fenêtres, contraste.
5. **Sécurité et données.** Clés en dur, `dangerouslySetInnerHTML`, données de
   démo confondues avec des données réelles, absence de gestion d'erreur autour
   des appels Supabase.
6. **Mort et duplication.** Fichiers jamais importés, dossiers `_DRAFTS_*` et
   `_TRASH_*` à la racine, composants dupliqués (`_v1_css_retired` par exemple).

## INTERDIT

1. **Ne rien modifier.** Aucune édition de fichier, aucun `npm install`, aucun
   `git commit`. C'est un audit : tu lis, tu rapportes. L'exécution viendra après,
   sur la base de ton rapport.
2. Ne rien supprimer. Ni `rm -rf`, ni `rmtree`, ni `Remove-Item -Recurse` : il y a
   des jonctions NTFS sur ce disque, ces commandes suivent le lien et détruisent
   la cible réelle.
3. Ne pas toucher aux dossiers `_TRASH_2026-07-25_pre_blackwidow_scarletwitch_purge`
   et `_DRAFTS_PPR_LANE` autrement que pour constater leur existence.
4. Ne pas sortir du dépôt `coach-os`.
5. **Ne pas inventer.** Chaque constat porte `fichier:ligne`. Un constat sans
   localisation vérifiable ne vaut rien et fera perdre du temps à l'exécution.
6. Ne pas ré-signaler ce qui est listé comme déjà corrigé plus haut.

## Livrable — `AUDIT_RAPPORT.md`

Un tableau de synthèse en tête : gravité × nombre.

Puis une entrée par constat, groupées par gravité :

```
### [P1] Titre court
- **Où** : src/chemin/Fichier.tsx:123
- **Symptôme** : ce que l'utilisateur voit ou subit
- **Cause** : pourquoi le code produit ça
- **Correctif** : le diff ou le remplacement exact
- **Risque du correctif** : faible / moyen / élevé, et pourquoi
```

Gravités :
- **P0** — casse fonctionnelle, fuite mémoire, faille. À corriger tout de suite.
- **P1** — bug visible ou dégradation nette.
- **P2** — mauvaise pratique sans symptôme actuel mais qui mordra.
- **P3** — cosmétique, dette, ménage.

Terminer par une section **« ordre d'exécution recommandé »** : quels correctifs
sont indépendants et groupables en un seul passage, lesquels doivent être isolés
parce qu'ils touchent au comportement.

**Si tu dois t'arrêter avant la fin, écris quand même le rapport** avec ce que tu
as établi et ce qui reste à couvrir. Un audit partiel et localisé vaut mieux qu'un
audit complet et approximatif.
