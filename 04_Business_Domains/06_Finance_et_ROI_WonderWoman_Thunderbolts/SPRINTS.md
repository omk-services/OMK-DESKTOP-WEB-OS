# SPRINTS — Wonder Woman · Finance & ROI

> Artefact du **VP**, rang Manager. Cycle : **4 sprints hebdomadaires par mois**.
> Amont : `../../00_Summers_CEO/ROCKS.md` · Aval : `squad/*/SCRUMS.md`

---

## Mois `2026-08` — rock hérité

> Le coût complet, le prix, la marge cible et la métrique de retour de l'offre sont chiffrés et vérifiables.

Source : `../../00_Summers_CEO/ROCKS.md`, ligne 47 du tableau « Ce que ça demande, par domaine ».

Le rock dit que **quatre** éléments doivent être chiffrés ET vérifiables fin août : coût complet, prix, marge cible, métrique de retour. Les quatre sprints sont taillés pour produire chacun un de ces éléments, le quatrième sprint bouclant la boucle par reproductibilité et conformité.

---

## Les quatre sprints

| S | Semaine | Résultat vérifiable le vendredi | Techniciens engagés | Tenu ? | Motif si non |
|---|---|---|---|---|---|
| 1 | 2026-08-03 → 2026-08-07 | `COST_MODEL.md` publié dans `04_Business_Domains/06_Finance_et_ROI_WonderWoman_Thunderbolts/dossiers/2026-08/`. Le fichier liste **chaque poste de coût** de l'offre (libellé, valeur mensuelle en EUR, source, hypothèse, classification fixe/variable, et **date de revue + métrique de retour si le poste est récurrent**). Le document porte un **total mensuel** en EUR. | Ghost (CostOpt) · BuckyBarnes (Cashflow) · USAgent (Compliance) | **Oui**, 2026-08-26 | Publié hors fenêtre calendaire (S1 datait du 08-03→08-07 ; premier run réel de la chaîne B1→B2→B3, jamais exécutée avant le 08-26), sinon complet : les 8 postes sont mesurés, zéro « non confirmé » restant. Total mensuel confirmé = $0,035 (MiniMax clos, 6 postes gratuits, OpenRouter mesuré à la clé). S2 dégénère quand même — voir escalade ci-dessous, coût ≈ 0 rend la formule prix/coût inutilisable, pas un blocage d'accès. |
| 2 | 2026-08-10 → 2026-08-14 | `PRICING.md` publié au même chemin. Le fichier expose **trois lignes** chiffrées : prix plancher (= coût complet / N clients), prix cible (= prix plancher × coefficient de marge, ex. 1,4), et prix haut (= prix cible × 1,2). Trois scénarios ramènent à une **marge cible en %** pour N = 1, N = 5, N = 10 clients, avec hypothèse de volume écrite. | YelenaBelova (Forecasting) · Ghost (CostOpt) | **Oui (avec réserve)**, 2026-08-26 | Hors fenêtre calendaire, comme S1. La formule littérale coût/N dégénère à 0 € (coût confirmé nul en S1) — rejetée explicitement plutôt qu'utilisée telle quelle. Ancré à la place sur `ADR-AAAS-PRICING-001` ratifié : plancher $300/an, cible $420/an, haut $504/an (Tier 1 seulement — BaaS/PaaS restent hors calcul, déjà tarifés par le Master Agreement 001). Marge à 100 % sur les 3 scénarios de volume — signal que la marge ne mesure rien tant que le coût du temps reste hors périmètre, pas une preuve de rentabilité. |
| 3 | 2026-08-17 → 2026-08-21 | `ROI_METRIC.md` publié au même chemin. Le fichier définit **une métrique de retour** (formule explicite, source de données, fréquence de mesure) et fixe **un seuil de viabilité chiffré** (valeur plancher au-dessus de laquelle l'offre est jugée rentable). | YelenaBelova (Forecasting) · RedGuardian (Reporting) | **Partiel**, 2026-08-26 | Le ROI en % dégénère (division par un coût nul, symétrique du problème de S2). Remplacé par une métrique en valeur absolue — Revenu Annuel Récurrent Confirmé (RARC), source = champ `signé:` des Master Agreements, fréquence mensuelle — qui mesure $2 520/an, avec une incertitude nommée sur le tier PaaS ($1 500/an vs $18 000/an selon l'ancienneté réelle de l'engagement, à trancher par le capitaine). **Le seuil de viabilité chiffré n'est PAS livré** — aucune base non nulle pour le fixer tant que le coût du temps reste hors périmètre. Nommé comme non résolu plutôt qu'inventé. |
| 4 | 2026-08-24 → 2026-08-28 | Trois livrables publiés : `REPRO.md` (Taskmaster documente la procédure de rejouabilité des trois fichiers précédents — script ou checklist pas-à-pas, avec au moins un **re-run à blanc** réussi) ; `FINANCIAL_DOSSIER.md` (RedGuardian consolide coût + prix + marge + ROI en un dossier de ≤ 2 pages, lisible sans ouvrir les fichiers sources) ; `COMPLIANCE_NOTE.md` (USAgent confirme la traçabilité comptable et la conformité aux obligations déclaratives en vigueur). | Taskmaster (Repro) · RedGuardian (Reporting) · USAgent (Compliance) | | |

Un résultat est vérifiable s'il porte un nombre, un chemin de fichier, ou une commande.
« Avancer sur X » n'est pas un résultat.

---

## Ce que ce mois ne fait pas

- **Ne signe aucun contrat.** Le mois produit un chiffrage démontrable, pas un client payant.
- **Ne facture aucun client.** Aucune émission de facture ; aucun encaissement n'est attendu.
- **Ne lance aucune campagne d'acquisition.** Le périmètre est le chiffrage, pas la génération de demande — c'est Martian Manhunter (domaine 4) et Superman (domaine 5).
- **Ne recrute pas.** L'effort de chiffrage tient sur les six techniciens du squad, pas sur de nouvelles embauches — c'est Green Lantern (domaine 1).
- **Ne chiffre pas la R&D.** L'environnement technique n'est pas dans le périmètre — c'est Cyborg (domaine 7).
- **Ne touche pas au légal.** Legal & Compliance est dormant sur le rock d'août ; USAgent (Compliance) vérifie la traçabilité comptable, pas la conformité contractuelle — c'est Aquaman (domaine 8, dormant).
- **Ne décide pas du prix final.** Le sprint S2 propose un prix cible ; la décision tarifaire est à Summers (B1), pas au domaine 6.

---

## Ce qui remonte à Summers

Un fait par ligne. Pas d'arbitrage — l'arbitrage est à Summers.

| Date | Fait | Motif |
|---|---|---|
| 2026-08-02 | Le rock engage le chiffrage d'une offre dont la spec est en cours de finalisation par Flash (domaine 3). Mon S1 dépend d'une spec d'offre stabilisée pour boucler le coût complet ; si la spec bouge après S1, COST_MODEL.md doit être révisé en S2. | Dépendance amont sur le domaine 3 ; sans spec stable, le chiffre n'est pas frais. |
| 2026-08-02 | Mon veto (« toute dépense récurrente sans date de revue et sans métrique de retour ») est engagé par le rock : le coût complet de l'offre inclura nécessairement des postes récurrents (hosting, outils, abonnements). Chaque poste récurrent apparaissant dans `COST_MODEL.md` portera une date de revue et une métrique de retour, sans exception. | Veto appliqué par construction dans le livrable S1. |
| 2026-08-02 | Le domaine Legal & Compliance est dormant. USAgent (Compliance) traite la traçabilité comptable interne, pas la conformité contractuelle. Si Summers active Legal en cours de mois, le périmètre d'USAgent change et S4 doit être revu. | Périmètre conditionnel à l'activation d'un domaine dormant. |
| 2026-08-26 | **Périmé** — Legal est activé depuis le 2026-08-24 (`001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md` signé). Le périmètre d'USAgent pour S4 doit être revu avant exécution, comme anticipé ci-dessus. | Correction de la ligne du 2026-08-02, condition désormais remplie. |
| 2026-08-26 | Premier run réel de S1, exécuté hors fenêtre calendaire (S1 datait du 08-03→08-07) parce qu'aucun sprint n'avait jamais été exécuté sur les 8 domaines avant cette date — voir `70_Onthologies/pulse/b2/b2-huit-domaines-en-absence-pas-en-dormance.md`. `COST_MODEL.md` publié avec 3 postes sur 6 non confirmés (Vercel, OpenRouter, GitHub) faute d'accès direct aux dashboards de facturation. | Blocage nommé le 08-26 matin, résolu le 08-26 après-midi (voir ligne suivante). |
| 2026-08-26 | **Mise à jour** : Vercel, Supabase, Render, Octopus Deploy confirmés gratuits par déclaration directe de l'utilisateur. MiniMax M3 ($50/mois, seul poste actif confirmé) résilié. Seul OpenRouter (openrouter.ai, distinct du crédit AgentRouter déjà mesuré à $0 consommé) restait non confirmé. | Le coût nul n'est pas une absence de blocage — c'est un nouveau type de blocage pour S2, nommé ici. |
| 2026-08-26 | **Résolu** : solde OpenRouter mesuré en direct sur le dashboard — clé `OAuth: ori` (seule attribuable à Coach OS) à $0,035/mois d'usage, sur un compte à $28,28 de solde total (les 12 autres clés servent d'autres outils, hors périmètre). **Coût complet confirmé = $0,035/mois. Zéro poste non confirmé restant — S1 est clos.** La formule prix plancher = coût / N de S2 dégénère quand même (≈ 0), pour une raison structurelle et non plus d'accès : voir `COST_MODEL.md` §« Ce que le sprint 2 doit résoudre ». **Alerte sécurité** : la capture fournie pour cette mesure exposait une clé API OpenRouter en clair (non copiée dans ce dépôt) — révocation recommandée. | Mesure terminée ; le blocage restant pour S2 est structurel (coût quasi nul), pas un accès manquant. |
| 2026-08-26 | **Suite** : l'utilisateur a purgé l'intégralité des 13 clés du compte OpenRouter, pas seulement celle exposée. Coût redescendu à 0 €/mois exactement, mais **le harnais Ori de Coach OS n'a plus d'identifiant OpenRouter valide** — `ori login` devra régénérer une clé avant toute prochaine invocation. Sans lien avec un domaine B2 précis (Ori est transverse, utilisé par plusieurs harnais), signalé ici parce que c'est le domaine qui a mesuré et documenté la clé disparue. | Information transverse, à connaître avant de supposer qu'Ori fonctionne tel quel. |
| 2026-08-26 | **Décision requise, pas une décision de domaine** : `001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md` date l'engagement au 2024-03-11, donc plus de 2 ans avant aujourd'hui. Si le tier PaaS est réellement en année 2 ou plus, son prix contractuel est $1 500/**mois** ($18 000/an), pas $1 500/an comme calculé par prudence dans `ROI_METRIC.md`. Écart : $2 520/an (hypothèse prudente) contre $19 020/an (si année 2+ s'applique). Le domaine 6 ne peut pas trancher seul quelle année contractuelle s'applique — c'est une lecture du Master Agreement, pas un calcul financier. | Facteur ×7,5 sur le RARC selon la réponse ; à trancher avant que ce chiffre serve une décision de prix ou d'investissement. |

---

## Mois clos

| Mois | Sprints tenus | Rock atteint | Ce que ça a appris |
|---|---|---|---|
| | /4 | | |
