/**
 * DesignApp — styles 11-15 (Art Deco, Bento, Retro Future, Aurora Mesh,
 * Terminal Mono). Extrait de DesignApp.tsx : chaque Hero est un systeme
 * visuel autonome, sans etat ni logique partagee.
 */
import { Diamond, LayoutGrid, Sun, Rainbow, Terminal } from 'lucide-react';

/* ─────────────────────────── 11 ART DECO ─────────────────────────── */

function ArtDecoHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'linear-gradient(180deg, #f5e9d4 0%, #e8d5b0 100%)' }}>
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Diamond className="h-5 w-5 text-amber-700" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-amber-900">Le Grand Hôtel · 1925</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-amber-900">№ VII</div>
      </header>

      {/* Vertical deco side rails */}
      <div className="pointer-events-none absolute inset-y-0 left-2 flex flex-col items-center justify-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-3 w-3 rotate-45 border-2 border-amber-700/40" />)}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex flex-col items-center justify-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-3 w-3 rotate-45 border-2 border-amber-700/40" />)}
      </div>

      {/* Central fan */}
      <div className="relative z-10 mt-6 grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto h-64 w-64">
          {/* Sunburst fan */}
          <svg viewBox="0 0 200 200" className="absolute inset-0">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={i} x1="100" y1="100" x2={100 + Math.cos((i - 6) * 0.24) * 95} y2={100 + Math.sin((i - 6) * 0.24) * 95}
                stroke="#92400e" strokeWidth="1.5" opacity={0.5} />
            ))}
            <circle cx="100" cy="100" r="80" fill="none" stroke="#92400e" strokeWidth="2" />
            <circle cx="100" cy="100" r="65" fill="none" stroke="#92400e" strokeWidth="1" />
            <circle cx="100" cy="100" r="45" fill="#fbbf24" />
            <circle cx="100" cy="100" r="15" fill="#7c2d12" />
          </svg>
        </div>

        <div>
          <div className="inline-block border border-amber-900 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-900">
            Est · 1925 · Paris
          </div>
          <h1 className="mt-4 text-5xl font-normal leading-[0.95] tracking-tight text-amber-950"
            style={{ fontFamily: 'Didot, Bodoni, serif' }}>
            THE GOLDEN<br/>
            <span className="italic">age</span> OF<br/>
            GEOMETRY.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-amber-900/80">
            Stepped forms. Vertical symmetry. Gold leaf. The luxury of
            restraint executed with perfect craft.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button className="border border-amber-900 bg-amber-900 px-5 py-2.5 text-[12px] uppercase tracking-[0.2em] text-amber-50"
              style={{ fontFamily: 'Didot, serif', letterSpacing: '0.2em' }}>
              RÉSERVER
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-900/60">
              ◇ ◇ ◇ ◇ ◇
            </span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-amber-900">
        <span>// STACK: SUNBURST FAN + DIDOT + GOLD + STEP SYMMETRY</span>
        <span>case 11 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 12 BENTO ─────────────────────────── */

function BentoHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#fafaf5' }}>
      {/* Subtle dotted washi paper texture */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, #00000008 0%, transparent 1.5%) 0 0/14px 14px' }} />

      <header className="relative z-10 flex items-center justify-between border-b border-stone-900 pb-3">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-4 w-4 text-stone-900" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-stone-900">弁当 · Bento OS · 春</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-stone-600">v.4 · 静</div>
      </header>

      <div className="relative z-10 mt-6 grid grid-cols-12 gap-3">
        {/* Hero rectangle */}
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-stone-900 bg-white p-6"
          style={{ boxShadow: '4px 4px 0 #1c1917' }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">NOTED · TODAY</div>
          <h1 className="mt-3 text-4xl font-normal leading-[1.1] tracking-tight text-stone-900"
            style={{ fontFamily: 'Times New Roman, serif' }}>
            <span className="text-5xl">静</span> Quiet<br/>process,<br/>
            <span className="bg-amber-200 px-1">visible</span> craft.
          </h1>
          <p className="mt-3 max-w-md text-[12px] leading-relaxed text-stone-700">
            Japanese bento: every cell holds exactly one thing. The grid is
            the agenda. Restraint is the discipline.
          </p>
        </div>

        <div className="col-span-6 lg:col-span-5 rounded-2xl border border-stone-900 bg-amber-100 p-5"
          style={{ boxShadow: '4px 4px 0 #1c1917' }}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-amber-900">CARD · 北</div>
          <div className="mt-2 text-3xl font-bold text-amber-900" style={{ fontFamily: 'Times, serif' }}>12</div>
          <div className="text-[11px] text-amber-900/70">tasks open · 静かに</div>
        </div>

        <div className="col-span-6 lg:col-span-4 rounded-2xl border border-stone-900 bg-stone-900 p-5 text-white">
          <div className="font-mono text-[10px] uppercase tracking-widest text-amber-300">CARD · 月</div>
          <div className="mt-2 text-2xl font-bold" style={{ fontFamily: 'Times, serif' }}>40 min</div>
          <div className="text-[11px] text-stone-400">focus block</div>
        </div>

        <div className="col-span-6 lg:col-span-4 rounded-2xl border border-stone-900 bg-stone-100 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">CARD · 火</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({length:7}).map((_,i) => <div key={i} className="h-2 rounded-full" style={{ background: i<4? '#1c1917' : '#d6d3d1' }} />)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">4/7 days this week</div>
        </div>

        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-stone-900 bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">CARD · 水 · READ</div>
          <p className="mt-2 text-[12px] italic leading-relaxed text-stone-700" style={{ fontFamily: 'Times, serif' }}>
            "Begin with an empty calendar. Restraint is the structure."
          </p>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500">
        <span>// STACK: ASYMMETRIC BENTO GRID + DOTTED WASHI + OFFSET SHADOWS</span>
        <span>case 12 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 13 RETRO FUTURE ─────────────────────────── */

function RetroFutureHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'linear-gradient(180deg, #fde68a 0%, #fb923c 50%, #f472b6 100%)' }}>
      {/* Halftone */}
      <div className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: 'radial-gradient(circle, #831843 30%, transparent 30%) 0 0/8px 8px' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-rose-900" strokeWidth={1.8} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-rose-900">
            ATOMIC AGE · EST. 1957
          </span>
        </div>
        <div className="flex gap-2">
          <span className="border-2 border-rose-900 bg-rose-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-rose-900">flavor:chrome</span>
          <span className="border-2 border-rose-900 bg-rose-900 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-rose-100">retrowave</span>
        </div>
      </header>

      <div className="relative z-10 mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-6xl font-black leading-[0.92] tracking-tight text-rose-950"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            THE FUTURE<br/>
            LOOKED LIKE<br/>
            <span className="italic">pastels</span>.
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-rose-900">
            1957: atomic orbitals + halftone dots + chrome accents + sunset
            pastels. The aesthetic of optimism about tomorrow.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="border-[3px] border-rose-900 bg-white px-5 py-2.5 font-mono text-[12px] font-black uppercase tracking-widest text-rose-900"
              style={{ boxShadow: '5px 5px 0 #be123c' }}>
              ▸ CHECK ORBIT
            </button>
            <span className="self-center font-mono text-[10px] uppercase tracking-widest text-rose-900">
              ← today's astro-calendar
            </span>
          </div>
        </div>

        {/* Atomic orbital */}
        <div className="relative mx-auto h-72 w-72">
          <svg viewBox="0 0 300 300" className="absolute inset-0">
            <circle cx="150" cy="150" r="60" fill="#fef3c7" stroke="#881337" strokeWidth="3" />
            <circle cx="150" cy="150" r="100" fill="none" stroke="#881337" strokeWidth="2" />
            <ellipse cx="150" cy="150" rx="100" ry="40" fill="none" stroke="#881337" strokeWidth="2" />
            <ellipse cx="150" cy="150" rx="100" ry="40" fill="none" stroke="#881337" strokeWidth="2" transform="rotate(60 150 150)" />
            <ellipse cx="150" cy="150" rx="100" ry="40" fill="none" stroke="#881337" strokeWidth="2" transform="rotate(120 150 150)" />
            <circle cx="200" cy="115" r="8" fill="#be123c" stroke="#881337" strokeWidth="2" />
            <circle cx="100" cy="190" r="6" fill="#be123c" stroke="#881337" strokeWidth="2" />
            <circle cx="170" cy="220" r="5" fill="#be123c" stroke="#881337" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-rose-900">
        <span>// STACK: HALFTONE DOTS + ATOMIC ORBITS + RETROFUTURE SUNSET + CHROME</span>
        <span>case 13 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 14 AURORA MESH ─────────────────────────── */

function AuroraHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'radial-gradient(at 30% 30%, #6ee7b7 0%, transparent 50%), radial-gradient(at 70% 60%, #f0abfc 0%, transparent 50%), radial-gradient(at 50% 100%, #818cf8 0%, transparent 60%), radial-gradient(at 80% 20%, #fdba74 0%, transparent 50%), linear-gradient(135deg, #fafafa, #fdf4ff)' }}>
      {/* Floating orbs */}
      <div className="absolute right-20 top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-400 blur-2xl opacity-60" />
      <div className="absolute bottom-16 left-12 h-44 w-44 rounded-full bg-gradient-to-br from-pink-300 via-fuchsia-300 to-violet-400 blur-3xl opacity-60" />
      <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 blur-2xl opacity-40" />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/40 backdrop-blur-xl">
            <Rainbow className="h-4 w-4 text-fuchsia-600" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-700">Aurora · 12 gradients</span>
        </div>
        <span className="rounded-full bg-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 backdrop-blur-xl">2026 edition</span>
      </header>

      <div className="relative z-10 mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/60 bg-white/40 p-7 backdrop-blur-2xl"
          style={{ boxShadow: '0 24px 48px -16px rgba(168,85,247,0.3)' }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-fuchsia-700">GLOW · SOFT</div>
          <h1 className="mt-3 text-5xl font-bold leading-[0.95] tracking-tight text-stone-900"
            style={{ fontFamily: 'Georgia, serif' }}>
            Light<br/>
            <span className="italic text-fuchsia-600">refracted</span><br/>
            becomes form.
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-stone-700">
            Mesh gradients + blur orbs + frosted glass. The aesthetic of
            visual warmth without the noise of saturated UI.
          </p>
          <div className="mt-5 flex gap-3">
            <button className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg">
              Try free
            </button>
            <button className="rounded-full border border-stone-300 bg-white/60 px-5 py-2.5 text-[13px] font-semibold text-stone-800 backdrop-blur">
              See pricing
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Orbs', v: '7', c: 'from-emerald-300 to-cyan-400' },
            { l: 'Layers', v: '12', c: 'from-pink-300 to-fuchsia-400' },
            { l: 'Blur', v: '32', c: 'from-amber-300 to-orange-400' },
            { l: 'Warmth', v: '∞', c: 'from-violet-300 to-indigo-400' },
          ].map((s) => (
            <div key={s.l} className={`rounded-2xl bg-gradient-to-br ${s.c} p-4 text-white shadow-lg`}>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">{s.l}</div>
              <div className="mt-1 text-2xl font-extrabold">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-600">
        <span>// stack: radial mesh + blur orbs + frosted glass</span>
        <span>case 14 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 15 TERMINAL MONO ─────────────────────────── */

function TerminalHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#0a0a0a' }}>
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff0020 2px, #00ff0020 3px)' }} />

      <header className="relative z-10 flex items-center justify-between border-b border-green-900/60 pb-3">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-green-400">
            user@coach-os: ~/design/style-15
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-green-300/60">
          <span className="border border-green-700 px-2 py-0.5">[ESC]</span>
          <span className="border border-green-700 px-2 py-0.5">/usr/local/bin</span>
        </div>
      </header>

      <div className="relative z-10 mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="font-mono text-[13px] leading-relaxed text-green-300">
          <div className="text-amber-300">$ describe_aesthetic</div>
          <div className="mt-1">→ span: cyber-1970s + 1980s mainframe + 2010s devops</div>
          <div className="mt-1">→ core constraint: monospace everything; no ornament</div>
          <div className="mt-1">→ attention: phosphor green + blinking caret</div>
          <div className="mt-4 text-green-400">// FORM_FACTOR:</div>
          <pre className="mt-2 leading-tight text-green-400">
{` ┌──────────────────────────────┐
 │  > hello world              │
 │  > rendered in pure ascii   │
 │  > █                       │
 └──────────────────────────────┘`}
          </pre>
          <div className="mt-4 text-amber-300">$ ls ./styles_20</div>
          <div className="mt-1 text-green-300/80">
            glass.png  clay.png  brutal.png  cyber.png  soft.png  editorial.png<br/>
            y2k.png  memphis.png  vapor.png  bauhaus.png  deco.png  bento.png<br/>
            retro_future.png  aurora.png  terminal.png  wabisabi.png<br/>
            genz.png  handdrawn.png  neobrutal.png  liquid_chrome.png
          </div>
          <div className="mt-4 text-green-400">█</div>
        </div>

        <div className="space-y-3">
          <div className="rounded border border-green-700 bg-black p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-green-400">[RAM]</div>
            <div className="mt-2 font-mono text-2xl text-amber-300">64 KB</div>
            <div className="h-1.5 mt-2 rounded-full bg-green-900">
              <div className="h-1.5 rounded-full bg-green-400" style={{ width: '24%' }} />
            </div>
          </div>
          <div className="rounded border border-green-700 bg-black p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-green-400">[CPU]</div>
            <pre className="mt-2 font-mono text-[10px] text-green-400">
{`  ┌──────────────┐
  │░░████████████│
  │░░████  LOAD  │
  │░░████████████│
  │░░▓▓▓▓▓▓▓▓▓▓▓▓│
  └──────────────┘`}
            </pre>
          </div>
          <div className="rounded border border-amber-700 bg-amber-950/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-300">[RWARN]</div>
            <div className="mt-1 font-mono text-[11px] text-amber-200">no_borders_defined</div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-green-300/60">
        <span>// STACK: ASCII ART + MONO + PHOSPHOR GREEN + SCANLINE</span>
        <span>case 15 / 20</span>
      </footer>
    </div>
  );
}

export function ArtDecoSection() { return <div className="h-full w-full overflow-hidden"><ArtDecoHero /></div>; }
export function BentoSection() { return <div className="h-full w-full overflow-hidden"><BentoHero /></div>; }
export function RetroFutureSection() { return <div className="h-full w-full overflow-hidden"><RetroFutureHero /></div>; }
export function AuroraSection() { return <div className="h-full w-full overflow-hidden"><AuroraHero /></div>; }
export function TerminalSection() { return <div className="h-full w-full overflow-hidden"><TerminalHero /></div>; }
