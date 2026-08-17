/** L'interface de la file d'approbation, servie comme ressource `ui://`.
 *
 *  POURQUOI CETTE PAGE EXISTE
 *
 *  `ARCHITECTURE_V1` §rang 1 exige une file d'approbation avant tout effet de
 *  bord externe. `WORKFLOWS_ACQUISITION_V1` y place deux arrets : la porte de
 *  la depense, la porte du contact.
 *
 *  Rendue en texte, cette file oblige l'humain a recopier un identifiant pour
 *  approuver. Un identifiant qu'on recopie est un identifiant qu'on ne lit pas.
 *  Rendue en interface, la proposition se lit et se tranche au meme endroit que
 *  la conversation qui l'a produite — c'est le « context preservation » que la
 *  spec MCP Apps donne comme premier argument.
 *
 *  CE QU'ELLE NE FAIT PAS
 *
 *  Elle n'approuve rien elle-meme. Elle appelle `scenario.approve`, qui garde
 *  ses propres gardes cote serveur. Une page en bac a sable qui pourrait
 *  appliquer un scenario serait une porte qui s'ouvre toute seule.
 *
 *  Aucune ressource externe : pas de police web, pas de CDN, pas d'icone
 *  distante. La page tient dans son document. Sur le chemin le plus sensible du
 *  produit, chaque origine autorisee est une origine a surveiller.
 */

import { pontJsonRpc } from '../adapters/mcp-apps';

export function htmlApprobations(): string {
  return `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>File d'approbation</title>
<style>
  :root {
    color-scheme: light dark;
    --encre: #0a0a0a; --papier: #fafaf7; --trait: #d4d4d4;
    --accent: #ff5b1f; --sourdine: #6b6b6b; --ok: #0f766e;
  }
  @media (prefers-color-scheme: dark) {
    :root { --encre: #fafaf7; --papier: #141414; --trait: #333; --sourdine: #9a9a9a; }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 16px; background: var(--papier); color: var(--encre);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
  }
  h1 { font-size: 15px; margin: 0 0 4px; letter-spacing: -0.01em; }
  .sous { color: var(--sourdine); font-size: 12px; margin-bottom: 14px; }
  .carte {
    border: 1px solid var(--trait); border-radius: 12px;
    padding: 12px 14px; margin-bottom: 10px; background: transparent;
  }
  .titre { font-weight: 600; margin-bottom: 2px; }
  .meta { color: var(--sourdine); font-size: 12px; font-variant-numeric: tabular-nums; }
  .motif { margin: 8px 0 10px; font-size: 13px; }
  .actions { display: flex; gap: 8px; }
  button {
    font: inherit; font-weight: 500; padding: 6px 14px; border-radius: 9999px;
    border: 1px solid var(--trait); background: transparent; color: var(--encre);
    cursor: pointer;
  }
  button.oui { background: var(--encre); color: var(--papier); border-color: var(--encre); }
  button:disabled { opacity: .45; cursor: default; }
  .vide, .err { color: var(--sourdine); padding: 18px 0; }
  .err { color: var(--accent); }
  .fait { color: var(--ok); font-size: 12px; }
</style>
${pontJsonRpc()}
<body>
  <h1>File d'approbation</h1>
  <div class="sous" id="sous">Chargement…</div>
  <div id="liste"></div>

<script>
(async function () {
  const liste = document.getElementById('liste');
  const sous = document.getElementById('sous');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  try { await window.pont.initialiser(); } catch (e) { /* hote sans ui/initialize : on continue */ }

  async function charger() {
    try {
      const r = await window.pont.appelerOutil('scenario.list', {});
      // L'hote rend le resultat MCP : content[0].text porte le JSON de l'outil.
      const brut = r && r.content && r.content[0] ? r.content[0].text : '{}';
      const res = JSON.parse(brut);
      if (!res.ok) throw new Error(res.error || 'scenario.list a echoue');
      rendre(res.data && res.data.proposals ? res.data.proposals : []);
    } catch (e) {
      sous.textContent = '';
      liste.innerHTML = '<div class="err">' + esc(e.message) + '</div>';
    }
  }

  function rendre(props) {
    sous.textContent = props.length === 0
      ? 'Rien en attente.'
      : props.length + (props.length > 1 ? ' propositions en attente' : ' proposition en attente');
    if (props.length === 0) { liste.innerHTML = '<div class="vide">Aucune proposition.</div>'; return; }
    // "data-id" porte le proposalId : c'est ce qu'attendent scenario.approve
    // et scenario.reject. Une premiere version passait scenarioId — les deux
    // existent sur la proposition, et se tromper rendait
    // « Proposition introuvable ».
    //
    // Aucun backtick dans les commentaires de ce bloc : ils vivent a
    // l'interieur du template literal de htmlApprobations() et le fermeraient.
    // Le build a echoue exactement comme ca la premiere fois.
    liste.innerHTML = props.map((p) =>
      '<div class="carte" data-id="' + esc(p.id) + '">' +
        '<div class="titre">' + esc(p.displayName || p.toolName) + '</div>' +
        '<div class="meta">' + esc(p.toolName) + ' · ' + esc(p.id) + '</div>' +
        (p.rationale ? '<div class="motif">' + esc(p.rationale) + '</div>' : '<div class="motif"></div>') +
        '<div class="actions">' +
          '<button class="oui" data-act="approve">Approuver</button>' +
          '<button data-act="reject">Rejeter</button>' +
        '</div>' +
      '</div>').join('');
  }

  liste.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const carte = b.closest('.carte'); const id = carte.getAttribute('data-id');
    const act = b.getAttribute('data-act');
    carte.querySelectorAll('button').forEach((x) => (x.disabled = true));
    const outil = act === 'approve' ? 'scenario.approve' : 'scenario.reject';
    try {
      const r = await window.pont.appelerOutil(outil, { proposalId: id });
      const res = JSON.parse(r.content[0].text);
      if (!res.ok) throw new Error(res.error || 'refus du serveur');
      // CE QUE CETTE PAGE N'A PAS LE DROIT DE DIRE.
      //
      // scenario.approve N'APPROUVE PAS. Il rend une instruction
      // ("clientCommand") et refuse explicitement d'appliquer a la place de
      // l'humain — c'est ecrit dans catalog/scenario.ts, et c'est le rang 1
      // d'ARCHITECTURE_V1. Une premiere version de cette page affichait
      // « Approuve » : elle aurait annonce un merge qui n'a pas eu lieu.
      //
      // On affiche donc ce qui s'est reellement passe : l'instruction est
      // emise, le geste reste a faire dans le client.
      const verbe = act === 'approve' ? 'Approbation' : 'Rejet';
      carte.querySelector('.actions').innerHTML =
        '<span class="fait">' + verbe + ' demande — a confirmer dans le client</span>';
      // On previent le modele : sans ca, la conversation ignore ce qui vient
      // d'etre demande dans l'interface et raisonne sur un etat perime.
      window.pont.dire(verbe + ' demande pour la proposition ' + id +
        '. Le serveur a rendu une instruction ; l\\'application reste un geste humain dans le client.');
    } catch (err) {
      carte.querySelector('.actions').innerHTML = '<span class="err">' + esc(err.message) + '</span>';
    }
  });

  charger();
})();
</script>
</html>`;
}
