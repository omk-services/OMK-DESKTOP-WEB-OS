/** DesignApp — Twenty aesthetic front-end style showcases (sidebar + content canvas).
 *
 *  Each style is a self-contained visual system rendered inside the Coach OS
 *  AppFrame. Sidebar style-navigator (left rail) → content canvas (right pane).
 *  Click a style in the sidebar and the canvas re-skins to that aesthetic.
 *
 *  Twenty styles, twenty distinct design languages, zero template-library defaults:
 *   01 Glassmorphism  — frosted glass cards, depth-through-translucency
 *   02 Claymorphism   — bulgy 3D plastic, vivid chromatic shadows
 *   03 Brutalism      — raw, oversized, JetBrains Mono, 4px black borders
 *   04 Cyberpunk      — synthwave grid, magenta/cyan neon, scanlines
 *   05 Soft UI / Neu  — inset shadows, single-hue neumorphic
 *   06 Editorial Mag  — Fraunces serif, bento composition, fine rule
 *   07 Y2K Chrome     — chrome bevel, butterfly clips, blingee gradient
 *   08 Memphis 80s    — squiggles, terrazzo, post-modern primary palette
 *   09 Vaporwave      — Greek statues, palm trees, pink/cyan surreal
 *   10 Bauhaus        — primary colors, geometric grid, asymmetric type
 *   11 Art Deco       — gold fan, stepped forms, vertical symmetry
 *   12 Bento          — Japanese bento grid, dotted texture, restrained
 *   13 Retro Future   — 1950s atomic, halftone, pastel + chrome
 *   14 Aurora Mesh    — multi-stop mesh gradient, soft glow orbs
 *   15 Terminal Mono  — monospace everything, green-on-black, blinking caret
 *   16 Wabi-sabi      — Japanese restraint, intentional asymmetry, washi texture
 *   17 GenZ Linear    — subtle gradients, geometric shape language, micro-interactions
 *   18 Hand-drawn     — wobbly strokes, watercolor blobs, imperfect circles
 *   19 Neo-brutalist  — louder than brutalism, primary blocks, "design as protest"
 *   20 Liquid Chrome  — fluid metal surface, mirror reflections, iridescent
 */

import { useEffect, useMemo, useState } from 'react';
import {
  GlassWater, Shapes, Zap, Sparkles, BookOpen, Layers, Wand2, Quote,
  Star, Hexagon, CloudSun, Triangle, Diamond, LayoutGrid, Sun, Rainbow,
  Terminal, Leaf, Workflow, PenTool, Megaphone, Droplets,
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
  { id: 'glass',        label: 'Glassmorphism',   caption: 'Frosted glass · depth-through-translucency',           palette: 'aurora cyan / violet / milky',          icon: GlassWater },
  { id: 'clay',         label: 'Claymorphism',    caption: 'Bulgy 3D plastic · vivid chromatic shadows',           palette: 'coral / lemon / sky / mint',            icon: Shapes    },
  { id: 'brutalism',    label: 'Brutalism',       caption: 'Raw · oversized type · 4px black borders · mono',      palette: 'acid yellow + black',                    icon: Zap       },
  { id: 'cyberpunk',    label: 'Cyberpunk Neon',  caption: 'Synthwave grid · magenta/cyan neon · scanlines',       palette: 'magenta #ff2bd6 / cyan #00f0ff',        icon: Sparkles  },
  { id: 'softui',       label: 'Soft UI / Neu',   caption: 'Inset shadows · single-hue neumorphic surfaces',       palette: 'warm gray monochrome',                   icon: Layers    },
  { id: 'editorial',    label: 'Editorial Mag',   caption: 'Fraunces serif · bento · fine rule · high contrast',  palette: 'ink black + cream + gold',             icon: BookOpen  },
  { id: 'y2k',          label: 'Y2K Chrome',      caption: 'Chrome bevel · fractal plastic · blingee gradients',  palette: 'silver mirror + electric blue + pink', icon: Star      },
  { id: 'memphis',      label: 'Memphis 80s',     caption: 'Squiggles · terrazzo · postmodern primary palette',    palette: 'aqua + magenta + lemon + black dots',   icon: Hexagon   },
  { id: 'vapor',        label: 'Vaporwave',       caption: 'Greek statues · palm trees · pink/cyan surreal',       palette: 'hot pink + cyan + teal + lavender',     icon: CloudSun  },
  { id: 'bauhaus',      label: 'Bauhaus',         caption: 'Primary colors · geometric grid · asymmetric type',    palette: 'red + yellow + blue + black',           icon: Triangle  },
  { id: 'artdeco',      label: 'Art Deco',        caption: 'Gold fan · stepped forms · vertical symmetry',        palette: 'gold + ink + oxblood',                   icon: Diamond   },
  { id: 'bento',        label: 'Bento',           caption: 'Japanese bento grid · dotted texture · restrained',    palette: 'rice paper + black ink + ochre',        icon: LayoutGrid },
  { id: 'retrofuture',  label: 'Retro Future',    caption: '1950s atomic · halftone · pastel + chrome',            palette: 'mint + salmon + chrome + mustard',      icon: Sun       },
  { id: 'aurora',       label: 'Aurora Mesh',     caption: 'Multi-stop mesh gradient · soft glow orbs',           palette: 'aurora borealis · teal + magenta',      icon: Rainbow   },
  { id: 'terminal',     label: 'Terminal Mono',   caption: 'All monospace · green-on-black · blinking caret',    palette: 'amber #ffb000 / phosphor green',       icon: Terminal  },
  { id: 'wabisabi',     label: 'Wabi-sabi',       caption: 'Japanese restraint · intentional asymmetry',          palette: 'washi cream + sumi ink + clay',         icon: Leaf      },
  { id: 'genz',         label: 'GenZ Linear',     caption: 'Subtle gradients · rounded geometric · micro-motion',  palette: 'lavender + indigo + electric mint',     icon: Workflow  },
  { id: 'handdrawn',    label: 'Hand-drawn',      caption: 'Wobbly strokes · watercolor blobs · imperfect',        palette: 'crayon + watercolor + sketch paper',    icon: PenTool   },
  { id: 'neobrutal',    label: 'Neo-brutalist',   caption: 'Louder than brutalism · primary blocks · design protest', palette: 'red + electric blue + lemon + black', icon: Megaphone },
  { id: 'liquidchrome', label: 'Liquid Chrome',   caption: 'Fluid metal · mirror reflections · iridescent',        palette: 'mirror silver + iridescent oil',       icon: Droplets  },
];


