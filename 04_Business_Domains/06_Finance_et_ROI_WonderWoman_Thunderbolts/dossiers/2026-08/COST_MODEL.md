# COST_MODEL — Sprint 1, août 2026

> Domaine : Finance & ROI (Wonder Woman). Techniciens engagés : Ghost
> (CostOpt) · BuckyBarnes (Cashflow) · USAgent (Compliance).
> Livrable exigé par `../../SPRINTS.md` S1 : chaque poste de coût de
> l'offre, avec libellé, valeur mensuelle, source, hypothèse,
> classification fixe/variable, et date de revue + métrique de retour
> si récurrent. Total mensuel.

## Ce que ce document EST et n'est PAS

C'est le **premier run réel** de la chaîne B1→B2→B3 sur ce dépôt.
Aucun sprint n'avait produit de livrable avant celui-ci — voir
`70_Onthologies/pulse/b2/b2-huit-domaines-en-absence-pas-en-dormance.md`
pour le diagnostic qui a motivé son exécution.

Sa valeur ne vient pas d'être complet — il ne l'est pas — mais d'être
**honnête sur ce qui est confirmé contre ce qui ne l'est pas**. Un coût
inventé pour remplir une case serait pire qu'une case marquée
« à vérifier » : c'est exactement le défaut que ce sprint existe pour
corriger.

## Postes de coût

**Mise à jour du 2026-08-26** : deux changements matériels depuis la
première version de ce document.

1. **MiniMax M3 abandonné.** L'utilisateur a résilié le Token Plan
   $50/mois : « il n'évolue pas malgré la sortie de plusieurs modèles
   frontière ». Ce poste sort du coût actif — conservé ci-dessous en
   ligne barrée pour la traçabilité, jamais supprimé de l'historique.
2. **Vercel, Supabase, Render, Octopus Deploy confirmés gratuits**,
   par déclaration directe de l'utilisateur le 2026-08-26, appuyée par
   capture d'écran pour Octopus (espace `Default`, `coachos.octopus.app`)
   et pour un service de routage de modèles (voir note AgentRouter
   ci-dessous, à ne pas confondre avec OpenRouter).

| Poste | Valeur mensuelle | Classification | Source | Date de revue |
|---|---|---|---|---|
| ~~Abonnement MiniMax M3 (Token Plan)~~ | ~~$50/mois~~ **ABANDONNÉ** | — | Déclaration directe de l'utilisateur, 2026-08-26 : « J'ai abandonné le plan à 50$ de M3 car il n'évolue pas ». Actif de la 1ère version de ce document (2026-08-25) au 2026-08-26 | clos — plus de récurrence à revoir |
| Supabase (projets OMK Services Intern / Customers) | **0 €** dans ce dépôt | — | Confirmé en direct : log d'exécution locale du 2026-08-24, `[cms] supabase mode: unconfigured — falling back to bundled seed`. Aucun projet Supabase câblé à `coach-os-app` | 2026-09-26 — revoir si un projet est provisionné avant lancement client réel |
| Vercel (hébergement `omk-desktop-web-os.vercel.app`, `the-office-os-site.vercel.app`) | **0 €** — tier gratuit | Fixe tant que free tier | Déclaration directe de l'utilisateur, 2026-08-26 : « Vercel dans mon utilisation actuel est Gratuit » | 2026-09-26 — revoir dès approche des limites du plan Hobby (bande passante, builds) |
| Render (déploiement candidat pour Omnigent, non actif sur Coach OS) | **0 €** — tier gratuit | Fixe tant que free tier | Déclaration directe de l'utilisateur, 2026-08-26 : « Render… Gratuit ». Aucun service Render effectivement déployé pour Coach OS à ce jour (voir `_runtime/bridge/deploy/render.yaml`, vide) | — rien à revoir tant que non provisionné |
| Octopus Deploy (`coachos.octopus.app`, espace `Default`) | **0 €** — tier gratuit | Fixe tant que free tier | Capture d'écran 2026-08-26 : espace `Default`, aucun projet créé, aucune mention de facturation visible | 2026-09-26 — revoir si des projets/environnements de déploiement y sont créés |
| AgentRouter (`agentrouter.org`, compte `github_428047`) | **0 € consommé**, $175,00 de crédit Anthropic non utilisé | Variable (pay-as-you-go), actuellement à $0 | Capture d'écran dashboard 2026-08-26 : Current balance $175.00, Consumption $0.00, Number of Requests 0 | 2026-09-26 — métrique de retour : requêtes exécutées / crédit consommé, actuellement 0/0 |
| OpenRouter (`openrouter.ai`, canal `ori` pour Claude Code / harnais routés) | **non confirmé** — **distinct d'AgentRouter, ne pas confondre** | Variable (pay-as-you-go) | Le mode serveur d'Ori exige un compte OpenRouter propre (`ori login`, OAuth). Aucun relevé de solde OpenRouter mesuré — le $175 ci-dessus est un crédit AgentRouter, une plateforme différente | à fixer dès accès au dashboard openrouter.ai (pas agentrouter.org) |
| GitHub (`omk-services/OMK-DESKTOP-WEB-OS`) | **0 €** (hypothèse) | Fixe si confirmé | Dépôt et Actions CI utilisés dans les limites gratuites observées (jobs < 2 min, dépôt privé sous organisation) — aucune facture GitHub vue | à confirmer par le propriétaire de l'organisation |
| Nom de domaine / DNS dédié | **aucun** | — | Aucun domaine personnalisé trouvé câblé (URLs `*.vercel.app` uniquement) | — |

