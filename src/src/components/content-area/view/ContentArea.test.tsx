/**
 * ContentArea tests -- verifies lazy-mount-on-first-visit, CSS show/hide,
 * mobile override, error boundary integration, and ARIA attributes.
 *
 * PERF-03: Shell and Git panels only mount when first visited.
 * PERF-04: Skeleton audit -- all async areas confirmed to have loading states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ContentArea } from './ContentArea';

// Mock useUIStore -- mockActiveTab is mutable for re-render simulation
let mockActiveTab = 'chat';
const mockSetActiveTab = vi.fn();

vi.mock('@/stores/ui', () => ({
  useUIStore: Object.assign(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        activeTab: mockActiveTab,
        setActiveTab: mockSetActiveTab,
      }),
    {
      getState: () => ({
        setActiveTab: mockSetActiveTab,
      }),
    },
  ),
}));

// Mock ChatView to avoid its complex dependencies
vi.mock('@/components/chat/view/ChatView', () => ({
  ChatView: () => <div data-testid="chat-view">ChatView</div>,
}));

// Mock FileTreePanel
vi.mock('@/components/file-tree/FileTreePanel', () => ({
  FileTreePanel: () => <div data-testid="file-tree-panel">FileTreePanel</div>,
}));

// Mock TerminalPanel (used via React.lazy)
vi.mock('@/components/terminal/TerminalPanel', () => ({
  TerminalPanel: () => <div data-testid="terminal-panel">TerminalPanel</div>,
}));

// Mock GitPanel (used via React.lazy)
vi.mock('@/components/git/GitPanel', () => ({
  GitPanel: () => <div data-testid="git-panel">GitPanel</div>,
}));

// Mock GitPanelSkeleton
vi.mock('@/components/git/GitPanelSkeleton', () => ({
  GitPanelSkeleton: () => <div data-testid="git-panel-skeleton">GitPanelSkeleton</div>,
}));

// Track PanelErrorBoundary props
const panelErrorBoundaryProps: Array<{ panelName: string; resetKeys?: unknown[] }> = [];

vi.mock('@/components/shared/ErrorBoundary', () => ({
  PanelErrorBoundary: ({
    children,
    panelName,
    resetKeys,
  }: {
    children: React.ReactNode;
    panelName: string;
    resetKeys?: unknown[];
  }) => {
    panelErrorBoundaryProps.push({ panelName, resetKeys });
    return <div data-testid={`error-boundary-${panelName}`}>{children}</div>;
  },
}));

// Mock matchMedia for mobile tests
let mockMatchMediaMatches = false;
const mockMediaChangeListeners: Array<() => void> = [];

function setupMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: mockMatchMediaMatches,
      media: query,
      onchange: null,
      addEventListener: (_event: string, cb: () => void) => {
        mockMediaChangeListeners.push(cb);
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderContentArea(route = '/chat/test-session') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/chat/:sessionId?" element={<ContentArea />} />
        <Route path="*" element={<ContentArea />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ContentArea', () => {
  beforeEach(() => {
    mockActiveTab = 'chat';
    mockSetActiveTab.mockClear();
    mockMatchMediaMatches = false;
    mockMediaChangeListeners.length = 0;
    panelErrorBoundaryProps.length = 0;
    setupMatchMedia();
  });

  describe('lazy-mount-on-first-visit (PERF-03)', () => {
    it('on initial render with activeTab=chat, shell and git panels are NOT in the DOM', () => {
      mockActiveTab = 'chat';
      renderContentArea();
      // Chat and files are always eagerly mounted
      expect(document.getElementById('panel-chat')).toBeInTheDocument();
      expect(document.getElementById('panel-files')).toBeInTheDocument();
      // Shell and git should NOT be rendered until visited
      expect(document.getElementById('panel-shell')).not.toBeInTheDocument();
      expect(document.getElementById('panel-git')).not.toBeInTheDocument();
    });

    it('switching to shell tab renders the terminal panel', () => {
      mockActiveTab = 'shell';
      renderContentArea();
      // Shell panel should now be in the DOM
      expect(document.getElementById('panel-shell')).toBeInTheDocument();
      expect(document.getElementById('panel-shell')).not.toHaveClass('hidden');
    });

    it('switching back to chat from shell keeps terminal panel mounted (hidden)', () => {
      // First render with shell active to mark it as visited
      mockActiveTab = 'shell';
      const { rerender } = renderContentArea();
      expect(document.getElementById('panel-shell')).toBeInTheDocument();

      // Switch back to chat
      mockActiveTab = 'chat';
      rerender(
        <MemoryRouter initialEntries={['/chat/test-session']}>
          <Routes>
            <Route path="/chat/:sessionId?" element={<ContentArea />} />
            <Route path="*" element={<ContentArea />} />
          </Routes>
        </MemoryRouter>,
      );

      // Shell should still be mounted (hidden, not removed)
      expect(document.getElementById('panel-shell')).toBeInTheDocument();
      expect(document.getElementById('panel-shell')).toHaveClass('hidden');
      // Chat should be visible
      expect(document.getElementById('panel-chat')).not.toHaveClass('hidden');
    });

    it('git tab content is not rendered until user visits it', () => {
      // Render with chat active
      mockActiveTab = 'chat';
      const { rerender } = renderContentArea();
      expect(document.getElementById('panel-git')).not.toBeInTheDocument();

      // Visit shell -- git should still not be rendered
      mockActiveTab = 'shell';
      rerender(
        <MemoryRouter initialEntries={['/chat/test-session']}>
          <Routes>
            <Route path="/chat/:sessionId?" element={<ContentArea />} />
            <Route path="*" element={<ContentArea />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(document.getElementById('panel-shell')).toBeInTheDocument();
      expect(document.getElementById('panel-git')).not.toBeInTheDocument();

      // Visit git -- now it should render
      mockActiveTab = 'git';
      rerender(
        <MemoryRouter initialEntries={['/chat/test-session']}>
          <Routes>
            <Route path="/chat/:sessionId?" element={<ContentArea />} />
            <Route path="*" element={<ContentArea />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(document.getElementById('panel-git')).toBeInTheDocument();
      expect(document.getElementById('panel-git')).not.toHaveClass('hidden');
    });
  });

  describe('CSS show/hide', () => {
    it('active panel has no hidden class; inactive eagerly-mounted panels have hidden class', () => {
      mockActiveTab = 'chat';
      renderContentArea();
      expect(document.getElementById('panel-chat')).not.toHaveClass('hidden');
      expect(document.getElementById('panel-files')).toHaveClass('hidden');
      // Shell and git not yet mounted, so not present
    });

    it('switching activeTab changes which panel is visible', () => {
      mockActiveTab = 'files';
      renderContentArea();
      expect(document.getElementById('panel-chat')).toHaveClass('hidden');
      expect(document.getElementById('panel-files')).not.toHaveClass('hidden');
    });
  });

  describe('ARIA attributes', () => {
    it('eagerly-mounted panels have role=tabpanel and aria-labelledby', () => {
      renderContentArea();
      for (const id of ['chat', 'files'] as const) {
        const panel = document.getElementById(`panel-${id}`);
        expect(panel).toHaveAttribute('role', 'tabpanel');
        expect(panel).toHaveAttribute('aria-labelledby', `tab-${id}`);
      }
    });

    it('lazy-mounted panels have correct ARIA when visited', () => {
      mockActiveTab = 'shell';
      renderContentArea();
      const shell = document.getElementById('panel-shell');
      expect(shell).toHaveAttribute('role', 'tabpanel');
      expect(shell).toHaveAttribute('aria-labelledby', 'tab-shell');
    });
  });

  it('ChatView is rendered directly in the chat panel', () => {
    renderContentArea();
    const chatPanel = document.getElementById('panel-chat');
    expect(chatPanel).toBeInTheDocument();
    expect(screen.getByTestId('chat-view')).toBeInTheDocument();
  });

  it('error boundaries wrap eagerly-mounted panels', () => {
    mockActiveTab = 'chat';
    renderContentArea();
    // Should have at least 2 error boundaries (chat + files) -- lazy ones not yet mounted
    const eagerBoundaries = panelErrorBoundaryProps.filter(
      (b) => b.panelName === 'chat' || b.panelName === 'files',
    );
    expect(eagerBoundaries).toHaveLength(2);
    // Active panel (chat) gets resetKeys with activeTab
    const chatBoundary = panelErrorBoundaryProps.find((b) => b.panelName === 'chat');
    expect(chatBoundary?.resetKeys).toEqual(['chat']);
    // Inactive panel (files) gets empty resetKeys
    const filesBoundary = panelErrorBoundaryProps.find((b) => b.panelName === 'files');
    expect(filesBoundary?.resetKeys).toEqual([]);
  });

  it('mobile override: renders chat even when store says files', () => {
    mockMatchMediaMatches = true;
    mockActiveTab = 'files';
    renderContentArea();
    // Mobile override forces chat to be visible
    expect(document.getElementById('panel-chat')).not.toHaveClass('hidden');
    expect(document.getElementById('panel-files')).toHaveClass('hidden');
  });
});
