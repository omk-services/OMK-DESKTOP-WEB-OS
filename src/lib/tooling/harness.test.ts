// src/lib/tooling/harness.test.ts
// Tests du 8e adaptateur — la surface harness (extension pi + roster SSSF).
//
// Ce que ces tests protègent en priorité : les propriétés qu'un lecteur
// humain ne verrait PAS en relisant le générateur, parce qu'elles vivent
// dans la chaîne produite et non dans le code qui la produit.

import { beforeEach, describe, expect, it } from 'vitest';
import { registerAll } from './catalog/index';
import { list } from './registry';
import { buildHarness, buildPiExtension, buildRosterEntry, nomHarness, toolsHarness } from './adapters/harness';

// PAS de `reset()` ici. `registerAll` est verrouillé par un drapeau interne
// et s'auto-appelle au chargement du module : `reset()` puis `registerAll()`
// vide le registre et ne le remplit jamais. Le piège est muet — un test qui
// compte « un registerTool par outil » passe alors au vert sur `0 === 0`.
beforeEach(() => {
  registerAll();
});

it('le registre est peuplé — sinon tout ce fichier est un faux vert', () => {
  expect(list().length).toBeGreaterThan(0);
});

describe('nomHarness — les noms restent ceux que MCP publie', () => {
  it('remplace les points par des underscores', () => {
    expect(nomHarness({ name: 'collection.list' } as never)).toBe('collection_list');
  });

  it('ne laisse aucun point dans les noms publiés', () => {
    for (const tool of toolsHarness()) {
      expect(nomHarness(tool)).not.toContain('.');
    }
  });
});

describe('extension pi — le contenu généré', () => {
  it('publie un registerTool par outil du registre', () => {
    const { content } = buildPiExtension();
    const publies = content.match(/pi\.registerTool\(/g) ?? [];
    expect(publies).toHaveLength(list().length);
  });

  it("prend l'identité dans l'environnement, jamais dans les arguments du modèle", () => {
    const { content } = buildPiExtension();
    expect(content).toContain('process.env.COACH_OS_TENANT');
    expect(content).toContain('process.env.COACH_OS_ACTOR');
    expect(content).toContain('process.env.COACH_OS_ROLE');
  });

  it("refuse quand l'identité manque — pas de repli sur un défaut", () => {
    const { content } = buildPiExtension();
    expect(content).toContain('ctx.deny(');
    // Le défaut silencieux est le défaut qu'on corrige : aucun 'demo' ni
    // '??' de secours ne doit apparaître dans la chaîne d'identité.
    const bloc = content.slice(content.indexOf('const IDENTITE'), content.indexOf('const CATEGORIES'));
    expect(bloc).not.toContain('??');
    expect(bloc).not.toContain('demo');
  });

  it('pose le garde-fou AVANT le premier registerTool', () => {
    const { content } = buildPiExtension();
    // Si l'enregistrement échoue à mi-parcours, mieux vaut un harness sans
    // outils qu'un harness avec outils et sans garde.
    expect(content.indexOf('pi.on("tool_call"')).toBeLessThan(content.indexOf('pi.registerTool('));
  });

  it("n'embarque aucune logique métier : chaque outil proxie vers le serveur", () => {
    const { content } = buildPiExtension();
    const appels = content.match(/appelerCoachOs\(/g) ?? [];
    // +1 pour la déclaration de la fonction elle-même.
    expect(appels.length).toBe(list().length + 1);
    // Le magasin ne doit jamais voyager jusqu'à la machine de l'agent.
    expect(content).not.toContain('serverStore');
  });

  it('reprend le schéma JSON déjà produit pour MCP, sans seconde traduction', () => {
    const { content } = buildPiExtension();
    // Une traduction du zod écrite à la main ici dériverait de celle de
    // mcp-schema sans qu'aucun test ne le dise.
    expect(content).toContain('parameters: {"type":"object"');
  });

  it('échappe les guillemets des descriptions', () => {
    const { content } = buildPiExtension();
    // Une description à guillemets non échappés casse le fichier produit.
    // Il doit rester une seule paire de lignes par champ description.
    for (const ligne of content.split('\n')) {
      if (!ligne.trim().startsWith('description: "')) continue;
      expect(ligne.trimEnd().endsWith('",')).toBe(true);
    }
  });

  it('déclare la catégorie de chaque outil pour le refus local', () => {
    const { content } = buildPiExtension();
    for (const tool of list()) {
      expect(content).toContain(`"${nomHarness(tool)}": "${tool.category}"`);
    }
  });

  it("refuse l'écriture à un guest, comme la matrice serveur", () => {
    const { content } = buildPiExtension();
    expect(content).toContain('categorie === "ecriture"');
    expect(content).toContain('"guest"');
  });
});

describe('roster SSSF — les bornes lues par la machine', () => {
  it("protège le dossier d'extensions, que SSSF ne protège pas par défaut", () => {
    const { content } = buildRosterEntry();
    // Un agent capable de réécrire l'extension qui le bride se débride.
    expect(content).toContain('- adws/adw_data/harness_engineering/');
  });

  it('déclare un périmètre d\'écriture exclusif', () => {
    const { content } = buildRosterEntry();
    expect(content).toContain('writes:');
  });

  it('charge bien le fichier que le générateur émet', () => {
    const extension = buildPiExtension();
    const roster = buildRosterEntry();
    // Les deux chemins doivent coïncider : un roster qui pointe à côté
    // produit un agent sans outils et sans message d'erreur.
    expect(roster.content).toContain(extension.path);
  });

  it("ne contient aucune valeur d'identité — le fichier est versionné", () => {
    const { content } = buildRosterEntry();
    expect(content).not.toMatch(/COACH_OS_(TENANT|ACTOR|ROLE)\s*[:=]\s*\S/);
  });
});

describe('buildHarness — la sortie complète', () => {
  it('rend les deux fichiers, chemins relatifs', () => {
    const fichiers = buildHarness();
    expect(fichiers).toHaveLength(2);
    for (const f of fichiers) {
      expect(f.path.startsWith('/')).toBe(false);
      expect(f.path).not.toMatch(/^[A-Za-z]:/);
      expect(f.content.length).toBeGreaterThan(0);
    }
  });
});
