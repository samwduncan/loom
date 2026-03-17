/**
 * SkipLink -- visually hidden link that becomes visible on focus.
 *
 * Allows keyboard users to skip sidebar navigation and jump directly
 * to the main content area. Uses sr-only + focus:not-sr-only pattern.
 *
 * Constitution: Named export (2.2), design tokens only (3.1).
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[var(--z-critical)] focus:px-4 focus:py-2 focus:bg-surface-overlay focus:text-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
