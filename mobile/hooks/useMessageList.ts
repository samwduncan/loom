/**
 * useMessageList -- manages message data for a chat session.
 *
 * Fetches persisted messages from the REST API and merges with live streaming
 * content from the WebSocket stream via subscribeContent on the WS client.
 *
 * During streaming, appends a virtual assistant DisplayMessage with isStreaming=true
 * whose content accumulates from content tokens. Timestamp gap logic per D-20:
 * show timestamp when 5+ minute gap between consecutive messages.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Message, ToolCall, ThinkingBlock } from '@loom/shared/types/message';
import { useStreamStore } from '../stores/index';
import { useTimelineStore } from '../stores/index';
import { getWsClient } from '../lib/websocket-init';
import { getStreamSnapshot, clearStreamSnapshot } from '../lib/websocket-init';
import { apiClient } from '../lib/api-client';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  showTimestamp: boolean;
  isStreaming: boolean;
  /** D-28: Message was interrupted by app backgrounding during stream */
  isInterrupted?: boolean;
  /** AR fix #5: Historical tool calls for segment rendering */
  toolCalls?: ToolCall[];
  /** AR fix #5: Historical thinking blocks for segment rendering */
  thinkingBlocks?: ThinkingBlock[];
}

interface UseMessageListReturn {
  messages: DisplayMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  fetchMessages: (projectName: string, sessionId: string) => Promise<void>;
}

/** 5 minutes in milliseconds */
const TIMESTAMP_GAP_MS = 5 * 60 * 1000;

function shouldShowTimestamp(current: string, previous: string | null): boolean {
  if (!previous) return true;
  const diff = new Date(current).getTime() - new Date(previous).getTime();
  return diff >= TIMESTAMP_GAP_MS;
}

function toDisplayMessages(messages: Message[]): DisplayMessage[] {
  const result: DisplayMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;
    const prevTimestamp = i > 0 ? messages[i - 1].metadata.timestamp : null;
    result.push({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.metadata.timestamp,
      showTimestamp: shouldShowTimestamp(msg.metadata.timestamp, prevTimestamp),
      isStreaming: false,
      toolCalls: msg.toolCalls,           // AR fix #5: carry through
      thinkingBlocks: msg.thinkingBlocks, // AR fix #5: carry through
    });
  }
  return result;
}

export function useMessageList(): UseMessageListReturn {
  const [fetchedMessages, setFetchedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamContentRef = useRef('');
  const [streamingContent, setStreamingContent] = useState('');

  const isStreaming = useStreamStore((s) => s.isStreaming);
  const activeSessionId = useStreamStore((s) => s.activeSessionId);

  // Also pull messages added to timeline store during this session (user messages)
  const timelineSessions = useTimelineStore((s) => s.sessions);
  const timelineActiveId = useTimelineStore((s) => s.activeSessionId);

  // Subscribe to content tokens from WS client for live streaming
  useEffect(() => {
    const client = getWsClient();
    if (!client) return;

    const unsubscribe = client.subscribeContent((token: string) => {
      streamContentRef.current += token;
      setStreamingContent(streamContentRef.current);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Reset streaming content when stream ends
  useEffect(() => {
    if (!isStreaming && streamContentRef.current) {
      // Stream ended -- content is now in the fetched messages on next load
      streamContentRef.current = '';
      setStreamingContent('');
    }
  }, [isStreaming]);

  const fetchMessages = useCallback(async (projectName: string, sessionId: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.apiFetch<{ messages: Message[] }>(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(sessionId)}/messages`,
      );
      setFetchedMessages(data.messages || []);
    } catch (err) {
      console.warn('[useMessageList] Failed to fetch messages:', err);
      setFetchedMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // D-28: Check for interrupted stream snapshot on mount/foreground
  const [interruptedSnapshot, setInterruptedSnapshot] = useState<{
    sessionId: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    if (activeSessionId) {
      const snapshot = getStreamSnapshot(activeSessionId);
      if (snapshot && snapshot.content) {
        setInterruptedSnapshot(snapshot);
      }
    }
  }, [activeSessionId, isStreaming]);

  // Clear interrupted snapshot when a new stream starts for this session
  useEffect(() => {
    if (isStreaming && activeSessionId && interruptedSnapshot?.sessionId === activeSessionId) {
      setInterruptedSnapshot(null);
      clearStreamSnapshot(activeSessionId);
    }
  }, [isStreaming, activeSessionId, interruptedSnapshot]);

  // Build display messages (memoized to avoid re-parsing on every streaming token)
  const baseDisplayMessages = useMemo(() => toDisplayMessages(fetchedMessages), [fetchedMessages]);

  // Build final array with streaming/interrupted appends
  const displayMessages: DisplayMessage[] = [...baseDisplayMessages];

  // D-28: Append interrupted message if snapshot exists and no active stream
  if (!isStreaming && interruptedSnapshot && interruptedSnapshot.content) {
    const lastTimestamp = displayMessages.length > 0
      ? displayMessages[displayMessages.length - 1].timestamp
      : null;
    const snapTime = new Date().toISOString();
    displayMessages.push({
      id: `interrupted-${interruptedSnapshot.sessionId}`,
      role: 'assistant',
      content: interruptedSnapshot.content,
      timestamp: snapTime,
      showTimestamp: shouldShowTimestamp(snapTime, lastTimestamp),
      isStreaming: false,
      isInterrupted: true,
    });
  }

  // During streaming, append a virtual assistant message
  if (isStreaming && streamingContent) {
    const lastTimestamp = displayMessages.length > 0
      ? displayMessages[displayMessages.length - 1].timestamp
      : null;
    const now = new Date().toISOString();
    displayMessages.push({
      id: `streaming-${activeSessionId || 'current'}`,
      role: 'assistant',
      content: streamingContent,
      timestamp: now,
      showTimestamp: shouldShowTimestamp(now, lastTimestamp),
      isStreaming: true,
    });
  }

  return {
    messages: displayMessages,
    isLoading,
    isStreaming,
    streamingContent,
    fetchMessages,
  };
}
