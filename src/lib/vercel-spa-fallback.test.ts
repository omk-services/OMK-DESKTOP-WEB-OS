/**
 * Verrou : Vercel doit servir index.html sur les chemins profonds.
 *
 * Pourquoi ce test existe. Le 2026-08-17, la connexion Google a echoue en
 * production avec une 404 — mais pas celle de l'app : celle de Vercel.
 * Google renvoyait correctement vers `/auth/callback`, Vercel cherchait un
 * fichier `dist/auth/callback`, ne le trouvait pas, et rendait son propre
 * 404 **avant** que le moindre code de l'app ne s'execute.
 *
 * Le composant OAuthCallback existait pourtant, et App.tsx l'aiguillait
 * correctement. Rien n'etait casse cote applicatif. Le trou etait dans
 * `vercel.json`, qui n'avait aucune regle de repli.
 *
 * Le piege de diagnostic : la page d'accueil repondait 200 et les fonctions
 * `/api/*` aussi. Seuls les chemins profonds tombaient — et le seul chemin
 * profond du produit est justement celui du retour OAuth. Le defaut etait
 * donc invisible partout sauf a l'endroit ou il coutait une connexion.
 *
 * Ce que ce test ne peut PAS faire : verifier le comportement reel de Vercel.
 * Il lit une configuration, pas une reponse HTTP. Il empeche la regression
 * d'ecriture, pas une regression de plateforme. La verification qui tranche
 * reste un appel sur l'URL de production.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelConfig = {
  rewrites?: Array<{ source: string; destination: string }>;
};

function lireConfig(): VercelConfig {
  const chemin = resolve(__dirname, '../../vercel.json');
  const brut = readFileSync(chemin, 'utf-8');
  return JSON.parse(brut) as VercelConfig;
}

/**
 * Reproduit la semantique de `source` cote Vercel : une expression
 * reguliere ancree sur le chemin complet.
 */
function sourceCouvre(source: string, chemin: string): boolean {
  return new RegExp(`^${source}$`).test(chemin);
}

describe('vercel.json — repli SPA', () => {
  it('declare au moins une regle de reecriture', () => {
    const config = lireConfig();
    expect(
      config.rewrites,
      "vercel.json n'a aucune regle `rewrites` : tout chemin profond rendra " +
        'la 404 de Vercel, y compris /auth/callback.',
    ).toBeDefined();
    expect(config.rewrites?.length).toBeGreaterThan(0);
  });

  it('sert index.html sur /auth/callback — le chemin du retour OAuth', () => {
    const regles = lireConfig().rewrites ?? [];
    const couvrante = regles.find(
      (r) => sourceCouvre(r.source, '/auth/callback') && r.destination === '/index.html',
    );
    expect(
      couvrante,
      'Aucune regle ne renvoie /auth/callback vers /index.html. ' +
        "C'est exactement le defaut qui a casse la connexion Google en " +
        'production le 2026-08-17.',
    ).toBeDefined();
  });

  it('ne detourne pas les fonctions serverless de /api', () => {
    const regles = lireConfig().rewrites ?? [];
    const detournees = regles.filter(
      (r) => sourceCouvre(r.source, '/api/agent/roster') && r.destination === '/index.html',
    );
    expect(
      detournees,
      'Une regle de repli capture /api/* et le renvoie vers index.html. ' +
        'Les fonctions serverless rendraient alors du HTML au lieu de leur ' +
        'reponse JSON.',
    ).toEqual([]);
  });

  it('sert bien la racine', () => {
    const regles = lireConfig().rewrites ?? [];
    const couvrante = regles.find(
      (r) => sourceCouvre(r.source, '/') && r.destination === '/index.html',
    );
    expect(couvrante).toBeDefined();
  });
});
