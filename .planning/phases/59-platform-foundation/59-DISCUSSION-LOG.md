# Phase 59: Platform Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 59-Platform Foundation
**Areas discussed:** Platform detection, URL construction, API base URL, Capacitor config, Migration strategy
**Mode:** Auto-resolved (--auto flag, infrastructure phase)

---

## Platform Detection Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| `Capacitor.isNativePlatform()` | Official Capacitor API, requires @capacitor/core import | |
| `typeof window.Capacitor !== 'undefined'` | Runtime check, no import dependency | ✓ |
| Vite env var (VITE_IS_CAPACITOR) | Build-time detection, requires separate builds | |

**User's choice:** [auto] Runtime `typeof window.Capacitor` — lowest friction, no tight coupling
**Notes:** Prior decision from v2.1 planning already specified platform.ts with IS_NATIVE pattern

---

## URL Construction Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized platform.ts module | resolveApiUrl/resolveWsUrl functions, single source of truth | ✓ |
| Vite env vars only | VITE_API_URL/VITE_WS_URL, deterministic at build time | |
| Runtime server config | Fetch URL config from server endpoint | |

**User's choice:** [auto] Centralized module — no rebuild needed per server, aligns with prior planning decisions
**Notes:** Bard concurred; env vars force rebuilds, server config adds latency

---

## API Base URL Source

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded + VITE_API_URL override | Known server (100.86.4.57:5555), env var for flexibility | ✓ |
| Pure VITE_API_URL | Must set env var for every build | |
| Server-provided via auth response | Dynamic, but adds latency and auth dependency | |

**User's choice:** [auto] Hardcoded with env var override — known server, simplest path
**Notes:** Direct Express port (5555) for Capacitor, not the HTTPS proxy chain

---

## Capacitor Config Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Include minimal capacitor.config.ts | Config file only, CapacitorHttp disabled | ✓ |
| Defer to Phase 63 | No config until bundled assets phase | |

**User's choice:** [auto] Include now — prevents CapacitorHttp accident, cheap to add
**Notes:** Do NOT run `cap add ios` — just the config file

---

## Auth/Fetch Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Create fetchAnon() for unauth calls | Separate utility, clean separation | ✓ |
| Add no-auth mode to apiFetch() | Overloaded function, more complex | |
| Inline resolveApiUrl() in auth.ts | No new utility, but duplicated pattern | |

**User's choice:** [auto] fetchAnon() utility — cleaner separation than overloading apiFetch()
**Notes:** auth.ts has circular dependency issue (needs token but is how you get token). fetchAnon() resolves this cleanly.

---

## Claude's Discretion

- JSDoc depth in platform.ts
- ESLint rule vs grep check for preventing bare fetch('/api/...')
- Error handling in fetchAnon()
- Test strategy (unit tests for URL helpers vs integration-only)

---

## Deferred Ideas

- ESLint custom rule preventing bare `fetch('/api')` — nice but not essential
- Dynamic server URL discovery from backend — unnecessary for known server
- Separate Vite build configs — premature
