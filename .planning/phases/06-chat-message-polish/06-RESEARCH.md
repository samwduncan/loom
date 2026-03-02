# Phase 6: Chat Message Polish - Research

**Researched:** 2026-03-02
**Domain:** React chat message rendering, diff presentation, token usage display, system status UX
**Confidence:** HIGH

## Summary

Phase 6 transforms the chat experience from functional scaffolding into a polished, designed interface. The work spans eight requirements (CHAT-09 through CHAT-16) covering diff rendering, user message styling, permission banners, usage display, system status messages, and unified AI turn layout.

The codebase is well-structured for this phase. Phase 5 established TurnBlock, ToolActionCard, ThinkingDisclosure, and ToolCallGroup with CSS grid 0fr/1fr animation patterns. The architecture supports adding new message sub-components (diff viewer, usage footer, permission banners, system status) without fundamental restructuring. The primary new dependency is `react-diff-viewer-continued` for unified diff display; all other requirements use existing libraries (Shiki, lucide-react, Tailwind CSS).

The key technical decision is whether to use `react-diff-viewer-continued` with Shiki-powered `renderContent` for syntax-highlighted diffs, or build a custom diff component using Shiki's `transformerNotationDiff`. The user locked on `react-diff-viewer-continued` with Shiki integration -- this is the correct approach as it provides unified/split view, word-level diff highlighting, custom theming, and code folding out of the box.

**Primary recommendation:** Install `react-diff-viewer-continued@4.1.2`, create a warm dark theme config, integrate the existing Shiki highlighter singleton via `renderContent` prop, and incrementally build each sub-feature (diff, user restyle, permissions, usage, system status, layout) as separate plans.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- User messages stay right-aligned but restyle: swap blue bubble for warm amber tint background, rounded-lg (not rounded-2xl with clipped corner)
- No avatar or role label on user messages -- the amber tint and right-alignment are sufficient visual distinction
- Both user and AI messages share ~720px max-width centered column
- Turn structure: keep current collapsible header (provider logo, first prose line, tool count badge, duration)
- **No auto-collapse**: Remove the behavior that collapses previous turns when a new streaming turn starts
- All turns default to expanded; collapse on scroll-away, re-expand when revisited (IntersectionObserver-based)
- AI turn content flows as one continuous block -- thin subtle 1px divider lines (warm muted tone) separate tool calls, thinking, code, and prose sections
- Copy button on user messages: hover-reveal outside the message block (right side), not always visible inside
- Timestamps remain on every individual message
- Image lightbox: clicking user-attached images opens a dark overlay with full image instead of new browser tab
- Unified diff view (single column) using `react-diff-viewer-continued`
- Syntax highlighting within diff lines using Shiki (already used for code blocks)
- 3 lines of context above and below each changed hunk
- File path header is clickable -- opens the file in the code editor panel (uses existing `onFileOpen` callback)
- Warm color theme: green additions, red removals, gray context lines, hunk markers, all tinted to match earthy palette
- Per-turn usage footer at the bottom of each AI turn: Line 1: Token breakdown (input/output/cache read/cache creation), Line 2: Cost + model name/ID, Always visible, never collapsed
- Session cumulative total displayed as a status line under the chat composer (enhancing existing TokenUsagePie area)
- Data source: extract from streaming API response metadata per-turn (`usage.input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`)
- Cost: hardcoded client-side pricing table by model ID (Claude Sonnet, Opus, Haiku, Codex, Gemini)
- Three system status tiers: gray info, amber warning, terracotta error
- Small icon + text for each (info circle, warning triangle, error X)
- Event mapping: Gray info (session started, model switched, context loaded), Amber warning (rate limit approaching, long response time), Terracotta error (API error, connection lost, tool failure)
- Always persist in chat history -- not dismissible
- Permission banners: highlighted inline banner within message flow -- warm amber background with distinct border
- Shows: tool name (bold) + action description + status (Waiting/Approved/Denied)
- Interactive approve/deny buttons in the web UI
- Both CLI and web UI can respond to permission prompts -- first response wins, other side updates to show result
- Interactive prompts restyle to warm card with copper accent border, warm brown surface background
- Options as smaller, clean buttons matching warm palette
- Interactive in web UI -- users can click option buttons to respond via websocket instead of switching to CLI
- "Waiting for response" indicator has a gentle pulse animation
- Thinking disclosure: muted collapsible section, dimmed text, slightly indented, warm gray tones, collapsed summary with character count
- Error messages: inline terracotta banner, terracotta left border, error icon, muted background, first 3 lines visible with "Show full error" toggle

