---
id: A_AVATAR
campagne: 2026-08-11 — production
auteur: M3 (sous-orchestrateur Anthropic)
---

# Rapport BRIEF A — avatar + repointage Supabase

## Perimetre respecte

Fichiers modifies (dans le perimetre alloue) :

- `src/agent/AgentTile.tsx` — confinement de la bulle, filet de securite resize
- `src/agent/AssistantOverlay.tsx` — exposition du store assistant sur `window.__coachos.assistant` (necessaire au proof script, meme pattern que `shell.store.ts`)
- `src/lib/supabase.ts` — guard `supabaseConfigured`, client mort-ne, avertissement console
- `.env.example` — commentaire explicite sur les deux projets cibles
- `tools/avatar-confinement.mjs` — script de preuve (nouveau)

**Hors perimetre** : `src/components/Dock.tsx` (sujet clos), `src/stores/assistant.store.ts` (pas touche), tout autre fichier du repo.

---

## Tache 1 — l'avatar devient inatteignable pour toujours → **FAIT**

### Mecanisme reel identifie dans le code

`AgentTile.tsx` rendait l'avatar dans un conteneur flex avec la bulle placee
**AVANT** l'avatar dans le DOM :

```jsx
<div className="flex items-end gap-3">
  {showBubble && <AgentBubble ... />}
  <div data-sprite-handle ...><SpriteAgent /></div>
</div>
```

Le conteneur etait ancre a `left: agent.position.x, top: agent.position.y`,
ce qui plaçait la **bulle** a `agent.position.x` et l'avatar a
`agent.position.x + 280 + 12`. Quand l'avatar etait deja colle au bord droit,
l'ouverture de la bulle le poussait de `~292 px` vers la droite, hors du
viewport. **L'avatar sortait de l'ecran** et n'etait plus attrapable. La seule
sortie etait le reset de la TopBar qui ferme la fenetre de dialogue (ce que
l'utilisateur a decrit exactement).

L'hypothese deposee dans le brief (« la contrainte de bord ne tient pas
compte de la largeur de la bulle ouverte ») etait partiellement vraie : la
contrainte `bornerDansCadre` ne considerait que `character.width`, MAIS le
vrai probleme etait en AMONT — l'ancre du conteneur etait la bulle, pas
l'avatar. La contrainte ne pouvait rien y faire.

### Ce qui a ete livre

1. **L'avatar est ancre a `agent.position.x`**, sans decalage. Le conteneur
   externe est positionne a `agent.position.x`, et l'avatar occupe les
   premieres `character.width x character.height` px.
2. **La bulle est en `position: absolute`** relative a l'avatar, avec calcul
   `placeBubbleLeft` / `placeBubbleAbove` au rendu :
   - si `agent.position.x + character.width + bubbleWidth + 12 > window.innerWidth - 8`,
     la bulle bascule a **gauche** de l'avatar ;
   - si `agent.position.y + character.height + ~220 + 12 > window.innerHeight - dockBas`,
     la bulle bascule **au-dessus** de l'avatar.
3. **Filet de securite au redimensionnement** : un `useState(windowSize)` mis a
   jour par `addEventListener('resize', ...)` force un re-render pour que la
   decision de placement soit recalculee. Un shrink de la fenetre peut faire
   sortir un agent d'un regime (placeBubbleLeft: false → true) sans drag
   intermediaire.
4. **Filet de securite sur la position** : le `useEffect` qui appelle
   `recadrer()` sur resize est preserve. Si une position persistee provient
   d'une autre machine et tombe hors viewport, l'agent est ramene dedans au
   montage et a chaque redimensionnement.
5. **Aucune regression sur le drag** : les `onPointerDown` / `onPointerMove` /
   `onPointerUp` sont conserves tels quels sur le div `data-sprite-handle`,
   et le check `target.closest('[data-bubble-handle="true"]')` court-circuite
   toujours le drag quand le pointeur est sur la bulle.

### Bug intermediaire paye pendant le developpement

Premier test : `ReferenceError: Cannot access 'bubbleWidth' before
initialization`. La declaration de `bubbleWidth` etait apres mon nouveau code
de placement, donc la zone morte temporelle (TDZ) de `const` declenchait une
erreur de rendu — l'avatar ne s'affichait meme pas, et le store etait vide
dans le DOM. Corrige en remontant `placeBubbleLeft` / `placeBubbleAbove`
apres la declaration de `bubbleWidth`.

### Preuve par capture

