// api/_agent/backends/buzz.ts
// Backend Buzz : delegue a `buzz-agent.exe` via JSON-RPC 2.0 (ACP v2).
//
// Le protocole a ete verifie a la main contre le binaire sur la machine :
//   1. POST initialize avec protocolVersion=20241105 (NUMBER, pas string)
//      et clientInfo. Le serveur rend un objet agentCapabilities + protocolVersion=2.
//   2. POST session/new avec cwd + mcpServers[]. Rend {sessionId, models}.
//   3. POST session/prompt avec sessionId + prompt[]. Rend {stopReason} une
//      fois termine. Pendant l'execution, le serveur pousse des notifications
//      session/update avec sessionUpdate="agent_message_chunk" et content.text.
//   4. Chaque ligne de stdout est un JSON-RPC distinct, delimitee par \n.
//
// Strategie d'erreur : un dos Buzz qui plante rend un message lisible dans la
// bulle. Pas de timeout silencieux. Si le binaire manque, l'erreur remonte
// depuis listBackendStatuses() (cf. backends.ts) avant meme qu'on essaie.

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface BuzzChunk {
  type: 'text' | 'reason';
  text: string;
}

export interface BuzzHandle {
  kill: () => void;
  cancelled: boolean;
}

export interface BuzzPromptOptions {
  prompt: string;
  cwd?: string;
  /** Modele a demander. Defaut : ce que le binaire expose en currentModelId. */
  model?: string;
  /** Timeout dur en ms. Au-dela, on tue le processus. */
  timeoutMs?: number;
  /** Cle API utilisee pour le fournisseur. Buzz lit $ANTHROPIC_API_KEY, etc. */
  apiKey?: string;
  /** Provider id — Buzz reconnait anthropic, openai, databricks... */
  provider?: string;
  /** Callback appele pour chaque chunk de texte arrive. */
  onChunk: (c: BuzzChunk) => void;
  /** Callback appele une seule fois quand la session est terminee (ou en erreur). */
  onDone: (info: { stopReason: string; error?: string }) => void;
}

function cheminBuzz(): string | null {
  const home = process.env.LOCALAPPDATA ?? '';
  const cible = home ? `${home}\\Buzz\\buzz-agent.exe` : '';
  return cible && existsSync(cible) ? cible : null;
}

interface JsonRpcReq {
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: unknown;
}

interface JsonRpcLine {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

class LineBufferedRpc {
  private buffer = '';
  private readonly onLine: (line: string) => void;

