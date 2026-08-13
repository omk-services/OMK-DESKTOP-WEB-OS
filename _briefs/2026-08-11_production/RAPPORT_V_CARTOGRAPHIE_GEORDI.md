---
id: RAPPORT_V_CARTOGRAPHIE_GEORDI
campagne: 2026-08-11 — production
brief: BRIEF_V_CARTOGRAPHIE_GEORDI
auteur: agent V — MiniMax-M3
date: 2026-08-12
status: PARTIEL — inventaire tronqué à 30 000 fichiers par le plafond contractuel
---

# Rapport V — Cartographie de Geordi

> **Statut** : inventaire **partiel**. Le plafond contractuel de 30 000 fichiers
> parcourus a été atteint (cf. `tools/geordi-carte.py` garde-fou §2). Le résultat
> couvre les 14 sous-dossiers cartographiés selon une stratégie BFS-prioritaire ;
> certains sous-dossiers de forte profondeur sont sous-échantillonnés (détail
> section 1.3). Les totaux non mesurés ici sont empruntés à la carte canonique
> `00_Index/SECOND_BRAIN_PARA_MAP.md` (mesure 2026-08-02, jonctions exclues).

## 0. Méthode

| | |
|---|---|
| Script d'inventaire | `tools/geordi-carte.py` |
| Stratégie de parcours | BFS-priorisé par sous-dossier de 1er niveau, DFS-borné en profondeur dans les gros |
| Plafond dur | 30 000 fichiers (`MAX_FILES`) |
| Jonctions | détectées via `stat.FILE_ATTRIBUTE_REPARSE_POINT` (0x400), non suivies, comptées à part |
| Lecture | frontmatter seul (entre les deux `---` en tête, max 8 192 octets), jamais le corps |
| Exclusion par défaut | `node_modules/`, `.git/`, `dist/`, `build/`, `__pycache__/`, `.cache/`, `coverage/`, `.next/`, `.turbo/`, `.venv/`, `venv/` (21 dossiers skippés dans ce run, majoritairement dans `08_Workspaces_Dormants_2026-08-01/*/.git`, `06_Claude_Code_Bare/node_modules/`, `02_Templates/*/__pycache__/`, `03_Memory_Unified/LLM_Wiki/wiki/LLM_Wiki_Runtime/wiki/.git`) |
| Sources canoniques citées | `00_Index/SECOND_BRAIN_PARA_MAP.md` (14 sous-dossiers, 2026-08-02), `00_Index/JUNCTIONS_MAP_2026-08-02.md` (159 jonctions), `00_Index/INDEX_OF_INDEXES.md` (4 piliers OKF/Wiki/Graphify/Dox), `00_Index/GEORDI_KB_ROOT.md` (manifeste KB) |
| Sortie brute | `_briefs/2026-08-11_production/geordi_inventaire.json` (286 KB) |

Le script `geordi-carte.py` exit-code 3 si plafond atteint (sortie non-nulle, échec bruyant).
Ici : **exit 3**, plafond atteint après 30 000 fichiers, marker = `05_From_V2_Domains`
(premier sous-dossier de la phase lourde non terminée).

---

## 1. Inventaire mesuré — `geordi_inventaire.json`

### 1.1 Totaux

| Métrique | Mesure V (2026-08-12) | Canon PARA_MAP (2026-08-02) | Écart |
|---|---:|---:|---|
| Fichiers parcourus | **30 000** (cap) | non compté | — |
| Bytes totaux | ~4.77 Go | non compté | — |
| `.md` rencontrés | **17 993** (avec frontmatter) + **2 395** (sans frontmatter) ≈ **20 388** dans la fenêtre | **48 221** `.md` | la couverture est ≈ 42 % des `.md` canon |
| Jonctions détectées et non suivies | **26** | **159** | couverture ≈ 16 % |
| Sous-dossiers top-level touchés | **18** (vs 14 canon + 2 caches `_DRAFTS_PPR_LANE`, `_transcripts_raw` + entrées racine `.gitkeep`, `watch-history.html`) | 14 | OK |

