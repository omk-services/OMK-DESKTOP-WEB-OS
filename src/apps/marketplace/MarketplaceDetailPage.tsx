/**
 * MarketplaceDetailPage — "La Maison" vitrine.
 *
 * Style: Luxury E-commerce — Liquid Glass + Glassmorphism (uupm.cc).
 * Layered refractive glass plates, editorial serif display, a product vitrine
 * with switchable imagery blocks, and a boutique offer/licence treatment.
 *
 * Theme contract: every surface / text / border / radius / shadow reads from the
 * runtime CSS variables injected on :root by ThemeApplier. The single allowed
 * deviation is MARKETPLACE_ACCENT (#db2777, the app's own accent from
 * MarketplaceApp) used for signature moments only.
 */
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  Download,
  Layers,
  Lock,
  Package,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface MarketplaceDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  install: { installed: boolean; version: string; size: string };
  stats: { label: string; value: string }[];
  fields: DetailField[];
}

interface MarketplaceDetailPageProps {
  item: MarketplaceDetailItem;
  onBack: () => void;
  backLabel?: string;
  /** Optional — when provided, the boutique CTA installs the integration for real. */
  onInstall?: () => void;
}

/* ── Signature accent (the one allowed hardcoded hue) ─────────────────────── */
const MARKETPLACE_ACCENT = '#db2777';

/* Editorial serif display stack — Georgia is the guaranteed fallback. */
const SERIF = '"Instrument Serif", "Playfair Display", Georgia, "Times New Roman", serif';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Finance: Receipt,
  Scheduling: CalendarClock,
  Growth: TrendingUp,
  Knowledge: BookOpen,
  Legal: Scale,
  Delivery: Video,
};

/* ── Theme-safe helpers ───────────────────────────────────────────────────── */

/** Translucent glass fill derived from the theme surface (works light + dark). */
function glass(pct: number): string {
  return `color-mix(in srgb, var(--theme-surface) ${pct}%, transparent)`;
}

/** Ink at a given strength — used for skeleton blocks and hairlines. */
function ink(pct: number): string {
  return `color-mix(in srgb, var(--theme-text) ${pct}%, transparent)`;
}

/** Theme accent at a given strength. */
function tint(pct: number): string {
  return `color-mix(in srgb, var(--theme-accent) ${pct}%, transparent)`;
}

/** Stable hash so derived boutique figures never flicker between renders. */
function fnv1a(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface Derived {
  rating: string;
  installs: string;
  buckets: { stars: number; share: number }[];
}

function derive(seed: string): Derived {
  const h = fnv1a(seed);
  const raw = [
    62 + (h % 9),
    18 + ((h >>> 3) % 7),
    7 + ((h >>> 6) % 4),
    4 + ((h >>> 9) % 3),
    2 + ((h >>> 12) % 2),
  ];
  const total = raw.reduce((a, b) => a + b, 0);
  const buckets = raw.map((v, i) => ({ stars: 5 - i, share: (v / total) * 100 }));
  const weighted = buckets.reduce((a, b) => a + b.stars * b.share, 0) / 100;
  return {
    rating: weighted.toFixed(1),
    installs: (680 + (h % 4200)).toLocaleString('en-US'),
    buckets,
  };
}

/* ── Small building blocks ────────────────────────────────────────────────── */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--theme-radius-sm)] px-2 py-1 text-[11px] font-semibold text-[var(--theme-text-muted)]"
      style={{ background: glass(70), border: `1px solid ${ink(10)}` }}
    >
      {children}
    </span>
  );
}

interface PlateProps {
  children: React.ReactNode;
  className?: string;
  pad?: string;
}

