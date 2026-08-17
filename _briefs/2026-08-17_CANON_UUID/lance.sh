#!/usr/bin/env bash
# Lance un brief sur M3. Usage : ./lance.sh code|iframe
#
# Les cinq pieges du canon sont neutralises ici : exports explicites, chemin
# absolu vers claude, brief passe par STDIN, GARDE_FOU en tete, lancements
# echelonnes.
#
# Perimetres DISJOINTS :
#   code   -> src/lib/{auth,audit,tenant}  (ECRITURE)
#   iframe -> aucun fichier source         (rapport seul)

set -u
QUOI="${1:?usage: lance.sh code|iframe}"
DEPOT="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os"

case "$QUOI" in
  code)
    GARDE="$DEPOT/_briefs/2026-08-17_CORRECTIFS_M3/GARDE_FOU.md"
    BRIEF="$DEPOT/_briefs/2026-08-17_CANON_UUID/BRIEF_ALIGNEMENT_CODE.md"
    LOG="$DEPOT/_briefs/2026-08-17_CANON_UUID/journal.log"
    ;;
  iframe)
    GARDE="$DEPOT/_briefs/2026-08-17_PENTEST_M3/GARDE_FOU.md"
    BRIEF="$DEPOT/_briefs/2026-08-17_APPS_IFRAME/BRIEF_ARCHITECTURE.md"
    LOG="$DEPOT/_briefs/2026-08-17_APPS_IFRAME/journal.log"
    ;;
  *) echo "inconnu : $QUOI" >&2; exit 2 ;;
esac

export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "import json;print(json.load(open('C:/Users/amado/.claude/settings.json',encoding='utf-8'))['env']['ANTHROPIC_API_KEY'])")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"

cd "$DEPOT" || exit 1

# Le brief iframe a ses propres FAITS ; on les concatene quand ils existent.
FAITS="$DEPOT/_briefs/2026-08-17_APPS_IFRAME/FAITS.md"
if [ "$QUOI" = "iframe" ] && [ -f "$FAITS" ]; then
  cat "$GARDE" "$FAITS" "$BRIEF"
else
  cat "$GARDE" "$BRIEF"
fi | /c/Users/amado/AppData/Roaming/npm/claude -p --permission-mode bypassPermissions \
  > "$LOG" 2>&1

echo "brief $QUOI termine, exit=$?"
