// api/_agent/backends/multica.ts
// Backend Multica : delegation au CLI `multica` (processus local).
//
// Le CLI n'expose PAS de sous-commande de chat synchrone. La voie officielle
// est : creer une issue assignee a l'agent, laisser le daemon executer la
// run, et lire `multica issue run-messages <taskId>` pour recuperer la sortie.
// C'est async et lent (cycles de plusieurs secondes a minutes), mais c'est le
// seul canal que le CLI offre.
//
// Strategie :
//   1. Creer l'issue via `multica issue create --assignee-id ...` (synchrone).
//   2. Polling `multica issue runs <issueId>` jusqu'a status != running.
//   3. Lire `multica issue run-messages <taskId>` et concatener les contenus
//      de tool_result et des messages texte (le plus recent gagne).
//
// Le polling respecte un plafond franc (defaut 5 min) et signale toute erreur
// CLI. Une annulation (handle.kill()) tente un `multica issue cancel-task`.

import { spawn, spawnSync } from 'node:child_process';

export interface MulticaChunk {
  type: 'status' | 'text' | 'reason';
  text: string;
}

export interface MulticaHandle {
  kill: () => void;
  cancelled: boolean;
}

export interface MulticaPromptOptions {
  agentId: string;
  prompt: string;
  /** Titre de l'issue creee — utile quand l'utilisateur relit l'historique. */
  title?: string;
  /** Timeout total en ms. Au-dela, on tue le polling. */
  timeoutMs?: number;
  /** Intervalle de polling en ms. */
  pollIntervalMs?: number;
  /** Callback appele pour chaque evenement : changement de statut, texte recu. */
  onChunk: (c: MulticaChunk) => void;
  /** Appele une fois la run terminee (succes, echec, timeout). */
  onDone: (info: { stopReason: string; error?: string; issueId?: string; taskId?: string }) => void;
}

function execMultica(args: string[], env: NodeJS.ProcessEnv = process.env): { ok: boolean; stdout: string; stderr: string; code: number | null } {
  const probe = spawnSync('multica', args, { encoding: 'utf-8', env });
  return {
    ok: probe.status === 0,
    stdout: probe.stdout ?? '',
    stderr: probe.stderr ?? '',
    code: probe.status,
  };
}

function multicaIsAvailable(): boolean {
  const probe = spawnSync('where', ['multica'], { encoding: 'utf-8' });
  return probe.status === 0;
}

/** Demarre une conversation : cree l'issue, lance le polling, pousse les
 *  evenements dans `onChunk`. Renvoie un handle annulable. */
