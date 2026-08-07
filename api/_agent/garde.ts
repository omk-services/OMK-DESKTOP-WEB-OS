// api/_agent/garde.ts
// Portier des routes d'agent.
//
// Le pentest a mesure 133 appels par minute sur /api/chat, sans cle, sans
// session, sans plafond — et chaque appel est paye par la cle MiniMax du
// proprietaire. Sur un deploiement public, c'est une facture ouverte a
// n'importe qui.
//
// La regle est donc : **ferme par defaut en production, ouvert en local**.
//
//   - `AGENT_API_TOKEN` pose  → il faut le presenter, partout.
//   - `AGENT_API_TOKEN` absent → refus en production, passage en developpement.
//
// Ce sens-la et pas l'autre : oublier de poser le jeton doit couper le service,
// jamais l'ouvrir. Une securite qui echoue en s'ouvrant n'est pas une securite.
// Et le developpement local reste sans friction, pour ne pas pousser a la
// desactiver « juste le temps de tester ».

/** Taille maximale du corps accepte.
 *
 *  Sans plafond, un POST de 3 Mo de texte part au modele et se paie. Mesure
 *  pendant l'audit : 5 Mo de remplissage font passer le serveur de dev de
 *  212 a 246 Mo pour une seule requete. */
export const TAILLE_MAX_CORPS = 256 * 1024

export interface Refus {
  status: number
  message: string
}

function enProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

/** Rend `null` si la requete passe, ou le refus a renvoyer. */
export function verifierAcces(request: Request): Refus | null {
  const attendu = process.env.AGENT_API_TOKEN

  if (!attendu) {
    if (enProduction()) {
      // Volontairement muet sur la cause : dire « il manque AGENT_API_TOKEN »
      // renseignerait l'appelant sur la configuration.
      return { status: 503, message: 'Service indisponible.' }
    }
    return null
  }

  const entete = request.headers.get('authorization') ?? ''
  const presente = entete.startsWith('Bearer ') ? entete.slice(7).trim() : ''
  if (presente.length !== attendu.length || presente !== attendu) {
    return { status: 401, message: 'Authentification requise.' }
  }
  return null
}

/** Refuse un corps trop gros avant meme de le lire.
 *
 *  `Content-Length` peut mentir ou manquer — c'est un premier filtre, pas une
 *  garantie. Le second filtre est la taille reelle apres lecture. */
export function verifierTaille(request: Request): Refus | null {
  const brut = request.headers.get('content-length')
  if (!brut) return null
  const taille = Number(brut)
  if (Number.isFinite(taille) && taille > TAILLE_MAX_CORPS) {
    return { status: 413, message: 'Corps de requete trop volumineux.' }
  }
  return null
}

/** Nombre maximal de messages dans un echange.
 *
 *  Chaque message est reinjecte en entree a chaque tour : mille messages
 *  triviaux passent aujourd'hui sans qu'aucun plafond ne s'y oppose. */
export const MAX_MESSAGES = 100
