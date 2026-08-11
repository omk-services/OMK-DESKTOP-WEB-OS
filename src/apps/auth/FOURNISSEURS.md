# Configurer les fournisseurs OAuth (Google, Apple, Microsoft)

> Ce guide est pour toi, l'Architecte. Tu n'as pas besoin d'etre
> developpeur pour le suivre. Chaque etape dit ou aller dans l'interface
> web du fournisseur et quoi copier dans le tableau de bord Supabase.
>
> **Ordre recommande** : Google (le plus simple), puis Microsoft, puis
> Apple (le plus long, parce qu'il faut un compte Apple Developer).

---

## 0. Ce que tu as besoin de preparer

Pour chaque fournisseur, tu vas creer une **application OAuth**, puis
coller ses identifiants dans Supabase.

Ce dont tu as besoin :

| Quoi | Ou le trouver |
|---|---|
| URL de ton projet Supabase | Dashboard Supabase → ton projet → Settings → API → `Project URL` (ex. `https://abcd1234.supabase.co`) |
| Cle anon Supabase | Idem → `anon public` (elle commence par `eyJ...`) |
| Redirect URI (callback) | `https://abcd1234.supabase.co/auth/v1/callback` — **meme valeur pour les 3 fournisseurs** |
| Ta Home URL | `https://omk-desktop-web-os.vercel.app` (l'URL de production Coach OS) |

> Garde-les de cote. Tu vas les reutiliser pour les 3 fournisseurs.

---

## 1. Google

### Etape 1 — creer le projet OAuth

1. Va sur https://console.cloud.google.com/
2. En haut a gauche, deroule le selecteur de projet → **New Project**
3. Nom du projet : `Coach OS` (ou ce que tu veux)
4. Cree

### Etape 2 — configurer l'ecran de consentement OAuth

1. Menu hamburger → **APIs & Services** → **OAuth consent screen**
2. Type : **External**
3. Renseigne :
   - App name : `Coach OS`
   - User support email : ton adresse
   - Developer contact : ton adresse
4. Scopes : laisse les valeurs par defaut
5. **Save and continue** jusqu'au bout (rien d'autre a remplir pour
   l'instant ; tu pourras publier l'app plus tard)

### Etape 3 — creer les identifiants OAuth

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type : **Web application**
3. Name : `Coach OS Web`
4. **Authorized JavaScript origins** :
   - `https://omk-desktop-web-os.vercel.app`
   - `http://localhost:5173` (pour le dev local)
5. **Authorized redirect URIs** :
   - `https://abcd1234.supabase.co/auth/v1/callback` (ton URL Supabase + `/auth/v1/callback`)
   - `http://localhost:54321/auth/v1/callback` (pour le dev local, optionnel)
6. **Create**
7. Note les deux valeurs affichees :
   - **Client ID** : `xxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client secret** : `GOCSPX-xxxxxxxxxxxx`

### Etape 4 — activer cote Supabase

1. Dashboard Supabase → ton projet → **Authentication** → **Providers**
2. Trouve **Google** → toggle **Enable Sign in with Google**
3. Colle :
   - **Client ID** : celui de l'etape 3
   - **Client Secret** : celui de l'etape 3
   - **Authorized Client IDs** : laisse vide (sauf besoin particulier)
4. **Save**

> Test : sur la page d'auth Coach OS, le bouton "Continuer avec Google"
> doit maintenant etre actif. Si tu vois encore le hint "non active",
> vide le cache du navigateur (Ctrl+Shift+R) — la sonde a un cache
> interne qui peut mentir.

---

## 2. Microsoft (Azure)

### Etape 1 — creer l'application

1. Va sur https://portal.azure.com/
2. En haut, recherche **App registrations** → clique
3. **+ New registration**
4. Name : `Coach OS`
5. Supported account types : **Accounts in any organizational directory
   and personal Microsoft accounts**
6. Redirect URI :
   - Platform : **Web**
   - URL : `https://abcd1234.supabase.co/auth/v1/callback`
7. **Register**

### Etape 2 — creer un secret client

1. Dans la nouvelle app, menu a gauche → **Certificates & secrets**
2. **+ New client secret**
3. Description : `Coach OS`
4. Expires : 24 mois (ou ce que tu veux)
5. **Add**
6. **Copie immediatement** la valeur du secret (elle ne s'affiche
   qu'une seule fois) : `xxxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Etape 3 — activer cote Supabase

1. Dashboard Supabase → **Authentication** → **Providers**
2. Trouve **Azure (Microsoft)** → **Enable**
3. Colle :
   - **Azure Client ID** : l'Application (client) ID de l'etape 1
   - **Azure Client Secret** : la valeur de l'etape 2
   - **Azure Tenant ID** : `common` (pour accepter les comptes
     personnels ET pro) ou l'ID de ton tenant Azure si tu veux
     restreindre aux comptes de ton organisation
4. **Save**

---

## 3. Apple (le plus long)

Apple impose de valider chaque application. Pour un PoC tu peux
utiliser un mode "developpeur" sans validation finale.

### Pre-requis

- Un compte **Apple Developer** actif (99 $/an). Si tu n'en as pas,
  saute Apple pour l'instant, les deux autres suffisent.

### Etape 1 — enregistrer une App ID

1. https://developer.apple.com/account/resources/identifiers/list
2. **+** → **App IDs** → **Continue**
3. Description : `Coach OS`
4. Bundle ID : `com.ton-domaine.coach-os` (doit etre unique ; choisis un
   prefixe qui t'appartient, ex. `com.amadou.coach-os`)
5. Capabilities : coche **Sign In with Apple**
6. **Continue** → **Register**

### Etape 2 — creer un Services ID

C'est l'identifiant OAuth Web (different de l'App ID).

1. Meme page → **+** → **Services IDs** → **Continue**
2. Description : `Coach OS Web`
3. Identifier : `com.ton-domaine.coach-os.web` (meme prefixe que ci-dessus
   + `.web`)
4. **Continue** → **Register**

### Etape 3 — configurer le Services ID

1. Dans la liste, clique sur le Services ID que tu viens de creer
2. Coche **Sign In with Apple** → **Configure**
3. Primary App ID : choisis celui de l'etape 1
4. **Domains and Subdomains** : `abcd1234.supabase.co` (ton Project Ref
   Supabase, sans `https://`)
5. **Return URLs** : `https://abcd1234.supabase.co/auth/v1/callback`
6. **Save** → **Continue** → **Done**

### Etape 4 — creer une cle privee

1. **Keys** → **+** → **Continue**
2. Key Name : `Coach OS Sign In Key`
3. Coche **Sign In with Apple** → **Configure**
4. Primary App ID : celui de l'etape 1
5. **Save** → **Continue**
6. **Register**
7. **Telecharge la cle** (`.p8`) — tu ne peux le faire qu'une seule
   fois, garde-la precieusement
8. Note le **Key ID** et l'**Apple Team ID** (en haut a droite de la
   page developer)

### Etape 5 — activer cote Supabase

1. Dashboard Supabase → **Authentication** → **Providers**
2. Trouve **Apple** → **Enable**
3. Renseigne :
   - **Service ID** : le Services ID de l'etape 2
   - **Service Secret** : voir ci-dessous pour generer le JWT
4. **Save**

> **Generer le Service Secret (JWT signe)**

Le Service Secret est un JWT signe avec ta cle privee `.p8`. Tu peux
le generer une fois pour toutes avec cette commande (a executer sur
ta machine, pas dans Coach OS) :

```bash
# Tu as besoin de : Team ID, Key ID, Services ID, chemin du .p8
TEAM_ID="ABCDE12345"
KEY_ID="K1234567890ABCDE"
SERVICE_ID="com.ton-domaine.coach-os.web"
P8_PATH="$HOME/Downloads/AuthKey_K1234567890ABCDE.p8"

# Header + payload + signature, voir la doc Apple pour les details.
# Tu peux aussi utiliser un outil comme https://www.jwt.io ou la
# bibliotheque @apple/token-signing en Node.js.
```

Astuce : il existe des outils web qui prennent ton `.p8`, ton Team ID,
Key ID et Services ID, et te rendent le JWT pret a coller. Recherche
"Apple Service Secret JWT generator Supabase".

> **Renouvellement** : le Service Secret expire apres 6 mois. Note
> dans ton agenda de le regenerer.

---

## 4. Verifier que tout marche

1. Ouvre Coach OS en navigation privee (pour eviter le cache) :
   https://omk-desktop-web-os.vercel.app
2. Sur la page d'auth, les trois boutons doivent etre actifs (pas
   grises).
3. Clique sur **Continuer avec Google** : tu dois etre redirige vers
   Google, puis revenir connecte.
4. Pareil pour Microsoft et Apple.

### Si un bouton reste grise

- Verifie que tu as bien sauvegarde dans Supabase.
- Vide le cache du navigateur.
- Ouvre la console dev (F12) → onglet Reseau : refais la manip. Tu
  dois voir une requete `HEAD /auth/v1/authorize?provider=google`
  repondre en `200` ou `302`. Un `400` ou `404` indique un probleme
  cote Supabase.

### Si le flow OAuth demarre mais echoue au retour

- Verifie que l'URL de callback (`/auth/v1/callback`) est **exactement**
  la meme chez le fournisseur et chez Supabase.
- Verifie que tu n'as pas un slash en trop ou en moins.
- Cote Apple : le `Service Secret` doit etre regenere s'il a expire.

---

## 5. Resume des URLs a coller

Pour t'eviter de les chercher a chaque fois :

| Ou | Quoi |
|---|---|
| Google → Authorized redirect URIs | `https://abcd1234.supabase.co/auth/v1/callback` |
| Google → Authorized JS origins | `https://omk-desktop-web-os.vercel.app` |
| Microsoft → Redirect URI | `https://abcd1234.supabase.co/auth/v1/callback` |
| Apple → Domains | `abcd1234.supabase.co` (sans https://) |
| Apple → Return URLs | `https://abcd1234.supabase.co/auth/v1/callback` |
| Supabase → Authorized redirect (tous) | la meme callback, automatiquement generee |

---

## 6. Ce que je (l'agent) n'ai PAS fait

- **Aucune cle, aucun secret n'est pose dans le depot.** Tu fais
  toute la configuration cote fournisseur + Supabase Dashboard.
- **Aucun provider n'est active cote production** pour l'instant. Le
  code est la, il attend que tu colles les identifiants.
- **Le flow de callback** (`/auth/callback`) renvoie sur Coach OS mais
  ne fait pas encore le pont vers le bureau ; le parent `App.tsx`
  verra la session au prochain render. Si tu vois une page blanche
  apres un login reussi, recharge (F5).

Voir aussi : `SOCLE.md` du brief (le contexte Supabase en 3 projets) et
le `FOURNISSEURS.md` au cas ou ce fichier serait absent.