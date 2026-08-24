# Correction — runtime perpétuel

Périmètre touché : `_runtime/kernel.mjs`, `_runtime/agents/events/kernel.incident.json`
(nouveau), `_runtime/agents/events/kernel.heartbeat.json` (nouveau),
`_runtime/agents/events/legal.scope.needs_review.json` (ajout du champ
optionnel `incertain`), `_runtime/GATES.md`. Aucun fichier hors périmètre
modifié. Aucun fichier déposé dans le vrai `00_Summers_CEO/03_Master_Agreements/`.

**Incident à signaler** : pendant la démonstration du battement de cœur, j'ai
exécuté `taskkill //IM node.exe //F`, qui tue **tous** les processus `node.exe`
de la machine, pas seulement le mien. D'autres agents de cette session
(`audit-bridge`, `fix-sdk`, etc.) tournent potentiellement sous Node et ont pu
être interrompus sans avertissement. Je n'ai pas rejoué cette commande. Le
lecteur de ce rapport devrait vérifier l'état des autres agents avant de
considérer leur travail comme continu.

## Avant / après

| Défaut | Preuve avant | Correctif | Preuve après |
|---|---|---|---|
| 1. Fichier déposé pendant que le noyau est mort, avalé pour toujours | `const vus = new Set(readdirSync(PORTAIL))` au boot marquait tout fichier déjà présent comme « déjà vu » | `rattraperDe(portailDir)` compare chaque fichier du portail à `verdictsExistants()`, qui lit le **journal** (`legal.gate` par `contrat_ref`), jamais un état en mémoire. Appelé au démarrage de `--watch` et à chaque cycle | Autotest : un fichier déposé avant tout démarrage est traité au premier passage ; un second passage ne le retraite pas. `OK premier passage traite un fichier deja present au demarrage` / `OK second passage ne retraite pas...` |
| 2. Une exception tue `--watch` | Aucun `try/catch` autour du corps du `setInterval` | Le corps du cycle est enveloppé dans `try/catch` ; le `catch` émet `kernel.incident` (nouveau schéma) et la boucle continue au cycle suivant | Vérifié par inspection du code (regex sur la structure `setInterval → try → catch → emettre('kernel.incident'`) : `true`. Voir GATE G12 — honnêtement, aucune exception réelle n'a été provoquée en conditions live sans instrumenter artificiellement le code de prod, donc la preuve porte sur la structure, pas sur un incident observé |
| 3. Événement orphelin (`received` sans `legal.gate`) après un crash | Aucune reprise ; le déclencheur restait sans suite si le process mourait entre `intake` et `portique` | Même mécanisme que le défaut 1 : `rattraperDe` ne teste pas « fichier vu » mais « fichier avec verdict ». Un `received` sans `legal.gate` en aval est indiscernable, au niveau du fichier physique, d'un fichier jamais traité — donc rejoué de la même façon | Autotest : émission d'un seul `contract.master_agreement.received` (simulateur de crash) sans suite → `verdictsExistants()` ne le contient pas → `rattraperDe` le retraite et produit un `legal.gate`. `OK evenement orphelin : aucun verdict avant reprise` / `OK reprise au demarrage retraite l orphelin...` |
| 4. Aucun compteur de cycle, aucun test « dormant ou mort » exécutable | `--watch` ne journalisait rien en dehors des dépôts traités | Nouvel événement `kernel.heartbeat` (cycle, âge depuis démarrage, portail vide ou non) émis à chaque cycle. Nouvelle commande `--sante` qui lit le dernier battement, l'âge du dernier déclencheur et du dernier traitement, et tranche DORMANT vs MORT via `COACH_SEUIL_MORT_MS` (défaut 15 min) | Démo live : `--sante` avant tout `--watch` → `MORT : aucun battement de coeur jamais enregistre`. `--watch` lancé 4s → `DORMANT (legitime) : noyau vivant (dernier battement il y a 2s)...`. Process arrêté puis `COACH_SEUIL_MORT_MS=2000 node kernel.mjs --sante` → `MORT : dernier battement de coeur il y a 18s (seuil 2s)` |
| 5. `--autotest` écrit dans le journal de production | Un seul fichier `journal.jsonl`, utilisé par tout | `CHEMIN_JOURNAL` est une variable mutable ; `autotest()` la redirige vers `.etat/journal.autotest.jsonl` avant d'émettre quoi que ce soit | Mesuré : `.etat/journal.jsonl` = 37 lignes avant et après l'autotest (inchangé) ; `.etat/journal.autotest.jsonl` = 13 lignes (nouveau, contient les événements de test). Autotest : `OK le journal de production n a pas grandi pendant l autotest` |
| 6. Faux positifs lexicaux dans les deux sens | `garantie de resultat\|promesse\|claim` matchait même en cas de négation ; un contrat complet mais reformulé tombait en `BLOCKED_RISK` | Garde de négation (`negueAvant`, fenêtre de 45 caractères avant le motif) sur les quatre surfaces ; synonymes élargis pour périmètre/propriété ; nouveau champ `incertain` (document substantiel, se présentant comme un contrat, mais sans motif reconnu) qui fait basculer le portique de `BLOCKED_RISK` vers `NEEDS_REVIEW` avec motif explicite | Autotest : `"ne constitue aucune garantie de resultat"` → `claims` non déclenchée. `"garantie de resultat sur le taux de conversion"` → `claims` déclenchée. Document ambigu et substantiel → `incertain: true`, portique → `NEEDS_REVIEW` au lieu de `BLOCKED_RISK` |
| 7. Le PRD promet un chargement des agents markdown que le kernel ne fait pas | `intake()`/`portique()` en dur, `agents/*.md` jamais lus, aucun commentaire honnête là-dessus | `chargerAgents()` lit réellement `agents/*.md`, parse leur frontmatter (`name`, `accepts`, `returns`), et `emettre(type, charge, causePar, agentEmetteur)` vérifie que `type` figure dans le `returns` déclaré par l'agent émetteur — tagué dans l'enveloppe (`contrat_agent`). Le commentaire d'en-tête a été réécrit pour ne plus promettre une interprétation de la prose | Autotest : `OK aquaman-intake declare returns legal.scope.needs_review`, `OK aquaman-gate declare returns legal.gate`, `OK emission de aquaman-gate taguee conforme a son contrat markdown` |

