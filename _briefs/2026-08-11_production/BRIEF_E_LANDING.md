---
id: E_LANDING
campagne: 2026-08-11 — production
---

# BRIEF E — la page d'atterrissage pour les coachs

## Ton perimetre exclusif

```
src/landing/**                 (a creer)
public/landing/**              (a creer)
```

**Interdit** : `src/apps/**`, `src/components/**`, `supabase/**`, `src/lib/tooling/**`.
Lis `GARDE_FOU.md` et `SOCLE.md`.

---

## Tes trois sources, a lire avant d'ecrire une ligne

1. **`C:\Users\amado\Downloads\audit.pdf`** (3,7 Mo) — l'audit de conception d'ontologie. C'est
   le socle intellectuel de l'offre : la page doit parler le langage de ce document, pas celui
   d'un modele de page marketing generique.
2. **`...\omk\_stranded_2026-07-24\APOLLO_CSV_ANALYSIS.md`** — l'analyse de la niche.
3. **`...\omk\_stranded_2026-07-24\APOLLO_ONBOARDING_ANSWERS_OMK_NEXUS.md`** — les reponses
   d'accueil qui decrivent la cible.

Le chemin complet des deux derniers est sous
`C:\Users\amado\ASpace_OS_V2\20_Life_OS\24_PARA_Enterprise\03_Resources_Geordi\05_From_V2_Domains\30_Business_OS\10_Projects\omk\_stranded_2026-07-24\`.

**La cible est le client de Niveau 1 : un coach.** Pas un directeur technique. Chaque phrase
doit tenir devant quelqu'un qui facture son heure et n'a pas d'equipe technique. Le mot
« ontologie » ne doit apparaitre que s'il est immediatement traduit.

Un point d'ancrage deja present dans le produit, a reprendre : la page d'arrivee interne dit
*« Coach OS — pour coach qui facture 500 a 2000 $/h »* et attaque par le cout des taches
repetitives. Ce ton fonctionne. Ne le renie pas.

## Livrable 1 — la page

`src/landing/` : une page complete, responsive, en francais. La structure classique
— promesse, probleme, mecanisme, preuve, offre, objections, appel a l'action — est un point de
depart, pas une contrainte. Ce qui compte :

- la promesse tient en une phrase lisible en trois secondes ;
- le probleme est celui decrit dans les documents APOLLO, pas un probleme invente ;
- l'appel a l'action mene a l'inscription (agent D) **et** a l'entree en demonstration sans
  compte, qui est le chemin le plus court vers la conviction.

## Livrable 2 — les quatre paliers d'evolution, montres et non promis

C'est une demande explicite de l'utilisateur, et c'est ce qui distingue cette page de celle
d'un concurrent. Une section qui expose l'escalier :

| Palier | Ce que le client obtient | Ou vivent ses donnees |
|---|---|---|
| **Preuve de concept** | acces immediat, espace partage isole | infrastructure OMK (Supabase CUSTOMERS) |
| **SaaS** | son espace, ses utilisateurs, son parametrage | infrastructure OMK, isolation par politique de securite |
| **Marque blanche** | le produit a ses couleurs et son domaine | sa propre base, dediee |
| **Souverainete** | le produit tourne chez lui | son infrastructure, ses cles, sa juridiction |

Le message a faire passer : **on ne s'enferme pas ici**. La sortie est prevue des le premier
jour. C'est un argument de vente, pas une concession — et il resonne particulierement chez une
clientele europeenne attentive au RGPD.

Ne promets aucune date. Presente les paliers comme un chemin, en distinguant nettement ce qui
existe aujourd'hui de ce qui est prevu. **Une page qui ment sur son etat d'avancement se paie
au premier appel client.**

## Livrable 3 — ce qui fait qu'on la trouve

Titres et meta-descriptions, donnees structurees `Organization` et `Product`, image de partage,
hierarchie de titres correcte, textes alternatifs sur toutes les images. Poids maitrise : pas
de police exotique chargee pour deux mots.

## Preuve exigee

- captures en 1280 px et en 375 px (`tools/shot.mjs` ou Playwright) ;
- contraste conforme sur les textes principaux — mesure-le, ne l'estime pas ;
- zero erreur console ;
- dans le rapport, **cite les passages des trois sources** qui justifient tes choix de message.
  Une page ecrite sans les avoir lues se verra tout de suite, et sera a refaire.

Rapport : `_briefs/2026-08-11_production/RAPPORT_E_LANDING.md`, ecrit au fil de l'eau.
