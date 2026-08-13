---
id: W_GEORDI_INTEGRAL
campagne: 2026-08-11 — production
---

# BRIEF W — Geordi en entier, YouTube compris, sans plafond de fichiers

## Ce qui change par rapport a l'agent V

V s'est arrete a **30 043 fichiers** sur un plafond de 30 000, dans
`graphify-out/chunks/chunk_008/`. Sa carte est partielle et ne couvre pas les gisements
les plus lourds.

**Le plafond de fichiers saute. YouTube entre dans le perimetre.**

Decision de l'architecte, et sa raison — elle commande tout ce brief :

> Les ressources YouTube sont des captures GTD mal rangees, deposees dans des silos par
> domaine Business ou Life Wheel qui ne sont **pas encore clarifies**. Et **chaque video
> parle de plus d'un domaine** a la fois, dans le meta-perimetre A'Space d'Amadeus et ses
> trois couches d'OS.

Consequence directe : **ta classification doit etre multi-domaine.** Une ressource qui
appartient a trois domaines se voit assigner trois domaines, avec un poids. Toute
structure qui force un fichier dans une seule case reproduit exactement le silo qu'on
cherche a defaire. C'est le point le plus important de ce brief.

## Ton perimetre

**Lecture seule** sur `C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/`
— **en entier, sans exclusion de dossier**, y compris `Youtube_Take_out`,
`watch-history.html`, `06_Claude_Code_Bare`, `07_/08_/09_From_Home_Root*`.

**Ecriture uniquement** dans :

```
_briefs/2026-08-11_production/RAPPORT_W_GEORDI_INTEGRAL.md
_briefs/2026-08-11_production/geordi_integral.json
_briefs/2026-08-11_production/geordi_integral_partiel.json   (ecrit en continu)
tools/geordi-carte-integrale.py
```

**Tu ne modifies, ne deplaces, ne supprimes RIEN dans Geordi.** Le garde-fou de la boucle
de supervision le verifie toutes les cinq minutes.

Tu executes ce brief toi-meme. N'invoque aucun workflow, aucune skill, aucun agent delegue.

---

## Les trois protections qui remplacent le plafond

Retirer le plafond ne veut pas dire retirer les garde-fous. **Ce sont eux qui rendent le
balayage integral possible.**

### 1. Les jonctions NTFS — 119, pas 47

`CLAUDE.md` annonce 47 jonctions ; V en a compte **119**. Le chiffre du canon est perime
de plus du double, dis-le dans ton rapport.

`os.path.islink()` **ne les voit pas**. Un `os.walk` naif a deja compte 13,8 millions de
fichiers la ou il y en a ~14 613, et a sature la machine. Le seul detecteur qui marche :

```python
import stat
RP = getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400)
def est_jonction(entry):
    return bool(entry.stat(follow_symlinks=False).st_file_attributes & RP)
```

**Ne descends jamais dans une jonction. Compte-la, note sa cible, passe.**
Tiens aussi un ensemble des `(st_dev, st_ino)` deja visites : deux chemins differents
peuvent mener au meme dossier reel.

### 2. Plafond de temps, pas de fichiers

**45 minutes de mur.** Au-dela, tu t'arretes proprement, tu ecris ce que tu as, et tu le
dis. Un balayage integral annonce incomplet vaut infiniment mieux qu'un poste sature.

### 3. Ecriture continue

`geordi_integral_partiel.json` est **reecrit apres chaque dossier de premier niveau
termine**. Si le script est tue, l'inventaire des dossiers deja parcourus survit.
C'est ce qui manquait a V : son arret au plafond n'a laisse qu'un instantane figé.

**Ne lis jamais le contenu d'un fichier binaire ou media.** Pour `.mp4`, `.webm`, `.png`,
`.jpg`, `.zip` : chemin, taille, date, rien d'autre. Pour les `.md`, seulement le
frontmatter. Pour les `.json` et `.jsonl` de plus de 1 Mo : la taille, le nombre de
lignes, et les cles de la premiere ligne — jamais le corps.

---

## La classification demandee

### A. Les trois couches d'OS

Chaque ressource se rattache a une ou plusieurs couches :

- **Tech OS (Bedrock)** — infrastructure, outillage, harnais, code, MCP, deploiement.
- **Life OS** — la roue de la vie, les domaines personnels, GTD, PARA, horizons.
- **Business OS** — offres, clients, ventes, operations, finance, legal.

Une ressource peut porter les trois. **Le compte de ressources multi-couches est un
resultat attendu du rapport**, pas un defaut a corriger.

### B. Les domaines, en multi-etiquetage

Pour chaque ressource, la liste des domaines detectes **avec un poids** — nombre
d'occurrences, position dans le chemin, presence dans le frontmatter. Pas de domaine
unique force.

Rends, a la fin, **la matrice de co-occurrence des domaines** : quels domaines
apparaissent ensemble, et combien de fois. C'est elle qui montrera ou les silos actuels
coupent des choses qui vont ensemble — la vraie information que l'architecte attend.

### C. Les echelons DIKW

**Donnee** (JSON de sessions, journaux, exports bruts, media) · **Information** (notes
structurees, index, frontmatter) · **Connaissance** (wiki, specs, ADR, dox, plans) ·
**Sagesse** (regles apprises, pieges payes, decisions datees avec leur raison).

La sagesse est la plus rare et la plus utile. **Cite les fichiers, pas les dossiers.**

### D. Le cas YouTube, traite pour ce qu'il est

`Youtube_Take_out` (~1,1 Go) et `watch-history.html` (54 Mo) sont un **journal de
captures GTD**, pas une bibliotheque rangee. Ce qu'on veut en savoir :

- combien d'elements, sur quelle periode ;
- ce qui est exploitable **sans ouvrir les media** : titres, chaines, dates, descriptions,
  transcriptions si elles existent deja en texte ;
- **pour un echantillon de 100 elements au maximum**, quels domaines chaque titre touche —
  et surtout **combien en touchent plus d'un**. C'est la mesure qui valide ou invalide
  l'intuition de l'architecte.

N'essaie pas de classer les milliers d'elements. Cent suffisent pour trancher.

---

## Ce que tu ne fais pas

- **Aucune conclusion d'architecture.** Tu rends le terrain, pas le plan.
- **Aucune reorganisation, aucun deplacement.** Meme si le rangement te parait mauvais.
- **Aucune valeur de secret affichee.** Si tu croises `sk-`, `sbp_`, `vcp_`, `ghp_`,
  `mul_`, un JWT ou une cle PEM : **note le chemin, jamais la valeur.**

## Preuve

- `tools/geordi-carte-integrale.py` echoue bruyamment : jonction non geree, boucle de
  chemin, dossier illisible, mur de temps atteint → message explicite, code non nul.
- `geordi_integral.json` produit, et `geordi_integral_partiel.json` present a chaque etape.
- Le rapport cite **des chemins reels**, verifiables un par un.
- Les totaux du rapport et du JSON concordent. S'ils divergent, dis-le.
- **Compare tes totaux a ceux de V** (`geordi_inventaire.json` : 30 043 fichiers,
  4,90 Go, 119 jonctions). Un ecart s'explique, il ne se tait pas.

## Rapport

`_briefs/2026-08-11_production/RAPPORT_W_GEORDI_INTEGRAL.md`, **ecrit au fil de l'eau**.

Termine par **les trois questions** auxquelles la carte ne repond pas et qui demandent une
decision humaine.
