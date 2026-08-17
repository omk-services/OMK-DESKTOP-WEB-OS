// GENERE par coach-os — src/lib/tooling/adapters/harness.ts
// Ne pas editer a la main : regenerer via `npm run tooling:harness`.
//
// Extension pi. Elle publie les outils coach-os dans le harness et pose
// un refus local avant l'appel. Le refus local est un confort ; la garde
// qui tient est cote serveur (identity.ts + permissions.ts).

// Le type est declare sur place plutot qu'importe : le nom du paquet pi
// qui exporte ExtensionAPI n'a pas ete verifie contre la source. Une
// interface structurelle rend le fichier compilable tel quel ; si pi
// publie le type, remplacer ces lignes par son import.
interface ExtensionAPI {
  registerTool(t: {
    name: string;
    description: string;
    parameters: unknown;
    run(args: Record<string, unknown>): Promise<unknown>;
  }): void;
  on(
    evenement: "tool_call",
    h: (e: { name: string }, ctx: { deny(raison: string): void }) => Promise<void>,
  ): void;
}

// Fourni par l'operateur : le transport vers le serveur MCP coach-os.
// Volontairement non genere — le choix du transport (stdio local, socket,
// HTTP) depend du deploiement, et le coder ici le figerait.
declare function appelerCoachOs(
  nom: string,
  args: Record<string, unknown>,
): Promise<unknown>;

// L'identite vient de l'environnement du processus, jamais du modele.
// Un agent qui pourrait ecrire son propre role serait un agent qui
// s'accorde ses propres droits.
const IDENTITE = {
  __tenantId: process.env.COACH_OS_TENANT,
  __actorId: process.env.COACH_OS_ACTOR,
  __role: process.env.COACH_OS_ROLE,
};

// Categorie par outil : sert au refus local. Copiee du registre a la
// generation — si elle derive, c'est le serveur qui tranche.
const CATEGORIES: Record<string, string> = {
  "app_list": "navigation",
  "app_open": "navigation",
  "collection_create": "ecriture",
  "collection_delete": "ecriture",
  "collection_list": "lecture",
  "collection_read": "lecture",
  "collection_search": "lecture",
  "collection_update": "ecriture",
  "scenario_approve": "navigation",
  "scenario_list": "lecture",
  "scenario_read": "lecture",
  "scenario_reject": "navigation",
  "section_goto": "navigation",
};

