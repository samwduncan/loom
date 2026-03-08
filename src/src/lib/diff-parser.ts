/**
 * Client-side unified diff computation using the `diff` npm package.
 *
 * Wraps `structuredPatch` to produce a flat array of typed diff lines
 * with dual line numbers, suitable for rendering in EditToolCard.
 *
 * Constitution: Named exports only (2.2).
 */

import { structuredPatch } from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'context';
  content: string;
  oldLineNo: number | null;
  newLineNo: number | null;
}

/**
 * Computes a unified diff between two strings.
 * Returns an empty array if the strings are identical.
 */
export function computeDiff(
  oldStr: string,
  newStr: string,
  contextLines = 3,
): DiffLine[] {
  if (oldStr === newStr) return [];

  const patch = structuredPatch('', '', oldStr, newStr, '', '', {
    context: contextLines,
  });

  const lines: DiffLine[] = [];

  for (const hunk of patch.hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;

    for (const line of hunk.lines) {
      // Skip "\ No newline at end of file" markers
      if (line.startsWith('\\')) continue;

      if (line.startsWith('+')) {
        lines.push({
          type: 'added',
          content: line.slice(1),
          oldLineNo: null,
          newLineNo: newLine++,
        });
      } else if (line.startsWith('-')) {
        lines.push({
          type: 'removed',
          content: line.slice(1),
          oldLineNo: oldLine++,
          newLineNo: null,
        });
      } else {
        lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNo: oldLine++,
          newLineNo: newLine++,
        });
      }
    }
  }

  return lines;
}
