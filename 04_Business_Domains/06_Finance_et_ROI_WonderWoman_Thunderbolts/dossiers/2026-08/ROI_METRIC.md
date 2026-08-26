# ROI_METRIC — Sprint 3, août 2026

> Domaine : Finance & ROI (Wonder Woman). Techniciens engagés :
> YelenaBelova (Forecasting) · RedGuardian (Reporting).
> Livrable exigé par `../../SPRINTS.md` S3 : une métrique de retour
> (formule explicite, source de données, fréquence de mesure) et un
> seuil de viabilité chiffré (valeur plancher au-dessus de laquelle
> l'offre est jugée rentable).

## La formule littérale dégénère, pour la même raison qu'en S2

ROI standard : **(Revenu − Coût complet) / Coût complet × 100**.

Avec le coût complet confirmé à 0 €/mois (`COST_MODEL.md`, S1), cette
formule est **mathématiquement indéfinie** — division par zéro, pas
un grand nombre. Ce n'est pas une variante du problème de S2 (où le
plancher dégénérait à 0), c'est le même problème vu depuis l'autre
côté de la fraction : un dénominateur nul rend le ratio inexploitable,
peu importe le numérateur.

**Conséquence assumée** : ce sprint n'utilise pas de ROI en
pourcentage. Il définit un **seuil de viabilité en valeur absolue** —
un montant de revenu, pas un ratio — parce qu'un ratio sur un
dénominateur nul ne peut mesurer aucun progrès.

## La métrique retenue

**Revenu Annuel Récurrent Confirmé (RARC)**, mesuré directement depuis
les accords-cadres signés.

```
RARC = somme des revenus annualisés de tous les Master Agreements
       portant une ligne signé: human:<id> dans 03_Master_Agreements/
```

**Source de données** : `00_Summers_CEO/03_Master_Agreements/*.md`,
champ `signé:`. Pas une estimation, pas une projection — uniquement ce
qui porte une signature réelle.

**Fréquence de mesure** : à chaque signature d'un nouveau Master
Agreement, et en revue mensuelle systématique le 1er de chaque mois
(alignée sur le cycle B2 de `SPRINTS.md`).

## Mesure actuelle — 2026-08-26

| Master Agreement | Ligne tarifaire annualisée | Statut |
|---|---|---|
| `001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md` — JaaS | $300/an | **Signé** (`human:Amadou`, 2026-08-24) |
| `001_...` — BaaS | $720/an + 25 % des bénéfices | Signé, mais bénéfices non mesurés — porté en RARC pour le forfait fixe seulement, la part variable n'est pas dans ce calcul |
| `001_...` — PaaS | $1 500/mois à partir de l'année 2, $1 500/an l'année 1 | Signé, prix année 1 utilisé (2026 est l'année 1 de l'engagement, daté 2024-03-11 — **à vérifier** : si l'ancienneté de l'engagement dépasse un an, le prix mensuel pourrait déjà s'appliquer, ce point n'est pas tranché ici) |
| `002_ARCHITECTE_NIVEAU_ZERO.md` | Aucune ligne tarifaire — position structurelle, pas une prestation facturée | Non signé, et de toute façon non chiffré |

**RARC confirmé = $300 (JaaS) + $720 (BaaS, forfait fixe) + $1 500
(PaaS, hypothèse année 1) = $2 520/an.**

Ce chiffre est **fragile** sur deux points nommés plutôt que masqués :
la part variable BaaS (25 % des bénéfices) n'est pas mesurée, et
l'année contractuelle de PaaS (1 vs 2) dépend d'une date de début
(2024-03-11) qui rendrait l'engagement plus vieux qu'un an — si c'est
le cas, le vrai chiffre PaaS serait $18 000/an ($1 500 × 12), pas
$1 500/an, et le RARC total serait $19 020/an, pas $2 520/an. **Cet
écart doit être tranché par le capitaine avant que ce chiffre serve à
une décision.**

## Le seuil de viabilité — fixé par le capitaine le 2026-08-26

Aucun seuil de viabilité chiffré n'existait dans `00_Summers_CEO/ROCKS.md`
ni ailleurs dans le corpus vérifié au moment de la publication initiale
de ce document. Le capitaine l'a fixé directement, en dehors du calcul
cout/temps envisagé ci-dessus — la voie retenue n'a pas eu besoin d'un
taux horaire de remplacement.

