#!/usr/bin/env bash
# tools/monitor.sh — health check des serveurs locaux.
# Lancé par cron toutes les 5 min. Écrit dans .cache/gauntlet/health.log.
# Alerte = ligne `ALERTE` dans le log. Le consultant lit le log au boot.
#
# Coût : zéro. Dépendances : bash, curl, tasklist (Windows natif).
#
# 2026-08-16 — Chantier 1 du Wargame anti-fragilité.

set -uo pipefail
LOG="C:/Users/amado/.cache/gauntlet/health.log"
TS=$(date -Iseconds 2>/dev/null || date "+%Y-%m-%dT%H:%M:%S")
mkdir -p "$(dirname "$LOG")"

# Bornes mesurées 2026-08-16 :
#   16 claude.exe, 26 node.exe, 57 chrome.exe, 1 agentgateway.exe.
# Plafond documente : node total MAX_NODE=45 (canon §1 Piège 5).
WARN_NODE=40
WARN_DISK_PCT=80
WARN_CLAUDE=20

# ── node.exe ──────────────────────────────────────────────────────
node_count=$(tasklist 2>/dev/null | grep -ci 'node.exe' || echo 0)
if [ "$node_count" -gt "$WARN_NODE" ]; then
  echo "$TS ALERTE node_count=$node_count (> $WARN_NODE)" >> "$LOG"
fi

# ── agentgateway ─────────────────────────────────────────────────
gw_alive=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:15000/ 2>/dev/null || echo 000)
# 308 = redirect (server up) ; 200 = page ; 000 = timeout (mort)
if [ "$gw_alive" != "308" ] && [ "$gw_alive" != "200" ]; then
  echo "$TS ALERTE gateway=$gw_alive (attendu 308 ou 200)" >> "$LOG"
fi

# ── claude.exe ──────────────────────────────────────────────────
claude_count=$(tasklist 2>/dev/null | grep -ci 'claude' || echo 0)
if [ "$claude_count" -gt "$WARN_CLAUDE" ]; then
  echo "$TS ALERTE claude_count=$claude_count (> $WARN_CLAUDE)" >> "$LOG"
fi

# ── disque ──────────────────────────────────────────────────────
# Note : `df --output=pcent` n'est pas portable. On parse l'anglais.
disk_pct=$(df /c 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
if [ -n "$disk_pct" ] && [ "$disk_pct" -gt "$WARN_DISK_PCT" ]; then
  echo "$TS ALERTE disk_pct=$disk_pct (> $WARN_DISK_PCT)" >> "$LOG"
fi

# ── sub-agents Workflow (mesure via le hook) ─────────────────────
# On regarde le nombre de fichiers agent-*.meta.json actifs dans la dernière heure.
sa_count=$(find "C:/Users/amado/.claude/projects" -name "agent-*.meta.json" -mmin -60 2>/dev/null | wc -l)
WARN_SA=6
if [ "$sa_count" -gt "$WARN_SA" ]; then
  echo "$TS ALERTE subagents_active=$sa_count (> $WARN_SA sur 60 min)" >> "$LOG"
fi

# ── OK ──────────────────────────────────────────────────────
echo "$TS OK node=$node_count claude=$claude_count gateway=$gw_alive disk=${disk_pct:-?}% subagents_60m=$sa_count" >> "$LOG"
