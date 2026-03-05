/**
 * no-raw-z-index
 *
 * Bans raw z-index values in Tailwind classes:
 * - z-[<number>] arbitrary z-index
 * - z-0 through z-50 etc. (standard Tailwind z-index utilities)
 * Allows z-auto.
 *
 * Constitution 3.3: All z-index values must use design tokens.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

// Matches z-[123] arbitrary z-index
const Z_ARBITRARY_PATTERN = /\bz-\[\d+\]/;

// Matches z-0, z-10, z-20, z-30, z-40, z-50 etc. (NOT z-auto)
const Z_UTILITY_PATTERN = /\bz-\d+\b/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban raw z-index Tailwind utilities. Use z-index design tokens (Constitution 3.3)',
    },
    messages: {
      arbitraryZ:
        'Arbitrary z-index "{{match}}" is banned. Use a z-index design token (e.g., z-[var(--z-modal)]).',
      utilityZ:
        'Tailwind z-index utility "{{match}}" is banned. Use a z-index design token.',
    },
    schema: [],
  },
  create(context) {
    /**
     * @param {import('eslint').Rule.Node} node
     * @param {string} value
     */
    function checkForRawZIndex(node, value) {
      const arbitraryMatch = value.match(Z_ARBITRARY_PATTERN);
      if (arbitraryMatch) {
        context.report({
          node,
          messageId: 'arbitraryZ',
          data: { match: arbitraryMatch[0] },
        });
      }

      const utilityMatch = value.match(Z_UTILITY_PATTERN);
      if (utilityMatch) {
        context.report({
          node,
          messageId: 'utilityZ',
          data: { match: utilityMatch[0] },
        });
      }
    }

    return {
      'JSXAttribute[name.name="className"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkForRawZIndex(node, node.value);
        }
      },

      'JSXAttribute[name.name="className"] TemplateLiteral TemplateElement'(
        node,
      ) {
        checkForRawZIndex(node, node.value.raw);
      },

      'CallExpression[callee.name="cn"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkForRawZIndex(node, node.value);
        }
      },

      'CallExpression[callee.name="cn"] TemplateLiteral TemplateElement'(
        node,
      ) {
        checkForRawZIndex(node, node.value.raw);
      },
    };
  },
};
