#!/usr/bin/env bash
# tools/lance.sh — bloc d'invocation canonique.
#
# Conforme au bloc documenté dans C:\Users\amado\CLAUDE.md §1
# (« Invocation qui fonctionne »). Ne pas improviser en ligne de commande.
#
# 2026-08-16 — pose pour résoudre la dette par obscurcité
# « lance.sh référencé par le canon, n'existe pas sur disque » (Wargame,
# DETTE_lance_sh_manquant.md).
#
# Usage :
#   cd $DEPOT
#   bash tools/lance.sh chemin/vers/GARDE_FOU.md chemin/vers/BRIEF.md
#   # ou via stdin :
#   cat GARDE_FOU.md BRIEF.md | bash tools/lance.sh

set -uo pipefail

# Piège 1 (canon §1) — précédence d'environnement. Le shell exporte
# `ANTHROPIC_BASE_URL=https://api.anthropic.com`, qui écrase la valeur
# de `settings.json`. Sans les `export` explicites, la clé MiniMax part
# chez Anthropic et revient en `Invalid API key`, avec un `exit 0`
# trompeur.
export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "import json;print(json.load(open('C:/Users/amado/.claude/settings.json',encoding='utf-8'))['env']['ANTHROPIC_API_KEY'])")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"

# DEPOT = le projet coach-os. Surchargeable via $DEPOT env.
: "${DEPOT:=C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os}"
cd "$DEPOT" || exit 1

# Piège 3 — le brief commence par `---`. Un brief au format OKF ouvre
# sur un frontmatter YAML. Passé en `-p "$(cat BRIEF.md)"`, le parseur
# d'options lit ce `---` comme un flag et rend `error: unknown option
# '---...`. **Toujours par stdin**, jamais en argument.
#
# Si des chemins sont passés en argument : on les concatène à stdin.
# Sinon on lit stdin tel quel.
if [ "$#" -gt 0 ]; then
  cat "$@" | /c/Users/amado/AppData/Roaming/npm/claude \
    -p --permission-mode bypassPermissions
else
  cat | /c/Users/amado/AppData/Roaming/npm/claude \
    -p --permission-mode bypassPermissions
fi
