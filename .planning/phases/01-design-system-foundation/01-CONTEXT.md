# Phase 1: Design Token System - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning
**Verified by:** Gemini Architect (review mode)

<domain>
## Phase Boundary

Define every visual value used in the application as a CSS custom property or JS constant — colors (OKLCH), motion (CSS easing + JS spring configs), spacing (4px grid), z-index (8 tiers), and typography (3 font families) — so no component ever needs a hardcoded value. Includes V2 project scaffolding (fresh Vite + React 18 + TS + Tailwind v4) and a comprehensive token preview dev tool.

</domain>

<decisions>
## Implementation Decisions

### Color palette & personality
- **Color space:** OKLCH for all color tokens (DS-01 requirement)
- **Surface tone:** Warm charcoal — slight brown/amber undertone in dark grays. NOT neutral or cool gray. Aligns with V2 Constitution Section 7.1 (Hue 30 = amber/brown).
- **Primary accent:** Dusty rose (#D4736C) — locked from requirements and architectural consensus
- **Secondary accent:** Amber/gold — warm complement to dusty rose
- **Saturation:** Jewel tones — deep, rich, saturated but not neon. Think ruby, amber, emerald. Confident without being garish.
- **Contrast:** HIGH — explicitly not soft/muted. Accents should punch against charcoal surfaces.
- **FX/decorative tokens:** Claude's discretion — define if needed for aurora shimmer, glow effects, gradient overlays
- **Status colors:** Warm-tinted but highly readable on dark surfaces. Not forced warm — prioritize clarity.
- **Borders:** Mixed opacity — subtle (6-8%) for content area separations, more visible (12-18%) for interactive elements (cards, inputs, panels). Two border tokens: `--border-subtle` and `--border-interactive`.
- **Overall variety:** Rich/expressive — 5-7+ intentional colors with clear roles, gradients and FX colors for decorative use
- **Reference products:** Warp terminal (rich dark, warm, expressive), Arc browser (playful, gradient-heavy), Linear (clean hierarchy, professional)
- **Constitution constraint:** Dusty rose applied sparingly (max 5% of UI surface). Don't splash jewel tones everywhere — precision over abundance.

### Typography & density
- **Body font:** Inter Variable at 14px base size. Monospace is NOT the body font (V1 bug fixed).
- **Heading font:** Instrument Serif — used for session titles, major section headings, modal titles. Creates "high-end journal" editorial warmth.
- **Code font:** JetBrains Mono — code blocks and inline code only
- **Heading scale:** Dynamic — 14px (body) → 18px (H3) → 24px (H2) → 32px (H1). Authority and visual hierarchy.
- **Line height:** Standard 1.5 for body text
- **Letter spacing:** Default (0) for Inter
- **Font loading:** Self-hosted .woff2 files via @font-face with font-display: swap. No CDN.
- **Density:** Adaptive — 8px base unit in sidebar/controls (dense, precise), 12px in chat/content areas (comfortable reading). Two density contexts.
- **Code presentation:** Subtle background shift — code blocks get a slightly different surface color, inline code gets a faint background pill
- **Chat vs sidebar typography:** Claude's discretion — optimize per context

### V2 project setup
- **Source directory:** Fresh directory separate from V1 src/ (e.g., src-v2/ or clean branch). V1 stays as reference only.
- **Scaffold approach:** `npm create vite@latest` — clean dependency tree, no V1 baggage
- **Phase 1 Plan 01-01 includes full scaffolding** — directory structure, TS config, Tailwind v4 wiring. Not a pre-step.
- **Tailwind v4:** CSS-first `@theme` configuration. No tailwind.config.js. Tokens defined in CSS.
- **Dev server:** Vite proxy to backend on port 5555
- **Directory layout:** Must reflect V2 Constitution Section 1.1 from first commit (src/components/, src/stores/, src/styles/, src/lib/, src/hooks/)

### Token preview
- **Scope:** Comprehensive stress test — all colors on all 3 surface tiers, text contrast verification, spacing grid visualization, motion/spring demos, font specimens
- **Persistence:** Permanent dev tool at /tokens or /dev/tokens route. Not temporary.
- **Format:** Claude's discretion (React component at a route vs. static HTML)
- **Must include:** Spring Lab section to verify DS-02 motion values

### Claude's Discretion
- FX/decorative token design (aurora shimmer, glow effects, gradient overlays)
- Token preview page format (React route vs. static HTML)
- Chat vs. sidebar typographic differentiation
- Popover/dropdown floating treatment (shadow vs. 4th surface tier)
- Exact OKLCH values for the full palette (warm charcoal + dusty rose + amber/gold + status)
- Code block surface color differentiation approach

</decisions>

<specifics>
## Specific Ideas

- "High-end journal that happens to execute code" — Gemini's description of the target feel
- Warp terminal's rich dark theme with warm tones and expressive gradients — the energy reference
- Arc browser's playful, personality-forward approach — the boldness reference
- Linear's clean hierarchy and professionalism — the precision reference
- "Precise laser" + "Warm library" = the Project Soul duality
- Dusty rose at max 5% of UI surface — accent is precious, not splashed everywhere
- JetBrains Mono gives code blocks a distinct personality vs. Inter body text
- Instrument Serif in headers creates a "document" feel that distinguishes Loom from generic dev tools

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — V2 is a ground-up build. No V1 code reused.

### Established Patterns
- V1 src/ exists as reference for feature parity but NOT for code patterns
- Backend API contract documented in .planning/BACKEND_API_CONTRACT.md
- V2 Constitution (.planning/V2_CONSTITUTION.md) defines all coding conventions

### Integration Points
- Backend server on port 5555 — Vite dev proxy target
- WebSocket at /ws and /shell paths
- REST API endpoints documented in backend contract

</code_context>

<deferred>
## Deferred Ideas

- Pulling enforcement (ESLint rules, TS strict) into Phase 1 — discussed with Gemini who strongly recommended it, but user chose to keep roadmap's Phase 1/Phase 2 split. Enforcement stays in Phase 2.
- Storybook for component documentation — consider for M2 or M3

</deferred>

---

*Phase: 01-design-system-foundation*
*Context gathered: 2026-03-04*
*Gemini architect review: Approved with corrections applied (heading scale, serif scope, density)*
