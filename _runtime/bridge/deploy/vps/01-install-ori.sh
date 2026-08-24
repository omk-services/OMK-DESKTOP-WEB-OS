#!/usr/bin/env bash
# Install Ori bare metal — pas de Docker.
# Commande reprise telle quelle de harnesses.json (id: ori, statut: mesure sur
# Windows). Non executee sur Linux dans cette session : premiere execution
# reelle a verifier, pas a supposer reussie.
set -euo pipefail

if ! command -v curl >/dev/null; then
  echo "curl manquant. apt-get install -y curl (ou equivalent) d'abord." >&2
  exit 1
fi

curl -fsSL https://openrouter.ai/labs/ori/install.sh | bash

if ! command -v ori >/dev/null; then
  echo "Install terminee mais 'ori' n'est pas sur le PATH. Verifier ~/.local/bin ou /usr/local/bin." >&2
  exit 1
fi

ori --version || true
echo "Ori installe. Renseigner OPENROUTER_API_KEY avant de lancer le service systemd."
