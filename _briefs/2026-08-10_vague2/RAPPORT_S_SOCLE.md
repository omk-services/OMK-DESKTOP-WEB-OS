# RAPPORT S — Socle (chantiers 1 à 4)

Statut : **terminé**, tous les 4 chantiers traités.

Commits de la passe (les miens, dans l'ordre) :
- `a93c085` — fix(cms): CRUD generique sur CollectionRepeater (chantier 1)
- `47212ac` — fix(shell): dropdown de notifications persistent (chantier 2)
- `7097cf3` — fix(topbar): deplace le selecteur d'espace dans Profile (chantier 3)
- `1700066` — fix(overlay): calque laisse la sidebar visible dans tous les cas (chantier 4)

Vérification :
- `npx tsc --noEmit` : **0 erreur** sur mes fichiers
- `npm run build` : OK (2505 modules transformés, bundle généré)
- Rendu vérifié par capture (Playwright sur dev server `localhost:5174`) pour chaque
  chantier — voir détails ci-dessous.

---

## Chantier 1 — CRUD générique sur `CollectionRepeater`

**Constat** : `CollectionRepeater` rendait la grille mais n'exposait aucun moyen
d'ajouter ou supprimer un item. Toutes les collections qui l'utilisent
(`team`, `people_agents`, `services`, `deploys`, `growth_experiments`,
`contracts`, `policies`) étaient bloquées en lecture seule.

**Fait** : le repeater affiche maintenant un bouton « + Nouveau <singular> »
dans l'en-tête. Un clic ouvre un formulaire inline auto-généré depuis
`def.fields`. La validation bloque la soumission quand `def.titleField`
est vide ou en doublon exact (case-insensitive), avec un message d'erreur
inline rouge — pas un silence. La soumission réussie pousse un toast de
succès, vide le formulaire et ferme le panneau ; les erreurs de mutation
poussent un toast d'erreur et conservent la saisie.

Le bouton supprimer est présent sur chaque carte (visible au hover). Il
applique une confirmation en deux temps : un premier clic affiche
« Confirmer ? » en rouge pendant 4 secondes ; un second clic dans la
fenêtre agit. Au-delà, l'état revient à l'idle sans rien supprimer. Pas
de `window.confirm` — jugé trop brutal pour un OS style Codex/Buzz.

L'état vide affiche une phrase claire (« Aucun {singular} pour l'instant »)
plus le bouton de création en dessous. Un écran vide sans porte de sortie
était le bug qu'on corrige ici.

**API du CRUD générique — props ajoutées à `CollectionRepeater`** :

```ts
interface CollectionRepeaterProps {
  collectionId: string;
  onOpen: (itemId: string) => void;
  /** optional pre-filtered subset — when omitted, renders the whole collection */
  filter?: (item: CmsItem) => boolean;
  /** Show the "+ Nouveau" create button. Default true. */
  allowCreate?: boolean;
  /** Show the per-card delete button. Default true. */
  allowDelete?: boolean;
}
```

Les deux nouvelles props sont **optionnelles, défaut `true`**. Les 7
appelants actuels (`ItRdApp`, `GrowthApp`, `LegalApp`, `PeopleApp` ×2)
continuent de fonctionner sans modification — ils héritent du comportement
CRUD par défaut. Un agent ultérieur peut passer `allowCreate={false}` sur
une collection où la création doit rester cachée.

**Attributs `data-cms-*` posés pour le test par le rendu** :

| Attribut | Où | Usage |
|---|---|---|
| `data-cms-action="create-{collectionId}"` | bouton d'en-tête | ouverture formulaire |
| `data-cms-action="create-empty-{collectionId}"` | bouton de l'état vide | idem, depuis empty state |
| `data-cms-form="create-{collectionId}"` | balise `<form>` | sélecteur stable pour Playwright |
| `data-cms-action="submit-{collectionId}"` | bouton Créer | soumission |
| `data-cms-card="{itemId}"` | carte | sélecteur de carte |
| `data-cms-action="delete-{collectionId}-{itemId}"` | croix au hover | demande de confirmation |
| `data-cms-action="confirm-delete-{collectionId}-{itemId}"` | croix en mode confirm | confirmation effective |

**Vérification visuelle** :
- People > Team : le bouton « + NOUVEAU MEMBER » apparaît, le formulaire
  s'ouvre avec les champs auto-générés (Role, Status, Focus, Bio) et la
  validation bloque quand le titre est vide.
