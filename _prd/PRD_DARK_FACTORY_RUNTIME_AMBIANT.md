# PRD — Dark Factory : runtime ambiant du Business OS

> Jumeau numérique de back-office. Les scripts exécutent, l'IA vérifie, le
> runtime se souvient. Aucun humain dans le chemin opérationnel ; l'humain
> tranche ce qui l'engage.

**Version** 1.0 · **Date** 2026-08-22 · **Propriétaire** Summers (B1)
**Statut** proposition, non tamponnée

---

## 0. La thèse, en une page

Trois résultats mesurés fondent l'architecture. Ils ne sont pas décoratifs :
chacun ferme une option de conception.

**Un script à base de règles a battu la majorité des LLM de pointe** sur
CEO-Bench (arXiv 2606.18543). Conséquence directe : **le chemin opérationnel
est scripté**. On ne demande pas à un modèle de décider ce qu'une règle décide
mieux, moins cher et de façon reproductible.

**Envelopper un modèle de tête dans un harnais de code réputé l'a rendu moins
performant.** Conséquence : **le harnais doit être mesuré, pas supposé**. Toute
couche d'orchestration ajoutée doit prouver qu'elle améliore un delta
observable, sinon elle est retirée.

**Les agents qui réussissent explorent activement et ciblent finement** — 90 %
des dépenses de développement sur des segments nommés contre 43 % pour les
faibles ; la préservation passive de trésorerie est un comportement perdant.
Conséquence : **l'IA est affectée là où l'exploration paie** — inférer la
structure cachée d'un marché bruité, écrire du code qui simule le futur — pas
à exécuter des routines.

D'où la répartition qui gouverne tout le document :

| Chemin | Qui | Pourquoi |
|---|---|---|
| **Opérationnel** | scripts, API, webhooks, cron | reproductible, gratuit, auditable |
| **Vérification** | IA, appelée par événement | juge un delta, ne produit pas la routine |
| **Exploration** | IA, budget explicite | seule capacité que le script n'a pas |
| **Arbitrage** | humain | ce qui engage juridiquement ou stratégiquement |

**Lights-out ne signifie pas « l'IA dirige ».** Lights-out signifie *l'usine
tourne sans opérateur dans la boucle*. L'IA y est un instrument de mesure et
un explorateur, pas un contremaître.

---

## 1. Problème

Le Business OS existe en doctrine et n'existe pas en exécution.

- **423 concepts produits, 230 relus** par machine, aucun tamponné humain.
- **Zéro agent B1/B2/B3** dans le runtime vivant (mesure Multica 2026-08-21 :
  57 agents, aucun de la couche B).
- **Le portail client `00_Summers_CEO/03_Master_Agreements/` est vide** depuis
  sa création le 2026-08-02.
- **Trois squads sur huit** n'ont jamais eu un seul agent B3.
- Le graphe RDF et la distillation OKF **ne se citent pas** : deux formats de
  triplets coexistent, la distillation n'en lit qu'un.

Le goulot n'est ni la production de doctrine ni la puissance des modèles.
**C'est l'absence d'un substrat qui exécute et qui se souvient.**

## 2. Non-objectifs

Ce qui est explicitement hors périmètre, pour que le MVP soit atteignable :

- Aucune autonomie décisionnelle sur ce qui engage juridiquement ou
  financièrement. Le veto reste humain.
- Aucun framework d'agents. On construit un **kernel**, pas une bibliothèque.
- Aucune migration du corpus OKF existant. Le runtime le lit, ne le réécrit pas.
- Aucun objectif de revenu dans ce document. Le PRD livre un substrat, pas un
  chiffre d'affaires.
- Aucun modèle propriétaire obligatoire. Le runtime doit tourner sur modèle
  ouvert local pour ses tâches de vérification.

---

## 3. Architecture : événements, pas graphe

### 3.1 Pourquoi l'événement bat l'arête

Un graphe impose de maintenir des arêtes : ajouter un domaine oblige à recâbler
ses voisins. Un bus d'événements ne le demande pas — un agent **s'abonne**, et
l'émetteur ignore qui l'écoute. Pour huit domaines qui doivent pouvoir dormir,
se réveiller et se coupler par paires, c'est la seule topologie qui ne coûte
pas un recâblage à chaque transition d'état.

