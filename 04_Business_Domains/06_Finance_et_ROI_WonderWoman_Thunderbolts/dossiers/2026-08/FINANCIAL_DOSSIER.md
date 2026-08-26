# FINANCIAL_DOSSIER — Sprint 4, août 2026

> Domaine : Finance & ROI (Wonder Woman). Technicien engagé :
> RedGuardian (Reporting). Livrable exigé par `../../SPRINTS.md` S4 :
> consolidation coût + prix + marge + ROI en ≤ 2 pages, lisible sans
> ouvrir les fichiers sources.
>
> Ce dossier résume `COST_MODEL.md`, `PRICING.md`, `ROI_METRIC.md` —
> il ne remplace aucun des trois, il permet de ne pas les rouvrir pour
> une lecture rapide.

## Coût — 0 €/mois

Les 8 postes d'infrastructure de Coach OS sont tous à zéro. Vercel,
Supabase, Render, Octopus Deploy tournent sur palier gratuit. MiniMax
($50/mois) a été résilié le 2026-08-26. OpenRouter est revenu à zéro
non par manque d'usage mais par **purge complète des 13 clés du
compte** — conséquence : le harnais Ori n'a plus d'identifiant valide
tant qu'`ori login` n'en régénère pas un.

**Ce que ce zéro veut dire** : le coût n'est pas structurellement nul,
il est différé au premier dépassement de palier gratuit, sans date ni
seuil encore chiffrés. Le temps de l'architecte reste explicitement
hors périmètre de ce coût.

## Prix — cohortes, pas un prix unique

Trois lignes ancrées sur `ADR-AAAS-PRICING-001` (RATIFIED), appliquées
en **prix vintage par mois d'inscription**, pas en tiers simultanés :

| Cohorte | Prix | À vie au renouvellement |
|---|---|---|
| Août + Septembre 2026 | $300/an (plancher) | Oui |
| Octobre → Décembre 2026 | $420/an (cible) | Oui |
| Liste d'attente | $504/an (haut) | Oui |

Le tier JaaS est distinct des tiers BaaS ($720/an + 25 % de bénéfices)
et PaaS ($1 500/mois année 2), déjà signés au Master Agreement 001 et
non recalculés par ce modèle de cohorte.

## Marge — 100 %, et pourquoi ce chiffre ne veut rien dire seul

Avec un coût d'infrastructure nul, la marge sur n'importe quel prix
est mécaniquement de 100 %, à N = 1, 5 ou 10 clients. **Ce n'est pas
une preuve de rentabilité** — c'est la conséquence arithmétique d'un
dénominateur nul. Le vrai coût économique (temps de l'architecte)
n'est pas dans ce calcul, par choix documenté, pas par omission.

## Retour — RARC et seuil de viabilité

**Revenu Annuel Récurrent Confirmé (RARC) mesuré aujourd'hui :
$2 520/an**, sur un seul Master Agreement signé (JaaS $300 + BaaS $720
forfait + PaaS $1 500 hypothèse année 1).

**Incertitude non tranchée** : si le tier PaaS est réellement en année
2 ou plus (l'engagement date du 2024-03-11, plus de 2 ans), son prix
réel est $18 000/an et non $1 500/an — le RARC serait alors $19 020/an,
soit **×7,5**. Remonté à Summers, c'est une lecture du contrat, pas un
calcul financier.

**Seuil de viabilité, fixé par le capitaine le 2026-08-26 : 100
nouveaux clients par mois, ni plus ni moins**, avec liste d'attente
au-delà. Une cohorte pleine à prix plancher génère $30 000, dont
$5 000 redistribués en affiliation ($50/filleul, taux JaaS déjà connu
du corpus), pour un **bénéfice net de $25 000 par cohorte mensuelle
pleine**.

**L'écart réel, non comblé par ce dossier** : le RARC mesuré
aujourd'hui ($2 520/an, 1 client) est très loin du seuil illustré
(cohorte de 100 clients). Ce dossier mesure l'écart, il ne le comble
pas.

## Une page, pour mémoire

| Indicateur | Valeur | Fiabilité |
|---|---|---|
| Coût complet mensuel | $0 | Mesuré, 8/8 postes |
| Prix plancher (JaaS, Août-Sept) | $300/an | Ancré sur ADR ratifié |
| Prix cible (JaaS, Oct-Déc) | $420/an | Dérivé (plancher × 1,4) |
| Prix haut (JaaS, liste d'attente) | $504/an | Dérivé (cible × 1,2) |
| Marge sur coût infra | 100 % | Vraie mais non-informative |
| RARC actuel | $2 520/an | Mesuré, incertitude ×7,5 nommée |
| Seuil de viabilité | 100 clients/mois | Fixé par le capitaine |
| Bénéfice net à cohorte pleine | $25 000/mois | Calculé, vérifié |
