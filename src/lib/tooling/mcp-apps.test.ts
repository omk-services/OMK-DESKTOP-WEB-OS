import { describe, it, expect } from 'vitest';
import { htmlApprobations } from './ui/approbations';
import { metaUi, listerRessourcesUi, lireRessourceUi } from './adapters/mcp-apps';
import { registerAll } from './catalog/index';
import { get } from './registry';

describe('MCP Apps', () => {
  it('la page est autonome : pont injecte, aucune origine externe', () => {
    const h = htmlApprobations();
    expect(h).toContain('window.pont');
    expect(h.match(/https?:\/\/[^"'\s]+/g) ?? []).toEqual([]);
  });
  it('appelle les outils avec proposalId, pas scenarioId', () => {
    const h = htmlApprobations();
    expect(h).toContain('proposalId: id');
    expect(h).not.toContain('scenarioId: id');
  });
  it("n'annonce jamais un merge qui n'a pas eu lieu", () => {
    const h = htmlApprobations();
    expect(h).toContain('a confirmer dans le client');
  });
  it('scenario.list expose _meta.ui, les autres non', () => {
    registerAll();
    const avec = get('scenario.list')!;
    const sans = get('scenario.read')!;
    expect(metaUi(avec)).toEqual({ ui: expect.objectContaining({ resourceUri: 'ui://coach-os/approbations' }) });
    expect(metaUi(sans)).toBeUndefined();
  });
  it('la ressource ui:// se liste et se lit', () => {
    registerAll();
    expect(listerRessourcesUi().map((r) => r.uri)).toContain('ui://coach-os/approbations');
    expect(lireRessourceUi('ui://coach-os/approbations')!.text).toContain('<!doctype html>');
    expect(lireRessourceUi('ui://coach-os/inconnu')).toBeNull();
  });
});
