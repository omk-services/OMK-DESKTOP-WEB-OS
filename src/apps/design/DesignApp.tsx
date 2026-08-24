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
 *
 *  Chaque style vit dans src/apps/design/sections/HeroesGroup{A,B,C,D}.tsx
 *  (5 styles par fichier, decoupage purement mecanique par bloc de code
 *  contigu — aucun etat ni logique partagee entre Heroes). Le panneau
 *  Overview (roster + picker) vit dans sections/StylePicker.tsx.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  GlassWater, Shapes, Zap, Sparkles, BookOpen, Layers, Wand2,
  Star, Hexagon, CloudSun, Triangle, Diamond, LayoutGrid, Sun, Rainbow,
  Terminal, Leaf, Workflow, PenTool, Megaphone, Droplets,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { OverviewPanel } from './sections/StylePicker';
import {
  GlassSection, ClaySection, BrutalismSection, CyberSection, SoftUiSection,
} from './sections/HeroesGroupA';
import {
  EditorialSection, Y2KSection, MemphisSection, VaporSection, BauhausSection,
} from './sections/HeroesGroupB';
import {
  ArtDecoSection, BentoSection, RetroFutureSection, AuroraSection, TerminalSection,
} from './sections/HeroesGroupC';
import {
  WabiSabiSection, GenzSection, HandDrawnSection, NeoBrutalSection, LiquidChromeSection,
} from './sections/HeroesGroupD';

const ACCENT = '#0f172a';

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
