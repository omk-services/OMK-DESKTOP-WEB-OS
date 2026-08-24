// src/lib/tooling/rbac.ts
// Roles, workspaces, sandbox et politique RLS multi-tenant.
//
// CE QUI EXISTAIT DEJA, ET CE QUE CE FICHIER AJOUTE
//
// `identity.ts` porte deja TENANT_KEY_RE, ROLES et MembershipLookup.
// `permissions.ts` decide si une CATEGORIE d outil est permise a un ROLE.
//
// Ce qui manquait : le role `client`, et surtout le lien entre un acteur et un
// PERIMETRE — workspace ou sandbox. Sans ce lien, un role est global : un
// employe d un tenant voit les outils de tous les workspaces de ce tenant.
// C est exactement le trou qu une politique RLS doit fermer, et il ne se ferme
// pas au niveau du role seul.
//
// Regle qui gouverne tout le fichier : REFUS PAR DEFAUT. Une combinaison non
// nommee est refusee, jamais toleree.

import type { ToolDefinition, ToolContext } from './types';
import { ROLES as ROLES_BASE, type Role as RoleBase } from './identity';

// --- Roles ----------------------------------------------------------------
// `client` s intercale entre `member` et `guest` : il a un perimetre propre
// (son espace de livraison) mais aucune vue sur l interne.
//
// CORRECTION (campagne 2026-08-23, FIX_RBAC) : `client` vit desormais DANS
// `identity.ts::ROLES` (voir le commentaire sur `ROLES` la-bas) — c est ce
// qui le rend enfin atteignable par `resolveIdentity()`. Ce fichier n a
// donc plus besoin de l ajouter lui-meme : `RoleEtendu` est un simple alias
// de `RoleBase`, conserve pour ne casser aucun import existant qui
// reference `RoleEtendu`/`ROLES_ETENDUS` par ce nom.

export const ROLES_ETENDUS = ROLES_BASE;
export type RoleEtendu = RoleBase;

/** Correspondance avec le vocabulaire metier. */
export const LIBELLE_ROLE: Record<RoleEtendu, string> = {
  owner: 'Administrateur (proprietaire)',
  admin: 'Administrateur',
  member: 'Employe',
  client: 'Client',
  guest: 'Visiteur',
};

/** Ordre de privilege. Sert aux comparaisons, jamais a accorder par transitivite. */
const RANG: Record<RoleEtendu, number> = { owner: 5, admin: 4, member: 3, client: 2, guest: 1 };

// --- Perimetres -----------------------------------------------------------

export type TypePerimetre = 'workspace' | 'sandbox';

export interface Perimetre {
  id: string;
  tenant: string;
  type: TypePerimetre;
  /**
   * Un sandbox est jetable et isole : rien de ce qui s y produit ne remonte
   * sans promotion explicite. C est ce qui permet a un client d essayer sans
   * toucher la production.
   */
  parent: string | null;
}

export interface Affectation {
  acteur: string;
  tenant: string;
  perimetre: string;
  role: RoleEtendu;
}

// --- Matrice de permissions ------------------------------------------------
// Trois axes : role x categorie d outil x type de perimetre.
// Une matrice explicite plutot qu une cascade de conditions — une regle qu on
// ne peut pas lire en entier est une regle qu on ne peut pas auditer.

type Categorie = ToolDefinition['category'];

// EXPORTEE (campagne 2026-08-23, FIX_RBAC) : cette matrice etait dupliquee
// a la main dans `_runtime/bridge/rbac-test.mjs` (JS, hors compilation TS).
// Rien ne liait les deux copies — un changement ici pouvait laisser le banc
// JS valider une matrice perimee avec un exit code 0 trompeur (cf.
// `_audit/AUDIT_RBAC.md`, section « La duplication de matrice »). L export
// et `matriceJSON()` ci-dessous rendent une source unique possible ; reste
// a faire cote banc (hors perimetre de ce fichier) : `rbac-test.mjs` doit
// charger cette valeur au lieu de la recopier — soit en import ant le
// module compile, soit via un petit script qui ecrit `matriceJSON()` dans
// un fichier que le banc lit.
export const MATRICE: Record<RoleEtendu, Record<TypePerimetre, Categorie[]>> = {
  owner: { workspace: ['lecture', 'navigation', 'ecriture'], sandbox: ['lecture', 'navigation', 'ecriture'] },
  admin: { workspace: ['lecture', 'navigation', 'ecriture'], sandbox: ['lecture', 'navigation', 'ecriture'] },
  member: { workspace: ['lecture', 'navigation', 'ecriture'], sandbox: ['lecture', 'navigation', 'ecriture'] },
  // Un client ecrit dans son sandbox et seulement la. En workspace il consulte
  // ce qui le concerne : c est son espace de livraison, pas son atelier.
  client: { workspace: ['lecture', 'navigation'], sandbox: ['lecture', 'navigation', 'ecriture'] },
  // Un visiteur ne navigue meme pas en sandbox : un sandbox visitable est un
  // sandbox ou l on depose sans compte.
  guest: { workspace: ['lecture'], sandbox: [] },
};

