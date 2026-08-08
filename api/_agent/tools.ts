// api/_agent/tools.ts
// Declaration des cinq outils de la V1, noms figes par CONTRAT.md.
//
// Strategie : outils declares cote serveur, executes cote client.
// Le SDK interprete un outil sans `execute` comme un appel que le client
// doit renvoyer via le tour de boucle de useChat. C'est exactement le
// comportement desire ici : l'agent agit sur le bureau (ouvrir une app,
// changer de section), pas sur un serveur distant.
//
// Les noms et signatures ci-dessous sont le contrat avec AGENT-B. Tout
// changement ici doit etre negocie avec lui.

import { tool } from 'ai'
import { z } from 'zod'

export const listerApps = tool({
  description:
    'Renvoie la liste des applications installees sur le bureau, avec leurs sections. ' +
    "Appeler au demarrage d'une conversation pour decouvrir ce qui est disponible.",
  inputSchema: z.object({}),
})

export const ouvrirApp = tool({
  description:
    "Ouvre la fenetre de l'application indiquee. Si l'app est deja ouverte, " +
    "la met au premier plan. Ne change pas de section.",
  inputSchema: z.object({
    appId: z
      .string()
      .describe("Identifiant canonique de l'application (kebab-case)."),
  }),
})

export const allerASection = tool({
  description:
    "Ouvre l'application et navigue jusqu'a la section indiquee. A utiliser " +
    'chaque fois que la demande vise un ecran precis plutot qu une app entiere.',
  inputSchema: z.object({
    appId: z
      .string()
      .describe("Identifiant canonique de l'application (kebab-case)."),
    sectionId: z
      .string()
      .describe("Identifiant canonique de la section dans l'application."),
  }),
})

export const lireCollection = tool({
  description:
    'Renvoie les items d une collection du CMS identifiee par son id. ' +
    'A utiliser pour lire une liste de clients, de procedures, de documents.',
  inputSchema: z.object({
    collectionId: z
      .string()
      .describe('Identifiant canonique de la collection dans le CMS.'),
  }),
})

export const changerTheme = tool({
  description:
    "PROPOSE un changement de theme (global, ou d'une seule application si " +
    "appId est precise). Ne touche PAS au theme reel : depose une proposition " +
    "dans le scenario courant. L'approbateur verra la proposition dans la " +
    "file d'approbation (People > Approvals) et tranchera. Le themeId doit " +
    'etre un theme connu (par exemple "nuit", "aurore", "default").',
  inputSchema: z.object({
    themeId: z.string().describe('Identifiant du theme a proposer.'),
    appId: z
      .string()
      .optional()
      .describe(
        "Optionnel. Si precise, propose un changement de theme pour cette " +
          'application seule.',
      ),
  }),
})

export const tools = {
  listerApps,
  ouvrirApp,
  allerASection,
  lireCollection,
  changerTheme,
}