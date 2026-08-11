---
id: A_AVATAR
campagne: 2026-08-11 — production
---

# BRIEF A — l'avatar d'agent qui sort de l'ecran, et le repointage Supabase

## Ton perimetre exclusif

```
src/agent/AgentTile.tsx
src/agent/SpriteAgent.tsx
src/agent/AssistantOverlay.tsx
src/lib/supabase.ts
.env.example
```

**Interdit** : tout le reste, et en particulier `src/components/Dock.tsx` (corrige ce soir).
Lis `GARDE_FOU.md` et `SOCLE.md` avant de commencer.

---

## Tache 1 — l'avatar devient inatteignable pour toujours (PRIORITAIRE)

### Ce que l'utilisateur decrit, mot pour mot

> « lorsqu'ils ouvrent leur boite de dialogue, elle s'ouvre en poussant l'avatar vers la droite,
> ce qui rend l'avatar inaccessible pour toujours jusqu'au reset de la TopBar qui ferme la
> fenetre de dialogue. Les avatars ont des bordures pour tous les coins ; c'est l'ouverture au
> bord du coin droit qui casse. Je veux une bordure qui maintient l'avatar dans l'ecran meme
> quand la fenetre de dialogue s'ouvre alors que l'agent est sur la bordure du coin droit. »

### Le mecanisme a etablir

Les agents sont des sprites poses sur le bureau, deplacables. Leur bulle de dialogue s'ouvre
a cote d'eux. Quand l'agent est deja colle au bord droit, la bulle pousse l'ensemble hors du
cadre : l'avatar sort de la fenetre, ne peut plus etre attrape a la souris, et rien ne le
ramene — sauf le RESET de la barre du haut, qui ferme tout.

**Va lire le code avant de conclure.** Le sujet est probablement dans `AgentTile.tsx`
(756 lignes) : cherche comment la position de l'avatar est calculee et ou la bulle est
positionnee par rapport a lui. Regarde s'il existe deja une contrainte de bord, et si elle
tient compte de la largeur de la bulle **ouverte** ou seulement de celle de l'avatar.

C'est l'hypothese la plus probable : la contrainte de bord est calculee sur l'avatar seul, si
bien que l'ensemble « avatar + bulle » deborde. **Verifie-la, ne la presume pas.**

### Ce que tu dois livrer

1. **Un confinement qui tient compte de la bulle ouverte.** L'ensemble avatar + bulle reste
   entierement dans la fenetre, sur les quatre bords. Sur le bord droit, la bulle doit
   **basculer a gauche de l'avatar** au lieu de le pousser — c'est le comportement attendu
   d'une infobulle, et c'est ce que fait deja le panneau de reglages du dock (regarde
   `Dock.tsx` en LECTURE SEULE pour t'en inspirer : `vertical ? 'right-full' : 'bottom-full'`).
2. **Le meme traitement en bas et en haut.** Un agent pose en bas de l'ecran doit ouvrir sa
   bulle vers le haut.
3. **Un filet de securite au redimensionnement.** Si l'utilisateur reduit la fenetre, un agent
   qui se retrouverait hors cadre doit etre ramene dedans. Ecoute `resize` et re-applique le
   confinement — sinon le bug revient par un autre chemin.
4. **Aucune regression sur le glisser-deposer** : l'agent doit rester deplacable partout dans
   la zone utile.

### Preuve exigee

Tu ne rends pas ce travail sans capture. Scenario a jouer au navigateur (Playwright est dans
`~/gauntlet-eyes/node_modules/playwright`, et `tools/shot.mjs` montre comment on s'en sert) :

```
poser un agent contre le bord DROIT -> ouvrir sa bulle
  -> mesurer : l'avatar ET la bulle sont dans le viewport (rect.right <= window.innerWidth)
  -> l'avatar reste cliquable (elementFromPoint tombe bien sur lui)
  -> refermer, l'agent est toujours attrapable
```

Repete pour le bord BAS et le coin BAS-DROIT, qui est le pire cas.

Ecris le petit script de preuve dans `tools/avatar-confinement.mjs` et **fais-le echouer
bruyamment** si la cible est introuvable — jamais de repli silencieux. Un test qui ne trouve
rien et rend « vert » est pire que pas de test : trois verdicts faux ont deja ete produits
ainsi sur ce depot.

---

## Tache 2 — repointer Supabase vers un projet vivant

`SOCLE.md` contient la carte exacte des trois projets. Resume : la production interroge
`qjrwcdzaebyqponqkiqs`, **en pause**, d'ou 12 requetes en echec a chaque ouverture d'apps.

Ce que tu fais, **cote code uniquement** :

1. Dans `src/lib/supabase.ts`, verifie comment `supabaseConfigured` est calcule. Il doit etre
   **faux** si l'URL est absente OU manifestement injoignable, pour que l'app bascule
   proprement sur le seed local au lieu d'empiler des requetes mortes.
2. Ajoute un **avertissement console explicite** quand Supabase est configure mais que la
   premiere requete echoue : « Supabase injoignable — bascule sur le seed local ». Aujourd'hui
   la panne est muette, ce qui a coute une soiree.
3. Mets `.env.example` a jour avec les deux projets cibles et un commentaire qui dit lequel
   sert a quoi (INTERN = architecte + demo, CUSTOMERS = clients niveau 1).

**Tu ne touches PAS aux variables d'environnement Vercel** : c'est l'orchestrateur qui les
changera, avec l'accord de l'utilisateur. Tu prepares le code pour que le repointage soit une
simple substitution de valeur.

---

## Ta boucle

```
passe 1 : lire AgentTile.tsx en entier, etablir le mecanisme reel
passe 2 : corriger le confinement
passe 3 : ecrire tools/avatar-confinement.mjs et PROUVER par le rendu
passe 4 : tache 2 (Supabase)
passe 5 : npx tsc --noEmit — ne lis que TES fichiers
passe 6 : reparcourir a neuf ; si du neuf apparait, retour en passe 2
```

Rapport : `_briefs/2026-08-11_production/RAPPORT_A_AVATAR.md`, ecrit au fil de l'eau.
