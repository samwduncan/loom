# Clone Candidate Evaluation: React Native AI Chat Foundations

**Project:** Loom v3.0 Native iOS App
**Researched:** 2026-04-03
**Overall confidence:** HIGH (code inspected directly, not just READMEs)

---

## Executive Summary

After cloning and reading source code for 6 open-source repos, inspecting 3 commercial templates, and evaluating against Loom's specific requirements (Expo Router, drawer sidebar, streaming, extensible message types, Zustand, dark mode), **one candidate stands clearly above the rest: software-mansion-labs/private-mind**.

Private Mind is a production-shipped Expo SDK 54 + RN 0.81 app from Software Mansion (the team behind Reanimated, Gesture Handler, and react-native-screens). It uses Expo Router, Zustand, expo-sqlite, react-native-keyboard-controller, Reanimated, and a drawer-based sidebar with date-grouped session list -- nearly identical to Loom's existing stack. The code quality is professional, not tutorial-grade. It shipped to both App Store and Google Play.

The Galaxies-dev clone, while often recommended, is tutorial-quality code on Expo 50 with 24 commits and fundamental issues (inverted FlatList via FlashList, standard KeyboardAvoidingView, light-mode-only hardcoded colors, no real state management). It would require more work to modernize than to build from scratch with Private Mind's patterns.

**Recommendation:** Do NOT fork any repo. Instead, use Private Mind as the primary architectural reference and selectively transplant its patterns (drawer, chat screen composition, Zustand store structure, SQLite repository pattern, theming) into Loom's existing mobile/ scaffold. Loom's shared/ workspace, WebSocket streaming, and multi-provider architecture are fundamentally different from any clone's local-LLM or direct-API approach -- a fork would require gutting and replacing the entire data layer anyway.

---

## Candidate Evaluation Matrix

| Criterion | Private Mind | Galaxies-dev | ChatterUI | aws/swift-chat | expo-ai-chatbot-lite | dabit3/react-native-ai |
|-----------|:-----------:|:------------:|:---------:|:--------------:|:-------------------:|:----------------------:|
| Stars | 317 | 284 | 2,200 | 770 | 390 | 1,300 |
| Last active | 2026-01 | 2024-04 | 2026 (active) | 2026 (active) | 2025-02 | 2024-2025 |
| Commits | 229 | 24 | 1,364 | ~200 | ~50 | 112 |
| Expo Router | YES | YES | YES (v53) | NO (bare RN) | YES | Unclear |
| Expo SDK | 54 | 50 | 53 | N/A (bare) | Unknown | Unknown |
| RN Version | 0.81 | 0.73 | 0.79 | 0.83 | Unknown | Unknown |
| TypeScript | 97% | 99% | 97% | ~90% | 96% | 88% |
| Zustand | YES | NO | YES | NO | NO | NO |
| SQLite | YES (expo-sqlite) | YES (expo-sqlite) | YES (drizzle) | NO (MMKV only) | YES (Supabase) | NO |
| Reanimated | YES (4.1) | YES (3.6) | YES (4.1) | YES (3.19) | NO | NO |
| Keyboard Controller | YES (1.18) | NO | YES (1.17) | YES (1.20) | NO | NO |
| Drawer Sidebar | YES (slide) | YES (slide) | Custom | YES | YES | NO |
| Session List (grouped) | YES (date sections) | YES (flat list) | YES | YES | YES | NO |
| Dark Mode | YES (themed) | NO (light only) | YES (themed) | YES | YES | YES |
| Streaming Support | YES (local LLM) | YES (OpenAI) | YES (local+API) | YES (multi-provider) | YES (AI SDK) | YES (multi-provider) |
| Bottom Sheet | YES (gorhom v5) | YES (gorhom v4) | NO | NO | NO | NO |
| Context Menus | NO | YES (Zeego) | Popup menu | NO | NO | NO |
| License | MIT | MIT | AGPL-3.0 | MIT-0 | Unknown | MIT |
| Extensible messages | YES (event type) | NO | YES (custom types) | YES (citations) | YES (tool calls) | NO |

