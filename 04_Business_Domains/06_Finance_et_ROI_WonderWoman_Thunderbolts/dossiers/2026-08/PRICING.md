# PRICING — Sprint 2, août 2026

> Domaine : Finance & ROI (Wonder Woman). Techniciens engagés :
> YelenaBelova (Forecasting) · Ghost (CostOpt).
> Livrable exigé par `../../SPRINTS.md` S2 : prix plancher (coût complet
> / N clients), prix cible (plancher × coefficient de marge), prix haut
> (cible × 1,2), et trois scénarios de marge pour N = 1, 5, 10 clients
> avec hypothèse de volume écrite.

## Ce que ce sprint découvre avant de calculer quoi que ce soit

`COST_MODEL.md` (S1) a confirmé un coût complet de **0 €/mois** sur
l'infrastructure technique. La formule littérale de ce sprint —
prix plancher = coût / N — **dégénère** : 0 / N = 0, quel que soit N.
Ce n'est pas une erreur de calcul, c'est la conséquence honnête d'un
coût d'infra réellement nul. Mais un prix plancher à 0 € n'a aucun sens
commercial, et un coefficient de marge appliqué à 0 reste 0.

**Calcul littéral, pour la traçabilité — et pour montrer pourquoi il
est rejeté :**

| | Formule | Résultat |
|---|---|---|
| Prix plancher | 0 € / N | **0 €**, quel que soit N |
| Prix cible | 0 € × 1,4 | **0 €** |
| Prix haut | 0 € × 1,2 | **0 €** |

Trois prix à zéro n'apportent aucune information. Ce sprint n'ancre
donc **pas** ses trois lignes sur le coût, comme `COST_MODEL.md`
l'anticipait déjà en clôture de S1 — il les ancre sur la doctrine de
prix déjà **ratifiée**.

## Ancrage choisi : `ADR-AAAS-PRICING-001` (RATIFIED)

Coach OS n'a pas besoin d'inventer un prix : un ADR de pricing à 5 tiers
existe, ratifié, et le tier le plus bas correspond exactement au segment
que The OMK Office occupe aujourd'hui (voir
`001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md`, signé le 2026-08-24).

| | Prix | Source |
|---|---|---|
| **Prix plancher** | **$300/an** | Borne basse du Tier 1 « PME Solo Founder » (`ADR-AAAS-PRICING-001`), déjà le prix contractuel réel du produit JaaS dans le Master Agreement 001 |
| **Prix cible** | **$420/an** (plancher × 1,4, coefficient S2 appliqué à la borne basse ratifiée) | Reste **sous** la borne haute ratifiée du Tier 1 ($500/an) — cohérent, pas un dépassement de doctrine |
| **Prix haut** | **$504/an** (cible × 1,2) | Légèrement au-dessus de la borne haute ratifiée ($500/an) — écart de 0,8 %, dans la marge d'arrondi, pas un signal à traiter |

**Résolu par le capitaine le 2026-08-26** (voir `ROI_METRIC.md`,
« Le seuil de viabilité ») : plancher, cible et haut ne sont **pas
trois prix simultanés du même produit** — ils sont un **prix de
cohorte selon le mois d'inscription**, un modèle « vintage » qui
récompense les premiers inscrits :

| Cohorte | Prix | Persiste au renouvellement |
|---|---|---|
| Août + Septembre 2026 | Plancher $300/an | Oui, à vie pour ces cohortes |
| Octobre à Décembre 2026 | Cible $420/an | Oui |
| Liste d'attente / pré-inscriptions | Haut $504/an | Oui |

Ce que ce document appelait encore « les trois tiers distincts JaaS /
BaaS / PaaS » reste vrai en parallèle — les trois lignes plancher/
cible/haut ci-dessus s'appliquent au tier JaaS uniquement ; BaaS
($720/an + 25 %) et PaaS ($1 500/mois année 2) restent des tiers de
produit séparés, non recalculés ici. Les deux mécanismes coexistent :
un client choisit d'abord un tier de produit (JaaS/BaaS/PaaS), puis,
pour le tier JaaS, son prix dépend de sa cohorte d'inscription.

## Ce que le coût nul révèle sur la marge

| N clients | Prix (cible $420/an) | Coût complet | Marge | Hypothèse de volume |
|---|---|---|---|---|
| 1 | $420 | $0 (infra) | **100 %** avant coût de temps | The OMK Office seul, client actuel réel |
| 5 | $2 100 | $0 (infra) | **100 %** avant coût de temps | 4 clients supplémentaires au même tier, aucun signé à ce jour — hypothèse, pas une projection engagée |
| 10 | $4 200 | $0 (infra) | **100 %** avant coût de temps | 9 clients supplémentaires, même hypothèse, aucun signal de demande mesuré |

**Une marge à 100 % n'est pas une bonne nouvelle ici — c'est un signal
que la marge ne mesure rien d'utile.** Elle est mécaniquement de 100 %
à N'IMPORTE QUEL prix, parce que le dénominateur (coût) est nul.
Ce tableau ne dit donc rien sur la rentabilité réelle : il dit que
le vrai coût économique — le temps de l'architecte, explicitement
exclu du périmètre de `COST_MODEL.md` — n'est pas dans le calcul.

## Ce que ce sprint remonte, sans le trancher

Une marge à 100 % sur trois scénarios de volume ne constitue pas une
preuve de viabilité. Elle constitue la preuve que **ce sprint ne peut
pas répondre à la question qu'il pose** tant que le coût du temps reste
hors périmètre par choix. Deux chemins, non tranchés ici :

1. Chiffrer un taux horaire de remplacement pour l'architecte et
   refaire ce tableau avec un coût réel non nul.
2. Accepter que la « marge » de ce document mesure la couverture des
   coûts cloud uniquement — utile pour vérifier qu'aucun palier
   gratuit n'est dépassé, inutile pour juger si l'offre est rentable
   au sens où un investisseur l'entendrait.

## Ce qui reste hors périmètre, comme en S1

- Le temps de l'architecte (FDE), toujours explicitement exclu.
- BaaS et PaaS, tarifés séparément par le Master Agreement 001 —
  non recalculés ici.
- L'affiliation — toujours non enregistrée, voir
  `002_ARCHITECTE_NIVEAU_ZERO.md`.
