/**
 * theme-details.tsx — 5 distinct premium design variants for theme detail preview.
 * Each variant is a maximally different design language (per A+ directive "designs ultra-premium, anti basic").
 * Source inspiration: bergside/awesome-design-skills — Apple Vision Pro, Bento, Editorial, Brutalism, Cyberpunk.
 */
import { useMemo } from 'react';
import { Check, Sparkles, Lock, Activity, Target, Layers, Box } from 'lucide-react';
import { THEMES } from '../../lib/themes/tokens';

const motionGrammar = {
  apple:     { ease: 'cubic-bezier(0.16, 1, 0.3, 1)', duration: 600 },
  bento:     { ease: 'cubic-bezier(0.65, 0, 0.35, 1)', duration: 320 },
  editorial: { ease: 'cubic-bezier(0.4, 0, 0.2, 1)', duration: 800 },
  brutalist: { ease: 'steps(8, end)', duration: 200 },
  cyber:     { ease: 'linear', duration: 1200 },
};

interface VariantProps {
  themeId: string;
}

function useTokens(themeId: string) {
  return THEMES[themeId] ?? THEMES['warm-paper'];
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. Apple Vision Pro — frost, serif, motion-language, deep blur           */
/* ────────────────────────────────────────────────────────────────────────── */
export function AppleStyle({ themeId }: VariantProps) {
  const t = useTokens(themeId);
  return (
    <div className="relative p-10" style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.canvas})` }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 60%)' }} />
      <div className="relative mx-auto max-w-3xl space-y-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Focus</div>
        <h2 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--theme-font-display)', color: t.text }}>
          Build with quiet conviction.
        </h2>
        <p className="max-w-xl text-base leading-relaxed" style={{ color: t.textMuted }}>
          Frosted glass, generous spacing, a typeface that breathes. Every pixel earned its place.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <button
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{ background: t.accent, boxShadow: `0 12px 32px ${t.accent}66` }}
          >
            Open the workspace
          </button>
          <button
            className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all"
            style={{ color: t.text, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: `1px solid ${t.border}` }}
          >
            Learn more
          </button>
        </div>
        {/* Spec strip */}
        <div className="mt-12 grid grid-cols-3 gap-3">
          {[
            { k: 'Motion', v: motionGrammar.apple.ease, icon: Activity },
            { k: 'Density', v: 'Generous',          icon: Layers },
            { k: 'Type',    v: 'Serif Display',      icon: Sparkles },
          ].map(({ k, v, icon: Icon }) => (
            <div
              key={k}
              className="rounded-2xl border p-4 backdrop-blur-xl"
              style={{
                background: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                borderColor: t.borderSubtle,
              }}
            >
              <Icon className="h-4 w-4 mb-2" style={{ color: t.accent }} />
              <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500">{k}</div>
              <div className="mt-1 text-[12px] font-mono font-semibold" style={{ color: t.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. Bento Grid — modular cards, asymmetric, dense                          */
/* ────────────────────────────────────────────────────────────────────────── */
export function BentoStyle({ themeId }: VariantProps) {
  const t = useTokens(themeId);
  return (
    <div className="p-8 grid gap-3" style={{ background: t.bg, gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 120px)' }}>
      {/* Hero tile */}
      <div
        className="col-span-2 row-span-2 rounded-3xl p-5 flex flex-col justify-between"
        style={{ background: t.accent, color: t.isDark ? '#000' : '#fff' }}
      >
        <Box className="h-6 w-6" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Bento</div>
          <div className="text-2xl font-bold leading-tight">Dense, modular, modularly dense.</div>
        </div>
      </div>
      {/* Stat tile */}
      <div className="col-span-2 rounded-3xl p-4 flex items-center justify-between" style={{ background: t.surface, border: `1px solid ${t.borderSubtle}` }}>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Stat</div>
          <div className="text-3xl font-bold tabular-nums" style={{ color: t.text }}>12.4K</div>
        </div>
        <Activity className="h-8 w-8" style={{ color: t.accent }} />
      </div>
      {/* Action tile */}
      <div className="rounded-3xl p-4 flex items-center gap-3" style={{ background: t.surface, border: `1px solid ${t.borderSubtle}` }}>
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center" style={{ background: t.accent }}>
          <Check className="h-4 w-4 text-white" />
        </div>
        <div className="text-[11px] font-semibold" style={{ color: t.text }}>Done.</div>
      </div>
      {/* Wide tile */}
      <div className="col-span-2 rounded-3xl p-4 flex flex-col justify-between" style={{ background: t.surface, border: `1px solid ${t.borderSubtle}` }}>
        <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Range</div>
        <div className="flex items-end gap-1">
          {[40, 65, 50, 80, 70, 95, 60].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: t.accent, opacity: 0.4 + i * 0.08 }} />
          ))}
        </div>
      </div>
      {/* List tile */}
      <div className="col-span-2 rounded-3xl p-4 flex flex-col gap-1.5" style={{ background: t.surface, border: `1px solid ${t.borderSubtle}` }}>
        {['Inbox', 'Today', 'Queue'].map((label, i) => (
          <div key={label} className="flex items-center justify-between text-[11px]">
            <span style={{ color: t.text }}>{label}</span>
            <span className="text-stone-500 tabular-nums">{[8, 3, 1][i]}</span>
          </div>
        ))}
      </div>
      {/* Mini tile */}
      <div className="col-span-2 rounded-3xl p-4 flex items-center justify-between" style={{ background: t.surface, border: `1px solid ${t.borderSubtle}` }}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Heart</div>
        <div className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. Editorial — long-form serif, narrow gutter, print-derived              */
/* ────────────────────────────────────────────────────────────────────────── */
export function EditorialStyle({ themeId }: VariantProps) {
  const t = useTokens(themeId);
  return (
    <div className="p-12" style={{ background: t.bg }}>
      <div className="mx-auto max-w-[640px]">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">Essay · 7 min read</div>
        <h2
          className="text-4xl font-bold leading-[1.15] tracking-tight"
          style={{ fontFamily: 'var(--theme-font-display)', color: t.text }}
        >
          On the slow erosion of interface clarity
        </h2>
        <div className="my-6 h-px" style={{ background: t.border }} />
        <p className="text-[15px] leading-[1.85]" style={{ color: t.text, fontFamily: 'var(--theme-font-body)' }}>
          Every product inherits a typography it does not deserve. Pick a default, ship it, forget
          about it. The gridded screenshot becomes the grid that ships. The rendered mock becomes
          the spec. The spec becomes the law.
        </p>
        <p className="mt-4 text-[15px] leading-[1.85]" style={{ color: t.text, fontFamily: 'var(--theme-font-body)' }}>
          Yet the user reads in columns. The eye lands on rules, gutters, and margins. The page is
          an argument and the argument wins because the gutter is honest.
        </p>
        <blockquote className="my-6 border-l-2 pl-4 text-[18px] italic" style={{ borderColor: t.accent, color: t.text }}>
          "The grid is not a cage. It is a contract."
        </blockquote>
        <p className="text-[15px] leading-[1.85]" style={{ color: t.text, fontFamily: 'var(--theme-font-body)' }}>
          Read further. The body holds still long enough to read.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. Brutalist — hard borders, mono accents, drop-shadow blocks            */
/* ────────────────────────────────────────────────────────────────────────── */
export function BrutalistStyle({ themeId }: VariantProps) {
  const t = useTokens(themeId);
  return (
    <div className="p-8 space-y-4" style={{ background: t.bg }}>
      {/* Header strip */}
      <div
        className="border-4 p-4"
        style={{ borderColor: t.text, background: t.surface, boxShadow: `8px 8px 0 ${t.text}` }}
      >
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: t.text }}>
          [BRUTALIST] · MANIFESTO
        </div>
        <div className="mt-2 text-3xl font-mono font-extrabold uppercase" style={{ color: t.text }}>
          No bullshit.
        </div>
      </div>
      {/* Grid blocks */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { k: 'Border', v: '4px solid',  c: t.accent },
          { k: 'Shadow',  v: '8px 8px 0', c: t.text },
          { k: 'Type',    v: 'Mono',       c: t.text },
        ].map(({ k, v, c }) => (
          <div
            key={k}
            className="border-4 p-3"
            style={{ borderColor: t.text, background: t.surface, boxShadow: `6px 6px 0 ${t.text}` }}
          >
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: t.text }}>
              {k}
            </div>
            <div className="mt-1 text-[13px] font-mono font-bold uppercase" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <button
        className="border-4 px-6 py-3 text-sm font-mono font-extrabold uppercase tracking-wider"
        style={{
          borderColor: t.text,
          background: t.accent,
          color: t.isDark ? '#000' : '#fff',
          boxShadow: `8px 8px 0 ${t.text}`,
        }}
      >
        [ EXECUTE ]
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  5. Cyberpunk — neon pulse, monospace, scan-lines, terminal-grade           */
/* ────────────────────────────────────────────────────────────────────────── */
export function CyberpunkStyle({ themeId }: VariantProps) {
  const t = useTokens(themeId);
  return (
    <div
      className="relative p-8 overflow-hidden"
      style={{ background: t.bg, color: t.text, minHeight: 480 }}
    >
      {/* Scan-lines overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)',
          animation: 'cybscan 6s linear infinite',
        }}
      />
      {/* Glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full"
        style={{ background: `radial-gradient(circle, ${t.accent}55, transparent 70%)`, filter: 'blur(40px)' }}
      />
      {/* Console block */}
      <div className="relative max-w-2xl">
        <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: t.accent }}>
          ▌ runtime/active · pid=0x417 · {themeId}
        </div>
        <h2 className="mt-2 text-4xl font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--theme-font-body)' }}>
          //
        </h2>
        <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: t.text }}>
          Gate ready. Deploy.
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 max-w-md">
          {[
            { k: 'Status',    v: 'OK',                  c: t.accent },
            { k: 'Latency',   v: '12ms',                c: t.text },
            { k: 'Throughput',v: '8.4K/s',              c: t.text },
            { k: 'Tail',      v: 'STABLE',              c: t.accent },
          ].map(({ k, v, c }) => (
            <div
              key={k}
              className="border px-3 py-2"
              style={{ borderColor: `${t.accent}66`, background: `${t.accent}11` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: t.textMuted }}>{k}</div>
              <div className="text-sm font-mono font-bold" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <button
          className="mt-5 border-2 px-5 py-2.5 text-sm font-mono font-bold uppercase tracking-wider"
          style={{
            borderColor: t.accent,
            background: 'transparent',
            color: t.accent,
            boxShadow: `0 0 24px ${t.accent}66`,
          }}
        >
          ▸ EXECUTE
        </button>
      </div>
      <style>{`@keyframes cybscan { from { transform: translateY(0); } to { transform: translateY(3px); } }`}</style>
    </div>
  );
}
