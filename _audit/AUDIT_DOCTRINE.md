# Audit — Doctrine contre exécution

**Couverture : 190 fichiers .md lus/comptés dans le périmètre (`04_Business_Domains/` + `00_Summers_CEO/`), 1 fichier de code (`domain.ts`, 183 lignes), 1 `ORG.json`, plus une incursion de vérification dans `_runtime/` et `src/lib/ontology/entities.ts` pour trancher la question centrale — divergences code/doctrine. 12 mesures directes par `find`/`grep`/`wc`.**

## Verdict global

Sur 190 fichiers de doctrine, **zéro** a produit un artefact métier réel. Le seul code qui tourne (`_runtime/kernel.mjs`, 255 lignes, tests verts datés d'aujourd'hui) ne sert pas la doctrine des 8 domaines : il fait tourner un portique Legal simulé sur un dossier `%TEMP%`, pas le vrai `03_Master_Agreements/`. La doctrine décrit une organisation de 8 VP et 53 techniciens ; l'exécution consiste en un fichier `mandates/_inventory/01_roles_inventory.md` qui n'existe pas, 53 `SCRUMS.md` dont les 5 lignes de jour sont vides à 100 %, et trois registres de noms de domaines qui ne s'accordent pas entre eux. C'est une doctrine intacte et une exécution nulle — pas dormante, **jamais commencée**.

## Le ratio doctrine / exécution

| Domaine | Fichiers .md | Contrepartie en code | Trace d'exécution | Ratio |
|---|---|---|---|---|
| 01 RH & Méta Gouvernance (Green Lantern / X-Men) | 1 SPRINTS + 3×8 squad = 25 | `domain.ts` id `rh-meta-gouvernance` (déclaratif seulement) | `mandates/` absent du disque ; SCRUMS 8/8 vides | 0 % |
| 02 Opérations en Loops (Batman / Fantastic Four) | 1 + 3×4 = 13 | `domain.ts` id `operations-loops` | SCRUMS 4/4 vides | 0 % |
| 03 Productization (Flash / Avengers) | 1 + 3×7 = 22 | `domain.ts` id `product-growth` | SCRUMS 7/7 vides ; graphe sans propriétaire (voir §Divergences) | 0 % |
| 04 Sales & Cognition (Martian Manhunter / Illuminati) | 1 + 3×6 = 19 | `domain.ts` id `sales-cognition` | SCRUMS 6/6 vides | 0 % |
| 05 People & Brand (Superman / Guardians) | 1 + 3×6 = 19 | `domain.ts` id `people-acquisition` (nom divergent, cf. plus bas) | SCRUMS 6/6 vides | 0 % |
| 06 Finance & ROI (Wonder Woman / Thunderbolts) | 1 + 3×6 = 19 | `domain.ts` id `finance-roi` | SCRUMS 6/6 vides | 0 % |
| 07 R&D & IT (Cyborg / Kang Dynasty) | 1 + 3×6 = 19 | `domain.ts` id `rd-it` | SCRUMS 6/6 vides | 0 % |
| 08 Legal & Compliance (Aquaman / Eternals) | 1 + 3×10 = 31 | `domain.ts` id `legal-compliance` **+ `_runtime/kernel.mjs`, `bridge.mjs`, `GATES.md`, `agents/aquaman-gate.md`, `agents/aquaman-intake.md`, `.etat/journal.jsonl`** | **Seul domaine avec code qui s'exécute** : 6 gates `unlazy` passées, journal causal de 31 événements horodatés au 2026-08-23 — mais sur un contrat simulé dans `%TEMP%/audit_bac/`, jamais sur `00_Summers_CEO/03_Master_Agreements/` (toujours 1 seul `README.md`) | ~5 % (infrastructure de portique réelle, zéro fait métier réel) |
| **Total** | **190 fichiers de doctrine, 0 dossier `mandates/` produit** | 1 fichier catalogue déclaratif (`domain.ts`) + 1 sous-système runtime réel pour 1 domaine sur 8 | 1 domaine sur 8 a du code exécutable, 0 domaine a produit l'artefact que son propre rock exige | **≈ 3-5 % exécutable, 0 % de rock livré** |

Chiffre demandé par le propriétaire : **190 fichiers markdown, 1 fichier de code catalogue + 1 sous-système runtime (6 fichiers) ont une contrepartie exécutable, soit environ 7 fichiers exécutables pour 190 de doctrine — ratio ≈ 3,7 %.** Et sur ces 7, aucun ne ferme la boucle jusqu'à un fait métier réel (le seul déclencheur testé est un chemin `%TEMP%`, pas le vrai portail).

## Les 8 domaines au test « dormant ou mort »

