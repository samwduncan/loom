# Library Research: Pre-Built React Components for iOS-Quality Chat App

**Project:** Loom V2
**Stack:** Vite 7 + React 19 + TypeScript + Tailwind v4 + Capacitor 7.6 (iOS)
**Researched:** 2026-03-30
**Overall Confidence:** HIGH (multiple verified sources per category)

---

## Executive Summary

Loom has ~50 hand-rolled components. To match ChatGPT/Claude iOS polish, the strategy should be **selective adoption** -- not wholesale framework replacement. The current shadcn/ui + Radix foundation is strong. The gaps are in (1) animation orchestration, (2) dynamic backgrounds/visual effects, (3) bottom sheets/action sheets, and (4) code block rendering.

**The single highest-impact adoption:** `assistant-ui` for chat primitives, which was purpose-built for exactly this use case (AI chat UIs with streaming, markdown, code blocks, tool calls) and sits on top of the same Radix/shadcn foundation Loom already uses.

**The single most dangerous adoption:** Replacing the custom streaming architecture. Loom's rAF token buffer, segment architecture, and stream multiplexer are core differentiators that must NOT be replaced by a library's opinionated state management.

---

## Table of Contents

1. [Animation Libraries](#1-animation-libraries)
2. [Dynamic Backgrounds / Animated Wallpapers](#2-dynamic-backgrounds--animated-wallpapers)
3. [Chat UI Component Libraries](#3-chat-ui-component-libraries)
4. [Composer / Rich Input Libraries](#4-composer--rich-input-libraries)
5. [File Upload Components](#5-file-upload-components)
6. [Settings / Preferences Pages](#6-settings--preferences-pages)
7. [Mobile-Optimized Component Systems](#7-mobile-optimized-component-systems)
8. [Code Block / Syntax Highlighting](#8-code-block--syntax-highlighting)
9. [Bottom Sheet / Action Sheet Components](#9-bottom-sheet--action-sheet-components)
10. [Recommendations Matrix](#10-recommendations-matrix)

---

## 1. Animation Libraries

### Recommendation: **Motion (formerly Framer Motion)** with LazyMotion

The Constitution already defines a 3-tier animation strategy. Motion is the right Tier 3 choice. The project already has `spring-easing` in devDependencies and uses CSS transitions extensively. Motion fills the gap for gesture-driven animations, exit animations, and layout transitions that CSS alone cannot handle.

### Motion (Framer Motion rebrand)
| Attribute | Value |
|-----------|-------|
| **Package** | `motion` (import from `motion/react`) |
| **Version** | 12.38.0 |
| **npm Size** | 615KB unpacked |
| **Bundle (full)** | ~34KB min+gz |
| **Bundle (LazyMotion + domAnimation)** | ~5KB initial, +15KB lazy |
| **Bundle (useAnimate mini)** | 2.3KB |
| **GitHub Stars** | ~25,000 |
| **React 19** | Fully supported (v12+) |
| **Last Updated** | 2 days ago |
| **License** | MIT |

**Pros:**
- Hybrid engine: uses Web Animations API (WAAPI) + ScrollTimeline for hardware-accelerated 120fps, falls back to JS only when needed (spring physics, interruptible keyframes)
- `LazyMotion` + `m` component keeps initial bundle at 4.6KB
- `AnimatePresence` for exit animations (critical for bottom sheets, modals)
- Layout animations for shared element transitions
- Gesture system (drag, pan, tap) integrates with animation
- React Compiler auto-memoization support
- The industry standard -- every tutorial, every example, every component library supports it

**Cons:**
- Full `motion` component is 34KB (use `m` + LazyMotion instead)
- Can cause jank if animating many elements simultaneously on lower-end devices
- The V2 Constitution currently BANS importing full Motion -- would need to update to use LazyMotion properly

**iOS/WKWebView:**
- WAAPI runs at native refresh rate (120Hz on ProMotion iPhones)
- GPU-composited transforms and opacity are hardware-accelerated in WKWebView
- Spring physics computed in JS, but output applied via GPU compositing
- No known WKWebView-specific issues

**Install:** `npm install motion`

**Verdict:** YES. Keep Tier 1 (CSS) and Tier 2 (tw-animate-css) as primary. Use Motion LazyMotion for: exit animations, gesture-driven animations, spring physics on interactive elements, layout transitions. This is already planned in the Constitution -- just needs proper implementation.

---

### Auto-Animate (FormKit)
| Attribute | Value |
|-----------|-------|
| **Package** | `@formkit/auto-animate` |
| **Version** | 0.9.0 |
| **Bundle** | ~2KB min+gz |
| **GitHub Stars** | ~13,000 |
| **React 19** | Compatible |
| **Last Updated** | 6 months ago |
| **License** | MIT |

**Pros:**
- Single-line `useAutoAnimate()` hook for list add/remove/reorder
- Tiny bundle -- perfect for "I just want items to animate in and out"
- Zero configuration required

**Cons:**
- No gesture support, no springs, no exit animations with complex orchestration
- Limited customization (timing, easing only)
- Does not provide the interactive feel needed for iOS-quality UX

**iOS/WKWebView:** Uses WAAPI internally. Works fine.

**Install:** `npm install @formkit/auto-animate`

**Verdict:** MAYBE as a complement for simple list animations (session list add/remove, settings sections). Not a replacement for Motion.

---

### React Spring
| Attribute | Value |
|-----------|-------|
| **Package** | `react-spring` |
| **Version** | 10.0.3 |
| **Bundle** | ~18KB min+gz |
| **GitHub Stars** | ~28,000 |
| **React 19** | Compatible (v10+) |
| **Last Updated** | 6 months ago |
| **License** | MIT |

**Pros:**
- Best spring physics model -- feels most "native iOS"
- Works with Three.js/react-three-fiber for 3D
- Interruptible animations by default

**Cons:**
- 18KB for similar functionality to Motion's 5KB LazyMotion
- API is less ergonomic than Motion for common use cases
- Smaller ecosystem of examples and component integrations
- Two animation libraries = confusion + bundle bloat

**iOS/WKWebView:** JS-driven springs. No WAAPI fallback. Performs fine but does not get 120Hz benefit of WAAPI.

**Verdict:** NO. Motion provides springs too (`type: "spring"`), and Loom doesn't need the extra 18KB or API surface. Use Motion.

---

### GSAP (GreenSock)
| Attribute | Value |
|-----------|-------|
| **Package** | `gsap` |
| **Version** | 3.12+ |
| **Bundle** | ~25KB core + plugins |
| **GitHub Stars** | ~20,000 |
| **React 19** | Compatible via `@gsap/react` |
| **License** | Standard "no charge" (not MIT -- read carefully for commercial use) |

**Pros:**
- Most powerful timeline/sequence engine
- ScrollTrigger for scroll-linked animations
- SVG animation champion

**Cons:**
- Not MIT license -- "Standard License" has restrictions
- Imperative API feels unnatural in React declarative paradigm
- Heavier than Motion for typical UI animation use cases
- iOS viewport resize causes ScrollTrigger jump issues (documented)

**Verdict:** NO. Licensing concerns + imperative API mismatch with React. Motion covers all of Loom's needs.

---

### Rive
| Attribute | Value |
|-----------|-------|
| **Package** | `@rive-app/react-canvas` |
| **Version** | 4.27.3 |
| **Runtime** | 78KB WASM module |
| **GitHub Stars** | ~3,000 |
| **License** | MIT |

**Pros:**
- Designer-driven animations (Rive editor, not code)
- 60fps via WASM renderer, dramatically outperforms Lottie
- File sizes 10-15x smaller than equivalent Lottie
- State machines for interactive animations
- Ideal for branded illustrations, mascots, onboarding flows

**Cons:**
- 78KB WASM runtime is a one-time cost but adds to initial bundle
- Requires Rive editor workflow -- not code-first
- Overkill for UI transitions (that's Motion's job)
- No evidence of WKWebView-specific testing

**Verdict:** DEFER to v2.4 (The Polish). Useful for companion sprites, branded loading animations, splash screens. Not needed for core UI polish.

---

### Lottie React
| Attribute | Value |
|-----------|-------|
| **Package** | `lottie-react` (already installed in root package.json) |
| **Version** | 2.4.1 |
| **Bundle** | ~50KB |
| **License** | MIT |

**Pros:**
- Already installed in the project
- Large animation marketplace (LottieFiles)
- Designer-friendly After Effects workflow

**Cons:**
- Performance is poor compared to Rive (17fps vs 60fps in benchmarks)
- CPU: 91.8% (Lottie) vs 31.8% (Rive) in comparative tests
- GPU memory: 149-190MB (Lottie) vs 2.6MB (Rive)
- Heavy runtime for what it does

**Verdict:** REMOVE. Already installed but should be replaced by Rive for any designer-driven animations in v2.4, or by CSS/Motion for UI animations. The performance profile is unacceptable for mobile.

---

## 2. Dynamic Backgrounds / Animated Wallpapers

### Recommendation: **Custom shaders via OGL** (already planned) + **Stripe-style mesh gradients**

The M3-POLISH-DEFERRED-CONTEXT.md already identifies Aurora (OGL-based) and Grainient as Tier 1 effects. This research validates that plan.

### OGL (Minimal WebGL Library)
| Attribute | Value |
|-----------|-------|
| **Package** | `ogl` |
| **Version** | latest |
| **Bundle** | ~30KB min+gz |
| **Dependencies** | Zero |
| **GitHub Stars** | ~3,700 |
| **License** | MIT |

**Pros:**
- Minimal WebGL wrapper -- no Three.js overhead
- GPU-driven animations = 60fps on mobile with minimal CPU
- Already planned for Aurora effect in M3-POLISH context
- Stripe uses a similar approach (~10KB, ~800 lines) for their mesh gradients
- Can share GL context between Aurora and Grainient effects

**Cons:**
- Lower-level than Three.js -- more manual shader work
- Smaller community than Three.js
- iOS 15 had a WebGL performance regression (30fps from 60fps) -- fixed in later versions

**iOS/WKWebView:**
- WebGL is fully supported in WKWebView
- GPU rendering is hardware-accelerated
- Must test on actual devices -- simulator does not accurately represent WebGL perf
- Use `will-change: transform` + CSS containment (`contain: strict`) on the container

**Verdict:** YES for v2.4 (The Polish). Perfect for Aurora streaming background and ambient gradient effects. Use with performance-gated activation (already designed in deferred context).

---

### Stripe Mesh Gradient (Standalone)
| Attribute | Value |
|-----------|-------|
| **Package** | GitHub Gist (~800 LOC, ~10KB) |
| **Dependencies** | None (vanilla WebGL) |
| **License** | MIT |

**Pros:**
- The exact effect used by Stripe.com
- Fractal Brownian Motion + Simplex noise = organic, living feel
- Optimized for 60fps on mobile and desktop
- 10KB total -- smaller than any library
- Can be adapted to use Loom's OKLCH palette

**Cons:**
- Not a maintained npm package -- copy-paste from gist
- Needs integration work to make it a React component
- No TypeScript types out of the box

**Verdict:** YES for v2.4. Copy the gist, wrap in a React component with TypeScript, integrate with Loom's design token system via the OKLCH-to-hex bridge (already designed in deferred context).

---

### tsParticles
| Attribute | Value |
|-----------|-------|
| **Package** | `@tsparticles/react` |
| **Version** | 3.0.0 |
| **Bundle** | Variable (loadSlim ~30KB, loadFull ~100KB+) |
| **GitHub Stars** | ~7,500 |
| **License** | MIT |

**Pros:**
- Highly configurable particle systems
- Selective loading (`loadSlim`, `loadBasic`) for bundle control
- Responsive design support

**Cons:**
- Particle effects feel dated -- more 2018 than 2026
- Heavy even with slim bundle for what is essentially decorative
- CPU-driven particle physics can drain mobile battery
- Aesthetic clash with Loom's "surgical precision + warm library" soul

**Verdict:** NO. Particles are not aligned with Loom's design language. Aurora/mesh gradients are the right ambient effect.

---

### react-three-fiber (R3F)
| Attribute | Value |
|-----------|-------|
| **Package** | `@react-three/fiber` |
| **Bundle** | ~40KB + Three.js (~150KB) |
| **GitHub Stars** | ~28,000 |

**Pros:**
- Full 3D scene graph in React
- Massive ecosystem (drei, postprocessing, etc.)

**Cons:**
- ~190KB combined bundle for backgrounds that OGL does in 30KB
- Three.js is 6x heavier than OGL for 2D shader effects
- Overkill -- Loom needs gradient shaders, not 3D scenes

**Verdict:** NO. OGL is the right choice for Loom's visual effects.

---

### CSS-Only Animated Gradients
| Attribute | Value |
|-----------|-------|
| **Package** | None -- pure CSS |
| **Bundle** | 0KB |

**Pros:**
- Zero bundle cost
- Hardware-accelerated via CSS animations
- 120Hz on ProMotion automatically
- `@keyframes` gradient rotation + `background-size` animation

**Cons:**
- CSS gradient animations are limited -- can't do Simplex noise or mesh deformation
- `background-position` animation can be janky on complex gradients
- Less organic feel than WebGL approaches

**Verdict:** YES for subtle ambient effects (idle state background pulse, color cycling). Use as Tier 1 fallback when WebGL effects are disabled (reduced-motion, low-power mode).

---

## 3. Chat UI Component Libraries

### Recommendation: **assistant-ui** (primitives only) + keep custom streaming architecture

### assistant-ui
| Attribute | Value |
|-----------|-------|
| **Package** | `@assistant-ui/react` |
| **Version** | 0.12.21 |
| **GitHub Stars** | ~5,000+ |
| **npm Downloads** | 200,000+/month |
| **React 19** | Fully supported |
| **Last Updated** | Active (weekly releases) |
| **License** | MIT |
| **Founded** | 2024 (Y Combinator backed) |

**Key Components:**
- `ThreadPrimitive.Root` / `Viewport` / `Messages` / `ViewportFooter` -- message thread layout
- `MessagePrimitive.Root` / `Content` / `If` -- message rendering with role-based styling
- `ComposerPrimitive.Input` / `Send` / `Cancel` / `AttachmentDropzone` -- composer
- `ActionBarPrimitive.Copy` / `Reload` / `Edit` -- message action buttons
- `BranchPickerPrimitive` -- multi-branch conversation navigation
- Built-in markdown rendering with code highlighting (uses react-shiki)
- Tool call rendering as components
- Streaming state management

**Pros:**
- Purpose-built for AI chat (not generic messaging)
- Radix-style composable primitives -- use only what you need
- shadcn/ui theme compatibility (same design system foundation)
- Built-in streaming, auto-scroll, retries, attachments, markdown
- Copy buttons on code blocks out of the box
- Keyboard shortcuts and accessibility by default
- Active development with weekly releases
- Supports custom backends (not locked to Vercel AI SDK)
- TypeScript-first

**Cons:**
- Version 0.x -- API may change
- State management layer may conflict with Loom's Zustand architecture
- Streaming model assumes a different architecture than Loom's rAF buffer
- Would need adapter layer to bridge assistant-ui's runtime with Loom's stores
- Bundle size not documented precisely

**iOS/WKWebView:**
- Built on Radix primitives (same foundation Loom already uses)
- No known WKWebView-specific issues
- Auto-scroll behavior would need testing with Loom's useChatScroll hook

**Integration Strategy:**
```
DO:
- Use ThreadPrimitive/MessagePrimitive for layout structure
- Use ActionBarPrimitive.Copy for copy buttons
- Use assistant-ui's markdown components (they use react-shiki)
- Use the shadcn theme layer

DO NOT:
- Replace Loom's Zustand stores with assistant-ui's runtime
- Replace the rAF token buffer streaming architecture
- Replace the stream multiplexer or segment architecture
- Use assistant-ui's backend integration (Loom has its own WebSocket protocol)
```

**Verdict:** INVESTIGATE CAREFULLY. The primitives are excellent and would save significant development time. But the integration requires a custom adapter layer to preserve Loom's streaming architecture. Worth a spike in v2.3 or v2.4 -- not a quick drop-in.

---

### Chatscope (chat-ui-kit-react)
| Attribute | Value |
|-----------|-------|
| **Package** | `@chatscope/chat-ui-kit-react` |
| **Version** | 2.1.1 |
| **GitHub Stars** | ~1,400 |
| **Last Updated** | 10 months ago |
| **License** | MIT |

**Pros:**
- Pre-built MessageList, Message, MessageInput, ChatContainer
- Typing indicators, conversation lists
- Built-in state management via `@chatscope/use-chat`

**Cons:**
- Written in JavaScript (TypeScript types added later, second-class)
- Designed for generic chat (Slack-like), not AI chat
- No streaming support
- No code block rendering, no markdown
- No tool call rendering
- Styling is CSS-in-JS, conflicts with Tailwind approach
- Stale -- 10 months without release

**Verdict:** NO. Wrong paradigm (human-to-human chat, not AI chat). No streaming. Poor TypeScript support. assistant-ui is superior in every dimension.

---

### Stream Chat React
| Attribute | Value |
|-----------|-------|
| **Package** | `stream-chat-react` |
| **Bundle** | ~200KB |
| **License** | Commercial (Stream.io) |

**Pros:**
- Enterprise-grade messaging UI
- Real-time, threads, reactions, file sharing

**Cons:**
- Commercial product -- requires Stream.io account
- Designed for human-to-human messaging, not AI chat
- Massive bundle (200KB+)
- Completely wrong use case

**Verdict:** NO. Commercial, wrong use case, enormous bundle.

---

### react-chat-elements
| Attribute | Value |
|-----------|-------|
| **Package** | `react-chat-elements` |
| **GitHub Stars** | ~1,200 |
| **Last Updated** | Stale |

**Verdict:** NO. Unmaintained. No streaming. No AI chat features.

---

## 4. Composer / Rich Input Libraries

### Recommendation: **Keep custom textarea** + adopt auto-resize pattern

Loom's composer is a textarea with send button, file attachment, and model selector. This is NOT a rich text editor use case. Adding Lexical or Tiptap would add 50-100KB+ for features Loom doesn't need (bold, italic, lists, links).

### Why NOT Lexical/Tiptap/Slate for Loom

| Library | Bundle | What It Adds | What Loom Needs |
|---------|--------|-------------|-----------------|
| Lexical | ~25KB core + plugins | Rich text editing, collaboration | Auto-resize textarea |
| Tiptap | ~40KB + ProseMirror | Extension ecosystem, formatting toolbar | Auto-resize textarea |
| Slate | ~35KB | Customizable editor framework | Auto-resize textarea |

**The gap in Loom's composer is not rich text editing. It is:**
1. Auto-resize textarea (CSS `field-sizing: content` or JS measurement)
2. File attachment preview chips
3. Model selector dropdown
4. iOS keyboard animation sync
5. Send/stop button state machine

All of these are better solved with targeted CSS + Radix primitives than a rich text editor framework.

### What to Use Instead

**CSS `field-sizing: content`** (Chrome 123+, Safari 18.4+):
```css
textarea {
  field-sizing: content;
  min-height: 44px;
  max-height: 200px;
}
```
Zero JS. Zero bundle cost. Native to the browser. Works in WKWebView on iOS 18.4+ (Capacitor ships with system WKWebView).

**Fallback for older iOS:** A 10-line `useAutoResize` hook measuring `scrollHeight`.

**Verdict:** NO rich text editors. Use CSS `field-sizing: content` with a JS fallback hook. The current custom approach is correct -- just needs the auto-resize polish.

---

## 5. File Upload Components

### Recommendation: **Keep react-dropzone** (already installed)

`react-dropzone` is already in the root package.json. It's the right choice.

### react-dropzone (already installed)
| Attribute | Value |
|-----------|-------|
| **Package** | `react-dropzone` |
| **Version** | 14.2.3 (installed) |
| **Bundle** | ~8KB min+gz |
| **npm Downloads** | 5M/week |
| **License** | MIT |

**Pros:**
- Already installed and presumably integrated
- Headless -- provides drag/drop behavior, you own the UI
- Tiny bundle
- File validation (type, size, count)

**Cons:**
- Does not handle uploads (it's a dropzone, not an uploader)
- No camera integration (use Capacitor Camera plugin for that)
- No progress indicators (handle in upload logic)

**Camera Integration:**
Use `@capacitor/camera` for native iOS camera/photo picker. react-dropzone handles the web drag-and-drop case.

**Verdict:** KEEP. Already the right tool. For camera, use Capacitor's native plugin.

---

### FilePond
| Attribute | Value |
|-----------|-------|
| **Package** | `react-filepond` |
| **Bundle** | ~40KB + plugins |
| **License** | MIT |

**Pros:**
- Beautiful upload widget with progress, preview
- Chunked/resumable uploads
- Image editing plugins

**Cons:**
- Opinionated UI that clashes with Loom's Tailwind design system
- 40KB+ for a file input that react-dropzone handles at 8KB
- Styling override required to match Loom's aesthetic

**Verdict:** NO. react-dropzone + custom UI is lighter and more aligned.

---

### Uppy
| Attribute | Value |
|-----------|-------|
| **Package** | `@uppy/react` |
| **Bundle** | ~50KB+ |
| **License** | MIT |

**Verdict:** NO. Enterprise-grade file upload framework. Massive overkill for attaching files to a chat message.

---

## 6. Settings / Preferences Pages

### Recommendation: **Konsta UI List components** OR **custom Tailwind components using shadcn patterns**

### Konsta UI (for iOS-native Settings look)
| Attribute | Value |
|-----------|-------|
| **Package** | `konsta` |
| **Version** | 5.0.8 |
| **Bundle** | CSS-only (no runtime JS) |
| **GitHub Stars** | ~3,800 |
| **React 19** | Compatible |
| **Last Updated** | 6 days ago |
| **License** | MIT |

**Key Components for Settings:**
- `List` / `ListGroup` / `ListItem` -- iOS-style grouped list sections
- `Toggle` -- iOS switch component
- `Range` -- iOS slider
- `Radio` -- iOS radio buttons
- `Checkbox` -- iOS checkboxes
- `Segmented` -- iOS segmented control
- `Navbar` -- iOS navigation bar

**Pros:**
- Pixel-perfect iOS design using official Apple HIG
- Built with Tailwind CSS -- aligns perfectly with Loom's stack
- Pure CSS styling, no runtime JS overhead
- Updated to iOS 26 design language (v5.0)
- Designed as UI-only layer (no router, no state management)
- Can cherry-pick individual components

**Cons:**
- Designed to be used with Framework7 or Ionic as "parent" -- standalone React use is possible but less documented
- 1,293 weekly downloads -- small community
- May conflict with existing shadcn/ui styling conventions
- Would introduce a second component styling system

**iOS/WKWebView:** Designed specifically for this environment. Perfect fit.

**Install:** `npm install konsta`

**Alternative: Build with shadcn + Tailwind**

Given that Loom already has shadcn/ui primitives (`switch.tsx`, `slider.tsx`, `select.tsx`, `checkbox.tsx`, `tabs.tsx`), building iOS-style settings pages using existing primitives may be simpler than adopting Konsta:

```tsx
// iOS-style grouped settings section
<div className="rounded-xl bg-card overflow-hidden divide-y divide-border/10">
  <SettingsRow label="Dark Mode" right={<Switch />} />
  <SettingsRow label="Haptic Feedback" right={<Switch />} />
  <SettingsRow label="Font Size" right={<Slider />} />
</div>
```

**Verdict:** EITHER works. Konsta is the premium option if you want pixel-perfect iOS native look with zero effort. Building with shadcn primitives is the lower-risk option that stays within the existing design system. **Recommend: shadcn-based custom settings layout** for consistency, with Konsta as inspiration for the visual patterns.

---

## 7. Mobile-Optimized Component Systems

### Recommendation: Do NOT adopt a mobile framework. Enhance shadcn/ui + add Vaul.

### Why NOT Ionic React / Framework7 React

Both Ionic and Framework7 are full application frameworks with their own router, navigation model, and component systems. Adopting either would mean:
- Replacing react-router-dom
- Adopting their navigation/transition model
- Fighting their CSS with Tailwind overrides
- Massive refactor with no clear benefit over the current architecture

Loom's architecture (Vite + React + Tailwind + Capacitor) is already the modern standard. The gap is not the framework -- it's specific components.

### What to Add to shadcn/ui

The existing shadcn components in Loom:
```
alert-dialog, badge, button, card, checkbox, collapsible, context-menu,
dialog, dropdown-menu, input, kbd, label, popover, scroll-area, select,
separator, slider, sonner, switch, tabs, tooltip
```

**Missing shadcn components to add:**
| Component | Purpose | Priority |
|-----------|---------|----------|
| **Drawer** (Vaul) | Bottom sheets, action sheets, mobile menus | HIGH |
| **Sheet** | Side panels, slide-over settings | MEDIUM |
| **Accordion** | Collapsible settings sections | MEDIUM |
| **Toggle** | Toggle button groups | LOW |
| **Avatar** | User/AI avatars in chat | MEDIUM |
| **Skeleton** | Already exists but verify coverage | -- |
| **Progress** | Upload progress, token budget | MEDIUM |
| **Command** | Already have cmdk | -- |

### Vaul (Bottom Sheet / Drawer)
| Attribute | Value |
|-----------|-------|
| **Package** | `vaul` |
| **Version** | 1.1.2 |
| **Bundle** | ~5KB min+gz |
| **GitHub Stars** | ~6,000+ |
| **Built by** | Emil Kowalski |
| **Foundation** | Radix UI Dialog |
| **React 19** | Compatible |
| **License** | MIT |

**Pros:**
- THE standard React bottom sheet (shadcn's Drawer component IS Vaul)
- Physics-based swipe-to-dismiss
- Snap points for multi-height sheets
- Background scaling effect (like iOS native)
- Nested drawers support
- Built on Radix Dialog -- fully accessible
- Tiny bundle (~5KB)
- Already used by shadcn/ui -- zero styling conflict

**Cons:**
- Swipe gesture may conflict with Loom's existing sidebar swipe handlers (same issue as #12)
- Need careful gesture zone isolation

**iOS/WKWebView:**
- Touch-driven animations work in WKWebView
- Swipe-to-dismiss uses touch events (not contextmenu -- avoids the Radix ContextMenu iOS problem)
- Tested and used in production Capacitor apps

**Install:** `npx shadcn@latest add drawer` (or `npm install vaul` directly)

**Verdict:** YES. Critical addition. Replaces the broken Radix ContextMenu pattern for iOS long-press actions. Use Vaul drawers instead of context menus on mobile.

---

## 8. Code Block / Syntax Highlighting

### Recommendation: **Keep Shiki** (already installed) + add **react-shiki** wrapper + copy button

### Shiki (already installed)
| Attribute | Value |
|-----------|-------|
| **Package** | `shiki` |
| **Installed Version** | 3.23.0 (root), 4.0.1 (root package.json) |
| **Latest** | 4.x |
| **License** | MIT |

Shiki is already installed and presumably used. The question is: how to improve the code block experience.

### react-shiki (React wrapper)
| Attribute | Value |
|-----------|-------|
| **Package** | `react-shiki` |
| **Version** | 0.9.2 |
| **Bundle** | ~12KB (core, excludes themes/languages) |
| **GitHub Stars** | Growing |
| **React 19** | Compatible |
| **License** | MIT |

**Key Features:**
- `ShikiHighlighter` component and `useShikiHighlighter` hook
- Streamed code highlighting with throttling (perfect for AI chat)
- Dynamic imports of only used languages and themes
- Support for Shiki transformers
- React elements or HTML string output

**Pros:**
- Built specifically for React (vs. raw Shiki which is framework-agnostic)
- Streaming code highlight support -- critical for AI chat where code appears token by token
- Dynamic language/theme imports keep bundle small
- assistant-ui recommends react-shiki as its syntax highlighter

**Cons:**
- 0.x version
- Full bundle with all languages: ~1.2MB gz (but dynamic imports avoid this)
- Copy button is NOT built-in -- must be added as a wrapper component

**iOS/WKWebView:**
- TextMate grammar highlighting is computed once, rendered as styled HTML
- No continuous JS execution = excellent mobile performance
- Pre-highlighted HTML avoids runtime rendering jank during scrolling

**Copy Button Pattern:**
```tsx
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <ShikiHighlighter language={language}>{code}</ShikiHighlighter>
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                   md:opacity-0 opacity-100"  // Always visible on mobile
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
```

**Verdict:** YES. Add `react-shiki` to replace raw Shiki usage. Build a CodeBlock wrapper with copy button. Use dynamic imports for languages.

---

### react-syntax-highlighter
| Attribute | Value |
|-----------|-------|
| **Package** | `react-syntax-highlighter` |
| **Bundle** | ~40KB + Prism/Highlight.js |

**Verdict:** NO. Legacy library. Known to be "VERY SLOW" with 10+ code blocks (exactly Loom's use case). Shiki is the modern replacement and already installed.

---

## 9. Bottom Sheet / Action Sheet Components

### Recommendation: **Vaul** (for custom bottom sheets) + **@capacitor/action-sheet** (for native iOS action sheets)

This is critical for fixing Forgejo issues #14 and #15 (long-press context menus broken on iOS).

### Vaul (covered in Section 7)
Use for: custom content bottom sheets (message actions, session management, settings panels).

### @capacitor/action-sheet (already installed)
| Attribute | Value |
|-----------|-------|
| **Package** | `@capacitor/action-sheet` |
| **Version** | 7.0.4 (installed) |
| **Bundle** | ~2KB (bridge to native) |

**Pros:**
- Native iOS action sheet -- pixel-perfect, 120Hz animations, haptic feedback
- Already installed in the project
- Zero styling work needed
- Destructive action support (red text, separate cancel button)

**Cons:**
- Limited to text-only options (no icons, no custom UI)
- Only works in Capacitor (need Vaul fallback for web)

**Integration Pattern:**
```tsx
async function showMessageActions() {
  if (IS_NATIVE) {
    const result = await ActionSheet.showActions({
      title: 'Message',
      options: [
        { title: 'Copy' },
        { title: 'Reply' },
        { title: 'Delete', style: ActionSheetButtonStyle.Destructive },
      ],
    });
    handleAction(result.index);
  } else {
    // Show Vaul drawer on web
    openDrawer();
  }
}
```

**Verdict:** YES. Use native ActionSheet for simple option lists on iOS, Vaul for rich content sheets on both platforms.

### react-modal-sheet
| Attribute | Value |
|-----------|-------|
| **Package** | `react-modal-sheet` |
| **Bundle** | ~8KB |
| **GitHub Stars** | ~1,500 |
| **License** | MIT |

**Pros:**
- Compound component pattern
- Built with Motion (Framer Motion)
- Snap points, background dimming

**Cons:**
- Vaul does the same thing, is more popular, and is the shadcn standard
- Adding both would be redundant

**Verdict:** NO. Use Vaul instead.

---

## 10. Recommendations Matrix

### ADOPT NOW (v2.2 / 67.1)

| Library | Purpose | Bundle Impact | Priority |
|---------|---------|---------------|----------|
| **Vaul** (via shadcn Drawer) | Bottom sheets replacing broken ContextMenu on iOS | +5KB | CRITICAL |
| **@capacitor/action-sheet** | Native iOS action sheets (already installed) | 0KB (installed) | CRITICAL |

### ADOPT NEXT (v2.3 / v2.4)

| Library | Purpose | Bundle Impact | Priority |
|---------|---------|---------------|----------|
| **Motion** (LazyMotion) | Gesture animations, exit animations, springs | +5KB initial | HIGH |
| **react-shiki** | Streaming code highlighting with React wrapper | +12KB | HIGH |
| **@formkit/auto-animate** | Simple list animations (session list) | +2KB | MEDIUM |

### INVESTIGATE (needs spike/prototype)

| Library | Purpose | Risk | When |
|---------|---------|------|------|
| **assistant-ui** (primitives) | Chat UI primitives, markdown, copy buttons | Integration with Loom's streaming arch | v2.4 |
| **Konsta UI** | iOS-native settings UI components | Second styling system | v2.4 |

### ADOPT FOR VISUAL POLISH (v2.4)

| Library | Purpose | Bundle Impact |
|---------|---------|---------------|
| **OGL** | Aurora/Grainient WebGL backgrounds | +30KB (lazy) |
| **Stripe mesh gradient** | Ambient animated gradient | +10KB (copy-paste) |
| **Rive** | Designer-driven animations (sprites, loading) | +78KB WASM (lazy) |

### DO NOT ADOPT

| Library | Reason |
|---------|--------|
| react-spring | Redundant with Motion, larger bundle |
| GSAP | License concerns, imperative API |
| tsParticles | Aesthetic mismatch, battery drain |
| react-three-fiber | 6x heavier than OGL for 2D effects |
| Lexical / Tiptap / Slate | Overkill for auto-resize textarea |
| Chatscope | Generic chat, no streaming, stale |
| Stream Chat | Commercial, wrong use case |
| react-syntax-highlighter | Legacy, slow with many code blocks |
| FilePond / Uppy | Overkill, react-dropzone already installed |
| Ionic React / Framework7 | Would require full app rewrite |
| lottie-react | Poor mobile performance, Rive is better |

### REMOVE

| Library | Reason |
|---------|--------|
| `lottie-react` | Poor performance (17fps vs Rive's 60fps). Replace with Rive or Motion. |

---

## Capacitor iOS Animation Best Practices

Based on research specific to Capacitor + WKWebView + ProMotion:

### Hardware-Accelerated Properties (USE THESE)
- `transform` (translateX/Y/Z, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

### Layout-Triggering Properties (AVOID ANIMATING)
- `height`, `width` (use `transform: scaleY()` or `grid-template-rows`)
- `top`, `left`, `margin`, `padding`
- `box-shadow` (use `filter: drop-shadow()` instead)

### 120Hz ProMotion
- CSS transitions and WAAPI automatically run at the display's refresh rate
- `requestAnimationFrame` runs at 60fps in WKWebView (NOT 120fps)
- Motion's WAAPI engine runs at 120Hz; its JS fallback runs at 60Hz
- For spring physics: Motion's hybrid engine is the best option

### Recommended Duration/Easing for iOS
- Duration: 300ms for navigation transitions, 200ms for micro-interactions
- Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` (standard) or spring with damping
- Always pair visual transitions with haptic feedback (`@capacitor/haptics`)

### Performance-Gated Pattern (from deferred context)
```tsx
const shouldAnimate = useUiPreferences(s => s.reducedMotion === false);
const isLowPower = useMediaQuery('(prefers-reduced-motion: reduce)');

// Only load heavy effects when conditions are met
{shouldAnimate && !isLowPower && <AuroraBackground />}
```

---

## Sources

### Animation
- [Motion (Framer Motion) official docs](https://motion.dev/docs/react)
- [Motion LazyMotion bundle optimization](https://motion.dev/docs/react-reduce-bundle-size)
- [Motion React 19 compatibility](https://github.com/motiondivision/motion/issues/2668)
- [Framer Motion vs Motion One mobile performance](https://www.reactlibraries.com/blog/framer-motion-vs-motion-one-mobile-animation-performance-in-2025)
- [Auto-Animate official](https://auto-animate.formkit.com/)
- [Lottie vs Rive performance comparison](https://www.callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- [Rive React optimizations](https://pixelpoint.io/blog/rive-react-optimizations/)
- [GSAP ScrollTrigger iOS issues](https://gsap.com/community/forums/topic/31568-scrolltrigger-in-ios/)

### Dynamic Backgrounds
- [OGL minimal WebGL library](https://github.com/oframe/ogl)
- [Stripe mesh gradient gist](https://gist.github.com/jordienr/64bcf75f8b08641f205bd6a1a0d4ce1d)
- [GradFlow WebGL gradients](https://gradflow.meera.dev/)

### Chat UI
- [assistant-ui GitHub](https://github.com/assistant-ui/assistant-ui)
- [assistant-ui docs](https://www.assistant-ui.com/docs)
- [assistant-ui Thread component](https://www.assistant-ui.com/docs/ui/thread)
- [assistant-ui syntax highlighting](https://www.assistant-ui.com/docs/ui/SyntaxHighlighting)
- [Chatscope GitHub](https://github.com/chatscope/chat-ui-kit-react)

### Code Highlighting
- [react-shiki GitHub](https://github.com/AVGVSTVS96/react-shiki)
- [Shiki official docs](https://shiki.matsu.io/guide/install)
- [Vercel ai-elements Shiki migration](https://github.com/vercel/ai-elements/issues/14)

### Mobile Components
- [Vaul drawer](https://github.com/emilkowalski/vaul)
- [shadcn Drawer](https://ui.shadcn.com/docs/components/radix/drawer)
- [Konsta UI](https://konstaui.com/)
- [Konsta UI React](https://konstaui.com/react)

### Capacitor Performance
- [Animation performance in Capacitor apps](https://capgo.app/blog/ultimate-guide-to-animation-performance-in-capacitor-apps/)
- [WebGL in WKWebView](https://github.com/apache/cordova-ios/issues/1246)
- [react-three-fiber mobile performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance)

### Editors
- [Rich text editors comparison 2026](https://www.pkgpulse.com/blog/tiptap-vs-lexical-vs-slate-vs-quill-rich-text-editor-2026)
- [Best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/)
