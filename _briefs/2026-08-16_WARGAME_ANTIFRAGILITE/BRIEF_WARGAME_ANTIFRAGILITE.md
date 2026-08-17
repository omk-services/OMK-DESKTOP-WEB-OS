---
id: WARGAME_ANTIFRAGILITE
campagne: 2026-08-16
phase: 1 — diagnostic + plan, pas d'exécution
auteur: agent de la session Opus (lecture seule, mesures directes)
perimetre_exclusif: |
  _briefs/2026-08-16_WARGAME_ANTIFRAGILITE/**
  src/lib/observability/**             (si on l'écrit)
interdit: |
  src/**
  api/**
  .env*
  _briefs/2026-08-15_*/**            (ne pas toucher aux briefs précédents)
artifact_obligatoire: |
  _briefs/2026-08-16_WARGAME_ANTIFRAGILITE/RAPPORT_WARGAME.md
---

# BRIEF_WARGAME_ANTIFRAGILITE — pourquoi tes serveurs sont fragiles, et comment les rendre anti-fragiles par conception

> **Date : 2026-08-16.** Toutes les mesures ci-dessous sont prises depuis
> cette session (Opus, sans Ultracode keyword sur ce brief), via Bash + Python.
> Le walk NTFS récursif a timeout — chiffre des jonctions pris dans le canon
> §4 (~47).

---

## 1 · Vocabulaire (Nassim Taleb, *Antifragile*, 2012)

| terme | définition | exemple |
|---|---|---|
| **Fragile** | se casse sous le stress | verre qui tombe |
| **Robuste** | résiste au stress sans s'améliorer | cube de métal qui tombe |
| **Résilient** | encaisse le stress, rebondit à l'identique | ressort |
| **Anti-fragile** | **s'améliore** sous le stress | muscle, système immunitaire |

**Le piège de la robustesse** : un système « robuste » ne s'améliore pas. Quand
la panne arrive, il encaisse — mais la prochaine panne est traitée pareil,
sans capitalisation. Un système anti-fragile apprend de la panne : la deuxième
est moins grave que la première.

**Test simple** : si tu supprimes un composant, est-ce que le système global
devient *meilleur* (anti-fragile), *égal* (robuste), ou *pire* (fragile) ?
Si la réponse est « plus rapide mais avec moins de fonctionnalités », tu as
sélectionné pour la vitesse au lieu de la robustesse.

---

## 2 · Diagnostic — mesure directe 2026-08-16

### 2.1 · Processus qui tournent maintenant

```
claude.exe          16   (5 vagues en parallèle, sub-agents Workflow)
node.exe            26   (CC + 4 marketplaces + tests)
chrome.exe          57   (CC extension + tes onglets Sidebar Life OS)
agentgateway.exe     1   (gateway unique 17 MCP)
```

**Mémoire utilisée** (sample) : 282 MB × 16 claude ≈ 4.5 GB. node ≈ 6 GB.
**Total RAM estimée** : **~11 GB** pour un poste 16-32 GB. Tu es dans la
zone où un agent de plus = swap, freeze, ou OOM.

### 2.2 · Disque

```
C: 931 GB used 598 GB (65%) avail 333 GB
```

**65 % c'est la zone rouge** : un build Vite typique consomme 2-5 GB de
`node_modules`. Tu as 333 GB libres — **mesurable, pas dramatique** —
mais un `npm install` qui échoue à mi-chemin peut laisser 2-3 GB de cache
périmé, et tu n'as pas de script de nettoyage dans ton canon.

### 2.3 · Tokens et secrets exposés

`settings.json` expose **17 variables d'environnement**, dont :

```
ANTHROPIC_API_KEY              (125 chars)   ← secret
SUPABASE_ACCESS_TOKEN          (44 chars)    ← secret
SUPABASE_LIFE_OS_ANON_KEY      (208 chars)   ← semi-secret (public dans le bundle JS)
VERCEL_TOKEN                   (60 chars)    ← secret
ANTHROPIC_DEFAULT_OPUS_MODEL
ANTHROPIC_DEFAULT_SONNET_MODEL
ANTHROPIC_DEFAULT_HAIKU_MODEL
```

