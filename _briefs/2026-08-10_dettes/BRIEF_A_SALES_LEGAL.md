---
id: A_SALES_LEGAL
campagne: 2026-08-10 — dettes assumées
---

# BRIEF A — le snapshot qui ment, et la grille dupliquée

## Ton périmètre exclusif

```
src/apps/sales/**
src/apps/legal/**
```

**Interdit** : le socle (`src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
`src/apps/_ui/`) et toute autre app. Lis `SOCLE_ACQUIS.md` avant de commencer.
`src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` est de l'archive : ni corrigée,
ni supprimée.

Deux dettes, identifiées et localisées. Ce ne sont pas des hypothèses.

---

## DETTE 1 — Le snapshot Sales affiche des chiffres qui n'existent pas

`src/apps/sales/seed.ts`, tableau `SNAPSHOT` (~ligne 36) :

```ts
{ id: 'snap-pipeline', label: 'Pipeline value',   value: '$486k', sub: '54 open deals' },
{ id: 'snap-won',      label: 'Won this quarter', value: '$612k', sub: '31 deals closed' },
{ id: 'snap-avg',      label: 'Avg deal size',    value: '$6.4k', sub: '$4k floor, $10k ceiling' },
```

Plus loin, `{ id: 'stage-won', count: 31, weighted: '$612k closed' }`.

**Le problème** : la collection CMS `deals` contient **cinq** items pour environ **$9 600**
au total. La section Pipeline annonce donc un pipeline cinquante fois supérieur à ce que le
produit contient, et un nombre de deals qui ne correspond à rien. C'est le défaut le plus
visible qui reste dans le produit : la première page qu'un prospect regarde ment sur les
ordres de grandeur.

**Ce que tu fais** — dérive chaque valeur de la collection `deals` du CMS :

| Tuile | Dérivation attendue |
|---|---|
| Pipeline value | somme des `value` des deals dont `stage` n'est ni `Won` ni `Lost` |
| … `sub` | `{n} open deals` où n = le compte de ces mêmes deals |
| Won this quarter | somme des `value` des deals `stage === 'Won'` |
| … `sub` | `{n} deals closed` |
| Avg deal size | moyenne des `value` sur l'ensemble des deals — `$0` si la collection est vide, jamais `NaN` |
| … `sub` | plancher et plafond réels (`Math.min` / `Math.max`), pas des bornes inventées |
| Win rate | `won / (won + lost)` en pourcentage — si aucun deal fermé, affiche `—`, pas `0%` |
| Meetings / week | **aucune source dans le CMS**. Soit tu trouves une source réelle, soit tu retires la tuile. Ne la garde pas avec un chiffre inventé. |

Le formatage doit rester lisible : `$9.6k` plutôt que `$9600`, séparateurs de milliers
au-delà. Une somme de zéro s'affiche `$0`, pas `$NaN` ni une case vide.

Fais le même travail sur le tableau des **étapes** (`stage-*`) : `count` et `weighted`
doivent se dériver, pas se déclarer.

**Attention** : le Dashboard lit la collection `deals` pour son CEO Cockpit. **Ne change pas
la forme des items** — tu ne fais que les *lire* pour calculer.

Si une tuile n'a aucune source possible, la bonne réponse est de la retirer, pas de
l'habiller. Écris ton arbitrage tuile par tuile dans le rapport.

---

## DETTE 2 — La grille de souveraineté Legal existe en deux exemplaires

`src/apps/legal/LegalDetailPage.tsx` (1237 lignes) et `src/apps/legal/LegalItemDetail.tsx`
(866 lignes) portent **chacun leur copie** de la grille des six niveaux de souveraineté.
Les deux copies s'accordent sur les données (mêmes six niveaux, même « you are here » au
niveau 3) mais divergent en structure : la version « page » a un champ `examples`
supplémentaire que la version « item » n'a pas.

Une correction sur l'une sans l'autre crée une incohérence que personne ne voit avant qu'un
client la lise.

**Ce que tu fais** : extrais la grille dans un module partagé **à l'intérieur de
`src/apps/legal/`** — par exemple `src/apps/legal/sovereignty.ts` — avec un type explicite,
les six niveaux, et le champ `examples` optionnel. Les deux composants consomment ce module.
Aucune donnée ne doit rester dupliquée.

Ne sors pas du périmètre pour factoriser dans `src/components/` : c'est du contenu métier
Legal, il reste chez Legal.

Vérifie qu'après extraction, les deux vues affichent **exactement** ce qu'elles affichaient
avant — capture les deux, avant et après.

---

## Vérification

```bash
node tools/shot.mjs --app sales --section "Pipeline" --theme glassmorphism --w 1440 --h 900 --out /tmp/a1.png
node tools/shot.mjs --app legal --section "Compliance" --theme glassmorphism --w 1440 --h 900 --out /tmp/a2.png
```

Pour le snapshot Sales, la capture ne suffit pas : **prouve la dérivation**. Pilote le
navigateur (Playwright dans `~/gauntlet-eyes`, voir `tools/shot.mjs` pour le chargement),
lis les valeurs affichées, et compare-les à la somme calculée depuis la collection `deals`.
Un écart, même d'un dollar, est un bug.

## Ta boucle

```
passe 1 : dette 1 (le snapshot), c'est la plus visible
passe 2 : dette 2 (la grille Legal)
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU + par le calcul
passe 5 : reparcours les deux apps à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

Écris `_briefs/2026-08-10_dettes/RAPPORT_A_SALES_LEGAL.md` — partiel si tu dois t'arrêter.
