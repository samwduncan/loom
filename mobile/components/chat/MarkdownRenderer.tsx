/**
 * Production markdown renderer using react-native-enriched-markdown.
 *
 * Renders streaming and static markdown with full Soul-doc styling:
 * - Body: 15px Inter, text-primary, line-height 24px
 * - Headings: 17px Inter semibold, text-primary
 * - Code blocks: 14px JetBrains Mono, surface-sunken bg, rounded-xl, p-4
 * - Inline code: 14px JetBrains Mono, surface-sunken bg at 0.5 opacity
 * - Blockquotes: left border 3px accent at 0.3 opacity, pl-4
 * - Tables: surface-raised bg for header, border-subtle separators (GFM)
 * - Links: text-primary, underline
 *
 * Code blocks render as unstyled monospace on surface-sunken background.
 * Syntax highlighting is Phase 70 (Shiki integration).
 */

import { useMemo } from 'react';
import { Linking } from 'react-native';
import {
  EnrichedMarkdownText,
  type MarkdownStyle,
  type LinkPressEvent,
} from 'react-native-enriched-markdown';

interface MarkdownRendererProps {
  content: string;
  isStreaming: boolean;
}

const MARKDOWN_STYLE: MarkdownStyle = {
  // Body text: 15px Inter, text-primary
  paragraph: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    lineHeight: 24,
    marginBottom: 8,
  },
  // Headings: 17px Inter semibold
  h1: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  h2: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 24,
  },
  h3: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 22,
  },
  h4: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(191, 186, 182)',
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 22,
  },
  h5: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(191, 186, 182)',
    marginTop: 8,
    marginBottom: 2,
    lineHeight: 20,
  },
  h6: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(148, 144, 141)',
    marginTop: 8,
    marginBottom: 2,
    lineHeight: 20,
  },
  // Code blocks: 14px JetBrains Mono, surface-sunken, rounded-xl, p-4
  codeBlock: {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    color: 'rgb(230, 222, 216)',
    backgroundColor: 'rgb(38, 35, 33)', // surface-sunken
    borderRadius: 12, // rounded-xl
    padding: 16,
    borderColor: 'rgba(255, 255, 255, 0.07)', // border-subtle
    borderWidth: 1,
  },
  // Inline code: 14px JetBrains Mono, surface-sunken bg at 0.5 opacity
  code: {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    color: 'rgb(230, 222, 216)',
    backgroundColor: 'rgba(38, 35, 33, 0.5)', // surface-sunken at 0.5 opacity
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  // Blockquotes: left border 3px accent at 0.3 opacity, pl-4
  blockquote: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(191, 186, 182)', // text-secondary
    borderColor: 'rgba(196, 108, 88, 0.3)', // accent at 0.3
    borderWidth: 3,
    gapWidth: 16, // pl-4 equivalent
    lineHeight: 24,
  },
  // Links: text-primary, underline
  link: {
    color: 'rgb(230, 222, 216)',
    underline: true,
  },
  // Lists: proper indentation, bullet and numbered
  list: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    bulletColor: 'rgb(148, 144, 141)', // text-muted
    markerColor: 'rgb(148, 144, 141)', // text-muted
    gapWidth: 8,
    lineHeight: 24,
  },
  // Bold
  strong: {
    fontWeight: 'bold',
    color: 'rgb(230, 222, 216)',
  },
  // Italic
  em: {
    fontStyle: 'italic',
    color: 'rgb(230, 222, 216)',
  },
  // Horizontal rules: border-subtle, my-4
  thematicBreak: {
    color: 'rgba(255, 255, 255, 0.07)', // border-subtle
    height: 1,
    marginTop: 16, // my-4
    marginBottom: 16,
  },
  // Tables: surface-raised bg for header, border-subtle separators
  table: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    headerBackgroundColor: 'rgb(54, 50, 48)', // surface-raised
    headerTextColor: 'rgb(230, 222, 216)',
    headerFontFamily: 'Inter',
    rowEvenBackgroundColor: 'rgb(46, 42, 40)', // surface-base
    rowOddBackgroundColor: 'rgb(42, 39, 37)', // slightly darker for alternation
    borderColor: 'rgba(255, 255, 255, 0.07)', // border-subtle
    borderWidth: 1,
    borderRadius: 8,
    cellPaddingHorizontal: 12,
    cellPaddingVertical: 8,
  },
};

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const handleLinkPress = useMemo(
    () => (event: LinkPressEvent) => {
      const url = event.url;
      if (url) {
        Linking.openURL(url).catch((err) =>
          console.warn('[MarkdownRenderer] Failed to open URL:', err),
        );
      }
    },
    [],
  );

  return (
    <EnrichedMarkdownText
      markdown={content}
      markdownStyle={MARKDOWN_STYLE}
      flavor="github"
      streamingAnimation={isStreaming}
      onLinkPress={handleLinkPress}
      selectable={!isStreaming}
    />
  );
}
