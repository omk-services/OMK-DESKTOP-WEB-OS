# CORRECTIF 2 — fuite inter-comptes par le cache du navigateur (ÉLEVÉ)

## Périmètre EXCLUSIF en écriture

```
src/lib/auth/            (tout le dossier)
src/stores/              (tout le dossier)
src/lib/wallpaper.ts
src/lib/tours.ts
src/lib/themes/store.ts
src/lib/ontology/scope-store.ts
src/lib/saas-builder/ledger.store.ts
src/lib/demoShell.ts
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_2.md`.

Rien d'autre. Trois autres agents touchent `src/lib/tooling/`, `api/v1/`,
`src/apps/legal/`, `src/apps/people/` et `src/components/ErrorBoundary.tsx`.
**Ne les touche pas.** En particulier : **ne touche pas à `src/lib/cms/`**,
qui vient d'être corrigé.

## Le défaut — reproduit à l'écran

Le propriétaire du produit l'a reproduit : deux comptes Gmail différents, deux
profils de navigateur, le même déploiement. Le fond d'écran, le thème et le
parcours d'accueil **ne suivent pas le compte connecté**.

Une vingtaine de stores persistent dans `localStorage` sous des clés
**globales**, sans préfixe d'utilisateur ni de tenant :

```
coach-os-themes-v1        coach-os-desktop-layout-v1
coach-os-assistant-v1     coach-os-scenarios-v1
coach-os-three-apps-v1    coach-os-app-visibility-v1
coach-os-canvas-fx-v1
```

plus `tenant.store`, `dock.store`, `shell.store`, `wallpaper`, `tours`,
le `scope-store` d'ontologie et le registre du SaaS builder.

`localStorage` est cloisonné **par origine**, pas par compte. Tous les comptes
partagent `omk-desktop-web-os.vercel.app`, donc ils partagent l'espace.

La gravité ne vient pas du fond d'écran. `coach-os-assistant-v1` porte
l'**historique de conversation**. `coach-os-scenarios-v1` porte des scénarios.
Le registre du SaaS builder porte du contenu. Sur un poste partagé — cabinet,
poste d'accueil, ordinateur familial — c'est une fuite de confidentialité entre
clients, et le RLS n'y peut rien : la donnée n'a jamais quitté le navigateur.

## Ce qu'on attend — les deux mesures, pas une

### Mesure 1 — préfixer les clés

Chaque clé persistée devient propre à l'utilisateur et à l'espace :

```
coach-os:<user_id>:<tenant_id>:<nom-du-store>
```

Écris **un seul helper** qui fabrique ce nom, et fais-le utiliser par tous les
stores de ton périmètre. Ne recopie pas la logique vingt fois.

Deux pièges à traiter explicitement, et à documenter dans le code :

- **Avant connexion**, il n'y a pas de `user_id`. Décide d'un espace anonyme
  (par exemple `coach-os:anon:…`) et assure-toi qu'il ne soit **jamais** relu
  une fois quelqu'un connecté.
- **Le nom de la clé est calculé au chargement du module** dans un store
  Zustand `persist`. Or l'utilisateur se connecte *après*. Il te faudra donc
  soit un stockage dont le nom est résolu paresseusement, soit une
  réhydratation explicite à la connexion. Regarde comment `persist` est
  configuré avant de choisir, et **explique ton choix dans le rapport** — c'est
  le point difficile de ce correctif.

### Mesure 2 — purger à la déconnexion

`signOut` ferme aujourd'hui la session Supabase et s'arrête là. Il doit aussi
effacer **toutes** les clés `coach-os*` de `localStorage`.

La mesure 2 seule ne suffit pas : elle ne protège pas d'une fermeture d'onglet
sans déconnexion. La mesure 1 seule ne suffit pas non plus : elle laisse la
donnée sur le disque. **Il faut les deux.** N'en livre pas une en pensant que
ça règle le sujet.

### Ne casse pas la déconnexion

Le code de `signOut` porte déjà un commentaire expliquant qu'il doit renvoyer
vers le site et tolérer un échec réseau. Lis-le. La purge doit avoir lieu
**même si** l'appel Supabase échoue.

## Le test qui verrouille

Au minimum :

1. deux utilisateurs différents écrivent dans le même store et ne se voient
   pas l'un l'autre ;
2. après `signOut`, aucune clé `coach-os*` ne subsiste dans `localStorage` ;
3. la purge a lieu même quand l'appel Supabase de déconnexion rejette.

Place ces tests dans un fichier de ton périmètre. Lance **uniquement** tes
propres tests, avec `--maxWorkers=2`.

## Rappel

Périmètre exclusif. Aucun compteur global. Rapport partiel obligatoire.
