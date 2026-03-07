/**
 * streaming-markdown — Lightweight markdown-to-HTML converter for streaming text.
 *
 * Pure function: markdown string -> sanitized HTML string.
 * Designed for use in the rAF paint loop (useStreamBuffer), where raw tokens
 * need to render as formatted HTML rather than raw markdown source.
 *
 * Processing order matters — code fences/inline code are extracted first
 * to prevent false matches on formatting characters inside code.
 *
 * Constitution: Named export only (2.2).
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'strong', 'em', 'code', 'a', 'p', 'br',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'div', 'blockquote',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

interface Placeholder {
  key: string;
  html: string;
}

let placeholderCounter = 0;

// Use Unicode private-use-area characters as placeholder delimiters.
// These won't appear in normal markdown text and avoid ESLint no-control-regex.
const PH_START = '\uE000';
const PH_END = '\uE001';

function makePlaceholder(): string {
  return `${PH_START}PH${++placeholderCounter}${PH_END}`;
}

/**
 * Convert a streaming markdown string to sanitized HTML.
 *
 * Handles: bold, italic, inline code, headings, lists, blockquotes,
 * code fences (including unclosed), links, paragraphs, and line breaks.
 *
 * Incomplete GFM tables are left as plain text.
 * XSS vectors are stripped via DOMPurify allowlist.
 */
export function convertStreamingMarkdown(raw: string): string {
  if (!raw) return '';

  const codePlaceholders: Placeholder[] = [];
  const inlinePlaceholders: Placeholder[] = [];
  let text = raw;

  // --- Step a: Extract code fences ---
  // Match complete fences first
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const key = makePlaceholder();
    const langLabel = lang ? `<div class="streaming-code-lang">${escapeHtml(lang)}</div>` : '';
    codePlaceholders.push({
      key,
      html: `<pre><div class="streaming-code-block">${langLabel}<code>${escapeHtml(code)}</code></div></pre>`,
    });
    return key;
  });

  // Handle unclosed fences (odd opening ``` without closing)
  text = text.replace(/```(\w*)\n([\s\S]*)$/g, (_match, lang: string, code: string) => {
    const key = makePlaceholder();
    const langLabel = lang ? `<div class="streaming-code-lang">${escapeHtml(lang)}</div>` : '';
    codePlaceholders.push({
      key,
      html: `<pre><div class="streaming-code-block">${langLabel}<code>${escapeHtml(code)}</code></div></pre>`,
    });
    return key;
  });

  // --- Step b: Extract inline code ---
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const key = makePlaceholder();
    inlinePlaceholders.push({
      key,
      html: `<code>${escapeHtml(code)}</code>`,
    });
    return key;
  });

  // --- Incomplete table detection ---
  // If trailing content looks like a table (lines starting with |) without
  // a blank line after, leave as plain text by not parsing it as a table.
  // (We just don't have table parsing, so this is naturally handled.)

  // --- Step c-j: Process line by line for block elements ---
  text = processBlocks(text);

  // --- Step f-h: Inline formatting (on the result) ---
  text = processInlineFormatting(text);

  // --- Step k: Restore inline code placeholders ---
  for (const p of inlinePlaceholders) {
    text = text.replace(p.key, p.html);
  }

  // --- Step l: Restore code fence placeholders ---
  for (const p of codePlaceholders) {
    text = text.replace(p.key, p.html);
  }

  // --- Sanitize ---
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}

/**
 * Process block-level elements: headings, lists, blockquotes, paragraphs.
 */
function processBlocks(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] as string;

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = (headingMatch[1] as string).length;
      output.push(`<h${level}>${headingMatch[2] as string}</h${level}>`);
      i++;
      continue;
    }

    // Blockquotes (consecutive lines starting with >)
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] as string)) {
        quoteLines.push((lines[i] as string).replace(/^>\s?/, ''));
        i++;
      }
      output.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
      continue;
    }

    // Unordered lists (- or *)
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] as string)) {
        items.push(`<li>${(lines[i] as string).replace(/^[-*]\s/, '')}</li>`);
        i++;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered lists
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] as string)) {
        items.push(`<li>${(lines[i] as string).replace(/^\d+\.\s/, '')}</li>`);
        i++;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Empty lines (paragraph separator)
    if (line.trim() === '') {
      output.push('');
      i++;
      continue;
    }

    // Regular text line
    output.push(line);
    i++;
  }

  // Wrap consecutive non-empty, non-block lines in <p> tags
  return wrapParagraphs(output);
}

/**
 * Wrap groups of plain text lines in <p> tags.
 * Block elements (already wrapped in tags) are left alone.
 */
function wrapParagraphs(lines: string[]): string {
  const result: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      result.push(`<p>${paragraphLines.join('<br>')}</p>`);
      paragraphLines = [];
    }
  };

  for (const line of lines) {
    if (line === '') {
      flushParagraph();
      continue;
    }

    // Check if line is already a block element
    if (/^<(h[1-6]|ul|ol|blockquote|pre|div)/.test(line)) {
      flushParagraph();
      result.push(line);
      continue;
    }

    // Also check for placeholder lines (code fence placeholders)
    if (line.startsWith(PH_START) && line.endsWith(PH_END)) {
      flushParagraph();
      result.push(line);
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return result.join('');
}

/**
 * Process inline formatting: bold, italic, links.
 * Applied after block processing, so it works within paragraphs and list items.
 */
function processInlineFormatting(text: string): string {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (negative lookbehind for * to avoid bold conflicts)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return text;
}

/**
 * Escape HTML entities in text content (for code blocks).
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
