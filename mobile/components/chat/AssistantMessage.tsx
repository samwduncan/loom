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

import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Bot } from 'lucide-react-native';

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
  // D-26 override: Phase 75 used withTiming(150ms) for assistant entrance.
  // Soul doc anti-pattern #2 ("No withTiming for appearances") takes precedence.
  // translateY only applied for non-streaming messages to avoid pop-in jitter.
  // -------------------------------------------------------------------------
  const isStreaming = message.isStreaming;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(isStreaming ? 0 : 10);

  useEffect(() => {
    opacity.value = withSpring(1, theme.springs.standard);
    if (!isStreaming) {
      translateY.value = withSpring(0, theme.springs.standard);
    }
  }, [opacity, translateY, isStreaming]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

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
  // Collect tool_use segments for flex-wrap row rendering
  // -------------------------------------------------------------------------

  return (
    <Animated.View style={[styles.container, entranceStyle]}>
      {/* Avatar placeholder */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Bot size={14} color={theme.colors.text.secondary} strokeWidth={2} />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
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
      </View>

      {/* Timestamp */}
      {message.showTimestamp && formattedTime ? (
        <Text style={styles.timestamp}>{formattedTime}</Text>
      ) : null}

      {/* Interrupted indicator (D-28) */}
      {message.isInterrupted && (
        <Text style={styles.interrupted}>Interrupted</Text>
      )}
    </Animated.View>
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
    marginBottom: t.spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.surface.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    marginLeft: 24 + t.spacing.sm, // avatar width + gap
  },
  toolChipWrapper: {
    // Each tool chip in a flex-wrap row context
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: t.spacing.sm,
    marginVertical: t.spacing.xs,
  },
  timestamp: {
    ...t.typography.small,
    color: t.colors.text.muted,
    marginTop: t.spacing.xs,
    marginLeft: 24 + t.spacing.sm,
  },
  interrupted: {
    ...t.typography.small,
    color: t.colors.destructive,
    fontStyle: 'italic' as const,
    marginTop: t.spacing.xs,
    marginLeft: 24 + t.spacing.sm,
  },
}));
