# Visual Clone Brief — ChatGPT iOS Parity

**Date:** 2026-04-05
**Source:** Bard design audit + Galaxies-dev code analysis + Phase 76.1 AR findings
**Reference repo:** `/tmp/chatgpt-clone-react-native` (Galaxies-dev, cloned)
**Approach:** Direct implementation, no GSD. Edit → verify TS → commit. Repeat.

---

## Reference Values from Galaxies-dev (React Native ChatGPT clone)

These are the EXACT values from a working ChatGPT clone in our stack (Expo Router, FlashList, BlurView, Reanimated, zeego):

### Message Layout
- Message row: `paddingHorizontal: 14, gap: 14, marginVertical: 12`
- Avatar: `30x30, borderRadius: 15` (not 24x24)
- Text: `fontSize: 16, padding: 4` (not 15px — 16px prevents iOS auto-zoom)
- Bot avatar: 28x28 container with `borderRadius: 15`, 16x16 icon inside

### Composer (MessageInput)
- Wrapper: `BlurView intensity={90} tint="extraLight"` (light mode) — for dark: `intensity={40} tint="dark"`
- Input: `borderRadius: 20` (pill shape, NOT 12px rectangle)
- Input border: `StyleSheet.hairlineWidth` (not 1px)
- Input padding: `10` (not 16)
- Row padding: `paddingHorizontal: 20`
- Send icon: `Ionicons arrow-up-circle, 24px` — conditional on message.length > 0

### Drawer
- Uses built-in `DrawerItemList` with `drawerActiveBackgroundColor` (rounded-rect pill highlight)
- `drawerItemStyle: { borderRadius: 12 }` — NOT left accent border
- `drawerLabelStyle: { marginLeft: -20 }` (tighter label spacing)
- Width: `dimensions.width * 0.86`
- Search bar: `borderRadius: 10, height: 34` with search icon
- Footer: user avatar `40x40 borderRadius: 10` + name + ellipsis menu
- Overlay: `rgba(0, 0, 0, 0.2)` (subtle, not 0.4)

### Empty State
- Centered logo: `50x50` black circle with `30x30` icon inside (not 24px)
- Positioned at `marginTop: height / 2 - 100` (vertically centered)
- Suggestion chips: horizontal ScrollView with `gap: 16, paddingHorizontal: 20, paddingVertical: 10`
- Chip style: `padding: 14, borderRadius: 10`, title `fontSize: 16 fontWeight: 500`, subtitle `fontSize: 14`

### Header
- Uses `zeego/dropdown-menu` for model picker (tappable, not static label)
- Title: `fontWeight: 500, fontSize: 16`
- New chat icon top-right: `Ionicons create-outline, 24px`

### Chat Page
- Uses `FlashList` (not FlatList): `estimatedItemSize={400}`
- Content padding: `paddingTop: 30, paddingBottom: 150`
- KeyboardAvoidingView: absolute bottom, `keyboardVerticalOffset: 70`

### Native Context Menus (zeego)
- Messages: Copy, Save to Photos, Share
- Sessions: Rename, Delete (with native iOS context menu preview)

---

## 14 Changes To Make (priority order)

### CRITICAL (app looks amateur without these)
1. **Drawer selection: left border → rounded-rect background** — Use `drawerActiveBackgroundColor` + `drawerItemStyle: { borderRadius: 12 }` like Galaxies-dev. Remove 3px left accent border from SessionItem.
2. **Composer input shape: rectangle → pill** — `borderRadius: 12` → `20`. Border: `StyleSheet.hairlineWidth`. Padding: `10` not `16/8`.
3. **Font size: 15px → 16px** — Prevents iOS auto-zoom. Update `theme.typography.body.fontSize` from 15 to 16.
4. **Empty state: tiny icon → launchpad** — Icon 24px → 50px circle with 30px icon. Add suggestion chips (horizontal scroll).

### HIGH (noticeable quality gap)
5. **Avatar: 24px → 30px** — Update AssistantMessage avatar and EmptyChat avatar.
6. **Remove glow shadow** from composer send button — Delete `theme.shadows.glow(accent)` usage.
7. **Remove drop shadow from user bubbles** — Remove `theme.shadows.subtle` from UserBubble inline style. Use contrast only.
8. **Header model indicator → tappable** — Currently static Text. Make it a Pressable or use zeego dropdown.
9. **Header bottom border → remove** — Glass blur edge should define the header, not a hard 1px line.
10. **Drawer branding: 28px → 17px** — "Loom" largeTitle → heading typography.

### MEDIUM (polish)
11. **FlatList → FlashList** — `@shopify/flash-list`, `estimatedItemSize={400}`. Fixes streaming jank.
12. **Drawer overlay: 0.4 → 0.2** — Subtle overlay like Galaxies-dev.
13. **Thinking segment height: 44px → 32px** — Less button-like, more subtle.
14. **Add zeego context menus** — Long-press on messages (copy) and sessions (rename, delete).

### Files to modify
- `mobile/theme/theme.ts` — fontSize 15→16, largeTitle size
- `mobile/components/chat/UserBubble.tsx` — remove shadow
- `mobile/components/chat/AssistantMessage.tsx` — avatar 24→30
- `mobile/components/chat/Composer.tsx` — pill shape, remove glow, font 16
- `mobile/components/chat/EmptyChat.tsx` — bigger icon, suggestion chips
- `mobile/components/chat/MessageList.tsx` — FlatList → FlashList
- `mobile/components/chat/segments/ThinkingSegment.tsx` — height 44→32
- `mobile/components/navigation/ChatHeader.tsx` — remove bottom border, tappable model
- `mobile/components/navigation/DrawerContent.tsx` — branding size, overlay
- `mobile/components/navigation/SessionItem.tsx` — remove left border, use bg highlight
- `mobile/app/(drawer)/_layout.tsx` — drawerActiveBackgroundColor, borderRadius 12, overlay 0.2

### Dependencies to install
- `@shopify/flash-list` — FlashList for streaming performance
- `zeego` — Native iOS context menus and dropdown menus (optional, can defer)
