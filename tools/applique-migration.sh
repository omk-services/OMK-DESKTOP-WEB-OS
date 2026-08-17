#!/usr/bin/env bash
# applique-migration.sh — joue UN fichier .sql sur UN projet Supabase.
#
# Usage : ./applique-migration.sh <project_ref> <chemin.sql>
#
# Deux pieges deja payes, neutralises ici :
#  1. `python -c` + urllib se fait refuser par Cloudflare (403, error 1010).
#     On passe donc par curl, avec le corps JSON ecrit dans un fichier temporaire.
#  2. Un chemin `/tmp/...` n'est pas lu par le curl de Windows. On ecrit le
#     payload dans %TEMP% avec un chemin que curl comprend.
#
# Le script ECHOUE BRUYAMMENT : code de sortie non nul si l'API ne rend pas
# 2xx, et le corps de la reponse est affiche. Une migration a moitie jouee
# laisse la base dans un etat batard — mieux vaut le voir tout de suite.

set -u
REF="${1:?usage: applique-migration.sh <project_ref> <chemin.sql>}"
SQL="${2:?usage: applique-migration.sh <project_ref> <chemin.sql>}"

[ -f "$SQL" ] || { echo "fichier introuvable : $SQL" >&2; exit 2; }

T=$(python -c "import json;print(json.load(open(r'C:/Users/amado/.mcp.json',encoding='utf-8'))['mcpServers']['supabase-omk']['env']['SUPABASE_ACCESS_TOKEN'])")
P="C:/Users/amado/AppData/Local/Temp/mig_payload.json"

python -c "
import json,sys
sql=open(r'''$SQL''',encoding='utf-8').read()
open(r'''$P''','w',encoding='utf-8').write(json.dumps({'query':sql}))
print(f'  {len(sql)} octets de SQL')
"

CODE=$(curl -s -o "$P.out" -w '%{http_code}' --max-time 180 -X POST \
  -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  --data-binary "@$P" \
  "https://api.supabase.com/v1/projects/$REF/database/query")

echo "  HTTP=$CODE"
if [ "$CODE" -lt 200 ] || [ "$CODE" -ge 300 ]; then
  echo "  ECHEC — reponse :" >&2
  head -c 900 "$P.out" >&2; echo >&2
  rm -f "$P" "$P.out"
  exit 1
fi

head -c 300 "$P.out"; echo
rm -f "$P" "$P.out"
