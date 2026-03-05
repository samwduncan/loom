/**
 * no-banned-inline-style
 *
 * Two-tier validation for inline style props:
 *
 * Tier 1 -- Property name allowlist:
 *   Only specific CSS properties are allowed in inline styles.
 *   Any property not in the allowlist triggers an error.
 *
 * Tier 2 -- Token-backed value validation:
 *   Properties that have corresponding design tokens (zIndex, gap) must
 *   use var() references, not raw numbers or strings.
 *
 * Constitution 3.2 + CONTEXT.md allowlist.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

// Properties allowed in inline styles (Tier 1)
const ALLOWED_PROPERTIES = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'transform',
  'translate',
  'opacity',
  'clipPath',
  'top',
  'left',
  'right',
  'bottom',
  'inset',
  'position',
  'zIndex',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gridColumn',
  'gridRow',
  'gap',
  'overflow',
]);

// Properties that MUST use var() token values (Tier 2)
const TOKEN_BACKED_PROPERTIES = new Set(['zIndex', 'gap']);

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban non-allowlisted inline style properties. Token-backed properties must use var() (Constitution 3.2)',
    },
    messages: {
      bannedProperty:
        "Inline style property '{{prop}}' is banned. Use Tailwind utilities or CSS custom properties.",
      rawTokenValue:
        "Inline style '{{prop}}' must use a token variable (e.g., `var(--z-modal)`), not a raw value.",
    },
    schema: [],
  },
  create(context) {
    return {
      'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression'(
        node,
      ) {
        for (const prop of node.properties) {
          // Skip spread elements
          if (prop.type !== 'Property') continue;

          const propName =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : prop.key.type === 'Literal'
                ? String(prop.key.value)
                : null;

          if (!propName) continue;

          // Tier 1: Check property name against allowlist
          if (!ALLOWED_PROPERTIES.has(propName)) {
            context.report({
              node: prop.key,
              messageId: 'bannedProperty',
              data: { prop: propName },
            });
            continue;
          }

          // Tier 2: Check token-backed properties for var() values
          if (TOKEN_BACKED_PROPERTIES.has(propName)) {
            const value = prop.value;

            if (value.type === 'Literal') {
              // Raw number or string not starting with var(
              if (typeof value.value === 'number') {
                context.report({
                  node: prop,
                  messageId: 'rawTokenValue',
                  data: { prop: propName },
                });
              } else if (
                typeof value.value === 'string' &&
                !value.value.startsWith('var(')
              ) {
                context.report({
                  node: prop,
                  messageId: 'rawTokenValue',
                  data: { prop: propName },
                });
              }
            }
          }
        }
      },
    };
  },
};
