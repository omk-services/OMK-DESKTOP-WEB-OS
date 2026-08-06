/** AuditApp — Manuel de Diagnostic IA (5 collections + 1 static grid).
 *
 *  Each `def` block owns one of the 5 grids that follow the Maturité panel:
 *    - arbitrage       : what must remain a human decision, and why
 *    - contexte        : what the agent must know about the business to act
 *    - donnees         : quality, freshness, provenance of what it consumes
 *    - automatabilite  : what can pass to the machine, what resists
 *    - arbitrage-roi   : what costs a human decision, what it avoids
 *
 *  Every entry is a CRITERION, not a generic item. Each carries:
 *    - criterion : short label (title)
 *    - question  : the framing question (subtitle)
 *    - frequency : how often it comes up (badge)
 *    - axis      : 1-2 word axis this criterion rides on
 *    - observe   : what we observe to judge it
 *    - level0/1/2 : the 3-level scale (what does each rung look like)
 *
 *  Tone is courtesy of the Levels dictionary — a higher tier = more
 *  prepared (more delegated, more automated, more sourced, etc.).
 *  Tones are domain data, not theme data.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

const FREQ_ACCENT: Record<string, string> = {
  quotidien: '#dc2626',
  hebdo: '#f59e0b',
  mensuel: '#0d9488',
  ponctuel: '#6366f1',
};

/* ═══ Arbitrage — domaines qui doivent rester une decision humaine ═══ */

const arbitrageDef = def({
  id: 'audit_arbitrage', name: 'Arbitrages humains', singular: 'Arbitrage', accent: '#0891b2',
  titleField: 'criterion', subtitleField: 'question', badgeField: 'frequency',
  fields: [
    { key: 'axis', label: 'Axe', type: 'text' },
    { key: 'frequency', label: 'Frequence', type: 'badge' },
    { key: 'observe', label: 'Ce qu\'on observe', type: 'longtext' },
    { key: 'level0', label: 'Niveau 0 — risqué', type: 'longtext' },
    { key: 'level1', label: 'Niveau 1 — assiste', type: 'longtext' },
    { key: 'level2', label: 'Niveau 2 — delegue', type: 'longtext' },
  ],
});

