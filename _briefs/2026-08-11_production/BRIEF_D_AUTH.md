---
id: D_AUTH
campagne: 2026-08-11 — production
---

# BRIEF D — connexion et inscription : formulaire stable, decor vivant

## Ton perimetre exclusif

```
src/apps/auth/**               (a creer)
src/components/auth/**         (a creer)
src/lib/authProviders.ts       (a creer)
```

**Interdit** : `supabase/**` (agent B), `src/lib/supabase.ts` (agent A), `src/lib/tooling/**`
(agent C), toute autre app. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Ce que l'utilisateur demande, mot pour mot

> « des Login Pages avec plusieurs designs superposes qui changent chaque seconde autour du
> formulaire de connexion, **sans deranger l'utilisateur** qui s'inscrit ou se connecte, autant
> que l'ajout de l'inscription et connexion par Google, Apple et Microsoft. »

Deux exigences qui se contredisent en apparence, et c'est tout l'interet du sujet.

## Livrable 1 — le decor qui change, le formulaire qui ne bouge pas

Le decor tourne **autour** du formulaire, jamais dessous. La regle de conception :

- **Le formulaire est une zone sanctuaire.** Position, taille, contraste et ordre de tabulation
  sont figes. Rien de ce qui change ne doit deplacer un champ d'un seul pixel, ni modifier son
  lisibilite. Un utilisateur qui tape son mot de passe ne doit pas voir le fond passer du clair
  au sombre sous ses doigts.
- **Le decor est la peripherie** : arriere-plan, halo, motifs, degrades, illustrations laterales.
- **La transition est croisee et lente** — une fondu d'au moins 600 ms, jamais une coupe.
  « Change chaque seconde » veut dire que la scene evolue en continu, pas qu'elle clignote.
- **`prefers-reduced-motion` est respecte** : si l'utilisateur a demande moins d'animation, le
  decor se fige sur une seule variante. Ce n'est pas optionnel.
- Le contraste du formulaire reste conforme quel que soit le decor derriere. Si une variante
  compromet la lisibilite, c'est la variante qui cede — pose un voile derriere le formulaire.

Puise dans les 20 styles deja declares dans `src/lib/dockSkins.ts` (Glassmorphism, Claymorphism,
Brutalism, Cyberpunk Neon, Aurora Mesh...) : ils existent, ils sont coherents avec le produit,
et les reutiliser evite d'inventer une 21e grammaire visuelle.

## Livrable 2 — les trois fournisseurs

Google, Apple et Microsoft, en inscription **et** en connexion. Cote interface :

- boutons conformes aux regles de marque de chaque fournisseur (logo, libelle, proportions) —
  Apple en particulier refuse les implementations qui s'en ecartent ;
- etat de chargement par bouton, message d'erreur lisible en francais ;
- le meme ecran sert la connexion et l'inscription : une bascule, pas deux pages.

Cote technique : tu appelles `signInWithOAuth` de Supabase. **Tu ne configures aucun
fournisseur** — cela demande des enregistrements d'application et des secrets chez Google,
Apple et Microsoft, que seul l'utilisateur peut creer. Ecris `src/apps/auth/FOURNISSEURS.md`
avec la marche a suivre exacte pour chacun : ou creer l'application, quelles URL de redirection
declarer, quelles valeurs coller dans le tableau de bord Supabase. Un document qu'il puisse
suivre sans etre technicien.

**Prevois le cas non configure** : si un fournisseur n'est pas actif cote Supabase, le bouton
doit le dire calmement plutot que de partir sur une page d'erreur.

## Livrable 3 — les deux niveaux d'entree

`SOCLE.md` decrit le modele. A l'inscription, le compte doit atterrir dans la bonne
organisation :

- **Niveau 0 — l'Architecte** (l'utilisateur) et le compte de demonstration : projet INTERN ;
- **Niveau 1 — les coachs clients** : projet CUSTOMERS.

Tu ne cables pas la logique multi-tenant serveur (c'est l'agent B), mais l'interface doit
porter le choix et le transmettre. Prevois aussi une **entree en demonstration sans compte**,
qui ouvre le bureau sur le seed local : c'est ce qui servira aux captures video.

## Preuve exigee

Captures a l'appui, via `tools/shot.mjs` ou Playwright :

- l'ecran de connexion en clair et en sombre ;
- **trois captures espacees d'une seconde** montrant que le decor a change et que **le
  formulaire est au pixel identique** — mesure les coordonnees du champ courriel dans les trois
  et compare-les dans le rapport ;
- `prefers-reduced-motion: reduce` actif : le decor ne bouge plus ;
- la validation du formulaire (courriel invalide, mot de passe trop court) ;
- zero erreur console.

Rapport : `_briefs/2026-08-11_production/RAPPORT_D_AUTH.md`, ecrit au fil de l'eau.