C'est aussi ce qui rend la dormance implémentable : **un domaine dormant est un
domaine dont aucun abonnement ne se déclenche.** Pas de cas particulier, pas de
drapeau — une propriété émergente du bus.

### 3.2 Les cinq pièces du kernel

Chaque pièce répond à une panne concrète, pas à une élégance.

```
événement ordinaire
  -> événement typé            (20 % des événements revenaient malformés)
  -> journal immuable          (une note perdue, rien ne doit se perdre)
  -> file d'attente            (un brief posté deux fois, compter les tentatives)
  -> tentative d'agent
       -> appels d'outils typés
       -> artefacts adressés par contenu   (un prompt édité, non versionné, irrécupérable)
       -> événements émis
  -> connecteurs
  -> monde extérieur
```

**Journal immuable et causal.** Rien n'est écrasé. Chaque événement porte
l'identifiant de celui qui l'a déclenché. C'est ce qui rend un post-mortem
possible sans reconstituer une session de chat.

**File d'attente qui compte les tentatives.** Un doublon devient un compteur,
pas un second effet de bord.

**Artefacts adressés par contenu.** Chaque morceau de prompt — message système,
description de compétence, définition d'outil, question — est haché et stocké
séparément. Un prompt est **une liste de hachages**, pas une chaîne rendue.
Deux conséquences opérationnelles : on obtient le *diff* exact entre deux
exécutions, et on peut **rejouer** une requête contre un autre modèle en
reconstruisant depuis le graphe.

C'est la pièce qui rend le lights-out auditable. Une session interactive ne
montre pas ce que le modèle a réellement vu — pas avec compaction et
raisonnement non partagé. Le contenu adressé, si.

**Frontières typées.** Appels d'outils typés et événements typés. Non
négociable : c'est la mesure qui a fait tomber le taux de rejet.

### 3.3 Ce qu'est un agent

Un fichier Markdown déposé dans un dossier. Frontmatter déclarant : les
événements acceptés, les outils autorisés, les événements publiés, le cadencier.

**Conséquence organisationnelle décisive** : ajouter un VP ou un technicien ne
demande pas d'écrire du code. Un capitaine B2 peut décrire son propre agent.
C'est ce qui rend la franchise possible — un franchisé reçoit des fichiers, pas
un dépôt à compiler.

---

## 4. La hiérarchie E-Myth portée par le runtime

Trois rangs, trois horizons, trois natures d'artefact. Le runtime ne les
invente pas : il les rend exécutables.

| Rang | Qui | Horizon | Artefact | Discipline |
|---|---|---|---|---|
| **B1** | Summers, CEO visionnaire | 12WY (12 semaines) | `ROCKS.md` — 3 rocks par cycle | CEO-Bench |
| **B2** | 8 VP, champions DC | mois → 4 sprints | `SPRINTS.md` + specs | Spec-Loop |
| **B3** | squads Marvel | sprint → JTBD | `SCRUMS.md`, exécution | scripts + gates |

### 4.1 B1 — le CEO vacciné par CEO-Bench

Summers ne pilote pas l'exécution. Il pose **trois rocks par cycle de 12
semaines**, chacun formulé comme un *résultat au passé, vérifiable par requête*.

Les quatre disciplines qu'il hérite du banc d'essai, et **seulement** celles-là,
parce que ce sont les seules mesurées :

| Discipline | Mesure d'origine | Traduction runtime |
|---|---|---|
| **Ciblage fin** | 90 % vs 43 % des dépenses sur segments nommés | tout budget engagé porte un `segment_id` ; un engagement sans segment est rejeté à la frontière typée |
| **Exploration active** | la préservation passive perd | un budget d'exploration est **réservé** par cycle et son non-usage est un défaut journalisé, pas une économie |
| **Code pour prévoir** | les meilleurs écrivent des scripts qui simulent le futur | chaque rock porte une requête de prévision exécutable, rejouée chaque semaine |
| **Cohérence dans la durée** | la réussite tient à l'intégration, pas à la capacité brute | le journal causal est la mémoire ; un rock qui ne cite pas l'événement qui l'a motivé est incomplet |

