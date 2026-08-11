---
id: B_SUPABASE
campagne: 2026-08-11 — production
---

# BRIEF B — Supabase multi-tenant : 23 collections, RLS, Auth, compte de demonstration

## Ton perimetre exclusif

```
supabase/**                    (dossier a creer)
src/data/**                    (si present)
src/lib/cms/repository.ts      (si present)
_briefs/2026-08-11_production/RAPPORT_B_SUPABASE.md
```

**Interdit** : `src/lib/supabase.ts` et `.env.example` (agent A les tient), `src/components/**`,
`src/apps/**`. Lis `GARDE_FOU.md` et `SOCLE.md` avant de commencer.

---

## Ce que tu construis

La couche de persistance de Coach OS, en SQL versionne, **sans jamais casser le seed local**.

`SOCLE.md` donne la carte des projets et le modele a deux niveaux. Relis-le : le choix
INTERN / CUSTOMERS n'est pas cosmetique, il porte le modele commercial.

## Livrable 1 — les migrations des 23 collections

Les 23 collections sont declarees dans `src/lib/cms/seed.ts` (ou voisin — trouve-le). Chaque
`def()` porte son `id`, son `titleField` et ses `fields` typés. **Les tables s'en derivent
mecaniquement** : n'invente pas un modele, lis celui qui existe.

Ecris `supabase/migrations/<horodatage>_collections.sql` :

- une table par collection, nommee sans ambiguite ;
- colonnes derivees des `fields`, plus `id` (uuid), `org_id` (uuid, **non nul**), `created_at`,
  `updated_at` ;
- le champ porte par `titleField` doit exister meme s'il est absent de `fields` — c'est le cas
  des 23, et le CRUD generique le reinjecte deja cote client (`formFieldsFor()`) ;
- index sur `org_id` : toutes les lectures filtrent dessus.

## Livrable 2 — RLS, et le piege a desamorcer d'abord

`supabase/migrations/<horodatage>_rls.sql` :

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sur **chaque** table, sans exception ;
- politique de lecture et d'ecriture : `org_id = (auth.jwt() ->> 'org_id')::uuid` ;
- table `memberships` (user_id, org_id, role) et table `organizations`.

**Le piege, a traiter en PREMIER :** le claim `org_id` est injecte dans le JWT par un
`custom_access_token_hook` qui lit `memberships`. Si ce hook n'est pas provisionne, **toutes
les requetes renvoient zero ligne, en silence, sans erreur**. C'est deja arrive sur ce projet.

Donc :
1. ecris le hook en SQL dans une migration dediee ;
2. ecris `supabase/VERIFICATION_RLS.md` : la procedure exacte pour verifier que le claim
   arrive — une requete qui doit rendre des lignes, une qui doit n'en rendre aucune ;
3. le test d'isolation adverse est obligatoire : **un utilisateur de l'org A ne doit jamais
   lire une ligne de l'org B**. Ecris-le, ne le decris pas.

## Livrable 3 — Auth et compte de demonstration

- Auth par courriel/mot de passe, plus les fournisseurs Google, Apple et Microsoft
  (**declaration SQL et configuration cote projet uniquement** — l'agent D fait l'interface).
- Un **compte de demonstration** rempli avec **exactement les donnees du seed local**, dans
  le projet INTERN. C'est lui qui portera les captures video : il doit raconter la meme
  histoire que la version locale, sinon les captures ne valent rien.
- Ecris `supabase/seed.sql` qui derive du seed TypeScript. S'il faut un script de conversion,
  mets-le dans `supabase/tools/` et fais-le tourner.

## Livrable 4 — le repli local qui survit

C'est la contrainte que l'utilisateur a posee lui-meme, et elle prime sur le reste :

> « On pousse en preservant le seed local meme apres le branchement de Supabase, pour la
> version demo de la presentation video. »

Le depot doit tourner **en demonstration autonome** (aucune variable Supabase) **et en mode
connecte**, sans choix a la compilation. Si un repository existe deja avec ce repli, etends-le
au lieu de le remplacer. Sinon, ecris-le.

Regle : quand Supabase est injoignable, l'app **degrade vers le seed** et le dit dans la
console — elle ne casse pas, et elle ne fait pas semblant non plus.

## Livrable 5 — la voie vers le SaaS

Un document court, `supabase/EVOLUTION.md`, qui pose les quatre paliers et ce qui change
techniquement a chacun : **PoC** (deux projets partages, INTERN et CUSTOMERS) -> **SaaS**
(projet partage, isolation par RLS) -> **White Label** (un projet Supabase par client) ->
**Souverainete** (infrastructure chez le client). Une page, pas dix.

## Ce que tu ne fais pas

Tu **n'appliques aucune migration** sur un projet distant. Tu ecris le SQL, tu le valides
localement si `supabase start` fonctionne, et tu t'arretes la. L'application sur INTERN et
CUSTOMERS est un geste de l'utilisateur, pas le tien.

## Preuve exigee

- `supabase db lint` ou equivalent passe ;
- si Docker est disponible : `supabase start` puis `supabase db reset` applique les migrations
  et le seed sans erreur — colle la sortie dans le rapport ;
- le test d'isolation adverse tourne et echoue quand il doit echouer ;
- si Docker n'est pas disponible sur cette machine, **dis-le** et livre le SQL avec sa
  procedure de verification. Ne simule pas un succes.

Rapport : `_briefs/2026-08-11_production/RAPPORT_B_SUPABASE.md`, ecrit au fil de l'eau.