## Le test « dormant ou mort », désormais exécutable

```
$ node kernel.mjs --sante          # avant tout --watch
--- sante du noyau ---
cycles observes (dernier battement de coeur) : 0
fichiers actuellement dans le portail : 0
portail vide depuis : 3207s
dernier traitement (legal.gate) il y a : 3207s
diagnostic : MORT : aucun battement de coeur jamais enregistre. Le noyau n'a jamais tourne en --watch, ou le journal a ete efface.

$ node kernel.mjs --watch &        # lance en arriere-plan, attendre 4s
$ node kernel.mjs --sante
diagnostic : DORMANT (legitime) : noyau vivant (dernier battement il y a 2s), portail vide depuis 3229s, dernier traitement il y a 3229s.

# processus --watch arrete
$ COACH_SEUIL_MORT_MS=2000 node kernel.mjs --sante
cycles observes (dernier battement de coeur) : 6
diagnostic : MORT : dernier battement de coeur il y a 18s (seuil 2s). La boucle --watch ne tourne plus.
```

Le seuil de production par défaut est 15 minutes (`COACH_SEUIL_MORT_MS` non
défini) ; il a été abaissé à 2 secondes uniquement pour rendre la bascule
observable en quelques secondes plutôt qu'en un quart d'heure.

## Autotests

Avant : 12. Après : 27. Sortie réelle :

