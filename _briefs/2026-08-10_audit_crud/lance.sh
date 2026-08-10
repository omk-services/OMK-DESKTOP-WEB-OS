#!/bin/bash
# lance.sh — lance un agent MiniMax-M3 sur un brief de la campagne 2026-08-09.
#
#   ./lance.sh A_SOCLE
#   ./lance.sh B_DASHBOARD
#
# Les pièges du CLAUDE.md racine sont neutralisés ici. Ne pas improviser cet
# appel en ligne de commande — le recopier tel quel.

set -u

ID="${1:?usage: ./lance.sh <F_FINANCE_SALES|G_DASH_OPS>}"

DEPOT="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os"
CAMP="$DEPOT/_briefs/2026-08-10_audit_crud"
CLAUDE_BIN="/c/Users/amado/AppData/Roaming/npm/claude"

# Piège 1 — précédence d'environnement. Le shell exporte ANTHROPIC_BASE_URL vers
# api.anthropic.com, ce qui écrase settings.json : sans ces export explicites la
# clé MiniMax part chez Anthropic et revient en « Invalid API key », avec exit 0.
export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "import json;print(json.load(open('C:/Users/amado/.claude/settings.json',encoding='utf-8'))['env']['ANTHROPIC_API_KEY'])")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"

case "$ID" in
  F_FINANCE_SALES) BRIEF="$CAMP/BRIEF_F_FINANCE_SALES.md"; CRIT="$CAMP/MESURE.md" ;;
  G_DASH_OPS)      BRIEF="$CAMP/BRIEF_G_DASH_OPS.md";      CRIT="$CAMP/MESURE.md" ;;
  *) echo "ID inconnu: $ID" >&2; exit 2 ;;
esac

[ -f "$BRIEF" ] || { echo "brief introuvable: $BRIEF" >&2; exit 2; }

cd "$DEPOT" || exit 1

# Piège 3 — le brief ouvre sur un frontmatter YAML. Passé en -p "$(cat ...)", le
# parseur d'options lit le `---` comme un flag. Toujours par stdin, jamais en argument.
# Piège 2 — chemin absolu vers claude : introuvable dans certains shells d'arrière-plan.
cat "$CAMP/GARDE_FOU.md" "$CAMP/SOCLE_ACQUIS.md" ${CRIT:+"$CRIT"} "$BRIEF" \
  | "$CLAUDE_BIN" -p --permission-mode bypassPermissions \
  > "$CAMP/journal_${ID}.log" 2>&1
CODE=$?

echo "TERMINE $ID exit=$CODE"
