/**
 * thinking-markdown -- Inline-only markdown parser for thinking blocks.
 *
 * Converts bold, italic, inline code, and links to sanitized HTML.
 * No block-level elements (headings, lists, code fences) -- thinking blocks
 * render as monospace paragraphs with inline formatting only.
 *
 * Processing order: (1) escape HTML, (2) extract inline code to placeholders,
 * (3) bold, (4) italic, (5) links, (6) restore code placeholders,
 * (7) DOMPurify sanitize.
 *
 * Constitution: Named export only (2.2).
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['strong', 'em', 'code', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

interface Placeholder {
  key: string;
  code: string;
}

// Unicode PUA characters as placeholder delimiters (same pattern as streaming-markdown.ts)
const PH_START = '\uE000';
const PH_END = '\uE001';

/**
 * Escape HTML entities in text content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse thinking block text into sanitized inline HTML.
 *
 * Handles: **bold**, *italic*, `code`, [link](url).
 * Does NOT produce block-level elements.
 * XSS vectors stripped via DOMPurify strict allowlist.
 */
export function parseThinkingMarkdown(text: string): string {
  if (!text) return '';

  let counter = 0;
  const placeholders: Placeholder[] = [];

  // Step 0: Strip PUA characters from input to prevent placeholder spoofing
  let result = text.replace(/[\uE000\uE001]/g, '');

  // Step 1: Escape HTML
  result = escapeHtml(result);

  // Step 2: Extract inline code spans to placeholders (prevents inner formatting)
  result = result.replace(/`([^`]+)`/g, (_match, code: string) => {
    const key = `${PH_START}TH${++counter}${PH_END}`;
    placeholders.push({ key, code });
    return key;
  });

  // Step 3: Bold (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Step 4: Italic (*text* or _text_)
  // Asterisk italic: match *text* not preceded/followed by *
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Underscore italic: require word boundary (whitespace/start/end) to avoid
  // mangling identifiers like my_variable_name in thinking blocks
  result = result.replace(/(?<=\s|^)_(?!_)(.+?)(?<!_)_(?=\s|$)/gm, '<em>$1</em>');

  // Step 5: Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Step 6: Restore code placeholders with thinking-code class
  for (const p of placeholders) {
    result = result.replace(p.key, `<code class="thinking-code">${p.code}</code>`);
  }

  // Step 7: Sanitize with DOMPurify
  return DOMPurify.sanitize(result, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}
