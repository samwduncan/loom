/**
 * ToolChip -- Inline collapsed tool call chip with icon, name, and status indicator.
 *
 * Renders as a compact pill (surface-sunken, rounded-full) within the assistant
 * message flow. Shows tool-specific lucide icon, tool name, and status indicator
 * (spinner for invoked, pulsing dot for executing, Check for resolved, X for rejected).
 *
 * Tapping the chip fires onPress (parent handles opening ToolDetailSheet).
 * Press feedback: Micro spring (scale 0.97) with Selection haptic.
 *
 * Memoized with custom comparator on toolCall.id + toolCall.status.
 *
 * @see D-01: icon + name + status indicator
 * @see D-03: 6 tool types with distinct icons
 * @see D-04: status updates in-place
 */

import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Terminal,
  FileText,
  Pencil,
  FilePlus,
  Search,
  FileSearch,
  Wrench,
  Check,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import type { ToolCallState, ToolCallStatus } from '@loom/shared/types/stream';
import { theme } from '../../../theme/theme';
import { createStyles } from '../../../theme/createStyles';

// ---------------------------------------------------------------------------
// Tool icon mapping (D-03: 6 tool types with distinct icons)
// ---------------------------------------------------------------------------

const TOOL_ICONS: Record<string, LucideIcon> = {
  Bash: Terminal,
  Read: FileText,
  Edit: Pencil,
  Write: FilePlus,
  Glob: Search,
  Grep: FileSearch,
};

function getToolIcon(toolName: string): LucideIcon {
  return TOOL_ICONS[toolName] ?? Wrench;
}

// ---------------------------------------------------------------------------
// Status indicator sub-components
// ---------------------------------------------------------------------------

/** Invoked: small ActivityIndicator spinner */
function InvokedIndicator() {
  return (
    <ActivityIndicator
      size={12}
      color={theme.colors.text.muted}
    />
  );
}

/** Executing: 8px pulsing accent dot */
function ExecutingIndicator() {
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,   // infinite
      true,  // reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.executingDot, animatedStyle]} />
  );
}

/** Resolved: small Check icon in success color */
function ResolvedIndicator() {
  return <Check size={12} color={theme.colors.success} strokeWidth={2.5} />;
}

/** Rejected: small X icon in destructive color */
function RejectedIndicator() {
  return <X size={12} color={theme.colors.destructive} strokeWidth={2.5} />;
}

function StatusIndicator({ status }: { status: ToolCallStatus }) {
  switch (status) {
    case 'invoked':
      return <InvokedIndicator />;
    case 'executing':
      return <ExecutingIndicator />;
    case 'resolved':
      return <ResolvedIndicator />;
    case 'rejected':
      return <RejectedIndicator />;
  }
}

// ---------------------------------------------------------------------------
// ToolChip component
// ---------------------------------------------------------------------------

interface ToolChipProps {
  toolCall: ToolCallState;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ToolChipInner({ toolCall, onPress }: ToolChipProps) {
  const scale = useSharedValue(1);
  const Icon = getToolIcon(toolCall.toolName);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, theme.springs.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.springs.micro);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.chip, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={`${toolCall.toolName} tool call, status: ${toolCall.status}`}
    >
      {/* Tool icon */}
      <Icon size={14} color={theme.colors.text.secondary} strokeWidth={2} />

      {/* Tool name */}
      <Animated.Text style={styles.name} numberOfLines={1}>
        {toolCall.toolName}
      </Animated.Text>

      {/* Status indicator */}
      <StatusIndicator status={toolCall.status} />
    </AnimatedPressable>
  );
}

/**
 * Memoized ToolChip -- only re-renders when toolCall.id or toolCall.status changes.
 */
export const ToolChip = React.memo(ToolChipInner, (prev, next) => {
  return (
    prev.toolCall.id === next.toolCall.id &&
    prev.toolCall.status === next.toolCall.status
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: t.colors.surface.sunken,
    borderRadius: t.radii.full,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
    gap: t.spacing.xs,
  },
  name: {
    ...t.typography.small,
    color: t.colors.text.secondary,
  },
  executingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.accent,
  },
}));
