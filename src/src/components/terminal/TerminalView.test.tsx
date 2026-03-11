/**
 * TerminalView tests.
 *
 * Mocks xterm.js Terminal, FitAddon, WebLinksAddon to verify:
 * - Terminal creation and opening on container
 * - Addon loading
 * - Callback wiring (onData, onReady)
 * - Cleanup on unmount
 */

import { render, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks -- must be defined before importing TerminalView
// ---------------------------------------------------------------------------

const mockTerminalInstance = {
  open: vi.fn(),
  write: vi.fn(),
  dispose: vi.fn(),
  loadAddon: vi.fn(),
  onData: vi.fn(() => ({ dispose: vi.fn() })),
  cols: 80,
  rows: 24,
  options: {},
};

vi.mock('@xterm/xterm', () => {
   
  class TerminalMock {
    open = mockTerminalInstance.open;
    write = mockTerminalInstance.write;
    dispose = mockTerminalInstance.dispose;
    loadAddon = mockTerminalInstance.loadAddon;
    onData = mockTerminalInstance.onData;
    cols = mockTerminalInstance.cols;
    rows = mockTerminalInstance.rows;
    options = mockTerminalInstance.options;
     
    constructor(_opts?: unknown) {
      // noop
    }
  }
  return { Terminal: TerminalMock };
});

const mockFitInstance = {
  fit: vi.fn(),
};

vi.mock('@xterm/addon-fit', () => {
  class FitAddonMock {
    fit = mockFitInstance.fit;
  }
  return { FitAddon: FitAddonMock };
});

vi.mock('@xterm/addon-web-links', () => {
  class WebLinksAddonMock {}
  return { WebLinksAddon: WebLinksAddonMock };
});

vi.mock('./terminal-theme', () => ({
  getTerminalTheme: () => ({
    background: '#1a1a1a',
    foreground: '#e0e0e0',
  }),
}));

vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeTab: 'shell',
      theme: { codeFontFamily: 'JetBrains Mono' },
    }),
}));

// Need to mock ResizeObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockResizeObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
   
  constructor(_cb: ResizeObserverCallback) {
    // noop
  }
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

import { TerminalView } from './TerminalView';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalView', () => {
  const defaultProps = {
    onData: vi.fn(),
    onResize: vi.fn(),
    onReady: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a container div', () => {
    const { getByTestId } = render(<TerminalView {...defaultProps} />);
    expect(getByTestId('terminal-container')).toBeInTheDocument();
  });

  it('creates Terminal and opens on container', () => {
    render(<TerminalView {...defaultProps} />);

    expect(mockTerminalInstance.open).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
    );
  });

  it('loads FitAddon and WebLinksAddon', () => {
    render(<TerminalView {...defaultProps} />);

    // loadAddon called twice: FitAddon + WebLinksAddon
    expect(mockTerminalInstance.loadAddon).toHaveBeenCalledTimes(2);
  });

  it('calls fitAddon.fit() after open', () => {
    render(<TerminalView {...defaultProps} />);
    expect(mockFitInstance.fit).toHaveBeenCalled();
  });

  it('wires onData callback to terminal.onData', () => {
    render(<TerminalView {...defaultProps} />);
    expect(mockTerminalInstance.onData).toHaveBeenCalledWith(
      expect.any(Function),
    );

    // Simulate terminal input -- extract the callback passed to terminal.onData
    const calls = mockTerminalInstance.onData.mock.calls as unknown as [
      [(data: string) => void],
    ];
    const onDataHandler = calls[0][0];
    onDataHandler('hello');
    expect(defaultProps.onData).toHaveBeenCalledWith('hello');
  });

  it('calls onReady with write function, cols, and rows', () => {
    render(<TerminalView {...defaultProps} />);

    expect(defaultProps.onReady).toHaveBeenCalledWith(
      expect.any(Function),
      80,
      24,
    );
  });

  it('sets up ResizeObserver on container', () => {
    render(<TerminalView {...defaultProps} />);
    expect(mockObserve).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('disposes terminal on unmount', () => {
    const { unmount } = render(<TerminalView {...defaultProps} />);
    unmount();

    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