### Claude's Discretion
- Task notification restyling (current dot + text may stay or align with system status tier)
- Exact divider line colors and spacing within AI turns
- Lightbox overlay implementation details
- Exact warm tint hex values for user messages
- Pulse animation timing and style for interactive prompt waiting indicator

### Deferred Ideas (OUT OF SCOPE)
- GSD CLI native integration (similar to TaskMaster CLI integration) -- separate phase
- CodeRabbit CLI integration -- separate phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-09 | Diff events render as colored unified diffs -- green additions, red removals, gray context lines, file path header, hunk headers | `react-diff-viewer-continued` with warm theme + Shiki `renderContent` integration, replacing basic DiffViewer.jsx |
| CHAT-10 | User messages have subtle warm background tint to visually differentiate from AI messages | Tailwind warm amber classes, remove blue-600 bubble, add amber tint bg with rounded-lg |
| CHAT-11 | User messages have a small copy button to grab previous prompts | Existing `copyTextToClipboard` utility; move button to hover-reveal outside message block |
| CHAT-12 | Permission prompts render as highlighted inline banners within message flow showing tool name and action | Extend existing PermissionRequestsBanner pattern; render inline per-message instead of banner above composer |
| CHAT-13 | Usage summaries (token counts, cost) always visible at the end of each AI response, not collapsed | Extract per-turn usage from streaming metadata; add TurnUsageFooter component inside TurnBlock; hardcoded pricing table |
| CHAT-14 | System status messages render muted and inline -- gray for info, amber for warnings, red for errors | New SystemStatusMessage component with 3-tier styling; new message type in ChatMessage; extend realtime handlers |
| CHAT-15 | Messages use full-width blocks (not left/right bubbles), role label only ("You" / "Claude" / "Gemini"), max-width ~720px centered | Rework MessageComponent layout; remove bubble alignment; centered column layout; user messages keep right-alignment per CONTEXT.md decision |
| CHAT-16 | AI turns flow as continuous blocks -- tool calls, thinking, code, prose within one visual unit with subtle dividers, no gaps | Modify TurnBlock collapsible content to remove space-y gaps; add thin 1px divider lines between sub-elements |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-diff-viewer-continued | 4.1.2 | Unified diff view with syntax highlighting | Only actively maintained React diff viewer; supports custom themes, `renderContent` for Shiki integration, word-level diff, code folding |
| shiki | ^4.0.1 (already installed) | Syntax highlighting inside diff lines | Already integrated via singleton highlighter; warm Dark+ color replacements in place |
| lucide-react | ^0.515.0 (already installed) | Icons for system status, errors, copy buttons | Already used project-wide for ToolActionCard icons |
| react | ^18.2.0 (already installed) | Component framework | Project foundation |
| tailwindcss | (already installed) | Styling | Project design system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shikijs/transformers | N/A | NOT needed -- use `renderContent` prop instead | Do not install; `react-diff-viewer-continued` handles line-by-line rendering, Shiki highlights via `renderContent` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-diff-viewer-continued | Custom Shiki transformerNotationDiff | Loses word-level diff, code folding, line numbers, gutter; much more code to maintain |
| react-diff-viewer-continued | @mrwangjusttodo/git-diff-view | Higher benchmark score (87.4) but multi-framework (React/Vue/Solid/Svelte); heavier bundle, more complex API |
| react-diff-viewer-continued | @otakustay/react-diff-view | Requires parsing raw unified diff strings; more complex setup for our use case (we have old/new strings) |
| Hardcoded pricing table | API-fetched pricing | Unnecessary complexity; models change rarely; client-side table is simpler and offline-capable |