/** Snapshot JSON de `MATRICE`. Chaque valeur est deja un litteral serialisable
 *  (string[]) — pas de fonction, pas de Map, pas de Symbol — donc ce n est
 *  qu un `JSON.stringify` nomme, pour que l intention (« une seule source »)
 *  soit explicite au point d appel plutot que recopiee en silence. */
export function matriceJSON(): string {
  return JSON.stringify(MATRICE, null, 2);
}

/** Meme remarque pour l ordre de privilege utilise par `peutPromouvoir()` :
 *  aussi recopie a la main dans `rbac-test.mjs` (`RANG`), aussi exporte ici
 *  pour la meme raison. */
export const RANG_PRIVILEGE: Record<RoleEtendu, number> = RANG;

export type MotifRefus =
  | 'HORS_TENANT'
  | 'HORS_PERIMETRE'
  | 'CATEGORIE_INTERDITE'
  | 'AUCUNE_AFFECTATION'
  | 'SANDBOX_INTERDIT';

export type Verdict =
  | { autorise: true; role: RoleEtendu; perimetre: string }
  | { autorise: false; motif: MotifRefus; detail: string };

/**
 * Decide si un acteur peut appeler un outil dans un perimetre donne.
 *
 * L ordre des controles n est pas indifferent : le tenant d abord, le
 * perimetre ensuite, la categorie en dernier. Verifier la categorie avant le
 * tenant reviendrait a repondre « interdit parce que ecriture » a quelqu un
 * qui n avait pas meme le droit de savoir que l outil existe.
 */
export function peut(
  acteur: string,
  tenant: string,
  perimetre: Perimetre,
  categorie: Categorie,
  affectations: readonly Affectation[],
): Verdict {
  if (perimetre.tenant !== tenant) {
    return { autorise: false, motif: 'HORS_TENANT', detail: `perimetre ${perimetre.id} appartient a ${perimetre.tenant}` };
  }

  // CORRECTION (campagne 2026-08-23, FIX_RBAC, finding #3 de AUDIT_RBAC.md) :
  // `Perimetre.parent` n etait jamais lu. Un sandbox dont `parent` pointe
  // vers un workspace auquel l acteur n a AUCUNE affectation passait quand
  // meme, des lors qu une ligne d affectation existait sur le sandbox
  // lui-meme (`perimetre.id`) — meme si cette ligne n avait jamais rien a
  // voir avec la filiation declaree. Un sandbox mal rattache (copier-coller
  // d id, id reutilise apres suppression) donnait alors acces a un sandbox
  // d un autre client sans qu aucun code ne le remarque.
  //
  // La correction : verifier que l acteur a AUSSI une affectation sur le
  // `parent` declare, dans le meme tenant. Sans cette affectation, le lien
  // de filiation n est qu une chaine de caracteres non prouvee — on refuse.
  if (perimetre.type === 'sandbox' && perimetre.parent) {
    const affecteAuParent = affectations.some(
      (x) => x.acteur === acteur && x.tenant === tenant && x.perimetre === perimetre.parent,
    );
    if (!affecteAuParent) {
      return {
        autorise: false,
        motif: 'HORS_PERIMETRE',
        detail: `sandbox ${perimetre.id} rattache au workspace ${perimetre.parent}, mais ${acteur} n a aucune affectation sur ce parent`,
      };
    }
  }

  const a = affectations.find((x) => x.acteur === acteur && x.tenant === tenant && x.perimetre === perimetre.id);
  if (!a) {
    return { autorise: false, motif: 'AUCUNE_AFFECTATION', detail: `${acteur} n a aucune affectation sur ${perimetre.id}` };
  }

  const permises = MATRICE[a.role][perimetre.type];
  if (!permises.length) {
    return { autorise: false, motif: 'SANDBOX_INTERDIT', detail: `${LIBELLE_ROLE[a.role]} n a aucun droit en ${perimetre.type}` };
  }
  if (!permises.includes(categorie)) {
    return { autorise: false, motif: 'CATEGORIE_INTERDITE', detail: `${LIBELLE_ROLE[a.role]} ne peut pas ${categorie} en ${perimetre.type}` };
  }

  return { autorise: true, role: a.role, perimetre: perimetre.id };
}

// --- Politique RLS ---------------------------------------------------------

export interface PolitiqueRLS {
  table: string;
  nom: string;
  commande: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using: string;
}

