/**
 * Motion constants for Loom V2
 *
 * CSS easing tokens are defined in tokens.css as CSS custom properties.
 * Spring physics configs live here because CSS cannot express spring dynamics.
 *
 * Usage:
 * - EASING/DURATION: Reference in JS-driven animations or as fallback
 * - SPRING_*: Pass to Framer Motion's `transition` prop or custom spring solver
 */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

/**
 * Gentle spring -- sidebar slide, panel transitions.
 * CSS equivalents: --ease-spring-gentle and --duration-spring-gentle in tokens.css
 */
export const SPRING_GENTLE: SpringConfig = {
  stiffness: 120,
  damping: 14,
};

/**
 * Snappy spring -- button press, toggle snap, micro-interactions.
 * CSS equivalents: --ease-spring-snappy and --duration-spring-snappy in tokens.css
 */
export const SPRING_SNAPPY: SpringConfig = {
  stiffness: 300,
  damping: 24,
};

/**
 * Bouncy spring -- playful entrance, notification pop, celebratory.
 * CSS equivalents: --ease-spring-bouncy and --duration-spring-bouncy in tokens.css
 */
export const SPRING_BOUNCY: SpringConfig = {
  stiffness: 180,
  damping: 14,
};

/**
 * CSS easing token values for JS-driven animations.
 * These mirror the CSS custom properties in tokens.css.
 */
export const EASING = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/**
 * Duration values in milliseconds for JS-driven animations.
 * These mirror the CSS custom properties in tokens.css.
 */
export const DURATION = {
  fast: 100,
  normal: 200,
  slow: 400,
  spring: 500,
} as const;

/** Check if user prefers reduced motion. Use for JS-driven animations (framer-motion). */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
