# GATES — MVP Aquaman, runtime ambiant

Registre d'acceptation au format `unlazy`. Écrit avant le travail, exécuté
après. Une porte sans preuve courante n'est pas franchie.

Vérifier sans exécuter :

```
node ~/.agents/skills/unlazy/scripts/gate-check.mjs --status GATES.md
```

---

GATE: G1-schemas-charges
CHECK: node kernel.mjs --autotest
EXPECT: 12 reussites, 0 echecs
EVIDENCE: 2026-08-23T08:16Z — 12 reussites, 0 echecs. Les trois schemas chargent.

GATE: G2-frontiere-typee-rejette-le-malforme
CHECK: node kernel.mjs --autotest
EXPECT: OK   rejette un champ inconnu
EVIDENCE: 2026-08-23T08:16Z — champ inconnu, statut hors enum et motif trop court sont tous rejetes. Un evenement conforme passe.

GATE: G3-le-portail-est-la-seule-porte
CHECK: node kernel.mjs --simule /tmp/hors-portail.md
EXPECT: chemin ne respecte pas le motif 03_Master_Agreements
EVIDENCE: 2026-08-23T08:16Z — trois tentatives hors `03_Master_Agreements/` rejetees et journalisees en `kernel.event.rejected`. Le declencheur canonique n'est pas contournable.

GATE: G4-regle-de-portique-deterministe
CHECK: node kernel.mjs --autotest
EXPECT: complet -> LEGAL_READY
EVIDENCE: 2026-08-23T08:16Z — sans perimetre et sans proprietaire donnent BLOCKED_RISK ; surface privacy donne NEEDS_REVIEW ; dossier complet donne LEGAL_READY. Aucune variabilite de modele.

GATE: G5-bout-en-bout
CHECK: node kernel.mjs --simule "$TEMP/bac/03_Master_Agreements/incomplet.md"
EXPECT: BLOCKED_RISK
EVIDENCE: 2026-08-23T08:17Z — `BLOCKED_RISK (shadow) — veto categoriel : engagement sans perimetre ecrit`. Chaine causale 23c61b4e7cf4 -> c9df0f53a9c6 -> 570f3cc5a1a8.

GATE: G6-journal-causal-complet
CHECK: node kernel.mjs --journal
EXPECT: <- 
EVIDENCE: 2026-08-23T08:17Z — 16 evenements journalises, chaque evenement derive porte `cause_par`. Trois rejets conserves : le journal garde aussi ce qui a echoue.

GATE: G7-dormance-est-silence
CHECK: node kernel.mjs --autotest
EXPECT: portail vide -> aucune activation (0 contrat)
EVIDENCE: 2026-08-23T08:16Z — `03_Master_Agreements/` ne contient que son README. Zero activation. La dormance n'est pas un drapeau, c'est l'absence de declenchement.

GATE: G8-le-harnais-aide
CHECK: <comparer le meme lot de contrats traite par le kernel et par appel direct a un modele : cout, variance des verdicts, tracabilite>
EXPECT: delta >= 0
EVIDENCE:
NOTE: porte la plus importante du registre. CEO-Bench (arXiv 2606.18543) a mesure qu'un harnais peut degrader un modele de tete. Si le kernel n'ameliore pas un delta observable, il se retire. Non franchie a ce jour, et c'est declare.

GATE: G9-shadow-vers-active
CHECK: <verifier qu'aucun verdict ne porte shadow=false tant que le capitaine n'a pas signe le premier livrable Business Done>
EXPECT: shadow: true
EVIDENCE: 2026-08-23T08:17Z — les trois verdicts produits portent `(shadow)`. Le passage a `shadow: false` est un acte du capitaine, pas une decision d'agent. Non automatisable par conception.

---

## Ce que ces portes ne couvrent pas

- **L'extraction est lexicale**, pas semantique : `intake` cherche des motifs
  (`perimetre`, `scope of work`, `titularite`). Un contrat qui dit la meme chose
  autrement sera lu comme incomplet. C'est volontaire au MVP — deterministe,
  gratuit, auditable — et c'est le premier endroit ou brancher un modele quand
  le volume le justifiera. La porte G8 dira si ca vaut le cout.
- **Un seul domaine.** Les sept autres n'ont ni agent ni schema.
- **Aucun connecteur sortant.** Le verdict est journalise, pas notifie.
