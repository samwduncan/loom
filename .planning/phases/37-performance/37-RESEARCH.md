# Phase 37: Performance - Research

**Researched:** 2026-03-17
**Domain:** Frontend performance profiling, optimization, and auditing (React 19 + Vite 7)
**Confidence:** HIGH

## Summary

Phase 37 is a measurement-and-fix phase, not a greenfield build. The codebase already has several performance-conscious patterns in place: rAF+useRef streaming bypass (zero React re-renders during streaming), content-visibility: auto on MessageContainer, lazy loading for heavy panels (Terminal, Git, Settings, Command Palette, CodeEditor), and CollapsibleMessage unmounting off-screen DOM trees. The work is to verify these patterns hold under stress, fix what doesn't, and produce documented evidence.

The main risk areas based on codebase analysis are: (1) the 1.1MB main chunk that includes shiki core + react-markdown + radix + all eager imports, (2) an unbounded shiki highlight cache (`Map<string, string>`) that never evicts, (3) per-message IntersectionObserver instances in useAutoCollapse that accumulate proportionally to message count, and (4) CodeMirror language grammars being individually chunk-split by Vite (100+ tiny chunks that could hurt initial load via waterfall requests).

**Primary recommendation:** Use `rollup-plugin-visualizer` for bundle analysis, Chrome DevTools Performance tab for FPS profiling, and Chrome DevTools Memory tab (heap snapshots) for leak detection. No new runtime dependencies needed -- this is a tooling + CSS + manual-chunks phase.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | Streaming maintains 55+ FPS with 200+ messages | rAF buffer already bypasses React; verify with Chrome Performance tab. Key risk: IntersectionObserver callbacks during scroll, entrance animations on new messages |
| PERF-02 | content-visibility: auto applied and stress-tested | Already applied in MessageContainer.tsx (line 34-37). Needs stress-test verification and possible `contain-intrinsic-size` tuning |
| PERF-03 | Memory profiling shows no leaks across 10+ session switches | Key suspects: shiki cache (unbounded Map), useAutoCollapse observer/timeout maps, refCallbacks cache, wsClient subscriptions |
| PERF-04 | Initial page load under 2s on dev server | Current main chunk is 1.1MB (350KB gzip). Needs manual chunk splitting and possibly deferred shiki preload |
| PERF-05 | Bundle size audit with recommendations for >50KB chunks | 12 chunks exceed 50KB currently. rollup-plugin-visualizer will produce interactive treemap |
</phase_requirements>

## Standard Stack

### Core (Dev Dependencies Only)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| rollup-plugin-visualizer | ^5.12 | Bundle treemap visualization | Standard Vite/Rollup ecosystem tool, produces interactive HTML report |
| (Chrome DevTools) | built-in | FPS profiling + heap snapshots | The authoritative tool for runtime perf; no library needed |

### No New Runtime Dependencies
This phase adds zero runtime dependencies. All improvements are: CSS changes, Vite config changes, and targeted code fixes (cache eviction, cleanup).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rollup-plugin-visualizer | source-map-explorer | visualizer integrates directly with Vite build, richer treemap |
| Chrome DevTools heap | @anthropic/memlab | Overkill for 10-switch manual test; heap snapshots are sufficient |
| Lighthouse CI | Manual DevTools | Lighthouse is for production HTTP; dev server timing is the requirement |

**Installation:**
```bash
cd src && npm install -D rollup-plugin-visualizer
```

## Architecture Patterns

### Current Performance Architecture (Already In Place)
```
Streaming path (PERF-01):
  wsClient.subscribeContent -> useStreamBuffer.onToken -> bufferRef (no re-render)
  rAF loop -> convertStreamingMarkdown -> node.innerHTML (direct DOM)

Off-screen optimization (PERF-02):
  MessageContainer: content-visibility: auto + containIntrinsicHeight: auto 200px
  CollapsibleMessage: unmounts children when collapsed (full DOM removal)
  useAutoCollapse: IntersectionObserver per message, 300ms debounce collapse

Code splitting (PERF-04/05):
  React.lazy: TerminalPanel, GitPanel, SettingsModal, CommandPalette, CodeEditor, DiffEditorWrapper
  Shiki langs: dynamic import per grammar (shiki/langs/*.mjs)
```

### Pattern 1: Manual Chunks for Vite Build
**What:** Configure `build.rollupOptions.output.manualChunks` to split the 1.1MB main chunk
**When to use:** When a single chunk contains multiple large libraries that don't all load on first paint

