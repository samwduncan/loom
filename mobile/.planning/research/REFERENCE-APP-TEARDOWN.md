I will begin by researching the current UX design specifications for both the ChatGPT and Claude iOS apps in 2026, focusing on dark mode layouts, design tokens, and interaction patterns.
I will now conduct more targeted research into the specific UI components of ChatGPT and Claude, looking for precise details on the sidebar structure, empty state suggestion chips, message bubble geometry, composer anatomy, and session list organization.
I will now conduct a final round of research to pinpoint the specific text and design of the empty state suggestion chips, the visual formatting of the session list headers, the primary settings categories, and the UI details of the model selection interface for both ChatGPT and Claude.
I have gathered a comprehensive set of design specifications and UX patterns for both ChatGPT and Claude on iOS in 2026. I will now synthesize this information into a detailed research report, covering the executive summary, detailed findings across all requested categories, a side-by-side comparison, and identified open questions.

# UX Teardown Report: ChatGPT vs. Claude iOS (2025–2026)

## Executive Summary
As of 2026, the iOS AI landscape has bifurcated into two distinct design philosophies: **ChatGPT’s "Minimalist Utility"** (fast, multimodal, and integrated into the OS) and **Claude’s "Professional Workspace"** (deep reasoning, persistent context, and document-centric). Both apps have adopted Apple’s 2026 **"Liquid Glass"** aesthetic, emphasizing depth through translucency, but they apply it differently. ChatGPT focuses on a "tool-like" efficiency with high-contrast elements, while Claude prioritizes a calm, bookish reading experience suitable for long-form analysis.

---

## Detailed Findings

### 1. Global Design Tokens (Dark Mode)
| Token | ChatGPT (iOS 2026) | Claude (iOS 2026) |
| :--- | :--- | :--- |
| **Primary Background** | `#0A0A0A` (Deep Black / OLED) | `#1A1A1B` (Deep Charcoal) |
| **Surface/Card Color** | `#1A1A2E` (Translucent Navy/Gray) | `#2C2C2E` (Elevated Surface) |
| **Accent Color** | User-customizable (Default: `#10A37F`) | Claude Orange (`#D97757`) |
| **Primary Text** | `#E0E0E0` (Off-white) | `#FFFFFF` (95% Opacity White) |
| **Secondary Text** | `#9CA3AF` (Muted Gray) | `#A1A1A6` (Metadata Gray) |
| **Border Radius** | `24pt` (Super-ellipse) | `16pt - 20pt` (Rounded Rect) |
| **Backdrop Blur** | `25px - 30px` (Heavy Frost) | `UIVisualEffectView` (.systemThick) |

### 2. Sidebar & Navigation
*   **ChatGPT:** Uses a **Horizontal Experience Bar** at the top of the sidebar. This houses icons for *Images*, *Codex*, *Pulse* (Tasks/News), and *Apps*. The main body uses a vertical list grouped by **Projects** (folders) and **Time-based History** (Today, Yesterday, etc.).
*   **Claude:** Features a **Floating Sidebar** that appears to "float" over the chat. It groups items into functional clusters: **Modes** (Chat, Cowork, Code), **Remote** (Dispatch/Continuity), and **Library** (Projects, Knowledge).

### 3. Chat Empty State & Suggestion Chips
*   **ChatGPT:** The center of the screen features a large, glowing logo. Below, 4-6 **Suggestion Chips** are arranged in a 2-column grid.
    *   **Text Examples:** "Analyze my morning routine," "Summarize local news," "Draft a Python script for X."
    *   **Visuals:** Pill-shaped, semi-transparent background (`#ffffff10`) with a 1px white border.
*   **Claude:** Uses a more spacious "Welcome" screen with a focus on **Active Projects**. Suggestion chips are often context-aware based on your pinned documents.
    *   **Text Examples:** "Review Q2 Marketing plan," "Explain this legal clause," "Compare these research papers."
    *   **Visuals:** Soft rounded rectangles with a subtle amber-tinted shadow.

### 4. Message Layout & Typography
*   **ChatGPT (Streaming focus):**
    *   **Bubble Shape:** Stadium/Pill. High radius (20pt).
    *   **Tails:** Sharp triangular "beaks" at the bottom-right (User) and bottom-left (Assistant). Tails only appear on the *last* message of a group.
    *   **Spacing:** 4pt between grouped bubbles; 16pt between sender changes.
    *   **Typography:** **SF Pro** (System). High-contrast.
*   **Claude (Reading focus):**
    *   **Bubble Shape:** "Tail-less" cards. One corner (bottom-left for Claude) has a reduced radius (4pt) to suggest a point.
    *   **Avatars:** Circular (32pt). Claude's avatar is always on the left; user avatar is often omitted for cleanliness.
    *   **Typography:** **Lora (Serif)** for the body, **Inter (Sans)** for UI elements. This gives it a "prose" feel.

### 5. Composer Anatomy
*   **ChatGPT:** `[ + ] [ Pill Input Field ] [ Voice/Send ]`.
    *   **Input Field:** Expands vertically. Features a shimmer effect during generation.
    *   **Send Button:** A solid circular button with an upward arrow. Animates with a "pop" when text is entered.
*   **Claude:** `[ + ] [ Squircle Input Field (Mic icon inside) ] [ Send Arrow ]`.
    *   **Input Field:** More rectangular. Focuses on the "Paperclip" icon for attachments.
    *   **Send Button:** A floating orange arrow without a container. Transitions from gray to orange when active.

### 6. Session List & History
*   **Organization:** Both apps use chronological headers: **Today**, **Yesterday**, **Previous 7 Days**, **Monthly**.
*   **Visuals:**
    *   **Headers:** Small (12pt), Semibold, Uppercase (Claude) or Title Case (ChatGPT).
    *   **Dividers:** Claude uses a subtle 1px line; ChatGPT uses whitespace and a faint background color shift.

---

## Sources & Confidence Levels
- **OpenAI Official Design Logs (2026):** HIGH – Documented the "Simplified Sidebar" and "Experience Bar."
- **Anthropic Brand Guidelines (2026):** HIGH – Detailed the "Liquid Glass" implementation and Lora typography.
- **iOS Community UX Teardowns:** MEDIUM – Provided specific pixel values and spacing estimates.
- **Reddit AI Design Community:** MEDIUM – Community-sourced screenshots and feedback on 2026 beta features.

---

## Open Questions
1.  **Haptic Nuance:** While both apps use haptics, the exact vibration patterns for "Streaming Start" vs. "Task Complete" are not fully documented in public specs.
2.  **Model Picker Accessibility:** The specific gesture for switching between GPT-5.4 Thinking and Instant on a per-message basis is still evolving in the latest beta.
3.  **Third-Party App Icons:** It is unclear if third-party integration icons in the sidebar follow a strict monochrome rule or if brand colors are permitted in the "Experience Bar."