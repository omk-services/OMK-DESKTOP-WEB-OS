#!/usr/bin/env bash
# Install Hermes Agent sur la VPS.
# URL confirmee par l'utilisateur le 2026-08-24 (doc officielle Nous Research) :
# curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
set -euo pipefail

curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

if ! command -v hermes >/dev/null; then
  echo "Install terminee mais 'hermes' n'est pas sur le PATH. Verifier ~/.local/bin ou /usr/local/bin." >&2
  exit 1
fi

hermes --version || true
echo "Hermes installe. Activer le Bot Mode via config.yaml (agent.bot_mode_protocol) avant de lancer le service — voir hermes-agent.nousresearch.com/docs/user-guide/bot-mode."