- **01 RH** — pas dormant : rock actif, `SPRINTS.md:8` porte « rock hérité » rempli. Mais le sprint S1 exige `mandates/_inventory/01_roles_inventory.md` (`SPRINTS.md:32`) — **le fichier n'existe pas sur disque** (`find . -iname mandates` → aucun résultat). C'est un domaine actif sur le papier, à exécution nulle. Ni dormant ni mort : **non commencé**.
- **02 Opérations** — même constat : rock rempli (`SPRINTS.md:8`), tableau des 4 sprints présent, colonne « Tenu ? » vide sur toute la ligne. Non commencé.
- **03 Productization** — rock rempli, mais le journal Council lui-même signale un défaut de graphe : *« `product-domain` n'a aucun triplet `instantiates`… le seul domaine sans propriétaire déclaré »* (`B2_DC_DIRECTION_COUNCIL_DECISIONS.md:189-192`). Alibi impossible ici puisque la doctrine ne prétend même pas à la dormance — elle constate une absence de rattachement.
- **04 Sales & Cognition** — le journal invente un état `NON_FORCED` non sourcé et le dit lui-même : *« `NON_FORCED` est une extrapolation, pas un triplet sourcé »* (`B2_DC…:218-219`). C'est un alibi en construction, pas encore posé — la doctrine se retient elle-même de le déclarer dormant sans preuve, ce qui est le comportement correct, mais révèle que même la case « pourquoi ce domaine ne produit rien » n'est pas remplie.
- **05 People & Brand** — rock rempli, mais collision de nom non résolue entre le dossier disque (`People`), le graphe RDF (`growth-domain instantiates superman-owner`) et `entities.ts` (`id: 'growth' … squad: 'Guardians'`). Trois systèmes, trois désignations différentes pour le même stratège. Non commencé, et mal nommé.
- **06 Finance & ROI** — rock rempli, aucune réserve de doctrine particulière, aucun artefact. Non commencé.
- **07 R&D & IT** — rock rempli ; seul domaine où le journal note un couplage qui « ne dort jamais » (canal Forge People×IT) — mais ce couplage n'a, lui non plus, aucune trace d'exécution. Non commencé.
- **08 Legal & Compliance** — **le seul cas légitime.** Les trois conditions cumulatives de la dormance sont réunies et mesurées (`B2_DC…:311-315`) : `03_Master_Agreements/` ne contient qu'un README, le `SPRINTS.md` garde le gabarit vide, et le déclencheur est nommé et vérifiable (premier fichier déposé dans ce dossier). C'est une dormance **avec déclencheur armé** — au sens strict de la doctrine, le seul domaine qui n'est pas un alibi. Ironie : c'est aussi le seul domaine avec du code qui tourne, précisément parce que quelqu'un a construit et testé le portique qui doit se déclencher *si* la dormance se lève un jour. Le code existe pour un domaine volontairement inactif ; les 7 domaines « actifs » n'ont aucun code.

## Ce qu'on présente comme bloquant et qui ne l'est pas