- IT/R&D > Deploys : suppression deux temps validée — premier clic affiche
  « CONFIRMER ? » rouge, second clic supprime (3 → 2 cartes).

**Point hors-périmètre noté pour les agents suivants** : plusieurs
définitions de collection dans `cms/seed.ts` ont un `titleField` qui ne
correspond à aucune entrée de `fields[]` — par exemple `servicesDef`
déclare `titleField: 'name'` mais le seul champ déclaré est `note`. La
form est alors générée sans input pour le titre, et la validation refuse
toujours. Le code du CRUD est correct (il rend les champs tels qu'ils
sont déclarés, et valide le `titleField`) — c'est la donnée qui est
incohérente. Les agents P_PEOPLE et W_WEB qui touchent aux seeds
devront aligner les deux côtés si ils ajoutent de nouvelles collections.

---

## Chantier 2 — Notifications dropdown

**Constat** : la cloche faisait `onClick={clearNotifications}` — un clic
effaçait le compteur sans rien montrer. Et chaque toast s'auto-effaçait
après 5 s sans laisser de trace, donc les signaux qu'on venait d'émettre
devenaient invisibles.

**Fait** :
- `shell.store` : ajout d'une liste `notifications: Notification[]` plafonnée
  à 50, plus récente en tête. `addToast` alimente désormais le toast
  éphémère ET la notification persistante, et incrémente le compteur
  `notificationCount` (qui compte les non-lues).
- Nouvelles actions : `clearNotifications` (signature changée — marque
  tout comme lu, l'historique reste), `dismissAllNotifications` (vide
  l'historique), `dismissNotification(id)` (retrait unitaire).
- Nouveau composant `NotificationsDropdown` : la cloche ouvre un menu
  ancré à droite avec source/type/icône colorée/heure relative/message,
  les plus récentes en haut. Le compteur sur la cloche reste sur les
  non-lues. Bouton « Tout marquer comme lu » dans le header. Bouton
  poubelle pour vider l'historique. Bouton × par ligne pour retirer un
  élément. État vide honnête : « Aucune notification ».
- Fermeture sur clic extérieur et sur `Escape`, comme les autres menus
  de la barre.
- `TopBar.tsx` : l'ancien `<button onClick={clearNotifications}>` ad-hoc
  est retiré, remplacé par `<NotificationsDropdown isDark={...} />`.

**Vérification visuelle** : 3 toasts poussés via `__coachos.shell.addToast`
apparaissent dans le panneau, chacun avec sa couleur (success vert,
warning ambre, error rouge) et son icône. Le badge « 3 » reste sur la
cloche tant que « Tout marquer comme lu » n'a pas été cliqué.

---

## Chantier 3 — `TenantPill` → menu Profile

**Constat** : la pastille locataire vivait dans le cluster droit de la
TopBar, à côté de l'horloge, traitée comme un témoin d'état. Or c'est un
attribut du compte — il a sa place avec les autres entrées de compte,
dans le menu Profile.

**Fait** :
- Nouveau composant `ProfileWorkspaceSection` : section « Espace de
  travail » dans le menu Profile. Affiche le locataire courant avec
  coche verte, la liste des autres (cliquables pour basculer), et
  l'entrée « Enregistrer un espace » en formulaire inline.
- Vocabulaire affiché : **« Espace de travail »**. Le mot « tenant »
  reste réservé à l'identifiant technique (`useTenantStore`, `TenantId`,
  etc.). Les toasts et le bandeau d'aide disent désormais
  « Basculé vers … » et « L'espace « … » existe déjà. ».
- `TopBar.tsx` : le `<TenantPill />` autonome est retiré du cluster droit.
- `TenantPill.tsx` est supprimé — la fonctionnalité vit maintenant dans
  Profile, plus aucun appelant ne s'en servait.

**Pas de modification de la couche de partition** :
- `useTenantStore` inchangé.
- `useCmsStore` et la mirror cross-store (cf. `cms.store.ts` Phase 3) inchangés.
- `tenant.store.ts`, `tenant.contract.ts` inchangés.

**Observation notée pour les agents suivants** : le vocabulaire « tenant »
reste dans le code à cause de la terminologie Phase 3 déjà en place.
Ce serait un travail de fond de renommer `tenant` → `workspace` partout
(et `TenantId` → `WorkspaceId`), avec migration du localStorage
(`coach-os.activeTenantId` → `coach-os.activeWorkspaceId`). Hors-périmètre
de cette passe. Si un agent veut s'en charger, c'est un changement
mécanique pur (rename + storage migration key), mais qui mérite sa
propre passe.

