/**
 * AssistantMessage -- Segment-based assistant message rendering.
 *
 * Calls parseMessageSegments to split content into typed segments,
 * then renders each via the appropriate segment component.
 *
 * AR fix #5: Historical vs streaming data for tool calls and thinking blocks.
 * - Streaming messages: read toolCalls/thinkingBlocks/permissionRequest from StreamStore (live)
 * - Historical messages: read from DisplayMessage fields (carried from Message)
 * - mapToolCallToState converts persisted ToolCall -> ToolCallState for rendering
 *
 * Layout per D-24: Free-flowing on base surface (no bubble/card).
 * 24px avatar placeholder at top-left.
 * First-token entrance per D-26: opacity 0->1 over 150ms.
 */

import React, { useCallback, useMemo } from 'react';
import { ActionSheetIOS, Platform, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Bot } from 'lucide-react-native';
import { haptic } from '../../lib/haptics';

import type { DisplayMessage } from '../../hooks/useMessageList';
import type { ToolCall } from '@loom/shared/types/message';
import type { ToolCallState } from '@loom/shared/types/stream';
import { parseMessageSegments } from '../../lib/message-segments';
import { useStreamStore } from '../../stores/index';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// Segment components
import { TextSegment } from './segments/TextSegment';
import { CodeBlockSegment } from './segments/CodeBlockSegment';
import { ThinkingSegment } from './segments/ThinkingSegment';
import { ToolChip } from './segments/ToolChip';
import { PermissionCard } from './segments/PermissionCard';

const AVATAR_SIZE = 30;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssistantMessageProps {
  message: DisplayMessage;
  onToolChipPress: (toolCall: ToolCallState) => void;
}

// ---------------------------------------------------------------------------
// ToolCall -> ToolCallState mapping for historical messages
// ---------------------------------------------------------------------------

function mapToolCallToState(tc: ToolCall): ToolCallState {
  return {
    id: tc.id,
    toolName: tc.toolName,
    input: tc.input,
    output: tc.output,
    isError: tc.isError,
    status: tc.isError ? 'rejected' : 'resolved',
    startedAt: '',
    completedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AssistantMessageInner({ message, onToolChipPress }: AssistantMessageProps) {
  // -------------------------------------------------------------------------
  // AR fix #5: Determine data sources based on streaming state
  // -------------------------------------------------------------------------
  const storeToolCalls = useStreamStore((s) => s.activeToolCalls);
  const storeThinking = useStreamStore((s) => s.thinkingState?.blocks ?? []);
  const storePermission = useStreamStore((s) => s.activePermissionRequest);

  const toolCalls: ToolCallState[] = useMemo(
    () =>
      message.isStreaming
        ? storeToolCalls
        : (message.toolCalls ?? []).map(mapToolCallToState),
    [message.isStreaming, storeToolCalls, message.toolCalls],
  );

  const thinkingBlocks = useMemo(
    () => (message.isStreaming ? storeThinking : (message.thinkingBlocks ?? [])),
    [message.isStreaming, storeThinking, message.thinkingBlocks],
  );

  const permissionRequest = message.isStreaming ? storePermission : null;

  // -------------------------------------------------------------------------
  // Parse segments
  // -------------------------------------------------------------------------
  const segments = useMemo(
    () =>
      parseMessageSegments(
        message.content,
        toolCalls,
        thinkingBlocks,
        permissionRequest,
        message.isStreaming,
      ),
    [message.content, toolCalls, thinkingBlocks, permissionRequest, message.isStreaming],
  );

  // -------------------------------------------------------------------------
  // Timestamp formatting
  // -------------------------------------------------------------------------
  const formattedTime = useMemo(() => {
    try {
      const date = new Date(message.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message.timestamp]);

  // -------------------------------------------------------------------------
  // Long-press copy (same pattern as UserBubble)
  // -------------------------------------------------------------------------
  const handleLongPress = useCallback(() => {
    if (!message.content) return;
    haptic.transition();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Copy', 'Cancel'],
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            Clipboard.setStringAsync(message.content);
          }
        },
      );
    } else {
      Clipboard.setStringAsync(message.content);
    }
  }, [message.content]);

  // -------------------------------------------------------------------------
  // Collect tool_use segments for flex-wrap row rendering
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Bot size={16} color={theme.colors.text.secondary} strokeWidth={2} />
        </View>
      </View>

      {/* Content area -- long-press to copy */}
      <Pressable onLongPress={handleLongPress} delayLongPress={400} style={styles.content}>
        {segments.map((seg, idx) => {
          const key = `${message.id}-seg-${idx}`;

          switch (seg.type) {
            case 'text':
              return <TextSegment key={key} content={seg.content} isStreaming={seg.isStreaming} />;

            case 'code_block':
              return (
                <CodeBlockSegment
                  key={key}
                  code={seg.code}
                  language={seg.language}
                  isStreaming={seg.isStreaming}
                />
              );

            case 'thinking':
              return (
                <ThinkingSegment key={key} block={seg.block} isActive={seg.isActive} />
              );

            case 'tool_use':
              return (
                <View key={key} style={styles.toolChipWrapper}>
                  <ToolChip
                    toolCall={seg.toolCall}
                    onPress={() => onToolChipPress(seg.toolCall)}
                  />
                </View>
              );

            case 'permission':
              return <PermissionCard key={key} request={seg.request} />;

            default:
              return null;
          }
        })}
      </Pressable>

      {/* Timestamp */}
      {message.showTimestamp && formattedTime ? (
        <Text style={styles.timestamp}>{formattedTime}</Text>
      ) : null}

      {/* Interrupted indicator (D-28) */}
      {message.isInterrupted && (
        <Text style={styles.interrupted}>Interrupted</Text>
      )}
    </View>
  );
}

export const AssistantMessage = React.memo(AssistantMessageInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    // Free-flowing on base surface (no bubble per D-24)
  },
  avatarRow: {
    flexDirection: 'row' as const,
    marginBottom: t.spacing.xs,              // 4px
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surface.raised, // #1e1e18 per spec §1.1
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    marginLeft: AVATAR_SIZE + t.spacing.sm,  // avatar width + 8px gap
  },
  toolChipWrapper: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: t.spacing.sm,                        // 8px — spec §3
    marginVertical: t.spacing.xs,             // 4px
  },
  timestamp: {
    ...t.typography.meta,                     // timestamps use meta tier (11px) per spec §2.1
    color: t.colors.text.muted,
    marginTop: t.spacing.xs,
    marginLeft: AVATAR_SIZE + t.spacing.sm,
  },
  interrupted: {
    ...t.typography.meta,                     // meta tier for status labels
    color: t.colors.destructive,
    fontStyle: 'italic' as const,
    marginTop: t.spacing.xs,
    marginLeft: AVATAR_SIZE + t.spacing.sm,
  },
}));
