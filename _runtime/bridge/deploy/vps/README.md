# VPS — Ori, Prime-Agent, Hermes+Bot Mode

Trois processus systemd, imbriqués : Ori en meta-harnais, qui peut lancer
Prime-Agent et Hermes selon `couvre` dans `harnesses.json` ; Hermes en Bot
Mode comme QG de collaboration inter-agents.

> Correction du 2026-08-24 : la contrainte "bare metal, sans Docker/CapRover/
> Coolify/Dokploy" visait le **poste local** (voir `../local/README.md`), pas
> la VPS. Ici, systemd reste le choix par defaut parce que c'est le plus
> simple pour trois processus CLI de longue duree — pas parce qu'un
> orchestrateur de conteneurs est exclu. Si tu veux Docker/Coolify/CapRover
> sur cette VPS plus tard, rien ici ne s'y oppose structurellement.

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
| Ori | `curl -fsSL https://openrouter.ai/labs/ori/install.sh \| bash` | **declare** — présente dans `harnesses.json` (doc officielle OpenRouter), jamais exécutée sur Linux dans cette session |
| Hermes Agent | `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` | **declare** — URL confirmée par l'utilisateur le 2026-08-24, jamais exécutée dans cette session |
| Prime-Agent | `curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh \| sh` | **declare** — URL confirmée par l'utilisateur le 2026-08-24, jamais exécutée dans cette session |

Les trois URLs viennent d'une source humaine cette fois (pas devinées) — mais
aucune n'a encore tourné réellement sur cette VPS. `declare`, pas `mesure`,
tant que l'installation n'a pas été vérifiée en vrai.

## Ordre d'installation

```bash
bash 01-install-ori.sh
bash 02-install-hermes.sh
bash 03-install-prime-agent.sh

# Verifier ou chaque binaire s'est installe avant d'ecrire les unites systemd
which ori hermes prime-agent

# Activer les trois services (corriger le chemin ExecStart si which differe
# de /usr/local/bin — voir le commentaire dans chaque .service)
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
