/**
 * Lightweight ANSI escape sequence to HTML span conversion.
 *
 * Handles SGR codes: reset (0), bold (1), underline (4),
 * foreground colors (30-37, 90-97). Emits CSS class-based spans
 * mapped to design tokens via tool-cards.css.
 *
 * Constitution: Named exports only (2.2).
 */

/** Map SGR color codes to CSS class names */
const FG_CLASSES: Record<number, string> = {
  30: 'ansi-black',
  31: 'ansi-red',
  32: 'ansi-green',
  33: 'ansi-yellow',
  34: 'ansi-blue',
  35: 'ansi-magenta',
  36: 'ansi-cyan',
  37: 'ansi-white',
  90: 'ansi-bright-black',
  91: 'ansi-bright-red',
  92: 'ansi-bright-green',
  93: 'ansi-bright-yellow',
  94: 'ansi-bright-blue',
  95: 'ansi-bright-magenta',
  96: 'ansi-bright-cyan',
  97: 'ansi-bright-white',
};

interface StyleState {
  bold: boolean;
  underline: boolean;
  fg: number | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildClasses(state: StyleState): string {
  const classes: string[] = [];
  if (state.fg !== null) {
    const cls = FG_CLASSES[state.fg];
    if (cls) classes.push(cls);
  }
  if (state.bold) classes.push('ansi-bold');
  if (state.underline) classes.push('ansi-underline');
  return classes.join(' ');
}

/**
 * Converts ANSI escape sequences to HTML spans with CSS classes.
 * Returns plain text unchanged if no ANSI sequences are found.
 *
 * SAFETY: Only emits className-based spans. Input text is HTML-escaped
 * before wrapping, preventing injection.
 */
export function parseAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex -- ANSI escape sequences are control characters by definition
  const ansiRegex = /\x1b\[([0-9;]*)m/g;

  // Fast path: no ANSI sequences
  if (!ansiRegex.test(text)) {
    return escapeHtml(text);
  }
  ansiRegex.lastIndex = 0;

  const state: StyleState = { bold: false, underline: false, fg: null };
  let result = '';
  let lastIndex = 0;
  let spanOpen = false;

  let match: RegExpExecArray | null;
  while ((match = ansiRegex.exec(text)) !== null) {
    // Emit text before this sequence
    const chunk = text.slice(lastIndex, match.index);
    if (chunk) {
      result += escapeHtml(chunk);
    }
    lastIndex = match.index + match[0].length;

    // Close any open span before style change
    if (spanOpen) {
      result += '</span>';
      spanOpen = false;
    }

    // Parse semicolon-separated SGR codes
    const codes = match[1]
      ? match[1].split(';').map(Number)
      : [0]; // ESC[m is equivalent to ESC[0m

    for (const code of codes) {
      if (code === 0) {
        state.bold = false;
        state.underline = false;
        state.fg = null;
      } else if (code === 1) {
        state.bold = true;
      } else if (code === 4) {
        state.underline = true;
      } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
        state.fg = code;
      }
    }

    // Open new span if any style is active
    const classes = buildClasses(state);
    if (classes) {
      result += `<span class="${classes}">`;
      spanOpen = true;
    }
  }

  // Emit remaining text
  const tail = text.slice(lastIndex);
  if (tail) {
    result += escapeHtml(tail);
  }

  // Close trailing span
  if (spanOpen) {
    result += '</span>';
  }

  return result;
}
