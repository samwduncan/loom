/**
 * no-token-shadowing
 *
 * Bans declarations of CSS custom properties with token-reserved prefixes
 * outside of tokens.css. This is a best-effort guard implemented via ESLint
 * since ESLint does not parse CSS natively.
 *
 * Checks:
 * - JSX style prop string values that assign CSS custom properties with banned prefixes
 * - Template literals and string literals that contain CSS custom property declarations
 *
 * Banned prefixes: --surface-, --accent-, --text-, --border-, --z-, --space-,
 *                  --font-, --ease-, --duration-, --fx-
 *
 * CONTEXT.md decision: tokens.css is the single source of truth.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

const BANNED_PREFIXES = [
  '--surface-',
  '--accent-',
  '--text-',
  '--border-',
  '--z-',
  '--space-',
  '--font-',
  '--ease-',
  '--duration-',
  '--fx-',
];

// Matches CSS custom property declaration: --prefix-something:
const DECLARATION_PATTERN = new RegExp(
  `(${BANNED_PREFIXES.map((p) => p.replace(/-/g, '\\-')).join('|')})\\w[\\w-]*\\s*:`,
);

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban CSS custom property declarations with token-reserved prefixes outside tokens.css',
    },
    messages: {
      tokenShadowing:
        'CSS custom property declaration "{{match}}" shadows a design token. Only tokens.css may declare token-prefixed variables.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Allow tokens.css itself
    if (filename.endsWith('tokens.css') || filename.endsWith('tokens.ts')) {
      return {};
    }

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {string} value
     */
    function checkForTokenDeclaration(node, value) {
      const match = value.match(DECLARATION_PATTERN);
      if (match) {
        context.report({
          node,
          messageId: 'tokenShadowing',
          data: { match: match[0] },
        });
      }
    }

    return {
      // Check string literals (e.g., in CSS-in-JS or style tag content)
      Literal(node) {
        if (typeof node.value === 'string' && node.value.includes('--')) {
          checkForTokenDeclaration(node, node.value);
        }
      },

      // Check template literal parts
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (quasi.value.raw.includes('--')) {
            checkForTokenDeclaration(quasi, quasi.value.raw);
          }
        }
      },
    };
  },
};