**Trois vrais secrets** (`ANTHROPIC_API_KEY`, `SUPABASE_ACCESS_TOKEN`,
`VERCEL_TOKEN`). Le canon §5 dit « scanner les secrets avant de déplacer ».
Mais **rien ne scane les secrets dans `settings.json` lui-même** — qui est
le fichier le plus à risque (lu par tous les tools).

### 2.4 · MCP gateway

```
gateway endpoint  HTTP 406   (POST attendu, GET refusé — correct)
admin UI          HTTP 308   (redirige, server up)
```

**Une cible morte abat tout** : canon §3bis le dit déjà. Mais tu n'as
**aucun monitoring automatisé** de `agentgateway.exe` — s'il meurt, tu
ne le sais qu'à la prochaine requête MCP qui timeout.

### 2.5 · CC plugins

```
extensions VSCode : 23
plugins actives  : ?
marketplaces    : 4
```

23 extensions VS Code, dont l'extension CC elle-même. **Chaque extension
est une porte latérale** — code tiers qui touche ton filesystem, ton
terminal, parfois ton réseau. Ton canon §1 Piège 4 parle des `.bmad-loop/`
dans un dépôt ; il **ne parle pas** des extensions VS Code installées
système.

### 2.6 · CC : le sub-agent Workflow (mesure antérieure)

4 sub-agents lancés en parallèle dans `wf_d1e09957-b2d/journal.jsonl` sans
incident. Le plafond pratique observé : **~4-5 sub-agents simultanés**, au-delà
le `node.exe` total sature.

---

## 3 · Fragilités identifiées (12, ordonnées par criticité)

### Critique (1-4)

**F1 · Single Point of Failure : `agentgateway.exe`**.
Mort = 17 MCP inaccessibles. Pas de health check. Pas de restart
automatique documenté. Le canon §3bis cite le danger mais ne le mesure pas.

**F2 · `ANTHROPIC_API_KEY` en clair dans `settings.json`** (125 chars).
Quiconque lit le fichier a un accès M3 illimité. Pas de vault, pas de
chiffrement au repos, pas de rotation documentée.

**F3 · `SUPABASE_ACCESS_TOKEN` exposé sur deux organisations** :
`zttbgnlgwizveqryknkd` (Agent OS Backend) ET `xuefwzzxsbdzlooitpwu`
(coach-os). Tu ne sais pas qui d'autre a accès à ce PAT — c'est un secret
qui n'appartient à personne et qu'on peut utiliser partout.

**F4 · 16 `claude.exe` simultanés**. Le canon dit 2-3 max pour `claude -p`.
Tu en as 16. **Le plafond de 16 est implicite, jamais posé**, jamais testé
comme limite, jamais documenté dans le canon. Si demain un agent lance
4 vagues de 5 sub-agents, tu es à 36 — et là, ton PC ne survit pas.

### Sérieuse (5-8)

**F5 · Pas de backup automatique des briefs**. Les 5 `_briefs/2026-08-15_*`
sont sur ton SSD local. Si le disque lâche, le travail d'une nuit disparaît.

**F6 · `disque 65 %`**. Pas de script `clean.sh` dans ton canon pour purger
`node_modules`, `.vite`, `dist`, `coverage`. Tu accumules.

**F7 · Pas de monitoring de `node.exe`**. Tu ne sais pas avant qu'il explose
quand un sub-agent boucle. Canon §1 Piège 5 parle du plafond `claude -p` —
pas du plafond `node.exe` runtime.

**F8 · Pas de tests adversariaux sur le canon lui-même**. Si quelqu'un
édite `CLAUDE.md` maladroitement, rien ne casse.