---

## Detailed Candidate Analysis

### 1. software-mansion-labs/private-mind [RECOMMENDED REFERENCE]

**Repository:** https://github.com/software-mansion-labs/private-mind
**Stars:** 317 | **Commits:** 229 | **Last release:** v1.1.3 (Jan 2026) | **License:** MIT

**Why it stands out:**
- Built by **Software Mansion** -- the team that literally builds react-native-reanimated, react-native-screens, and react-native-gesture-handler. Their code quality is inherently above community average.
- **Production-shipped** to both App Store and Google Play -- not a tutorial, not a demo.
- Tech stack is **nearly identical** to Loom's existing mobile/ package.json: Expo 54, RN 0.81, Expo Router 6, Zustand 5, expo-sqlite, react-native-keyboard-controller 1.18, Reanimated 4.1, Gesture Handler 2.28, gorhom/bottom-sheet v5, react-native-enriched-markdown.

**Architecture quality (code-reviewed):**

The component architecture is clean and composable:
```
app/(drawer)/_layout.tsx      -- Drawer + Expo Router (drawerType: 'slide')
app/(drawer)/chat/[id].tsx    -- Dynamic chat route
app/(modals)/...              -- Modal stack for settings, model management
components/chat-screen/       -- ChatScreen, Messages, MessageItem, ChatBar, PromptSuggestions
components/drawer/            -- CustomDrawer, DrawerMenu, DrawerItem
components/bottomSheets/      -- ModelSelectSheet, SourceSelectSheet, MessageManagementSheet
store/                        -- chatStore, llmStore, modelStore, sourceStore (all Zustand)
database/                     -- chatRepository, modelRepository, sourcesRepository (expo-sqlite)
styles/                       -- colors.ts (typed Theme), fontStyles.ts
```

**State management:** 4 Zustand stores with clean separation:
- `chatStore` -- session CRUD, phantom chat pattern for new sessions
- `llmStore` -- model loading, message generation, streaming state, interrupt
- `modelStore` -- available models
- `sourceStore` -- RAG document sources

**Database layer:** Repository pattern with `chatRepository.ts` exporting typed functions (`createChat`, `getAllChats`, `getChatMessages`, `persistMessage`). Clean SQL, proper async handling. Types exported for `Chat`, `Message`, `ChatSettings`.

**Theming:** Typed `Theme` object with `lightTheme` and `darkTheme` constants plus safe area insets baked in. `ThemeContext` provides theme to all components. Every component uses `createStyles(theme)` pattern with `useMemo`.

**Message extensibility:** Already has an `event` message role in addition to `user`, `assistant`, `system`. The `MessageItem` component handles different roles with different rendering. Adding `tool_call` or `permission_request` types would be straightforward.

**Streaming:** Token-by-token via `react-native-executorch` callbacks. The pattern (update last message in array via Zustand set) is the same approach Loom would use for WebSocket streaming. The llmStore's `sendChatMessage` flow is clear: add user message + empty assistant placeholder to state, generate tokens that append to placeholder, persist final response.

**Drawer:** Custom drawer with date-grouped sessions (Today, Yesterday, X days ago, Last week, etc.). Uses `expo-router/drawer` with `drawerType: 'slide'`. DrawerMenu navigates via `router.replace()` with pathname-based active highlighting.

**What would need changing for Loom:**
1. **Replace local LLM with WebSocket streaming** -- gut `llmStore`'s `react-native-executorch` calls, replace with Loom's shared/ WebSocket multiplexer
2. **Replace model management** -- Private Mind manages on-device model files; Loom manages remote providers
3. **Add custom message types** -- Tool cards, permission requests, git status. MessageItem already supports role-based rendering, extend it
4. **Replace theme colors** -- Swap blue/navy palette for Loom's warm charcoal/dusty rose from Soul doc
5. **Add NativeWind** -- Private Mind uses StyleSheet.create exclusively; Loom uses NativeWind. Gradual migration possible
6. **Strip executorch/RAG deps** -- Remove ~8 packages related to on-device inference

