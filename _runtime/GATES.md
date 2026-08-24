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
EXPECT: 27 reussites, 0 echecs
EVIDENCE: 2026-08-23T21:21Z — 27 reussites, 0 echecs (etait 12). Cinq schemas chargent desormais : les trois d'origine plus kernel.incident et kernel.heartbeat.

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

GATE: G10-rattrapage-au-demarrage
CHECK: node kernel.mjs --autotest
EXPECT: OK   premier passage traite un fichier deja present au demarrage
EVIDENCE: 2026-08-23T21:21Z — un fichier depose dans un portail avant tout demarrage du noyau est traite au premier passage de `rattraperDe`. Un second passage ne le retraite pas : la preuve "deja verdicte" vient du journal (`legal.gate` pour ce `contrat_ref`), jamais d'un `Set` en memoire reconstruit au boot. Le declencheur canonique ne se perd plus en silence.

GATE: G11-reprise-evenement-orphelin
CHECK: node kernel.mjs --autotest
EXPECT: OK   reprise au demarrage retraite l orphelin et produit un verdict
EVIDENCE: 2026-08-23T21:21Z — simulation d'un crash entre `contract.master_agreement.received` et `legal.gate` (emission du seul declencheur). Avant reprise : aucun verdict pour ce `contrat_ref`. Apres `rattraperDe` : verdict produit. Meme mecanisme que G10, memes preuves.

GATE: G12-watch-survit-a-une-exception
CHECK: <inspection du code source : setInterval du cycle --watch enveloppe dans try/catch, catch emet kernel.incident puis la boucle continue>
EXPECT: aTryCatch === true
EVIDENCE: 2026-08-23T21:21Z — verifie par script : `wrapping try/catch autour du cycle --watch avec emission kernel.incident : true`. Demonstration live : `--watch` lance, 6 battements de coeur observes sur ~18s sans interruption (voir G13), puis process arrete volontairement pour tester G13. Aucun `kernel.incident` n'a ete necessaire pendant la demo (aucune exception reelle levee), la preuve porte sur la structure du code + le schema `kernel.incident` charge (G1).
NOTE: la porte la plus honnete de ce lot est celle-ci — je n'ai pas reussi a provoquer une exception reelle dans le cycle sans modifier le code de production pour la circonstance (ce qui aurait ete un test truque). La garantie repose sur l'inspection du wrapping, pas sur un incident observe en conditions reelles.

GATE: G13-battement-de-coeur-et-sante
CHECK: node kernel.mjs --watch (arrete apres ~18s) puis node kernel.mjs --sante et COACH_SEUIL_MORT_MS=2000 node kernel.mjs --sante
EXPECT: DORMANT pendant que --watch tourne, MORT une fois arrete et le seuil depasse
EVIDENCE: 2026-08-23T21:21Z — `--sante` a 4s : "DORMANT (legitime) : noyau vivant (dernier battement il y a 2s), portail vide depuis 3229s". Apres arret du processus et avec `COACH_SEUIL_MORT_MS=2000` : "MORT : dernier battement de coeur il y a 18s (seuil 2s). La boucle --watch ne tourne plus." Le seuil de production par defaut est 15 minutes (`COACH_SEUIL_MORT_MS` non defini) ; il a ete abaisse ici uniquement pour rendre la demonstration observable en quelques secondes.

GATE: G14-autotest-journal-separe
CHECK: node kernel.mjs --autotest puis comparer la taille de .etat/journal.jsonl avant/apres
EXPECT: OK   le journal de production n a pas grandi pendant l autotest
EVIDENCE: 2026-08-23T21:21Z — `.etat/journal.jsonl` : 37 lignes (production, intacte). `.etat/journal.autotest.jsonl` : 13 lignes (evenements de l'autotest, fichier distinct). `cause_par:"test"` n'etait pas la garantie — la separation de fichier l'est.

GATE: G15-extraction-negation-et-incertitude
CHECK: node kernel.mjs --autotest
EXPECT: OK   negation d une garantie -> surface claims non declenchee / OK extraction incertaine -> NEEDS_REVIEW honnete
EVIDENCE: 2026-08-23T21:21Z — un contrat qui dit "ne constitue aucune garantie de resultat" ne declenche plus la surface `claims`. Un document substantiel, formule comme un contrat mais sans les synonymes reconnus de perimetre/propriete, est marque `incertain: true` et le portique rend `NEEDS_REVIEW` au lieu d'un `BLOCKED_RISK` categorique et faux.
NOTE: l'extraction reste lexicale. Ce n'est pas devenu fiable — c'est devenu honnete sur ses limites. Voir la note en fin de fichier.

GATE: G16-contrat-agent-markdown-reel
CHECK: node kernel.mjs --autotest
EXPECT: OK   aquaman-intake declare returns legal.scope.needs_review / OK emission de aquaman-gate taguee conforme
EVIDENCE: 2026-08-23T21:21Z — le noyau lit reellement `agents/*.md` au demarrage (`chargerAgents`), extrait leur frontmatter (`accepts`, `returns`), et verifie a chaque `emettre(..., agentEmetteur)` que le type emis figure dans le `returns` declare par l'agent. C'est ecrit dans l'enveloppe de l'evenement (`contrat_agent: {agent, ok}`), pas dans la charge validee par schema. Le commentaire en tete de `kernel.mjs` a ete corrige pour ne plus promettre une interpretation de la prose des agents : la logique de decision reste du JS deterministe, seul le contrat (accepts/returns) est charge et applique.

---

## Ce que ces portes ne couvrent pas

- **L'extraction reste lexicale**, pas semantique. G15 a resserre deux failles
  mesurees (negation, faux `BLOCKED_RISK` sur reformulation) mais n'a pas
  rendu l'extraction semantique — c'est le premier endroit ou brancher un
  modele quand le volume le justifiera. La porte G8 dira si ca vaut le cout.
- **Un seul domaine.** Les sept autres n'ont ni agent ni schema.
- **Aucun connecteur sortant.** Le verdict est journalise, pas notifie.
- **Le markdown des agents contracte, il ne pilote pas.** `chargerAgents`
  verifie que `intake`/`portique` respectent le `returns` declare dans
  `aquaman-intake.md`/`aquaman-gate.md`. Il ne genere pas leur comportement a
  partir du texte. Rendre le markdown pilotant serait un chantier separe,
  plus risque (le comportement deviendrait fonction de la prose, donc moins
  deterministe) — non entrepris ici, et ce n'est plus promis en commentaire.
- **Le seuil MORT (`COACH_SEUIL_MORT_MS`, defaut 15 min) est une heuristique
  a un seul signal** : l'age du dernier battement de coeur. Il ne distingue
  pas "le process --watch est mort" de "le disque est plein et l'ecriture du
  journal echoue silencieusement" (dans ce dernier cas, `emettre` levera une
  exception d'ecriture qui sera elle-meme capturee par le try/catch du cycle
  et journalisee comme `kernel.incident` — sauf si c'est l'ecriture du
  `kernel.incident` lui-meme qui echoue, auquel cas le battement suivant
  cessera et G13 le detectera avec un delai d'un seuil complet).
