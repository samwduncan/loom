/* eslint-disable loom/no-banned-inline-style -- Dev visualization page: dynamic styles required for color swatches, animation demos, and glass effects */
/**
 * TokenPreview — Comprehensive design token visualization and stress test page.
 *
 * Permanent dev tool at /dev/tokens. Renders every token category visually
 * so design decisions can be verified by human inspection. This page IS the
 * test suite for Phase 1 (DS-01 through DS-06).
 *
 * Constitution: Named export only (2.2), cn() for classNames (3.6),
 * semantic Tailwind utilities only — zero hardcoded color classes (7.14).
 */

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import {
  SPRING_GENTLE,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  EASING,
  DURATION,
  type SpringConfig,
} from '@/lib/motion';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface-raised p-6',
        className,
      )}
    >
      <h2 className="mb-4 font-serif text-[length:var(--text-h2)] font-normal text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({
  name,
  value,
  textClass,
  className,
}: {
  name: string;
  value: string;
  textClass?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ backgroundColor: value }}
      />
      <span className={cn('font-mono text-xs', textClass ?? 'text-muted')}>
        {name}
      </span>
      <span className="font-mono text-[10px] text-muted">{value}</span>
    </div>
  );
}

function StatusPill({
  label,
  bgClass,
}: {
  label: string;
  bgClass: string;
}) {
  return (
    <div className="flex gap-2">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
          bgClass,
          'text-white',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
          bgClass,
          'text-foreground',
        )}
      >
        {label} (light text)
      </span>
    </div>
  );
}

/* ─── Spring animator helper ───────────────────────────────────────────── */

function useSpringAnimation(config: SpringConfig) {
  const ref = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const play = useCallback(() => {
    const el = ref.current;
    if (!el || animatingRef.current) return;
    animatingRef.current = true;

    // Use CSS spring easing approximation with variable duration based on config
    const duration = Math.round(
      500 * (1 + (20 - config.damping) / 20) * (180 / config.stiffness),
    );
    el.style.transition = `transform ${duration}ms var(--ease-spring)`;
    el.style.transform = 'translateX(180px)';

    setTimeout(() => {
      el.style.transform = 'translateX(0)';
      setTimeout(() => {
        animatingRef.current = false;
      }, duration);
    }, duration);
  }, [config]);

  return { ref, play };
}

/* ─── Section Components ───────────────────────────────────────────────── */

