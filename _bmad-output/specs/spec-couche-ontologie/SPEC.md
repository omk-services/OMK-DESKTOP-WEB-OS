# SPEC — La couche d'ontologie, socle transversal de P1

## D'où vient cet épic

Dix-huit agents ont analysé 76 conférences et deux dépôts, sur des périmètres
disjoints, sans se lire. **Quatorze sur dix-huit** ont convergé sur le même
manque : le produit n'a pas de modèle. Il manipule Organization, Client, Runbook,
Agent, Incident dans 19 apps sans les avoir jamais nommés ni décrits.

Chaque app réinvente donc ses types. Deux apps qui parlent du même objet ne le
savent pas. C'est ce qui rend les 19 apps interchangeables et creuses : ce sont
des collections d'écrans, pas des vues sur un substrat commun.

Cet épic construit ce substrat.

## Ce que la vérification a établi — et corrigé

Un rapport affirmait que « l'usine générique existe déjà à 60 % ». **C'est faux**,
et l'écart vient d'un artefact de mesure :

| couche | fichiers | lignes |
|---|---:|---:|
| `components/canvasui/` (33 moteurs d'effets) | 84 | 35 423 |
| autres `components/` | 14 | 1 952 |
| `lib/` | 19 | 2 411 |
| `hooks/` | 3 | 347 |
| `stores/` | 3 | 308 |
| `apps/` (19 apps métier) | 58 | 18 002 |

Le noyau réellement réutilisable pèse **5 018 lignes**, pas 41 000 — soit **22 %**
du code, pas 60 %. Le chiffre était gonflé par canvas-ui, dont 28 moteurs sur 33
ne rendent rien : ils dépendent de l'API `html-in-canvas`, absente de Chrome 148.

En revanche, un point tenait : **le couplage au métier de coach est nominal, pas
structurel.** Les 56 occurrences de « coach » dans le noyau sont des noms de clés
de stockage, des commentaires et des données de démonstration. `cms.store.ts` dit
« when a coach is signed in » mais le code résout un `org_id` générique. Le socle
n'a donc pas à être décoacher — il a à être nommé.

## Les 12 entités

Elles sont fixées par la carte de synthèse et ne se discutent pas dans cet épic :

`Organization` · `Membership` · `Profile` · `Client` · `Offering` · `SOP` ·
`Runbook` · `Skill` · `Agent` · `Routine` · `Incident` · `Persona`

Chacune porte des attributs typés, des relations typées vers d'autres entités, et
un **contrat sémantique** : ce qui la déclenche, et les actions permises sur elle.

## Hors périmètre — et pourquoi

**La persistance en graphe.** La carte évoque Neo4j Lite ou Postgres+ltree. Cet
épic n'en choisit aucun et n'écrit dans aucune base. Raison : il n'y a pas de
`.env.local` dans ce dépôt, donc Supabase est inerte en local — une story qui
dépendrait d'une base ne serait ni exécutable ni vérifiable. Le registre vit en
TypeScript typé, en mémoire. Choisir le stockage est une décision d'architecture,
pas une tâche d'implémentation.

**L'auto-génération de l'ontologie.** Faire produire le graphe par un agent est
le chantier 2 (`onboarding` en moteur d'installation). Ici l'ontologie est curée
à la main : c'est précisément ce qu'on veut mettre à l'épreuve.

**Les 16 autres apps.** Seules `it-rd` et `operations` consomment le registre
dans cet épic. Si le raccordement leur coûte cher, on le saura avant d'avoir payé
dix-sept fois.

**canvas-ui.** Sujet clos, aucun rapport.

## Ce qu'on saura après, qu'on ne savait pas avant

Si un registre d'entités curé à la main **porte deux apps sans friction**, ou s'il
crée une dette de synchronisation dès la deuxième. C'est la seule question de cet
épic, et elle se répond en regardant `it-rd` et `operations` après la story 4.

## Critère d'acceptation de l'épic

Ouvrir `ontology`, y lire les 12 entités et leurs relations. Ouvrir `it-rd` puis
`operations` : les deux affichent des entités **issues du même registre**, pas de
listes recopiées. Renommer un attribut dans le registre doit se voir dans les
trois apps sans toucher à leur code.
