/**
 * tools.ts — client-side implementations of the 5 tools declared by AGENT-A
 * on the server. The server only DESCRIBES them; we run them on the user's
 * machine because the targets (shell, CMS, theme) live here.
 *
 * Each tool returns a JSON-serialisable object. Errors are returned as
 * `{ error: string }` — never thrown — so the model can read them and
 * recover, instead of the tour of loop breaking.
 */
import { useShellStore } from '../stores/shell.store';
import { useCmsStore, getCollectionItems } from '../lib/cms/cms.store';
import { useThemeStore } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';
import { getAllApps } from '../lib/app-registry';
import { CHARACTERS } from './characters';

interface ToolSuccess<T> { ok: true; data: T }
interface ToolFailure { ok: false; error: string }
type ToolResult<T> = ToolSuccess<T> | ToolFailure;

const ok = <T>(data: T): ToolSuccess<T> => ({ ok: true, data });
const fail = (error: string): ToolFailure => ({ ok: false, error });

// ────────────────────────────────────────────────────────────────────────────
// listerApps — returns the registered apps + their sections (best effort).
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
// ouvrirApp — opens the window of an app.
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

/** Va sur une section.
 *
 *  La version precedente emettait un evenement `coach-os:open-app-section` que
 *  PERSONNE n'ecoutait, et rendait `ok` — le modele croyait avoir navigue alors
 *  que rien ne bougeait. Un outil qui ment est pire qu'un outil absent : le
 *  modele batit sa reponse dessus.
 *
 *  On clique donc le vrai bouton, et on echoue franchement si la section
 *  n'existe pas, en listant celles qui existent pour que le modele se corrige.
 */
export async function allerASection(
  appId: string,
  sectionId: string,
): Promise<ToolResult<{ appId: string; sectionId: string }>> {
  const open = ouvrirApp(appId);
  if (!open.ok) return open;
  try {
    const disponibles = await attendreSections();
    if (disponibles.length === 0) {
      return fail(`L'app "${appId}" est ouverte mais n'expose aucune section.`);
    }
    // Tolerant a la casse et aux espaces : le modele ecrit « Client Pipeline »
    // la ou l'attribut porte exactement le libelle affiche.
    const norme = (s: string) => s.trim().toLowerCase();
    const cible = disponibles.find((s) => norme(s) === norme(sectionId));
    if (!cible) {
      return fail(
        `Section "${sectionId}" introuvable dans "${appId}". Sections disponibles : ${disponibles.join(', ')}.`,
      );
    }
    const bouton = document.querySelector<HTMLElement>(
      `[data-section="${CSS.escape(cible)}"]`,
    );
    if (!bouton) return fail(`Bouton de la section "${cible}" introuvable.`);
    bouton.click();
    return ok({ appId, sectionId: cible });
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// lireCollection — returns the items of a CMS collection. Useful for the
// assistant to summarise "your clients" or "your tasks" without having to
// open the app first.
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
// changerTheme — sets the global theme (or a per-app override).
// ────────────────────────────────────────────────────────────────────────────
export function changerTheme(themeId: string, appId?: string): ToolResult<{ themeId: string; appId?: string; known: string[] }> {
  if (!themeId || typeof themeId !== 'string') return fail('themeId must be a non-empty string');
  const known = THEME_META.map((t) => t.id);
  if (!known.includes(themeId)) {
    return fail(`Unknown themeId: "${themeId}". Known themes: ${known.join(', ')}.`);
  }
  try {
    const store = useThemeStore.getState();
    if (appId) {
      // Use the public setAppTheme — it bumps a sentinel so the UI re-renders.
      store.setAppTheme(appId, themeId);
    } else {
      store.setGlobalTheme(themeId);
    }
    return ok({ themeId, appId, known });
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience used by the Settings page — not part of the wire tool surface.
// ────────────────────────────────────────────────────────────────────────────
export function listAssistantCharacters() {
  return CHARACTERS.map((c) => ({ id: c.id, name: c.name, width: c.width, height: c.height }));
}
