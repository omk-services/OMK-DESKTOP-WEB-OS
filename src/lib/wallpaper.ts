/** wallpaper — desktop background image store.
 *
 *  Why a dedicated key instead of putting it in the theme store:
 *    The theme store persists via zustand `persist` + `partialize`. A single
 *    4-MB data URL would balloon the JSON blob on every write (even a theme
 *    toggle would re-serialize the image) and risk tripping `QuotaExceededError`
 *    on the entire persistence layer — which would silently wipe every theme
 *    override the user has set. Same risk as the original demoShell `hasSeenCitadel`
 *    flag, which lives in its own localStorage key for exactly this reason.
 *
 *  Image data is a JPEG data URL (resized to <= 2560px on the long edge and
 *  re-encoded at ~0.85 quality) so a 12-MP phone photo typically lands under
 *  1 MB, well below the ~5 MB browser budget. We do NOT split the data into
 *  IndexedDB chunks — single key keeps read/write atomic.
 *
 *  Fit follows the CSS background-size vocabulary: 'cover' | 'contain' | 'repeat'.
 */

import { useSyncExternalStore } from 'react';
import { createScopedStorage } from './auth/storage-scope';

const KEY_DATA = 'wallpaper-data-v1';
const KEY_FIT = 'wallpaper-fit-v1';

export type WallpaperFit = 'cover' | 'contain' | 'repeat';

const VALID_FIT: ReadonlySet<WallpaperFit> = new Set(['cover', 'contain', 'repeat']);

export const DEFAULT_FIT: WallpaperFit = 'cover';

/** Read the current wallpaper (data URL + fit). Returns nulls when unset. */
export function getWallpaper(): { dataUrl: string | null; fit: WallpaperFit } {
  let dataUrl: string | null = null;
  let fit: WallpaperFit = DEFAULT_FIT;
  try {
    const storage = createScopedStorage();
    const d = storage.getItem(KEY_DATA);
    if (d && d.startsWith('data:image/')) dataUrl = d;
    const f = storage.getItem(KEY_FIT);
    if (f && VALID_FIT.has(f as WallpaperFit)) fit = f as WallpaperFit;
  } catch {
    // localStorage may be unavailable (private browsing, sandboxed iframe)
  }
  return { dataUrl, fit };
}

/* ------------------------------ abonnement ------------------------------
 *
 *  `localStorage` n'est pas reactif. Le bureau lisait `getWallpaper()` dans son
 *  corps de rendu : ecrire une nouvelle image depuis Settings ne declenchait
 *  aucun rendu, et le fond n'apparaissait qu'au prochain rendu provoque par
 *  autre chose — un clic dans le vide, l'ouverture d'une fenetre. Quelqu'un qui
 *  ignore ce comportement conclut que son image n'a pas ete prise.
 *
 *  On notifie donc explicitement a chaque ecriture.
 */

type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();

function notifier(): void {
  instantane = null;              // invalide le cache avant de reveiller React
  for (const e of ecouteurs) e();
}

function souscrire(e: Ecouteur): () => void {
  ecouteurs.add(e);
  // Autre onglet : l'evenement `storage` ne se declenche que pour les AUTRES
  // documents, jamais pour celui qui ecrit — d'ou le `notifier()` ci-dessus.
  const surStockage = (ev: StorageEvent) => {
    // L'événement `storage` ne fire que pour les AUTRES onglets, et pour
    // une clé LITTÉRALE. Nos clés sont scopées (préfixées par
    // `coach-os:<user>:<tenant>:`), donc le nom logique ne matche jamais
    // directement depuis un autre onglet. On accepte `null` (= clear
    // global) comme signal de reset et on notifie au cas où le code
    // applicatif a déclenché un purge total (cas signOut).
    if (ev.key === null) notifier();
  };
  window.addEventListener('storage', surStockage);
  return () => {
    ecouteurs.delete(e);
    window.removeEventListener('storage', surStockage);
  };
}

