/**
 * Ripgrep output parser for GrepToolCard.
 *
 * Parses `filepath:linenum:content` lines, groups by file,
 * and handles `--` context separators.
 *
 * Returns null if no lines match the expected pattern,
 * triggering a plain text fallback in the card.
 *
 * Constitution: Named exports only (2.2).
 */

export interface GrepMatch {
  lineNo: number;
  content: string;
}

export interface GrepFileGroup {
  filePath: string;
  matches: GrepMatch[];
}

/** Matches `filepath:linenum:content` — greedy path, numeric line, rest is content */
const GREP_LINE_RE = /^(.+?):(\d+):(.*)$/;

/**
 * Parses ripgrep-style output into file-grouped matches.
 * Returns null if no lines match the expected pattern.
 */
export function parseGrepOutput(output: string): GrepFileGroup[] | null {
  if (!output || !output.trim()) return null;

  const rawLines = output.split('\n');
  const groups: GrepFileGroup[] = [];
  let currentGroup: GrepFileGroup | null = null;
  let matchCount = 0;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // Skip separator lines and empty lines
    if (trimmed === '--' || trimmed === '') continue;

    const match = GREP_LINE_RE.exec(trimmed);
    if (!match) continue;

    const filePath = match[1] as string; // ASSERT: capture group 1 always present when regex matches
    const lineNo = parseInt(match[2] as string, 10); // ASSERT: capture group 2 always present when regex matches
    const content = match[3] ?? ''; // Content after second colon (may be empty)
    matchCount++;

    if (!currentGroup || currentGroup.filePath !== filePath) {
      currentGroup = { filePath, matches: [] };
      groups.push(currentGroup);
    }

    currentGroup.matches.push({ lineNo, content });
  }

  return matchCount > 0 ? groups : null;
}
