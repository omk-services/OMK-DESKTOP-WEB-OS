#!/usr/bin/env bash
# Rotation securisee de OPENROUTER_API_KEY dans le .env d'Hermes.
#
# A EXECUTER TOI-MEME, dans TON PROPRE terminal (Git Bash). Jamais colle
# dans un chat, jamais passe en argument de commande — un argument reste
# visible dans l'historique du shell et dans la liste des process pendant
# l'execution. La cle n'est demandee qu'en saisie masquee (`read -s`),
# qui n'est JAMAIS enregistree dans .bash_history.
#
# Contexte : les 13 clés du compte OpenRouter ont ete purgees le
# 2026-08-26. Celle enregistree dans Hermes (sk-o...ca33) est morte.
# Ce script en installe une nouvelle sans qu'elle transite par un agent,
# un log, ou une capture d'ecran.

set -euo pipefail

# Sans ca, un lancement direct de bash.exe (ex: `& "...bash.exe" script.sh`
# depuis PowerShell) demarre un shell non-login qui ne charge PAS
# /etc/profile — date/grep/awk deviennent introuvables meme s'ils
# existent juste a cote de bash.exe. Mesure du 2026-08-27 : le premier
# essai a avorte a la ligne `date` sans toucher le fichier.
case ":$PATH:" in
  *:/usr/bin:*) ;;
  *) export PATH="/usr/bin:/mingw64/bin:$PATH" ;;
esac

ENV_FILE="/c/Users/amado/AppData/Local/hermes/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier introuvable : $ENV_FILE" >&2
  echo "Verifie le chemin avec : hermes config env-path" >&2
  exit 1
fi

echo "Cible : $ENV_FILE"
echo "Genere d'abord la nouvelle cle sur openrouter.ai/workspaces/default/keys"
echo "(bouton 'New Key'), puis colle-la ici — rien ne s'affichera a l'ecran."
echo

read -r -s -p "Nouvelle cle OpenRouter (sk-or-v1-...) : " NEW_KEY
echo
echo

if [ -z "$NEW_KEY" ]; then
  echo "Cle vide — rien n'est modifie." >&2
  exit 1
fi

case "$NEW_KEY" in
  sk-or-v1-*) : ;;
  *)
    echo "Attention : la valeur ne commence pas par 'sk-or-v1-'." >&2
    read -r -p "Continuer quand meme ? (o/N) " CONFIRM
    if [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
      unset NEW_KEY
      echo "Annule." >&2
      exit 1
    fi
    ;;
esac

# Sauvegarde horodatee avant toute modification — jamais ecrasee sans trace.
BACKUP="$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
cp "$ENV_FILE" "$BACKUP"

# La cle passe par ENVIRON, jamais par -v (qui apparaitrait dans argv,
# donc potentiellement dans une liste de process pendant l'execution).
export NEW_KEY
if grep -q "^OPENROUTER_API_KEY=" "$ENV_FILE"; then
  awk '
    /^OPENROUTER_API_KEY=/ { print "OPENROUTER_API_KEY=" ENVIRON["NEW_KEY"]; next }
    { print }
  ' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
else
  printf '\nOPENROUTER_API_KEY=%s\n' "$NEW_KEY" >> "$ENV_FILE"
fi
unset NEW_KEY

chmod 600 "$ENV_FILE" 2>/dev/null || true

echo "Cle mise a jour dans $ENV_FILE — valeur jamais affichee, jamais loggee."
echo "Sauvegarde de l'ancienne version : $BACKUP"
echo "Verification (n'affiche jamais la valeur, seulement si elle est presente) :"
echo "  hermes config check"