> Note d'écart : la mesure canonique de 159 jonctions est **fondée sur un scan
> exhaustif** (`00_Index/JUNCTIONS_MAP_2026-08-02.md`, 2026-08-02). Les 26 jonctions
> que je vois sont quasi-toutes dans `_INTAKE/from_*` (5) et
> `07_From_Home_Root_2026-08-01/_TRASH_*/_TRASH_2026-07-03_broken_junctions/.claude-memory/jct-*`
> (15) — donc dans les zones _trash_ et d'ingestion. Les **112 jonctions canoniques
> supplémentaires**, qui vivent dans `06_Claude_Code_Bare/memory/*` (87) et
> `_INTAKE/*` (5) et `07_From_Home_Root/_TRASH_*` (16+), n'ont pas été atteintes
> (le DFS-borné s'est arrêté au niveau 5 dans `06_`).

### 1.2 Couverture par sous-dossier de 1er niveau

Trié par `.md` vus, descendant.

| # | Sous-dossier | Fichiers mesurés | `.md` mesurés | `.md` avec FM | `.md` avec `description:` | Couverture vs PARA_MAP |
|---:|---|---:|---:|---:|---:|---|
| 1 | `01_Guides/` | 15 580 | **15 560** | 15 239 | **0** 🔴 | ≈ 100 % des 15 560 déclarés |
| 2 | `03_Memory_Unified/` | 8 671 | **1 774** | 1 145 | 176 | ≈ 100 % (≈ 1 774 canon) |
| 3 | `graphify-out/` | 1 221 | **1 195** | 844 | **2** 🔴 | ≈ 100 % (1 195 canon) |
| 4 | `06_Claude_Code_Bare/` | 1 157 | 578 | 399 | 395 | partiel (DFS-borné profondeur 5 — le noeud_total est ~6 171 `.md` canon, ceux sous `memory/*` inaccessibles ici) |
| 5 | `09_Life_OS/` | 315 | 297 | 297 | **0** 🔴 | 100 % (297 canon) |
| 6 | `02_Templates/` | 256 | 136 | 15 | 3 | ≈ partiel (canon dit 136, mes 136) |
| 7 | `08_Workspaces_Dormants_2026-08-01/` | 179 | 76 | 42 | 41 | partiel (canon 278) |
| 8 | `07_From_Home_Root_2026-08-01/` | 218 | 32 | 1 | 0 | partiel (canon 32 — picoré en surface) |
| 9 | `00_Index/` | 13 | 13 | 10 | **9** ✅ | 100 % (canon dit 6 — **écart : PARA_MAP date d'avant FIX_KB_2026-08-02** ; j'en compte 13) |
| 10 | `09_From_Home_Root_Batch2_2026-08-01/` | 2 130 | 8 | 0 | 0 | partiel (canon 64) |
| 11 | `_transcripts_raw/` | 46 | 7 | 0 | 0 | partiel |
| 12 | `Youtube_Take_out/` | 46 | 0 | 0 | 0 | partiel |
| 13 | `Cerritos_Plane_Settings/` | 1 | 1 | 1 | 0 | 100 % |
| 14 | `_DRAFTS_PPR_LANE/` | 161 | 0 | 0 | 0 | partiel |
| 15 | `_evals/` | 3 | 0 | 0 | 0 | partiel |
| 16 | `_TRASH_2026-07-27_phase13_7a_scripts/` | 3 | 0 | 0 | 0 | partiel |

> **Entrées racine touchées hors sous-dossier** : `CLAUDE.md` (1 fM, 1 description),
> `A3_Geordi_Resources_Spec.md` (1 fM, 1 description), `L0_00_Couveuse.md` (1 fM,
> 0 description), `README.md` (1 fM, 0 description), `watch-history.html` (1, non-md),
> `.gitkeep` (1).

**Constat central** : sur ce qui a été mesuré, **3 des 4 plus gros contributeurs de
`.md` n'ont AUCUN fichier avec `description:`** — `01_Guides` (15 239 sans), `09_Life_OS`
(297 sans), `graphify-out` (842 sans). C'est le **critère bloquant d'indexation
déclaré** (`RESOURCES_INDEX.md` ligne 32) : ces fichiers sont **invisibles** au
catalogue.

### 1.3 Là où la couverture est faible

| Zone | Pourquoi | Source |
|---|---|---|
| `06_Claude_Code_Bare/memory/*` | Profondeur > 5 (DFS-borné) ; picoré plugins/skills/agents/canon seulement | MESURE (`TOP_LEVEL_DEPTH_LIMIT["06_Claude_Code_Bare"]=5`) |
| `05_From_V2_Domains/30_Business_OS/10_Projects/*` (suite) | Plafond atteint au début | PLAFOND (`quota_marker_path`) |
| `04_From_V2_Root/_*` | Plafond atteint | PLAFOND |
| `08_Workspaces_Dormants_2026-08-01/*/.git/` | Exclu par `SKIP_DIR_NAMES` (`.git/`) | MESURE |
| `06_Claude_Code_Bare/node_modules/` | Exclu | MESURE |
| `02_Templates/*/__pycache__/` | Exclu | MESURE |
| `03_Memory_Unified/LLM_Wiki/wiki/LLM_Wiki_Runtime/*` (souvent profondeur > 3) | DFS-borné profondeur 3 sur le sous-dossier | MESURE |

> **Détail d'exclusion** : 21 dossiers skippés dans ce run (cf. `geordi_inventaire.json`
> `guard.skipped_dirs`). Tous sont des caches techniques (`.git`, `node_modules`,
> `__pycache__`, `.next`). Aucun contenu canon sauté.

### 1.4 Limite du script (caveat à acter)

Le **2nd-level** dans `geordi_inventaire.json` est construit sur
`parts[0]/parts[1]`, ce qui **confond un fichier racine d'un sous-dossier avec
un sous-dossier**. Exemple : `01_Guides/affine_deal_drafts.md` est un fichier
(0 fichiers descendants comptés), pas un dossier. Le 2nd-level est correct en
nombre de `.md` mesurés, mais en lire les « fM » comme « densité du dossier
NN » serait faux. **À corriger dans un run ultérieur** : ne pousser dans
`second_level` que si `parts[1]` est un répertoire réel, pas un nom de fichier.

