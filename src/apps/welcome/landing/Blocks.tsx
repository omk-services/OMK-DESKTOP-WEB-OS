/** Landing page blocks — reusable sections of the landing-page previews.
 *  Pure presentational: each block takes props and renders. No state, no
 *  routing. All colors come from theme tokens (var(--theme-*)) so the
 *  blocks follow whichever theme the user has chosen in Settings.
 *
 *  Exceptions carrying semantic meaning (allowed by the brief):
 *   - emerald-* on the "online / +N new / Active" badges — semantic "ok"
 *   - amber on the "Most popular" tier ribbon — semantic "highlighted" */

import { useState } from 'react';
import { Star, Plus, Minus, ArrowRight, Check, Play } from 'lucide-react';
import type { FeatureBlock, Stat, Testimonial, PricingTier, FaqItem, Logo } from './pageSchema';

interface HeroProps {
  brand: string;
  domain: string;
  tagline: string;
  eyebrow: string;
  headline: string;
  sub: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  rating?: { stars: number; count: string; sources: string[] };
}

export function LandingHero({ brand, tagline, eyebrow, headline, sub, primaryCta, secondaryCta, rating }: HeroProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden rounded-3xl border border-[var(--panel-border)] px-8 py-14 sm:px-14 sm:py-20 shadow-sm"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, var(--theme-accent-soft) 0%, transparent 45%), radial-gradient(circle at 100% 100%, var(--theme-accent-soft) 0%, transparent 45%), var(--theme-surface)',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full blur-3xl" style={{ background: 'var(--theme-accent-soft)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full blur-3xl" style={{ background: 'var(--theme-accent-soft)' }} />
      <div className="relative flex flex-col gap-6 max-w-4xl">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-accent)]">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--theme-surface)] backdrop-blur border border-[var(--panel-border)] text-[10px] font-extrabold text-[var(--theme-accent)] shadow-sm">{brand.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
          <span>{eyebrow}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {headline}
        </h1>
        <p className="text-base sm:text-lg text-[var(--theme-text-muted)] max-w-2xl leading-relaxed">{sub}</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a href={primaryCta.href} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-[var(--theme-accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
            {primaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
          {secondaryCta && (
            <a href={secondaryCta.href} className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-surface)] backdrop-blur border border-[var(--panel-border)] text-[var(--theme-text)] px-6 py-3 text-sm font-semibold hover:bg-[var(--theme-surface-hover)] transition-all">
              <Play className="w-4 h-4 fill-current" />
              {secondaryCta.label}
            </a>
          )}
        </div>
        {rating && (
          <div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-[var(--theme-text-muted)]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-surface)] backdrop-blur border border-[var(--panel-border)] px-3 py-1.5 shadow-sm">
              <span className="flex gap-0.5">
                {Array.from({ length: rating.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[color:var(--theme-accent)] text-[color:var(--theme-accent)]" />
                ))}
              </span>
              <span className="font-semibold text-[var(--theme-text)]">{rating.count}</span>
              <span className="text-[var(--theme-text-muted)]">reviews</span>
            </span>
            <div className="flex items-center gap-1.5">
              {rating.sources.map(s => (
                <span key={s} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--theme-surface)] border border-[var(--panel-border)] text-[10px] font-bold text-[var(--theme-text-muted)] shadow-sm">{s.charAt(0)}</span>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2 text-xs text-[var(--theme-text-dim)]">{tagline}</div>
      </div>
    </section>
  );
}

export function LogoRow({ title, logos }: { title: string; logos: Logo[] }) {
  return (
    <section className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] px-8 py-10 shadow-sm">
      <p className="text-center text-sm text-[var(--theme-text-muted)] mb-6">{title}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {logos.map(l => (
          <div key={l.name} className="flex items-center gap-2 text-[var(--theme-text-dim)] hover:text-[var(--theme-text-muted)] transition-colors">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--theme-surface-hover)] text-xs font-extrabold text-[var(--theme-text-muted)]">{l.monogram}</span>
            <span className="text-sm font-semibold tracking-tight">{l.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Visual mock — renders a stylized chat / dashboard / list, depending on the
 *  feature's `visual` key. Pure CSS / inline SVG, no external assets.
 *
 *  All decorative surfaces use theme tokens. The "sent message" pill in the
 *  community visual uses the theme accent (not a hardcoded indigo) so the
 *  agent's "voice" follows the user's chosen palette. */
function FeatureVisual({ kind }: { kind: FeatureBlock['visual'] }) {
  if (kind === 'community') {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--panel-border-subtle)]">
          <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--warn)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
          <span className="ml-2 text-[11px] font-semibold text-[var(--theme-text-muted)]">Elevate Academy</span>
        </div>
        <div className="p-4 space-y-3">
          {['Welcome to Elevate Academy!', 'Just joined — feeling inspired already.', 'Anyone else going to the in-person summit?', 'Yes! LA was incredible. See you in November.'].map((m, i) => (
            <div key={i} className={`flex gap-2 ${i % 2 ? 'justify-end' : ''}`}>
              {i % 2 === 0 && <div className="w-7 h-7 rounded-full bg-[var(--theme-surface-hover)] shrink-0" />}
              <div className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed max-w-[80%] ${i % 2 ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-surface-hover)] text-[var(--theme-text)]'}`}>{m}</div>
              {i % 2 && <div className="w-7 h-7 rounded-full bg-[var(--theme-accent-soft)] shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'courses') {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Courses</span>
          <span className="text-[10px] font-semibold text-[var(--ok)] bg-[var(--ok)]/10 rounded-full px-2 py-0.5">+ 4 new</span>
        </div>
        {[
          { title: '1:1 Executive Coaching', meta: '$150/month · 2,180 enrolled' },
          { title: 'Group Cohort · Q3 2026', meta: '$80/seat · 412 seats' },
          { title: 'Self-paced: Productivity', meta: 'Free · 1,920 enrolled' },
        ].map(c => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-[var(--panel-border-subtle)] p-3 hover:bg-[var(--theme-surface-hover)] transition-colors">
            <div className="w-10 h-10 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--theme-text)] truncate">{c.title}</div>
              <div className="text-[11px] text-[var(--theme-text-muted)]">{c.meta}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--theme-text-dim)]" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'events') {
    return (
      <div
        className="rounded-2xl p-5 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-hover) 100%)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          {['Community', 'Courses', 'Events', 'Email', 'Payments'].map((t, i) => (
            <span key={t} className={`text-[11px] px-3 py-1 rounded-full ${i === 2 ? 'bg-[rgba(255,255,255,0.2)] font-semibold' : 'text-[rgba(255,255,255,0.7)]'}`}>{t}</span>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { title: 'Desk-ercise: fitness for the office bound', meta: 'Tuesday, Jan 21 · 7:00 am · Live stream', state: 'Going' },
            { title: 'Nutrition on the go: healthy eating for busy professionals', meta: 'Tuesday, Feb 4 · 7:00 am · Live stream', state: 'RSVP' },
            { title: 'Sleep optimization: maximizing rest for peak performance', meta: 'Wednesday, Feb 12 · 7:00 am · Live stream', state: 'RSVP' },
          ].map(e => (
            <div key={e.title} className="flex items-center gap-3 rounded-xl bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)] backdrop-blur border border-[rgba(255,255,255,0.12)] p-3 transition-colors">
              <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{e.title}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.65)]">{e.meta}</div>
              </div>
              <span className="text-[10px] font-bold bg-[rgba(255,255,255,0.22)] rounded-full px-2.5 py-1">{e.state}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'chat') {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }}>S</div>
          <div>
            <div className="text-sm font-semibold text-[var(--theme-text)]">Scribe agent</div>
            <div className="text-[10px] text-[var(--ok)] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />Online</div>
          </div>
        </div>
        {['Drafted the weekly recap — 4 paragraphs, 3 action items.', 'Pulled Q3 metrics from Notion → Drive.', 'Asked for review on 2 outbound DMs.'].map((m, i) => (
          <div key={i} className="rounded-xl bg-[var(--theme-surface-hover)] px-3 py-2 text-[12px] text-[var(--theme-text)] border border-[var(--panel-border-subtle)]">{m}</div>
        ))}
      </div>
    );
  }
  if (kind === 'revenue') {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 space-y-4">
        <div>
          <div className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-1">In the last year alone</div>
          <div className="text-[10px] text-[var(--theme-text-dim)] mb-3">Circle powered:</div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-[var(--theme-text)] tabular-nums">$194</span>
            <span className="text-2xl font-bold text-[var(--theme-text-muted)]">M</span>
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)] mt-1">revenue for community creators</div>
        </div>
        <div className="border-t border-[var(--panel-border-subtle)] pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-[var(--theme-text)] tabular-nums">48</span>
            <span className="text-lg font-bold text-[var(--theme-text-muted)]">K</span>
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)]">Courses</div>
        </div>
      </div>
    );
  }
  // 'agents'
  return (
    <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 space-y-3">
      <div className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Your fleet</div>
      {[
        { name: 'Orchestrator', role: 'Manager', state: 'Active' },
        { name: 'Scout', role: 'SDR', state: 'Active' },
        { name: 'Scribe', role: 'Writer', state: 'Active' },
        { name: 'Reach', role: 'Outbound', state: 'Idle' },
        { name: 'Dev', role: 'Builder', state: 'Active' },
      ].map(a => (
        <div key={a.name} className="flex items-center gap-3 rounded-xl border border-[var(--panel-border-subtle)] px-3 py-2 hover:bg-[var(--theme-surface-hover)] transition-colors">
          <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-[10px] font-extrabold" style={{ background: 'var(--theme-accent)' }}>{a.name[0]}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--theme-text)]">{a.name}</div>
            <div className="text-[10px] text-[var(--theme-text-muted)]">{a.role}</div>
          </div>
          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
            a.state === 'Active'
              ? 'text-[var(--ok)] bg-[var(--ok)]/10'
              : 'text-[var(--theme-text-muted)] bg-[var(--theme-surface-hover)]'
          }`}>{a.state}</span>
        </div>
      ))}
    </div>
  );
}

export function FeatureRow({ feature, flip = false }: { feature: FeatureBlock; flip?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <div className={`flex flex-col gap-4 ${flip ? 'lg:order-2' : ''}`}>
        {feature.eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">{feature.eyebrow}</span>
        )}
        <h3 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>{feature.title}</h3>
        <p className="text-base text-[var(--theme-text-muted)] leading-relaxed">{feature.body}</p>
        {feature.bullets && (
          <ul className="space-y-2 pt-2">
            {feature.bullets.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-[var(--theme-text)]">
                <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--ok)]/10 text-[var(--ok)] shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {feature.cta && (
          <a href={feature.cta.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors mt-2 self-start">
            {feature.cta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <FeatureVisual kind={feature.visual} />
      </div>
    </div>
  );
}

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div
      className="rounded-3xl px-8 py-10 sm:px-14 sm:py-14 shadow-xl"
      style={{
        background:
          'linear-gradient(135deg, var(--theme-canvas) 0%, var(--theme-bg) 50%, var(--theme-canvas) 100%)',
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col gap-1">
            <span className="text-4xl sm:text-5xl font-extrabold text-[var(--theme-text)] tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>{s.value}</span>
            <span className="text-xs text-[var(--theme-text-muted)] uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialBlock({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-8 flex flex-col gap-5 h-full">
      <p className="text-lg sm:text-xl leading-relaxed text-[var(--theme-text)] font-medium">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-auto flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full" style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))' }} />
          <div>
            <div className="text-sm font-bold text-[var(--theme-text)]">{testimonial.author}</div>
            <div className="text-xs text-[var(--theme-text-muted)]">{testimonial.role} · {testimonial.company}</div>
          </div>
        </div>
        {testimonial.metric && (
          <div className="text-right">
            <div className="text-3xl font-extrabold text-[var(--theme-text)] tabular-nums">{testimonial.metric.value}</div>
            <div className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider">{testimonial.metric.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PricingGrid({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map(t => (
        <div
          key={t.name}
          className={`relative flex flex-col gap-4 rounded-2xl p-6 transition-all border ${
            t.highlight
              ? 'text-white shadow-xl scale-[1.02] border-[var(--theme-accent)]'
              : 'bg-[var(--theme-surface)] border-[var(--panel-border)] shadow-sm text-[var(--theme-text)]'
          }`}
          style={t.highlight
            ? { background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-hover) 100%)' }
            : undefined}
        >
          {t.highlight && (
            <>
              {/* Border Beam — single signature flourish on the highlighted tier.
                  Soft glow that breathes, drawn from the theme accent. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-2xl animate-pulse"
                style={{
                  boxShadow: '0 0 32px 6px var(--theme-accent-soft)',
                  animationDuration: '3s',
                }}
              />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.2em] bg-[var(--warn)] text-black rounded-full px-3 py-1 shadow-md z-10">
                Most popular
              </span>
            </>
          )}
          <div>
            <div className={`text-sm font-bold ${t.highlight ? 'text-[rgba(255,255,255,0.85)]' : 'text-[var(--theme-text-muted)]'}`}>{t.name}</div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold tabular-nums" style={{ fontFamily: 'var(--theme-font-display)' }}>{t.price}</span>
              <span className={`text-sm ${t.highlight ? 'text-[rgba(255,255,255,0.85)]' : 'text-[var(--theme-text-muted)]'}`}>{t.cadence}</span>
            </div>
            <p className={`text-xs mt-2 ${t.highlight ? 'text-[rgba(255,255,255,0.9)]' : 'text-[var(--theme-text-muted)]'}`}>{t.pitch}</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {t.features.map(f => (
              <li key={f} className="flex items-start gap-2">
                <span className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${t.highlight ? 'bg-[rgba(255,255,255,0.22)] text-white' : 'bg-[var(--ok)]/10 text-[var(--ok)]'}`}>
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
                <span className={t.highlight ? 'text-[rgba(255,255,255,0.95)]' : 'text-[var(--theme-text)]'}>{f}</span>
              </li>
            ))}
          </ul>
          <button
            className={`mt-auto w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              t.highlight
                ? 'bg-[color:#fff] hover:bg-[rgba(255,255,255,0.92)] shadow-md'
                : 'bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent-hover)]'
            }`}
            style={!t.highlight ? undefined : { color: 'var(--theme-accent)' }}
          >
            {t.ctaLabel}
          </button>
        </div>
      ))}
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm divide-y divide-[var(--panel-border-subtle)] overflow-hidden">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[var(--theme-surface-hover)] transition-colors"
            >
              <span className="text-sm sm:text-base font-semibold text-[var(--theme-text)]">{item.q}</span>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all shrink-0 ${open ? 'bg-[var(--theme-accent)] text-white rotate-180' : 'bg-[var(--theme-surface-hover)] text-[var(--theme-text-muted)]'}`}>
                {open ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </span>
            </button>
            {open && (
              <div className="px-6 pb-5 text-sm text-[var(--theme-text-muted)] leading-relaxed">{item.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ClosingCta({ headline, sub, ctaLabel }: { headline: string; sub: string; ctaLabel: string }) {
  return (
    <div
      id="cta"
      className="relative overflow-hidden rounded-3xl px-10 py-16 sm:px-16 sm:py-20 shadow-2xl text-white text-center"
      style={{ background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-hover) 100%)' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 50%)' }} />
      <div className="relative flex flex-col items-center gap-5 max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight" style={{ fontFamily: 'var(--theme-font-display)' }}>{headline}</h2>
        <p className="text-base sm:text-lg text-[rgba(255,255,255,0.9)]">{sub}</p>
        <a href="#top" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:#fff] px-7 py-3.5 text-sm font-bold shadow-lg hover:bg-[rgba(255,255,255,0.92)] transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ color: 'var(--theme-accent)' }}>
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
