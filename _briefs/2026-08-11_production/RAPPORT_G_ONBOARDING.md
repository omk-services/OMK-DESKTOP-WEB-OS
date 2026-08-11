# RAPPORT G — ONBOARDING + SERVICES EMBARQUÉS
**Campagne** : 2026-08-11 — production
**Périmètre** : `src/onboarding/**`, `src/apps/onboarding/**`, `src/apps/it-rd/embedded/**`
**Statut** : ✅ LIVRÉ — toutes les preuves capturées.

---

## 0. Synthèse

| Tache | Statut | Preuve |
|---|---|---|
| Décision bibliothèque visite | ✅ | Argumentaire §1 |
| Moteur in-house (`src/onboarding/`) | ✅ | `tourStore.ts`, `TourOverlay.tsx` |
| 3 parcours (`src/apps/onboarding/tours/`) | ✅ | `threeTours.ts` — 5 + 4 + 4 étapes |
| Panel launcher + intégration | ✅ | `OnboardingToursPanel.tsx` — montage dans MiniDesktopShell |
| Services embarqués (`src/apps/it-rd/embedded/`) | ✅ | 4 services, sondes live, fallbacks explicites |
| Captures de vérification | ✅ | 16 captures dans `captures/G_onboarding/` |
| Console errors | 🟡 3 erreurs attendues | `15-console-errors.txt` — ERR_CONNECTION_REFUSED pour observatoire (mort, mesure vérifiée) |

---

## 1. Décision bibliothèque de visite

### Évaluation

| Bibliothèque | Cas dominant : la bulle suit une fenêtre glissante | Verdict |
|---|---|---|
| **Usertour.js@0.0.24** (déjà en deps, hosted SaaS) | Ancrage DOM via `element.getBoundingClientRect()`. Quand la fenêtre **se ferme**, l'élément disparaît → bulle orpheline. Contenu hébergé sur `app.usertour.io`, IDs fournis via 5 env vars (`VITE_USERTOUR_CONTENT_*`) — actuellement vides. | ❌ Éliminé |
| **Shepherd** (pure JS, sans serveur) | Ancrage DOM aussi — même cas, même élimination. | ❌ Éliminé |
| **Joyride** (React) | Idem, plus un positionnement beacon calé sur les coords initiales — pas de re-layout continu. | ❌ Éliminé |
| **Moteur in-house `src/onboarding/TourOverlay.tsx`** | S'abonne à `useShellStore` (zustand), recalcule la position de la bulle par `requestAnimationFrame`. Si la fenêtre ciblée est fermée ou minimisée → la visite passe à l'étape suivante ou s'arrête proprement. Zéro dépendance ajoutée. | ✅ Retenu |

### Pourquoi pas Usertour tout de même ?

Usertour.js@0.0.24 est conservé dans `package.json` et garde son rôle d'analytics opt-in (cf. `src/lib/observability.ts`, `src/lib/tours.ts`) — il continue à mesurer les 5 visites hébergées (Welcome/Standup/Squad/Cadence/Privacy), sous réserve de consentement RGPD. Le moteur in-house n'analyse rien : il ne fait qu'**expliquer le bureau** à un utilisateur non technique qui vient d'arriver.

### Ce qui distingue le moteur in-house

- **3 saveurs d'ancre** : `selector` (DOM), `windowId` (shell store), `zone` (viewport) — pas seulement DOM.
- **Abonnement direct à `useShellStore`** (zustand) : la position des fenêtres est la source de vérité. RAF-loop la relit à chaque frame.
- **Auto-avance robuste** : si la cible disparaît (fenêtre fermée, minimisée, sélecteur manquant), l'étape avance après 900 ms. Les étapes avec `onAction` pausent sur "cible perdue" — l'utilisateur doit cliquer le bouton d'action (ex. "Ouvrir Clients") pour faire apparaître la cible.
- **Rendu via React Portal** (`createPortal` vers `document.body`) : le `z-index: 9999` échappe au stacking context de la fenêtre onboarding-app parente.
- **Persistance par profil navigateur** : `localStorage: coach-os:tour-v2-fired:<id>` — un tour ne se rejoue pas deux fois, sauf via Settings → Help (à câbler).