const arbitrageItems: CmsItem[] = [
  {
    id: 'arb-remboursement',
    criterion: 'Remboursement et avoir client',
    question: 'Qui decide d\'un remboursement ou d\'un avoir sur un client en litige ?',
    axis: 'Finance client',
    frequency: 'quotidien',
    observe: 'Le temps de reponse, le quota des remboursements signes sans ticket, et le nombre de remboursements effectues par le manager.',
    level0: 'Aucun humain n\'a vu les demandes pendant un weekend. Le client a debourse 1 400 € pour un service rendu et recoit un avoir sans piste de pourquoi.',
    level1: 'Un humain signe chaque demande au-dessus de 200 €. Sous ce seuil, l\'agent prepare le dossier et le pousse en file d\'attente pour validation batch.',
    level2: 'L\'agent tranche dans le perimetre ecrit (sous 80 €, premier incident, pas de recidive). Au-dela, escalade. Taux de reprise manager < 8 %.',
  },
  {
    id: 'arb-resiliation',
    criterion: 'Acceptation d\'une resiliation',
    question: 'Quand un client demande a resilier, l\'agent peut-il negocier sans validation ?',
    axis: 'Retention',
    frequency: 'quotidien',
    observe: 'Le taux de retention post-sortie, le nombre de resiliations honorees sans meme appel de retention, et la note du motif de depart.',
    level0: 'L\'agent tente une retention agressive qui casse la confiance. Le client resilie quand meme et laisse un avis negatif.',
    level1: 'L\'agent propose un seul plan B et attend la reponse client. Pas de negociation en plusieurs tours.',
    level2: 'L\'agent mene la conversation, presente deux options, et passe la main si la valeur annuelle > 4 k €. Le conseiller prend alors le relais en moins de 4 h.',
  },
  {
    id: 'arb-prix-devis',
    criterion: 'Remise sur un devis',
    question: 'Une remise au-dessus du plancher peut-elle etre signee par l\'agent ?',
    axis: 'Politique de prix',
    frequency: 'hebdo',
    observe: 'Le nombre de devis signes avec une remise hors grille, le delta entre le prix catalogue et le prix final, et la trace de validation.',
    level0: 'Un vendeur applique une remise de 30 % sans consultation. La marge de l\'offre passe sous le plancher, mais le devis prend.',
    level1: 'Au-dela de 10 % de remise, l\'agent genere une demande de validation et la pousse au manager. Pas de signature automatique.',
    level2: 'L\'agent demande la remise, prepare le dossier (contexte marge, comparaison offres similaires, effet volume), et soumet au manager directement dans le CRM.',
  },
  {
    id: 'arb-comm-ext',
    criterion: 'Communication externe sensible',
    question: 'Un mail d\'excuse, une rupture de ton, une reponse a la presse peut-il partir tout seul ?',
    axis: 'Communication',
    frequency: 'ponctuel',
    observe: 'Le nombre de messages envoyes sans relecture, la presence d\'une liste noire de destinataires, et le temps de revalidation linguistique.',
    level0: 'Un mail d\'excuse part avec une faute de frappe au nom du dirigeant. Le client remarque l\'improvisation et demande a changer d\'interlocuteur.',
    level1: 'L\'agent prepare le brouillon, le pousse avec un bandeau "a relire avant 17h", et n\'envoie jamais sans clic humain.',
    level2: 'L\'agent redige, propose deux variantes, et envoie la version definitive parDefaut a un destinataire interne. La validation finale reste humaine pour les listes sensibles.',
  },
  {
    id: 'arb-derogation',
    criterion: 'Derogation a une regle interne',
    question: 'Une derogation a la procedure (delai, format, delai legal) peut-elle etre signee ?',
    axis: 'Conformite',
    frequency: 'mensuel',
    observe: 'Le nombre de derogations enregistrees au fil du temps, les audits internes, et la tracabilite des exceptions.',
    level0: 'Un agent applique une derogation silencieusement. Six mois plus tard, l\'audit ne retrouve pas la trace et la conformite devient floue.',
    level1: 'L\'agent documente la derogation dans le dossier conformite, marque qui la valide, et la date. Pas d\'envoi sans signature.',
    level2: 'L\'agent declenche un workflow structure (cas, motif, contrepartie, signataire) et le tout est tracable dans l\'outil conformite.',
  },
  {
    id: 'arb-embauche',
    criterion: 'Decisions liees a une embauche',
    question: 'Qui decide d\'inviter un candidat, de lui faire une offre, de refuser definitivement ?',
    axis: 'People',
    frequency: 'mensuel',
    observe: 'Le temps de cycle, le volume de candidatures traversees par l\'agent, et la qualite des retours aux candidats.',
    level0: 'Un refus impersonnel part en masse six mois apres un entretien. Le candidat avait cherche a relancer entre-temps.',
    level1: 'L\'agent prepare le brief, ecrit la note de posture, et la met dans la file RH. Le manager tranche avec le candidat en face.',
    level2: 'L\'agent mene l\'echange de clarification, centralise les NOTES de chaque interlocuteur, et alerte le manager quand deux profils se tiennent a moins de 5 % de score. La decision reste humaine.',
  },
];

/* ═══ Contexte — ce que l\'agent doit savoir du metier pour agir juste ═══ */

const contexteDef = def({
  id: 'audit_contexte', name: 'Contexte metier', singular: 'Contexte', accent: '#10b981',
  titleField: 'criterion', subtitleField: 'question', badgeField: 'frequency',
  fields: [
    { key: 'axis', label: 'Axe', type: 'text' },
    { key: 'frequency', label: 'Frequence', type: 'badge' },
    { key: 'observe', label: 'Ce qu\'on observe', type: 'longtext' },
    { key: 'level0', label: 'Niveau 0 — inconnu', type: 'longtext' },
    { key: 'level1', label: 'Niveau 1 — documente', type: 'longtext' },
    { key: 'level2', label: 'Niveau 2 — integre', type: 'longtext' },
  ],
});

