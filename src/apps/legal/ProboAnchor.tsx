/** ProboAnchor — point d'ancrage pour une instance Probo auto-hébergée.
 *
 *  Probo (https://www.probo.com/) est une plateforme de conformité
 *  open-source pensée pour les petites structures. La cible de déploiement
 *  est Render (cf. SOCLE.md § Hébergement du PoC).
 *
 *  Pourquoi cette logique existe (BRIEF L §2) :
 *    Probo est sous AGPL-3.0, et donc Probo s'héberge A COTE, tel quel,
 *    jamais fourché dans Coach OS. Coach OS le consomme par cadre
 *    embarqué quand l'utilisateur a déployé Probo sur Render. L'URL est
 *    configurable par la variable d'environnement VITE_PROBO_URL.
 *
 *  Comportement :
 *    - VITE_PROBO_URL vide (mode démo, ou pas encore déployé) :
 *      on affiche un encart « Aucune instance branchée » avec la marche
 *      à suivre.
 *    - VITE_PROBO_URL renseignée : on sonde l'URL avant d'afficher
 *      l'iframe. La sonde distingue trois cas :
 *        1. service OK → on affiche l'iframe ;
 *        2. service refuse l'iframe (X-Frame-Options, CSP frame-ancestors)
 *           → message clair citant l'en-tête HTTP fautif + lien
 *           d'ouverture externe ;
 *        3. service injoignable (timeout, connexion refusée, 5xx)
 *           → message d'erreur avec la raison réseau et la marche à suivre.
 *
 *  Jamais de cadre blanc silencieux : si la sonde échoue, on dit pourquoi.
 */
import { useEffect, useState } from 'react';
import { Server, ExternalLink, Eye, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../_ui/kit';
import { probe, frameBlockReason, type ProbeResult } from '../it-rd/embedded/healthCheck';

const APP_ACCENT = '#0f172a';
const PROBO_URL: string = (import.meta.env.VITE_PROBO_URL as string | undefined) ?? '';

export function ProboAnchor() {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <Card title="Probo — ancrage iframe">
      <div className="px-5 py-4 flex flex-col gap-3">
        <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          Cet emplacement accueillera l'instance Probo auto-hébergée du client. C'est l'iframe de rechange si la
          collection CMS « Cadres / Contrôles / Écarts » ne suffit pas — par exemple pour les preuves photographiques
          ou la signature électronique des politiques.
        </p>

        {PROBO_URL ? (
          <ProboIframeSlot url={PROBO_URL} />
        ) : (
          <EmptyState />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHelp((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              background: 'var(--theme-surface)',
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--panel-border)',
            }}
          >
            {showHelp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHelp ? 'Masquer le détail' : 'Comment brancher ?'}
          </button>
          <a
            href="https://www.probo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              background: APP_ACCENT,
              color: '#ffffff',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Site Probo
          </a>
        </div>

        {showHelp && (
          <ol
            className="rounded-lg p-3 text-[11.5px] flex flex-col gap-1.5"
            style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}
          >
            <li><span className="font-mono mr-1.5">1.</span> Déployer Probo : <code>deploy/probo/render.yaml</code> sur Render (Docker natif, image officielle, 25 services gratuits).</li>
            <li><span className="font-mono mr-1.5">2.</span> Pointer un sous-domaine du coach (ex. <code>probo.kalybana.com</code>) via Hostinger DNS.</li>
            <li><span className="font-mono mr-1.5">3.</span> Exporter l'URL : variable d'environnement <code>VITE_PROBO_URL</code> côté Vercel.</li>
            <li><span className="font-mono mr-1.5">4.</span> L'iframe remplace l'encart ci-dessus, dans le même périmètre visuel.</li>
          </ol>
        )}
      </div>
    </Card>
  );
}

/** Encart affiché quand VITE_PROBO_URL est vide — démo, ou pas encore
 *  déployé. Aucun fetch n'est lancé. */
function EmptyState() {
  return (
    <div
      className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-5 py-10 gap-2"
      style={{
        borderColor: 'var(--panel-border)',
        background: 'var(--theme-surface-hover)',
      }}
      data-legal-anchor="probo-iframe"
      data-probo-state="empty"
    >
      <Server className="w-6 h-6" style={{ color: APP_ACCENT, opacity: 0.5 }} />
      <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
        Aucune instance Probo branchée
      </div>
      <div className="text-[11.5px] max-w-md" style={{ color: 'var(--theme-text-dim)' }}>
        Pour brancher Probo : déployer <code>deploy/probo/render.yaml</code> sur Render
        (cf. <code>deploy/probo/README.md</code>), puis exposer l'URL via la variable
        d'environnement <code>VITE_PROBO_URL</code>. L'ancrage s'activera automatiquement.
      </div>
    </div>
  );
}

/** Slot iframe avec sonde. Trois issues possibles :
 *    1. probe OK → iframe ;
 *    2. probe OK mais X-Frame-Options / CSP frame-ancestors → message
 *       citant l'en-tête fautif + lien externe ;
 *    3. probe KO → message d'erreur réseau. */