**Installation:**
```bash
npm install react-diff-viewer-continued@4.1.2
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/chat/
├── view/subcomponents/
│   ├── TurnBlock.tsx           # MODIFY: add TurnUsageFooter, remove space-y gaps, add dividers
│   ├── TurnUsageFooter.tsx     # NEW: per-turn token + cost display
│   ├── MessageComponent.tsx    # MODIFY: user message restyle, system status routing
│   ├── ChatMessagesPane.tsx    # MODIFY: remove auto-collapse, add IntersectionObserver
│   ├── ChatInputControls.tsx   # MODIFY: enhance session cumulative display
│   ├── DiffViewerEnhanced.tsx  # NEW: react-diff-viewer-continued wrapper with Shiki + warm theme
│   ├── SystemStatusMessage.tsx # NEW: 3-tier system status inline renderer
│   ├── PermissionInlineBanner.tsx # NEW: inline permission banner within message flow
│   ├── ImageLightbox.tsx       # NEW: dark overlay for user-attached images
│   └── InteractivePromptCard.tsx # NEW: restyled interactive prompt with websocket response
├── hooks/
│   ├── useChatRealtimeHandlers.ts # MODIFY: extract per-turn usage metadata, system status events
│   └── useTurnGrouping.ts      # MODIFY: carry per-turn usage data in Turn type
├── types/
│   └── types.ts                # MODIFY: add usage fields to Turn, new message types
├── tools/components/
│   └── DiffViewer.tsx          # REPLACE: swap basic DiffViewer with DiffViewerEnhanced
└── utils/
    └── pricing.ts              # NEW: model pricing table + cost calculator
```

### Pattern 1: Shiki Integration via renderContent
**What:** Use `react-diff-viewer-continued`'s `renderContent` prop to pipe each diff line through the existing Shiki singleton highlighter.
**When to use:** For all diff rendering in CHAT-09.
**Example:**
```typescript
// Source: Context7 react-diff-viewer-continued docs + existing useShikiHighlighter.ts
import { highlightCode } from '../../hooks/useShikiHighlighter';

// Async rendering -- highlight each line individually
const renderContent = (str: string) => {
  // Synchronous fallback: return raw text initially
  // Use a small component that highlights async and swaps in
  return <ShikiDiffLine code={str} language={detectedLanguage} />;
};

<ReactDiffViewer
  oldValue={oldContent}
  newValue={newContent}
  splitView={false}         // unified view per user decision
  useDarkTheme={true}
  renderContent={renderContent}
  showDiffOnly={true}
  extraLinesSurroundingDiff={3}  // 3 context lines per user decision
  styles={warmDiffTheme}
/>
```

### Pattern 2: Warm Theme Config for react-diff-viewer-continued
**What:** Override the dark theme variables to match Loom's earthy palette.
**When to use:** All diff instances.
**Example:**
```typescript
// Source: Context7 react-diff-viewer-continued default styles API
const warmDiffTheme = {
  variables: {
    dark: {
      diffViewerBackground: '#1c1210',
      diffViewerColor: '#f5e6d3',
      addedBackground: '#1a2e1a',       // warm dark green
      addedColor: '#b8dab8',            // warm light green
      removedBackground: '#2e1a1a',     // warm dark red
      removedColor: '#dab8b8',          // warm light red
      wordAddedBackground: '#2a4a2a',   // word-level green
      wordRemovedBackground: '#4a2a2a', // word-level red
      addedGutterBackground: '#152815',
      removedGutterBackground: '#281515',
      gutterBackground: '#241a14',
      gutterBackgroundDark: '#1c1210',
      gutterColor: '#c4a882',
      emptyLineBackground: '#1c1210',
      codeFoldBackground: '#241a14',
      codeFoldGutterBackground: '#1c1210',
      codeFoldContentColor: '#c4a882',
      diffViewerTitleBackground: '#241a14',
      diffViewerTitleColor: '#c4a882',
      diffViewerTitleBorderColor: '#3d2e25',
    },
  },
  line: {
    padding: '0 8px',
    fontSize: '12px',
  },
  contentText: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: '12px',
  },
};
```

### Pattern 3: Per-Turn Usage Data Extraction
**What:** Capture token usage from streaming API responses and attach to Turn objects for display in TurnUsageFooter.
**When to use:** CHAT-13 implementation.
**Example:**
```typescript
// Extend Turn type
interface Turn {
  // ...existing fields
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
  model?: string;
}

// In useChatRealtimeHandlers.ts, capture usage from message_stop events
// The server already emits usage data in claude-response messages with message.usage
// Extract at content_block_stop or message_stop to attach to turn
```

