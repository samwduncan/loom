# Phase 57: iOS Research - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure/research phase — discuss skipped)

<domain>
## Phase Boundary

Document the path to an iOS App Store app with a working Capacitor prototype. Evaluate Capacitor integration, test Tailscale DNS resolution from WKWebView, and produce a minimal shell project that loads the Loom web build.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/research phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Vite build output at `src/dist/` — the web build Capacitor would wrap
- PWA manifest already configured (Phase 56) — Capacitor may reuse or override
- Tailscale access at `100.86.4.57` — target for DNS testing

### Established Patterns
- Loom frontend is a standard Vite + React SPA
- No service worker (manifest-only PWA) — simplifies Capacitor wrapping
- Backend at port 5555, frontend dev at port 5184

### Integration Points
- Capacitor wraps the web build — needs to point at the right origin
- WKWebView DNS resolution is the key unknown — Tailscale MagicDNS may not work in iOS sandbox

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure/research phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
