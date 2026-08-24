#!/usr/bin/env bash
# Install Hermes Agent bare metal — pas de Docker.
# AUCUNE url d'install Linux confirmee dans cette session : la seule cible
# connue est le venv Python Windows (AppData/Local/hermes/hermes-agent/venv),
# qui n'aide pas sur un VPS. Trouver la vraie source sur
# https://hermes-agent.nousresearch.com/docs avant de lancer ce script.
set -euo pipefail

: "${HERMES_INSTALL_URL:?Definir HERMES_INSTALL_URL avant d'executer ce script — voir hermes-agent.nousresearch.com/docs/getting-started}"

if ! command -v python3 >/dev/null; then
  echo "python3 manquant. apt-get install -y python3 python3-venv d'abord." >&2
  exit 1
fi

python3 -m venv "$HOME/.hermes-agent/venv"
source "$HOME/.hermes-agent/venv/bin/activate"
pip install --upgrade pip
pip install "$HERMES_INSTALL_URL"

hermes --version || true
echo "Hermes installe dans $HOME/.hermes-agent/venv. Activer le Bot Mode via config.yaml (agent.bot_mode_protocol) avant de lancer le service."