**Total mensuel confirmé : 0 €/mois.** Six postes sur huit sont
maintenant confirmés à zéro, un poste actif est clos (MiniMax), et un
seul reste réellement non confirmé : **OpenRouter (openrouter.ai)**,
distinct du crédit AgentRouter déjà mesuré à $0 consommé.

**Ce que ce zéro veut dire, et ce qu'il ne veut pas dire.** L'infrastructure
technique actuelle de Coach OS coûte $0/mois parce qu'elle tourne
entièrement sur des paliers gratuits, sans client réel ni volume qui les
ferait dépasser. Ce n'est pas un coût structurellement nul — c'est un
coût **différé au premier dépassement de palier gratuit**, qui n'a pas
encore de date ni de seuil chiffré dans ce document.

## Ce qui est explicitement HORS PÉRIMÈTRE de ce coût

- **Le temps de l'architecte (Amadou Koné, FDE).** Le pathway N0 ne le
  facture pas en coût d'infrastructure — c'est un rôle, pas une ligne
  de coût cloud. À traiter séparément si un coût complet chargé est un
  jour exigé.
- **Les crédits ou abonnements personnels non liés à Coach OS**
  (Composio, Claude Code, autres harnais) — hors du périmètre de
  l'offre facturée à The OMK Office.

## Ce que le sprint 2 doit résoudre en premier

`PRICING.md` (S2) calcule le prix plancher comme coût complet / N
clients. **Avec un coût complet confirmé à 0 €, cette formule dégénère** :
prix plancher = 0, quel que soit N. Ce n'est pas une erreur de calcul,
c'est le calcul honnête d'un coût réellement nul sur l'infrastructure
technique — mais un prix plancher à 0 € n'a aucun sens commercial.

Le sprint 2 doit donc faire l'un des deux, explicitement, pas en
silence :

1. **Chiffrer le coût du temps** (l'architecte, ou un taux horaire
   théorique de remplacement), aujourd'hui hors périmètre par choix —
   voir « Ce qui est explicitement hors périmètre » ci-dessous.
2. **Fixer le prix plancher sur autre chose que le coût** — la valeur
   perçue, ou un ancrage sur `ADR-AAAS-PRICING-001` (tiers déjà
   ratifiés, $300-500/an pour le tier 1) plutôt que sur un coût nul.

Le seul poste réellement non résolu reste **OpenRouter (openrouter.ai)** —
à mesurer avant de clore ce sprint, distinct du crédit AgentRouter déjà
confirmé à $0 consommé.
