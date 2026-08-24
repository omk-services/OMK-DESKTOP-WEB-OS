#!/usr/bin/env bash
# Install Prime-Agent sur la VPS.
# URL confirmee par l'utilisateur le 2026-08-24 (Prime Intellect) :
# curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh
set -euo pipefail

curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh

if ! command -v prime-agent >/dev/null; then
  echo "Install terminee mais 'prime-agent' n'est pas sur le PATH. Verifier ~/.local/bin ou /usr/local/bin." >&2
  exit 1
fi

prime-agent --version || echo "Verifier manuellement l'installation : la commande --version n'est pas confirmee pour ce harnais."
