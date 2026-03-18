/**
 * extractSessionTitle -- extracts a clean, user-facing title from the first
 * message in a session.
 *
 * Strips system prefixes, XML wrapper blocks, JSON Task Master content, and
 * truncates at word boundaries. Used by ChatComposer for stub session titles.
 *
 * Constitution: Named export only (2.2).
 */

/** Prefixes that indicate system/command content -- not real user messages. */
const SYSTEM_PREFIXES = [
  '<command-name>',
  '<command-message>',
  '<command-args>',
  '<local-command-stdout>',
  '<system-reminder>',
  'Caveat:',
  'This session is being continued from a previous',
  'Invalid API key',
] as const;

/**
 * XML wrapper tags that should be stripped (full open+close tag with content).
 * These appear at the start of GSD/orchestrator messages before real user text.
 */
const WRAPPER_TAGS = [
  'objective',
  'task-notification',
  'files_to_read',
  'additional_context',
  'output',
  'user_constraints',
  'phase_requirements',
] as const;

/**
 * Extract a clean session title from raw message text.
 *
 * @param text - Raw first-message text
 * @param maxLength - Maximum title length before truncation (default 80)
 * @returns Clean title string, or '' if the message is system/noise content
 */
export function extractSessionTitle(text: string, maxLength = 80): string {
  let cleaned = text.trim();

  // Empty / whitespace-only
  if (!cleaned) return '';

  // System prefix detection -- return empty for system content
  for (const prefix of SYSTEM_PREFIXES) {
    if (cleaned.startsWith(prefix)) return '';
  }

  // JSON Task Master content detection
  if (cleaned.startsWith('{') && cleaned.includes('"subtasks"')) return '';
  if (cleaned.includes('CRITICAL: You MUST respond with ONLY a JSON')) return '';

  // Strip leading XML wrapper blocks (tags from WRAPPER_TAGS list)
  for (const tag of WRAPPER_TAGS) {
    const pattern = new RegExp(
      `^<${tag}[^>]*>[\\s\\S]*?</${tag}>\\s*`,
    );
    cleaned = cleaned.replace(pattern, '');
  }

  // Strip any remaining leading XML tags (e.g., <foo>content</foo>)
  cleaned = cleaned.replace(/^<[a-zA-Z_][\w-]*>[^<]*<\/[a-zA-Z_][\w-]*>\s*/, '');

  // Final trim after stripping
  cleaned = cleaned.trim();
  if (!cleaned) return '';

  // Truncation at word boundary
  if (cleaned.length > maxLength) {
    // Try to find a word boundary at >= 60% of maxLength
    const minBreak = Math.floor(maxLength * 0.6);
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace >= minBreak) {
      return truncated.slice(0, lastSpace) + '...';
    }
    // No good word boundary -- hard truncate
    return truncated + '...';
  }

  return cleaned;
}
