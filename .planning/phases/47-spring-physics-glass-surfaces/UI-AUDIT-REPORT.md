# Loom V2 — Comprehensive UI Audit Report

**Date:** 2026-03-20
**Method:** 5 parallel Chrome Bridge agents (tabs 7-11) + computed style verification
**App:** http://100.86.4.57:5184 (v1.5 "The Craft", post-Phase 47)
**Agent hours:** ~35 minutes wall clock, 375+ tool calls across 5 tracks

---

## Executive Summary

**Overall Grade: A-**

Loom's visual implementation is remarkably disciplined. The OKLCH color token system has **zero leakage** — every computed color matches `tokens.css` exactly. Z-index discipline is exemplary, spacing follows a clean 4px grid, and accessibility fundamentals (landmarks, skip link, reduced motion, contrast) are strong. The main gaps are: missing focus indicators on custom components (WCAG violation), `cursor: default` on most buttons, and heading hierarchy issues.

---

## Consolidated Findings by Severity

### S-Grade (Fix Before Next Phase)

| ID | Track | Finding | Details |
|----|-------|---------|---------|
| **S-1** | Components | **No visible focus indicators on custom buttons/tabs** | Workspace tabs, sidebar buttons, suggestion buttons show no outline/ring on focus. WCAG 2.4.7 violation. shadcn primitives have `focus-visible:ring-[3px]` but custom components don't. |

### A-Grade (Fix This Milestone)

| ID | Track | Finding | Details |
|----|-------|---------|---------|
| **A-1** | Components | **`cursor: default` on 15/19 buttons** | Tailwind preflight resets buttons; only "New Chat" + Git buttons add `cursor-pointer`. Systematic omission. |
| **A-2** | A11y | **Session listbox items all `tabIndex: 0`** | Every session is a separate tab stop. Should use single tab stop + arrow key navigation per WAI-ARIA listbox pattern. |
| **A-3** | A11y | **Heading skip: H1 → H3 in sidebar** | No H2 between page H1 "Loom" and sidebar H3. |
| **A-4** | A11y | **Hidden tabpanels missing `inert`** | Files/Shell/Git panels have `display:none` + `aria-hidden` but no `inert`. Defense-in-depth. |
| **A-5** | A11y | **Workspace tab focus ring unverified** | `focus-visible:ring-2` classes present but computed value shows `none` on programmatic focus. Likely works with real keyboard — needs manual verification. |

### B-Grade (Fix If Convenient)

| ID | Track | Finding | Details |
|----|-------|---------|---------|
| **B-1** | Components | **Closed settings dialog retains `pointer-events: auto`, no `aria-hidden`** | Mount-once pattern gap — screen readers can traverse closed dialog, could intercept clicks on ultrawide monitors. |
| **B-2** | Components | **Settings `<h2>` uses Inter, not Instrument Serif** | Inconsistent with main H1 which uses serif. Design decision needed: is serif H1-only? |
| **B-3** | Components | **Two transition durations (100ms, 150ms) neither match a token** | `--duration-fast` is 100ms but some use 150ms. Minor consistency issue. |
| **B-4** | A11y | **Missing `search` landmark** on sidebar search input |
| **B-5** | A11y | **No headings in Files/Shell/Git panels** |
| **B-6** | A11y | **H1 disappears when chat session is active** |
| **B-7** | A11y | **Muted text at AA boundary** (4.58:1) — passes but minimal margin |
| **B-8** | A11y | **No `aria-activedescendant`** on session listbox |
| **B-9** | A11y | **Settings dialog `aria-describedby={undefined}`** explicitly set |
| **B-10** | A11y | **Inconsistent focus patterns** — custom CSS box-shadow vs Tailwind ring |

### C-Grade (Nits)

| ID | Track | Finding |
|----|-------|---------|
| **C-1** | Components | Session list items have `0px` border-radius vs `6px` elsewhere |
| **C-2** | Components | Composer pill uses `12px` radius (no matching token) |
| **C-3** | Components | Electric border uses raw `z-index: 1` |
| **C-4** | A11y | Hidden alert element for git error in DOM |

---

## Scorecard

| Category | Grade | Highlights |
|----------|-------|------------|
| **Color Tokens** | **SS** | Zero hex/HSL leakage. Every OKLCH value matches tokens.css. |
| **Z-Index** | **SS** | All app-level values use `--z-*` tokens. 8-tier system. |
| **Reduced Motion** | **SSS** | 18 CSS rules — global fallback + 11 per-component overrides. |
| **Skip Link** | **SSS** | First focusable element, targets `<main id="main-content">`. |
| **ARIA Landmarks** | **A-** | main, complementary, nav, tablist, region, status — all labeled. |
| **Color Contrast** | **A** | All text passes WCAG AA. Muted text at boundary (4.58:1). |
| **Keyboard Nav** | **A-** | WAI-ARIA tab pattern correct. Session listbox needs work. |
| **Screen Reader** | **S** | 40/40 buttons labeled. All SVGs aria-hidden. Perfect icon handling. |
| **Typography** | **A** | All 3 fonts load correctly. Modal heading font question. |
| **Spacing** | **A** | Clean 4px grid. Consistent within component groups. |
| **Border Radius** | **A** | Sensible 3-tier system (6/8/12px). |
| **Button States** | **B** | Good disabled states. `cursor: default` is the main gap. |
| **Focus Indicators** | **D** | Critical gap on custom components. shadcn components fine. |
| **Glass Effects** | **A+** | Frosted glass working on all overlays. Token-backed. |
| **Spring Physics** | **A** | All surfaces wired. @starting-style prevents cold-load flash. |

---

## Top 3 Action Items

1. **Add `cursor-pointer` globally** — Either `button { cursor: pointer; }` in base.css, or systematic class addition. Affects 15 buttons.

2. **Add focus-visible rings to custom components** — Workspace tabs, sidebar toggle, suggestion buttons, session items all need `focus-visible:ring-2 focus-visible:ring-ring` or the custom `box-shadow` equivalent.

3. **Fix session listbox keyboard pattern** — Single tab stop on container + arrow key navigation. Removes excessive tab stops for keyboard users.

---

## What's Exceptional

- **OKLCH color system** is flawlessly implemented — a rare achievement in any production app
- **Reduced motion support** is best-in-class (18 rules, global + per-component)
- **Design token discipline** across surfaces, text, borders, z-index, glass, and springs
- **Accessibility fundamentals** (landmarks, labels, live regions, skip link) show deliberate a11y engineering
- **Glass effects** (Phase 47) are correctly token-backed and visually consistent across all overlay surfaces
