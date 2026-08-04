# Coach OS — Pages de détail par app, un style par app

**Date :** 2026-07-30
**Statut :** Design validé, en attente d'implémentation
**Repo :** `C:/Users/amado/coach-os/`
**Sister canon :** `wiki/hand_offs/2026-07-28_drawbridge_coach_os_iterations.md`, Phase 48 `DetailPage` canon, `AppFrame` pattern.

---

## 1. Contexte

Coach OS héberge 18 apps dans un desktop-web OS (Vite + React 19 + Zustand + Tailwind v4). 13 apps sont visibles sur le bureau (les autres sont *hidden* et dwelled dans des apps parentes). Chaque app a déjà sa propre palette runtime via `CANONICAL_APP_THEMES` dans `src/lib/themes/tokens.ts` et son accent hex dans `src/lib/app-registry.ts`.

Le drill vers un item (c'est-à-dire l'ouverture de la page de détail d'un client, d'un deal, d'un contrat, etc.) suit aujourd'hui deux patterns concurrents :

1. **`<DetailPage>` canon (Phase 48)** — header + 56×56 icon block + dl + action. Utilisé par Sales.
2. **`<DynamicPageView>` CMS** — header + hero metric + grille 2-col + prev/next. Utilisé par Clients, Operations, Finance, Legal, IT/R&D, Product, Growth, Tasks, Marketplace.

Les utilisateurs ont remonté (Drawbridge + handoff Phase 40) que les pages de détail manquent d'identité par app : tout se ressemble parce que les deux patterns sont structurellement identiques et que les accents ne sont pas exploités. Le but de ce projet est de donner à chaque app **un layout signature, un motion signature et un caractère typographique qui la distingue en moins d'une seconde d'observation** — sans casser le pattern "sidebar reste visible pendant le drill" déjà validé pour Sales.

## 2. Décisions de cadrage

- **Périmètre :** les 13 apps visibles du desktop. Cognition et Audit (cachées, dwelled dans Sales) gardent leur template actuel.
- **Style :** layout adaptatif par app (pas seulement chromatique). Chaque app a SON arrangement de blocs.
- **Pattern de code :** hardcodé par app — 13 composants `*DetailPage.tsx`, pas de renderer déclaratif.
- **Shell :** factorisation du pattern `SalesApp.tsx:510-528` en `<AppDetailOverlay>` réutilisable.
- **Motion :** une motion signature par app sur l'entrée uniquement, jamais de motion parasite. Respecte `prefers-reduced-motion`.
- **Responsive :** s'aligne sur le breakpoint existant `NARROW_BREAKPOINT = 640` d'`AppFrame`. L'overlay prend l'espace restant après la sidebar (240px wide, 68px en mode narrow).
- **Tests :** vérification manuelle via Drawbridge + handoff. Pas d'infra Playwright/Vitest dans le repo (D6 honest gap).

## 3. Architecture

### 3.1 Composant `<AppDetailOverlay>` (nouveau)

**Fichier :** `src/components/cms/AppDetailOverlay.tsx`

**Contrat :**

```ts
type AppDetailOverlayProps = {
  appId: string;                         // data-testid + scope CSS var
  accent: string;                        // couleur d'accent résolue via useThemeFor
  onBack: () => void;                    // ferme l'overlay
  motion: OverlayMotion;                 // signature d'entrée
  children: ReactNode;                   // le *DetailPage spécifique
};

type OverlayMotion =
  | { kind: 'fade-up';     durationMs: number }
  | { kind: 'slide-left';  durationMs: number }
  | { kind: 'slide-right'; durationMs: number }
  | { kind: 'slide-bottom';durationMs: number }
  | { kind: 'pop-scale';   durationMs: number }
  | { kind: 'fade-blur';   durationMs: number }
  | { kind: 'type-in';     durationMs: number }
  | { kind: 'unfold';      durationMs: number };
```

**Comportement :**

- Rendu : `position: absolute, inset-y-0, left: var(--sidebar-w, 240px), right: 0, z-50, bg-[var(--theme-bg)]`. La variable CSS `--sidebar-w` est définie par `AppFrame` sur son root (240px en wide, 68px en mode narrow).
- L'overlay occupe uniquement l'espace contenu de l'AppFrame (pas de backdrop plein fenêtre). Les clics dans la zone sidebar ne traversent pas l'overlay (la sidebar reste interactive, l'overlay n'est pas au-dessus d'elle).
- Respecte `prefers-reduced-motion: reduce` : si vrai, toutes les motions passent en `duration: 0` (pas d'animation, rendu instantané).
- Expose `role="main"` et `aria-label="${appName} detail"` sur son conteneur.
- À l'ouverture, focus le premier `<h1>` trouvé dans `children` (focus management).
- Stoppe la propagation du scroll pendant l'ouverture pour éviter que le content de l'AppFrame défile en parallèle.
- Classe `data-testid="app-detail-overlay"` + `data-app="${appId}"` pour la validation Drawbridge.

### 3.2 Pattern d'usage dans une app

Pattern canon dans `src/apps/sales/SalesApp.tsx:510-528` (refactor à appliquer) et à dupliquer dans les 12 autres apps.

```tsx
// Dans l'App, après la sidebar AppFrame :
const [detail, setDetail] = useState<DetailItem | null>(null);
const { setDetail: setWindowDetail } = useWindowPage();

useEffect(() => {
  if (detail) {
    setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
  } else {
    setWindowDetail(null);
  }
}, [detail, setWindowDetail]);

return (
  <AppFrame title="Sales Sanctum" sections={sections} icon={...} accent={...}>
    {sections.map(s => s.render())}
    {detail && (
      <AppDetailOverlay
        appId="sales"
        accent="#ea580c"
        onBack={() => setDetail(null)}
        motion={{ kind: 'slide-right', durationMs: 200 }}
      >
        <SalesDetailPage item={detail} onBack={() => setDetail(null)} />
      </AppDetailOverlay>
    )}
  </AppFrame>
);
```

### 3.3 Schéma du flux

```
WindowFrame (drag/resize, traffic lights, breadcrumb via WindowContext)
  └── AppFrame (sidebar 240↔68px, content slot, AI tools panel)
        ├── [sections...]                (rendu par AppFrame)
        └── AppDetailOverlay             (absolute, par-dessus le content)
              └── AppDetailPage           (le *DetailPage spécifique)
```

L'AppFrame reste montée pendant le drill. Le back button dans l'overlay ferme le détail mais pas la fenêtre.

## 4. Inventaire des 13 layouts signature

Chaque `*DetailPage` partage un contrat : back button + meta label + titre (`<h1>`) + motion signature via l'overlay, puis le layout signature de l'app.

| # | App | Thème runtime | Layout signature | Motion entrée |
|---|-----|----------------|------------------|---------------|
| 1 | Dashboard | `dark-oled` | Hero metric 56px + grid 2-col dense (KPI cards 4×) + Activity timeline | `fade-up` 220ms |
| 2 | People | `aurora` | Hero + 3-column profile (Avatar block / Meta stack / Squad chips) | `slide-left` 220ms |
| 3 | Operations | `brutalism` | Hero + 2-col split (Runbook body / Sidebar meta) + bordered incident chips | `fade-up` 200ms |
| 4 | IT / R&D | `cyberpunk` | Terminal-style header (mono font) + 2-col (Logs stream / Deploys) | `type-in` 280ms |
| 5 | Clients | `claymorphism` | Hero + portrait + 3-pill stack (Active contract / Onboarding step / Churn risk) | `pop-scale` 200ms |
| 6 | Tasks | `editorial` | Hero + vertical single-column (prose serif) + due-date eyebrow | `slide-bottom` 220ms |
| 7 | Marketplace | `glassmorphism` | Hero + bento grid 2×2 (screenshots / stats / install state) | `fade-blur` 240ms |
| 8 | Product | `brutalism` | Hero + Roadmap row (status chips) + 2-col (Spec body / Linked channels) | `slide-right` 220ms |
| 9 | Growth | `vibrant-block` | Hero + 2-col split (Funnel viz / Experiment table) | `fade-up` 220ms + scale 0.95→1 |
| 10 | Sales | `liquid-glass` | Hero + 2-col (Context card / Action stack) — déjà canon | `slide-right` 200ms |
| 11 | Finance | `trust` | Hero + KPI strip horizontal (3 chiffres) + dense data table | `fade-up` 240ms |
| 12 | Legal | `trust` | Hero + accordéon contractuel (clauses collapsibles) | `unfold` 240ms |
| 13 | Settings | `warm-paper` | Hero + 2-col (Form / Preview) | `pop-scale` 200ms |

**Caveats :**
- Sales garde son `SALES_DETAIL_META` et son `<DetailPage>` existant, juste factorisé dans `<AppDetailOverlay>`.
- Legal et Finance partagent le thème `trust` — leur distinction vient du layout (accordéon vs KPI strip + table), pas du thème.
- Operations et Product partagent `brutalism` — distinction par le contenu (incident chips vs roadmap row).

## 5. Système d'identité visuelle

Chaque page tire son identité de **4 sources combinées** :

1. **Thème runtime** via `useThemeFor(appId)` — fournit `--theme-bg`, `--theme-surface`, `--theme-text`, `--theme-radius`, `--theme-font-display`, `--theme-font-body`. Aucune valeur de couleur en dur dans les `*DetailPage`.
2. **Accent app** via le hex de `app-registry.ts` — passé à `<AppDetailOverlay>` en prop, utilisé pour la tuile 56×56 du header et le CTA d'action.
3. **Layout signature** (cf section 4) — disposition, taille des blocs, composition.
4. **Motion signature** (cf section 4) — entrée uniquement, pas de motion parasite.

**Pour l'identité perçue** : ouvrir 4 apps différentes (Sales, Finance, Legal, Growth) et drill dans un item de chacune. Un observateur extérieur doit pouvoir nommer chaque app en moins d'1 seconde grâce à la typographie (serif = trust, mono = cyberpunk, display block = brutalism), au radius (sharp 0 = brutalism, large 28 = liquid-glass) et au layout signature (data table = finance, accordéon = legal, funnel = growth).

## 6. Responsive & accessibilité

### 6.1 Responsive

- À 640px (sidebar collapse → 68px), `<AppDetailOverlay>` occupe l'espace restant : `left: var(--sidebar-w, 240px ou 68px)`, `right: 0`. La variable CSS `sidebar-w` est déjà écrite par `AppFrame` (cf `AppFrame.tsx:140+`).
- Si l'item contient un grid `grid-cols-3` (KPI strip Finance), on passe en `grid-cols-1` à 640px via `md:grid-cols-3`.
- Si l'item contient un tableau dense (Finance, Operations, IT/R&D), on autorise un `overflow-x-auto` interne plutôt que de réorganiser.
- Aucun nouveau breakpoint introduit — alignement strict sur `NARROW_BREAKPOINT = 640` d'`AppFrame`.

### 6.2 Accessibilité

- L'overlay expose `role="main"` et `aria-label="${appName} detail"` (ex. "Sales detail").
- Le back button porte `aria-label="Back to ${sectionName}"`.
- L'icône 56×56 du header est `aria-hidden="true"` (décorative — le titre est dans un `<h1>` adjacent).
- L'overlay lit `matchMedia('(prefers-reduced-motion: reduce)')` au montage et applique `duration: 0` si vrai.
- Focus management : à l'ouverture du drill, on focus le premier `<h1>` du `*DetailPage` via `el.focus()`. Tab ramène ensuite naturellement à la sidebar via le DOM.
- Contraste : tous les 12 thèmes existants respectent déjà WCAG AA — pas de régression attendue.
- Le breadcrumb de la `WindowFrame` est mis à jour par `useWindowPage().setDetail({ label, onBack })` pour cohérence.

## 7. Fichiers concernés

### 7.1 Nouveaux (canon partagés)

- `src/components/cms/AppDetailOverlay.tsx` — composant overlay canon (1 fichier).
- `src/components/cms/overlayMotions.ts` — map des 8 motions (`fade-up`, `slide-left`, `slide-right`, `slide-bottom`, `pop-scale`, `fade-blur`, `type-in`, `unfold`). Variants Framer Motion ou keyframes CSS, à trancher à l'implémentation.

### 7.2 Nouveaux (1 par app, hardcodés)

| Fichier | App |
|---|---|
| `src/apps/dashboard/DashboardDetailPage.tsx` | Dashboard |
| `src/apps/people/PeopleDetailPage.tsx` | People (remplace `FleetDetail` inline dans `PeopleApp.tsx:483-485`) |
| `src/apps/operations/OperationsDetailPage.tsx` | Operations |
| `src/apps/it-rd/ItRdDetailPage.tsx` | IT / R&D |
| `src/apps/clients/ClientsDetailPage.tsx` | Clients |
| `src/apps/tasks/TasksDetailPage.tsx` | Tasks |
| `src/apps/marketplace/MarketplaceDetailPage.tsx` | Marketplace |
| `src/apps/product/ProductDetailPage.tsx` | Product |
| `src/apps/growth/GrowthDetailPage.tsx` | Growth |
| `src/apps/sales/SalesDetailPage.tsx` | Sales (déjà existant, refactor du `SALES_DETAIL_META` uniquement) |
| `src/apps/finance/FinanceDetailPage.tsx` | Finance |
| `src/apps/legal/LegalDetailPage.tsx` | Legal |
| `src/apps/settings/SettingsDetailPage.tsx` | Settings (le cas échéant, distinct de `ThemeDetailPage.tsx` qui existe déjà) |

### 7.3 Modifiés (intégration)

- `src/components/AppFrame.tsx` — vérifie que la variable CSS `--sidebar-w` est bien exposée sur le root de l'AppFrame (240px wide, 68px narrow). Si elle n'existe pas, l'ajouter. C'est utilisé par `<AppDetailOverlay>` pour son `left`.
- `src/apps/sales/SalesApp.tsx` — refactor lignes 510-528 pour utiliser `<AppDetailOverlay>`.
- Les 12 autres `src/apps/<id>/<Id>App.tsx` — ajout de l'état `detail`, `useEffect` pour `setWindowDetail`, rendu `<AppDetailOverlay>` quand `detail !== null`.

### 7.4 Inchangé

- `src/components/DetailPage.tsx` — reste le shell canon utilisé par chaque `*DetailPage` (factorisation Phase 48).
- `src/components/cms/DynamicPageView.tsx` — reste utilisé pour le rendu CMS en liste, mais plus pour la page de détail (chaque app utilise maintenant son `*DetailPage`).
- `src/lib/app-registry.ts`, `src/lib/themes/tokens.ts` — inchangés.
- `wiki/hand_offs/2026-07-28_drawbridge_coach_os_iterations.md` — sister canon, non touché.

## 8. Vérification & critères de succès

**Pas d'infra de test automatisé** (D6 honest). Vérification via le canal canon : **Drawbridge → `/bridge` → commit + handoff**.

### 8.1 Critères de succès

1. **Test "blind identification"** : ouvrir Coach OS, drill dans 4 apps différentes (Sales, Finance, Legal, Growth), un observateur extérieur doit pouvoir nommer chaque app en moins d'1 seconde d'observation.
2. **Cohérence cross-app** : naviguer Sales → People → Operations sans perdre le contexte, le breadcrumb se met à jour à chaque drill, le back button ramène à la section précédente.
3. **Responsive** : redimensionner la fenêtre à 640px, vérifier que la sidebar collapse (68px), l'overlay s'ajuste, les KPI cards passent en 1 colonne.
4. **Motion** : activer `prefers-reduced-motion: reduce` dans le système, vérifier que l'entrée d'un détail est instantanée (pas de transition).
5. **Régression Sales** : le drill existant de Sales (post-Phase 48) continue de fonctionner identiquement après le refactor d'extraction en `<AppDetailOverlay>`.
6. **Build & lint** : `npm run build` (tsc -b + vite build) et `npm run lint` (oxlint) sortent sans erreur.

### 8.2 Livrables handoff

- `wiki/hand_offs/2026-07-30_detail_pages_per_app.md` : inventaire des 13 fichiers `*DetailPage.tsx` créés, captures Drawbridge (wide + narrow), checklist des 6 critères passée.
- `event_log_2026-07-30.jsonl` (D4 append-only, sister canon `event_log_2026-07-26.jsonl`) : 13 entrées "page detail livrée" + 1 entrée "AppDetailOverlay extracted".

### 8.3 Commandes de validation

```bash
cd C:/Users/amado/coach-os
npm run build   # tsc -b + vite build
npm run lint    # oxlint
npm run dev     # vérification visuelle sur http://localhost:5174/
```

## 9. Risques & honest gaps (D6)

1. **Pas d'infra de test automatisé** — vérification visuelle manuelle uniquement. Risque de régression silencieuse sur un futur refactor.
2. **13 layouts hardcodés** = 13 fichiers à maintenir. Risque de drift si le contrat `<AppDetailOverlay>` change.
3. **Distinction visuelle Finance vs Legal** repose sur le layout (table vs accordéon) et non sur le thème (les deux sont `trust`). Si quelqu'un aligne les layouts, les apps deviennent indistinguables.
4. **Motions signature par app** peuvent paraître "trop" si l'utilisateur enchaîne 13 drill rapides. Le respect de `prefers-reduced-motion` couvre les utilisateurs sensibles, mais l'expérience par défaut peut être perçue comme "frénétique".
5. **`<DynamicPageView>` reste utilisé pour le rendu CMS en liste** — il faut s'assurer qu'aucun code n'appelle `DynamicPageView` pour une page de détail après ce refactor.

## 10. Hors périmètre

- Refactor de `AppFrame` au-delà de l'exposition de `data-sidebar-w`.
- Refactor de `<DetailPage>` (Phase 48) — il reste le shell canon réutilisé par chaque `*DetailPage`.
- Refactor du CMS générique (`DynamicPageView` pour les listes) — reste inchangé.
- Thèmes runtime — les 12 thèmes restent intacts, on ne crée pas de nouveau thème.
- App discovery / registre — pas de nouvelle app, pas de nouveau manifest.
- Tests automatisés — D6 honest : aucune infra, vérification manuelle uniquement.

## 11. Critère d'arrêt

L'implémentation est terminée quand :

- 13 fichiers `*DetailPage.tsx` existent et sont montés dans leur app respective via `<AppDetailOverlay>`.
- `npm run build` et `npm run lint` passent sans erreur.
- Les 6 critères de succès de la section 8.1 sont validés manuellement via Drawbridge.
- Le handoff `wiki/hand_offs/2026-07-30_detail_pages_per_app.md` est écrit avec les captures et la checklist signée.

Aucun de ces critères ne dépend d'une décision ultérieure — ils sont vérifiables mécaniquement (build, lint, présence des fichiers) ou visuellement (Drawbridge, captures).
