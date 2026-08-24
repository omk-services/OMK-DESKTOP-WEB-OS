// src/lib/tooling/adapters/a2p.ts
// Agent to Payment — SURFACE SOUS VETO.
//
// CE FICHIER NE PAIE RIEN, ET C'EST SON OBJET
//
// Il existe pour que l'intention de paiement soit ROUTABLE et TRACABLE, jamais
// pour qu'elle soit autorisable par une machine. Un agent qui engage de la
// valeur sans mandat humain signe est exactement le risque que la doctrine
// Aquaman couvre par son veto categoriel : engagement sans perimetre ecrit.
//
// La fonction `executer` est absente par conception. Ce n'est pas un manque a
// combler : l'ajouter reintroduirait le risque que l'architecture ecarte.
//
// Le paiement reste un geste de l'humain. Le runtime prepare, journalise et
// presente ; il n'appuie pas.

/** Une intention de paiement, jamais une transaction. */
export interface IntentionPaiement {
  id: string;
  domaine: string;
  montant_centimes: number;
  devise: string;
  beneficiaire: string;
  motif: string;
  /** Segment client nomme. Une depense sans segment est signalee. */
  segment_id: string | null;
  /** Reference du mandat humain. Sans elle, l'intention reste bloquee. */
  mandat_ref: string | null;
}

export type EtatIntention = 'BLOQUEE_SANS_MANDAT' | 'BLOQUEE_SANS_SEGMENT' | 'PRETE_POUR_SIGNATURE';

export interface VerdictPaiement {
  intention: string;
  etat: EtatIntention;
  motif: string;
  /** Toujours faux. Aucun chemin de ce module ne le met a vrai. */
  executable_par_agent: false;
  presente_a: string;
}

/**
 * Evalue une intention. Regle deterministe, deux blocages avant la signature.
 *
 * Le controle de segment vient de la mesure CEO-Bench : les agents performants
 * dirigent 90 % de leurs depenses vers des segments nommes, contre 43 % pour
 * les faibles. Une depense sans segment n'est pas interdite — elle est rendue
 * visible avant d'etre signee.
 */
export function evaluerIntention(i: IntentionPaiement): VerdictPaiement {
  let etat: EtatIntention;
  let motif: string;

  if (!i.mandat_ref) {
    etat = 'BLOQUEE_SANS_MANDAT';
    motif = 'aucun mandat humain signe : veto categoriel, non negociable';
  } else if (!i.segment_id) {
    etat = 'BLOQUEE_SANS_SEGMENT';
    motif = 'depense sans segment client nomme : a nommer avant signature';
  } else {
    etat = 'PRETE_POUR_SIGNATURE';
    motif = `mandat ${i.mandat_ref}, segment ${i.segment_id} : reste a signer par l humain`;
  }

  return {
    intention: i.id,
    etat,
    motif,
    executable_par_agent: false,
    presente_a: 'humain',
  };
}

/** Journalise l'intention pour le portique Finance. Ne declenche rien. */
export function preparerPourPortique(i: IntentionPaiement): Record<string, unknown> {
  const v = evaluerIntention(i);
  return {
    ...v,
    domaine: i.domaine,
    montant: `${(i.montant_centimes / 100).toFixed(2)} ${i.devise}`,
    beneficiaire: i.beneficiaire,
    portique: '06_Finance_et_ROI_WonderWoman_Thunderbolts',
    veto: 'toute depense recurrente sans date de revue et sans metrique de retour',
  };
}
