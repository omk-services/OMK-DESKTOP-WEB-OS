/** Health probe for an embedded service.
 *
 *  Strategy:
 *    - Try a HEAD request first (smallest payload, fastest signal).
 *    - Fall back to a GET (some servers reject HEAD even when alive).
 *    - 3-second timeout. Anything past that is "down" for our purposes.
 *
 *  We also capture the response headers so the UI can show *why* an embed
 *  fails (X-Frame-Options: DENY, Content-Security-Policy: frame-ancestors,
 *  5xx, connection refused, etc.) — the brief explicitly asks for the
 *  exact HTTP signal that explains a refused embed.
 */

export type ProbeStatus =
  | { kind: 'ok'; http: number }
  | { kind: 'http-error'; http: number; reason: string }
  | { kind: 'network-error'; reason: string }
  | { kind: 'unembeddable'; http: number; headers: Record<string, string> };

export interface ProbeResult {
  status: ProbeStatus;
  /** Captured headers — used to surface the *real* reason a frame fails. */
  headers: Record<string, string>;
  /** ms elapsed. */
  duration: number;
  /** The URL we actually probed. */
  url: string;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

/** Inspect a response for frame-blocking headers. Returns the most specific
 *  reason found, or null if no frame restriction is present. */
export function frameBlockReason(headers: Record<string, string>): string | null {
  const xfo = headers['x-frame-options'];
  if (xfo) {
    if (xfo.toUpperCase().includes('DENY')) return `X-Frame-Options: DENY`;
    if (xfo.toUpperCase().includes('SAMEORIGIN')) return `X-Frame-Options: SAMEORIGIN`;
    return `X-Frame-Options: ${xfo}`;
  }
  const csp = headers['content-security-policy'];
  if (csp) {
    const m = csp.match(/frame-ancestors\s+([^;]+)/i);
    if (m) {
      const v = (m[1] ?? '').trim();
      if (v.includes("'none'")) return `CSP frame-ancestors: 'none'`;
      if (v.includes("'self'")) return `CSP frame-ancestors: 'self'`;
      return `CSP frame-ancestors: ${v}`;
    }
  }
  return null;
}

/** Probe a URL with HEAD then GET fallback.
 *
 *  Uses `mode: 'no-cors'` so CORS misconfiguration does not masquerade as
 *  a network error. CORS only blocks JS reads; an <iframe src=...> ignores
 *  CORS and only cares about X-Frame-Options / CSP frame-ancestors.
 *  Therefore a CORS-rejected fetch can still load fine in the iframe —
 *  our probe must reflect that. */
export async function probe(url: string, timeoutMs = 3000): Promise<ProbeResult> {
  const start = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    // Try HEAD first.
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, mode: 'no-cors' });
    } catch {
      res = await fetch(url, { method: 'GET', signal: ctrl.signal, mode: 'no-cors' });
    }
    clearTimeout(timer);
    const duration = Math.round(performance.now() - start);
    // `mode: no-cors` returns an opaque response — headers are NOT readable
    // (they come back as empty). That is fine: we cannot detect X-Frame-
    // Options from JS in this mode, but we can still try to embed. If the
    // server blocks via X-Frame-Options, the iframe renders an error page
    // and the user sees it; we surface that fact via a separate "embed
    // attempt failed" check below using a real GET.
    const http = res.status;
    // Opaque response -> treat as "alive" for the purposes of showing the
    // iframe. We still attempt an embed.
    if (res.type === 'opaque') {
      return {
        status: { kind: 'ok', http: 0 },
        headers: {},
        duration,
        url,
      };
    }
    const headers = headersToRecord(res.headers);

    const blocked = frameBlockReason(headers);
    if (blocked) {
      return { status: { kind: 'unembeddable', http, headers }, headers, duration, url };
    }
    if (res.ok) {
      return { status: { kind: 'ok', http }, headers, duration, url };
    }
    return {
      status: { kind: 'http-error', http, reason: `HTTP ${http}` },
      headers,
      duration,
      url,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const duration = Math.round(performance.now() - start);
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error';
    return {
      status: { kind: 'network-error', reason },
      headers: {},
      duration,
      url,
    };
  }
}
