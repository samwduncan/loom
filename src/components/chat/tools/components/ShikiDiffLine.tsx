import React, { memo, useState, useEffect } from 'react';
import { highlightCode } from '../../hooks/useShikiHighlighter';

interface ShikiDiffLineProps {
  code: string;
  language: string;
}

/**
 * Async Shiki highlighting for individual diff lines.
 * Shows plain text immediately, swaps in highlighted HTML when ready.
 * Memoized to prevent re-highlighting on parent re-renders.
 */
export const ShikiDiffLine = memo(function ShikiDiffLine({ code, language }: ShikiDiffLineProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, language)
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback: plain text already shown
      });
    return () => { cancelled = true; };
  }, [code, language]);

  if (html) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  // Plain text fallback while async highlight resolves
  return <span>{code}</span>;
});
