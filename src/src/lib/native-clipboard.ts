/**
 * Native clipboard utility -- cross-platform clipboard write with IS_NATIVE branching.
 *
 * On native (Capacitor): dynamically imports @capacitor/clipboard for clipboard access.
 * This works on all origins including HTTP, unlike the Web Clipboard API which requires
 * a secure context (HTTPS or localhost).
 *
 * On web: uses navigator.clipboard.writeText() with graceful fallback.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';
import { toast } from 'sonner';

/**
 * Write text to the system clipboard.
 *
 * On native: uses @capacitor/clipboard (dynamic import, fire-and-forget pattern).
 * On web: uses navigator.clipboard.writeText().
 *
 * Shows a "Copied to clipboard" toast on success.
 *
 * @param text - The text to write to the clipboard
 * @returns true on success, false on failure
 */
export async function nativeClipboardWrite(text: string): Promise<boolean> {
  try {
    if (IS_NATIVE) {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write({ string: text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    toast('Copied to clipboard');
    return true;
  } catch (err: unknown) {
    console.warn('[native-clipboard] Failed to write to clipboard:', err);
    return false;
  }
}

/**
 * Reset module state for testing. No-op -- included for consistency
 * with other native utility modules.
 */
export function _resetForTesting(): void {
  // No module-level state to reset.
}