### Pattern 4: 3-Tier System Status Messages
**What:** New ChatMessage subtype rendered as muted inline banners with tier-specific styling.
**When to use:** CHAT-14 implementation.
**Example:**
```typescript
// New message shape
interface ChatMessage {
  // ...existing
  isSystemStatus?: boolean;
  statusTier?: 'info' | 'warning' | 'error';
}

// Tier styling map
const statusTierStyles = {
  info: {
    bg: 'bg-gray-800/30',
    border: 'border-gray-700/50',
    text: 'text-gray-400',
    icon: Info,  // lucide-react
  },
  warning: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-800/50',
    text: 'text-amber-300',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-800/50',
    text: 'text-red-300',
    icon: XCircle,
  },
};
```

### Pattern 5: IntersectionObserver-Based Turn Collapse
**What:** Replace the auto-collapse-on-new-stream behavior with IntersectionObserver-based visibility tracking.
**When to use:** CONTEXT.md decision: all turns default expanded, collapse on scroll-away, re-expand when revisited.
**Example:**
```typescript
// In ChatMessagesPane.tsx
const turnVisibility = useRef<Map<string, boolean>>(new Map());

// Per TurnBlock, wrap in IntersectionObserver
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // Re-expand when user scrolls back to this turn
        setExpandedTurns(prev => new Set([...prev, turnId]));
      } else {
        // Collapse when scrolled away (not streaming)
        if (!turn.isStreaming) {
          setExpandedTurns(prev => {
            const next = new Set(prev);
            next.delete(turnId);
            return next;
          });
        }
      }
    },
    { threshold: 0.1 }
  );
  // ...
}, []);
```

### Anti-Patterns to Avoid
- **Don't use modal dialogs for permissions:** CONTEXT.md explicitly says inline banners, not modals. The existing PermissionRequestsBanner already follows this.
- **Don't collapse usage summaries:** CHAT-13 explicitly says "always visible, never collapsed." No accordion/disclosure for usage.
- **Don't auto-collapse turns on new stream:** CONTEXT.md explicitly removes this behavior. Remove the `useEffect` in ChatMessagesPane that collapses all turns when `currentStreamingTurnId` changes.
- **Don't use separate left/right bubble layouts:** CHAT-15/CONTEXT says user messages stay right-aligned but within a centered column, not chat-app-style bubbles.
- **Don't add space-y gaps between turn sub-elements:** CHAT-16 says one continuous visual unit. Use 1px dividers, not whitespace gaps.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unified diff rendering | Custom line-by-line diff with manual hunk calculation | `react-diff-viewer-continued` | Handles word-level diff, gutter numbers, code folding, context lines, custom themes |
| Diff algorithm | Custom LCS-based diff (currently in messageTransforms.ts) | `react-diff-viewer-continued`'s built-in diff (uses jsdiff) | The existing `calculateDiff` is LCS-only, no word-level, no context lines; the library handles this properly |
| Syntax highlighting for diffs | Custom per-line tokenization | Shiki via `renderContent` prop | Shiki already set up with warm colors; `renderContent` gets each line as a string |
| Image lightbox overlay | Custom portal/overlay component | Simple div with fixed positioning + click-outside handler | Very simple feature, but don't re-invent focus trapping or scrollbar locking -- keep it minimal |
| Cost calculation | Server-side pricing API | Client-side pricing table | Models change rarely; no need for API call. Hardcode `{ 'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 }, ... }` |

**Key insight:** The existing codebase already has patterns for every sub-component in this phase. The risk is not missing libraries -- it's inconsistently applying the warm design system and over-engineering simple features.

## Common Pitfalls

### Pitfall 1: react-diff-viewer-continued Async renderContent
**What goes wrong:** The `renderContent` prop is called synchronously per line, but Shiki highlighting is async. Returning a promise or using hooks inside `renderContent` won't work.
**Why it happens:** Shiki's `highlightCode` returns a Promise. The `renderContent` function expects a ReactNode return.
**How to avoid:** Create a small `ShikiDiffLine` component that uses `useState`/`useEffect` internally to highlight async and show a plain text fallback until highlighting resolves. Memoize aggressively since diff viewer re-renders many lines.
**Warning signs:** Blank diff lines, flash of unstyled text, or "Cannot use hooks" errors.

