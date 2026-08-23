# SPRINTS — Green Lantern · RH & Méta Gouvernance

> Artefact du **VP**, rang Manager. Cycle : **4 sprints hebdomadaires par mois**.
> Amont : `../../00_Summers_CEO/ROCKS.md` · Aval : `squad/*/SCRUMS.md`

---

## Mois 2026-08 — rock hérité

> Chaque rôle nécessaire à l'offre a un mandat écrit, un titulaire désigné et un critère de sortie vérifiable.

Ligne source, `ROCKS.md` § « Ce que ça demande, par domaine » :

| 1 | RH & Méta Gouvernance | Green Lantern | Chaque rôle nécessaire à l'offre a un mandat écrit, un titulaire désigné et un critère de sortie vérifiable. | oui |

Le rock est sur **3 livrables par rôle** : (1) mandat écrit, (2) titulaire désigné, (3) critère
de sortie vérifiable. Si l'un manque, le rock n'est pas tenu.

## Veto de Green Lantern

> Tout recrutement — humain ou agent — sans mandat écrit et sans critère de sortie est interdit.
> S'il est engagé par le rock, il est écrit dans « Ce qui remonte à Summers ».

Conséquence opérationnelle : ce mois ne mandate pas de titulaire **nouveau**. Les titulaires
existant dans l'ORG (8 VPs nommés, 8×8 techniciens nommés) sont pris comme base — pas comme
résultat à atteindre.

## Les quatre sprints

