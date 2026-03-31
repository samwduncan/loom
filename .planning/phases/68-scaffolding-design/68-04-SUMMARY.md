---
phase: 68-scaffolding-design
plan: 04
subsystem: ui
tags: [nativewind, tailwind, design-tokens, primitives, expo-blur, react-native]

# Dependency graph
requires:
  - "68-03: Expo SDK 54 app scaffold with Drawer+Stack navigation"
provides:
  - "NativeWind tailwind.config.js with full UI-SPEC color, typography, spacing tokens"
  - "5 design system primitives: SurfaceCard, TextHierarchy, Button, ListItem, GlassSurface"
  - "Design primitives showcase screen at /(stack)/design-primitives"
  - "Navigation link from session list placeholder to design primitives screen"
affects: [68-05, 68-06, 69, 70, 71, 72, mobile]

# Tech tracking
tech-stack:
  added: []
  patterns: ["NativeWind className prop forwarding on all primitives", "iOS shadow style objects (shadowColor/Offset/Opacity/Radius) alongside NativeWind shadow-md", "Pressable opacity press state pattern for buttons and list items", "expo-blur BlurView with dark tint overlay for glass surfaces", "Variant mapping object pattern for text hierarchy (variantClasses Record)"]

key-files:
  created:
    - "mobile/tailwind.config.js"
    - "mobile/components/primitives/SurfaceCard.tsx"
    - "mobile/components/primitives/TextHierarchy.tsx"
    - "mobile/components/primitives/Button.tsx"
    - "mobile/components/primitives/ListItem.tsx"
    - "mobile/components/primitives/GlassSurface.tsx"
    - "mobile/app/(stack)/design-primitives.tsx"
  modified:
    - "mobile/app/(drawer)/index.tsx"

key-decisions:
  - "iOS shadow style objects used alongside NativeWind shadow-md -- RN shadow mapping is unreliable, explicit style ensures correct rendering"
  - "Pressable with opacity style callback for press states -- cleaner than TouchableOpacity and supports disabled state"
  - "GlassSurface wraps BlurView in container View for className support -- BlurView doesn't support NativeWind className directly"
  - "Session list placeholder uses inline styles (not NativeWind) to match Plan 03 pattern -- NativeWind tokens now available but consistency with existing screens"

patterns-established:
  - "Primitive className forwarding: all primitives accept className prop, append to internal classes"
  - "SurfaceCard shadow pattern: NativeWind bg/border/rounded + explicit iOS shadow style object"
  - "Text variant pattern: Record<variant, classString> mapping for LoomText component"
  - "Press state pattern: Pressable style={({ pressed }) => ({ opacity: ... })} for feedback"

requirements-completed: [SCAFF-06]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 68 Plan 04: NativeWind Theme Tokens + Design Primitives Summary

**NativeWind configured with full UI-SPEC token set (4 surfaces, accent palette, 3 text tiers, 4 font sizes) and 5 design primitives validating the styling pipeline end-to-end**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T15:05:48Z
- **Completed:** 2026-03-31T15:07:52Z
- **Tasks:** 2 of 2 auto tasks completed (checkpoint auto-approved)
- **Files modified:** 8

## Accomplishments

- Created `mobile/tailwind.config.js` with complete UI-SPEC design tokens:
  - 4 surface colors (sunken, base, raised, overlay) -- warm charcoal palette
  - Accent palette (DEFAULT, hover, muted, fg) -- dusty rose/terracotta
  - 3 text tiers (primary, secondary, muted)
  - Semantic colors (destructive, success, warning, info)
  - 2 border tokens (subtle, interactive)
  - 4 font sizes (xs 12px, sm 14px, base 15px, lg 17px) matching iOS Dynamic Type "Large"
  - Font families (Inter for sans, JetBrains Mono for mono)
- Built 5 design system primitives in `mobile/components/primitives/`:
  - **SurfaceCard:** Elevated card with bg-surface-raised, subtle border, iOS shadow, rounded-xl
  - **TextHierarchy (LoomText):** 4 variants (heading/body/caption/code) with correct sizes and weights
  - **Button:** Primary/secondary variants, 44px min touch target, press opacity, disabled state
  - **ListItem:** 56px min height, press color shift, subtitle, chevron, border separator
  - **GlassSurface:** expo-blur BlurView with intensity 40, dark tint, rgba overlay
- Created design primitives showcase screen rendering all 5 components with labeled sections
- Added "View Design Primitives" navigation button on session list placeholder

## Task Commits

1. **Task 1: Configure NativeWind theme tokens and build 5 design primitives** - `33b0101` (feat)
2. **Task 2: Create design primitives test screen and link from navigation** - `9473577` (feat)

## Files Created/Modified

- `mobile/tailwind.config.js` - NativeWind theme with full UI-SPEC token set
- `mobile/components/primitives/SurfaceCard.tsx` - Elevated card with shadow and subtle border
- `mobile/components/primitives/TextHierarchy.tsx` - LoomText with heading/body/caption/code variants
- `mobile/components/primitives/Button.tsx` - Primary/secondary button with 44px touch target
- `mobile/components/primitives/ListItem.tsx` - List row with press state, subtitle, chevron
- `mobile/components/primitives/GlassSurface.tsx` - Blur surface using expo-blur BlurView
- `mobile/app/(stack)/design-primitives.tsx` - Showcase screen for all 5 primitives
- `mobile/app/(drawer)/index.tsx` - Added "View Design Primitives" navigation button

## Decisions Made

1. **iOS shadow style objects alongside NativeWind shadow-md:** React Native's shadow prop mapping through NativeWind is unreliable across different RN versions. Explicit `shadowColor/shadowOffset/shadowOpacity/shadowRadius` style objects guarantee correct iOS rendering regardless of NativeWind's shadow utility mapping.

2. **Pressable over TouchableOpacity for Button/ListItem:** Pressable supports `style` as a function of press state and integrates better with the `disabled` prop. TouchableOpacity is a legacy component. Pressable is the React Native team's recommended replacement.

3. **GlassSurface wraps BlurView in container View:** BlurView from expo-blur does not support NativeWind's `className` prop directly. The container View handles className-based layout (overflow-hidden, rounded-2xl, border) while BlurView handles the blur effect.

4. **Session list placeholder retains inline styles:** Plan 03 established inline styles for placeholder screens (since NativeWind tokens weren't available yet). The navigation button on the session list uses inline styles for consistency with the existing screen. The design-primitives screen itself uses NativeWind classes to validate the pipeline.

## Deviations from Plan

None -- plan executed exactly as written.

## Device Verification Needed

The following must be verified on an iPhone 16 Pro Max once an EAS development build is available:

1. **Typography:** Heading 17px/semibold, body 15px/regular, caption 12px/muted, code 14px/mono
2. **Surface Card:** Visible shadow, raised background lighter than screen bg, rounded corners
3. **Buttons:** Accent color visible, 44px+ tappable height, press opacity feedback, disabled faded
4. **List Items:** Press color shift, chevron visible, subtle bottom border
5. **Glass Surface:** Blur effect renders, dark tint overlay visible, content readable
6. **Surface palette:** 4 surfaces show progressive lightness (sunken darkest, overlay lightest)
7. **Overall:** Warm color temperature, density comparable to ChatGPT/Claude iOS

## Known Stubs

None -- all components are fully implemented with production-quality token mappings.

## Self-Check: PASSED

- All 8 files verified present on disk
- All 2 task commits verified in git log (33b0101, 9473577)
- No known stubs

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
