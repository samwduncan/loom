/**
 * ReadToolCard -- file content card with Shiki syntax highlighting.
 *
 * Shows file path with icon, syntax-highlighted content with line numbers,
 * truncated at 100 lines with "Show more" / "Show less" toggle.
 *
 * Uses the same Shiki pattern as CodeBlock: useState + useDeferredValue
 * with plain monospace fallback while highlighting loads.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useState, useEffect, useDeferredValue, useCallback } from 'react';
import { FileText, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { highlightCode, getLanguageFromPath } from '@/lib/shiki-highlighter';
import type { ToolCardProps } from '@/lib/tool-registry';

const READ_TRUNCATION_THRESHOLD = 100;

export const ReadToolCard = memo(function ReadToolCard({
  input,
  output,
}: ToolCardProps) {
  const filePath =
    typeof input.file_path === 'string' ? input.file_path : 'unknown';
  const language = getLanguageFromPath(filePath);

  return (
    <FileContentCard
      filePath={filePath}
      language={language}
      content={output}
      threshold={READ_TRUNCATION_THRESHOLD}
      icon={<FileText size={14} className="shrink-0" />}
    />
  );
});

// ---------------------------------------------------------------------------
// Shared file content card (reused by WriteToolCard)
// ---------------------------------------------------------------------------

export interface FileContentCardProps {
  filePath: string;
  language: string;
  content: string | null;
  threshold: number;
  icon: React.ReactNode;
  expandLabel?: string;
}

export const FileContentCard = memo(function FileContentCard({
  filePath,
  language,
  content,
  threshold,
  icon,
  expandLabel,
}: FileContentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const deferredHtml = useDeferredValue(html);

  const allLines = content?.split('\n') ?? [];
  const remaining = allLines.length - threshold;
  const needsTruncation = remaining > 0;
  const visibleLines = expanded || !needsTruncation
    ? allLines
    : allLines.slice(0, threshold);
  const visibleCode = visibleLines.join('\n');
  const showLineNumbers = visibleLines.length > 3;

  // Async Shiki highlight -- highlight only visible lines
  // Skip for 'text' language (no grammar) or null content -- html stays null = fallback
  useEffect(() => {
    if (!content || language === 'text') return;
    let cancelled = false;
    highlightCode(language, visibleCode).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [language, visibleCode, content]);

  // Copy full content (not just visible)
  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const isHighlighted = deferredHtml !== null && deferredHtml !== visibleCode;

  return (
    <div className="rounded-md overflow-hidden bg-[var(--surface-base)]">
      {/* File path header */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2',
          'border-b border-[var(--border-subtle)]',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[var(--text-muted)]">{icon}</span>
          <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] truncate">
            {filePath}
          </span>
        </div>
        {content != null && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy file content"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check size={12} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content area */}
      {content != null && (
        <div className="overflow-x-auto">
          {isHighlighted ? (
            <div
              data-highlighted
              className={cn(
                'px-3 py-2 font-[family-name:var(--font-mono)] text-sm whitespace-pre [&_.shiki]:!bg-transparent [&_.shiki]:overflow-visible',
                showLineNumbers && '[&_.shiki_code]:counter-reset-[line] [&_.shiki_.line]:counter-increment-[line] [&_.shiki_.line]:block [&_.shiki_.line]:before:content-[counter(line)] [&_.shiki_.line]:before:inline-block [&_.shiki_.line]:before:w-8 [&_.shiki_.line]:before:mr-4 [&_.shiki_.line]:before:text-right [&_.shiki_.line]:before:text-muted [&_.shiki_.line]:before:opacity-50',
              )}
              // SAFETY: Shiki generates sanitized HTML from code strings; no user-controlled HTML injection possible.
              dangerouslySetInnerHTML={{ __html: deferredHtml }}
            />
          ) : (
            <pre className="px-3 py-2 whitespace-pre font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)] overflow-x-auto">
              <code>{visibleCode}</code>
            </pre>
          )}
        </div>
      )}

      {/* Truncation controls */}
      {content != null && needsTruncation && (
        <div className="px-3 pb-2">
          <button
            type="button"
            className="text-xs py-1 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? 'Show less'
              : expandLabel ?? `Show ${remaining} more lines`}
          </button>
        </div>
      )}

      {/* Null output placeholder */}
      {content == null && (
        <div className="px-3 py-2 text-xs text-[var(--text-muted)] italic">
          No content
        </div>
      )}
    </div>
  );
});