**Seuil : 100 nouveaux clients par mois, ni plus ni moins.** Au-delà,
liste d'attente. En deçà, l'offre reste ouverte mais n'est pas jugée
viable au sens de ce document.

### Le modèle par cohorte de tarification

La décision résout au passage l'écart nommé dans `PRICING.md` (« le
produit réel n'est pas à un seul prix ») : plancher, cible et haut ne
sont **pas trois prix simultanés du même tier**, mais un **prix de
cohorte selon le mois d'inscription** — un modèle de tarification
« vintage », standard en SaaS à forte croissance, qui récompense les
premiers inscrits :

| Cohorte (mois d'inscription) | Prix appliqué | Persiste au renouvellement ? |
|---|---|---|
| Août, Septembre 2026 | **Plancher $300/an** (prix de lancement) | **Oui** — conservé à vie pour ces cohortes, pas seulement en année 1 |
| Octobre, Novembre, Décembre 2026 | **Cible $420/an** | Oui, au même tarif que la cohorte |
| Liste d'attente / pré-inscriptions | **Haut $504/an** | Oui, au même tarif que la cohorte |

### Exemple travaillé — la cohorte d'août

```
100 clients x $300/an (plancher, prix de lancement)     = $30 000
- distribution d'affiliation (100 x $50/filleul JaaS)   =  $5 000
= bénéfice net de la cohorte d'août                      = $25 000
```

Le taux d'affiliation de $50/filleul n'est pas inventé pour ce calcul —
il correspond exactement au barème JaaS déjà présent dans le corpus
(domaine 01, palier de remboursement à 6 filleuls = $300). Les deux
chiffres du capitaine ($30 000 et $5 000) sont donc **cohérents avec
une doctrine antérieure**, pas une invention isolée.

### Une ambiguïté à noter, pas à trancher ici

Le JaaS étant un plan **annuel** ($300/an), les $30 000 de la cohorte
d'août représentent la valeur contractuelle annuelle ajoutée par cette
cohorte (encaissée à l'inscription), pas un revenu qui se reproduit
chaque mois à partir des mêmes 100 clients. Si un nouveau lot de 100
clients s'inscrit chaque mois au même rythme, le RARC cumulé croît
d'environ $25 000 de bénéfice net par mois de cohorte ajoutée — mais
ce n'est vérifiable qu'une fois plusieurs mois de cohortes réellement
inscrites, pas encore le cas au 2026-08-26 (RARC réel mesuré plus haut
= $2 520/an, sur 1 client signé, pas 100).

## Ce que ce sprint établit

Une **métrique mesurable et une méthode de calcul reproductible**
(RARC), avec sa source exacte et sa fréquence de revue, **et un seuil
de viabilité fixé par le capitaine** (100 clients/mois). C'est un
résultat vérifiable au sens de `SPRINTS.md` : *« un résultat est
vérifiable s'il porte un nombre, un chemin de fichier, ou une
commande »* — le RARC en porte un ($2 520/an, avec son incertitude
nommée), le seuil en porte un (100/mois, $25 000 net par cohorte
pleine), la méthode en porte un
(le champ `signé:` dans un chemin de fichier précis).

## Ce qui reste hors périmètre

- La résolution de l'écart PaaS année 1 / année 2 ($1 500/an vs
  $18 000/an) — à trancher par le capitaine avant tout usage du RARC
  dans une décision de prix ou d'investissement.
- La structure d'affiliation **coach-à-CEO** pour la phase White-Label
  (`002_ARCHITECTE_NIVEAU_ZERO.md`) reste non enregistrée — sans lien
  avec le taux $50/filleul JaaS utilisé ci-dessus, qui est un programme
  de parrainage candidat déjà documenté, pas la structure d'affiliation
  du pathway N0.
- Le RARC réel mesuré ($2 520/an) reste très inférieur au seuil de
  viabilité tel qu'illustré par la cohorte d'août ($25 000/mois net,
  à 100 clients) — l'écart entre 1 client signé et 100 clients/mois
  n'est pas comblé par ce document, seulement mesuré.