**What transfers directly:**
- Drawer layout and session grouping logic
- ChatScreen component composition pattern
- ChatBar (composer) with prompt suggestions
- MessageItem with role-based rendering
- Zustand store architecture and repository pattern
- Bottom sheet patterns for model/action selection
- CustomKeyboardAvoidingView
- Theme system structure (adapt colors)

**Critical assessment:**
- Messages component uses **ScrollView**, not a virtualized list. For Loom's potentially long conversations, this would need replacement with legend-list or FlashList. Private Mind's conversations are short (on-device LLM) so this was acceptable.
- No spring animations beyond basic Reanimated setup. Motion is minimal. Loom's Soul doc demands much more.
- No context menus (Zeego). Would need to add for message actions.
- UI is clean but not "award-winning" -- functional design, not beautiful. Loom needs to layer the Soul doc's warmth and motion on top.

**Confidence: HIGH** -- Code directly inspected.

---

### 2. Galaxies-dev/chatgpt-clone-react-native [NOT RECOMMENDED]

**Repository:** https://github.com/Galaxies-dev/chatgpt-clone-react-native
**Stars:** 284 | **Commits:** 24 | **Last update:** April 2024 | **License:** MIT

**Why it seems appealing:**
- Closest visual match to ChatGPT iOS (screenshots look good)
- Uses FlashList, Zeego context menus, Bottom Sheet, Reanimated, MMKV, Expo Router
- SQLite for persistence
- Drawer sidebar with session list

**Why it fails on deep inspection:**

1. **Tutorial code, not production code.** 24 commits total. One contributor. No tests. This is a YouTube tutorial companion, not an app.

2. **Expo 50 / RN 0.73** -- Two major versions behind Loom's stack. Migration would be substantial. React 18.2 vs Loom's 19.1.

3. **No state management.** Chat state is managed with `useState` + `useRef` inside `ChatPage.tsx`. No Zustand, no context. The `chatIdRef` hack (line 33) is a code smell -- mutable ref to work around stale closure in event listener. This pattern breaks under any real complexity.

4. **FlashList with inverted pattern.** Uses `estimatedItemSize={400}` which is a guess. No `alignItemsAtEnd`, no `maintainScrollAtEnd`. Messages append and FlashList does... something. Not reliable for streaming.

5. **KeyboardAvoidingView (standard).** Uses platform-conditional `behavior` prop. This is the exact pattern we already know causes issues on iOS. No react-native-keyboard-controller.

6. **Hardcoded light mode.** Colors like `backgroundColor: '#fff'` and `color: '#000'` scattered throughout. `Colors.ts` defines light colors only. No theme system, no dark mode.

7. **OpenAI streaming is tightly coupled.** `react-native-openai` package with event listener directly in the chat component. No abstraction layer. Replacing with Loom's WebSocket streaming would mean rewriting the entire chat page.

8. **No message type extensibility.** `Message` interface is `{ role: Role, content: string }`. That's it. No tool calls, no metadata, no custom rendering.

9. **Clerk auth baked in everywhere.** Auth checks in the route layout, Clerk provider wrapping the app. Would need complete removal.

**What is worth stealing:**
- Zeego context menu pattern for chat items in drawer (the only candidate that demonstrates this)
- HeaderDropDown component for model selection
- The general Expo Router drawer nesting pattern `(auth)/(drawer)/(chat)/[id]`

**Confidence: HIGH** -- Code directly inspected.

---

### 3. Vali-98/ChatterUI [GOOD REFERENCE, WRONG LICENSE]

**Repository:** https://github.com/Vali-98/ChatterUI
**Stars:** 2,200 | **Commits:** 1,364 | **Last active:** 2026 | **License:** AGPL-3.0

**Strengths:**
- Most feature-complete open-source RN LLM chat app. 88 releases. Active development.
- Zustand 5 for state management
- Drizzle ORM for SQLite (more sophisticated than raw queries)
- react-native-keyboard-controller
- Reanimated 4.1
- Custom drawer implementation
- `@legendapp/list` -- actually uses legend-list!
- Expo Router (SDK 53)
- React Compiler integration (bleeding edge)

