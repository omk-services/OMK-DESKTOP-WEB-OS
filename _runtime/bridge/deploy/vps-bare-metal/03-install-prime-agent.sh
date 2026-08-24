#!/usr/bin/env bash
# Install Prime-Agent bare metal — pas de Docker.
# Prime-Agent est de type "sdk" dans harnesses.json, statut "suppose" : jamais
# sonde avec succes, aucune source d'installation confirmee dans cette
# session. Ne pas deviner une URL — la recuperer sur le depot officiel de
# Prime-Agent avant d'executer ce script.
set -euo pipefail

: "${PRIME_AGENT_INSTALL_URL:?Definir PRIME_AGENT_INSTALL_URL avant d'executer ce script — source non confirmee, a trouver sur le depot officiel Prime-Agent}"

if ! command -v python3 >/dev/null; then
  echo "python3 manquant. apt-get install -y python3 python3-venv d'abord." >&2
  exit 1
fi

python3 -m venv "$HOME/.prime-agent/venv"
source "$HOME/.prime-agent/venv/bin/activate"
pip install --upgrade pip
pip install "$PRIME_AGENT_INSTALL_URL"

prime-agent --version || echo "Verifier manuellement l'installation : la commande --version n'est pas confirmee pour ce harnais."
