/** ServiceFrame — one card per service, with health probe + iframe fallback.
 *
 *  Lifecycle:
 *    1. Mount → if `service.knownStatus === 'down'`, skip the probe
 *       entirely (avoids ERR_CONNECTION_REFUSED on every refresh for
 *       services we already know are dead) and render the explicit
 *       "hors service" UI.
 *    2. Otherwise start a probe against `service.probe || service.url`.
 *    3. While probing: render a small "checking" pill.
 *    4. Probe OK + no frame block → render the iframe, full-bleed.
 *    5. Probe OK + frame block → render an error card with the exact
 *       header that explains the refusal (the brief explicitly requires
 *       this — an empty iframe is forbidden).
 *    6. Probe failed → render an error card with the network reason.
 *
 *  External services (LangSmith) get an "Open in new tab" affordance and
 *  no iframe attempt.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, ExternalLink, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { EmbeddedService } from './services';
import { probe, type ProbeResult } from './healthCheck';

interface Props {
  service: EmbeddedService;
}

export function ServiceFrame({ service }: Props) {
  const [probe_, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(service.knownStatus !== 'down');

  const runProbe = () => {
    setProbing(true);
    void probe(service.probe ?? service.url)
      .then((res) => {
        setProbe(res);
        setProbing(false);
      });
  };

  useEffect(() => {
    // Skip the probe when the service is known to be down — otherwise
    // every refresh of the panel would fire a HEAD that fails with
    // ERR_CONNECTION_REFUSED, polluting the console. The user sees a
    // clear "hors service" badge instead, and the operator knows from
    // `service.knownStatus` what to fix.
    if (service.knownStatus === 'down') {
      setProbing(false);
      return;
    }
    runProbe();
    // The service is the dependency: changing the URL re-probes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.id, service.url]);

  return (
    <div
      data-testid={`embedded-service-${service.id}`}
      data-service-id={service.id}
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', minHeight: 320 }}
    >
      {/* Header — name + health badge */}
      <header
        className="px-4 py-2.5 flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider"
        style={{ background: 'var(--canvas)', color: 'var(--theme-muted)', borderBottom: '1px solid var(--panel-border)' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: statusColor(probing, probe_, service.knownStatus) }}
          />
          <span className="truncate font-semibold" style={{ color: 'var(--theme-text)' }}>
            {service.label}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[10px]">{statusLabel(probing, probe_, service.knownStatus)}</span>
          <button
            type="button"
            onClick={runProbe}
            aria-label={`Re-prober ${service.label}`}
            className="text-slate-400 hover:text-slate-700"
          >
            <RefreshCw size={11} />
          </button>
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 relative">
        {probing && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Probe en cours…
          </div>
        )}

        {/* Services flagged knownStatus === 'down' skip the probe entirely
            (cf. effect above) and render an explicit "hors service" UI. */}
        {!probing && service.knownStatus === 'down' && (
          <KnownDown service={service} />
        )}

        {!probing && service.knownStatus !== 'down' && probe_ && probe_.status.kind === 'ok' && !service.external && (
          <motion.iframe
            key={service.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={service.url}
            title={service.label}
            data-testid={`embedded-iframe-${service.id}`}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}

        {/* External services never get an iframe — the brief requires an
            open-in-new-tab affordance instead of a silent white frame. */}
        {service.external && (
          <ExternalOnly service={service} />
        )}

        {!probing && service.knownStatus !== 'down' && probe_ && probe_.status.kind === 'unembeddable' && (
          <FrameBlocked
            service={service}
            http={probe_.status.http}
            reason={probe_.status.headers['x-frame-options']
              ? `X-Frame-Options: ${probe_.status.headers['x-frame-options']}`
              : probe_.status.headers['content-security-policy']
              ? `CSP frame-ancestors: ${probe_.status.headers['content-security-policy']}`
              : `HTTP ${probe_.status.http}`}
          />
        )}

        {!probing && service.knownStatus !== 'down' && probe_ && probe_.status.kind === 'http-error' && (
          <HttpError service={service} http={probe_.status.http} reason={probe_.status.reason} />
        )}

        {!probing && service.knownStatus !== 'down' && probe_ && probe_.status.kind === 'network-error' && (
          <NetworkError service={service} reason={probe_.status.reason} duration={probe_.duration} />
        )}
      </div>

      {/* Footer note */}
      {service.note && (
        <div
          className="px-4 py-2 text-[10.5px]"
          style={{ color: 'var(--theme-muted)', borderTop: '1px solid var(--panel-border)' }}
        >
          {service.note}
        </div>
      )}
    </div>
  );
}

function statusColor(probing: boolean, probe_: ProbeResult | null, knownStatus: EmbeddedService['knownStatus']): string {
  if (knownStatus === 'down') return '#dc2626';
  if (probing) return '#94a3b8';
  if (!probe_) return '#94a3b8';
  if (probe_.status.kind === 'ok') return '#16a34a';
  if (probe_.status.kind === 'unembeddable') return '#f59e0b';
  return '#dc2626';
}

