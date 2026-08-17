# BRIEF — architecture des apps embarquées, multi-tenant et partage

## Ce que tu produis

**Un document de conception**, pas du code :
`_briefs/2026-08-17_APPS_IFRAME/RAPPORT_ARCHITECTURE.md`.

C'est le **seul** fichier que tu as le droit d'écrire. Tu ne modifies aucune
ligne de `src/`, aucune migration, aucun `package.json`. Lecture libre.

## Pourquoi un document et pas du code

La question posée n'est pas « corrige ce bug ». Elle est : **comment des apps
créées par un client peuvent-elles être publiées, partagées et mises à jour
sans que les espaces de travail se mélangent ?**

Répondre en écrivant du code reviendrait à figer un choix d'architecture sans
l'avoir posé. Lis `FAITS.md` d'abord — il contient l'état mesuré.

## Les cinq questions, dans l'ordre

### Q1 — Où doivent vivre les apps publiées ?

Aujourd'hui : `localStorage`, donc nulle part de partageable.

Le projet a deux bases Supabase (cf. `FAITS.md` et les migrations existantes) :
`sgzbkhqqkqdwhakkyzzm` (INTERN, celle que l'app interroge) et
`ndvqwcapwcnpdvknxcjw` (CUSTOMERS, orphelin).

Propose un schéma de tables pour les apps publiées. Il doit répondre à :

- une app appartient-elle à un **tenant** ou à un **utilisateur** ?
- une app peut-elle être **privée**, **partagée dans son tenant**, ou
  **publiée à tous** ? Les trois portées sont-elles nécessaires ?
- les policies RLS correspondantes — inspire-toi de
  `supabase/migrations/2026-08-17_memberships_alignement_contrat.sql`, qui
  contient déjà `is_tenant_admin()` en `SECURITY DEFINER` et explique
  **pourquoi** une policy sur une table qui s'interroge elle-même provoque
  une récursion infinie.

### Q2 — Comment publier sans mélanger les espaces ?

C'est le cœur de la demande. Un client qui publie une app dans l'App Store ne
doit pas voir ses données apparaître chez un autre, et réciproquement.

Traite explicitement :

- que voit un utilisateur de l'App Store : ses apps + celles de son tenant +
  le catalogue public ?
- qui a le droit de publier vers le catalogue public ? Une validation est-elle
  nécessaire, ou tout le monde publie ?
- une app publique référence-t-elle des **données** du tenant qui l'a créée ?
  Si oui, c'est une fuite par conception — comment l'empêcher ?

### Q3 — Les limites multi-tenant de Notion / Airtable / ClickUp

L'utilisateur demande à quel point le compte Notion, Airtable ou ClickUp de
**chaque utilisateur** est cloisonné dans son espace.

**Recherche les faits, ne les invente pas.** Consulte la documentation
officielle de chacun. Pour chaque service, réponds :

| Service | Unité d'isolation | Une intégration OAuth couvre quoi ? | Limites d'API par compte |
|---|---|---|---|

Points à trancher précisément :

- l'OAuth d'un utilisateur donne-t-il accès à **tout** son workspace, ou à une
  sélection ? (Notion a un sélecteur de pages, Airtable des scopes, ClickUp
  des équipes.)
- si Coach OS stocke un jeton OAuth par utilisateur, où vit-il, et qui peut
  le lire ? **Un jeton OAuth d'un client dans une table lisible par un autre
  client est la faute la plus grave possible dans ce chantier.**
- les quotas d'API sont-ils par compte utilisateur ou par application ? Si
  c'est par application, un client bavard épuise le quota des autres.

Si tu ne trouves pas une réponse dans la documentation, **écris que tu ne l'as
pas trouvée**. Ne comble pas par déduction.

### Q4 — Que faire du niveau « Easy » (iframe d'URL externe) ?

Mesure acquise : `macro.com` renvoie `X-Frame-Options: DENY`. Aucun correctif
n'est possible côté Coach OS.

Réponds à :

- combien des SaaS visés autorisent réellement l'embarquement ? Vérifie
  l'en-tête pour une poignée de cibles plausibles (Notion, Airtable, ClickUp,
  Linear, Figma, Google Docs…) et rends un tableau **mesuré**, pas supposé.
- si la majorité refuse, le niveau « Easy » a-t-il encore un sens ? Faut-il
  le restreindre à une liste blanche connue, prévenir l'utilisateur **avant**
  qu'il publie une app qui ne s'affichera jamais, ou l'abandonner ?
- un embarquement qui échoue doit **le dire**. Aujourd'hui l'utilisateur voit
  un écran blanc du navigateur. Propose la détection et le message.

### Q5 — Les mises à jour

Une app publiée puis modifiée : comment la mise à jour parvient-elle aux
utilisateurs qui l'ont installée ?

- versionnage de l'AppSpec (il y a déjà un `"version": "0.1.0"`) ;
- une installation pointe-t-elle vers une version figée ou vers « la
  dernière » ? Les deux ont des conséquences opposées : figée = pas de
  correctif de sécurité, dernière = une régression casse tout le monde d'un
  coup ;
- que se passe-t-il si l'auteur **retire** une app que d'autres utilisent ?

## Le trou béant, à traiter en tête de rapport

Les AppSpec générées pointent vers `https://placeholder.invalid/<slug>.html`.
`placeholder.invalid` ne résout **jamais** (TLD réservé, RFC 2606).

Le SaaS Builder produit une **spécification**. **Rien ne construit ni
n'héberge le HTML.** La chaîne s'arrête là, et aucune des questions ci-dessus
n'a de sens tant que ce trou n'est pas nommé.

Dis clairement ce qui manque entre « AppSpec générée » et « app visible dans
un iframe » : qui compile, où c'est hébergé, sous quelle URL, avec quelle
isolation entre les apps de clients différents.

## Ce qu'on attend du rapport

- **Une recommandation par question**, pas un catalogue d'options. Si
  plusieurs voies se défendent, choisis-en une et dis pourquoi les autres
  perdent.
- **Ce que tu as mesuré** (en-têtes HTTP, documentation lue) séparé de **ce
  que tu supposes**. Les deux ne doivent jamais se ressembler.
- **Un ordre de bataille** : quoi construire en premier, et quel est le plus
  petit incrément qui rend le chantier utile.
- Ce que tu n'as pas pu trancher, et quelle information manque.

## Interdits

- Aucune écriture hors de `RAPPORT_ARCHITECTURE.md`.
- Aucune commande d'écriture (`git`, `npm install`, migration, appel d'API).
- `curl -I` pour lire des en-têtes est **autorisé** — c'est une mesure.
- N'invente aucun quota, aucun scope, aucune limite d'API. Cite la source.
- N'invoque aucun workflow, aucune skill, aucun agent délégué.

## Rapport partiel obligatoire

Si tu t'arrêtes, écris quand même ce que tu as, et termine par `## INACHEVÉ`
avec ce qui restait.
