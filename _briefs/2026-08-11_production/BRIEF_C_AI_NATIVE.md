---
id: C_AI_NATIVE
campagne: 2026-08-11 — production
---

# BRIEF C — le socle AI-natif : une definition d'outil, cinq surfaces

## Ton perimetre exclusif

```
src/lib/tooling/**             (a creer)
api/**                          (routes REST metier — PAS api/_agent/tools.ts)
cli/**                          (a creer)
mcp/**                          (a creer)
skills/**                       (a creer)
coach-os-plugin/**              (a creer)
package.json                    (dependances et champ "bin" uniquement)
```

**Interdit** : `src/apps/**`, `src/components/**`, `src/agent/**`, `supabase/**`.
Lis `GARDE_FOU.md` et `SOCLE.md` avant de commencer.

---

## L'idee, en une phrase

**Une seule definition d'outil doit produire cinq surfaces** : une route API REST, un outil
MCP, une commande CLI, une skill chargeable a la demande, et un outil in-app pour l'agent.
C'est le rang 4 de `ARCHITECTURE_V1.md`, et c'est le socle sur lequel tout le reste se
branchera.

Reference : `C:\Users\amado\ASpace_OS_V3\30_Business_OS\09_Blueprints\vision-v1\ARCHITECTURE_V1.md`
— **lis sa section 2 en entier**. Elle decrit les quatre points d'architecture de Melvynx et
le tableau des ecarts de Coach OS. Ne redecouvre pas ce qui y est deja tranche.

## Etat mesure, a ne pas remesurer

Coach OS a l'in-app (5 outils dans `src/agent/tools.ts`, declares en Zod cote serveur dans
`api/_agent/tools.ts`, avec separation lecture / navigation / ecriture). Il n'a **ni CLI, ni
serveur MCP, ni skills versionnees, ni routes REST metier, ni documentation installable**.

`api/_agent/adapt.ts` existe : **va voir ce qu'il fait**. C'est peut-etre deja l'amorce de
l'adaptateur, auquel cas tu l'etends au lieu de repartir de zero.

## Livrable 1 — `defineTool`, la primitive

`src/lib/tooling/defineTool.ts` : une fonction qui prend un nom, une description, un schema
Zod de parametres, une categorie (`lecture` | `navigation` | `ecriture`), et un executeur.
Elle rend un objet que les adaptateurs savent consommer.

Deux exigences qui viennent de l'experience du depot :

- **La categorie `ecriture` ne s'execute jamais directement.** Elle produit une *proposition*
  qui part dans la file d'approbation (`src/agent/scenarios.ts`, `mergeAtomically`). C'est la
  regle absolue du projet : aucune ecriture sans arbitre humain.
- **La description reste courte.** Le detail d'usage va dans la skill, qui n'est chargee qu'au
  besoin. Une description d'outil est *toujours* dans le contexte du modele ; une skill est
  tiree a la demande. C'est la distinction que Melvynx souligne, et elle economise des jetons.

## Livrable 2 — les cinq adaptateurs

`src/lib/tooling/adapters/` — un fichier par surface :

1. **REST** — genere les routes sous `api/v1/<outil>`. Schema OpenAPI derive du Zod.
2. **MCP** — un serveur `mcp/server.ts` en stdio qui multiplexe **tous** les outils sur une
   seule connexion (plus econome qu'un serveur par outil).
3. **CLI** — `cli/coach-os.ts`, commande `coach-os`, declaree dans le champ `bin` du
   `package.json`. Prevois un drapeau `--detailed` : par defaut la sortie reste courte pour ne
   pas polluer le contexte d'un agent qui l'appelle.
4. **Skill** — genere `skills/<outil>/SKILL.md`, conforme a Agent Skills : frontmatter `name`
   et `description`, corps qui explique *quand* et *comment* utiliser l'outil, et les erreurs
   courantes.
5. **In-app** — reexporte vers la forme deja attendue par `src/agent/tools.ts`, **sans le
   modifier** (il n'est pas dans ton perimetre : tu produis ce qu'il pourra consommer).

## Livrable 3 — le paquet Agent Plugins 1.0.0

`coach-os-plugin/` avec `plugin.json` (`$schema` officiel, `name: "coach-os"`, `version`,
`description`, `license`) et `mcp.json` pointant vers ton serveur stdio. Plus un `skills/`
peuple par l'adaptateur. La specification est citee dans `ARCHITECTURE_V1.md` §4, avec sa
liste de conformite — respecte-la, notamment le rejet des chemins qui sortent de la racine du
plugin et les variables `PLUGIN_ROOT` / `PLUGIN_DATA`.

## Livrable 4 — le catalogue d'outils, elargi

Les 5 outils actuels sont un embryon. Ajoute ceux dont les apps ont reellement besoin, en
t'appuyant sur ce qui existe : les 23 collections du CMS ont deja un CRUD generique
(`CollectionRepeater`). Expose au minimum :

- `collection.list`, `collection.read`, `collection.search` — lecture, sans approbation ;
- `collection.create`, `collection.update`, `collection.delete` — **ecriture, donc via
  proposition** ;
- `app.list`, `app.open`, `section.goto` — navigation (l'evenement
  `coach-os:open-app-section` est le seul qui ait un ecouteur, cf. `SOCLE.md`) ;
- `scenario.propose`, `scenario.approve`, `scenario.reject` — la file d'approbation elle-meme.

Le but declare par l'utilisateur : **que chaque bouton d'ajout et chaque formulaire de chaque
page de chaque app soit atteignable par API**. Le CRUD generique rend ca faisable sans ecrire
23 fois la meme chose — appuie-toi dessus.

## Livrable 5 — la documentation installable en un geste

`skills/INSTALL.md` : le texte que l'utilisateur colle dans Claude Code, Codex ou Cursor pour
que l'agent installe le plugin tout seul. Le modele est celui de Lumail cite dans
`ARCHITECTURE_V1.md` : une URL, une phrase, dix secondes, aucune intervention humaine.

## Preuve exigee

Aucun de ces livrables ne compte s'il n'a pas tourne :

- `npx coach-os --help` liste les commandes ;
- `npx coach-os collection list` rend du JSON ;
- le serveur MCP repond a un `initialize` puis a un `tools/list` — colle la sortie ;
- une route REST repond en local ;
- un outil de categorie `ecriture` **cree une proposition et n'ecrit rien directement** :
  prouve-le en montrant que la donnee n'a pas bouge avant approbation ;
- `npx tsc --noEmit` propre sur TES fichiers.

## Ta boucle

```
passe 1 : lire ARCHITECTURE_V1.md §2 et §4, puis api/_agent/adapt.ts
passe 2 : defineTool + les cinq adaptateurs
passe 3 : le catalogue d'outils
passe 4 : le paquet plugin + la doc d'installation
passe 5 : PROUVER chaque surface par une execution reelle
passe 6 : reparcourir a neuf ; si du neuf apparait, retour en passe 2
```

Rapport : `_briefs/2026-08-11_production/RAPPORT_C_AI_NATIVE.md`, ecrit au fil de l'eau.
