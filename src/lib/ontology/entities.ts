/**
 * Registre des 12 entites metier de coach-os.
 *
 * Source de verite unique, typee, sans I/O. Fondee sur SPEC.md section
 * "Les 12 entites". La liste est close pour l'epic ; ajouter ou retirer
 * une entite releve d'une decision d'architecture, pas d'une PR.
 *
 * Ce module n'est pas importe directement par les apps — il vit derriere
 * la fermeture d'`index.ts`. Voir `src/lib/ontology/index.ts` pour l'API
 * publique.
 *
 * Patron : `interface XxxDef` + `type XxxFieldType` (cf. src/lib/cms/types.ts).
 */

export type AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'ref';

export interface EntityAttribute {
  name: string;
  type: AttributeType;
  required: boolean;
  /** cible obligatoire quand type === 'ref' ; la cle est l'identifiant d'une entite du registre. */
  ref?: EntityId;
}

export interface EntityDef {
  id: EntityId;
  label: string;
  description: string;
  /** Le tableau est `readonly` : trois apps lisent une seule instance en
   *  memoire, muter `attributes` corromprait le registre partage. */
  attributes: readonly EntityAttribute[];
}

/** Union close des 12 identifiants — verifier dans le test que la liste reste de taille 12. */
export type EntityId =
  | 'Organization'
  | 'Membership'
  | 'Profile'
  | 'Client'
  | 'Offering'
  | 'SOP'
  | 'Runbook'
  | 'Skill'
  | 'Agent'
  | 'Routine'
  | 'Incident'
  | 'Persona';

export const ENTITIES: readonly EntityDef[] = [
  {
    id: 'Organization',
    label: 'Organization',
    description: 'Locataire racine — une societe cliente de coach-os, portee de toutes les autres entites.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'plan', type: 'string', required: true },
      { name: 'createdAt', type: 'date', required: true },
    ],
  },
  {
    id: 'Membership',
    label: 'Membership',
    description: 'Lien entre un Profile et une Organization, avec un role determinant les permissions.',
    attributes: [
      { name: 'role', type: 'string', required: true },
      { name: 'joinedAt', type: 'date', required: true },
      { name: 'profile', type: 'ref', required: true, ref: 'Profile' },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Profile',
    label: 'Profile',
    description: 'Identite d une personne — coach, client, observateur — qui peut appartenir a plusieurs Organizations.',
    attributes: [
      { name: 'displayName', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'createdAt', type: 'date', required: true },
    ],
  },
  {
    id: 'Client',
    label: 'Client',
    description: 'Persona morale ou physique beneficielle d un accompagnement, rattachee a une Organization.',
    attributes: [
      { name: 'fullName', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'startDate', type: 'date', required: true },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Offering',
    label: 'Offering',
    description: 'Prestation cataloguee, facturable, portee par une Organization.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'duration', type: 'string', required: true },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'SOP',
    label: 'SOP',
    description: 'Standard Operating Procedure — procedure de reference, versionnee, reutilisable par les Runbooks.',
    attributes: [
      { name: 'title', type: 'string', required: true },
      { name: 'version', type: 'number', required: true },
      { name: 'updatedAt', type: 'date', required: true },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Runbook',
    label: 'Runbook',
    description: 'Playbook operationnel executant une ou plusieurs SOP, declenche par un Incident ou une Routine.',
    attributes: [
      { name: 'title', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
      { name: 'lastTestedAt', type: 'date', required: false },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Skill',
    label: 'Skill',
    description: 'Competence atomique, evaluable, possedee par un Agent ou un Persona.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'level', type: 'number', required: true },
      { name: 'acquiredAt', type: 'date', required: true },
    ],
  },
  {
    id: 'Agent',
    label: 'Agent',
    description: 'Operateur — humain ou IA — qui execute des Runbooks, des Routines et acquiert des Skills.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'isAi', type: 'boolean', required: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Routine',
    label: 'Routine',
    description: 'Tache recurrente planifiee, executable par un Agent selon une cadence.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'cadence', type: 'string', required: true },
      { name: 'lastRunAt', type: 'date', required: false },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Incident',
    label: 'Incident',
    description: 'Evenement declenche, observable, resolu ou non, rattache a un Agent et potentiellement a un Runbook.',
    attributes: [
      { name: 'title', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
      { name: 'detectedAt', type: 'date', required: true },
      { name: 'resolved', type: 'boolean', required: true },
      { name: 'organization', type: 'ref', required: true, ref: 'Organization' },
    ],
  },
  {
    id: 'Persona',
    label: 'Persona',
    description: 'Profil synthetique — voix, ton, posture — incarne par un Agent dans un contexte Client.',
    attributes: [
      { name: 'name', type: 'string', required: true },
      { name: 'tone', type: 'string', required: true },
      { name: 'createdAt', type: 'date', required: true },
    ],
  },
];
