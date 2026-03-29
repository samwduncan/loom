/**
 * Native action sheet utility -- cross-platform destructive confirmations.
 *
 * On native (Capacitor): dynamically imports @capacitor/action-sheet for the native
 * iOS action sheet with destructive button styling (red text, slide-up sheet).
 *
 * On web: returns false immediately. The web path uses Radix AlertDialog instead
 * (e.g., DeleteSessionDialog). This utility is the native-only code path.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';

/**
 * Show a native destructive confirmation action sheet.
 *
 * On native: presents an iOS-native action sheet with a destructive (red) option
 * and a cancel option. Returns true if the user selects the destructive option.
 *
 * On web: returns false immediately. Use Radix AlertDialog for web confirmations.
 *
 * @param options - Action sheet configuration
 * @param options.title - Header text for the action sheet
 * @param options.message - Descriptive text below the title
 * @param options.destructiveText - Label for the destructive button (default: 'Delete')
 * @param options.cancelText - Label for the cancel button (default: 'Cancel')
 * @returns true if user selected the destructive option, false otherwise
 */
export async function showDestructiveConfirmation(options: {
  title: string;
  message: string;
  destructiveText?: string;
  cancelText?: string;
}): Promise<boolean> {
  if (!IS_NATIVE) return false;

  try {
    const { ActionSheet, ActionSheetButtonStyle } = await import('@capacitor/action-sheet');
    const result = await ActionSheet.showActions({
      title: options.title,
      message: options.message,
      options: [
        {
          title: options.destructiveText ?? 'Delete',
          style: ActionSheetButtonStyle.Destructive,
        },
        {
          title: options.cancelText ?? 'Cancel',
          style: ActionSheetButtonStyle.Cancel,
        },
      ],
    });
    return result.index === 0;
  } catch (err: unknown) {
    console.warn('[native-actions] Failed to show action sheet:', err);
    return false;
  }
}