/* ─────────────────────────── GLASSMORPHISM ─────────────────────────── */

function GlassHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
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
        <span>case 01 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── CLAYMORPHISM ─────────────────────────── */

function ClayHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
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
        <span>case 02 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── BRUTALISM ─────────────────────────── */

function BrutalismHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
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
        <span>case 03 / 20</span>
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
        <span>case 04 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── SOFT UI / NEUMORPHISM ─────────────────────────── */

function SoftUiHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
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
        <span>case 05 / 20</span>
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
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontVariationSettings: "'opsz' 144, 'wght' 400" }}>
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
        <span>case 06 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── TOP PANEL: WHICH STYLE ARE YOU? ─────────────────────────── */

function StylePickerPanel({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <div className="space-y-3 p-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-500">Front-end aesthetic roster</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Twenty front-ends. One sidebar.</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-stone-600">
          This app exists to <strong>demonstrate</strong> — twenty different design languages rendered live
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
    <div className="h-full w-full overflow-hidden">
      <GlassHero />
    </div>
  );
}

function ClaySection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <ClayHero />
    </div>
  );
}

function BrutalismSection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <BrutalismHero />
    </div>
  );
}

function CyberSection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <CyberHero />
    </div>
  );
}

function SoftUiSection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <SoftUiHero />
    </div>
  );
}

function EditorialSection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <EditorialHero />
    </div>
  );
}

function Y2KSection() { return <div className="h-full w-full overflow-hidden"><Y2KHero /></div>; }
function MemphisSection() { return <div className="h-full w-full overflow-hidden"><MemphisHero /></div>; }
function VaporSection() { return <div className="h-full w-full overflow-hidden"><VaporHero /></div>; }
function BauhausSection() { return <div className="h-full w-full overflow-hidden"><BauhausHero /></div>; }
function ArtDecoSection() { return <div className="h-full w-full overflow-hidden"><ArtDecoHero /></div>; }
function BentoSection() { return <div className="h-full w-full overflow-hidden"><BentoHero /></div>; }
function RetroFutureSection() { return <div className="h-full w-full overflow-hidden"><RetroFutureHero /></div>; }
function AuroraSection() { return <div className="h-full w-full overflow-hidden"><AuroraHero /></div>; }
function TerminalSection() { return <div className="h-full w-full overflow-hidden"><TerminalHero /></div>; }
function WabiSabiSection() { return <div className="h-full w-full overflow-hidden"><WabiSabiHero /></div>; }
function GenzSection() { return <div className="h-full w-full overflow-hidden"><GenzHero /></div>; }
function HandDrawnSection() { return <div className="h-full w-full overflow-hidden"><HandDrawnHero /></div>; }
function NeoBrutalSection() { return <div className="h-full w-full overflow-hidden"><NeoBrutalHero /></div>; }
function LiquidChromeSection() { return <div className="h-full w-full overflow-hidden"><LiquidChromeHero /></div>; }

/* ─────────────────────────── 07 Y2K CHROME ─────────────────────────── */

