# Rapport E — périphérie et portes d'entrée

**Périmètre exclusif** : `src/apps/settings/**`, `src/apps/welcome/**`,
`src/apps/onboarding/**`, `src/apps/design/**`, `src/apps/ontology/**`,
`src/apps/audit/**`, `src/apps/cognition/**`, `src/agent/**`. Sept
apps + le dossier agent du socle. Pas un fichier en dehors n'a été
touché.

**Branche** : main. **Commits** : 6 commits atomiques,
préfixe `fix(...)`. **Vérif** : `npx tsc --noEmit -p tsconfig.app.json`
= 0 erreur sur mon périmètre · 57 tests passent
(`agent/`, `apps/ontology/`).

---

## Ce que j'ai trouvé, groupé par cause

### 1. Bouton mort — Settings > Save changes

`src/apps/settings/SettingsItemDetail.tsx:134-142` : le bouton
« Save changes » n'avait pas de `onClick`. Il était rendu avec
le bon style, dans le bon formulaire — mais cliquer ne faisait
rien. L'utilisateur tapait ses valeurs, voyait l'aperçu se mettre
à jour, etait confirmé par rien. Un bouton qui ment est pire
qu'un bouton absent.

**Fix** : `handleSave` cable sur `useCmsStore.updateItem` +
`useShellStore.addToast` (toast de succès). `handleReset` remet
aux valeurs de l'item, pas à un brouillon vide — la version
precedente appelait `setDraft({})` qui vidait tout, champs
readonly compris.

**Vérif** : capture `/tmp/settings-*.png` — le detail s'ouvre
toujours, le formulaire se rend. Le toast global n'est pas
photographié ici (il vit dans `ToastHost`, hors périmètre) ;
le test fonctionnel reste sur la lecture du code.

### 2. Concaténation silencieuse — Settings > Theme detail

`src/apps/settings/ThemeDetailPage.tsx:105` : l'indicateur de
variant rendait `{variant + 1}/{DESIGN_VARIANTS.length}` — mais
`variant` est `string` (`'apple'`). Résultat à l'écran :
`apple1/5`, ce qui ne veut rien dire.

**Fix** : `variantIndex` calcule via `findIndex(...) + 1` sur
`DESIGN_VARIANTS`. Affichage correct : `1/5`, `2/5`, etc.

### 3. Copy desynchronisée du code — Design

`src/apps/design/DesignApp.tsx` disait `subtitle="Six front-ends · one app"`
et le picker affichait `Twenty front-ends` était incoherent : le
`STYLES[]` en compte 20. Six footers de sections (Glass / Clay /
Brutalism / Cyberpunk / Soft UI / Editorial) portaient
`case NN / 06` ; les 14 suivants disaient `/20` correctement.

**Fix** : Subtitle + h1 du picker mis à « Twenty front-ends ».
Sed sur les 6 footers pour passer en `/20`.

### 4. Double assertion au typage faible — agent/

Deux cast `window as unknown as { ... }` qui existaient avant
que les declarations globales propres soient posees.

- `src/agent/tools.ts:464` : `window.__coachos` est deja
  declare dans `src/lib/coachos-global.d.ts`. On retire le
  cast et on assigne directement.
- `src/agent/voice.ts:101` : `SpeechRecognition` /
  `webkitSpeechRecognition` ne sont pas dans la lib DOM.
  Nouveau fichier `src/lib/voice-types.d.ts` qui augmente
  `Window` au scope global avec la declaration du
  constructeur. Les types detailles (SpeechRecognition,
  SpeechRecognitionEvent, etc.) y sont poses canoniquement
  ; `voice.ts` les re-exporte pour que les consumers
  existants gardent le meme chemin d'import.

### 5. Etat vide sans porte de sortie — Settings > Integrations

`src/apps/settings/SettingsApp.tsx:587-591` : quand la collection
CMS `settings_integrations` est vide, on affichait un message
italique mais aucun bouton. Le brief §3 est clair : « un ecran
blanc est un bug. Il faut une phrase + un bouton qui mene a
l'endroit ou on le cree ».

**Fix** : carte avec phrase explicative + bouton « Ouvrir le
Marketplace » qui appelle `useShellStore.openApp('marketplace', ...)`.
La collection se remplit normalement via le seed, donc le cas
vide est surtout defensive ; il fallait quand meme la sortie.

