#!/usr/bin/env bash
# Garde de non-regression, appele par bmad-loop apres chaque session.
#
# POURQUOI PAS `npm run build` : il enchaine `tsc -b && vite build`, et le depot
# porte 88 erreurs TypeScript preexistantes (dont 32 TS2503, React 19 ayant
# retire le namespace global JSX). Un build rouge des le depart ferait echouer
# toutes les stories sans rien prouver. On mesure donc la NON-REGRESSION :
#   1. le nombre d'erreurs TS n'augmente pas au-dela de la reference ;
#   2. le bundle se construit toujours (vite seul, sans la passe tsc).
#
# POURQUOI cmd.exe : les binaires de node_modules sont compiles pour Windows
# (esbuild, rollup). Le node de la distro ne peut pas les charger. Et l'interop
# WSL n'execute PAS les `.cmd` : appeler `npx.cmd` directement fait interpreter
# le shim par bash, qui meurt sur `unexpected EOF`. Le piege est silencieux —
# le compteur retombait a 0, ce qui se lisait comme un succes. D'ou le controle
# de vraisemblance ci-dessous.

set -u
BASELINE=88
cd "$(dirname "$0")/.." || exit 1

echo "== erreurs TypeScript =="
OUT=$(cmd.exe /c "npx tsc --noEmit -p tsconfig.app.json" 2>&1)
COUNT=$(printf '%s' "$OUT" | grep -c "error TS")

# Controle de vraisemblance : tsc n'a pas tourne du tout.
if [ -z "$OUT" ]; then
  echo "ECHEC : tsc n'a produit aucune sortie — la chaine d'appel est cassee,"
  echo "        ce n'est PAS un succes. Verifier l'interop cmd.exe."
  exit 1
fi

echo "  $COUNT (reference : $BASELINE)"
if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "ECHEC : $((COUNT - BASELINE)) erreur(s) TypeScript introduite(s)."
  printf '%s' "$OUT" | grep "error TS" | tail -20
  exit 1
fi

echo "== build vite =="
if ! cmd.exe /c "npx vite build --logLevel warn"; then
  echo "ECHEC : le bundle ne se construit plus."
  exit 1
fi

echo "OK : $COUNT erreurs TS (<= $BASELINE), bundle construit."
