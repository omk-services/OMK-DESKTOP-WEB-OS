# LA MESURE — ne la refais pas, sers-t'en

Un balayage Playwright a parcouru **les 149 sections des 19 apps** le 2026-08-10, après le
correctif d'hydratation des espaces de travail. Voici ce qu'il a trouvé. Ces chiffres sont
mesurés, pas estimés : ne perds pas de temps à les reproduire.

## Résultat global

| Mesure | Valeur |
|---|---|
| Sections auditées | 149 |
| Erreurs console sur tout le parcours | **0** |
| Sections avec un bouton de création | 44 |
| Sections sans bouton de création | 105 |
| Sections rendues vides | 3 |

## Les 3 sections vides

- `tasks / Done` — vide parce qu'aucune tâche n'est terminée. Ce n'est pas un bug de données,
  mais il lui manque un **état vide avec une issue**.
- `onboarding` et `cognition` — aucune section : ce sont des apps plein écran, pas des apps à
  rail. **Normal, ne les touche pas.**

## Sections avec bouton de création, par app

```
dashboard    3/23      people       7/11      operations   6/8
it-rd        6/8       clients      2/5       tasks        4/6
marketplace  0/3       product      6/9       growth       4/7
sales        2/7       finance      2/7       legal        2/3
settings     0/8       welcome      0/10      design       0/21
ontology     0/4       onboarding   0/1       audit        0/7
cognition    0/1
```

## Ce que « 0 bouton » veut dire — et ne veut pas dire

**Un zéro n'est pas automatiquement un défaut.** Six apps n'ont légitimement rien à créer :

- `marketplace` — un catalogue d'intégrations ; on installe, on ne crée pas de fiche.
- `settings` — des réglages ; on bascule, on ne crée pas.
- `welcome` — des pages d'atterrissage éditoriales.
- `design` — une vitrine de vingt styles.
- `onboarding` — un quiz.
- `cognition` — un stub.

**Ne leur ajoute pas de bouton de création.** Ce serait ajouter du bruit pour faire du chiffre.

En revanche, une section qui **rend une collection CMS** sans permettre d'y ajouter un item
est un défaut, quelle que soit l'app. C'est ce croisement-là qui définit ton travail.

## Le critère de tri, section par section

Pour chaque section de ton périmètre, pose-toi ces questions dans l'ordre :

1. **Est-ce que cette section lit une collection CMS ?** (`CollectionRepeater`,
   `CMSCardList`, `DynamicPageView`, `useCmsStore(s => s.items['…'])`, `useCollectionDrill`)
   → Si non, passe : c'est une page de lecture ou d'édition de réglages, elle n'a rien à créer.
   Note-le au rapport avec une ligne de justification.
2. **Si oui : peut-on y ajouter un item depuis l'écran ?**
   → Si non, **c'est le défaut**. Branche le CRUD générique (voir `SOCLE_ACQUIS.md`).
3. **L'état vide a-t-il une issue ?** Une phrase qui dit ce qui manque **et** le bouton qui le
   crée, juste en dessous.
4. **La fiche de détail est-elle à niveau ?** Référence :
   `src/apps/clients/ClientsDetailPage.tsx` — en-tête + statut, métriques, sections
   thématiques, actions, navigation précédent/suivant.

## Le piège à ne pas reproduire

Un agent d'une campagne précédente a rapporté « bouton câblé » sur une action qui dispatchait
un événement que **personne n'écoutait**. Un autre a annoncé « item créé » par un toast alors
que le titre n'était pas persisté et que la carte affichait son sous-titre.

**Un toast n'est pas une preuve.** La preuve, c'est l'item visible dans la liste et le
compteur qui bouge.
