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

| Poste | Valeur mensuelle | Classification | Source | Date de revue |
|---|---|---|---|---|
| Abonnement MiniMax M3 (Token Plan) | **$50/mois** (≈ 46 €, taux indicatif, non contractuel) | Fixe | Déclaration directe de l'utilisateur, session transcript `314fae52-…md` : « le Token Plan de $50/mois à 5.1 Billions token disponible » | 2026-09-01 — métrique de retour : tokens consommés / 5,1 Md alloués, ratio de sous-utilisation si < 20 % |
| Supabase (projets OMK Services Intern / Customers) | **0 €** dans ce dépôt | — | Confirmé en direct : log d'exécution locale du 2026-08-24, `[cms] supabase mode: unconfigured — falling back to bundled seed`. Aucun projet Supabase n'est câblé à `coach-os-app` | — (rien à revoir tant que non provisionné) |
| Vercel (hébergement `omk-desktop-web-os.vercel.app`, `the-office-os-site.vercel.app`) | **non confirmé** | à déterminer | Deux sites vus déployés en capture d'écran (2026-08-24), mais aucun montant de facturation mesuré dans ce dépôt ni dans la mémoire OKF | à fixer dès accès au dashboard Vercel |
| OpenRouter (routage API, `ori`, modèles CC) | **non confirmé** | Variable (pay-as-you-go) | Mentionné comme canal de facturation unique pour Ori et les harnais routés, mais aucun relevé de solde ou de dépense mesurée trouvé dans le corpus | à fixer dès accès au dashboard OpenRouter |
| GitHub (`omk-services/OMK-DESKTOP-WEB-OS`) | **0 €** (hypothèse) | Fixe si confirmé | Dépôt et Actions CI utilisés dans les limites gratuites observées (jobs < 2 min, dépôt privé sous organisation) — aucune facture GitHub vue | à confirmer par le propriétaire de l'organisation |
| Nom de domaine / DNS dédié | **aucun** | — | Aucun domaine personnalisé trouvé câblé (URLs `*.vercel.app` uniquement) | — |

**Total mensuel confirmé : $50/mois (≈ 46 €).**
**Total mensuel avec postes non confirmés : indéterminé** — trois postes
(Vercel, OpenRouter, GitHub) ne peuvent pas entrer dans un total tant
qu'ils n'ont pas de valeur mesurée. Les additionner à zéro par défaut
donnerait un total faussement bas ; les estimer inventerait un chiffre.
Aucune des deux options n'est acceptable dans un document qui doit être
« vérifiable ».

## Ce qui est explicitement HORS PÉRIMÈTRE de ce coût

- **Le temps de l'architecte (Amadou Koné, FDE).** Le pathway N0 ne le
  facture pas en coût d'infrastructure — c'est un rôle, pas une ligne
  de coût cloud. À traiter séparément si un coût complet chargé est un
  jour exigé.
- **Les crédits ou abonnements personnels non liés à Coach OS**
  (Composio, Claude Code, autres harnais) — hors du périmètre de
  l'offre facturée à The OMK Office.

## Ce que le sprint 2 doit résoudre en premier

`PRICING.md` (S2) a besoin d'un coût complet pour calculer un prix
plancher. Avec seulement $50/mois confirmé sur un total réel
probablement plus élevé, le sprint 2 ne peut pas calculer un prix
plancher fiable tant que Vercel et OpenRouter ne sont pas mesurés.
**C'est un blocage réel, nommé maintenant plutôt que découvert au
sprint 2.**
