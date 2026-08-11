# Coach OS — installer le plugin

L'installation tient en une ligne que vous collez dans Claude Code,
Codex, Cursor, ou tout client qui respecte Agent Plugins 1.0.0.

## Pour Claude Code

```
Read coach-os-plugin/plugin.json and install the Coach OS plugin for me.
```

## Pour Codex / Cursor / Hermes

Lire `coach-os-plugin/plugin.json` puis suivre le README du client.
La spec Agent Plugins 1.0.0 (https://agentplugins.org) décrit le
format de manière normative — le dossier `coach-os-plugin/` est
conforme :

- `plugin.json` : manifeste avec `$schema`, `name`, `version`,
  `description`, `license`, `author`, `repository`.
- `mcp.json` : un seul serveur stdio, multiplexe les 13 outils.
- `skills/<outil>/SKILL.md` : 13 skills générées par le
  générateur local, à jour avec le catalogue.

## Vérification

Après installation, ces trois commandes doivent réussir :

```bash
# 1. Le binaire
npx coach-os --help

# 2. Le serveur MCP démarre
npx coach-os tools list

# 3. Une route REST répond
curl -X POST http://localhost:3000/api/v1/collection.list -d '{}' -H 'Content-Type: application/json'
```

## Que fait le plugin

Les 13 outils couvrent :

- **Lecture** : `app.list`, `collection.list`, `collection.read`,
  `collection.search`, `scenario.list`, `scenario.read`.
- **Navigation** : `app.open`, `section.goto`, `scenario.approve`,
  `scenario.reject`.
- **Écriture** : `collection.create`, `collection.update`,
  `collection.delete` — déposent une proposition dans la file
  d'approbation. Aucune écriture directe.

C'est le rang 4 de ARCHITECTURE_V1.md : une seule définition d'outil
produit 5 surfaces (REST, MCP, CLI, Skill, in-app).
