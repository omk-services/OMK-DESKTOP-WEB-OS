/**
 * Playground — same prompt sent to multiple models, side-by-side, with per-call
 * cost. Provider chips grouped by vendor (Anthropic / MiniMax / OpenRouter).
 *
 * Adaptation to Coach OS: providers here are real (Claude Opus/Sonnet/Haiku,
 * MiniMax-M3, plus OpenRouter open models). Bedrock is not used.
 */
import { useMemo, useState } from 'react';
import { Beaker, Clock, Coins, Sparkles } from 'lucide-react';
import { PLAYGROUND_MODELS, PLAYGROUND_PROMPT } from '../seed';
import type { PlaygroundModel } from '../seed';
import { ACCENT, IconChip, KpiTile, Panel, Pill, SectionTitle } from '../Primitives';

const VENDOR_META: Record<string, { label: string; color: string }> = {
  Anthropic:  { label: 'Anthropic',  color: '#d97757' },
  MiniMax:    { label: 'MiniMax',    color: '#ca8a04' },
  OpenRouter: { label: 'OpenRouter', color: '#0891b2' },
};

export function Playground() {
  const [prompt, setPrompt] = useState(PLAYGROUND_PROMPT);

  const totalCost = useMemo(
    () => PLAYGROUND_MODELS.reduce((acc, m) => acc + m.costPer1kIn * 0.6 + m.costPer1kOut * 0.4, 0),
    [],
  );

  const vendors = useMemo(() => {
    const set = new Set<string>();
    PLAYGROUND_MODELS.forEach((m) => set.add(m.vendor));
    return Array.from(set);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Core"
        title="Playground"
        subtitle="Une question, plusieurs modèles, côte à côte — coût par appel."
      />

      {/* Prompt */}
      <Panel pad="p-5">
        <div className="mb-2 flex items-center gap-2">
          <IconChip tone="accent"><Sparkles className="h-3.5 w-3.5" /></IconChip>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-muted)' }}>
            Invité
          </span>
          <Pill tone="info">6 modèles</Pill>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-xl px-4 py-3 text-[13.5px] leading-relaxed outline-none transition-colors focus:border-[color:var(--theme-accent)]"
          style={{
            background: 'var(--theme-surface-hover)',
            color: 'var(--theme-text)',
            border: '1px solid var(--panel-border-subtle)',
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
          {vendors.map((v) => {
            const meta = VENDOR_META[v] ?? { label: v, color: ACCENT };
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
                style={{ color: meta.color, background: 'var(--theme-surface-hover)', border: `1px solid ${meta.color}40` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1">
            <Coins className="h-3 w-3" />
            coût total ≈ ${totalCost.toFixed(4)}
          </span>
        </div>
      </Panel>

      {/* KPIs row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile label="Modèles comparés" value={PLAYGROUND_MODELS.length} tone="accent" />
        <KpiTile label="Coût total" value={`$${totalCost.toFixed(4)}`} tone="ok" hint="par appel, jeu complet" />
        <KpiTile label="Latence médiane" value={`${median(PLAYGROUND_MODELS.map((m) => m.latencyMs))} ms`} tone="info" />
        <KpiTile label="Plus lent" value={`${Math.max(...PLAYGROUND_MODELS.map((m) => m.latencyMs))} ms`} tone="warn" hint="Opus 4.5" />
      </div>

      {/* Provider-grouped grid */}
      {vendors.map((vendor) => {
        const meta = VENDOR_META[vendor] ?? { label: vendor, color: ACCENT };
        const models = PLAYGROUND_MODELS.filter((m) => m.vendor === vendor);
        return (
          <section key={vendor}>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-muted)' }}>
                {meta.label}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                {models.length} modèles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {models.map((m) => (
                <ModelCard key={m.id} model={m} vendorColor={meta.color} prompt={prompt} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ModelCard({ model, vendorColor, prompt }: { model: PlaygroundModel; vendorColor: string; prompt: string }) {
  // Estimate tokens in/out from the prompt length so the displayed cost reflects what
  // the user would pay if they actually fired this call right now.
  const tokensIn = Math.max(64, Math.ceil(prompt.length / 3.5));
  const tokensOut = Math.max(48, Math.ceil(model.response.length / 3.5));
  const estCost = (tokensIn / 1000) * model.costPer1kIn + (tokensOut / 1000) * model.costPer1kOut;

  return (
    <Panel pad="p-5" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <IconChip tone={model.tone}>
          <Beaker className="h-4 w-4" />
        </IconChip>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-bold" style={{ color: 'var(--theme-text)' }}>
              {model.label}
            </span>
            <Pill tone={model.tone}>{model.tone}</Pill>
          </div>
          <div className="mt-0.5 truncate text-[10.5px] font-mono" style={{ color: vendorColor }}>
            {model.vendor}
          </div>
        </div>
      </div>

      <p
        className="rounded-xl p-3 text-[12.5px] leading-relaxed"
        style={{
          background: 'var(--theme-surface-hover)',
          color: 'var(--theme-text)',
          border: '1px solid var(--panel-border-subtle)',
        }}
      >
        {model.response}
      </p>

      <div
        className="grid grid-cols-3 gap-2 rounded-xl p-2.5"
        style={{ background: 'var(--theme-surface-hover)' }}
      >
        <Mini label="latence" value={`${model.latencyMs} ms`} icon={<Clock className="h-3 w-3" />} />
        <Mini label="coût estimé" value={`$${estCost.toFixed(4)}`} icon={<Coins className="h-3 w-3" />} />
        <Mini label="tokens out" value={String(tokensOut)} />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
        <span>in ${model.costPer1kIn}/1k</span>
        <span>out ${model.costPer1kOut}/1k</span>
      </div>
    </Panel>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
        {label}
      </span>
      <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}
