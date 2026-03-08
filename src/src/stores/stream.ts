/**
 * Stream Store — Ephemeral streaming state for active AI responses.
 *
 * Vanilla Zustand (no middleware). Never persisted. Resets on page reload
 * and when streaming ends. The rAF token buffer reads from useRef, not
 * this store — this store tracks tool calls, thinking, and activity text.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import type { ThinkingState, ToolCallState } from '@/types/stream';

export interface PermissionRequest {
  requestId: string;
  toolName: string;
  input: unknown;
  sessionId: string | null;
  receivedAt: number;
}

interface StreamState {
  // Data
  isStreaming: boolean;
  activeSessionId: string | null;
  activeToolCalls: ToolCallState[];
  thinkingState: ThinkingState | null;
  activityText: string;
  activePermissionRequest: PermissionRequest | null;

  // Actions
  startStream: () => void;
  endStream: () => void;
  setActiveSessionId: (sessionId: string) => void;
  addToolCall: (toolCall: ToolCallState) => void;
  updateToolCall: (
    toolCallId: string,
    updates: Partial<ToolCallState>,
  ) => void;
  setThinkingState: (thinkingState: ThinkingState | null) => void;
  setActivityText: (text: string) => void;
  setPermissionRequest: (request: PermissionRequest) => void;
  clearPermissionRequest: () => void;
  reset: () => void;
}

const INITIAL_STREAM_STATE = {
  isStreaming: false,
  activeSessionId: null as string | null,
  activeToolCalls: [] as ToolCallState[],
  thinkingState: null as ThinkingState | null,
  activityText: '',
  activePermissionRequest: null as PermissionRequest | null,
};

export const useStreamStore = create<StreamState>()((set) => ({
  ...INITIAL_STREAM_STATE,

  startStream: () => {
    set({ isStreaming: true });
  },

  setActiveSessionId: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  endStream: () => {
    set({ ...INITIAL_STREAM_STATE });
  },

  addToolCall: (toolCall: ToolCallState) => {
    set((state) => ({
      activeToolCalls: [...state.activeToolCalls, toolCall],
    }));
  },

  updateToolCall: (toolCallId: string, updates: Partial<ToolCallState>) => {
    set((state) => ({
      activeToolCalls: state.activeToolCalls.map((tc) =>
        tc.id === toolCallId ? { ...tc, ...updates } : tc,
      ),
    }));
  },

  setThinkingState: (thinkingState: ThinkingState | null) => {
    set({ thinkingState });
  },

  setActivityText: (text: string) => {
    set({ activityText: text });
  },

  setPermissionRequest: (request: PermissionRequest) => {
    set({ activePermissionRequest: request });
  },

  clearPermissionRequest: () => {
    set({ activePermissionRequest: null });
  },

  reset: () => {
    set({ ...INITIAL_STREAM_STATE });
  },
}));
