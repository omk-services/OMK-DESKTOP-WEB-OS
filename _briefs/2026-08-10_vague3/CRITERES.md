# CRITÈRES — ce que tu cherches dans ton périmètre

Ces sept familles sont le contrat de la campagne. Tu les passes **toutes** sur **chaque** section
de chaque app de ton périmètre. Pas d'échantillonnage.

## 1. Boutons morts et actions sans effet

Pour chaque bouton, lien, carte cliquable, ligne de tableau cliquable : le `onClick` produit-il
quelque chose d'**observable** ? Un handler vide, ou qui n'appelle qu'un `setState` jamais lu,
est un bouton mort. Chaque action doit faire au moins une de ces choses : ouvrir un détail,
naviguer vers une section ou une app, muter le CMS, pousser un toast, télécharger un fichier.

Un bouton dont on ne sait pas quoi faire → soit tu le câbles, soit tu le retires. Pas de
troisième voie.

## 2. Formulaires

Chaque champ de saisie : est-il contrôlé ? La validation existe-t-elle ? Que se passe-t-il si on
soumet vide ? Un formulaire qui accepte une chaîne vide et crée un item fantôme est un bug.
Après soumission réussie : le champ se vide, un toast confirme, la liste se met à jour.
En cas d'échec : un message visible, pas un silence.

## 3. États vides, erreur, chargement

Pour chaque liste et chaque tableau : que voit-on si la collection est **vide** ? Un écran blanc
est un bug. Il faut une phrase qui explique ce qui manque **et un bouton qui mène à l'endroit
où on le crée**. Vérifie aussi les divisions par zéro dans les pourcentages et les moyennes
quand le dénominateur vaut 0 (`NaN%` à l'écran).

## 4. Responsive

La fenêtre de l'OS fait **920×600 par défaut** et se maximise à `100vw`. Vérifie aux deux
tailles. Symptômes déjà rencontrés dans ce dépôt : cartes étirées et illisibles, textes qui se
chevauchent, chiffres tronqués, graphique SVG figé à une largeur en dur.

Règle du dépôt : une grille à 4 colonnes ne passe à 4 qu'à `xl:`, une grille à 3 colonnes qu'à
`2xl:`. En dessous, 2 colonnes.

## 5. Données honnêtes

Un chiffre en dur qui ne vient d'aucune source est un mensonge à l'écran. Chaque métrique se
dérive du seed local ou du CMS (`useCmsStore`). Si la donnée n'existe pas, affiche `0` avec un
état vide honnête — jamais un chiffre inventé pour faire joli.

Vérifie aussi la **cohérence entre sections** : si l'app affiche « 6 clients » dans une section
et « 3 comptes » dans une autre pour la même collection, l'une des deux ment.

## 6. Thème et jetons

Zéro classe de palette Tailwind en dur : `bg-white`, `bg-stone-*`, `text-slate-*`,
`border-zinc-*`, `text-gray-*`, `bg-neutral-*`. Tout passe par `var(--theme-*)` ou
`var(--panel-*)`.

Les couleurs **sémantiques** (vert = sain, ambre = alerte, rouge = incident, bleu = info)
restent en hex explicite via une prop `tone` — c'est le canon du dépôt, ne les convertis pas.

Rappel : le **thème par app** est une fonctionnalité (Settings > thème de sidebar par app).
Cinq apps ne suivent pas le thème global : c'est voulu. Ne le démonte pas.

## 7. Nommage et cohérence éditoriale

Le nom d'une app dans `src/lib/app-discovery.tsx` doit être **le même** que celui affiché dans
son `AppFrame title=` et dans ses `eyebrow=`. Un cas a déjà été corrigé (« Sales Sanctum » au
registre contre « Sales OS » dans toute l'app). Cherche les autres.

Vocabulaire canon du produit : **Coach OS** (le produit), **Citadelle** (l'offre haut de gamme),
**demo-coach** (le tenant de démonstration). Pas de variante orthographique.

Aucun `TODO`, `FIXME`, `TBD`, `coming soon`, `WIP` visible **à l'écran**. Dans un commentaire de
code c'est toléré ; dans une chaîne rendue à l'utilisateur, non.

---

# VÉRIFICATION

Un correctif non vérifié n'est pas un correctif. Le rendu se contrôle **à l'écran**, pas dans le
JSX. Le serveur de dev tourne déjà sur `http://localhost:5173` — ne le relance pas.

```bash
node tools/shot.mjs --app <app-id> --section "<Label Exact>" --theme glassmorphism --out /tmp/x.png
node tools/shot.mjs --app <app-id> --section "<Label Exact>" --theme dark-oled --w 1920 --h 1080 --out /tmp/y.png
```

Le sélecteur de section est strict (`[data-section="Label"]`) : label faux → exit 4. C'est voulu.
L'outil liste les erreurs de console en fin de capture : une page qui hurle n'est pas une page
qui marche.

Au moins une capture par section corrigée, sur **deux thèmes** et **deux tailles**.

---

# TA BOUCLE

```
passe 1 : parcours TOUTES les sections de TOUTES tes apps
          liste les défauts, range-les PAR CAUSE (pas par app, pas par fichier)
passe 2 : corrige cause par cause — celle qui explique le plus de symptômes d'abord
passe 3 : capture chaque section touchée (2 thèmes × 2 tailles)
passe 4 : npx tsc --noEmit — ne lis QUE les erreurs portant sur TES fichiers
passe 5 : reparcours tout ton périmètre à neuf
si passe 5 remonte du neuf → retour en passe 2
sinon → rapport
```

**Deux passes consécutives sans rien de neuf** = tu as fini. Pas avant.

Un rapport qui dit « j'ai corrigé quelques points, il en reste sûrement d'autres » est un
abandon, pas une livraison. Si tu as N apps dans ton périmètre, ton rapport parle des N apps.

---

# CE QUE TU LIVRES

- Des commits atomiques, un par cause corrigée. Message en français, préfixe conventionnel
  (`fix(app): …`, `feat(app): …`). Pas de `git push`.
- Un rapport `_briefs/2026-08-10_vague3/RAPPORT_<TON_ID>.md` : les causes trouvées et corrigées,
  les sections touchées, les captures qui le prouvent, et la liste de ce que tu as vu
  **hors périmètre** et laissé aux autres.
