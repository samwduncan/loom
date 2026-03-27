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

export interface ResultTokens {
  input: number;
  output: number;
  cacheRead?: number;
}

interface StreamState {
  // Data
  isStreaming: boolean;
  activeSessionId: string | null;
  activeToolCalls: ToolCallState[];
  thinkingState: ThinkingState | null;
  activityText: string;
  activePermissionRequest: PermissionRequest | null;
  resultTokens: ResultTokens | null;
  resultCost: number | null;
  tokenBudget: { used: number; total: number } | null;
  modelName: string | null;
  // Live session attach
  liveAttachedSessions: Set<string>;
  // Background completion notifications
  notifiedSessions: Set<string>;

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
  setResultData: (tokens: ResultTokens, cost: number, modelName?: string) => void;
  setTokenBudget: (used: number, total: number) => void;
  attachLiveSession: (sessionId: string) => void;
  detachLiveSession: (sessionId: string) => void;
  isSessionLiveAttached: (sessionId: string) => boolean;
  addNotifiedSession: (sessionId: string) => void;
  clearNotifiedSession: (sessionId: string) => void;
  reset: () => void;
}

const INITIAL_STREAM_STATE = {
  isStreaming: false,
  activeSessionId: null as string | null,
  activeToolCalls: [] as ToolCallState[],
  thinkingState: null as ThinkingState | null,
  activityText: '',
  activePermissionRequest: null as PermissionRequest | null,
  resultTokens: null as ResultTokens | null,
  resultCost: null as number | null,
  tokenBudget: null as { used: number; total: number } | null,
  modelName: null as string | null,
  liveAttachedSessions: new Set<string>(),
  notifiedSessions: new Set<string>(),
};

export const useStreamStore = create<StreamState>()((set, get) => ({
  ...INITIAL_STREAM_STATE,

  startStream: () => {
    set({ isStreaming: true, resultTokens: null, resultCost: null, tokenBudget: null, modelName: null });
  },

  setActiveSessionId: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  endStream: () => {
    // Explicitly reset each field — preserving resultTokens/resultCost which
    // are read by ActiveMessage's handleFlush AFTER isStreaming transitions false.
    // Cleaned on next startStream. Explicit fields prevent silent zeroing if
    // new state fields are added later.
    set({
      isStreaming: false,
      activeToolCalls: [],
      thinkingState: null,
      activityText: '',
      activePermissionRequest: null,
      activeSessionId: null,
      // resultTokens and resultCost intentionally preserved for handleFlush
    });
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

  setResultData: (tokens: ResultTokens, cost: number, modelName?: string) => {
    set({ resultTokens: tokens, resultCost: cost, ...(modelName ? { modelName } : {}) });
  },

  setTokenBudget: (used: number, total: number) => {
    set({ tokenBudget: { used, total } });
  },

  attachLiveSession: (sessionId: string) => {
    set((state) => ({
      liveAttachedSessions: new Set([...state.liveAttachedSessions, sessionId]),
    }));
  },

  detachLiveSession: (sessionId: string) => {
    set((state) => {
      const next = new Set(state.liveAttachedSessions);
      next.delete(sessionId);
      return { liveAttachedSessions: next };
    });
  },

  isSessionLiveAttached: (sessionId: string) => {
    return get().liveAttachedSessions.has(sessionId);
  },

  addNotifiedSession: (sessionId: string) => {
    set((state) => ({
      notifiedSessions: new Set([...state.notifiedSessions, sessionId]),
    }));
  },

  clearNotifiedSession: (sessionId: string) => {
    set((state) => {
      const next = new Set(state.notifiedSessions);
      next.delete(sessionId);
      return { notifiedSessions: next };
    });
  },

  reset: () => {
    set({ ...INITIAL_STREAM_STATE, liveAttachedSessions: new Set<string>(), notifiedSessions: new Set<string>() });
  },
}));

// Expose store on window in dev mode for E2E testing (Playwright).
// Tree-shaken in production builds.
if (import.meta.env.DEV) {
  // ASSERT: dev-only window exposure for E2E testing; tree-shaken in production
  (window as unknown as Record<string, unknown>).__ZUSTAND_STREAM_STORE__ = useStreamStore;
}
