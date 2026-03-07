/**
 * ComposerKeyboardHints -- fading keyboard shortcut hints in the composer.
 *
 * Shows Enter/Shift+Enter hints before first message, Cmd+. during streaming,
 * and fades away after first message sent.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

import { Kbd } from '@/components/ui/kbd';

interface ComposerKeyboardHintsProps {
  hasMessageSent: boolean;
  isStreaming: boolean;
}

/** Detect macOS for Cmd vs Ctrl */
const isMac =
  typeof navigator !== 'undefined' &&
  /mac/i.test(navigator.userAgent);

export function ComposerKeyboardHints({ hasMessageSent, isStreaming }: ComposerKeyboardHintsProps) {
  // During streaming, show stop shortcut
  if (isStreaming) {
    return (
      <div className="composer-hints flex items-center gap-1.5 text-xs text-muted">
        <Kbd>{isMac ? 'Cmd' : 'Ctrl'}+.</Kbd>
        <span>to stop</span>
      </div>
    );
  }

  // After first message sent and not streaming, hide hints
  if (hasMessageSent) {
    return (
      <div className="composer-hints" data-visible="false">
        {/* Empty -- fades out via CSS */}
      </div>
    );
  }

  // Before first message, show send/newline hints
  return (
    <div className="composer-hints flex items-center gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <Kbd>Enter</Kbd>
        <span>send</span>
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Shift+Enter</Kbd>
        <span>newline</span>
      </span>
    </div>
  );
}
