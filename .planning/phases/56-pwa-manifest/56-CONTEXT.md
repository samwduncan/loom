# Phase 56: PWA Manifest - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Users can install Loom to their phone's home screen as a standalone app via "Add to Home Screen". Manifest-only PWA — NO service worker (avoids stale content on Tailscale network).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key constraints:

- PWA-01: Create `public/manifest.json` with app name, icons, display: standalone, theme_color, background_color matching OKLCH dark theme
- PWA-02: Generate app icons (192x192, 512x512) as SVG or reference existing vite.svg. Add `<link rel="manifest">` and apple-touch-icon meta tags to index.html
- PWA-03: Explicitly do NOT register a service worker. The research unanimously recommends against it for a Tailscale-served single-user app (stale content risk outweighs offline benefit)
- Tailscale MagicDNS provides HTTPS which is required for PWA install prompt

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.html` — Already has viewport meta, add manifest link here
- `public/vite.svg` — Existing icon, can reference or replace
- Design tokens in `src/src/styles/tokens.css` — OKLCH colors for theme

### Integration Points
- `src/index.html` — Add `<link rel="manifest" href="/manifest.json">`
- `public/` — Add manifest.json and icon files

</code_context>

<specifics>
## Specific Ideas

- theme_color should match --surface-base from tokens (dark theme)
- background_color same as theme_color for splash screen
- display: standalone (not fullscreen — standalone shows status bar)
- orientation: any (works in portrait and landscape)

</specifics>

<deferred>
## Deferred Ideas

- Service worker for offline caching (explicitly NOT in v2.0)
- Push notifications (needs service worker)

</deferred>
