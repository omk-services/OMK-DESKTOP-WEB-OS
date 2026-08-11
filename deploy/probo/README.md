# Probo sur Render — guide non-technique

> Ce guide est écrit pour un utilisateur qui **ne tape pas de commandes**.
> Chaque étape se fait dans le navigateur, sur **dashboard.render.com**.

## Pourquoi Probo, pourquoi Render

- **Probo** : outil libre de conformité, signature électronique des
  politiques, preuves photographiques. Alternative open-source à Vanta
  pour la couche « policy acknowledgment ».
- **Render** : hébergeur simple, 25 services gratuits au démarrage,
  Postgres managé inclus, Docker natif. 25 $/mois quand le premier client
  paie — c'est la cible décidée dans le SOCLE.

## Ce que vous allez faire (résumé)

1. Créer un compte Render (gratuit)
2. Connecter le dépôt Git où vit `deploy/probo/render.yaml`
3. Render lit le Blueprint et propose 2 services à créer (Probo + sa base)
4. Vous renseignez 2 valeurs (`APP_URL` et `ALLOWED_HOSTS`)
5. Render déploie. Vous obtenez une URL en `<service>.onrender.com`
6. Vous collez cette URL dans Coach OS (`VITE_PROBO_URL`)
7. Coach OS ouvre l'iframe Probo sur la page Conformité

## Marche à suivre, étape par étape

### Étape 1 — compte Render

- Allez sur **https://dashboard.render.com/register**
- Créez le compte avec votre adresse email ou via GitHub
- Aucune carte bancaire n'est demandée pour le plan Starter gratuit

### Étape 2 — Blueprint Probo

- Une fois connecté, cliquez sur **Blueprints** dans le menu de gauche
- Cliquez sur **New Blueprint Instance**
- Cliquez sur **Connect account** si Render vous le demande (GitHub ou GitLab)
- Sélectionnez le dépôt où se trouve `deploy/probo/render.yaml`
- Render affiche le plan de service :
  - `coach-os-probo` (le service web Probo)
  - `coach-os-probo-db` (la base Postgres)
- Donnez un **nom de groupe** si vous voulez ranger ce déploiement dans
  un workspace Render particulier
- Cliquez sur **Apply**

### Étape 3 — Render crée les services

- Render crée d'abord la base Postgres (1 à 2 minutes)
- Puis il construit l'image Docker Probo (2 à 5 minutes)
- Puis il déploie le service web (1 minute)
- Vous voyez la progression dans le tableau de bord — attendez que les
  deux services affichent **Live** (vert) à droite

### Étape 4 — renseigner `APP_URL` et `ALLOWED_HOSTS`

- Cliquez sur le service `coach-os-probo`
- Dans le menu de gauche, cliquez sur **Environment**
- Repérez les deux lignes **sync: false** dans `render.yaml` :
  - `APP_URL` : collez l'URL du service, par exemple
    `https://coach-os-probo.onrender.com`
  - `ALLOWED_HOSTS` : collez la même URL (Probo s'en sert pour les
    vérifications de sécurité CSRF)
- Cliquez sur **Save Changes** en haut à droite
- Render redéploie automatiquement avec ces nouvelles valeurs

### Étape 5 — vérifiez que ça tourne

- Ouvrez l'URL de votre service (par exemple
  `https://coach-os-probo.onrender.com`) dans votre navigateur
- Vous devez voir la page de connexion Probo
- Créez le premier compte administrateur Probo (email + mot de passe)
- C'est ce compte qui signera les politiques et gérera les preuves

### Étape 6 — branchez Coach OS

Dans Coach OS, sur la page **Conformité** → onglet **Probo** :

- Cliquez sur le bouton **« Comment brancher ? »** s'il est visible
- Collez l'URL Render dans le champ **URL Probo**
- Cliquez sur **Enregistrer**
- L'iframe Probo remplace l'encart vide

Ou, si vous utilisez Coach OS via Vercel :

- Allez sur **https://vercel.com** → projet `omk-saas-os`
- **Settings** → **Environment Variables**
- Ajoutez : `VITE_PROBO_URL` = `https://coach-os-probo.onrender.com`
- Cliquez sur **Deployments** → **Redeploy** (important : les variables
  `VITE_*` ne sont prises en compte qu'au build, pas au runtime)
- L'iframe apparaît au prochain chargement

## Ce qui se passe quand Probo refuse d'être embarqué

Si l'iframe affiche une page blanche ou un refus, c'est probablement
que Probo bloque l'inclusion depuis un autre site. C'est le réglage
par défaut de Probo — par sécurité.

Pour autoriser Coach OS à embarquer Probo, ajoutez dans les variables
d'environnement Render :

```
X_FRAME_OPTIONS_DENY=false
```

…puis redéployez. Si l'iframe reste blanche après ça, Probo a un autre
mécanisme de blocage : dans ce cas, cliquez sur **« Ouvrir Probo dans
un nouvel onglet »** dans Coach OS. Le bouton est toujours là, même
quand l'iframe ne marche pas.

## Ce que ça coûte

| Service | Plan | Coût |
|---|---|---|
| `coach-os-probo` | Starter | 0 $/mois |
| `coach-os-probo-db` | Starter (90 jours) | 0 $/mois |
| `coach-os-probo-db` | Starter après 90 jours | 7 $/mois |
| **Total pendant 90 jours** | | **0 $/mois** |
| **Total après 90 jours** | | **7 $/mois** |

Quand le premier client paie, basculez les deux services sur **Standard** :

- `coach-os-probo` Standard : 12 $/mois
- `coach-os-probo-db` Standard : 7 $/mois
- **Total : 25 $/mois** (la cible du SOCLE)

## Désactiver Probo temporairement

Si vous voulez arrêter Probo sans supprimer la base :

- Sur Render, cliquez sur le service `coach-os-probo`
- En haut à droite : **Suspend**
- L'iframe dans Coach OS détecte le service arrêté et affiche un message
  clair (« service injoignable ») au lieu d'un cadre blanc

## Désinstaller complètement

- Sur Render, page **Blueprints** → trouvez votre instance
- Cliquez sur **Delete Blueprint**
- Render supprime les deux services et la base de données

## Qui appeler si quelque chose ne marche pas

- **Le service refuse de démarrer** : ouvrez l'onglet **Logs** du service
  web sur Render. La dernière ligne d'erreur dit généralement quoi
  corriger (souvent une variable d'environnement manquante)
- **L'iframe reste blanche** : voir la section « Ce qui se passe quand
  Probo refuse d'être embarqué » ci-dessus
- **La base sature** : passez le plan Starter en Standard sur Render

Aucun de ces cas ne demande de taper une commande. Tout se fait dans
le navigateur.