```typescript
// vite.config.ts build section
build: {
  outDir: 'dist',
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-markdown': ['react-markdown', 'remark-gfm', 'rehype-raw'],
        'vendor-shiki': ['shiki'],
        'vendor-radix': ['radix-ui'],
        'vendor-zustand': ['zustand', 'immer'],
      },
    },
  },
},
```

### Pattern 2: Bounded LRU Cache for Shiki
**What:** Replace unbounded `Map<string, string>` with a size-limited cache
**When to use:** Any cache that grows proportionally to user activity without eviction

```typescript
// Simple LRU pattern (no external dependency needed)
const MAX_CACHE_SIZE = 500;
const cache = new Map<string, string>();

function cacheSet(key: string, value: string): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Map iteration order is insertion order -- delete oldest
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, value);
}
```

### Pattern 3: content-visibility with contain-intrinsic-size
**What:** CSS containment that skips rendering of off-screen elements
**When to use:** Long scrollable lists with variable-height items

```css
/* Already in MessageContainer via inline style */
content-visibility: auto;
contain-intrinsic-height: auto 200px;
/* The 'auto' keyword in contain-intrinsic-height lets the browser remember
   the last-rendered height, preventing layout shift on scroll-back */
```

### Anti-Patterns to Avoid
- **Adding React.memo everywhere:** Profile first, memo only components that actually re-render unnecessarily. The rAF buffer already prevents re-renders during streaming.
- **Virtualizing the message list:** Messages have highly variable heights (code blocks, tool cards, images). Virtual scrolling with variable heights is fragile and conflicts with content-visibility: auto which already handles off-screen cost. The CollapsibleMessage pattern (unmount collapsed DOM) is a better fit.
- **Adding performance testing to CI:** FPS and heap measurements are inherently non-deterministic and environment-dependent. Chrome DevTools manual verification is the right level for these requirements.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle visualization | Custom size scripts | rollup-plugin-visualizer | Interactive treemap with gzip sizes, module grouping |
| LRU cache | npm package (lru-cache) | Simple Map eviction (see pattern above) | 10 lines of code, no dep for a 500-entry cache |
| FPS measurement | Custom performance.now loops | Chrome DevTools Performance tab | Authoritative, flame charts, compositor thread visibility |
| Memory leak detection | Custom WeakRef tracking | Chrome DevTools heap snapshots + comparison | Shows retained objects, allocation timeline, detached DOM nodes |

**Key insight:** This phase is primarily a measurement phase using browser DevTools, not a library-integration phase. The tools are already built into Chrome.

## Common Pitfalls

### Pitfall 1: content-visibility Breaks Scroll Position
**What goes wrong:** Adding content-visibility: auto to message list items can cause scroll position jumps when scrolling back up, because the browser recalculates element heights.
**Why it happens:** If contain-intrinsic-height doesn't match the actual rendered height, the scrollbar "teleports" when elements enter/leave the viewport.
**How to avoid:** Use `contain-intrinsic-height: auto 200px` (the `auto` keyword tells the browser to use the last-known rendered height). Already implemented correctly in MessageContainer.
**Warning signs:** Scroll position jumping during fast scroll-up in long conversations.

### Pitfall 2: IntersectionObserver Accumulation
**What goes wrong:** useAutoCollapse creates one IntersectionObserver per observable message. With 200+ messages (minus the 10 protected), that's 190+ observers.
**Why it happens:** Each observer has its own callback and root element reference.
**How to avoid:** Consider switching to a single IntersectionObserver with multiple entries (one observer can observe many elements). The callback receives all entries in a batch.
**Warning signs:** Jank during fast scrolling in 200+ message conversations.

### Pitfall 3: Shiki Preload Blocking Initial Paint
**What goes wrong:** `preloadLanguages()` loads 7 grammar bundles eagerly, which can delay first meaningful paint if called synchronously during app init.
**Why it happens:** Grammar loading involves async module resolution + RegExp compilation.
**How to avoid:** Verify preloadLanguages is called lazily (after first paint), not in the critical path. If it's called from CodeBlock's first render, it's fine (lazy by nature).
**Warning signs:** Network waterfall showing shiki grammar chunks before first paint completes.

### Pitfall 4: manualChunks Causing Import Order Issues
**What goes wrong:** Aggressive manual chunk splitting can create circular chunk dependencies or load-order issues where a chunk tries to reference another chunk that hasn't loaded yet.
**Why it happens:** Rollup's chunk splitting has complex dependency resolution. Overly granular splitting can confuse it.
**How to avoid:** Keep manualChunks to 4-6 broad groups (react, markdown, shiki, radix, zustand). Don't try to split individual components.
**Warning signs:** Runtime errors like "X is not defined" or blank screens on cold load.

