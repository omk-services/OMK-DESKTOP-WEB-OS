// src/lib/tooling/catalog/app.ts
// Outils sur le bureau et ses apps. Navigation pure : aucun effet de
// bord durable.
//
// app.list, app.open, section.goto. Tous en 'navigation' : geste
// d'affichage immédiat, l'utilisateur voit bouger et corrige en un
// geste. Le serveur ne peut pas ouvrir de fenêtre — il rend une
// instruction que le client applique ou ignore.

import { z } from 'zod';
import { defineTool } from '../defineTool';

const APP_REGISTRY = [
  { id: 'dashboard', name: 'Dashboard', description: 'Vue d\'ensemble du bureau.' },
  { id: 'clients', name: 'Clients', description: 'Liste des clients et de leur état.' },
  { id: 'finance', name: 'Finance', description: 'Pipeline financier et tickets.' },
  { id: 'agents', name: 'Agents', description: 'Configuration des agents IA.' },
  { id: 'documents', name: 'Documents', description: 'Bibliothèque de SOPs et briefs.' },
  { id: 'people', name: 'People', description: 'Équipe et approbations.' },
  { id: 'sop-library', name: 'SOP Library', description: 'Procédures réutilisables.' },
  { id: 'tasks', name: 'Tasks', description: 'Tâches du coach.' },
  { id: 'settings', name: 'Settings', description: 'Préférences du bureau.' },
];

const SECTIONS_BY_APP: Record<string, string[]> = {
  dashboard: ['Overview', 'Today'],
  clients: ['Pipeline', 'Active', 'Archive'],
  finance: ['Pipeline', 'Paid', 'Outstanding'],
  agents: ['Roster', 'Prompts'],
  documents: ['SOPs', 'Briefs'],
  people: ['Team', 'Approvals'],
  'sop-library': ['Library', 'In use'],
  tasks: ['Today', 'This week', 'Inbox'],
  settings: ['Appearance', 'Account'],
};

// app.list — NAVIGATION
export const appList = defineTool({
  name: 'app.list',
  description: 'Catalogue des apps du bureau (id, nom, description). Permet de découvrir ce qui est disponible.',
  category: 'navigation',
  schema: z.object({}),
  displayName: () => 'Lister les apps',
  execute: async () => {
    return {
      ok: true,
      data: {
        count: APP_REGISTRY.length,
        apps: APP_REGISTRY.map((a) => ({
          ...a,
          sections: SECTIONS_BY_APP[a.id] ?? [],
        })),
      },
    };
  },
});

// app.open — NAVIGATION
export const appOpen = defineTool({
  name: 'app.open',
  description: 'Ouvre l\'app indiquée. C\'est une instruction de navigation : sur le client, l\'app courante change ; sur le serveur, rend l\'instruction à exécuter côté bureau.',
  category: 'navigation',
  schema: z.object({
    appId: z.string().min(1).describe('Identifiant canonique de l\'app (kebab-case).'),
  }),
  displayName: (args) => `Ouvrir ${args.appId}`,
  execute: async (args) => {
    const app = APP_REGISTRY.find((a) => a.id === args.appId);
    if (!app) return { ok: false, error: `App inconnue : "${args.appId}".` };
    return {
      ok: true,
      data: {
        appId: app.id,
        title: app.name,
        instruction: 'open_app',
        note: 'Sur le client, l\'écouteur coach-os:open-app-section applique l\'instruction. Sur le serveur, l\'instruction est rendue telle quelle.',
      },
    };
  },
});

// section.goto — NAVIGATION
export const sectionGoto = defineTool({
  name: 'section.goto',
  description: 'Ouvre l\'app et navigue jusqu\'à la section indiquée. Une seule instruction pour les deux gestes — l\'atome est l\'écouteur coach-os:open-app-section côté client.',
  category: 'navigation',
  schema: z.object({
    appId: z.string().min(1).describe('Identifiant canonique de l\'app.'),
    sectionId: z.string().min(1).describe('Identifiant de la section dans l\'app.'),
  }),
  displayName: (args) => `Aller à ${args.appId} > ${args.sectionId}`,
  execute: async (args) => {
    const app = APP_REGISTRY.find((a) => a.id === args.appId);
    if (!app) return { ok: false, error: `App inconnue : "${args.appId}".` };
    const sections = SECTIONS_BY_APP[app.id] ?? [];
    const match = sections.find((s) => s.toLowerCase() === args.sectionId.toLowerCase());
    if (!match) {
      return {
        ok: false,
        error: `Section "${args.sectionId}" introuvable dans "${args.appId}". Sections disponibles : ${sections.join(', ') || '<aucune>'}.`,
      };
    }
    return {
      ok: true,
      data: {
        appId: app.id,
        sectionId: match,
        instruction: 'open_app_section',
        note: 'Côté client : émettre coach-os:open-app-section avec appId/sectionId. Côté serveur : instruction à passer au client.',
      },
    };
  },
});

export const appTools = [appList, appOpen, sectionGoto];
