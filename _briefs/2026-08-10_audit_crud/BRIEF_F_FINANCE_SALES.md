---
id: F_FINANCE_SALES
campagne: 2026-08-10 — audit CRUD systématique
---

# BRIEF F — finance, sales, clients, growth, legal, audit

## Ton périmètre exclusif

```
src/apps/finance/**
src/apps/sales/**
src/apps/clients/**
src/apps/growth/**
src/apps/legal/**
src/apps/audit/**
```

**Interdit** : le socle et toute autre app. Lis `SOCLE_ACQUIS.md` **et** `MESURE.md` avant de
commencer — la mesure te dit déjà où chercher, ne la refais pas.
`src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` est de l'archive.

## Ce que la mesure dit de tes six apps

```
finance   2/7 sections ont un bouton de création
sales     2/7
clients   2/5
growth    4/7
legal     2/3
audit     0/7   ← alors que l'app rend 3 collections CMS
```

Zéro erreur console sur l'ensemble. Le travail n'est donc pas de réparer des pages cassées,
mais de **rendre créables les collections qui ne le sont pas**.

## Pistes déjà localisées

- **finance** — `plancher_marges`, `courbe_demande` et `formes_prix` sont de vraies collections
  CMS (`FinanceApp.tsx` ~lignes 146-152 et 294). Les sections `Planchers`, `Courbes`, `Formes`
  les affichent. Vérifie lesquelles permettent déjà la création et branche les autres.
  `Invoices` doit permettre de créer une facture à la main, en plus de celles produites par le
  chaînage « Mark Paid » depuis Sales.
- **audit** — l'app rend trois collections (`audit_arbitrage`, `audit_contexte`,
  `audit_donnees`, `audit_automatabilite`, `audit_arbitrage_roi`…) et **aucune de ses sept
  sections n'offre de création**. C'est le plus gros écart de ton périmètre. Attention : si
  ces grilles sont des référentiels figés (une méthode de diagnostic, pas des données de
  l'utilisateur), la bonne réponse peut être de **permettre à l'utilisateur de saisir ses
  réponses** plutôt que de créer des lignes de grille. Tranche en regardant ce que la page
  raconte, et écris ton arbitrage.
- **sales** — l'app est éditoriale (`Today`, `Context`, `Capabilities`, `Stack` sont des pages
  de lecture). `Kanban` a son composeur. Vérifie `sales_skills`, `sales_routines`,
  `sales_context` : si l'utilisateur doit pouvoir enrichir son propre contexte de vente, ces
  collections doivent être créables.
- **clients** — 2/5. `session_notes` (IP Vault) a reçu un composeur. Vérifie `Active`,
  `Onboarding`, `Churn Risk` : ce sont probablement des **vues filtrées** de la même collection
  `clients` — dans ce cas un seul bouton de création suffit, et le filtre s'applique après.
  Ne mets pas trois boutons qui font la même chose.
- **growth** — 4/7. Vérifie `growth_aeo`, `growth_strategie`, `growth_partenariats`.
- **legal** — 2/3. La grille de souveraineté vient d'être extraite dans
  `src/apps/legal/sovereignty.ts` : c'est un référentiel, pas une collection utilisateur.

## Ce que tu fais, section par section

Applique le critère de tri de `MESURE.md` : lit-elle une collection ? peut-on y ajouter ?
l'état vide a-t-il une issue ? la fiche de détail est-elle à niveau ?

Là où un composeur maison existe déjà, **ne le remplace pas mécaniquement** par le CRUD
générique : garde le plus riche, en t'assurant qu'il valide, refuse les doublons, vide ses
champs après succès et affiche ses erreurs.

## Vérification — la seule qui compte

Pour **chaque** section où tu ajoutes la création, pilote le navigateur (Playwright dans
`~/gauntlet-eyes`, voir `tools/shot.mjs` pour le chargement) et prouve la chaîne complète :

```
compteur avant → ouvrir le formulaire → remplir → soumettre
   → l'item APPARAÎT dans la liste → le compteur a bougé
```

Un toast de succès ne prouve rien : il a déjà menti deux fois sur ce dépôt.

## Ta boucle

```
passe 1 : parcours les 6 apps section par section, applique le critère de tri
passe 2 : corrige, en commençant par audit (0/7, le plus gros écart)
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : prouve chaque création PAR LE RENDU
passe 5 : reparcours à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

**Six apps = six apps dans ton rapport**, avec pour chaque section un verdict :
créable / lecture légitime / corrigée.

Écris `_briefs/2026-08-10_audit_crud/RAPPORT_F_FINANCE_SALES.md` — partiel si tu t'arrêtes.
