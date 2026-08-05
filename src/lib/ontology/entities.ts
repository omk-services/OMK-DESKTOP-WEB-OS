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

/**
 * Portee d'un attribut.
 * - 'org' (defaut implicite : attribut sans champ `scope`) : partage par tous, socle commun.
 * - 'personal' : note ou observation d'un seul humain (coach, observateur, admin),
 *   en attente de promotion au niveau organisation. Cf. story 3 de l'epic
 *   couche-ontologie pour le rationale des 5 entites marquees.
 */
export type AttributeScope = 'org' | 'personal';

export interface EntityAttribute {
  name: string;
  type: AttributeType;
  required: boolean;
  /** cible obligatoire quand type === 'ref' ; la cle est l'identifiant d'une entite du registre. */
  ref?: EntityId;
  /**
   * Portee de l'attribut. Champ optionnel : l'absence equivaut a `scope === 'org'`.
   * Ne s'applique pas aux attributs `ref` : un lien organisation par construction.
   */
  scope?: AttributeScope;
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
      // Personnel : notes de posture, pensees biaisees conscientes, hypotheses
      // sur son propre style. Le coach tient ces notes pour lui-meme avant
      // qu'elles ne meritent (ou non) d'etre promeues au niveau org.
      { name: 'selfNotes', type: 'string', required: false, scope: 'personal' },
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
      // Personnel : intuitions, hypotheses de blocage, signaux faibles, notes
      // de carto relationnelle. Avant qu'un echange ne devienne un fait
      // partage, le coach tient ces hypotheses pour lui-meme.
      { name: 'coachHypothesis', type: 'string', required: false, scope: 'personal' },
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
      // Personnel : prompts prives, derives, tentatives avortees. Ces notes
      // n'ont rien a faire dans la fiche partagee d'un agent — c'est le
      // journal de bord du coach qui l'entraine.
      { name: 'privatePromptNotes', type: 'string', required: false, scope: 'personal' },
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
      // Personnel : avant qu'une routine ne devienne un standard partage,
      // elle peut demarrer comme une habitude personnelle d'un coach
      // (« je relis mes notes tous les lundi »). originNote raconte le
      // pourquoi avant promotion.
      { name: 'originNote', type: 'string', required: false, scope: 'personal' },
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
      // Personnel : un incident peut etre detecte par un coach en avance de
      // phase, avant qu'il ne merite d'etre publie. privateSignal est la
      // trace du soupcon, le coach decide ensuite s'il publie.
      { name: 'privateSignal', type: 'string', required: false, scope: 'personal' },
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