function Y2KHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'linear-gradient(135deg, #f5d0fe 0%, #bae6fd 35%, #c4b5fd 70%, #fbcfe8 100%)' }}>
      {/* Floating chrome orbs */}
      <div className="absolute right-12 top-12 h-44 w-44 rounded-full"
        style={{ background: 'radial-gradient(circle at 30% 30%, #fff 0%, #c4b5fd 30%, #6d28d9 70%, #1e1b4b 100%)',
          boxShadow: 'inset -8px -10px 24px rgba(255,255,255,0.5), 0 12px 32px rgba(109,40,217,0.4)' }} />
      <div className="absolute left-8 bottom-8 h-32 w-32 rounded-full"
        style={{ background: 'radial-gradient(circle at 70% 70%, #fef9c3 0%, #f472b6 60%, #831843 100%)',
          boxShadow: 'inset -6px -8px 18px rgba(255,255,255,0.5), 0 8px 24px rgba(190,24,93,0.4)' }} />
      {/* Butterfly/butterfly-clip SVG */}
      <svg className="absolute right-1/3 top-1/3 h-12 w-12 text-white/70" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 10 C30 10 15 25 15 45 C15 65 30 75 50 50 C70 75 85 65 85 45 C85 25 70 10 50 10 Z" />
      </svg>

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full border-2 border-white bg-gradient-to-br from-pink-300 via-purple-400 to-blue-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            ★ blingee.co
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-900">// y2k_manifesto</span>
        </div>
        <div className="rounded-full border-2 border-fuchsia-700 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-fuchsia-900 backdrop-blur">
          ver 2001
        </div>
      </header>

      <div className="relative z-10 mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border-2 border-white bg-white/30 p-7 backdrop-blur-xl"
          style={{ boxShadow: '0 8px 0 #c084fc, inset 0 0 32px rgba(255,255,255,0.5)' }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-700">★ era: 2001-2004</div>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] text-fuchsia-900"
            style={{ fontFamily: 'Trebuchet MS, sans-serif',
              textShadow: '3px 3px 0 #fff, -1px -1px 0 #c084fc' }}>
            SPARKLE.<br/>
            CRYSTAL.<br/>
            <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              chrome hair.
            </span>
          </h1>
          <p className="mt-4 max-w-md font-medium text-[13px] text-fuchsia-900/80">
            // Y2K refuses the minimal grid. Butterfly clips, fractal plastic,
            // mirrored chrome, electric blue. Form as sentiment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full border-2 border-fuchsia-900 bg-white px-5 py-2 text-[12px] font-black uppercase text-fuchsia-900 shadow-[3px_3px_0_#581c87]">
              ★ sign guestbook
            </button>
            <button className="rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 px-5 py-2 text-[12px] font-black uppercase text-white shadow-[3px_3px_0_#831843]">
              ♥ add to favs
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Glitter', v: '∞', c: 'from-pink-300 to-purple-400' },
            { l: 'Bling', v: '424', c: 'from-yellow-300 to-orange-400' },
            { l: 'Visitors', v: '12k', c: 'from-cyan-300 to-blue-400' },
            { l: 'Mood', v: '✨', c: 'from-fuchsia-300 to-rose-400' },
          ].map((s) => (
            <div key={s.l} className={`rounded-2xl border-2 border-white bg-gradient-to-br ${s.c} p-4 text-white shadow-md`}>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.l}</div>
              <div className="mt-1 text-2xl font-black">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-fuchsia-900">
        <span>// stack: chrome radial gradients + butterfly-clips + offset shadows</span>
        <span>case 07 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 08 MEMPHIS 80s ─────────────────────────── */

function MemphisHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#fef9c3' }}>
      {/* Memphis pattern overlay */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 15% 25%, #00000010 0%, transparent 12%), radial-gradient(circle at 85% 75%, #00000012 0%, transparent 10%), radial-gradient(circle at 75% 15%, #ec489950 0%, transparent 8%)' }} />
      {/* Squiggle */}
      <svg className="absolute right-12 top-16 h-24 w-24" viewBox="0 0 100 100">
        <path d="M10 50 Q 25 20, 40 50 T 70 50 T 90 50" stroke="#ec4899" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
      {/* Triangles */}
      <div className="absolute left-1/3 bottom-12 h-16 w-16 rotate-45 bg-cyan-400" />
      <div className="absolute left-12 top-1/3 h-12 w-12 rounded-full bg-yellow-300 border-4 border-black" />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-magenta-500 text-white border-[3px] border-black">
            <Hexagon className="h-4 w-4" strokeWidth={3} />
          </div>
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-black">memphis.group</span>
        </div>
        <div className="flex gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-black">
          <span className="rounded-full border-2 border-black bg-white px-2 py-0.5">est 1981</span>
          <span className="rounded-full border-2 border-black bg-cyan-300 px-2 py-0.5">★ milan</span>
        </div>
      </header>

      <div className="relative z-10 mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border-[4px] border-black bg-white p-7"
          style={{ boxShadow: '10px 10px 0 #ec4899' }}>
          <div className="inline-block rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black border-2 border-black">
            ✦ postmodern
          </div>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-black"
            style={{ fontFamily: 'Verdana, sans-serif' }}>
            CHAOS<br/>
            IS A<br/>
            <span className="bg-yellow-300 px-2">SYSTEM</span>.
          </h1>
          <p className="mt-4 max-w-md text-[13px] font-bold uppercase leading-snug text-black/70">
            // Memphis rejects the grid. Squiggles, dots, triangles, primary
            // colors. Pattern as principle. Order as joy.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="rounded-full bg-magenta-500 px-5 py-2.5 text-[12px] font-black uppercase tracking-wider text-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              ✦ enter
            </button>
            <button className="rounded-full bg-cyan-300 px-5 py-2.5 text-[12px] font-black uppercase tracking-wider text-black border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              ◯ catalogue
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Shapes', v: '47', c: 'bg-cyan-300', s: 'border-[3px] border-black' },
            { l: 'Colors', v: '6', c: 'bg-magenta-500 text-white', s: 'border-[3px] border-black' },
            { l: 'Squiggles', v: '12', c: 'bg-yellow-300', s: 'border-[3px] border-black' },
            { l: 'Ettore', v: '✓', c: 'bg-lime-300', s: 'border-[3px] border-black' },
          ].map((s) => (
            <div key={s.l} className={`rounded-2xl ${s.c} ${s.s} p-4`} style={{ boxShadow: '6px 6px 0 #000' }}>
              <div className="text-[10px] font-black uppercase tracking-widest">{s.l}</div>
              <div className="mt-1 text-2xl font-black">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-widest text-black">
        <span>// STACK: SQUIGGLES + DOTS + OFFSET SHADOWS + GEOMETRIC LAYOUT</span>
        <span>case 08 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 09 VAPORWAVE ─────────────────────────── */

function VaporHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'linear-gradient(180deg, #1a0033 0%, #4a0e4e 30%, #ff006e 70%, #ffb800 100%)' }}>
      {/* Sunset stripes */}
      <div className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 38px, rgba(255,255,255,0.04) 38px, rgba(255,255,255,0.04) 40px), repeating-linear-gradient(0deg, transparent 0px, transparent 76px, rgba(255,255,255,0.06) 76px, rgba(255,255,255,0.06) 78px)',
        }} />
      {/* Greek columns */}
      <div className="absolute left-8 bottom-0 flex gap-3">
        <div className="h-40 w-10 bg-white/10" style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', borderRight: '2px solid rgba(255,255,255,0.2)' }} />
        <div className="h-40 w-10 bg-white/10" style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', borderRight: '2px solid rgba(255,255,255,0.2)' }} />
      </div>
      {/* Palm tree */}
      <svg className="absolute right-16 bottom-12 h-48 w-32" viewBox="0 0 100 200">
        <rect x="45" y="80" width="10" height="120" fill="#1a0033" />
        <path d="M50 80 Q 20 50, 10 30 Q 30 50, 50 80 Q 70 50, 90 30 Q 80 50, 50 80" fill="#1a0033" />
        <path d="M50 80 Q 25 60, 15 35 Q 40 60, 50 80" fill="#1a0033" />
        <path d="M50 80 Q 75 60, 85 35 Q 60 60, 50 80" fill="#1a0033" />
      </svg>

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CloudSun className="h-5 w-5 text-cyan-300" style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300"
            style={{ textShadow: '0 0 6px #00f0ff' }}>
            ｖａｐｏｒｗａｖｅ ／ ＡＥＳＴＨＥＴＩＣ
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-pink-300"
          style={{ textShadow: '0 0 6px #ff006e' }}>
          ローマ字 ／ 〒１０４
        </span>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border-2 border-cyan-300/40 bg-pink-500/20 p-7 backdrop-blur-md"
          style={{ boxShadow: '0 0 32px #ff006e80, inset 0 0 24px #00f0ff40' }}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-300"
            style={{ textShadow: '0 0 6px #00f0ff' }}>
            ◆ ＭＥＭＯＲＩＥＳ ／ ＯＦ ／ ＦＵＴＵＲＥ
          </div>
          <h1 className="mt-3 text-5xl font-black leading-[0.92] text-white"
            style={{ fontFamily: 'Times New Roman, serif',
              textShadow: '3px 3px 0 #ff006e, 6px 6px 0 #00f0ff' }}>
            ＴＨＥ<br/>
            ＷＡＶＥ<br/>
            ＮＥＶＥＲ<br/>
            ＥＮＤＳ.
          </h1>
          <p className="mt-4 max-w-md font-mono text-[12px] uppercase leading-relaxed text-cyan-200">
            // roman busts, palm trees, magenta sunset. Aesthetic as
            // nostalgia for a future that never shipped.
          </p>
          <button className="mt-5 rounded border-2 border-cyan-300 bg-cyan-400/20 px-5 py-2 font-mono text-[11px] font-black uppercase tracking-widest text-cyan-300"
            style={{ boxShadow: '0 0 12px #00f0ff' }}>
            ▸ ＴＲＡＮＳＣＥＮＤ
          </button>
        </div>
        <div className="space-y-3">
          <div className="rounded border-2 border-pink-300/40 bg-pink-500/20 p-4 backdrop-blur-md">
            <div className="font-mono text-[10px] uppercase text-pink-300">▣ ＳＴＡＴ</div>
            <div className="mt-2 font-mono text-3xl font-black text-white" style={{ textShadow: '2px 2px 0 #ff006e' }}>
              ＄ ４，２００
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Ａ', 'Ｅ', 'Ｓ', 'Ｔ'].map((l) => (
              <div key={l} className="rounded border-2 border-cyan-300/40 bg-cyan-400/20 p-2 text-center font-mono text-xl font-black text-white"
                style={{ textShadow: '2px 2px 0 #ff006e' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
        <span>// STACK: SUNSET GRADIENT + GREEK COLUMNS + PALM TREES + WIDE TRACKING</span>
        <span>case 09 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 10 BAUHAUS ─────────────────────────── */

function BauhausHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8" style={{ background: '#f5f0e8' }}>
      <header className="relative z-10 flex items-center justify-between border-b-2 border-stone-900 pb-3">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-3 w-3 bg-red-600" />
            <div className="h-3 w-3 bg-yellow-400" />
            <div className="h-3 w-3 bg-blue-700" />
            <div className="h-3 w-3 bg-stone-900" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-stone-900">Bauhaus · Dessau · 1923</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-stone-700">
          ↓ form follows function
        </div>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-12 gap-3">
        {/* Big circle */}
        <div className="col-span-5">
          <div className="relative flex h-56 items-center justify-center rounded-full bg-yellow-400">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-red-600" />
            <div className="absolute -bottom-8 -right-8 h-20 w-20 bg-blue-700" />
            <div className="z-10 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-stone-900">FORM · FOLLOWS</div>
              <div className="text-3xl font-black uppercase tracking-tight text-stone-900" style={{ fontFamily: 'Helvetica, sans-serif' }}>FUNCTION</div>
            </div>
          </div>
        </div>
        <div className="col-span-7 space-y-3">
          <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tight text-stone-900"
            style={{ fontFamily: 'Helvetica, sans-serif' }}>
            LESS IS<br/>
            <span className="text-stone-400 line-through decoration-red-600 decoration-[6px]">BORING.</span><br/>
            LESS IS<br/>
            <span className="bg-yellow-300 px-2">MORE.</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-12 w-1 bg-red-600" />
            <p className="max-w-md text-[14px] leading-relaxed text-stone-700">
              <em className="font-bold not-italic text-red-700">Asymmetric</em> grids. Primary colors.
              Geometric primitives. The composition itself is the content.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-4 gap-3">
        {[
          { l: 'Red', v: '#dc2626', c: 'bg-red-600' },
          { l: 'Yellow', v: '#facc15', c: 'bg-yellow-400' },
          { l: 'Blue', v: '#1d4ed8', c: 'bg-blue-700' },
          { l: 'Black', v: '#000000', c: 'bg-stone-900' },
        ].map((s) => (
          <div key={s.l} className={`rounded-sm ${s.c} p-3 text-white`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.l}</div>
            <div className="font-mono text-[12px] font-bold">{s.v}</div>
          </div>
        ))}
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-600">
        <span>// STACK: HELVETICA + PRIMARY COLORS + GEOMETRIC PRIMITIVES</span>
        <span>case 10 / 20</span>
      </footer>
    </div>
  );
}

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

