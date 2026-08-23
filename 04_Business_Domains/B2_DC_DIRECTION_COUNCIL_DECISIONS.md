# B2_DC_DIRECTION_COUNCIL_DECISIONS

> Journal du **B2 DC Direction Council**. Un fichier, append-only, une entrée par
> décision. C'est l'artefact que la condition 3 de
> `70_Onthologies/pulse/b2/b2-areas-dormants-doctrine.md` exige — sans lui, un
> capitaine n'est pas dormant, il est **absent**.
>
> Amont : `../00_Summers_CEO/ROCKS.md` · Aval : `<domaine>/SPRINTS.md`

---

## Comment on signe

Une entrée sans ligne `signé:` renseignée **ne compte pas**. Le Council ne peut
pas distinguer un paquet préparé d'un paquet acté ; la signature est la seule
différence.

La doctrine réserve cet acte au capitaine du domaine (§ *Anti-pièges*, « Dormance
imposée par B1 ») :

> *« B1 ne peut pas déclarer dormant un domaine B2 sans l'accord du captain.
> La dormance est un acte du captain, pas une décision B1 — B1 peut *demander*
> la dormance, pas l'imposer. »*

Format d'un paquet :

```
decision: <dormant | actif | en_attente | reveil>
domaine:  <NN_Nom_Du_Dossier>
capitaine: <champion DC>
date:     <AAAA-MM-JJ>
motif:    <une phrase, vérifiable>
signé:    <human:id>        # vide = non acté
```

Les trois conditions cumulatives de la dormance, pour mémoire. **Un domaine qui
en manque une seule n'est pas dormant — il est en attente, et le capitaine doit
produire.**

1. Aucune ressource externe ne requiert sa doctrine.
2. Son DoD est vide pour le cycle courant.
3. Le capitaine a consigné l'état ici.

---

## Entrée 000 — 2026-08-02 · Le fait fondateur

*L'entrée la plus ancienne du journal. Elle date d'avant le journal lui-même :
elle consigne ce qui était déjà vrai quand il n'existait pas.*

Deux absences simultanées ouvrent l'histoire de cette roue.

**Le portail client n'a jamais reçu de contrat.**
`../00_Summers_CEO/03_Master_Agreements/` a été créé le **2026-08-02 à 13:42** et
ne contient depuis qu'un `README.md`. C'est le déclencheur canonique du domaine
Legal (triplet 36) : *« Le domaine Legal & Compliance ne s'active qu'au premier
fichier déposé dans `00_Summers_CEO/03_Master_Agreements/`. »* Il n'a jamais été
franchi.

**Ce journal n'existait pas.**
De la création du portail au **2026-08-21**, soit dix-neuf jours, aucun fichier
`B2_DC_DIRECTION_COUNCIL_DECISIONS.md` n'existait — ni dans `ASpace_OS_V3`, ni
dans `ASpace_OS_V2`. La condition 3 était donc structurellement impossible à
remplir. Aucun capitaine ne pouvait être dormant, faute de lieu où le déclarer.

**Conséquence, énoncée par la doctrine elle-même :**

> *« Sans cette ligne, le captain est en absence, pas en dormance. L'absence est
> un défaut opérationnel ; la dormance est un acte documenté. »*

Pendant dix-neuf jours, les huit capitaines ont donc été en **absence**, sans
qu'aucun d'eux ait démérité : le dispositif ne leur offrait pas la possibilité
matérielle d'être dormants. Ce n'est pas une faute de capitaine, c'est un trou
d'outillage. La présente entrée le ferme.

```
decision:  fait_fondateur
domaine:   (les huit)
capitaine: (Council)
date:      2026-08-02
motif:     Portail 03_Master_Agreements/ créé vide le 2026-08-02 13:42 ; journal Council inexistant jusqu'au 2026-08-21. Condition 3 impossible à remplir : absence structurelle, non imputable aux capitaines.
signé:
```

---

## Entrée 001 — 2026-08-02 · Le rock du cycle descend sur sept domaines

*Second fait le plus ancien, et il contredit l'hypothèse de dormance générale.*

`../00_Summers_CEO/ROCKS.md` porte un rock actif pour le cycle **2026-08** :

> *« À la fin du mois, une première offre Coach OS a été rendue démontrable,
> livrable et pilotable de bout en bout sans dépendre d'une personne nommée,
> avec une preuve vérifiable pour chacun de ces trois critères. »*