function SurfaceHierarchy() {
  const surfaces = [
    { name: '--surface-base', value: 'oklch(0.20 0.010 32)', cssClass: 'bg-surface-base' },
    { name: '--surface-raised', value: 'oklch(0.23 0.008 32)', cssClass: 'bg-surface-raised' },
    { name: '--surface-overlay', value: 'oklch(0.27 0.007 32)', cssClass: 'bg-surface-overlay' },
  ] as const;

  return (
    <SectionCard title="1. Surface Hierarchy">
      <p className="mb-4 text-secondary-foreground">
        Three surface tiers with warm charcoal hue ~32. Distinction via lightness
        steps only (no box-shadow). Each surface shows all text hierarchy tiers.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {surfaces.map((s) => (
          <div
            key={s.name}
            className={cn(
              'rounded-lg border border-border p-5',
              s.cssClass,
            )}
          >
            <p className="mb-3 font-mono text-xs text-muted">{s.name}</p>
            <p className="font-mono text-[10px] text-muted">{s.value}</p>
            <hr className="my-3 border-border" />
            <p className="text-foreground">Primary text</p>
            <p className="text-secondary-foreground">Secondary text</p>
            <p className="text-muted">Muted text</p>
          </div>
        ))}
      </div>

      {/* Border samples */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 border-t border-border" />
        <span className="font-mono text-xs text-muted">--border-subtle</span>
        <div className="flex-1 border-t border-border-interactive" />
        <span className="font-mono text-xs text-muted">--border-interactive</span>
      </div>
    </SectionCard>
  );
}

function ColorPalette() {
  return (
    <SectionCard title="2. Color Palette">
      {/* Accent colors */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Accent Colors
      </h3>
      <div className="mb-6 grid grid-cols-5 gap-3">
        <ColorSwatch
          name="--accent-primary"
          value="oklch(0.63 0.14 20)"
          textClass="text-foreground"
        />
        <ColorSwatch
          name="--accent-primary-hover"
          value="oklch(0.68 0.15 20)"
        />
        <ColorSwatch
          name="--accent-primary-muted"
          value="oklch(0.63 0.14 20 / 0.15)"
        />
        <ColorSwatch
          name="--accent-primary-fg"
          value="oklch(0.20 0.01 32)"
        />
        <ColorSwatch
          name="--accent-secondary"
          value="oklch(0.72 0.14 70)"
        />
      </div>

      {/* Status colors */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Status Colors
      </h3>
      <div className="mb-6 flex flex-col gap-2">
        <StatusPill label="Success" bgClass="bg-success" />
        <StatusPill label="Error" bgClass="bg-destructive" />
        <StatusPill label="Warning" bgClass="bg-warning" />
        <StatusPill label="Info" bgClass="bg-info" />
      </div>

      {/* Rose variants */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Rose Accent Variants
      </h3>
      <div className="mb-6 grid grid-cols-4 gap-3">
        <ColorSwatch name="--rose-accent" value="oklch(0.63 0.14 20)" />
        <ColorSwatch name="--rose-text" value="oklch(0.75 0.10 350)" />
        <ColorSwatch name="--rose-focus-glow" value="oklch(0.63 0.14 20)" />
        <ColorSwatch name="--rose-selection" value="oklch(0.63 0.14 20)" />
      </div>

      {/* FX gradient colors */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        FX Gradient Tokens
      </h3>
      <div className="mb-6 grid grid-cols-4 gap-3">
        <ColorSwatch name="--fx-gradient-rose" value="oklch(0.65 0.12 0)" />
        <ColorSwatch name="--fx-gradient-violet" value="oklch(0.60 0.10 270)" />
        <ColorSwatch name="--fx-gradient-teal" value="oklch(0.60 0.09 180)" />
        <ColorSwatch name="--fx-gradient-amber" value="oklch(0.65 0.12 70)" />
      </div>

      {/* Diff colors */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Diff Colors
      </h3>
      <div className="mb-6 space-y-1">
        <div className="rounded bg-diff-added px-3 py-1 font-mono text-xs text-foreground">
          + const result = compute(data);
        </div>
        <div className="rounded bg-diff-removed px-3 py-1 font-mono text-xs text-foreground">
          - const result = oldCompute(data);
        </div>
      </div>

      {/* Code surface */}
      <h3 className="mb-2 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Code Surface
      </h3>
      <div className="rounded-lg bg-code-surface p-4 font-mono text-sm text-foreground">
        <span className="text-muted">{'// Code block on --code-surface'}</span>
        <br />
        <span>{'const greeting = '}</span>
        <span className="inline rounded bg-code-inline px-1.5 py-0.5">
          &quot;Hello, World!&quot;
        </span>
        <span>;</span>
        <br />
        <span className="text-muted">{'// Inline code uses --code-inline-bg'}</span>
      </div>
    </SectionCard>
  );
}

function Typography() {
  const pangram = 'The quick brown fox jumps over the lazy dog';
  const codeSample = 'const greeting = "Hello, World!";';

  return (
    <SectionCard title="3. Typography">
      {/* Font specimens */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Font Specimens
      </h3>

      <div className="mb-6 space-y-4 rounded-lg border border-border bg-surface-base p-4">
        <div>
          <p className="mb-1 font-mono text-xs text-muted">
            Inter Variable (font-sans)
          </p>
          <p className="font-sans text-sm text-foreground">{pangram}</p>
          <p className="font-sans text-base text-foreground">{pangram}</p>
          <p className="font-sans text-lg text-foreground">{pangram}</p>
          <p className="font-sans text-2xl text-foreground">{pangram}</p>
        </div>

        <hr className="border-border" />

        <div>
          <p className="mb-1 font-mono text-xs text-muted">
            Instrument Serif (font-serif)
          </p>
          <p className="font-serif text-sm text-foreground">{pangram}</p>
          <p className="font-serif text-base text-foreground">{pangram}</p>
          <p className="font-serif text-lg text-foreground">{pangram}</p>
          <p className="font-serif text-2xl text-foreground">{pangram}</p>
        </div>

        <hr className="border-border" />

        <div>
          <p className="mb-1 font-mono text-xs text-muted">
            JetBrains Mono (font-mono)
          </p>
          <p className="font-mono text-sm text-foreground">{codeSample}</p>
          <p className="font-mono text-base text-foreground">{codeSample}</p>
          <p className="font-mono text-lg text-foreground">{codeSample}</p>
        </div>
      </div>

      {/* Heading scale */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Heading Scale
      </h3>
      <div className="mb-6 space-y-2 rounded-lg border border-border bg-surface-base p-4">
        <p className="font-serif text-[length:var(--text-h1)] text-foreground">
          H1 -- Instrument Serif (32px)
        </p>
        <p className="font-serif text-[length:var(--text-h2)] text-foreground">
          H2 -- Instrument Serif (24px)
        </p>
        <p className="font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
          H3 -- Inter Semibold (18px)
        </p>
        <p className="font-sans text-[length:var(--text-body)] text-foreground">
          Body -- Inter Regular (14px)
        </p>
      </div>

      {/* Density comparison */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Density Comparison
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface-base p-4">
          <p className="mb-2 font-mono text-xs text-muted">
            Compact (8px / --density-compact)
          </p>
          <div className="flex flex-col" style={{ gap: 'var(--density-compact)' }}>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item one
            </div>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item two
            </div>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item three
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-base p-4">
          <p className="mb-2 font-mono text-xs text-muted">
            Comfortable (12px / --density-comfortable)
          </p>
          <div className="flex flex-col" style={{ gap: 'var(--density-comfortable)' }}>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item one
            </div>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item two
            </div>
            <div className="rounded border border-border bg-surface-overlay px-3 py-1 text-sm text-foreground">
              List item three
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SpacingScale() {
  const spaces = [
    { name: '--space-1', value: '4px', px: 4 },
    { name: '--space-2', value: '8px', px: 8 },
    { name: '--space-3', value: '12px', px: 12 },
    { name: '--space-4', value: '16px', px: 16 },
    { name: '--space-5', value: '20px', px: 20 },
    { name: '--space-6', value: '24px', px: 24 },
    { name: '--space-8', value: '32px', px: 32 },
    { name: '--space-10', value: '40px', px: 40 },
    { name: '--space-12', value: '48px', px: 48 },
    { name: '--space-16', value: '64px', px: 64 },
  ] as const;

  return (
    <SectionCard title="4. Spacing Scale">
      <p className="mb-4 text-secondary-foreground">
        4px base grid. 10 stops from 4px to 64px.
      </p>
      <div className="space-y-2">
        {spaces.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-mono text-xs text-muted">
              {s.name}
            </span>
            <div
              className="h-4 rounded bg-primary"
              style={{ width: `${s.px}px` }}
            />
            <span className="font-mono text-xs text-secondary-foreground">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Grid alignment check */}
      <div className="mt-4">
        <p className="mb-2 font-mono text-xs text-muted">
          4px grid alignment check
        </p>
        <div className="flex gap-1">
          {spaces.map((s) => (
            <div
              key={s.name}
              className="rounded border border-border-interactive bg-surface-overlay"
              style={{ width: `${s.px}px`, height: `${s.px}px` }}
              title={s.name}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ZIndexDictionary() {
  const tiers = [
    { name: '--z-base', value: 0, usage: 'Default content layer' },
    { name: '--z-sticky', value: 10, usage: 'Sticky headers, pinned elements' },
    { name: '--z-dropdown', value: 20, usage: 'Dropdown menus, popovers' },
    { name: '--z-scroll-pill', value: 30, usage: 'Floating scroll indicator' },
    { name: '--z-overlay', value: 40, usage: 'Overlays, sidebars' },
    { name: '--z-modal', value: 50, usage: 'Modal dialogs' },
    { name: '--z-toast', value: 60, usage: 'Toast notifications' },
    { name: '--z-critical', value: 9999, usage: 'Error boundaries, crash screens' },
  ] as const;

  return (
    <SectionCard title="5. Z-Index Dictionary">
      <table className="mb-6 w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 font-mono text-xs font-semibold text-foreground">
              Token
            </th>
            <th className="pb-2 font-mono text-xs font-semibold text-foreground">
              Value
            </th>
            <th className="pb-2 font-mono text-xs font-semibold text-foreground">
              Usage
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.name} className="border-b border-border">
              <td className="py-2 font-mono text-xs text-muted">{t.name}</td>
              <td className="py-2 font-mono text-xs text-secondary-foreground">
                {t.value}
              </td>
              <td className="py-2 text-sm text-secondary-foreground">
                {t.usage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual stacking demo */}
      <p className="mb-2 font-mono text-xs text-muted">
        Stacking order demo (higher z = more visible)
      </p>
      <div className="relative h-32">
        {tiers.slice(0, 5).map((t, i) => (
          <div
            key={t.name}
            className="absolute flex items-center justify-center rounded border border-border-interactive text-xs text-foreground"
            style={{
              zIndex: t.value,
              left: `${i * 40}px`,
              top: `${i * 12}px`,
              width: '120px',
              height: '48px',
              backgroundColor: `oklch(${0.25 + i * 0.06} 0.${String(10 - i).padStart(2, '0')} ${i * 60})`,
            }}
          >
            {t.name.replace('--z-', '')}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MotionTokens() {
  const [easingAnimate, setEasingAnimate] = useState<string | null>(null);
  const [durationAnimate, setDurationAnimate] = useState<string | null>(null);

  const easings = [
    {
      name: 'spring',
      token: '--ease-spring',
      value: EASING.spring,
    },
    {
      name: 'out',
      token: '--ease-out',
      value: EASING.out,
    },
    {
      name: 'inOut',
      token: '--ease-in-out',
      value: EASING.inOut,
    },
  ] as const;

  const durations = [
    { name: 'fast', token: '--duration-fast', ms: DURATION.fast },
    { name: 'normal', token: '--duration-normal', ms: DURATION.normal },
    { name: 'slow', token: '--duration-slow', ms: DURATION.slow },
  ] as const;

  return (
    <SectionCard title="6. Motion Tokens">
      {/* Easing demo */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        CSS Easing Curves
      </h3>
      <p className="mb-3 text-sm text-secondary-foreground">
        Click a box to animate translateX with its easing curve.
      </p>
      <div className="mb-6 space-y-3">
        {easings.map((e) => (
          <div key={e.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 font-mono text-xs text-muted">
              {e.token}
            </span>
            <div
              role="button"
              tabIndex={0}
              className={cn(
                'h-10 w-10 cursor-pointer rounded bg-primary',
                'transition-transform',
              )}
              style={{
                transitionDuration: `${DURATION.spring}ms`,
                transitionTimingFunction: e.value,
                transform:
                  easingAnimate === e.name
                    ? 'translateX(200px)'
                    : 'translateX(0)',
              }}
              onClick={() => {
                setEasingAnimate(e.name);
                setTimeout(() => setEasingAnimate(null), DURATION.spring + 100);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  setEasingAnimate(e.name);
                  setTimeout(
                    () => setEasingAnimate(null),
                    DURATION.spring + 100,
                  );
                }
              }}
            />
            <span className="font-mono text-[10px] text-muted">{e.value}</span>
          </div>
        ))}
      </div>

      {/* Duration demo */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Duration Scale
      </h3>
      <p className="mb-3 text-sm text-secondary-foreground">
        Click a box to see its fade-in/out at the given duration.
      </p>
      <div className="space-y-3">
        {durations.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 font-mono text-xs text-muted">
              {d.token}
            </span>
            <div
              role="button"
              tabIndex={0}
              className="h-10 w-10 cursor-pointer rounded bg-primary transition-opacity"
              style={{
                transitionDuration: `${d.ms}ms`,
                opacity: durationAnimate === d.name ? 0.15 : 1,
              }}
              onClick={() => {
                setDurationAnimate(d.name);
                setTimeout(() => setDurationAnimate(null), d.ms + 200);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  setDurationAnimate(d.name);
                  setTimeout(() => setDurationAnimate(null), d.ms + 200);
                }
              }}
            />
            <span className="font-mono text-xs text-secondary-foreground">
              {d.ms}ms
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SpringLab() {
  const gentle = useSpringAnimation(SPRING_GENTLE);
  const snappy = useSpringAnimation(SPRING_SNAPPY);
  const bouncy = useSpringAnimation(SPRING_BOUNCY);

  const playAll = useCallback(() => {
    gentle.play();
    snappy.play();
    bouncy.play();
  }, [gentle, snappy, bouncy]);

  const springs = [
    {
      label: 'Gentle',
      usage: 'Sidebar transitions',
      config: SPRING_GENTLE,
      anim: gentle,
    },
    {
      label: 'Snappy',
      usage: 'Button press',
      config: SPRING_SNAPPY,
      anim: snappy,
    },
    {
      label: 'Bouncy',
      usage: 'Notifications',
      config: SPRING_BOUNCY,
      anim: bouncy,
    },
  ] as const;

  return (
    <SectionCard title="7. Spring Lab">
      <p className="mb-4 text-sm text-secondary-foreground">
        Three spring configurations imported from <code className="rounded bg-code-inline px-1 py-0.5 font-mono text-xs">@/lib/motion</code>.
        Click each box or use &quot;Play All&quot; to compare. CSS cubic-bezier approximation used
        for demo. <span className="text-muted italic">Full spring physics via LazyMotion in M3.</span>
      </p>

      <div className="mb-4 space-y-4">
        {springs.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <div className="w-40 shrink-0">
              <p className="font-sans text-sm font-semibold text-foreground">
                {s.label}
              </p>
              <p className="text-xs text-muted">{s.usage}</p>
              <p className="font-mono text-[10px] text-muted">
                stiffness: {s.config.stiffness}, damping: {s.config.damping}
              </p>
            </div>
            <div
              ref={s.anim.ref}
              role="button"
              tabIndex={0}
              className="h-10 w-10 cursor-pointer rounded-full bg-primary"
              onClick={s.anim.play}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') s.anim.play();
              }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className={cn(
          'rounded-md bg-primary px-4 py-2 text-sm font-semibold',
          'text-primary-foreground',
          'transition-colors hover:bg-primary-hover',
        )}
        style={{
          transitionDuration: 'var(--duration-fast)',
        }}
        onClick={playAll}
      >
        Play All
      </button>
    </SectionCard>
  );
}

function GlassFxTokens() {
  return (
    <SectionCard title="8. Glass & FX Tokens">
      {/* Glass demo */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Glassmorphic Card
      </h3>
      <div className="relative mb-6 overflow-hidden rounded-lg" style={{ height: '200px' }}>
        {/* Background gradient for glass effect visibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              var(--fx-gradient-rose),
              var(--fx-gradient-violet),
              var(--fx-gradient-teal),
              var(--fx-gradient-amber)
            )`,
            opacity: 0.5,
          }}
        />
        {/* Glass card */}
        <div
          className="absolute inset-4 flex items-center justify-center rounded-lg border border-border-interactive p-6"
          style={{
            backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
            WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
            backgroundColor: `oklch(0.20 0.010 32 / var(--glass-bg-opacity))`,
          }}
        >
          <div className="text-center">
            <p className="font-serif text-lg text-foreground">
              Glass Effect Demo
            </p>
            <p className="mt-1 text-sm text-secondary-foreground">
              blur: var(--glass-blur) | saturate: var(--glass-saturate) | opacity: var(--glass-bg-opacity)
            </p>
          </div>
        </div>
      </div>

      {/* Aurora/ambient shimmer demo */}
      <h3 className="mb-3 font-sans text-[length:var(--text-h3)] font-semibold text-foreground">
        Aurora / Ambient Shimmer
      </h3>
      <div className="relative overflow-hidden rounded-lg bg-surface-base" style={{ height: '160px' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              120deg,
              var(--fx-gradient-rose),
              var(--fx-gradient-violet),
              var(--fx-gradient-teal),
              var(--fx-gradient-amber),
              var(--fx-gradient-rose)
            )`,
            backgroundSize: '300% 300%',
            opacity: 'var(--fx-ambient-opacity)',
            animation: `aurora-drift var(--fx-ambient-speed) ease-in-out infinite`,
          }}
        />
        <div className="relative flex h-full items-center justify-center" style={{ zIndex: 'var(--z-sticky)' }}>
          <div className="text-center">
            <p className="font-serif text-lg text-foreground">
              Content above aurora
            </p>
            <p className="mt-1 text-sm text-muted">
              Subtle animated gradient at {'{'}--fx-ambient-opacity{'}'} opacity,
              speed {'{'}--fx-ambient-speed{'}'}
            </p>
          </div>
        </div>
      </div>

      {/* FX token values reference */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { name: '--glass-blur', value: '16px' },
          { name: '--glass-saturate', value: '1.4' },
          { name: '--glass-bg-opacity', value: '0.7' },
          { name: '--fx-ambient-speed', value: '45s' },
          { name: '--fx-ambient-opacity', value: '0.04' },
          { name: '--fx-aurora-speed', value: '4s' },
          { name: '--fx-aurora-blur', value: '6px' },
          { name: '--fx-aurora-pulse-min', value: '0.3' },
        ].map((t) => (
          <div key={t.name} className="flex justify-between">
            <span className="font-mono text-xs text-muted">{t.name}</span>
            <span className="font-mono text-xs text-secondary-foreground">{t.value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Main Export ───────────────────────────────────────────────────────── */

export function TokenPreview() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-surface-base p-6 md:p-10">
      <header className="mb-8">
        <h1 className="font-serif text-[length:var(--text-h1)] text-foreground">
          Design Token Preview
        </h1>
        <p className="mt-2 text-sm text-secondary-foreground">
          Loom V2 visual validation page. Every design token rendered for human inspection.
        </p>
        <p className="mt-1 font-mono text-xs text-muted">
          /dev/tokens -- permanent dev tool
        </p>
      </header>

      <div className="space-y-8">
        <SurfaceHierarchy />
        <ColorPalette />
        <Typography />
        <SpacingScale />
        <ZIndexDictionary />
        <MotionTokens />
        <SpringLab />
        <GlassFxTokens />
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-center text-sm text-muted">
        Phase 1: Design System Foundation -- DS-01 through DS-06
      </footer>

      {/* Aurora keyframes -- scoped to this page */}
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
