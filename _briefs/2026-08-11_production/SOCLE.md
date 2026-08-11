# SOCLE — les faits deja mesures. Ne les remesure pas.

## Le produit

**Coach OS** — bureau web, 19 apps, React 19 + TypeScript + Vite 8 + Tailwind + Zustand.
Depot : `C:\Users\amado\ASpace_OS_V2\20_Life_OS\24_PARA_Enterprise\03_Resources_Geordi\05_From_V2_Domains\30_Business_OS\10_Projects\omk\repos\coach-os`
Deploye : `https://omk-desktop-web-os.vercel.app` — GitHub `omk-services/OMK-DESKTOP-WEB-OS`, branche `main`.

L'utilisateur se definit **non technique** : domaine SOP, pas IT. Traduis les choix techniques
en termes operationnels. N'attends pas qu'il ouvre un terminal.

## Architecture verifiee

- `src/lib/cms/cms.store.ts` — 23 collections, partition par tenant (`itemsByTenant`,
  `collectionsByTenant`). `setTenant()` hydrate desormais les nouveaux espaces via `seedFor()`.
- `src/components/cms/CollectionRepeater.tsx` — CRUD generique, props `allowCreate` / `allowDelete`.
  `formFieldsFor()` reinjecte le `titleField` absent de `fields` (les 23 collections sont dans ce cas).
- `src/agent/tools.ts` + `api/_agent/tools.ts` — 5 outils, separation lecture / navigation / ecriture.
- `src/agent/scenarios.ts` — `mergeAtomically`, tout-ou-rien avec revert.
- `src/apps/people/ApprovalsView.tsx` — file d'approbation humaine.
- `coach-os:open-app-section` — **le SEUL evenement de navigation qui a un ecouteur** (dans
  `AppFrame`). Tout autre `CustomEvent` inventé ne fera rien. Un agent a deja livre un bouton
  qui emettait `coach-os:navigate` : mort ne, personne n'ecoutait.
- `src/lib/dockSkins.ts` + `src/stores/dock.store.ts` — 20 habillages, position bas/droite.

## Supabase — la carte exacte (mesuree le 2026-08-11)

Trois projets existent, repartis sur DEUX comptes distincts. C'est la source de la confusion.

| Projet | Ref | Organisation | Etat |
|---|---|---|---|
| **OMK SERVICES INTERN** | `sgzbkhqqkqdwhakkyzzm` | `xsaahnkguocczvunivfx` (OMK Services Org) | **ACTIVE_HEALTHY** |
| **OMK SERVICES CUSTOMERS** | `ndvqwcapwcnpdvknxcjw` | `xsaahnkguocczvunivfx` (OMK Services Org) | **ACTIVE_HEALTHY** |
| coach-os | `qjrwcdzaebyqponqkiqs` | `xuefwzzxsbdzlooitpwu` (compte personnel amdkn) | **EN PAUSE** — DNS ne resout pas |

**La production interroge le projet EN PAUSE.** Consequence mesuree : 12 requetes
`ERR_NAME_NOT_RESOLVED` vers `qjrwcdzaebyqponqkiqs.supabase.co/rest/v1/...` a chaque ouverture
d'apps. L'app retombe sur son seed local, ce qui masque la panne.

### Le modele a deux niveaux, decide par l'utilisateur

- **Niveau 0 — l'Architecte** (l'utilisateur lui-meme) + le **compte de demonstration**
  -> projet **OMK SERVICES INTERN**, en multi-tenant.
- **Niveau 1 — les clients coachs** (preuve de concept avant SaaS)
  -> projet **OMK SERVICES CUSTOMERS**, en multi-tenant.
- Plus tard : chaque client SaaS sur son propre projet Supabase (White Label), puis
  souverainete complete (infrastructure chez le client).

### Contrainte non negociable

**Le seed local doit survivre au branchement.** L'app doit tourner en demonstration autonome
*et* en mode connecte, sans choix a la compilation. `supabaseConfigured` porte deja cette
bascule ; il faut la rendre explicite et pilotable, pas la supprimer. C'est ce qui permet les
captures video meme si Supabase tombe.

### Le piege deja paye

Un hook JWT mal provisionne fait renvoyer **zero ligne en silence**, sans erreur, a toutes les
requetes RLS. La politique d'isolation lit `org_id` depuis un claim JWT injecte par un hook qui
consulte la table `memberships`. **A verifier en premier, jamais en dernier.** Ajoute un
avertissement console explicite quand le claim est nul.

## Hebergement du PoC — decide

**Render** (`dashboard.render.com`) : 25 services gratuits, Postgres manage, Docker natif,
25 $/mois apres le premier client. C'est la cible pour tout service auto-heberge (Probo,
observabilite, passerelle).

**Octopus Deploy n'est PAS un hebergeur** — c'est un orchestrateur de livraison. Il deploie
vers une infrastructure, il n'en fournit aucune. Ne l'utilise pas comme cible d'hebergement.

Coolify sur VPS : plus tard, quand le volume le justifiera. Pas maintenant.

## Economie de quotas

Tu es **MiniMax-M3**. Tu fais tout le code. L'orchestrateur Anthropic ne fait que decouper et
verifier — son quota est la ressource rare, pas le tien. Travaille en profondeur, ne demande
pas de validation intermediaire, va au bout de ton brief.

## Etat d'esprit

L'utilisateur a passe des heures a ouvrir des pages vides livrees par des agents qui avaient
declare « termine ». Ce qu'il veut n'est pas de la vitesse : c'est que **ce qui est declare
fait soit reellement fait**, et que ce qui ne l'est pas soit dit.