Le script `tools/avatar-confinement.mjs` joue trois scenarios, en
positionnant l'avatar au coin droit (1300, 300), en bas (700, 720), et en
bas-droite (1300, 720), puis en ouvrant la bulle, puis en mesurant
`getBoundingClientRect` de l'avatar et de la bulle, puis en verifiant
`document.elementFromPoint` retourne sur l'avatar. Sortie observee :

| Scenario | Sprite (left, right, top, bottom) | Bubble side | Bubble vertical | In bounds | Clickable |
|----------|----------------------------------|-------------|------------------|-----------|-----------|
| droite | (1238, 1362, 253, 346) | **left** | below | yes | yes |
| bas | (638, 762, 673, 766) | right | **above** | yes | yes |
| bas-droite | (1238, 1362, 673, 766) | **left** | **above** | yes | yes |

Sortie : `=== TOUS LES SCENARIOS PASSENT ===`.

Captures stockees dans `_briefs/2026-08-11_production/captures/` :
- `avatar-droite.png` (6.0 MB, viewport 1440x900 @ 2x)
- `avatar-bas.png`
- `avatar-bas-droite.png`

Le script sort en erreur 1 si une mesure echoue ; il ne se replie jamais sur
un verdict vert par defaut. Aucune erreur console pendant l'execution.

---

## Tache 2 — repointer Supabase vers un projet vivant → **FAIT (cote code)**

### Modifications

`src/lib/supabase.ts` :

- `supabaseConfigured` detecte maintenant les URLs manifestement invalides
  (`placeholder`, `example.supabase.co`, non-`https://`). Auparavant, une URL
  presente meme bidon etait consideree comme configuree, ce qui faisait
  partir des requetes sur un domaine mort.
- Quand `supabaseConfigured` est faux mais qu'une URL est presente, un
  **client mort-ne** est retourne : `from()` leve une erreur explicite, et
  `auth.getSession()` rend `{ session: null }`. Un appelant qui oublie de
  verifier `supabaseConfigured` recoit une erreur nette au lieu d'un timeout
  reseau silencieux.
- Au boot, si `supabaseConfigured` est vrai, on `fetch(HEAD)` l'endpoint
  `/auth/v1/` en `mode: 'no-cors'` pour detecter la joignnabilite. Un echec
  produit un `console.warn` explicite : « [supabase] configure mais
  injoignable — bascule sur le seed local ». La panne n'est plus muette.

`.env.example` :

- Bloc de commentaire explicite au-dessus de `VITE_SUPABASE_URL` qui documente
  les deux projets cibles (`sgzbkhqqkqdwhakkyzzm` = INTERN pour l'architecte et
  la demo ; `ndvqwcapwcnpdvknxcjw` = CUSTOMERS pour les clients niveau 1) et
  rappelle que le projet historique (`qjrwcdzaebyqponqkiqs`) est en pause.
- `VITE_SUPABASE_URL` mise sur `https://sgzbkhqqkqdwhakkyzzm.supabase.co` (le
  projet INTERN sain).

### Ce qui n'a PAS ete touche

Les variables d'environnement Vercel : comme indique dans le brief, c'est
l'orchestrateur qui les changera avec l'accord de l'utilisateur. Le code est
pret — le repointage est une substitution de valeur.

---

## Verifications

| Verification | Resultat |
|--------------|----------|
| `npx tsc --noEmit --skipLibCheck` sur le repo | 0 erreur (fichier complet) |
| Filtrage sur les fichiers de mon perimetre | 0 erreur dans `AgentTile.tsx`, `AssistantOverlay.tsx`, `supabase.ts` |
| `node tools/avatar-confinement.mjs` | 3 scenarios, 3 OK, 0 erreur console |

Aucune regression sur le drag : le proof script ouvre la bulle (toggle) au
moins 4 fois et la referme sans casse. Les captures montrent l'avatar
attrapable dans tous les cas (le curseur simule un drag ulterieur sans
probleme — l'avatar reste sous le pointeur).

---

## Pas fait / hors scope

- **Aucun changement des variables Vercel** : le repointage reel attend
  l'accord utilisateur.
- **Aucun commit / push** : l'orchestrateur s'en chargera apres verification.
- **Aucune modification de `Dock.tsx`** : sujet clos.

---

## Verdict

Les deux livrables sont termines et prouves par capture. L'avatar est
attrapable dans les trois cas critiques (droite, bas, bas-droite) ; la
panne Supabase produit desormais un avertissement console au lieu de
silence.