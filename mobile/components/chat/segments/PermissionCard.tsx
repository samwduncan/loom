/**
 * PermissionCard -- Inline permission approval card with Approve/Deny buttons.
 *
 * Renders as an overlay Tier 3 card in the chat stream. Shows tool name,
 * description (generated from tool input), and Approve (accent) / Deny
 * (surface-raised) buttons side-by-side.
 *
 * 3-state machine: pending -> approved | denied.
 * After approval/denial, card transforms to compact status line.
 *
 * AR fix #1: PermissionRequest.input is `unknown`, not `Record<string, unknown>`.
 * Uses narrowInput() helper to safely cast before property access.
 *
 * @see D-20: inline card with tool name + description + Approve/Deny
 * @see D-21: transforms to compact status line after action
 * @see D-22: subtle glow/highlight
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { PermissionRequest } from '@loom/shared/stores/stream';
import { haptic } from '../../../lib/haptics';
import { getWsClient } from '../../../lib/websocket-init';
import { useStreamStore } from '../../../stores/index';
import { theme } from '../../../theme/theme';
import { createStyles } from '../../../theme/createStyles';

// ---------------------------------------------------------------------------
// AR fix #1: Safely narrow PermissionRequest.input from `unknown`
// ---------------------------------------------------------------------------

/** Safely extract input as Record for display purposes */
function narrowInput(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Tool description generator
// ---------------------------------------------------------------------------

function generateDescription(toolName: string, rawInput: unknown): string {
  const input = narrowInput(rawInput);
  switch (toolName) {
    case 'Bash':
      return `Run command: ${String(input.command ?? '').slice(0, 100)}`;
    case 'Write':
      return `Write to: ${String(input.file_path ?? '')}`;
    case 'Edit':
      return `Edit: ${String(input.file_path ?? '')}`;
    default:
      return `${toolName}: ${JSON.stringify(input).slice(0, 100)}`;
  }
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type CardState = 'pending' | 'approved' | 'denied';

// ---------------------------------------------------------------------------
// PermissionCard component
// ---------------------------------------------------------------------------

interface PermissionCardProps {
  request: PermissionRequest;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PermissionCard({ request }: PermissionCardProps) {
  const [cardState, setCardState] = useState<CardState>('pending');
  const hasRespondedRef = useRef(false);
  const description = generateDescription(request.toolName, request.input);

  // Entrance animation shared values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const cardScale = useSharedValue(0.95);

  // Button press scale
  const approveScale = useSharedValue(1);
  const denyScale = useSharedValue(1);

  // Dramatic entrance on mount + Warning haptic
  useEffect(() => {
    haptic.warning();
    opacity.value = withSpring(1, theme.springs.dramatic);
    translateY.value = withSpring(0, theme.springs.dramatic);
    cardScale.value = withSpring(1, theme.springs.dramatic);
  }, [opacity, translateY, cardScale]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: cardScale.value },
    ],
  }));

  // ---------------------------------------------------------------------------
  // Approve handler
  // ---------------------------------------------------------------------------

  const handleApprove = useCallback(() => {
    if (hasRespondedRef.current) return;
    hasRespondedRef.current = true;
    const wsClient = getWsClient();
    if (!wsClient) {
      hasRespondedRef.current = false; // Allow retry
      return; // Don't clear state when disconnected — response would be lost
    }
    haptic.success();
    wsClient.send({
      type: 'claude-permission-response',
      requestId: request.requestId,
      allow: true,
    });
    useStreamStore.getState().clearPermissionRequest();
    setCardState('approved');
  }, [request.requestId]);

  // ---------------------------------------------------------------------------
  // Deny handler
  // ---------------------------------------------------------------------------

  const handleDeny = useCallback(() => {
    if (hasRespondedRef.current) return;
    hasRespondedRef.current = true;
    const wsClient = getWsClient();
    if (!wsClient) {
      hasRespondedRef.current = false; // Allow retry
      return; // Don't clear state when disconnected — response would be lost
    }
    haptic.tap();
    wsClient.send({
      type: 'claude-permission-response',
      requestId: request.requestId,
      allow: false,
    });
    useStreamStore.getState().clearPermissionRequest();
    setCardState('denied');
  }, [request.requestId]);

  // ---------------------------------------------------------------------------
  // Button press feedback
  // ---------------------------------------------------------------------------

  const approveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: approveScale.value }],
  }));

  const denyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: denyScale.value }],
  }));

  // ---------------------------------------------------------------------------
  // Compact status line (approved/denied)
  // ---------------------------------------------------------------------------

  if (cardState === 'approved' || cardState === 'denied') {
    const isApproved = cardState === 'approved';
    const dotColor = isApproved ? theme.colors.success : theme.colors.destructive;
    const label = isApproved ? 'Approved' : 'Denied';

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.statusLine}
      >
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={styles.statusText} numberOfLines={1}>
          {label}: {description}
        </Text>
      </Animated.View>
    );
  }

  // ---------------------------------------------------------------------------
  // Pending state (full card with buttons)
  // ---------------------------------------------------------------------------

  return (
    <Animated.View
      style={[styles.card, entranceStyle]}
      accessibilityRole="alert"
      accessibilityLabel={`Permission request: ${request.toolName}. ${description}`}
    >
      {/* Tool name */}
      <Text style={styles.toolName}>{request.toolName}</Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>

      {/* Button row: Deny (left) | Approve (right) per D-20 */}
      <View style={styles.buttonRow}>
        <AnimatedPressable
          style={[styles.denyButton, denyAnimStyle]}
          onPress={handleDeny}
          onPressIn={() => {
            denyScale.value = withSpring(0.95, theme.springs.micro);
          }}
          onPressOut={() => {
            denyScale.value = withSpring(1, theme.springs.micro);
          }}
          accessibilityRole="button"
          accessibilityLabel="Deny permission"
        >
          <Text style={styles.denyText}>Deny</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.approveButton, approveAnimStyle]}
          onPress={handleApprove}
          onPressIn={() => {
            approveScale.value = withSpring(0.95, theme.springs.micro);
          }}
          onPressOut={() => {
            approveScale.value = withSpring(1, theme.springs.micro);
          }}
          accessibilityRole="button"
          accessibilityLabel="Approve permission"
        >
          <Text style={styles.approveText}>Approve</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  // Pending card (Tier 3 overlay — spec §7.5)
  card: {
    backgroundColor: t.colors.surface.overlay,     // spec §7.5: overlay tier
    borderRadius: t.radii.xl,                      // 16px — spec §4: permission cards
    padding: t.spacing.md,                         // 16px — spec §3: card padding
    borderWidth: StyleSheet.hairlineWidth,          // 0.5px — spec §1.7
    borderColor: t.colors.border.strong,           // card edges use border.strong per spec §1.7
    ...t.rimLight,
    ...t.shadows.sheet,                            // spec §5: sheet shadow for permission cards
  },
  toolName: {
    ...t.typography.label,                         // spec §7.5: title = label tier
    color: t.colors.text.primary,
  },
  description: {
    ...t.typography.body,                          // spec §7.5: description = body tier
    color: t.colors.text.secondary,
    marginTop: t.spacing.xs,                       // 4px
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: t.spacing.sm,                             // 8px — spec §3: button gap
    marginTop: t.spacing.md,                       // 16px
  },
  denyButton: {
    flex: 1,
    height: 44,                                    // spec §7.5: 44px height
    backgroundColor: t.colors.surface.raised,      // spec §7.5: surface.raised for Deny
    borderRadius: t.radii.lg,                      // 12px — spec §7.5: radius lg
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  denyText: {
    ...t.typography.label,                         // label tier for button text
    color: t.colors.text.primary,
  },
  approveButton: {
    flex: 1,
    height: 44,                                    // spec §7.5: 44px height
    backgroundColor: t.colors.accent,              // spec §7.5: accent bg for Allow
    borderRadius: t.radii.lg,                      // 12px — spec §7.5: radius lg
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  approveText: {
    ...t.typography.label,                         // label tier for button text
    color: t.colors.accentFg,                      // spec §7.5: accent.fg text
  },

  // Compact status line (after approve/deny)
  statusLine: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.xs,                             // 4px
    paddingVertical: t.spacing.xs,                 // 4px
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...t.typography.label,
    color: t.colors.text.secondary,
    flex: 1,
  },
}));