**Ce qui n'est PAS repris**, et pourquoi : les « 11 composants », le fichier
mémoire de 150 lignes, la densité de cinq `if-then`, la bascule sous deux mois
de burn. Aucun n'apparaît dans le dépôt ni dans l'article. Le dernier est même
**l'inverse** de la mesure — la préservation passive est le comportement des
agents perdants. Ces règles peuvent être bonnes ; elles sont **de conception**,
et doivent être déclarées comme telles, non attribuées au banc d'essai.

### 4.2 B2 — les 8 VP, planificateurs sous Spec-Loop

Spec-Loop tient en une phrase : *écrire la prochaine petite spec, la relire,
l'implémenter avec des tests ; garder la spec locale à l'étape suivante.* Il se
tient entre deux échecs — le *vibecoding* (peu de spec, gros diff) et le
waterfall (sur-spécification bloquante ou ignorée).

C'est exactement le format d'un sprint de VP. Un VP ne rédige pas la doctrine du
trimestre : il écrit **la spec de la semaine**, la fait relire par son pair, et
la donne à exécuter.

| # | Domaine V3 | VP (DC) | Squad (Marvel) | Objet de spec |
|---|---|---|---|---|
| 01 | **RH & Meta Gouvernance** | Green Lantern | X-Men | mandats de rôle, canal Forge |
| 02 | **Operations en Loops** | Batman | Fantastic Four | portiques, conditions d'arrêt |
| 03 | **Product & Growth** | Flash | Avengers | offre reproductible, critères d'acceptation, croissance produit |
| 04 | **Sales & Cognition** | Martian Manhunter | Illuminati | qualification, non-forçage |
| 05 | **People & Acquisition** | Superman | Gardiens | promesses publiques, preuves datées, acquisition |
| 06 | **Finance & ROI** | Wonder Woman | Thunderbolts | coût complet, marge, retour |
| 07 | **R&D & IT** | Cyborg | Kang Dynasty | environnements reproductibles |
| 08 | **Legal & Compliance** | Aquaman | Eternals | périmètre écrit, défendabilité |

### 4.4 La rotation des titres V2 → V3

Il n'y a **aucune collision** de nommage. Il y a une rotation, et la lire comme
un conflit est une erreur d'archéologie. Le mouvement est en chaîne :

```
V2                              V3
Green Lantern = People    -->   RH & Meta Gouvernance   (libère « People »)
Superman      = Growth    -->   People & Acquisition    (libère « Growth »)
Flash         = Product   -->   Product & Growth        (reprend « Growth »)
```

Chaque titre libéré est repris par le domaine suivant. Les noms de dossiers sur
disque sont **déjà à jour** — `01_RH_Meta_Gouvernance_GreenLantern_XMen`,
`05_People_et_Brand_Superman_Guardians`,
`03_Productization_des_Besoins_Flash_Avengers`. Les numéros 01 à 08 sont
uniques et non ambigus.

**Ce qui est en retard, c'est le graphe RDF**, resté sur la nomenclature V2 :
`growth-domain instantiates superman-owner` décrit la V2. Ce n'est pas une
décision à prendre, c'est une mise à jour à appliquer — l'identité fait foi
côté dossiers, le graphe suit.

**Flash possède Product & Growth.** Le triplet `instantiates` manquant et le
doublon d'URI Avengers sont des défauts de graphe, pas une question ouverte
d'attribution. Le runtime s'abonne sur l'identifiant de dossier, qui est net.

### 4.3 B3 — les squads, exécution scriptée sous gates

Un technicien B3 **n'improvise pas**. Il reçoit un JTBD dont la définition de
fin est une **porte exécutable** : une commande, une sortie attendue, une preuve.

C'est la discipline `unlazy` : écrire le registre d'acceptation **avant** le
travail, exécuter des vérifications approuvées, revérifier le travail rendu, et
ne rapporter que ce que la preuve soutient.

```
GATE: <identifiant>
CHECK: <commande>
EXPECT: <motif attendu>
EVIDENCE: <sortie décisive, datée>
```

Une porte sans preuve courante n'est pas franchie. Un « Done » sans artefact
observable est refusé par le kernel, pas par un humain.

---

## 5. La mémoire du runtime

C'est la pièce que le briefing initial situait au bon endroit avec les mauvais
paramètres. Voici ce qu'elle est réellement, dérivé de ce qui est mesuré.