/* ─────────────────────────── 16 WABI-SABI ─────────────────────────── */

function WabiSabiHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#e8e2d8' }}>
      {/* Washi paper texture */}
      <div className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: 'radial-gradient(ellipse at 30% 30%, #6b4226 0%, transparent 25%), radial-gradient(ellipse at 70% 70%, #6b4226 0%, transparent 30%)' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Leaf className="h-4 w-4 text-stone-700" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-stone-700">侘寂 · wabi-sabi · mu</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-stone-600">the beauty of imperfection</div>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-12 gap-5">
        {/* Ink brush stroke */}
        <div className="col-span-5">
          <svg viewBox="0 0 200 200" className="h-64 w-full">
            <path d="M30 100 Q 60 60, 100 80 T 170 100 Q 140 140, 100 130 T 30 100"
              stroke="#1c1917" strokeWidth="14" fill="none" strokeLinecap="round" opacity={0.85} />
            <circle cx="160" cy="50" r="3" fill="#1c1917" />
            <circle cx="50" cy="160" r="2.5" fill="#1c1917" />
          </svg>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-stone-600">// sumi-e · 書道</div>
        </div>

        <div className="col-span-7 space-y-3">
          <h1 className="text-5xl font-light leading-[0.95] tracking-tight text-stone-900"
            style={{ fontFamily: 'Times, serif' }}>
            不完<br/>
            美<br/>
            <span className="text-3xl italic text-stone-600">incompleteness.</span>
          </h1>
          <p className="max-w-md text-[14px] italic leading-relaxed text-stone-700"
            style={{ fontFamily: 'Times, serif' }}>
            Beauty ages. Wabi-sabi is the discipline of the asymmetric, the
            unpolished, the incomplete. Nothing screams. Everything breathes.
          </p>
          <div className="flex items-center gap-3">
            <button className="border border-stone-900 bg-transparent px-5 py-2 font-serif text-[13px] italic text-stone-900 hover:bg-stone-900 hover:text-stone-50">
              observe →
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-600">
              自然 · nature alone
            </span>
          </div>
        </div>

        <div className="col-span-6 rounded-sm bg-stone-100/50 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">// stone 01</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="aspect-square rounded-full bg-stone-400/60" />
            <div className="aspect-square rounded-sm bg-stone-300/60" />
            <div className="aspect-square rounded-full bg-stone-500/60" />
          </div>
        </div>
        <div className="col-span-6 rounded-sm bg-stone-200/50 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">// 静けさ · silence</div>
          <div className="mt-3 flex items-end gap-1">
            {[3,5,4,7,5,3,5].map((h,i) => (
              <div key={i} className="w-3 rounded-sm bg-stone-700" style={{ height: h*4+'px', opacity: 0.3+h*0.07 }} />
            ))}
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-600">
        <span>// STACK: ASYMMETRIC LAYOUT + INK BRUSH + WASHI + RESTRAINT</span>
        <span>case 16 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 17 GENZ LINEAR ─────────────────────────── */

function GenzHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8" style={{ background: '#fafafa' }}>
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500">
            <Workflow className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-violet-600">linear</div>
            <div className="text-base font-bold text-stone-900" style={{ letterSpacing: '-0.02em' }}>Project flow · Q3</div>
          </div>
        </div>
        <div className="flex gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">▢ In progress</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">● Shipped</span>
        </div>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-stone-900">
            Move fast.<br/>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              Ship with taste.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
            Subtle gradients. Soft 16px corner radius. Micro-interactions on
            hover that feel designer-not-engineer. Everything earns its place.
          </p>

          {/* Compact soft cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { l: 'In progress', n: '8', c: 'from-violet-500 to-fuchsia-500' },
              { l: 'In review', n: '3', c: 'from-amber-400 to-orange-500' },
              { l: 'Shipped', n: '12', c: 'from-emerald-400 to-cyan-500' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white p-4"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)' }}>
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${s.c}`} />
                <div className="mt-3 text-2xl font-bold text-stone-900">{s.n}</div>
                <div className="text-[11px] font-medium text-stone-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)' }}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-stone-500">Quick capture</div>
            <input className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[13px] text-stone-900 outline-none focus:border-violet-500"
              defaultValue="Email Diego re: spec revision" />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white">
            <div className="text-[10px] font-medium uppercase tracking-widest opacity-80">Today</div>
            <div className="mt-1 text-base font-semibold">12:30 · Open House demo</div>
            <div className="text-[11px] opacity-80">→ 45 min prep</div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-stone-900 px-3 py-2 text-center text-[11px] font-semibold text-white">New issue</div>
            <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-stone-700">Filter</div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-400">
        <span>// stack: micro-gradients + soft shadow + bold tracking-tight</span>
        <span>case 17 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 18 HAND-DRAWN ─────────────────────────── */

function HandDrawnHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#fffaf0',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 22px, rgba(0,0,0,0.02) 22px, rgba(0,0,0,0.02) 23px)' }}>
      {/* Watercolor blobs */}
      <div className="absolute left-12 top-12 h-32 w-32 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, #fda4af 30%, transparent 70%)' }} />
      <div className="absolute right-16 bottom-20 h-40 w-40 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #93c5fd 30%, transparent 70%)' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PenTool className="h-4 w-4 text-rose-700" strokeWidth={1.5} />
          <span className="font-handwriting text-[15px] font-bold text-stone-900" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            ✦ Kelsey's sketchbook ✦
          </span>
        </div>
        <span className="text-[11px] font-bold text-stone-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          page 14 · Tuesday
        </span>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-1 gap-7 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] text-stone-900"
            style={{ fontFamily: 'Comic Sans MS, cursive', textDecoration: 'underline wavy #f43f5e' }}>
            Make it<br/>
            imperfect.<br/>
            <span className="text-rose-600">make it yours.</span>
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-stone-700"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Wobbly lines. Watercolor blobs. Crooked circles. Anti-perfect as a
            design choice — the human hand was always the point.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="rounded-2xl border-2 border-dashed border-rose-700 bg-rose-100 px-5 py-2.5 text-[13px] font-bold text-rose-900"
              style={{ fontFamily: 'Comic Sans MS, cursive', boxShadow: '3px 3px 0 #be123c' }}>
              ♥ try the demo
            </button>
            <button className="rounded-2xl border-2 border-dashed border-blue-700 bg-blue-100 px-5 py-2.5 text-[13px] font-bold text-blue-900"
              style={{ fontFamily: 'Comic Sans MS, cursive', boxShadow: '3px 3px 0 #1d4ed8' }}>
              ↗ see sketch
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border-2 border-dashed border-yellow-600 bg-yellow-50 p-4"
            style={{ transform: 'rotate(-2deg)' }}>
            <div className="text-[11px] font-bold text-yellow-900" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              ★ a doodle
            </div>
            <svg viewBox="0 0 100 100" className="mt-2 w-full">
              <path d="M10 50 Q 25 30, 50 50 T 90 50" stroke="#ca8a04" strokeWidth="3" fill="none" strokeDasharray="4 4" strokeLinecap="round" />
              <circle cx="30" cy="40" r="8" fill="#fbbf24" stroke="#ca8a04" strokeWidth="2" />
              <circle cx="70" cy="60" r="6" fill="#f97316" stroke="#7c2d12" strokeWidth="2" />
              <text x="50" y="85" textAnchor="middle" fontSize="6" fill="#78716c" fontFamily="Comic Sans MS, cursive">wavy line !</text>
            </svg>
          </div>
          <div className="rounded-3xl border-2 border-dashed border-green-700 bg-green-50 p-4"
            style={{ transform: 'rotate(1.5deg)' }}>
            <div className="text-[11px] font-bold text-green-900" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              🌿 the team
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['K','J','M'].map((n) => (
                <div key={n} className="grid h-12 place-items-center rounded-full border-2 border-dashed border-green-700 bg-white text-[15px] font-bold text-green-900"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}>{n}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between text-[11px] font-bold text-stone-700"
        style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <span>// stack: cursive type + watercolor blobs + dashed borders + perfect imperfection</span>
        <span>case 18 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 19 NEO-BRUTALIST ─────────────────────────── */

function NeoBrutalHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: '#fef3c7' }}>
      <header className="relative z-10 flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-red-600" strokeWidth={3} fill="currentColor" />
          <span className="font-mono text-[12px] font-black uppercase tracking-[0.2em] text-black">
            !!! SOCIAL_MEDIA_IS_DEAD !!!
          </span>
        </div>
        <div className="rounded-full border-[4px] border-black bg-red-500 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-white">
          ★ trending ★
        </div>
      </header>

      <div className="relative z-10 mt-10 grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <h1 className="text-7xl font-black leading-[0.82] tracking-tighter text-black"
            style={{ fontFamily: 'Impact, sans-serif' }}>
            DESIGN<br/>
            IS A<br/>
            <span className="bg-red-500 px-2 text-white" style={{ transform: 'rotate(-1.5deg)', display: 'inline-block' }}>
              PROTEST
            </span>.
          </h1>
          <p className="mt-5 max-w-md border-l-[8px] border-black bg-yellow-300 px-3 py-2 font-mono text-[13px] font-black uppercase leading-snug text-black">
            // neo-brutalism = bigger, brighter, LOUDER than the old brutalism.
            // primary color blocks. 5px borders. NO FADE.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="border-[5px] border-black bg-blue-600 px-6 py-3 font-mono text-[14px] font-black uppercase tracking-wider text-white"
              style={{ boxShadow: '8px 8px 0 #000' }}>
              ▸ SUBSCRIBE
            </button>
            <button className="border-[5px] border-black bg-white px-6 py-3 font-mono text-[14px] font-black uppercase tracking-wider text-black"
              style={{ boxShadow: '8px 8px 0 #dc2626' }}>
              ▸ READ MORE →
            </button>
          </div>
        </div>

        <div className="col-span-5 space-y-3">
          <div className="border-[5px] border-black bg-red-500 p-4 text-white"
            style={{ boxShadow: '8px 8px 0 #000' }}>
            <div className="font-mono text-[10px] font-black uppercase tracking-widest">⚡ VIRAL</div>
            <div className="mt-2 font-mono text-5xl font-black">12.4K</div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-90">today</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-[4px] border-black bg-yellow-400 p-3 text-center"
              style={{ boxShadow: '6px 6px 0 #000' }}>
              <div className="font-mono text-[9px] font-black uppercase tracking-widest">★</div>
              <div className="font-mono text-2xl font-black">328</div>
            </div>
            <div className="border-[4px] border-black bg-blue-600 p-3 text-center text-white"
              style={{ boxShadow: '6px 6px 0 #000' }}>
              <div className="font-mono text-[9px] font-black uppercase tracking-widest">♥</div>
              <div className="font-mono text-2xl font-black">2k</div>
            </div>
          </div>
          <div className="border-[4px] border-black bg-white p-3"
            style={{ boxShadow: '6px 6px 0 #ec4899' }}>
            <div className="font-mono text-[10px] font-black uppercase tracking-widest text-rose-600">★ HEADLINE</div>
            <div className="mt-1 font-mono text-[12px] font-black leading-tight text-black">"ALGORITHM-FREE<br/>SINCE 2010"</div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-widest text-black">
        <span>// STACK: 5PX BORDERS + IMPACT + COLOR BLOCKS + SHOUT TYPOGRAPHY</span>
        <span>case 19 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── 20 LIQUID CHROME ─────────────────────────── */