Mesure du 2026-08-21 : **sept `SPRINTS.md` sur huit portent une ligne « rock
hérité » remplie.** Seul Legal conserve le gabarit `<recopier ici…>`.

Un rock hérité rempli **invalide la condition 2**. Les sept domaines concernés ne
sont donc pas éligibles à la dormance : ils ont une cause de travail, reçue de
Summers, non close à ce jour.

```
decision:  constat
domaine:   (sept sur huit)
capitaine: (Council)
date:      2026-08-02
motif:     Rock CEO 2026-08 hérité et rempli dans 7 SPRINTS.md sur 8. Condition 2 (DoD vide) non remplie pour ces sept. Seul 08_Legal conserve le gabarit vide.
signé:
```

---

# Paquets à trancher — cycle 2026-08

*Huit entrées préparées, **aucune signée**. L'évaluation des conditions 1 et 2
est mesurée sur disque au 2026-08-21 ; la condition 3 se remplit par la signature
elle-même.*

*La ligne `decision:` de chaque paquet est laissée **vide** quand la mesure
contredit la dormance. Ne pas y écrire `dormant` sans lever le motif signalé —
la doctrine impose au Council de refuser une dormance non étayée.*

---

## 002 · 01_RH_Meta_Gouvernance_GreenLantern_XMen

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine (handoff queue B1 non instrumentée) |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« Chaque rôle nécessaire à l'offre a un mandat écrit, un titulaire
désigné et un critère de sortie vérifiable. »*

Réserve de doctrine : People ne peut pas s'auto-déclarer dormant face à une
vacance `NEEDS_OWNER` — cela paralyserait les recrutements. Le couplage
People × IT (canal Forge) ne dort jamais.

```
decision:
domaine:   01_RH_Meta_Gouvernance_GreenLantern_XMen
capitaine: Green Lantern
date:      2026-08-21
motif:
signé:
```

---

## 003 · 02_Operations_en_Loops_Batman_Fantastic4

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« Le parcours complet de livraison de l'offre a été exécuté une
fois, avec une condition d'entrée, une condition d'arrêt et une preuve de
sortie. »*

```
decision:
domaine:   02_Operations_en_Loops_Batman_Fantastic4
capitaine: Batman
date:      2026-08-21
motif:
signé:
```

---

## 004 · 03_Productization_des_Besoins_Flash_Avengers

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« L'offre est spécifiée comme un produit reproductible dont la
promesse, les entrées, les sorties et les critères d'acceptation ne dépendent
d'aucune personne nommée. »*

