/**
 * streamdown-eval.test -- Evaluation tests documenting the Streamdown vs Custom
 * streaming markdown converter comparison.
 *
 * These tests serve as the evaluation record. Each fixture is run through the
 * custom converter and Streamdown (where possible). The summary test logs the
 * comparison matrix.
 *
 * RESULT: Custom converter wins. Streamdown is a React component incompatible
 * with our rAF architecture.
 */

import { describe, it, expect } from 'vitest';
import {
  EVAL_FIXTURES,
  runCustomConverter,
  runStreamdownConverter,
  evaluateFixture,
  runFullEvaluation,
  EVALUATION_SUMMARY,
} from './streamdown-eval';

describe('Streamdown evaluation: fixture comparison', () => {
  // -----------------------------------------------------------------------
  // Per-fixture tests: custom converter
  // -----------------------------------------------------------------------

  describe('custom converter handles all fixtures', () => {
    for (const fixture of EVAL_FIXTURES) {
      it(`produces non-empty output for "${fixture.name}"`, () => {
        const output = runCustomConverter(fixture.input);
        expect(output).toBeTruthy();
        expect(output.length).toBeGreaterThan(0);
      });

      it(`does not throw for "${fixture.name}"`, () => {
        expect(() => runCustomConverter(fixture.input)).not.toThrow();
      });
    }
  });

  // -----------------------------------------------------------------------
  // Per-fixture tests: Streamdown (documents disqualification)
  // -----------------------------------------------------------------------

  describe('Streamdown cannot be called as pure function', () => {
    for (const fixture of EVAL_FIXTURES) {
      it(`returns null for "${fixture.name}" (React component, not pure fn)`, () => {
        const output = runStreamdownConverter(fixture.input);
        expect(output).toBeNull();
      });
    }
  });

  // -----------------------------------------------------------------------
  // XSS security tests
  // -----------------------------------------------------------------------

  describe('XSS sanitization', () => {
    const xssFixture = EVAL_FIXTURES.find((f) => f.name === 'xss attempt')!; // ASSERT: xss fixture exists in hardcoded EVAL_FIXTURES list

    it('custom converter strips <script> tags', () => {
      const output = runCustomConverter(xssFixture.input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('</script>');
    });

    it('custom converter strips onerror handlers', () => {
      const output = runCustomConverter(xssFixture.input);
      expect(output).not.toContain('onerror');
    });

    it('custom converter strips event handler attributes', () => {
      const output = runCustomConverter(xssFixture.input);
      expect(output).not.toMatch(/on\w+=/i);
    });
  });

  // -----------------------------------------------------------------------
  // Custom converter quality checks
  // -----------------------------------------------------------------------

  describe('custom converter output quality', () => {
    it('renders bold as <strong>', () => {
      const output = runCustomConverter('**bold text**');
      expect(output).toContain('<strong>bold text</strong>');
    });

    it('renders italic as <em>', () => {
      const output = runCustomConverter('*italic text*');
      expect(output).toContain('<em>italic text</em>');
    });

    it('renders inline code as <code>', () => {
      const output = runCustomConverter('use `npm install`');
      expect(output).toContain('<code>npm install</code>');
    });

    it('renders headings with correct level', () => {
      const output = runCustomConverter('## Heading Two');
      expect(output).toContain('<h2>Heading Two</h2>');
    });

    it('renders code fences as <pre>', () => {
      const output = runCustomConverter('```js\nconst x = 1;\n```');
      expect(output).toContain('<pre>');
      expect(output).toContain('<code>');
    });

    it('handles unclosed code fences without breaking', () => {
      const output = runCustomConverter('```js\nconst x = 1;');
      expect(output).toContain('<pre>');
      expect(output).toContain('<code>');
    });

    it('renders blockquotes', () => {
      const output = runCustomConverter('> quoted text');
      expect(output).toContain('<blockquote>');
    });

    it('renders unordered lists', () => {
      const output = runCustomConverter('- item 1\n- item 2');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
    });

    it('handles large content (~5KB) without throwing', () => {
      const largeFixture = EVAL_FIXTURES.find((f) => f.name === 'large content')!; // ASSERT: large content fixture is defined in EVAL_FIXTURES array above
      expect(() => runCustomConverter(largeFixture.input)).not.toThrow();
      const output = runCustomConverter(largeFixture.input);
      expect(output.length).toBeGreaterThan(1000);
    });
  });

  // -----------------------------------------------------------------------
  // Evaluation infrastructure
  // -----------------------------------------------------------------------

  describe('evaluation functions', () => {
    it('evaluateFixture returns structured result', () => {
      const fixture = EVAL_FIXTURES[0]!; // ASSERT: EVAL_FIXTURES has at least one entry (basic formatting)
      const result = evaluateFixture(fixture);
      expect(result.fixture).toBe(fixture.name);
      expect(result.customOutput).toBeTruthy();
      expect(result.streamdownOutput).toBeNull();
      expect(result.streamdownAvailable).toBe(false);
      expect(result.notes).toContain('disqualified');
    });

    it('runFullEvaluation covers all fixtures', () => {
      const results = runFullEvaluation();
      expect(results).toHaveLength(EVAL_FIXTURES.length);
      for (const result of results) {
        expect(result.customOutputLength).toBeGreaterThan(0);
        expect(result.streamdownAvailable).toBe(false);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Summary: Evaluation Matrix (logged to console for documentation)
  // -----------------------------------------------------------------------

  describe('evaluation summary', () => {
    it('documents winner as custom converter', () => {
      expect(EVALUATION_SUMMARY.winner).toBe('custom');
    });

    it('documents disqualification reason', () => {
      expect(EVALUATION_SUMMARY.disqualificationReason).toContain('React component');
    });

    it('logs comparison matrix', () => {
      const results = runFullEvaluation();
      console.log('\n=== STREAMDOWN vs CUSTOM CONVERTER COMPARISON ===\n');
      console.log(
        '| Fixture | Custom Length | Streamdown Available | Notes |',
      );
      console.log(
        '|---------|-------------|---------------------|-------|',
      );
      for (const r of results) {
        console.log(
          `| ${r.fixture} | ${r.customOutputLength} | ${r.streamdownAvailable ? 'Yes' : 'No (React component)'} | ${r.notes} |`,
        );
      }
      console.log('\n=== VERDICT: Custom converter wins ===');
      console.log(`Reason: ${EVALUATION_SUMMARY.disqualificationReason}\n`);

      // This test always passes -- it exists to log the matrix
      expect(true).toBe(true);
    });
  });
});