/** Instantane memorise.
 *
 *  `useSyncExternalStore` compare les instantanes par IDENTITE. Renvoyer
 *  l'objet frais de `getWallpaper()` a chaque appel donne un nouvel objet a
 *  chaque fois : React conclut que l'etat a change, redemande un rendu, qui
 *  reconstruit un objet, et ainsi de suite — « getSnapshot should be cached »
 *  puis « Maximum update depth exceeded ». C'est la quatrieme fois que ce piege
 *  se presente dans cet ecosysteme. Le cache n'est pas une optimisation, c'est
 *  la condition pour que la page s'affiche.
 */
let instantane: { dataUrl: string | null; fit: WallpaperFit } | null = null;

function lireInstantane(): { dataUrl: string | null; fit: WallpaperFit } {
  if (instantane === null) instantane = getWallpaper();
  return instantane;
}

/** Instantane serveur — pas de `localStorage` au rendu SSR. Constante figee,
 *  pour la meme raison d'identite que ci-dessus. */
const INSTANTANE_SERVEUR: { dataUrl: string | null; fit: WallpaperFit } = {
  dataUrl: null,
  fit: DEFAULT_FIT,
};

/** Fond d'ecran courant, reactif. Se met a jour des l'ecriture, sans clic. */
export function useWallpaper(): { dataUrl: string | null; fit: WallpaperFit } {
  return useSyncExternalStore(souscrire, lireInstantane, () => INSTANTANE_SERVEUR);
}

/** Persist a wallpaper data URL + fit. Returns false if the browser refuses
 *  the write (QuotaExceededError, SecurityError, …) — callers must surface
 *  the failure to the user rather than silently keeping an image that is not
 *  actually on disk. */
export function setWallpaper(dataUrl: string, fit: WallpaperFit): { ok: true } | { ok: false; error: string } {
  try {
    const storage = createScopedStorage();
    storage.setItem(KEY_DATA, dataUrl);
    storage.setItem(KEY_FIT, fit);
    notifier();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Persist only the fit selector (no image write). */
export function setWallpaperFit(fit: WallpaperFit): { ok: true } | { ok: false; error: string } {
  try {
    createScopedStorage().setItem(KEY_FIT, fit);
    notifier();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Clear the wallpaper. Frees the entire ~1-4 MB slot. */
export function clearWallpaper(): void {
  try {
    const storage = createScopedStorage();
    storage.removeItem(KEY_DATA);
    storage.removeItem(KEY_FIT);
  } catch {
    // best-effort
  }
  // Hors du `try` : meme si l'effacement a echoue, l'interface doit se resynchroniser
  // sur l'etat reel plutot que de rester sur un affichage perime.
  notifier();
}

/** Maximum long-edge dimension in pixels. 2560 is plenty for any desktop
 *  monitor sold in 2026 and keeps the encoded JPEG under 1 MB for typical
 *  photographs. */
export const MAX_LONG_EDGE = 2560;

/** JPEG re-export quality. 0.85 is the standard "visually lossless" trade-off
 *  for photographs and saves ~60% over 1.0 with no perceptible quality drop. */
export const JPEG_QUALITY = 0.85;

/** Read a File / Blob and return a downscaled JPEG data URL.
 *  Throws Error('unsupported') for non-image inputs.
 *  Throws Error('decode') if the browser can't decode the bytes.
 *  Caller is responsible for catching both. */
export async function resizeImageToDataUrl(file: File | Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('unsupported');
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('decode');

  const w0 = bitmap.width;
  const h0 = bitmap.height;
  const longEdge = Math.max(w0, h0);
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  // OffscreenCanvas where available (Chromium 69+, Firefox 105+, Safari 16.4+).
  // Falls back to a DOM <canvas> for older browsers; the app runs in Vite dev
  // so jsdom tests don't care, only real browsers do.
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(w, h);
    ctx = canvas.getContext('2d');
  } else {
    const el = document.createElement('canvas');
    el.width = w;
    el.height = h;
    canvas = el;
    ctx = el.getContext('2d');
  }
  if (!ctx) throw new Error('decode');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  if (canvas instanceof HTMLCanvasElement) {
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  }
  // OffscreenCanvas path
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('decode'));
    reader.readAsDataURL(blob);
  });
}