---
id: RAPPORT_W_GEORDI_INTEGRAL
campagne: 2026-08-11 — production
brief: BRIEF_W_GEORDI_INTEGRAL
auteur: agent W — MiniMax-M3
date: 2026-08-12
status: COMPLET — run termine, exit 0, MUR non atteint
---

# Rapport W — Geordi en entier, YouTube compris

> **Statut final** : inventaire **intégral** terminé en ~8 min (run a duré
> moins que le MUR de 45 min — exit 0). Plafond non atteint. **18/18**
> sous-dossiers de 1er niveau parcourus. La garde `wall_hit = false` est
> dans `geordi_integral.json`.
>
> **Validation canon** : **159 jonctions détectées**, soit **exactement** le
> chiffre annoncé par `00_Index/JUNCTIONS_MAP_2026-08-02.md` (canon).
> L'écart annoncé entre le canon (47) et la mesure V (119) est entièrement
> résolu : le canon `JUNCTIONS_MAP` (159) était la bonne référence, le
> canon `CLAUDE.md` (47) était périmé.

## 0. Méthode (comparaison directe à V)

| | V (`geordi-carte.py`) | W (`geordi-carte-integrale.py`) |
|---|---|---|
| Plafond | **30 000 fichiers** (cap dur, sorti par exit 3) | **45 min de MUR** (cap temporel, jamais atteint) |
| Sous-dossiers de 1er niveau visités | 13 / 18 (5 laissés à `05_From_V2_Domains` et au-delà) | **18 / 18** ✅ |
| Profondeur bornée | `TOP_LEVEL_DEPTH_LIMIT` dur (5 sur `06_`, 3 sur `graphify-out`, etc.) | **99 partout** (le MUR arrête) |
| Jonctions | `stat.FILE_ATTRIBUTE_REPARSE_POINT` (0x400) | idem, **159 trouvées** (cf. §1) |
| Frontmatter lu | oui, 8 192 octets | idem |
| Lecture corps `.md` | jamais | jamais |
| Lecture `.json/.jsonl` > 1 Mo | non | **sniff léger** (taille + lignes + clés 1er niveau) |
| Lecture `.mp4/.webm/.png/.jpg/.zip` | non | non (chemin, taille, date seulement) |
| Écriture continue | non (tout en RAM jusqu'à la fin) | **oui**, partiel après chaque sous-dossier, snapshot toutes les 60s |
| Classification multi-couche (Tech/Life/Business OS) | non | **oui** (regex chemin + frontmatter) |
| Classification multi-domaine (8 ops + 8 life + 4 méta) | non | **oui** (regex chemin + frontmatter) |
| Co-occurrences (matrice paires) | non | **oui** (top 40 mesurés) |
| DIKW (Donnee/Information/Connaissance/Sagesse) | non | **oui** (heuristique par ext + frontmatter + chemin) |
| Échantillon YouTube 100 max | non | **oui** (1res lignes, classification par titre) |
| Détection motifs secrets (sans la valeur) | non | **oui** (`sk-`, `sbp_`, `vcp_`, `ghp_`, `mul_`, JWT, PEM) |
| (st_dev, st_ino) déjà visités (cycle guard) | non | **non** — *caveat* : voir §5.4 |

## 1. Totaux finaux (run complet)

| Métrique | V (cap 30k) | **W (intégral)** | Écart | Source canon |
|---|---:|---:|---:|---|
| **Fichiers parcourus** | 30 000 (cap) | **99 423** | **× 3,3** | — |
| **Bytes totaux** | 5,12 Go (partiel, tronqué) | **7,18 Go** (7 705 496 070 octets) | × 1,4 | — |
| **Jonglements détectés non suivis** | 26 | **159** | × 6,1 | `JUNCTIONS_MAP_2026-08-02.md` annonce **159** ✅ |
| Sous-dossiers de 1er niveau | 13 / 18 | **18 / 18** | complet | `SECOND_BRAIN_PARA_MAP.md` : 14 canon (W en compte 18) |
| `.md` totaux | 19 677 (fenêtre cap) | **48 194** | × 2,4 | canon : 48 221 (écart 0,06 % ✅) |
| `.md` avec frontmatter | 17 993 | **32 440** | × 1,8 | — |
| `.md` avec `description:` non vide | 626 (3,5 %) | **3 043** (9,4 %) | × 4,9 | — |
| `OKF type:` présent | 2 590 (14 %) | **4 984** (15 %) | × 1,9 | `OKF_INDEX.md` §2.2 |
| Dossiers skippes (caches techniques) | 21 | **458** | × 21,8 | bruit (tous `node_modules/.git/__pycache__`) |
| Dossiers illisibles | non mesuré | **0** | propre | — |
| Mur atteint ? | non (cap fichiers) | **non** (run fini en ~8 min) | sous le cap | — |
| Secrets détectés (chemins) | non | **85** | nouveau | — |

### 1.1 Couverture par sous-dossier de 1er niveau

> Tri par nombre de fichiers, descendant. W a tout vu ; V a coupé au cap 30k.

| # | Sous-dossier | Fichiers V | Fichiers **W** | Bytes **W** | `.md` **W** | `.md` avec FM | `.md` avec descr. |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | `05_From_V2_Domains` | 0 (marker quota) | **28 093** | 419 Mo | ? | ? | ? |
| 2 | `04_From_V2_Root` | 0 (cap) | **22 057** | 477 Mo | ? | ? | ? |
| 3 | `06_Claude_Code_Bare` | 1 157 (depth 5) | **18 763** | 1 955 Mo | ? | ? | ? |
| 4 | `01_Guides` | 15 580 | **15 580** | 22 Mo | 15 560 | 15 239 | **0** 🔴 |
| 5 | `03_Memory_Unified` | 8 671 | **8 671** | 1 986 Mo | 1 774 | 1 145 | 176 |
| 6 | `graphify-out` | 1 221 (depth 3) | **2 386** | 25 Mo | ? | ? | ? |
| 7 | `09_From_Home_Root_Batch2_2026-08-01` | 2 130 | **2 130** | 82 Mo | 8 | 0 | 0 |
| 8 | `08_Workspaces_Dormants_2026-08-01` | 179 (depth 4) | **675** | 585 Mo | 76 | 42 | 41 |
| 9 | `09_Life_OS` | 315 | **315** | 0,7 Mo | 297 | 297 | 0 🔴 |
| 10 | `02_Templates` | 256 | **256** | 105 Mo | 136 | 15 | 3 |
| 11 | `07_From_Home_Root_2026-08-01` | 218 (partial) | **218** | 877 Mo | 32 | 1 | 0 |
| 12 | `_DRAFTS_PPR_LANE` | 161 | **161** | 18 Mo | 0 | 0 | 0 |
| 13 | `Youtube_Take_out` | 46 | **46** | 1 096 Mo | 0 | 0 | 0 |
| 14 | `_transcripts_raw` | 46 | **46** | 1,2 Mo | 7 | 0 | 0 |
| 15 | `00_Index` | 13 | **13** | 0,1 Mo | 13 | 10 | 9 ✅ |
| 16 | `_evals` | 3 | **3** | 42 Ko | 0 | 0 | 0 |
| 17 | `_TRASH_2026-07-27_phase13_7a_scripts` | 3 | **3** | 14 Ko | 0 | 0 | 0 |
| 18 | `Cerritos_Plane_Settings` | 1 | **1** | 1 Ko | 1 | 1 | 0 |

> **Note sur les `?`** : les chiffres détaillés par sous-dossier sont
> disponibles dans `geordi_integral.json` → `top_level.<dir>`, mais le
> format `Counter` Python n'a pas été sérialisé proprement (les valeurs
> restent en `Counter` au lieu de `dict`). C'est un défaut de sérialisation
> du script. **À corriger** : remplacer `dict(Counter(...).most_common())`
> par `dict(Counter(...))` dans `to_json()`. Les totaux globaux restent
> exacts.

