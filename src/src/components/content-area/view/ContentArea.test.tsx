/**
 * ContentArea tests -- verifies mount-once CSS show/hide, mobile override,
 * error boundary integration, and ARIA attributes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ContentArea } from './ContentArea';

// Mock useUIStore
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

  it('all four panel containers are in the DOM simultaneously', () => {
    renderContentArea();
    expect(document.getElementById('panel-chat')).toBeInTheDocument();
    expect(document.getElementById('panel-files')).toBeInTheDocument();
    expect(document.getElementById('panel-shell')).toBeInTheDocument();
    expect(document.getElementById('panel-git')).toBeInTheDocument();
  });

  it('active panel has no hidden class; inactive panels have hidden class', () => {
    mockActiveTab = 'chat';
    renderContentArea();
    expect(document.getElementById('panel-chat')).not.toHaveClass('hidden');
    expect(document.getElementById('panel-files')).toHaveClass('hidden');
    expect(document.getElementById('panel-shell')).toHaveClass('hidden');
    expect(document.getElementById('panel-git')).toHaveClass('hidden');
  });

  it('switching activeTab changes which panel is visible', () => {
    mockActiveTab = 'files';
    renderContentArea();
    expect(document.getElementById('panel-chat')).toHaveClass('hidden');
    expect(document.getElementById('panel-files')).not.toHaveClass('hidden');
    expect(document.getElementById('panel-shell')).toHaveClass('hidden');
    expect(document.getElementById('panel-git')).toHaveClass('hidden');
  });

  it('each panel has role="tabpanel" and aria-labelledby', () => {
    renderContentArea();
    const panels = ['chat', 'files', 'shell', 'git'] as const;
    for (const id of panels) {
      const panel = document.getElementById(`panel-${id}`);
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', `tab-${id}`);
    }
  });

  it('ChatView is rendered directly in the chat panel', () => {
    renderContentArea();
    const chatPanel = document.getElementById('panel-chat');
    expect(chatPanel).toBeInTheDocument();
    expect(screen.getByTestId('chat-view')).toBeInTheDocument();
  });

  it('each panel is wrapped in PanelErrorBoundary with resetKeys', () => {
    mockActiveTab = 'chat';
    renderContentArea();
    // Should have 4 error boundaries -- one per panel
    const boundaries = panelErrorBoundaryProps;
    expect(boundaries).toHaveLength(4);
    const panelNames = boundaries.map((b) => b.panelName);
    expect(panelNames).toContain('chat');
    expect(panelNames).toContain('files');
    expect(panelNames).toContain('shell');
    expect(panelNames).toContain('git');
    // Each should have resetKeys with current activeTab
    for (const b of boundaries) {
      expect(b.resetKeys).toEqual(['chat']);
    }
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
