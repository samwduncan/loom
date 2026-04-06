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
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
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
    minHeight: 36,
    backgroundColor: t.colors.surface.input,
    borderRadius: t.radii.lg, // 12px — search input per spec
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border.strong,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.sm,
    minHeight: 36,
  },
  searchIcon: {
    marginRight: t.spacing.sm,
  },
  input: {
    flex: 1,
    ...t.typography.label,
    color: t.colors.text.primary,
    height: 36,
    paddingVertical: 0,
  },
}));
