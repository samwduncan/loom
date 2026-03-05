/**
 * no-non-null-without-reason
 *
 * Bans non-null assertions (!) without a justification comment.
 * Required comment format: // ASSERT: [reason] (10+ character reason)
 *
 * Forbidden placeholder words in reason:
 *   TODO, fix later, temp, temporary, fixme, hack
 *
 * Constitution 5.2 + CONTEXT.md exception pattern.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

const FORBIDDEN_WORDS = ['todo', 'fix later', 'temp', 'temporary', 'fixme', 'hack'];
const MIN_REASON_LENGTH = 10;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Non-null assertion requires `// ASSERT: [reason]` comment with 10+ character reason (Constitution 5.2)',
    },
    messages: {
      missingReason:
        'Non-null assertion requires `// ASSERT: [reason]` comment with 10+ character reason.',
      placeholderReason:
        'Non-null assertion reason contains forbidden placeholder word "{{word}}". Provide a genuine justification.',
      shortReason:
        'Non-null assertion reason is too short ({{length}} chars). Provide at least 10 characters.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      TSNonNullExpression(node) {
        const line = node.loc.start.line;

        // Look for a trailing comment on the same line
        const comments = sourceCode.getAllComments();
        const trailingComment = comments.find(
          (c) =>
            c.loc.start.line === line &&
            c.type === 'Line',
        );

        if (!trailingComment) {
          context.report({ node, messageId: 'missingReason' });
          return;
        }

        const match = trailingComment.value.match(/\s*ASSERT:\s*(.*)/);
        if (!match) {
          context.report({ node, messageId: 'missingReason' });
          return;
        }

        const reason = match[1].trim();

        // Check minimum length
        if (reason.length < MIN_REASON_LENGTH) {
          context.report({
            node,
            messageId: 'shortReason',
            data: { length: String(reason.length) },
          });
          return;
        }

        // Check for forbidden placeholder words
        const lowerReason = reason.toLowerCase();
        for (const word of FORBIDDEN_WORDS) {
          if (lowerReason.includes(word)) {
            context.report({
              node,
              messageId: 'placeholderReason',
              data: { word },
            });
            return;
          }
        }
      },
    };
  },
};
