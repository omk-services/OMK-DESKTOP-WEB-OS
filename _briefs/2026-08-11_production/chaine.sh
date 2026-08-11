#!/bin/bash
# Enchaine les trois vagues sans intervention humaine.
#
# La vague 1 (A, B, C) est deja lancee quand ce script demarre. Il attend qu'elle
# soit retombee, puis lance la 2, puis la 3.
#
# Pourquoi attendre plutot que tout lancer d'un coup : cinq `claude -p` demarres
# dans la meme seconde, trois n'ont jamais demarre — journal vide, exit 127. Le
# script d'enrobage npm est un fichier unique que Windows verrouille. Deux ou
# trois agents a la fois, echelonnes de deux minutes, jamais plus.
set -u
C="C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_briefs/2026-08-11_production"
JOURNAL="$C/journal_lancements.log"

# Un agent est fini quand sa ligne « termine » est inscrite au journal.
fini() { grep -q "^=== $1 : termine" "$JOURNAL" 2>/dev/null; }

attendre() {
  local reste
  while true; do
    reste=""
    for a in "$@"; do fini "$a" || reste="$reste $a"; done
    [ -z "$reste" ] && break
    echo "$(date '+%H:%M:%S') — en cours :$reste" >> "$C/chaine.log"
    sleep 120
  done
  echo "$(date '+%H:%M:%S') — vague terminee : $*" >> "$C/chaine.log"
}

lancer_vague() {
  local premier=1
  for a in "$@"; do
    [ $premier -eq 0 ] && sleep 150
    premier=0
    bash "$C/lance.sh" "$a" &
    echo "$(date '+%H:%M:%S') — lance $a" >> "$C/chaine.log"
  done
}

echo "=== chaine demarree $(date '+%H:%M:%S') ===" >> "$C/chaine.log"

# Vague 1 deja en vol : A (fondations avatar+supabase code), B (migrations), C (socle AI-natif).
attendre A B C

# Vague 2 : les surfaces visibles. Elles ne dependent pas les unes des autres,
# et leurs perimetres de fichiers sont disjoints.
lancer_vague D E F
attendre D E F

# Vague 3 : la prise en main, qui a besoin que les apps existent pour les montrer.
lancer_vague G
attendre G

echo "=== chaine terminee $(date '+%H:%M:%S') ===" >> "$C/chaine.log"