### Pitfall 5: Memory Leak False Positives in Heap Snapshots
**What goes wrong:** Heap snapshots show "retained size growth" that's actually expected (session data, message cache).
**Why it happens:** Zustand stores legitimately hold session metadata in memory. The timeline store's `partialize` function intentionally keeps session metadata.
**How to avoid:** Compare heap snapshots after garbage collection (force GC button in DevTools). Look for detached DOM nodes and growing Map/Set sizes, not raw heap size. The requirement is "no memory growth TREND" -- expect some baseline.
**Warning signs:** Mistakenly "fixing" working session caching by adding aggressive cleanup.

## Code Examples

### Bundle Analysis Script (add to package.json)
```json
{
  "scripts": {
    "build:analyze": "ANALYZE=true vite build"
  }
}
```

```typescript
// vite.config.ts addition
import { visualizer } from 'rollup-plugin-visualizer';

// Inside plugins array (conditional):
...(process.env.ANALYZE ? [visualizer({
  open: true,
  filename: 'dist/bundle-report.html',
  gzipSize: true,
  template: 'treemap',
})] : []),
```

### Chrome DevTools Performance Profile Script
```javascript
// Run in Chrome DevTools console to generate 200+ messages for stress testing
// (Use with the ProofOfLife component or mock data injection)
async function stress200Messages() {
  // Navigate to a session, then inject via store
  const { useTimelineStore } = await import('/src/stores/timeline.ts');
  const store = useTimelineStore.getState();
  const sessionId = store.activeSessionId;
  if (!sessionId) { console.error('No active session'); return; }

  for (let i = 0; i < 200; i++) {
    store.addMessage(sessionId, {
      id: `stress-${i}`,
      role: i % 3 === 0 ? 'user' : 'assistant',
      content: `Message ${i}: ${'Lorem ipsum dolor sit amet. '.repeat(5)}`,
      metadata: { timestamp: new Date().toISOString(), provider: 'claude' },
      toolCalls: [],
    });
  }
}
```

