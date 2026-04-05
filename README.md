# Loom

An AI dev control plane. Web and iOS interfaces for managing AI coding sessions across Claude Code, Codex, and Gemini — with real-time streaming, tool call visualization, and session management.

![Screenshot placeholder](public/screenshots/desktop-main.png)

## Features

- **Real-time streaming chat** with live token rendering and tool call visualization
- **Multi-provider support** — Claude (SDK), Codex (child process), Gemini (child process)
- **Session management** — search, date grouping, swipe-to-delete, cross-device access
- **Permission approval cards** — inline Approve/Deny for tool use requests
- **Thinking block visualization** — collapsible reasoning/thinking sections
- **Code blocks** with syntax highlighting (Shiki)
- **Push notifications** on iOS via APNs
- **Glass morphism UI** — blur surfaces, layered depth, spring-based animations
- **Dark mode only** — near-black cool-neutral OKLCH palette
- **Integrated shell terminal** — direct CLI access through WebSocket

## Tech Stack

**Web App**
- React 19, Vite 7, TypeScript
- Tailwind CSS v4 (OKLCH color system)
- Zustand (5 stores: timeline, stream, ui, connection, file)
- Inter + JetBrains Mono

**iOS App** (in development)
- Expo SDK 53, React Native 0.79, expo-router
- Reanimated 3, expo-blur, MMKV
- LoomTheme design tokens, spring-based motion

**Backend**
- Express 4, better-sqlite3, ws (WebSocket)
- JWT auth, multi-provider process management
- SQLite cache with JSONL source of truth

**Shared**
- TypeScript types and store factories (`shared/`)
- Platform-agnostic adapters (localStorage / MMKV / Keychain)

## Getting Started

### Prerequisites

- Node.js v22+
- One or more AI CLIs installed: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex](https://developers.openai.com/codex), or Gemini CLI

### Web + Backend

```bash
git clone https://github.com/samwduncan/loom.git
cd loom
npm install
cp .env.example .env   # edit with your settings
npm run dev             # starts Vite dev server + backend
```

The web app runs at `http://localhost:5184` and the backend at port `5555`.

### iOS App

```bash
cd mobile
npm install
npx expo start
```

Requires Expo Go or a dev client build. For device builds:

```bash
npx eas build --profile development --platform ios
```

## Project Structure

```
loom/
  src/           Web app (React + Vite)
  server/        Backend (Express + WebSocket + SQLite)
  shared/        Shared types, store factories, constants
  mobile/        iOS app (Expo + React Native)
  public/        Static assets, screenshots
  .planning/     Project planning docs (not shipped)
```

### Key Directories

- `src/components/` — React components (chat, sidebar, tools, markdown)
- `src/stores/` — Zustand stores (timeline, stream, ui, connection, file)
- `server/routes/` — REST API endpoints
- `server/services/` — WebSocket handlers, session management
- `shared/types/` — TypeScript interfaces shared across web + mobile
- `mobile/app/` — Expo Router screens and layouts
- `mobile/components/` — React Native UI components
- `mobile/stores/` — Mobile Zustand stores (factory pattern)

## Architecture

```
Web App / iOS App
       |
   WebSocket + REST
       |
  Express Backend
       |
  +---------+---------+
  |         |         |
Claude    Codex    Gemini
 (SDK)   (child)  (child)
```

The backend spawns and manages AI CLI processes, streams their output over WebSocket to connected clients, and persists sessions in SQLite. The web and mobile frontends share TypeScript types and store logic through the `shared/` package.
