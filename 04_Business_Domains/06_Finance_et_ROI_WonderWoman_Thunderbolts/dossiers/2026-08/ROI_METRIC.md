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

## Le seuil de viabilité — nommé comme non résolu, pas inventé

Aucun seuil de viabilité chiffré n'existe dans `00_Summers_CEO/ROCKS.md`
ni ailleurs dans le corpus vérifié. Ce sprint ne peut pas en fabriquer
un sans device — un seuil inventé serait le même défaut qu'un coût
inventé en S1.

**Ce qui manque précisément pour en fixer un** : un coût de référence
non nul. Avec le coût d'infrastructure confirmé à 0 €/mois, la seule
base possible pour un seuil de viabilité réel est le **coût du temps
de l'architecte**, explicitement hors périmètre depuis S1 par choix
du capitaine, pas par oubli.

**Proposition non ratifiée, à valider ou rejeter par le capitaine** :
fixer le seuil au moment où le RARC couvrirait un taux horaire de
remplacement modeste (à définir) sur le temps effectivement engagé.
Tant que ce taux n'est pas fixé, tout seuil affiché ici serait une
invention déguisée en mesure — donc aucun n'est affiché.

## Ce que ce sprint établit malgré tout

Il n'a pas produit de seuil, mais il a produit une **métrique
mesurable et une méthode de calcul reproductible** (RARC), avec sa
source exacte et sa fréquence de revue. C'est un résultat vérifiable
au sens de `SPRINTS.md` : *« un résultat est vérifiable s'il porte un
nombre, un chemin de fichier, ou une commande »* — le RARC en porte
un ($2 520/an, avec son incertitude nommée), la méthode en porte un
(le champ `signé:` dans un chemin de fichier précis).

## Ce qui reste hors périmètre

- Le seuil de viabilité chiffré, faute d'un coût de temps fixé —
  voir ci-dessus.
- La résolution de l'écart PaaS année 1 / année 2 ($1 500/an vs
  $18 000/an) — à trancher par le capitaine avant tout usage du RARC
  dans une décision de prix ou d'investissement.
- L'affiliation, toujours non enregistrée (`002_ARCHITECTE_NIVEAU_ZERO.md`).
