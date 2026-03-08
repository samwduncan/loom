import { describe, it, expect } from 'vitest';
import { parseAnsi } from './ansi-parser';

describe('parseAnsi', () => {
  it('returns plain text unchanged (no ANSI sequences)', () => {
    expect(parseAnsi('hello world')).toBe('hello world');
  });

  it('parses single foreground color', () => {
    const input = '\x1b[31mred text\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-red">red text</span>');
  });

  it('parses bold + color combo (semicolon-separated)', () => {
    const input = '\x1b[1;31mbold red\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-red ansi-bold">bold red</span>');
  });

  it('reset clears all styles', () => {
    const input = '\x1b[1;32mgreen bold\x1b[0m plain';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-green ansi-bold">green bold</span> plain');
  });

  it('handles nested style changes', () => {
    const input = '\x1b[31mred \x1b[32mgreen\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe(
      '<span class="ansi-red">red </span><span class="ansi-green">green</span>',
    );
  });

  it('HTML-escapes text content', () => {
    const input = '<script>alert("xss")</script>';
    const result = parseAnsi(input);
    expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('HTML-escapes text inside ANSI spans', () => {
    const input = '\x1b[31m<b>bold</b>\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-red">&lt;b&gt;bold&lt;/b&gt;</span>');
  });

  it('parses bright color variants (90-97)', () => {
    const input = '\x1b[91mbright red\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-bright-red">bright red</span>');
  });

  it('handles underline attribute', () => {
    const input = '\x1b[4munderlined\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-underline">underlined</span>');
  });

  it('handles ESC[m as reset (no code)', () => {
    const input = '\x1b[31mred\x1b[m plain';
    const result = parseAnsi(input);
    expect(result).toBe('<span class="ansi-red">red</span> plain');
  });

  it('handles text before first ANSI sequence', () => {
    const input = 'prefix \x1b[32mgreen\x1b[0m';
    const result = parseAnsi(input);
    expect(result).toBe('prefix <span class="ansi-green">green</span>');
  });

  it('escapes ampersand in text', () => {
    expect(parseAnsi('a & b')).toBe('a &amp; b');
  });
});
