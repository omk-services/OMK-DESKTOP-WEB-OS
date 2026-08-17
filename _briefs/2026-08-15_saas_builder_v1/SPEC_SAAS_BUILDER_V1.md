# SPEC SaaS builder V1

> **Statut : draft** — généré 2026-08-15 par Opus. À vérifier avant implémentation.
>
> **Sources (mises à jour 2026-08-15) :**
> - **Kit Bench Studio local** : `C:\Users\amado\Downloads\bench_studio_ownership_kit\` (3 fichiers texte + 2 PDFs)
>   - `README.md` : quick start, décrit le skill `generate`
>   - `generate_skill/SKILL.md` : routing + prompt refinement + ledger
>   - `generate_skill/scripts/generate.py` : CLI Python 8 engines
> - **Repo Bench Studio (webapp séparée)** : `github.com/promptadvisers/bench-studio-public` ([NON VERIFIÉ depuis cette session — non nécessaire pour la SPEC])
> - Vidéo Mark Kashef ("Bench Studio Ownership Kit") — transcription fournie par l'utilisateur
> - Conventions Coach OS : `src/lib/app-registry.ts`, `src/lib/app-discovery.tsx`,
>   `src/apps/app-store/AppStoreApp.tsx`, `src/stores/threeApp.store.ts`,
>   `src/lib/tooling/adapters/mcp.ts`, `src/lib/tooling/identity.ts`,
>   `src/lib/tooling/permissions.ts`
>
> **[CORRIGÉ 2026-08-15]** — Le kit Bench Studio n'est PAS une webapp SaaS ;
> c'est **un skill Claude Code** (`generate`) qui s'installe dans
> `~/.claude/skills/generate/`. Le repo `bench-studio-public` est la webapp
> visuelle, distincte. Cette SPEC décrit un **composant Coach OS** inspiré
> du skill `generate`, pas un clone de la webapp.

---

## 0. GARDE-FOU (anti-piège §6 du CLAUDE.md)

Cette SPEC est rédigée **par moi** (Opus), avec mes outils de session
(Read, Write, Edit, Bash, Grep, Glob). **Aucun `claude -p`.** Aucun agent
Anthropic. Le texte qui suit décrit ce que je veux voir écrit dans le
code — pas ce qu'un sous-agent doit exécuter à ma place.

À chaque passe d'implémentation future, le développeur lit cette SPEC,
vérifie qu'elle est à jour, puis écrit le code lui-même.

---

## 1. POSITIONNEMENT

L'app **SaaS builder** est la **9ᵉ app du registre** de Coach OS,
immédiatement après **App Store** (8ᵉ) et **Marketplace** (7ᵉ).

```
Dashboard, People, Operations, IT/R&D, Clients, Tasks,
Marketplace, App Store, [SaaS builder], Product, Growth,
Sales OS, Finance, Legal, Settings, Welcome, Audit,
Design, Ontology, Cognition
```

Sa fonction : **produire** des `AppSpec` JSON. Sa fonction parente, App
Store, les **distribue**. La 3D (ThreeProgram) les **exécute**. C'est le
chainon manquant entre le bureau et la place de marché.

SaaS builder n'est PAS un SaaS à vendre — c'est un **composant d'OS**,
par opposition au fork Bench Studio qui est un SaaS commercial.

---

## 2. CONTRAT FONCTIONNEL

### 2.1 Propriété (inspiré de la vidéo Mark, lignes 3-12)

L'utilisateur possède :
- L'interface (le composant SaaSBuilderApp)
- Le routing (quelle section, quel modèle, quel prompt)
- La prompt intelligence (le workhorse qui raffine)
- Le ledger (chaque coût, en append-only, en USD)

Pas de lock fournisseur. Si l'agrégateur OpenRouter tombe, le builder
doit afficher un état vide explicite, **pas** un spinner infini, et
permettre à l'utilisateur de basculer vers un autre agrégateur.

### 2.2 Agrégateurs et modèles

**[CORRIGÉ 2026-08-15]** — Le repo public Bench Studio
(`bench-studio-public-main/`) utilise **fal.ai** comme agrégateur principal,
avec **37 routes** au total, pas 8 comme dans le kit. Détail vérifié
contre `src/modelCatalog.js` et `server/capabilities.json` (37 entrées,
`generated_at: 2026-08-12T19:02:00.482Z`) :

| Provider | Routes | Lanes | Source |
|---|---|---|---|
| fal.ai (Black Forest Labs) | `flux-2/flash`, `flux-2-pro` | t2i | `server/capabilities.json` |
| fal.ai (Google) | `nano-banana-pro`, `nano-banana-2` | t2i | id. |
| fal.ai (OpenAI) | `gpt-image-2` (mirror) | t2i | id. |
| fal.ai (ByteDance) | `seedream/v5/pro/text-to-image`, `seedance-2.5/text-to-video` | t2i, t2v | id. |
| fal.ai (Recraft) | `recraft/v4.1/text-to-image` | t2i | id. |
| fal.ai (Alibaba) | `qwen-image-3/text-to-image` (via Qwen Cloud) | t2i | id. |
| fal.ai (Lightricks) | `ltx-2.5/text-to-video/fast` | t2v | id. |
| fal.ai (Kling) | `kling-video/v3/pro/text-to-video`, `kling-video/v3/turbo/standard/text-to-video` | t2v | id. |
| fal.ai (Google Veo) | `veo3.1`, `veo3.1/fast` | t2v | id. |

**4 lanes sémantiques** (cf. `MODEL_LANE_LABELS` dans
`src/modelCatalog.js:8-15`) : `t2i` (text-to-image), `i2i`
(image-to-image, edit), `t2v` (text-to-video), `i2v` (image-to-video),
`r2v` (reference-to-video).

**Ordre éditorial prioritaire** (cf. `MODEL_PRIORITY` dans
`src/modelCatalog.js:22-34`) — 12 modèles affichés en première vue,
les autres accessibles via recherche :

1. `fal-ai/veo3.1/fast`
2. `fal-ai/kling-video/v3/pro/text-to-video`
3. `bytedance/seedance-2.5/text-to-video`
4. `fal-ai/veo3.1`
5. `fal-ai/kling-video/v3/turbo/standard/text-to-video`
6. `lightricks/ltx-2.5/text-to-video/fast`
7. `fal-ai/nano-banana-pro`
8. `openai/gpt-image-2`
9. `fal-ai/flux-2-pro`
10. `fal-ai/flux-2/flash`
11. `bytedance/seedream/v5/pro/text-to-image`
12. `fal-ai/nano-banana-2`

**Capabilities par modèle** (`server/capabilities.json`) : chaque entrée
porte `primary_image_field`, `image_arity` (`single`/`multiple`),
`inputs: []` (modality `image`/`video`/`audio`/`document`/`mixed`),
`prompt_profile: true|false`, `confidence: "schema-reports-no-media-input" | ...`,
`pricing: { ... }`. Le builder doit lire ces champs, **pas les inventer**.

V1 SaaS builder **reprend cette architecture** :
- `FAL_KEY` (obligatoire) couvre les 37 routes ci-dessus
- Clés directes (Path B du kit, moins cher) :
  `MINIMAX_API_KEY`, `QWEN_CLOUD_API_KEY` (ou `DASHSCOPE_API_KEY`),
  `KLING_ACCESS_KEY` + `KLING_SECRET_KEY`

| Provider | Service | Engines | Source |
|---|---|---|---|
| Google | `aistudio.google.com` | `gemini-image`, `veo` | `generate_skill/SKILL.md:71` |
| OpenAI | `platform.openai.com` | `gpt-image` | `generate_skill/SKILL.md:72` |
| fal.ai | `queue.fal.run` | `fal-wan`, `fal-hailuo`, `fal-kling`, `fal-seedance` | `generate.py:371` |
| Qwen Cloud (Alibaba) | `dashscope-intl.aliyuncs.com` | `qwen-image`, `wan` (direct) | `generate.py:217` |
| Kling | `api-singapore.klingai.com` | `kling` (direct, JWT auth) | `generate.py:298` |
| MiniMax (Hailuo) | `platform.minimax.io` | `hailuo` (direct, ~$0.25/clip) | `generate.py:178` |

**Coûts observés (kit, à titre indicatif — vérifier les prix actuels)** :

| Engine | Coût / génération | Source |
|---|---|---|
| `gemini-image` | $0.039 | `generate.py:30` |
| `gpt-image` | $0.04 | `generate.py:31` |
| `qwen-image` | $0.03 | `generate.py:32` |
| `veo` | $0.26 / 5s | `generate.py:33` |
| `fal-wan` | $0.13 (a14b turbo) | `generate.py:34` |
| `fal-hailuo` | $0.28 | `generate.py:35` |
| `fal-kling` | $0.35 | `generate.py:36` |
| `fal-seedance` | $0.35 | `generate.py:37` |

**Règle de précédence** (`generate.py:351`) : une clé provider directe
bat `FAL_KEY` quand les deux existent. Ex : `MINIMAX_API_KEY` direct pour
Hailuo à $0.25/clip plutôt que `FAL_KEY` à $0.28/clip. Le receipt loggue
le lane (`hailuo-direct` vs `fal-hailuo`) pour la transparence du coût.

V1 SaaS builder **reprend cette architecture** :
- `FAL_KEY` (obligatoire, fal.ai) couvre les 37 routes ci-dessus
- Clés directes (Path B du kit, moins cher) :
  `MINIMAX_API_KEY`, `QWEN_CLOUD_API_KEY` (ou `DASHSCOPE_API_KEY`),
  `KLING_ACCESS_KEY` + `KLING_SECRET_KEY`

**L'agrégateur expose une liste dynamique de routes** :

```ts
interface RouteEntry {
  id: string;            // 'fal-ai/veo3.1/fast', 'fal-ai/flux-2-pro'...
  vendor: string;         // 'Black Forest Labs', 'Google', 'OpenAI'...
  output: 'image' | 'video';
  lane: 't2i' | 'i2i' | 't2v' | 'i2v' | 'r2v';
  inputs: Array<{ field: string; modality: string; arity: string }>;
  pricing: { per_unit?: number; unit?: string; currency?: string };
  confidence: 'schema-reports-no-media-input' | 'submission-verified' | 'output-verified' | 'failed' | 'untested';
  docUrl: string;          // https://fal.ai/models/<id>
}
```

**Source de vérité** : la SPEC **importe** ce shape depuis
`bench-studio-public-main/server/capabilities.json`, mis à jour par
`server/catalog_sync.mjs` (`catalog:sync`). Le SaaS builder de Coach
OS doit lire ce JSON au boot, pas dupliquer la liste.

### 2.3 Prompt intelligence

**Inspiré de `generate_skill/SKILL.md:46`** — le refine est **par engine**,
pas un workhorse unique. Chaque engine a son style de prompt :

- **gemini-image** : paragraphe descriptif dense, sujet + composition +
  éclairage + lentille + palette + mood. Récompense la densité.
- **gpt-image** : précis, instruction-like. Sujet et layout en premier,
  puis attributs. Suit littéralement les instructions spatiales.
- **veo** : shot description. Camera move d'abord (dolly in, static wide,
  handheld), puis sujet/action, puis éclairage/grade, puis audio cue.
  Un shot par prompt.
- **fal-* (chinois)** : sujet et action en première phrase, puis camera,
  puis style. Sous 120 mots. Chaque engine a ses tags (Kling répond
  au film grammar 35mm, Hailuo aux physical verbs, Wan aux style tags).

V1 : **le Refine est un stub**. Le bouton appelle un workhorse
(`GOOGLE_API_KEY` + `gemini-3-flash`) qui prend le prompt vague + l'engine
sélectionné + son style de prompt, et produit une ébauche. Vrai refine
= V2.

### 2.4 Ledger

**[CORRIGÉ 2026-08-15]** — Bench a **deux** formes de ledger
simultanées, observées dans `src/Ledger.jsx` :

1. **Markdown append-only** (`receipts.md` du kit, généré par
   `generate.py:83`). Format : tableau `| Timestamp | Engine | Prompt |
   Output | Est. cost |` + footer **Running total: $X.XXX**.
2. **Ledger UI enrichi** (composant React de `bench-studio-public-main`)
   avec :

```ts
interface LedgerRow {                    // src/Ledger.jsx:11
  ts: string;
  label: string;                          // engine + lane ("fal-ai/veo3.1/fast")
  prompt: string;
  raw_idea?: string;
  cost: number;                           // USD, granularite 0.001
  cost_confidence: 'verified' | 'estimated'; // distingue Billed / Estimated
  request_id?: string;                    // id de l'appel provider
}
interface LedgerSummary {
  total_generations: number;              // nombre de runs
  all_time: number;                       // total cumule
}
```

**Affichage LedgerTicker** (en haut du builder Coach OS) reprend les
3 cases de `src/Ledger.jsx:18-22` : `All-time spend`, `Completed runs`,
`Average per run`.

**Distinction critique** `verified` vs `estimated` (ligne 49 de
`Ledger.jsx`) : « Billed means fal reported the final amount. Estimated
means the endpoint did not return a verified charge. » Cette nuance est
**dans le standard** — pas un détail UX.

SaaS builder V1 reprend **les deux formes** :

```ts
// Forme machine (localStorage) — src/lib/saas-builder/ledger.store.ts
interface LedgerEntry {
  id: string;                // UUID v4 (genere par crypto.randomUUID)
  ts: string;                // ISO 8601
  routeId: string;           // 'fal-ai/veo3.1/fast'
  promptSnippet: string;     // 60 chars max (cf. generate.py:85)
  outputPath: string;
  costUsd: number;
  costConfidence: 'verified' | 'estimated'; // cle du standard
  requestId?: string;
  vendor: string;
}
```

```ts
// Forme exportable (markdown) — derivee de la machine
// Recalcule le total a chaque ecriture (cf. generate.py:99) :
// pas d'agregation incrementale, qui se tromperait sur les suppressions manuelles.
```

**Append-only strict** : pas de `setEntries`, pas de `deleteEntry`.
Le `total` est recalculé à chaque appel (cf. `generate.py:99`).

**Persisté** en localStorage sous `coach-os-saas-ledger-v1`, clé
distincte de `coach-os-three-apps-v1`. Export markdown sur demande
(bouton dans le LedgerTicker).

### 2.5 MCP server exposé

**[CORRIGÉ 2026-08-15]** — Bench Studio expose **8 tools MCP** réels
(cf. `server/mcp.mjs`, source vérifiée). Le SaaS builder de Coach OS
**consomme** ces tools via MCP, pas juste `appSpec.generate` :

| Tool | Description (extrait `mcp.mjs`) | inputSchema |
|---|---|---|
| `list_models` | List current fal image and video models with their accepted input media and pricing. | `{output, accepts, search}` |
| `get_model_capabilities` | Return the schema-derived input contract and verification evidence for one model. | `{model_id}` |
| `upload_media` | Copy a local image, video, audio file, or PDF into Bench and upload it to fal for use as model input. | `{path}` |
| `create_media` | Generate an image or video through Bench. Check model capabilities first and pass uploaded assets with exact input field names. | `{...}` |
| `list_recent_generations` | List recent generations with native inline previews, playable local asset links, and fal-hosted URLs. | `{...}` |
| `get_usage` | Return actual recorded generation spend and local storage status. | `{}` |
| `sync_models` | Ask Bench to check fal for newly published image and video endpoints. | `{}` |
| `create_<kind>` (website/document) | Start a local Codex-powered build. Uses cached ChatGPT authentication rather than an API key. | `{...}` |
| `list_projects` | List locally generated websites and documents with build state and artifact URLs. | `{kind}` |

**Tool SaaS builder V1** : `saas.appSpec.generate` (cf. §4.4). Il
**appelle** `list_models` et `get_model_capabilities` pour peupler la
sidebar Models, et **appelle** `create_media` pour produire un
**aperçu média** optionnel de l'AppSpec (utile mais hors-passe V1).

**Adaptateur MCP Coach OS** : `src/lib/tooling/adapters/mcp.ts:30`
(classe `Server` du SDK `@modelcontextprotocol/sdk`). L'enrollment se
fait dans le catalogue tooling à `src/lib/tooling/catalog/index.ts`.
Tools Bench consommés via le SDK client MCP standard (stdio ou HTTP).

---

## 3. MAPPING Bench Studio (skill `generate`) → Coach OS

**[CORRIGÉ 2026-08-15]** — Bench n'est pas une webapp SaaS mais **un skill
Claude Code** (`generate`). C'est ce skill qu'on adapte, pas la webapp.

| Skill `generate` (kit Bench) | SaaS builder (Coach OS) |
|---|---|
| Crée des images JPG/PNG | Crée des `AppSpec` JSON (slug, name, level, inputs, outputs) |
| Crée des vidéos MP4 | Crée des `AppSpec` JSON (level: 'easy' avec iframeUrl / codeSource / bundleUrl) |
| 8 engines : `gemini-image`, `gpt-image`, `qwen-image`, `veo`, `fal-wan`, `fal-hailuo`, `fal-kling`, `fal-seedance` | Mêmes 8 engines + ajout progressif de providers first-party au-delà |
| Ledger `receipts.md` (markdown append-only, cf. `generate.py:83`) | Ledger Zustand localStorage + export markdown |
| `load_env()` lit `~/.env` pour les clés (`generate.py:55`) | `import.meta.env.VITE_*` (Vite) côté client, secrets côté serveur |
| Routing dans `SKILL.md:30` (table 8 engines) | Même table, dans `src/lib/saas-builder/engines.ts` |
| Prompt refinement par engine (`SKILL.md:46`) | Stub V1 (workhorse unique), V2 = refinement par engine |
| Sortie = fichier (`outputs/pizza.jpg`, `outputs/coast.mp4`) | Sortie = AppSpec validé (§4.1) + bouton Publish vers App Store |
| MCP : kit mentionne la possibilité, pas implémenté | MCP tool `saas.appSpec.generate` exposé (§2.5) |
| UI = pas d'UI, c'est un skill | UI = composant React dans une fenêtre Coach OS |

**Différence centrale** : le skill `generate` produit des **fichiers**
(médias bruts). SaaS builder produit des **AppSpec** (descriptions
structurées d'apps qui seront publiées dans App Store). C'est une
inversion de finalité : Bench vend des sorties, l'OS vend des *entrées*.

---

## 4. CONTRAT TECHNIQUE

### 4.1 AppSpec JSON

Format Zod dans `src/lib/saas-builder/appSpec.schema.ts`.

```ts
import { z } from 'zod';