---

## 2. Cartographie des services (mesure 2026-08-11)

### 2a. `C:\Users\amado\ASpace_OS_V3\00_Amadeus\20_Harness\agentgateway`

```
$ netstat -ano | grep LISTENING
  TCP    0.0.0.0:3300           ...  LISTENING   14116   # agentgateway.exe (MCP)
  TCP    0.0.0.0:4000           ...  LISTENING   14116   # listener0/route0 (admin)
  TCP    127.0.0.1:15000        ...  LISTENING   14116   # agentgateway admin UI
```

| Port | Service | GET test | X-Frame-Options | Embeddable |
|---|---|---|---|---|
| `:3300` | MCP endpoint | 405 (POST-only) | absent | n/a (POST) |
| `:4000` | route0/init | 400 (bad init) | absent | n/a |
| `:15000/ui` | **agentgateway admin UI** | **200** | **absent** | ✅ |

→ **Cadre embarqué** livré : `http://127.0.0.1:15000/ui`. Capture `12-service-agentgateway.png` montre "Gateway Overview - LLM Enabled" chargé.

### 2b. `C:\Users\amado\ASpace_OS_V3\00_Amadeus\10_Observers`

```
REGISTRY.json (11 entrées) — état mesuré :
  agent-os          → junction vers /c/Users/amado/agent-os    ✅ présent (pas un observateur)
  pocketbase-vec    → junction                                  ✅ présent (pas un observateur)
  super-simple-software-factory → junction                       ✅ présent (pas un observateur)
  observatoire      → /c/Users/amado/agent-os/observatoire       🟡 PORT 8787 MORT
  opik              → dossier vide (git remote: comet-ml/opik)   ❌ vide
  agentpulse        → dossier vide (git remote: prove-ai/agentpulse) ❌ vide
  aios              → dossier vide (git remote: agiresearch/AIOS) ❌ vide
  agents-observe    → dossier vide                              ❌ vide
  phoenix           → dossier vide (à cloner)                   ❌ vide
  agent-super-spy   → dossier vide (à cloner)                   🟡 vide
  langsmith         → service hébergé smith.langchain.com       🌐 externe (CSP bloque l'iframe)
```

### 2c. Services additionnels détectés

```
  TCP    127.0.0.1:5180         ...  LISTENING   20188   # "Foundry Ontology Playground" (Vite/React)
  TCP    127.0.0.1:8642         ...  LISTENING   11872   # Python aiohttp (404 sur /)
```

| Port | Service | GET test | X-Frame-Options | Embeddable |
|---|---|---|---|---|
| `:5180` | **Foundry Ontology Playground** (Vite/React) | **200** | **absent** | ✅ |
| `:8642` | Python aiohttp | 404 | n/a | n/a (404) |
| `:8787` | observatoire (annoncé) | **000 (timeout)** | n/a | ❌ MORT |

---

## 3. Tache 1 — moteur de visite + 3 parcours

### 3a. Moteur : `src/onboarding/`

| Fichier | Rôle |
|---|---|
| `tourStore.ts` | zustand store : `status`, `tourId`, `stepIndex`, `bubble`, `lastLostReason`. `resolveStepTarget()` gère `selector` / `windowId` / `zone`. `computeBubble()` calcule la position, en respectant `anchor` (top/bottom/left/right/auto). |
| `TourOverlay.tsx` | Le composant visible. RAF-loop qui suit `useShellStore`. Rendu via `createPortal(node, document.body)`. Action-bearing steps pausent sur "target lost". |
| `index.ts` | Exports publics. |

### 3b. Trois parcours : `src/apps/onboarding/tours/`

| Tour | Étapes | Total | Action-bearing |
|---|---|---|---|
| `g-first-open` | topbar → desktop-icons → open-drawer → first-app → window-controls | **5** | étape 4 (Ouvrir Clients) |
| `g-first-agent` | open-people → people-overview → open-agent → approvals | **4** | étape 1 (Ouvrir People) |
| `g-first-data` | open-clients → new-button → fill-form → see-in-list | **4** | étape 1 (Ouvrir Clients) |