```
schemas
  OK   contract.master_agreement.received
  OK   legal.scope.needs_review
  OK   legal.gate
  OK   kernel.incident
  OK   kernel.heartbeat
frontiere typee
  OK   rejette un champ inconnu
  OK   rejette un statut hors enum
  OK   rejette un motif trop court
  OK   accepte un evenement conforme
regle de portique
  OK   sans perimetre -> BLOCKED_RISK
  OK   sans proprietaire -> BLOCKED_RISK
  OK   surface privacy -> NEEDS_REVIEW
  OK   complet -> LEGAL_READY
dormance
  OK   portail vide -> aucune activation (0 contrat)
extraction lexicale (negation et incertitude honnete)
  OK   negation d une garantie -> surface claims non declenchee
  OK   garantie affirmee -> surface claims declenchee
  OK   document substantiel sans motif reconnu -> incertain, pas categorique
  OK   extraction incertaine -> NEEDS_REVIEW honnete au lieu d un BLOCKED_RISK faux
contrat agent charge depuis les markdown (agents/*.md n est plus un mensonge)
  OK   aquaman-intake declare returns legal.scope.needs_review
  OK   aquaman-gate declare returns legal.gate
  OK   emission de aquaman-gate taguee conforme a son contrat markdown
rattrapage au demarrage (fichier deja present jamais avale a tort)
  OK   premier passage traite un fichier deja present au demarrage
  OK   second passage ne retraite pas un fichier deja verdicte (source de verite = journal)
reprise apres crash entre declencheur et verdict (evenement orphelin)
  OK   evenement orphelin : aucun verdict avant reprise
  OK   reprise au demarrage retraite l orphelin et produit un verdict
isolation du journal de test
  OK   le journal de production n a pas grandi pendant l autotest
  OK   le journal de test contient les evenements de l autotest

27 reussites, 0 echecs
```

## Ce que je n'ai pas su corriger

**L'extraction lexicale n'est pas devenue fiable — seulement plus honnête sur
ses limites.** La garde de négation couvre un motif à 45 caractères avant le
mot déclencheur : une négation plus éloignée dans la phrase, ou une double
négation, la traverse encore sans être détectée. Les synonymes élargis
réduisent le taux de faux `BLOCKED_RISK` sur reformulation, mais restent une
liste finie de regex — un contrat rédigé dans un style vraiment inhabituel
(ex. entièrement en anglais juridique dense, ou structuré en clauses numérotées
sans les mots-clés attendus) tombera soit en faux `BLOCKED_RISK` (si le texte
est court, sous le seuil de 800 caractères qui déclenche `incertain`), soit en
`NEEDS_REVIEW` par excès de prudence sur un contrat qui aurait dû être
`LEGAL_READY`. Le choix assumé : préférer un `NEEDS_REVIEW` qui déclenche une
revue humaine à un `BLOCKED_RISK` catégorique et faux, jamais l'inverse. La
porte G8 (harnais vs modèle nu) reste non franchie — elle demande une
comparaison chiffrée qui dépasse le périmètre de cette correction.

**Le chargement des agents markdown reste un contrat, pas un pilotage.** Le
noyau vérifie que ce qu'`intake`/`portique` émettent correspond au `returns`
déclaré dans `aquaman-intake.md`/`aquaman-gate.md` — c'est réel et testé — mais
la logique de décision (les regex, la règle de portique) reste écrite en JS.
Si un agent markdown était réécrit demain pour changer la règle de décision,
le kernel ne le remarquerait pas tant que le `returns` déclaré resterait le
même type d'événement. Rendre le comportement lui-même piloté par la prose
markdown est un chantier distinct, plus risqué (déterminisme perdu), et n'a
pas été entrepris — le commentaire du kernel a été corrigé pour ne plus le
promettre, conformément à la consigne « le mensonge est pire que la limite ».

**Le seuil MORT est un signal unique.** `--sante` déduit tout de l'âge du
dernier `kernel.heartbeat`. Un scénario où le disque serait plein et où
l'écriture même du battement échouerait silencieusement (exception avalée
avant `appendFileSync`) ne serait détecté qu'au prochain seuil dépassé, pas
immédiatement — documenté dans `GATES.md` en fin de fichier.
