# RAPPORT W — Welcome, Marketplace, et l'audit du reste

Statut : **terminé**. Chantiers 1, 2 et 3 traités ; deux passes consécutives sur
l'ensemble des neuf apps n'ont plus rien remonté de neuf.

Commits (dans l'ordre) :

| SHA | Objet |
|---|---|
| `cb134d1` | fix(welcome): la page Demo passe en 2e position du rail |
| `2707bfe` | fix(marketplace): changer de section ferme la fiche de detail |
| `abd7fac` | fix(audit): les fiches de la grille ROI s'ouvrent enfin |
| `d1cc0f8` | feat(marketplace): la fiche de detail installe reellement |
| `414da94` | feat(settings): connecter et deconnecter une integration |
| `50aded3` | fix(marketplace): etat vide honnete et grille responsive |
| `32d49e3` | fix(welcome): les 18 CTA des pages de domaine faisaient rien |
| `016451e` | fix(cognition): etat vide des routines et jetons de bordure |
| `841c205` | fix(welcome): les tuiles du roster People ne debordent plus |
| `1f0818f` | feat(settings): la fiche d'une integration devient atteignable |
| `be9ef2b` | fix(settings): Help mene au reglage qui debloque les rejouages |
| `2393aee` | fix(design): choisir un style dans l'Overview ouvre sa vitrine |
| `45ac9de` | fix(legal): les actions de dossier produisent un effet observable |

Vérification globale : `npx tsc --noEmit` → **0 erreur sur mes fichiers** ;
`npm run build` → OK ; balayage Playwright des 9 apps section par section →
**aucune erreur console**.

---

## CHANTIER 1 — la Demo en 2ᵉ position

`onboarding-demo` était déclarée en 9ᵉ et dernière position de `LANDING_PAGES`.
Le bloc a été déplacé en tête du tableau, `id` inchangé (référencé par
`PAGE_ICON`, `PageCanvas`, `OverviewPanel` — vérifié par grep avant).

Le rail latéral, le bandeau d'ancres (`PageChrome`) et le fil d'Ariane dérivent
tous du même tableau : l'ordre suit partout, sans autre modification. Capture :
le rail lit `Arrivée → OMK Coach Demo → OMK RH → …`.

---

## CHANTIER 2 — navigation sous une fiche ouverte

**Symptôme reproduit avant correctif** : fiche « Stripe Billing » ouverte, clic
sur `Installed` → le fil d'Ariane passait à `MARKETPLACE / INSTALLED` mais la
fiche restait affichée par-dessus. On naviguait derrière un calque, ce qui se lit
à l'écran comme un clic sans effet.

**Cause** — et ce n'était pas celle du socle. L'agent S avait traité le décalage
`--sidebar-w` de `AppDetailOverlay` ; le rail était donc bien visible et
cliquable. Le défaut restant était côté app : Marketplace publiait son crumb via
`useWindowPage().setDetail` **et** appelait `useCollectionDrill` sur la même
collection. Le drill republie ce crumb partagé avec son propre `onBack`, qui ne
ferme que son état interne. Son effet s'exécutant après celui de l'app, c'est lui
qui gagnait : `AppFrame.navigateToSection` appelait donc un `onBack` qui laissait
l'overlay ouvert. Le drill était par ailleurs mort ici — son `openId` n'était
jamais lu. Retiré.

**Le même test appliqué à toutes les apps du périmètre ayant des fiches** :

| App | Résultat |
|---|---|
| Marketplace | corrigé (ci-dessus), vérifié par capture |
| Legal | passe — les drills y sont scopés par section, pas de conflit |
| Audit | passe — l'overlay y est piloté par le drill seul, source unique |
| Settings | fiche ajoutée au chantier 3, crumb publié, fermeture vérifiée |
| Welcome, Onboarding, Design, Ontology, Cognition | pas de page de détail |

Le motif à double publication (`useCollectionDrill` + `setWindowDetail` sur la
même collection) existe dans **12 apps** du dépôt. Seule Marketplace était
réellement cassée, mais c'est une bombe à retardement — voir « hors périmètre ».

---

## CHANTIER 3 — les fonctionnalités oubliées, par cause

Les défauts sont rangés par cause, la plus explicative d'abord.

### Cause A — un identifiant qui ne correspond à rien (2 symptômes)

`useCollectionDrill(collection, label)` prend en 2ᵉ argument le **label de
section**, comparé à `activePage` pour savoir si le drill est visible ; quand il
ne l'est pas, il referme toute fiche ouverte. Un label qui ne correspond à aucune
section rend donc les cartes de cette grille définitivement inertes.

- **Audit > ROI** : drill déclaré sous `'Arbitrage & ROI'` (le nom de la
  collection dans le seed) alors que la section s'appelle `'ROI'`. Mesure du DOM
  au clic d'une carte, avant → après correctif :

  | Grille | avant | après |
  |---|---|---|
  | Arbitrage | 2313 → 3194 | inchangé |
  | Contexte | 2495 → 3434 | inchangé |
  | Données | 2540 → 3361 | inchangé |
  | Automatabilité | 2335 → 3112 | inchangé |
  | **ROI** | **2388 → 2388** | **2389 → 3150** |

  Quatre grilles sur cinq ouvraient leur fiche, la cinquième non.
- **Design** : les ids de `STYLES` et ceux des sections coïncident pour 19 styles
  sur 20 ; `cyberpunk` était déclaré `cyber` côté sections. Aligné.

Un balayage de tous les `useCollectionDrill` du dépôt confirme qu'il ne reste
aucun autre label orphelin.

### Cause B — une ancre HTML dans un conteneur défilant (18 symptômes)

Chacun des 9 canvases de Welcome porte deux appels à l'action : un dans le héros,
un dans la section de fermeture. Les 18 étaient des `<a href="#cta">`, morts pour
deux raisons cumulées : les sections portent un attribut `data-anchor` et non un
`id`, et surtout le corps défilant est un conteneur interne — une ancre native
fait défiler le document, qui lui ne bouge pas.

Mesure : sur la page Demo, cliquer le CTA du héros laissait `scrollTop` à 0.

Le mécanisme correct existait déjà dans `PageChrome.scrollTo` (recherche
`[data-anchor]` dans le conteneur). Extrait en `scrollToAnchor()` exporté, pour
qu'il n'y ait qu'une implémentation.

- CTA du héros → défile jusqu'à la section de fermeture. Vérifié sur les 9 pages :
  `scrollTop` 0 → ~2400 px.
- CTA de fermeture → il vivait **dans** la section qu'il ciblait, donc pointait
  sur lui-même. Sur les 8 pages de domaine il ouvre désormais la page Demo (la
  porte d'entrée du produit, celle que le chantier 1 met en avant) ; sur la page
  Demo il ouvre l'app Onboarding, ce que promet son libellé « Take the 4-question
  check ». Vérifié : `windows: [welcome] → [welcome, onboarding]`.

### Cause C — un état affiché sans mutation possible (4 symptômes)

- **Marketplace, fiche de détail** : `MarketplaceDetailPage` accepte une prop
  `onInstall` et affiche un CTA « Install — included » quand elle est fournie ;
  l'app ne la passait jamais. Sur une intégration non installée, le bouton
  principal de la fiche se contentait donc de revenir à la collection. Branché
  sur le même chemin d'écriture que la grille. Vérifié sur « LinkedIn Reach ».
- **Settings > Integrations** : la collection était rendue en lecture seule —
  trois cartes, un badge, aucune action. Chaque carte gagne un bouton
  Connecter / Déconnecter (mutation `status` + toast). L'ajout d'une intégration
  passe par le Marketplace, ce que dit déjà le bouton de l'état vide.
- **Legal, les deux fiches** : « Send for signature » et « Counter-sign » ne
  poussaient qu'un toast. Un toast disparaît en cinq secondes et ne laisse aucune
  trace. Pire, la version de `LegalDetailPage` calculait un booléen `ok` pour
  ensuite émettre **le même message dans les deux branches** — condition morte.
  Les deux écrivent désormais le statut dans le CMS ; vérifié : « Coaching
  engagement » passe de `active` à `pending signature`, visible dans la fiche
  puis dans la liste après retour. « Print or export » appelait déjà
  `window.print()` : effet réel, laissé tel quel.

Un balayage de tous les `onClick` du périmètre confirme qu'il ne reste **aucune
action dont le seul effet soit un toast**.

### Cause D — un écran vide sans porte de sortie (4 symptômes)

- **Marketplace ×3** : les trois sections rendaient `list.map` sans traiter le cas
  vide. Désinstaller la dernière intégration laissait `Installed` sur un écran
  blanc. Chaque section a désormais une phrase qui explique ce qui manque et un
  bouton qui mène là où on le crée.
- **Cognition** : la section Routines disparaissait entièrement quand la
  collection était vide — rien n'indiquait au coach que des routines existent ni
  d'où elles viennent. Elle reste affichée avec une phrase honnête.

### Cause E — une fiche écrite mais inatteignable (1 symptôme)

`SettingsItemDetail` est complète — formulaire contrôlé, aperçu vivant, écriture
CMS, toast — mais aucun chemin ne l'ouvrait. Le routage générique passe par
`COLLECTION_OWNERSHIP` (`components/cms/itemDetailRegistry`) où
`settings_integrations` n'est pas déclarée ; le commentaire y dit encore
« Settings — none in seed », ce qui n'est plus vrai depuis la Phase-D2.

L'app monte donc sa fiche elle-même dans un `AppDetailOverlay`, comme Legal et
Marketplace. Le crumb est publié pour que changer de section la ferme — vérifié.

### Cause F — une phrase qui nomme un réglage sans y mener (1 symptôme)

**Settings > Help** : les cinq boutons Replay sont désactivés tant que le
consentement observabilité est off, et le texte se contentait de dire « Turn on
Observability in Privacy ». Un bouton « Ouvrir Privacy » apparaît désormais quand
le consentement est off, et disparaît une fois activé.

### Cause G — un point de rupture qui mesure la mauvaise chose (1 symptôme)

**Welcome > OMK People**, encart « Ton roster, ce matin » : `grid-cols-3` sans
point de rupture dans une colonne qui fait 5/12 de la largeur. À la taille par
défaut de la fenêtre (920 px) chaque tuile tombait à 55 px et le label « sièges
actifs » débordait. Les breakpoints Tailwind mesurent la viewport et non le
conteneur, donc un `sm:` n'aurait rien protégé. Passé à
`grid-cols-2 2xl:grid-cols-3` (règle du dépôt). Mesure : 55 px → 88 px, plus
aucun débordement.

### Cause H — vocabulaire et jetons (3 symptômes)

- **Audit** : le titre affiché (`Manuel de Diagnostic IA`) divergeait du nom du
  registre `app-discovery` (`Audit Diagnostic IA`). Aligné, « Manuel » passe en
  sous-titre. C'est le pendant du cas « Sales Sanctum » cité au brief.
- **Cognition** : commentaire de bas de fichier parlant de « Sales Sanctum » →
  « Sales OS ».
- **Cognition** : deux `divide-stone-100` (palette Tailwind en dur) →
  `var(--panel-border-subtle)`. Les couleurs sémantiques (vert actif, ambre
  alerte) restent en hex explicite, conformément au canon.

---

## Les neuf apps, une par une

| App | Verdict |
|---|---|
| **welcome** | Demo en 2ᵉ position ; 18 CTA morts réparés ; débordement du roster People corrigé. Les 9 cartes de l'Arrivée et les 9 pages du rail naviguent — vérifié une par une. |
| **marketplace** | Navigation sous fiche réparée ; CTA d'installation branché ; 3 états vides ajoutés ; grille 1/2/3 colonnes. |
| **onboarding** | RAS. Quiz 4 questions parcouru de bout en bout : bouton Next correctement désactivé sans réponse, bande de score au reveal, Restart fonctionnel. Les 6 icônes du mini-dock ouvrent, focalisent et ferment leur fenêtre. |
| **design** | Les 20 cartes du picker étaient des boutons morts ; corrigé et vérifié sur les 20. Les 21 sections rendent sans `NaN`/`undefined`. |
| **ontology** | RAS. 4 sections saines ; les cartes d'entité ouvrent leur détail ; les filtres source/cible de Relations passent de 20 à 1 ligne et le bouton Réinitialiser restaure 20. |
| **settings** | Connexion/déconnexion des intégrations ; fiche de détail rendue atteignable ; Help mène à Privacy. Les 8 sections rendent sans valeur suspecte. |
| **legal** | Deux actions de dossier réparées sur les deux fiches. CRUD générique vérifié en conditions réelles (création refusée à vide, acceptée remplie, 3 → 4 cartes). Le toggle AI-Act mute bien le compteur (3/5 → 2/5). |
| **audit** | Grille ROI réparée ; titre aligné sur le registre. Les 5 grilles ouvrent désormais leur fiche. |
| **cognition** | État vide des routines ; jetons de bordure ; nom d'app dans le commentaire. |

---

## Ce que j'ai vu hors périmètre et laissé aux autres

1. **`components/cms/itemDetailRegistry`** — `COLLECTION_OWNERSHIP` ne contient
   pas `settings_integrations` et son commentaire (« Settings — none in seed »)
   est périmé depuis la Phase-D2. Contourné côté app ; la vraie place de
   l'entrée est là.
2. **`hooks/useCollectionDrill`** — le hook écrit dans le `setDetail` partagé du
   `WindowContext` sans savoir si l'app y a déjà publié son propre crumb. C'est
   ce qui cassait Marketplace. **12 apps** appellent à la fois `useCollectionDrill`
   et `setWindowDetail` sur la même collection : `clients`, `dashboard`,
   `finance`, `growth`, `it-rd`, `legal`, `operations`, `people`, `product`,
   `sales`, `tasks` (+ marketplace, réglée). Elles ne sont pas toutes cassées
   aujourd'hui — l'ordre des effets et le scope des labels les sauvent — mais le
   motif est fragile. Une garde dans le hook (ne pas écraser un crumb qu'il n'a
   pas posé) serait le correctif de fond.
3. **`clients/ClientsApp.tsx:89,107`** — même double appel que Marketplace, avec
   `drill.open(id)` en plus du `setDetail` local. Non testé (hors périmètre).
4. **Seeds : `titleField` absent de `fields[]`** — 44 collections du dépôt, dont
   5 dans `apps/audit/seed.ts` et 1 dans `apps/legal/seed.ts`. Le motif est
   général et le commit `313711c` l'a traité génériquement : création vérifiée
   en conditions réelles sur `contracts` (refus à vide, création acceptée).
   Rien à faire, noté pour lever le doute soulevé au rapport S.
5. **`welcome/landing/Blocks.tsx:419` — `ClosingCta` n'est appelée nulle part.**
   Code mort. Non supprimé (consigne : signaler, pas retirer).
6. **Vocabulaire « citadel » vs « Citadelle »** — 51 occurrences de la forme
   anglaise contre 7 de la forme canon. Ce ne sont **pas** des variantes du même
   mot : « Citadelle » désigne l'offre haut de gamme, « citadel » le mini-bureau
   de démonstration de l'Onboarding (`__citadel__`, `hasSeenCitadel`). Les
   fusionner abîmerait deux concepts distincts. Laissé tel quel, à trancher par
   A0 si un renommage produit est voulu.
7. **`DesignApp`** — 149 classes de palette Tailwind en dur. C'est le **contenu**
   de l'app : une vitrine de 20 langages visuels, où `bg-white` dans une démo
   Glassmorphism est le sujet et non une violation de jetons. Vérifié par capture
   en `dark-oled` : le chrome du picker reste lisible. Non touché.

---

## Instruments : deux mesures qui ont menti

Consigné parce que le CLAUDE.md du dépôt en fait une règle, et que ça s'est
reproduit deux fois ici.

1. **« Audit : aucune fiche ne s'ouvre »** — mon premier script comparait le
   texte du `body` avant/après clic et concluait « clic sans effet » sur les 5
   grilles. En réalité l'overlay s'ouvrait bien (2313 → 3194 caractères) et mon
   extrait de texte tombait sur la grille rendue en dessous. Sans la mesure
   corrigée, j'aurais « réparé » quatre grilles qui marchaient. Le vrai défaut
   était sur une seule.
2. **« Settings : les boutons sont coupés à 920 px »** — la capture montrait les
   boutons tronqués au bord droit. Mesure DOM : la **fenêtre de l'OS** fait 920 px
   mais est positionnée à `left: 90`, donc elle sort de la viewport de 920 ; le
   bouton est à `x=964`, bien à l'intérieur de la fenêtre qui finit à `1010`.
   J'avais déjà ajouté un `flex-wrap` pour corriger ce non-bug : **annulé**
   (`git checkout`) après vérification qu'à 760 px maximisé le bouton tient
   (715 < 732 < 760).

---

## Boucle de passes

- Passe 1 : chantiers 1 et 2 (les deux bugs nommés par l'utilisateur).
- Passe 2 : chantier 3, app par app, défauts rangés par cause ; correction de la
  cause la plus explicative d'abord.
- Passe 3 : `npx tsc --noEmit` — 0 erreur sur mes fichiers ; `npm run build` OK.
- Passe 4 : vérification par le rendu — captures en `glassmorphism` et
  `dark-oled`, à 920×600 et 1920×1080, sur chaque section touchée.
- Passe 5 : reparcours complet du périmètre → a remonté du neuf (Design picker,
  Legal toasts, Settings Help) → retour en passe 2.
- Passe 6 : reparcours complet → plus rien de neuf. Arrêt.
