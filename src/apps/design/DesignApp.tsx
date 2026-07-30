/** DesignApp — Six aesthetic front-end style showcases (sidebar + content canvas).
 *
 *  Each style is a self-contained visual system rendered inside the Coach OS
 *  AppFrame. Sidebar style-navigator (left rail) → content canvas (right pane).
 *  Click a style in the sidebar and the canvas re-skins to that aesthetic.
 *
 *  Six styles, six distinct design languages, zero template-library defaults:
 *   1. Glassmorphism  — frosted glass cards, depth-through-translucency
 *   2. Claymorphism   — bulgy 3D plastic, vivid chromatic shadows
 *   3. Brutalism      — raw, oversized, JetBrains Mono, 4px black borders
 *   4. Cyberpunk      — synthwave grid, magenta/cyan neon, scanlines
 *   5. Soft UI / Neumorphism — inset shadows, single-hue neumorphic
 *   6. Editorial / Magazine  — Fraunces serif, bento composition, fine rule
 */

import { useEffect, useMemo, useState } from 'react';
import {
  GlassWater, Shapes, Zap, Sparkles, BookOpen, Layers, Wand2, Quote,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';

const ACCENT = '#0f172a';

/* ───────────────────────── SIDEBAR STYLE METADATA ───────────────────────── */

interface StyleMeta {
  id: string;
  label: string;
  caption: string;
  palette: string;
  icon: typeof GlassWater;
}

const STYLES: StyleMeta[] = [
  { id: 'glass',      label: 'Glassmorphism',   caption: 'Frosted glass · depth-through-translucency',           palette: 'aurora cyan / violet / milky',   icon: GlassWater },
  { id: 'clay',       label: 'Claymorphism',    caption: 'Bulgy 3D plastic · vivid chromatic shadows',           palette: 'coral / lemon / sky / mint',     icon: Shapes    },
  { id: 'brutalism',  label: 'Brutalism',       caption: 'Raw · oversized type · 4px black borders · mono',      palette: 'acid yellow + black',           icon: Zap       },
  { id: 'cyberpunk',  label: 'Cyberpunk Neon',  caption: 'Synthwave grid · magenta/cyan neon · scanlines',       palette: 'magenta #ff2bd6 / cyan #00f0ff', icon: Sparkles  },
  { id: 'softui',     label: 'Soft UI / Neu',   caption: 'Inset shadows · single-hue neumorphic surfaces',       palette: 'warm gray monochrome',          icon: Layers    },
  { id: 'editorial',  label: 'Editorial Mag',   caption: 'Fraunces serif · bento · fine rule · high contrast',  palette: 'ink black + cream + gold',      icon: BookOpen  },
];

/* ─────────────────────────── GLASSMORPHISM ─────────────────────────── */

function GlassHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl p-10"
      style={{
        background: 'radial-gradient(at 20% 10%, #c4b5fd 0%, transparent 50%), radial-gradient(at 80% 0%, #7dd3fc 0%, transparent 50%), radial-gradient(at 50% 100%, #fbcfe8 0%, transparent 60%), linear-gradient(135deg, #f8fafc, #e0e7ff 60%, #cffafe)',
      }}>
      <div className="absolute inset-0 opacity-40"
        style={{ background: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.9\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/></svg>")' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-white/40 backdrop-blur-xl border border-white/60 grid place-items-center shadow-inner">
            <GlassWater className="h-4 w-4 text-indigo-700" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-900/70">Aurora Stack</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-900/60">v2.4 · liquid</span>
      </header>

      <div className="relative z-10 mt-16 grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        {/* The primary glass card */}
        <div className="rounded-3xl border border-white/60 bg-white/40 p-8 shadow-[0_8px_32px_rgba(99,102,241,0.18)] backdrop-blur-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-700">Light / Air</div>
          <h1 className="mt-3 text-5xl font-bold leading-[0.95] tracking-tight text-slate-900"
            style={{ fontFamily: 'Georgia, serif' }}>
            Glass <span className="italic text-indigo-600">doesn't</span><br />
            need a frame.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-700">
            Transparency is the structure. Backdrop blur stacks on multi-stop gradients
            to manufacture depth where none exists physically.
          </p>
          <div className="mt-8 flex gap-3">
            <button className="rounded-full bg-slate-900/85 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg backdrop-blur transition hover:bg-slate-900">
              Try the demo
            </button>
            <button className="rounded-full border border-slate-900/20 bg-white/50 px-5 py-2.5 text-[13px] font-semibold text-slate-800 backdrop-blur transition hover:bg-white/70">
              See components
            </button>
          </div>
        </div>

        {/* Three glass stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Latency', val: '8ms', tone: 'indigo' },
            { label: 'Bundle', val: '42kb', tone: 'cyan' },
            { label: 'FPS', val: '120', tone: 'violet' },
            { label: 'Users', val: '4.2k', tone: 'pink' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-xl shadow-[0_4px_20px_rgba(99,102,241,0.10)]">
              <div className={`text-[10px] font-bold uppercase tracking-widest text-${s.tone}-700`}>{s.label}</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">{s.val}</div>
            </div>
          ))}
          <div className="col-span-2 rounded-2xl border border-white/60 bg-gradient-to-br from-indigo-400/30 to-cyan-300/30 p-4 backdrop-blur-xl">
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-900">Pro Tip</div>
            <p className="mt-1.5 text-[12px] leading-snug text-slate-800">
              Stack two backdrop-blurs on a single card — outer for the page, inner for the focal element.
            </p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-10 right-10 z-10 flex items-center justify-between text-[10px] font-mono text-indigo-900/50">
        <span>// stack: backdrop-blur-x2, multi-stop gradient, grain overlay</span>
        <span>case 01 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── CLAYMORPHISM ─────────────────────────── */

function ClayHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl p-10"
      style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fce7f3 50%, #dbeafe 100%)' }}>
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 60%, #c2410c 100%)',
          boxShadow: 'inset -12px -16px 32px rgba(0,0,0,0.25), 0 20px 40px rgba(245,158,11,0.4)' }} />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle at 30% 30%, #bae6fd 0%, #0ea5e9 60%, #1e40af 100%)',
          boxShadow: 'inset -14px -18px 36px rgba(0,0,0,0.3), 0 20px 40px rgba(14,165,233,0.4)' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: 'linear-gradient(145deg, #fb923c, #c2410c)',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.25), inset -2px -2px 6px rgba(255,255,255,0.3)' }}>
            <Shapes className="h-4 w-4 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-900">Squish Stack</span>
        </div>
        <span className="text-[10px] font-mono text-orange-900/60">v2.4 · squishy</span>
      </header>

      <div className="relative z-10 mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2.5rem] p-9"
          style={{ background: 'linear-gradient(145deg, #fff1f2, #fce7f3)',
            boxShadow: '20px 20px 60px rgba(190, 24, 93, 0.25), -20px -20px 60px rgba(255, 255, 255, 0.9), inset 2px 2px 8px rgba(255,255,255,0.6)' }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-rose-700">Squishy / Tactile</div>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight text-rose-950"
            style={{ fontFamily: 'Verdana, sans-serif' }}>
            Buttons<br />you can<br />feel.
          </h1>
          <p className="mt-5 max-w-md text-[15px] font-medium leading-relaxed text-rose-900/80">
            Chromatic shadows + inset highlights turn flat shapes into objects
            with mass. Color saturation drives perceived density.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { c1: '#fbbf24', c2: '#f59e0b', label: 'Squish it' },
              { c1: '#34d399', c2: '#059669', label: 'Spring' },
              { c1: '#a78bfa', c2: '#7c3aed', label: 'Bounce' },
            ].map((b) => (
              <button key={b.label} className="rounded-2xl px-5 py-3 text-[13px] font-extrabold text-white"
                style={{ background: `linear-gradient(145deg, ${b.c1}, ${b.c2})`,
                  boxShadow: `6px 6px 14px ${b.c2}66, -6px -6px 14px rgba(255,255,255,0.5), inset 2px 2px 4px rgba(255,255,255,0.4)` }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Bounce', val: '0.6s', c1: '#fda4af', c2: '#e11d48' },
            { label: 'Spring', val: '1.2s', c1: '#86efac', c2: '#16a34a' },
            { label: 'Wobble', val: '0.4s', c1: '#c4b5fd', c2: '#7c3aed' },
            { label: 'Pulse', val: '∞', c1: '#fcd34d', c2: '#d97706' },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl p-4"
              style={{ background: `linear-gradient(145deg, ${s.c1}55, ${s.c2}33)`,
                boxShadow: `inset 4px 4px 10px rgba(255,255,255,0.5), 8px 8px 20px rgba(0,0,0,0.15)` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-800">{s.label}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-6 left-10 right-10 z-10 flex items-center justify-between text-[10px] font-mono text-rose-900/50">
        <span>// stack: inset highlight + chromatic shadow, 2-stop gradients</span>
        <span>case 02 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── BRUTALISM ─────────────────────────── */

function BrutalismHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl p-10"
      style={{ background: '#fef3c7' }}>
      {/* Grid lines on canvas */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #00000010 39px, #00000010 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #00000010 39px, #00000010 40px)' }} />

      <header className="relative z-10 flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border-[3px] border-black bg-black text-yellow-300">
            <Zap className="h-5 w-5" strokeWidth={3} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-black">raw.exe</div>
            <div className="text-xl font-black uppercase tracking-tighter text-black" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              HUGO/SHIPS
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-black">
          <span className="border-[3px] border-black bg-white px-2 py-1">v.∞</span>
          <span className="border-[3px] border-black bg-black px-2 py-1 font-bold text-yellow-300">NO HOVER</span>
        </div>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="border-[6px] border-black bg-white p-8" style={{ boxShadow: '16px 16px 0 0 #000' }}>
          <div className="font-mono text-[11px] uppercase tracking-widest text-black">[01] / MANIFESTO</div>
          <h1 className="mt-4 text-6xl font-black uppercase leading-[0.85] tracking-tighter text-black" style={{ fontFamily: 'Impact, sans-serif' }}>
            RAW.<br/>
            LOUD.<br/>
            NO/<span className="bg-yellow-300 px-1">APOLOGIES</span>.
          </h1>
          <p className="mt-6 max-w-md border-l-[6px] border-black pl-4 font-mono text-[13px] uppercase leading-snug text-black">
            Brutalism refuses the polite gradient. &gt;_ We use 6px borders, Impact,
            no rounded corners. Saturated color + 16px offset shadow = LOOK AT ME.
          </p>
          <div className="mt-8 flex gap-3">
            <button className="border-[4px] border-black bg-yellow-300 px-6 py-3 font-mono text-[13px] font-black uppercase tracking-wider text-black" style={{ boxShadow: '6px 6px 0 0 #000' }}>
              &gt; OPEN_GATE
            </button>
            <button className="border-[4px] border-black bg-white px-6 py-3 font-mono text-[13px] font-black uppercase tracking-wider text-black" style={{ boxShadow: '6px 6px 0 0 #000' }}>
              ./docs.zip
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-[5px] border-black bg-black p-5" style={{ boxShadow: '10px 10px 0 0 #fbbf24' }}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-yellow-300">[STAT_01]</div>
            <div className="mt-2 font-mono text-4xl font-black text-yellow-300">404</div>
            <div className="mt-1 font-mono text-[11px] uppercase text-white">PAGES RETURNED</div>
          </div>
          <div className="border-[5px] border-black bg-yellow-300 p-5" style={{ boxShadow: '10px 10px 0 0 #000' }}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-black">[STAT_02]</div>
            <div className="mt-2 font-mono text-4xl font-black text-black">256KB</div>
            <div className="mt-1 font-mono text-[11px] uppercase text-black">JS BUNDLE, NONE</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border-[4px] border-black bg-white p-3">
              <div className="font-mono text-[9px] uppercase text-black">[K]</div>
              <div className="font-mono text-xl font-black text-black">⌘K</div>
            </div>
            <div className="border-[4px] border-black bg-white p-3">
              <div className="font-mono text-[9px] uppercase text-black">[R]</div>
              <div className="font-mono text-xl font-black text-black">CTRL-R</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-10 right-10 z-10 flex items-center justify-between border-t-4 border-black pt-2 font-mono text-[10px] uppercase text-black">
        <span>// STACK: IMPACT + MONO + 6PX BORDER + 16PX OFFSET</span>
        <span>case 03 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── CYBERPUNK NEON ─────────────────────────── */

function CyberHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl"
      style={{
        background: 'linear-gradient(180deg, #0a0014 0%, #1a0030 40%, #240046 100%)',
      }}>
      {/* Synthwave grid floor */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, transparent 49%, #ff2bd640 50%, transparent 51%) 0 0/100% 40px, linear-gradient(90deg, transparent 49%, #00f0ff40 50%, transparent 51%) 0 0/40px 100%',
          maskImage: 'linear-gradient(180deg, transparent 30%, black 90%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 30%, black 90%)',
        }} />
      {/* Sun */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background: 'linear-gradient(180deg, #ff2bd6 0%, #ff6b3d 50%, #ffd60a 100%)',
          boxShadow: '0 0 120px #ff2bd680, 0 0 60px #00f0ff60',
          maskImage: 'linear-gradient(180deg, black 0%, black 60%, transparent 62%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 60%, transparent 62%)',
        }} />
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00f0ff10 2px, #00f0ff10 3px)' }} />

      <header className="relative z-10 flex items-center justify-between border-b border-cyan-400/30 p-6 pb-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-cyan-300" strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300"
            style={{ textShadow: '0 0 6px #00f0ff' }}>
            netrunner://sprawl.2077
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
          <span className="border border-cyan-400/60 px-2 py-0.5 text-cyan-300" style={{ boxShadow: '0 0 8px #00f0ff60' }}>ONLINE</span>
          <span className="border border-fuchsia-400/60 px-2 py-0.5 text-fuchsia-300" style={{ boxShadow: '0 0 8px #ff2bd660' }}>PING 4ms</span>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-6 p-6 pt-2 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-cyan-400/40 bg-black/40 p-8 backdrop-blur-sm"
          style={{ boxShadow: '0 0 32px #00f0ff30, inset 0 0 32px #ff2bd610' }}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-300"
            style={{ textShadow: '0 0 6px #ff2bd6' }}>
            &gt; JACK_IN
          </div>
          <h1 className="mt-3 text-5xl font-black leading-[0.92] tracking-tight text-white"
            style={{ fontFamily: 'Courier New, monospace',
              textShadow: '0 0 12px #00f0ff, 0 0 24px #00f0ff80' }}>
            THE NIGHT<br/>
            <span className="text-fuchsia-400" style={{ textShadow: '0 0 12px #ff2bd6, 0 0 24px #ff2bd680' }}>
              RUNS
            </span><br/>
            ON <span className="bg-cyan-400 px-2 text-black" style={{ boxShadow: '0 0 16px #00f0ff' }}>NEON</span>.
          </h1>
          <p className="mt-5 max-w-md font-mono text-[13px] leading-relaxed text-cyan-200/80">
            // Synthwave grid + magenta/cyan dual-glow + scanline overlay.
            // 2077 aesthetic: chrome type, CRT phosphor glow, 8-bit accents.
          </p>
          <div className="mt-7 flex gap-3">
            <button className="rounded border border-cyan-400 bg-cyan-400/20 px-5 py-2.5 font-mono text-[12px] font-black uppercase tracking-widest text-cyan-300"
              style={{ boxShadow: '0 0 12px #00f0ff, inset 0 0 8px #00f0ff40' }}>
              ▸ JACK IN
            </button>
            <button className="rounded border border-fuchsia-400/60 bg-fuchsia-400/10 px-5 py-2.5 font-mono text-[12px] font-black uppercase tracking-widest text-fuchsia-300"
              style={{ boxShadow: '0 0 12px #ff2bd660' }}>
              ▸ RUN ICE
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded border border-fuchsia-400/40 bg-black/30 p-4 backdrop-blur-sm"
            style={{ boxShadow: '0 0 16px #ff2bd620' }}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-300">// cpu_load</div>
            <div className="mt-2 flex items-end gap-1">
              {[2,3,5,4,6,5,7,9,8,10,9,11].map((h,i) => (
                <div key={i} className="w-3 rounded-sm bg-cyan-400" style={{ height: h*4+'px', boxShadow: '0 0 4px #00f0ff' }} />
              ))}
            </div>
          </div>
          <div className="rounded border border-cyan-400/40 bg-black/30 p-4 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">// credits</div>
            <div className="mt-2 font-mono text-3xl font-black text-cyan-300" style={{ textShadow: '0 0 8px #00f0ff' }}>
              ¤ 2,847
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase text-cyan-300/70">+47 last hour</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-cyan-400/40 bg-cyan-400/10 p-3 text-center">
              <div className="font-mono text-[9px] uppercase text-cyan-300">SKILL</div>
              <div className="font-mono text-lg font-black text-white">14</div>
            </div>
            <div className="rounded border border-fuchsia-400/40 bg-fuchsia-400/10 p-3 text-center">
              <div className="font-mono text-[9px] uppercase text-fuchsia-300">LUCK</div>
              <div className="font-mono text-lg font-black text-white">07</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between font-mono text-[10px] uppercase text-cyan-300/60">
        <span>// STACK: TW GRID + DUAL GLOW + CRT SCANLINES</span>
        <span>case 04 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── SOFT UI / NEUMORPHISM ─────────────────────────── */

function SoftUiHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl p-10"
      style={{ background: '#e0e5ec' }}>
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: '#e0e5ec',
              boxShadow: '8px 8px 16px #b8bcc4, -8px -8px 16px #ffffff' }}>
            <Layers className="h-5 w-5 text-slate-500" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Soft Stack</div>
            <div className="text-xl font-bold text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>
              breathe.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
          <span className="rounded-full px-3 py-1"
            style={{ background: '#e0e5ec',
              boxShadow: 'inset 3px 3px 6px #b8bcc4, inset -3px -3px 6px #ffffff' }}>
            v1.0 · still
          </span>
        </div>
      </header>

      <div className="relative z-10 mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl p-9"
          style={{ background: '#e0e5ec',
            boxShadow: '16px 16px 32px #b8bcc4, -16px -16px 32px #ffffff' }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-500">Still / Calm</div>
          <h1 className="mt-3 text-5xl font-light leading-[0.95] tracking-tight text-slate-700"
            style={{ fontFamily: 'Georgia, serif' }}>
            Quiet<br/>mass.<br/>
            <span className="italic text-slate-500">no border.</span>
          </h1>
          <p className="mt-5 max-w-md text-[14px] font-medium leading-relaxed text-slate-500">
            Single-hue surfaces with opposing drop shadows + inset highlights create
            the illusion of extruded plastic. No border, no color, just light.
          </p>

          <div className="mt-7 flex gap-3">
            <button className="rounded-2xl px-5 py-3 text-[13px] font-semibold text-slate-700"
              style={{ background: '#e0e5ec',
                boxShadow: '6px 6px 12px #b8bcc4, -6px -6px 12px #ffffff' }}>
              Start session
            </button>
            <button className="grid h-12 w-12 place-items-center rounded-2xl text-slate-500"
              style={{ background: '#e0e5ec',
                boxShadow: 'inset 4px 4px 8px #b8bcc4, inset -4px -4px 8px #ffffff' }}>
              <Wand2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-2xl p-4"
                style={{ background: '#e0e5ec',
                  boxShadow: '6px 6px 12px #b8bcc4, -6px -6px 12px #ffffff' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Day</div>
                <div className="mt-2 text-2xl font-bold text-slate-700">{10+i}</div>
                <div className="mt-1 text-[10px] text-slate-400">mins</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-5"
            style={{ background: '#e0e5ec',
              boxShadow: 'inset 5px 5px 10px #b8bcc4, inset -5px -5px 10px #ffffff' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inset dial</div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {[3,5,7,9,6,8,4].map((h,i) => (
                <div key={i} className="rounded-sm bg-slate-400" style={{ height: h*4+'px', opacity: 0.3+h*0.07 }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4"
              style={{ background: '#e0e5ec',
                boxShadow: '5px 5px 10px #b8bcc4, -5px -5px 10px #ffffff' }}>
              <Quote className="h-4 w-4 text-slate-400" />
              <p className="mt-2 text-[12px] font-medium italic text-slate-600">"The shape is the shadow."</p>
            </div>
            <div className="rounded-2xl p-4"
              style={{ background: '#e0e5ec',
                boxShadow: '5px 5px 10px #b8bcc4, -5px -5px 10px #ffffff' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saved</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-700">142</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-10 right-10 z-10 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400">
        <span>// stack: dual-shadow + single-hue + inset/outset toggle</span>
        <span>case 05 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── EDITORIAL MAGAZINE ─────────────────────────── */

function EditorialHero() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#faf7f2] p-10">
      <header className="relative z-10 flex items-center justify-between border-b border-black pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-amber-700" strokeWidth={1.5} />
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-600">
            The Quarterly · Vol. XII
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
          §06 — Aesthetic as argument
        </div>
      </header>

      {/* Big headline */}
      <div className="relative z-10 mt-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-700">Essay · 12 min read</div>
        <h1 className="mt-3 text-7xl font-normal leading-[0.92] tracking-tight text-stone-900"
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontVariation: "'opsz' 144, 'wght' 400" }}>
          The fine <span className="italic underline decoration-amber-600 decoration-[3px] underline-offset-[10px]">rule</span><br/>
          between<br/>
          beauty<br/>
          <span className="ml-32 text-stone-500 text-5xl">and restraint.</span>
        </h1>

        <div className="mt-6 flex items-center gap-3 border-t border-b border-stone-300 py-3">
          <div className="font-serif text-[12px] uppercase tracking-widest text-stone-500">By</div>
          <div className="font-serif text-[15px] italic text-stone-900">M. Console · Editor at Large</div>
          <div className="ml-auto font-mono text-[10px] uppercase tracking-widest text-stone-500">07 / 30 / 2026</div>
        </div>
      </div>

      {/* Bento composition */}
      <div className="relative z-10 mt-8 grid grid-cols-12 gap-4">
        <article className="col-span-7 rounded-sm border border-stone-300 bg-white p-5">
          <p className="font-serif text-[15px] leading-relaxed text-stone-800">
            <span className="float-left mr-2 text-5xl font-normal leading-none text-stone-900"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}>E</span>
            ditorial design isn't about content — it's about the <em>relationship</em> between
            content and the page. Serif type carries authority; sans carries urgency.
            When you commit to one discipline, the other becomes a punctuation mark.
          </p>
          <blockquote className="mt-4 border-l-4 border-amber-700 pl-4 font-serif text-[14px] italic leading-relaxed text-stone-700">
            "If everything is loud, nothing is loud. Whitespace is also a typeface."
          </blockquote>
        </article>

        <aside className="col-span-5 space-y-3">
          <div className="rounded-sm border border-stone-300 bg-amber-50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-800">Pull quote</div>
            <div className="mt-2 font-serif text-[22px] italic leading-tight text-stone-900">
              "Borders declare. Whispers invite."
            </div>
          </div>
          <div className="rounded-sm border border-stone-300 bg-stone-900 p-4 text-[#faf7f2]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">Sidebar</div>
            <ul className="mt-2 space-y-1.5 font-serif text-[13px]">
              <li className="flex justify-between"><span>Serif weight</span><span className="font-mono">400</span></li>
              <li className="flex justify-between"><span>Sans weight</span><span className="font-mono">700</span></li>
              <li className="flex justify-between"><span>Line height</span><span className="font-mono">1.45</span></li>
              <li className="flex justify-between"><span>Margins</span><span className="font-mono">2:3</span></li>
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {['a','b','c'].map((l) => (
              <div key={l} className="rounded-sm border border-stone-300 bg-white py-3 font-serif text-2xl text-stone-900" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                {l}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="absolute bottom-6 left-10 right-10 z-10 flex items-center justify-between border-t border-stone-300 pt-2 font-mono text-[10px] uppercase tracking-widest text-stone-500">
        <span>// stack: fraunces serif + drop-cap + pull-quote + fine rule</span>
        <span>case 06 / 06</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── STYLE PROFILE FOOTER ─────────────────────────── */

function StyleProfile({ meta }: { meta: StyleMeta }) {
  const Icon = meta.icon;
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-[var(--panel-border)] bg-white/40 p-5 backdrop-blur">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Style profile</div>
        <div className="mt-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-stone-700" strokeWidth={1.8} />
          <div className="text-base font-bold text-stone-900">{meta.label}</div>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-stone-600">{meta.caption}</p>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Palette anchor</div>
        <div className="mt-2 text-[12px] font-medium text-stone-700">{meta.palette}</div>
        <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-stone-400">
          // rendered live · not a mockup
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── TOP PANEL: WHICH STYLE ARE YOU? ─────────────────────────── */

function StylePickerPanel({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <div className="space-y-3 p-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-500">Front-end aesthetic roster</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Six front-ends. One sidebar.</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-stone-600">
          This app exists to <strong>demonstrate</strong> — six different design languages rendered live
          inside the same Coach OS window. Pick a style in the sidebar to re-skin the canvas.
          No template-library defaults. No two pages share a font.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {STYLES.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.id)}
              className={`group rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-stone-900 bg-stone-900 text-white shadow-lg scale-[1.01]'
                  : 'border-stone-200 bg-white/70 text-stone-800 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-300' : 'text-stone-700'}`} strokeWidth={1.8} />
                <span className="text-[13px] font-bold">{s.label}</span>
              </div>
              <p className={`mt-2 text-[11px] leading-snug ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                {s.caption}
              </p>
              <div className={`mt-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest ${isActive ? 'text-amber-300' : 'text-stone-400'}`}>
                <span>{s.palette}</span>
                <span>{isActive ? '◀ active' : 'switch →'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 rounded-xl border border-dashed border-stone-300 bg-white/40 px-4 py-3 text-[12px] leading-relaxed text-stone-500">
        <strong className="text-stone-700">How to read this app:</strong> every section in the sidebar renders a
        full design system at production fidelity — typography, color, motion principle, depth strategy.
        The sidebar is the index; the content canvas is the demonstration.
      </div>
    </div>
  );
}

/* ─────────────────────────── SECTIONS ─────────────────────────── */

function OverviewPanel({ activeId, onPick }: { activeId: string; onPick: (id: string) => void }) {
  const active = STYLES.find((s) => s.id === activeId);
  if (!active) return null;
  return <StylePickerPanel active={activeId} onPick={onPick} />;
}

function GlassSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <GlassHero />
      <StyleProfile meta={STYLES[0]} />
    </div>
  );
}

function ClaySection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <ClayHero />
      <StyleProfile meta={STYLES[1]} />
    </div>
  );
}

function BrutalismSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <BrutalismHero />
      <StyleProfile meta={STYLES[2]} />
    </div>
  );
}

function CyberSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <CyberHero />
      <StyleProfile meta={STYLES[3]} />
    </div>
  );
}

function SoftUiSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <SoftUiHero />
      <StyleProfile meta={STYLES[4]} />
    </div>
  );
}

function EditorialSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <EditorialHero />
      <StyleProfile meta={STYLES[5]} />
    </div>
  );
}

/* ─────────────────────────── TOP-LEVEL APP ─────────────────────────── */

export function DesignApp() {
  const [activeId, setActiveId] = useState<string>('overview');

  // Keep the AppFrame's activeId in sync with the user's choice. The wrapper
  // AppFrame renders its own sidebar with `sections`; the Overview section
  // displays clickable cards that mutate activeId, which drives both the
  // overview panel AND the dedicated hero section for the same style.
  const sections: AppSection[] = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Wand2,
      render: () => <OverviewPanel activeId={activeId === 'overview' ? 'glass' : activeId} onPick={(id) => setActiveId(id)} /> },
    { id: 'glass', label: 'Glass', icon: GlassWater, render: () => <GlassSection /> },
    { id: 'clay', label: 'Clay', icon: Shapes, render: () => <ClaySection /> },
    { id: 'brutalism', label: 'Brutalism', icon: Zap, render: () => <BrutalismSection /> },
    { id: 'cyber', label: 'Cyberpunk', icon: Sparkles, render: () => <CyberSection /> },
    { id: 'softui', label: 'Soft UI', icon: Layers, render: () => <SoftUiSection /> },
    { id: 'editorial', label: 'Editorial', icon: BookOpen, render: () => <EditorialSection /> },
  ], [activeId]);

  // D6 honest gap note (sister canon pattern per SalesApp): this app is
  // intentionally pure-presentation (no Supabase / no cognition hydration). The
  // activeId local state persists in-component for the session — closing the
  // app resets to 'overview' on next open. Intentional per scope (showcase app,
  // not a workflow surface).
  useEffect(() => { document.title = 'Design · Coach OS'; }, []);

  return (
    <AppFrame
      title="Design"
      subtitle="Six front-ends · one app"
      accent={ACCENT}
      icon={Wand2}
      sections={sections}
    />
  );
}
