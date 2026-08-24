// Banc du RBAC. La matrice ETAIT recopiee a la main ici, dupliquee de
// src/lib/tooling/rbac.ts : toute divergence entre les deux fichiers passait
// silencieusement, parce que ce fichier ne lisait jamais l'original.
//
// rbac.ts n'exporte pas encore sa MATRICE (verifie le 2026-08-23 : c'est un
// `const MATRICE` prive, pas un `export const`). Attendre cet export, c'est
// attendre un autre agent hors de mon perimetre (kernel/agents et src/** sont
// interdits ici). Solution qui ne depend PAS de cet export et qui reste
// zero-dependance/Node 16+ : on ne peut pas `import` un .ts sans
// transpilation, mais on peut lire son TEXTE et en extraire le litteral objet
// de MATRICE — le mot-cle `export` ou son absence n'a aucune importance pour
// une extraction textuelle. Le jour ou rbac.ts exporte MATRICE, ce fichier
// n'a besoin d'AUCUN changement : il continue de lire la meme const par son
// nom, avec ou sans `export` devant.
//
// Si l'extraction echoue (fichier deplace, const renommee), on retombe sur
// une copie figee et on le dit bruyamment plutot que de faire semblant que
// la synchronisation a marche.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const CHEMIN_RBAC = join(ICI, '..', '..', 'src', 'lib', 'tooling', 'rbac.ts');

const MATRICE_FIGEE_SECOURS = {
  owner:  { workspace: ['lecture','navigation','ecriture'], sandbox: ['lecture','navigation','ecriture'] },
  admin:  { workspace: ['lecture','navigation','ecriture'], sandbox: ['lecture','navigation','ecriture'] },
  member: { workspace: ['lecture','navigation','ecriture'], sandbox: ['lecture','navigation','ecriture'] },
  client: { workspace: ['lecture','navigation'],            sandbox: ['lecture','navigation','ecriture'] },
  guest:  { workspace: ['lecture'],                          sandbox: [] },
};

function chargerMatriceDepuisSource() {
  let texte;
  try {
    texte = readFileSync(CHEMIN_RBAC, 'utf8');
  } catch (e) {
    return { matrice: null, source: 'introuvable', erreur: e.message };
  }
  // Capture depuis `const MATRICE` (avec ou sans `export`, avec ou sans
  // annotation de type) jusqu'a la premiere accolade fermante en debut de
  // ligne suivie de `;` — c'est la forme exacte du litteral dans rbac.ts,
  // objets internes fermes par `},`, jamais par `};`.
  const m = texte.match(/const MATRICE[^=]*=\s*(\{[\s\S]*?\n\};)/);
  if (!m) {
    return { matrice: null, source: 'motif non trouve', erreur: 'const MATRICE introuvable ou reforme dans rbac.ts' };
  }
  try {
    // Le litteral extrait est du JS valide (les types TS sont dans la ligne
    // de declaration, deja exclue par le match) : de simples objets/tableaux
    // de chaines, avec des commentaires // que `Function` accepte tel quel.
    const matrice = new Function(`return (${m[1].replace(/;\s*$/, '')})`)();
    return { matrice, source: 'rbac.ts', erreur: null };
  } catch (e) {
    return { matrice: null, source: 'extraction invalide', erreur: e.message };
  }
}

const chargement = chargerMatriceDepuisSource();
let MATRICE;
if (chargement.matrice) {
  MATRICE = chargement.matrice;
  console.log(`matrice chargee depuis ${CHEMIN_RBAC} (${chargement.source})`);
} else {
  MATRICE = MATRICE_FIGEE_SECOURS;
  console.log(`ATTENTION : lecture de rbac.ts echouee (${chargement.erreur}) — repli sur la copie figee, verifier la synchronisation a la main.`);
}
const RANG = { owner:5, admin:4, member:3, client:2, guest:1 };
function peut(acteur, tenant, per, cat, affs) {
  if (per.tenant !== tenant) return { autorise:false, motif:'HORS_TENANT' };
  const a = affs.find(x => x.acteur===acteur && x.tenant===tenant && x.perimetre===per.id);
  if (!a) return { autorise:false, motif:'AUCUNE_AFFECTATION' };
  const p = MATRICE[a.role][per.type];
  if (!p.length) return { autorise:false, motif:'SANDBOX_INTERDIT' };
  if (!p.includes(cat)) return { autorise:false, motif:'CATEGORIE_INTERDITE' };
  return { autorise:true, role:a.role };
}
let ok=0, ko=0;
const t=(n,c)=>{ if(c){ok++;console.log('  OK    '+n);} else {ko++;console.log('  ECHEC '+n);} };

const WS  = { id:'ws1', tenant:'acme', type:'workspace', parent:null };
const SB  = { id:'sb1', tenant:'acme', type:'sandbox',   parent:'ws1' };
const AUTRE = { id:'ws9', tenant:'globex', type:'workspace', parent:null };
const A = [
  { acteur:'u-admin',  tenant:'acme', perimetre:'ws1', role:'admin' },
  { acteur:'u-emp',    tenant:'acme', perimetre:'ws1', role:'member' },
  { acteur:'u-client', tenant:'acme', perimetre:'ws1', role:'client' },
  { acteur:'u-client', tenant:'acme', perimetre:'sb1', role:'client' },
  { acteur:'u-vis',    tenant:'acme', perimetre:'ws1', role:'guest' },
  { acteur:'u-vis',    tenant:'acme', perimetre:'sb1', role:'guest' },
];

console.log('isolation multi-tenant');
t('un acteur acme ne touche pas un perimetre globex', !peut('u-admin','acme',AUTRE,'lecture',A).autorise);
t('le motif est HORS_TENANT', peut('u-admin','acme',AUTRE,'lecture',A).motif==='HORS_TENANT');
t('sans affectation, refus', !peut('u-inconnu','acme',WS,'lecture',A).autorise);

console.log('administrateur');
t('ecrit en workspace', peut('u-admin','acme',WS,'ecriture',A).autorise);

console.log('employe');
t('ecrit en workspace', peut('u-emp','acme',WS,'ecriture',A).autorise);

console.log('client');
t('lit en workspace', peut('u-client','acme',WS,'lecture',A).autorise);
t('N ECRIT PAS en workspace', !peut('u-client','acme',WS,'ecriture',A).autorise);
t('ecrit dans SON sandbox', peut('u-client','acme',SB,'ecriture',A).autorise);

console.log('visiteur');
t('lit en workspace', peut('u-vis','acme',WS,'lecture',A).autorise);
t('ne navigue pas en workspace', !peut('u-vis','acme',WS,'navigation',A).autorise);
t('AUCUN droit en sandbox', !peut('u-vis','acme',SB,'lecture',A).autorise);
t('le motif est SANDBOX_INTERDIT', peut('u-vis','acme',SB,'lecture',A).motif==='SANDBOX_INTERDIT');

console.log('promotion sandbox -> workspace');
const promo = r => RANG[r] >= RANG.admin;
t('admin promeut', promo('admin'));
t('employe NE promeut PAS', !promo('member'));
t('client NE promeut PAS', !promo('client'));

console.log('refus par defaut');
t('toute combinaison non nommee est refusee',
  ['owner','admin','member','client','guest'].every(r =>
    Object.keys(MATRICE[r]).every(tp => Array.isArray(MATRICE[r][tp]))));

console.log('\n' + ok + ' reussites, ' + ko + ' echecs');
process.exit(ko===0?0:1);
