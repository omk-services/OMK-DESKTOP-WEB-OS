import { Database, GitBranch, HardDrive, MessageSquare, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ConnectorState = 'connecte' | 'disponible' | 'indisponible';
export type MemoryStatus = 'confirme' | 'contredit' | 'a verifier';
export type MemberRole = 'viewer' | 'analyst' | 'operator' | 'admin' | 'owner';

export interface ConnectorSeed {
  id: string;
  name: string;
  state: ConnectorState;
  description: string;
  access: string;
  icon: LucideIcon;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: string;
  state: 'depose' | 'extrait' | 'decoupe' | 'vectorise' | 'interrogeable';
  chunks: number;
  updated: string;
  excerpt: string;
  answer: string;
  source: string;
}

export interface MemoryRecord {
  id: string;
  fact: string;
  provenance: string;
  date: string;
  status: MemoryStatus;
  weight: 'fort' | 'moyen' | 'faible';
  scope: 'ruche' | 'agent';
  agent?: string;
}

export interface MemberRecord {
  id: string;
  name: string;
  initials: string;
  role: MemberRole;
  opens: string;
  activity: string;
  actor: string;
}

export const CONNECTORS: ConnectorSeed[] = [
  { id: 'gateway', name: 'MCP Gateway', state: 'connecte', description: 'Passerelle unique des outils MCP de Coach OS.', access: 'Routage et outils connectés', icon: Server },
  { id: 'supabase', name: 'Supabase', state: 'connecte', description: 'Données tenant, authentification et stockage.', access: 'Base de données + fichiers', icon: Database },
  { id: 'github', name: 'GitHub', state: 'connecte', description: 'Dépôts, issues et changelogs du produit.', access: 'Code source et historique', icon: GitBranch },
  { id: 'vercel', name: 'Vercel', state: 'disponible', description: 'Déploiements et journaux de production.', access: 'Environnements et déploiements', icon: Server },
  { id: 'google-drive', name: 'Google Drive', state: 'disponible', description: 'Documents partagés du cabinet.', access: 'Import documentaire', icon: HardDrive },
  { id: 'slack', name: 'Slack', state: 'indisponible', description: 'Canal d’équipe non autorisé sur cet espace.', access: 'Aucun accès', icon: MessageSquare },
];

export const DOCUMENTS: KnowledgeDocument[] = [
  { id: 'playbook', title: 'Playbook — première séance', type: 'PDF', state: 'interrogeable', chunks: 42, updated: '06 août 2026', excerpt: 'Cadre de préparation, écoute et clôture de la séance.', answer: 'La première séance suit trois temps : cadrer le résultat, explorer les faits, puis choisir un engagement testable.', source: 'p. 3 · Cadre de séance' },
  { id: 'positioning', title: 'Positionnement du cabinet', type: 'DOCX', state: 'vectorise', chunks: 28, updated: '05 août 2026', excerpt: 'Promesse, clientèle cible et limites de l’accompagnement.', answer: 'Le cabinet aide les équipes dirigeantes à transformer une intention stratégique en pratiques observables.', source: 'p. 1 · Promesse' },
  { id: 'notes-july', title: 'Notes de supervision — juillet', type: 'MD', state: 'decoupe', chunks: 19, updated: '31 juillet 2026', excerpt: 'Retours de supervision à préparer avant vectorisation.', answer: 'Document encore en préparation : l’indexation sera disponible après la vectorisation.', source: 'section 2 · Supervision' },
  { id: 'intake', title: 'Questionnaire d’entrée client', type: 'PDF', state: 'extrait', chunks: 0, updated: '30 juillet 2026', excerpt: 'Texte extrait, découpages à vérifier.', answer: 'Document non interrogeable tant que les segments ne sont pas validés.', source: '—' },
];

export const MEMORIES: MemoryRecord[] = [
  { id: 'm-01', fact: 'Le cabinet privilégie un engagement observable avant toute recommandation.', provenance: 'Playbook première séance · p. 3', date: '06 août 2026', status: 'confirme', weight: 'fort', scope: 'ruche' },
  { id: 'm-02', fact: 'Camille préfère recevoir les synthèses le vendredi matin.', provenance: 'Compte rendu · session Camille · 18 juillet', date: '18 juillet 2026', status: 'confirme', weight: 'moyen', scope: 'agent', agent: 'Coach principal' },
  { id: 'm-03', fact: 'Le programme dure toujours six semaines.', provenance: 'Note importée sans source primaire', date: '11 juin 2026', status: 'contredit', weight: 'faible', scope: 'ruche' },
  { id: 'm-04', fact: 'Le client souhaite mesurer la qualité des décisions, pas le volume de réunions.', provenance: 'Entretien de cadrage · 04 août', date: '04 août 2026', status: 'a verifier', weight: 'moyen', scope: 'agent', agent: 'Coach principal' },
  { id: 'm-05', fact: 'Les agents partagent la mémoire vérifiée, jamais les brouillons bruts.', provenance: 'Politique de mémoire du workspace', date: '01 août 2026', status: 'confirme', weight: 'fort', scope: 'ruche' },
];

export const MEMBERS: MemberRecord[] = [
  { id: 'member-01', name: 'Amadeus', initials: 'AM', role: 'owner', opens: 'Tout l’espace, y compris la facturation', activity: 'Il y a 8 min', actor: 'Amadeus' },
  { id: 'member-02', name: 'Nora Benali', initials: 'NB', role: 'admin', opens: 'Membres, configuration et données', activity: 'Il y a 42 min', actor: 'Nora Benali' },
  { id: 'member-03', name: 'Marc Duval', initials: 'MD', role: 'operator', opens: 'Sessions, clients et documents', activity: 'Hier à 17:24', actor: 'Marc Duval' },
  { id: 'member-04', name: 'Lina Perez', initials: 'LP', role: 'analyst', opens: 'Lecture + analyses', activity: 'Hier à 14:09', actor: 'Lina Perez' },
  { id: 'member-05', name: 'Cabinet invité', initials: 'CI', role: 'viewer', opens: 'Vues partagées uniquement', activity: '04 août 2026', actor: 'Lina Perez' },
];

export const ROLE_ORDER: MemberRole[] = ['viewer', 'analyst', 'operator', 'admin', 'owner'];
