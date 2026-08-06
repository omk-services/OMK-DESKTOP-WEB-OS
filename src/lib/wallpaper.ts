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

const KEY_DATA = 'coach-os-wallpaper-data-v1';
const KEY_FIT = 'coach-os-wallpaper-fit-v1';

export type WallpaperFit = 'cover' | 'contain' | 'repeat';

const VALID_FIT: ReadonlySet<WallpaperFit> = new Set(['cover', 'contain', 'repeat']);

export const DEFAULT_FIT: WallpaperFit = 'cover';

/** Read the current wallpaper (data URL + fit). Returns nulls when unset. */
export function getWallpaper(): { dataUrl: string | null; fit: WallpaperFit } {
  let dataUrl: string | null = null;
  let fit: WallpaperFit = DEFAULT_FIT;
  try {
    const d = localStorage.getItem(KEY_DATA);
    if (d && d.startsWith('data:image/')) dataUrl = d;
    const f = localStorage.getItem(KEY_FIT);
    if (f && VALID_FIT.has(f as WallpaperFit)) fit = f as WallpaperFit;
  } catch {
    // localStorage may be unavailable (private browsing, sandboxed iframe)
  }
  return { dataUrl, fit };
}

/** Persist a wallpaper data URL + fit. Returns false if the browser refuses
 *  the write (QuotaExceededError, SecurityError, …) — callers must surface
 *  the failure to the user rather than silently keeping an image that is not
 *  actually on disk. */
export function setWallpaper(dataUrl: string, fit: WallpaperFit): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(KEY_DATA, dataUrl);
    localStorage.setItem(KEY_FIT, fit);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Persist only the fit selector (no image write). */
export function setWallpaperFit(fit: WallpaperFit): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(KEY_FIT, fit);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Clear the wallpaper. Frees the entire ~1-4 MB slot. */
export function clearWallpaper(): void {
  try {
    localStorage.removeItem(KEY_DATA);
    localStorage.removeItem(KEY_FIT);
  } catch {
    // best-effort
  }
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