### 5.1 Trois mémoires, trois durées

| Mémoire | Support | Durée | Qui écrit |
|---|---|---|---|
| **Événementielle** | journal immuable, causal | permanente | le kernel |
| **Opérationnelle** | tables SQL (ledger, pipeline, issues…) | courante | les scripts |
| **Doctrinale** | bundle OKF, concepts | longue | humain + agents, avec `verified` |

**Règle de vérité** : un état non requêtable n'existe pas. Une réunion commence
par une requête et se termine par l'enregistrement d'un delta.

**Règle de confiance** : le niveau se lit dans `verified`. Absent = non vérifié.
Acteurs machine seuls = confirmé par machine. Au moins un `human:` = revu par un
humain. **Aucun script ne peut poser le tampon humain.**

### 5.2 Ce qui protège la mémoire de la compaction

Le risque n'est pas théorique : une session compactée en milieu de tâche perd le
travail sans le signaler.

- Interdiction de compacter en milieu de tâche.
- Point de contrôle obligatoire avant compaction : écriture des deltas en SQL.
- Le journal causal étant hors contexte, il survit à toute compaction. **C'est
  lui la mémoire, pas la fenêtre.**

---

## 6. D.E.A.L — la cadence

Quatre phases. Chacune n'ouvre que si la précédente a franchi ses portes.

| Phase | Objet | Porte de sortie |
|---|---|---|
| **D — Distribution** | le canal produit des événements réels | ≥1 événement client authentique traversant le bus, journalisé |
| **E — Execution** | le parcours complet est exécuté une fois | condition d'entrée, condition d'arrêt, preuve de sortie |
| **A — Agency** | les VP tiennent leur cadence sans relance | 4 sprints consécutifs avec specs relues et portes franchies |
| **L — Lights-out** | l'usine tourne sans opérateur | 1 cycle complet sans intervention humaine hors arbitrage |

**Le lights-out est la dernière phase, pas la première.** Le tenter avant que
D, E et A soient franchies, c'est reproduire l'expérience du banc : un agent
autonome qui fait faillite parce que rien ne l'a d'abord rendu reproductible.

---

## 7. MVP — ce qui est livré d'abord

Le plus petit ensemble qui produise un événement réel de bout en bout.

### 7.1 Périmètre

**Un seul domaine** : `Legal / Aquaman / Eternals`. Choisi parce que sa doctrine
de dormance est la seule sourcée par triplet, que son déclencheur est net — un
fichier déposé dans `03_Master_Agreements/` — et qu'il n'a rien produit, donc
rien à casser.

**Un seul flux** :

```
fichier déposé dans 03_Master_Agreements/
  -> connecteur système de fichiers
  -> événement typé  contract.master_agreement.received
  -> agent aquaman-intake (markdown)
  -> événement  legal.scope.needs_review
  -> porte exécutable : le périmètre écrit existe-t-il ?
  -> événement  legal.gate.LEGAL_READY | legal.gate.BLOCKED_RISK
  -> connecteur notification
```

**Trois agents markdown** : `aquaman-intake`, `aquaman-scope-check`,
`aquaman-gate`. Aucun code applicatif : des fichiers.

**Quatre schémas d'événements** en JSON.

### 7.2 Hors MVP

Les sept autres domaines. Les squads B3. Le multi-tenant. La franchise. Les
modèles locaux. Tout cela vient après une preuve de bout en bout.

### 7.3 Rien ne bloque le MVP

Aucun prérequis n'arrête le démarrage. L'identité des huit domaines est fixée
par les noms de dossiers (§4.4) et le MVP ne touche qu'à Aquaman, dont le
numéro, le titre et le déclencheur sont nets.

Trois travaux courent **en parallèle** du MVP, sans le conditionner :

| Travail | Nature | Bloque le MVP ? |
|---|---|---|
| Aligner le graphe RDF sur la nomenclature V3 | mise à jour mécanique | **non** — le runtime s'abonne sur l'identifiant de dossier |
| Ajouter `flash-owner` et dédoublonner l'URI Avengers | correction de graphe | **non** — hors périmètre du domaine MVP |
| Signer les paquets du journal Council | acte du capitaine | **non pour Aquaman** — son état dormant est déjà porté par son `VP_AGENT.md` ligne 53 |

