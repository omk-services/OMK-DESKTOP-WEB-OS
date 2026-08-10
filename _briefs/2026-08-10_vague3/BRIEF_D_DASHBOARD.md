---
id: D_DASHBOARD
campagne: 2026-08-10 vague 3 — fonctionnalités oubliées, apps restantes
---

# BRIEF D — Dashboard, les 23 sections au crible du CRUD

## Ton périmètre exclusif

```
src/apps/dashboard/**
```

**Interdit** : le socle et toute autre app. Lis `SOCLE_ACQUIS.md` avant de commencer.

## Ce qui a déjà été fait sur cette app — ne le refais pas

Deux campagnes sont passées. Sont **déjà** traités et vérifiés à l'écran :

- `Chat` : vrai textarea, brouillons persistés en localStorage, bouton Vider.
- `CEO Cockpit` : métriques dérivées du CMS, drill vers Pipeline / Overview / Directory /
  Incidents, panneaux top deals et clients en mouvement. En 2ᵉ position du rail.
- `Overview` : sparkline responsive, ligne de santé dérivée du seed, 3 actions câblées.
- `Agents` → fiche : **invite système éditable** (textarea + Enregistrer/Annuler, persistée),
  sans débordement horizontal.
- `Knowledge` : « Déposer un document » ouvre un vrai sélecteur de fichier et ajoute à la liste.
- `Audit Log` : export CSV du filtré.
- `Rate Limits`, `Security Posture` : filtres. `Alerting` : bascules câblées.
- Grilles responsives, compteurs DLP dérivés du seed.

## Ce que tu cherches — ce qui reste

### 1. Les collections sans CRUD

Le Dashboard affiche beaucoup de listes issues de son **seed local**
(`dashboard/seed.ts`) plutôt que du CMS : `AGENTS`, `SESSIONS`, `AUDIT_LOG`,
`PLAYGROUND_MODELS`, les tableaux des modules `security/` et `platform/`.

Pour chacune, tranche et applique :

- **Si l'entité a vocation à être créée par l'utilisateur** (un agent, un document, un
  membre, une intégration, un garde-fou), elle doit devenir une **collection CMS** avec
  `CollectionRepeater` branché — création, suppression, état vide avec issue.
- **Si l'entité est un journal produit par le système** (sessions, entrées d'audit,
  incidents constatés), elle reste en lecture — mais elle doit alors offrir au moins
  **un filtre, un tri ou un export**, sinon c'est une impasse.

Écris ton arbitrage dans le rapport, entité par entité. Un « j'ai laissé en lecture » sans
justification est un abandon déguisé.

### 2. Les fiches de détail

`AgentDetail` a six onglets. Ouvre-les tous, aux deux tailles (920×600 et 1920×1080) :
`Invite système` (fait), `Conversation`, `Sessions`, `Mémoires`, `Connexions`, `Réglages`.

Chacun doit porter du contenu réel dérivé de l'agent, pas un panneau vide ou un texte
générique. `Réglages` en particulier : si des réglages y sont affichés, ils doivent être
**modifiables et persistés**, comme l'invite système l'est désormais.

Le niveau attendu pour une fiche est celui de `src/apps/clients/ClientsDetailPage.tsx`.

### 3. Le piège du crumb dupliqué

`DashboardApp` monte **deux** `AppDetailOverlay` (agent et client) et utilise
`useCollectionDrill('clients', …)`. Vérifie qu'ouvrir une fiche puis changer de section
ferme bien la fiche — le défaut décrit dans `SOCLE_ACQUIS.md` est exactement de cette forme.

### 4. Les boutons qui ne font qu'un toast

Un toast n'est pas une fonctionnalité. Passe les 23 sections en revue : chaque bouton doit
muter, naviguer, télécharger ou ouvrir quelque chose. Sinon il est câblé pour de bon, ou il
disparaît.

### 5. Wind Direction

`VALIDATIONS` est un tableau de trois cartes codées en dur dans `DashboardApp.tsx`. La
section prétend lister « ce qui requiert ta validation » : si rien ne les alimente, elle ment
dès la deuxième journée d'usage. Soit tu les dérives d'une source réelle (incidents,
approbations, factures en retard…), soit tu assumes le seed **et tu le dis à l'écran**.

## Vérification

```bash
node tools/shot.mjs --app dashboard --section "<Label>" --theme glassmorphism --w 920 --h 600 --out /tmp/d.png
```

Labels : `Overview`, `CEO Cockpit`, `Agents`, `Chat`, `Playground`, `Jarvis`,
`Wind Direction`, `Client Pipeline`, `Sessions`, `Usage`, `Cost`, `Audit Log`,
`Kill Switches`, `DLP & Exfil`, `Panic`, `Rate Limits`, `Security Posture`, `Compliance`,
`Alerting`, `Integrations`, `Knowledge`, `Memories`, `Members`.

Pour toute création, une capture ne suffit pas : pilote le navigateur (Playwright dans
`~/gauntlet-eyes`, voir `tools/shot.mjs`), crée un item, et **prouve qu'il apparaît**.

## Ta boucle

```
passe 1 : parcours les 23 sections, range les manques PAR CAUSE
passe 2 : corrige, cause par cause, la plus explicative d'abord
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU, aux deux tailles
passe 5 : reparcours à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

**23 sections = 23 sections dans ton rapport.**
Écris `_briefs/2026-08-10_vague3/RAPPORT_D_DASHBOARD.md` — partiel si tu dois t'arrêter.
