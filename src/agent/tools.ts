/**
 * tools.ts — client-side implementations of the 5 tools declared by AGENT-A
 * on the server. The server only DESCRIBES them; we run them on the user's
 * machine because the targets (shell, CMS, theme) live here.
 *
 * Each tool returns a JSON-serialisable object. Errors are returned as
 * `{ error: string }` — never thrown — so the model can read them and
 * recover, instead of the tour of loop breaking.
 *
 * ARCHITECTURE — la séparation lecture / écriture :
 *  - lecture (listerApps, lireCollection) : geste immédiat, retourne la valeur
 *    réelle, jamais de proposition. L'agent doit pouvoir lire l'état courant
 *    pour informer ses décisions.
 *  - navigation (ouvrirApp, allerASection) : geste immédiat d'affichage, pas
 *    une écriture de données. Un outil qui déplace une fenêtre sur l'écran
 *    n'a pas besoin d'approbation — l'utilisateur le voit bouger et corrige
 *    en un geste.
 *  - écriture (changerTheme, et tous les outils à venir) : dépose une
 *    proposition dans le scénario courant. Ne touche plus aux données
 *    réelles directement. La fusion est l'acte qui engage.
 *
 * Cette séparation est tracée ici, en un seul endroit, plutôt que dans
 * chaque outil. Un outil qui change de nature (lecture → écriture) doit
 * être déplacé dans la bonne moitié du fichier.
 */
import { useShellStore } from '../stores/shell.store';
import { useCmsStore, getCollectionItems } from '../lib/cms/cms.store';
import { useThemeStore } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';
import { getAllApps } from '../lib/app-registry';
import { CHARACTERS } from './characters';
import { useScenariosStore } from '../stores/scenarios.store';
import type { Applicator } from './scenarios';
import type { CmsCollectionDef } from '../lib/cms/types';

interface ToolSuccess<T> { ok: true; data: T }
interface ToolFailure { ok: false; error: string }
type ToolResult<T> = ToolSuccess<T> | ToolFailure;

const ok = <T>(data: T): ToolSuccess<T> => ({ ok: true, data });
const fail = (error: string): ToolFailure => ({ ok: false, error });

