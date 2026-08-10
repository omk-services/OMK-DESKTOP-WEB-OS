---
id: S_SOCLE
campagne: 2026-08-10 vague 2 — fonctionnalités oubliées
ordre: 1 — passe SEUL, avant tous les autres
---

# BRIEF S — le socle : ce qui manque à TOUTES les apps

Tu passes **seul et en premier**. Trois des quatre chantiers de ce brief débloquent
directement le travail des trois agents suivants.

## Ton périmètre exclusif

```
src/components/**
src/lib/**
src/stores/**
src/hooks/**
src/contexts/**
src/apps/_ui/**
```

**Interdit** : tout `src/apps/<nom-d-app>/` sauf `_ui/`. Un défaut vu ailleurs se note au
rapport.

## Contexte : ce que l'utilisateur a constaté à l'écran

Ce ne sont pas des hypothèses. Chaque point ci-dessous a été reproduit dans le code.

---

## CHANTIER 1 — Le CRUD générique manque au socle (priorité absolue)

`src/components/cms/CollectionRepeater.tsx` affiche une collection et **n'offre aucun moyen
d'ajouter, éditer ou supprimer un item**. Résultat visible : les pages `Team`, `Agents`,
`Personas`, `Content`, `Mémoire`, `Codex` de l'app People affichent « No items yet » ou
« 0 configured » et l'utilisateur n'a **aucun bouton** pour y remédier. Le même composant est
utilisé par d'autres apps : le défaut est unique, les symptômes sont partout.

**Ce que tu construis** — un CRUD générique piloté par la définition de collection
(`CmsCollectionDef.fields`), donc valable pour n'importe quelle collection sans code par app :

1. Un bouton **« + Nouveau <singular> »** dans l'en-tête du repeater.
2. Un formulaire de création qui **se génère depuis `def.fields`** : un contrôle par champ,
   choisi selon `field.type` (`text` → input, `currency`/`number` → input numérique,
   `badge`/`select` → select si des options existent sinon input, `longtext` → textarea,
   `date` → input date). Le champ titre (`def.titleField`) est **requis**.
3. Validation : soumission bloquée si le champ titre est vide ou déjà pris (doublon exact,
   insensible à la casse). Message d'erreur visible, pas un silence.
4. Sur succès : `addItem(collectionId, values)`, champ vidé, toast de succès, la liste se
   met à jour. Sur échec de la mutation : toast d'erreur, le formulaire garde la saisie.
5. Un bouton **supprimer** par ligne, avec confirmation en deux temps (le bouton devient
   « Confirmer ? » pendant ~4 s avant d'agir — pas de `window.confirm`).
6. Un **état vide qui a une issue** : quand la collection est vide, une phrase qui dit ce qui
   manque **et le bouton de création juste en dessous**. Un écran vide sans porte de sortie
   est le bug qu'on corrige ici.

Le composant doit rester utilisable par les appelants actuels sans changer leur signature :
ajoute des props **optionnelles** (`allowCreate`, `allowDelete`, défaut `true`) plutôt que
d'imposer une migration. Vérifie tous les appelants avec un grep avant de figer l'API.

---

## CHANTIER 2 — La cloche de notifications efface au lieu d'ouvrir

`src/components/TopBar.tsx` ~ligne 345 : le bouton cloche fait `onClick={clearNotifications}`.
Un clic **efface** le compteur. Il n'existe **aucun panneau** listant les notifications.

**Ce que tu construis** :

1. Un dropdown ancré sur la cloche, qui liste les notifications récentes (source, type, message,
   heure), les plus récentes en haut, avec un état vide honnête (« Aucune notification »).
2. `clearNotifications` devient une action **dans** le panneau (« Tout marquer comme lu »),
   plus le comportement du clic sur la cloche.
3. Les toasts émis par les apps (`useShellStore.addToast`) doivent **alimenter cet historique** :
   aujourd'hui un toast s'affiche 4 secondes puis disparaît sans laisser de trace. Ajoute au
   `shell.store` une liste `notifications` (plafonnée, ex. 50) que `addToast` alimente en même
   temps qu'il pousse le toast. Le compteur de la cloche compte les non-lues.
4. Fermeture au clic extérieur et à `Échap`, comme les autres menus de la barre.

---

## CHANTIER 3 — Le sélecteur de tenant est au mauvais endroit

`TenantPill` est monté directement dans la barre (~ligne 302), à côté de l'horloge, alors que
c'est un attribut **du compte**. L'utilisateur veut ce sélecteur **dans le menu Profile**
(~lignes 92-128 de `TopBar.tsx`), là où vivent déjà les entrées de compte.

**Ce que tu fais** :

1. Déplace le sélecteur de tenant dans le menu Profile, sous une section « Espace de travail »,
   avec la coche sur le tenant courant et l'entrée « Enregistrer un espace ».
2. Retire la pastille autonome de la barre. Si tu veux garder un repère visuel du tenant actif,
   le nom peut s'afficher **dans** l'entrée Profile, pas comme un bouton séparé.
3. Le mot « tenant » est du jargon d'infrastructure. À l'écran, écris **« Espace de travail »**.
   Garde `tenant` comme identifiant technique dans le code.

**Ne réécris pas la couche de partition des données.** L'utilisateur a raison de dire que ce
n'est pas le multi-tenant de Supabase — c'est une partition locale de démonstration, et c'est
assumé à ce stade. Ton travail porte sur **l'emplacement et le vocabulaire du sélecteur**, pas
sur le modèle de données. Note au rapport ce que tu observes de la partition actuelle, sans y
toucher.

---

## CHANTIER 4 — La navigation meurt quand un détail est ouvert

Symptôme reproduit dans l'app Marketplace : une fiche de détail ouverte, cliquer une autre
section du rail ne fait rien. `AppDetailOverlay` se positionne à `left: var(--sidebar-w, 0px)`
pour laisser la barre latérale accessible — mais si `--sidebar-w` n'est pas publiée sur le
parent commun de cette app, le repli `0px` s'applique et **le calque recouvre le rail**.

`AppFrame` republie la variable sur `rootRef.current.parentElement` dans un `useEffect`. Vérifie
que ce parent est bien l'ancêtre commun de l'overlay **pour toutes les apps**, y compris celles
qui montent l'overlay ailleurs dans l'arbre. Corrige à la racine plutôt qu'app par app.

**Vérification obligatoire, par le rendu** : ouvre Marketplace, ouvre une fiche, clique une
autre section du rail, et prouve que la section change. Playwright est disponible dans
`~/gauntlet-eyes` ; `tools/shot.mjs` montre comment le charger.

---

## Ta boucle

```
passe 1 : chantier 1 (CRUD generique) — c'est le plus gros levier, fais-le d'abord
passe 2 : chantiers 2, 3, 4
passe 3 : npx tsc --noEmit → 0 erreur sur tes fichiers
passe 4 : vérifie chaque chantier PAR LE RENDU, pas par le JSX
passe 5 : relis tout ton périmètre à neuf
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

Les quatre chantiers sont **tous** obligatoires. Un rapport qui n'en traite que deux est un
abandon. Si tu manques de contexte, écris le rapport partiel **avant** de rendre la main.

## Ce que tu livres

- Commits atomiques, message français, préfixe conventionnel.
- `_briefs/2026-08-10_vague2/RAPPORT_S_SOCLE.md` — et rappelle-toi que `Write` ne crée pas les
  dossiers manquants : le dossier existe déjà, écris dedans directement.
- Dans le rapport, une section **« API du CRUD générique »** décrivant les props ajoutées à
  `CollectionRepeater` : les trois agents suivants en ont besoin pour brancher leurs pages.
