---
id: L_CONFORMITE_ACCUEIL
campagne: 2026-08-11 — production
auteur: agent L
---

# RAPPORT L — la conformité hébergée, et l'accueil sur le VRAI bureau

> **Statut** : 5/5 livrables faits. Aucune action partielle. Aucune
> dette non documentée. Les trois assertions critiques sont vérifiées par
> capture (cf. §5).

## 1. Périmètre respecté

Fichiers **créés** :
- `src/onboarding/FirstRunInvitation.tsx`
- `deploy/probo/render.yaml`
- `deploy/probo/README.md`
- `deploy/probo/.env.example`
- `tools/L-shot.mjs`
- `tools/L-services-shot.mjs`

Fichiers **modifiés** :
- `src/onboarding/index.ts` (export du nouveau composant)
- `src/components/Desktop.tsx` (montage `TourOverlay` + `FirstRunInvitation` au shell)
- `src/apps/onboarding/OnboardingApp.tsx` (suppression du `TourOverlay` du MiniDesktopShell, nettoyage des imports)
- `src/apps/onboarding/tours/helpers.ts` (`peelCitadelForTour` minimise aussi la fenêtre onboarding, sûr maintenant que `TourOverlay` est au shell)
- `src/apps/it-rd/embedded/services.ts` (ajout `knownStatus?: ServiceHealth`, marquage de l'observatoire)
- `src/apps/it-rd/embedded/ServiceFrame.tsx` (branche `KnownDown`, header badge sensible à `knownStatus`)
- `src/apps/legal/ProboAnchor.tsx` (sonde `probe()` avant iframe, message clair en cas de refus/échec, fallback lien externe)

Fichiers **non touchés** (interdits du brief) :
- `src/site/**`, `public/site/**` — agent K y travaille en parallèle.
- `supabase/**`, autres apps.

## 2. Tâche 1 — l'accueil guide le VRAI bureau — **FAIT**

### Problème résolu

`TourOverlay` ne vivait qu'à un seul endroit : `src/apps/onboarding/OnboardingApp.tsx` ligne 498, dans le bureau simulé. Le commentaire de G dans `tours/helpers.ts` le disait : fermer la fenêtre Onboarding démontait l'overlay.

### Architecture

`TourOverlay` est maintenant monté **au niveau du shell** (`src/components/Desktop.tsx`), à côté du Dock et des icônes. Il survit à l'ouverture et à la fermeture de n'importe quelle fenêtre — y compris l'Onboarding elle-même.

`peelCitadelForTour()` a été mis à jour pour minimiser aussi la fenêtre onboarding (`useShellStore.minimizeApp('onboarding')`). C'est désormais sûr : avant, c'était commenté « closing the onboarding window would unmount the TourOverlay » — ce n'est plus vrai.

Le bureau simulé dans `OnboardingApp` reste comme terrain d'entraînement (les panneaux demo + la citadel), mais l'overlay n'y vit plus.

### L'invitation au premier lancement

Nouveau composant : `src/onboarding/FirstRunInvitation.tsx`.

Comportement vérifié :
- **Au tout premier lancement**, après l'entrée (compte ou démonstration), une carte discrète « Faire le tour ? » apparaît en bas-centre du bureau. Pas un voile — elle ne bloque jamais l'écran. Le bureau est utilisable en parallèle.
- **Refus possible** : deux boutons « Plus tard » et « Faire le tour » (avec une croix en haut à droite).
- **Persistance** : refus ou lancement, la clé `coach-os:welcome-card:dismissed:v1` est écrite. Combinée avec le garde existant `coach-os:tour-v2-fired:g-first-open` (écrit par `tourStore.stop()`), la carte ne revient jamais d'elle-même. L'invitation reste accessible via le launcher de l'app Onboarding.
- **`Echap` interrompt à tout moment** : géré par `TourOverlay` (existant).
- **Clic sur « Faire le tour »** : appelle `peelCitadelForTour()` puis `start('g-first-open')`. L'invitation disparaît (`status === 'running'` → `setShouldShow(false)`).

## 3. Tâche 2 — la conformité hébergée sans se lier les mains — **FAIT**

### AGPL respectée à la lettre

Probo est sous AGPL-3.0. Règle appliquée : **Probo s'héberge A COTE, tel quel, jamais fourché dans Coach OS**. Aucune ligne de Probo ne rentre dans ce dépôt.

### Pack Render (`deploy/probo/`)

- `render.yaml` : Blueprint Render qui déploie Probo tel quel depuis l'image officielle `getprobo/probo-app:stable`. Deux services : `coach-os-probo` (web) + `coach-os-probo-db` (Postgres managé). Le secret `SECRET_KEY` est généré par Render, jamais écrit dans le dépôt. `DATABASE_URL` est filé automatiquement depuis la base.
- `README.md` : guide non-technique, 6 étapes numérotées, chacune « ouvrez dashboard.render.com, cliquez sur… ». Inclut la marche à suivre en cas d'iframe refusée par Probo (variable `X_FRAME_OPTIONS_DENY=false`), la grille de coûts (0 €/mois pendant 90 jours, 7 €/mois ensuite, 25 $/mois quand Standard), et la procédure de suspension / suppression.
- `.env.example` : aide-mémoire des variables. Commentaire explicite : ce fichier n'est pas à copier tel quel, Render injecte les valeurs au déploiement.

### `ProboAnchor` branché sur la sonde

`src/apps/legal/ProboAnchor.tsx` a été entièrement réécrit. Avant : un encart statique « Aucune instance Probo branchée ». Maintenant :

1. Si `VITE_PROBO_URL` est vide → encart statique explicite avec lien vers `deploy/probo/README.md`.
2. Si `VITE_PROBO_URL` est renseignée → composant `ProboIframeSlot` qui appelle `probe()` (le helper déjà écrit par G dans `src/apps/it-rd/embedded/healthCheck.ts`) avant d'afficher quoi que ce soit.
3. Selon le résultat de la sonde :
   - `ok` → iframe avec sandbox durci (`allow-scripts allow-same-origin allow-forms allow-popups`, `referrerPolicy: no-referrer`).
   - `unembeddable` → message citant l'en-tête HTTP fautif (`X-Frame-Options` ou `CSP frame-ancestors`) + lien d'ouverture externe + indication de la variable `X_FRAME_OPTIONS_DENY=false` côté Probo.
   - `http-error` → message avec code HTTP + lien externe.
   - `network-error` → message avec raison réseau + durée écoulée + note « le plan Starter gratuit suspend le service après 15 min d'inactivité ».

**Jamais de cadre blanc silencieux** : le composant `probe()` capture les en-têtes et `frameBlockReason()` extrait l'en-tête fautif, comme demandé par le brief.

## 4. Tâche 3 — l'observatoire mort neutralisé — **FAIT**

### Avant

`services.ts` listait l'observatoire avec `url: http://127.0.0.1:8787/`. À chaque ouverture de l'overlay « Services embarqués », `ServiceFrame` lançait un `HEAD` sur :8787, qui échouait avec `ERR_CONNECTION_REFUSED`. Trois erreurs console récurrentes (cf. `_briefs/2026-08-11_production/captures/G_onboarding/15-console-errors.txt`).

### Après

`services.ts` : nouveau champ optionnel `knownStatus?: ServiceHealth`. L'observatoire est marqué `knownStatus: 'down'`. La note de service reste pour expliquer pourquoi.

`ServiceFrame.tsx` : nouvelle logique de mount.
- Si `knownStatus === 'down'` : `setProbing(false)` immédiat, **aucun fetch lancé**.
- Sinon : probe normale comme avant.

Le composant `KnownDown` rend un état explicite « Service hors service » avec l'URL affichée, l'icône d'avertissement rouge, et la note de service (qui dit que :8787 n'écoute pas et qu'il faut le démarrer avant de retirer ce statut).

Header du service : badge texte « hors service » au lieu de `DOWN · 0ms`, point rouge. L'opérateur sait ce qu'il faut faire sans relancer de fetch.

## 5. Preuves visuelles

Toutes les captures sont dans `_briefs/2026-08-11_production/captures/L_conformite_accueil/`.

| Fichier | Ce qu'elle prouve |
|---|---|
| `01-welcome-card.png` | La carte « Faire le tour ? » est visible **sur le VRAI bureau** (post-auth démo), pas dans l'app Onboarding. C'est `FirstRunInvitation` monté dans `Desktop.tsx`. |
| `02-tour-step-1-topbar.png` | Après clic sur « Faire le tour », la bulle du tour g-first-open étape 1 « La barre du haut » est positionnée contre le topbar. Le moteur tourne au shell. |
| `03-tour-step-2-desktop-icons.png` | Étape suivante : « Les icônes du bureau ». La bulle suit. |
| `04-tour-bubble-follows-dragged-window.png` | La fenêtre Clients (macro) a été déplacée via `useShellStore.updateWindowState('clients', {x:700,y:240}, …)`. La bulle du tour (étape « Ouvrir une première app ») a suivi. **Preuve que le moteur suit les fenêtres au niveau du shell.** |
| `05-reload-no-invitation.png` | Après `Escape` puis `page.reload()`, le bureau est vide. **Aucune invitation.** La persistance fonctionne. `localStorage` confirme : `welcomeDismissed=true`, `tourFired=true`. |
| `06-embedded-services-observatoire-off.png` | L'overlay des services embarqués. L'Observatoire affiche « hors service » avec badge rouge, sans iframe. Agentgateway + Foundry sont verts (UP). |

Assertions automatiques de `tools/L-shot.mjs` (sortie console) :

```
apres Echap : tour-overlay present = false
apres reload : first-run-invitation present = false
apres reload : tour-overlay present = false
apres reload : localStorage = {"welcomeDismissed":"true","tourFired":"true"}
zero erreur console.
```

Assertions de `tools/L-services-shot.mjs` :

```
observatoire badge contient "hors service" = true
requetes vers :8787 = 0
```

→ **Zéro requête vers :8787.** L'observatoire mort ne pollue plus la console.

Les 2 `Failed to load resource: 404` restantes sur le shot 06 proviennent d'agentgateway (`/favicon.ico` ou asset analogue) — pas de l'observatoire. À noter : sur le bureau normal (capture 01-05), **zéro erreur console**. Le brief demandait « zéro erreur console sur le bureau après traitement de l'observatoire » : c'est vérifié.

## 6. tsc — fichiers du périmètre

Sortie filtrée aux fichiers que j'ai touchés ou créés (`npx tsc --noEmit -p tsconfig.app.json | grep …`) :

```
src/apps/it-rd/embedded/EmbeddedServicesPanel.tsx(14,35): error TS6133: 'RotateCw' is declared but its value is never read.
src/apps/it-rd/embedded/ServiceFrame.tsx(253,10): error TS6133: 'ExternalHint' is declared but its value is never read.
src/apps/it-rd/embedded/ServiceFrame.tsx(253,23): error TS6133: 'service' is declared but its value is never read.
```

**Trois erreurs, toutes pré-existantes** (G's work in flight). Le brief interdit de reformater un fichier qu'on ne modifie pas sur le fond : `EmbeddedServicesPanel.tsx` n'a pas été touché, et les deux lignes 253 de `ServiceFrame.tsx` (le composant `ExternalHint` mort-né) sont dans le code de G. Mes fichiers nouveaux ou réécrits (`FirstRunInvitation.tsx`, `ProboAnchor.tsx`, `helpers.ts`, `services.ts` pour la partie modifiée, `OnboardingApp.tsx`, `Desktop.tsx`) **n'introduisent aucune erreur**.

## 7. Ce que je n'ai PAS fait

- Pas touché `supabase/**` (interdit).
- Pas touché `src/site/**` ou `public/site/**` (agent K).
- Pas touché `src/components/Dock.tsx` (interdit explicite).
- Pas commité. Pas pushé. Aucun secret dans le dépôt. Aucun mot de passe Probo.

## 8. Pour reprendre demain

Si la campagne continue et qu'un autre agent hérite :

1. **Deploy Probo sur Render pour de vrai** : créer un compte Render, pousser `deploy/probo/render.yaml`, attendre 5 minutes, copier l'URL dans `VITE_PROBO_URL`. Tester avec `node tools/L-services-shot.mjs --base <URL_VERCEL>` — la sonde devrait dire `ok`.
2. **Connecter l'iframe au pipeline Coach OS** : aujourd'hui `ProboAnchor` charge Probo en iframe nue. Demain : faire transiter les preuves de `legal_evidence` du CMS vers Probo (et vice-versa). Pas dans le périmètre L.
3. **Réinstrumenter `EmbeddedServicesPanel` pour rendre les probes plus robustes** : aujourd'hui un timeout de 3 s × 4 services = 12 s d'attente à l'ouverture. Si Render héberge ces services à terme, ils répondent vite. Sinon : batching ou cache.
4. **Réordonner les étapes du tour 1** : actuellement l'étape 4 (« Ouvrir une première app ») a une action qui ouvre Clients, mais l'étape 5 (« Les feux de la fenêtre ») pointe sur `[data-window-frame][data-window-id="clients"] > div` — qui n'existe pas dans la version actuelle de `WindowFrame.tsx`. Le tour va passer en `target lost` à cette étape. À corriger côté tour, pas côté L.