### Heap Snapshot Comparison Protocol
```
1. Open Chrome DevTools > Memory tab
2. Navigate to session A, wait for load
3. Take Heap Snapshot #1
4. Switch to session B, wait for load
5. Repeat switch A->B->A->B 10 times
6. Force garbage collection (trash can icon)
7. Take Heap Snapshot #2
8. Select Snapshot #2, change view to "Comparison" against Snapshot #1
9. Sort by "Alloc. Size" descending
10. Look for: Detached HTMLElement, growing Map entries, EventListener accumulation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-window/react-virtuoso for long lists | content-visibility: auto + CSS containment | 2023-2024 | Native browser optimization, no JS overhead, works with variable heights |
| Bundle analysis via webpack-bundle-analyzer | rollup-plugin-visualizer for Vite | Vite 3+ | Same treemap UX, Rollup-native |
| React.memo + useMemo for perf | React Compiler (experimental) | React 19 | Not adopted here; manual optimization is clearer and the rAF pattern already avoids the problem |

**Deprecated/outdated:**
- `react-window` for chat UIs: Variable height items with markdown content make virtual scrolling impractical. content-visibility is the modern solution.
- `why-did-you-render`: Largely superseded by React DevTools Profiler + highlight re-renders option.

## Current Bundle Analysis (Build Output 2026-03-17)

### Chunks Exceeding 50KB (PERF-05 Targets)

| Chunk | Size (raw) | Size (gzip) | Contents (inferred) | Recommendation |
|-------|-----------|-------------|---------------------|----------------|
| index-AWDDzkXD.js | 1,119 KB | 350 KB | Main bundle: react, react-dom, shiki core, react-markdown, radix, zustand, all eager components | **Split into vendor chunks** |
| editor-BjROm9mk.js | 435 KB | 140 KB | CodeMirror 6 core + extensions | Already lazy-loaded; acceptable |
| TerminalPanel-QkkeQiFH.js | 342 KB | 88 KB | xterm.js + addons | Already lazy-loaded; acceptable |
| typescript-BPQ3VLAy.js | 181 KB | 16 KB | Shiki TypeScript grammar | Lazy grammar; acceptable gzip |
| javascript-wDzz0qaB.js | 175 KB | 17 KB | Shiki JavaScript grammar | Lazy grammar; acceptable gzip |
| index-tK8Su4yQ.js | 101 KB | 34 KB | Likely shiki core engine | Could merge with vendor-shiki chunk |
| index-DBRe8a8S.js | 98 KB | 28 KB | Unknown (need visualizer) | Investigate |
| index-BtWNZVql.js | 87 KB | 35 KB | Unknown | Investigate |
| index-BKgnic65.js | 71 KB | 26 KB | Unknown | Investigate |
| python-B6aJPvgy.js | 70 KB | 9 KB | Shiki Python grammar | Lazy grammar; acceptable |
| SettingsModal-DHx53sgG.js | 60 KB | 17 KB | Settings modal + tabs | Already lazy-loaded; acceptable |
| html-GMplVEZG.js | 57 KB | 12 KB | Shiki HTML grammar | Lazy grammar; acceptable |

**Key finding:** The main chunk (1.1MB / 350KB gzip) is the only critical problem. Everything else is either already lazy-loaded or is a language grammar loaded on demand. The fix is `manualChunks` in Vite config to split vendor libraries out of the main bundle.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0 + jsdom |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | 55+ FPS with 200+ messages during streaming | manual-only | Chrome DevTools Performance tab recording | N/A -- manual verification |
| PERF-02 | content-visibility: auto applied to message list items | unit | `cd src && npx vitest run src/src/components/chat/view/MessageContainer.test.tsx -x` | Exists (verify style) |
| PERF-03 | No memory leaks across 10+ session switches | manual-only | Chrome DevTools Memory heap snapshot comparison | N/A -- manual verification |
| PERF-04 | Initial page load under 2s | manual-only | Chrome DevTools Network tab (disable cache, measure DOMContentLoaded) | N/A -- manual verification |
| PERF-05 | Bundle analysis report with recommendations | unit | `cd src && ANALYZE=true npx vite build` | Wave 0 -- report generation script |

**Manual-only justification:** FPS, memory, and load time measurements are environment-dependent (hardware, OS scheduler, browser version). Automated assertions would be flaky. The requirement is to produce evidence via DevTools screenshots/recordings, not automated regression tests.

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green + DevTools evidence screenshots

### Wave 0 Gaps
- [ ] `rollup-plugin-visualizer` dev dependency installation
- [ ] `build:analyze` script in package.json
- [ ] Vite config: visualizer plugin + manualChunks configuration

## Open Questions

1. **What exactly is in the 87-101KB unnamed chunks?**
   - What we know: Build output shows generic `index-*.js` names
   - What's unclear: Whether these are shiki internals, radix components, or react-markdown dependencies
   - Recommendation: Run visualizer treemap first (PERF-05), then decide if further splitting is needed

2. **Is preloadLanguages() called in the critical path?**
   - What we know: It's exported from shiki-highlighter.ts but not called from main.tsx
   - What's unclear: Whether any eager component triggers it before first paint
   - Recommendation: Check CodeBlock render path; if it's only triggered when a code block appears in a message, it's already deferred. Grep for `preloadLanguages` callsites.

3. **Should the useAutoCollapse observers be consolidated?**
   - What we know: Currently 1 observer per message (up to 190 for 200 messages)
   - What's unclear: Whether this actually impacts FPS or whether Chrome handles 190 observers efficiently
   - Recommendation: Profile first (PERF-01), only consolidate if FPS drops during scroll. Don't premature-optimize.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: MessageList.tsx, MessageContainer.tsx, useAutoCollapse.ts, useStreamBuffer.ts, shiki-highlighter.ts, vite.config.ts, package.json
- Build output: `npx vite build --mode production` (2026-03-17) -- full chunk sizes documented above
- Chrome DevTools documentation (well-established tooling, no version concerns)

### Secondary (MEDIUM confidence)
- content-visibility CSS property: Widely supported (Chrome 85+, Firefox 124+, Safari 18+), well-documented on MDN
- rollup-plugin-visualizer: Standard Vite ecosystem tool, 3M+ weekly npm downloads

### Tertiary (LOW confidence)
- None -- this phase relies on browser built-in tooling and well-established patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new runtime deps, only devDep visualizer
- Architecture: HIGH - Existing patterns are sound; improvements are incremental (cache bounds, chunk splitting)
- Pitfalls: HIGH - Based on direct codebase analysis, not hypothetical
- Bundle analysis: HIGH - Based on actual build output from today

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, no fast-moving dependencies)