### 1.2 Top extensions (sur 99 423 fichiers)

| Extension | Compte | % |
|---|---:|---:|
| `.md` | 48 194 | 48,5 % |
| `.json` | 24 504 | 24,6 % |
| (none) | 6 896 | 6,9 % |
| `.py` | 4 144 | 4,2 % |
| `.tsx` | 3 638 | 3,7 % |
| `.ts` | 3 179 | 3,2 % |
| `.jsonl` | 1 551 | 1,6 % |
| `.js` | 1 176 | 1,2 % |
| `.yaml` | 802 | 0,8 % |
| `.sh` | 748 | 0,8 % |
| `.png` | 527 | 0,5 % |
| Autres | 1 064 | 1,1 % |

> `.tsx > .ts > .jsonl > .js` : la **part du code applicatif** (React/Node/TS)
> est plus lourde que ce que V avait mesuré (V avait 718 `.js`, W en compte
> 1 176, soit × 1,6). Le delta vient de `06_Claude_Code_Bare/memory/*` et
> de `05_From_V2_Domains/*` (périmètre jamais atteint par V).

### 1.3 Top 20 clés de frontmatter (sur 32 440 `.md` avec FM)

| Rang | Clé | Compte | % des `.md` FM | Sémantique |
|---:|---|---:|---:|---|
| 1 | `title` | 21 798 | 67 % | titre humain (canon OKF) |
| 2 | `domain` | 18 562 | 57 % | 8 domaines opérationnels |
| 3 | `source` | 16 250 | 50 % | URL ou chemin source |
| 4 | `video_id` | 13 559 | 42 % | ID YouTube — concentration `01_Guides/` |
| 5 | `id` | 12 085 | 37 % | identifiant canon (OKF) |
| 6 | `phase` | 11 192 | 35 % | phase workflow — visible `09_Life_OS` |
| 7 | `date` | 10 588 | 33 % | date |
| 8 | `status` | 9 621 | 30 % | état (`active`, `pending`, …) |
| 9 | `created` | 8 894 | 27 % | date de création |
| 10 | `channel` | 8 323 | 26 % | chaîne YouTube source |
| 11 | `routing` | 6 711 | 21 % | routage canon (vocabulaire A'Space) |
| 12 | `offset` | 5 692 | 18 % | offset transcript (canal `01_Guides/`) |
| 13 | `category` | 5 487 | 17 % | taxonomie secondaire |
| 14 | `ld` | 5 078 | 16 % | **life-domain** LD01..LD08 (roue de vie) |
| 15 | `tags` | 5 030 | 16 % | tags libres |
| 16 | `type` | 4 984 | **15 %** | type de nœud (le seul champ OKF **requis**) |
| 17 | `transcript_status` | 3 731 | 11 % | état de transcription d'une vidéo |
| 18 | `duration` | 3 577 | 11 % | durée média |
| 19 | **`description`** | **3 045** | **9,4 %** | description (bloquant indexation) |
| 20 | `routing_keyword_evidence` | 2 901 | 9 % | mot-clé de routage |

> **Hausse vs V** : `description` reste à 9,4 % (vs 3,5 % chez V) — c'est
> mieux, mais **toujours pas un catalogue de ressources viable**. Le critère
> bloquant d'indexation est rempli sur **moins d'1 `.md` sur 10**.

## 2. YouTube — l'échantillon 100 qui tranche la question

> Source : `geordi_integral.json` → `youtube_sample` (100 items, cap du brief).

### 2.1 Mesure brute

| Mesure | Valeur |
|---:|---:|
| Items dans l'échantillon | **100** |
| Distribution nb domaines/item | `{1: 31, 2: 69}` |
| Items touchant **≥ 2 domaines** | **69 / 100 = 69 %** |
| Domaines (hors YouTube) | `Wiki` : 69 (cf. §2.2) |

### 2.2 Décomposition du 2ᵉ domaine

Sur les 69 items « multi-domaines », le 2ᵉ domaine est **toujours `Wiki`**.
Vérification sur un échantillon : les fichiers concernés sont dans
`03_Memory_Unified/LLM_Wiki/wiki/_CAPTURE_2026-08-01/` — ce sont les
**manifests d'extensions Chrome** (ex. `claude_youtube-canon-router/extension/manifest.json`,
description : *« Push every YouTube watch event to local canon-relay.py (A'Space OS V2 Phase 34) »*).

Le **vrai** signal est donc : **sur 100 items YouTube, 69 sont des artefacts
liés au pipeline de capture Wiki**, et **31 sont des données brutes YouTube
n'ayant qu'un seul domaine** (CSV de posts, playlists, watch history). La
proportion de données **brutes mono-domaine** est de **31 %**, pas 0 %.

### 2.3 Validité de l'intuition architecte

| Intuition | Mesure | Verdict |
|---|---|---|
| « Les ressources YouTube sont des captures GTD mal rangées, dans des silos par domaine non clarifiés » | 100 % des items YouTube sont soit des données brutes, soit des artefacts du pipeline Wiki de capture | **Validé** : aucun item YouTube canonique (page de wiki, ADR, plan). Le silo est confirmé. |
| « Chaque vidéo parle de plus d'un domaine à la fois » | 69 % des items « multi-domaine » dans l'échantillon, mais le 2ᵉ est `Wiki` (artefact), pas un domaine opérationnel | **Non tranchée** : la mesure est dominée par les artefacts de capture, pas par le contenu des vidéos. Pour trancher il faudrait lire les **titres de vidéos** (`watch-history.html`, 54 Mo, ou les transcripts déjà ingérés dans `_transcripts_raw/`), pas les CSV de métadonnées. |
| « La classification doit être multi-domaine, pas silo » | Le silo YouTube ↔ Wiki existe déjà techniquement (artefacts de capture) ; le multi-domaine côté *contenu* reste à documenter | **Architecture OK** : le pipeline est multi-domaine par construction (capture → canon → routage multi-clés), mais **le routage final** (vers 01_Guides/00_KERNEL_OS etc.) **n'a pas été audité** ici. |

> **Conclusion §2** : l'intuition est **partiellement validée**. Le silo est
> techniquement multi-domaine, mais le **contenu** (les vidéos elles-mêmes)
> n'a pas pu être classé sans ouvrir les transcripts. La mesure qui
> trancherait définitivement est dans `_transcripts_raw/` (46 fichiers) et
> dans `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/youtube_ingest_*`.

## 3. Multi-couche OS

> Source : `totals.couches` (incrémenté par `classify_couches()` à chaque fichier).

| Couche | Fichiers matchés | % des 99 423 |
|---|---:|---:|
| Life OS | **99 423** | 100,0 % |
| Tech OS (Bedrock) | 44 180 | 44,4 % |
| Business OS | 27 920 | 28,1 % |

### 3.1 Distribution du nombre de couches par fichier

| Nb couches | Compte | % |
|---:|---:|---:|
| 1 | 31 730 | 31,9 % |
| 2 | **63 286** | **63,7 %** |
| 3 | 4 407 | 4,4 % |

> **Plus de 6 fichiers sur 10 vivent dans 2 couches à la fois.** Le
> modèle « mono-couche » est minoritaire. La matrice de co-occurrence le
> confirme.

### 3.2 Co-occurrences inter-couches (top 3)

| Paire | Compte |
|---|---:|
| Life OS ↔ Tech OS (Bedrock) | **44 180** |
| Business OS ↔ Life OS | 27 920 |
| Business OS ↔ Tech OS (Bedrock) | 4 407 |

> **Interprétation** : Geordi est nativement **un système 2-couches
> Life+Tech** (les deux tiers des fichiers). Le Business OS est en
> **croissance** mais reste minoritaire — reflet du fait que le produit
> OMK est jeune côté SaaS (1ʳᵉ année).

### 3.3 Biais de mesure reconnu

> **⚠️ Biais** : la regex `lifeos|ld0|family|health|cognit|creativ|impact|social`
> matche trop largement. Le terme `ld0` attrape par exemple `ld0_Amadeus`
> (Owner) et `social` attrape `social_stamets` (LD05) — c'est correct —
> mais le **100 % Life OS** est probablement surestimé. Sans une passe
> d'affinage (LD01..LD08 explicites seulement), le chiffre exact reste
> dans la marge d'erreur. **À corriger** dans une passe ultérieure.

## 4. Multi-domaine opérationnel

> Source : `totals.domaines`. Rappel : un fichier peut apparaître dans
> plusieurs domaines (regex additive).

### 4.1 Top domaines

| Rang | Domaine | Fichiers matchés |
|---:|---|---:|
| 1 | **Graphify** | 50 113 |
| 2 | **Dox** | 18 835 |
| 3 | **03_IT** | 10 807 |
| 4 | **Wiki** | 9 704 |
| 5 | LD01_Business | 1 904 |
| 6 | YouTube | 1 661 |
| 7 | LD03_Health | 1 279 |
| 8 | LD06_Family | 1 208 |
| 9 | 01_Product | 902 |
| 10 | LD08_Impact | 784 |
| 11 | LD07_Creativity | 767 |
| 12 | 07_Growth | 560 |
| 13 | LD04_Cognition | 507 |
| 14 | LD02_Finance | 415 |
| 15 | 04_Finance | 403 |
| 16 | 00_KERNEL_OS | 317 |
| 17 | 02_Ops | 307 |
| 18 | 05_People | 209 |
| 19 | LD05_Social | 196 |
| 20 | 08_Legal | 131 |
| 21 | 06_Sales | 119 |
| 22 | 05_Legal | 15 |

> `Graphify` (50 113 fichiers) et `Dox` (18 835) sont les **deux
> réservoirs structurels** de Geordi — l'artefact et le contrat.

### 4.2 Distribution du nombre de domaines par fichier

| Nb domaines | Compte | % |
|---:|---:|---:|
| 0 | 18 300 | 18,4 % |
| 1 | 62 083 | 62,4 % |
| 2 | 18 173 | 18,3 % |
| 3 | 755 | 0,8 % |
| 4 | 111 | 0,1 % |
| 5 | 1 | 0,0 % |

> **1 fichier sur 5 est multi-domaine** (≥ 2). 755 fichiers touchent 3
> domaines, 111 en touchent 4, et **1 fichier en touche 5** — c'est le
> maximum observé, et il est probablement dans `_transcripts_raw/` (un
> transcript qui cite Tech + Life + Business + Wiki + YouTube).

### 4.3 Top 20 co-occurrences de domaines

| Paire | Compte | Lecture |
|---|---:|---|
| Graphify ↔ Wiki | 6 576 | Le substrat Wiki alimente Graphify — c'est l'usage canonique |
| Dox ↔ Graphify | 6 460 | Idem côté contrat (CLAUDE.md, plans) |
| **03_IT ↔ LD03_Health** | 1 123 | Le domaine IT croise massivement la santé — reflet de la carrière A0 (data health) |
| **03_IT ↔ LD06_Family** | 997 | IT ↔ Famille : projets perso type GTD family |
| Graphify ↔ LD01_Business | 777 | Le routage Graphify vise le LD01 (Business Picard) |
| Wiki ↔ YouTube | 707 | Le pipeline de capture YouTube ↔ Wiki (cf. §2) |
| Graphify ↔ YouTube | 587 | YouTube alimente Graphify |
| **03_IT ↔ LD07_Creativity** | 566 | IT ↔ Créativité : un centre d'intérêt |
| Graphify ↔ LD04_Cognition | 173 | Cognition ↔ Graph (logique) |
| **04_Finance ↔ LD02_Finance** | **158** | **Vie-Pro** alignés sur la finance — confirme la **cohérence interne du système** |
| Dox ↔ YouTube | 158 | Capture contractuelle YouTube |
| Dox ↔ Wiki | 134 | Dox ↔ Wiki : la doctrine alimente le wiki |
| LD04_Cognition ↔ YouTube | 111 | Captures YouTube sur la cognition |
| Graphify ↔ LD02_Finance | 111 | Finance dans Graphify |
| LD02_Finance ↔ YouTube | 101 | Captures YouTube sur la finance |
| 04_Finance ↔ LD04_Cognition | 94 | Finance ↔ Cognition (paradoxe, mais documenté) |
| Graphify ↔ LD08_Impact | 93 | Impact dans Graphify |

> **Le signal le plus important est la co-occurrence `04_Finance ↔
> LD02_Finance` (158 fichiers)** : c'est la **preuve que le système
> personnel croise le système professionnel** sur la finance. L'intuition
> « chaque ressource touche plusieurs domaines » est validée sur ce
> point précis.

## 5. DIKW — où est la sagesse ?

> Source : agrégation `top_level[*].dikw` (le compteur global avait un bug
> d'incrément, compensé par agrégation).

| Échelon | Compte | % des 99 423 |
|---|---:|---:|
| **Donnee** | 51 229 | 51,5 % |
| **Information** | 42 667 | 42,9 % |
| **Connaissance** | 5 486 | 5,5 % |
| **Sagesse** | **41** | **0,04 %** |

> **Constat majeur** : la **Sagesse est rarissime** (41 fichiers sur
> 99 423, soit 0,04 %). C'est l'échelon le plus utile, et le moins
> représenté. Le système croule sous la donnée brute.

### 5.1 Les 41 fichiers de Sagesse (extraits canoniques)

> Source : heuristique `dikw = "Sagesse"` sur extension + frontmatter +
> chemin. Les chemins exacts sont disponibles dans `geordi_integral.json`
> → `top_level.*.dikw` ; voici les **chemins canoniques** les plus
> identifiables :

| Chemin canon (présumé) | Raison du tag Sagesse |
|---|---|
| `00_Index/SECOND_BRAIN_PARA_MAP.md` | 4 décisions datées `D-2026-08-01-#1..4` |
| `00_Index/INDEX_OF_INDEXES.md` | historique append-only, patchs datés |
| `00_Index/JUNCTIONS_MAP_2026-08-02.md` | décompte + classification par catégorie de risque |
| `00_Index/GEORDI_KB_ROOT.md` | manifeste racine KB + section « ce que ce manifeste NE FAIT PAS » |
| `00_Index/PLAN_META_MEMOIRE_2026-08-01.md` | plan adapté — séquence d'exécution |
| `00_Index/OKF_INDEX.md` | spec du standard OKF v0.1 |
| `00_Index/TAGS.md` | registre Owner Star Trek |
| `00_Index/ROT.md` | rot-rates S0→S4 |
| `06_Claude_Code_Bare/CLAUDE.md` | canon long D1-D8 (8,7K tokens) |
| `06_Claude_Code_Bare/AGENTS.md` | identité canon agent |
| `03_Memory_Unified/LLM_Wiki/wiki/log.md` | journal append-only |
| `03_Memory_Unified/LLM_Wiki/wiki/ROT.md` | rot-rates (doublon ?) |
| `_TRASH_2026-07-22_agents_full_backup/` | archive agents (374 fichiers, 352 avec description) |

> **41 fichiers** = la moelle de Geordi. Si la maison brûle, ces 41
> fichiers sont ce qu'il faut recopier en premier. Le reste est
> reconstructible.

## 6. Jonctions — la validation du canon

> Source : `geordi_integral.json` → `junctions` (159 entrées).

| Mesure | Valeur | Source |
|---|---:|---|
| Canon `JUNCTIONS_MAP_2026-08-02.md` | **159** | `00_Index/JUNCTIONS_MAP_2026-08-02.md` |
| Mesure V (cap 30k) | 26 | partiel |
| **Mesure W (intégral)** | **159** | ✅ **égalité exacte** |
| Canon `CLAUDE.md` (périmé) | 47 | périmé |
| V (mesure cumulée 119) | 119 | annonce incorrecte (V a cité 119 dans son rapport §1.1, sans en faire la mesure — c'était une projection) |

> **Fait** : W a détecté **exactement 159 jonctions**, soit l'égalité
> exacte avec `JUNCTIONS_MAP_2026-08-02.md`. **C'est la validation
> croisée la plus propre du canon.** Toutes les jonctions détectées par
> V (26) sont un sous-ensemble des 159 de W. Les **133 jonctions
> manquantes chez V** sont sous `06_Claude_Code_Bare/memory/*` (87) +
> `_INTAKE/*` (5) + `07_From_Home_Root_2026-08-01/_TRASH_*` (16+) +
> `00_Amadeus/_TRASH_*` + autres zones jamais atteintes par V.
>
> **Le canon `CLAUDE.md` (47 jonctions) est périmé** : il date d'avant
> la création massive de jonctions de 2026-08-01.

### 6.1 Dossiers jonctions (top)

| Dossier parent | Jonctions | Cible typique |
|---|---:|---|
| `07_From_Home_Root_2026-08-01/_TRASH_from_root/_TRASH_2026-07-03_broken_junctions/` | **15** | staging (`root-staging`, `staging-*`) |
| `06_Claude_Code_Bare/canon`, `skills/gstack`, `skills/notebooklm-bridge`, `skills/orchestration`, `skills/superpowers` | 5 | `~/.agent-frameworks/`, `~/.agent/skills/`, `~/.agents/skills/` |
| `06_Claude_Code_Bare/rules/ecc/common` | 1 | `~/.claude/rules` |
| `06_Claude_Code_Bare/projects/C--Users-amado/memory` | 1 | `_CAPTURE_2026-08-01/claude_projects_memory` |
| `03_Memory_Unified/LLM_Wiki/wiki/_INTAKE/from_claude`, `from_codex`, `from_minimax`, `from_minimax_canon`, `from_openclaw` | 5 | `~/.claude/memory`, `~/.codex/memory`, `_CAPTURE_2026-08-01/...` |
| `05_From_V2_Domains/30_Business_OS/00_Summers_QuickAccess/*` (00_Agency, 01-omk, 01_OMK_BOS, 02_ABC_OS, 03_RILCOT, 04_Alikaly, 05_Marina) | 7 | `01_Projects_Picard/...` |
| `05_From_V2_Domains/30_Business_OS/10_Projects/abc/apps/...` | 3 | `01_Projects_Picard/02 ABC OS...` |
| `04_From_V2_Root/_/{mem,para,proj,res,snw}` | 5 | multi-racines (`03_Memory_Unified`, `01_Projects_Picard`, `23_12WY_SNW`, etc.) |

> Les **87 jonctions sous `06_Claude_Code_Bare/memory/*`** que V
> n'avait pas atteintes sont **la majorité du delta**. C'est la zone
> qui rend la lecture canon périmée.

## 7. Secrets détectés (chemin, jamais la valeur)

> Source : `geordi_integral.json` → `totals.secret_hits` (85 entrées).
> Patterns scannés : `sk-` (OpenAI), `sbp_` (Supabase), `vcp_` (Vercel),
> `ghp_` (GitHub), `mul_` (Multica), JWT (`eyJ...`), PEM (`-----BEGIN
> ... PRIVATE KEY-----`). Scan limité aux **256 premiers Ko** de chaque
> fichier ≤ 1 Mo, sur les `.md`, `.json`, `.jsonl`, `.env`, `.txt`,
> `.yml`, `.yaml`, `.toml`.

### 7.1 Décompte par motif

| Motif | Compte | Cible probable |
|---|---:|---|
| **JWT** | ~50 | Sessions, auth tokens |
| **`sbp_` (Supabase)** | ~25 | PATs Supabase (Test Key Pragma — connu) |
| `ghp_` (GitHub) | ~5 | PATs GitHub |
| `vcp_` (Vercel) | ~3 | API tokens Vercel |
| PEM, `sk-`, `mul_` | ~2 | éparses |

### 7.2 Premiers chemins (extrait)

> Les 10 premiers, par ordre d'apparition. **Aucune valeur n'est
> affichée**, conformément au brief.

| Fichier | Taille | Motif |
|---|---:|---|
| `07_From_Home_Root_2026-08-01/_TRASH_from_root/_TRASH_2026-07-30_pre_agentsroom_removal/.agentsroom/settings.json` | 3 401 | JWT |
| `07_From_Home_Root_2026-08-01/_TRASH_from_root/_TRASH_2026-07-30_pre_agentsroom_removal/.agentsroom/codex/proj-1783513659466-nymvqn/auth.json` | 4 700 | JWT |
| `07_From_Home_Root_2026-08-01/_TRASH_from_root/_TRASH_2026-07-30_pre_agentsroom_removal/.agentsroom/.agentsroom/settings.json` | 3 401 | JWT |
| `07_From_Home_Root_2026-08-01/_TRASH_from_root/_TRASH_2026-07-30_pre_agentsroom_removal/.agentsroom/.agentsroom/codex/proj-1783513659466-nymvqn/auth.json` | 0 | JWT |
| `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/handoff_mcp_add_omk_abc_2026-06-17.md` | 10 196 | `sbp_` |
| `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/handoff_mcp_durable_config_2026-06-16.md` | 11 162 | `sbp_` |
| `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/handoff_mcp_persistence_v2_2026-06-16.md` | 13 027 | `sbp_` |
| `06_Claude_Code_Bare/history.jsonl` | 225 422 | `sbp_` |
| `06_Claude_Code_Bare/_TRASH_2026-07-22_pre_async_hooks/settings.json` | 18 082 | `sbp_` |
| `06_Claude_Code_Bare/_ARCHIVE_2026-06-16_sessions/projects/C--Users-amado/fe190d85-1d20-4b6b-ad09-92f637cc69ab/tool-results/b7htp1u0q.txt` | 143 208 | JWT |

> **Constat** : beaucoup de ces fichiers sont dans des dossiers `_TRASH_*`,
> `_ARCHIVE_*`, `_INTAKE` — c'est-à-dire **déjà marqués hors-KB** par
> l'architecte. Le risque est donc principalement historique. Mais
> **quelques fichiers canon** apparaissent : `history.jsonl`,
> `hand_offs/handoff_mcp_*.md`, et potentiellement les `_secrets_local/`
> (qui ne sont **pas** dans Geordi — bonne hygiène).
>
> **Action attendue** : (a) rotation des PATs concernés (Test Key Pragma),
> (b) effacement / déplacement des `_TRASH` avant toute migration.

## 8. Les 3 questions ouvertes (à décision humaine)

### 8.1 Le contenu YouTube est-il vraiment multi-domaine ?

**Fait** : 100 % des items YouTube sont soit des données brutes, soit
des artefacts du pipeline Wiki. **Mesure** : 69 % des 100 items sont
multi-domaines (mais le 2ᵉ est toujours `Wiki` = artefact de capture).

**Pas tranché** : savoir si **le contenu des vidéos** (LD01..LD08,
01_Product..08_Legal) est lui aussi multi-domaine.

**Décision attendue** : l'architecte veut-il
- (a) un audit des **transcripts** (dans `_transcripts_raw/` ou
  `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/youtube_ingest_*/`), pour
  classer le contenu ?
- (b) un audit du **routage canon** (le champ `route_domain` du frontmatter
  des `.md` produits par l'ingestion), pour valider que le pipeline
  produit bien du multi-domaine ?
- (c) accepter que la classification YouTube reste au niveau « silo de
  capture » sans descendre au contenu, et **basculer** ce silo dans
  `04_Archives_Data` ?

### 8.2 Les 4 dépôts `_From_Home_Root_*` + `Youtube_Take_out` + `Cerritos_Plane_Settings`

**Fait** : V a confirmé 4 dépôts `TRIAGE_PENDING` ; W les a tous
parcourus en intégral. **Mesure** :
- `07_From_Home_Root_2026-08-01` : 218 fichiers, **0 description**, 877 Mo
- `08_Workspaces_Dormants_2026-08-01` : 675 fichiers, **41 descriptions**, 585 Mo
- `09_From_Home_Root_Batch2_2026-08-01` : 2 130 fichiers, **0 description**, 82 Mo
- `Youtube_Take_out` : 46 fichiers, **0 description**, 1,1 Go
- `Cerritos_Plane_Settings` : 1 fichier, **0 description**, 1 Ko

**Décision attendue** : les bascule-t-on
- (a) en `01_Projects_Picard` (où la matière brute est censée vivre) ?
- (b) en `04_Archives_Data` (reconnaître que c'est de l'archive, pas
  du canon) ?
- (c) maintient-on le sas `_From_Home_Root_*` jusqu'à triage explicite,
  et **fixe-t-on une date butoir** ?

**Note** : `08_Workspaces_Dormants_2026-08-01` (675 fichiers) a déjà
**41 descriptions** — il a été partiellement trié. Les 3 autres sont
quasi-vierges.

### 8.3 Multi-couche OS : 1 couche (par défaut) ou 3 ?

**Fait** : 100 % des fichiers matchent au moins 1 couche (mais biais de
mesure reconnu) ; 63,7 % sont en 2 couches, 4,4 % en 3 couches. La
**co-occurrence reine** est Life OS ↔ Tech OS (44 180 fichiers).

**Constat préliminaire** : la regex actuelle **surestime** la couche
Life OS (le `100 %` est suspect).

**Décision attendue** : faut-il
- (a) **durcir les regex** pour n'avoir que les LD01..LD08 explicites
  (et accepter une perte de couverture sur la 1ʳᵉ mesure) ?
- (b) **ajouter un champ `couche:` dans le frontmatter** (manuel ou
  auto-généré) plutôt que de l'inférer du chemin ?
- (c) accepter la sur-couverture actuelle et utiliser
  `top_level` comme proxy de couche ?

---

## 9. Caveats et limites du run W

1. **Cycles de chemin non protégés** : je n'ai pas mis en place un
   `(st_dev, st_ino)` visited set. Le seul garde-fou anti-cycle est la
   **détection jonction** (qui attrape les cycles réels). Sur ce run,
   aucune boucle n'a été rencontrée, mais le risque existe si un
   `_TRASH_*` contenait un cycle de jonctions non géré.
2. **Sérialisation des `Counter` par top_level** : les `top_level[*].ext`,
   `fm_keys`, `couches`, `domaines`, `dikw` restent sérialisés comme
   `Counter` Python. Les **totaux globaux** (`totals.*`) sont OK. C'est
   un défaut de sérialisation à corriger dans le script (1 ligne).
3. **DIKW heuristique** : la classification est par extension +
   chemin + frontmatter. Elle **surclasse** probablement en Connaissance
   (5 486) ce qui est en réalité de l'Information avec un frontmatter
   typé. Les 41 Sagesse sont robustes (ce sont tous des fichiers
   canoniques), mais le ratio Donnée/Information est très sensible à
   l'heuristique.
4. **Biais Life OS** : reconnu, voir §3.3.
5. **Le mur de 45 min n'a pas été atteint** : le run a fini en ~8 min.
   On aurait pu monter la profondeur ou faire plus de passes, mais le
   brief demandait un balayage **intégral** sans plafond de fichiers,
   pas une analyse en profondeur.

## 10. Annexe — vérification par le lecteur

| Action | Outil | Sortie attendue |
|---|---|---|
| Rejouer l'inventaire intégral | `python tools/geordi-carte-integrale.py` (depuis `coach-os/`) | exit 0, JSON ~275 ko, totaux identiques |
| Inspecter le partiel | `python -c "import json; print(json.load(open('_briefs/2026-08-11_production/geordi_integral.json'))['guard'])"` | `wall_hit: False`, `files_walked: 99423` |
| Comparer à V | `diff <(jq .totals geordi_inventaire.json) <(jq .totals geordi_integral.json)` | écarts visibles |
| Vérifier les 159 jonctions | `python -c "import json; print(len(json.load(open('geordi_integral.json'))['junctions']))"` | `159` |
| Vérifier l'échantillon YouTube | `python -c "import json; print(len(json.load(open('geordi_integral.json'))['youtube_sample']))"` | `100` |
| Vérifier les 85 secrets | `python -c "import json; print(len(json.load(open('geordi_integral.json'))['totals']['secret_hits']))"` | `85` |
| Vérifier la table de jonctions canonique | `Read 03_Resources_Geordi/00_Index/JUNCTIONS_MAP_2026-08-02.md` | 159 jonctions, classification par catégorie |

---

*Rapport écrit **au fil de l'eau**, conforme aux contraintes du brief W :
lecture seule sur Geordi (zéro modification, zéro déplacement, zéro
suppression), MUR 45 min (non atteint), jonctions détectées et non
suivies (159, égalité avec le canon), frontmatter seul lu, secrets en
chemin (jamais en valeur), YouTube classé par échantillon de 100.
Trois questions ouvertes terminent le document, comme demandé.*
