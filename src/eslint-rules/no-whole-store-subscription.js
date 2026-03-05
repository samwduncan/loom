/**
 * no-whole-store-subscription
 *
 * Bans calling Zustand store hooks without a selector argument.
 * Constitution 4.2: All store subscriptions must use a selector.
 *
 * Banned:
 *   const state = useTimelineStore();
 *
 * Allowed:
 *   const count = useTimelineStore(state => state.count);
 *   const { count } = useTimelineStore(state => ({ count: state.count }));
 *
 * @type {import('eslint').Rule.RuleModule}
 */

const STORE_HOOKS = [
  'useTimelineStore',
  'useStreamStore',
  'useUIStore',
  'useConnectionStore',
];

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban whole-store Zustand subscriptions. Must use selector (Constitution 4.2)',
    },
    messages: {
      noSelector:
        'Whole-store subscription "{{name}}()" is banned. Use a selector: {{name}}(state => state.field).',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          STORE_HOOKS.includes(node.callee.name) &&
          node.arguments.length === 0
        ) {
          context.report({
            node,
            messageId: 'noSelector',
            data: { name: node.callee.name },
          });
        }
      },
    };
  },
};
