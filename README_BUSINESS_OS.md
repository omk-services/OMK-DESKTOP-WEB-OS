# Coach OS

> **Entreprise** du Business OS · arborescence engendrée le 2026-08-02
> Canon : `ADR-CANON-001` — 8 B2 + 8 squads B3 + **53 B3**.

Coach OS échoue le jour où le coach devient le produit. Toute cette structure n'existe que
pour empêcher ça : chaque rang produit un seul artefact, et jamais celui du rang voisin.

## L'organigramme

**Summers, CEO** — 8 VP (héros DC) — 53 techniciens (squads Marvel).

| # | Domaine | VP | Squad | Techniciens | État |
|---|---|---|---|---|---|
| 1 | RH & Méta Gouvernance | Green Lantern | X-Men | 8 | actif |
| 2 | Opérations en Loops | Batman | Fantastic Four | 4 | actif |
| 3 | Productization des Besoins | Flash | Avengers | 7 | actif |
| 4 | Sales & Cognition | Martian Manhunter | Illuminati | 6 | actif |
| 5 | People & Brand | Superman | Guardians | 6 | actif |
| 6 | Finance & ROI | Wonder Woman | Thunderbolts | 6 | actif |
| 7 | R&D & IT | Cyborg | Kang Dynasty | 6 | actif |
| 8 | Legal & Compliance | Aquaman | Eternals | 10 | dormant |

`ORG.json` fait foi sur les rattachements.

## La cascade E-Myth

| Rang | Qui | Rôle E-Myth | Artefact | Cycle |
|---|---|---|---|---|
| **B1** | Summers | Entrepreneur | `ROCKS.md` | 1 rock / mois, 3 / 12WY |
| **B2** | les 8 VP | Manager | `SPRINTS.md` | 4 sprints / mois |
| **B3** | les 53 techniciens | Technicien | `SCRUMS.md` | 5 scrums / semaine |

Un rang ne produit jamais l'artefact du rang voisin. Ce qui remonte n'est jamais une
décision : seulement un fait — un sprint non tenu avec son motif.

**Amont** — la direction descend de Life OS : A1 Beth·Morty `H+3 ans` → A2 les six
frameworks `H+1 an` → A3 les officiers `12WY` → **le rock mensuel de Summers**.

## Arborescence

```
coach-os/
  ORG.json                    l'organigramme, fait foi
  00_Summers_CEO/             B1 — ROCKS.md + vision, dashboard, accords-cadres
  04_Business_Domains/        les 8 VP
    0N_<Domaine>_<VP>_<Squad>/
      VP_AGENT.md  VP_SOUL.md  SPRINTS.md
      squad/
        NN_<Technicien>_<Charge>/   AGENT.md  SOUL.md  SCRUMS.md
  09_Blueprints/              01-SDD · 02-ADR · 03-PRD · 04-DDD
  02_Meta_Factory/            ce qui fabrique Coach OS
```

## Deux domaines à statut particulier

**7 · R&D & IT (Cyborg)** porte le pipeline de veille depuis le pivot IT→R&D de la spec W40
(2026-07-13) : guides YouTube → distillation 8 domaines → cycle Last30days → **au plus trois**
améliorations actionnables par mois. La distillation vit dans
`20_Life_OS/22_Wheel_Discovery/LD01_Business_Book/01_Guides_Business/`.

**8 · Legal & Compliance (Aquaman)** est **dormant**. Il s'active au dépôt du premier fichier
dans `00_Summers_CEO/03_Master_Agreements/` — c'est-à-dire au premier contrat de coaching
signé, et pas avant.

## Coach OS tourne dans Paperclip

L'arborescence n'est pas qu'un dossier : c'est le miroir disque d'une **société Paperclip
vivante**, créée le 2026-08-02.

| | |
|---|---|
| Société | `Coach OS` — `1c6e1a3b-7cc0-49ec-8de4-a501e219f37c` |
| Agents | **62** — 1 CEO + 8 VP + 53 techniciens, hiérarchie `reportsTo` conforme à `ORG.json` |
| Adaptateur | `claude_local` |
| Modèle | **MiniMax-M3[1m]**, via l'environnement `Local` — zéro quota Anthropic |
| Budget | 200 000 ¢/mois |

Chaque agent porte ses trois fiches (`AGENT.md`, `SOUL.md`, son artefact) en
`instructionsBundle` : les fichiers de ce dossier **font foi**, l'agent Paperclip en est le
reflet.

### Plafond de parallélisme — une limite mesurée, pas théorique

**Ne pas réveiller plus de 2 ou 3 agents `claude_local` à la fois sur cette machine.**

Le 2026-08-02, sept VP réveillés simultanément ont épuisé la table des process :
`fork: Resource temporarily unavailable`, puis les sept runs marqués `failed` avec
`acpx_turn_failed — The Claude Agent process exited unexpectedly`. Les sept avaient **écrit
leur `SPRINTS.md` avant de tomber** — le travail était bon, seule la clôture du run a manqué.

Un `failed` sur un agent Paperclip ne veut donc pas dire « rien produit ». Vérifier le
fichier avant de relancer, sous peine d'écraser du travail valide.

## Cette arborescence s'engendre

Elle n'est pas écrite à la main. Le moule est dans `02_Meta_Factory/`. Pour changer Coach OS,
on change le moule et on relance — modifier un fichier engendré à la main, c'est le perdre à
la prochaine passe.
