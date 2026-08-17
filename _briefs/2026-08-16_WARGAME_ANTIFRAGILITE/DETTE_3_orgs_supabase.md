# DETTE #2 — 3 organisations Supabase distinctes

> **Date : 2026-08-16**
> **Source : Wargame anti-fragilité, §3 F9**
> **Statut : documenté, NON exécuté**

## Ce que c'est (mesuré 2026-08-16 via `mcp__supabase__list_projects`)

| organisation | projets visibles | statut |
|---|---|---|
| `zttbgnlgwizveqryknkd` | `biyecksylqonuovqmbtz` (Agent OS Backend), `hjweyhpmrxqsxfbibsnc` (Life OS) | 2 projets |
| `xuefwzzxsbdzlooitpwu` | `kphefbvygibkyooqbpwt` (Solaris), `qjrwcdzaebyqponqkiqs` (coach-os) | 2 projets |

Le token MCP Supabase que je vois expose **les deux organisations**. Tu
travailles depuis au moins ces deux-là.

## Pourquoi c'est de la dette par obscurcité

- Trois organisations = **trois contextes de billing distincts**.
- Tu ne sais pas, à un instant T, laquelle porte quel coût.
- Le PAT `SUPABASE_ACCESS_TOKEN` (`sbp_02db5fc8...`) **accède aux deux** —
  si quelqu'un d'autre l'a, il a accès à tout.
- Aucune politique documentée : qui est admin où, qui paie quoi, qui
  transfère quoi.

## Décision tienne (HITL)

Tu ne m'as pas demandé de trancher sur la consolidation. Trois questions
que seul tu peux répondre :

1. **Faut-il consolider** (transférer les 2 projets d'une org vers l'autre) ?
   Coût Supabase : 0 (c'est self-service), coût temps : ~30 min par projet.
2. **Faut-il supprimer des organisations vides** ? Solaris Project est
   INACTIVE depuis 2026-06-17 (~2 mois). Aucune ligne Supabase ne le
   justifie en vie.
3. **Faut-il séparer les accès** (un PAT par organisation) ? Si oui, le
   canon §5 « scanner les secrets avant de déplacer » devient critique.

## Ce que je peux faire sans toi

- Documenter l'inventaire (fait ici).
- Lister les actions possibles, avec coût et bénéfice.

**Ce que tu fais** : répondre aux 3 questions, ou me dire « pas le temps,
  traite plus tard ».
