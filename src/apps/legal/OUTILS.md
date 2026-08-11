# OUTILS — Conformité sans Vanta

> **Date** : 2026-08-11
> **Cible d'hébergement** : Render (cf. `SOCLE.md` § Hébergement du PoC)
> **Périmètre** : remplacer une plateforme de conformité propriétaire à plusieurs milliers d'euros par an
> par des briques libres, auto-hébergeables, branchées sur l'app Legal de Coach OS.

L'app Legal a six collections CMS (`legal_frameworks`, `legal_controls`,
`legal_compliance_policies`, `legal_evidence`, `legal_risks`, `legal_vendors`,
`legal_gaps`) qui portent l'essentiel. Les outils ci-dessous ne sont
**pas** intégrés en tant qu'applications natives : ce sont des sources
de données, des scanners, ou des briques d'appoint qui complètent le
CMS, sans le remplacer.

---

## Comp AI — `https://github.com/trycompai/comp`

**Ce qu'il fait** : alternative open-source à Vanta/Drata/Secureframe.
Cadres SOC 2, ISO 27001, RGPD ; politiques pré-écrites ; gestion des
preuves ; pistes d'audit ; tâches de remédiation.

**Licence** : AGPL-3.0 (open-source, copyleft). Le SaaS Comp AI est
parallèle, commercial.

**Mode de déploiement** : self-hosted (Docker). Image `trycompai/comp`.
L'app est une SPA + API, parle Postgres. La version cloud officielle
existe aussi, mais ce n'est pas ce qu'on veut : on perd la souveraineté
que Comp AI est censé apporter.

**API** : oui, REST classique. Authentification par session + token.
L'app Legal pourrait y pousser des preuves automatiquement — pas
fait aujourd'hui, le CMS suffit.

**Ce qu'il remplace chez Vanta** : le gros. Comp AI couvre 80% du
périmètre Vanta (frameworks, politiques, preuves, audit pack) en
self-hosted. Les 20% restants sont les intégrations natives (AWS, GCP,
GitHub, etc.) que Comp AI n'a pas toutes.

**Verdict** : **utile, point de départ**. Si l'utilisateur a besoin
d'un workflow guidé (politique par cadre, attribution automatique des
preuves), Comp AI est plus rapide à mettre en place qu'un CMS fait
main. Mais Coach OS a déjà les collections — Comp AI serait un
**complément**, pas un remplacement.

**Coût d'hébergement (Render)** : 1 service web + 1 Postgres managé =
~$7/mois pour une instance mono-tenant.

---

## Probo — `https://www.probo.com/`

**Ce qu'il fait** : conformité ouverte, pensée pour les petites
structures. Cadrage RGPD, SOC 2 light, signatures électroniques,
preuves photographiques. Plus simple que Comp AI, plus « produit
fini ».

**Licence** : AGPL-3.0 (open-source, copyleft).

**Mode de déploiement** : self-hosted (Docker). Image `getprobo/probo-app`.
Parle Postgres. Le SaaS officiel existe aussi.

**API** : oui, REST. Authentification par cookie de session.

**Ce qu'il remplace chez Vanta** : la couche « signature des politiques
+ preuves photographiques ». Vanta a un module « Policy acknowledgment »
qui est son point fort ; Probo fait la même chose, self-hosted.

**Verdict** : **ancrage iframe**. L'app Legal prévoit l'emplacement
(composant `<ProboAnchor />`) mais ne construit pas l'iframe tant
qu'une instance Probo n'est pas déployée. Le branchement se fait
via la variable d'environnement `VITE_PROBO_URL`.

**Coût d'hébergement (Render)** : 1 service web + 1 Postgres managé =
~$7/mois. Plus le sous-domaine via Hostinger DNS.

**Note d'écart** : Probo n'est pas un framework de conformité complet.
C'est un **outil complémentaire** pour la signature des politiques et
la collecte de preuves binaires. Le CMS de Coach OS reste l'autorité
sur les cadres, contrôles, risques et écarts.

---

## Prowler — `https://github.com/prowler-cloud/prowler`

**Ce qu'il fait** : scanner de sécurité cloud (AWS, GCP, Azure, Kubernetes).
Des centaines de contrôles CIS, PCI-DSS, RGPD, NIST. C'est un **outil
en ligne de commande**, pas une plateforme avec interface : il
produit des rapports qu'on ingère, on ne l'intègre pas tel quel.

**Licence** : Apache-2.0 (open-source, permissif).

**Mode de déploiement** : binaire CLI, ou conteneur Docker. Pas de
SaaS « Probo-like » — on l'exécute, on récupère le JSON, on l'ingère.

**API** : non. C'est un outil batch. Le JSON est le mode d'échange.

**Ce qu'il remplace chez Vanta** : le module « Cloud security monitoring »
de Vanta. Vanta a des connecteurs AWS/GCP/Azure ; Prowler fait la même
chose, en mieux, sans coût de licence.

**Verdict** : **utile, intégré**. L'app Legal a un composant
`<ProwlerImport />` qui lit un JSON Prowler et crée automatiquement
des `legal_gaps` (un par finding FAIL). Mapping simple et conservateur
(voir `ProwlerImport.tsx`). Les doublons sont ignorés — un re-scan ne
pollue pas l'audit narrative.

**Coût** : 0 €. Prowler est gratuit ; l'exécution se fait soit sur
une machine de dev, soit dans un job Render planifié.

**Commande type** :

```bash
prowler aws --severity critical high --status FAIL -M json -f /reports/prowler.json
```

---

## awesome-compliance — `https://github.com/theopenlane/awesome-compliance`

**Ce qu'il fait** : la carte du paysage. Liste curated de tous les
outils libres de conformité, classés par catégorie (frameworks,
contrôles, politiques, preuves, scanners, etc.).

**Licence** : CC0 (domaine public).

**Mode de déploiement** : aucun. C'est une page Markdown / repo Git.

**API** : non.

**Ce qu'il remplace chez Vanta** : rien directement. C'est un annuaire,
pas un outil.

**Verdict** : **carte de référence**. À consulter pour ne rien
manquer. Pas un livrable. Pas intégré dans l'app. Listé ici pour
traçabilité — la veille se fait sur ce repo, pas dans Coach OS.

---

## Résumé opérationnel

| Outil | Statut dans Coach OS | Coût / mois | Hébergement |
|---|---|---|---|
| **CMS Coach OS** | **Source de vérité** (6 collections) | Inclus | Supabase Cloud |
| **Comp AI** | Complément, non déployé | ~$7 (Render) | Docker self-host |
| **Probo** | Ancrage iframe prévu, non déployé | ~$7 (Render) | Docker self-host |
| **Prowler** | **Intégré** (import JSON) | 0 € | CLI / job Render |
| **awesome-compliance** | Référence (annuaire) | 0 € | n/a |

La règle d'or : **le CMS de Coach OS reste l'autorité**. Les outils
externes sont des sources de données ou des compléments, jamais des
remplacements. Si Comp AI est déployé, ses preuves sont importées
dans `legal_evidence` ; si Probo est déployé, sa signature de
politique est appelée depuis le détail d'une `legal_compliance_policies`.
Prowler est déjà branché.
