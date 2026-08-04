# Tâche — Canvas UI : effet du Desktop + style par app

Trois modifications, dans cet ordre. Chacune est localisée ; les points
d'insertion ont déjà été établis par audit, ne les recherche pas.

## 1. Rendre le nuanceSlot configurable par app

`src/components/AppFrame.tsx` passe aujourd'hui `nuanceSlot={0}` EN DUR
(chercher `nuanceSlot={0}`). Conséquence : chaque app n'affiche que la
nuance[0] de son thème, et les apps qui partagent un thème sont visuellement
identiques deux à deux.

- Ajouter à `AppFrameProps` (à côté de `disableSignatureFx`) :
  `canvasNuance?: 0 | 1;`
- Le destructurer dans la signature de `AppFrame`.
- Le passer : `nuanceSlot={canvasNuance ?? 0}`.

## 2. Ajouter un override d'effet explicite

`src/components/canvasui/v30/BackgroundFX.tsx` :

- Dans `BackgroundFXProps`, après le champ `nuanceSlot`, ajouter :
  `/** Override direct de l'effet, court-circuite la résolution par thème. */`
  `effectId?: CanvasEffectId;`
- Dans `resolveEffectId(props)`, en TOUTE PREMIÈRE ligne du corps :
  `if (props.effectId) return props.effectId;`
  Ne touche à rien d'autre dans cette fonction.

`src/components/AppFrame.tsx` :

- Ajouter à `AppFrameProps` : `canvasEffect?: CanvasEffectId;`
- L'importer depuis `./canvasui/v30` (le type `CanvasEffectId` y est exporté).
- Le destructurer, puis le passer : `effectId={canvasEffect}`.

`effectId` non fourni = `undefined` = comportement actuel strictement préservé.

## 3. Remettre l'effet canvas sur le Desktop

`src/components/Wallpaper.tsx` contient un commentaire disant qu'aucun effet
canvas n'est monté sur le fond de bureau, et un `{themeMeta ? null : null}` mort.

- Monter `<BackgroundFX themeId={globalThemeId} />` SANS `nuanceSlot` — l'absence
  de `nuanceSlot` sélectionne l'effet `dominant` du thème, distinct des nuances
  utilisées par les apps.
- Le thème global se lit via le store : `useThemeStore((s) => s.globalTheme)`.
- Le conteneur doit être en `position: absolute; inset: 0; pointer-events: none`
  et derrière les fenêtres (z-index inférieur à celui du calque fenêtres de
  `Desktop.tsx`).
- **NE PAS utiliser `mix-blend-mode`.** Un canvas animé en mode fusion force la
  recomposition de toute la page à chaque frame — c'est un bug déjà corrigé
  ailleurs dans ce dépôt, ne le réintroduis pas.
- Remplacer le commentaire obsolète et supprimer le `{themeMeta ? null : null}`.

## 4. Répartir les nuances entre apps partageant un thème

Ces paires partagent un thème et sont donc identiques visuellement. Donner
`canvasNuance={1}` à la SECONDE de chaque paire, dans le fichier de l'app
concernée (là où elle rend `<AppFrame ...>`) :

| thème | garde nuance 0 | passe à `canvasNuance={1}` |
|---|---|---|
| brutalism | product | operations |
| trust | finance | legal |
| editorial | tasks | cognition |
| glassmorphism | marketplace | audit |
| liquid-glass | sales | onboarding |

Si une app de la colonne de droite n'utilise pas `AppFrame`, l'ignorer et le
signaler dans le rapport.

## INTERDIT

1. Ne modifie AUCUN fichier sous `src/components/canvasui/v30/*/` (les 33
   moteurs et leurs wrappers). Ils viennent de l'amont et ont été réalignés.
   Seul `BackgroundFX.tsx` à la racine de `v30/` est modifiable.
2. N'ajoute aucune dépendance, ne lance aucun `npm install`.
3. Ne touche pas à `src/index.css` ni à `src/hooks/useWindowManager.ts`.
4. Ne fais aucun `git commit`, aucun `git push`.
5. N'introduis pas de `mix-blend-mode`, ni de `ResizeObserver` sur un élément
   dont tu fais varier la taille du contenu.
6. Ne supprime rien. Pas de `rm -rf`, pas de `Remove-Item -Recurse`.

## Vérification obligatoire avant de rendre

Lance et rapporte le résultat exact :

```
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
```

La référence est **88 erreurs préexistantes**. Si ton total dépasse 88, tu as
introduit une régression : corrige-la avant de rendre. Rapporte le chiffre.

## Rapport attendu

Liste chaque fichier modifié avec le diff appliqué, le nombre d'erreurs TS
avant/après, et tout point de la tâche que tu n'as pas pu exécuter avec la
raison. Un point non fait et signalé vaut mieux qu'un point bâclé en silence.
