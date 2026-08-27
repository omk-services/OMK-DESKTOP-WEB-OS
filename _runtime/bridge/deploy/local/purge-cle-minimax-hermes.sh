#!/usr/bin/env bash
# Retire MINIMAX_API_KEY du .env d'Hermes — le plan est resilie (voir
# COST_MODEL.md 2026-08-26 : "Token Plan $50/mois abandonne, n'evolue pas
# malgre la sortie de plusieurs modeles frontiere").
#
# A EXECUTER TOI-MEME. Ce script ne lit ni n'affiche JAMAIS la valeur de
# la cle — il se contente de retirer la ligne qui la porte, comme on
# retirerait une entree d'un fichier sans avoir besoin de savoir ce
# qu'elle contenait.
#
# Symptome observe le 2026-08-26 : "Auxiliary title generation failed:
# HTTP 429: The Token Plan usage limit has been reached" — Hermes essaie
# encore ce fournisseur en tache auxiliaire (mode `provider: auto`),
# malgre la resiliation.

set -euo pipefail

ENV_FILE="/c/Users/amado/AppData/Local/hermes/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier introuvable : $ENV_FILE" >&2
  exit 1
fi

if ! grep -q "^MINIMAX_API_KEY=" "$ENV_FILE"; then
  echo "Aucune ligne MINIMAX_API_KEY trouvee — rien a faire."
  exit 0
fi

BACKUP="$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
cp "$ENV_FILE" "$BACKUP"

# Retire uniquement la ligne MINIMAX_API_KEY, laisse le reste intact.
# grep -v suffit ici : on ne remplace rien, on supprime une ligne entiere,
# donc pas de risque d'exposer une valeur dans un argument de commande.
grep -v "^MINIMAX_API_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"

chmod 600 "$ENV_FILE" 2>/dev/null || true

echo "Ligne MINIMAX_API_KEY retiree de $ENV_FILE."
echo "Sauvegarde de l'ancienne version : $BACKUP"
echo "Verification : hermes doctor   (ne doit plus lister MINIMAX_API_KEY en 'configure')"