### Pitfall 2: Turn Usage Data Not Available for Historic Messages
**What goes wrong:** Token usage is only available during streaming from the API response metadata. Historic messages loaded from session history won't have usage data.
**Why it happens:** The server's `extractTokenBudget` function aggregates cumulative usage at turn completion, not per-turn breakdown. Historic session messages don't embed per-message usage.
**How to avoid:** Per-turn usage is a best-effort feature for live streaming sessions. For historic messages, show "Usage data not available" or omit the footer. The session cumulative total (under composer) can use the existing `token-budget` websocket event which provides cumulative data.
**Warning signs:** Null/undefined usage on re-loaded sessions.

### Pitfall 3: IntersectionObserver Thrashing on Fast Scroll
**What goes wrong:** Rapid scrolling triggers many intersection callbacks, causing excessive state updates and re-renders.
**Why it happens:** IntersectionObserver fires for every visibility change during scroll.
**How to avoid:** Debounce the collapse/expand state changes (e.g., 300ms delay before collapsing). Only collapse after a turn has been out of view for a sustained period. Never collapse the currently streaming turn.
**Warning signs:** Flickering turns, jank during scroll, unexpected collapse of visible turns.

### Pitfall 4: Permission Banner Duplication
**What goes wrong:** Permission prompts appear both in the existing PermissionRequestsBanner (above composer) and inline within message flow.
**Why it happens:** Two rendering paths for the same data.
**How to avoid:** Decide on one location. The CONTEXT.md says "inline within message flow." This means moving the interactive approve/deny buttons FROM PermissionRequestsBanner INTO a new inline component rendered within the message list. The existing banner component can be deprecated or kept as a fallback.
**Warning signs:** Duplicate approve/deny buttons, race conditions when clicking different instances.

### Pitfall 5: Missing Warm Theme Colors in Diff Viewer
**What goes wrong:** react-diff-viewer-continued ships with default dark theme colors that clash with the earthy Loom palette (default dark is blue-gray, not warm brown).
**Why it happens:** The library's default dark theme variables are designed for generic dark mode.
**How to avoid:** Override ALL dark theme variables in the styles prop, not just a few. The full list from Context7 shows 20+ variables to override. Missing any will create jarring blue-gray patches in the diff view.
**Warning signs:** Cold blue or gray areas within the diff viewer that don't match surrounding UI.

### Pitfall 6: User Message Copy Button Position
**What goes wrong:** Copy button placed inside the message block takes up visual space and clutters the message.
**Why it happens:** Previous implementation has it inside the blue bubble with the timestamp.
**How to avoid:** CONTEXT.md says "hover-reveal outside the message block (right side)." Use absolute positioning or flexbox gap to place the button to the right of the message, visible only on hover. On touch devices, always show it (no hover state available).
**Warning signs:** Button visible inside message, button overlapping message content, button not appearing on hover.

## Code Examples

### Example 1: DiffViewerEnhanced Component
```typescript
// New component: src/components/chat/view/subcomponents/DiffViewerEnhanced.tsx
import React, { memo, useMemo } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface DiffViewerEnhancedProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  language?: string;
  onFileClick?: () => void;
}

export const DiffViewerEnhanced = memo(function DiffViewerEnhanced({
  oldContent,
  newContent,
  filePath,
  language = 'text',
  onFileClick,
}: DiffViewerEnhancedProps) {
  const warmTheme = useMemo(() => ({
    variables: {
      dark: {
        diffViewerBackground: '#1c1210',
        diffViewerColor: '#f5e6d3',
        addedBackground: '#1a2e1a',
        removedBackground: '#2e1a1a',
        addedGutterBackground: '#152815',
        removedGutterBackground: '#281515',
        gutterBackground: '#241a14',
        gutterColor: '#c4a882',
        codeFoldBackground: '#241a14',
        codeFoldContentColor: '#c4a882',
        // ... full set of warm overrides
      },
    },
  }), []);

  return (
    <div className="rounded-lg overflow-hidden border border-[#3d2e25]/40 my-2">
      {/* File path header */}
      <div className="flex items-center px-3 py-1.5 bg-[#241a14] text-xs">
        <button
          type="button"
          onClick={onFileClick}
          className="font-mono text-[#6bacce] hover:text-[#a0ccde] truncate transition-colors"
        >
          {filePath}
        </button>
      </div>
      <ReactDiffViewer
        oldValue={oldContent}
        newValue={newContent}
        splitView={false}
        useDarkTheme={true}
        showDiffOnly={true}
        extraLinesSurroundingDiff={3}
        styles={warmTheme}
        // renderContent={highlightLine} -- async Shiki integration
      />
    </div>
  );
});
```