function statusLabel(probing: boolean, probe_: ProbeResult | null, knownStatus: EmbeddedService['knownStatus']): string {
  if (knownStatus === 'down') return 'hors service';
  if (probing) return 'probe…';
  if (!probe_) return 'unknown';
  if (probe_.status.kind === 'ok') return `OK ${probe_.status.http} · ${probe_.duration}ms`;
  if (probe_.status.kind === 'unembeddable') return `REFUSED · ${probe_.duration}ms`;
  if (probe_.status.kind === 'http-error') return `HTTP ${probe_.status.http} · ${probe_.duration}ms`;
  return `DOWN · ${probe_.duration}ms`;
}

function FrameBlocked({ service, http, reason }: { service: EmbeddedService; http: number; reason: string }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center" data-testid={`embedded-blocked-${service.id}`}>
      <AlertTriangle size={20} className="text-amber-600" />
      <div className="text-sm font-semibold text-slate-900">
        Le service refuse d etre embarque
      </div>
      <div className="text-[12px] text-slate-600 max-w-md">
        L en-tete HTTP suivant bloque l inclusion dans une iframe :
      </div>
      <pre
        className="mt-1 rounded-lg p-2 text-[11px] font-mono"
        style={{ background: '#fef3c7', color: '#92400e' }}
      >{reason}</pre>
      <div className="text-[11.5px] text-slate-500 mt-1">HTTP {http} · {service.url}</div>
      <a
        href={service.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ouvrir dans un nouvel onglet <ExternalLink size={11} />
      </a>
    </div>
  );
}

function HttpError({ service, http, reason }: { service: EmbeddedService; http: number; reason: string }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center">
      <AlertTriangle size={20} className="text-red-600" />
      <div className="text-sm font-semibold text-slate-900">
        Le service repond mais en erreur
      </div>
      <div className="text-[12px] text-slate-600">{reason}</div>
      <pre
        className="mt-1 rounded-lg p-2 text-[11px] font-mono"
        style={{ background: '#fee2e2', color: '#991b1b' }}
      >{`HTTP ${http}`}</pre>
      <a
        href={service.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ouvrir dans un nouvel onglet <ExternalLink size={11} />
      </a>
    </div>
  );
}

function NetworkError({ service, reason, duration }: { service: EmbeddedService; reason: string; duration: number }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center">
      <AlertTriangle size={20} className="text-red-600" />
      <div className="text-sm font-semibold text-slate-900">Service injoignable</div>
      <div className="text-[12px] text-slate-600 max-w-md">{reason}</div>
      <div className="text-[11.5px] text-slate-500 mt-1">
        Apres {duration} ms d attente, la connexion a echoue.
      </div>
      <pre
        className="mt-1 rounded-lg p-2 text-[11px] font-mono"
        style={{ background: '#fee2e2', color: '#991b1b' }}
      >{service.url}</pre>
      <div className="text-[11.5px] text-slate-600 mt-2 max-w-md">
        Verifiez que le service tourne et que l URL est correcte.
      </div>
    </div>
  );
}

function ExternalHint({ service }: { service: EmbeddedService }) {
  return (
    <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
      <CheckCircle2 size={10} /> externe
    </div>
  );
}

function ExternalOnly({ service }: { service: EmbeddedService }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center" data-testid={`embedded-external-${service.id}`}>
      <CheckCircle2 size={20} className="text-emerald-700" />
      <div className="text-sm font-semibold text-slate-900">Service externe</div>
      <div className="text-[12px] text-slate-600 max-w-md">
        Ce service refuse d'etre embarque — il sera ouvert dans un nouvel onglet.
      </div>
      <a
        href={service.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ouvrir dans un nouvel onglet <ExternalLink size={11} />
      </a>
    </div>
  );
}

/** KnownDown — explicit "hors service" badge for services we already know
 *  are dead (so we don't fire a probe that would fail noisily in the
 *  console). The user sees a clear status and the URL is shown so an
 *  operator can investigate. */
function KnownDown({ service }: { service: EmbeddedService }) {
  return (
    <div
      className="absolute inset-0 p-5 flex flex-col gap-2 items-start justify-center"
      data-testid={`embedded-known-down-${service.id}`}
    >
      <AlertTriangle size={20} className="text-red-600" />
      <div className="text-sm font-semibold text-slate-900">Service hors service</div>
      <div className="text-[12px] text-slate-600 max-w-md">
        L'état de ce service est connu — la sonde n'est pas lancée pour éviter
        une erreur réseau récurrente dans la console.
      </div>
      <pre
        className="mt-1 rounded-lg p-2 text-[11px] font-mono"
        style={{ background: '#fee2e2', color: '#991b1b' }}
      >{service.url}</pre>
      {service.note && (
        <div className="text-[11.5px] text-slate-600 mt-1 max-w-md">
          {service.note}
        </div>
      )}
    </div>
  );
}