Règle respectée : **jamais de visite imposée deux fois** (localStorage guard), **toujours un moyen de sortir** (bouton X + touche Escape), **rien qui bloque le clic ailleurs** (panel `pointerEvents: auto` + overlay en `pointerEvents: none` hors bubble).

### 3c. Panel launcher : `OnboardingToursPanel.tsx`

- Bouton flottant en bas-droite (gradient violet), `data-testid="onboarding-tours-launcher"`.
- Panel qui s'ouvre au clic : liste les 3 tours avec indicateur "déjà vu", bouton "Rejouer".
- Intégré dans `MiniDesktopShell` (cf. `OnboardingApp.tsx:494`) avec `peelCitadelForTour()` qui ferme la citadel pour libérer la vue macro.

---

## 4. Tache 2 — services embarqués dans IT/R&D

### 4a. Cadre par service : `src/apps/it-rd/embedded/`

| Fichier | Rôle |
|---|---|
| `services.ts` | Catalogue des 4 services avec URL + note. `langsmith: { external: true }`. |
| `healthCheck.ts` | Sonde `HEAD`/`GET` avec `mode: 'no-cors'`, timeout 3s, capture des headers `X-Frame-Options` et CSP `frame-ancestors`. |
| `ServiceFrame.tsx` | Une carte par service : probe → iframe / erreur. Si `external: true`, affiche `ExternalOnly` (lien nouvel onglet, pas d'iframe silencieuse). |
| `EmbeddedServicesPanel.tsx` | Overlay 2×2, montage via `data-testid="embedded-services-launcher"`. Expose `window.openEmbeddedServices()` en DEV pour Playwright. |

### 4b. Tests réels

| Service | URL | Probe | État mesuré | UI rendue |
|---|---|---|---|---|
| agentgateway | `http://127.0.0.1:15000/ui` | OK 0 · 84ms | ✅ embeddable | **iframe chargé** ("Gateway Overview - LLM Enabled") |
| foundry | `http://127.0.0.1:5180/` | OK 200 · 73ms | ✅ embeddable | **iframe chargé** ("Foundry Ontology Playground") |
| observatoire | `http://127.0.0.1:8787/` | DOWN · 3005ms | ❌ connection refused | **message d'erreur** + URL + note REGISTRY |
| langsmith | `https://smith.langchain.com/` | OK 0 · 312ms | ❌ CSP `frame-ancestors 'self'` (bloqué navigateur) | **Service externe** + lien nouvel onglet |

---

## 5. Preuves — captures (toutes dans `captures/G_onboarding/`)

| # | Fichier | Contenu |
|---|---|---|
| 00 | `00-auth-done.png` | Page d'accueil post-auth "Decouvrir" |
| 01 | `01-launchers.png` | Les 2 chips flottants visibles : "Onboarding" + "Services embarques" |
| 02 | `02-tours-panel.png` | Panel des 3 tours ouvert, listing complet |
| 03 | `03-tour-1-step-1.png` | Tour 1 étape 1 : "La barre du haut" — bubble en haut |
| 03b | `03b-tour-1-step-2.png` | Tour 1 étape 2 : "Les icones du bureau" |
| 03c | `03c-tour-1-step-3.png` | Tour 1 étape 3 : "Le tiroir d'applications" |
| 04 | `04-tour-1-step-4.png` | Tour 1 étape 4 : "Ouvrir une premiere app" + clients window ouvert |
| **05** | **`05-cas-elimine.png`** | **CAS ÉLIMINE** : clients window glissé vers le haut, **la bulle a suivi** |
| 06 | `06-tour-1-step-5.png` | Tour 1 étape 5 : "Les feux de la fenêtre" (traffic lights) |
| 07 | `07-tour-2-step-1.png` | Tour 2 étape 1 : "Ouvrir People" |
| 08 | `08-tour-2-step-4.png` | Tour 2 étape 4 : "La file d'approbation" |
| 09 | `09-tour-3-step-1.png` | Tour 3 étape 1 : "Ouvrir Clients" |
| 10 | `10-tour-3-step-3.png` | Tour 3 étape 3 : "Remplir le formulaire" |
| 11 | `11-services-overlay.png` | Overlay complet des 4 services (vue d'ensemble) |
| 12 | `12-service-agentgateway.png` | Service iframe-loaded : Gateway Overview |
| 12 | `12-service-foundry.png` | Service iframe-loaded : Foundry Ontology Playground |
| 12 | `12-service-observatoire.png` | Service DOWN : message "Service injoignable" + URL + note REGISTRY |
| 12 | `12-service-langsmith.png` | Service externe : "Service externe" + lien nouvel onglet (pas d'iframe silencieux) |
| 15 | `15-console-errors.txt` | 3 erreurs `ERR_CONNECTION_REFUSED` (observatoire, attendu) |

### Le cas-élimine en détail

`05-cas-elimine.png` montre la fenêtre Clients après un drag de (350 px en x, 200 px en y). La bulle "Ouvrir une premiere app" est **restée ancrée à la fenêtre** — elle s'est repositionnée automatiquement (RAF-loop dans `TourOverlay`).

**Mécanisme** : `useShellStore` est mis à jour à chaque drag (`updatePosition`). Le RAF-loop relit `win.position` à chaque frame. La bulle suit. Aucun `getBoundingClientRect` n'aurait fait ça de manière fiable — l'observation directe du store est le bon angle.

---

## 6. Console errors

`15-console-errors.txt` liste 3 erreurs, toutes identiques :

```
[error] Failed to load resource: net::ERR_CONNECTION_REFUSED  (x3)
```

Origine : sonde HTTP contre `http://127.0.0.1:8787/` (observatoire, mort). Le navigateur refuse la connexion — c'est **attendu** et **informé** dans l'UI (capture `12-service-observatoire.png` montre "DOWN · 3005ms - Service injoignable").

Zéro erreur React, zéro erreur d'embarquement non gérée, zéro tour cassé.

---

## 7. Limites connues

- **Le TourOverlay vit dans MiniDesktopShell**, donc dans la fenêtre onboarding-app. Quand `peelCitadelForTour()` ferme la citadel, la fenêtre onboarding reste ouverte → TourOverlay survit. Mais si l'utilisateur ferme la fenêtre onboarding (red light), TourOverlay meurt. Acceptable : l'utilisateur peut rouvrir l'app et relancer le tour.
- **`peelCitadelForTour` ne ferme QUE la citadel**, pas la fenêtre onboarding. L'utilisateur voit un mini-bureau vide derrière la citadel fermée. Pour passer au vrai bureau, il ferme la fenêtre onboarding via ses feux de circulation.
- **Les `zone` (topbar / desktop-icons / drawer-button) sont codées en dur** dans `threeTours.ts`. Si l'utilisateur change la disposition du bureau (le dock passe à droite), il faut re-mesurer. Une étape ultérieure pourra lire les positions réelles depuis le DOM (`[data-window-frame]`, `[data-dock]`, etc.).
- **`resetAllTourV2Guards()` est exporté** mais pas encore branché à un bouton dans Settings → Help. À câbler.

---

## 8. Fichiers livrés

```
src/onboarding/
├── index.ts
├── tourStore.ts                          (état + resolveurs)
└── TourOverlay.tsx                       (RAF-loop + portal + auto-advance)

src/apps/onboarding/tours/
├── helpers.ts                            (openAppFromTour, peelCitadelForTour)
├── threeTours.ts                         (catalogue des 3 parcours)
└── OnboardingToursPanel.tsx              (launcher + panel)

src/apps/onboarding/
└── OnboardingApp.tsx                     (modifié : import + 2 lignes de montage)

src/apps/it-rd/embedded/
├── services.ts                           (catalogue des 4 services)
├── healthCheck.ts                        (sonde HEAD/GET + frame-block detector)
├── ServiceFrame.tsx                      (carte par service : probe + iframe ou erreur)
└── EmbeddedServicesPanel.tsx             (overlay 2x2 + launcher)

tools/
├── _check-errs.mjs                       (script debug — supprimable)
├── _check-snag.mjs                       (script debug — supprimable)
└── g-verify.mjs                          (script de verification — 16 captures)

_briefs/2026-08-11_production/
├── RAPPORT_G_ONBOARDING.md               (ce fichier)
└── captures/G_onboarding/                (16 captures + 1 fichier erreurs)
```