  constructor(stdout: NodeJS.ReadableStream, onLine: (line: string) => void) {
    this.onLine = onLine;
    stdout.setEncoding('utf-8');
    stdout.on('data', (chunk: string | Buffer) => {
      const s = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
      this.buffer += s;
      let nl: number;
      // Boucler tant qu'on a des separateurs : un JSON-RPC par ligne.
      while ((nl = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.slice(0, nl).replace(/\r$/, '');
        this.buffer = this.buffer.slice(nl + 1);
        if (line.trim()) this.onLine(line);
      }
    });
  }

  takeRemainder(): string {
    const r = this.buffer;
    this.buffer = '';
    return r;
  }
}

/** Lance `buzz-agent.exe`, fait initialize + session/new + session/prompt,
 *  pousse les chunks recus dans `onChunk`. Renvoie un handle que l'appelant
 *  peut `kill()` (cancel depuis le client). */
export function demarrerSessionBuzz(opts: BuzzPromptOptions): BuzzHandle {
  const binaire = cheminBuzz();
  if (!binaire) {
    const msg = `buzz-agent.exe introuvable (cible cherchee : ${process.env.LOCALAPPDATA ?? '<LOCALAPPDATA manquant>'}\\Buzz\\buzz-agent.exe).`;
    queueMicrotask(() => opts.onDone({ stopReason: 'error', error: msg }));
    return { kill: () => {}, cancelled: true };
  }

  const env = { ...process.env };
  if (opts.provider) env.BUZZ_AGENT_PROVIDER = opts.provider;
  if (opts.model) env.BUZZ_AGENT_MODEL = opts.model;
  if (opts.apiKey) env.ANTHROPIC_API_KEY = opts.apiKey;

  let proc: ChildProcessWithoutNullStreams;
  try {
    proc = spawn(binaire, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      cwd: opts.cwd ? resolve(opts.cwd) : process.cwd(),
      windowsHide: true,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    queueMicrotask(() => opts.onDone({ stopReason: 'error', error: `Impossible de lancer buzz-agent.exe : ${m}` }));
    return { kill: () => {}, cancelled: true };
  }

  const handle: BuzzHandle = {
    kill: () => {
      try {
        proc.kill();
      } catch {
        // best-effort
      }
    },
    cancelled: false,
  };

  let nextId = 1;
  const pending = new Map<number, (r: JsonRpcLine) => void>();
  let sessionId: string | null = null;
  let fini = false;
  const termineAvec = (info: { stopReason: string; error?: string }) => {
    if (fini) return;
    fini = true;
    try {
      proc.kill();
    } catch {
      // best-effort
    }
    opts.onDone(info);
  };

  const rpc = new LineBufferedRpc(proc.stdout, (line) => {
    let parsed: JsonRpcLine;
    try {
      parsed = JSON.parse(line);
    } catch {
      // Buzz peut ecrire des logs non-JSON sur stdout ; on les ignore.
      return;
    }
    if (parsed.id != null && pending.has(parsed.id)) {
      const cb = pending.get(parsed.id)!;
      pending.delete(parsed.id);
      cb(parsed);
      return;
    }
    // Notification push
    if (parsed.method === 'session/update' && parsed.params) {
      const p = parsed.params as {
        update?: { sessionUpdate?: string; content?: { type?: string; text?: string } };
      };
      const update = p.update;
      if (update?.sessionUpdate === 'agent_message_chunk' && update.content?.text) {
        opts.onChunk({ type: 'text', text: update.content.text });
      }
    }
  });

  proc.stderr.setEncoding('utf-8');
  // stderr du binaire : on le garde pour le debug mais on ne le pousse pas
  // dans la bulle — c'est du bruit de telemetry, pas la reponse du modele.
  proc.stderr.on('data', () => {
    // noop
  });

  proc.on('error', (err) => {
    termineAvec({ stopReason: 'error', error: `buzz-agent.exe a emis une erreur : ${err.message}` });
  });
  proc.on('close', (code) => {
    if (!fini) {
      termineAvec({
        stopReason: 'closed',
        error: code === 0 ? undefined : `buzz-agent.exe s'est arrete (code ${code ?? 'null'}).`,
      });
    }
  });

  const envoyer = (req: Omit<JsonRpcReq, 'jsonrpc'>) => {
    const id = req.id ?? nextId++;
    const wire: JsonRpcReq = { jsonrpc: '2.0', id, ...req };
    try {
      proc.stdin.write(JSON.stringify(wire) + '\n');
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      termineAvec({ stopReason: 'error', error: `Impossible d'ecrire sur stdin du buzz-agent : ${m}` });
      return;
    }
    return new Promise<JsonRpcLine>((resolveP) => {
      pending.set(id, resolveP);
    });
  };

  const timeoutMs = opts.timeoutMs ?? 60_000;
  const timer = setTimeout(() => {
    if (!fini) {
      termineAvec({
        stopReason: 'timeout',
        error: `Buzz n'a pas repondu en ${Math.round(timeoutMs / 1000)} s. La cle est-elle posee ? Le modele est-il joignable ?`,
      });
    }
  }, timeoutMs);

  (async () => {
    try {
      const init = await envoyer({ method: 'initialize', params: { protocolVersion: 20241105, capabilities: {}, clientInfo: { name: 'coach-os', version: '0.1' } } });
      if (init.error) {
        termineAvec({ stopReason: 'error', error: `initialize: ${init.error.message}` });
        return;
      }
      const news = await envoyer({ method: 'session/new', params: { cwd: opts.cwd ?? process.cwd(), mcpServers: [] } });
      if (news.error) {
        termineAvec({ stopReason: 'error', error: `session/new: ${news.error.message}` });
        return;
      }
      const r = news.result as { sessionId?: string };
      sessionId = r?.sessionId ?? null;
      if (!sessionId) {
        termineAvec({ stopReason: 'error', error: 'session/new n a pas rendu de sessionId.' });
        return;
      }
      const prompt = await envoyer({
        method: 'session/prompt',
        params: { sessionId, prompt: [{ type: 'text', text: opts.prompt }] },
      });
      if (prompt.error) {
        termineAvec({ stopReason: 'error', error: `session/prompt: ${prompt.error.message}` });
        return;
      }
      const pres = prompt.result as { stopReason?: string };
      clearTimeout(timer);
      termineAvec({ stopReason: pres?.stopReason ?? 'end_turn' });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      termineAvec({ stopReason: 'error', error: `Erreur JSON-RPC Buzz : ${m}` });
    }
  })();

  // Permettre a l'appelant d'annuler : on coupe le timer + le process.
  handle.kill = () => {
    handle.cancelled = true;
    clearTimeout(timer);
    termineAvec({ stopReason: 'cancelled' });
  };

  // Flush remainder on close (defensive)
  proc.on('close', () => {
    const reste = rpc.takeRemainder();
    if (reste.trim()) {
      try {
        const parsed = JSON.parse(reste);
        if (parsed.id != null && pending.has(parsed.id)) {
          pending.get(parsed.id)!(parsed);
          pending.delete(parsed.id);
        }
      } catch {
        // ignore
      }
    }
  });

  return handle;
}