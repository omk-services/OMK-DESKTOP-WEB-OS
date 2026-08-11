---
id: N_COGNITION
campagne: 2026-08-11 — production
---

# BRIEF N — Cognition redevient une app, et se remplit

## Ton perimetre exclusif

```
src/apps/cognition/**
src/lib/cognition/**
src/lib/app-discovery.tsx      (UNIQUEMENT la ligne 78, l'enregistrement)
src/apps/sales/SalesApp.tsx    (UNIQUEMENT pour REDUIRE la part de Cognition)
supabase/migrations/**         (nouvelles migrations uniquement)
```

**Interdit** : `src/site/**`, `src/apps/audit/**`, `src/apps/legal/**`, `deploy/**`,
`src/onboarding/**`, toute autre app. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## L'etat mesure — trois moities de Cognition

- `src/lib/app-discovery.tsx:78` enregistre l'app avec `hidden: true`, la description
  « SovereignGate — now inside Sales », et un composant `CognitionStub` qui ne rend qu'un
  moignon.
- `src/apps/cognition/CognitionApp.tsx` existe pourtant, et `SalesApp.tsx` en importe
  `CognitionOverviewContent` plus toute la couche de donnees.
- `src/lib/cognition/queries.ts` (145 lignes) interroge **trois tables** — `routines`,
  `events`, `yggdrasil_manifest` — qui **n'existaient dans aucun projet Supabase** jusqu'a la
  migration `20260811000007_cognition.sql` de cette nuit.

Un demenagement laisse a mi-chemin. Ce n'est pas un bug : c'est une decision jamais terminee.

## La decision de l'utilisateur

Cognition **ressort de Sales et redevient une app a part entiere**, recreee plutot que
deplacee. Ses raisons, a respecter :

- ses objets — routines, evenements, manifeste de graphe avec score de souverainete du savoir —
  ne parlent pas de vente. Loger deux vocabulaires dans une meme app fait toujours perdre
  l'invite ;
- la souverainete est l'argument commercial le plus fort du produit. Il est deja porte par la
  page `/paliers`, par l'app Legal et par la colonne « ou vivent vos donnees ». L'enterrer dans
  un onglet de Sales, c'est l'endroit exact ou personne ne le verra ;
- le composant actuel a ete ecrit pour vivre dans un onglet : ni sections, ni chaine de
  creation, ni page de detail. Le porter tel quel reproduirait la dette.

---

## Chantier 1 — l'app

`hidden: true` saute. Nouvelle description en francais, qui dit ce que l'app fait. Elle prend
ses sections dans la barre laterale, **comme les dix-sept autres** — pas d'onglets internes, pas
de faux bureau (voir ce qui vient d'arriver a l'app Audit : sa citadelle a ete supprimee pour
cette raison exacte).

Sections proposees, a trancher et justifier :

- **Routines** — les boucles que le systeme execute : cadence, heure, gabarit d'invite,
  competences appelees, actif ou non.
- **Journal** — les evenements, par type et par membre. C'est un journal produit par le
  systeme : **pas de bouton de creation**, et c'est normal.
- **Graphe** — le manifeste : version, perimetre des sources, prochaine revision.
- **Souverainete du savoir** — le score, ce qu'il mesure, et ce qu'il faut faire pour le monter.
  Relie-le aux quatre paliers deja definis dans `src/apps/legal/sovereignty.ts` : le meme
  escalier, applique au savoir plutot qu'a l'infrastructure.

**Routines et Graphe portent une vraie chaine de creation** — bouton, formulaire, l'item
apparait dans la liste, le compteur bouge. Le CRUD generique existe
(`src/components/cms/CollectionRepeater.tsx`).

## Chantier 2 — Sales rend ce qu'il a emprunte

Sales garde **au plus un indicateur** de Cognition — un chiffre, une carte — avec un lien qui
ouvre l'app par l'evenement `coach-os:open-app-section` (le seul qui ait un ecouteur, cf.
`SOCLE.md`). Retire le reste : les etats, les chargements, la gestion d'erreur de Cognition
n'ont plus a vivre dans `SalesApp.tsx`.

**Ne casse rien d'autre dans Sales.** Ses autres sections ne sont pas ton sujet.

## Chantier 3 — remplir les trois tables

Les tables existent depuis cette nuit, avec RLS et politiques. Elles sont **vides**, et ce vide
produit quatre erreurs 406 en production : `maybeSingle()` envoie
`Accept: application/vnd.pgrst.object+json`, que PostgREST refuse quand la requete ne rend pas
exactement une ligne. Le client rattrape et rend `null` — l'app fonctionne — mais la console
reste rouge, et une console rouge finit par cacher les vraies pannes.

Ecris `supabase/migrations/<horodatage>_cognition_seed.sql` qui remplit les trois tables pour
l'organisation de demonstration `00000000-0000-0000-0000-000000000001` :
quelques routines credibles, un echantillon d'evenements de types varies, un manifeste avec un
score de souverainete. Des donnees qui racontent quelque chose, pas des `lorem ipsum`.

Applique-la avec le jeton `SUPABASE_OMK_ACCESS_TOKEN` de l'environnement :

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/sgzbkhqqkqdwhakkyzzm/database/query" \
  -H "Authorization: Bearer $SUPABASE_OMK_ACCESS_TOKEN" \
  -H "Content-Type: application/json" -d '{"query":"..."}'
```

**Piege deja paye ce matin** : apres toute creation de table, PostgREST garde son cache de
schema et rend 406 sur une table pourtant presente. Il faut le lui notifier :
`notify pgrst, 'reload schema';`. Ne l'oublie pas, tu perdrais une demi-heure a chercher
ailleurs.

Prevois aussi le seed **local**, pour que l'app soit peuplee en mode demonstration autonome —
la contrainte de `SOCLE.md` tient toujours : le seed local doit survivre au branchement.

---

## Preuve exigee — mesuree, pas declaree

L'outil d'audit existe : `tools/audit-apps.mjs`. Il parcourt toutes les apps et toutes leurs
sections, et **sort en code non nul** au moindre defaut.

```bash
node tools/audit-apps.mjs                                   # local
URL="https://omk-desktop-web-os.vercel.app" node tools/audit-apps.mjs   # production
```

Ton travail est accepte quand :

- l'audit **local** rend `exit 0` avec Cognition visible — donc 18 apps au lieu de 17 ;
- aucune section de Cognition n'est vide, et Routines/Graphe ont leur bouton de creation ;
- la chaine de creation est prouvee sur Routines : compteur avant, formulaire, soumission,
  l'item apparait, compteur apres ;
- une requete anonyme sur les trois tables ne rend plus 406 — colle la sortie `curl` ;
- `npx tsc --noEmit` propre sur TES fichiers, `npm run build` vert ;
- zero erreur console.

Rapport : `_briefs/2026-08-11_production/RAPPORT_N_COGNITION.md`, **ecrit au fil de l'eau**.
Si tu juges qu'une partie de ce brief est une mauvaise idee, dis-le et argumente dedans — c'est
ainsi que l'agent G a eu raison contre le sien. Mais jamais en silence : l'agent J a rendu
`exit 0` sans rapport, et son travail a du etre refait.
