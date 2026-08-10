/**
 * AssistantSettings.tsx — Settings > Assistant : liste des agents affiches
 * sur le bureau, leur sprite, leur dos, et leur disponibilite cote serveur.
 *
 * Cette vue est la meme logique que l'AssistantSettings d'avant, etendue
 * au roster multi-agents. Chaque agent est une ligne :
 *   - nom + description
 *   - selecteur de sprite (12 vignettes)
 *   - selecteur de dos (modele | multica | buzz)
 *   - avatar Multica a cote, si renseignee
 *   - badge "available" / "indisponible"
 *
 * Pattern visuel : SectionHead + Card, comme le reste de Settings. Pas de
 * sprite live (trop lourd en reseau — 12 * 1.3 MB), juste une tuile coloree.
 */
import { useCallback, useEffect, useState } from 'react';
import { Power, Volume2, RefreshCw, Bot, ShieldCheck } from 'lucide-react';
import { SectionHead } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useAssistantStore } from '../../stores/assistant.store';
import { CHARACTERS, getCharacter } from '../../agent/characters';
import { hasSynthesis, loadVoicesWithTimeout, type PrivacyMode } from '../../agent/voice';

interface RosterResponse {
  agents: Array<{
    id: string;
    name: string;
    description: string;
    personnageId: string;
    backend: 'modele' | 'multica' | 'buzz';
    available: boolean;
    provider: string | null;
    buzzModel: string | null;
    multicaAgentId: string | null;
  }>;
  backends: Array<{
    id: string;
    label: string;
    available: boolean;
    reason?: string;
  }>;
}

