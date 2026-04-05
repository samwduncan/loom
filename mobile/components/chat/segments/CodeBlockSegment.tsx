/**
 * CodeBlockSegment -- renders syntax-highlighted code with language label,
 * copy button, haptic feedback, and horizontal scroll.
 *
 * Uses react-native-code-highlighter (wraps react-syntax-highlighter) for
 * syntax highlighting with the Atom One Dark theme.
 *
 * Layout per D-15, D-16, UI-SPEC:
 * - Surface-sunken background, radii.md border, border-subtle
 * - Header row: language label (Small 13px, text-muted) + copy button (accent)
 * - Code: horizontal ScrollView, JetBrainsMono-Regular, no line wrap
 * - Copy: Clipboard + haptic + "Copied" toast (via Plan 01's showToast)
 *
 * Performance: React.memo -- code blocks are frozen once streaming completes.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, Check } from 'lucide-react-native';
import CodeHighlighter from 'react-native-code-highlighter';
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark';
import { showToast } from '../../../lib/toast';
import { createStyles } from '../../../theme/createStyles';
import { theme } from '../../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodeBlockSegmentProps {
  code: string;
  language: string;
  isStreaming: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CodeBlockSegmentInner({
  code,
  language,
  isStreaming,
}: CodeBlockSegmentProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconScale = useSharedValue(1);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Streaming indicator animation (opacity pulse on bottom edge)
  const streamingOpacity = useSharedValue(isStreaming ? 0.3 : 0);

  React.useEffect(() => {
    if (isStreaming) {
      streamingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite repeat
        false,
      );
    } else {
      cancelAnimation(streamingOpacity);
      streamingOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isStreaming, streamingOpacity]);

  const streamingLineStyle = useAnimatedStyle(() => ({
    opacity: streamingOpacity.value,
  }));

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Copied', undefined, 2000);

    // Micro scale spring on icon swap
    iconScale.value = 0.5;
    iconScale.value = withSpring(1, { damping: 12, stiffness: 300 });

    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [code, iconScale]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const displayLanguage = language
    ? language.toUpperCase()
    : 'CODE';

  return (
    <View style={styles.container}>
      {/* Header: language label + copy button */}
      <View style={styles.header}>
        <Text style={styles.languageLabel} numberOfLines={1}>
          {displayLanguage}
        </Text>
        <Pressable
          onPress={handleCopy}
          hitSlop={12}
          style={styles.copyButton}
          accessibilityRole="button"
          accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          <Animated.View style={iconAnimatedStyle}>
            {copied ? (
              <Check size={14} color={theme.colors.success} strokeWidth={2.5} />
            ) : (
              <Copy size={14} color={theme.colors.accent} strokeWidth={2} />
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* Code content with syntax highlighting */}
      <CodeHighlighter
        language={language || 'plaintext'}
        hljsStyle={atomOneDark}
        textStyle={styles.codeText}
        scrollViewProps={{
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: styles.scrollContent,
        }}
      >
        {code}
      </CodeHighlighter>

      {/* Streaming indicator: pulsing accent line at bottom */}
      {isStreaming && (
        <Animated.View style={[styles.streamingLine, streamingLineStyle]} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Memoized export (ChunkedCodeView pattern)
// ---------------------------------------------------------------------------

export const CodeBlockSegment = React.memo(
  CodeBlockSegmentInner,
  (prev, next) => {
    return (
      prev.code === next.code &&
      prev.language === next.language &&
      prev.isStreaming === next.isStreaming
    );
  },
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    backgroundColor: t.colors.surface.sunken,
    borderRadius: t.radii.sm,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
    overflow: 'hidden',
    marginVertical: t.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border.subtle,
  },
  languageLabel: {
    fontSize: t.typography.small.fontSize,
    fontWeight: t.typography.small.fontWeight,
    lineHeight: t.typography.small.lineHeight,
    fontFamily: 'Inter-Regular',
    color: t.colors.text.muted,
  },
  copyButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: t.spacing.xs,
  },
  copyText: {
    fontSize: t.typography.small.fontSize,
    fontWeight: t.typography.small.fontWeight,
    lineHeight: t.typography.small.lineHeight,
    fontFamily: 'Inter-Regular',
    color: t.colors.accent,
  },
  codeText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 16, // Match body font size
    lineHeight: 24,
  },
  scrollContent: {
    padding: t.spacing.sm,
    paddingTop: t.spacing.xs,
  },
  streamingLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: t.colors.accent,
  },
}));
