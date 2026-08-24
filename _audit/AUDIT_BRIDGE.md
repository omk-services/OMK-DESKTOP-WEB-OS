# Audit — Bridge et agnosticité de harnais

**Couverture : 5 fichiers lus (`bridge.mjs`, `adapters.mjs`, `harnesses.json`, `surfaces.json`, `rbac-test.mjs`), ~28 commandes exécutées** (2 autotests, 3 vues, 5 `--route`/`--voie` réels, 3 vérifications de binaires par harnais réel, une copie du registre modifiée dans `%TEMP%\bridge_audit\` pour 2 scénarios de scoring, 4 recherches disque pour les cibles desktop).

## Verdict global

La substituabilité est **partiellement déclarative** : le mécanisme de routage (filtrage par capacité, refus explicite, pas de repli silencieux) est solide et honnête sur son propre fonctionnement, mais le registre qu'il consulte ment dans les deux sens — 10 des 14 harnais non `mesure` ont une cible introuvable sur ce poste, et à l'inverse 2 harnais classés `declare` (`ori`, `pi`) fonctionnent réellement et auraient dû être `mesure`. Un routeur qui élit `hermes-agent` ou `buzz` pour un besoin `voice`/`webhook` élit un harnais qui ne répondra jamais.

## Les 18 harnais, à l'épreuve du disque

| Harnais | Statut déclaré | Cible | Existe ? | Verdict |
|---|---|---|---|---|
| claude-code | mesure | `C:/Users/amado/AppData/Roaming/npm/claude` | OUI — `2.1.143 (Claude Code)` | Honnête |
| codex | mesure | `codex` | OUI — `codex-cli 0.130.0-alpha.5` | Honnête |
| openclaw | mesure | `openclaw` | OUI — `OpenClaw 2026.5.18 (50a2481)` | Honnête |
| multica | mesure | `https://api.multica.ai` | OUI — hôte répond (404 sur `/`, endpoint racine non testé, mais service vivant) | Honnête |
| ori | **declare** | `ori` | **OUI et fonctionnel** — `ori.cmd → wsl.exe -d Ubuntu-24.04 → /home/amdkn7/.local/bin/ori`, `{"ok":true,"version":"0.10.0+3c670be"}` | **Sous-classé** : devrait être `mesure` |
| pi | **declare** | `pi` | **OUI et fonctionnel** — `0.84.2` | **Sous-classé** : devrait être `mesure` |
| hermes-agent | declare | `Hermes Desktop Native` | INTROUVABLE — aucune trace sur disque, et la « cible » n'est même pas un chemin ou un identifiant invocable, juste une étiquette | **Critique** — cible non exécutable par construction |
| antigravity | declare | `antigravity` | PARTIEL — seul `AppData/Local/antigravity/staging` existe (reste d'updater), pas d'exécutable confirmé sur PATH | Suspect |
| cursor | declare | `cursor` | INTROUVABLE (aucun `cursor.exe` sur le disque) | Critique |
| open-code | declare | `opencode` | INTROUVABLE — mais le JSON l'avoue lui-même (`"Non installe au 2026-08-21"`) | Honnête sur l'absence, statut non dégradé pour autant |
| buzz | declare | `.buzz` | INTROUVABLE | Critique |
| dsh | declare | `dsh` | INTROUVABLE | Critique |
| j-code | suppose | `jcode` | INTROUVABLE | Cohérent avec le statut |
| d-code | suppose | `dcode` | INTROUVABLE | Cohérent avec le statut |
| paperclip | suppose | `paperclip` | INTROUVABLE | Cohérent avec le statut |
| grok | suppose | `grok` | INTROUVABLE | Cohérent avec le statut |
| prime-agent | suppose | `prime-agent` (sdk) | Non testable en CLI (type sdk) | Cohérent, non vérifiable par binaire |
| openbot | suppose | `openbot` (http) | Pas une URL réelle, non testable | Cohérent |

**Bilan chiffré** : 4 `mesure` (tous réels) · 8 `declare` (2 réels et fonctionnels mal classés en dessous de leur mérite, 5 introuvables, 1 suspect) · 6 `suppose` (tous introuvables ou non testables, cohérents avec leur statut). **10 harnais sur 18 ont une cible absente du disque**, dont 8 portent un statut (`declare`) qui suggère une confiance supérieure à `suppose`.

## Le routeur peut-il élire un harnais mort ?

Oui, démontré sur le registre réel, sans modification :

```
$ node bridge.mjs --route '{"besoins":["voice"]}'
elu    : buzz (statut=declare, 2 capacites)
via    : desktop -> .buzz
replis : aucun
```

`.buzz` n'existe nulle part sur le disque (recherche `find` vide). Un travail qui déclare `besoins: ["voice"]` reçoit une élection sans repli — le routeur n'a **aucune vérification d'existence de cible**, contrairement à ce que suggère le confort de son autotest.

```
$ node bridge.mjs --route '{"besoins":["tool_call","webhook"]}'
elu    : hermes-agent (statut=declare, 3 capacites)
via    : desktop -> Hermes Desktop Native
replis : openbot
```

Ici il y a un repli (`openbot`), mais `openbot` est lui-même `suppose` avec une cible `"openbot"` qui n'est pas une URL valide — le repli ne sauve rien.

À l'inverse, un cas positif : `node bridge.mjs --route '{"besoins":["file_edit","shell"],"interdits":["claude-code","codex","openclaw"]}'` élit `ori`, qui **fonctionne réellement** (vérifié ci-dessus) — preuve que le mécanisme de routage marche quand le registre est honnête. Le défaut n'est donc pas dans `router()`, mais dans l'absence totale de contrôle entre le JSON et la réalité du disque.

## Failles du scoring

Le score est `POIDS_STATUT[statut] * 10 + nb_capacites`, avec `POIDS_STATUT = {mesure:3, declare:2, suppose:1}` (`bridge.mjs:34,58`) et 11 capacités canoniques possibles (`harnesses.json:18-30`).

**Un `suppose` ne peut jamais battre un `mesure`** dans l'état actuel du vocabulaire : l'écart de poids entre `mesure` et `suppose` est `(3-1)*10 = 20` points, et le maximum de capacités qu'un harnais peut légitimement déclarer est 11 — l'avantage maximal qu'un `suppose` peut gratter est donc de 11 points. 20 > 11 : mathématiquement borné, tant que le vocabulaire canonique ne dépasse pas ~20 capacités.

**Mais un `suppose` ou `declare` PEUT ÉGALER, voire dépasser en pratique un `mesure` mal renseigné.** Démonstration, registre copié dans `%TEMP%\bridge_audit\harnesses.json` (jamais dans le dépôt) avec deux entrées fictives ajoutées : un `mesure` à 1 seule capacité et un `declare` à 11 capacités :

```
--- besoin = file_edit ---
claude-code          mesure   score=36 caps=6
codex                mesure   score=34 caps=4
openclaw             mesure   score=33 caps=3
mesure-mince         mesure   score=31 caps=1   <- fictif, cible inexistante
declare-charge       declare  score=31 caps=11  <- fictif, jamais mesuré
```

`mesure-mince` (cible `mesure-mince-binaire-inexistant`, jamais vérifiée pour de vrai) **égale exactement** `declare-charge` (jamais mesuré non plus, mais qui revendique toutes les capacités du vocabulaire). L'ordre final ne dépend alors que de la position dans le tableau JSON (tri stable de V8) — c'est-à-dire de qui a été ajouté en premier, pas de qui a été vérifié. Un descripteur optimiste qui coche toutes les capacités approche systématiquement le score d'un harnais mesuré à faible surface fonctionnelle.

**Rien ne vérifie que les capacités déclarées sont vraies.** `bridge.mjs` autotest vérifie seulement que chaque capacité citée appartient au vocabulaire canonique (`toute capacite declaree est canonique`, ligne 124-125) — jamais qu'elle correspond à un comportement réel. Un harnais fictif peut déclarer les 11 capacités et l'autotest passe sans notification (confirmé : le registre modifié dans `%TEMP%` continue de charger sans erreur). Il n'existe aucune garde de type "capacité prouvée par un test d'invocation".

## Les trous de surface

`adapters.mjs --trous` sur le registre réel :

```
produites non lues : webmcp, agui, a2ui, ucp, a2p, acp-ibm, agp, tap, oap, rdf-agent, tdf, fcp
lues non produites : aucune
ni un ni l autre    : agentos
```

C'est **12 surfaces** produites par un adaptateur mais lues par aucun harnais du registre actuel — pas 11 comme énoncé dans le brief (à corriger : le compte exact est 12, plus `agentos` qui n'est ni produite ni lue par personne, soit 13 surfaces sur 17 sans consommateur).

Argument pour "investissement, pas code mort" : deux de ces surfaces ont un statut `mesure` côté protocole (`acp` — mesuré, lu par `cursor` et `open-code`, deux harnais... eux-mêmes non installés — et `rdf-agent`, mesuré côté fichier Turtle du dépôt mais sans harnais qui la consomme). La plupart des 12 (`a2p`, `a2ui`, `ucp`, `acp-ibm`, `agp`, `tap`, `oap`, `tdf`, `fcp`) sont déclarées `suppose` ou `declare` côté `surfaces.json` — c'est-à-dire que le bridge documente des protocoles qu'aucun harnais présent n'a besoin de parler pour l'instant.

Argument pour "code mort en germe" : aucun ticket, aucune date, aucun harnais candidat n'est nommé nulle part comme devant un jour consommer ces surfaces. `a2p` porte un veto explicite (paiement) qui justifie sa présence anticipée pour des raisons de sûreté plutôt que d'usage — c'est le seul cas où l'anticipation est clairement motivée dans le texte (`surfaces.json:128`, `SURFACE SOUS VETO`). Les 11 autres n'ont pas cette justification écrite ; elles ressemblent à un catalogue de protocoles émergents suivis par veille plutôt qu'à une roadmap engagée.

**Conclusion sur les trous** : ni pur investissement ni pur code mort — plutôt une veille technologique déguisée en registre actif, sans distinction entre "protocole qu'on suit" et "protocole qu'on va câbler".

## `resoudreVoie` et `producteurs[0]`

`adapters.mjs:88-89` : `adaptateur: producteurs[0].id` — le premier élément du tableau filtré. Le filtre (`ADAPTATEURS.filter(a => communes.includes(a.surface) && a.sens !== 'interne')`, ligne 72-74) préserve l'ordre de déclaration du tableau `ADAPTATEURS` (lignes 34-57 de `adapters.mjs`). Pour la surface `mcp`, l'ordre est `mcp, webmcp, mcp-apps, mcp-schema, ...` — donc les producteurs de `mcp` retenus dans cet ordre sont `mcp, mcp-apps, harness, skill` (confirmé par `--voies`).

C'est un **accident de déclaration**, pas un choix documenté : rien dans le code ou les commentaires n'explique pourquoi l'adaptateur `mcp` (générique, serveur MCP standard) doit primer sur `harness` (génération de fichiers d'extension) ou `skill` (compétences installables) quand les trois produisent la même surface. Aucun champ de priorité n'existe dans le schéma `ADAPTATEURS`. Réordonner le tableau changerait silencieusement quel adaptateur "gagne" pour chaque harnais, sans qu'aucun test ne le détecte (l'autotest ne teste que `v1.ok && !!v1.adaptateur`, jamais lequel).

## Ce qui tient

- **Aucun repli silencieux** : `router()` refuse explicitement avec diagnostic (`bridge.mjs:62-73`) plutôt que de retomber sur un défaut — vérifié en conditions réelles avec `besoins:["vision"]`, qui échoue proprement (`vision: 0 harnais`) au lieu d'élire n'importe quoi.
- **Agnosticité du code du routeur** : `router.toString()` ne contient aucun identifiant de harnais en dur (`bridge.mjs:152-153`, vérifié par l'autotest, confirmé à la lecture — le filtrage se fait uniquement par capacités/surfaces/interdits).
- **Le veto de paiement est réellement câblé dans le texte**, pas seulement dans le nom : `surfaces.json:128` porte la chaîne `VETO` que l'autotest vérifie littéralement par regex (`bridge.mjs:157`).
- **Quand le registre est honnête, le routage marche** : le cas `ori` (déclaré `declare` mais réellement fonctionnel, chaîne d'invocation `.cmd → wsl.exe → binaire Linux` vérifiée de bout en bout) prouve que la mécanique de sélection + invocation n'est pas le problème — c'est l'absence de contrôle entre le JSON et le disque qui l'est.
- **`open-code` est le seul harnais `declare` dont l'absence est admise dans sa propre note** (`"Non installe au 2026-08-21 (omniroute status)"`) — un exemple isolé de transparence qui n'a pas été généralisé au reste du registre.

## Questions ouvertes

1. Pourquoi `ori` et `pi`, vérifiablement fonctionnels sur ce poste (versions obtenues en une commande), restent-ils classés `declare` plutôt que `mesure` ? Le champ `mesure_le` existe déjà — rien n'empêche de le renseigner.
2. Qui décide qu'un harnais passe de `declare`/`suppose` à `mesure` ? Aucun script d'audit automatique (`command -v` + horodatage) n'accompagne le registre — la mesure semble être un geste manuel non outillé, donc sujet à l'oubli constaté ci-dessus.
3. `hermes-agent` porte une cible (`"Hermes Desktop Native"`) qui n'a jamais pu être un chemin invocable — a-t-elle été posée comme placeholder en attendant une vraie mesure, ou est-ce un oubli qui traîne depuis la création de l'entrée ?
4. Faut-il un score composite qui pénalise davantage l'absence de vérification que ne le fait l'addition de capacités déclarées ? La démonstration ci-dessus montre qu'un simple `declare` à 11 capacités peut égaler un `mesure` à 1 capacité — l'écart de 10 points par palier de statut n'est pas assez large face à un vocabulaire de 11 capacités.
5. Le compte "11 surfaces sans lecteur" cité comme fait acquis ne correspond pas au calcul réel (12, plus `agentos` orpheline des deux côtés) — d'où vient le chiffre 11, et le registre `surfaces.json` a-t-il été modifié depuis ce calcul ?