Chemin du journal, pour la signature :

```
30_Business_OS/10_Projects/coach-os/04_Business_Domains/B2_DC_DIRECTION_COUNCIL_DECISIONS.md
```

**Pourquoi cette section a été réécrite.** Sa première version érigeait ces
trois travaux en prérequis bloquants. C'était appliquer la préservation passive
— précisément le comportement que CEO-Bench identifie comme perdant, dans un
document qui cite cette mesure. Un travail parallélisable qu'on déclare bloquant
transforme une question de dix secondes en arrêt de chantier. La règle en sort :
**un prérequis n'est bloquant que si le MVP échoue sans lui.** Les trois ci-dessus
ne le sont pas.

---

## 8. Portes d'acceptation du MVP

Registre au format `unlazy`. Écrit **avant** le travail. Aucune n'est
subjective ; chacune est une commande dont la sortie décide.

```
GATE: G1-kernel-vivant
CHECK: zeta ps
EXPECT: running
EVIDENCE:

GATE: G2-evenement-type-rejette-le-malforme
CHECK: zeta run --event contract.master_agreement.received --payload '{"bad":true}'
EXPECT: schema validation failed
EVIDENCE:

GATE: G3-journal-causal-complet
CHECK: zeta traces log --last 1 --format json
EXPECT: "caused_by"
EVIDENCE:

GATE: G4-rejouabilite
CHECK: zeta traces replay --last 1 --model <autre-modele>
EXPECT: rebuilt from graph
EVIDENCE:

GATE: G5-bout-en-bout
CHECK: touch 03_Master_Agreements/contrat-test.pdf && sleep 30 && zeta traces log --grep legal.gate
EXPECT: legal.gate.(LEGAL_READY|BLOCKED_RISK)
EVIDENCE:

GATE: G6-dormance-est-silence
CHECK: zeta ps --agent aquaman-intake --since 24h
EXPECT: 0 activations
EVIDENCE:

GATE: G7-le-harnais-aide
CHECK: <script de comparaison : même tâche avec et sans harnais>
EXPECT: delta >= 0
EVIDENCE:
```

**G7 est la porte la plus importante du document.** Le banc d'essai a mesuré
qu'un harnais peut dégrader un bon modèle. Si le runtime n'améliore pas un delta
observable, il doit être retiré, pas défendu.

---

## 9. Anti-pièges

**Ne pas confondre un banc d'essai et une méthode.** CEO-Bench classe des
agents. Il ne prescrit rien. Toute règle qui en dérive est une conception, à
assumer comme telle.

**Ne pas citer « CEO-Bench » sans numéro d'arXiv.** Deux papiers homonymes :
2606.18543 (Princeton, simulation 500 jours) et 2606.17459 (MBZUAI/Yale,
réallocation de ressources). Sans rapport.

**Ne pas laisser l'IA dans le chemin opérationnel.** Chaque fois qu'une routine
est confiée à un modèle alors qu'une règle suffit, on paie plus cher pour un
résultat moins reproductible, et on perd l'auditabilité.

**Ne pas construire avant d'avoir un événement réel.** L'ordre est : un
événement authentique traverse le bus, puis on élargit. L'inverse produit une
usine sans matière.

**Ne pas tamponner à la place de l'humain.** Aucun agent n'écrit dans
`verified`. C'est le seul verrou qu'aucun script ne peut poser.

---

## 10. Ce que ce document n'a pas tranché

Honnêtement listé, pour qu'on ne le découvre pas en implémentant :

- Le choix du runtime : adopter Zeta tel quel, s'en inspirer, ou écrire le
  kernel. Zeta est Apache-2.0, son CI est marqué *failing* et sa version est
  `0.10.1` — donc un socle jeune. À évaluer sur pièce.
- Le format des événements entre le graphe RDF Turtle et les triplets JSONL :
  deux formats coexistent, il faut en élire un.
- Le rattachement des rocks à la cascade A1/A2/A3, aujourd'hui « non disponible
  dans les sources consultées » dans `ROCKS.md`.
- L'effectif réel des squads. Le canon dit 7 pour les Eternals, le dossier OMK
  dit 4 charges, le disque dit 0 fichier.
