/**
 * ErrorBoundary.test — Tests for three-tier error boundary hierarchy.
 *
 * Tests cover App, Panel, and Message error boundaries independently:
 * - Catch render errors and show tier-specific fallback UI
 * - Logging with component stack traces
 * - Reset/retry behavior
 * - Error isolation between sibling boundaries
 * - "Show details" toggle for App and Panel tiers
 * - Optional onResetData callback before reset
 *
 * Note: React 19 concurrent rendering retries components on throw. The
 * ConditionalThrower pattern uses an external { current: boolean } ref
 * so the flag only changes when the test explicitly sets it, not on
 * React's internal retries.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppErrorBoundary, PanelErrorBoundary, MessageErrorBoundary } from './ErrorBoundary';

// ---------- helpers ----------

/** Component that always throws on render — return type declared for JSX compatibility */
function ThrowingComponent(): React.JSX.Element {
  throw new Error('Test render error');
}

/** Safe child component for isolation tests */
function SafeChild({ label }: { label: string }) {
  return <div data-testid={`safe-${label}`}>{label} is safe</div>;
}

/**
 * Creates a component that throws based on an external ref.
 * The ref is NOT affected by React's internal re-render attempts.
 */
function createConditionalThrower(errorMessage: string) {
  const shouldThrow = { current: true };

  function ConditionalThrower() {
    if (shouldThrow.current) {
      throw new Error(errorMessage);
    }
    return <div data-testid="recovered">Recovered!</div>;
  }

  return { ConditionalThrower, shouldThrow };
}

function createMessageConditionalThrower(errorMessage: string) {
  const shouldThrow = { current: true };

  function ConditionalThrower() {
    if (shouldThrow.current) {
      throw new Error(errorMessage);
    }
    return <div data-testid="message-recovered">Message OK</div>;
  }

  return { ConditionalThrower, shouldThrow };
}

// Suppress React's console.error for caught errors in tests
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ---------- AppErrorBoundary ----------

describe('AppErrorBoundary', () => {
  it('catches render error and shows full-screen fallback with "Something went wrong"', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('fallback has a "Reload" button that calls window.location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    const reloadBtn = screen.getByRole('button', { name: /reload/i });
    reloadBtn.click();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('onError logs error and componentStack to console.error', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    const appBoundaryLogs = consoleErrorSpy.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('[AppErrorBoundary]'),
    );
    expect(appBoundaryLogs.length).toBeGreaterThanOrEqual(2);
    expect(appBoundaryLogs[0]?.[0]).toContain('[AppErrorBoundary]');
  });

  it('error details are hidden by default, "Show details" reveals them', async () => {
    const user = userEvent.setup();

    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    // Error message should not be visible initially
    expect(screen.queryByText('Test render error')).not.toBeInTheDocument();

    // Click "Show details"
    const toggle = screen.getByText(/show details/i);
    await user.click(toggle);

    // Now error message should be visible
    expect(screen.getByText('Test render error')).toBeInTheDocument();
  });
});

// ---------- PanelErrorBoundary ----------

