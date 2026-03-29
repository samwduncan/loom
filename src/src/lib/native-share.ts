/**
 * Native share utility -- cross-platform share with IS_NATIVE branching.
 *
 * On native (Capacitor): dynamically imports @capacitor/share for the native share sheet.
 * On web with Web Share API: uses navigator.share().
 * On web without Web Share API: falls back to clipboard write.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';
import { nativeClipboardWrite } from '@/lib/native-clipboard';
import { toast } from 'sonner';

/**
 * Share text using the platform's native share mechanism.
 *
 * Priority:
 * 1. Native (Capacitor): @capacitor/share → native share sheet
 * 2. Web with navigator.share: Web Share API
 * 3. Web fallback: copy to clipboard via nativeClipboardWrite()
 *
 * @param options - Share content and metadata
 * @param options.text - The text content to share
 * @param options.title - Optional title for the share
 * @param options.dialogTitle - Optional dialog title (native only, Android)
 */
export async function nativeShare(options: {
  text: string;
  title?: string;
  dialogTitle?: string;
}): Promise<void> {
  const { text, title, dialogTitle } = options;

  try {
    if (IS_NATIVE) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, dialogTitle });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text });
      return;
    }

    // Fallback: copy to clipboard when Web Share API unavailable
    const success = await nativeClipboardWrite(text);
    if (!success) {
      toast('Share unavailable');
    }
  } catch (err: unknown) {
    // AbortError is thrown when user dismisses share sheet -- not a real error
    if (err instanceof Error && err.name === 'AbortError') return;
    console.warn('[native-share] Failed to share:', err);
  }
}
