import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../../../../utils/clipboard';
import { highlightCode } from '../../hooks/useShikiHighlighter';

type ShikiCodeBlockProps = {
  code: string;
  language: string;
  isStreaming?: boolean;
  filename?: string;
};

/** Lines beyond which a code block is truncated */
const TRUNCATION_THRESHOLD = 50;
/** Visible lines when truncated */
const TRUNCATED_VISIBLE = 25;

/**
 * Shiki-powered code block with:
 *  - Header bar (language label, optional filename, copy button)
 *  - Warm Dark+ syntax highlighting
 *  - Streaming fallback (raw monospace until Shiki resolves)
 *  - Long-block truncation (50+ lines -> show 25 with expand)
 *  - Soft word wrap (no horizontal scrollbar)
 */
export const ShikiCodeBlock = memo(function ShikiCodeBlock({ code, language, isStreaming = false, filename }: ShikiCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Highlight asynchronously once streaming is done
  useEffect(() => {
    if (isStreaming) {
      setHtml(null);
      return;
    }

    let cancelled = false;

    highlightCode(code, language).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, isStreaming]);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    copyTextToClipboard(code).then((success) => {
      if (success) {
        setCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }
    });
  }, [code]);

  const lines = code.split('\n');
  const totalLines = lines.length;
  const shouldTruncate = !isStreaming && totalLines > TRUNCATION_THRESHOLD && !expanded;
  const hiddenCount = shouldTruncate ? totalLines - TRUNCATED_VISIBLE : 0;

  // Display language label -- uppercase for header
  const displayLang = language && language !== 'text' ? language : '';

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-[#3d2e25]/40">
      {/* ---- Header bar ---- */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#241a14] text-xs text-[#c4a882] select-none">
        <span className="uppercase font-medium tracking-wide">
          {displayLang}
        </span>

        {filename && (
          <span className="text-[#a08a6e] truncate max-w-[50%] text-center">
            {filename}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-[#3d2e25]/60 text-[#c4a882] hover:text-[#f5e6d3]"
          title={copied ? 'Copied' : 'Copy code'}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* ---- Code body ---- */}
      {isStreaming || html === null ? (
        /* Streaming / loading fallback: raw monospace */
        <pre
          className="bg-[#1c1210] text-[#f5e6d3] text-sm font-mono p-4 overflow-x-auto"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          <code>{shouldTruncate ? lines.slice(0, TRUNCATED_VISIBLE).join('\n') : code}</code>
        </pre>
      ) : (
        /* Highlighted HTML from Shiki */
        <div
          className="shiki-code-block text-sm overflow-x-auto [&_pre]:!bg-[#1c1210] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!rounded-none [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&_pre]:!overflow-x-auto"
          dangerouslySetInnerHTML={{
            __html: shouldTruncate
              ? truncateShikiHtml(html, TRUNCATED_VISIBLE)
              : html,
          }}
        />
      )}

      {/* ---- Truncation expand button ---- */}
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-xs text-center text-[#c4a882] bg-[#241a14] hover:bg-[#3d2e25]/60 transition-colors border-t border-[#3d2e25]/40"
        >
          Show {hiddenCount} more line{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
});

/**
 * Truncate Shiki HTML output to the first N lines.
 *
 * Shiki wraps each line in a `<span class="line">` element.
 * We use a simple approach: find the Nth `</span>` that closes a
 * `.line` span and cut the HTML there, then close any open tags.
 */
function truncateShikiHtml(html: string, visibleLines: number): string {
  // Shiki v4 wraps lines in <span class="line">...</span>
  const lineTag = '<span class="line">';
  let idx = -1;
  let count = 0;

  while (count < visibleLines) {
    idx = html.indexOf(lineTag, idx + 1);
    if (idx === -1) return html; // fewer lines than threshold
    count++;
  }

  // Find the start of the next line tag (or end) and cut before it
  const nextLineStart = html.indexOf(lineTag, idx + lineTag.length);
  if (nextLineStart === -1) return html;

  // Slice up to just before the next line and close open tags
  const truncated = html.slice(0, nextLineStart);
  // Close any open </code></pre></div> tags
  const openPre = (truncated.match(/<pre/g) || []).length - (truncated.match(/<\/pre>/g) || []).length;
  const openCode = (truncated.match(/<code/g) || []).length - (truncated.match(/<\/code>/g) || []).length;

  let suffix = '';
  if (openCode > 0) suffix += '</code>';
  if (openPre > 0) suffix += '</pre>';

  return truncated + suffix;
}
