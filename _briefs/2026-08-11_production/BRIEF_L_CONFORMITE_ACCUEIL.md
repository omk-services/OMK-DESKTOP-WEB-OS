---
id: L_CONFORMITE_ACCUEIL
campagne: 2026-08-11 — production
---

# BRIEF L — la conformite hebergee, et l'accueil sur le VRAI bureau

## Ton perimetre exclusif

```
src/onboarding/**
src/apps/onboarding/**
src/apps/it-rd/embedded/**
src/apps/legal/**
deploy/**                      (a creer)
src/App.tsx                    (UNIQUEMENT pour monter l'accueil premier lancement)
```

**Interdit** : `src/site/**` et `public/site/**` (agent K y travaille en ce moment),
`supabase/**`, toute autre app. Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Tache 1 — l'accueil doit guider le VRAI bureau

### Le constat, mesure

`TourOverlay` n'est monte qu'a **un seul endroit** : `src/apps/onboarding/OnboardingApp.tsx`
ligne 498, a l'interieur d'un `MiniDesktopShell` — un bureau **simule** dans l'app Onboarding.

Le moteur est bon : il s'abonne a `useShellStore`, recalcule par `requestAnimationFrame`, et
suit une fenetre qu'on deplace. C'est la meilleure piece de la campagne. **Ne le refais pas.**

Mais un nouvel arrivant qui ouvre Coach OS n'est guide par rien. Il devrait d'abord trouver et
ouvrir l'app Onboarding — ce que personne ne fait spontanement.

### La contrainte que G a rencontree, et qu'il faut resoudre

Ses commentaires dans `tours/helpers.ts` le disent : fermer la fenetre Onboarding demonterait
`TourOverlay`, puisqu'il vit dedans. D'ou le repli sur le bureau simule.

**La solution est de le sortir de l'app.** Monte `TourOverlay` au niveau du shell — la ou vivent
le Dock et les icones — pour qu'il survive a l'ouverture et a la fermeture de n'importe quelle
fenetre. Le bureau simule peut rester dans l'app Onboarding comme terrain d'entrainement ; ce
qui manque, c'est la visite sur le bureau reel.

### Le comportement attendu

- **Au tout premier lancement**, apres l'entree (compte ou demonstration), la visite 1 se
  propose. Elle se **propose**, elle ne s'impose pas : un encart discret « Faire le tour ? » avec
  un refus possible, jamais un voile qui bloque l'ecran.
- L'etat se persiste : une visite refusee ou terminee **ne revient jamais** d'elle-meme.
  `hasTourV2Fired()` existe deja, sers-t'en.
- On peut toujours relancer une visite depuis l'app Onboarding.
- `Echap` interrompt a tout moment.

### Preuve exigee

Pilote le navigateur : vider le stockage local, recharger, entrer en demonstration, et montrer
que l'invitation apparait **sur le bureau reel**. Puis : accepter, avancer de deux etapes,
**deplacer la fenetre ciblee**, et mesurer que la bulle a suivi. Puis recharger et montrer que
l'invitation ne revient pas.

---

## Tache 2 — heberger la conformite, sans se lier les mains

### La contrainte de licence, a respecter a la lettre

`src/apps/legal/OUTILS.md` le note : **Comp AI et Probo sont en AGPL-3.0**. Prowler est en
Apache-2.0, donc libre d'usage.

L'AGPL porte une clause reseau : modifier le logiciel **et** l'offrir a travers un reseau oblige
a publier les modifications. La regle qui en decoule, et qui n'est pas negociable :

> **Probo s'heberge A COTE, tel quel, jamais fourche dans Coach OS.**

Coach OS le consomme par cadre embarque et par API. Aucune ligne de Probo ne rentre dans ce
depot. Ainsi l'utilisateur reste simple utilisateur, et son produit reste le sien.

### Ce que tu livres

`deploy/probo/` :
- un `render.yaml` (ou `docker-compose.yml` si Render exige une image preconstruite) qui
  deploie Probo **tel quel** depuis son image officielle ;
- `deploy/probo/README.md` : la marche a suivre pour un utilisateur **non technique** — ou
  cliquer, quelles valeurs coller, comment verifier que ca tourne. Il ne doit jamais ouvrir un
  terminal.
- les variables d'environnement necessaires, **en placeholders** — aucun secret dans le depot.

**Cible : Render** (`dashboard.render.com`), 25 services gratuits, Postgres manage, 25 $/mois
apres le premier client. Ce n'est pas negociable non plus : Octopus Deploy n'heberge rien,
c'est un orchestrateur de livraison.

### Le raccord dans Coach OS

`src/apps/legal/ProboAnchor.tsx` porte deja `data-legal-anchor="probo-iframe"`. Branche-le sur
le mecanisme de sonde que G a ecrit (`src/apps/it-rd/embedded/healthCheck.ts`) : URL
configurable par variable d'environnement, sonde avant affichage, message clair et marche a
suivre si le service ne repond pas. **Jamais de cadre blanc.**

Si Probo refuse d'etre embarque (`X-Frame-Options` ou `frame-ancestors`), **dis-le** et bascule
sur un lien d'ouverture externe. G a montre comment on mesure ca : une sonde, pas une
supposition.

---

## Tache 3 — l'observatoire mort

G a sonde le port `:8787` (observatoire annonce) : **timeout, service mort**. Les trois seules
erreurs console de son travail viennent de la.

Soit tu le retires de la liste des services, soit tu le marques explicitement « hors service »
dans l'interface pour que la console reste propre. Une erreur console recurrente finit par etre
ignoree, et c'est ainsi qu'on rate les vraies.

---

## Preuve exigee

- capture de l'invitation d'accueil **sur le bureau reel**, au premier lancement ;
- capture de la bulle qui suit une fenetre deplacee, hors de l'app Onboarding ;
- capture prouvant que l'invitation ne revient pas apres rechargement ;
- `deploy/probo/` complet, avec un README qu'un non-technicien peut suivre ;
- la sonde Probo qui rend un etat lisible quand le service est absent ;
- **zero erreur console** sur le bureau apres traitement de l'observatoire ;
- `npx tsc --noEmit` propre sur TES fichiers.

Rapport : `_briefs/2026-08-11_production/RAPPORT_L_CONFORMITE_ACCUEIL.md`, **ecrit au fil de
l'eau**. L'agent J a rendu `exit 0` sans rapport : impossible de savoir ce qu'il avait tente.
Ne refais pas ca. Dire « je n'y suis pas arrive, voici pourquoi » est un resultat acceptable ;
un succes silencieux ne l'est pas.
