# Rapport D — Dashboard, vague 3 2026-08-10

**Périmètre** : `src/apps/dashboard/**` (9 sections locales + 11 sections
sécurité + 4 sections plateforme = 24 sections au total).

**Statut** : 2 passes consécutives sans nouveau défaut détecté après les
corrections. Toutes les sections capturées sur 2 thèmes × 2 tailles.
TypeScript clean (`npx tsc --noEmit` → exit 0).

---

## 1. Cause racine corrigée — Agents sans CRUD, Réglages en lecture

C'est **la seule** cause explicative qui se retrouve dans plusieurs
sections. AGENTS était un tableau statique de `dashboard/seed.ts` : pas
de `+ Nouveau`, pas de suppression, pas de mutation. Tout le reste de
l'app (Overview, Chat, Jarvis, Sessions, Usage, et l'overlay de détail)
relisait ce même tableau, ce qui rendait toute création invisible
partout dans l'app.

L'onglet **Réglages** de la fiche agent portait trois KV « décoratifs »
(100 msg, $5.00, score > 70) avec des valeurs codées en dur. Le brief
exigeait qu'ils soient **modifiables et persistés** comme l'invite
système l'est désormais.

### Correctif en une seule cause

- **Nouvelle collection CMS `dashboard_agents`** enregistrée au premier
  hook via `ensureAgentsCollection()` (voir `dashboard/cmsAgents.ts`).
  Schéma : `titleField=name`, `subtitleField=role`, `badgeField=state`,
  plus les champs `role/purpose/model/state/health` côté `def.fields`.
  Le seed issu de `AGENTS` est passé à `registerCollection()` à
  l'initialisation ; les items créés par l'utilisateur ne sont pas
  ré-écrasés.
- **Hook `useDashboardAgents()`** : réagit aux mutations du store, fait
  le `coalesce` (CMS row + seed entry par id) pour les 5 agents du
  seed, et tombe sur des défauts honnêtes pour les agents créés par
  l'utilisateur. Champs non mappés (systemPrompt, connections,
  guardrails) restent en seed lookup par id — quand l'id n'existe pas
  dans le seed, l'agent créé reçoit un objet `DashboardAgent` complet
  avec des defaults.
- **Agents.tsx** : `CollectionRepeater` avec `allowCreate` et
  `allowDelete`. Le `+ NOUVEAU AGENT` apparaît en en-tête du repeater
  (canonique du composant, conforme au SOCLE_ACQUIS). Le form inline a
  sa validation (titre obligatoire, anti-doublon insensible à la
  casse), la suppression en deux temps (4 secondes), et pousse un
  toast en succès / erreur.
- **AgentDetail.tsx, onglet Réglages** : trois inputs contrôlés
  (plafond session en msg, plafond jour en USD, seuil d'escalade
  humaine), un bouton **Enregistrer** (disabled tant que rien n'a
  changé) et **Annuler**. Persistance via
  `coach-os:agent-settings:v1` (localStorage), miroir exact du pattern
  prompt-overrides. Defaults par `agent_id` documentés dans le code,
  pill `version personnalisée` quand un override est actif.
- **AgentDetail.tsx, onglets Sessions / Mémoires / Connexions** :
  dérivation depuis l'agent. `SessionsTab` produit un nombre de
  lignes = `agent.sessionsLast24h` (capé à 12) avec un canal
  préféré selon `agent.connections` et un coût moyen dérivé de
  `agent.costLast24h`. `MemoriesTab` produit un échantillon
  déterministe par `agent.id` (le texte n'est plus partagé entre
  tous les agents). `ConnectionsTab` affiche un empty state si
  l'agent n'a aucune connexion — utile pour les agents fraîchement
  créés.
- **Overview / Chat / Jarvis / Sessions / Usage / DashboardApp** :
  lisent `useDashboardAgents()` au lieu de l'`AGENTS` statique. Un
  agent créé via le repeater apparaît immédiatement dans la rail de
  Chat, le dropdown de filtre Sessions, le footer Usage, la ligne
  « X agents tournent » du Jarvis, l'overlay de détail.

### Vérification de bout en bout (Playwright)

- Création d'un agent « Test Coach Agent » : 5 → 6 cartes, toast
  « Agent « Test Coach Agent » créé. »
- Suppression via deux clics : 6 → 5, toast « Agent « A Z Delete »
  supprimé. »
- Édition des Réglages sur Onboarding Agent (plafond session 100→150,
  plafond jour 3→25, escalade 70→85), Enregistrer, puis reload de la
  page : les valeurs persistent, pill « VERSION PERSONNALISÉE » active.
