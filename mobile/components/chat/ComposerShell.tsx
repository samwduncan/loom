/**
 * ComposerShell -- visual-only composer bar for the chat screen.
 *
 * Contains a TextInput with "Message" placeholder and a disabled send button.
 * No submit wired -- this is a visual placeholder for Phase 74 (D-10).
 * Phase 75 will wire the actual message sending.
 *
 * Safe area: paddingBottom set to insets.bottom so content clears home indicator.
 */

import { StyleSheet, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowUp } from 'lucide-react-native';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

export function ComposerShell() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        { paddingBottom: insets.bottom + theme.spacing.sm },
        theme.shadows.composer,
      ]}
    >
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.glassOverlay} />
      </BlurView>
      <View style={styles.row}>
        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={theme.colors.text.muted}
          editable={true}
          multiline
          textAlignVertical="center"
        />

        {/* Send button (disabled state) */}
        <View style={styles.sendButton}>
          <ArrowUp
            size={20}
            color={theme.colors.text.muted}
            strokeWidth={2}
          />
        </View>
      </View>
    </View>
  );
}

const styles = createStyles((t) => ({
  outer: {
    overflow: 'hidden' as const,
    borderTopLeftRadius: t.radii.input,  // 24px — match Composer.tsx
    borderTopRightRadius: t.radii.input,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.colors.glass,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: t.colors.surface.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border.subtle,
    borderRadius: t.radii['2xl'],
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surface.raised,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: t.spacing.sm,
  },
}));
