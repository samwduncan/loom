/**
 * McpTab tests -- server list, add form, remove confirmation, loading/error states.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpTab } from './McpTab';
import type { McpServer } from '@/types/settings';

const mockAddServer = vi.fn();
const mockRemoveServer = vi.fn();
const mockRefetch = vi.fn();

interface MockHookReturn {
  data: McpServer[];
  isLoading: boolean;
  error: string | null;
  addServer: typeof mockAddServer;
  removeServer: typeof mockRemoveServer;
  refetch: typeof mockRefetch;
}

// Track separate return values for claude and codex
let claudeReturn: MockHookReturn;
let codexReturn: MockHookReturn;

function defaultHookReturn(): MockHookReturn {
  return {
    data: [],
    isLoading: false,
    error: null,
    addServer: mockAddServer,
    removeServer: mockRemoveServer,
    refetch: mockRefetch,
  };
}

vi.mock('@/hooks/useSettingsData', () => ({
  useMcpServers: (provider: string) => {
    return provider === 'claude' ? claudeReturn : codexReturn;
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AlertDialog portal to render inline for testing
vi.mock('radix-ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('radix-ui');
  return {
    ...actual,
    AlertDialog: {
      // ASSERT: actual.AlertDialog exists from radix-ui
      ...(actual['AlertDialog'] as Record<string, unknown>),
      Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
  };
});

const MOCK_SERVERS: McpServer[] = [
  {
    id: 'server-1',
    name: 'filesystem',
    type: 'stdio',
    scope: 'user',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },
  },
  {
    id: 'server-2',
    name: 'web-search',
    type: 'http',
    scope: 'local',
    config: {
      url: 'http://localhost:8080/mcp',
    },
  },
];

describe('McpTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claudeReturn = defaultHookReturn();
    codexReturn = defaultHookReturn();
  });

  it('renders loading skeleton when isLoading', () => {
    claudeReturn = { ...defaultHookReturn(), isLoading: true };
    render(<McpTab />);
    expect(screen.getAllByTestId('settings-tab-skeleton').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Claude and Codex sections', () => {
    render(<McpTab />);
    expect(screen.getByTestId('mcp-claude-section')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-codex-section')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Codex')).toBeInTheDocument();
  });

  it('renders server list with name, type, command', () => {
    claudeReturn = { ...defaultHookReturn(), data: MOCK_SERVERS };
    render(<McpTab />);

    const claudeSection = screen.getByTestId('mcp-claude-section');
    expect(within(claudeSection).getByText('filesystem')).toBeInTheDocument();
    expect(within(claudeSection).getByText('stdio')).toBeInTheDocument();
    expect(within(claudeSection).getByText(/npx/)).toBeInTheDocument();
    expect(within(claudeSection).getByText('web-search')).toBeInTheDocument();
    expect(within(claudeSection).getByText('http')).toBeInTheDocument();
  });

  it('remove button shows AlertDialog confirmation', async () => {
    const user = userEvent.setup();
    claudeReturn = { ...defaultHookReturn(), data: MOCK_SERVERS.slice(0, 1) };
    render(<McpTab />);

    const removeBtn = screen.getByLabelText('Remove filesystem');
    await user.click(removeBtn);

    expect(screen.getByText('Remove MCP server')).toBeInTheDocument();
    expect(screen.getByText(/Remove MCP server "filesystem"\?/)).toBeInTheDocument();
  });

  it('shows "(requires restart)" indicator on servers', () => {
    claudeReturn = { ...defaultHookReturn(), data: MOCK_SERVERS.slice(0, 1) };
    render(<McpTab />);

    // At least one "(requires restart)" should be visible next to the server
    const restartLabels = screen.getAllByText('(requires restart)');
    expect(restartLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('add server form validates required fields', async () => {
    const user = userEvent.setup();
    render(<McpTab />);

    // Open add form for Claude
    await user.click(screen.getByTestId('mcp-claude-add-button'));

    const form = screen.getByTestId('mcp-claude-add-form');
    const submitBtn = within(form).getByTestId('mcp-claude-add-submit');
    expect(submitBtn).toBeDisabled();

    // Fill name only - still disabled (command required)
    await user.type(screen.getByLabelText('Server Name'), 'test-server');
    expect(submitBtn).toBeDisabled();

    // Fill command - now enabled
    await user.type(screen.getByLabelText('Command'), 'npx test');
    expect(submitBtn).toBeEnabled();
  });

  it('error state shows retry button', () => {
    claudeReturn = { ...defaultHookReturn(), error: 'Network error' };
    render(<McpTab />);

    expect(screen.getByTestId('mcp-claude-error')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-claude-retry')).toBeInTheDocument();
  });

  it('shows http server URL', () => {
    claudeReturn = { ...defaultHookReturn(), data: MOCK_SERVERS.slice(1, 2) };
    render(<McpTab />);
    expect(screen.getByText('http://localhost:8080/mcp')).toBeInTheDocument();
  });
});
