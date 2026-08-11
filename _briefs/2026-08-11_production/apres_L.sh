#!/bin/bash
# M touche src/apps/onboarding/ et src/onboarding/, que L tient encore.
# Deux agents sur les memes fichiers s'ecrasent sans que ni l'un ni l'autre ne
# le voie : on attend que L soit retombe avant de lancer M.
set -u
C="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_briefs/2026-08-11_production"
while ! grep -q "^=== L : termine" "$C/journal_lancements.log" 2>/dev/null; do
  echo "$(date '+%H:%M:%S') — M attend la fin de L" >> "$C/chaine.log"
  sleep 120
done
echo "$(date '+%H:%M:%S') — L retombe, lancement de M" >> "$C/chaine.log"
bash "$C/lance.sh" M