// ────────────────────────────────────────────────────────────────────────────
// listerApps — LECTURE. Retourne la liste des apps et leurs sections.
// ────────────────────────────────────────────────────────────────────────────
export function listerApps(): ToolResult<{ apps: Array<{ id: string; name: string; description: string; sections: string[] }>; note: string }> {
  try {
    // Les sections n'existent qu'une fois l'app montee (declarees dans son
    // appel a `AppFrame`, sans manifeste partage). On rend donc celles de l'app
    // au premier plan, et une liste vide pour les autres — avec une note qui le
    // dit, pour que le modele n'en deduise pas qu'elles n'ont pas de sections.
    const ouverte = useShellStore.getState().activeWindowId;
    const sectionsOuvertes = sectionsMontees();
    const apps = getAllApps().map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      sections: a.id === ouverte ? sectionsOuvertes : [],
    }));
    return ok({
      apps,
      note:
        "Les sections ne sont connues qu'une fois l'app ouverte. Pour celles qui affichent une liste vide, appelle ouvrirApp puis listerApps a nouveau, ou appelle directement allerASection : il repondra avec les sections disponibles s'il ne trouve pas celle demandee.",
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// ouvrirApp — NAVIGATION. Geste immédiat d'affichage.
// ────────────────────────────────────────────────────────────────────────────
export function ouvrirApp(appId: string): ToolResult<{ appId: string; title: string }> {
  if (!appId || typeof appId !== 'string') {
    return fail('appId must be a non-empty string');
  }
  const app = getAllApps().find((a) => a.id === appId);
  if (!app) return fail(`Unknown app: "${appId}". Use listerApps() to see the registered apps.`);
  try {
    useShellStore.getState().openApp(app.id, app.name);
    return ok({ appId: app.id, title: app.name });
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

/** Sections effectivement presentes dans l'app au premier plan.
 *
 *  Il n'existe pas de registre partage des sections : chacune est declaree dans
 *  l'appel a `AppFrame` de son app, et n'existe donc qu'une fois l'app montee.
 *  L'attribut `data-section` pose sur les boutons de la barre laterale est la
 *  seule source fiable — le meme point d'accroche que l'outil de capture.
 */
function sectionsMontees(): string[] {
  return Array.from(document.querySelectorAll('[data-section]'))
    .map((el) => el.getAttribute('data-section') ?? '')
    .filter(Boolean);
}

/** L'app doit d'abord se monter : on attend que ses boutons de section
 *  apparaissent, sans depasser un delai franc. */
async function attendreSections(limiteMs = 2000): Promise<string[]> {
  const debut = performance.now();
  for (;;) {
    const s = sectionsMontees();
    if (s.length > 0) return s;
    if (performance.now() - debut > limiteMs) return [];
    await new Promise((r) => setTimeout(r, 60));
  }
}

/** Va sur une section — NAVIGATION. Geste immédiat d'affichage.
 *
 *  La version precedente emettait un evenement `coach-os:open-app-section` que
 *  PERSONNE n'ecoutait, et rendait `ok` — le modele croyait avoir navigue alors
 *  que rien ne bougeait. Un outil qui ment est pire qu'un outil absent : le
 *  modele batit sa reponse dessus.
 *
 *  On clique donc le vrai bouton, et on echoue franchement si la section
 *  n'existe pas, en listant celles qui existent pour que le modele se corrige.
 *
 *  Atomicité : si l'app est déjà fermée et que le clic échoue, on referme
 *  l'app qu'on vient d'ouvrir. L'utilisateur ne reste pas avec une fenêtre
 *  qu'il n'a pas demandée. C'est la même sémantique « tout ou rien » que la
 *  fusion des scénarios : ou bien la navigation aboutit, ou bien l'état ne
 *  bouge pas. */
export async function allerASection(
  appId: string,
  sectionId: string,
): Promise<ToolResult<{ appId: string; sectionId: string }>> {
  // On regarde si l'app est déjà ouverte. Si oui, on NE LA ROUVRE PAS —
  // une seconde openApp déplace la fenêtre sur l'écran, ce qui n'est pas
  // l'intention de l'utilisateur.
  const shell = useShellStore.getState();
  const dejaOuverte = shell.windows.some((w) => w.id === appId && w.isOpen);
  const open = dejaOuverte ? ok({ appId, title: appId }) : ouvrirApp(appId);
  if (!open.ok) return open;

  try {
    const disponibles = await attendreSections();
    if (disponibles.length === 0) {
      if (!dejaOuverte) useShellStore.getState().closeApp(appId);
      return fail(`L'app "${appId}" est ouverte mais n'expose aucune section.`);
    }
    // Tolerant a la casse et aux espaces : le modele ecrit « Client Pipeline »
    // la ou l'attribut porte exactement le libelle affiche.
    const norme = (s: string) => s.trim().toLowerCase();
    const cible = disponibles.find((s) => norme(s) === norme(sectionId));
    if (!cible) {
      if (!dejaOuverte) useShellStore.getState().closeApp(appId);
      return fail(
        `Section "${sectionId}" introuvable dans "${appId}". Sections disponibles : ${disponibles.join(', ')}.`,
      );
    }
    const bouton = document.querySelector<HTMLElement>(
      `[data-section="${CSS.escape(cible)}"]`,
    );
    if (!bouton) {
      if (!dejaOuverte) useShellStore.getState().closeApp(appId);
      return fail(`Bouton de la section "${cible}" introuvable.`);
    }
    bouton.click();
    return ok({ appId, sectionId: cible });
  } catch (err) {
    if (!dejaOuverte) {
      try { useShellStore.getState().closeApp(appId); } catch { /* noop */ }
    }
    return fail(err instanceof Error ? err.message : String(err));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// lireCollection — LECTURE. Items du CMS.
// ────────────────────────────────────────────────────────────────────────────
interface CollectionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string | null;
  raw: Record<string, unknown>;
}

export function lireCollection(collectionId: string): ToolResult<{ collectionId: string; count: number; items: CollectionItem[] }> {
  if (!collectionId || typeof collectionId !== 'string') {
    return fail('collectionId must be a non-empty string');
  }
  const def = useCmsStore.getState().collections[collectionId];
  if (!def) return fail(`Unknown collection: "${collectionId}".`);
  const items = getCollectionItems(collectionId);
  const projected: CollectionItem[] = items.map((it) => ({
    id: String(it.id),
    title: String(it[def.titleField] ?? it.id),
    subtitle: def.subtitleField ? (it[def.subtitleField] as string | undefined) : undefined,
    badge: def.badgeField ? (it[def.badgeField] as string | null | undefined) ?? null : null,
    raw: it as Record<string, unknown>,
  }));
  return ok({ collectionId, count: projected.length, items: projected });
}

// ────────────────────────────────────────────────────────────────────────────
// changerTheme — ÉCRITURE. Dépose une proposition, ne touche plus le store.
//
// Contrat changé :
//  - Avant : modifier le theme immédiatement. Un agent qui se trompe avait
//    déjà modifié le bureau.
//  - Maintenant : la proposition atterrit dans le scénario courant. Le
//    bureau reste sur l'ancien thème. L'utilisateur voit la proposition
//    arriver dans la file d'approbation et tranche.
//
// L'applicateur `applyThemeChange` est exporté à part : c'est lui qui est
// appelé à la fusion, avec son `revert`. La séparation est ce qui rend
// l'atomique testable — l'outil, lui, ne fait plus que proposer.
// ────────────────────────────────────────────────────────────────────────────
export function changerTheme(themeId: string, appId?: string): ToolResult<{
  scenarioId: string;
  proposalId: string;
  themeId: string;
  appId?: string;
  known: string[];
}> {
  if (!themeId || typeof themeId !== 'string') return fail('themeId must be a non-empty string');
  const known = THEME_META.map((t) => t.id);
  if (!known.includes(themeId)) {
    return fail(`Unknown themeId: "${themeId}". Known themes: ${known.join(', ')}.`);
  }
  const displayName = appId
    ? `Thème « ${themeId} » sur l'app ${appId}`
    : `Thème global « ${themeId} »`;
  const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
    toolName: 'changerTheme',
    args: { themeId, appId },
    displayName,
  });
  return ok({ scenarioId, proposalId, themeId, appId, known });
}

/** L'applicateur du changement de thème, utilisé par la fusion atomique.
 *
 *  Il capture l'état précédent AVANT d'écrire, et fournit un `revert`
 *  qui rétablit l'état exact. C'est ce qui permet à la sémantique
 *  « tout ou rien » de fonctionner pour un thème qui aurait été changé
 *  puis reverté suite à l'échec d'une autre proposition. */
export const applyThemeChange: Applicator = (args) => {
  const themeId = String(args.themeId ?? '');
  const appId = typeof args.appId === 'string' ? args.appId : undefined;
  if (!themeId) return { ok: false, error: 'themeId manquant' };
  const known = THEME_META.map((t) => t.id);
  if (!known.includes(themeId)) {
    return { ok: false, error: `Thème inconnu : "${themeId}"` };
  }
  const store = useThemeStore.getState();
  // Capture de l'état précédent — l'exact revert est ce qui rend l'atomique
  // correct sur un changement de thème.
  const previousGlobal = store.globalTheme;
  const previousApp = appId ? store.appThemes[appId] : undefined;
  const hadAppOverride = appId ? appId in store.appThemes : false;
  try {
    if (appId) store.setAppTheme(appId, themeId);
    else store.setGlobalTheme(themeId);
    return {
      ok: true,
      revert: () => {
        const s = useThemeStore.getState();
        if (appId) {
          if (hadAppOverride) s.setAppTheme(appId, previousApp as string);
          else s.resetAppTheme(appId);
        } else {
          s.setGlobalTheme(previousGlobal);
        }
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};

/** Table des applicateurs par outil — déclarée en bas du fichier.
 *  Voir l'implémentation à la fin du module : les références y sont toutes
 *  déjà résolues, et c'est cette table que la fusion atomique importe. */

// ────────────────────────────────────────────────────────────────────────────
// creerItem — ÉCRITURE. Dépose une proposition de création dans une
// collection du CMS. Ne touche jamais aux données réelles.
//
// Brief-F (2026-08-07) — la couche d'écriture. Avant : l'agent prétendait
// avoir ajouté une tâche alors qu'aucun outil ne le permettait. Maintenant :
// il dépose une proposition, l'utilisateur la voit arriver dans la file
// d'approbation, et tranche.
//
// Le label est généré côté client à partir de `collectionId`, du titre
// déclaré par la collection (def.singular) et des champs fournis. Pas
// d'invention : chaque champ doit être une clé valide du formulaire ou
// correspondre à `def.titleField` / `def.subtitleField` / `def.badgeField`.
// ────────────────────────────────────────────────────────────────────────────

interface CreerItemArgs {
  collectionId: string;
  /** Données de l'item. Doivent inclure au moins `def.titleField`. */
  fields: Record<string, unknown>;
}

interface ModifierItemArgs {
  collectionId: string;
  id: string;
  /** Patch à appliquer. */
  patch: Record<string, unknown>;
}

function pickKnownFields(def: CmsCollectionDef, fields: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(def.fields.map((f) => f.key));
  // Le `titleField`, `subtitleField` et `badgeField` ne sont pas toujours
  // déclarés dans `def.fields` (le seed existant le confirme : tasksDef a
  // `titleField: 'label'` mais `label` n'est pas dans `def.fields`). On les
  // accepte pour ne pas bloquer un humain ou un agent qui suit le contrat.
  if (def.titleField) allowed.add(def.titleField);
  if (def.subtitleField) allowed.add(def.subtitleField);
  if (def.badgeField) allowed.add(def.badgeField);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

export function creerItem(args: CreerItemArgs): ToolResult<{
  scenarioId: string;
  proposalId: string;
  collectionId: string;
  fields: Record<string, unknown>;
}> {
  if (!args || typeof args.collectionId !== 'string') {
    return fail('collectionId must be a non-empty string');
  }
  if (!args.fields || typeof args.fields !== 'object') {
    return fail('fields must be an object');
  }
  const def = useCmsStore.getState().collections[args.collectionId];
  if (!def) return fail(`Unknown collection: "${args.collectionId}". Use lireCollection to discover what exists.`);
  const cleaned = pickKnownFields(def, args.fields);
  const titleFieldValue = cleaned[def.titleField];
  if (titleFieldValue === undefined || titleFieldValue === null || titleFieldValue === '') {
    return fail(`fields.${def.titleField} est obligatoire (champ titre déclaré par la collection).`);
  }
  const displayName = `Créer un ${def.singular} : ${String(titleFieldValue)}`;
  const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
    toolName: 'creerItem',
    args: { collectionId: args.collectionId, fields: cleaned },
    displayName,
  });
  return ok({ scenarioId, proposalId, collectionId: args.collectionId, fields: cleaned });
}

/** L'applicateur de creerItem — utilisé par la fusion atomique.
 *
 *  Capture le résultat de `addItem`, et fournit un `revert` qui appelle
 *  `removeItem` sur l'id retourné. C'est la symétrie exacte qui rend la
 *  sémantique tout-ou-rien correcte pour une création : si une proposition
 *  suivante échoue, la ligne créée est retirée avant que la fonction rende. */
export const applyCreerItem: Applicator = (args) => {
  const collectionId = String(args.collectionId ?? '');
  const fields = (args.fields && typeof args.fields === 'object' ? args.fields : {}) as Record<string, unknown>;
  if (!collectionId) return { ok: false, error: 'collectionId manquant' };
  const def = useCmsStore.getState().collections[collectionId];
  if (!def) return { ok: false, error: `Collection inconnue : "${collectionId}"` };
  const result = useCmsStore.getState().addItem(collectionId, fields);
  if (!result.ok || !result.item) {
    return { ok: false, error: result.error ?? 'Création impossible' };
  }
  const createdId = result.item.id;
  return {
    ok: true,
    revert: () => {
      useCmsStore.getState().removeItem(collectionId, createdId);
    },
  };
};

// ────────────────────────────────────────────────────────────────────────────
// modifierItem — ÉCRITURE. Dépose une proposition de modification.
// Symétrique de creerItem : la fusion revert avec updateItem sur l'ancien
// snapshot.
// ────────────────────────────────────────────────────────────────────────────
export function modifierItem(args: ModifierItemArgs): ToolResult<{
  scenarioId: string;
  proposalId: string;
  collectionId: string;
  id: string;
  patch: Record<string, unknown>;
}> {
  if (!args || typeof args.collectionId !== 'string') {
    return fail('collectionId must be a non-empty string');
  }
  if (!args.id || typeof args.id !== 'string') {
    return fail('id must be a non-empty string');
  }
  if (!args.patch || typeof args.patch !== 'object') {
    return fail('patch must be an object');
  }
  const def = useCmsStore.getState().collections[args.collectionId];
  if (!def) return fail(`Unknown collection: "${args.collectionId}".`);
  const cleaned = pickKnownFields(def, args.patch);
  const items = useCmsStore.getState().items[args.collectionId] ?? [];
  const target = items.find((it) => it.id === args.id);
  if (!target) {
    return fail(`Item introuvable : "${args.id}" dans "${args.collectionId}".`);
  }
  const titleFieldValue = target[def.titleField];
  const displayName = `Modifier ${def.singular} : ${String(titleFieldValue ?? args.id)}`;
  const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
    toolName: 'modifierItem',
    args: { collectionId: args.collectionId, id: args.id, patch: cleaned },
    displayName,
  });
  return ok({ scenarioId, proposalId, collectionId: args.collectionId, id: args.id, patch: cleaned });
}

export const applyModifierItem: Applicator = (args) => {
  const collectionId = String(args.collectionId ?? '');
  const id = String(args.id ?? '');
  const patch = (args.patch && typeof args.patch === 'object' ? args.patch : {}) as Record<string, unknown>;
  if (!collectionId) return { ok: false, error: 'collectionId manquant' };
  if (!id) return { ok: false, error: 'id manquant' };
  const items = useCmsStore.getState().items[collectionId] ?? [];
  const before = items.find((it) => it.id === id);
  if (!before) return { ok: false, error: `Item introuvable : "${id}" dans "${collectionId}".` };
  // Snapshot exact de l'état précédent — c'est ce qui rend le revert correct.
  const snapshot: Record<string, unknown> = { ...before };
  try {
    useCmsStore.getState().updateItem(collectionId, id, patch);
    return {
      ok: true,
      revert: () => {
        useCmsStore.getState().updateItem(collectionId, id, snapshot);
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Convenience used by the Settings page — not part of the wire tool surface.
// ────────────────────────────────────────────────────────────────────────────
export function listAssistantCharacters() {
  return CHARACTERS.map((c) => ({ id: c.id, name: c.name, width: c.width, height: c.height }));
}

/** Table des applicateurs par outil — déclarée en fin de fichier.
 *  C'est ce que la fusion itère. Tout outil d'écriture doit y figurer —
 *  sinon la fusion s'arrête à la première proposition qu'elle ne sait
 *  pas appliquer.
 *  Brief-F (2026-08-07) — creerItem et modifierItem rejoignent
 *  changerTheme. La déclaration est posée ici plutôt qu'au milieu pour
 *  éviter le TDZ sur les `const` des applicateurs ajoutés après le
 *  sélecteur original (Brief D posait déjà ce risque ; on le retire). */
export const applicateurs: Record<string, Applicator> = {
  changerTheme: applyThemeChange,
  creerItem: applyCreerItem,
  modifierItem: applyModifierItem,
};

// DEV-only handle for Playwright capture scripts.
// La déclaration globale dans `src/lib/coachos-global.d.ts` rend
// `window.__coachos` directement assignable — plus de double assertion.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // On s'assure que le theme store est chargé pour le publier aussi.
  void useThemeStore.getState();
  window.__coachos = {
    ...window.__coachos,
    tools: { applicateurs, applyThemeChange, applyCreerItem, applyModifierItem, creerItem, modifierItem },
  };
}