export function demarrerSessionMultica(opts: MulticaPromptOptions): MulticaHandle {
  const handle: MulticaHandle = {
    kill: () => {},
    cancelled: false,
  };

  if (!multicaIsAvailable()) {
    queueMicrotask(() =>
      opts.onDone({
        stopReason: 'error',
        error: "Le binaire `multica` est introuvable dans le PATH.",
      }),
    );
    handle.cancelled = true;
    return handle;
  }

  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const pollIntervalMs = opts.pollIntervalMs ?? 4000;
  const title = opts.title?.trim() || `Coach OS — ${new Date().toISOString().slice(0, 16)}`;

  // 1. Creer l'issue assignee a l'agent.
  let issueId: string | null = null;
  let taskId: string | null = null;
  try {
    const create = execMultica([
      'issue', 'create',
      '--assignee-id', opts.agentId,
      '--title', title,
      '--description', opts.prompt,
      '--output', 'json',
    ]);
    if (!create.ok) {
      const stderr = (create.stderr || create.stdout || '').trim();
      queueMicrotask(() =>
        opts.onDone({
          stopReason: 'error',
          error: `multica issue create a echoue (code ${create.code ?? '?'}) : ${stderr || 'aucune sortie'}`,
        }),
      );
      handle.cancelled = true;
      return handle;
    }
    const j = JSON.parse(create.stdout || '{}');
    issueId = j.id ?? null;
    if (!issueId) {
      queueMicrotask(() => opts.onDone({ stopReason: 'error', error: 'multica issue create n a pas rendu d id.' }));
      handle.cancelled = true;
      return handle;
    }
    opts.onChunk({ type: 'status', text: `Issue ${j.identifier ?? issueId.slice(0, 8)} creee, attente de l'agent...` });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    queueMicrotask(() => opts.onDone({ stopReason: 'error', error: `multica issue create exception : ${m}` }));
    handle.cancelled = true;
    return handle;
  }

  // 2. Boucle de polling : on surveille la run, on lit les messages, on
  //    remonte le texte au fur et a mesure.
  const debut = Date.now();
  let fini = false;
  let lastSeenSeq = 0;
  let dernierStatut: string | null = null;
  let timer: NodeJS.Timeout | null = null;

  const termineAvec = (info: Parameters<MulticaPromptOptions['onDone']>[0]) => {
    if (fini) return;
    fini = true;
    if (timer) clearTimeout(timer);
    handle.cancelled = true;
    opts.onDone(info);
  };

  const tick = () => {
    if (fini || handle.cancelled) return;

    if (Date.now() - debut > timeoutMs) {
      termineAvec({
        stopReason: 'timeout',
        error: `L'agent Multica n'a pas repondu en ${Math.round(timeoutMs / 1000)} s. Issue : ${issueId ?? '?'}.`,
        issueId: issueId ?? undefined,
        taskId: taskId ?? undefined,
      });
      return;
    }

    // Etape A : lire la run pour avoir le taskId et le statut.
    if (issueId) {
      const runs = execMultica(['issue', 'runs', issueId, '--output', 'json']);
      if (runs.ok) {
        try {
          const liste = JSON.parse(runs.stdout || '[]') as Array<{
            id: string;
            status: string;
            result?: { text?: string; error?: string } | null;
          }>;
          if (liste.length > 0) {
            taskId = liste[0].id;
            const s = liste[0].status;
            if (s !== dernierStatut) {
              dernierStatut = s;
              opts.onChunk({ type: 'status', text: `Statut : ${s}` });
            }
            if (s === 'completed' || s === 'done' || s === 'failed' || s === 'cancelled') {
              if (s === 'failed' || s === 'cancelled') {
                termineAvec({
                  stopReason: s,
                  error: liste[0].result?.error ?? `La run Multica s'est terminee en statut ${s}.`,
                  issueId,
                  taskId,
                });
                return;
              }
              // OK — on lit une derniere fois les messages et on termine.
              if (taskId) lireMessagesEtTerminer(taskId);
              else termineAvec({ stopReason: 'end_turn', issueId });
              return;
            }
          }
        } catch {
          // JSON parse fail : on continue
        }
      }
    }

    // Etape B : en parallele, lire les messages vus jusqu'ici et pousser
    // le texte incremental. On ne fait cette lecture qu'apres avoir
    // recupere le taskId.
    if (taskId) {
      const r = execMultica(['issue', 'run-messages', taskId, '--output', 'json', '--since', String(lastSeenSeq)]);
      if (r.ok) {
        try {
          const liste = JSON.parse(r.stdout || '[]') as Array<{
            type: string;
            content?: string;
            text?: string;
            message?: { content?: string };
            seq?: number;
          }>;
          for (const m of liste) {
            const seq = m.seq ?? 0;
            if (seq > lastSeenSeq) lastSeenSeq = seq;
            if (m.type === 'text' && m.text) {
              opts.onChunk({ type: 'text', text: m.text });
            } else if (m.type === 'assistant' && m.message?.content) {
              opts.onChunk({ type: 'text', text: m.message.content });
            } else if (m.type === 'tool_result' && m.content) {
              opts.onChunk({ type: 'text', text: m.content });
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (!fini) timer = setTimeout(tick, pollIntervalMs);
  };

  const lireMessagesEtTerminer = (tid: string) => {
    const r = execMultica(['issue', 'run-messages', tid, '--output', 'json']);
    if (!r.ok) {
      termineAvec({
        stopReason: 'end_turn',
        error: `Run terminee, mais lecture des messages finale a echoue : ${r.stderr || 'stdout vide'}.`,
        issueId: issueId ?? undefined,
        taskId: tid,
      });
      return;
    }
    try {
      const liste = JSON.parse(r.stdout || '[]') as Array<{
        type: string;
        text?: string;
        content?: string;
        message?: { content?: string };
      }>;
      for (const m of liste) {
        if (m.type === 'text' && m.text) opts.onChunk({ type: 'text', text: m.text });
        else if (m.type === 'assistant' && m.message?.content) opts.onChunk({ type: 'text', text: m.message.content });
        else if (m.type === 'tool_result' && m.content) opts.onChunk({ type: 'text', text: m.content });
      }
      termineAvec({ stopReason: 'end_turn', issueId: issueId ?? undefined, taskId: tid });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      termineAvec({
        stopReason: 'end_turn',
        error: `Run terminee, JSON final illisible : ${m}.`,
        issueId: issueId ?? undefined,
        taskId: tid,
      });
    }
  };

  // Premier tick presque immediat, sinon 1 cycle de poll perdu.
  handle.cancelled = false;
  timer = setTimeout(tick, 50);

  handle.kill = () => {
    if (fini) return;
    handle.cancelled = true;
    if (taskId) {
      try {
        spawn('multica', ['issue', 'cancel-task', taskId], { stdio: 'ignore', detached: true });
      } catch {
        // best-effort
      }
    }
    termineAvec({
      stopReason: 'cancelled',
      error: 'Annule par l utilisateur.',
      issueId: issueId ?? undefined,
      taskId: taskId ?? undefined,
    });
  };

  return handle;
}