describe('PanelErrorBoundary', () => {
  it('catches render error and shows centered card fallback', () => {
    render(
      <PanelErrorBoundary panelName="sidebar">
        <ThrowingComponent />
      </PanelErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('fallback shows panelName in the error message', () => {
    render(
      <PanelErrorBoundary panelName="sidebar">
        <ThrowingComponent />
      </PanelErrorBoundary>,
    );

    expect(screen.getByText(/sidebar/i)).toBeInTheDocument();
  });

  it('"Try again" button resets the boundary (re-mounts children)', async () => {
    const user = userEvent.setup();
    const { ConditionalThrower, shouldThrow } = createConditionalThrower('First render error');

    render(
      <PanelErrorBoundary panelName="content">
        <ConditionalThrower />
      </PanelErrorBoundary>,
    );

    // Should show fallback after render throws
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Stop throwing before clicking retry
    shouldThrow.current = false;

    // Click "Try again"
    await user.click(screen.getByRole('button', { name: /try again/i }));

    // Should now render the recovered content
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  it('error details are hidden by default, "Show details" reveals them', async () => {
    const user = userEvent.setup();

    render(
      <PanelErrorBoundary panelName="sidebar">
        <ThrowingComponent />
      </PanelErrorBoundary>,
    );

    expect(screen.queryByText('Test render error')).not.toBeInTheDocument();

    await user.click(screen.getByText(/show details/i));

    expect(screen.getByText('Test render error')).toBeInTheDocument();
  });

  it('calls onResetData callback before resetErrorBoundary on "Try again" click', async () => {
    const user = userEvent.setup();
    const onResetData = vi.fn();
    const { ConditionalThrower, shouldThrow } = createConditionalThrower('Reset test error');

    render(
      <PanelErrorBoundary panelName="content" onResetData={onResetData}>
        <ConditionalThrower />
      </PanelErrorBoundary>,
    );

    // Verify fallback is showing
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Stop throwing before reset
    shouldThrow.current = false;

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(onResetData).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  it('works without onResetData (prop is optional)', async () => {
    const user = userEvent.setup();
    const { ConditionalThrower, shouldThrow } = createConditionalThrower('Optional prop test');

    render(
      <PanelErrorBoundary panelName="content">
        <ConditionalThrower />
      </PanelErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    shouldThrow.current = false;

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  it('logs error with component stack via console.error', () => {
    render(
      <PanelErrorBoundary panelName="sidebar">
        <ThrowingComponent />
      </PanelErrorBoundary>,
    );

    const panelLogs = consoleErrorSpy.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('[PanelErrorBoundary:sidebar]'),
    );
    expect(panelLogs.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------- MessageErrorBoundary ----------

describe('MessageErrorBoundary', () => {
  it('catches render error and shows compact inline "Failed to render this message"', () => {
    render(
      <MessageErrorBoundary>
        <ThrowingComponent />
      </MessageErrorBoundary>,
    );

    expect(screen.getByText(/failed to render this message/i)).toBeInTheDocument();
  });

  it('"retry" resets the boundary', async () => {
    const user = userEvent.setup();
    const { ConditionalThrower, shouldThrow } = createMessageConditionalThrower('Message render error');

    render(
      <MessageErrorBoundary>
        <ConditionalThrower />
      </MessageErrorBoundary>,
    );

    expect(screen.getByText(/failed to render this message/i)).toBeInTheDocument();

    shouldThrow.current = false;

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByTestId('message-recovered')).toBeInTheDocument();
  });

  it('does NOT use full-height classes (compact styling)', () => {
    const { container } = render(
      <MessageErrorBoundary>
        <ThrowingComponent />
      </MessageErrorBoundary>,
    );

    const fallbackEl = container.querySelector('[data-testid="message-error-fallback"]');
    expect(fallbackEl).toBeInTheDocument();
    const className = fallbackEl?.getAttribute('class') ?? '';
    expect(className).not.toMatch(/h-full|h-dvh|min-h-screen|h-screen/);
  });

  it('calls onResetData callback before resetErrorBoundary on retry click', async () => {
    const user = userEvent.setup();
    const onResetData = vi.fn();
    const { ConditionalThrower, shouldThrow } = createMessageConditionalThrower('Message reset test');

    render(
      <MessageErrorBoundary onResetData={onResetData}>
        <ConditionalThrower />
      </MessageErrorBoundary>,
    );

    expect(screen.getByText(/failed to render this message/i)).toBeInTheDocument();

    shouldThrow.current = false;

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(onResetData).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('message-recovered')).toBeInTheDocument();
  });

  it('logs error with component stack via console.error', () => {
    render(
      <MessageErrorBoundary>
        <ThrowingComponent />
      </MessageErrorBoundary>,
    );

    const msgLogs = consoleErrorSpy.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('[MessageErrorBoundary]'),
    );
    expect(msgLogs.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------- Isolation ----------

describe('Error boundary isolation', () => {
  it('when one child of PanelErrorBoundary throws, siblings outside that boundary are unaffected', () => {
    render(
      <div>
        <PanelErrorBoundary panelName="panel-a">
          <ThrowingComponent />
        </PanelErrorBoundary>
        <PanelErrorBoundary panelName="panel-b">
          <SafeChild label="panel-b" />
        </PanelErrorBoundary>
      </div>,
    );

    // Panel A should show error fallback
    expect(screen.getByText(/panel-a/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Panel B should still render its safe content
    expect(screen.getByTestId('safe-panel-b')).toBeInTheDocument();
    expect(screen.getByText('panel-b is safe')).toBeInTheDocument();
  });
});
