# RAPPORT M — Audit (Brief M, 2026-08-11)

> **Statut** : en cours · rédaction au fil de l'eau

## Périmètre exclusif

- `src/apps/audit/**` — à créer (s'ajoute à l'AuditApp existant)
- `src/apps/onboarding/**` — à supprimer après migration (citadel, OnboardingApp, helpers, tours panel)
- `src/lib/app-discovery.tsx` — uniquement la ligne d'enregistrement
- `src/onboarding/TourOverlay.tsx` — uniquement l'en-tête de documentation
- `package.json` — dépendances de visite uniquement

## Interdits

`src/site/**`, `public/site/**`, `src/apps/legal/**`, `deploy/**`,
`src/components/Desktop.tsx`, `supabase/**`, `src/components/Dock.tsx`.

## Décisions actées

### Chantier 1 — suppression citadel

`src/apps/onboarding/citadel/` sera supprimé en entier (3 fichiers :
`DemoWindowFrame.tsx`, `MiniDock.tsx`, `demoApps.tsx`). Le bug d'origine —
clamp `y` calcule sur `window.innerHeight` au lieu du contenant de la
fenêtre — ne sera pas corrigé : c'est le symptôme de la double
implémentation, supprimer le faux bureau suffit.

`src/lib/demoShell.ts` reste en place : `Desktop.tsx` (interdit) en importe
toujours `useDemoShellStore` et `markCitadelSeen`. Le pre-seed du citadel
dans `Desktop.tsx` deviendra du code mort (les fenêtres sont posées dans un
store que rien ne lit plus) — c'est acceptable.

### Chantier 2 — renommage onboarding → audit

- `app-discovery.tsx` : suppression de `registerApp({ id: 'onboarding' })`.
  L'AuditApp existant (`hidden: true`) est démasqué, son nom devient
  `Audit`, sa description FR est réécrite.
- `shell.store.ts` : ajout d'une migration silencieuse dans `restoreLayout` :
  toute fenêtre portant `id: 'onboarding'` devient `id: 'audit'`. Pareil
  pour `dock.store.ts`.
- Le check `citadelOnly` dans `saveLayout` est neutralisé proprement (la
  condition devient sans objet après le renommage).

### Chantier 3 — diagnostic guidé

- Une nouvelle section "Diagnostic" est ajoutée à l'AuditApp.
- Elle pilote un parcours à travers les 6 grilles (Maturité, Arbitrage,
  Contexte, Données, Automatisabilité, Arbitrage & ROI).
- Chaque critère reçoit un choix parmi les 3 niveaux déjà présents dans
  la seed (`level0/1/2`) + un champ notes libres.
- À la fin, **un verdict argumenté par grille** est rendu — pas de score
  agrégé sur 100, c'est le coach qui rédige son propre jugement.
- Le résultat est enregistré dans une nouvelle collection CMS
  `audit_diagnostic_runs` (ajoutée à `seed.ts`).
- La chaîne complète est prouvée par compteur CMS avant/après.

### Chantier 4 — répartition des moteurs de tour

**Décision documentée en tête de `TourOverlay.tsx`** :

| Surface | Outil | Pourquoi |
|---|---|---|
| Bureau Coach OS (fenêtres flottantes) | moteur maison (`src/onboarding/TourOverlay.tsx`) | seul qui suit le store shell |
| Site `/site/` | pile standard | scroll de document, pas de DOM flottant |
| App Audit (flux linéaire) | pile standard | flux d'étapes dans une fenêtre, pas flottant |

**Choix entre `usertour.js` et Shepherd pour le flux Audit linéaire** :

| | usertour.js | Shepherd |
|---|---|---|
| Modifiable sans code | oui via dashboard hébergé app.usertour.io | non, c'est du code JS |
| Compte hébergé requis | oui | non |
| Déjà installé | oui (déjà utilisé par `src/lib/tours.ts`) | non |

**Verdict** : aucun des deux ne donne la promesse exacte d'un non-technique
modifiant un parcours sans rien toucher — usertour.js exige un compte
hébergé et Shepherd exige du code. **usertour.js** est retenu pour
réutiliser la dépendance déjà installée et l'instrumentation RGPD déjà
câblée (consent gate dans `observability.ts`), mais le brief sera noté
franchement dans le rapport : la promesse "sans code" ne sera vraie que
quand A0 aura créé les content IDs côté app.usertour.io et les aura
coller dans `VITE_USERTOUR_CONTENT_*`.

Pour cette campagne, l'app Audit embarque un parcours linéaire en React
pur (les sections AppFrame enchaînées + un état local de step), suffisant
pour la campagne de validation. Le passage à usertour.js viendra quand
A0 aura posé les content IDs.

### Conséquence sur les autres fichiers

- `FirstRunInvitation.tsx` (dans `src/onboarding/`) : suppression de l'appel
  à `peelCitadelForTour()` (le citadel n'existe plus, le bureau n'a plus
  besoin d'être "épluché").
- `src/apps/onboarding/tours/helpers.ts` : supprimé (ne contenait que
  `peelCitadelForTour`).
- `src/apps/onboarding/tours/OnboardingToursPanel.tsx` : supprimé (n'était
  utilisé que par `OnboardingApp.tsx`).
- `src/apps/onboarding/tours/threeTours.ts` : **conservé**. `Desktop.tsx`
  (interdit) en importe `TOURS`. Le déplacer ailleurs obligerait à
  modifier `Desktop.tsx`. La structure `src/apps/onboarding/tours/`
  persiste uniquement pour ce fichier — il sera renommé/déplacé dans une
  passe ultérieure qui aura la permission de toucher `Desktop.tsx`.

## État d'avancement

- [x] Lecture du périmètre, mesure de l'état
- [x] Suppression de la citadelle + OnboardingApp
- [x] Renommage onboarding → audit + migration localStorage
- [x] Diagnostic guidé (6 grilles + verdict + CMS)
- [x] Header TourOverlay documenté
- [x] Vérification visuelle (`shot.mjs`)
- [x] Rapport