function LiquidChromeHero() {
  return (
    <div className="relative h-full w-full overflow-hidden p-8"
      style={{ background: 'linear-gradient(135deg, #0c0c0c 0%, #1f1f1f 50%, #0c0c0c 100%)' }}>
      {/* Iridescent background */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'conic-gradient(from 180deg at 50% 50%, #ff006e, #00f0ff, #ffbe0b, #8338eb, #ff006e)',
          filter: 'blur(60px)' }} />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Droplets className="h-5 w-5 text-cyan-300" strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 0 8px #00f0ff)' }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200"
            style={{ textShadow: '0 0 8px #00f0ff80' }}>
            liquid_mirror.os · v∞
          </span>
        </div>
        <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
          iridescent · α
        </span>
      </header>

      <div className="relative z-10 mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-200"
            style={{ textShadow: '0 0 6px #00f0ff80' }}>
            MIRROR · FLUID · CHROME
          </div>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight text-white"
            style={{ background: 'linear-gradient(135deg, #ff006e 0%, #ffbe0b 30%, #00f0ff 60%, #8338eb 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Surface that<br/>
            reflects itself<br/>
            forever.
          </h1>
          <p className="mt-5 max-w-md text-[13px] leading-relaxed text-white/80">
            Liquid chrome is the material of tomorrow's interfaces — mirror
            reflections, iridescent oil, surfaces that move with you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full px-5 py-2.5 text-[12px] font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #ffbe0b, #ff006e)',
                boxShadow: '0 8px 24px #ff006e60' }}>
              Try the platform
            </button>
            <button className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-[12px] font-bold text-white backdrop-blur">
              See demos
            </button>
          </div>
        </div>

        <div className="relative mx-auto h-72 w-72">
          {/* Chrome spheres */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-56 w-56 rounded-full"
              style={{ background: 'conic-gradient(from 200deg at 50% 50%, #ff006e, #ffbe0b, #00f0ff, #8338eb, #3a86ff, #ff006e)',
                boxShadow: '0 0 60px rgba(255,255,255,0.3), inset -8px -12px 32px rgba(0,0,0,0.5)' }} />
            <div className="absolute inset-12 rounded-full"
              style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, transparent 30%), radial-gradient(circle at 70% 70%, #000000 0%, transparent 30%)',
                backdropFilter: 'blur(8px)' }} />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
            surface state · liquid
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/60">
        <span>// stack: conic gradients + radial highlight + inset shadow + iridescent</span>
        <span>case 20 / 20</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────── TOP-LEVEL APP ─────────────────────────── */

