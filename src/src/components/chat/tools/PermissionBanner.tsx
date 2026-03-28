/**
 * PermissionBanner -- inline permission request banner above the composer.
 *
 * Shows tool name, input preview, countdown timer, and Allow/Deny buttons.
 * Auto-dismisses on countdown expiry. Supports Y/N keyboard shortcuts.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { useStreamStore } from '@/stores/stream';
import { wsClient } from '@/lib/websocket-client';
import { truncate } from '@/lib/groupToolCalls';
import { CountdownRing } from './CountdownRing';
import './PermissionBanner.css';

const PERMISSION_TIMEOUT_SECONDS = 55;

interface PermissionBannerProps {
  sessionId: string | null;
}

/**
 * Generate a tool-aware input preview string.
 */
function getPermissionPreview(toolName: string, input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const obj = input as Record<string, unknown>;

  switch (toolName) {
    case 'Bash': {
      const cmd = typeof obj.command === 'string' ? obj.command : '';
      return truncate(cmd, 100);
    }
    case 'Edit':
    case 'Write':
    case 'Read': {
      const fp = typeof obj.file_path === 'string' ? obj.file_path : '';
      return fp;
    }
    case 'Glob':
    case 'Grep': {
      const pattern = typeof obj.pattern === 'string' ? obj.pattern : '';
      return pattern;
    }
    default:
      return truncate(JSON.stringify(input), 100);
  }
}

export const PermissionBanner = memo(function PermissionBanner({
  sessionId,
}: PermissionBannerProps) {
  const request = useStreamStore((s) => s.activePermissionRequest);
  const clearPermissionRequest = useStreamStore(
    (s) => s.clearPermissionRequest,
  );

  const [remainingSeconds, setRemainingSeconds] = useState(
    PERMISSION_TIMEOUT_SECONDS,
  );

  // Countdown interval -- recalculates from receivedAt for drift resistance.
  // Uses setInterval with immediate first tick via setTimeout(0).
  // setState inside interval callback is allowed by ESLint (external subscription).
  useEffect(() => {
    if (!request) return;

    const calcRemaining = () =>
      Math.max(
        0,
        Math.ceil(
          PERMISSION_TIMEOUT_SECONDS -
            (Date.now() - request.receivedAt) / 1000,
        ),
      );

    const tick = () => {
      const remaining = calcRemaining();
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearPermissionRequest();
      }
    };

    // Immediate first tick via microtask (setState in callback = subscription)
    const immediateId = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    return () => {
      clearTimeout(immediateId);
      clearInterval(interval);
    };
  }, [request, clearPermissionRequest]);

  const handleAllow = useCallback(() => {
    if (!request) return;
    wsClient.send({
      type: 'claude-permission-response',
      requestId: request.requestId,
      allow: true,
    });
    clearPermissionRequest();
  }, [request, clearPermissionRequest]);

  const handleDeny = useCallback(() => {
    if (!request) return;
    wsClient.send({
      type: 'claude-permission-response',
      requestId: request.requestId,
      allow: false,
    });
    clearPermissionRequest();
  }, [request, clearPermissionRequest]);

  // Keyboard shortcuts: Y to allow, N to deny
  useEffect(() => {
    if (!request) return;
    if (!sessionId || request.sessionId !== sessionId) return;

    const handler = (e: KeyboardEvent) => {
      // Check focus at event time (not setup time) per plan spec
      const active = document.activeElement;
      if (
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLInputElement ||
        (active instanceof HTMLElement && active.hasAttribute('contenteditable'))
      ) {
        return;
      }

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleAllow();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleDeny();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [request, sessionId, handleAllow, handleDeny]);

  // Don't render if no request or session mismatch
  if (!request) return null;
  if (sessionId && request.sessionId !== sessionId) return null;

  const preview = getPermissionPreview(request.toolName, request.input);

  return (
    <div
      className="permission-banner permission-banner-enter mx-3 mb-2 flex items-center gap-3"
      data-testid="permission-banner"
    >
      {/* Tool name */}
      <span className="shrink-0 font-mono text-xs font-medium text-foreground">
        {request.toolName}
      </span>

      {/* Input preview */}
      {preview && (
        <span className="min-w-0 truncate font-mono text-xs text-muted">
          {preview}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Countdown ring */}
      <CountdownRing
        totalSeconds={PERMISSION_TIMEOUT_SECONDS}
        remainingSeconds={remainingSeconds}
        size={28}
      />

      {/* Allow button */}
      <button
        type="button"
        onClick={handleAllow}
        className="shrink-0 rounded-md bg-[var(--success)] px-3 py-1 text-xs font-medium text-[var(--success-foreground,var(--surface-0))] transition-colors hover:brightness-110 min-h-[44px] md:min-h-0"
      >
        Allow
      </button>

      {/* Deny button */}
      <button
        type="button"
        onClick={handleDeny}
        className="shrink-0 rounded-md border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)] min-h-[44px] md:min-h-0"
      >
        Deny
      </button>
    </div>
  );
});