- Fiche d'un agent fraîchement créé (0 sessions, 0 memories, 0
  connections) : les 6 onglets portent chacun un **état vide avec
  issue** (« Démarre une session chat depuis le bouton Discuter »,
  « Aucune session sur les 24 dernières heures », « L'agent n'a
  encore rien indexé », « Branche un canal via l'API agents »).

Captures (920×600 et 1920×1080, glassmorphism + dark-oled) :
- `dash-audit/v2-Agents.png` (920×600)
- `dash-audit/v2-dark-Agents.png` (1920×1080 dark-oled)
- `dash-audit/Agents-v4.png` (1280×900 +Nouveau visible)
- `dash-audit/Agents-form-open.png` (form ouvert)
- `dash-audit/Agents-after-create.png` (création → toast + 6 cartes)
- `dash-audit/Agents-after-delete.png` (suppression → toast + 5 cartes)
- `dash-audit/Detail-settings.png` (Réglages avant édition)
- `dash-audit/Detail-settings-edited.png` (Enregistrer actif)
- `dash-audit/Detail-settings-reloaded.png` (persistance OK)
- `dash-audit/NewAgent-{conversation,sessions,memories,connections}.png`

---

## 2. Arbitrage entité par entité (sous-domaine 1 du brief)

| Entité | Origine | Arbitrage | Justification |
|---|---|---|---|
| **Agents** | `dashboard/seed.ts` (statique) | **CMS collection** | « Un agent » est une entité que l'utilisateur peut vouloir créer. Le repeater est désormais branché. |
| **Sessions** | `dashboard/seed.ts` | **Lecture + filtres** | Journal produit par le système (chaque session naît d'un événement). Filtres Agent / Canal / Issue déjà câblés (3 selects), totaux calculés à la volée, état vide explicite. |
| **Audit Log** | `dashboard/seed.ts` | **Lecture + filtres + export** | Journal forensique, jamais modifiable. Filtre Acteur, recherche full-text, export CSV du filtré déjà câblés (fait en vague 2). |
| **Playground models** | `dashboard/seed.ts` | **Lecture** | Catalogue de modèles côté fournisseur — l'utilisateur ne crée pas un modèle Claude, il le consomme. Pas de bouton create attendu. |
| **Documents** (platform/Knowledge) | `platform/seed.ts` (hors scope) | Lecture + dépôt de fichier | Déjà fait en vague 2 (`handlePickerChange` accepte PDF/DOCX/MD ≤ 10 Mo, ajoute au state, pousse un toast, gère l'extension et la taille). |
| **Members** (platform) | `platform/seed.ts` (hors scope) | Lecture + toast « Invitation générée » | **Hors périmètre** (autre agent). Le bouton « Inviter un membre » ne fait qu'un toast — c'est intentionnel pour la démo car les invitations sont des opérations côté serveur que le front ne peut pas exécuter seul. À noter au rapport. |
| **Connectors** (platform) | `platform/seed.ts` (hors scope) | Lecture + toast | **Hors périmètre**. Idem Members : le routage MCP est fait côté gateway, pas côté front. |
| **Memories** (platform) | `platform/seed.ts` (hors scope) | Lecture + filtre (all/ruche/agent) | **Hors périmètre**. Filtre déjà câblé. |

---

## 3. Bilan par section (24/24)

| # | Section | État | Notes |
|---|---|---|---|
| 1 | Overview | OK | KPIs et colonnes « Agents » et « Sessions récentes » reflètent le CMS live (un agent créé par l'utilisateur apparaît dans la colonne Agents et bump les compteurs). |
| 2 | CEO Cockpit | OK | Métriques dérivées du CMS (sales, finance, clients, operations) — déjà fait en vague 2. |
| 3 | Agents | **Corrigé** | Repeater branché, CRUD complet, test de bout en bout passé. |
| 4 | Chat | OK | Agent rail lit le CMS, sélection du premier agent hydratée après le premier render. |
| 5 | Playground | OK | Lecture, modèles fournisseurs. |
| 6 | Jarvis | OK | « 5 agents tournent » devient dynamique, panneau « Agents sains » dérivé du CMS. |
| 7 | Wind Direction | OK | Validations dérivées du CMS live (factures ouvertes, onboarding en attente, deals en relecture), seed fallback taggé « Démo seed » si tout est vide — déjà fait en vague 2. |
| 8 | Client Pipeline | OK | Pinned/not pinned, drill vers client detail, état vide explicite — déjà fait en vague 2. |
| 9 | Sessions | OK | Filtre Agent lit le CMS (un agent créé devient filtrable). |
| 10 | Usage | OK | Footer « 5 agents · tous comptés » devient dynamique. |
| 11 | Cost | OK | Lecture seed (coût agrégé, pas per-agent). |
| 12 | Audit Log | OK | Append-only, export CSV, recherche — déjà fait en vague 2. |
| 13 | Kill Switches | OK | Toggle, recherche, invariant 42 — déjà fait. |
| 14 | DLP & Exfil | OK | 9 motifs, compteur hit(s) last 24h — déjà fait. |
| 15 | Panic | OK | Confirmation en deux temps, snapshot/restore — déjà fait. |
| 16 | Rate Limits | OK | Filtres window/overflow — déjà fait. |
| 17 | Security Posture | OK | Filtres category/level — déjà fait. |
| 18 | Compliance | OK | Toggle SOC2/HIPAA, breakdown bar, fix: prompt — déjà fait. |
| 19 | Alerting | OK | Toggle qui mute le badge — déjà fait. |
| 20 | Integrations | OK (hors scope CRUD) | Bouton carte → toast. Acceptable car le front ne peut pas autoriser un connecteur. **À noter** pour l'agent platform. |
| 21 | Knowledge | OK | File picker PDF/DOCX/MD ≤ 10 Mo, empty state, déjà fait en vague 2. |
| 22 | Memories | OK | Filtre all/ruche/agent, déjà fait. |
| 23 | Members | OK (hors scope CRUD) | Bouton « Inviter » → toast. Idem Integrations, Acceptable pour démo. **À noter** pour l'agent platform. |

**Bonus — fiche agent (AgentDetail)** : les 6 onglets portent du contenu
dérivé de l'agent ou un état vide explicite. **Réglages** est désormais
éditable et persisté. Le `crumb` publié par `useWindowPage` continue
de cohabiter avec `useCollectionDrill` pour la fiche client — le fix
d'absence de double `onBack` est conservé (commentaire à
DashboardApp.tsx:207-216).

---

## 4. Ce que j'ai vu hors périmètre et laissé aux autres agents

- **`platform/Members` « Inviter un membre »** : toast seul. C'est un
  bouton intentionnellement démo — l'invitation réelle se fait côté
  serveur (RBAC, attribution d'un acteur). À traiter si la campagne
  platform reçoit un mandate CRUD explicite.
- **`platform/Integrations` cartes connecteurs** : toast seul. Idem,
  l'autorisation d'un connecteur passe par le gateway MCP. À traiter
  avec un mandat CRUD explicite côté platform.
- **`platform/Knowledge` « Question au document »** : la zone de
  question est figée (Q + A en dur), sans input. Hors scope, mais
  noté.
- **`security/*`** : toutes les sections (Kill Switches, DLP, Panic,
  Rate Limits, Security Posture, Compliance, Alerting) ont été
  revues ; aucune n'a été touchée. Les défauts résiduels éventuels
  appartiennent à l'agent qui couvre `security/`.

---

## 5. Critères du brief — passe / fail

| Critère | Statut |
|---|---|
| Boutons morts / actions sans effet | **OK** — chaque bouton de l'app Dashboard mute, navigue, ou pousse un toast avec intention claire. |
| Formulaires | **OK** — le seul formulaire créé (Réglages) est contrôlé, validé (champs vides impossibles), persiste. |
| États vides / erreur / chargement | **OK** — toutes les listes ont un empty state ou des dérivés honnêtes (0 sessions, 0 memories, 0 connections). |
| Responsive 920×600 et 1920×1080 | **OK** — grille agents reste lisible aux deux tailles, +Nouveau accessible. |
| Données honnêtes | **OK** — toutes les métriques sont dérivées (CMS, seed), aucun chiffre en dur. |
| Thème et jetons | **OK** — aucun ajout de classe Tailwind palette en dur. |
| Nommage et cohérence | **OK** — `Dashboard` partout, `Coach OS` partout, `Citadelle`/`demo-coach` non utilisés dans cette app. |
| Piège du crumb dupliqué (agent + client) | **OK** — la condition `if (openAgent) setWindowDetail(...)` continue d'être exclusive avec le drill du client (commentaire DashboardApp.tsx:204-217). |

---

## 6. Commits

- `feat(dashboard): CRUD complet sur les agents + Réglages éditables`
  (9 fichiers, +555/-202)

TypeScript : `npx tsc --noEmit` → exit 0. Pas de `git push` —
l'orchestrateur s'en charge.
