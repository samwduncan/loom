/**
 * Glass-styled search input for filtering sessions in the drawer.
 *
 * Uses expo-blur BlurView with dark tint and overlay for the glass treatment
 * specified in the UI-SPEC. Real-time filtering via onQueryChange callback.
 * Clear button appears when query is non-empty with haptic feedback.
 *
 * Per D-11: sticky search with glass background, real-time filter, clear button.
 */

import React, { useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Search, X } from 'lucide-react-native';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionSearchProps {
  query: string;
  onQueryChange: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionSearch({ query, onQueryChange }: SessionSearchProps) {
  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onQueryChange('');
  }, [onQueryChange]);

  return (
    <View style={styles.container}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        {/* Dark overlay for glass treatment */}
        <View style={styles.overlay} />

        {/* Search content */}
        <View style={styles.content}>
          <Search
            size={16}
            color={theme.colors.text.muted}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.input}
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search sessions"
            placeholderTextColor={theme.colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />

          {query.length > 0 && (
            <Pressable
              onPress={handleClear}
              hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={16} color={theme.colors.text.muted} />
            </Pressable>
          )}
        </View>
      </BlurView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    marginHorizontal: t.spacing.md,
    marginBottom: t.spacing.sm,
    borderRadius: t.radii.lg,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
  },
  blur: {
    height: 44,
    justifyContent: 'center' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.sm,
  },
  searchIcon: {
    marginRight: t.spacing.sm,
  },
  input: {
    flex: 1,
    ...t.typography.body,
    color: t.colors.text.primary,
    height: 44,
    paddingVertical: 0,
  },
}));
