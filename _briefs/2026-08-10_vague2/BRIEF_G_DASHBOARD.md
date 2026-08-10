---
id: G_DASHBOARD
campagne: 2026-08-10 vague 2 — fonctionnalités oubliées
ordre: 2 — en parallèle de P
---

# BRIEF G — Dashboard : l'invite système et le dépôt de documents

## Ton périmètre exclusif

```
src/apps/dashboard/**
```

**Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`, `src/apps/_ui/`,
et toute autre app. L'agent S est passé avant toi (CRUD générique, panneau de notifications).

---

## CHANTIER 1 — L'invite système d'un agent : illisible et non modifiable

`src/apps/dashboard/dashboard/sections/AgentDetail.tsx`, onglet **Invite système** (~ligne 161).
Le prompt est rendu en texte brut (`{agent.systemPrompt}`) dans un bloc à largeur fixe.
Deux défauts, constatés à l'écran :

1. **Pas responsive** : le texte part sur une seule ligne interminable et fabrique une barre de
   défilement horizontale sur toute la fenêtre. Sur une fenêtre de 920 px on ne lit qu'un tiers
   de la phrase.
2. **Non modifiable** : c'est l'invite qui définit le comportement de l'agent, et l'utilisateur
   n'a aucun moyen de la changer. C'est la fonction la plus attendue de cette page.

**Ce que tu construis** :

- Un `<textarea>` réel, en pleine largeur du panneau, hauteur confortable (au moins 12 lignes),
  `white-space: pre-wrap`, qui **ne provoque aucun débordement horizontal** à 920 px comme à
  1920 px.
- Les boutons **Enregistrer** et **Annuler**, actifs seulement quand le texte a changé.
  À l'enregistrement : mutation persistée, toast de confirmation, l'affichage reflète la
  nouvelle valeur. À l'annulation : retour à la valeur d'origine.
- Un compteur de caractères et un garde-fou : refuse d'enregistrer une invite vide (un agent
  sans invite système n'a plus de comportement défini) — message d'erreur visible.
- La persistance : les agents viennent du seed local `dashboard/seed.ts`, qui est un module
  immuable. Écris la modification dans un état applicatif qui **survit au changement d'onglet
  et au changement de section**, et documente en commentaire ce qui se passera quand l'API
  arrivera. Si tu persistes en `localStorage`, suis le motif déjà en place dans `Chat.tsx`
  (clé versionnée, lecture sous `try/catch`).

Applique la même exigence de largeur aux **autres onglets** de la fiche agent
(`Conversation`, `Sessions`, `Mémoires`, `Connexions`, `Réglages`) : aucun ne doit produire de
défilement horizontal. La barre de défilement horizontale vue en bas de la fiche est un défaut
de mise en page, pas une fatalité.

---

## CHANTIER 2 — « Déposer un document » : un toast à la place d'une fonction

`src/apps/dashboard/platform/platform.tsx` ~ligne 73, section **Knowledge**. Le bouton fait
**uniquement** `addToast(...)`. Aucun sélecteur de fichier, aucune mutation, aucun document
n'apparaît nulle part. C'est un bouton qui ment.

**Ce que tu construis** :

- Un vrai `<input type="file">` (masqué, déclenché par le bouton), acceptant les formats que la
  page annonce déjà dans sa liste (`PDF`, `DOCX`, `MD`).
- À la sélection : le fichier est **ajouté à la liste des documents** de la section, avec son
  nom réel, son format déduit de l'extension, sa taille, et l'état initial du cycle
  documentaire (`Déposé` — pas `Interrogeable`, l'indexation n'existe pas).
- Les quatre compteurs d'en-tête (`Documents`, `Chunks`, `Vectorisés`, `Interrogeables`)
  doivent **bouger en conséquence** : un document de plus incrémente `Documents` et **rien
  d'autre** tant qu'il n'est pas découpé. Un compteur qui ne bouge pas après un dépôt réussi
  est un mensonge de plus.
- Un toast honnête : il dit ce qui s'est passé (« déposé, en attente de découpage »), pas ce
  qu'on aimerait qu'il se passe.
- Gestion des cas limites : fichier trop volumineux, extension non supportée, dépôt annulé.
  Chacun doit produire un message visible.

Ne lis pas le contenu du fichier et n'invente pas de découpage : le pipeline RAG n'existe pas.
Le dépôt s'arrête à l'entrée dans la liste, et l'interface le dit.

---

## Vérification obligatoire

```bash
node tools/shot.mjs --app dashboard --section "Knowledge" --theme glassmorphism --w 920 --h 600 --out /tmp/g1.png
node tools/shot.mjs --app dashboard --section "Agents" --theme dark-oled --w 1920 --h 1080 --out /tmp/g2.png
```

Pour la fiche agent, `shot.mjs` s'arrête à la grille : pilote le navigateur pour cliquer une
fiche, ouvrir l'onglet **Invite système**, et **mesure** qu'il n'y a pas de débordement
horizontal :

```js
document.querySelector('[data-window-id="dashboard"]').scrollWidth <= clientWidth
```

Pour le dépôt de document, prouve le cycle complet : compteur avant → dépôt → compteur après.

## Ta boucle

```
passe 1 : chantier 1 (invite système), c'est le plus attendu
passe 2 : chantier 2 (dépôt de document)
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU, aux deux tailles
passe 5 : reparcours les deux chantiers + les 6 onglets de la fiche agent
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

Écris `_briefs/2026-08-10_vague2/RAPPORT_G_DASHBOARD.md` — partiel si tu dois t'arrêter.