const contexteItems: CmsItem[] = [
  {
    id: 'ctx-offre',
    criterion: 'Catalogue d\'offres et conditions',
    question: 'L\'agent connait-il chaque offre, ses conditions, et la marge cible ?',
    axis: 'Offre',
    frequency: 'quotidien',
    observe: 'Le nombre de devis ou de reponses envoyes sans mention de la bonne offre, les erreurs de prix ou de scope, et le temps passe a verifier le catalogue.',
    level0: 'L\'agent promet un livrable qui n\'existe pas dans l\'offre. Le client signe, l\'equipe refuse, et le deal s\'effondre au moment de la livraison.',
    level1: 'Le catalogue d\'offres est abrege dans le contexte agent. Il sait citer trois offres par segment, mais pas leurs conditions commerciales.',
    level2: 'L\'agent accede au catalogue a jour, connait les conditions par segment, et signale une incoherence quand un brief client sort du perimetre. Il ne cite jamais une offre sans double-check.',
  },
  {
    id: 'ctx-segment',
    criterion: 'Segments client et leur rentabilite',
    question: 'L\'agent sait-il quel segment rapporte et lequel use l\'equipe ?',
    axis: 'Clients',
    frequency: 'hebdo',
    observe: 'Le nombre de relances absorbees par l\'agent, le temps passe par segment, et la marge reelle par cohorte.',
    level0: 'L\'agent traite tous les segments de la meme maniere. Le segment haut-tarif recoit le meme niveau de soin qu\'un client a 80 €/mois.',
    level1: 'L\'agent connait les segments par leur nom (SMB, Mid, Enterprise) et adapte la profondeur des reponses, sans egards pour la rentabilite.',
    level2: 'L\'agent dispose du cout de service par segment. Il sait quand un client haut-tarif demande un effort disproportionne, et alerte plutot que d\'absorber.',
  },
  {
    id: 'ctx-ton-voix',
    criterion: 'Ton de la maison et registre',
    question: 'L\'agent repond-il dans le ton attendu, pas celui de l\'internet ?',
    axis: 'Identite',
    frequency: 'quotidien',
    observe: 'Les retours clients sur le ton, le nombre de reponses reecrites par l\'humain, et la presence d\'un guide de style vivant.',
    level0: 'L\'agent repond avec un ton LinkedIn generique. Le client reconnait l\'IA, le mentionne, et la confiance baisse.',
    level1: 'Quelques articles de style sont glisses en exemple. L\'agent imite, mais s\'ecarte vite du ton sur les sujets techniques.',
    level2: 'Le guide de ton est un document vivant, abrege dans le contexte, et l\'agent l\'applique sans intervention. Les feedbacks humains reviennent rarement en retouche.',
  },
  {
    id: 'ctx-glossaire',
    criterion: 'Glossaire metier et acronymes',
    question: 'L\'agent comprend-il le vocabulaire interne sans demander ?',
    axis: 'Vocabulaire',
    frequency: 'quotidien',
    observe: 'Le nombre de questions de clarification sur des termes internes, les reponses erronees sur un acronyme, et la presence d\'un glossaire abrege.',
    level0: 'L\'agent prend "PSP" pour "paiement" au lieu de "pre-sale pack". Il cree un livrable au mauvais niveau et le client decline.',
    level1: 'Un mini-glossaire est pose dans le contexte. L\'agent gere les termes courants, mais invente ceux qu\'il ne connait pas.',
    level2: 'Le glossaire est branche sur la meme source que l\'humain. L\'agent demande la confirmation quand un terme sort du glossaire, plutot que d\'inventer.',
  },
  {
    id: 'ctx-juridique',
    criterion: 'Contraintes legales et reglementaires',
    question: 'L\'agent sait-il ce qu\'il n\'a pas le droit de promettre ?',
    axis: 'Conformite',
    frequency: 'mensuel',
    observe: 'Le nombre de promesses interdites, les engagements non tenus, et la presence d\'un rappel des limites legales.',
    level0: 'L\'agent promet un delai de retractation rallonge. Le client s\'en saisit, et l\'entreprise doit ceder ou payer une amende.',
    level1: 'Une liste de termes interdits est placee dans le contexte. L\'agent evite ces mots, mais ne sait pas pourquoi ils le sont.',
    level2: 'L\'agent dispose du cadre legal abrege (Loi,Article,Condition) et sait expliquer la regle quand un client la contourne. Il refuse poliment et oriente.',
  },
  {
    id: 'ctx-stocks',
    criterion: 'Etat de l\'operation en temps reel',
    question: 'L\'agent voit-il ce qui est en cours, ou parle-t-il dans le vide ?',
    axis: 'Operation',
    frequency: 'quotidien',
    observe: 'Le nombre de reponses qui contredisent le CRM, les tickets ouverts en parallele, et le temps passe a resynchroniser l\'agent.',
    level0: 'L\'agent promet une livraison mardi alors qu\'un ticket incident est ouvert. Le client appelle, decouvre le mensonge, et deprecie le SLA.',
    level1: 'L\'agent accede au CRM mais sa lecture date. Il detient une vue a J-1 et parle au futur.',
    level2: 'L\'agent agrege CRM, tickets, et planning. Sa reponse reflete l\'etat du systeme a l\'instant T, et il signale quand il ne sait pas.',
  },
  {
    id: 'ctx-culture',
    criterion: 'Culture et priorites de la maison',
    question: 'L\'agent distingue-t-il ce qui est important de ce qui est urgent ?',
    axis: 'Priorites',
    frequency: 'hebdo',
    observe: 'Le nombre de sujets escalades a tort, les decisions prises sans contexte, et la presence d\'un document "ce qui compte ici".',
    level0: 'L\'agent traite toutes les demandes avec la meme intensite. Les sujets strategiques sont noyes dans les tickets operationnels.',
    level1: 'Une note de priorite est posee dans le contexte. L\'agent l\'applique quand on lui pose explicitement la question.',
    level2: 'L\'agent dispose du manifeste de la maison et arbitre seul entre les demandes qui s\'opposent. Il remonte un conflit s\'il ne peut pas trancher.',
  },
];