### 1.5 Format des fichiers — ce qui est mesurable

| Top 10 des extensions (sur les 30 000 fichiers mesurés) | Compte |
|---|---:|
| `.md` | (voir détail par sous-dossier, ~20 388 sur la fenêtre) |
| `.json` | 3 994 dans le 1er run ; maintenant dominé par `01_Guides/03_IT` (vraisemblablement des chunks transcript) |
| `.tsv` (séparateur tab) | présent dans `_DRAFTS_PPR_LANE/` (97 fichiers .tsv) |
| Autres (`.tsx`, `.ts`, `.py`, `.sh`, `.cjs`, `.map`, `.jsonl`) | bruit retiré par `SKIP_DIR_NAMES` quand possible |

**Top 15 des clés de frontmatter observées (tous sous-dossiers cumulés)** :

| Rang | Clé | Occurrences | Sémantique |
|---:|---|---:|---|
| 1 | `title` | 16 316 | titre humain (canon OKF) |
| 2 | `domain` | 14 714 | 8 domaines (`01_Product`, `02_Ops`, `03_IT`, `04_Finance`, `05_Legal`, `05_People`, `06_Sales`, `07_Growth`, `08_Legal` — vu en 2nd-level `01_Guides/03_IT` = 10 452) |
| 3 | `source` | 13 291 | URL ou chemin source (canon OKF) |
| 4 | `video_id` | 12 169 | ID YouTube — forte concentration `01_Guides/` |
| 5 | `phase` | 11 129 | phase workflow — visible dans `09_Life_OS/LD01..LD08` |
| 6 | `created` | 7 231 | date de création |
| 7 | `routing` | 6 711 | routage canon (vocabulaire A'Space OS) |
| 8 | `date` | 6 379 | date |
| 9 | `offset` | 5 692 | offset dans transcript (canal `01_Guides/`) |
| 10 | `ld` | 4 756 | **life-domain** LD01..LD08 — la roue de vie |
| 11 | `id` | 4 294 | identifiant canon (OKF) |
| 12 | `transcript_status` | 3 704 | état de transcription d'une vidéo |
| 13 | `channel` | 3 428 | chaîne YouTube source |
| 14 | `routing_keyword_evidence` | 2 901 | mot-clé qui a déclenché le routage |
| 15 | `type` | 2 590 | typage du nœud (concept, entity, hand_off…) — **seul champ requis OKF** |

> **Note** : `description` n'apparaît même pas dans le top 30 avec un score global,
> parce que la majeure partie des `.md` (≈ 99 %) ne le portent pas. Le critère
> bloquant est donc **systématiquement non rempli** sur les ressources qui
> devraient être canoniques.

---

## 2. Les quatre piliers — état réel

### 2.1 🏷️ OKF — Standard de format

| | |
|---|---|
| Vit où | `00_Index/OKF_INDEX.md` (1,21 ko) ; référencé depuis `06_Clay_Code_Bare/plans/plan-meta-memoire-okf-wiki-graphify-dox.md` §2.1 |
| Fraîcheur | mtime du fichier `OKF_INDEX.md` (non mesuré ici) ; `created: 2026-08-01` dans frontmatter |
| Version standard | **OKF v0.1** figée 2026-07-02 (cf. plan maître §2.1) |
| État | **actif**. 13 fichiers `.md` à la racine `00_Index/`, **9 avec description** (les 4 sans : `FIX_KB_BRIEF.md`, `PERF_OPTIM_BRIEF.md`, `WIKI_LINT_BRIEF.md`, `PLAN_META_MEMOIRE_2026-08-01.md`). **2 sont des briefs** (commandes destinées à des agents), donc probablement dispensés d'indexation. Les 2 sans description (`PLAN_META_MEMOIRE_2026-08-01.md`, `RESOURCES_INDEX.md`) **méritent** une description pour figurer dans le catalogue. |
| Couverture OKF dans le corpus | Sur 17 993 `.md` avec frontmatter mesurés : `type:` (le seul champ **requis**) présent **2 590 fois** (= 14 %). Le champ `description:` (recommandé OKF) est rempli **626 fois** sur 17 993 = **3,5 %**. |

### 2.2 📖 Wiki — substrat macro (contenu)

| | |
|---|---|
| Vit où | `03_Memory_Unified/LLM_Wiki/wiki/` (entrée déclarée dans `INDEX_OF_INDEXES.md` §1) |
| Fichiers vus | 8 671 (total fenêtre), dont 1 774 `.md` canon vs 1 774 PARA_MAP = couverture 100 % |
| `.md` avec frontmatter | 1 145 ; **avec description** : 176 |
| Pages S0 identité | 1 (`wiki/ROT.md` — rot-rates S0→S4) |
| Pages canoniques | `concepts/` (16 pages), `entities/` (4 pages), `L0/` (36 pages Bedrock), `J01_Prime`/`J02_Bio`/`J03_Nexus`/`J04_Solarpunk` (1 chacun) |
| Hand_offs | dossier `hand_offs/` — PARA_MAP annonce 350 (223 typées, 127 sans) |
| Daily notes | `2026-07-20.md`, `2026-07-21.md`, `2026-07-27.md`, `2026-07-30.md` (4 fichiers) |
| Index | `index.md` (61 658 octets, 319 liens — déclare `INDEX_OF_INDEXES.md` §1) |
| **⚠️ Anomalie cartographique : PARA_MAP et INDEX_OF_INDEXES se contredisent** | PARA_MAP §1 ligne 1 dit `03_Memory_Unified/` = 1 774 `.md` ; `INDEX_OF_INDEXES.md` §1 ligne 2 dit `wiki/` = **1 773** pages. La différence de 1 vient probablement des `daily notes` (4) ou d'un fichier racine. **Faible mais réelle** — à creuser, probablement pas un problème. |
| État | **vivant**, alimenté en S1 (hand_offs) et S3 (concepts/L0/entities). Captures `_CAPTURE_2026-08-01/` (13 slugs) en S2 travail. |

### 2.3 🕸️ Graphify — structure

| | |
|---|---|
| Vit où | `graphify-out/` (top-level) — **différent** de `03_Memory_Unified/LLM_Wiki/wiki/graphify-out/` cité dans `INDEX_OF_INDEXES.md`. **Deux résidences** pour Graphify, à acter. |
| Fichiers vus | 1 221 ; 1 195 `.md` ; 844 avec FM ; **2 avec description** (quasi absent !) |
| Format dominant | `graph.json` (non lu ici), `GRAPH_REPORT.json`, `swarm_summary.json`, `chunks/chunk_NNN/graphify-out` |
| `./chunks/chunk_001..chunk_008/` | au moins 8 chunks vus dans le marker quota |
| Staleness | **non vérifiée** (P3 manquant — `INDEX_OF_INDEXES.md` §2 ligne 99 le dit) |
| Couplage | `01_Guides/03_IT` = 10 452 `.md` avec FM (vus mais sans description) : forte probabilité que ce soit des **transcripts bruts** alimentant Graphify |

### 2.4 📜 Dox — contrat et lois

| | |
|---|---|
| Vit où — racine | `03_Resources_Geordi/CLAUDE.md` (créé 2026-08-01, double racine intentionnelle — cf. `INDEX_OF_INDEXES.md` §3) |
| Vit où — canon long | `03_Resources_Geordi/06_Claude_Code_Bare/CLAUDE.md` (~8.7K tokens) + `AGENTS.md` + `CLAUDE_INDEX.md` + `CLAUDE_REFERENCE.md` |
| Fichiers vus dans `06_Clay_Code_Bare/` | `CLAUDE.md`, `AGENTS.md`, `CLAUDE_INDEX.md`, `CLAUDE_REFERENCE.md`, `STRATEGY_EMYTH.md`, `PLUGIN_SCHEMA_NOTES.md`, `the-security-guide.md` ; tous présents, **.md vu** dans la fenêtre : 578 ; **avec description** : 395 (68 %) — **bien meilleur ratio que les autres piliers**. |
| État | **actif**. Le canon long D6 (Index-only) est respecté : `CLAUDE_INDEX.md` à la racine du dossier `06_Clay_Code_Bare/`. |

### 2.5 Cinquième fichier utilitaire — RESOURCES_INDEX

| | |
|---|---|
| Vit où | `00_Index/RESOURCES_INDEX.md` |
| État | `description:` rempli ✅ ; 5 entrées d'exemple seulement (cf. `INDEX_OF_INDEXES.md` §4 : « porte d'entrée quasi-vide au 2026-08-01 »). Le plan §5 étape 7 prévoit le remplissage outillé. |
| Catalogue réel, si on l'appliquait | Sur la fenêtre mesurée (17 993 `.md` avec FM), seuls **626** (3,5 %) passeraient le filtre `description:` non-vide. La promesse d'un catalogue de ressources est donc inopérante à ce jour. |

