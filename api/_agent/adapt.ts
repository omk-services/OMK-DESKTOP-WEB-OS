// api/_agent/adapt.ts
// Traduit un gestionnaire de forme Web vers la forme Node attendue par Vercel.
//
// LE DEFAUT QU'IL CORRIGE. Les quatre routes pendaient en production : aucun
// en-tete apres 90 s, alors qu'une route inexistante rend 404 immediatement.
// La route etait donc reconnue, la fonction demarrait, et ne rendait jamais la
// main.
//
// La cause : nos gestionnaires sont ecrits en forme Web — `(request: Request)`
// qui rend une `Response`. Le runtime Node de Vercel les invoque en
// `(req, res)`. Le premier argument n'est alors pas une `Request`, la valeur
// rendue n'est jamais lue, et surtout **personne n'appelle `res.end()`** : la
// requete reste ouverte jusqu'a expiration.
//
// On garde donc les gestionnaires en forme Web — c'est la forme standard, la
// plus testable, et celle qui marche telle quelle sur le serveur de dev — et on
// les enveloppe ici.

import type { IncomingMessage, ServerResponse } from 'node:http'

type GestionnaireWeb = (request: Request) => Response | Promise<Response>

/** Reconstitue le corps de la requete. `IncomingMessage` est un flux : sans
 *  cette lecture, `request.json()` cote gestionnaire ne verrait rien. */
function lireCorps(req: IncomingMessage): Promise<Buffer | undefined> {
  const sansCorps = req.method === 'GET' || req.method === 'HEAD'
  if (sansCorps) return Promise.resolve(undefined)
  return new Promise((resolve, reject) => {
    const morceaux: Buffer[] = []
    req.on('data', (c: Buffer) => morceaux.push(c))
    req.on('end', () => resolve(Buffer.concat(morceaux)))
    req.on('error', reject)
  })
}

export function versNode(gestionnaire: GestionnaireWeb) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const hote = req.headers.host ?? 'localhost'
      // Le protocole vient de l'en-tete pose par le proxy ; en local il manque.
      const schema = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
      const corps = await lireCorps(req)

      const entetes = new Headers()
      for (const [cle, valeur] of Object.entries(req.headers)) {
        if (valeur === undefined) continue
        entetes.set(cle, Array.isArray(valeur) ? valeur.join(', ') : valeur)
      }

      const requete = new Request(`${schema}://${hote}${req.url ?? '/'}`, {
        method: req.method ?? 'GET',
        headers: entetes,
        body: corps && corps.length > 0 ? corps : undefined,
      })

      const reponse = await gestionnaire(requete)

      const sortie: Record<string, string> = {}
      reponse.headers.forEach((v, k) => { sortie[k] = v })
      res.writeHead(reponse.status, sortie)

      if (!reponse.body) {
        res.end()
        return
      }

      // Le corps est un flux : on l'ecoule morceau par morceau. C'est ce qui
      // fait que /api/chat diffuse au fil de l'eau au lieu d'attendre la fin.
      const lecteur = reponse.body.getReader()
      for (;;) {
        const { done, value } = await lecteur.read()
        if (done) break
        res.write(Buffer.from(value))
      }
      res.end()
    } catch (err) {
      // Une erreur ici laisserait la requete ouverte — exactement le defaut
      // qu'on corrige. On repond, meme mal.
      const message = err instanceof Error ? err.message : String(err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ error: `Erreur interne : ${message}` }))
    }
  }
}
