#!/bin/bash
# Lancement d'un agent M3 sur un brief. Usage : bash lance.sh <LETTRE>
#
# Les cinq pieges de CLAUDE.md sont neutralises ici. Ne pas improviser en ligne
# de commande — recopier ce bloc tel quel.
#
#  1. Precedence d'environnement : le shell exporte ANTHROPIC_BASE_URL vers
#     api.anthropic.com, qui ecrase settings.json. Sans export explicite, la cle
#     MiniMax part chez Anthropic et revient en « Invalid API key », avec un
#     exit 0 trompeur.
#  2. PATH : `claude` est introuvable dans certains shells d'arriere-plan
#     (exit 127). Toujours le chemin absolu.
#  3. Le brief commence par `---` : passe en -p "$(cat ...)", le parseur lit ce
#     frontmatter YAML comme un flag. TOUJOURS par stdin.
#  4. L'outillage du depot detourne l'agent : d'ou GARDE_FOU.md en tete.
#  5. Pas plus de deux ou trois lancements simultanes : le script npm est un
#     fichier unique que Windows verrouille. Echelonner de deux ou trois minutes.
set -u
LETTRE="${1:?usage: bash lance.sh <A|B|C|D|E|F|G|H>}"

DEPOT="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os"
CAMP="$DEPOT/_briefs/2026-08-11_production"

BRIEF=$(ls "$CAMP"/BRIEF_${LETTRE}_*.md 2>/dev/null | head -1)
[ -z "$BRIEF" ] && { echo "Aucun brief pour la lettre $LETTRE"; exit 1; }

export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "import json;print(json.load(open('C:/Users/amado/.claude/settings.json',encoding='utf-8'))['env']['ANTHROPIC_API_KEY'])")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"

cd "$DEPOT" || exit 1
echo "=== $LETTRE : $(basename "$BRIEF") — demarre $(date '+%H:%M:%S') ===" >> "$CAMP/journal_lancements.log"

cat "$CAMP/GARDE_FOU.md" "$CAMP/SOCLE.md" "$BRIEF" \
  | /c/Users/amado/AppData/Roaming/npm/claude -p --permission-mode bypassPermissions \
  > "$CAMP/journal_${LETTRE}.log" 2>&1

echo "=== $LETTRE : termine $(date '+%H:%M:%S') (exit $?) ===" >> "$CAMP/journal_lancements.log"
