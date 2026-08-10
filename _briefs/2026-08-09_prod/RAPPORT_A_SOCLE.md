# Rapport A — Socle commun

Date : 2026-08-09
Périmètre : `src/components/**`, `src/lib/**`, `src/stores/**`, `src/hooks/**`, `src/contexts/**`, `src/apps/_ui/**`, `src/data/**`, `tools/**`.

## Causes corrigées

1. **Identités instables et assertions de typage**
   - `CMSCardList` ne fabrique plus de tableau dans le sélecteur Zustand quand une collection est absente ; la référence vide est stable.
   - Les registres globaux d’applications et de détails utilisent des propriétés `Window` explicites, sans `any` ni double assertion.
   - Les handles DEV (`window.__coachos`) ont une déclaration globale dédiée.
   - `approveAndMerge` ne masque plus un scénario absent par un cast impossible : il échoue explicitement.
   - Les composants partagés et hooks principaux ont des types de retour explicites.

2. **Persistance locale non fiable**
   - Les opérations de layout du shell couvrent lecture, parse, validation de forme, écriture et suppression par `try/catch`.
   - La réhydratation accepte uniquement des fenêtres valides avant de toucher au store.
   - Les scripts de capture traitent les blobs JSON corrompus et les événements SSE invalides sans faire tomber la capture.

3. **Palette Tailwind figée dans le socle partagé**
   - Les classes de palette ont été remplacées par les variables de thème dans `src/components/**` et `src/apps/_ui/**`.
   - Les couleurs sémantiques restent explicites via `tone`/styles, au lieu de classes Tailwind de palette.
   - `--theme-on-accent` est calculé selon la luminance de l’accent, ce qui conserve le contraste des 12 thèmes.
   - Les boutons icon-only et champs partagés ont reçu labels accessibles.
   - Les lignes de tableau interactives sont activables au clavier.

4. **Outillage de capture**
   - Les assertions JSDoc `any` ont été retirées de `chat-shot.mjs` et `settings-shot.mjs`.
   - `shot.mjs` et `voice-shot.mjs` gardent un état sain si le JSON localStorage est invalide.
   - `invoke-shot.mjs` ignore un événement SSE mal formé au lieu d’abandonner tout le flux.

## Vérifications

- `npx tsc --noEmit` : exit 0 après chaque famille et en dernier contrôle.
- `node --check tools/shot.mjs tools/chat-shot.mjs tools/settings-shot.mjs tools/voice-shot.mjs` : exit 0.
- Deux passes statiques consécutives : aucun sélecteur Zustand instable ni classe de palette ciblée restant dans le socle/_ui.
- Capture vérifiée : `node tools/shot.mjs --app dashboard --section "Overview" --theme glassmorphism --out /tmp/a-socle-overview.png` ; rendu lisible, aucune erreur console/pageerror signalée.

## Commits

- `2944a2f fix(socle): stabiliser les contrats et la persistance`
- `88b7324 fix(theme): rendre le socle partagé cohérent avec les thèmes`
- `1ff885f fix(outils): durcir les scripts de capture`
- `c11f549 fix(cms): typer le registre de détails global`

## Vu hors périmètre, laissé aux autres agents

- `src/agent/voice.ts` — double assertion sur l’API SpeechRecognition ; dossier `src/agent/**` exclu.
- `src/agent/tools.ts` — handle DEV typé par double assertion ; dossier `src/agent/**` exclu.
- `src/apps/**` hors `src/apps/_ui/` — les casts, palettes ou comportements propres aux applications restent aux briefs B–E.
- `src/apps/ontology/ontology-app.test.ts`, `src/apps/finance/FinanceItemDetail.tsx`, `src/apps/growth/seed.ts`, `src/apps/product/ProductApp.tsx` — occurrences hors périmètre observées, non modifiées.

Les doubles assertions restantes dans `src/lib/ontology/ontology.test.ts` sont limitées au test volontaire de mutation d’objets gelés et justifiées par le commentaire immédiatement précédent.
