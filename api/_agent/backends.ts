// api/_agent/backends.ts
// Catalogue statique des "dos" qu'un agent peut avoir, et leur disponibilite
// telle qu'on peut la mesurer cote serveur.
//
// Les trois dos :
//   - modele  : appel direct a un fournisseur LLM (cf. providers.ts).
//   - multica : delegation au CLI `multica` (processus local, sous-commande
//               `agent list` pour la liste, mais pas de chat synchrone cote
//               CLI — voir backends/multica.ts pour la strategie adopte).
//   - buzz    : delegation a `buzz-agent.exe` via JSON-RPC (ACP v2).
//
// Un dos "available" ici ne signifie pas "pret a repondre a l'utilisateur" :
// la disponibilite est verifiee au moment de l'invocation (cle, binaire,
// daemon). Ce fichier rend la disponibilite de surface (le binaire existe, le
// CLI est dans le PATH, la cle du fournisseur est posee).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isProviderAvailable, listProviders, listProviderStatuses } from './providers.js';

export type BackendId = 'modele' | 'multica' | 'buzz';

export interface BackendSpec {
  id: BackendId;
  label: string;
  /** Branche de la doc a citer dans les erreurs (pour la lecture du rapport). */
  docs: string;
}

// Resolution PATH-aware. Sous Windows, `which` n'existe pas : on essaie
// `where` (cmd.exe natif) puis on retombe sur le registre $env:PATH.
function which(binaire: string): string | null {
  // `where` est silencieux quand il trouve ; il ecrit sur stdout. Si rien
  // n'est trouve il ecrit `INFO: Could not find files for the given pattern(s)`
  // sur stderr et retourne un code != 0.
  const probe = spawnSync('where', [binaire], { encoding: 'utf-8' });
  if (probe.status === 0 && probe.stdout.trim()) {
    const first = probe.stdout.split(/\r?\n/)[0].trim();
    return first || null;
  }
  return null;
}

export interface BackendStatus {
  id: BackendId;
  label: string;
  available: boolean;
  /** Raison pour laquelle le dos est indisponible, lisible. Vide si dispo. */
  reason?: string;
}

interface ProbeContext {
  /** Chemin complet resolu, si on l'a trouve. */
  path?: string;
  /** Le binaire est-il la ? */
  found: boolean;
}

/** Multica : on cherche `multica` dans le PATH. La cle et le workspace
 *  sont dans `~/.multica/config.json` mais on ne les lit pas ici — le
 *  roster cote serveur les utilise au moment de l'invocation. Si le
 *  fichier n'existe pas, l'invocation echoue avec un message clair. */
function probeMultica(): ProbeContext {
  const found = which('multica');
  return { found: Boolean(found), path: found ?? undefined };
}

/** Buzz : on cherche `buzz-agent.exe` dans `%LOCALAPPDATA%\Buzz\`. On ne
 *  depend pas du PATH : sur cette machine le binaire y est pose mais
 *  absent du PATH (cf. GARDE_FOU.md — `.cmd` et `PATH` sous Windows). */
function probeBuzz(): ProbeContext {
  const home = process.env.LOCALAPPDATA ?? '';
  const cible = home ? `${home}\\Buzz\\buzz-agent.exe` : '';
  const found = cible ? existsSync(cible) : false;
  return { found, path: cible || undefined };
}

export function listBackendStatuses(): BackendStatus[] {
  const statuses: BackendStatus[] = [];

  // modele : disponible si au moins un fournisseur a une cle valide.
  const fournisseurs = listProviderStatuses();
  const tousFours = listProviders();
  const envParId = new Map(tousFours.map((f) => [f.id, f.envVar] as const));
  const unDispo = fournisseurs.some((p) => p.available);
  statuses.push({
    id: 'modele',
    label: 'Fournisseur LLM (in-process)',
    available: unDispo,
    reason: unDispo
      ? undefined
      : `Aucun fournisseur disponible. Cles attendues : ${fournisseurs.map((p) => envParId.get(p.id) ?? p.id).join(', ')}.`,
  });

  const multi = probeMultica();
  statuses.push({
    id: 'multica',
    label: 'Multica (CLI local)',
    available: multi.found,
    reason: multi.found
      ? undefined
      : 'Le binaire `multica` est introuvable dans le PATH. Vercel et les environnements sans CLI Multica tombent dans ce cas.',
  });

  const buzz = probeBuzz();
  statuses.push({
    id: 'buzz',
    label: 'Buzz (ACP, local)',
    available: buzz.found,
    reason: buzz.found
      ? undefined
      : `Le binaire buzz-agent.exe est introuvable (cible : ${buzz.path || '%LOCALAPPDATA%\\Buzz\\buzz-agent.exe'}).`,
  });

  return statuses;
}

export function isBackendAvailable(id: BackendId): boolean {
  return listBackendStatuses().some((s) => s.id === id && s.available);
}

/** Verifie la disponibilite d'un fournisseur precis (utilise par model.ts). */
export function isProviderUp(id: string): boolean {
  return isProviderAvailable(id as Parameters<typeof isProviderAvailable>[0]);
}