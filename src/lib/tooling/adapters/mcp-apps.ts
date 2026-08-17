/** Adaptateur MCP Apps — la septieme surface.
 *
 *  Les six premieres (in-app, CLI, MCP, MCP-schema, REST, Skill) exposent un
 *  outil comme une FONCTION : on l'appelle, il rend du texte. MCP Apps l'expose
 *  comme une INTERFACE : l'hote rend une page HTML interactive dans la
 *  conversation elle-meme.
 *
 *  Spec : https://modelcontextprotocol.io/extensions/apps/overview
 *
 *  LE MECANISME, EN TROIS TEMPS
 *
 *  1. L'outil declare `_meta.ui.resourceUri` pointant vers une ressource
 *     `ui://`. L'hote peut la precharger avant meme l'appel.
 *  2. L'hote lit la ressource : une page HTML autonome, JS et CSS compris.
 *  3. L'hote la rend dans une **iframe bac a sable**. L'app ne peut pas
 *     toucher au DOM parent, lire les cookies de l'hote, ni naviguer la page.
 *     Tout passe par `postMessage`.
 *
 *  L'app dialogue en JSON-RPC : `ui/initialize` a l'ouverture, puis elle peut
 *  appeler `tools/call` — les memes outils du registre, par le canal sécurisé.
 *
 *  POURQUOI C'EST LA BONNE SURFACE POUR L'APPROBATION
 *
 *  `ARCHITECTURE_V1` §rang 1 exige une file d'approbation humaine avant tout
 *  effet de bord externe, et `WORKFLOWS_ACQUISITION_V1` place deux arrets :
 *  la porte de la depense, la porte du contact. Une file d'approbation rendue
 *  en TEXTE oblige l'humain a recopier un identifiant pour approuver. Rendue
 *  en INTERFACE, elle se lit et se tranche au meme endroit que la conversation
 *  qui l'a produite.
 *
 *  C'est exactement le cas d'usage « multi-step workflows » que la spec cite :
 *  examiner des elements un par un, avec des boutons d'action et un etat qui
 *  persiste entre les interactions.
 *
 *  CE QUE CE MODULE NE FAIT PAS
 *
 *  Il ne rend aucun verdict et n'applique aucun scenario. Une app qui pourrait
 *  approuver seule serait une porte qui s'ouvre toute seule. Elle affiche, et
 *  elle demande — l'hote route l'appel vers l'outil, qui garde ses gardes.
 */

import type { ToolDefinition } from '../types';
import { list } from '../registry';
// Note : mcp-apps ne construit pas de ToolContext directement. La
// résolution d'identité (../identity) est appliquée par mcp.ts au
// moment où la page bac à sable appelle tools/call via window.pont.
// Cette surface hérite donc de la politique MCP — pas la sienne.

/** Ce qu'un outil declare pour obtenir une interface. */
export interface ToolUi {
  /** Identifiant de la ressource, sans le schema. Devient `ui://coach-os/<id>`. */
  id: string;
  /** Titre affiche par l'hote autour de l'iframe. */
  title: string;
  /** La page, autonome : HTML + JS + CSS en un seul document. */
  html: () => string;
  /**
   * Origines externes autorisees. Vide = l'app ne charge RIEN de l'exterieur.
   * On garde vide par defaut : une interface d'approbation qui va chercher un
   * script sur un CDN est une interface dont on ne repond plus.
   */
  csp?: { connectSrc?: string[]; resourceSrc?: string[] };
  /** Capacites demandees a l'hote (micro, camera…). Vide par defaut. */
  permissions?: Record<string, unknown>;
}

const PREFIXE = 'ui://coach-os/';

/** Les outils du registre qui portent une interface. */
export function toolsAvecUi(): ToolDefinition[] {
  return list().filter((t) => Boolean(t.ui));
}

/**
 * Le bloc `_meta` a poser sur la definition d'outil publiee par `tools/list`.
 * Rend `undefined` si l'outil n'a pas d'interface — le champ est alors absent,
 * pas nul : un `_meta` vide ferait croire a un hote qu'une UI existe.
 */
export function metaUi(tool: ToolDefinition): Record<string, unknown> | undefined {
  if (!tool.ui) return undefined;
  const ui: Record<string, unknown> = { resourceUri: PREFIXE + tool.ui.id };
  if (tool.ui.csp) ui.csp = tool.ui.csp;
  if (tool.ui.permissions) ui.permissions = tool.ui.permissions;
  return { ui };
}

/** Les ressources `ui://` a publier dans `resources/list`. */
export function listerRessourcesUi(): Array<{
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}> {
  return toolsAvecUi().map((t) => ({
    uri: PREFIXE + t.ui!.id,
    name: t.ui!.title,
    mimeType: 'text/html+skybridge',
    description: `Interface de l'outil ${t.name}.`,
  }));
}

/**
 * Le contenu d'une ressource `ui://`, ou null si l'URI est inconnue.
 *
 * On rend `null` plutot que de lever : l'hote doit pouvoir demander une URI
 * qu'il a en cache apres un redemarrage du serveur sans faire tomber la
 * session. Le null se traduit en erreur JSON-RPC propre cote appelant.
 */
export function lireRessourceUi(uri: string): { uri: string; mimeType: string; text: string } | null {
  if (!uri.startsWith(PREFIXE)) return null;
  const id = uri.slice(PREFIXE.length);
  const tool = toolsAvecUi().find((t) => t.ui!.id === id);
  if (!tool) return null;
  return { uri, mimeType: 'text/html+skybridge', text: tool.ui!.html() };
}

/**
 * Le pont JSON-RPC minimal, injecte dans chaque page.
 *
 * La spec dit que la classe `App` de `@modelcontextprotocol/ext-apps` est une
 * commodite, pas une obligation : le protocole est du `postMessage` standard.
 * On implemente donc les quatre messages dont on a besoin, sans dependance —
 * une interface d'approbation qui tire un paquet npm est une surface d'attaque
 * de plus sur le chemin le plus sensible du produit.
 */
export function pontJsonRpc(): string {
  return `
<script>
(function () {
  let n = 0;
  const attente = new Map();
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.jsonrpc !== '2.0') return;
    if (m.id != null && attente.has(m.id)) {
      const { ok, ko } = attente.get(m.id);
      attente.delete(m.id);
      m.error ? ko(new Error(m.error.message || 'erreur hote')) : ok(m.result);
    }
    if (m.method === 'ui/notify' && window.surNotification) window.surNotification(m.params);
  });
  function envoyer(method, params) {
    const id = ++n;
    // On poste vers le parent : l'iframe est en bac a sable, c'est le seul canal.
    parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
    return new Promise((ok, ko) => {
      attente.set(id, { ok, ko });
      // Sans delai, une app dont l'hote ne repond jamais reste figee et
      // l'utilisateur croit que le bouton est casse.
      setTimeout(() => {
        if (attente.has(id)) { attente.delete(id); ko(new Error('hote muet apres 20 s')); }
      }, 20000);
    });
  }
  window.pont = {
    initialiser: () => envoyer('ui/initialize', { protocolVersion: '2025-06-18' }),
    appelerOutil: (name, args) => envoyer('tools/call', { name, arguments: args || {} }),
    dire: (text) => envoyer('ui/sendMessage', { text }),
  };
})();
</script>`.trim();
}