1. **L'absence de signature (`signé:`) sur les 9 paquets du journal Council.** Elle bloque uniquement la reconnaissance formelle d'un état (dormant/actif/en_attente) au regard de la doctrine de gouvernance. **Elle ne bloque pas** l'exécution des sprints eux-mêmes — 7 domaines ont un rock actif et pourraient produire `mandates/*.md` dès aujourd'hui sans qu'aucune signature ne soit requise. Si on l'ignore : rien ne change dans la capacité à produire, seule la traçabilité de gouvernance reste floue. Sur 10 entrées du journal (000, 001, puis 002-009), **9 des 9 lignes `signé:` sont vides** (la 000 et 001 n'ont pas de champ dédié capitaine et sont aussi vides) — confirmé par lecture intégrale du fichier.
2. **Le rattachement A1/A2/A3 manquant dans `ROCKS.md`** (« Non disponible dans les sources consultées », `ROCKS.md:20-22`). Bloque la traçabilité stratégique amont, **ne bloque pas** l'exécution du rock du mois : le rock est écrit, daté, découpé en sprints exécutables indépendamment de tout rattachement à un cap A1.
3. **La collision de nommage 05 (People vs Growth)** (`B2_DC…:243-247`). Bloque la cohérence documentaire, **ne bloque pas** la production d'un mandat écrit ou d'une preuve datée — le sprint S1 de ce domaine pourrait s'exécuter sous n'importe lequel des deux noms.
4. **Le défaut de graphe du domaine 03** (`instantiates` absent). Bloque un audit RDF automatisé, **ne bloque pas** un humain d'écrire le fichier `mandates/vp/03_flash.md` à la main.

Dans les quatre cas, ce qu'on présente comme un verrou de gouvernance est un défaut de traçabilité — jamais un obstacle technique à produire l'artefact demandé par le rock.

## Ce qui a réellement produit quelque chose

- **`_runtime/kernel.mjs` + `_runtime/GATES.md`** : 255 lignes de code, 6 gates avec preuves horodatées `2026-08-23T08:16-17Z` (aujourd'hui). `node kernel.mjs --autotest` → « 12 réussites, 0 échecs » (`GATES.md:14-16`). C'est la seule preuve d'exécution vérifiable de tout le périmètre audité.
- **`_runtime/.etat/journal.jsonl`** : 31 événements causaux réels, horodatés `2026-08-23T20:27:36Z`, avec chaîne causale (`cause_par`) traçable — mais tous générés contre `C:\Users\amado\AppData\Local\Temp\audit_bac\03_Master_Agreements\variante2.md`, un chemin de test, **pas** le `00_Summers_CEO/03_Master_Agreements/` réel du dépôt (qui ne contient toujours qu'un `README.md`).
- **Absence totale ailleurs** : `find . -iname mandates` ne renvoie aucun résultat ; les 53 `SCRUMS.md` font tous exactement 35 lignes avec les 5 lignes « lun/mar/mer/jeu/ven » vides (`grep` sur les 53 fichiers → 0 ligne de jour remplie) ; les colonnes « Tenu ? » des 7 `SPRINTS.md` actifs sont vides sur toute leur hauteur.

Verdict : **une preuve d'exécution réelle sur 190 fichiers de doctrine, et elle porte sur une simulation, pas sur le monde réel.**

## Divergences doctrine / code

| Point | Sur disque (`04_Business_Domains/`) | Dans `domain.ts` | Dans `src/lib/ontology/entities.ts` | Qui fait foi ? |
|---|---|---|---|---|
| Domaine 03 | `Productization des Besoins` (Flash / Avengers) | `product-growth`, libellé « Product & Growth » | `product`, portée « Product & Delivery », squad `Avengers` | Aucun consensus — 3 libellés différents pour le même domaine |
| Domaine 05 | `People et Brand` (Superman / Guardians) | `people-acquisition`, libellé « People & Acquisition », squad `Gardiens` | `growth`, portée « Growth & Acquisition », squad `Guardians` | `entities.ts` rebaptise carrément le domaine « growth », contredisant à la fois le dossier et `domain.ts` |
| Nombre de domaines connus | 8 dossiers sur disque | 8 (`DOMAINES`, ligne 28-37) | **7** — `entities.ts:57` l'admet lui-même : *« Ce SDD est périmé : il ne connaît que SEPT domaines »* | Le fichier code le dit lui-même : **il faut lire `domain.ts`, pas `entities.ts`**, sur ce point précis |
| État du domaine 08 (Legal) | `VP_AGENT.md:53` : « Ce domaine est dormant » + `ORG.json` : `"dormant": false` pour les 7 autres mais le champ n'apparaît pas pour Legal dans l'extrait lu | `domain.ts` n'encode aucun état — il délègue à `VP_AGENT.md` et au journal Council (ligne 74-79 : *« L'état n'est PAS deviné : il est lu dans le journal Council et le VP_AGENT »*) | — | `domain.ts` est honnête sur ce point : il refuse de dupliquer un état qu'il ne peut pas garantir frais — bon design, mais cela signifie que **le code ne sait rien de l'état réel sans relire le markdown à chaque appel**, donc aucune garantie d'exécution automatisée |
| Squad du domaine 07 | `Kang Dynasty` (nom du dossier) | `Kang Dynasty` | `KangDynasty` (un seul mot, `entities.ts:75`) | Cosmétique mais révélateur de trois pipelines de vérité jamais réconciliés |

Le fichier `domain.ts` est en fait la version **la plus proche du disque** des trois registres — mais `entities.ts` existe en parallèle, actif dans le code de production (`src/apps/*`, `src/lib/tooling/adapters/*`), et il s'auto-qualifie de périmé sans qu'aucun ticket ne semble suivre sa mise à jour.

## Le premier geste qui casserait l'inertie

**Créer `mandates/_inventory/01_roles_inventory.md`** — le tout premier artefact que le sprint S1 de Green Lantern exige (`04_Business_Domains/01_RH_Meta_Gouvernance_GreenLantern_XMen/SPRINTS.md:32`), avec sa preuve de vérification déjà écrite dans la doctrine elle-même : `wc -l` ≥ 80 lignes, `grep -c "^| dormant"` = 8. C'est le geste le moins coûteux de tout le périmètre parce que la doctrine a déjà fait le travail de spécification — il ne manque que l'exécution du premier des 32 sprints en attente. Produire ce seul fichier ferait passer le ratio d'exécution de 0 % à un premier point de données réel, et donnerait au Council une base pour juger si le rock du mois est encore tenable — au lieu de neuf paquets non signés qui spéculent sur un état qu'aucun fait ne vient encore trancher.