**Vérification visuelle** : le menu Profile affiche la section ESPACE DE
TRAVAIL avec « demo-coach » coché vert, l'entrée « Enregistrer un espace »
en dessous. La barre du haut n'a plus de pastille à côté de l'horloge.

---

## Chantier 4 — `AppDetailOverlay` ne recouvre plus le rail

**Constat** : avec une fiche détail ouverte dans Marketplace, cliquer une
autre section du rail ne faisait rien — le calque recouvrait le rail.
`AppDetailOverlay` lisait `var(--sidebar-w, 0px)`. Quand la variable
n'était pas publiée sur un ancêtre commun (selon l'arbre exact où
l'overlay était monté), le repli `0px` s'appliquait et le calque
couvrait tout depuis la gauche.

**Cause** : `AppFrame` republie `--sidebar-w` sur
`rootRef.current.parentElement`. Quand un app monte l'overlay ailleurs dans
l'arbre (siblings dans le fragment parent, ou wrapper intermédiaire), il
arrive que l'overlay ne descende pas d'un ancêtre portant la variable.
Le repli 0px était la garantie silencieuse qu'on ne voulait surtout pas.

**Fait** : le fix vit dans `AppDetailOverlay` (pas app par app — c'est
explicitement ce que demande le brief).
- Au mount, walk DOM en remontant depuis l'overlay, à la recherche du
  premier ancêtre portant `--sidebar-w`. Lecture via `getComputedStyle`
  (qui résout la cascade).
- Écoute chaque `requestAnimationFrame` tant que l'overlay est ouvert,
  pour suivre AppFrame en temps réel quand l'utilisateur replie ou
  déplie la sidebar pendant qu'une fiche est ouverte.
- Fallback dur à **`240px`** (largeur sidebar déployée) au lieu de `0px`,
  quand aucun ancêtre ne porte la variable. Le rail reste donc toujours
  accessible dans tous les cas, y compris si le câblage CSS variable est
  cassé en aval.

**Vérification visuelle** :
- Marketplace > Browse > ouvrir « Stripe Billing » : overlay à `left: 240px`
  exactement, sidebar « Browse / Installed / Featured » entièrement
  visible à gauche (rect.right = 323, overlay rect.left = 331 → 8 px
  de gap).
- Cliquer « Installed » pendant que le détail est ouvert : le breadcrumb
  passe à « MARKETPLACE / INSTALLED », le détail Stripe Billing reste
  affiché, la sidebar bascule sur Installed (highlight). Le symptôme
  d'origine (clic sans effet) est résolu.

---

## Périmètre respecté

Modifications **uniquement** dans :
- `src/components/cms/CollectionRepeater.tsx` (chantier 1)
- `src/components/NotificationsDropdown.tsx` (nouveau, chantier 2)
- `src/components/TopBar.tsx` (chantiers 2 + 3)
- `src/stores/shell.store.ts` (chantier 2)
- `src/components/ProfileWorkspaceSection.tsx` (nouveau, chantier 3)
- `src/components/TenantPill.tsx` (supprimé, chantier 3 — mort, plus
  aucun appelant)
- `src/components/cms/AppDetailOverlay.tsx` (chantier 4)

Aucun fichier sous `src/apps/<app>/` ni `src/agent/` n'a été touché. Les
fichiers de seed (`cms/seed.ts`, `apps/*/seed.ts`) sont restés intacts —
les incohérences `titleField`/`fields[]` notées au chantier 1 sont
documentées ci-dessus pour les agents P_PEOPLE / W_WEB, mais le fix
lui-même sort du périmètre « socle ».

## Boucle de passes

Passe 1 : chantier 1 (CRUD — le plus gros levier, premier).
Passe 2 : chantiers 2, 3, 4.
Passe 3 : `npx tsc --noEmit` — 0 erreur sur mes fichiers.
Passe 4 : vérification par capture pour chaque chantier (People > Team,
IT/R&D > Deploys, Marketplace > Stripe Billing, Profile menu ouvert,
cloche ouverte après 3 addToast).
Passe 5 : relecture du périmètre — rien de neuf n'est remonté.

Deux passes consécutives sur l'ensemble du périmètre n'ont rien remonté
de neuf → arrêt, rapport.