### Example 2: TurnUsageFooter Component
```typescript
// New component: src/components/chat/view/subcomponents/TurnUsageFooter.tsx
import React, { memo, useMemo } from 'react';

interface TurnUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

interface TurnUsageFooterProps {
  usage: TurnUsage;
  model: string;
}

// Hardcoded pricing per 1M tokens (input, output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
  'claude-haiku-3.5-20241022': { input: 0.80, output: 4.0 },
  // ... extend as needed
};

export const TurnUsageFooter = memo(function TurnUsageFooter({ usage, model }: TurnUsageFooterProps) {
  const cost = useMemo(() => {
    const pricing = MODEL_PRICING[model] || { input: 3.0, output: 15.0 };
    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
    // Cache read is cheaper (typically 10% of input price)
    const cacheReadCost = (usage.cacheReadTokens / 1_000_000) * pricing.input * 0.1;
    const cacheCreationCost = (usage.cacheCreationTokens / 1_000_000) * pricing.input * 1.25;
    return inputCost + outputCost + cacheReadCost + cacheCreationCost;
  }, [usage, model]);

  const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="mt-2 pt-2 border-t border-[#3d2e25]/40 text-[11px] text-[#c4a882]/70 font-mono">
      <div>
        {formatTokens(usage.inputTokens)} in / {formatTokens(usage.outputTokens)} out
        {usage.cacheReadTokens > 0 && ` / ${formatTokens(usage.cacheReadTokens)} cache`}
        {usage.cacheCreationTokens > 0 && ` / ${formatTokens(usage.cacheCreationTokens)} cache-write`}
      </div>
      <div>
        ${cost.toFixed(4)} - {model}
      </div>
    </div>
  );
});
```

### Example 3: SystemStatusMessage Component
```typescript
// New component: src/components/chat/view/subcomponents/SystemStatusMessage.tsx
import React, { memo } from 'react';
import { Info, AlertTriangle, XCircle } from 'lucide-react';

type StatusTier = 'info' | 'warning' | 'error';

const tierConfig = {
  info: {
    bg: 'bg-gray-500/10',
    border: 'border-l-2 border-gray-500/40',
    text: 'text-gray-400',
    Icon: Info,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-l-2 border-amber-500/40',
    text: 'text-amber-300',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-l-2 border-[#b85c3a]/40',
    text: 'text-[#dab8b8]',
    Icon: XCircle,
  },
};

interface SystemStatusMessageProps {
  tier: StatusTier;
  content: string;
  timestamp: string;
}

export const SystemStatusMessage = memo(function SystemStatusMessage({
  tier,
  content,
  timestamp,
}: SystemStatusMessageProps) {
  const config = tierConfig[tier];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${config.bg} ${config.border} my-1`}>
      <config.Icon className={`w-3.5 h-3.5 ${config.text} flex-shrink-0`} />
      <span className={`text-xs ${config.text}`}>{content}</span>
      <span className="text-[10px] text-gray-600 ml-auto flex-shrink-0">{timestamp}</span>
    </div>
  );
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-diff-viewer (original) | react-diff-viewer-continued (fork) | 2023 | Original unmaintained; fork adds React 18/19 support, TypeScript, bug fixes |
| Prism.js for diff highlighting | Shiki v4 with web bundle | 2024 | Shiki provides VS Code-quality highlighting, smaller bundle with web build |
| Manual per-line diff | react-diff-viewer-continued with jsdiff | Current | Library handles word-level diff, hunk detection, context lines automatically |
| Token usage in sidebar pie chart | Per-turn inline usage footer + cumulative status | Phase 6 | Makes cost/usage visible without looking away from chat |

