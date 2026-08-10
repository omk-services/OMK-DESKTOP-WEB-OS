---
id: B_BUSINESS
campagne: 2026-08-10 vague 3 — fonctionnalités oubliées, apps restantes
---

# BRIEF B — Sales OS, Finance, Clients, Growth

## Ton périmètre exclusif

```
src/apps/sales/**
src/apps/finance/**
src/apps/clients/**
src/apps/growth/**
```

**Interdit** : le socle et toute autre app. Lis `SOCLE_ACQUIS.md` avant de commencer.
`src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` est de l'archive : ni corrigée,
ni supprimée.

## Ce qui a déjà été fait — ne le refais pas

- **Sales OS** : nom unifié partout, 4 boutons d'action de la fiche deal câblés, compteurs
  skills/routines/documents dérivés du CMS, dates réelles au lieu de dates inventées,
  libellé « Back to Sales OS ».
- **Finance** : devise uniformisée en USD, séparateurs de milliers sur les planchers.
- **Clients** : garde contre le `NaN%` de l'onboarding, composeur de client.
- **Growth** : Funnel dérivé du CMS avec état vide honnête.

## Ce que tu cherches

### 1. Le CRUD sur les collections du domaine

Ces quatre apps portent les collections les plus vivantes du produit : `deals`, `invoices`,
`clients`, `growth_channels`, `growth_experiments`, `session_notes`, `contracts`.

Un coach doit pouvoir **créer un deal, une facture, un client, un canal, une expérience**
depuis l'app concernée. Là où un composeur maison existe déjà (Clients, Finance, Product),
compare-le au CRUD générique : garde le composeur s'il est plus riche, mais assure-toi qu'il
valide, qu'il refuse les doublons, qu'il vide ses champs après succès et qu'il affiche ses
erreurs. Là où **rien** n'existe, branche `CollectionRepeater`.

### 2. Le chaînage entre les quatre apps

Un `deal` gagné devrait produire une `invoice` et un `client`. Aujourd'hui les trois
collections vivent côte à côte sans se parler. Au minimum, depuis la fiche d'un deal gagné,
propose une action qui **crée réellement** la facture correspondante (montant et client
repris du deal) et le confirme par un toast. C'est la fonctionnalité la plus attendue de
cette famille d'apps, et elle n'existe pas.

Si tu juges que ça dépasse le cadre, écris-le au rapport avec ce qui manque pour le faire —
mais tente-le d'abord.

### 3. Les fiches de détail

Le niveau de référence est `src/apps/clients/ClientsDetailPage.tsx` (en-tête + statut,
métriques, sections thématiques, actions, navigation précédent/suivant). Toute fiche de ton
périmètre en dessous de ce niveau est de la dette.

Vérifie en particulier les détails de `growth_channels`, `growth_experiments` et
`session_notes` : ce sont les plus susceptibles d'être squelettiques.

### 4. Le piège du crumb dupliqué

Clients utilise `useCollectionDrill` **et** `setWindowDetail`. C'est exactement la
configuration qui a cassé la navigation dans Marketplace (voir `SOCLE_ACQUIS.md`). Teste :
ouvrir une fiche client, cliquer une autre section, vérifier que la fiche se ferme et que la
section change.

Applique le test aux quatre apps.

### 5. Les chiffres qui ne viennent de nulle part

Le Dashboard lit `deals` et `invoices` pour son CEO Cockpit. **Ne change pas la forme de ces
items** — tu casserais son calcul. En revanche, tout montant affiché dans tes apps doit
venir d'un `reduce` sur une collection, jamais d'une constante. Vérifie les arrondis, la
devise (`$` partout) et le cas de la collection vide (`$NaN` = bug).

## Vérification

```bash
node tools/shot.mjs --app sales --section "Pipeline" --theme glassmorphism --w 920 --h 600 --out /tmp/b.png
```

Pour toute création ou tout chaînage, pilote le navigateur et **prouve l'effet** : l'item
créé apparaît, le compteur bouge, le toast dit vrai.

## Ta boucle

```
passe 1 : parcours les 4 apps section par section, range PAR CAUSE
passe 2 : corrige, cause par cause
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU
passe 5 : reparcours à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

**Quatre apps = quatre apps dans ton rapport.**
Écris `_briefs/2026-08-10_vague3/RAPPORT_B_BUSINESS.md` — partiel si tu dois t'arrêter.
