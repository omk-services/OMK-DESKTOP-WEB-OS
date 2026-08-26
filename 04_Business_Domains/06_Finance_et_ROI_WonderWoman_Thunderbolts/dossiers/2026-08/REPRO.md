# REPRO — Sprint 4, août 2026

> Domaine : Finance & ROI (Wonder Woman). Technicien engagé : Taskmaster
> (Repro). Livrable exigé par `../../SPRINTS.md` S4 : procédure de
> rejouabilité des trois fichiers précédents (`COST_MODEL.md`,
> `PRICING.md`, `ROI_METRIC.md`), avec au moins un re-run à blanc
> réussi.

## Pourquoi une procédure, pas un script

Les trois documents précédents ne sont pas des sorties de programme —
ce sont des mesures ponctuelles (dashboards, fichiers signés,
déclarations directes). Il n'existe pas de commande unique qui les
régénère. La rejouabilité ici veut dire autre chose : **un tiers,
suivant les mêmes étapes sur les mêmes sources, doit retomber sur les
mêmes chiffres.** C'est ce que cette procédure vérifie, pas
l'exécution d'un binaire.

## Procédure de rejouabilité, par document

### 1. `COST_MODEL.md` — les 8 postes de coût

| Étape | Commande / source | Résultat attendu |
|---|---|---|
| Supabase | Lancer l'app localement (`npm run dev`), lire la console | `[cms] supabase mode: unconfigured` |
| Vercel / Render / Octopus | Déclaration directe du capitaine, pas une commande — à reconfirmer par un nouvel échange si le statut a changé | « Gratuit » |
| AgentRouter | `agentrouter.org/console` (connecté) | Current balance, Consumption, Number of Requests |
| OpenRouter | `openrouter.ai/workspaces/default/keys` (connecté) | Liste des clés et leur « Key usage » |
| MiniMax | N/A — poste clos, ne se rejoue plus | « ABANDONNÉ » |

**Ce qui ne se rejoue PAS à l'identique** : les dashboards Vercel/
AgentRouter/OpenRouter changent avec le temps. Une rejouabilité fidèle
donnerait un chiffre *à jour*, pas *identique* à celui figé le
2026-08-26 — c'est le comportement attendu, pas un échec de procédure.

### 2. `PRICING.md` — les trois lignes de prix

| Étape | Calcul | Résultat attendu |
|---|---|---|
| Plancher | Lire `ADR-AAAS-PRICING-001`, Tier 1, borne basse | $300/an |
| Cible | Plancher × 1,4 | $420/an |
| Haut | Cible × 1,2 | $504/an |

Celui-ci **se rejoue à l'identique** — il ne dépend d'aucun dashboard
vivant, seulement d'un ADR ratifié et figé.

### 3. `ROI_METRIC.md` — le RARC

| Étape | Commande | Résultat attendu |
|---|---|---|
| Trouver les signatures | `grep -n "^signé:" 00_Summers_CEO/03_Master_Agreements/*.md` | `001_...` signé `human:Amadou`, `002_...` vide |
| Lire les lignes tarifaires du 001 | `sed -n '/^tarification:/,/^signé:/p' 00_Summers_CEO/03_Master_Agreements/001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md` | JaaS $300/an, BaaS $720/an + 25 %, PaaS $1 500/an (hypothèse année 1) |
| Sommer | $300 + $720 + $1 500 | **$2 520/an** |

## Re-run à blanc, exécuté le 2026-08-26

Les deux commandes de l'étape 3 ont été effectivement rejouées avant
la rédaction de ce document :

```
$ grep -n "^signé:" 00_Summers_CEO/03_Master_Agreements/*.md
001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md:54:signé: human:Amadou (2026-08-24)
002_ARCHITECTE_NIVEAU_ZERO.md:31:signé: <vide>

$ sed -n '/^tarification:/,/^signé:/p' 00_Summers_CEO/03_Master_Agreements/001_...md
JaaS  $300/an
BaaS  $720/an + 25% des benefices
PaaS  $1500/an — 1ere annee
```

**Résultat : $300 + $720 + $1 500 = $2 520/an — identique au chiffre
publié dans `ROI_METRIC.md`.** Rejouabilité confirmée pour ce document
sur cette procédure, à cette date.

## Ce qui casserait la rejouabilité, nommé pour la prochaine fois

- Un troisième Master Agreement signé changerait le total — la
  procédure reste valide, seul le résultat change.
- Si l'écart PaaS année 1 / année 2 est tranché en faveur de l'année 2
  ($18 000/an au lieu de $1 500/an), l'étape 3 doit être relue avec la
  nouvelle valeur — la procédure ne le détecte pas automatiquement,
  un humain doit vérifier la date d'ancienneté à chaque rejeu.
