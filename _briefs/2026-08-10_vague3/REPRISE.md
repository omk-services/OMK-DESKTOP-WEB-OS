# REPRISE — vague 3 interrompue par le quota

## Ce qui s'est passé

Les trois agents (`D_DASHBOARD`, `B_BUSINESS`, `O_OPS`) ont été coupés en vol :

```
API Error: Request rejected (429) · Token Plan usage limit reached (2056)
```

Aucun n'a pu écrire son rapport. Leur travail partiel est **sécurisé dans le commit
`ec48ee6`** après vérification : `tsc --noEmit` exit 0, 19/19 apps montées, 0 erreur console.

## Ce qui a été livré avant la coupure

| Commit | Contenu |
|---|---|
| `e92a09d` | Sales : le kanban reçoit un composeur, « Open detail » ouvre la fiche |
| `1ba181b` | Operations / Tasks / Product / IT-R&D : fiches titrées, drills fantômes retirés |
| `ec48ee6` | Wind Direction dérive ses validations de sources réelles (factures en retard, onboarding bloqué, deals à score ≥ 70) avec repli seed **marqué « Démo seed » à l'écran** |

## Comment reprendre

Le quota se réinitialise par fenêtre de 5 h. Vérifier d'abord :

```bash
echo "Reponds exactement: PONG" | /c/Users/amado/AppData/Roaming/npm/claude -p --permission-mode bypassPermissions
```

Si `PONG` revient, relancer les trois briefs **tels quels** — ils sont idempotents, chaque
agent commence par un inventaire de son périmètre et verra ce qui est déjà fait :

```bash
cd _briefs/2026-08-10_vague3
./lance.sh D_DASHBOARD     # puis attendre 2-3 min
./lance.sh B_BUSINESS      # puis attendre 2-3 min
./lance.sh O_OPS
```

**Ne pas lancer les trois dans la même seconde** : le script d'enrobage npm est un fichier
unique que Windows verrouille (piège 5 du CLAUDE.md racine).

## Ce qui reste à faire dans chaque périmètre

### D_DASHBOARD — 23 sections
Fait : Wind Direction dérivé. Reste : l'arbitrage collection-CMS vs journal-en-lecture sur
`AGENTS`, `SESSIONS`, `AUDIT_LOG`, `PLAYGROUND_MODELS` et les tableaux de `security/` et
`platform/` ; les six onglets de la fiche agent (seul `Invite système` est traité) ; le test
du crumb dupliqué sur les deux overlays de `DashboardApp`.

### B_BUSINESS — sales, finance, clients, growth
Fait : composeur du kanban Sales. Reste : le CRUD sur `invoices`, `growth_channels`,
`growth_experiments`, `session_notes` ; **le chaînage deal gagné → facture**, qui est la
fonctionnalité la plus attendue et n'existe toujours pas ; les fiches de détail de Growth ;
le test du crumb dupliqué sur Clients (`useCollectionDrill` + `setWindowDetail`).

### O_OPS — operations, tasks, product, it-rd
Fait : fiches titrées, drills fantômes retirés. Reste : le CRUD sur `runbooks`, `articles`,
`services`, `it_experiments`, `product_releases` ; le déplacement d'étape dans les kanbans
Roadmap et Processus (`moveStage` existe mais son atteignabilité depuis l'écran n'est pas
prouvée) ; les états vides du premier jour.

## Économie de quota

La campagne a consommé le plan sur deux vagues complètes (S/P/G/W puis D/B/O partiels).
Pour la prochaine, préférer **deux agents simultanés au lieu de trois** : la coupure est
arrivée pendant que trois agents tournaient en parallèle sur de gros périmètres.
