#!/usr/bin/env bash
# Lance un brief de correctif sur M3. Usage : ./lance.sh 1|2|3|4
#
# Les pièges du canon sont neutralisés ici : exports explicites, chemin absolu
# vers claude, brief passé par stdin, GARDE_FOU en tête, lancements échelonnés.
#
# Les quatre briefs ont des périmètres d'écriture DISJOINTS :
#   1 → src/lib/tooling/{identity,adapters}
#   2 → src/lib/auth, src/stores, wallpaper, tours, themes/store
#   3 → api/
#   4 → src/apps/{legal,people}, ErrorBoundary
# Ne pas élargir un périmètre sans vérifier qu'il ne recouvre pas un autre.

set -u
N="${1:?usage: lance.sh 1|2|3|4|5|6|7|8}"
DEPOT="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os"
BRIEFS="$DEPOT/_briefs/2026-08-17_CORRECTIFS_M3"

case "$N" in
  1) F="FIX_1_identite.md" ;;
  2) F="FIX_2_fuite_cache.md" ;;
  3) F="FIX_3_routes_api.md" ;;
  4) F="FIX_4_pages_cassees.md" ;;
  5) F="FIX_5_api500_et_deps.md" ;;
  6) F="FIX_6_customers_orphelin.md" ;;
  7) F="FIX_7_collections_fantomes.md" ;;
  8) F="FIX_8_persistance_versionnee.md" ;;
  *) echo "brief inconnu : $N" >&2; exit 2 ;;
esac

export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "import json;print(json.load(open('C:/Users/amado/.claude/settings.json',encoding='utf-8'))['env']['ANTHROPIC_API_KEY'])")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"

cd "$DEPOT" || exit 1

cat "$BRIEFS/GARDE_FOU.md" "$BRIEFS/$F" \
  | /c/Users/amado/AppData/Roaming/npm/claude -p --permission-mode bypassPermissions \
  > "$BRIEFS/journal_$N.log" 2>&1

echo "correctif $N termine, exit=$?"