/* ═══ Donnees — qualite, fraicheur, provenance de ce qu\'il consomme ═══ */

const donneesDef = def({
  id: 'audit_donnees', name: 'Donnees consommees', singular: 'Donnee', accent: '#ec4899',
  titleField: 'criterion', subtitleField: 'question', badgeField: 'frequency',
  fields: [
    { key: 'axis', label: 'Axe', type: 'text' },
    { key: 'frequency', label: 'Frequence', type: 'badge' },
    { key: 'observe', label: 'Ce qu\'on observe', type: 'longtext' },
    { key: 'level0', label: 'Niveau 0 — fragile', type: 'longtext' },
    { key: 'level1', label: 'Niveau 1 — balise', type: 'longtext' },
    { key: 'level2', label: 'Niveau 2 — certifie', type: 'longtext' },
  ],
});

const donneesItems: CmsItem[] = [
  {
    id: 'dat-crm',
    criterion: 'CRM client — completude et fraicheur',
    question: 'Les donnees client que l\'agent lit sont-elles a jour et completes ?',
    axis: 'CRM',
    frequency: 'quotidien',
    observe: 'Le nombre de fiches vides sur un champ critique, le temps median depuis la derniere mise a jour, et le taux de clients sans tag.',
    level0: '40 % des fiches n\'ont pas de segment. L\'agent envoie un message a un client dont le statut est "perdu" depuis 6 mois.',
    level1: 'Un audit detecte les anomalies et un humain marque les manquants. Le CRM est tenu a 95 % sur les champs critiques.',
    level2: 'Une regle de validation bloque la creation d\'un contact sans segment. La fiche est certifiee a la source, pas au moment de l\'usage.',
  },
  {
    id: 'dat-finance',
    criterion: 'Historique financier et provenance',
    question: 'Les chiffres financiers que l\'agent cite viennent-ils d\'une source unique ?',
    axis: 'Finance',
    frequency: 'hebdo',
    observe: 'Le nombre de chiffres cites sans source, les deltas entre la verite Stripe et la verite CRM, et la date de la derniere reconciliation.',
    level0: 'L\'agent cite un ARR sorti d\'un vieux spreadsheet. Le client demande le detail, et l\'ecart de 12 % jette le doute sur tout le reste.',
    level1: 'Un export Stripe est colle dans le contexte une fois par semaine. L\'agent s\'en sert, mais le delta entre la verite et la citation peut atteindre 5 %.',
    level2: 'L\'agent accede au ledger financier par une API. Chaque chiffre porte sa date et sa source, et l\'agent signale les donnees vieilles de plus de 24h.',
  },
  {
    id: 'dat-pii',
    criterion: 'Donnees personnelles et reglementaires',
    question: 'L\'agent sait-il ce qu\'il n\'a pas le droit de stocker ou de ressortir ?',
    axis: 'Conformite',
    frequency: 'quotidien',
    observe: 'La presence d\'un systeme de detection PII, le nombre de reponses qui exposent un champ interdit, et la politique de retention.',
    level0: 'Un agent restitue un numero de carte partiel dans une reponse client. La fuite entre dans le registre des incidents RGPD.',
    level1: 'Un detecteur PII filtre les messages sortants. L\'agent est averti, mais peut quand meme transmettre si le manager valide.',
    level2: 'PII est supprime a la source. L\'agent n\'a jamais acces aux champs sensibles. Les controles sont en place avant que la donnee existe dans le contexte.',
  },
  {
    id: 'dat-llm',
    criterion: 'Sortie modele et hallucinations',
    question: 'Comment l\'agent gere-t-il une reponse dont il n\'est pas certain ?',
    axis: 'Modele',
    frequency: 'quotidien',
    observe: 'Le taux de verifications a posteriori, les hallucinations relevees, et la presence d\'un mode "je ne sais pas" sur les sujets a risque.',
    level0: 'L\'agent invente un numero de telephone et un email de support. Le client appelle un particulier et envoie son dossier a un inconnu.',
    level1: 'Une note systeme demande a l\'agent d\'eviter les coordonnees. Il le fait dans 80 % des cas, le reste sort en l\'etat.',
    level2: 'L\'agent dispose d\'un mode "je ne sais pas" explicite. Les sujets a risque (coordonnees, montants, contrats) declenchent une demande de source avant reponse.',
  },
  {
    id: 'dat-logs',
    criterion: 'Logs techniques et retention',
    question: 'Les logs agent sont-ils conformes au delai de retention et anonymises ?',
    axis: 'Logs',
    frequency: 'mensuel',
    observe: 'Le temps de retention, la presence d\'une politique de purge, et les audits externes qui relisent les logs.',
    level0: 'Les logs agent sont conserves indefiniment en clair. Un sous-traitant les lit pour debugger, et la conformite n\'est plus tracable.',
    level1: 'Une politique de 90 jours est documentee, mais pas imposee. L\'anonymisation est faite a la requete, pas a l\'ecriture.',
    level2: 'Les logs sont anonymises a l\'ecriture et purges au bout de 30 jours. L\'audit peut reproduire la decision sans reconstituer la personne.',
  },
  {
    id: 'dat-tiers',
    criterion: 'Donnees tierces et contrat',
    question: 'L\'agent sait-il si une donnee externe est couverte par un contrat ou une licence ?',
    axis: 'Tiers',
    frequency: 'mensuel',
    observe: 'La presence d\'un registre des flux tiers, la qualite contractuelle de chaque source, et les droits de sortie en cas de coup dur.',
    level0: 'L\'agent utilise une API tierce sans avoir le droit de stocker le resultat. Une coupure fournisseur laisse l\'agent aveugle et le client sans reponse.',
    level1: 'Un registre des flux est tenu a la main. L\'agent est informe a la connexion, mais ne peut pas decider de l\'exposition.',
    level2: 'Chaque flux a un contrat, une fenetre de retention, et un plan B. L\'agent declenche le plan B des que la source se degrade, sans escalader.',
  },
  {
    id: 'dat-staleness',
    criterion: 'Fraîcheur de la donnée documentaire',
    question: 'L\'agent s\'appuie-t-il sur un document de reference obsolete ?',
    axis: 'Documentation',
    frequency: 'hebdo',
    observe: 'Le nombre de reponses fondees sur un doc vieux de plus d\'un an, le temps de mise a jour des procedures, et la date de derniere relecture.',
    level0: 'L\'agent cite un bareme de prix de 2024. Le client demande pourquoi il ne s\'applique pas, et l\'ecart ruine la confiance.',
    level1: 'Chaque doc porte une date de validite. L\'agent avertit quand le doc est en fin de vie, mais continue a le servir.',
    level2: 'L\'agent refuse de servir un doc perime. Il remonte au proprietaire et bloque la reponse tant que la mise a jour n\'est pas faite.',
  },
];

