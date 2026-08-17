# DETTE #3 — `lance.sh` canonique n'existe pas sur disque

> **Date : 2026-08-16**
> **Source : Wargame anti-fragilité, §3 F12, et rapport RAPPORT_TERMINAL.md**
> **Statut : documenté, NON exécuté**

## Ce que c'est

Le canon `C:\Users\amado\CLAUDE.md` §1 contient un bloc nommé **« Invocation
qui fonctionne »** qui documente un script `lance.sh` :

```bash
export ANTHROPIC_BASE_URL="https://api.minimax.io/anthropic"
export ANTHROPIC_API_KEY="$(python -c "...settings.json...")"
export ANTHROPIC_MODEL="MiniMax-M3[1m]"
export ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3[1m]"
cd "$DEPOT" || exit 1
cat GARDE_FOU.md BRIEF.md \
  | /c/Users/amado/AppData/Roaming/npm/claude -p --permission-mode bypassPermissions \
  > journal.log 2>&1
```

Le canon dit *« Ce bloc se recopie tel quel dans un `lance.sh` ; ne pas
l'improviser en ligne de commande »*. Mais **le script n'existe pas sur
disque** — confirmé par RAPPORT_TERMINAL.md (« Aucun `lance.sh` n'existe
sur disque : le bloc du canon est une forme documentée, non matérialisée »).

## Pourquoi c'est de la dette par obscurcité

- Le canon **réfère** un fichier qui **n'existe pas**.
- Un humain ouvrant le projet coach-os cherche `lance.sh`, ne le trouve pas,
  improvise. **L'improvisation a coûté des lancements silencieux**
  (cf. canon §1 Piège 1-4).
- La référence canon → fichier est cassée.

## Ce que je peux faire

Je matérialise `lance.sh` au bon endroit (`coach-os/tools/lance.sh` ou
`scripts/lance.sh`), strictement conforme au bloc du canon, sans rien
changer.

**Coût** : 0 (un fichier de 12 lignes).
**Bénéfice** : ferme la référence cassée.

## Décision tienne

Dis-moi **« pose lance.sh »** et je le fais. Sinon, je laisse la dette
documentée, et tu y reviens quand tu veux.

## Variante

Si tu veux **une version plus robuste** :
- paramètres en variables d'environnement (pas en littéral)
- trap pour cleanup du process claude en cas de SIGINT
- log structuré JSON
- timeout configurable

Mais c'est plus que ce que le canon demande. À toi de voir.
