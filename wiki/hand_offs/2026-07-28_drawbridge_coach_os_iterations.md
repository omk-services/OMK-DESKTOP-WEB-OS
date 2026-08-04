# Handoff Phase 40 — Drawbridge setup for Coach OS iterations (2026-07-28)

> **D4 append-only** : handoff canon, jamais détruit, reversal path = `_TRASH_<date>/`.
> **A+ directive** : *"Configurons drawbridge pour les itterations de detail de Coach OS"*.

## D1 — Drawbridge en bref

Source : <https://github.com/breschio/drawbridge>

Drawbridge = Chrome extension qui transforme les annotations UI sur une app live en **task queue structurée** (`.moat/`) que Claude Code (ou Cursor/Codex/Windsurf) lit via le slash-command `/bridge` pour appliquer les fixes.

**Flow canon** :
1. Coach OS tourne sur `http://localhost:5174/`
2. Tu charges Drawbridge dans Chrome, "Connect Project" → `C:\Users\amado\coach-os\`
3. Tu cliques sur Sales Sanctum, appuie sur `C` (comment) ou `R` (rectangle) pour annoter
4. Drawbridge écrit `.moat/moat-tasks.md` + `moat-tasks-detail.json` + screenshots + `.claude/commands/bridge.md`
5. Tu ouvres Claude Code sur `coach-os` et lances `/bridge`
6. CC lit la queue, applique les fixes, build, retourne

## D2 — Ce qui a été préparé dans ce handoff (E1 Libre, 0 token)

| Fichier | Action | Pourquoi |
|---|---|---|
| `.gitignore` | Ajout `.moat/`, `.moat/screenshots/`, `.moat/moat-tasks.md`, `.moat/moat-tasks-detail.json`, `.claude/commands/bridge.md`, `.windsurf/workflows/bridge.md`, `.codex/prompts/bridge.md` | D4 append-only — ces fichiers sont générés localement par l'extension, ne doivent pas être commités (contiennent captures UI local-spécifiques) |
| `.moat/` | (vide pour l'instant, créé par Drawbridge au premier clic) | Le dossier sera généré automatiquement quand tu "Connect Project" |

## D7 — Action manuelle requise (E2 Notifié, toi)

Tu dois faire ces étapes localement (moi = E1 Libre, mais l'extension Chrome = action navigateur) :

### Étape 1 : Charger l'extension Drawbridge dans Chrome

1. Clone ou télécharge le repo Drawbridge :
   ```bash
   git clone https://github.com/breschio/drawbridge.git
   cd drawbridge
   ```
2. Chrome → `chrome://extensions/`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked**
5. Sélectionne `drawbridge/chrome-extension/`
6. Drawbridge apparaît dans ta toolbar Chrome

### Étape 2 : Lancer Coach OS dev server

```bash
cd "C:/Users/amado/coach-os"
nohup /c/Program\ Files/nodejs/node.exe node_modules/vite/bin/vite.js --port 5174 --host 127.0.0.1 > /tmp/coach-os-dev.log 2>&1 &
```

Le serveur tourne déjà (PID 905 vérifié). Si tu redémarres, relance-le.

### Étape 3 : Connect Project dans Drawbridge

1. Ouvre `http://localhost:5174/` dans Chrome
2. Click sur l'icône Drawbridge dans la toolbar Chrome
3. Click **Connect Project**
4. Sélectionne le dossier `C:\Users\amado\coach-os\` (le dossier racine du projet)
5. Drawbridge écrit dans ce dossier :
   - `.moat/moat-tasks.md`
   - `.moat/moat-tasks-detail.json`
   - `.moat/screenshots/`
   - `.claude/commands/bridge.md`
   - `.gitignore` (déjà préparé)

### Étape 4 : Annoter Coach OS

| Hotkey | Action |
|---|---|
| `C` | Comment — click sur un élément DOM, tape ton commentaire, Enter pour valider |
| `R` | Rectangle — drag pour entourer une zone, tape ton commentaire, Enter |
| `Esc` | Quitter le mode annotation |

**Cibles d'annotation prioritaires (Phase 38-39 livrées)** :
- `SalesDetailPage` — page détail in-place (border, padding, alignment)
- `CognitionOverviewContent` — banner knowledge sovereignty, StatCards alignment
- `TopBar` — BorderBeam mécanique canon, badge écosystème
- `AppFrame` sidebar — section active fill, collapse behavior

### Étape 5 : Run `/bridge` dans Claude Code

1. Ouvre Claude Code sur le projet `coach-os`
2. Lance `/bridge`
3. CC lit `.moat/moat-tasks-detail.json`, applique les fixes
4. Watch le build TypeScript / lint run

## D6 — Honest gaps

1. **Extension Chrome** : pas automatisable — tu dois charger manuellement dans Chrome
2. **`.moat/` généré par extension** : ce handoff ne contient pas les tasks, l'extension les écrit au premier clic
3. **`/bridge` slash-command** : généré par Drawbridge au premier Connect Project. Si tu lances `/bridge` et que ça dit "command not found", c'est que Drawbridge n'a pas encore écrit `.claude/commands/bridge.md` — refais Connect Project.
4. **Hot reload Coach OS** : le Vite dev server tourne, chaque edit CC fait refresh automatique dans Chrome
5. **Pas de MCP** : Drawbridge n'est pas un MCP server, c'est une extension + slash-command. Pas d'intégration native `mcp__` à câbler.

## D1 — Sister canon (D4 append-only)

- `wiki/hand_offs/2026-07-27_phase30-31-pipeline-massive-CHECKPOINT-5B-12B.md` (Phase 30-31 takeout YouTube)
- `wiki/hand_offs/2026-07-27_phase33-strategie-live-historique-youtube.md` (Phase 33 live historique)
- `wiki/hand_offs/2026-07-27_phase36-spec-loop-bmad-imbrication.md` (Phase 36 spec-loop × BMAD)
- `wiki/hand_offs/2026-07-27_phase38-sales-detail-page-pattern.md` (Phase 38 à venir)
- `wiki/hand_offs/2026-07-27_phase39-cognition-sovereigngate.md` (Phase 39 à venir)

## D4 — Reversal path

```bash
# Retirer .gitignore entries (mais garder fonctionnels)
cp "C:/Users/amado/coach-os/.gitignore" "C:/Users/amado/coach-os/_TRASH_2026-07-28_pre_drawbridge_setup/"

# Désactiver extension Chrome
# Chrome → chrome://extensions/ → toggle off Drawbridge
```

---

*D4 append-only. D7 E2 Notifié — action manuelle utilisateur requise pour setup extension.*
