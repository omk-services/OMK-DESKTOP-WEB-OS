// api/_agent/backends/model.ts
// Backend "modele" : appel direct au SDK AI avec un fournisseur LLM.
//
// C'est le dos le plus rapide : pas de processus externe, pas d'aller-retour
// vers Multica. Il reutilise `streamText` du SDK AI avec le fournisseur
// demande par l'agent (defaut : AGENT_PROVIDER de l'environnement, ou
// `minimax` a defaut).

import { convertToModelMessages, streamText, type ToolSet, type UIMessage } from 'ai';
import { getProvider, isProviderAvailable, resolveProviderId, type ProviderId } from '../providers.js';
import { tools } from '../tools.js';
import { composeSystem } from '../prompt.js';

export interface ModelChunk {
  type: 'delta' | 'reason' | 'status';
  text: string;
}

export interface ModelHandle {
  kill: () => void;
  cancelled: boolean;
}

export interface ModelPromptOptions {
  /** Liste des messages UI du SDK, telle que generee par useChat. */
  messages: UIMessage[];
  /** Identifiant du fournisseur. Si absent, on prend l'environnement. */
  provider?: string;
  /** Invite systeme additionnelle. */
  system?: string;
  /** Timeout dur en ms (le SDK ne suporte pas de cancel propre, mais on
   *  peut fermer le stream cote Node). */
  timeoutMs?: number;
  onChunk: (c: ModelChunk) => void;
  onDone: (info: { stopReason: string; error?: string }) => void;
}

export function demarrerSessionModel(opts: ModelPromptOptions): ModelHandle {
  const handle: ModelHandle = { kill: () => {}, cancelled: false };

  const requested = opts.provider ?? process.env.AGENT_PROVIDER;
  const resolvedId = resolveProviderId(requested ?? undefined) as ProviderId;
  if (!isProviderAvailable(resolvedId)) {
    const spec = getProvider(resolvedId);
    queueMicrotask(() =>
      opts.onDone({
        stopReason: 'error',
        error: `Fournisseur "${resolvedId}" indisponible : ${spec.envVar} n'est pas defini.`,
      }),
    );
    handle.cancelled = true;
    return handle;
  }

  const spec = getProvider(resolvedId);
  let model;
  try {
    model = spec.build();
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    queueMicrotask(() => opts.onDone({ stopReason: 'error', error: `Construction du modele : ${m}` }));
    handle.cancelled = true;
    return handle;
  }

  const instructions = composeSystem(opts.system);

  // L'init du stream est async : convertToModelMessages await quelque chose
  // selon le SDK. On embarque la totalite dans une IIFE async.
  (async () => {
    let result: Awaited<ReturnType<typeof streamText>>;
    try {
      result = streamText({
        model,
        system: instructions,
        messages: await convertToModelMessages(opts.messages),
        tools: tools as unknown as ToolSet,
        abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
      });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      opts.onDone({ stopReason: 'error', error: `streamText init : ${m}` });
      return;
    }

    let fini = false;
    const termineAvec = (info: Parameters<ModelPromptOptions['onDone']>[0]) => {
      if (fini) return;
      fini = true;
      opts.onDone(info);
    };
    try {
      for await (const part of result.fullStream) {
        if (handle.cancelled) {
          termineAvec({ stopReason: 'cancelled' });
          return;
        }
        // Le SDK AI 7 delivre des `text-delta` ; on les rassemble en chunks
        // visibles. Les tool-call parts ne sont pas streames cote client
        // ici (l'agent overlay a son propre tour de boucle cote navigateur).
        const p = part as { type: string; text?: string; delta?: string };
        if (p.type === 'text-delta' && (p.text || p.delta)) {
          opts.onChunk({ type: 'delta', text: p.text ?? p.delta ?? '' });
        }
      }
      termineAvec({ stopReason: 'end_turn' });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      termineAvec({ stopReason: 'error', error: m });
    }
  })();

  handle.kill = () => {
    handle.cancelled = true;
    // Le SDK n'expose pas de cancel sur le stream ; l'abort signal coupe
    // au prochain tour de boucle. Le plus propre : detruire le consumer.
  };
  return handle;
}