export default function (pi: ExtensionAPI) {
  // 1. Le garde-fou, pose AVANT les outils : si l'enregistrement echoue
  //    a mi-parcours, on prefere un harness sans outils a un harness
  //    avec outils et sans garde.
  pi.on("tool_call", async (event, ctx) => {
    const categorie = CATEGORIES[event.name];
    if (!categorie) return; // outil hors coach-os : pas notre affaire.
    if (!IDENTITE.__tenantId || !IDENTITE.__actorId || !IDENTITE.__role) {
      return ctx.deny(
        "Identite coach-os absente. Poser COACH_OS_TENANT, COACH_OS_ACTOR " +
        "et COACH_OS_ROLE. Aucun defaut : un defaut silencieux ici rejoue " +
        "exactement le defaut qu'on corrige.",
      );
    }
    if (categorie === "ecriture" && IDENTITE.__role === "guest") {
      return ctx.deny("Role guest : ecriture refusee.");
    }
  });

  // 2. Les outils. Chacun proxie vers le serveur MCP coach-os ; aucune
  //    logique metier ne voyage jusqu'ici.

  // navigation — Catalogue des apps du bureau (id, nom, description). Permet de découvrir ce qui est disponible.
  pi.registerTool({
    name: "app_list",
    description: "Catalogue des apps du bureau (id, nom, description). Permet de découvrir ce qui est disponible.",
    parameters: {"type":"object","properties":{}},
    async run(args) {
      return appelerCoachOs("app.list", { ...args, ...IDENTITE });
    },
  });

  // navigation — Ouvre l'app indiquée. C'est une instruction de navigation : sur le client, l'app courante change ; sur le serveur, rend l'instruction à exécuter côté bureau.
  pi.registerTool({
    name: "app_open",
    description: "Ouvre l'app indiquée. C'est une instruction de navigation : sur le client, l'app courante change ; sur le serveur, rend l'instruction à exécuter côté bureau.",
    parameters: {"type":"object","properties":{"appId":{"type":"string","description":"Identifiant canonique de l'app (kebab-case)."}},"required":["appId"]},
    async run(args) {
      return appelerCoachOs("app.open", { ...args, ...IDENTITE });
    },
  });

  // ecriture — PROPOSE la création d'un item dans une collection. Ne touche PAS les données réelles : la proposition atterrit dans la file d'approbation. Le champ titre (titleField) est obligatoire.
  pi.registerTool({
    name: "collection_create",
    description: "PROPOSE la création d'un item dans une collection. Ne touche PAS les données réelles : la proposition atterrit dans la file d'approbation. Le champ titre (titleField) est obligatoire.",
    parameters: {"type":"object","properties":{"collectionId":{"type":"string","description":"Identifiant canonique de la collection (kebab-case)."},"fields":{"type":"object","additionalProperties":{"type":"string"},"description":"Champs de l'item. Doit inclure le titleField."},"rationale":{"type":"string","_optional":true,"description":"Pourquoi cette création (affichée dans la file)."}},"required":["collectionId","fields"]},
    async run(args) {
      return appelerCoachOs("collection.create", { ...args, ...IDENTITE });
    },
  });

  // ecriture — PROPOSE la suppression d'un item. Aucune ligne n'est retirée tant qu'un humain n'a pas approuvé.
  pi.registerTool({
    name: "collection_delete",
    description: "PROPOSE la suppression d'un item. Aucune ligne n'est retirée tant qu'un humain n'a pas approuvé.",
    parameters: {"type":"object","properties":{"collectionId":{"type":"string","description":"Identifiant canonique de la collection (kebab-case)."},"id":{"type":"string","description":"Identifiant de l'item à supprimer."},"rationale":{"type":"string","_optional":true}},"required":["collectionId","id"]},
    async run(args) {
      return appelerCoachOs("collection.delete", { ...args, ...IDENTITE });
    },
  });

  // lecture — Liste les collections du CMS actives pour le tenant (id, nom, nombre d'items). Lecture seule.
  pi.registerTool({
    name: "collection_list",
    description: "Liste les collections du CMS actives pour le tenant (id, nom, nombre d'items). Lecture seule.",
    parameters: {"type":"object","properties":{}},
    async run(args) {
      return appelerCoachOs("collection.list", { ...args, ...IDENTITE });
    },
  });

  // lecture — Lit les items d'une collection. Renvoie id, titre, et les champs bruts.
  pi.registerTool({
    name: "collection_read",
    description: "Lit les items d'une collection. Renvoie id, titre, et les champs bruts.",
    parameters: {"type":"object","properties":{"collectionId":{"type":"string","description":"Identifiant canonique de la collection (kebab-case)."},"limit":{"type":"number","_optional":true,"description":"Plafond du nombre d'items rendus (défaut 100)."}},"required":["collectionId"]},
    async run(args) {
      return appelerCoachOs("collection.read", { ...args, ...IDENTITE });
    },
  });

  // lecture — Recherche textuelle dans toutes les collections. Renvoie les items les plus pertinents avec un extrait.
  pi.registerTool({
    name: "collection_search",
    description: "Recherche textuelle dans toutes les collections. Renvoie les items les plus pertinents avec un extrait.",
    parameters: {"type":"object","properties":{"query":{"type":"string","description":"Texte cherché (case-insensitive)."},"limit":{"type":"number","_optional":true,"description":"Plafond du nombre de hits (défaut 20)."}},"required":["query"]},
    async run(args) {
      return appelerCoachOs("collection.search", { ...args, ...IDENTITE });
    },
  });

  // ecriture — PROPOSE la modification d'un item existant. Patch partiel, clés inconnues ignorées. La proposition n'écrit rien directement.
  pi.registerTool({
    name: "collection_update",
    description: "PROPOSE la modification d'un item existant. Patch partiel, clés inconnues ignorées. La proposition n'écrit rien directement.",
    parameters: {"type":"object","properties":{"collectionId":{"type":"string","description":"Identifiant canonique de la collection (kebab-case)."},"id":{"type":"string","description":"Identifiant de l'item à modifier."},"patch":{"type":"object","additionalProperties":{"type":"string"},"description":"Patch à appliquer."},"rationale":{"type":"string","_optional":true}},"required":["collectionId","id","patch"]},
    async run(args) {
      return appelerCoachOs("collection.update", { ...args, ...IDENTITE });
    },
  });

  // navigation — INSTRUCTION D'APPROBATION. Ne touche pas aux données : rend la commande exacte que l'humain doit exécuter (Approve & Merge dans la file d'approbation côté client). Le serveur refuse d'appliquer à la place de l'humain.
  pi.registerTool({
    name: "scenario_approve",
    description: "INSTRUCTION D'APPROBATION. Ne touche pas aux données : rend la commande exacte que l'humain doit exécuter (Approve & Merge dans la file d'approbation côté client). Le serveur refuse d'appliquer à la place de l'humain.",
    parameters: {"type":"object","properties":{"proposalId":{"type":"string","description":"Identifiant de la proposition (préfixe p_)."},"rationale":{"type":"string","_optional":true,"description":"Justification humaine (optionnelle)."}},"required":["proposalId"]},
    async run(args) {
      return appelerCoachOs("scenario.approve", { ...args, ...IDENTITE });
    },
  });

  // lecture — Liste les propositions en attente, triées par date (récent d'abord). Lecture seule.
  pi.registerTool({
    name: "scenario_list",
    description: "Liste les propositions en attente, triées par date (récent d'abord). Lecture seule.",
    parameters: {"type":"object","properties":{"limit":{"type":"number","_optional":true,"description":"Plafond (défaut 50)."}}},
    async run(args) {
      return appelerCoachOs("scenario.list", { ...args, ...IDENTITE });
    },
  });

  // lecture — Lit une proposition : args exacts, displayName, rationale. Pour qu'un humain puisse trancher en lisant.
  pi.registerTool({
    name: "scenario_read",
    description: "Lit une proposition : args exacts, displayName, rationale. Pour qu'un humain puisse trancher en lisant.",
    parameters: {"type":"object","properties":{"proposalId":{"type":"string","description":"Identifiant de la proposition (préfixe p_)."}},"required":["proposalId"]},
    async run(args) {
      return appelerCoachOs("scenario.read", { ...args, ...IDENTITE });
    },
  });

  // navigation — INSTRUCTION DE REJET. Renvoie la commande exacte à passer au client. Pas d'effet de bord.
  pi.registerTool({
    name: "scenario_reject",
    description: "INSTRUCTION DE REJET. Renvoie la commande exacte à passer au client. Pas d'effet de bord.",
    parameters: {"type":"object","properties":{"proposalId":{"type":"string","description":"Identifiant de la proposition (préfixe p_)."},"reason":{"type":"string","_optional":true,"description":"Raison du rejet (optionnelle)."}},"required":["proposalId"]},
    async run(args) {
      return appelerCoachOs("scenario.reject", { ...args, ...IDENTITE });
    },
  });

  // navigation — Ouvre l'app et navigue jusqu'à la section indiquée. Une seule instruction pour les deux gestes — l'atome est l'écouteur coach-os:open-app-section côté client.
  pi.registerTool({
    name: "section_goto",
    description: "Ouvre l'app et navigue jusqu'à la section indiquée. Une seule instruction pour les deux gestes — l'atome est l'écouteur coach-os:open-app-section côté client.",
    parameters: {"type":"object","properties":{"appId":{"type":"string","description":"Identifiant canonique de l'app."},"sectionId":{"type":"string","description":"Identifiant de la section dans l'app."}},"required":["appId","sectionId"]},
    async run(args) {
      return appelerCoachOs("section.goto", { ...args, ...IDENTITE });
    },
  });
}
