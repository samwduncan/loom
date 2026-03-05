/**
 * no-external-store-mutation
 *
 * Bans direct store mutation via useXStore.setState() or useXStore.getState()
 * from component files. Store mutations must go through store actions only.
 *
 * Constitution 4.5: Only store definition files may call setState/getState.
 *
 * Flags in: .tsx files and any file NOT in a /stores/ directory
 * Skips in: files within /stores/ directories (store definition files)
 *
 * @type {import('eslint').Rule.RuleModule}
 */

const STORE_IDENTIFIERS = [
  'useTimelineStore',
  'useStreamStore',
  'useUIStore',
  'useConnectionStore',
];

const BANNED_METHODS = ['setState', 'getState'];

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban external store mutation via setState/getState in component files (Constitution 4.5)',
    },
    messages: {
      externalMutation:
        '"{{store}}.{{method}}()" is banned in component files. Use store actions instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Allow store definition files
    if (filename.includes('/stores/')) {
      return {};
    }

    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          STORE_IDENTIFIERS.includes(node.object.name) &&
          node.property.type === 'Identifier' &&
          BANNED_METHODS.includes(node.property.name)
        ) {
          context.report({
            node,
            messageId: 'externalMutation',
            data: {
              store: node.object.name,
              method: node.property.name,
            },
          });
        }
      },
    };
  },
};