/** The refractive glass plate every section is built on. */
function Plate({ children, className = '', pad = 'p-5' }: PlateProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[var(--theme-radius-lg)] border backdrop-blur-2xl ${pad} ${className}`}
      style={{
        background: glass(74),
        borderColor: 'var(--theme-border)',
        boxShadow: 'var(--theme-shadow)',
      }}
    >
      {/* refraction sheen — accent-tinted, so it reads in light and dark alike */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: `linear-gradient(150deg, ${MARKETPLACE_ACCENT}14, transparent 55%, ${tint(10)})`,
        }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}

/* ── The vitrine (product-grade imagery blocks) ───────────────────────────── */

const SKELETONS: number[][] = [
  [92, 64, 78, 44],
  [70, 88, 52, 66],
  [58, 46, 90, 72],
  [84, 40, 60, 88],
];

interface VitrineProps {
  categoryIcon: LucideIcon;
  category: string;
  featured: boolean;
  installed: boolean;
}

function Vitrine({ categoryIcon, category, featured, installed }: VitrineProps) {
  const [shot, setShot] = useState(0);
  const shots: { label: string; icon: LucideIcon }[] = [
    { label: 'Overview', icon: categoryIcon },
    { label: 'In session', icon: Layers },
    { label: 'Data flow', icon: Zap },
    { label: 'Controls', icon: ShieldCheck },
  ];
  const Active = shots[shot].icon;
  const bars = SKELETONS[shot];

  return (
    <div className="flex flex-col gap-3">
      {/* main plate */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--theme-radius-lg)] border backdrop-blur-2xl"
        style={{
          background: `linear-gradient(140deg, ${MARKETPLACE_ACCENT}26, ${tint(18)} 55%, ${glass(70)})`,
          borderColor: 'var(--theme-border)',
          boxShadow: 'var(--theme-shadow-lg)',
        }}
      >
        {/* specular streak */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/4 top-0 h-[160%] w-1/2 -rotate-12"
          style={{ background: `linear-gradient(90deg, transparent, ${glass(55)}, transparent)` }}
        />
        {/* abstract product frame */}
        <div className="absolute inset-0 flex flex-col gap-3 p-6">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: d === 0 ? MARKETPLACE_ACCENT : ink(22) }}
              />
            ))}
            <span
              className="ml-2 h-2 w-24 rounded-full"
              style={{ background: ink(12) }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            {bars.map((w, i) => (
              <span
                key={`${shot}-${i}`}
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${w}%`,
                  background: i === 0 ? `${MARKETPLACE_ACCENT}66` : ink(11),
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
              {shots[shot].label}
            </span>
            <span className="text-[10px] font-semibold text-[var(--theme-text-dim)]">
              {category}
            </span>
          </div>
        </div>
        {/* watermark */}
        <Active
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 opacity-[0.13]"
          style={{ color: MARKETPLACE_ACCENT }}
        />
        {/* seals */}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
          {featured ? (
            <span
              className="inline-flex items-center gap-1 rounded-[var(--theme-radius)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[var(--theme-shadow)]"
              style={{ background: MARKETPLACE_ACCENT }}
            >
              <Sparkles className="h-3 w-3" /> Maison pick
            </span>
          ) : null}
          {installed ? (
            <span
              className="inline-flex items-center gap-1 rounded-[var(--theme-radius)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--theme-text)]"
              style={{ background: glass(85), border: `1px solid ${ink(12)}` }}
            >
              <BadgeCheck className="h-3 w-3" /> In your Citadelle
            </span>
          ) : null}
        </div>
      </div>

      {/* thumbnail rail */}
      <div className="grid grid-cols-4 gap-2">
        {shots.map((s, i) => {
          const Icon = s.icon;
          const on = i === shot;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setShot(i)}
              aria-pressed={on}
              aria-label={`View ${s.label}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-[var(--theme-radius)] border backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              style={{
                background: on
                  ? `linear-gradient(140deg, ${MARKETPLACE_ACCENT}22, ${glass(70)})`
                  : glass(58),
                borderColor: on ? MARKETPLACE_ACCENT : 'var(--theme-border)',
                boxShadow: on ? 'var(--theme-shadow)' : 'none',
              }}
            >
              <Icon
                className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                style={{ color: on ? MARKETPLACE_ACCENT : 'var(--theme-text-dim)' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function MarketplaceDetailPage({
  item,
  onBack,
  backLabel = 'Back to Marketplace',
  onInstall,
}: MarketplaceDetailPageProps) {
  const reduced = useReducedMotion() ?? false;
  const derived = useMemo(() => derive(item.id + item.title), [item.id, item.title]);

  const category = item.stats.find((s) => s.label === 'Tag')?.value ?? 'Integration';
  const featured = item.stats.some(
    (s) => s.label === 'Featured' && s.value.toLowerCase() === 'yes',
  );
  const CategoryIcon = CATEGORY_ICON[category] ?? Package;
  const installed = item.install.installed;
  const maxShare = Math.max(...derived.buckets.map((b) => b.share));

  const specs: { label: string; value: string }[] = [
    ...item.stats,
    { label: 'Package', value: item.install.size },
  ];

  const ladder: { label: string; note: string; done: boolean }[] = [
    { label: 'Submitted to the Maison', note: 'Publisher dossier accepted', done: true },
    { label: 'Sandbox review', note: 'Runs isolated — no ambient access', done: true },
    { label: 'Signed build', note: `v${item.install.version} · ${item.install.size}`, done: true },
    {
      label: 'Live in your Citadelle',
      note: installed ? 'Active on this workspace' : 'Awaiting your install',
      done: installed,
    },
  ];

  const rise = (delay: number) =>
    reduced
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar"
      style={{
        background: `radial-gradient(110% 80% at 8% -12%, ${MARKETPLACE_ACCENT}1f, transparent 58%), radial-gradient(90% 70% at 100% 0%, ${tint(16)}, transparent 55%), var(--theme-bg)`,
        fontFamily: 'var(--theme-font-body)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-7">
        {/* ── boutique chrome ───────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-2 rounded-[var(--theme-radius)] border px-3 py-1.5 text-xs font-semibold text-[var(--theme-text-muted)] backdrop-blur-xl transition-all duration-200 hover:-translate-x-0.5 hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            style={{ background: glass(66), borderColor: 'var(--theme-border)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-[var(--theme-radius)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{
                background: `${MARKETPLACE_ACCENT}1a`,
                color: MARKETPLACE_ACCENT,
                border: `1px solid ${MARKETPLACE_ACCENT}33`,
              }}
            >
              {item.status}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--theme-text-dim)]">
              Maison · Marketplace
            </span>
          </div>
        </div>

        {/* ── hero: vitrine + editorial + offer ─────────────────────────── */}
        <motion.div {...rise(0)} className="flex flex-wrap gap-5">
          <div className="min-w-[280px] flex-1 basis-[360px]">
            <Vitrine
              categoryIcon={CategoryIcon}
              category={category}
              featured={featured}
              installed={installed}
            />
          </div>

          <div className="flex min-w-[280px] flex-1 basis-[330px] flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--theme-radius)] text-white shadow-[var(--theme-shadow)]"
                  style={{
                    background: `linear-gradient(140deg, ${MARKETPLACE_ACCENT}, ${MARKETPLACE_ACCENT}b3)`,
                  }}
                >
                  <CategoryIcon className="h-4 w-4" />
                </span>
                <Kicker>{category} collection</Kicker>
              </div>
              <h1
                tabIndex={-1}
                className="mt-3 text-[38px] font-normal leading-[1.05] tracking-[-0.015em] text-[var(--theme-text)] outline-none"
                style={{ fontFamily: SERIF }}
              >
                {item.title}
              </h1>
              <p className="mt-2.5 max-w-[46ch] text-[14.5px] leading-relaxed text-[var(--theme-text-muted)]">
                {item.subtitle}
              </p>
              {/* house rating line */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5"
                      style={{
                        color:
                          s <= Math.round(Number(derived.rating))
                            ? MARKETPLACE_ACCENT
                            : 'var(--theme-text-dim)',
                        fill:
                          s <= Math.round(Number(derived.rating))
                            ? MARKETPLACE_ACCENT
                            : 'transparent',
                      }}
                    />
                  ))}
                </span>
                <span className="text-xs font-semibold text-[var(--theme-text)]">
                  {derived.rating}
                </span>
                <span className="text-xs text-[var(--theme-text-dim)]">
                  · {derived.installs} verified installs
                </span>
              </div>
            </div>

            {/* offer / licence treatment */}
            <Plate pad="p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Kicker>Licence</Kicker>
                  <div
                    className="mt-1 text-[30px] leading-none text-[var(--theme-text)]"
                    style={{ fontFamily: SERIF }}
                  >
                    Included
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[var(--theme-text-muted)]">
                    Perpetual, with your Citadelle plan
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Chip>v{item.install.version}</Chip>
                  <Chip>{item.install.size}</Chip>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {!installed && onInstall ? (
                  <button
                    type="button"
                    onClick={onInstall}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--theme-radius)] px-5 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    style={{
                      background: `linear-gradient(140deg, ${MARKETPLACE_ACCENT}, ${MARKETPLACE_ACCENT}cc)`,
                      boxShadow: 'var(--theme-shadow-lg)',
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Install — included
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--theme-radius)] px-5 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    style={{
                      background: `linear-gradient(140deg, ${MARKETPLACE_ACCENT}, ${MARKETPLACE_ACCENT}cc)`,
                      boxShadow: 'var(--theme-shadow-lg)',
                    }}
                  >
                    {installed ? <BadgeCheck className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    {installed ? 'Installed — back to the collection' : 'Back to the collection'}
                  </button>
                )}
              </div>
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-[var(--theme-text-dim)]">
                <Lock className="h-3 w-3" />
                Sandboxed · revocable at any time
              </p>
            </Plate>
          </div>
        </motion.div>

        {/* ── atelier specifications (metric strip) ─────────────────────── */}
        <motion.div {...rise(0.06)} className="mt-5">
          <Plate pad="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <Kicker>Atelier specifications</Kicker>
              <span className="text-[10px] text-[var(--theme-text-dim)]">{item.id}</span>
            </div>
            <dl className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[var(--theme-radius)] px-3 py-2.5"
                  style={{ background: glass(58), border: `1px solid ${ink(8)}` }}
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                    {s.label}
                  </dt>
                  <dd
                    className="mt-1 text-[17px] leading-tight text-[var(--theme-text)]"
                    style={{ fontFamily: SERIF }}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Plate>
        </motion.div>

        {/* ── house rating + provenance ladder ──────────────────────────── */}
        <div className="mt-5 flex flex-wrap gap-5">
          <motion.div {...rise(0.12)} className="min-w-[280px] flex-1 basis-[320px]">
            <Plate>
              <Kicker>House rating</Kicker>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[34px] leading-none" style={{ fontFamily: SERIF }}>
                  {derived.rating}
                </span>
                <span className="text-[11.5px] text-[var(--theme-text-muted)]">
                  из 5 · {derived.installs} workspaces
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {derived.buckets.map((b) => (
                  <div key={b.stars} className="flex items-center gap-2.5">
                    <span className="w-8 shrink-0 text-[11px] font-semibold text-[var(--theme-text-dim)]">
                      {b.stars}★
                    </span>
                    <span
                      className="h-2 flex-1 overflow-hidden rounded-[var(--theme-radius-sm)]"
                      style={{ background: ink(8) }}
                    >
                      <span
                        className="block h-full rounded-[var(--theme-radius-sm)] transition-[width] duration-700"
                        style={{
                          width: `${(b.share / maxShare) * 100}%`,
                          background:
                            b.stars >= 4
                              ? `linear-gradient(90deg, ${MARKETPLACE_ACCENT}, ${MARKETPLACE_ACCENT}80)`
                              : tint(45),
                        }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-[var(--theme-text-muted)]">
                      {Math.round(b.share)}%
                    </span>
                  </div>
                ))}
              </div>
            </Plate>
          </motion.div>

          <motion.div {...rise(0.18)} className="min-w-[280px] flex-1 basis-[320px]">
            <Plate>
              <Kicker>Provenance</Kicker>
              <ol className="relative mt-4 space-y-4 pl-6">
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-1.5 bottom-1.5 w-px"
                  style={{ background: ink(14) }}
                />
                {ladder.map((step) => (
                  <li key={step.label} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-6 top-1 h-[11px] w-[11px] rounded-full"
                      style={{
                        background: step.done ? MARKETPLACE_ACCENT : glass(90),
                        border: `2px solid ${step.done ? MARKETPLACE_ACCENT : ink(20)}`,
                        boxShadow: step.done ? `0 0 0 4px ${MARKETPLACE_ACCENT}22` : 'none',
                      }}
                    />
                    <div
                      className="text-[13.5px] leading-tight"
                      style={{
                        fontFamily: SERIF,
                        color: step.done ? 'var(--theme-text)' : 'var(--theme-text-muted)',
                      }}
                    >
                      {step.label}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[var(--theme-text-dim)]">
                      {step.note}
                    </div>
                  </li>
                ))}
              </ol>
              <div
                className="mt-4 flex items-center gap-2 rounded-[var(--theme-radius)] px-3 py-2"
                style={{ background: glass(58), border: `1px solid ${ink(8)}` }}
              >
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: MARKETPLACE_ACCENT }} />
                <span className="text-[11.5px] text-[var(--theme-text-muted)]">
                  Every integration runs sandboxed in your Citadelle.
                </span>
              </div>
            </Plate>
          </motion.div>
        </div>

        {/* ── extended dossier (item.fields) ────────────────────────────── */}
        {item.fields.length > 0 ? (
          <motion.div {...rise(0.24)} className="mt-5">
            <Plate>
              <Kicker>Dossier</Kicker>
              <dl className="mt-3 grid gap-x-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                {item.fields.map((f) => (
                  <div
                    key={f.label}
                    className="py-3"
                    style={{ borderTop: `1px solid ${ink(10)}` }}
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-[13.5px] leading-snug text-[var(--theme-text)]">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Plate>
          </motion.div>
        ) : null}

        {/* ── concierge footer ──────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--theme-text-dim)]">
            Curated by the Maison
          </span>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-[var(--theme-radius)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            style={{ background: glass(50) }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