/* ═══ Automatabilite — ce qui peut passer a la machine, ce qui resiste ═══ */

const automatabiliteDef = def({
  id: 'audit_automatabilite', name: 'Automatabilite', singular: 'Test', accent: '#f59e0b',
  titleField: 'criterion', subtitleField: 'question', badgeField: 'frequency',
  fields: [
    { key: 'axis', label: 'Axe', type: 'text' },
    { key: 'frequency', label: 'Frequence', type: 'badge' },
    { key: 'observe', label: 'Ce qu\'on observe', type: 'longtext' },
    { key: 'level0', label: 'Niveau 0 — humain', type: 'longtext' },
    { key: 'level1', label: 'Niveau 1 — assiste', type: 'longtext' },
    { key: 'level2', label: 'Niveau 2 — delegue', type: 'longtext' },
  ],
});

const automatabiliteItems: CmsItem[] = [
  {
    id: 'aut-repetition',
    criterion: 'Repetition et stabilite',
    question: 'La tache est-elle repetitive et stable dans le temps ?',
    axis: 'Volume',
    frequency: 'quotidien',
    observe: 'Le nombre de fois ou la tache est executee par semaine, la variabilite des inputs, et le temps economise par cas.',
    level0: 'La tache change toutes les semaines. L\'agent repasse derriere pour verifier. Le ROI net est sous 10 minutes gagnees par cas.',
    level1: 'La tache est stable mais heterogene. L\'agent gere 60 % des cas, le reste reste au humain qui passe plus de temps a relire qu\'a faire.',
    level2: 'La tache est repetitive et stable. L\'agent tient le perimetre et le temps de relecture chute a moins de 5 % du temps d\'avant.',
  },
  {
    id: 'aut-reversibilite',
    criterion: 'Reversibilite et consequence',
    question: 'Une erreur de l\'agent est-elle reversible ou laisse-t-elle une trace durable ?',
    axis: 'Risque',
    frequency: 'hebdo',
    observe: 'Le type de consequence (mail envoye, paiement declenche, contrat signe), le temps de rollback, et la possibilite de compenser.',
    level0: 'L\'agent declenche un paiement irreversible. Mauvais destinataire, mauvais montant. Pas de rollback, le client porte la perte.',
    level1: 'L\'agent prepare la decision, mais ne declenche pas. L\'humain signe et detecte les erreurs en moins de 24h.',
    level2: 'L\'agent agit dans un perimetre reversible (brouillon, demande, demande de validation). L\'envoi definitif reste humain ou est encadre par un garde-fou.',
  },
  {
    id: 'aut-determinisme',
    criterion: 'Determinisme et variantes',
    question: 'Le resultat attendu tient-il en un nombre fini de variantes ?',
    axis: 'Variabilite',
    frequency: 'hebdo',
    observe: 'Le nombre de cas traites par mois, le ratio de cas "inconnus", et le temps consacre a inventer une nouvelle reponse.',
    level0: 'Chaque cas est un cas unique. L\'agent improvise, le manager doit relire, et la qualite decroit avec la fatigue.',
    level1: 'L\'agent distingue 4-5 archetypes et sert le reste en generique. La qualite est correcte sur les archetypes, floue ailleurs.',
    level2: 'L\'agent sert 95 % des cas en mode reconnu. Le reste remonte avec un brief de ce qu\'il manque, plutot que d\'inventer.',
  },
  {
    id: 'aut-feedback',
    criterion: 'Mesure du succes et feedback rap ide',
    question: 'L\'agent sait-il rapidement si sa reponse a reussi ?',
    axis: 'Feedback',
    frequency: 'quotidien',
    observe: 'Le temps de feedback, le type de retour (explicite / implicite), et la boucle de correction.',
    level0: 'L\'agent envoie 50 messages, aucun retour. La qualite est invisible et l\'amelioration est un coup de poker par trimestre.',
    level1: 'Un client repond "ok" et c\'est tout. L\'agent traite ce signal comme un succes, alors qu\'il pouvait etre de la resignation.',
    level2: 'L\'agent dispose d\'un signal structure (reponse, taux d\'ouverture, delai de resolution) et recalibre ses regles toutes les semaines.',
  },
  {
    id: 'aut-prerequisites',
    criterion: 'Prerequis humains et dependances',
    question: 'La tache necessite-t-elle un acteur humain en amont ou en aval ?',
    axis: 'Dependances',
    frequency: 'hebdo',
    observe: 'Le nombre de blocages par jour, le temps de deblocage, et la proportion de cas qui ne partent jamais sans humain.',
    level0: 'La tache depend d\'un humain pour la demarrer, la valider, et la conclure. L\'agent ajoute du temps d\'orchestration sans retirer de travail.',
    level1: 'La tache est partagee humain / agent. L\'agent prepare, l\'humain execute. Le ratio gagne/perdu est neutre.',
    level2: 'L\'agent tient la boucle complete. L\'humain intervient quand le perimetre est franchi, pas quand la tache est en cours.',
  },
  {
    id: 'aut-knowledge',
    criterion: 'Dependance a une connaissance specialisee',
    question: 'La tache necessite-t-elle un savoir que personne ne peut abreger ?',
    axis: 'Expertise',
    frequency: 'mensuel',
    observe: 'Le nombre de sources, le temps de mise a jour, et le ratio de cas ou l\'expert est requis.',
    level0: 'La tache exige un avis juridique. L\'agent predit la reponse, le client suit, et la reelle obligation surgit six mois plus tard.',
    level1: 'L\'agent s\'appuie sur un subdellegue legal. Il sert 70 % des cas, le reste necessite l\'humain.',
    level2: 'L\'agent dispose d\'un abrege expert mis a jour et reconnait ses propres limites. La couverture est honnete, jamais simulee.',
  },
  {
    id: 'aut-cost',
    criterion: 'Cout de l\'erreur et du rattrapage',
    question: 'Que coute une erreur, et que coute le rattrapage ?',
    axis: 'Cout',
    frequency: 'hebdo',
    observe: 'Le cout moyen d\'une erreur, le temps de rattrapage, et le cout cumule par mois.',
    level0: 'Une erreur coute 8 k € en temps, en rupture de confiance, et en reprise. L\'agent en produit une par mois. Le solde est desastreux.',
    level1: 'L\'agent produit une erreur tous les deux mois. Le cout est de 2 k €, glisse par le manager. Le solde est tout juste positif.',
    level2: 'L\'agent produit une erreur tous les six mois. Le cout est de 400 €, glisse par un humain. Le solde est nettement positif.',
  },
];

