/**
 * ErrorBoundary — Three-tier error boundary hierarchy using react-error-boundary.
 *
 * Three tiers:
 *   AppErrorBoundary — Wraps entire React tree, catches catastrophic errors
 *   PanelErrorBoundary — Wraps individual panels (sidebar, content), isolates panel crashes
 *   MessageErrorBoundary — Wraps individual messages, compact inline error display
 *
 * Each tier:
 *   - Catches render errors and shows tier-specific fallback UI
 *   - Logs error + component stack trace via console.error
 *   - Supports reset/retry for re-mounting children
 *
 * Constitution: Named exports (2.2), no default exports, no any types (5.2).
 */

import { type ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  AppErrorFallback,
  PanelErrorFallback,
  MessageErrorFallback,
} from './ErrorFallback';

// ---------- Props types ----------

export interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export interface PanelErrorBoundaryProps {
  children: React.ReactNode;
  panelName: string;
  onResetData?: () => void;
  resetKeys?: unknown[];
}

export interface MessageErrorBoundaryProps {
  children: React.ReactNode;
  onResetData?: () => void;
}

// ---------- AppErrorBoundary ----------

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <AppErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          onReload={() => window.location.reload()}
        />
      )}
      onError={(error, info) => {
        console.error('[AppErrorBoundary]', error);
        console.error('[AppErrorBoundary] Component stack:', info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ---------- PanelErrorBoundary ----------

export function PanelErrorBoundary({ children, panelName, onResetData, resetKeys }: PanelErrorBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      fallbackRender={({ error, resetErrorBoundary }) => {
        const handleReset = () => {
          onResetData?.();
          resetErrorBoundary();
        };

        return (
          <PanelErrorFallback
            error={error instanceof Error ? error : new Error(String(error))}
            panelName={panelName}
            onRetry={handleReset}
          />
        );
      }}
      onError={(error, info) => {
        console.error(`[PanelErrorBoundary:${panelName}]`, error);
        console.error(`[PanelErrorBoundary:${panelName}] Component stack:`, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ---------- MessageErrorBoundary ----------

export function MessageErrorBoundary({ children, onResetData }: MessageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        const handleReset = () => {
          onResetData?.();
          resetErrorBoundary();
        };

        return (
          <MessageErrorFallback
            error={error instanceof Error ? error : new Error(String(error))}
            onRetry={handleReset}
          />
        );
      }}
      onError={(error: unknown, info: ErrorInfo) => {
        console.error('[MessageErrorBoundary]', error);
        console.error('[MessageErrorBoundary] Component stack:', info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
