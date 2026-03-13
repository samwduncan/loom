/**
 * Timeline Store — Session history and message management.
 *
 * Uses Immer middleware (innermost) for readable nested mutations on
 * Session > Messages > Metadata/ToolCalls, and Persist middleware (outermost)
 * for localStorage with metadata-only session persistence (no messages).
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message } from '@/types/message';
import type { ProviderId } from '@/types/provider';
import type { Session } from '@/types/session';

interface TimelineState {
  // Data
  sessions: Session[];
  activeSessionId: string | null;
  activeProviderId: ProviderId;

  // Actions
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<Message>,
  ) => void;
  clearSession: (sessionId: string) => void;
  replaceSessionId: (oldId: string, newId: string) => void;
  prependMessages: (sessionId: string, messages: Message[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  reset: () => void;
}

/** Shape of the partialized state persisted to localStorage. */
interface PersistedTimelineState {
  sessions: Array<
    Pick<
      Session,
      'id' | 'title' | 'providerId' | 'createdAt' | 'updatedAt' | 'metadata'
    >
  >;
  activeSessionId: string | null;
  activeProviderId: ProviderId;
}

const INITIAL_TIMELINE_STATE = {
  sessions: [] as Session[],
  activeSessionId: null as string | null,
  activeProviderId: 'claude' as ProviderId,
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    immer((set) => ({
      ...INITIAL_TIMELINE_STATE,

      addSession: (session: Session) => {
        set((state) => {
          state.sessions.push(session);
        });
      },

      removeSession: (sessionId: string) => {
        set((state) => {
          state.sessions = state.sessions.filter((s) => s.id !== sessionId);
          if (state.activeSessionId === sessionId) {
            state.activeSessionId = null;
          }
        });
      },

      setActiveSession: (sessionId: string | null) => {
        set((state) => {
          state.activeSessionId = sessionId;
        });
      },

      addMessage: (sessionId: string, message: Message) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            session.messages.push(message);
            session.updatedAt = new Date().toISOString();
          }
        });
      },

      updateMessage: (
        sessionId: string,
        messageId: string,
        updates: Partial<Message>,
      ) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            const message = session.messages.find((m) => m.id === messageId);
            if (message) {
              Object.assign(message, updates);
            }
          }
        });
      },

      clearSession: (sessionId: string) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            session.messages = [];
          }
        });
      },

      replaceSessionId: (oldId: string, newId: string) => {
        set((state) => {
          if (state.sessions.some((s) => s.id === newId)) {
            console.warn(`replaceSessionId: newId "${newId}" already exists, aborting`);
            return;
          }
          const session = state.sessions.find((s) => s.id === oldId);
          if (session) {
            session.id = newId;
          }
          if (state.activeSessionId === oldId) {
            state.activeSessionId = newId;
          }
        });
      },

      prependMessages: (sessionId: string, messages: Message[]) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            session.messages.unshift(...messages);
          }
        });
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            session.title = title;
          }
        });
      },

      reset: () => {
        set((state) => {
          state.sessions = INITIAL_TIMELINE_STATE.sessions;
          state.activeSessionId = INITIAL_TIMELINE_STATE.activeSessionId;
          state.activeProviderId = INITIAL_TIMELINE_STATE.activeProviderId;
        });
      },
    })),
    {
      name: 'loom-timeline',
      version: 1,
      partialize: (state) => ({
        sessions: state.sessions.map((s) => ({
          id: s.id,
          title: s.title,
          providerId: s.providerId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          metadata: s.metadata,
        })),
        activeSessionId: state.activeSessionId,
        activeProviderId: state.activeProviderId,
      }),
      migrate: (persistedState: unknown, _version: number) => {
        // Version 1: initial schema, no migration needed
        // SAFETY: migrate receives the persisted shape we defined via partialize
        return persistedState as PersistedTimelineState;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TimelineState> & {
          sessions?: Array<Partial<Session>>;
        };

        // Rehydrated sessions need empty messages arrays since messages
        // are never persisted — always fetched from backend on demand.
        const rehydratedSessions = (persisted.sessions ?? []).map((s) => ({
          ...s,
          messages: [],
        })) as Session[];

        return {
          ...currentState,
          ...persisted,
          sessions: rehydratedSessions,
        };
      },
    },
  ),
);
