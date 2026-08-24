/**
 * DesignApp — styles 06-10 (Editorial Magazine, Y2K Chrome, Memphis 80s,
 * Vaporwave, Bauhaus). Extrait de DesignApp.tsx : chaque Hero est un
 * systeme visuel autonome, sans etat ni logique partagee.
 */
import { BookOpen, Hexagon, CloudSun } from 'lucide-react';

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

export function EditorialSection() {
  return (
    <div className="h-full w-full overflow-hidden">
      <EditorialHero />
    </div>
  );
}

export function Y2KSection() { return <div className="h-full w-full overflow-hidden"><Y2KHero /></div>; }
export function MemphisSection() { return <div className="h-full w-full overflow-hidden"><MemphisHero /></div>; }
export function VaporSection() { return <div className="h-full w-full overflow-hidden"><VaporHero /></div>; }
export function BauhausSection() { return <div className="h-full w-full overflow-hidden"><BauhausHero /></div>; }