export const AppSpecSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
  name: z.string().min(1).max(64),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver
  level: z.enum(['easy', 'hard', 'expert']),
  category: z.string().min(1).max(32),
  description: z.string().max(280).optional(),
  inputs: z.record(z.string(), z.unknown()),  // zod sub-schemas par champ
  outputs: z.record(z.string(), z.string().url()), // mime → ref URL
  uiHint: z.object({
    layout: z.enum(['window', 'sidebar', 'fullscreen']),
    accent: z.string().regex(/^#[0-9a-f]{6}$/).optional(),
  }),
  modelHints: z.object({
    model: z.string().optional(),
    refinedPrompt: z.string().optional(),
  }).optional(),
});
export type AppSpec = z.infer<typeof AppSpecSchema>;
```

**Compatibilité avec `threeApp.store.ts:28`** : un `AppSpec` publié est
converti en `ThreeApp` via `appSpecToThreeApp(spec)` qui mappe :
- `slug` → `slug`
- `name` → `name`
- `category` → `category`
- `level` → `level`
- `outputs` (premier mime) → `iframeUrl` si level='easy', `codeSource`
  si 'hard', `bundleUrl` si 'expert'

### 4.2 Engines — un module par provider

**[CORRIGÉ 2026-08-15]** — Pas d'OpenRouter. Chaque provider a son
module. Structure :

```
src/lib/saas-builder/engines/
├── index.ts            # registry : EngineEntry[] + dispatch par engine
├── google.ts           # gemini-image + veo (genai.Client)
├── openai.ts           # gpt-image (OpenAI.images.generate)
├── fal.ts              # 4 lanes chinois (queue.fal.run)
├── qwenCloud.ts        # qwen-image + wan direct (DashScope)
├── kling.ts            # kling direct (JWT HS256)
└── minimax.ts          # hailuo direct (platform.minimax.io)
```

Chaque module expose :

```ts
export async function run(args: GenerateArgs, signal: AbortSignal): Promise<Generated>;
export function available(): boolean;  // true si la cle est dans import.meta.env
export function costUsd(): number;
export function promptHint(): string; // conseil de refine pour cet engine
```

Exemple — `src/lib/saas-builder/engines/google.ts` (inspiré de
`generate.py:113`) :

```ts
export async function run(args: GenerateArgs, signal: AbortSignal): Promise<Generated> {
  const key = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY missing');
  const { genai } = await import('./vendor/google-genai.js');
  const client = new genai.Client({ apiKey: key });
  const resp = await client.models.generateContent({
    model: 'gemini-3.1-flash-image',
    contents: args.prompt,
    config: { responseModalities: ['IMAGE'] },
  });
  // ... save to outputs/, build Generated
  return { outputPath: outPath, engine: 'gemini-image' };
}
```

**Timeout 5s obligatoire** sur chaque fetch (AbortController). Pas de
retry silencieux.

**Préférence direct > fal** (cf. `generate.py:351`) : `minimax.ts`
doit vérifier `MINIMAX_API_KEY` avant `fal.ts`. Si les deux sont là,
le lane est `hailuo-direct` et le coût est celui de `DIRECT_COSTS`,
pas de `COSTS`.

Clés API (toutes via `import.meta.env.VITE_*` côté client, ou backend
Coach OS si la clé reste serveur — jamais dans localStorage) :

| Variable | Couvre |
|---|---|
| `VITE_GOOGLE_API_KEY` | `gemini-image`, `veo` |
| `VITE_OPENAI_API_KEY` | `gpt-image` |
| `VITE_FAL_KEY` | `fal-wan`, `fal-hailuo`, `fal-kling`, `fal-seedance` |
| `VITE_MINIMAX_API_KEY` | `fal-hailuo` (direct, ~$0.25/clip) |
| `VITE_QWEN_CLOUD_API_KEY` (ou `VITE_DASHSCOPE_API_KEY`) | `qwen-image`, `fal-wan` (direct) |
| `VITE_KLING_ACCESS_KEY` + `VITE_KLING_SECRET_KEY` | `fal-kling` (direct, JWT auth) |

### 4.3 Ledger store

`src/lib/saas-builder/ledger.store.ts` (Zustand + persist) :

```ts
interface LedgerState {
  entries: LedgerEntry[];
  append: (entry: Omit<LedgerEntry, 'id' | 'ts'>) => void;
  total: () => number; // getter, pas une propriété — recalcule à chaque appel
  reset: () => void;  // explicite, jamais automatique
}
```

Append-only : `append` ne peut **pas** muter ou supprimer une entrée
existante. Si quelqu'un essaie, Zustand shallow-comparison rejette la
modification (cf. convention §6.5 anti-mutation).

### 4.4 MCP tool

`src/lib/tooling/catalog/saasBuilder.ts` (enrollment dans le catalogue) :

```ts
import { defineTool } from '../defineTool';