**Problems:**
- **AGPL-3.0 license** -- This is a copyleft license. Any derivative work must also be AGPL-licensed and source code must be distributed. This is a non-starter for Loom if there is ever any plan to distribute it commercially or keep the source private.
- Expo 53, not 54 -- one version behind
- RN 0.79, not 0.81 -- two minor versions behind
- On-device LLM focused (cui-llama.rn) -- same replacement needed as Private Mind
- UI is functional but not ChatGPT-polished

**What is worth studying:**
- How it integrates legend-list for chat messages
- Drizzle ORM patterns if we ever want to upgrade from raw expo-sqlite
- Custom drawer implementation details
- React Compiler setup for future adoption

**Confidence: HIGH** -- Code directly inspected.

---

### 4. aws-samples/swift-chat [ARCHITECTURE REFERENCE ONLY]

**Repository:** https://github.com/aws-samples/swift-chat
**Stars:** 770 | **License:** MIT-0 | **Last active:** 2026

**Strengths:**
- Production-quality multi-provider streaming (Bedrock, Ollama, DeepSeek, OpenAI)
- Most sophisticated markdown rendering in any RN chat app (tables, LaTeX, Mermaid, code highlighting)
- Background task management with iOS Live Activity
- react-native-keyboard-controller
- Reanimated
- Drawer navigation
- RN 0.83 (newest version)

**Problems:**
- **Not Expo.** Bare React Native. No Expo Router, no Expo modules. Completely different build system.
- AWS Lambda/API Gateway backend -- irrelevant to Loom
- Uses react-native-marked for markdown -- different from Loom's react-native-enriched-markdown
- React Navigation (not Expo Router)

**What is worth studying:**
- Custom markdown renderer with chunked code view, Mermaid, LaTeX
- Multi-provider streaming patterns in `/src/api/`
- Citation badge/modal pattern for source attribution
- ScrollToBottomButton implementation
- Model selection modal

**Confidence: HIGH** -- Code directly inspected.

---

### 5. expo-ai-chatbot-lite [INTERESTING BUT INCOMPLETE]

**Repository:** https://github.com/expo-ai-chatbot/expo-ai-chatbot-lite
**Stars:** 390 | **Last commit:** Feb 2025

**Strengths:**
- Uses Vercel AI SDK 5 with tool invocations (WeatherCard example)
- NativeWind styling (className-based)
- Drawer content component
- Design system with color scheme provider (light/dark, platform-specific)
- Supabase auth
- Parts-based message model (AI SDK 5 `parts` array) -- actually extensible

**Problems:**
- Incomplete. "Lite" version of a paid product. Skeleton quality.
- chat-interface.tsx is a **plain ScrollView** with no virtualization, no keyboard handling, no optimizations
- No Zustand, no real state management
- No streaming visualization -- just a loading spinner
- Uses `@react-native-community/hooks` for keyboard (dated approach)
- Message rendering is a big inline conditional in ScrollView.map()
- Last commit Feb 2025 -- potentially abandoned

**What is worth studying:**
- AI SDK 5 message `parts` array concept for tool invocations
- NativeWind design system pattern (color scheme context/provider split)
- Supabase auth integration pattern

**Confidence: MEDIUM** -- Code inspected but appears abandoned.

---

### 6. dabit3/react-native-ai [OUTDATED]

**Repository:** https://github.com/dabit3/react-native-ai
**Stars:** 1,300 | **Commits:** 112 | **License:** MIT

**What it is:** Full-stack framework (mobile + Express proxy + multi-provider). 5 themes. Multi-modal (text, image, code).

**Problems:**
- Not Expo (or unclear Expo integration)
- 88% TypeScript (mixed JS/TS)
- Express server architecture is irrelevant to Loom
- No recent updates aligned with current RN/Expo versions
- More of a demo framework than a production app

**Not recommended for any purpose.** Too outdated, too different from Loom's architecture.