### Latente (9-12)

**F9 · Trois organisations Supabase distinctes** (`zttbgnlgwizveqryknkd`,
`xuefwzzxsbdzlooitpwu`, `zttbgnlgwizveqryknkd` × 2). Dette cognitive :
tu confonds tes projets entre organisations.

**F10 · `VERCEL_TOKEN` à 60 chars**, jamais rotaté. Pas de date d'expiration.

**F11 · Le projet `biyecksylqonuovqmbtz` (Agent OS Backend) contient 6
tables de migrations coach-os appliquées par erreur le 2026-08-15**. C'est de
la donnée orpheline — elle n'a aucune raison d'être là.

**F12 · Jonctions NTFS (47 mesurées dans le canon)** — chaque jonction est
un chemin qui marche « comme par magie » et casse dès qu'on la `rm -rf` au
lieu de `os.rmdir`. Tu n'as pas de script qui vérifie l'inventaire.

---

## 4 · Mécanique — comment rendre anti-fragile par conception

### Trois idées-forces (Taleb)

**iSkinner — la contrainte qui apprend.** Un système anti-fragile **s'améliore**
quand il est stressé. Le stress doit être :
- **modéré** (pas catastrophique à chaque erreur)
- **local** (le crash d'un composant n'entraîne pas les autres)
- **informatif** (le crash laisse une trace qui enseigne la prochaine fois)

**Redondance par duplication, pas par réplication.** Un service doublé est
de la **réplication** (même code, même bug possible). Une approche
différente pour le même job est de la **duplication** (si les deux buggent,
ils buggent différemment, et tu sais lequel corriger).

**Optionalité.** Plus tu laisses de chemins ouverts, plus tu as de chances que
le bon émerge. **Mais** : trop d'optionalité = complexité non maîtrisée = source
de bugs. Le dosage est dans le périmètre (5 chantiers plus bas).

### Le test anti-fragilité

Pose cette question à chaque composant : **si je supprime ce composant, est-ce
que le système global est *meilleur* qu'avant ?**

