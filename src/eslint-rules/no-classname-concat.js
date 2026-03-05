/**
 * no-classname-concat
 *
 * Bans string concatenation and raw template literals in className props.
 * Must use cn() utility instead (Constitution 3.6).
 *
 * Banned:
 *   className={"foo " + bar}
 *   className={`foo ${bar}`}
 *
 * Allowed:
 *   className={cn("foo", bar)}
 *   className="static-classes"
 *
 * @type {import('eslint').Rule.RuleModule}
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban string concatenation in className props. Use cn() utility (Constitution 3.6)',
    },
    messages: {
      concat: 'String concatenation in className is banned. Use cn() utility.',
      templateLiteral:
        'Template literal in className is banned. Use cn() utility.',
    },
    schema: [],
  },
  create(context) {
    return {
      // className={`...${...}...`} -- template literal directly in className
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral'(
        node,
      ) {
        context.report({ node, messageId: 'templateLiteral' });
      },

      // className={"a" + "b"} -- binary expression concatenation
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > BinaryExpression[operator="+"]'(
        node,
      ) {
        context.report({ node, messageId: 'concat' });
      },
    };
  },
};