export const saasBuilderTools = [
  defineTool({
    name: 'saas.appSpec.generate',
    description: 'Génère un AppSpec JSON pour le SaaS builder.',
    category: 'ecriture',
    schema: z.object({ intent: z.string(), modelHint: z.string().optional() }),
    displayName: () => 'SaaS Builder — generate AppSpec',
    execute: async (args, ctx) => {
      // Garde identity + permissions : voir §6.4
      // Pour l'instant : stub qui retourne un AppSpec vide valide.
      return { ok: true, data: { stub: true, intent: args.intent } };
    },
  }),
];
```

Enrollment : `src/lib/tooling/catalog/index.ts` ajoute `...saasBuilderTools`
à la liste passée à `registerAll()`.

---

## 5. UI : `SaaSBuilderApp.tsx`

Reprend la forme de `src/apps/app-store/AppStoreApp.tsx:75` (sidebar
Macro-style, 180 px de large, sections en boutons, contenu à droite).

| Section | Contenu |
|---|---|
| **Models** | Liste des agrégateurs + modèles par agrégateur, recherche, sélection |
| **Prompt** | Textarea "votre intention" + bouton Refine + preview du prompt raffiné + sélecteur de modèle cible |
| **Output** | Preview JSON AppSpec (schema-validé) + bouton **Publish to App Store** |

**Bouton Publish** : ouvre la fenêtre App Store pré-remplie avec le slug
du spec. **Pas** d'installation automatique. L'utilisateur clique dans
App Store.

**Palette** : accent `#7c3aed` (même que App Store), sidebar identique.

