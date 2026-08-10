# CE QUI EXISTE DÉJÀ DANS LE SOCLE — sers-t'en, ne le réécris pas

Deux campagnes sont passées avant toi. Voici ce dont tu hérites. Réécrire l'une de ces
briques serait du travail perdu **et** un conflit avec les autres agents.

## Le CRUD générique de `CollectionRepeater`

`src/components/cms/CollectionRepeater.tsx` sait désormais créer et supprimer, pour
**n'importe quelle** collection, sans code spécifique par app :

```tsx
<CollectionRepeater
  collectionId="deploys"
  onOpen={drill.open}
  allowCreate            // optionnel, true par défaut
  allowDelete            // optionnel, true par défaut
/>
```

Ce qu'il fournit tout seul :

- un bouton **« + Nouveau <singular> »** dans l'en-tête ;
- un formulaire généré depuis `def.fields`, **plus un champ pour `def.titleField`**
  (les 23 collections du dépôt ont leur titleField hors de `fields` — le composant le
  synthétise via `formFieldsFor()`) ;
- la validation : titre obligatoire, anti-doublon insensible à la casse, message d'erreur
  visible ;
- la suppression avec confirmation en deux temps ;
- un **état vide qui a une issue** : phrase + bouton de création.

Vérifié de bout en bout sur `it-rd › Deploys` : formulaire → création → item visible avec
son titre → compteur à jour → zéro erreur console.

**Donc** : toute page de ton périmètre qui rend une collection sans pouvoir y ajouter d'item
se corrige en branchant ce composant, pas en écrivant un formulaire à la main.

## Les notifications

`useShellStore.addToast(...)` pousse un toast **et** alimente un historique persistant
(`notifications`, plafonné à 50, compteur de non-lues) consultable depuis la cloche de la
barre du haut. Tu n'as rien à faire de plus : un toast laisse désormais une trace.

## La navigation inter-sections et inter-apps

Un seul événement, et il est écouté par `AppFrame` :

```ts
window.dispatchEvent(new CustomEvent('coach-os:open-app-section', {
  detail: { appId: 'sales', sectionId: 'pipeline' },
}));
```

`AppFrame` cherche une section dont l'`id` correspond et navigue. **N'invente pas d'autre
nom d'événement** : un `coach-os:navigate` a déjà été écrit une fois, personne ne l'écoutait,
et le bouton paraissait câblé sans rien faire.

## Le piège du crumb dupliqué

Si une app publie son détail à la fois via `useWindowPage().setDetail` **et** via
`useCollectionDrill` sur la même collection, les deux republient le même crumb partagé avec
leur propre `onBack`. Celui du drill s'exécute en dernier et gagne : `navigateToSection`
appelle alors un `onBack` qui ne ferme pas l'overlay, et changer de section laisse la fiche
affichée par-dessus — ce qui se lit comme un clic sans effet.

Ce défaut a été trouvé et corrigé dans Marketplace. **Vérifie-le sur chaque app de ton
périmètre qui a des fiches de détail.**

## Ce que le socle t'interdit

`src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`, `src/contexts/`, `src/apps/_ui/`
sont **hors de ton périmètre**, quoi qu'il arrive. Si un défaut s'y trouve, note-le au
rapport avec le fichier et une ligne d'explication. Un autre agent le traitera.
