/**
 * GrepToolCard -- search results card for grep output.
 *
 * Shows search pattern, match summary, and file-grouped matches
 * with highlighted search terms. Truncates at 5 files.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useMemo, useState } from 'react';
import { File } from 'lucide-react';
import { cn } from '@/utils/cn';
import { parseGrepOutput } from '@/lib/grep-parser';
import type { GrepFileGroup } from '@/lib/grep-parser';
import type { ToolCardProps } from '@/lib/tool-registry';

const FILE_TRUNCATION_THRESHOLD = 5;

/**
 * Creates a safe regex from the search pattern string.
 * Returns null if the pattern is not valid regex.
 */
function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(`(${pattern})`, 'gi');
  } catch {
    return null;
  }
}

/**
 * Highlights match terms in content by wrapping them in <mark> elements.
 * Falls back to plain text if the regex is invalid.
 */
function highlightContent(content: string, regex: RegExp | null): React.ReactNode {
  if (!regex || !content) return content;

  const parts = content.split(regex);
  if (parts.length === 1) return content;

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <mark
          key={i}
          className="bg-[var(--primary)]/20 text-[var(--primary)] rounded-sm px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export const GrepToolCard = memo(function GrepToolCard({
  input,
  output,
}: ToolCardProps) {
  const pattern = typeof input.pattern === 'string' ? input.pattern : '';
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(() => {
    if (output == null) return null;
    return parseGrepOutput(output);
  }, [output]);

  const matchRegex = useMemo(() => safeRegex(pattern), [pattern]);

  // Count total matches across all groups
  const totalMatches = useMemo(() => {
    if (!parsed) return 0;
    return parsed.reduce((sum, group) => sum + group.matches.length, 0);
  }, [parsed]);

  const visibleGroups = useMemo(() => {
    if (!parsed) return [];
    if (expanded) return parsed;
    return parsed.slice(0, FILE_TRUNCATION_THRESHOLD);
  }, [parsed, expanded]);

  const remainingFiles = parsed ? parsed.length - FILE_TRUNCATION_THRESHOLD : 0;

  return (
    <div
      className={cn(
        'rounded-md overflow-hidden',
        'bg-[var(--surface-base)] text-[length:var(--text-body)]',
      )}
    >
      {/* Pattern header */}
      <div
        className={cn(
          'px-3 py-2',
          'border-b border-[var(--border-subtle)]',
        )}
      >
        <code className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
          {pattern}
        </code>
        {parsed != null && (
          <span className="text-xs text-[var(--text-muted)] ml-2">
            {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} in{' '}
            {parsed.length} {parsed.length === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {/* Results body */}
      {output != null && (
        <div className="px-3 py-2">
          {parsed != null ? (
            <>
              {visibleGroups.map((group) => (
                <FileGroupSection
                  key={group.filePath}
                  group={group}
                  matchRegex={matchRegex}
                />
              ))}
              {remainingFiles > 0 && !expanded && (
                <button
                  type="button"
                  className={cn(
                    'text-xs py-1 cursor-pointer',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                  onClick={() => setExpanded(true)}
                >
                  Show {remainingFiles} more {remainingFiles === 1 ? 'file' : 'files'}
                </button>
              )}
              {expanded && remainingFiles > 0 && (
                <button
                  type="button"
                  className={cn(
                    'text-xs py-1 cursor-pointer',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                  onClick={() => setExpanded(false)}
                >
                  Show less
                </button>
              )}
            </>
          ) : (
            /* Fallback: plain text for unparseable output */
            <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-all">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Renders a single file group with file path header and match lines.
 */
function FileGroupSection({
  group,
  matchRegex,
}: {
  group: GrepFileGroup;
  matchRegex: RegExp | null;
}) {
  return (
    <div className="mb-2 last:mb-0">
      {/* File path header */}
      <div className="flex items-center gap-1.5 py-1">
        <File size={14} className="text-[var(--text-muted)] shrink-0" />
        <span className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)] truncate">
          {group.filePath}
        </span>
      </div>
      {/* Match lines */}
      {group.matches.map((match, i) => (
        <div key={i} className="flex font-[family-name:var(--font-mono)] text-sm leading-relaxed">
          <span className="text-[var(--text-muted)] w-12 text-right shrink-0 select-none pr-2">
            {match.lineNo}
          </span>
          <span className="text-[var(--text-secondary)] whitespace-pre-wrap break-all">
            {highlightContent(match.content, matchRegex)}
          </span>
        </div>
      ))}
    </div>
  );
}