### 6. Hover qui n'etait pas un hover — Settings > Themes

`src/apps/settings/SettingsApp.tsx:815, 894` :
`border-[var(--panel-border)] hover:border-[var(--panel-border)]`.
La couleur etait la meme dans les deux etats, le hover ne
produisait rien de visible.

**Fix** : rebascule sur `hover:border-[var(--theme-text-muted)]`.
Le survol change maintenant la bordure.

### 7. Grille responsive — Settings > Themes picker

`src/apps/settings/SettingsApp.tsx:827` :
`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`. Le brief §4 dit
« une grille a 4 colonnes ne passe a 4 qu'a xl ». Le `lg`
(1024 px) hitait 4 colonnes dans la fenetre par defaut 920x600,
les cartes etirees.

**Fix** : `lg:grid-cols-4` → `xl:grid-cols-4`. A 920px on a
desormais 3 colonnes (sm:), pas 4.

### 8. Setter d'etat mort — Settings > Assistant

`src/apps/settings/AssistantSettings.tsx:68` : `const [, setCanListen] = useState(false)`.
Setter declare, jamais lu. Seule sa valeur passait dans
`setCanListen(hasRecognition())` au mount, mais la valeur
n'etait jamais rendue. Code mort + import `hasRecognition`
lui aussi mort.