// CORRECTION (campagne 2026-08-23, FIX_RBAC, finding #4 de AUDIT_RBAC.md) :
// `politiquesRLS`/`sqlRLS` interpolaient le nom de table directement dans le
// SQL, sans quoting d identifiant — `sqlRLS(["items; drop table memberships; --"])`
// produisait du SQL avec l injection intacte. Les vraies migrations du depot
// (`supabase/migrations/20260811000003_rls.sql:39-77`) passent chaque nom
// par `format('%I', t)`, qui echappe et quote cote moteur Postgres. Ce
// fichier genere du SQL STATIQUE en dehors de tout moteur Postgres — pas de
// `format()` disponible ici — donc on replique l effet cote TypeScript :
// on refuse tout nom qui ne ressemble pas a un identifiant SQL simple, puis
// on le quote avec des guillemets doubles. Un nom refuse leve une
// exception ; il ne se glisse jamais tel quel dans le SQL genere.
const IDENTIFIANT_SQL_RE = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

/** Valide un nom de table candidat et rend sa forme quotee (`"nom"`),
 *  prete a etre concatenee dans du SQL sans risque d injection. Leve si le
 *  nom ne respecte pas la forme d un identifiant SQL simple — aligne sur ce
 *  que `format('%I', t)` accepterait sans avoir besoin d echapper. */
function identifiantTable(nom: string): string {
  if (!IDENTIFIANT_SQL_RE.test(nom)) {
    throw new Error(
      `Nom de table invalide pour sqlRLS/politiquesRLS : "${nom}". ` +
        `Attendu un identifiant SQL simple ([a-zA-Z_][a-zA-Z0-9_]{0,62}), ` +
        `aligne sur ce que format('%I', t) accepte dans les migrations reelles.`,
    );
  }
  return `"${nom}"`;
}

/**
 * Genere les politiques RLS d une table portant `tenant` et `perimetre`.
 *
 * Le predicat s appuie sur des claims JWT, pas sur un parametre applicatif :
 * une isolation qui depend du code appelant n est pas une isolation, c est une
 * convention. Si le code oublie de filtrer, la base doit refuser quand meme.
 */
export function politiquesRLS(table: string): PolitiqueRLS[] {
  const tq = identifiantTable(table);
  const tenant = `tenant = (auth.jwt() ->> 'tenant')`;
  const affecte = `exists (
    select 1 from affectations a
    where a.acteur = auth.uid()::text
      and a.tenant = ${tq}.tenant
      and a.perimetre = ${tq}.perimetre
  )`;
  const ecrivain = `exists (
    select 1 from affectations a
    where a.acteur = auth.uid()::text
      and a.tenant = ${tq}.tenant
      and a.perimetre = ${tq}.perimetre
      and a.role in ('owner','admin','member')
  )`;

  return [
    { table, nom: `${table}_select`, commande: 'SELECT', using: `${tenant} and ${affecte}` },
    { table, nom: `${table}_insert`, commande: 'INSERT', using: `${tenant} and ${ecrivain}` },
    { table, nom: `${table}_update`, commande: 'UPDATE', using: `${tenant} and ${ecrivain}` },
    // La suppression reste aux administrateurs : un employe qui se trompe doit
    // pouvoir corriger, pas effacer.
    { table, nom: `${table}_delete`, commande: 'DELETE', using: `${tenant} and exists (
    select 1 from affectations a
    where a.acteur = auth.uid()::text
      and a.tenant = ${tq}.tenant
      and a.perimetre = ${tq}.perimetre
      and a.role in ('owner','admin')
  )` },
  ];
}

/** Rend le SQL des politiques, pretes a appliquer. */
export function sqlRLS(tables: readonly string[]): string {
  const out: string[] = [];
  for (const t of tables) {
    const tq = identifiantTable(t);
    out.push(`alter table ${tq} enable row level security;`);
    out.push(`alter table ${tq} force row level security;`);
    for (const p of politiquesRLS(t)) {
      const clause = p.commande === 'INSERT' ? 'with check' : 'using';
      out.push(`create policy "${p.nom}" on ${tq} for ${p.commande.toLowerCase()} ${clause} (${p.using});`);
    }
    out.push('');
  }
  return out.join('\n');
}

// --- Promotion sandbox -> workspace ---------------------------------------

/**
 * Rien ne sort d un sandbox sans promotion explicite par un administrateur.
 *
 * C est le pendant du veto de paiement : un chemin qui remonterait
 * automatiquement rendrait le sandbox inutile — il ne serait plus un lieu ou
 * l on peut se tromper.
 */
export function peutPromouvoir(role: RoleEtendu): { ok: boolean; motif: string } {
  return RANG[role] >= RANG.admin
    ? { ok: true, motif: `${LIBELLE_ROLE[role]} peut promouvoir` }
    : { ok: false, motif: `${LIBELLE_ROLE[role]} ne peut pas promouvoir : reserve aux administrateurs` };
}

/** Contexte d outil enrichi du perimetre, pour les adaptateurs. */
export function contexteAvecPerimetre(base: ToolContext, perimetre: Perimetre, role: RoleEtendu) {
  return { ...base, perimetre: perimetre.id, type_perimetre: perimetre.type, role_etendu: role };
}
