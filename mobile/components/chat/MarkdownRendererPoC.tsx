/**
 * MarkdownRendererPoC -- PoC test wrapper for react-native-enriched-markdown.
 *
 * Used by the markdown-poc screen to evaluate streaming performance.
 * During streaming, uses a debounced setState pattern (50ms) to batch
 * content updates, matching research Pattern 6.
 *
 * This is the evaluation component. MarkdownRenderer.tsx is the production version.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { EnrichedMarkdownText, type MarkdownStyle } from 'react-native-enriched-markdown';

interface MarkdownRendererPoCProps {
  content: string;
  isStreaming: boolean;
}

const MARKDOWN_STYLE: MarkdownStyle = {
  paragraph: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    lineHeight: 24,
  },
  h1: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    marginTop: 12,
    marginBottom: 4,
  },
  codeBlock: {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    color: 'rgb(230, 222, 216)',
    backgroundColor: 'rgb(38, 35, 33)',
    borderRadius: 12,
    padding: 16,
  },
  code: {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    color: 'rgb(230, 222, 216)',
    backgroundColor: 'rgba(38, 35, 33, 0.5)',
  },
  blockquote: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(191, 186, 182)',
    borderColor: 'rgba(196, 108, 88, 0.3)',
    borderWidth: 3,
    gapWidth: 16,
  },
  link: {
    color: 'rgb(230, 222, 216)',
    underline: true,
  },
  list: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    bulletColor: 'rgb(148, 144, 141)',
    markerColor: 'rgb(148, 144, 141)',
    gapWidth: 8,
  },
  strong: {
    fontWeight: 'bold',
    color: 'rgb(230, 222, 216)',
  },
  em: {
    fontStyle: 'italic',
    color: 'rgb(230, 222, 216)',
  },
  thematicBreak: {
    color: 'rgba(255, 255, 255, 0.07)',
    height: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  table: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    headerBackgroundColor: 'rgb(54, 50, 48)',
    headerTextColor: 'rgb(230, 222, 216)',
    rowEvenBackgroundColor: 'rgb(46, 42, 40)',
    rowOddBackgroundColor: 'rgb(42, 39, 37)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: 8,
    cellPaddingHorizontal: 12,
    cellPaddingVertical: 8,
  },
};

export function MarkdownRendererPoC({ content, isStreaming }: MarkdownRendererPoCProps) {
  const contentRef = useRef(content);
  const [displayContent, setDisplayContent] = useState(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // During streaming: batch updates every 50ms (Pattern 6)
  useEffect(() => {
    contentRef.current = content;

    if (isStreaming) {
      if (timerRef.current === null) {
        timerRef.current = setTimeout(() => {
          setDisplayContent(contentRef.current);
          timerRef.current = null;
        }, 50);
      }
    } else {
      // Not streaming -- update immediately
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDisplayContent(content);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [content, isStreaming]);

  return (
    <EnrichedMarkdownText
      markdown={displayContent}
      markdownStyle={MARKDOWN_STYLE}
      flavor="github"
      streamingAnimation={isStreaming}
    />
  );
}