**Theme tokens** : `var(--theme-surface)`, `var(--theme-text)`, etc.
Aucune classe de couleur en dur.

---

## 6. GARDE-FOUS

### 6.1 Pas d'effet de bord silencieux

- Le bouton Publish n'écrit dans App Store qu'après clic explicite.
- Le ledger n'est jamais écrasé.
- Aucun setTimeout caché qui simule une action.

### 6.2 Timeout 5s sur appels externes

- OpenRouter, fal, kye : timeout dur de 5s, pas de retry silencieux.
- Échec = message explicite + bouton "Réessayer" dans l'UI.

### 6.3 Clés API via env, jamais hardcodées

- `OPENROUTER_API_KEY` lue via `import.meta.env.VITE_*` (Vite) ou
  via le backend Coach OS.
- Jamais dans le code source, jamais dans localStorage.

### 6.4 Identity + permissions (obligatoire, cf. CLAUDE.md §1)

Le tool MCP `saas.appSpec.generate` DOIT être gardé par tenant + role.
Cf. `src/lib/tooling/identity.ts:74` (`resolveIdentity`) et
`src/lib/tooling/permissions.ts:32` (`canRole`). Un guest ne peut pas
générer un AppSpec — c'est une action d'écriture (`category: 'ecriture'`).

### 6.5 Append-only strict du ledger