export function AssistantSettings() {
  const active = useAssistantStore((s) => s.active);
  const setActive = useAssistantStore((s) => s.setActive);
  const voiceEnabled = useAssistantStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAssistantStore((s) => s.setVoiceEnabled);
  const voiceName = useAssistantStore((s) => s.voiceName);
  const setVoiceName = useAssistantStore((s) => s.setVoiceName);
  const voiceRate = useAssistantStore((s) => s.voiceRate);
  const setVoiceRate = useAssistantStore((s) => s.setVoiceRate);
  const voicePrivacy = useAssistantStore((s) => s.voicePrivacy);
  const setVoicePrivacy = useAssistantStore((s) => s.setVoicePrivacy);
  const agents = useAssistantStore((s) => s.agents);
  const agentOrder = useAssistantStore((s) => s.agentOrder);
  const hydraterRoster = useAssistantStore((s) => s.hydraterRoster);
  const setAgentPersonnage = useAssistantStore((s) => s.setAgentPersonnage);
  const setAgentBackend = useAssistantStore((s) => s.setAgentBackend);
  const clearAgentHistory = useAssistantStore((s) => s.clearAgentHistory);

  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Disponibilite des APIs navigateur : ce sont des fonctions pures,
  // pas besoin de les lire dans le store. Calculees au mount.
  const [canSpeak, setCanSpeak] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Charger les voix apres le mount : getVoices() peut etre vide au boot.
  useEffect(() => {
    setCanSpeak(hasSynthesis());
    let cancelled = false;
    void loadVoicesWithTimeout().then((v) => {
      if (!cancelled) setVoices(v);
    });
    return () => { cancelled = true; };
  }, []);

  const charger = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/agent/roster');
      if (!r.ok) {
        setErreur(`HTTP ${r.status}`);
        return;
      }
      const json = (await r.json()) as RosterResponse;
      setRoster(json);
      hydraterRoster(json.agents);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [hydraterRoster]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const backendsDispo = new Map<string, boolean>();
  if (roster) {
    for (const b of roster.backends) backendsDispo.set(b.id, b.available);
  }

  return (
    <div className="p-7">
      <SectionHead
        title="Desktop assistant"
        subtitle="Twelve agents on the desktop, each with its own sprite and back end"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={active ? 'ok' : 'neutral'}>{active ? 'On' : 'Off'}</Badge>
            <button
              type="button"
              onClick={() => void charger()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--panel-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-[var(--theme-surface-hover)] disabled:opacity-40"
              style={{ color: 'var(--theme-muted)' }}
              data-assistant-refresh
            >
              <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} /> Refresh roster
            </button>
          </div>
        }
      />

      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Power className="w-4 h-4 text-[var(--theme-muted)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--theme-text)]">Show on desktop</div>
                <div className="text-xs text-[var(--theme-muted)]">All agents stay on the wallpaper. Click one to open its bubble.</div>
              </div>
            </div>
            <Toggle on={active} onClick={() => setActive(!active)} />
          </div>

          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-[var(--theme-muted)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--theme-text)]">Read out loud</div>
                <div className="text-xs text-[var(--theme-muted)]">
                  Speak the agent's reply with the browser's voice.
                  {!canSpeak && (
                    <span className="block text-[10px] mt-1 text-[var(--theme-accent)]" data-voice-unavailable>
                      Voice API absent on this browser. The toggle stays off.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Toggle on={voiceEnabled && canSpeak} onClick={() => canSpeak && setVoiceEnabled(!voiceEnabled)} />
          </div>

          {/* Reglages detailles : voix, vitesse, confidentialite. Actifs
              des que la voix est activee et l'API presente. */}
          {voiceEnabled && canSpeak && (
            <>
              {/* Choix de la voix */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Volume2 className="w-4 h-4 text-[var(--theme-muted)]" />
                  <div className="text-sm font-semibold text-[var(--theme-text)]">Voice</div>
                </div>
                <select
                  data-voice-select
                  value={voiceName ?? ''}
                  onChange={(e) => setVoiceName(e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)]"
                >
                  <option value="">Default (first French voice)</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} — {v.lang}
                      {v.localService ? '' : ' (network)'}
                    </option>
                  ))}
                </select>
                {voices.length === 0 && (
                  <div className="text-[10px] text-[var(--theme-accent)] mt-1">
                    No voices loaded yet — try again in a second.
                  </div>
                )}
              </div>

              {/* Vitesse */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Volume2 className="w-4 h-4 text-[var(--theme-muted)]" />
                  <div className="text-sm font-semibold text-[var(--theme-text)]">Speed</div>
                  <span className="ml-auto text-xs font-semibold text-[var(--theme-muted)] tabular-nums" data-voice-rate-value>
                    {voiceRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(Number(e.target.value))}
                  className="w-full"
                  data-voice-rate
                />
                <div className="flex justify-between text-[10px] text-[var(--theme-muted)] mt-1">
                  <span>0.5x</span><span>1.0x</span><span>2.0x</span>
                </div>
              </div>

              {/* Politique de confidentialite */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--theme-muted)]" />
                  <div className="text-sm font-semibold text-[var(--theme-text)]">Speech privacy</div>
                </div>
                <div className="text-xs text-[var(--theme-muted)] mb-2 leading-relaxed">
                  The agent speaks client data out loud in open rooms. Pick what gets masked
                  before the voice reads it.
                </div>
                <div className="flex flex-wrap gap-1.5" data-voice-privacy>
                  {([
                    { id: 'safe' as const, label: 'Safe — masks cards, emails, phones, IBAN, SSN' },
                    { id: 'strict' as const, label: 'Strict — also masks amounts and dates' },
                    { id: 'none' as const, label: 'None — speak the text as written' },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVoicePrivacy(opt.id as PrivacyMode)}
                      data-voice-privacy-tile={opt.id}
                      data-active={voicePrivacy === opt.id}
                      className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
                        voicePrivacy === opt.id
                          ? 'text-[var(--theme-text)]'
                          : 'text-[var(--theme-muted)] hover:text-[var(--theme-text)]'
                      }`}
                      style={{
                        border: `1px solid ${voicePrivacy === opt.id ? 'var(--theme-accent)' : 'var(--panel-border)'}`,
                        background: voicePrivacy === opt.id ? 'var(--theme-surface-hover)' : 'var(--theme-surface)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="mt-6">
        <SectionHead
          title="Roster"
          subtitle="The 12 Multica squads. Each appears on the desktop as the sprite you choose."
          action={<Badge tone="accent">{agentOrder.length} agents</Badge>}
        />

        {erreur && (
          <Card>
            <div className="px-5 py-4 text-sm text-[var(--theme-accent)]">{erreur}</div>
          </Card>
        )}

        <div className="flex flex-col gap-3 mt-3">
          {agentOrder.map((id) => {
            const slot = agents[id];
            if (!slot) return null;
            const ch = getCharacter(slot.personnageId);
            const dispo = backendsDispo.get(slot.backend) ?? false;
            return (
              <Card key={id}>
                <div className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Apercu sprite : tuile coloree, pas de sprite live. */}
                    <div
                      className="shrink-0 rounded-lg flex items-center justify-center"
                      style={{
                        width: 80,
                        height: ch?.height ?? 80,
                        background: ch?.bubble.background ?? '#e7e5e4',
                        border: `1px solid ${ch?.bubble.border ?? '#a8a29e'}`,
                      }}
                      title={`Sprite : ${ch?.name ?? slot.personnageId}`}
                      data-assistant-slot={id}
                    >
                      <Bot className="w-5 h-5" style={{ color: ch?.bubble.border ?? '#a8a29e' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-[var(--theme-text)]" data-agent-name>{slot.name}</div>
                        <Badge tone={dispo ? 'ok' : 'warn'}>{dispo ? 'available' : 'indisponible'}</Badge>
                        <Badge tone="neutral">{slot.backend}</Badge>
                      </div>
                      <div className="text-[11px] text-[var(--theme-muted)] mt-1 leading-relaxed" data-agent-description>
                        {slot.description}
                      </div>
                      {!dispo && roster && (
                        <div className="text-[10px] text-[var(--theme-accent)] mt-1">
                          {roster.backends.find((b) => b.id === slot.backend)?.reason ?? `Dos "${slot.backend}" indisponible.`}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => clearAgentHistory(id)}
                      className="text-[10px] uppercase tracking-wider font-bold opacity-60 hover:opacity-100"
                      title="Vider la conversation"
                    >
                      clear
                    </button>
                  </div>

                  {/* Sprites : 12 vignettes colorees, celle en cours est cernee. */}
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-muted)] mb-2">
                      Sprite
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CHARACTERS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAgentPersonnage(id, c.id)}
                          title={c.name}
                          data-character-tile={c.id}
                          data-active={slot.personnageId === c.id}
                          className={`relative rounded-md transition-all ${
                            slot.personnageId === c.id
                              ? 'ring-2 ring-[var(--theme-text)] ring-offset-1'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            width: 32,
                            height: 32,
                            background: c.bubble.background,
                            border: `1px solid ${c.bubble.border}`,
                          }}
                        >
                          <span className="text-[8px] font-bold uppercase" style={{ color: c.bubble.ink }}>
                            {c.name.slice(0, 4)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dos : modele | multica | buzz, avec dispo. */}
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-muted)] mb-2">
                      Back end
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['modele', 'multica', 'buzz'] as const).map((bid) => {
                        const bDispo = backendsDispo.get(bid) ?? false;
                        const active = slot.backend === bid;
                        return (
                          <button
                            key={bid}
                            type="button"
                            onClick={() => setAgentBackend(id, bid)}
                            data-backend-tile={bid}
                            data-active={active}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                              active
                                ? 'text-[var(--theme-text)]'
                                : 'text-[var(--theme-muted)] hover:text-[var(--theme-text)]'
                            }`}
                            style={{
                              border: `1px solid ${active ? 'var(--theme-accent)' : 'var(--panel-border)'}`,
                              background: active ? 'var(--theme-surface-hover)' : 'var(--theme-surface)',
                            }}
                          >
                            {bid}
                            <span className="text-[9px] opacity-70">{bDispo ? 'ok' : 'ko'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-[var(--theme-muted)] leading-relaxed">
        Each agent has its own conversation thread, its own bubble, and its own position on the
        desktop. The back end controls where the response comes from: <code>modele</code> uses the
        in-process SDK; <code>multica</code> delegates to the local Multica CLI; <code>buzz</code>{' '}
        delegates to the local <code>buzz-agent.exe</code> ACP server. On Vercel, only the
        <code> modele</code> back end is available — the other two require the local binaries.
      </p>
    </div>
  );
}