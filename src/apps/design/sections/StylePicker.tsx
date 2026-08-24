/**
 * DesignApp — metadonnees des 20 styles + panneau Overview (le "sidebar
 * index" de l'app). Extrait de DesignApp.tsx.
 */
import {
  GlassWater, Shapes, Zap, Sparkles, BookOpen, Layers, Star, Hexagon,
  CloudSun, Triangle, Diamond, LayoutGrid, Sun, Rainbow, Terminal, Leaf,
  Workflow, PenTool, Megaphone, Droplets,
} from 'lucide-react';

/* ───────────────────────── SIDEBAR STYLE METADATA ───────────────────────── */

interface StyleMeta {
  id: string;
  label: string;
  caption: string;
  palette: string;
  icon: typeof GlassWater;
}

export const STYLES: StyleMeta[] = [
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

export function OverviewPanel({ activeId, onPick }: { activeId: string; onPick: (id: string) => void }) {
  const active = STYLES.find((s) => s.id === activeId);
  if (!active) return null;
  return <StylePickerPanel active={activeId} onPick={onPick} />;
}