Le store ledger expose `append` et `reset` uniquement. Pas de
`setEntries`, pas de `deleteEntry`. Toute mutation ailleurs qu'`append`
est rejetée par convention.

### 6.6 Mode dégradé explicite

Si OpenRouter est down : le builder affiche « Aucun agrégateur
disponible — vérifiez votre connexion » avec un bouton Retry. Pas de
spinner infini.

---

## 7. CE QUI N'EST PAS DANS CETTE PASSE

- **Agrégateurs fal.ai, kye.ai** : documentés en §2.2, non implémentés.
- **Levels 'hard' et 'expert'** : interface prévue dans le composant,
  stub `HardPlaceholder`/`ExpertPlaceholder` comme dans
  `src/apps/three-program/ThreeProgramApp.tsx:130`.
- **Prompt refinement réel** : V1 = stub ; V2 = appel workhorse réel.
- **Publication directe dans App Store** : le bouton ouvre la fenêtre
  App Store pré-remplie, l'utilisateur confirme. Pas d'auto-install.
- **Wallet / paiement** : n'a pas de sens pour un composant d'OS.
- **Internationalisation** : tout en anglais pour V1.
- **Tests visuels** : `shot.mjs` et le skill `gauntlet-visuel` ont été
  supprimés (2026-08-15). Les tests visuels futurs devront passer par
  Playwright manuel, ou recréer un outil ad-hoc.

