---
id: H_RLS
campagne: 2026-08-11 — production
---

# BRIEF H — casser la recursion RLS, et ouvrir la voie a la demonstration

## Ton perimetre exclusif

```
supabase/migrations/**   (nouvelles migrations uniquement — n'edite AUCUNE des 5 existantes)
supabase/VERIFICATION_RLS.md
src/apps/auth/**         (uniquement si la tache 3 l'exige)
```

**Interdit** : `src/landing/**` (agent E y travaille en ce moment), toute autre app,
`src/lib/tooling/**`. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Ce qui a ete mesure, et que tu n'as pas a remesurer

Les cinq migrations ont ete **appliquees pour de vrai** sur le projet INTERN
(`sgzbkhqqkqdwhakkyzzm`, PostgreSQL 17.6). Etat constate :

- 28 tables creees, **RLS active sur les 28**, **104 politiques** posees ;
- le seed a bien insere des donnees (8 produits, 6 membres, 6 clients, 5 affaires, 5 taches) ;
- le hook `custom_access_token_hook` a ete **corrige et verifie a l'execution** (deux defauts
  fatals : variable masquant une colonne -> `42702`, et `to_jsonb` sur litteral non type ->
  `42804`). Il fonctionne. **N'y touche pas.**

### Le defaut bloquant

Une requete REST avec la cle `anon` sur `/rest/v1/organizations` rend :

```
{"code":"42P17","message":"infinite recursion detected in policy for relation \"memberships\""}
```

La politique qui protege `memberships` interroge `memberships` pour decider si la lecture est
permise. PostgreSQL detecte la boucle et refuse **toute** requete. Ce n'est pas « zero ligne »,
c'est une erreur dure qui casse la couche entiere.

Ce defaut etait invisible a l'application des migrations : elles passent toutes sans erreur.
Il n'apparait qu'a la **premiere requete reelle**. C'est la lecon a retenir.

---

## Tache 1 — casser la recursion (PRIORITAIRE)

Ecris une nouvelle migration `20260811000006_rls_recursion.sql`.

Le principe : **une politique sur `memberships` ne doit jamais lire `memberships`.** Elle doit
s'appuyer sur ce qui est deja dans le jeton, ou sur une fonction marquee `security definer` qui
contourne RLS de facon controlee.

Deux voies, tranche et justifie :

- **Voie A** — la politique de `memberships` compare `user_id = auth.uid()`. Un utilisateur voit
  ses propres appartenances, point. Simple, sans recursion, et suffisant : le claim `org_id` du
  jeton porte deja l'isolation pour toutes les autres tables.
- **Voie B** — une fonction `security definer` qui lit `memberships` hors RLS, appelee par la
  politique. Plus souple, mais toute erreur y devient un contournement de securite.

**Verifie ensuite que les 103 autres politiques ne contiennent pas la meme faute** : toute
politique sur la table `X` qui interroge `X` est suspecte. Liste-les avant de corriger.

## Tache 2 — le visiteur anonyme et la demonstration

Mesure : **100 politiques sur 104 visent le role `authenticated`, aucune ne vise `anon`.**
C'est la bonne posture de securite, mais elle a une consequence que l'utilisateur doit
comprendre : un visiteur non connecte ne verra **rien** venir de Supabase.

Or l'ecran d'accueil propose « Decouvrir sans compte », et c'est ce chemin qui servira aux
captures de la video de presentation.

Tranche entre deux options, et argumente :

1. **Le chemin demonstration ne parle jamais a Supabase** — il reste sur le seed local. Le plus
   simple, le plus sur, et il fonctionne meme si Supabase tombe. C'est aligne avec la contrainte
   de l'utilisateur (« preserver le seed local meme apres le branchement »).
2. **Une organisation de demonstration ouverte en lecture a `anon`**, avec des politiques
   dediees. Plus realiste pour une demonstration en ligne, mais cela expose des donnees en
   lecture publique — a n'accepter que si ces donnees sont fictives.

**Ma recommandation, a challenger si tu as mieux : l'option 1.** Elle ne cree aucune surface
d'exposition et garantit que la video ne depend pas de la disponibilite d'un service tiers.

Quelle que soit ton option, **le bureau de demonstration doit rester peuple**. Verifie-le par le
rendu, pas par le raisonnement.

## Tache 3 — la page de retour OAuth

L'agent D signale que `signInWithOAuth` redirige vers `<origin>/auth/callback`, page qui
**n'existe pas**. Une connexion Google, Apple ou Microsoft reussie atterrirait donc sur une 404.

Cree cette page. Elle doit : recuperer la session, afficher un etat d'attente lisible, rediriger
vers le bureau en cas de succes, et afficher une erreur comprehensible en cas d'echec — jamais
une page blanche.

---

## Preuve exigee — par l'execution, jamais par la lecture

Tu disposes du jeton `SUPABASE_OMK_ACCESS_TOKEN` dans l'environnement. L'API de gestion accepte :

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/sgzbkhqqkqdwhakkyzzm/database/query" \
  -H "Authorization: Bearer $SUPABASE_OMK_ACCESS_TOKEN" \
  -H "Content-Type: application/json" -d '{"query":"..."}'
```

Le test qui tranche, et qui doit passer de l'erreur a une reponse :

```bash
curl -s "https://sgzbkhqqkqdwhakkyzzm.supabase.co/rest/v1/organizations?select=id&limit=3" \
  -H "apikey: <cle anon du projet INTERN>"
```

Aujourd'hui il rend `42P17`. Apres ton correctif, il doit rendre une reponse JSON valide — une
liste vide est un succes, l'erreur de recursion ne l'est pas.

Colle les deux sorties, **avant et apres**, dans ton rapport. Une migration qui n'a pas ete
appliquee et re-testee ne compte pas.

Rapport : `_briefs/2026-08-11_production/RAPPORT_H_RLS.md`, ecrit au fil de l'eau.
