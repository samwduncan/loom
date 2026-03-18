/**
 * extractSessionTitle -- unit tests for session title extraction utility.
 *
 * Covers: system prefix detection, XML wrapper stripping, JSON Task Master
 * content, whitespace handling, truncation at word boundary.
 */

import { describe, it, expect } from 'vitest';
import { extractSessionTitle } from './extract-session-title';

describe('extractSessionTitle', () => {
  // -- Plain user messages --

  it('returns plain user message as-is', () => {
    expect(extractSessionTitle('Hello, can you help me with X?')).toBe(
      'Hello, can you help me with X?',
    );
  });

  // -- System prefix detection --

  it('returns empty for <system-reminder> prefix', () => {
    expect(
      extractSessionTitle('<system-reminder>You are Claude...</system-reminder>'),
    ).toBe('');
  });

  it('returns empty for Caveat: prefix', () => {
    expect(extractSessionTitle('Caveat: This tool...')).toBe('');
  });

  it('returns empty for continuation prefix', () => {
    expect(
      extractSessionTitle(
        'This session is being continued from a previous conversation.',
      ),
    ).toBe('');
  });

  it('returns empty for Invalid API key prefix', () => {
    expect(extractSessionTitle('Invalid API key...')).toBe('');
  });

  it('returns empty for <command-name> prefix', () => {
    expect(
      extractSessionTitle('<command-name>gsd:plan-phase</command-name>...'),
    ).toBe('');
  });

  it('returns empty for <command-message> prefix', () => {
    expect(
      extractSessionTitle('<command-message>some message</command-message>'),
    ).toBe('');
  });

  it('returns empty for <command-args> prefix', () => {
    expect(extractSessionTitle('<command-args>--flag</command-args>')).toBe('');
  });

  it('returns empty for <local-command-stdout> prefix', () => {
    expect(
      extractSessionTitle('<local-command-stdout>output</local-command-stdout>'),
    ).toBe('');
  });

  // -- XML wrapper stripping --

  it('strips <objective> wrapper and returns remaining text', () => {
    expect(
      extractSessionTitle(
        '<objective>Build a thing</objective>\n\nActual user message',
      ),
    ).toBe('Actual user message');
  });

  it('strips <task-notification> wrapper and returns remaining text', () => {
    expect(
      extractSessionTitle(
        '<task-notification>Task info here</task-notification>\nReal content',
      ),
    ).toBe('Real content');
  });

  it('strips <files_to_read> wrapper', () => {
    expect(
      extractSessionTitle(
        '<files_to_read>file1.ts\nfile2.ts</files_to_read>\n\nPlease review these files',
      ),
    ).toBe('Please review these files');
  });

  it('strips multiple XML wrappers sequentially', () => {
    expect(
      extractSessionTitle(
        '<objective>Build X</objective>\n<additional_context>ctx</additional_context>\n\nDo the thing',
      ),
    ).toBe('Do the thing');
  });

  // -- Remaining leading XML tags --

  it('strips remaining leading XML tags', () => {
    expect(extractSessionTitle('<foo>bar</foo>Some text after')).toBe(
      'Some text after',
    );
  });

  // -- JSON Task Master content --

  it('returns empty for JSON with subtasks', () => {
    expect(
      extractSessionTitle('{"task": "test", "subtasks": []}'),
    ).toBe('');
  });

  it('returns empty for CRITICAL JSON response instruction', () => {
    expect(
      extractSessionTitle(
        'CRITICAL: You MUST respond with ONLY a JSON object',
      ),
    ).toBe('');
  });

  // -- Truncation --

  it('truncates text longer than 80 chars at word boundary with ellipsis', () => {
    const long =
      'This is a very long message that goes well beyond the default eighty character limit and should be truncated';
    const result = extractSessionTitle(long);
    expect(result.length).toBeLessThanOrEqual(83); // 80 + '...'
    expect(result).toMatch(/\.\.\.$/);
  });

  it('respects custom maxLength parameter', () => {
    const text = 'This is a moderately long sentence that exceeds forty chars easily';
    const result = extractSessionTitle(text, 40);
    expect(result.length).toBeLessThanOrEqual(43); // 40 + '...'
    expect(result).toMatch(/\.\.\.$/);
  });

  it('does not truncate text within maxLength', () => {
    expect(extractSessionTitle('Short text')).toBe('Short text');
  });

  // -- Edge cases --

  it('returns empty for empty string', () => {
    expect(extractSessionTitle('')).toBe('');
  });

  it('returns empty for whitespace-only input', () => {
    expect(extractSessionTitle('   \n  ')).toBe('');
  });
});
