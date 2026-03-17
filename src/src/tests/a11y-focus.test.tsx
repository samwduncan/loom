/**
 * Focus management tests -- useFocusRestore hook and TabBar panel focus.
 *
 * Constitution: Named imports (2.2), vitest conventions.
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusRestore } from '@/components/a11y/useFocusRestore';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// useFocusRestore tests
// ---------------------------------------------------------------------------

/** Test harness: button that toggles an "overlay" using the hook. */
function FocusRestoreHarness() {
  const [isOpen, setIsOpen] = useState(false);
  useFocusRestore(isOpen);

  return (
    <div>
      <button data-testid="trigger" onClick={() => setIsOpen(true)}>
        Open
      </button>
      {isOpen && (
        <div data-testid="overlay">
          <button data-testid="overlay-btn">Inside</button>
          <button data-testid="close" onClick={() => setIsOpen(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

describe('useFocusRestore', () => {
  let rafCallbacks: Array<() => void>;
  let originalRaf: typeof requestAnimationFrame;

  beforeEach(() => {
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(() => cb(0));
      return rafCallbacks.length;
    }) as unknown as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
  });

  it('restores focus to trigger button after overlay closes', async () => {
    const user = userEvent.setup();
    render(<FocusRestoreHarness />);

    const trigger = screen.getByTestId('trigger');

    // Focus the trigger, then click to open overlay
    await user.click(trigger);
    expect(screen.getByTestId('overlay')).toBeInTheDocument();

    // Move focus inside overlay
    const overlayBtn = screen.getByTestId('overlay-btn');
    await user.click(overlayBtn);

    // Close the overlay
    const close = screen.getByTestId('close');
    await user.click(close);

    // Flush rAF
    act(() => {
      rafCallbacks.forEach((cb) => cb());
    });

    // Focus should be back on trigger
    expect(document.activeElement).toBe(trigger);
  });

  it('does not throw when previously focused element is removed', async () => {
    const user = userEvent.setup();

    function RemovableHarness() {
      const [isOpen, setIsOpen] = useState(false);
      const [showButton, setShowButton] = useState(true);
      useFocusRestore(isOpen);

      return (
        <div>
          {showButton && (
            <button data-testid="trigger2" onClick={() => setIsOpen(true)}>
              Open
            </button>
          )}
          {isOpen && (
            <div>
              <button
                data-testid="close2"
                onClick={() => {
                  setShowButton(false);
                  setIsOpen(false);
                }}
              >
                Close & Remove
              </button>
            </div>
          )}
        </div>
      );
    }

    render(<RemovableHarness />);
    const trigger = screen.getByTestId('trigger2');
    await user.click(trigger);
    const close = screen.getByTestId('close2');

    // Should not throw even though the trigger is removed
    expect(() => {
      act(() => {
        close.click();
        rafCallbacks.forEach((cb) => cb());
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// TabBar panel focus tests
// ---------------------------------------------------------------------------

// Mock the UI store
const mockSetActiveTab = vi.fn();
let mockActiveTab = 'chat';

vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      activeTab: mockActiveTab,
      setActiveTab: mockSetActiveTab,
    }),
}));

// Must import TabBar after the mock is set up
const { TabBar } = await import('@/components/content-area/view/TabBar');

describe('TabBar', () => {
  let rafCallbacks2: Array<() => void>;
  let originalRaf2: typeof requestAnimationFrame;

  beforeEach(() => {
    mockActiveTab = 'chat';
    mockSetActiveTab.mockClear();
    rafCallbacks2 = [];
    originalRaf2 = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks2.push(() => cb(0));
      return rafCallbacks2.length;
    }) as unknown as typeof requestAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf2;
  });

  it('focuses panel container on tab click', async () => {
    const user = userEvent.setup();

    // Create a mock panel element in the DOM
    const panelDiv = document.createElement('div');
    panelDiv.id = 'panel-files';
    panelDiv.tabIndex = -1;
    document.body.appendChild(panelDiv);
    const focusSpy = vi.spyOn(panelDiv, 'focus');

    render(<TabBar />);

    const filesTab = screen.getByRole('tab', { name: /files/i });
    await user.click(filesTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('files');

    // Flush rAF
    act(() => {
      rafCallbacks2.forEach((cb) => cb());
    });

    expect(focusSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(panelDiv);
    focusSpy.mockRestore();
  });
});
