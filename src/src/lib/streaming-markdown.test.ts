/**
 * Tests for streaming markdown converter.
 *
 * Covers all 8 formatting constructs, unclosed code fences,
 * incomplete tables, XSS sanitization, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { convertStreamingMarkdown } from './streaming-markdown';

describe('convertStreamingMarkdown', () => {
  describe('inline formatting', () => {
    it('converts bold (**) to <strong>', () => {
      const result = convertStreamingMarkdown('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('converts italic (*) to <em>', () => {
      const result = convertStreamingMarkdown('*italic*');
      expect(result).toContain('<em>italic</em>');
    });

    it('converts inline code to <code>', () => {
      const result = convertStreamingMarkdown('`code`');
      expect(result).toContain('<code>code</code>');
    });

    it('converts links to <a>', () => {
      const result = convertStreamingMarkdown('[text](https://example.com)');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('text</a>');
    });
  });

  describe('headings', () => {
    it('converts # to h1', () => {
      const result = convertStreamingMarkdown('# Heading');
      expect(result).toContain('<h1>Heading</h1>');
    });

    it('converts ## and ### to correct levels', () => {
      const result = convertStreamingMarkdown('## H2\n### H3');
      expect(result).toContain('<h2>H2</h2>');
      expect(result).toContain('<h3>H3</h3>');
    });
  });

  describe('lists', () => {
    it('converts unordered list', () => {
      const result = convertStreamingMarkdown('- item1\n- item2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item1</li>');
      expect(result).toContain('<li>item2</li>');
      expect(result).toContain('</ul>');
    });

    it('converts ordered list', () => {
      const result = convertStreamingMarkdown('1. first\n2. second');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>first</li>');
      expect(result).toContain('<li>second</li>');
      expect(result).toContain('</ol>');
    });
  });

  describe('blockquotes', () => {
    it('converts > to blockquote', () => {
      const result = convertStreamingMarkdown('> quote');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('quote');
      expect(result).toContain('</blockquote>');
    });
  });

  describe('code fences', () => {
    it('converts closed code fence with language', () => {
      const result = convertStreamingMarkdown('```js\nconst x = 1;\n```');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('streaming-code-block');
    });

    it('handles unclosed code fence by injecting synthetic close', () => {
      const result = convertStreamingMarkdown('```js\nconst x = 1;');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('streaming-code-block');
    });
  });

  describe('paragraphs and line breaks', () => {
    it('wraps paragraphs in <p> tags', () => {
      const result = convertStreamingMarkdown('normal paragraph\n\nanother paragraph');
      expect(result).toContain('<p>');
      expect(result).toContain('normal paragraph');
      expect(result).toContain('another paragraph');
    });
  });

  describe('incomplete tables', () => {
    it('renders incomplete table as plain text', () => {
      const result = convertStreamingMarkdown('text\n| col1 | col2 |\n| --- | --- |\n| a | b |');
      // Table portion should be plain text, not parsed as HTML table
      expect(result).not.toContain('<table>');
      expect(result).toContain('| col1 | col2 |');
    });
  });

  describe('XSS sanitization', () => {
    it('strips script tags', () => {
      const result = convertStreamingMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('strips img tags with onerror', () => {
      const result = convertStreamingMarkdown('<img onerror="alert(1)" src="x">');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror');
    });

    it('only allows whitelisted tags', () => {
      const result = convertStreamingMarkdown('<div><iframe src="evil.com"></iframe></div>');
      expect(result).not.toContain('<iframe');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(convertStreamingMarkdown('')).toBe('');
    });

    it('preserves code content inside backticks (no bold conversion)', () => {
      const result = convertStreamingMarkdown('`**not bold**`');
      expect(result).toContain('<code>**not bold**</code>');
      expect(result).not.toContain('<strong>');
    });

    it('handles mixed formatting: bold with italic inside', () => {
      const result = convertStreamingMarkdown('**bold *and italic* text**');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>and italic</em>');
    });

    it('handles large input without throwing', () => {
      const largeInput = 'Hello world. '.repeat(1000);
      expect(() => convertStreamingMarkdown(largeInput)).not.toThrow();
    });
  });
});
