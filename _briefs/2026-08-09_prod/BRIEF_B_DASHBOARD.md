---
id: B_DASHBOARD
campagne: 2026-08-09 production-ready
ordre: 2 — après A
---

# BRIEF B — l'app Dashboard (23 sections)

## Ton périmètre exclusif

```
src/apps/dashboard/**
```

C'est tout. **Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
`src/apps/_ui/`, et toute autre app. Si le défaut est dans le socle, **note-le au rapport**,
ne le corrige pas — l'agent A est passé avant toi et un autre repassera.

Ton périmètre contient 23 sections réparties en trois modules :
`dashboard/sections/` (12 CORE+OPERATIONS) · `security/` (7) · `platform/` (4).

## Ce qui est déjà fait — ne le refais pas

- `Chat.tsx` : vrai `<textarea>`, Brouillonner/Effacer câblés, brouillons persistés en
  `localStorage` (clé `coach-os:chat-drafts:v1`), bouton « Vider » par agent. **Fonctionne.**
- `CEO Cockpit` : métriques calculées depuis le CMS (`deals`, `invoices`, `clients`),
  panneaux « top open deals » et « clients in motion », drill vers Pipeline / Overview /
  Directory / Incidents via l'événement `coach-os:open-app-section`. **Fonctionne.**
- `CEO Cockpit` est en 2ᵉ position dans le rail, juste après Overview. **Ne le redéplace pas.**
- `Overview` : sparkline responsive, 3 boutons d'action câblés, grille `xl:grid-cols-4`.
- `Agents` : clic sur fiche → `AppDetailOverlay` avec `AgentDetailPage`. Grille `2xl:grid-cols-3`.
- `AuditLog` : bouton Export CSV (téléchargement du filtré + toast).
- `Sessions` / `Usage` / `Cost` : panneaux de lecture avec filtres. Cost a son bandeau
  de dépassement de budget dynamique.
- Grilles déjà durcies : `xl:grid-cols-4` sur AuditLog/Cost/Playground/Usage/Overview,
  `2xl:grid-cols-3` sur Agents, `2xl:grid-cols-2` sur les bandeaux à deux colonnes.

## Ce que tu cherches

### 1. Boutons morts et actions sans effet

Pour **chaque** bouton, lien, carte cliquable, ligne de tableau cliquable des 23 sections :
est-ce que le `onClick` fait quelque chose d'**observable** ? Un `onClick` qui n'appelle qu'un
`setState` jamais lu, ou une fonction vide, est un bouton mort. Chaque action doit :
ouvrir un détail, naviguer, muter le CMS, déclencher un toast, ou télécharger un fichier.

### 2. Écrans de lecture seule sans issue

Une section qui n'affiche que des chiffres, sans **un seul** filtre, tri, export ou drill, est
une impasse. Ajoute au moins une prise : un filtre, un tri de colonne, un export, ou un lien
vers la section qui permet d'agir.

### 3. États vides, états d'erreur, états de chargement

Pour chaque liste et chaque tableau : que se passe-t-il si la collection est **vide** ?
Un tableau vide qui n'affiche rien du tout est un bug. Il faut une phrase qui explique ce qui
manque et **un bouton qui mène à l'endroit où on le crée**. Idem pour les divisions par zéro
dans les pourcentages quand le dénominateur est 0 (`NaN%` à l'écran).

### 4. Responsive

La fenêtre de l'OS fait **920×600 par défaut** et l'utilisateur peut la maximiser à `100vw`.
Vérifie tes sections aux deux tailles. Les symptômes déjà vus : cartes étirées et illisibles,
textes qui se chevauchent, chiffres tronqués, graphiques figés à une largeur en dur.

Règle du dépôt : une grille à 4 colonnes ne passe à 4 qu'à partir de `xl:`, une grille à
3 colonnes qu'à partir de `2xl:`. En dessous, 2 colonnes.

### 5. Cohérence des données affichées

Un chiffre en dur (`$67K`, `18mo`, `32 incidents`) qui ne vient d'aucune source est un mensonge
à l'écran. Chaque métrique doit se dériver du seed ou du CMS. Si la donnée n'existe pas,
affiche `0` avec un état vide honnête, jamais un chiffre inventé.

### 6. Thème

Zéro classe de palette Tailwind en dur (`bg-white`, `text-stone-*`, `border-slate-*`…).
Tout passe par `var(--theme-*)` / `var(--panel-*)`. Les couleurs sémantiques (vert/ambre/rouge/
bleu) restent en hex via la prop `tone` — c'est le canon.

## Vérification obligatoire

Le rendu se vérifie **à l'écran**, pas dans le JSX :

```bash
node tools/shot.mjs --app dashboard --section "Overview" --theme glassmorphism --out /tmp/d1.png
```

Labels exacts disponibles : `Overview`, `CEO Cockpit`, `Agents`, `Chat`, `Playground`, `Jarvis`,
`Wind Direction`, `Client Pipeline`, `Sessions`, `Usage`, `Cost`, `Audit Log`, `Kill Switches`,
`DLP & Exfil`, `Panic`, `Rate Limits`, `Security Posture`, `Compliance`, `Alerting`,
`Integrations`, `Knowledge`, `Memories`, `Members`.

Fais au moins une capture par section corrigée, sur **deux thèmes** (`glassmorphism` clair,
`dark-oled` sombre) et **deux tailles** (`--w 1024 --h 700` et `--w 1920 --h 1080`).
L'outil liste les erreurs de console : une page qui hurle n'est pas une page qui marche.

## Ta boucle

```
passe 1 : parcours les 23 sections, liste tous les défauts, range-les PAR CAUSE
passe 2 : corrige cause par cause — la cause qui explique le plus de symptômes d'abord
passe 3 : capture chaque section touchée, 2 thèmes × 2 tailles
passe 4 : npx tsc --noEmit, ne lis que les erreurs de TES fichiers
passe 5 : reparcours les 23 sections à neuf
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

**Deux passes consécutives sans rien de neuf** = fini. Pas avant. Il y a 23 sections : un
rapport qui n'en a traité que 5 est un abandon, pas une livraison.

## Ce que tu livres

- Commits atomiques par cause corrigée.
- `_briefs/2026-08-09_prod/RAPPORT_B_DASHBOARD.md` : les causes, les sections touchées,
  les captures qui prouvent, et ce que tu as vu hors périmètre.