⚠ **Défaut de graphe à lever avant signature.** Dans les fichiers Turtle,
`product-domain` n'a **aucun** triplet `instantiates` : c'est le seul domaine
sans propriétaire déclaré (il n'existe pas de `flash-owner`). Par ailleurs la
squad apparaît sous deux URI distinctes, `entity:the-avengers` et
`entity:avengers`. Un paquet signé ici s'appuierait sur un rattachement absent.

```
decision:
domaine:   03_Productization_des_Besoins_Flash_Avengers
capitaine: Flash
date:      2026-08-21
motif:
signé:
```

---

## 005 · 04_Sales_et_Cognition_MartianManhunter_Illuminati

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« Au moins un problème client a été reformulé et validé par le
client, puis relié explicitement à la promesse de l'offre. »*

Réserve de doctrine : Sales n'a pas d'état dormant canonique par triplet. L'état
applicable serait `NON_FORCED` — pas d'écriture faute de matière amont, veto
catalogue maintenu actif. **`NON_FORCED` est une extrapolation, pas un triplet
sourcé** : à acter comme tel si retenu.

```
decision:
domaine:   04_Sales_et_Cognition_MartianManhunter_Illuminati
capitaine: Martian Manhunter (John Jones)
date:      2026-08-21
motif:
signé:
```

---

## 006 · 05_People_et_Brand_Superman_Guardians

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« Une démonstration de l'offre expose une promesse strictement
conforme à ce que la delivery a effectivement prouvé. »*

⚠ **Collision de nommage à trancher.** Le dossier s'intitule
`05_People_et_Brand_Superman_Guardians`, mais le graphe RDF déclare
`growth-domain instantiates superman-owner`, et la matrice des huit domaines
attribue **Growth** à Superman et **People** à Green Lantern (dossier 01). Deux
dossiers revendiquent donc « People ». Le nom de dossier est l'outlier.

```
decision:
domaine:   05_People_et_Brand_Superman_Guardians
capitaine: Superman
date:      2026-08-21
motif:
signé:
```

---

## 007 · 06_Finance_et_ROI_WonderWoman_Thunderbolts

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« Le coût complet, le prix, la marge cible et la métrique de
retour de l'offre sont chiffrés et vérifiables. »*

```
decision:
domaine:   06_Finance_et_ROI_WonderWoman_Thunderbolts
capitaine: Wonder Woman
date:      2026-08-21
motif:
signé:
```

---

## 008 · 07_RD_et_IT_Cyborg_KangDynasty

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | à confirmer par le capitaine |
| 2 · DoD vide | ❌ **non** — rock hérité rempli |
| 3 · consigné ici | en attente de signature |

Rock hérité : *« L'environnement nécessaire à la démonstration et à la livraison
est reproductible, observable et assorti d'un chemin de sortie documenté. »*

Réserve de doctrine : le couplage People × IT (compétences L0 du canal Forge,
triplets 37 et 55) ne dort jamais, même si IT se déclarait dormant par ailleurs.

```
decision:
domaine:   07_RD_et_IT_Cyborg_KangDynasty
capitaine: Cyborg
date:      2026-08-21
motif:
signé:
```

---

## 009 · 08_Legal_et_Compliance_Aquaman_Eternals

**Seul domaine dont les trois conditions convergent vers la dormance.**

| Condition | Mesure au 2026-08-21 |
|---|---|
| 1 · aucune ressource externe | ✅ **oui** — `03_Master_Agreements/` ne contient qu'un `README.md`, aucun contrat signé |
| 2 · DoD vide | ✅ **oui** — `SPRINTS.md` conserve le gabarit `<recopier ici…>`, aucun rock hérité |
| 3 · consigné ici | en attente de signature |

`VP_AGENT.md` du domaine porte déjà, ligne 53 : *« Ce domaine est **dormant**. Il
ne produit rien, et c'est volontaire : un domaine dormant qui produit de la
doctrine est un coût sans contrepartie. »* Déclencheur nommé ligne 55 : le
premier fichier déposé dans `00_Summers_CEO/03_Master_Agreements/`.

⚠ **Point de doctrine à trancher.** Le corps de
`b2-areas-dormants-doctrine.md` désigne **ce journal** comme lieu de la condition
3 ; son tableau d'exemple (ligne 135) coche pourtant la même condition en citant
`VP_AGENT.md`. Deux artefacts pour une condition. Signer ici lève l'ambiguïté au
profit du journal — et rend le tableau de la doctrine à corriger.

Trajectoire prévue au réveil : `DORMANT → SHADOW_ACTIVE → ACTIVE`. Le passage à
`ACTIVE` exige la matérialisation effective de la squad Eternals (7 agents
recommandés, planifiée à `T-30j`). En `SHADOW_ACTIVE`, une squad non matérialisée
est l'état attendu.

```
decision:  dormant
domaine:   08_Legal_et_Compliance_Aquaman_Eternals
capitaine: Aquaman
date:      2026-08-21
motif:     Aucun contrat dans 00_Summers_CEO/03_Master_Agreements/ ; aucun rock hérité pour le cycle 2026-08. Produire serait un coût sans contrepartie.
signé:
```

---

# Ce que ce journal ne dit pas

Trois limites, posées pour qu'on ne les découvre pas plus tard.

**La condition 1 n'est pas mesurable en l'état.** Elle suppose une *handoff
queue* B1 interrogeable. Il n'en existe pas sur disque. Les huit lignes portent
donc « à confirmer par le capitaine » — c'est un jugement humain, pas une mesure.

**La généralisation de la doctrine Aquaman aux sept autres domaines est une
projection.** La note de confiance de `b2-areas-dormants-doctrine.md` le dit
elle-même : *« seul Legal a un triplet dormant explicite. »* Les trajectoires
détaillées de Green Lantern (`DORMANT / EN_ATTENTE / ACTIF`) et le `NON_FORCED`
de Sales sont cohérents mais non sourcés sur un triplet.

**Un domaine dormant qui ne se réveille jamais est mort, pas dormant.** La
doctrine impose alors soit un Rock de veille, soit une escalade B1 pour
dissolution. Le compteur court à partir de la première signature portée ici.
