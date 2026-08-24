// src/lib/tooling/adapters/a2ui.ts
// Agent to UI — l'agent COMPOSE l'interface, il ne la commente pas.
//
// DISTINCTION AVEC AG-UI, QUI N'EST PAS COSMETIQUE
//
// AG-UI (in-app.ts) diffuse l'etat d'un agent qui travaille : l'humain voit
// avancer. A2UI va plus loin — l'agent RENVOIE des composants que le client
// monte. C'est ce qui permet a un domaine d'ouvrir son propre panneau de
// verdict sans qu'une page soit ecrite pour lui a l'avance.
//
// Contrainte qui gouverne ce fichier : le serveur ne peut pas ouvrir de
// fenetre. Il rend une INSTRUCTION que le client applique ou ignore. Un
// adaptateur qui supposerait pouvoir peindre serait faux des la premiere
// execution hors navigateur.

import type { ToolDefinition } from '../types';
import { list } from '../registry';

/** Composant que le client sait monter. Volontairement pauvre : cinq primitives. */
export type ComposantA2UI =
  | { type: 'texte'; contenu: string }
  | { type: 'tableau'; colonnes: string[]; lignes: string[][] }
  | { type: 'verdict'; statut: string; motif: string; shadow: boolean }
  | { type: 'action'; outil: string; libelle: string; args: Record<string, unknown> }
  | { type: 'groupe'; titre: string; enfants: ComposantA2UI[] };

export interface VueA2UI {
  version: 1;
  source: 'coach-os';
  racine: ComposantA2UI;
}

/** Rend le catalogue des outils sous forme de vue montable. */
export function vueCatalogue(): VueA2UI {
  const parCategorie = new Map<string, ToolDefinition[]>();
  for (const t of list()) {
    if (!parCategorie.has(t.category)) parCategorie.set(t.category, []);
    parCategorie.get(t.category)!.push(t);
  }
  return {
    version: 1,
    source: 'coach-os',
    racine: {
      type: 'groupe',
      titre: 'Outils disponibles',
      enfants: [...parCategorie.entries()].map(([cat, outils]) => ({
        type: 'groupe' as const,
        titre: cat,
        enfants: outils.map((t) => ({
          type: 'action' as const,
          outil: t.name,
          libelle: t.description,
          args: {},
        })),
      })),
    },
  };
}

/**
 * Rend un verdict de portique sous forme montable.
 *
 * `shadow` est porte jusque dans l'interface : un verdict qui n'engage pas doit
 * se voir comme tel, sinon l'arbitre croit trancher alors qu'il regarde un
 * brouillon.
 */
export function vueVerdict(statut: string, motif: string, shadow: boolean): VueA2UI {
  return {
    version: 1,
    source: 'coach-os',
    racine: {
      type: 'groupe',
      titre: shadow ? 'Verdict (shadow, n engage pas)' : 'Verdict opposable',
      enfants: [{ type: 'verdict', statut, motif, shadow }],
    },
  };
}
