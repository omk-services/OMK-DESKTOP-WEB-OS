/**
 * DesignApp — styles 16-20 (Wabi-sabi, GenZ Linear, Hand-drawn,
 * Neo-brutalist, Liquid Chrome). Extrait de DesignApp.tsx : chaque Hero
 * est un systeme visuel autonome, sans etat ni logique partagee.
 */
import { Leaf, Workflow, PenTool, Megaphone, Droplets } from 'lucide-react';

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

export function WabiSabiSection() { return <div className="h-full w-full overflow-hidden"><WabiSabiHero /></div>; }
export function GenzSection() { return <div className="h-full w-full overflow-hidden"><GenzHero /></div>; }
export function HandDrawnSection() { return <div className="h-full w-full overflow-hidden"><HandDrawnHero /></div>; }
export function NeoBrutalSection() { return <div className="h-full w-full overflow-hidden"><NeoBrutalHero /></div>; }
export function LiquidChromeSection() { return <div className="h-full w-full overflow-hidden"><LiquidChromeHero /></div>; }
