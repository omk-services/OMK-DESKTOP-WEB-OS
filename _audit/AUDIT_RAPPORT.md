# Coach OS — Audit complet

> **Cible** : dépôt `coach-os` (Vite 8 · React 19 · TS 6 · Tailwind v4 · Zustand · motion · three · 191 fichiers `.ts`/`.tsx`).
> **Date** : 2026-08-04.
> **Méthode** : lecture seule, `npx tsc --noEmit -p tsconfig.app.json` pour les erreurs TS, `Grep` et `Read` ciblés, 4 sous-agents Explore pour les catégories rendu/React/a11y+sécurité/mort-code.
> **Périmètre** : tout `src/`, la racine du dépôt, `tsconfig.app.json`, `vite.config.ts`, `.env*`, `_DRAFTS_PPR_LANE/`, `_TRASH_2026-07-25_pre_blackwidow_scarletwitch_purge/`.
> **Non couvert** : `dist/` (artefacts de build, gitignoré), `node_modules/`, `wiki/`, `docs/`, `logs/`, fichiers `.codex` / `.windsurf` / `.moat` / `.superpowers` / `.claude/` (configurations d'agents).
> **Hors brief** : `bc4a1d9` a déjà corrigé `AppFrame.tsx` (canvas + `ResizeObserver` hystérésis). Ces deux items NE sont PAS ré-listés ci-dessous.

---

## Synthèse gravité × nombre

| Gravité | Nombre | Catégorie dominante |
|---|---|---|
| **P0** — casse / fuite / règle React violée | **5** | Rules of Hooks · WebGL context-ceiling · dépendances d'effet qui ré-bouclent |
| **P1** — bug visible ou dégradation nette | **≈ 22** | AnimatePresence sur enfants non-motion · `useEffect` qui réécrit son propre état · placeholder client Supabase · try/catch silencieux · a11y fenêtres/cliquables · index keys · `as unknown as` |
| **P2** — dette qui mordra · perf · duplication | **≈ 35** | Composants inline · sélecteurs Zustand instables · wrapper sans deps array · suppression `eslint-disable` non justifiée · 28 `@ts-expect-error` |
| **P3** — ménage · cosmétique · config | **≈ 25** | 88 erreurs TS par famille · `key={i}` · `key={i}` sur listes statiques · fichiers retired · logs/gitignore |
| **Total** | **≈ 87 constats** | |

Note : les 88 erreurs TS sont **un seul constat** côté correction (1 famille par code), pas 88 lignes distinctes.

---

## Faits mesurés (vérifiés)

| Mesure | Valeur | Source |
|---|---|---|
| Fichiers `.ts`/`.tsx` sous `src/` | **191** | `find src -type f \( -name "*.ts" -o -name "*.tsx" \) \| wc -l` |
| `npx tsc --noEmit -p tsconfig.app.json` | **88 erreurs** | tsc brut, run 2026-08-04 |
| Répartition TS | 32× TS2503, 19× TS6133, 10× TS2339, 9× TS2591, 7× TS2322, 5× TS2367, 2× TS2345, 1× TS2561, 1× TS2459, 1× TS2353, 1× TS2307 | tsc + `grep -oE "TS[0-9]+" \| sort \| uniq -c` |
| Effets canvas-ui déclarés | **38 dossiers** sous `src/components/canvasui/v30/` | `ls src/components/canvasui/v30/` |
| `_v1_css_retired/` (mort) | **13 fichiers** | `ls src/components/canvasui/_v1_css_retired/` |
| `_TRASH_2026-07-25_pre_blackwidow_scarletwitch_purge/` | `src/apps/` + `tests/growth/` | `ls` direct |
| `src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` | 1 fichier (`SalesDetailDrawer.tsx`) | `ls` direct |
| `_DRAFTS_PPR_LANE/` | 1 fichier (`event_log_2026-07-30.jsonl`) | `ls` direct |
| `.env.local` réel | **absent** (seulement `.env.example` + `.env.local.example` + `.env.local.RETIRE.txt`) | `ls -la` |
| Vite version | **v8.1.5** | `.vite-smoke.log` ligne 1 |
| Vite port | **5180** | `.vite-smoke.log` |
| Vite host | **`localhost`** (aucun `server.host` dans `vite.config.ts`) | `vite.config.ts:1-8` |
| Erreur Rules of Hooks | `AppFrame` — change d'ordre des hooks (cf. `.vite-smoke.log` 2:46:33 PM) | `.vite-smoke.log` |

---

## P0 — casse fonctionnelle, fuite, faille

### [P0-1] Rules of Hooks violées dans AppFrame
- **Où** : `src/components/AppFrame.tsx:75-148` (run-time) ; événement capturé dans `.vite-smoke.log` 2:46:33 PM
- **Symptôme** : `React has detected a change in the order of Hooks called by AppFrame. This will lead to bugs and errors if not fixed.` — la position des hooks diffère entre renders successifs ; React 19 peut conserver un état interne dans le mauvais slot, déclenchant des bugs d'état latent (sélecteur Zustand qui lit la mauvaise valeur, `useRef` qui pointe vers un ancien canvas, etc.).
- **Cause** : très probablement le `useThemeIdFor(appId)` ligne 93 qui appelle un hook personnalisé dont le résultat dépend de `appId` dérivé de `title` (ligne 92). Si `title` devient `undefined` ou change entre renders (notamment quand `WindowFrame` ferme/remonte une fenêtre avec un titre différent pendant un HMR ou un swap de thème), l'ordre effectif des hooks change. À confirmer en lisant le hook personnalisé dans `src/lib/themes/store.ts` et en instrumentant.
- **Correctif** :
  1. Garantir que `appId` est stable : `if (!title) throw new Error('AppFrame requires a title')` côté `AppFrame`, ou fallback à un id statique par défaut.
  2. Garantir que `useThemeIdFor` n'appelle pas conditionnellement d'autres hooks.
  3. Si le diagnostic révèle un hook dans une branche conditionnelle, le remonter au-dessus de tous les `useState`/`useEffect`.
- **Risque du correctif** : moyen. La fonction `useThemeIdFor` doit être ré-explorée et son implémentation peut nécessiter un refactor. Tester manuellement après chaque ouverture/fermeture de fenêtre.

### [P0-2] Plafond WebGL Chromium (16 contexts/page) atteint
- **Où** : `src/components/AppFrame.tsx:301-328` (chaque fenêtre ouverte monte son propre `<BackgroundFX>` instance)
- **Symptôme** : après l'ouverture de 4-5 apps, les effets WebGL des dernières apps ouvertes apparaissent noirs/vides, sans erreur console — Chromium tue silencieusement les anciens contextes pour rester sous la limite.
- **Cause** : `BackgroundFX.tsx:198` instancie un `WebGLRenderer` par appel ; 38 effets × 5 fenêtres = bien plus que les 16 contexts autorisés par Chromium. `CssFallback` reste visible mais le canvas WebGL ne s'affiche pas.
- **Correctif** :
  1. Ne pas monter `<BackgroundFX>` dans CHAQUE `AppFrame`. Le réserver aux apps qui en ont vraiment besoin (signature forte).
  2. Soit monter un seul canvas global partagé via `Wallpaper.tsx` (singletons `renderer` partagé entre toutes les `CssFallback`), soit basculer vers le mode `disableCssFallback` quand le canvas actif n'est pas au focus.
  3. Court terme : pour les apps "picker/showcase" (settings, design), passer `disableSignatureFx={true}` plus largement.
- **Risque du correctif** : moyen. Le bon visuel (signature par app) est le coût principal. Compromis acceptable : un seul canvas global + effet par-app via CSS uniquement.

### [P0-3] `useWindowManager.ts` : `useEffect` qui boucle sur l'état qu'il écrit
- **Où** : `src/hooks/useWindowManager.ts:52-142`
- **Symptôme** : pendant un drag, `mousemove` déclenche `setWindowPosition` → `windowPosition` change → l'`useEffect` ligne 52 re-déclare ses handlers → `handleMove`/`handleUp` sont retirés/ajoutés à chaque frame (~60 fois/seconde). Mémoire + GC, et le `preSnapStateRef.current = { position: { ...windowPosition }, size: { ...windowSize } }` (ligne 116) capture des valeurs potentiellement décalées d'une frame.
- **Cause** : le tableau de dépendances ligne 142 inclut `windowPosition` et `windowSize`, qui sont à la fois lues et écrites dans le corps de l'effet. Pattern classique.
- **Correctif** :
  ```ts
  }, [isDragging, resizeDir, snapZone, windowId, updateWindowState]);
  // windowPosition/windowSize : lire depuis posRef.current / sizeRef.current (déjà synchronisés lignes 77-78 et 105-106).
  // handleUp utilise posRef.current / sizeRef.current au lieu de windowPosition / windowSize.
  ```
  Le `useEffect` ligne 24 (sync depuis le store) doit aussi voir son tableau de deps nettoyé : `[windowState?.position, windowState?.size]` est OK si on garde la garde `!isDragging && !resizeDir`.
- **Risque du correctif** : faible. Le pattern refs est déjà en place dans le hook, il suffit de l'utiliser dans les handlers.

### [P0-4] `DemoWindowFrame.tsx` : `useEffect` sans tableau de dépendances
- **Où** : `src/apps/onboarding/citadel/DemoWindowFrame.tsx:67`
- **Symptôme** : `useEffect(() => {...})` sans `[]` — l'effet (et son cleanup) re-courent à chaque render. Pendant un drag de la fenêtre Citadel, `addEventListener('mousemove')` puis `removeEventListener('mousemove')` sont appelés ~60 fois/seconde. Fuite de listeners possible si un `remove` rate, et surcoût CPU certain.
- **Cause** : oubli pur. La règle `react-hooks/exhaustive-deps` aurait dû le bloquer — vérifier si le linter tourne (`oxlint` est dans `devDependencies`, voir `package.json:30`).
- **Correctif** :
  ```ts
  useEffect(() => {
    // ... addEventListener
    return () => {
      // ... removeEventListener
    };
  }, [isDragging, resizeDir]);
  // + extraire handleMouseMove et handleMouseUp en useCallback (avec deps appropriées).
  ```
- **Risque du correctif** : faible. La logique interne ne change pas.

### [P0-5] `Desktop.tsx:102` — `<AnimatePresence>` sur enfants non-motion
- **Où** : `src/components/Desktop.tsx:102, 109, 117`
- **Symptôme** : à la fermeture d'une fenêtre, l'animation de sortie ne joue jamais — la fenêtre disparaît instantanément. Le user perçoit une saccade au lieu d'un fade-out 180 ms (déjà défini sur `<motion.div>` du `WindowFrame.tsx:53-56`).
- **Cause** : `<AnimatePresence>` n'orchestre que les enfants `motion.*` directs avec un prop `exit`. `<div key={win.id}>` est un DOM brut : unmount synchrone.
- **Correctif** :
  ```tsx
  <AnimatePresence>
    {windows.map(win => {
      if (win.id === 'drawer' || !win.isOpen) return null;
      // ...
      return (
        <motion.div
          key={win.id}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto"
        >
          <WindowFrame ...>...</WindowFrame>
        </motion.div>
      );
    })}
  </AnimatePresence>
  ```
  NB : le `<motion.div>` interne de `WindowFrame.tsx:53` peut être retiré pour éviter le double wrap.
- **Risque du correctif** : faible. Changement purement visuel.

---

## P1 — bug visible ou dégradation nette

### [P1-1] Sélecteur Zustand `useShellStore(s => s.windows.find(...))` retourne un nouvel objet à chaque store change
- **Où** : `src/components/WindowFrame.tsx:18`
- **Symptôme** : à chaque changement de n'importe quelle fenêtre (z-index d'une autre, position d'une autre, focus), **toutes** les `WindowFrame` du desktop re-rendent. Sur 5+ fenêtres, cascades de re-renders.
- **Cause** : `Array.prototype.find` retourne une référence à l'élément du tableau — mais dès qu'une autre partie du tableau change, la structure du tableau change, ce qui invalide la sélection par défaut de Zustand (`Object.is`). En pratique, comme `windows` est un nouveau tableau à chaque modification du store, l'identité change. À confirmer en lisant `shell.store.ts`.
- **Correctif** :
  ```ts
  import { useShallow } from 'zustand/react/shallow';
  const windowState = useShellStore(useShallow(s => s.windows.find(w => w.id === id)));
  // ou, plus chirurgical, séparer les sélecteurs en tranches par champ réellement lu.
  ```
- **Risque du correctif** : faible, mais exiger de valider que `find()` retourne bien un objet avec la même identité tant que `windows[i]` n'a pas changé. Si c'est le cas, le bug n'existe pas et c'est juste un useShallow inutile.

### [P1-2] `WindowContext.Provider` value instable
- **Où** : `src/components/WindowFrame.tsx:87`
- **Symptôme** : à chaque render de `WindowFrame`, l'objet `{ windowId, activePage, setActivePage, detail, setDetail }` est un nouveau littéral → tous les consommateurs de `useWindowPage()` (AppFrame, useCollectionDrill, etc.) re-rendent.
- **Cause** : `value={...}` est recalculé à chaque render, `React.memo`/`useMemo` chez les consommateurs ne peut pas court-circuiter.
- **Correctif** :
  ```ts
  const ctxValue = useMemo(() => ({ windowId: id, activePage, setActivePage, detail, setDetail }), [id, activePage, detail]);
  // + useCallback stable pour setActivePage / setDetail (mais useState les retourne déjà stables, donc OK).
  ```
- **Risque du correctif** : faible.

### [P1-3] Toast : `useEffect([onDismiss])` réinitialise le timer à chaque render parent
- **Où** : `src/components/Toast.tsx:34-38`, avec `onDismiss={() => dismissToast(toast.id)}` défini ligne 26 comme un arrow inline
- **Symptôme** : à chaque update du store (ajout d'un toast, focus d'une fenêtre, etc.), tous les `ToastItem` existants voient leur timer `setTimeout(onDismiss, 5000)` remis à zéro. Un toast peut rester affiché indéfiniment si le store update fréquemment.
- **Cause** : arrow inline = nouvelle identité → dépendance change → effet re-court → clear+setTimeout.
- **Correctif** :
  ```ts
  const onDismiss = useCallback(() => dismissToast(toast.id), [dismissToast, toast.id]);
  // + passer onDismiss à ToastItem, qui useEffect([onDismiss]) devient stable.
  ```
- **Risque du correctif** : faible.

### [P1-4] État dérivé dupliqué `activePage` / `detail` dans `WindowFrame`
- **Où** : `src/components/WindowFrame.tsx:29-30`
- **Symptôme** : deux sources de vérité pour la même donnée : `useState` local + valeur passée au contexte. `setDetail` du contexte n'invalide pas le `useState` local ; navigation rapide peut laisser des breadcrumbs périmés.
- **Cause** : state dupliqué sans mécanisme de sync.
- **Correctif** : supprimer les `useState` lignes 29-30, dériver depuis les setters du contexte :
  ```ts
  // WindowContext exposes setActivePage / setDetail. Le composant consommateur
  // appelle ces setters directement ; WindowFrame ne stocke plus rien.
  ```
  OU : abandonner le contexte et passer `activePage`/`detail` via props.
- **Risque du correctif** : moyen. Toutes les apps qui lisent/écrivent `useWindowPage().setDetail` doivent être re-vérifiées. Vérifier `useCollectionDrill.ts:43` qui mute via `setDetail`.

### [P1-5] Composants définis dans le corps du rendu → unmount/remount à chaque render
- **Où** :
  - `src/apps/marketplace/MarketplaceApp.tsx:93-95` (`Browse`, `Installed`, `Featured`)
  - `src/apps/dashboard/DashboardApp.tsx:53, 91, 119` (`Overview`, `Pipeline`, `CeoCockpit`)
  - `src/apps/finance/FinanceApp.tsx:97` (`Invoices`)
  - `src/apps/settings/SettingsApp.tsx:232` (`Row`)
- **Symptôme** : React considère ces fonctions comme un nouveau `componentType` à chaque render → unmount/remount du sous-arbre → tout `useState` local dans ces composants est réinitialisé à chaque render parent.
- **Cause** : déclaration d'une fonction fléchée dans le body du composant parent.
- **Correctif** : hisser au module scope :
  ```ts
  // Avant :
  function MarketplaceApp() {
    const Browse = () => grid(items);
    return <Browse />;
  }
  // Après :
  function Browse({ items }: { items: Item[] }) { return grid(items); }
  function MarketplaceApp() { return <Browse items={items} />; }
  ```
- **Risque du correctif** : faible, mais ajouter `displayName` pour que le DevTools reste lisible.

### [P1-6] `<BackgroundFX>` sans `key` → fuite de renderer WebGL au changement de thème
- **Où** : `src/components/AppFrame.tsx:321-326`
- **Symptôme** : quand l'utilisateur change de thème (global ou per-app override), `activeThemeId` change → React voit un nouveau prop mais le même composant → l'instance engine précédente n'est pas démontée → son renderer WebGL et ses event listeners restent en mémoire.
- **Cause** : sans `key={activeThemeId}`, React ne démonte pas l'ancien `BackgroundFX`.
- **Correctif** :
  ```tsx
  <BackgroundFX
    key={activeThemeId}
    themeId={activeThemeId}
    accent={accent}
    nuanceSlot={0}
    className="h-full w-full"
  />
  ```
- **Risque du correctif** : faible. Le montage est plus lent à chaque changement (acceptable pour un switch de thème, pas un re-render chaud).

### [P1-7] `repository.ts` : 3 `try/catch` silencieux sur Supabase
- **Où** : `src/lib/cms/repository.ts:62-81` (`upsertCollectionDef`), `:85-97` (`upsertItem`), `:102-121` (`appendCmsEvent`)
- **Symptôme** : `await supabase.from(...).upsert(...)` — la promesse résout avec `{ data, error }` même en cas d'échec RLS / 4xx / 5xx. Le code jette `await` (sans `const { error }`) dans un `try/catch` vide — aucun log. L'utilisateur voit son `setDetail` réussir localement, mais aucune persistance n'a eu lieu.
- **Cause** : pattern "fire-and-forget" qui ne capture pas le `error` retourné par Supabase.
- **Correctif** :
  ```ts
  const { error } = await supabase.from('cms_collections').upsert({...});
  if (error) console.warn('[cms] upsertCollectionDef failed', { id: def.id, error });
  ```
  Idem pour `upsertItem` et `appendCmsEvent`.
- **Risque du correctif** : faible. La fonction reste best-effort, mais un log apparaît en dev.

### [P1-8] `supabase.ts` : client actif même sans env (placeholder)
- **Où** : `src/lib/supabase.ts:12-15`
- **Symptôme** : si `.env.local` manque (état documenté dans le brief), `url` et `anonKey` sont `undefined`. Le client est construit avec `'https://placeholder.supabase.co'` et `'placeholder-anon-key'`. Tous les appels qui suivent émettent vers une URL invalide → erreurs réseau silencieuses (avalée par `try/catch` des repository).
- **Cause** : pas de garde `if (!supabaseConfigured) return`.
- **Correctif** :
  ```ts
  export const supabase = supabaseConfigured
    ? createClient(url!, anonKey!)
    : null;
  // Et propager le null : tous les sites d'appel doivent tester `if (!supabase) return null;`.
  ```
- **Risque du correctif** : moyen. Toutes les fonctions `repository.ts` doivent tester `supabase` non-null. Le gain : zéro appel réseau en local dev sans env, log clair au premier usage.

### [P1-9] WebGL `try/catch {}` muets dans les 5 *Vanilla.ts* (Object family)
- **Où** :
  - `src/components/canvasui/v30/AsciiObject/AsciiObjectVanilla.ts:905-913`
  - `src/components/canvasui/v30/DitheredObject/DitheredObjectVanilla.ts:782-792`
  - `src/components/canvasui/v30/GlassObject/GlassObjectVanilla.ts:678-688`
  - `src/components/canvasui/v30/ParticleObject/ParticleObjectVanilla.ts:548-558`
  - `src/components/canvasui/v30/LiquidObject/LiquidObjectVanilla.ts:1108-1118`
- **Symptôme** : quand Chromium refuse un `WebGLRenderer` (contexte plafond atteint, ou flags désactivés), `catch {}` avale l'erreur → l'utilisateur voit un canvas vide sans avertissement.
- **Cause** : `try { new THREE.WebGLRenderer(...) } catch { return null; }`.
- **Correctif** : ajouter `console.warn('[canvas-ui/Object] WebGLRenderer init failed', error.message)` dans chaque `catch {}`.
- **Risque du correctif** : faible.

### [P1-10] `WebGLFallbackBoundary` peut allouer un contexte avant que l'erreur ne soit levée
- **Où** : `src/components/canvasui/v30/fallback.tsx:25-44`
- **Symptôme** : `componentDidCatch` se déclenche APRÈS que `useEffect` ait créé le `WebGLRenderer` (et donc alloué le contexte). Le contexte fuit même si l'ErrorBoundary "récupère".
- **Cause** : `THREE.WebGLRenderer` alloue un contexte pendant le constructeur ; certaines versions de Three lancent l'erreur après l'allocation.
- **Correctif** : déplacer la création du renderer dans une fonction sync distincte que le boundary peut court-circuiter avant `useEffect`. Ou : faire que le constructeur de chaque engine check `isContextAvailable()` et retourne `null` sans allocation. Court terme : `console.warn` suffit pour signaler la fuite.
- **Risque du correctif** : élevé. Demande une refonte du pattern d'init. Compromis acceptable : loguer la fréquence en dev.

### [P1-11] `useToastStore` reset sur parent re-render (cf. P1-3, doublon confirmé)
- Cf. P1-3.

### [P1-12] A11y — `<WindowFrame>` racine sans `role="dialog"` / `aria-modal`
- **Où** : `src/components/WindowFrame.tsx:37-52` (div racine)
- **Symptôme** : un lecteur d'écran ne sait pas que la fenêtre est un dialogue modal ; ne peut pas la nommer (`aria-label`); ne peut pas piéger le focus dedans.
- **Cause** : pas d'attributs ARIA sur le conteneur.
- **Correctif** :
  ```tsx
  <div
    data-window-frame
    data-window-id={id}
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onMouseDown={() => focusApp(id)}
    className="..."
  >
  ```
  + ajouter une gestion de `Escape` pour fermer la fenêtre, + focus trap.
- **Risque du correctif** : moyen. Le focus trap est non-trivial sur des fenêtres repositionnables. Compromis : `aria-label` + `role="dialog"` seuls, Escape pour fermer, sans focus trap complet.

### [P1-13] A11y — titlebar / 8 poignées de resize : clavier inaccessible
- **Où** :
  - `src/components/WindowFrame.tsx:60-85` (titlebar drag)
  - `src/components/WindowFrame.tsx:111-118` (8 resize handles)
  - `src/apps/onboarding/citadel/DemoWindowFrame.tsx:114-118`, `:160-167` (idem)
- **Symptôme** : utilisateur clavier-only ne peut pas déplacer, redimensionner, ou maximiser une fenêtre.
- **Cause** : handlers `onMouseDown` uniquement.
- **Correctif** : ajouter `tabIndex={0}`, `role="toolbar"` sur la titlebar ; `role="separator"`, `aria-orientation="vertical|horizontal"`, `aria-label="Resize <edge>"` sur les poignées ; implémenter un mouvement aux flèches quand le focus est sur la poignée. Court terme : ajouter au minimum des boutons `<button aria-label="Close">` etc. en plus des TrafficLights.
- **Risque du correctif** : élevé. Le drag clavier est un mini-projet UX. Priorité : `tabIndex` + `role` + handler basique.

### [P1-14] A11y — boutons à icône seule sans `aria-label`
- **Où** (vérifié par lecture directe) :
  - `src/components/AppDrawer.tsx:31-36` (close Launchpad)
  - `src/components/Toast.tsx:49` (dismiss toast)
  - `src/components/Breadcrumbs.tsx:19-26` (back arrow)
  - `src/components/TopBar.tsx:320-335` (bell notifications)
  - `src/components/AppFrame.tsx:192-198` (collapse sidebar)
  - `src/components/AppFrame.tsx:352-358` (collapse tools panel)
- **Symptôme** : lecteur d'écran annonce "button" sans nom ; tab order reste navigable mais sans contexte.
- **Cause** : `title` n'est pas un substitut à `aria-label`.
- **Correctif** : ajouter `aria-label="..."` à chaque `<button>` concerné, à côté du `title` existant.
- **Risque du correctif** : faible.

### [P1-15] A11y — `disabled` sans `aria-disabled` ni explication
- **Où** :
  - `src/components/AppFrame.tsx:435-442` (Tool "Run" button)
  - `src/components/cms/itemDetailShared.tsx:53-79` (Prev/Next)
  - `src/components/cms/DynamicPageView.tsx:163-184` (Prev/Next)
  - `src/apps/onboarding/OnboardingApp.tsx:237-243`, `:245-250` (Back/Next steps)
  - `src/apps/settings/SettingsApp.tsx:369-381` (Replay tour)
- **Symptôme** : bouton désactivé non-annoncé ou sans contexte.
- **Cause** : attribut `disabled` natif mais pas d'explication SR.
- **Correctif** : ajouter `aria-disabled={true}` + `aria-describedby="..."` pointant vers un texte adjacent qui explique la condition (ex. "Requires consent", "No previous item").
- **Risque du correctif** : faible.

### [P1-16] `key={i}` sur listes mutables
- **Où** (au moins) :
  - `src/apps/_ui/widgets.tsx:54` (Kanban columns)
  - `src/apps/finance/FinanceDetailPage.tsx:59, 88`
  - `src/apps/sales/SalesItemDetail.tsx:216`
  - `src/apps/operations/OperationsItemDetail.tsx:111, 149, 195, 201, 220`
  - `src/apps/people/PeopleDetailPage.tsx:487`
  - `src/apps/it-rd/ItRdItemDetail.tsx:154`, `ItRdDetailPage.tsx:74, 91`
  - `src/apps/growth/GrowthDetailPage.tsx:68, 107`
  - `src/apps/product/ProductDetailPage.tsx:66, 94`
  - `src/apps/legal/LegalDetailPage.tsx:74`
- **Symptôme** : quand l'utilisateur réordonne (Kanban), insère, ou supprime un élément, l'état interne des composants item (champs éditables, hover, focus) reste collé à la mauvaise rangée.
- **Cause** : index array ≠ identité stable.
- **Correctif** : remplacer `key={i}` par `key={item.id}` partout où les items ont un id (Kanban : `key={col.title}`, etc.).
- **Risque du correctif** : faible.

### [P1-17] `SettingsItemDetail.tsx:32` — `draft` non réinitialisé entre items
- **Où** : `src/apps/settings/SettingsItemDetail.tsx:32` (`useState<Record<string, string>>(() => initialDraft(item))`)
- **Symptôme** : édition A → navigation vers B → B affiche le brouillon de A.
- **Cause** : `useState` initialisé à partir de `item` mais sans `key` sur le parent → le composant est réutilisé, le state persiste.
- **Correctif** : `<SettingsItemDetail key={item.id} item={item} />` côté parent (`DynamicPageView.tsx`).
- **Risque du correctif** : faible.

### [P1-18] `useCollectionDrill.ts:43` — eslint-disable + closure stale
- **Où** : `src/hooks/useCollectionDrill.ts:43` (`useEffect` deps `[isSectionActive, openId, items, def]` ; corps utilise `close`/`setDetail`/`items` non listés)
- **Symptôme** : l'effet re-court à chaque changement de `items` (hydratation CMS) et `close` est capturé stale.
- **Cause** : `eslint-disable-next-line react-hooks/exhaustive-deps` cache une dépendance manquante.
- **Correctif** : hisser `close`/`setDetail` dans des refs (`closeRef.current = close`), garder deps `[isSectionActive, openId]`.
- **Risque du correctif** : faible.

### [P1-19] `OnboardingApp.tsx:143-167` — useEffect sans cleanup
- **Où** : `src/apps/onboarding/OnboardingApp.tsx:143-167`
- **Symptôme** : si l'utilisateur clique "Restart" et que `phase` revient à `'quiz'`, les panels restent ouverts et positionnés sous la citadel.
- **Cause** : pas de `return () => { /* close panels, restore citadel size */ }`.
- **Correctif** : ajouter un cleanup qui remet `useDemoShellStore.setState({ windows: ...minimized citadel... })`.
- **Risque du correctif** : faible.

### [P1-20] `OnboardingApp.tsx:494-508` — closure stale sur `position.x`/`y`
- **Où** : `src/apps/onboarding/OnboardingApp.tsx:494-508`
- **Symptôme** : après un drag de l'audit panel, l'effet qui calcule la cascade utilise la valeur de position capturée.
- **Cause** : `useEffect` deps `[auditWin?.isOpen, auditWin?.isMinimized]` mais corps lit `auditWin?.position.x`.
- **Correctif** : inclure `auditWin?.position.x`/`y` dans deps, ou dériver via `useMemo`.
- **Risque du correctif** : faible.

### [P1-21] `as unknown as` casts (2 occurrences)
- **Où** :
  - `src/apps/finance/FinanceItemDetail.tsx:55` — `(props as unknown as { items?: InvoiceRow[] }).items`
  - `src/apps/_ui/CMSCardList.tsx:32` — `(... as unknown as T[])`
- **Symptôme** : un changement de signature de `props` ou de `useCmsStore` ne casserait pas la compilation ; bug latent à l'exécution.
- **Cause** : contournement de typage sans narrow progressif.
- **Correctif** : typer correctement `props` (ajouter `InvoiceRow[]` dans le type de `FinanceItemDetailProps`) et `useCmsStore` (generic explicite).
- **Risque du correctif** : faible. Demande de mettre à jour la signature en parallèle.

### [P0-RESUME] Le `AppFrame.tsx:321` cité dans le brief comme "déjà corrigé" concerne le `mix-blend-mode: screen` + `ResizeObserver`. **Confirmé corrigé** (lignes 304-328 ont `isolation: 'isolate', contain: 'paint', willChange: 'transform'` ; lignes 131-148 ont l'hystérésis `NARROW_HYSTERESIS`). NE PAS toucher.

---

## P2 — dette qui mordra, perf, duplication

### [P2-1] `useEffect` sans tableau de dépendances dans les 32 wrappers canvas-ui v30
- **Où** : chaque wrapper `src/components/canvasui/v30/{Asciify,AsciiObject,Bend,Blaze,Bubble,Canvas,Cloth,Clouds,DecryptReveal,Displacement,Droplets,FlameWrap,ForceField,Frost,Glass,GlassObject,Glitch,GlyphRain,Grid,HexFloat,Laser,Liquid,LiquidObject,Magnify,ParticleObject,ParticleReveal,ParticleScroll,Peel,RetroDither,Ripple,Shatter,VHS,DitheredObject}/...tsx` ligne `~62-65` : `useEffect(() => instanceRef.current?.setOptions(options))` sans deps.
- **Symptôme** : re-config de l'engine à chaque render parent.
- **Cause** : pas de tableau de deps.
- **Correctif** : ajouter `, [options])` (ou un `JSON.stringify(options)` stable) à chaque `useEffect` de setOptions.
- **Risque du correctif** : faible si `options` est un objet passé par prop. Vérifier qu'il n'est pas recréé à chaque render.

### [P2-2] `BackgroundFX.tsx:22-28` — bundle : 33 effets importés statiquement
- **Où** : `src/components/canvasui/v30/BackgroundFX.tsx:22-28`
- **Symptôme** : tout le code des 33 effets est dans le bundle initial, même si l'utilisateur n'utilise qu'un seul thème.
- **Cause** : `import { Asciify, Bend, ... } from './index';` (statique).
- **Correctif** : `React.lazy()` par effet, ou `import()` dynamique keyed par `effectId` dans `renderWrapperEffect`.
- **Risque du correctif** : moyen. Le code de `renderWrapperEffect` doit être refactoré en async.

### [P2-3] `orbitControls.dispose()` non appelé sur canvas réutilisé sans destroy
- **Où** :
  - `src/components/canvasui/v30/DitheredObject/DitheredObjectVanilla.ts:805-816`
  - autres Object variants
- **Symptôme** : fuite `OrbitControls` quand le canvas DOM est réutilisé mais le composant remonte (HMR, switch de thème).
- **Cause** : `dispose()` uniquement dans `destroy()`.
- **Correctif** : appeler `instance.destroy()` systématiquement dans le cleanup du `useEffect` wrapper React, pas seulement à l'unmount.
- **Risque du correctif** : moyen. Demande de vérifier qu'aucun effet ne crée deux instances.

### [P2-4] `matchMedia('change')` listeners : `addEventListener` non retirés hors `destroy()`
- **Où** : 5 fichiers *Vanilla.ts (Object family) — `motionQuery.addEventListener('change', onMotionChange)` non retiré ailleurs qu'à `destroy()`.
- **Correctif** : retirer aussi sur hot-reload / theme-switch (cf. P2-3).

### [P2-5] `pointer*` listeners non retirés sur canvas réutilisé
- **Où** :
  - `src/components/canvasui/v30/ParticleObject/ParticleObjectVanilla.ts:807-809`
  - `src/components/canvasui/v30/LiquidObject/LiquidObjectVanilla.ts:1662-1665`
  - autres
- **Cause** : cleanup uniquement dans `destroy()`.
- **Correctif** : cleanup React-level (cf. P2-3).

### [P2-6] `URL.createObjectURL` non révoqué si l'asset throw pendant `onload`
- **Où** : 5 fichiers *Vanilla.ts (Object family).
- **Correctif** : `try { resolve(image) } catch { URL.revokeObjectURL(url) }`.

### [P2-7] `FlameWrap.tsx:45-46` — `reach`/`glow` recalculés chaque render
- **Où** : `src/components/canvasui/v30/FlameWrap/FlameWrap.tsx:45-46`
- **Symptôme** : application d'inline style sur canvas à chaque render.
- **Correctif** : `useMemo(() => ({ reach, glow }), [options.height, options.spread])`.

### [P2-8] `Cloth.tsx:80-100` — `overflow: hidden` au lieu de `auto`
- **Où** : `src/components/canvasui/v30/Cloth/Cloth.tsx:80-100`
- **Symptôme** : contenu scrollable dans Cloth ne scrolle pas.
- **Correctif** : `overflow: 'auto'`.

### [P2-9] `AppFrame.tsx:76` — `activeId` non synchronisé avec `sections` props
- **Où** : `src/components/AppFrame.tsx:76`
- **Symptôme** : si `sections` rétrécit ou est réordonné, `activeId` peut pointer vers un id inexistant ; fallback silencieux vers `sections[0]`.
- **Correctif** :
  ```ts
  useEffect(() => {
    if (!sections.some(s => s.id === activeId)) setActiveId(sections[0]?.id ?? '');
  }, [sections, activeId]);
  ```

### [P2-10] `Toast.tsx` & `WindowFrame.tsx` — `useVoiceIntentStore` selector unstable
- **Où** : plusieurs sélecteurs Zustand retournant des objets inline.
- **Correctif** : `useShallow` partout où le sélecteur retourne un objet ou un tableau.

### [P2-11] État `selectedCode` (et 6 autres) dupliqué entre store et `useState`
- **Où** :
  - `src/apps/tasks/TasksApp.tsx:19, 22`
  - `src/apps/sales/SalesApp.tsx:461, 479`
  - `src/apps/finance/FinanceApp.tsx:63, 66`
  - `src/apps/people/PeopleApp.tsx:469, 473`
  - `src/apps/marketplace/MarketplaceApp.tsx:20, 23`
  - `src/apps/legal/LegalApp.tsx:35, 38`
- **Symptôme** : cleanup `setDetail(null)` manquant → breadcrumb stale après navigation rapide.
- **Correctif** : `useEffect(() => { ...; return () => setDetail(null); }, [openId])` partout.

### [P2-12] `AppFrame.tsx:108-110` — effet `setActivePage` re-court à cause de la valeur instable du contexte
- **Où** : `src/components/AppFrame.tsx:108-110`
- **Symptôme** : effet re-run à chaque render de WindowFrame.
- **Correctif** : corrige P1-2 (memo du Provider value) → effet stable.

### [P2-13] `SettingsApp.tsx:161, 166, 181` — comparaisons `CanvasEffectId` vs `"auto"`
- **Où** : `src/apps/settings/SettingsApp.tsx:161, 166, 181` ; aussi `src/stores/canvasFx.store.ts:71, 79`
- **Symptôme** : TypeScript signale `TS2367` car `CanvasEffectId` n'inclut pas `"auto"`. Le code traite `"auto"` comme sentinel pour "no override".
- **Cause** : type incomplet ou sentinel mal placé.
- **Correctif** :
  Option A : étendre le type : `type CanvasEffectOrAuto = CanvasEffectId | 'auto';`
  Option B : si `"auto"` n'est jamais stocké (uniquement transit), typer `override: CanvasEffectId | null` au lieu de `CanvasEffectId | 'auto'`.
- **Risque du correctif** : moyen. Demande de vérifier où `override` est défini.

### [P2-14] `lib/themes/store.ts:30` — `appThemes: Record<string, string | number>` vs `Record<string, string>`
- **Où** : `src/lib/themes/store.ts:30-40` ; erreur TS2345
- **Symptôme** : `setAppTheme` essaie d'écrire `string | number` dans `Record<string, string>`.
- **Correctif** : typer correctement l'un ou l'autre. Vérifier `setAppTheme` pour voir si l'écriture d'un nombre est intentionnelle ou bug.

### [P2-15] `lib/themes/store.ts:33-39` — sentinel `_v: Date.now()` à l'intérieur de `appThemes` ne déclenche pas le re-render Zustand
- **Où** : `src/lib/themes/store.ts:33-39`
- **Symptôme** : le sentinel à l'intérieur de l'objet ne change pas l'identité de `appThemes` au niveau racine, donc Zustand peut ne pas notifier les abonnés.
- **Correctif** : incrémenter un compteur top-level `themeRev: number` et inclure dans `setAppTheme`.

### [P2-16] `SettingsApp.tsx:232` — composant `Row` inline (cf. P1-5).

### [P2-17] `PeopleApp.tsx:536` — `DetailCrumb` n'accepte pas `id`
- **Où** : `src/apps/people/PeopleApp.tsx:536, 539, 542, 546` ; TS2353, TS2339
- **Symptôme** : tentative d'écriture `{ id: agent.code }` sur un type `DetailCrumb` qui ne le permet pas.
- **Correctif** : ajouter `id?: string` au type `DetailCrumb` (`src/contexts/WindowContext.tsx`).

### [P2-18] `PeopleApp.tsx:539, 542, 546` — `FleetAgent` n'a pas de `squad`
- **Où** : `src/apps/people/PeopleApp.tsx:539, 542, 546` ; TS2339
- **Symptôme** : tentative d'accès à `agent.squad`.
- **Correctif** : ajouter `squad?: string` au type `FleetAgent` (`src/types/` ou `src/data/`).

### [P2-19] `SalesApp.tsx:17` — `DetailField` non exporté de `SalesDetailPage`
- **Où** : `src/apps/sales/SalesApp.tsx:17` ; TS2459
- **Symptôme** : `import { DetailField } from './SalesDetailPage'` échoue.
- **Correctif** : exporter `DetailField` depuis `SalesDetailPage.tsx`, ou changer l'import vers le bon module (probablement `src/components/cms/itemDetailShared.tsx`).

### [P2-20] `SalesApp.tsx:292` — `tone` accepte `"neutral"` mais le type ne l'autorise pas
- **Où** : `src/apps/sales/SalesApp.tsx:292` ; TS2322
- **Symptôme** : `Badge tone="neutral"` mais `Badge` n'accepte que `"accent" | "danger" | "warn" | "ok" | "default"`.
- **Correctif** : ajouter `"neutral"` au type, ou remplacer par `"default"`.

### [P2-21] `DesignApp.tsx:547` — `fontVariation` au lieu de `fontVariationSettings`
- **Où** : `src/apps/design/DesignApp.tsx:547` ; TS2561
- **Symptôme** : CSS property name incorrect.
- **Correctif** : `fontVariationSettings` (en kebab-case dans style React : `fontVariationSettings: '"wght" 600'`).

### [P2-22] `CognitionApp.tsx:83, 90, 97` — `Stat` ne supporte pas `icon` prop
- **Où** : `src/apps/cognition/CognitionApp.tsx:83, 90, 97` ; TS2322
- **Symptôme** : `<Stat icon={BrainCircuit} ... />` mais `Stat` est typé sans `icon`.
- **Correctif** : ajouter `icon?: LucideIcon` à la signature de `Stat`.

### [P2-23] `CognitionApp.tsx` — composant `CognitionApp` déclaré mais non enregistré
- **Où** : `src/apps/cognition/CognitionApp.tsx` ; cf. aussi `src/lib/app-discovery.ts:27-52` qui n'enregistre que `CognitionOverviewContent`.
- **Symptôme** : le commentaire ligne 171-172 dit "deleted in Phase 39b" mais le code reste.
- **Correctif** : supprimer `CognitionApp` du fichier, ou l'enregistrer dans `app-discovery.ts` (et vérifier que `app-registry` peut le monter).

### [P2-24] `theme-details.tsx:6-7` — 3 imports inutilisés (`useMemo`, `Lock`, `Target`)
- **Où** : `src/apps/settings/theme-details.tsx:6-7`
- **Correctif** : supprimer.

### [P2-25] `lib/app-discovery.ts:3` — `BrainCircuit` importé inutilisé
- **Où** : `src/lib/app-discovery.ts:3`
- **Correctif** : supprimer.

### [P2-26] `lib/themes/store.ts:101` — re-exports morts (`THEMES`, `THEME_LIST`, `CANONICAL_APP_THEMES`)
- **Où** : `src/lib/themes/store.ts:101`
- **Correctif** : supprimer la ligne.

### [P2-27] `lib/app-registry.ts:41-45` — `getDockApps` exporté, zéro caller
- **Correctif** : supprimer.

### [P2-28] `lib/cms/repository.ts:102-121` — `appendCmsEvent` exporté, zéro caller
- **Correctif** : supprimer (garder si D4 receipt-only est requis, mais alors ajouter un caller ou un test).

### [P2-29] `lib/themes/store.ts:19, 43-46` — `resolveTheme` self-reference
- **Correctif** : déplacer en helper interne non exporté.

### [P2-30] `_ui/widgets.tsx:4-19` — `AppShell`, `:67-87` `PrimaryButton`/`GhostButton`, `:90-103` `ScoreBar` exports zero callers
- **Correctif** : supprimer.

### [P2-31] `_ui/widgets.tsx:4-48` — `Avatar`, `Dot`, `ProgressRow` exports zero callers
- **Correctif** : supprimer.

### [P2-32] `OnboardingApp.tsx:88-94` — `ScoreBand` est une fonction, pas un composant, mais porte une majuscule
- **Correctif** : renommer en `scoreBandFor` ou `getScoreBand`.

### [P2-33] `ItRdItemDetail.tsx:63-70` — `seedLog` est un IIFE en render body
- **Symptôme** : 6 nouveaux objets log par render.
- **Correctif** : `useMemo(() => {...}, [title, collection])`.

### [P2-34] `_ui/FleetItemCard.tsx:60-188` — duplication button/div body
- **Correctif** : extraire `<Inner />` commun.

### [P2-35] `_ui/FleetItemCard.tsx:60, 127` — `p-${compact ? 3 : 4}` Tailwind dynamic class
- **Symptôme** : Tailwind purge en build prod.
- **Correctif** : `clsx` ou literals.

### [P2-36] `useWindowManager.ts:24-31` — sync depuis store au mauvais moment
- **Où** : `src/hooks/useWindowManager.ts:24-31`
- **Symptôme** : pendant le drag, `windowState?.position` change mais l'effet court seulement après ; OK pour le moment mais fragile.
- **Correctif** : ajouter garde explicite `if (!isDragging && !resizeDir && windowState)` puis sync.

### [P2-37] `useWindowManager.ts:116` — `preSnapStateRef.current = { position: { ...windowPosition }, size: { ...windowSize } }` lit les valeurs de l'effet précédent
- **Correctif** : utiliser `posRef.current`/`sizeRef.current` (déjà synchronisés) au lieu de `windowPosition`/`windowSize`.

---

## P3 — ménage, cosmétique, config

### [P3-1] Erreurs TypeScript par famille — correctif unique
- **Où** : `npx tsc --noEmit -p tsconfig.app.json` → **88 erreurs**.
- **Familles et correctifs** :

| Code | Count | Cause | Correctif en 1 ligne |
|---|---|---|---|
| **TS2503** | 32 | `Cannot find namespace 'JSX'` | React 19 a supprimé le namespace global `JSX`. Ajouter `import type { JSX } from 'react'` dans chaque fichier impacté, OU remplacer `JSX.Element` par `React.JSX.Element` (via `import * as React from 'react'`). 30/32 sont dans des `DetailPage.tsx` ; le pattern est mécanique. |
| **TS6133** | 19 | `declared but never read` | `noUnusedLocals: true` dans `tsconfig.app.json:20`. Solutions : préfixer `_unused`, ou supprimer l'import. Fichier le plus touché : `_v1_css_retired/` (10 occurrences). |
| **TS2339** | 10 | `Property X does not exist` | Soit étendre le type (P2-17, P2-18), soit caster proprement (P1-21). |
| **TS2591** | 9 | `Cannot find name 'require'` | Uniquement dans `_v1_css_retired/theme-canvas-mapping.ts:147-172`. Le module est mort : voir P3-3 (exclure le dossier du tsconfig). |
| **TS2322** | 7 | Type assignment incompatible | Cf. P2-19, P2-20, P2-22. |
| **TS2367** | 5 | `comparison has no overlap` | Cf. P2-13. |
| **TS2345** | 2 | Argument type incompatible | Cf. P2-14. |
| **TS2561** | 1 | Object literal unknown property | Cf. P2-21. |
| **TS2459** | 1 | `declares X locally, not exported` | Cf. P2-19. |
| **TS2353** | 1 | Object literal unknown property | Cf. P2-17. |
| **TS2307** | 1 | Cannot find module | `src/components/canvasui/_v1_css_retired/BackgroundFX.tsx:14` — module mort (P3-3). |

**Stratégie globale** : pour les 32 TS2503, un seul sed/transform suffit : `sed -i "s/: JSX\.Element/: import('react').JSX.Element/g"` n'est pas viable. Le bon outil est un codemod :
```ts
// Dans chaque fichier impacté :
import type { JSX } from 'react';
// ou, pour les signatures courtes :
function foo(): React.ReactElement { ... } // React est déjà importé via JSX runtime
```
Recommandation : faire un script (`ts-morph` ou `jscodeshift`) qui ajoute l'import en tête des 32 fichiers, puis lance `tsc` pour vérifier 0 erreurs restantes.

### [P3-2] `index.tsx` manquant pour les canvasui v30
- **Où** : `src/components/canvasui/v30/` — pas de fichier index à la racine du dossier (seulement les sous-dossiers d'effet).
- **Vérification** : `ls src/components/canvasui/v30/` montre `index.ts` (2.7K). Confirmé présent.
- **Pas de finding**.

### [P3-3] `_v1_css_retired/` : dossier mort, encore inclus dans `tsc`
- **Où** : `src/components/canvasui/_v1_css_retired/` (13 fichiers : Asciify.tsx, BackgroundFX.tsx, Bend.tsx, Blaze.tsx, BorderBeam.tsx, Bubble.tsx, Frost.tsx, Glitch.tsx, index.ts, LiquidMetal.tsx, Particle.tsx, README.md, theme-canvas-mapping.ts, ThinkingOrbs.tsx). Aucun import depuis `src/` (vérifié).
- **Symptôme** : `tsc` continue de signaler 9 erreurs TS2591 + autres dans ce dossier mort.
- **Correctif** : ajouter `"exclude": ["src/components/canvasui/_v1_css_retired/**"]` à `tsconfig.app.json:25`. À moyen terme, supprimer le dossier avec `git rm -r src/components/canvasui/_v1_css_retired`.
- **Risque du correctif** : faible (zéro caller vérifié). Confirmer en grep `import.*_v1_css_retired` une dernière fois avant le commit.

### [P3-4] `src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/SalesDetailDrawer.tsx`
- **Symptôme** : fichier mort tracké dans git ; zéro import.
- **Correctif** : `git rm -r src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align`.

### [P3-5] `_TRASH_2026-07-25_pre_blackwidow_scarletwitch_purge/`
- **Symptôme** : `src/apps/growth/experiment.ts`, `src/apps/growth/retention-intelligence.model.ts`, `tests/growth/experiment.test.ts` trackés, morts.
- **Correctif** : `git rm -r _TRASH_2026-07-25_pre_blackwidow_scarletwitch_purge`.

### [P3-6] `_DRAFTS_PPR_LANE/event_log_2026-07-30.jsonl`
- **Symptôme** : fichier scratch tracké ; aucune référence dans le code ; le nom "PPR Lane" est opaque.
- **Correctif** : déplacer hors du repo ou supprimer.

### [P3-7] `.vite-smoke.log` tracké dans git
- **Où** : `.gitignore` ne contient pas `*.log` (seulement `.env.*.local`).
- **Correctif** : `git rm --cached .vite-smoke.log` + ajouter `*.log` à `.gitignore:2`.

### [P3-8] `.env.local.RETIRE.txt`
- **Symptôme** : nom `.txt` échappe au rule `.env.*.local`. Sûr à commit, mais nom trompeur.
- **Correctif** : renommer en `.env.local.RETIRE.md` ou déplacer vers `docs/`.

### [P3-9] `.env.example` + `.env.local.example` (redondants)
- **Correctif** : supprimer `.env.local.example` si `.env.example` couvre la même surface.

### [P3-10] Vite dev : `localhost` → IPv6 `[::1]` sur Node 17+
- **Où** : `vite.config.ts:1-8` (aucun `server.host`)
- **Symptôme** : sur Node 17+, `localhost` résout d'abord vers `::1`. Les outils qui forcent IPv4 (`127.0.0.1`) ne peuvent pas se connecter.
- **Correctif** : ajouter `server: { host: '127.0.0.1' }` (IPv4 only) ou `server: { host: '0.0.0.0', port: 3000 }` (LAN + IPv4).
- **Risque du correctif** : faible. Ne change que le binding du serveur de dev.

### [P3-11] Aucun `.env.local` réel
- **Symptôme** : `supabaseConfigured` est `false` → le client Supabase est en placeholder (P1-8). PostHog et UserTour ne s'initialisent pas non plus (sentinels `phc_REPLACE_ME` / `ut_REPLACE_ME`).
- **Correctif** : `.env.local` créé par le développeur au premier `npm run dev` (workflow documenté).
- **Hors audit** : pas un bug du code.

### [P3-12] `key={i}` sur listes statiques (cosmétique)
- **Où** (au moins) :
  - `src/components/Breadcrumbs.tsx:35`
  - `src/components/TopBar.tsx:304`
  - `src/components/ChangelogTabs.tsx:142, 230`
  - `src/apps/welcome/landing/Blocks.tsx:101, 102, 174`
  - `src/apps/dashboard/DashboardApp.tsx:29`
  - `src/apps/people/PeopleApp.tsx:61, 424`
  - `src/apps/finance/FinanceApp.tsx:46`
- **Correctif** : remplacer par `key={item.label}` ou similaire (clé stable). Pas urgent si les listes sont vraiment statiques.

### [P3-13] `CssFallback.tsx:132` — `!important` sur `backgroundColor` écrase le gradient transparent
- **Où** : `src/components/canvasui/v30/CssFallback.tsx:131-136`
- **Correctif** : retirer `!important` et mettre `backgroundColor` en dernier dans le spread.

### [P3-14] `CssFallback.tsx` — animations infinies sans `prefers-reduced-motion`
- **Correctif** : envelopper les keyframes dans `@media (prefers-reduced-motion: no-preference)`.

### [P3-15] `BackgroundFX.tsx:200` — `props.themeId` non gardé
- **Symptôme** : `getCanvasMapping(undefined)` retourne le fallback `warm-paper`. Fragile.
- **Correctif** : ajouter une garde explicite ou typer `themeId: string` non-optional.

### [P3-16] `Ripple/RippleVanilla.ts:486-488` — 2D context leak sur hot-reload
- **Correctif** : `probe.width = probe.height = 0` avant `drop`.

### [P3-17] `Asciify/AsciifyVanilla.ts` & 32 similaires — `useEffect(() => setOptions(options))` sans deps (déjà listé en P2-1)

### [P3-18] `AsciiObject/AsciiObject.tsx:30-33` — effect ne dépend pas de `canvas` ref
- **Correctif** : inclure `canvas` (ou son key) dans deps.

### [P3-19] `GlassObject/GlassObjectVanilla.ts:857-868` — scratch canvas 2D non zero-sizé
- **Correctif** : `soft.width = soft.height = 0` avant drop.

### [P3-20] `AsciiObject/AsciiObjectVanilla.ts:1213-1231` — atlas canvas leaked
- **Correctif** : idem.

### [P3-21] `ErrorBoundary.tsx:8` — class component en codebase React 19
- **Symptôme** : supporté mais déprécié en spirit.
- **Correctif** : fonctionnel via `react-error-boundary`. Optionnel.

### [P3-22] `App.tsx` est minimal (11 lignes) — pas de finding

### [P3-23] `dist/` gitignoré correctement (vérifié)

### [P3-24] `tsconfig.node.json` non audité — non inclus dans les erreurs mais vérifier que les fichiers Vite s'y compilent.

### [P3-25] `package.json` `lint: oxlint` — le brief ne dit pas si le linter tourne ; à vérifier.

---

## Récapitulatif par fichier (vue rapide)

| Fichier | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| `src/components/AppFrame.tsx` | 1 (Rules of Hooks) | 4 (clé manquante, ctx value, setActivePage, sélecteur) | 1 (activeId non sync) | — | 6 |
| `src/components/WindowFrame.tsx` | — | 3 (sélecteur, ctx value, state dup) + a11y (role dialog, keyboard) | — | — | 4+2 |
| `src/components/Desktop.tsx` | 1 (AnimatePresence) | — | — | — | 1 |
| `src/components/canvasui/v30/BackgroundFX.tsx` | — | 1 (key manquante) | 1 (bundle bloat) | 2 (themeId, deps) | 4 |
| `src/components/canvasui/v30/fallback.tsx` | — | 1 (GL leak boundary) | — | — | 1 |
| `src/components/canvasui/v30/*Vanilla.ts` (×5 Object) | — | 5 (silent catch) | 6 (orbit/listeners/objectURL/dispose) | 3 | 23 |
| `src/components/canvasui/v30/*Wrapper.tsx` (×33) | — | — | 33 (deps array) + 1 (FlameWrap) + 1 (Cloth overflow) | — | 35 |
| `src/hooks/useWindowManager.ts` | 1 (deps loop) | — | 3 (refs, snap state, sync) | — | 4 |
| `src/hooks/useCollectionDrill.ts` | — | 1 (eslint-disable) | — | — | 1 |
| `src/components/Toast.tsx` | — | 1 (timer reset) | — | — | 1 |
| `src/components/TopBar.tsx` | — | 1 (bell a11y) | — | 1 (key={i}) | 2 |
| `src/components/AppDrawer.tsx` | — | 1 (close a11y) | — | — | 1 |
| `src/components/Breadcrumbs.tsx` | — | 1 (back a11y) | — | 1 (key={i}) | 2 |
| `src/apps/cognition/CognitionApp.tsx` | — | — | 1 (Stat icon) + 1 (deleted-but-present) | — | 2 |
| `src/apps/settings/SettingsApp.tsx` | — | — | 4 (CanvasEffectId × 3 + Row inline) | — | 4 |
| `src/apps/finance/FinanceApp.tsx` | — | — | 1 (Invoices inline) + 1 (state dup) | 1 | 3 |
| `src/apps/people/PeopleApp.tsx` | — | — | 4 (DetailCrumb + FleetAgent × 3) + 1 (state dup) | 2 | 7 |
| `src/apps/sales/SalesApp.tsx` | — | — | 2 (DetailField export + tone) + 1 (state dup) | — | 3 |
| `src/apps/marketplace/MarketplaceApp.tsx` | — | — | 3 (Browse/Installed/Featured inline) + 1 (state dup) | — | 4 |
| `src/apps/dashboard/DashboardApp.tsx` | — | — | 1 (3 composants inline) + 1 (state dup) | 1 | 3 |
| `src/apps/legal/LegalApp.tsx` | — | — | 1 (state dup) | — | 1 |
| `src/apps/tasks/TasksApp.tsx` | — | — | 1 (state dup) | — | 1 |
| `src/apps/onboarding/citadel/DemoWindowFrame.tsx` | 1 (deps array) | 1 (state setDragOffset) | — | — | 2 |
| `src/apps/onboarding/OnboardingApp.tsx` | — | 1 (closure stale) + 1 (cleanup) | 1 (ScoreBand) | — | 3 |
| `src/apps/_ui/FleetItemCard.tsx` | — | — | 2 (dup + dynamic class) | — | 2 |
| `src/lib/supabase.ts` | — | 1 (placeholder client) | — | — | 1 |
| `src/lib/cms/repository.ts` | — | 3 (silent try/catch × 3) | 1 (appendCmsEvent dead) | — | 4 |
| `src/lib/themes/store.ts` | — | — | 3 (TS2345 + sentinel + dead exports) | — | 3 |
| `src/lib/observability.ts` | — | — | 1 (sentinels REPLACE_ME) | — | 1 |
| `src/components/canvasui/_v1_css_retired/` | — | — | — | 1 (exclude du tsconfig) | 1 |
| `src/apps/sales/_TRASH_*/` | — | — | — | 1 (rm) | 1 |
| `_TRASH_2026-07-25_*/` | — | — | — | 1 (rm) | 1 |
| `_DRAFTS_PPR_LANE/` | — | — | — | 1 (rm) | 1 |
| `tsconfig.app.json` | — | — | — | 1 (exclude _v1_css_retired) | 1 |
| `vite.config.ts` | — | — | — | 1 (server.host) | 1 |
| `.gitignore` | — | — | — | 1 (*.log) | 1 |

---

## Ordre d'exécution recommandé

### Lot A — Trivia / indépendant (peut être 1 PR chacun)

1. **Exclure `_v1_css_retired/` du tsconfig** (P3-3) — 1 ligne, aucun risque.
2. **`.gitignore` + `*.log`** (P3-7) — 1 ligne + `git rm --cached`.
3. **Suppression des dossiers morts** (P3-4, P3-5, P3-6) — `git rm -r` × 3.
4. **`vite.config.ts` : `server.host: '127.0.0.1'`** (P3-10) — 3 lignes.
5. **Renommer `.env.local.RETIRE.txt` → `.md`** (P3-8) — 1 fichier.
6. **Suppression des exports morts** (P2-26, P2-27, P2-28, P2-29, P2-30, P2-31, P2-25) — purement cosmétique.

### Lot B — TypeScript (1 PR `fix(ts): type errors`)

Tous les correctifs TS sont mécaniques et peuvent être scriptés :
- 32× TS2503 : codemod pour ajouter `import type { JSX } from 'react'` aux 30 fichiers `DetailPage.tsx`.
- 19× TS6133 : supprimer ou préfixer `_`.
- 10× TS2339 : cf. P2-17, P2-18, P1-21.
- 9× TS2591 + autres dans `_v1_css_retired/` : résolus par Lot A-1.
- 7× TS2322 + 5× TS2367 + 2× TS2345 + 1× TS2561 + 1× TS2459 + 1× TS2353 + 1× TS2307 : un à un, dans leurs fichiers respectifs.

### Lot C — Sécurité et gestion d'erreur (1 PR `fix: silent failures`)

- P1-7 (3× `repository.ts` silent try/catch) — pure logique, aucun risque.
- P1-8 (`supabase.ts` placeholder) — touchera tous les callers de `repository.ts`. À tester.
- P1-9 (5× *Vanilla.ts silent catch) — log-only, aucun risque.

### Lot D — A11y minimale (1 PR `fix(a11y): minimum viable`)

- P1-14 (boutons à icône seule) — ajouts d'`aria-label`, 6 fichiers.
- P1-12 (`role="dialog"` + `aria-label` sur WindowFrame) — pas de focus trap.
- P1-15 (`aria-disabled` + descriptions) — 5 fichiers.
- P1-13 (keyboard accessibility des fenêtres) — **à isoler dans un PR séparé** : c'est un mini-projet UX.

### Lot E — Performance WebGL (1 PR `fix(canvasui): WebGL cleanup`)

- P1-2 (plafond 16 contexts) — décision architecturale : signature unique globale vs per-app. Toucher l'orchestration dans `AppFrame.tsx` + `BackgroundFX.tsx`. **À valider avec un HITL avant**.
- P1-6 (`key={activeThemeId}`) — 1 ligne.
- P1-10 (`WebGLFallbackBoundary` leak) — compromis : log-only en v1.
- P2-1 (32× `setOptions` deps array) — mécanique.
- P2-3, P2-4, P2-5, P2-6 (cleanup React-level des *Vanilla.ts) — toucher aux 5 fichiers Object.

### Lot F — Bugs de rendu (1 PR `fix: render correctness`)

- **P0-1** (Rules of Hooks) — **à isoler** : c'est l'investigation la plus risquée.
- P0-2 (clé BackgroundFX) — déjà couvert dans Lot E.
- P0-3 (useWindowManager deps) — 1 fichier.
- P0-4 (DemoWindowFrame deps) — 1 fichier.
- P0-5 (AnimatePresence) — 1 fichier, visuel uniquement.
- P1-1, P1-2 (sélecteurs Zustand) — fenêtreuse globale, tester après.
- P1-3 (Toast timer) — 1 fichier.
- P1-4 (state dup WindowFrame) — touchera tous les consumers de `useWindowPage`. **À isoler**.

### Lot G — Cleanup React / Type hygiène (1 PR `refactor: react hygiene`)

- P1-5 (composants inline) — 5 fichiers, mécaniques.
- P1-16, P1-17 (key={i}) — liste exhaustive, mécanique.
- P1-18 (useCollectionDrill eslint-disable) — 1 fichier.
- P1-19, P1-20 (cleanup useEffect) — 2 fichiers.
- P2-2 (bundle : React.lazy) — toucher 33 imports.
- P2-9 à P2-15 (type hygiene) — divers.

### Lot H — Dead code final (1 PR `chore: dead code`)

- P3-12, P3-13, P3-14, P3-16, P3-17, P3-19, P3-20 (cosmétique canvasui).
- P2-32, P2-33, P2-34, P2-35 (cosmétique apps).
- P3-21 (ErrorBoundary class → fonctionnel) — optionnel.

---

### PRs à isoler (comportement modifiant)

- **P0-1** (Rules of Hooks) — investigation + fix, validation HITL.
- **P1-4** (state duplication `WindowFrame`) — touche tous les `useWindowPage()` consumers.
- **P1-2** (memo ctx value) — peut déstabiliser des consumers qui se basaient sur la re-render.
- **P1-13** (clavier des fenêtres) — mini-projet UX.
- **P1-2** (contexte WebGL plafond) — décision architecturale.

---

## Limites de cet audit

- Pas d'instrumentation runtime : le comportement exact de Chromium au plafond 16 contexts n'est pas mesuré ici, seulement déduit de la doc.
- Pas de vérification visuelle de l'animation de fermeture des fenêtres (P0-5) : le smoke log ne contient pas la trace HMR correspondante.
- Le hook order dans AppFrame (P0-1) est déduit du warning console dans `.vite-smoke.log` ; la cause exacte (quel hook, à quelle ligne) demande une repro locale.
- Les suppressions `eslint-disable-next-line` non justifiées sont listées sur la base du contenu du commentaire adjacent ; un HITL peut décider qu'une suppression donnée est acceptable dans son contexte.
- Le rapport ne contient pas d'inventaire exhaustif des `key={i}` (≈25 occurrences) — seulement les plus à risque (listes mutables).

---

*Audit clos le 2026-08-04. Prêt pour exécution.*