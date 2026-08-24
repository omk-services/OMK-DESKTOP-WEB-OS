# VPS bare metal — Ori, Prime-Agent, Hermes+Bot Mode

Sans Docker, sans CapRover, sans Coolify, sans Dokploy — décision explicite du
2026-08-24. Trois processus systemd, imbriqués : Ori en meta-harnais, qui peut
lancer Prime-Agent et Hermes selon `couvre` dans `harnesses.json` ; Hermes en
Bot Mode comme QG de collaboration inter-agents.

## Périmètre actuel — un seul admin

Le harnais n'est, pour l'instant, accessible qu'à l'administrateur principal.
**Pas de cloisonnement multi-tenant ici.** Quand The OMK Office (ou un futur
client) doit accéder à une instance séparée, ça se fait par une VPS ou un
`systemd` scope distinct — pas en ajoutant une couche RLS à ces trois
processus. Cette page ne couvre pas ce cas ; le RLS existe déjà côté Supabase
pour l'app web, pas ici.

## État de vérification, par service

| Service | Commande d'install | Statut |
|---|---|---|
| Ori | `curl -fsSL https://openrouter.ai/labs/ori/install.sh \| bash` | **declare** — présente dans `harnesses.json`, jamais exécutée sur Linux dans cette session |
| Hermes Agent | inconnue sur Linux — connue seulement en venv Python Windows (`AppData/Local/hermes/hermes-agent/venv`) | **suppose** — à trouver sur `hermes-agent.nousresearch.com` avant d'installer |
| Prime-Agent | inconnue — type `sdk` dans le registre, jamais sondé avec succès | **suppose** — aucune source d'installation confirmée. Ne pas inventer une URL ; la trouver toi-même sur le dépôt officiel avant de lancer `install.sh` |

**Ne rien lancer en aveugle.** Les deux `.sh` de ce dossier s'arrêtent avec un
message explicite si la variable d'environnement source n'est pas fournie —
volontairement, pour ne pas laisser un `curl | bash` taper une URL fausse.

## Ordre d'installation

```bash
# 1. Ori — la commande est confirmee dans le registre
bash 01-install-ori.sh

# 2. Hermes — ecrase HERMES_INSTALL_URL par la vraie url avant de lancer
HERMES_INSTALL_URL="https://..." bash 02-install-hermes.sh

# 3. Prime-Agent — meme regle
PRIME_AGENT_INSTALL_URL="https://..." bash 03-install-prime-agent.sh

# 4. Activer les trois services
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ori.service hermes-bot.service prime-agent.service
```

## Bot Mode — QG inter-agents

`hermes-bot.service` lance Hermes en mode Bot (`--bot-mode`, à confirmer contre
la doc officielle : https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode).
C'est le canal A2A déjà déclaré dans `harnesses.json` (`surfaces: [mcp, a2a]`) —
avant d'ajouter Buzz, Multica, Paperclip ou T3 Code au roster, vérifier que
`message_agent` fonctionne entre Ori et Prime-Agent seuls.

## Plus tard : multi-tenant et receipts

Décision explicite de l'utilisateur (2026-08-24) : pas de cloisonnement
maintenant. Quand ça viendra, deux pistes à évaluer, pas à construire
aujourd'hui :
1. Une instance systemd/VPS par tenant (isolation forte, coût par client).
2. Un jeton de type "receipt" (courte durée, portée limitée à un scénario)
   émis par Ori pour chaque appel délégué — plus léger, mais demande que le
   bridge vérifie le receipt avant de router, ce qu'il ne fait pas
   aujourd'hui.

Ne pas commencer l'un ou l'autre sans qu'un vrai second tenant existe — même
piège que `03_Master_Agreements/` vide : construire une isolation pour
personne ne prouve rien.