function ProboIframeSlot({ url }: { url: string }) {
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(true);

  const runProbe = () => {
    setProbing(true);
    void probe(url)
      .then((r) => {
        setResult(r);
        setProbing(false);
      });
  };

  useEffect(() => { runProbe(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [url]);

  return (
    <div
      data-legal-anchor="probo-iframe"
      data-probo-url={url}
      data-probo-state={
        probing ? 'probing' : result?.status.kind === 'ok' ? 'live' : result?.status.kind ?? 'unknown'
      }
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ borderColor: 'var(--panel-border)', minHeight: 360, background: 'var(--theme-bg)' }}
    >
      <header
        className="px-3 py-2 flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider border-b"
        style={{ background: 'var(--canvas)', color: 'var(--theme-muted)', borderColor: 'var(--panel-border)' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor(probing, result) }} />
          <span className="truncate font-semibold" style={{ color: 'var(--theme-text)' }}>Probo</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[10px]">{statusLabel(probing, result)}</span>
          <button type="button" onClick={runProbe} aria-label="Re-sonder Probo" className="text-slate-400 hover:text-slate-700">
            <RefreshCw size={11} />
          </button>
        </span>
      </header>

      <div className="flex-1 min-h-0 relative">
        {probing && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <RefreshCw size={14} className="animate-spin" />
            Probe en cours…
          </div>
        )}

        {!probing && result?.status.kind === 'ok' && (
          <iframe
            key={url}
            src={url}
            title="Probo"
            data-testid="probo-iframe"
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}

        {!probing && result?.status.kind === 'unembeddable' && (
          <FrameBlocked url={url} http={result.status.http} reason={frameBlockReason(result.status.headers) ?? `HTTP ${result.status.http}`} />
        )}

        {!probing && result?.status.kind === 'http-error' && (
          <HttpError url={url} http={result.status.http} reason={result.status.reason} />
        )}

        {!probing && result?.status.kind === 'network-error' && (
          <NetworkError url={url} reason={result.status.reason} duration={result.duration} />
        )}
      </div>
    </div>
  );
}

function statusColor(probing: boolean, r: ProbeResult | null): string {
  if (probing) return '#94a3b8';
  if (!r) return '#94a3b8';
  if (r.status.kind === 'ok') return '#16a34a';
  if (r.status.kind === 'unembeddable') return '#f59e0b';
  return '#dc2626';
}
function statusLabel(probing: boolean, r: ProbeResult | null): string {
  if (probing) return 'probe…';
  if (!r) return 'unknown';
  if (r.status.kind === 'ok') return `OK · ${r.duration}ms`;
  if (r.status.kind === 'unembeddable') return `REFUSED · ${r.duration}ms`;
  if (r.status.kind === 'http-error') return `HTTP ${r.status.http} · ${r.duration}ms`;
  return `DOWN · ${r.duration}ms`;
}

function FrameBlocked({ url, http, reason }: { url: string; http: number; reason: string }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center" data-testid="probo-blocked">
      <AlertTriangle size={20} className="text-amber-600" />
      <div className="text-sm font-semibold text-slate-900">Probo refuse d'être embarqué</div>
      <div className="text-[12px] text-slate-600 max-w-md">
        L'en-tête HTTP suivant bloque l'inclusion dans une iframe. C'est le réglage
        par défaut de Probo (plus sûr).
      </div>
      <pre className="mt-1 rounded-lg p-2 text-[11px] font-mono" style={{ background: '#fef3c7', color: '#92400e' }}>{reason}</pre>
      <div className="text-[11.5px] text-slate-500 mt-1">HTTP {http} · {url}</div>
      <div className="text-[11.5px] text-slate-600 mt-2 max-w-md">
        Pour autoriser l'iframe côté Probo : variable d'environnement
        <code className="mx-1">X_FRAME_OPTIONS_DENY=false</code> dans Render, puis redéployer.
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ouvrir Probo dans un nouvel onglet <ExternalLink size={11} />
      </a>
    </div>
  );
}

function HttpError({ url, http, reason }: { url: string; http: number; reason: string }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center">
      <AlertTriangle size={20} className="text-red-600" />
      <div className="text-sm font-semibold text-slate-900">Probo répond mais en erreur</div>
      <div className="text-[12px] text-slate-600">{reason}</div>
      <pre className="mt-1 rounded-lg p-2 text-[11px] font-mono" style={{ background: '#fee2e2', color: '#991b1b' }}>{`HTTP ${http}`}</pre>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ouvrir Probo dans un nouvel onglet <ExternalLink size={11} />
      </a>
    </div>
  );
}

function NetworkError({ url, reason, duration }: { url: string; reason: string; duration: number }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center" data-testid="probo-down">
      <AlertTriangle size={20} className="text-red-600" />
      <div className="text-sm font-semibold text-slate-900">Probo est injoignable</div>
      <div className="text-[12px] text-slate-600 max-w-md">{reason}</div>
      <div className="text-[11.5px] text-slate-500 mt-1">Après {duration} ms d'attente, la connexion a échoué.</div>
      <pre className="mt-1 rounded-lg p-2 text-[11px] font-mono" style={{ background: '#fee2e2', color: '#991b1b' }}>{url}</pre>
      <div className="text-[11.5px] text-slate-600 mt-2 max-w-md">
        Vérifiez que Probo tourne sur Render et que l'URL est exacte.
        Le plan Starter gratuit suspend le service après 15 min d'inactivité —
        un re-déploiement le réveille.
      </div>
    </div>
  );
}