| S | Semaine | Résultat vérifiable le vendredi | Techniciens engagés | Tenu ? | Motif si non |
|---|---|---|---|---|---|
| 1 | W1 (04 → 08 août) | `mandates/_inventory/01_roles_inventory.md` existe, liste **72 rôles** (8 VP + 8 domaines × 8 techniciens), taggés `actif`/`dormant` selon le rock 2026-08, et **0 rôle** listé sans titulaire nommé. Vérif : `wc -l mandates/_inventory/01_roles_inventory.md` ≥ 80 lignes ; `grep -c "^| dormant" mandates/_inventory/01_roles_inventory.md` = 8. | ProfessorX (sourcing des titulaires), Storm (arbitrage charge/périmètre) | | |
| 2 | W2 (11 → 15 août) | `mandates/vp/0[1-8]_*.md` — **8 fichiers** de mandat VP existent, un par VP nommé (Green Lantern, Batman, Flash, Martian Manhunter, Superman, Wonder Woman, Cyborg, Aquaman). Chaque fichier contient : mandat (1 phrase), titulaire (nom non vide), périmètre décisionnel, 2 dépendances amont + 1 aval. Vérif : `ls mandates/vp/*.md \| wc -l` = 8 ; `grep -L "Titulaire" mandates/vp/*.md` retourne vide. | Rogue (extraction du tacite → explicite), JeanGrey (langue commune des mandats) | | |
| 3 | W3 (18 → 22 août) | `mandates/techniciens/<X-Men>/0[1-8]_*.md` — **8 fichiers** de mandat pour mon squad X-Men (ProfessorX, Cyclops, JeanGrey, Wolverine, Storm, Beast, Nightcrawler, Rogue), chacun reprenant la charge de `VP_AGENT.md` § Mon squad. Vérif : `find mandates/techniciens -name "*.md" \| wc -l` = 8 ; chaque fichier référence son entrée dans `VP_AGENT.md` par ancre. Le template est aussi déposé dans `mandates/_templates/technicien_mandate.md` pour les 7 autres VP. | Cyclops (format d'entrée), Nightcrawler (protocole asynchrone) | | |
| 4 | W4 (25 → 29 août) | `mandates/exit_criteria.md` existe et contient **une ligne par rôle mandaté** (8 VP + 8 techniciens X-Men = ≥ 16 lignes), chacune avec un prédicat de sortie de la forme « le rôle est sorti quand `<fichier ou commande ou nombre>` est vérifiable ». Vérif : `grep -c "^| vp\|technicien" mandates/exit_criteria.md` ≥ 16 ; `grep -L "vérifiable par" mandates/exit_criteria.md` retourne vide. **Bonus vérif VP** : `mandates/_verification/rapport_W4.md` liste, pour chacun des 3 critères du rock (mandat / titulaire / sortie), le nombre de rôles qui le remplissent. | Wolverine (ce qui ne va pas), Beast (compétence réelle) | | |

Un résultat est vérifiable s'il porte un nombre, un chemin de fichier, ou une commande.
« Avancer sur X » n'est pas un résultat.

## Hypothèse de charge — pourquoi 4 sprints et pas 3

Le rock contient 3 livrables (mandat, titulaire, sortie) × N rôles. On ne peut pas empiler les
3 sur un sprint, ni condenser 8 VP + 64 techniciens sur un seul. Découpage retenu :

- S1 = inventaire (réduit la surface).
- S2 = mandats VP (8, indépendamment vérifiables).
- S3 = mandats techniciens X-Men (8, plus le template pour les autres squads).
- S4 = critères de sortie (verrou final sur le rock).

Si S2 dérive, on coupe S3 (le template suffit pour fermer le mois) — le critère de sortie
reste à poser en S4. Si S3 dérive, on mandate au moins les 8 X-Men et on note en « Ce qui
remonte à Summers » que les 56 techniciens des autres squads ne sont pas mandatés.

## Ce que ce mois ne fait pas

- **Aucun recrutement nouveau** — humain ni agent. Le veto s'applique. Les titulaires pris
  comme base sont ceux déjà nommés dans `VP_AGENT.md` et l'ORG.
- **Aucun mandat pour les techniciens des 7 autres squads.** Ce mois livre le template
  (`mandates/_templates/technicien_mandate.md`) ; les VPs Batman, Flash, Martian Manhunter,
  Superman, Wonder Woman, Cyborg, Aquaman mandatent leurs propres techniciens. Si Summers
  veut que ce soit centralisé chez Green Lantern, c'est un rock à part.
- **Aucun critère de performance** (PerfReviews) autre que l'entrée/sortie de mandat.
  C'est Wolverine qui décide de la revue ; moi je m'arrête à « le rôle sait quand il sort ».
- **Aucune activation du domaine 8 (Legal & Compliance).** Le rock le marque `dormant`.
- **Aucun rock, aucun scrum écrit ici.** ROCKS.md = Summers. `squad/*/SCRUMS.md` = techniciens.

## Ce qui remonte à Summers

Un fait par ligne. Pas d'arbitrage — l'arbitrage est à Summers.

| Date | Fait | Motif |
|---|---|---|
| 2026-08-02 | Le domaine 8 (Legal & Compliance) est `dormant` dans le rock 2026-08. Si la première offre touche au contrat client ou à la donnée personnelle, son activation devient un prérequis, pas une option. | L'inventaire S1 le fera apparaître ; le mandat Aquaman ne peut pas être écrit sans déclencheur. |
| 2026-08-02 | Les 7 autres VPs (Batman, Flash, Martian Manhunter, Superman, Wonder Woman, Cyborg, Aquaman) n'ont pas, à ce jour, de mandat écrit dans le dépôt. Mon S2 le fait pour eux — **c'est une intrusion dans leur périmètre** que je signale pour validation. | Si un VP refuse que Green Lantern écrive son mandat, S2 sera partiel. |
| 2026-08-02 | Le rock 2026-08 n'a pas de rattachement A1/A2/A3 renseigné (`Non disponible dans les sources consultées`). Le critère de sortie que j'écrirai en S4 ne pourra pas être relié à un officier A3. | Ce n'est pas mon岩石 à compléter, mais la cascade est coupée en amont. |

## Mois clos

| Mois | Sprints tenus | Rock atteint | Ce que ça a appris |
|---|---|---|---|
| | /4 | | |
