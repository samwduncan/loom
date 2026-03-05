/**
 * no-hardcoded-colors
 *
 * Bans hardcoded Tailwind color utilities (bg-gray-800, text-red-500, etc.)
 * and hex values in className/cn() arguments. Also bans raw hex color values
 * in any JSX attribute (e.g., <Icon color="#ff0000" />).
 *
 * Constitution 3.1: All colors must come from semantic design tokens.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

// Matches standard Tailwind color utilities with named color scales
const TAILWIND_COLOR_PATTERN =
  /\b(?:bg|text|border|ring|outline|shadow|divide|from|via|to|decoration|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)-\d{2,4}\b/;

// Matches arbitrary hex values in ALL Tailwind color utility brackets
const HEX_IN_CLASSNAME_PATTERN =
  /\b(?:bg|text|border|ring|outline|shadow|divide|from|via|to|decoration|accent|caret|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/;

// Matches standalone hex color values (entire string or embedded)
const HEX_STANDALONE_FULL = /^#[0-9a-fA-F]{3,8}$/;
const HEX_STANDALONE_EMBEDDED = /(?:^|[\s,;])#[0-9a-fA-F]{3,8}(?:$|[\s,;])/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban hardcoded Tailwind color utilities, hex values in className, and hex colors in JSX attributes (Constitution 3.1)',
    },
    messages: {
      tailwindColor:
        'Hardcoded Tailwind color "{{match}}" is banned. Use semantic tokens (bg-surface-raised, text-foreground, etc.).',
      hexInClass:
        'Hardcoded hex "{{match}}" in className is banned. Use CSS custom properties via semantic Tailwind utilities.',
      hexInAttribute:
        'Hardcoded hex color "{{match}}" in JSX attribute is banned. Use a CSS custom property or semantic token.',
    },
    schema: [],
  },
  create(context) {
    /**
     * Check a string value for Tailwind color utilities and hex-in-brackets patterns.
     * @param {import('eslint').Rule.Node} node
     * @param {string} value
     */
    function checkClassStringForColors(node, value) {
      const tailwindMatch = value.match(TAILWIND_COLOR_PATTERN);
      if (tailwindMatch) {
        context.report({
          node,
          messageId: 'tailwindColor',
          data: { match: tailwindMatch[0] },
        });
      }
      const hexMatch = value.match(HEX_IN_CLASSNAME_PATTERN);
      if (hexMatch) {
        context.report({
          node,
          messageId: 'hexInClass',
          data: { match: hexMatch[0] },
        });
      }
    }

    return {
      // Check JSX className="..." string literals
      'JSXAttribute[name.name="className"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkClassStringForColors(node, node.value);
        }
      },

      // Check template literals in className
      'JSXAttribute[name.name="className"] TemplateLiteral TemplateElement'(
        node,
      ) {
        checkClassStringForColors(node, node.value.raw);
      },

      // Check cn() call arguments -- string literals
      'CallExpression[callee.name="cn"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkClassStringForColors(node, node.value);
        }
      },

      // Check cn() call arguments -- template literal parts
      'CallExpression[callee.name="cn"] TemplateLiteral TemplateElement'(node) {
        checkClassStringForColors(node, node.value.raw);
      },

      // Check ALL JSX attributes for raw hex color values (not just className)
      JSXAttribute(node) {
        // Skip className -- already covered by class-specific checks above
        if (
          node.name &&
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'className'
        ) {
          return;
        }

        // Only check string literal values
        if (!node.value || node.value.type !== 'Literal') {
          return;
        }

        const value = node.value.value;
        if (typeof value !== 'string') {
          return;
        }

        // Check if the entire value is a hex color
        if (HEX_STANDALONE_FULL.test(value)) {
          context.report({
            node: node.value,
            messageId: 'hexInAttribute',
            data: { match: value },
          });
          return;
        }

        // Check if hex color is embedded in a larger string
        const embeddedMatch = value.match(HEX_STANDALONE_EMBEDDED);
        if (embeddedMatch) {
          const hex = embeddedMatch[0].trim();
          context.report({
            node: node.value,
            messageId: 'hexInAttribute',
            data: { match: hex },
          });
        }
      },
    };
  },
};
