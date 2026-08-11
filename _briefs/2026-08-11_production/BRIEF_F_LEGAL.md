---
id: F_LEGAL
campagne: 2026-08-11 — production
---

# BRIEF F — l'app Legal : la conformite sans Vanta

## Ton perimetre exclusif

```
src/apps/legal/**
```

**Interdit** : toute autre app, `supabase/**`, `src/lib/tooling/**`, `src/landing/**`.
Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## L'intention

Remplacer une plateforme de conformite a plusieurs milliers d'euros par an par des briques
libres, auto-hebergeables. L'app Legal porte deja l'axe souverainete du produit
(`src/apps/legal/sovereignty.ts` existe) : tu l'etends, tu ne la refais pas.

## Les quatre sources

- **Comp AI** — `https://github.com/trycompai/comp` : alternative libre a Vanta, gestion des
  cadres (SOC 2, ISO 27001, RGPD), politiques, preuves, taches.
- **Probo** — `https://www.probo.com/` et `https://github.com/getprobo/probo` : conformite
  ouverte, pensee pour les petites structures.
- **Prowler** — `https://github.com/prowler-cloud/prowler` : scanner de securite (des centaines
  de controles). **Attention : c'est un outil en ligne de commande**, pas une plateforme avec
  interface. Il produit des rapports que l'on ingere ; ne le presente pas comme une application
  a integrer telle quelle.
- **awesome-compliance** — `https://github.com/theopenlane/awesome-compliance` : la carte du
  paysage. Utilise-la pour ne rien manquer, pas pour tout integrer.

**Commence par les lire.** Etablis ce que chacun fait reellement, sa licence, son mode de
deploiement, et s'il expose une API. Un projet qui exige un cluster ou dont le depot est mort
n'est pas une solution : ecarte-le et dis-le.

## Livrable 1 — le modele de conformite dans le CMS

La conformite est de la donnee structuree, et Coach OS a deja 23 collections avec un CRUD
generique (`src/components/cms/CollectionRepeater.tsx`, props `allowCreate` / `allowDelete`).
Modelise :

- **Cadres** (SOC 2, ISO 27001, RGPD, NIS 2) et leurs **controles** ;
- **Politiques** — version, proprietaire, date de revue, etat ;
- **Preuves** — le lien entre un controle et ce qui l'atteste ;
- **Risques** — probabilite, impact, mesure d'attenuation, proprietaire ;
- **Fournisseurs** — le registre de sous-traitance, qui est aussi une exigence RGPD ;
- **Ecarts** — ce qui n'est pas conforme, et depuis quand.

Chaque section doit avoir **son bouton d'ajout et son formulaire qui fonctionnent**. C'est le
reproche numero un de l'utilisateur sur ce produit : des pages qui montrent sans permettre de
creer. Prouve la chaine complete, compteur avant et apres.

## Livrable 2 — l'etat de conformite, lisible en un coup d'oeil

Une vue qui dit, sans jargon : ou en est-on, qu'est-ce qui manque, qu'est-ce qui expire bientot.
Pourcentage par cadre, controles sans preuve, politiques a rerelire. L'utilisateur n'est pas
juriste : la page doit se lire comme un tableau de bord, pas comme un rapport d'audit.

## Livrable 3 — le pont vers les outils libres

Sans les heberger toi-meme :

- un **format d'import** pour les rapports Prowler (JSON) qui cree des ecarts dans le CMS ;
- une **fiche par outil** — ce qu'il apporte, sa licence, son cout d'hebergement, ce qu'il
  remplace chez Vanta — dans `src/apps/legal/OUTILS.md` ;
- l'emplacement prevu pour une **integration par cadre embarque** (iframe) d'une instance Probo
  auto-hebergee. Ne construis pas l'iframe : prepare le point d'ancrage et documente-le. La
  cible d'hebergement est **Render** (cf. `SOCLE.md`).

## Livrable 4 — la souveraineté, deja amorcee

`src/apps/legal/sovereignty.ts` existe. Relie-le aux quatre paliers du produit — preuve de
concept, SaaS, marque blanche, souverainete — pour qu'un client voie ou vivent ses donnees a
chaque etape, et ce qu'il faut pour passer au palier suivant. C'est l'argument commercial le
plus fort du produit ; il doit etre visible dans l'app, pas seulement sur la page
d'atterrissage.

## Preuve exigee

Pour **chaque** section ou tu ajoutes la creation :

```
compteur avant -> ouvrir le formulaire -> remplir -> soumettre
   -> l'item APPARAIT dans la liste -> le compteur a bouge
```

Capture a l'appui. Un toast de succes ne prouve rien : il a deja menti deux fois ici.

Rapport : `_briefs/2026-08-11_production/RAPPORT_F_LEGAL.md`, ecrit au fil de l'eau.
