# Correction — registre honnête, routeur prudent

Périmètre touché : `_runtime/bridge/bridge.mjs`, `adapters.mjs`, `harnesses.json`, `surfaces.json` (inchangé), `rbac-test.mjs`. `_runtime/kernel.mjs`, `_runtime/agents/**`, `src/**` non touchés.

## Le sondage

`node bridge.mjs --sonde` teste réellement chaque cible : chemin absolu direct, ou recherche par nom nu dans `PATH` + `~/.local/bin` + `~/bin` + `%APPDATA%/npm`, avec les extensions Windows `.cmd/.exe/.ps1/.bat`. Pour les harnais `http`, une requête `HEAD` avec délai de 4s. Pour `sdk`, motif explicite « non sondable en ligne de commande » — jamais faussement classé mort.

Sortie réelle du run final, les 18 harnais :

```
id            joignable  chemin/motif
claude-code   oui        C:/Users/amado/AppData/Roaming/npm/claude
codex         oui        C:\Users\amado\AppData\Local\OpenAI\Codex\bin\codex.exe (codex-cli 0.130.0-alpha.5)
hermes-agent  oui        C:\Users\amado\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe (Hermes Agent v0.15.1)
multica       oui        https://api.multica.ai (hote repond, code 404)
openclaw      oui        C:\Users\amado\AppData\Roaming\npm\openclaw
antigravity   non        absent du PATH et des repertoires connus (68 repertoires sondes)
cursor        non        absent du PATH et des repertoires connus (68 repertoires sondes)
open-code     non        absent du PATH et des repertoires connus (68 repertoires sondes)
buzz          oui        C:\Users\amado\bin\buzz.cmd
prime-agent   n.d.       type sdk, non sondable en ligne de commande
j-code        non        absent du PATH et des repertoires connus (68 repertoires sondes)
d-code        non        absent du PATH et des repertoires connus (68 repertoires sondes)
paperclip     n.d.       type sdk, non sondable en ligne de commande
ori           oui        C:\Users\amado\bin\ori.cmd
dsh           non        absent du PATH et des repertoires connus (68 repertoires sondes)
grok          non        absent du PATH et des repertoires connus (68 repertoires sondes)
pi            oui        C:\Users\amado\bin\pi.cmd
openbot       non        URL invalide : openbot

8 joignables sur 18
```

**Le disque a bougé depuis l'audit original** (~15h avant ce run) : `hermes` et `buzz` sont désormais de vrais binaires installés et sur le `PATH` — l'audit les avait trouvés absents parce que leur `cible` déclarée était un libellé, pas un identifiant, et le disque n'avait pas encore ces installations. C'est exactement l'argument pour un sondage dynamique plutôt qu'un tableau figé : un registre statique aurait continué de mentir dans les deux sens.

## Avant / après

| Harnais | Statut avant | Sondé | Statut après | Cible corrigée |
|---|---|---|---|---|
| claude-code | mesure | joignable | mesure | inchangée |
| codex | mesure | joignable | mesure | inchangée |
| openclaw | mesure | joignable | mesure | inchangée |
| multica | mesure | joignable | mesure | inchangée |
| ori | declare | joignable | **mesure** | inchangée (`ori`) |
| pi | declare | joignable | **mesure** | inchangée (`pi`) |
| hermes-agent | declare | joignable (après correction) | **mesure** | `"Hermes Desktop Native"` (libellé) → **`hermes`** (résolu par PATH, `venv/Scripts/hermes.exe`, `--version` répond) |
| buzz | declare | joignable (après correction) | **mesure** | `".buzz"` (dossier de données) → **`buzz`** (résolu par PATH, `bin/buzz.cmd`) |
| antigravity | declare | introuvable | **suppose** | inchangée, `sonde` attaché |
| cursor | declare | introuvable | **suppose** | inchangée |
| open-code | declare | introuvable | **suppose** | inchangée (déjà honnête sur son absence) |
| dsh | declare | introuvable | **suppose** | inchangée |
| grok | suppose | introuvable | suppose | inchangée (cohérent) |
| j-code, d-code | suppose | introuvable | suppose | inchangées |
| prime-agent, paperclip | suppose | type sdk, non sondable | suppose (inchangé, pas de faux négatif) | inchangées |
| openbot | suppose | URL non résolvable | suppose | inchangée |

Chaque harnais porte désormais un champ `sonde: { joignable, chemin, motif, version, sonde_le }`, persisté par `--sonde` (le flag `--sans-ecrire` permet un aperçu sans écriture). **Aucun harnais supprimé.**

Note honnête : après reconciliation, le statut `declare` a disparu du registre (tout `declare` a été soit prouvé `mesure`, soit rétrogradé `suppose`). C'est la conséquence directe de la règle du brief, pas un artefact — `declare` redevient un état transitoire entre deux sondages, pas une case de repos.

## Le routeur n'élit plus un mort

