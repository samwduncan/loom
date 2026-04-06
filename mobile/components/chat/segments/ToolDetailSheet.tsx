/**
 * ToolDetailSheet -- Bottom sheet with full tool call details.
 *
 * Two exports:
 *   ToolDetailSheetProvider -- wraps app/chat screen with BottomSheetModalProvider
 *   ToolDetailSheet -- modal bottom sheet showing tool name, arguments, output, error, duration
 *
 * Uses @gorhom/bottom-sheet v5 BottomSheetModal for correct modal presentation
 * OUTSIDE of FlatList scroll hierarchy (Pitfall 4 from 75-RESEARCH.md).
 *
 * Surface: overlay Tier 3.
 * Spring: Navigation for presentation.
 *
 * @see D-02: bottom sheet with full details
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import {
  Terminal,
  FileText,
  Pencil,
  FilePlus,
  Search,
  FileSearch,
  Wrench,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { ToolCallState, ToolCallStatus } from '@loom/shared/types/stream';
import { theme } from '../../../theme/theme';
import { TOOL_COLORS, CATEGORY } from '../../../lib/colors';
import type { ColorPair } from '../../../theme/types';
import { createStyles } from '../../../theme/createStyles';

// ---------------------------------------------------------------------------
// Re-export provider for convenience
// ---------------------------------------------------------------------------

export { BottomSheetModalProvider as ToolDetailSheetProvider };

// ---------------------------------------------------------------------------
// Tool icon mapping (shared with ToolChip)
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

// Tool color mapping (matches ToolChip)
const TOOL_COLOR_MAP: Record<string, ColorPair | null> = {
  Bash: TOOL_COLORS.bash,
  Read: TOOL_COLORS.read,
  Edit: TOOL_COLORS.edit,
  Write: TOOL_COLORS.write,
  Glob: TOOL_COLORS.glob,
  Grep: TOOL_COLORS.grep,
  WebFetch: TOOL_COLORS.web,
  WebSearch: TOOL_COLORS.web,
  Agent: TOOL_COLORS.agent,
};

function getToolColor(toolName: string): ColorPair | null {
  const color = TOOL_COLOR_MAP[toolName];
  return color === undefined ? CATEGORY.blue : color;
}

// ---------------------------------------------------------------------------
// Status color + label helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: ToolCallStatus): string {
  switch (status) {
    case 'invoked':
      return theme.colors.text.muted;
    case 'executing':
      return theme.colors.accent;
    case 'resolved':
      return theme.colors.success;
    case 'rejected':
      return theme.colors.destructive;
  }
}

function getStatusLabel(status: ToolCallStatus): string {
  switch (status) {
    case 'invoked':
      return 'Pending';
    case 'executing':
      return 'Running';
    case 'resolved':
      return 'Completed';
    case 'rejected':
      return 'Failed';
  }
}

// ---------------------------------------------------------------------------
// Duration calculator
// ---------------------------------------------------------------------------

function computeDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(completedAt).getTime();
  const diffSec = Math.round((endMs - startMs) / 1000 * 10) / 10;
  return `${diffSec}s`;
}

// ---------------------------------------------------------------------------
// ToolDetailSheet component
// ---------------------------------------------------------------------------

interface ToolDetailSheetProps {
  toolCall: ToolCallState | null;
  isVisible: boolean;
  onDismiss: () => void;
}

export function ToolDetailSheet({ toolCall, isVisible, onDismiss }: ToolDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  // Present/dismiss based on isVisible
  useEffect(() => {
    if (isVisible && toolCall) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, toolCall]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  if (!toolCall) return null;

  const Icon = getToolIcon(toolCall.toolName);
  const toolColor = getToolColor(toolCall.toolName);
  const statusColor = getStatusColor(toolCall.status);
  const statusLabel = getStatusLabel(toolCall.status);
  const duration = computeDuration(toolCall.startedAt, toolCall.completedAt);
  const inputEntries = Object.entries(toolCall.input);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.sheetShadow}
    >
      <BottomSheetScrollView style={styles.content}>
        {/* Header: icon + name + status badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon size={20} color={toolColor?.vivid ?? theme.colors.text.secondary} strokeWidth={2} />
            <Text style={[styles.headerTitle, toolColor ? { color: toolColor.vivid } : undefined]}>{toolCall.toolName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Arguments section */}
        {inputEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ARGUMENTS</Text>
            {inputEntries.map(([key, value]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{key}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text
                    style={[
                      styles.kvValue,
                      isCodeValue(key) && styles.kvValueMono,
                    ]}
                    numberOfLines={8}
                  >
                    {formatValue(value)}
                  </Text>
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {/* Output section */}
        {toolCall.output && !toolCall.isError && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OUTPUT</Text>
            <Text style={styles.outputText} selectable>
              {toolCall.output}
            </Text>
          </View>
        )}

        {/* Error section */}
        {toolCall.output && toolCall.isError && (
          <View style={styles.section}>
            <Text style={styles.errorLabel}>ERROR</Text>
            <Text style={styles.errorText} selectable>
              {toolCall.output}
            </Text>
          </View>
        )}

        {/* Duration */}
        {duration && (
          <Text style={styles.duration}>Duration: {duration}</Text>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomPad} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect keys likely holding code/file paths for monospace rendering */
function isCodeValue(key: string): boolean {
  const codeKeys = ['command', 'file_path', 'path', 'pattern', 'old_string', 'new_string', 'content'];
  return codeKeys.includes(key);
}

/** Format a tool input value for display */
function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  sheetBackground: {
    backgroundColor: t.colors.surface.overlay,     // spec §7.3: overlay tier for sheets
    borderTopLeftRadius: t.radii['2xl'],           // 16px
    borderTopRightRadius: t.radii['2xl'],
  },
  sheetShadow: {
    ...t.shadows.sheet,                            // spec §5: sheet shadow
  },
  handleIndicator: {
    backgroundColor: t.colors.text.muted,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: t.spacing.md,               // 16px — spec §3: card padding
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: t.spacing.sm,                      // 8px
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.sm,                             // 8px
    flex: 1,
  },
  headerTitle: {
    ...t.typography.headline,                      // spec §7.3: tool-name heading
    color: t.colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.xs,                             // 4px
  },
  statusDot: {
    width: 8,                                      // spec §7.3: dot 8px
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...t.typography.label,                         // spec §7.3: status label
  },
  divider: {
    height: StyleSheet.hairlineWidth,              // 0.5px — spec §7.3
    backgroundColor: t.colors.border.medium,       // spec §7.3: border.default = border.medium
    marginVertical: t.spacing.md,                  // 16px
  },
  section: {
    marginBottom: t.spacing.md,                    // 16px
  },
  sectionLabel: {
    ...t.typography.meta,                          // spec §7.3: meta tier labels
    color: t.colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: t.spacing.sm,                    // 8px
  },
  kvRow: {
    marginBottom: t.spacing.sm,                    // 8px
  },
  kvKey: {
    ...t.typography.meta,                          // spec §7.3: meta tier labels for arg keys
    color: t.colors.text.muted,
    marginBottom: 2,
  },
  kvValue: {
    ...t.typography.body,                          // spec §7.3: body tier values
    color: t.colors.text.primary,
  },
  kvValueMono: {
    fontFamily: 'JetBrainsMono-Regular',           // spec §7.3: code values
  },
  outputText: {
    ...t.typography.body,
    color: t.colors.text.secondary,
  },
  errorLabel: {
    ...t.typography.meta,                          // meta tier for section labels
    color: t.colors.destructive,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: t.spacing.sm,
  },
  errorText: {
    ...t.typography.body,
    color: t.colors.destructive,
  },
  duration: {
    ...t.typography.meta,                          // meta tier for timestamps/duration
    color: t.colors.text.muted,
    marginTop: t.spacing.sm,
  },
  bottomPad: {
    height: t.spacing.xl,                          // 32px
  },
}));