/* ═══ Arbitrage & ROI — cout d\'une decision humaine, ce qu\'elle evite ═══ */

const arbitrageRoiDef = def({
  id: 'audit_arbitrage_roi', name: 'Arbitrage & ROI', singular: 'ROI', accent: '#7c3aed',
  titleField: 'criterion', subtitleField: 'question', badgeField: 'frequency',
  fields: [
    { key: 'axis', label: 'Axe', type: 'text' },
    { key: 'frequency', label: 'Frequence', type: 'badge' },
    { key: 'observe', label: 'Ce qu\'on observe', type: 'longtext' },
    { key: 'level0', label: 'Niveau 0 — opaque', type: 'longtext' },
    { key: 'level1', label: 'Niveau 1 — instrumente', type: 'longtext' },
    { key: 'level2', label: 'Niveau 2 — optimise', type: 'longtext' },
  ],
});

const arbitrageRoiItems: CmsItem[] = [
  {
    id: 'roi-cout-decision',
    criterion: 'Cout d\'une decision humaine',
    question: 'Quel est le temps et le salaire consommes par chaque arbitrage humain ?',
    axis: 'Cout',
    frequency: 'hebdo',
    observe: 'Le temps median de decision, le cout mensuel des arbitrages, et le ratio sur le CA.',
    level0: 'Un manager passe 1h30 par jour a arbitrer des cas que l\'agent aurait pu preparer. Cout annuel : 38 k €, ROI invisible.',
    level1: 'Le temps d\'arbitrage est mesure par sprint. Le manager sait combien il a consomme, mais n\'a pas d\'outil pour le reduire.',
    level2: 'L\'agent prepare le dossier, le manager tranche en moins de 5 minutes. Le cout par arbitrage chute a 12 €, le manager garde la posture.',
  },
  {
    id: 'roi-cout-erreur',
    criterion: 'Cout d\'une mauvaise decision',
    question: 'Combien coute une erreur d\'arbitrage, et peut-on la voir en temps reel ?',
    axis: 'Cout',
    frequency: 'mensuel',
    observe: 'Le delta entre la decision prise et la decision optimale (mesurable a posteriori), et le pourcentage de cas qui demande une reprise.',
    level0: 'Les erreurs ne sont pas vues avant qu\'un client ne se plaigne. Pas de delta, pas de taboo, pas d\'apprentissage.',
    level1: 'Une revue mensuelle releve les erreurs. Le cout est agrege, mais la racine reste opaque.',
    level2: 'Chaque arbitrage laisse une trace et un score (qualite du contexte, conformite, satisfaction). Les erreurs sont classees et documentees.',
  },
  {
    id: 'roi-decision-rapide',
    criterion: 'Valeur d\'une decision rapide',
    question: 'Decider vite, sans baisser la qualite, ca vaut combien ?',
    axis: 'Vitesse',
    frequency: 'hebdo',
    observe: 'Le delai de decision, le taux de satisfaction client apres une reponse rapide, et la part de clients qui annulent a cause du delai.',
    level0: 'Le delai median d\'une decision est de 3 jours. 8 % des clients annulent a cause de la latence, ce qui represente 200 k € de CA par an.',
    level1: 'Le delai median est de 36h. Les annulations pour latence sont tombees a 4 %, mais c\'est une moyenne, pas une reduction.',
    level2: 'Le delai median est de 4h. Les annulations pour latence sont sous 1 %. La satisfaction client porte la renouv.',
  },
  {
    id: 'roi-ordre-magnitude',
    criterion: 'Ordre de grandeur et volume',
    question: 'Combien de cas par mois passent par cet arbitrage, et le cout monte-t-il en fleche ?',
    axis: 'Volume',
    frequency: 'mensuel',
    observe: 'Le nombre de cas traites, le cout marginal par cas, et la projection a 6 mois.',
    level0: 'Le volume double tous les six mois et le cout par cas double aussi. Le systeme n\'est pas lineaire, il scaling mal.',
    level1: 'Le volume double mais le cout par cas est stable. Le ROI est lineaire, ce qui est positif mais pas optimal.',
    level2: 'Le volume double et le cout par cas baisse de 15 %. L\'effet apprentissage amenuise le cout, et l\'arbitrage rapporte plus qu\'il ne coute.',
  },
  {
    id: 'roi-risque-regulateur',
    criterion: 'Risque regulateur et cout d\'image',
    question: 'Quel est le risque d\'une mauvaise decision vue par l\'exterieur ?',
    axis: 'Risque',
    frequency: 'mensuel',
    observe: 'Le nombre d\'incidents visibles, le temps de reaction publique, et la presence d\'un protocole de communication.',
    level0: 'L\'incident regulateur n\'est reconnu que lorsqu\'un client le denonce. Le temps de reaction est de plusieurs jours, et l\'image prend un coup.',
    level1: 'L\'incident est signale en interne avant la sortie publique. Le temps de reaction est de 24h, mais le protokol n\'est pas teste.',
    level2: 'Le risque est anticipe. Des scenarios regulateur sont joues deux fois par an, le commite est forme, et la reaction publique tient en moins de 4h.',
  },
  {
    id: 'roi-decision-repetee',
    criterion: 'Cout d\'une decision repetee',
    question: 'Combien coute le re-arbitrage d\'un cas deja tranche ?',
    axis: 'Apprentissage',
    frequency: 'mensuel',
    observe: 'Le nombre de cas revenues pour arbitrage, le ratio d\'apprentissage, et la memoire des decisions.',
    level0: 'Le meme cas revient 4 fois par mois. Le manager le tranche encore, et le systeme n\'a pas grandi.',
    level1: 'Le cas revient 1 fois par mois. Le manager commence a reconnaitre la forme, mais l\'apprentissage reste humain.',
    level2: 'Le cas revient 1 fois par trimestre et l\'agent a absorbe la regle. Le manager tranche des cas vraiment nouveaux.',
  },
  {
    id: 'roi-rivalite',
    criterion: 'Comparaison a la rivale',
    question: 'Decider aussi vite et aussi bien que la concurrence, ca vaut combien ?',
    axis: 'Marche',
    frequency: 'ponctuel',
    observe: 'Les delais des rivaux sur les memes arbitrages, le taux de conversion, et la position dans la tete du prospect.',
    level0: 'Le client potentiel compare nos delais a ceux de la concurrence. Ceux qui tranchent en 4h raflent la mise, les autres regardent.',
    level1: 'Le delai est tenu, mais la qualite est en retrait. Le client signe, mais le rachat a T+1 est incertain.',
    level2: 'Le delai est le meilleur du marche sur certaines categories, et la qualite est sur un pied d\'egalite. L\'avantage se defend en comite.',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedAuditCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(arbitrageDef, arbitrageItems);
  store.registerCollection(contexteDef, contexteItems);
  store.registerCollection(donneesDef, donneesItems);
  store.registerCollection(automatabiliteDef, automatabiliteItems);
  store.registerCollection(arbitrageRoiDef, arbitrageRoiItems);
}

export const FREQ_BADGE_ACCENT = FREQ_ACCENT;
