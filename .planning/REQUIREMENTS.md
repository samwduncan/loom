# Requirements: Loom V2

**Defined:** 2026-03-18
**Core Value:** Make AI agent work visible, beautiful, and controllable

## v1.5 Requirements

Requirements for "The Craft" milestone. Production quality -- fix every rough edge, nail every detail, add visual personality.

### Foundation & Code Quality

- [x] **FOUND-01**: Settings refactor landed -- generic `useFetch<T>` hook eliminates per-hook boilerplate, connection store has deep merge persist function, ModalState uses discriminated union
- [x] **FOUND-02**: All dead UI removed -- no placeholder fields, fake data, or unused controls visible to the user
- [x] **FOUND-03**: CSS spring tokens generated from existing `SPRING_GENTLE/SNAPPY/BOUNCY` configs and available as `linear()` values in tokens.css

### Loading & Error States

- [x] **LOAD-01**: Every async component shows a directional shimmer skeleton during loading (normalized animation across all skeletons)
- [x] **LOAD-02**: Every component that fetches data has an error state with a retry button and clear error message
- [x] **LOAD-03**: Terminal Suspense fallback uses skeleton component instead of text string

### Empty States

- [x] **EMPTY-01**: File tree shows a designed empty state when no project is selected or project has no files
- [x] **EMPTY-02**: Git panel shows designed empty states for both Changes (no changes) and History (no commits) views
- [x] **EMPTY-03**: Session list shows a designed empty state when no sessions exist for a project
- [x] **EMPTY-04**: Search results show a "no matches" state with contextual guidance

### Interactive State Consistency

- [x] **INTER-01**: All custom interactive elements (buttons, cards, list items, tabs) have consistent hover states using design tokens
- [x] **INTER-02**: All focusable elements have visible, consistent focus rings that match the design system
- [x] **INTER-03**: All interactive elements have appropriate disabled states (reduced opacity, no hover, cursor change)
- [x] **INTER-04**: All context menus, tooltips, and popovers have consistent enter/exit transitions

### Spring Physics

- [x] **SPRING-01**: Modal open/close uses spring easing (settings modal, delete confirmations, alert dialogs)
- [x] **SPRING-02**: Sidebar expand/collapse uses spring easing
- [x] **SPRING-03**: Tool card expand/collapse and tool group accordion use spring easing
- [x] **SPRING-04**: Command palette open/close uses spring easing
- [x] **SPRING-05**: Scroll-to-bottom pill entrance/exit uses spring easing

### Glass Surfaces

- [ ] **GLASS-01**: Settings modal overlay uses frosted glass effect (`backdrop-filter: blur(16px) saturate(1.4)`)
- [ ] **GLASS-02**: Command palette overlay uses upgraded frosted glass effect
- [ ] **GLASS-03**: Delete/alert confirmation dialogs use frosted glass effect
- [ ] **GLASS-04**: Glass effects respect `prefers-reduced-motion` (disabled when reduced motion is active)

### Visual Personality

- [ ] **VIS-01**: Session titles in sidebar use DecryptedText reveal animation on first render
- [ ] **VIS-02**: Model name in status line uses DecryptedText reveal animation
- [ ] **VIS-03**: ElectricBorder/StarBorder applied to active session item in sidebar
- [ ] **VIS-04**: ElectricBorder/StarBorder applied to focused composer input

### Spacing & Typography Polish

- [ ] **POLISH-01**: All border-radius values use design tokens (no hardcoded `rounded-*` that bypass the scale)
- [ ] **POLISH-02**: Spacing between sections, cards, and list items is consistent and uses token scale
- [ ] **POLISH-03**: Font sizes across all surfaces use the defined type scale (no ad-hoc `text-[10px]` or similar)

## v2.0 Requirements

Deferred to "The Power" milestone.

### Sidebar Slim Mode (deferred from v1.5)

- **SLIM-01**: Sidebar collapses to icon-only rail showing tab icons and session count
- **SLIM-02**: Hover or click on slim rail expands sidebar temporarily
- **SLIM-03**: Keyboard shortcut toggles between expanded and slim modes

### Multi-Provider

- **MULTI-01**: Multi-provider tabbed workspaces (Claude, Gemini, Codex)
- **MULTI-02**: Background task execution with tab notifications
- **MULTI-03**: MCP server management UI (enable, disable, configure)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Aurora/WebGL ambient overlay | GPU feasibility risk on 780M iGPU; deferred to v2.1 "The Polish" |
| Tier 2/3 effects (Iridescence, LiquidChrome, Border Beam, etc.) | Deferred to v2.1 when UI surface is final |
| "Spring physics on ALL interactions" | Diminishing returns; v1.5 targets key surfaces only |
| framer-motion / Motion library | CSS `linear()` handles all v1.5 use cases; zero runtime cost |
| AnimatePresence exit animations | Incompatible with mount-once CSS show/hide tab system |
| Sidebar slim mode | Store migration + layout complexity; deferred to v2.0 |
| Light mode | Dark-only through v2.0 |
| Mobile-responsive layout | Desktop-first; web handles mobile access |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 44 | Complete |
| FOUND-02 | Phase 44 | Complete |
| FOUND-03 | Phase 44 | Complete |
| LOAD-01 | Phase 45 | Complete |
| LOAD-02 | Phase 45 | Complete |
| LOAD-03 | Phase 45 | Complete |
| EMPTY-01 | Phase 45 | Complete |
| EMPTY-02 | Phase 45 | Complete |
| EMPTY-03 | Phase 45 | Complete |
| EMPTY-04 | Phase 45 | Complete |
| INTER-01 | Phase 46 | Complete |
| INTER-02 | Phase 46 | Complete |
| INTER-03 | Phase 46 | Complete |
| INTER-04 | Phase 46 | Complete |
| SPRING-01 | Phase 47 | Complete |
| SPRING-02 | Phase 47 | Complete |
| SPRING-03 | Phase 47 | Complete |
| SPRING-04 | Phase 47 | Complete |
| SPRING-05 | Phase 47 | Complete |
| GLASS-01 | Phase 47 | Pending |
| GLASS-02 | Phase 47 | Pending |
| GLASS-03 | Phase 47 | Pending |
| GLASS-04 | Phase 47 | Pending |
| VIS-01 | Phase 48 | Pending |
| VIS-02 | Phase 48 | Pending |
| VIS-03 | Phase 48 | Pending |
| VIS-04 | Phase 48 | Pending |
| POLISH-01 | Phase 49 | Pending |
| POLISH-02 | Phase 49 | Pending |
| POLISH-03 | Phase 49 | Pending |

**Coverage:**
- v1.5 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
