# SPRINTS — Cyborg · R&D & IT

> Artefact du **VP**, rang Manager. Cycle : **4 sprints hebdomadaires par mois**.
> Amont : `../../00_Summers_CEO/ROCKS.md` · Aval : `squad/*/SCRUMS.md`

---

## Mois `2026-08` — rock hérité

> L'environnement nécessaire à la démonstration et à la livraison est reproductible, observable et assorti d'un chemin de sortie documenté.

Source : `../../00_Summers_CEO/ROCKS.md`, ligne 48, domaine 7.

Les trois dimensions du rock se répartissent sur les sprints. La quatrième semaine ne ré-ouvre
pas une dimension — elle **ferme la boucle** : on prouve que les trois tiennent ensemble et
que le retour arrière fonctionne.

## Les quatre sprints

| S | Semaine | Résultat vérifiable le vendredi | Techniciens engagés | Tenu ? | Motif si non |
|---|---|---|---|---|---|
| 1 | W31 — 2026-08-03 → 2026-08-09 | `infra/provision.sh` commité, exécutable, et **un journal d'exécution daté du vendredi** dans `infra/logs/provision_<YYYY-MM-DD>.log` qui montre que la stack minimale de démo + delivery (dépendances runtime, services internes, configuration, seed de données factices) se monte depuis une machine vierge sans intervention manuelle. | KangPrime (forme du système) · IronLad (provisioning) | | |
| 2 | W32 — 2026-08-10 → 2026-08-16 | `infra/observe.sh` commité + **un rapport daté du vendredi** dans `infra/logs/observe_<YYYY-MM-DD>.md` listant au moins 5 signaux observés (healthcheck HTTP, statut des services, volumétrie logs, usage disque, usage mémoire) avec valeur courante pour chacun. | Immortus (capacity/archivage) · ScarletCenturion (ce qui est exposé) | | |
| 3 | W33 — 2026-08-17 → 2026-08-23 | `infra/EXIT_PATH.md` commité, listant **chaque fournisseur cloud-only** réellement utilisé par la stack S1, avec pour chacun : (1) procédure d'export des données, (2) équivalent open-source/self-hosted identifié, (3) coût estimé d'une migration. Une ligne « verrou veto » en bas du fichier confirme que **tous les fournisseurs ont un chemin de sortie**. | KangPrime (choix fournisseurs) · ScarletCenturion (sécurité) | | |
| 4 | W34 — 2026-08-24 → 2026-08-30 | Une **capture horodatée** dans `infra/logs/e2e_<YYYY-MM-DD>.md` qui prouve : (a) `provision.sh` exécuté depuis zéro le vendredi, (b) `observe.sh` rapportant les 5 signaux S2, (c) **un test de restauration depuis backup** passé et documenté dans `infra/RESTORE_TEST.md` (jeu de données restauré, écart constaté vs original). | VictorTimely (chemin de livraison) · RamaTut (sauvegarde/restauration) | | |

Un résultat est vérifiable s'il porte un nombre, un chemin de fichier, ou une commande.
« Avancer sur X » n'est pas un résultat.

## Ce que ce mois ne fait pas

- **Pas de production ouverte au public.** La stack S1 tourne en local ou en sandbox fermé. La
  mise en ligne ouverte relève d'un autre sprint.
- **Pas de migration effective vers un cloud.** Le S3 *documente* le chemin de sortie ; il ne
  l'exécute pas. Toute migration réelle est un rock à part.
- **Pas de SLO ni de monitoring 24/7.** S2 capte 5 signaux et les écrit dans un fichier ; il
  ne pose pas d'alerting ni de dashboard externe.
- **Pas de rotation des secrets.** Les secrets nécessaires à la démo sont écrits en `.env.example`.
  La gestion réelle (vault, rotation) relève d'un autre sprint.
- **Pas de hardening sécurité.** S2 + S3 ferment l'existant, ils n'audient pas.
- **Pas de catalogue fournisseurs.** Si un nouveau service tiers apparaît en cours de sprint, il
  doit d'abord passer par `EXIT_PATH.md` avant d'être commité.

## Ce qui remonte à Summers

Un fait par ligne. Pas d'arbitrage — l'arbitrage est à Summers.

| Date | Fait | Motif |
|---|---|---|
| 2026-08-09 | `provision.sh` testé depuis une machine vierge (log daté) | Premier jalon reproductibilité atteint, ou non |
| 2026-08-16 | `observe.sh` rapporte ≥ 5 signaux datés | Premier jalon observabilité atteint, ou non |
| 2026-08-23 | `EXIT_PATH.md` liste tous les fournisseurs cloud-only utilisés, ligne « verrou veto » présente ou absente | Veto tenu ou veto enfreint — Summers arbitre |
| 2026-08-30 | Capture e2e + test de restauration datés | Trois dimensions du rock tenues ensemble, ou non |

## Mois clos

| Mois | Sprints tenus | Rock atteint | Ce que ça a appris |
|---|---|---|---|
| | /4 | | |