export function DesignApp() {
  const [activeId, setActiveId] = useState<string>('overview');

  // Le picker de l'Overview annonce « Pick a style in the sidebar to re-skin
  // the canvas » — mais onPick ne mutait que cet activeId local, alors que la
  // section affichee est pilotee par l'activeId interne d'AppFrame. Cliquer
  // une carte ne changeait donc que son propre surlignage : la promesse
  // n'etait pas tenue. AppFrame passe `navigateToSection` a chaque section
  // pour ce cas precis ; on s'en sert. Cela suppose que l'id du style et
  // l'id de la section coincident — seul « cyberpunk » divergeait, declare
  // « cyber » ici. Aligne.
  const sections: AppSection[] = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Wand2,
      render: ({ navigateToSection }: { navigateToSection: (id: string) => void }) => (
        <OverviewPanel
          activeId={activeId === 'overview' ? 'glass' : activeId}
          onPick={(id) => { setActiveId(id); navigateToSection(id); }}
        />
      ) },
    { id: 'glass', label: 'Glass', icon: GlassWater, render: () => <GlassSection /> },
    { id: 'clay', label: 'Clay', icon: Shapes, render: () => <ClaySection /> },
    { id: 'brutalism', label: 'Brutalism', icon: Zap, render: () => <BrutalismSection /> },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: Sparkles, render: () => <CyberSection /> },
    { id: 'softui', label: 'Soft UI', icon: Layers, render: () => <SoftUiSection /> },
    { id: 'editorial', label: 'Editorial', icon: BookOpen, render: () => <EditorialSection /> },
    { id: 'y2k', label: 'Y2K', icon: Star, render: () => <Y2KSection /> },
    { id: 'memphis', label: 'Memphis', icon: Hexagon, render: () => <MemphisSection /> },
    { id: 'vapor', label: 'Vapor', icon: CloudSun, render: () => <VaporSection /> },
    { id: 'bauhaus', label: 'Bauhaus', icon: Triangle, render: () => <BauhausSection /> },
    { id: 'artdeco', label: 'Art Deco', icon: Diamond, render: () => <ArtDecoSection /> },
    { id: 'bento', label: 'Bento', icon: LayoutGrid, render: () => <BentoSection /> },
    { id: 'retrofuture', label: 'Retro 57', icon: Sun, render: () => <RetroFutureSection /> },
    { id: 'aurora', label: 'Aurora', icon: Rainbow, render: () => <AuroraSection /> },
    { id: 'terminal', label: 'Terminal', icon: Terminal, render: () => <TerminalSection /> },
    { id: 'wabisabi', label: 'Wabi-sabi', icon: Leaf, render: () => <WabiSabiSection /> },
    { id: 'genz', label: 'GenZ', icon: Workflow, render: () => <GenzSection /> },
    { id: 'handdrawn', label: 'Drawn', icon: PenTool, render: () => <HandDrawnSection /> },
    { id: 'neobrutal', label: 'Neo-brutal', icon: Megaphone, render: () => <NeoBrutalSection /> },
    { id: 'liquidchrome', label: 'Liquid', icon: Droplets, render: () => <LiquidChromeSection /> },
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
      subtitle="Twenty front-ends · one app"
      accent={ACCENT}
      icon={Wand2}
      sections={sections}
      disableSignatureFx
    />
  );
}
