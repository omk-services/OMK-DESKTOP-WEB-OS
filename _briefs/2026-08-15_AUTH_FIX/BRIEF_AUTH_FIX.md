---
id: AUTH_FIX
campagne: 2026-08-15
phase: 1 — lecture seule, surface applicative uniquement
perimetre_exclusif: |
  src/lib/supabase.ts
  src/components/TopBar.tsx
  src/lib/supabase.test.ts            (nouveau — stub complet)
  src/components/TopBar.test.tsx      (nouveau — branchement session)
interdit: |
  src/lib/authProviders.ts            (ne pas dupliquer)
  src/App.tsx
  src/onboarding/FirstRunInvitation.tsx
  src/components/auth/AuthCard.tsx
  src/apps/auth/AuthPage.tsx          (signature OK, ne pas toucher)
  src/stores/shell.store.ts
  api/**
  src/lib/identity.ts
  src/lib/permissions.ts
artifact_obligatoire: |
  _briefs/2026-08-15_AUTH_FIX/RAPPORT_AUTH_FIX.md
---

# BRIEF_AUTH_FIX — l'auth qui marche enfin

## Le contexte mesuré le 2026-08-15

Trois symptômes, même racine : coach-os n'a pas de vraie session Supabase.

| symptôme | cause mesurée |
|---|---|
| `supabase.auth.signUp is not a function` en local | `src/lib/supabase.ts:51-67` stub **incomplet** : ne couvre que `from()`, `auth.getSession()`, `auth.onAuthStateChange()` |
| `Amadou Kone / amdkn777@gmail.com` en dur dans TopBar | `src/components/TopBar.tsx:112-113` littéraux, jamais branchés sur `useSession()` |
| Mail de confirmation va à OMK au lieu d'Amdkn | utilisateur existant dans le projet Cloud Supabase que Vercel pointe, **bloquant HITL** |

## Trois étapes — pas une de plus

### Étape 1 · Stub Supabase complet

`src/lib/supabase.ts:51-67` — étendre le client mort-né pour qu'il couvre
**toutes** les méthodes que `AuthPage.tsx` appelle :

```ts
// Pseudo-code. NE PAS RÉINVENTER la roue : faire un cast typé du même
// genre que celui déjà présent, qui rejette avec un message explicite.
auth: {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  signUp: async () => ({ data: { session: null, user: null }, error: new Error('Supabase non configuré. Voir VITE_SUPABASE_URL.') }),
  signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Supabase non configuré.') }),
  signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: new Error('Supabase non configuré.') }),
  signOut: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase non configuré.') }),
}
```

**Règle non négociable** : aucun `throw` au niveau de `signUp`/`signInWith*`.
Ces fonctions doivent **retourner** `{ error: Error }` — c'est le contrat
Supabase que `AuthPage.tsx:53` attend déjà (`if (error) throw error` côté
appelant). Si tu `throw` ici, tu obtiens exactement le message « is not
a function » en local parce que l'appelant ne sait pas catcher une
exception de signature.

### Étape 2 · TopBar branché sur la session

`src/components/TopBar.tsx:112-113` — remplacer les littéraux par un
hook. Tu peux créer un mini-store `useSessionStore` dans
`src/stores/session.store.ts` (hors périmètre ici) ou utiliser
directement `supabase.auth.onAuthStateChange`.

**Approche minimale** : un `useEffect` qui charge l'utilisateur via
`supabase.auth.getUser()` au montage, expose `{ user, loading }`,
et le composant affiche soit l'email de l'utilisateur, soit un
placeholder (« Connectez-vous ») si pas de session.

```tsx
// Pseudo-code.
const [user, setUser] = useState<User | null>(null);
useEffect(() => {
  let cancelled = false;
  supabase.auth.getUser().then(({ data }) => {
    if (!cancelled) setUser(data.user ?? null);
  });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    if (!cancelled) setUser(session?.user ?? null);
  });
  return () => { cancelled = true; sub.subscription.unsubscribe(); };
}, []);
```

Affichage :
- `user` présent → `{ initials(user.email), user.email }`
- `user` absent → `{ 'AK' (avatar dégradé), 'Non connecté' }`

### Étape 3 · HITL nettoyage utilisateur en double

**Symptôme 3 reste HITL** : un utilisateur `amdkn777@gmail.com` existe
déjà dans le projet Supabase Cloud actif côté Vercel. Tant qu'il est là,
toute nouvelle inscription avec cet email renvoie le mail au compte
existant.

**Ce que tu fais** (humain, pas code) :
1. Ouvre https://supabase.com/dashboard → ton organisation → projet
   actif côté Vercel.
2. Authentication → Users.
3. Trouve `amdkn777@gmail.com` → clic droit / Delete.
4. Vérifie : réessaie l'inscription depuis l'app déployée. Le mail
   de confirmation doit arriver sur `amdkn777@gmail.com`, pas sur OMK.

## Tests obligatoires

`src/lib/supabase.test.ts` :
- `stub_signUp_retourne_erreur_lisible` : avec `supabaseConfigured = false`,
  `signUp(...)` retourne `{ error: Error('Supabase non configuré.') }`,
  pas `is not a function`.
- `stub_signIn_avec_password` : idem pour `signInWithPassword`.
- `stub_signIn_oauth` : idem pour `signInWithOAuth`.
- `stub_getSession_vide` : `getSession()` rend `session: null`, sans erreur.
- `stub_signOut_succes` : `signOut()` rend `error: null`.

`src/components/TopBar.test.tsx` :
- `topbar_avec_session_affiche_email` : stub `getUser` rend un user,
  TopBar affiche l'email.
- `topbar_sans_session_affiche_placeholder` : stub rend `user: null`,
  TopBar affiche « Non connecté ».
- `topbar_met_a_jour_sur_auth_state_change` : émet `SIGNED_IN`,
  TopBar bascule sur l'email.

## Garde-fous de fin

- `npx tsc --noEmit` → exit 0
- `npx vitest run` → baseline 209/211 + nouveaux tests verts. Si > 211
  échecs, regression : tu casses quelque chose, tu répares avant de rendre.
- Le rapport `_briefs/2026-08-15_AUTH_FIX/RAPPORT_AUTH_FIX.md` contient,
  pour chacun des 8 tests ci-dessus : `avant` (état) · `après` (succès) ·
  `fichier:ligne`.

## HITL bloquant : Symptôme 3

Si tu n'as pas supprimé l'utilisateur en double dans Supabase Cloud, tu
peux coder Étapes 1 et 2 sans problème — le code marchera en local et
en preview. Mais en prod, l'inscription continuera d'aller à OMK. Tu
ne peux pas tester ça depuis le code ; c'est une vérification manuelle
après déploiement.

## Lien avec les autres briefs

- **MEMBERSHIPS** : ce brief crée la primitive `useSession()`. MEMBERSHIPS
  l'étend pour dire « cet utilisateur est membre de ce tenant avec ce rôle ».
- **W13_QUOTAS** : ce brief ferme l'auth ; W13 ferme le débit.
