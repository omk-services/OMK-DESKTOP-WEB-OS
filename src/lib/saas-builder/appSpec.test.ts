// src/lib/saas-builder/appSpec.test.ts
// Tests du schema AppSpec. SPEC §8 : 4 cas minimum.

import { describe, expect, it } from 'vitest';
import { AppSpecSchema, parseAppSpec, appSpecToThreeApp, type AppSpec } from './appSpec.schema';

const validSpec: AppSpec = {
  slug: 'session-dashboard',
  name: 'Session Dashboard',
  version: '0.1.0',
  level: 'easy',
  category: 'Dashboard',
  description: 'A dashboard that displays coaching sessions.',
  inputs: { prompt: 'show me a session' },
  outputs: {
    'text/html': 'https://example.com/dashboard.html',
  },
  uiHint: { layout: 'window', accent: '#7c3aed' },
  modelHints: { routeId: 'fal-ai/flux-2/flash', refinedPrompt: 'show me a session' },
};

describe('AppSpecSchema', () => {
  it('accepte un exemple valide (round-trip)', () => {
    const r = AppSpecSchema.safeParse(validSpec);
    expect(r.success).toBe(true);
  });

  it('rejette un slug invalide (espaces, majuscules, vide)', () => {
    for (const bad of ['Has Spaces', 'Has_underscore', '', '   ', '-starts-with-dash']) {
      const r = AppSpecSchema.safeParse({ ...validSpec, slug: bad });
      expect(r.success).toBe(false);
    }
  });

  it('rejette un level inconnu', () => {
    const r = AppSpecSchema.safeParse({ ...validSpec, level: 'unknown' });
    expect(r.success).toBe(false);
  });

  it('rejette un version non semver', () => {
    for (const bad of ['1.0', 'v1.0.0', '1.0.0-beta', 'abc']) {
      const r = AppSpecSchema.safeParse({ ...validSpec, version: bad });
      expect(r.success).toBe(false);
    }
  });
});

describe('parseAppSpec', () => {
  it('rend { ok: true, spec } pour un input valide', () => {
    const r = parseAppSpec(validSpec);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.spec.slug).toBe('session-dashboard');
  });

  it('rend { ok: false, error } pour un input invalide', () => {
    const r = parseAppSpec({ ...validSpec, slug: 'Bad Slug' });
    expect(r.ok).toBe(false);
  });
});

describe('appSpecToThreeApp', () => {
  it('mappe un spec easy vers un ThreeApp avec iframeUrl', () => {
    const t = appSpecToThreeApp(validSpec);
    expect(t.slug).toBe('session-dashboard');
    expect(t.level).toBe('easy');
    expect(t.iframeUrl).toBe('https://example.com/dashboard.html');
    expect(t.codeSource).toBeUndefined();
    expect(t.bundleUrl).toBeUndefined();
    expect(t.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('refuse level=hard avec un message explicite', () => {
    expect(() => appSpecToThreeApp({ ...validSpec, level: 'hard' })).toThrow(/hard/);
  });

  it('refuse level=expert avec un message explicite', () => {
    expect(() => appSpecToThreeApp({ ...validSpec, level: 'expert' })).toThrow(/expert/);
  });

  it('refuse outputs vide', () => {
    expect(() => appSpecToThreeApp({ ...validSpec, outputs: {} })).toThrow(/outputs vide/);
  });
});