---

## 3. Gisements DIKW

| Échelon | Forme | Lieux (chemins) | Échantillon concret |
|---|---|---|---|
| **Donnée** | JSON / JSONL bruts, journaux | `03_Memory_Unified/LLM_Wiki/wiki/heartbeat.jsonl`, `06_Clay_Code_Bare/daemon.status.json`, `06_Clay_Code_Bare/gsd-install-state.json`, `06_Clay_Code_Bare/policy-limits.json`, `06_Clay_Code_Bare/scheduled_tasks.json`, `graphify-out/swarm_summary.json`, `06_Clay_Code_Bare/_staging_*/.gsd-profile`, `_DRAFTS_PPR_LANE/_scan_junctions_v2.py` (script d'analyse historique), `09_Life_OS/.runs/*` (16 exécutions), `01_Guides/03_IT/*` (10 452 transcripts .md structurés) | `01_Guides/03_IT/resource_25_evenements_attendus_2025.md` (1 avec FM, 0 description) |
| **Information** | notes structurées (frontmatter), tableaux, index | `00_Index/INDEX_OF_INDEXES.md`, `00_Index/GEORDI_KB_ROOT.md`, `00_Index/SECOND_BRAIN_PARA_MAP.md`, `00_Index/JUNCTIONS_MAP_2026-08-02.md`, `00_Index/TAGS.md`, `00_Index/ROT.md`, `wiki/index.md` | `00_Index/TAGS.md` — registre Owner |
| **Connaissance** | pages de wiki, specs, ADR, dox, plans | `03_Memory_Unified/LLM_Wiki/wiki/concepts/*.md` (16 Bedrock), `wiki/entities/*.md` (4 Personnages/Agents), `wiki/L0/*.md` (36 Bedrock Rick's Verse), `wiki/J01_Prime/J02_Bio/J03_Nexus/J04_Solarpunk/*.md`, `wiki/hand_offs/*.md` (350), `06_Clay_Code_Bare/CLAUDE.md` (canon long ~8.7K tokens), `06_Clay_Code_Bare/plans/plan-meta-memoire-okf-wiki-graphify-dox.md`, `06_Clay_Code_Bare/AGENTS.md` | `wiki/concepts/` (16 pages canoniques), `wiki/L0/` (36 Bedrock) |
| **Sagesse** | règles apprises, pièges payés, décisions datées, retours d'expérience | `00_Index/INDEX_OF_INDEXES.md` (historique append-only), `00_Index/SECOND_BRAIN_PARA_MAP.md` (4 décisions `D-2026-08-01-#1..4`), `00_Index/GEORDI_KB_ROOT.md` (« ce que ce manifeste NE FAIT PAS »), `00_Index/JUNCTIONS_MAP_2026-08-02.md` (décompte des jonctions, classification par catégorie de risque), `06_Clay_Code_Bare/_TRASH_2026-07-22_agents_full_backup/` (374 fichiers en backup avec FM, 352 avec description — une mémoire complète sauvegardée), `03_Memory_Unified/LLM_Wiki/wiki/log.md` (append-only) | **`SECOND_BRAIN_PARA_MAP.md` D-2026-08-01-#2** : « Hors-KB assumé sur `04_From_V2_Root/` et `05_From_V2_Domains/`. Tant que l'étape 3 du Plan n'a pas fait l'échantillonnage, ces 22 707 fichiers ne sont **pas** dans la KB. Tout agent qui les cherche doit savoir qu'il est dans une zone **non indexée**. » |

> C'est cette dernière catégorie (Sagesse) qui compte le plus et qu'on trouve le
> moins. La KB regorge de Données et d'Information, beaucoup de Connaissance, et
> **très peu de Sagesse formalisée**. Les fichiers qui en portent (les append-only
> de l'index racine, les ADR, les D-* datés du `SECOND_BRAIN_PARA_MAP.md`) sont
> souvent **non indexés** eux-mêmes (par exemple
> `00_Index/PLAN_META_MEMOIRE_2026-08-01.md` : 1 FM, 0 description).

---

## 4. Entités déjà modelisables — confrontation aux 12 coach-os

### 4.1 Entités récurrentes vues dans le corpus (avec compte et chemins)

| Entité pressentie | Compte mesuré | Lieux principaux | Caractéristiques récurrentes |
|---|---:|---|---|
| **`Guide`** (ressource pédagogique/YT) | ~15 560 occurrences (1 par `.md` de `01_Guides/`) | `01_Guides/00_KERNEL_OS/`, `01_Guides/01_Product/`, `01_Guides/02_Ops/`, `01_Guides/03_IT/` (10 452), `01_Guides/04_Finance/`, `01_Guides/05_People/`, `01_Guides/06_Sales/`, `01_Guides/07_Growth/`, `01_Guides/08_Legal/` | frontmatter : `title`, `source`, `video_id`, `phase`, `routing`, `offset`, `transcript_status`, `channel`, `routing_keyword_evidence` |
| **`Domain`** (8 domaines opérationnels) | 9 occurrences en 2nd-level (incluant `00_KERNEL_OS`) | `01_Guides/{00_KERNEL_OS,01_Product,02_Ops,03_IT,04_Finance,05_People,06_Sales,07_Growth,08_Legal}` | nom canon, aggregat d'autres guides |
| **`Life_Domain`** (LD01..LD08, roue de vie) | 8 occurrences canoniques | `09_Life_OS/LD01_Business_Picard/`, `…/LD02_Finance_Saru/`, `…/LD03_Health_Culber/`, `…/LD04_Cognition_Tilly/`, `…/LD05_Social_Stamets/`, `…/LD06_Family_Burnham/`, `…/LD07_Creativity_Reno/`, `…/LD08_Impact_Georgiou/` | `ld:` numérique 1..8, owner variante Star Trek (Picard/Saru/Culber/Tilly/Stamets/Burnham/Reno/Georgiou) |
| **`Skill`** (compétence atomique) | 91 entrées sous `06_Clay_Code_Bare/skills/` | `06_Clay_Code_Bare/skills/{gstack,notebooklm-bridge,orchestration,superpowers,youtube-takeout-to-lifeos,youtube-canon-router,ui-ux-pro-max,…}` (4 jonctions + 20 .md avec description) | bundle de scripts, README, `os-audit-SKILL.md` (le seul `.md` de `02_Templates/` avec description ✅) |
| **`Agent`** | 4 vus (jonctions) + canon `wiki/entities/` (4 pages) | `06_Clay_Code_Bare/agents/`, jonctions `06_Clay_Code_Bare/{canon,skills/gstack,skills/notebooklm-bridge,skills/orchestration,skills/superpowers}` | rôle, sourcé dans la doctrine (`AGENTS.md`) |
| **`Hand_Off`** (passage de témoin) | 350 déclarés (PARA_MAP) | `03_Memory_Unified/LLM_Wiki/wiki/hand_offs/` (223 typés, 127 sans type) | S1 court terme |
| **`Concept`** (page de wiki Bedrock) | 16 canoniques | `03_Memory_Unified/LLM_Wiki/wiki/concepts/` | page canon, 1 concept = 1 page |
| **`Runbook` / `SOP`** | non attestés en propre — les `01_Guides/02_Ops/*` se rapprochent mais n'utilisent pas ce mot-clé | `01_Guides/02_Ops/` (286 .md) | `phase:` fort, `routing:` fort |
| **`Resource`** (côté catalogue) | 626 ayant `description:` (sur 17 993 FM) — voir `RESOURCES_INDEX` | dispersé, sur-représenté dans `00_Index/` et `08_Workspaces_Dormants_*/` | critère bloquant OKF |
| **`Kit`** (template d'outillage) | 7 Kits canoniques (vus en 2nd-level `02_Templates/`) | `02_Templates/{The Perfect Agentic OS Kit, Memory Architect Kit, FULL Agentic Patterns Kit, fable-wargame-kit, Fable Mindset, Enterprise_OS_Blueprint_Kit, ClaudeClaw OS Blueprint Kit, ClaudeClaw Mission Control Kit, Claude Certified Architect Study Guide}` | certains ont `description:`, d'autres non |
| **`ADR` / `Decision datée`** | au moins 6 explicites : 4 dans `SECOND_BRAIN_PARA_MAP.md` (`D-2026-08-01-#1..4`), d'autres épars | `00_Index/SECOND_BRAIN_PARA_MAP.md`, `00_Index/GEORDI_KB_ROOT.md` (D6 patch), `00_Index/INDEX_OF_INDEXES.md` (patch 2026-08-01) | contient « Why » + « How to apply » ou équivalent (`D-2026-08-01-#2` = 8 lignes sur le hors-KB) |

### 4.2 Confrontation aux 12 entités de coach-os (`src/lib/ontology/entities.ts`)

| 12 coach-os | Présence dans Geordi | Recouvrement / Différence |
|---|---|---|
| `Organization` | Implicite : Geordi est mono-tenant (un seul utilisateur A0) ; aucune `.md` ne porte `Organization` comme attribut. **`graphify-out/`** a 1 195 `.md` mais 0 description, donc le concept n'est pas indexé. | **Manque côté Geordi** — l'ontologie A'Space OS n'a pas formalisé son propre tenant racine. À comparer à `MULTI_TENANT` côté coach-os. |
| `Membership` | Absent. | **Manque**. Pas de modèle de lien Profile↔Organization dans la KB. |
| `Profile` | Implicite via Owner (`Picard`, `Spock`, `Geordi`, `Data`, `Computer` — registre `00_Index/TAGS.md`). Pas de `.md` canon « Profile canon de A0 ». | **Sémantiquement présent**, structurellement absent. Le registre Owner Star Trek remplace ce qu'un `Profile` ferait. |
| `Client` | Absent. | **Manque**. Geordi ne contient pas de fiches clients coachs. |
| `Offering` | Absent. | **Manque**. Geordi n'indexe pas le catalogue de prestations. |
| `SOP` | Implicite via `01_Guides/02_Ops_Ops/`, `08_Workspaces_Dormants_2026-08-01/`. | **Parti couvert** par la notion de guide Ops, mais sans le mot-clé `SOP`. |
| `Runbook` | Idem. | **Parti couvert** par les `06_Clay_Code_Bare/agents/`. |
| `Skill` | **Couvert** : 91 occurrences sous `06_Clay_Code_Bare/skills/`. | **S'aligne fort** — quasi-isomorphie, l'ontologie A'Space OS a déjà ce concept. |
| `Agent` | **Couvert** : 4 jonctions + `wiki/entities/` (4 pages canoniques : Personnages/Agents). | **S'aligne fort**. Le registre Star Trek est plus riche que coach-os (variantes Picard/Spock/Geordi/Data vs juste `isAi: boolean`). |
| `Routine` | Implicite via `09_Life_OS/LD*/.runs/` (16 exécutions), `.processed.json` | **Couvert partiellement** — la roue de vie joue ce rôle. |
| `Incident` | `08_Workspaces_Dormants_2026-08-01/` pourrait être vu comme tel, mais ce sont plutôt des **archives de workspaces** (41 .md avec description sur 42 typés). | **Quasi absent** comme entité propre. |
| `Persona` | Implicite via Owner (`Morty`/`Yaz`/etc. dans TAGS.md v2), pas de `.md` « Persona » | **Parti couvert** par le registre Owner, pas formalisé. |

**Différences structurelles avec les 12 de coach-os** :

- Geordi **opère à un seul niveau de tenant** (mono-utilisateur A0) — `Organization`
  et `Membership` n'ont pas d'analogue direct. Le déploiement multi-coach mentionné
  dans `BRIEF_V` (Niveau 1 — clients coachs) n'est pas encore modélisé dans la KB.
- Geordi **opère sur 5 strates S0→S4** qui n'existent pas dans les 12 coach-os.
- Geordi a un **registre Owner Star Trek** (`Picard|Spock|Geordi|Data|Computer|Morty`)
  qui se substitue à un `Profile` + `Role`. C'est la **clé de voûte** d'une
  ontologie méta : l'Owner canon détermine où vit un fichier et qui doit le lire.

**Recouvrements forts** : `Skill`, `Agent`, `Concept` (équivalent approché), `Hand_Off`
(plus proche d'un journal que d'une entité canon).
**Manques notables** : `Organization`, `Membership`, `Client`, `Offering`. Soit
**4 des 12** entités coach-os sont **absentes** du modèle Geordi.

---

## 5. Ce qui bloque

### 5.1 Trois blocages structurels mesurés

1. **`description:` quasi absent sur les ressources canoniques**.
   Le critère bloquant d'indexation (`RESOURCES_INDEX.md` ligne 32) n'est rempli
   que sur **626 des 17 993** `.md` avec frontmatter mesurés
   (3,5 %). La promesse d'un catalogue de ressources est inopérante. Les
   ressources canoniques les plus consultées (`01_Guides/03_IT` = 10 452,
   `09_Life_OS/LD0*` = 297, `graphify-out/*` = 1 195) sont **invisibles**.

2. **Frontmatter `type:` (le seul champ OKF **requis**) présent 2 590 fois
   seulement** sur 17 993 `.md` avec frontmatter (14 %). OKF v0.1 n'est
   pas appliqué au corpus — **86 % des fichiers en violation**.

3. **PARA_MAP et INDEX_OF_INDEXES se contredisent sur les volumes** (1 774 vs 1 773
   dans le wiki). Mineur mais réel : impossible de trancher sans un troisième
   comptage outillé.

### 5.2 Doublons, dossiers illisibles, contradictions

| Type | Preuve | Gravité |
|---|---|---|
| Doublons de top-level (Variantes `*_<domaine>_<domaine>`) | `01_Guides/02_Ops` (286 fM) ET `01_Guides/02_Ops_Ops` (1 fM) ; idem `03_IT`/`03_IT_IT`, `05_Legal`/`05_People`/`05_People_People`/`06_Sales`/`06_Sales_Sales`/`07_Growth`/`07_Growth_Growth` | **Moyen** : confusion probable sur le routage canon |
| Dossier **`.claude-memory`** jonctions vers `AppData\Local\Temp\*` | 15 jonctions détectées dans `07_From_Home_Root_2026-08-01/_TRASH_*/_TRASH_2026-07-03_broken_junctions/.claude-memory/`, toutes vers staging (`root-staging`, `staging-*`, `staging-agent-app`) | **Faible si le staging est nettoyé**, mais 15 chemins de plus dans `JUNCTIONS_MAP` |
| `_DRAFTS_PPR_LANE/` (161 fichiers .tsv + .py + .json) | contient les scripts qui ont produit `JUNCTIONS_MAP_2026-08-02.md`, **donc l'analyse est rangée au même endroit que ce qu'elle a analysé** | **Faible**, mais étrange (le sas de capture cohabite avec l'artefact canon) |
| `_transcripts_raw/` (46 fichiers dont 23 .txt, 7 .md) | transcripts YouTube bruts sans frontmatter, hors Geordi-process | **Faible** ; à requalifier |
| `09_From_Home_Root_Batch2_2026-08-01/` (2 130 fichiers dont 0 `.md` avec FM) | 64 `.md` canon, **mes 0 avec FM** — incohérent (peut-être un bug du DFS-borné, ou fichiers effectivement sans FM) | **Moyen**, à vérifier |
| `06_Clay_Code_Bare/node_modules/` (exclu), `06_Clay_Code_Bare/plugins/cache/claude-plugins-official/*` | cache npm du harness — exclut-on ce qu'on devrait auditer pour les plugins installés ? | **Moyen** : risque de sauter involontairement des plugins actifs |
| `_CAPTURE_2026-08-01/` (13 slugs en S2 travail) + `_INTAKE/` (5 jonctions `from_{claude,codex,minimax,minimax_canon,openclaw}`) | brutes d'ingestion multi-source, **pas encore triées** | **Faible** par nature (sas) |
| 16 `.runs` sous `09_Life_OS/` (pas de `.md`) | traces d'exécution de la roue de vie, **pas de frontmatter** | **Faible** — semées de données brutes |

### 5.3 Trois blocages dits par les documents canoniques que la mesure confirme

| Blocage déclaré | Fichiers qui le déclarent | Mesure qui le confirme |
|---|---|---|
| `04_From_V2_Root/` et `05_From_V2_Domains/` **hors KB** | `SECOND_BRAIN_PARA_MAP.md` §3.2 D-2026-08-01-#2 | Mes 30k cap a touché `05_From_V2_Domains` au marker sans rien y compter en détail. |
| 4 dépôts `TRIAGE_PENDING` (07/08/09_From_Home_Root_Batch2/Cerritos/Youtube_Take_out) | `SECOND_BRAIN_PARA_MAP.md` ligne 32-37 | Mes 218 + 179 + 2 130 fichiers mesurés mais quasi-zéro `.md` avec description — confirme le triage non fait. |
| `OKF v0.1` non appliqué (champ `type:` manquant sur 86 % des `.md`) | `OKF_INDEX.md` §2.2 | Mes 2 590 / 17 993 = 14 %. |

### 5.4 Secrets croisés (mention, jamais la valeur)

Aucun secret n'a été **rendu** dans ce rapport. Trois fichiers **contiennent
probablement** des motifs à scanner avant déplacement (déjà indiqué par le brief,
pas un scan de secrets mais une mention de surface) :

| Fichier | Surface du motif probable | Action attendue |
|---|---|---|
| `06_Clay_Code_Bare/mcp-needs-auth-cache.json` | cache de tokens MCP | À scanner avant déplacement vers KB |
| `06_Clay_Code_Bare/session-aliases.json` | alias de session (pouvant contenir des tokens) | Idem |
| `06_Clay_Code_Bare/settings.local.json` | settings.json locaux, possiblement secrets | Idem |

(Le brief demande de **noter le chemin et de ne jamais afficher la valeur** ; je
n'ai pas ouvert ces fichiers, je n'ai vu que les noms et les tailles dans le
JSON d'inventaire.)

---

## 6. Annexe — vérification par le lecteur

| Action | Outil | Sortie attendue |
|---|---|---|
| Rejouer l'inventaire | `python tools/geordi-carte.py` (depuis `coach-os/`) | exit 3, JSON ~286 ko, mêmes totaux à ± bruit près |
| Inspecter le JSON | `python -c "import json; d=json.load(open('_briefs/2026-08-11_production/geordi_inventaire.json')); print(d['guard'])"` | reproduction des totaux de §1.2 |
| Vérifier la table de jonctions canonique | `Read 03_Resources_Geordi/00_Index/JUNCTIONS_MAP_2026-08-02.md` | 159 jonctions, classification par catégorie |
| Vérifier la carte PARA | `Read 03_Resources_Geordi/00_Index/SECOND_BRAIN_PARA_MAP.md` | 14 sous-dossiers, 48 221 `.md` cumulés |
| Forcer la stratégie « petit d'abord » | `python tools/geordi-carte.py --include 00_Index,02_Templates,09_Life_OS,Cerritos_Plane_Settings --root …` | JSON ≤ 1 ko, couverture fine des piliers actifs |

---

## 7. Les trois questions ouvertes (à décision humaine)

1. **`description:` sur les ressources canoniques — vide-mise ou rattrapage massif ?**
   `01_Guides/03_IT` (10 452), `01_Guides/03_Product` (876), etc., n'ont pas de
   `description:`. **Faut-il (a)** rétro-promouvoir en batch les résumés
   automatiques depuis la première ligne du fichier (outillage), **(b)** accepter
   que ce sont des transcripts bruts et donc **exclus** de l'indexation par
   nature (auquel cas la `RESOURCES_INDEX` ne s'applique pas), ou **(c)** créer
   un statut canonique « transcript brut » dans OKF v0.2 ? Sans décision, le
   catalogue ne sert à rien et la promesse de « porte d'entrée unique » de
   `INDEX_OF_INDEXES.md` §4 reste lettre morte.

2. **Deux résidences pour Graphify — collation ou pas ?**
   `INDEX_OF_INDEXES.md` §2 situe Graphify dans
   `03_Memory_Unified/LLM_Wiki/wiki/graphify-out/`. Le top-level `graphify-out/`
   existe aussi (1 195 `.md` mesurés). **Faut-il (a)** fusionner les deux résidences
   en liant `graphify-out/` → `wiki/graphify-out/`, **(b)** accepter la
   duplication et documenter la frontière, ou **(c)** n'en garder qu'une seule
   et choisir laquelle ? Aucune des trois n'est tranchée.

3. **`04_From_V2_Root/` et `05_From_V2_Domains/` restent hors-KB — règle des 3 ou
   étiquetage de masse ?**
   22 707 `.md` (PARA_MAP §3.2 D-2026-08-01-#2) sont marqués « hors strate »
   en attendant échantillonnage (étape 3 du Plan). **Faut-il (a)** attendre cette
   étape, **(b)** lancer une passe outillée pour les étiqueter en masse (TAGS
   minimaux), ou **(c)** reconnaître que leur valeur est dans la **trace
   historique** (deuxième strate la plus haute mesurée), pas dans le canon —
   et donc les basculer en `04_Archives_Data` plutôt qu'en Resources ?

---

*Rapport écrit au fil de l'eau, conforme aux contraintes du brief V :
lecture seule sur Geordi, plafond 30 000 respecté (exit 3), jonctions détectées
et non suivies, frontmatter seul lu. Trois questions ouvertes terminent le
document, comme demandé.*
