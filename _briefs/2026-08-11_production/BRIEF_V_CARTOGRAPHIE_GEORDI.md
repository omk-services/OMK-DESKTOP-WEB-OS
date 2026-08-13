---
id: V_CARTOGRAPHIE_GEORDI
campagne: 2026-08-11 — production
---

# BRIEF V — Cartographier Geordi, sans le lire en entier

## Ce qu'on te demande

Produire **la carte** de `03_Resources_Geordi/` : ce qui s'y trouve, sous quelle forme,
et ce qui est exploitable pour concevoir l'ontologie meta d'A'Space OS.

Tu ne conclus rien sur l'architecture. **Tu inventories, tu mesures, tu classes.** La
conception est une decision qui appartient a l'architecte ; ce brief lui fournit le
terrain, pas le plan.

## Ton perimetre

**Lecture seule** sur :

```
C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/
```

**Ecriture uniquement** dans :

```
<depot coach-os>/_briefs/2026-08-11_production/RAPPORT_V_CARTOGRAPHIE_GEORDI.md
<depot coach-os>/_briefs/2026-08-11_production/geordi_inventaire.json
<depot coach-os>/tools/geordi-carte.py
```

**Tu ne modifies, ne deplaces, ne supprimes RIEN dans Geordi.** Aucune exception.

Tu executes ce brief toi-meme. N'invoque aucun workflow, aucune skill, aucun agent delegue.

---

## LE PIEGE QUI DECIDE DE TOUT — les jonctions NTFS

**47 jonctions NTFS sont recensees dans cette arborescence.** `os.path.islink()` **ne les
voit pas**. Un `os.walk` naif a deja compte **13,8 millions de fichiers la ou il y en a
14 613**, et a sature la machine.

Le detecteur qui marche, et le seul :

```python
import stat
RP = getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400)
def est_jonction(entry):
    return bool(entry.stat(follow_symlinks=False).st_file_attributes & RP)
```

**Ton script doit refuser de descendre dans une jonction, et les compter a part.**
Sans ca, tu ne rends rien et tu bloques le poste.

Deuxieme garde-fou, non negociable : **plafond de 30 000 fichiers parcourus**. Si tu
l'atteins, tu t'arretes, tu le dis dans le rapport, et tu rends ce que tu as. Un
inventaire partiel annonce vaut mieux qu'un poste sature — le wiki a deja fait tomber
cette machine lors d'une tentative de lint automatique.

**Ne lis pas le contenu des fichiers en masse.** Tu lis les chemins, les tailles, les
extensions, et **seulement le frontmatter** (les lignes entre les deux `---` en tete) des
fichiers `.md`. Ouvrir 14 000 fichiers en entier n'apporte rien que les metadonnees ne
donnent deja.

---

## Les points d'entree declares — commence par eux

Geordi documente sa propre structure. Lis ces six fichiers **en entier**, ils font moins
de 3 000 lignes a eux tous, et ils t'evitent de deviner :

```
03_Resources_Geordi/CLAUDE.md                          (le routage a 5 branches)
00_Index/INDEX_OF_INDEXES.md                           (la table de routage complete)
00_Index/GEORDI_KB_ROOT.md                             (le manifeste racine, 2026-08-01)
00_Index/SECOND_BRAIN_PARA_MAP.md                      (8 sous-dossiers ↔ PARA ↔ strates)
00_Index/RESOURCES_INDEX.md                            (porte d'entree tabulaire)
03_Memory_Unified/LLM_Wiki/wiki/ROT.md                 (strates S0→S4 et peremption)
```

Les quatre piliers declares sont **OKF** (le format), **Wiki**, **Graphify**, **Dox**.

---

## Ce que la carte doit contenir

### 1. L'inventaire mesure — `geordi_inventaire.json`

Par sous-dossier de premier niveau, puis de deuxieme niveau :

- nombre de fichiers, volume total, extensions dominantes ;
- **jonctions NTFS rencontrees et non suivies**, avec leur cible ;
- pour les `.md` : combien portent un frontmatter, et quelles cles y reviennent
  (`type`, `strate`, `owner`, `description`…) avec leur taux de remplissage.

Le taux de remplissage de `description:` est le chiffre le plus utile du lot : c'est le
critere bloquant d'indexation declare dans `CLAUDE.md`.

### 2. Les quatre piliers, etat reel

Pour **OKF**, **Wiki**, **Graphify**, **Dox** : ou vit chacun, quelle taille, quelle
fraicheur (date du fichier le plus recent), et **est-il a jour ou perime**. Le wiki
annonce 1 773 pages et 319 liens — verifie-le, ne le recopie pas.

### 3. Les gisements DIKW

Classe ce que tu trouves sur les quatre echelons — **Donnee, Information, Connaissance,
Sagesse** — avec, pour chaque echelon, ou ca se trouve et sous quelle forme :

- **Donnee** : JSON de sessions, journaux, exports bruts, bases.
- **Information** : notes structurees, index, tableaux, frontmatter.
- **Connaissance** : pages de wiki, specs, ADR, dox, plans.
- **Sagesse** : ce qui enonce une regle apprise — retours d'experience, pieges payes,
  decisions datees et leurs raisons.

C'est cette derniere categorie qui compte le plus et qu'on trouve le moins. Cite les
fichiers precis, pas des dossiers.

### 4. Ce qui est deja modelisable

Liste les entites qui reviennent assez souvent, dans assez d'endroits, pour meriter une
place dans une ontologie meta. **Avec le compte d'occurrences et les fichiers**, pas a
l'intuition. Compare-les aux **12 entites deja fixees** dans
`<depot>/src/lib/ontology/entities.ts` : lesquelles se recouvrent, lesquelles manquent.

### 5. Ce qui bloque

Doublons, dossiers illisibles, arborescences mortes, fichiers sans frontmatter,
contradictions entre deux index. **Nomme-les.** C'est la partie du rapport qui evitera de
construire sur du sable.

---

## Ce que tu ne fais pas

- **Aucune conclusion d'architecture.** Pas de « il faudrait un graphe Neo4j », pas de
  proposition de schema. Tu rends le terrain.
- **Aucun deplacement, aucune suppression, aucune reecriture** dans Geordi.
- **Aucune lecture en masse** du contenu. Chemins, tailles, frontmatter.
- **Aucun scan de secrets a corriger** — si tu croises un motif `sk-`, `sbp_`, `vcp_`,
  `ghp_`, `mul_`, un JWT ou une cle PEM, **note le chemin dans le rapport et n'affiche
  jamais la valeur**.

---

## Preuve

- `tools/geordi-carte.py` existe, tourne, et **echoue bruyamment** : jonction non geree,
  plafond atteint, dossier illisible → message explicite et code de sortie non nul.
- `geordi_inventaire.json` est produit et non vide.
- Le rapport cite **des chemins reels**, verifiables un par un. Une affirmation sans
  chemin est une affirmation inventee.
- Les totaux du rapport et ceux du JSON concordent. S'ils divergent, dis-le.

## Rapport

`_briefs/2026-08-11_production/RAPPORT_V_CARTOGRAPHIE_GEORDI.md`, **ecrit au fil de
l'eau** — pas a la fin. C'est un inventaire long : si tu t'arretes, un rapport partiel
horodate vaut infiniment mieux qu'un fichier vide.

Termine par **les trois questions** auxquelles la carte ne repond pas et qui demandent une
decision humaine.
