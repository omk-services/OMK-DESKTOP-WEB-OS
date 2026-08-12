# BARRE — le site Coach OS

L'artefact de gout de la boucle `gauntlet-visuel`. Ecrit une fois, applique a chaque tour.
Les trois critiques ne recoivent que ce fichier et les captures — jamais le code.

---

## §1 — Ce que le site doit faire

**Faire comprendre en trois secondes, a un coach qui facture 500 a 2 000 $ de l'heure,
que ce bureau tient sa methode au lieu de lui en imposer une — et lui donner une porte
d'entree sans compte.**

Il est expert de son domaine, pas de l'outillage. Il a deja essaye trois SaaS et les a
tous abandonnes parce qu'ils voulaient qu'il travaille a leur facon. Sa peur n'est pas le
prix : c'est de remettre sa methode et ses clients dans une boite qu'il ne controle pas et
dont il ne pourra pas sortir.

Il repart avec une action : **reserver un audit de 30 minutes**, ou **entrer en demo sans
compte**. Ces deux-la, et rien d'autre.

## §2 — Les references

- `https://antigravity.google` — une page, une idee, l'interactivite ne distrait jamais.
- `https://linear.app` — la densite d'information sans l'encombrement.
- `https://stripe.com/fr` — la preuve technique posee sans jargon.

Ce qu'on leur prend : le calme, l'espace, une seule idee par ecran plein.
Ce qu'on ne leur prend pas : le registre unique. Ici chaque section a le sien (§5).

## §3 — Les seuils, mesurables

| | |
|---|---|
| Contraste texte courant / fond | ≥ 4.5:1 — sans exception, y compris sur canvas |
| Contraste grands titres (≥ 24px gras) | ≥ 3:1 |
| Largeur de la colonne de texte | 60 a 75 caracteres. Jamais pleine largeur |
| Familles typographiques | 4 au maximum sur tout le site |
| Tailles de police distinctes | 8 au maximum, sur une echelle reguliere |
| Pas d'espacement | multiple de 4px, partout |
| Promesse lisible sans defiler | a 1440 **et** a 390 |
| Poids de la premiere vue | < 400 Ko hors polices |
| Toute animation | coupee sous `prefers-reduced-motion` |

## §4 — Les interdits nommes

Chacun a deja ete constate ici, ou dans les pages que ce site remplace.

1. **Un effet entre le lecteur et le texte.** Constate au heros le 11 aout : le champ de
   caracteres `fx-decrypt` passait devant le titre et le sous-titre. C'est le defaut le
   plus grave possible sur ce site — la promesse ne se lisait plus. Aucun `.fx-canvas`
   n'a le droit de recouvrir un rectangle de texte.
2. **Le degrade violet-bleu**, le verre depoli generalise, le badge « ✨ IA ».
3. **Trois cartes identiques cote a cote.** Si les items d'une liste ont le meme poids
   visuel, c'est que personne n'a decide lequel comptait.
4. **Le paragraphe interchangeable.** « Transformez votre pratique. » « La solution
   nouvelle generation. » Tout paragraphe deplacable tel quel sur le site d'un concurrent
   est mort et doit etre reecrit ou supprime.
5. **Le visage humain generique**, la poignee de main, l'equipe qui rit, la photo de
   bureau avec baie vitree et plante verte.
6. **Le cerveau lumineux, le reseau de neurones, les circuits imprimes.** Il vend sa
   methode, pas de l'IA.
7. **Le telephone traite en second.** Un rail lateral qui mange le contenu, un bouton
   sous le bord, une video de 14 Mo servie a la 4G.
8. **Le texte incruste dans une image generee.** Le texte est du HTML, toujours.
9. **Le chiffre invente.** Aucun « 10 000 coachs nous font confiance » tant que ce n'est
   pas vrai. Les sources APOLLO deja citees sous les sections restent citees.

## §5 — Ce qui est hors sujet

**La variete des registres par section n'est pas un defaut : c'est le brief.** Le heros en
minimalisme exagere, les fuites en brutalisme, les entrees en bento — c'est demande, mesure
et acquis. Un critique qui reclame l'uniformite se trompe de page.

Ce qui reste a verifier sur ce point, et qui est bien du ressort du critique SYSTEME :
que chaque registre soit **tenu jusqu'au bout** au lieu d'etre effleure, et que le socle
partage tienne dessous — meme grille, meme largeur de colonne, meme pas d'espacement,
meme rythme de defilement.

Sont egalement hors sujet :

- le contenu editorial des paliers (PoC / SaaS / Marque blanche / Souverainete) : arbitre ;
- les balises `<head>`, titres, descriptions, JSON-LD, canoniques : justes ;
- le choix des artefacts images et videos : arbitre dans `ARTEFACTS.md`.

---

## Etat connu au moment d'ecrire cette barre — 11 aout 2026

- Cinq pages servies en statique depuis `public/site/`. `src/site/**` est le meme site en
  React, **importe par rien** : code mort en double, decision en attente.
- Le heros souffrait du defaut §4.1. Correctif confie a l'agent O en meme temps que le
  passage du menu multi-pages en rail lateral.
- **Rien dans l'application ne pointe vers `/site/`.** Le site est orphelin du produit —
  aucune boucle de design ne corrigera ca, c'est un raccordement a faire.
