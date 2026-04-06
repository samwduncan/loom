/**
 * TextSegment -- renders markdown content using react-native-enriched-markdown.
 *
 * Uses the EnrichedMarkdownText component for CommonMark + GFM table rendering.
 * Styles match Loom theme tokens (body 15px, heading 17px SemiBold, inline code
 * JetBrainsMono on surface-sunken).
 *
 * Performance: Wrapped in React.memo with custom comparison -- only re-renders
 * when content changes or isStreaming transitions. Completed segments (isStreaming=false)
 * are frozen per the ChunkedCodeView pattern (D-18).
 *
 * Note: Fenced code blocks are extracted by the segment parser into separate
 * CodeBlockSegment instances. If enriched-markdown encounters a fenced code block
 * that slipped through, it renders as plain monospace text (surface-sunken bg).
 */

import React from 'react';
import { Linking } from 'react-native';
import { EnrichedMarkdownText, type MarkdownStyle } from 'react-native-enriched-markdown';
import { theme } from '../../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TextSegmentProps {
  content: string;
  isStreaming: boolean;
}

// ---------------------------------------------------------------------------
// Markdown Styles (computed once at module scope)
// ---------------------------------------------------------------------------

const markdownStyle: MarkdownStyle = {
  paragraph: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    marginTop: 0,
    marginBottom: theme.spacing.sm,
  },
  h1: {
    fontSize: theme.typography.headline.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.headline.lineHeight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  h2: {
    fontSize: theme.typography.headline.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.headline.lineHeight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  h3: {
    fontSize: theme.typography.headline.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.headline.lineHeight,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  h4: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  h5: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  h6: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  strong: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: 'normal', // Use the font face as-is (SemiBold 600, NOT bold 700 per UI-SPEC)
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  link: {
    color: theme.colors.accent,
    underline: false,
  },
  code: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: theme.typography.code.fontSize,       // 14px per spec §2.1
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.deep,     // spec §7.8: deep surface for code bg
  },
  codeBlock: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: theme.typography.code.fontSize,       // 14px per spec §2.1
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.deep,     // spec §7.8: deep surface for code bg
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  blockquote: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body.lineHeight,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    gapWidth: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  list: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    bulletColor: theme.colors.text.muted,
    markerColor: theme.colors.text.muted,
    gapWidth: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    marginTop: 0,
    marginBottom: theme.spacing.xs,
  },
  table: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body.lineHeight,
    headerFontFamily: 'Inter-SemiBold',
    headerBackgroundColor: theme.colors.surface.deep,   // deep for table header
    headerTextColor: theme.colors.text.primary,
    rowEvenBackgroundColor: theme.colors.surface.base,
    rowOddBackgroundColor: theme.colors.surface.base,
    borderColor: theme.colors.border.medium,             // spec §1.7: dividers use border.medium
    borderWidth: 0.5,                                    // spec §1.7: 0.5px borders
    borderRadius: theme.radii.sm,
    cellPaddingHorizontal: theme.spacing.sm,
    cellPaddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  thematicBreak: {
    color: theme.colors.border.medium,                   // spec §1.7: dividers use border.medium
    height: 0.5,                                         // spec §1.7: 0.5px
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
};

// ---------------------------------------------------------------------------
// Link handler
// ---------------------------------------------------------------------------

function handleLinkPress({ url }: { url: string }) {
  if (url) {
    Linking.openURL(url);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TextSegmentInner({ content, isStreaming }: TextSegmentProps) {
  return (
    <EnrichedMarkdownText
      markdown={content}
      markdownStyle={markdownStyle}
      flavor="github"
      streamingAnimation={isStreaming}
      onLinkPress={handleLinkPress}
      selectable={!isStreaming}
      allowTrailingMargin={false}
    />
  );
}

/**
 * Memoized TextSegment -- frozen once streaming completes (ChunkedCodeView pattern).
 * Custom comparator: only re-render if content changes OR isStreaming transitions.
 */
export const TextSegment = React.memo(TextSegmentInner, (prev, next) => {
  return prev.content === next.content && prev.isStreaming === next.isStreaming;
});