**Confidence: MEDIUM** -- README + partial code inspection.

---

## Commercial Templates Assessment

### Luna (native-templates.com) -- $99

**Stack:** Expo SDK 54, RN 0.81, NativeWind, TypeScript 5.9
**Features:** 15+ screens, multi-provider (OpenAI, Gemini, Claude), streaming, speech-to-text, markdown, dark/light mode, onboarding, marketplace
**Includes:** CLAUDE.md for AI assistant development

**Assessment:** The stack match is excellent. However:
- Code quality unknown (can't inspect before purchase)
- No GitHub stars or community validation
- HN discussion suggests these are "single screen" reference implementations, not full apps
- $99 is trivial if the code is good, but returning templates is typically hard
- No drawer sidebar mentioned specifically -- "15 screens" could be anything

**Verdict:** Worth buying purely for reference, but LOW confidence it replaces the need for architectural study of Private Mind. The risk is it's NativeWind-styled screens without depth (no keyboard handling, no streaming optimizations, no state management patterns).

### Instamobile AI Chat Template -- ~$99-149

**Stack:** React Native, Firebase backend
**Assessment:** Firebase-centric, person-to-person messaging patterns, not AI-chat-optimized. The typing indicators and read receipts are for human chat, not LLM streaming. **Skip.**

### Expo AI Chatbot Pro (expoaichatbot.com)

**Stack:** Expo Router + React Server Components + AI SDK
**Assessment:** Uses experimental RSC in Expo Router. Cutting-edge but fragile. The lite version (inspected above) was mediocre quality. **Skip.**

---

## Recommendation

### Strategy: Study, Don't Fork

**Do not fork any repository.** Here is why:

1. **Loom's data layer is fundamentally different.** Every clone either uses direct API calls (OpenAI SDK) or local inference (executorch/llama.cpp). Loom uses a custom WebSocket multiplexer with server-side session management, streaming, and tool calls. This is the core of the app, and it cannot come from a clone.

2. **Loom already has a mobile/ scaffold** with the right stack (Expo 54, RN 0.81, Expo Router, NativeWind, Zustand). The scaffold needs better components, not a different scaffold.

3. **Forking creates tech debt.** You inherit every decision the original author made, including ones that don't fit (Clerk auth, RevenueCat, executorch deps, wrong color palette, wrong message types). Removing unwanted code is often harder than building from scratch.

4. **The Soul doc demands custom design.** No clone matches Loom's spring configurations, warm charcoal palette, or dynamic color system. The visual layer must be built from scratch regardless.

### What to Do Instead

**Phase 1: Transplant Patterns from Private Mind**

These patterns transfer directly with minimal adaptation:

| Pattern | Source File | What to Take |
|---------|------------|--------------|
| Drawer layout | `app/(drawer)/_layout.tsx` | `drawerType: 'slide'`, `swipeEdgeWidth: width`, custom drawer content |
| Session grouping | `components/drawer/DrawerMenu.tsx` | `getRelativeDateSection()` and `groupChatsByDate()` functions |
| Drawer items | `components/drawer/DrawerItem.tsx` | Active state highlighting, icon + label layout |
| Chat screen composition | `components/chat-screen/ChatScreen.tsx` | Messages + ChatBar + BottomSheets composition |
| Composer | `components/chat-screen/ChatBar.tsx` | Input + actions + prompt suggestions layout, imperative ref for clear/setInput |
| Message rendering | `components/chat-screen/MessageItem.tsx` | Role-based rendering, thinking block parsing, long-press for bottom sheet |
| Zustand chat store | `store/chatStore.ts` | Session CRUD, phantom chat pattern for new sessions |
| Zustand LLM store | `store/llmStore.ts` | Generation state machine (start/generating/complete), interrupt pattern |
| SQLite repository | `database/chatRepository.ts` | Typed repository functions, message persistence |
| Theme system | `styles/colors.ts` + `context/ThemeContext.tsx` | Typed theme with insets, `createStyles(theme)` pattern |
| Prompt suggestions | `components/chat-screen/PromptSuggestions.tsx` | Empty state suggestions below composer |

**Phase 2: Add What Private Mind Lacks**

| Feature | Source | What to Build |
|---------|--------|---------------|
| Zeego context menus | Galaxies-dev drawer pattern | Long-press on session items and messages |
| legend-list for messages | ChatterUI pattern | Replace ScrollView with legend-list `alignItemsAtEnd` |
| Markdown streaming | swift-chat markdown pipeline | Study chunked rendering approach |
| Tool call cards | expo-ai-chatbot-lite `parts` array | Message parts model for mixed content types |
| Spring animations | Loom Soul doc | Apply spring configs to all Private Mind components |
| NativeWind styling | Loom existing setup | Gradually replace StyleSheet.create with className |
| Warm charcoal theme | Soul doc color tokens | Replace Private Mind's blue/navy palette |

**Phase 3: Build Loom-Specific Features**

These have no clone precedent:
- Permission request cards with approve/deny
- Git status visualization
- Multi-provider tab switching
- Tool call registry with custom renderers
- Token budget display
- WebSocket reconnection with AppState

### Integration with Loom's shared/ Workspace

The shared/ workspace already has store factories, API client, WebSocket client, and multiplexer. The integration plan:

1. **Stores:** Private Mind's `chatStore` pattern maps to shared's `createTimelineStore(adapter)`. Use the store factory with MMKV adapter. Add Private Mind's phantom chat pattern.

2. **Streaming:** Replace Private Mind's executorch token callback with shared's multiplexer `onChunk` handler. The state update pattern (append to last message) is identical.

3. **Message types:** Extend Private Mind's `Message` type with shared's tool call and permission types. MessageItem gets additional role-based render paths.

4. **Auth:** Replace Private Mind's (no auth) with Loom's existing JWT auth via expo-secure-store.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Private Mind patterns don't fit Loom's needs | LOW | Code is inspected; architecture is close |
| NativeWind conflicts with StyleSheet.create patterns | MEDIUM | Gradual migration; both can coexist |
| legend-list doesn't work well with streaming | MEDIUM | FlashList v2 as fallback; test early |
| Soul doc visual layer takes longer than chat foundation | HIGH | Budget accordingly; chat functionality first, polish second |
| Private Mind MIT license doesn't cover pattern transplant | LOW | MIT allows any use; we're studying patterns not copying files wholesale |

---

## Sources

### Repositories (code directly inspected)
- [software-mansion-labs/private-mind](https://github.com/software-mansion-labs/private-mind) -- PRIMARY reference
- [Galaxies-dev/chatgpt-clone-react-native](https://github.com/Galaxies-dev/chatgpt-clone-react-native) -- Zeego patterns only
- [Vali-98/ChatterUI](https://github.com/Vali-98/ChatterUI) -- legend-list reference, AGPL (study only)
- [aws-samples/swift-chat](https://github.com/aws-samples/swift-chat) -- Markdown/streaming reference
- [expo-ai-chatbot/expo-ai-chatbot-lite](https://github.com/expo-ai-chatbot/expo-ai-chatbot-lite) -- AI SDK 5 message parts
- [dabit3/react-native-ai](https://github.com/dabit3/react-native-ai) -- Not recommended

### Commercial Templates
- [Luna AI Chat Template](https://www.native-templates.com/templates/aichat) -- $99, potentially useful
- [Instamobile AI Chat](https://instamobile.io/app-templates/chatgpt-react-native/) -- Skip (Firebase-centric)
- [Expo AI Chatbot Pro](https://www.expoaichatbot.com/) -- Skip (experimental RSC)

### Other References
- [EvanBacon/expo-ai](https://github.com/EvanBacon/expo-ai) -- 841 stars, RSC demo, not production app
- [GAIA UI Composer](https://ui.heygaia.io/docs/components/composer) -- Best composer design spec
- [Mobbin ChatGPT iOS screens](https://mobbin.com/explore/screens/f7e6514e-4106-4b5a-8c37-1b86aa42a9f1) -- Design reference
