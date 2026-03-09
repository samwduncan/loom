# Technology Stack: M3 "The Workspace"

**Project:** Loom V2 -- Workspace Panels
**Researched:** 2026-03-09

## Recommended Stack

### Core (Already Installed -- No Changes)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React 19 | ^19.2.0 | UI framework | Already installed, no migration needed |
| TypeScript | ~5.9.3 | Type safety | Already installed |
| Vite 7 | ^7.3.1 | Build tool | Already installed |
| Tailwind v4 | ^4.2.1 | Styling | Already installed, @theme inline pattern |
| Zustand 5 | ^5.0.11 | State management | Already installed, add 5th store |
| React Router 7 | ^7.13.1 | Routing | Already installed |
| lucide-react | ^0.577.0 | Icons | Already installed |

### New Dependencies for M3

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @xterm/xterm | ^5.5 | Terminal emulator | Only option for browser terminals. V1 used it. Proven. |
| @xterm/addon-fit | ^0.10 | Terminal auto-resize | Required for responsive terminal sizing |
| @xterm/addon-web-links | ^0.11 | Clickable URLs in terminal | UX standard for web terminals |
| @uiw/react-codemirror | ^4.23 | Code editor | Best React wrapper for CodeMirror 6. V1 used it. |
| @codemirror/lang-javascript | latest | JS/TS syntax | Required language grammar |
| @codemirror/lang-python | latest | Python syntax | Required language grammar |
| @codemirror/lang-css | latest | CSS syntax | Required language grammar |
| @codemirror/lang-json | latest | JSON syntax | Required language grammar |
| @codemirror/lang-markdown | latest | Markdown syntax | Required language grammar |
| @codemirror/lang-html | latest | HTML syntax | Required language grammar |
| cmdk | ^1.0 | Command palette core | Powers shadcn Command component. Fuzzy search, keyboard nav. |

### shadcn/ui Primitives to Install

| Primitive | Purpose | Used By |
|-----------|---------|---------|
| tabs | Settings tab navigation, editor tabs | Settings, Code Editor |
| form | Settings forms | Settings |
| input | Settings text fields | Settings, Git Panel |
| label | Form labels | Settings |
| switch | Toggle switches | Settings |
| select | Dropdowns (branch, permission mode) | Settings, Git Panel |
| accordion | MCP server configs | Settings |
| slider | Font size, etc. | Settings |
| checkbox | Git staging, settings toggles | Settings, Git Panel |
| card | Structured info display | Settings |
| command | Command palette (Cmd+K) | Command Palette |
| textarea | Commit message | Git Panel |
| alert-dialog | Destructive action confirmations | Git Panel |
| context-menu | Right-click file/session actions | File Tree |
| table | Commit history display | Git Panel |
| skeleton | Loading states for all panels | All panels |

### Supporting Libraries (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | Error/success feedback for all panels |
| radix-ui | ^1.4.3 | Primitive components | Foundation for shadcn primitives |
| diff | ^8.0.3 | Text diffing | Git panel diff display |
| immer | ^11.1.4 | Immutable updates | Complex store updates |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Terminal | xterm.js | terminal.js | xterm.js is the industry standard, V1 proven |
| Code Editor | CodeMirror 6 | Monaco Editor | Monaco is ~2MB, CodeMirror is ~300KB. V1 used CodeMirror. |
| Command Palette | cmdk (via shadcn) | kbar | cmdk has better React 18/19 support, shadcn wraps it |
| File Tree | Custom recursive | react-arborist | We need minimal deps. Tree is simple enough to build. |
| Resizable panels | Custom pointer events | react-resizable-panels | Custom is <50 LOC, no dependency needed |

## Installation

```bash
# Terminal dependencies
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links

# Code editor dependencies
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-css @codemirror/lang-json @codemirror/lang-markdown @codemirror/lang-html

# Command palette core
npm install cmdk

# shadcn primitives (via npx shadcn)
npx shadcn@latest add tabs form input label switch select accordion slider checkbox card command textarea alert-dialog context-menu table skeleton
```

**Estimated bundle impact:**
- xterm.js: ~200KB (lazy-loaded, only when terminal tab opened)
- CodeMirror 6 + languages: ~300KB (lazy-loaded, only when editor tab opened)
- cmdk: ~8KB (loaded with app, lightweight)
- shadcn primitives: ~0KB incremental (CSS + Radix already installed)

## Sources

- V1 dependency manifest from `V1_FEATURE_INVENTORY.md`
- V2 `package.json` for current dependency versions
- Component adoption map for shadcn primitive selection
