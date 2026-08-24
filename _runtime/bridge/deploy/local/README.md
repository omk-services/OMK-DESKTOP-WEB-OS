# Local — bare metal, sans Docker ni CapRover ni Coolify ni Dokploy

C'est ici que s'applique la contrainte du 2026-08-24 : sur le poste de travail
(Windows, ce disque), Ori, Prime-Agent et Hermes tournent en binaires
directs — pas de conteneur, pas d'orchestrateur.

## Ce qui existe déjà

Deux des trois harnais sont **déjà** installés bare metal sur ce poste,
confirmé par `_runtime/bridge/harnesses.json` :

| Harnais | Chemin | Statut sonde (2026-08-24) |
|---|---|---|
| Ori | `C:\Users\amado\bin\ori.cmd` | joignable |
| Hermes Agent | `C:\Users\amado\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe` | joignable |
| Prime-Agent | — | absent, type `sdk`, jamais sondé avec succès |

Rien à réinstaller pour Ori et Hermes. Il ne manque que Prime-Agent.

## Installer Prime-Agent en local

Ce shell (Git Bash) sait exécuter un `curl | bash` directement, sans WSL :

```bash
curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh
```

Puis vérifier qu'il rejoint le PATH :

```bash
which prime-agent || echo "verifier ~/AppData/Local ou ~/bin"
```

Une fois confirmé, relancer le sondage pour que le registre passe
`prime-agent` de `suppose` à `mesure` :

```bash
node _runtime/bridge/bridge.mjs --sonde
```

## Pourquoi pas de service persistant ici

Sur la VPS (`../vps/`), les trois harnais tournent en `systemd` parce qu'ils
doivent rester actifs sans supervision. En local, ils sont invoqués à la
demande — Ori route vers Claude Code, Codex, Hermes, etc. au moment où tu
travailles, il n'y a pas besoin d'un daemon en tâche de fond. Si un jour le
Bot Mode d'Hermes doit tourner en continu même localement, ça se ferait par
une Tâche planifiée Windows (`schtasks`), pas par un `.service` — mais ce
n'est pas construit tant que le besoin n'est pas réel.