Le cas d'origine de l'audit (`besoins:["voice"]` → élisait `buzz`, un dossier inexistant) **n'est plus reproductible tel quel** : `buzz` est maintenant réellement joignable après correction de sa cible. Démonstration équivalente avec des harnais réellement morts sur ce poste (`cursor`, `open-code`, `dsh`, `grok` — tous confirmés absents) :

```
$ node bridge.mjs --route '{"besoins":["tool_call","file_edit","shell"],"interdits":["claude-code","codex","openclaw","ori","hermes-agent","buzz","pi","multica"]}'
refus  : les harnais qui couvrent ces besoins sont tous injoignables sur ce poste (sondage)
         cursor: absent du PATH... | open-code: absent du PATH... | dsh: absent du PATH... | grok: absent du PATH...
         relancer avec ignorerSonde:true (ou --ignorer-sonde) pour simuler quand meme

$ node bridge.mjs --route '{"besoins":["tool_call","file_edit","shell"],"interdits":[...]}' --ignorer-sonde
elu    : cursor (statut=suppose, 3 capacites, score=13)
```

`invocableRapide(h)` consulte le champ `sonde` persisté (rapide, pas de re-sondage à chaud) ou, à défaut, une vérification disque synchrone pour `cli`/`desktop`. Les harnais `http`/`sdk` jamais sondés ne sont pas bloqués par défaut (éviter les faux négatifs sans données fraîches). L'autotest exploite le registre réel : il trouve dynamiquement un harnais `sonde.joignable === false` et vérifie qu'il est écarté par défaut puis réadmis avec `ignorerSonde`.

## Failles fermées

**Score.** Nouveau barème : `POIDS_STATUT[statut] * 10 + bonus`, où `bonus = min(capacités_non_vérifiées, 3) + capacités_vérifiées * 2`. Seul un harnais `mesure` peut avoir des capacités « vérifiées » (ses capacités déclarées, ou un sous-ensemble explicite via `capacites_verifiees` — jamais un `declare`/`suppose`, même si le champ est présent). Plafond de 3 sur le bonus non vérifié : un `declare` qui coche les 11 capacités du vocabulaire canonique plafonne à `20 + 3 = 23`, contre `30 + 2 = 32` pour un `mesure` à une seule capacité — l'écart de palier (10) l'emporte toujours sur l'accumulation déclarative (3 max). Testé par autotest avec les mêmes objets fictifs que l'audit (`mesure-mince` vs `declare-charge`).

**`producteurs[0]`.** Remplacé par `comparerAdaptateurs`, critère explicite écrit dans le code : (1) sens `entrant+sortant` avant `entrant` avant `sortant` ; (2) l'adaptateur dont l'id égale la surface produite (le producteur "canonique", ex. `mcp` pour la surface `mcp`) avant un producteur au nom différent (`harness`, `skill`, `mcp-apps`) ; (3) ordre alphabétique en dernier recours. Testé par une inversion du tableau `ADAPTATEURS` : le gagnant ne change pas.

**Trous de surface.** Le compte réel est bien **12** surfaces produites-non-lues (`webmcp, agui, a2ui, ucp, a2p, acp-ibm, agp, tap, oap, rdf-agent, tdf, fcp`) — la mécanique de `trous()` était déjà correcte, seul un ancien document externe affirmait 11. `agentos` est désormais classé à part (`vocabulaire_interne`) plutôt que mêlé aux vrais manques : son unique adaptateur est `sens: 'interne'` par construction (un processus, pas un protocole qu'un harnais externe négocierait), donc l'orphelin est *traité* — reconnu comme non-trou plutôt que silencieusement compté avec les manques réels.

## Ce que je n'ai pas su corriger

- **La matrice RBAC n'est pas encore exportée par `rbac.ts`** (toujours `const MATRICE` privé au 2026-08-23). `rbac-test.mjs` ne recopie plus la matrice à la main : il lit le *texte source* de `rbac.ts` et en extrait le littéral `MATRICE` par une regex tolérante à la présence ou l'absence d'`export`. Le jour où un autre agent ajoute `export`, ce fichier n'a besoin d'aucun changement. Repli explicite (avec avertissement imprimé) sur une copie figée si l'extraction échoue — jamais un échec silencieux.
- **`--version` échoue pour certains harnais joignables** (`buzz` ne supporte pas ce flag, `pi.cmd` peut expirer son délai à cause de son wrapper Python) : `joignable` reste correctement `true` (basé sur la résolution du chemin, pas sur `--version`), mais le champ `version` reste `null` dans ces cas. Honnête, pas bloquant.
- **Pas de vérification par-capacité.** Le sondage prouve qu'un binaire existe et répond, pas que chacune de ses capacités déclarées (`shell`, `file_edit`, etc.) fonctionne réellement. D'où le plafond de score plutôt qu'une fausse promesse de vérification exhaustive.
- **Le cas `voice → buzz` de l'audit original n'est plus reproductible** puisque `buzz` répond désormais réellement (disque changé) : la preuve de la garde repose sur d'autres harnais confirmés morts (`cursor`, `dsh`, `grok`), documentée ci-dessus.