**Deprecated/outdated:**
- `react-diff-viewer` (original by praneshr): Unmaintained since 2020, doesn't support React 18+. Use `react-diff-viewer-continued` instead.
- `react-syntax-highlighter`: Already removed in Phase 5, replaced by Shiki v4. Don't re-introduce.

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | N/A |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | N/A |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Open Questions

1. **Per-turn usage data from streaming API**
   - What we know: The server already extracts cumulative usage from `message.usage` in `claude-response` events (see `server/routes/agent.js:580-586`). The `claude-sdk.js:extractTokenBudget()` function sends cumulative totals as `token-budget` events.
   - What's unclear: Per-turn (not cumulative) token breakdown needs to be extracted from `message_stop` or `message_delta` events. The current server code only sends cumulative totals. Need to verify if per-message usage data arrives in streaming events (the Claude API does include `usage` on `message_start` and `message_delta`).
   - Recommendation: Inspect a live streaming session's WebSocket traffic to confirm which events carry per-turn usage. If per-turn data isn't available, compute deltas from cumulative totals (turn N usage = cumulative after turn N - cumulative after turn N-1).

2. **Permission prompt WebSocket bidirectional response**
   - What we know: The existing `claude-permission-request` event and `PermissionRequestsBanner` handle permission prompts with approve/deny buttons. The server receives responses via WebSocket.
   - What's unclear: The CONTEXT.md says "Both CLI and web UI can respond to permission prompts -- first response wins, other side updates to show result." The current implementation may not broadcast the resolution back to update the inline banner state.
   - Recommendation: Verify the server broadcasts a `claude-permission-resolved` (or similar) event when a permission is approved/denied from either CLI or web. If not, add this event.

3. **Interactive prompt WebSocket response**
   - What we know: Interactive prompts are currently display-only in the web UI ("Waiting for your response in the CLI"). CONTEXT.md says options should be clickable in the web UI via websocket.
   - What's unclear: Whether the server has a handler for web-originated interactive prompt responses. This may require a new WebSocket message type.
   - Recommendation: Check if the backend routes (agent.js) accept interactive prompt responses via WebSocket. If not, this becomes a backend task in addition to frontend.

## Sources

### Primary (HIGH confidence)
- Context7 `/aeolun/react-diff-viewer-continued` -- API docs, theme customization, renderContent prop, props reference
- Context7 `/shikijs/shiki` -- transformerNotationDiff, decorations API, codeToHtml configuration
- Project codebase (direct file reads): TurnBlock.tsx, ChatMessagesPane.tsx, MessageComponent.tsx, ToolActionCard.tsx, TokenUsagePie.tsx, ThinkingDisclosure.tsx, ChatInputControls.tsx, ToolCallGroup.tsx, useChatRealtimeHandlers.ts, useTurnGrouping.ts, types.ts, DiffViewer.tsx, CodeBlock.tsx, Markdown.tsx, useShikiHighlighter.ts, index.css, messageTransforms.ts, PermissionRequestsBanner.tsx, clipboard.ts, server/routes/agent.js, server/claude-sdk.js

### Secondary (MEDIUM confidence)
- npm registry: react-diff-viewer-continued@4.1.2 (version verified), @shikijs/transformers@4.0.1 (version verified), peer dependency compatibility with React 18 confirmed
- Existing codebase patterns: CSS grid 0fr/1fr animation, category-based tinting, provider logo pattern, warm color replacement map

### Tertiary (LOW confidence)
- Per-turn token usage availability in streaming events -- needs live verification (Open Question 1)
- Permission resolution broadcast from server -- needs code audit (Open Question 2)
- Interactive prompt WebSocket response handler -- needs backend investigation (Open Question 3)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `react-diff-viewer-continued` verified via Context7 and npm; Shiki integration pattern documented in library docs
- Architecture: HIGH -- All components map to existing patterns (TurnBlock children, MessageComponent subtypes, category-based tinting)
- Pitfalls: HIGH -- Async renderContent, theme completeness, and IntersectionObserver thrashing are well-documented patterns with known solutions
- Usage data flow: MEDIUM -- Server-side extraction exists but per-turn granularity needs live verification
- Permission/interactive WebSocket: MEDIUM -- Existing patterns exist but bidirectional resolution needs backend audit

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable libraries, no fast-moving dependencies)
