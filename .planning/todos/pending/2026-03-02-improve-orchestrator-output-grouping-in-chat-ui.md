---
created: 2026-03-02T20:28:27.414Z
title: Improve orchestrator output grouping in chat UI
area: ui
files:
  - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
  - src/components/chat/view/subcomponents/TurnBlock.tsx
  - src/components/chat/view/subcomponents/MessageComponent.tsx
---

## Problem

When Claude runs multi-step orchestration (like GSD execute-phase), all output collapses into a single collapsible line. The user has to open it and scroll to see important messages like checkpoint prompts. This makes orchestrated workflows hard to follow in real-time.

The ideal UX would be closer to Claude Code CLI — where the AI's direct messages to the user are visible at the top level, while individual tool calls and subagent work are grouped and collapsed underneath. Currently the TurnBlock system groups everything from an AI turn into one collapsible block, which works for simple conversations but not for long orchestration runs.

## Solution

Consider splitting orchestrator output so that:
- Direct text messages from Claude appear as visible top-level content
- Tool calls and subagent work collapse into grouped sections
- The user can follow the flow without expanding a single massive collapsed block
- May require changes to how TurnBlock decides what to show in collapsed vs expanded state
