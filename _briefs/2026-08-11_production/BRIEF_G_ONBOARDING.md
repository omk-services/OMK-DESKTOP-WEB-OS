---
id: G_ONBOARDING
campagne: 2026-08-11 — production
---

# BRIEF G — la prise en main du bureau, et les services embarques

## Ton perimetre exclusif

```
src/onboarding/**              (a creer)
src/apps/onboarding/**
src/apps/it-rd/embedded/**     (a creer)
```

**Interdit** : les autres apps, `src/components/**`, `supabase/**`, `src/landing/**`.
Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Tache 1 — la visite guidee

Trois bibliotheques a evaluer, puis **une seule a retenir** :

- **Usertour** — `https://www.usertour.io/` et `https://github.com/usertour/usertour` : coeur
  sous licence MIT, auto-hebergeable, visites et listes de controle, avec analyse d'usage.
- **Shepherd** — `https://github.com/shipshapecode/shepherd` : bibliotheque de visite pure,
  legere, sans serveur.
- **React Joyride** — `https://github.com/gilbarbara/react-joyride` : equivalent, ecosysteme
  React.

**Tranche, avec des arguments.** Le critere qui domine : Coach OS est un **bureau a fenetres
flottantes**, pas une page a defilement. Une visite qui pointe un element doit survivre a une
fenetre qu'on deplace, qu'on reduit ou qu'on ferme. Beaucoup de ces bibliotheques supposent un
document statique. **Teste ce cas precis avant de choisir** — c'est lui qui elimine.

Usertour apporte l'analyse d'usage mais demande un serveur ; Shepherd et Joyride n'ont besoin
de rien mais ne mesurent rien. Si tu retiens Usertour, la cible d'hebergement est **Render**
(cf. `SOCLE.md`), et tu documentes le deploiement sans l'executer.

### Les trois parcours a livrer

1. **Premiere ouverture** — le bureau, le dock, la barre du haut, comment ouvrir une app.
   Court : cinq etapes au plus. Interruptible et reprenable.
2. **Premier agent** — a quoi servent les personnages, comment leur parler, et surtout
   **pourquoi rien ne s'ecrit sans approbation**. C'est la notion la moins evidente du produit
   et la plus importante.
3. **Premiere donnee** — creer un element dans une collection, du bouton jusqu'a la liste.

Regles : jamais de visite imposee deux fois (l'etat se persiste), toujours un moyen de sortir,
et **rien qui bloque le clic** ailleurs.

## Tache 2 — les services deja en place, embarques dans le bureau

L'utilisateur exploite deja une pile d'observabilite et une passerelle d'outils. Il ne veut
**rien reconstruire** : il veut les voir depuis Coach OS.

- `C:\Users\amado\ASpace_OS_V3\00_Amadeus\10_Observers` — Agent Pulse, Agents Observe, PostHog.
- `C:\Users\amado\ASpace_OS_V3\00_Amadeus\20_Harness\agentgateway` — la passerelle, 16 serveurs
  MCP derriere un seul point d'entree `http://127.0.0.1:3300`, interface d'administration sur
  `:15000/ui`.

**Va inventorier ces deux dossiers** : ce qui tourne, sur quel port, comment on le demarre, et
ce qui est mort. Regarde les dates de modification pour trancher.

Puis livre, dans l'app IT / R&D, une section par service vivant qui l'affiche **dans un cadre
embarque**, avec :

- un etat de sante visible avant le chargement du cadre — un iframe blanc sur un service
  eteint est une mauvaise experience ;
- un message clair et une marche a suivre quand le service ne repond pas ;
- l'URL configurable, jamais codee en dur : ces services vivront ailleurs en production.

**Un avertissement a respecter :** beaucoup d'interfaces d'administration refusent d'etre
embarquees (`X-Frame-Options`, `Content-Security-Policy: frame-ancestors`). **Teste chaque
service avant de promettre son cadre.** Si un service refuse, dis-le et propose un lien
d'ouverture externe a la place — ne livre pas un cadre vide en pretendant que ca marche.

## Preuve exigee

- capture de chacun des trois parcours en cours d'execution ;
- **le cas qui elimine** : une visite en cours, on deplace la fenetre visee — la bulle suit ou
  se referme proprement, elle ne reste pas orpheline au milieu de l'ecran ;
- pour chaque service embarque : capture du cadre charge, ou capture du message d'erreur avec
  l'en-tete HTTP qui explique le refus ;
- zero erreur console.

Rapport : `_briefs/2026-08-11_production/RAPPORT_G_ONBOARDING.md`, ecrit au fil de l'eau.
