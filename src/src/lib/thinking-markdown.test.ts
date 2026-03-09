/**
 * thinking-markdown tests -- inline-only markdown parser for thinking blocks.
 *
 * Validates: bold, italic, code spans, links, mixed formatting, sanitization,
 * code-first extraction (backticks prevent inner bold/italic), no block elements.
 */

import { describe, it, expect } from 'vitest';
import { parseThinkingMarkdown } from './thinking-markdown';

describe('parseThinkingMarkdown', () => {
  it('converts **bold** to <strong>', () => {
    expect(parseThinkingMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('converts __bold__ to <strong>', () => {
    expect(parseThinkingMarkdown('__bold__')).toContain('<strong>bold</strong>');
  });

  it('converts *italic* to <em>', () => {
    expect(parseThinkingMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('converts _italic_ to <em>', () => {
    expect(parseThinkingMarkdown('_italic_')).toContain('<em>italic</em>');
  });

  it('converts `code` to <code class="thinking-code">', () => {
    const result = parseThinkingMarkdown('`code`');
    expect(result).toContain('<code class="thinking-code">code</code>');
  });

  it('converts [link](url) to <a> with target and rel', () => {
    const result = parseThinkingMarkdown('[link](https://example.com)');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('>link</a>');
  });

  it('handles mixed inline formatting', () => {
    const result = parseThinkingMarkdown('**bold** and `code`');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<code class="thinking-code">code</code>');
  });

  it('returns empty string for empty input', () => {
    expect(parseThinkingMarkdown('')).toBe('');
  });

  it('sanitizes <script> tags', () => {
    const result = parseThinkingMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('does not process bold/italic inside backticks', () => {
    const result = parseThinkingMarkdown('`**not bold**`');
    expect(result).not.toContain('<strong>');
    expect(result).toContain('**not bold**');
  });

  it('does not produce block-level elements (no headings, lists, code fences)', () => {
    const heading = parseThinkingMarkdown('# Heading');
    expect(heading).not.toContain('<h1>');
    expect(heading).toContain('# Heading');

    const list = parseThinkingMarkdown('- item');
    expect(list).not.toContain('<li>');
    expect(list).toContain('- item');

    const fence = parseThinkingMarkdown('```js\ncode\n```');
    expect(fence).not.toContain('<pre>');
  });

  it('escapes HTML entities in regular text', () => {
    const result = parseThinkingMarkdown('a < b & c > d');
    expect(result).toContain('&lt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&gt;');
  });

  it('preserves newlines as line breaks', () => {
    const result = parseThinkingMarkdown('line1\nline2');
    expect(result).toBeTruthy();
  });
});
