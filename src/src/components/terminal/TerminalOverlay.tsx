/**
 * TerminalOverlay -- disconnected state overlay and auth URL banner.
 *
 * Shows absolute-positioned overlay when terminal session is disconnected,
 * with a "Session ended" message and Reconnect button.
 *
 * Also shows an auth URL banner when the backend sends an auth_url message
 * (for OAuth flows).
 *
 * Constitution: Named export (2.2), cn() (3.6), design tokens (3.1).
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface TerminalOverlayProps {
  /** Show the disconnected overlay */
  visible: boolean;
  /** Called when user clicks Reconnect */
  onReconnect: () => void;
  /** Auth URL from backend, if any */
  authUrl: { url: string; autoOpen: boolean } | null;
  /** Called to dismiss the auth URL banner */
  onDismissAuth: () => void;
}

export const TerminalOverlay = function TerminalOverlay({
  visible,
  onReconnect,
  authUrl,
  onDismissAuth,
}: TerminalOverlayProps) {
  // Auto-open auth URL in new tab
  useEffect(() => {
    if (authUrl?.autoOpen) {
      window.open(authUrl.url, '_blank');
    }
  }, [authUrl]);

  if (!visible && !authUrl) return null;

  return (
    <>
      {/* Auth URL banner */}
      {authUrl && (
        <div
          className="absolute left-0 right-0 top-0 z-[var(--z-sticky)] flex items-center gap-2 bg-[var(--surface-overlay)] px-3 py-2 text-sm"
          data-testid="auth-url-banner"
        >
          <span className="text-[var(--text-secondary)]">
            Authentication required:
          </span>
          <a
            href={authUrl.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] underline hover:text-[var(--accent-primary-hover)]"
            data-testid="auth-url-link"
          >
            {authUrl.url}
          </a>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onDismissAuth}
            className="rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
            title="Dismiss"
            data-testid="dismiss-auth"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Disconnected overlay */}
      {visible && (
        <div
          className="absolute inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[var(--surface-base)]/80"
          data-testid="disconnected-overlay"
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-[var(--text-secondary)]">
              Session ended
            </p>
            <button
              type="button"
              onClick={onReconnect}
              className="rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--accent-primary-fg)] transition-colors hover:bg-[var(--accent-primary-hover)]"
              data-testid="reconnect-button"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}
    </>
  );
};
