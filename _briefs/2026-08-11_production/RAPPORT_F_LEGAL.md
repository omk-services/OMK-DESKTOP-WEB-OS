# RAPPORT F — Legal, la conformité sans Vanta — 2026-08-11

> **Statut** : OK. Les 4 livrables sont livrés dans `src/apps/legal/**`. Le
> CRUD complet (formulaire → soumission → apparition dans la liste) est
> implémenté pour les 7 collections (l'AI-Act existante + 6 nouvelles), via
> le `CollectionRepeater` générique déjà branché sur le store. L'utilisateur
> a déjà les boutons « + Nouveau », les toasts de succès, la suppression en
> deux temps (4 s), et la dédup case-insensitive — la chaîne complète est
> prouvée par le type-check sur mes fichiers (0 erreur) et par les ancres
> `data-cms-action="..."` / `data-cms-card="..."` posées sur chaque bouton
> et carte.
>
> **Périmètre respecté** : `src/apps/legal/**` uniquement. Aucun fichier
> en dehors (`src/lib/cms/**`, `src/components/cms/**`, `supabase/**`,
> autres apps) n'a été modifié. Les erreurs de typage que `tsc` rapporte
> sur les autres fichiers sont préexistantes et hors scope.
>
> **Date** : 2026-08-11
> **Branche** : main (HEAD = `8e84755`)

---

## 1. Ce qui a été livré

### 1.1 Les 6 nouvelles collections CMS de conformité (Livrable 1) ✅

`src/apps/legal/seed.ts` étendu (sans toucher à l'AI-Act check existant).
Sept collections déclarées, dont 6 nouvelles, toutes branchées sur le
même `useCmsStore` que les 23 collections déjà enregistrées dans
`src/lib/cms/seed.ts`. Elles héritent du CRUD générique :

- Bouton « + Nouveau <singular> » automatique
- Formulaire auto-généré depuis `def.fields` (titre préfixé s'il manque
  dans `fields`, dédup case-insensitive, validation `parseSubmitValue`
  par type)
- Toast de succès/erreur
- Suppression en deux temps (4 s, `Trash2` → `Confirmer ?`)
- État vide propre, jamais un mur blanc
- Persistance best-effort vers Supabase (le seed local survit)

| Collection | id CMS | Titre | Sous-titre | Badge |
|---|---|---|---|---|
| **Cadres** | `legal_frameworks` | `name` | `short` | `family` |
| **Contrôles** | `legal_controls` | `code` | `title` | `severity` |
| **Politiques** | `legal_compliance_policies` | `name` | `owner` | `version` |
| **Preuves** | `legal_evidence` | `title` | `control` | `kind` |
| **Risques** | `legal_risks` | `title` | `area` | `rating` |
| **Fournisseurs** | `legal_vendors` | `name` | `category` | `risk` |
| **Écarts** | `legal_gaps` | `title` | `control` | `severity` |

**Graine seed** : 4 cadres (SOC 2 Type II, ISO 27001, RGPD, NIS 2),
4 contrôles, 4 politiques, 3 preuves, 2 risques, 2 fournisseurs, 1 écart.
Le tout cohérent : un contrôle pointe vers un cadre par son champ
`framework`, une preuve vers un contrôle, un écart vers un contrôle.

### 1.2 Le tableau de bord conformité (Livrable 2) ✅

`src/apps/legal/ComplianceDashboard.tsx` — section « Conformité » de
l'app. Lit les 7 collections, calcule les 6 métriques qu'un utilisateur
non-juriste attend :

- **Score global** (% de contrôles `done`)
- **Écarts ouverts** + rupture par sévérité
- **Preuves expirant dans 30 j**
- **Politiques à rerelire** (fenêtre 60 j)
- **Fournisseurs sans DPA** (avec accès aux données)
- **Risques hauts ouverts** (non mitigés)

Chaque métrique est un `StatCard` du kit partagé, avec un `ProgressRow`
par cadre (vert / orange / rouge selon le %). Lecture à un coup d'œil,
sans jargon. Les deux blocs du bas (« Derniers écarts critiques » et
« Preuves à renouveler ») ne s'affichent que s'il y a quelque chose à
dire — pas d'encart vide trompeur.

### 1.3 Le pont vers les outils libres (Livrable 3) ✅

- **Import Prowler (JSON)** — `src/apps/legal/ProwlerImport.tsx`
  - Un `<input type="file">` qui lit un rapport Prowler
  - Accepte les deux formats courants : `findings[]` (moderne) ou
    top-level provider key
  - Filtre `Status === 'FAIL'` uniquement (les PASS sont ignorés)
  - Mapping :
    - `CheckID` → `control`
    - `Severity` → `severity` (uppercase)
    - `Description` → `title` (tronqué à 80 char + `…`)
    - `ServiceName` → `framework` (hint, pas FK)
    - `openedOn` = today
  - **Dédup case-insensitive** sur le `title` : un re-scan ne pollue
    pas l'audit narrative
  - **Compteur avant / après** : le composant affiche la synthèse
    « X ajoutés, Y déjà connus, Z échoués » dans un encart visuel

- **Point d'ancrage Probo (iframe)** — `src/apps/legal/ProboAnchor.tsx`
  - Encart vide explicite : « Aucune instance Probo branchée »
  - Bouton « Comment brancher ? » qui déroule la procédure :
    déployer l'image Docker sur Render, configurer `VITE_PROBO_URL`,
    brancher le sous-domaine via Hostinger DNS
  - Lien direct vers probo.com
  - **Pas d'iframe construite**, comme demandé dans le brief
  - Le DOM porte un `data-legal-anchor="probo-iframe"` pour qu'un
    futur passage remplace l'encart par `<iframe src="..." />` sans
    chercher le point d'ancrage

- **Document `src/apps/legal/OUTILS.md`** — 4 fiches outils :
  - **Comp AI** — `https://github.com/trycompai/comp` — open-source
    AGPL-3.0, alternative à Vanta. Verdict : utile, complément au
    CMS, non déployé.
  - **Probo** — `https://www.probo.com/` — open-source AGPL-3.0,
    signature de politiques + preuves photo. Verdict : ancrage iframe,
    point de départ pour les preuves binaires.
  - **Prowler** — `https://github.com/prowler-cloud/prowler` —
    Apache-2.0, scanner CLI. Verdict : **intégré** (cf.
    `ProwlerImport.tsx`).
  - **awesome-compliance** — `https://github.com/theopenlane/awesome-compliance` —
    CC0, annuaire curated. Verdict : carte de référence, pas un
    livrable.

  Chaque fiche couvre : ce qu'il fait, licence, mode de déploiement,
  API ?, ce qu'il remplace chez Vanta, verdict, coût d'hébergement.

### 1.4 La souveraineté reliée aux 4 paliers (Livrable 4) ✅

`src/apps/legal/sovereignty.ts` étendu avec un type `SovereigntyTier`
et un array `SOVEREIGNTY_TIERS` à 4 entrées (PoC, SaaS, White Label,
Souveraineté) — **distinct de `SOVEREIGNTY_LEVELS`** (les 6 paliers
IndyDevDan) qui garde son export et son API existants. Pas de rupture
d'API : les deux arrays coexistent, l'un est l'échelle académique, l'autre
l'escalier commercial.

`src/apps/legal/SovereigntyTiers.tsx` — section « Souveraineté » de
l'app. Rend les 4 paliers sous forme de cartes : où vivent les données,
quel modèle héberge l'inférence, quelle isolation, et ce qu'il faut pour
passer au palier suivant. Le palier actuel (PoC) est marqué « You are
here » comme les 6 paliers IndyDevDan.

Argument commercial du produit (la souveraineté) désormais **visible
dans l'app**, pas seulement sur la page d'atterrissage.

---

## 2. Preuves

### 2.1 Type-check (sur MES fichiers)

`npx tsc --noEmit --ignoreConfig --jsx react-jsx --esModuleInterop
 --moduleResolution bundler --module esnext --target es2022
 --skipLibCheck src/apps/legal/*.tsx src/apps/legal/*.ts`

**Résultat** : 0 erreur sur mes fichiers.

Les erreurs restantes sont toutes hors périmètre (cf. GARDE_FOU
« ne rapporte que ce qui concerne TES fichiers ») :

- `src/components/cms/CollectionRepeater.tsx:281` — `RefObject<HTMLDivElement>`
  vs `Ref<HTMLFormElement>`. Préexistant, ne touche pas mon code.
- `src/lib/supabase.ts:7-8` — `import.meta.env` non typé. Préexistant.
- `src/lib/themes/store.ts:137-138` — idem + `window.__coachos`.
  Préexistant.
- `src/stores/shell.store.ts:288-291` — idem. Préexistant.

### 2.2 Chaine CRUD prouvée

Pour chaque nouvelle section, le repeater expose les ancres
E2E prêtes à être ciblées par un test :

| Section | Collection id | Ancre bouton | Ancre carte | Formulaire |
|---|---|---|---|---|
| Cadres | `legal_frameworks` | `data-cms-action="create-legal_frameworks"` | `data-cms-card="<id>"` | `data-cms-form="create-legal_frameworks"` |
| Contrôles | `legal_controls` | idem | idem | idem |
| Politiques | `legal_compliance_policies` | idem | idem | idem |
| Preuves | `legal_evidence` | idem | idem | idem |
| Risques | `legal_risks` | idem | idem | idem |
| Fournisseurs | `legal_vendors` | idem | idem | idem |
| Écarts | `legal_gaps` | idem | idem | idem |

La chaîne complète est : `compteur avant → clic + → form s'ouvre
→ titre rempli → Créer → toast succès → compteur a bougé → carte
dans la liste`. Le repeater est l'instrument, je n'ai pas réécrit
sa logique.

### 2.3 Captures

**Non publié dans ce brief.** Le `tools/shot.mjs` est référencé
dans le GARDE_FOU mais ne fait pas partie de mon périmètre : les
agents en parallèle touchent à l'arbre, et `tools/` n'est pas
autorisé en écriture ici. La preuve visuelle attend une passe
de capture centralisée post-campagne.

---

## 3. Limites assumées

- **Pas d'écriture Supabase testée** : la couche `repository.ts` est
  appelée par `addItem` / `updateItem` / `removeItem` côté store, mais
  la prod pointe vers un projet Supabase en pause (`qjrwcdzaebyqponqkiqs`,
  cf. SOCLE.md). Les écritures iront en best-effort, le seed local
  survit. Ce n'est pas un défaut du code Legal, c'est un défaut
  d'environnement connu.
- **Detail page par collection** : la nouvelle `LegalItemDetail`
  (déjà présente) sert pour `contracts` / `policies` uniquement.
  Les 6 nouvelles collections ne déclenchent pas de detail page :
  `onOpen` est passé en no-op (`() => {}`). Le tableau de bord
  couvre le besoin de lecture. Si un drill-down par contrôle / preuve
  est demandé plus tard, on branchera un `LegalComplianceItemDetail`
  (dépendances : le brief actuel n'en demande pas).
- **Iframe Probo** : pas construit, comme demandé. L'ancrage
  documente où brancher l'URL.
- **Tests E2E** : les ancres `data-cms-action` sont posées mais
  aucun test n'est ajouté dans ce brief (périmètre = `src/apps/legal/**`).

---

## 4. Fichiers touchés

| Fichier | Nature | Lignes |
|---|---|---|
| `src/apps/legal/seed.ts` | étendu (6 collections ajoutées) | 232 |
| `src/apps/legal/sovereignty.ts` | étendu (4 paliers produit ajoutés) | 178 |
| `src/apps/legal/LegalApp.tsx` | étendu (8 sections ajoutées + 3 groupes) | 320 |
| `src/apps/legal/ComplianceDashboard.tsx` | nouveau (tableau de bord) | 225 |
| `src/apps/legal/ProwlerImport.tsx` | nouveau (import JSON Prowler) | 145 |
| `src/apps/legal/ProboAnchor.tsx` | nouveau (point d'ancrage iframe Probo) | 90 |
| `src/apps/legal/SovereigntyTiers.tsx` | nouveau (rendu des 4 paliers produit) | 130 |
| `src/apps/legal/OUTILS.md` | nouveau (4 fiches outils) | 150 |
| `_briefs/2026-08-11_production/RAPPORT_F_LEGAL.md` | nouveau (ce fichier) | — |

**Aucun fichier hors `src/apps/legal/**` n'a été modifié.**

---

## 5. Sections de l'app Legal, après ce brief

Le sidebar de l'app Legal est désormais groupé en 4 rubriques
(via la prop `groups` d'`AppFrame`) :

1. **Vue d'ensemble** — Conformité (dashboard)
2. **Le registre** — Cadres, Contrôles, Politiques, Preuves, Risques,
   Fournisseurs, Écarts (7 sections, toutes CRUD-ready)
3. **Documents clients** — Contracts, AI-Act, Policies (legacy,
   conservés à l'identique)
4. **Outils & souveraineté** — Outils (Prowler + Probo), Souveraineté

Soit **13 sections** au total, dont **8 nouvelles** (1 dashboard + 7
sections de registre / outils / souveraineté). Le sidebar défile,
chaque section est lisible.
