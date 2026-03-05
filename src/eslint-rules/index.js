/**
 * Loom ESLint Plugin — Local custom rules enforcing the V2 Constitution.
 *
 * This plugin is imported directly in eslint.config.js (not published to npm).
 * All rules target patterns banned by the Constitution or CONTEXT.md decisions.
 */

import noHardcodedColors from './no-hardcoded-colors.js';
import noRawZIndex from './no-raw-z-index.js';
import noClassnameConcat from './no-classname-concat.js';
import noWholeStoreSubscription from './no-whole-store-subscription.js';
import noExternalStoreMutation from './no-external-store-mutation.js';
import noBannedInlineStyle from './no-banned-inline-style.js';
import noAnyWithoutReason from './no-any-without-reason.js';
import noNonNullWithoutReason from './no-non-null-without-reason.js';
import noTokenShadowing from './no-token-shadowing.js';

export default {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-raw-z-index': noRawZIndex,
    'no-classname-concat': noClassnameConcat,
    'no-whole-store-subscription': noWholeStoreSubscription,
    'no-external-store-mutation': noExternalStoreMutation,
    'no-banned-inline-style': noBannedInlineStyle,
    'no-any-without-reason': noAnyWithoutReason,
    'no-non-null-without-reason': noNonNullWithoutReason,
    'no-token-shadowing': noTokenShadowing,
  },
};