---

## 8. PLAN DE TESTS (vitest)

`src/lib/saas-builder/appSpec.test.ts` :
1. Round-trip d'un exemple valide (tous les champs).
2. Rejet d'un slug invalide (espaces, majuscules, vide).
3. Rejet d'un level inconnu (autre que `'easy'|'hard'|'expert'`).
4. Rejet d'un `version` non semver.

`src/lib/saas-builder/aggregators/openrouter.test.ts` :
1. Avec un mock fetch OK, `listModels` retourne la forme normalisée.
2. Avec un fetch qui timeout (signal aborted), erreur explicite.

`src/lib/saas-builder/ledger.store.test.ts` :
1. `append` ajoute une entrée avec `id` (UUID) et `ts` (ISO).
2. Total cumulé correct après N `append`.
3. `reset` vide les entrées.

---

## 9. HISTORIQUE (D4 append-only)

- **2026-08-15** — Création de la SPEC. Inspirations : fork Bench Studio
  ([NON VERIFIÉ : repo non accessible depuis cette session]) + vidéo
  Mark Kashef (transcription fournie par l'utilisateur).
- **2026-08-15** — Première mise à jour après correction §6 de
  CLAUDE.md : aucune référence à `claude -p` dans cette SPEC.
- **2026-08-15** — Correction majeure après lecture du **kit local**
  (`C:\Users\amado\Downloads\bench_studio_ownership_kit\`). Sources
  vérifiées fichier:ligne :
  - `README.md` — clarifie que Bench Studio = un **skill Claude Code**
    (`generate`), pas une webapp SaaS.
  - `generate_skill/SKILL.md:30` — table des 8 engines.
  - `generate_skill/SKILL.md:46` — prompt refinement par engine.
  - `generate_skill/SKILL.md:71` — variables d'env (`GOOGLE_API_KEY`,
    `OPENAI_API_KEY`, `FAL_KEY`, providers directes).
  - `generate.py:83` — format du ledger markdown append-only.
  - `generate.py:351` — règle de précédence (direct > fal).
- **2026-08-15** — Correction majeure après lecture du **repo public**
  (`C:\Users\amado\Downloads\bench-studio-public-main\`). Sources
  vérifiées :
  - `src/modelCatalog.js:8-15` — 5 lanes (`t2i`, `i2i`, `t2v`, `i2v`, `r2v`).
  - `src/modelCatalog.js:22-34` — `MODEL_PRIORITY` (12 modèles éditoriaux).
  - `src/Ledger.jsx:11-49` — forme enrichie avec `cost_confidence`
    (`'verified'` vs `'estimated'`) + `LedgerSummary` (all_time,
    total_generations, average).
  - `server/mcp.mjs` — **8 tools MCP réels** : `list_models`,
    `get_model_capabilities`, `upload_media`, `create_media`,
    `list_recent_generations`, `get_usage`, `sync_models`,
    `create_<kind>` (website/document), `list_projects`.
  - `server/capabilities.json` — **37 routes** au total (Black Forest
    Labs, Google, OpenAI, ByteDance, Recraft, Alibaba, Lightricks,
    Kling, Veo).
  - `package.json` — dépendances : `@modelcontextprotocol/ext-apps`,
    `@modelcontextprotocol/server`, `@openai/codex-sdk`, `express`,
    `multer`, `zod`.
