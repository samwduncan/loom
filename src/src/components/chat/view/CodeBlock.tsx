/**
 * CodeBlock component with Shiki syntax highlighting.
 *
 * Features:
 * - Language label and copy button with 2s "Copied!" feedback
 * - Line numbers for blocks > 3 lines (CSS counter approach for Shiki)
 * - Max-height 400px with overflow-y for blocks > 20 lines
 * - Horizontal scroll for long lines (no wrapping)
 * - Min-height to prevent CLS during async highlight
 * - Plain monospace fallback until Shiki resolves
 * - useDeferredValue for smooth swap (CODE-06)
 */
import {
  useState,
  useEffect,
  useDeferredValue,
  useCallback,
  type ReactElement,
} from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { highlightCode } from '@/lib/shiki-highlighter';

interface CodeBlockProps {
  language: string;
  code: string;
}

const LINE_NUMBER_THRESHOLD = 3;
const MAX_HEIGHT_THRESHOLD = 20;
const LINE_HEIGHT_PX = 20;
const MAX_HEIGHT_PX = 400;

/**
 * Fenced code block with syntax highlighting, copy button, and line numbers.
 */
function CodeBlock({ language, code }: CodeBlockProps): ReactElement {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const deferredHtml = useDeferredValue(html);

  const lines = code.split('\n');
  const lineCount = lines.length;
  const showLineNumbers = lineCount > LINE_NUMBER_THRESHOLD;
  const showMaxHeight = lineCount > MAX_HEIGHT_THRESHOLD;
  const estimatedHeight = Math.min(lineCount * LINE_HEIGHT_PX, MAX_HEIGHT_PX);

  // Async highlight
  useEffect(() => {
    let cancelled = false;
    highlightCode(language, code).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [language, code]);

  // Copy handler
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const isHighlighted = deferredHtml !== null && deferredHtml !== code;

  return (
    <div
      className="bg-code-surface rounded-lg overflow-hidden my-3 max-w-full min-w-0"
      style={{ minHeight: `${estimatedHeight}px` }}
    >
      {/* Header: language label + copy button */}
      <div className="flex justify-between items-center px-3 py-1.5 border-b border-border-subtle">
        <span className="text-xs text-muted font-mono">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1 text-xs text-muted hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm min-h-[44px] md:min-h-0 px-2 md:px-0"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div
        data-code-scroll
        className={cn(
          'overflow-x-auto',
          showMaxHeight && 'max-h-[400px] overflow-y-auto',
        )}
      >
        {isHighlighted ? (
          <div
            data-highlighted
            {...(showLineNumbers ? { 'data-line-numbers': '' } : {})}
            className={cn(
              'p-3 font-mono text-sm whitespace-pre [&_.shiki]:!bg-transparent [&_.shiki]:overflow-visible',
              showLineNumbers && '[&_.shiki_code]:counter-reset-[line] [&_.shiki_.line]:counter-increment-[line] [&_.shiki_.line]:block [&_.shiki_.line]:before:content-[counter(line)] [&_.shiki_.line]:before:inline-block [&_.shiki_.line]:before:w-8 [&_.shiki_.line]:before:mr-4 [&_.shiki_.line]:before:text-right [&_.shiki_.line]:before:text-muted [&_.shiki_.line]:before:opacity-50',
            )}
            // SAFETY: Shiki generates sanitized HTML from code strings; no user-controlled HTML injection possible.
            dangerouslySetInnerHTML={{ __html: deferredHtml }}
          />
        ) : (
          <div
            className="p-3"
            {...(showLineNumbers ? { 'data-line-numbers': '' } : {})}
          >
            <pre className="whitespace-pre font-mono text-sm text-primary overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export { CodeBlock };