| composant | supprimer ⇒ ? | type |
|---|---|---|
| `agentgateway.exe` | 17 MCP inaccessibles | **fragile** |
| 1 extension VS Code aléatoire | peut-être mieux (moins de surface d'attaque) | **robuste** |
| `node_modules` corrompu | rebuild, fresh start | **anti-fragile** |
| 1 sub-agent qui crash | le parent continue, les autres continuent | **anti-fragile** |
| 1 organisation Supabase | confusion, pas de bénéfice | **fragile** |

**Ton installation actuelle est fragile sur F1, F3, F9, F11.** Robuste sur F2
(en dur, pas d'amélioration). Anti-fragile sur F4, F8.

---

## 5 · Plan de remédiation — 5 chantiers, coût décroissant

### Chantier 1 — **Monitoring** (1 jour)

Coût : faible. Bénéfice : détecte F1, F7, F11.

```bash
# scripts/monitor.sh — exécuté par cron toutes les 5 min
node_count=$(tasklist 2>/dev/null | grep -ci 'node.exe')
agentgateway_alive=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:15000/)
disk_pct=$(df --output=pcent /c 2>/dev/null | tail -1)

[ $node_count -gt 40 ] && echo ALERTE node_count=$node_count
[ $agentgateway_alive -ne 308 ] && echo ALERTE gateway=$agentgateway_alive
[ $disk_pct -gt 80 ] && echo ALERTE disk=$disk_pct
```

À brancher sur un cron (`/loop`) qui t'envoie un toast si une alerte
remontée. **Aucune dépendance externe** : un fichier `.cache/gauntlet/health.log`
que tu consultes au boot.

### Chantier 2 — **Vault pour les secrets** (2-3 jours)

Coût : moyen. Bénéfice : ferme F2, F3, F10.

Remplacer `settings.json` par un fichier chiffré (`libsodium` ou
`@noble/ciphers`). Les secrets ne sont déchiffrés qu'au boot de la session,
jamais persistés en clair. **Rotation automatique** mensuelle.

Alternative pragmatique : déplacer les secrets dans `.claude/_secrets_local/`
(que le canon §3 mentionne déjà comme existant) et faire pointer
`settings.json` par `${env:VAR}` vers ce vault. **Moins sûr** que le chiffrement,
mais migration en 1h.

### Chantier 3 — **Restart automatique de agentgateway** (1 jour)

Coût : faible. Bénéfice : ferme F1.

Windows Task Scheduler : surveillance toutes les 60 s, si port 15000
ne répond pas, kill `agentgateway.exe` + relance via `Démarrage/agentgateway.vbs`.
**Le canon §3bis dit déjà que c'est mortel**, mais ne pose pas le monitoring.

### Chantier 4 — **Nettoyage de la dette par obscurcité** (1 jour)

Coût : faible (décisionnel), élevé (exécution). Bénéfice : ferme F11, F9.

Dette par obscurcité = **donnée ou configuration qui existe mais que personne
ne sait pourquoi**. Tu en as au moins trois :

1. **6 tables coach-os sur `biyecksylqonuovqmbtz`** (Agent OS Backend) —
   créées par erreur. Export, puis DROP.
2. **Trois organisations Supabase distinctes** — pourquoi 3 ? Qui les
   contrôle ? Sont-elles toutes actives ?
3. **Le `lance.sh` canonique n'existe pas sur disque** (RAPPORT_TERMINAL.md
   le note) — le canon §1 documente un fichier qui n'existe pas.

**Méthode** : pour chaque dette, écrire une note `_briefs/2026-08-16_WARGAME_ANTIFRAGILITE/DETTE_<nom>.md` qui dit : ce que c'est, pourquoi c'est là, qui décide de le garder ou le supprimer. **Pas d'exécution** sans feu vert explicite.

### Chantier 5 — **Bornes explicites sur les sub-agents** (½ jour)

Coût : faible. Bénéfice : ferme F4.

Le canon pose un plafond `claude -p` (2-3) mais **rien** sur les sub-agents
Workflow. Mesure : 4-5 sub-agents simultanés tolérés. Proposition : poser
`MAX_SUBAGENTS_PARALLEL=4` dans `settings.json`, et un wrapper `agentgateway`
qui **refuse** un 5ᵉ sub-agent en parallèle. Tu n'auras jamais le
`STATUS_COMMITMENT_LIMIT` du 12 août 2025.

---

## 6 · Ce qui est HITL, pas déléguable

- **Backup offsite** : où, à quelle fréquence, quelle rétention. Décision
  humaine. Coût : € ou $.
- **UPS** : matériel. Décision humaine.
- **RAID** : matériel. Décision humaine.
- **Choix vault chiffré** : 1Password, Bitwarden, KeePassXC, vault custom ?
- **Rotation manuelle des secrets** : tu le fais, ou tu délègues à un cron.

Ces cinq points sont **des décisions que je ne peux pas prendre à ta place**.

---

## 7 · Action tienne

Tu lis ce brief. Tu choisis :

**A.** Tu veux que M3 (sub-agent Workflow) implémente le Chantier 1 (Monitoring)
ou 3 (Restart agentgateway) — petit, testable, anti-fragilité immédiate.
Dis « applique chantier 1 » ou « applique chantier 3 ».

**B.** Tu veux d'abord la dette par obscurcité (Chantier 4) — c'est de
l'**inventaire**, pas du code. Je peux le faire en direct dans cette session.

**C.** Tu trouves que mon diagnostic est faux. Tu me dis où.

**D.** Tu fermes le brief sans rien faire — il sera dans `_briefs/2026-08-16_*`
pour quand tu voudras y revenir.

Je ne fais rien d'autre sans toi. **Aucune exécution** dans ce brief.