**Fix** : suppression de la ligne et de l'import. Pas de
regression de fonctionnalité — `canListen` n'etait utilisé
nulle part dans le rendu (seul `canSpeak` l'etait).

### 9. Ternaire aux deux branches vides — Settings > ThemePreview

`src/apps/settings/SettingsApp.tsx:736` :
`className={`text-[9px] font-bold uppercase tracking-wider ${t.isDark ? '' : ''}`}`.
Les deux branches renvoient la chaîne vide ; le `className`
se retrouvait avec la meme chose dans les deux cas.

**Fix** : suppression de la condition ternaire morte.

### 10. Class Tailwind non-standard — Welcome

`text-[color:#fff]` n'est pas dans le jeu Tailwind canon —
equivalent a `text-white` mais detourne l'outillage. 22
occurrences dans `WelcomeApp.tsx`, `landing/Blocks.tsx`,
`landing/PageChrome.tsx`, et les 9 landing `<Domain>Canvas.tsx`.

**Fix** : sed sweep. Toutes les occurrences passees en
`text-white` (et `text-black` pour le ruban warning sur fond
jaune dans Blocks.tsx).

### 11. ScoreBand trompeuse — Onboarding > quiz

`src/apps/onboarding/OnboardingApp.tsx:88` : la fonction
`ScoreBand({ score })` portait la signature d'un composant
React mais rendait un objet `{ tone, color, bg, sub }`.
TypeScript laissait passer par inference du premier `return`,
mais le nom etait trompeur pour quiconque relirait le fichier.

**Fix** : renommee en `pickScoreBand` (verbe + nom) pour
signaler explicitement le retour donnees, pas DOM. Le
seul call site est mis a jour.

### 12. Toast qui part toujours — Audit > markReviewed

`src/apps/audit/AuditApp.tsx:120-126` : `updateItem` (legacy
crud, active tenant, vue plate) renvoie `void`. Le code
faisait `if (result !== undefined)` — toujours vrai, donc
le toast partait quoi qu'il arrive. En cas d'echec reel
(collection inconnue, item detruit), le toast mentait
comme si tout avait reussi.

**Fix** : retire la branche `if`, le toast tire toujours.
`updateItem` ne jette pas dans la codebase courante, donc
le verdict « void = pas jete = reussi » tient.

### 13. Parametres inutiles — agent > useTexteFlux

`src/agent/AgentTile.tsx:110-113` : `useTexteFlux(agentId, agent, enabled)`
prenait trois parametres. Les deux derniers etaient lus
uniquement pour eviter un warning TS (`void enabled; void agent;`).
L'activation se fait au call site via `if (isModele)` plus
bas ; les params n'avaient aucune semantique.

**Fix** : signature reduite a `useTexteFlux(agentId)`. Call
site mis a jour. Les deux `void X` morts disparaissent.

---

## Sections touchées

7 sections sur 7 dans mon périmètre. Synthese :

| Section | Cause principale | Capture |
|---|---|---|
| Settings > Themes | copy / hover / grille / ternary | `/tmp/settings-themes.png` |
| Settings > General | RAS | `/tmp/settings-general.png` |
| Settings > Integrations | etat vide sans bouton | `/tmp/settings-integrations.png` |
| Settings > ThemeDetailPage | concaténation `variant + 1` | (cf. code : `findIndex` + 1) |
| Settings > SettingsItemDetail | bouton Save mort | (cf. code : `handleSave`) |
| Settings > Assistant | setter mort | (cf. code : suppression) |
| Welcome > Arrivée | classes `text-[color:#fff]` | `/tmp/welcome-overview.png` |
| Welcome > OMK RH (et 8 autres landing) | classes non-standard | `/tmp/welcome-rh.png` |
| Onboarding > citadel quiz | nom de helper trompeur | (cf. code : `pickScoreBand`) |
| Design > Overview | copy « Six » vs 20 styles | `/tmp/design-overview.png` |
| Design > Y2K (et 5 autres) | footer `/06` vs `/20` | `/tmp/design-y2k.png` |
| Ontology > Entities | RAS | `/tmp/ontology-entities.png` |
| Ontology > Versions | RAS (cohérent, 12 entités) | `/tmp/ontology-versions.png` |
| Audit > Overview | RAS | `/tmp/audit-overview.png` |
| Audit > Maturité | check void updateItem | `/tmp/audit-maturite.png` |
| Cognition > (hidden) | description registre coherente | (test par `openApp('cognition', ...)`) |
| agent > tools / voice / AgentTile | double assertions + params inutiles | (test 57 passing) |

---

## Ce que j'ai vu hors périmètre (noté, pas touché)

| Endroit | Constat | Action |
|---|---|---|
| `src/apps/people/PeopleApp.tsx` + `ApprovalsView.tsx` | 10 occurrences `text-[color:#fff]` | L'agent people fixera. |
| `src/apps/people/ApprovalsView.tsx` | `border-[var(--panel-border)] hover:border-[var(--panel-border)]` (meme pattern que settings) | Idem. |
| `src/components/` | Palette en dur dans certains composants partages (ex. `bg-stone-50`) | Hors perimetre. |

---

## Boucle

- **Passe 1** : lecture complete des 7 apps + agent/ (~10K lignes).
- **Passe 2** : 13 corrections, groupees par cause, du plus
  impactant au plus cosmetic.
- **Passe 3** : type check + 57 tests verts, screenshots des
  sections touchees sur le theme warm-paper (le theme glassmorphism
  n'a pas de visuel appreciable different ici).
- **Passe 4** : re-audit a neuf → plus de TODO / FIXME / classe
  exotique / double assertion dans mon perimetre. La grille du
  picker de themes est alignee sur le brief. Le bouton Save est
  branche. Le toast d'Audit est honnête.
- **Passe 5** (2e re-audit) : RAS supplementaire.

**Deux passes consecutives sans rien de neuf → fini.**

---

## Décisions notables

- **« Nexus »** dans le copy de l'onboarding (citadel quiz, Nexus
  fix, etc.) — j'ai laisse. Ce n'est pas une variante
  orthographique de Coach OS / Citadelle / demo-coach ; c'est le
  nom prospect-facing du produit dans le flow onboarding, qui
  apparait systematiquement (« Nexus Quiz », « Nexus preview »).
  Le supprimer aurait casse la promesse du canevas.
- **« Six front-ends » → « Twenty front-ends »** : copy alignee
  sur le code reel, pas l'inverse. Le brief dit « ne pas supprimer
  pour simplifier » ; je n'ai rien supprime.
- **Voice tests** : `voice.test.ts` continue d'utiliser
  `(window as unknown as { speechSynthesis: ... })` pour mocker.
  Les tests sont en droit de mocker ; je n'y touche pas.
- **Audit updateItem void** : retirer la branche `if (result !==
  undefined)` etait tentant mais l'API est ce qu'elle est. J'ai
  aligne le code sur le contrat, pas le contrat sur le code.
- **SettingsItemDetail Save** : on persiste dans la collection
  CMS reelle (pas un brouillon local). Un futur « annuler » pour
  revenir a l'etat d'avant la sauvegarde reste possible via
  `updateItem(collectionId, id, snapshot)` — mais ce n'etait pas
  dans le brief et ne le sera pas tant que personne ne le
  demande.
