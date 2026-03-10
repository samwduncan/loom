/**
 * ApiKeysTab tests -- key list, add form, delete confirmation, credentials section.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKeysTab } from './ApiKeysTab';

const mockAddKey = vi.fn();
const mockDeleteKey = vi.fn();
const mockToggleKey = vi.fn();
const mockUseApiKeys = vi.fn();
const mockUseCredentials = vi.fn();

vi.mock('@/hooks/useSettingsData', () => ({
  useApiKeys: () => mockUseApiKeys(),
  useCredentials: () => mockUseCredentials(),
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

const MOCK_KEYS = [
  {
    id: 1,
    key_name: 'Test Key',
    api_key: 'ck_12345678...',
    created_at: new Date().toISOString(),
    last_used: null,
    is_active: 1 as const,
  },
  {
    id: 2,
    key_name: 'Other Key',
    api_key: 'ck_87654321...',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_used: null,
    is_active: 0 as const,
  },
];

describe('ApiKeysTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCredentials.mockReturnValue({
      data: [],
      isLoading: false,
      addCredential: vi.fn(),
      deleteCredential: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it('renders loading skeleton when isLoading', () => {
    mockUseApiKeys.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);
    expect(screen.getByTestId('settings-tab-skeleton')).toBeInTheDocument();
  });

  it('renders list of API keys with masked values', () => {
    mockUseApiKeys.mockReturnValue({
      data: MOCK_KEYS,
      isLoading: false,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);
    expect(screen.getByTestId('api-keys-tab')).toBeInTheDocument();
    expect(screen.getByTestId('key-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('key-row-2')).toBeInTheDocument();
    expect(screen.getByText('Test Key')).toBeInTheDocument();
    expect(screen.getByText('ck_12345678...')).toBeInTheDocument();
  });

  it('add key form validates non-empty name', async () => {
    const user = userEvent.setup();
    mockUseApiKeys.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);

    const addButton = screen.getByTestId('add-key-button');
    expect(addButton).toBeDisabled();

    const input = screen.getByLabelText('Key Name');
    await user.type(input, 'My New Key');
    expect(addButton).toBeEnabled();
  });

  it('delete button shows AlertDialog confirmation', async () => {
    const user = userEvent.setup();
    mockUseApiKeys.mockReturnValue({
      data: MOCK_KEYS,
      isLoading: false,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);

    const deleteButton = screen.getByLabelText('Delete Test Key');
    await user.click(deleteButton);

    expect(screen.getByText('Delete API key')).toBeInTheDocument();
    expect(screen.getByText(/Delete API key "Test Key"\? This cannot be undone\./)).toBeInTheDocument();
  });

  it('credentials section renders below separator', () => {
    mockUseApiKeys.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);
    expect(screen.getByTestId('credentials-section')).toBeInTheDocument();
  });

  it('successful add calls addKey and clears form', async () => {
    const user = userEvent.setup();
    mockAddKey.mockResolvedValue(undefined);
    mockUseApiKeys.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      addKey: mockAddKey,
      deleteKey: mockDeleteKey,
      toggleKey: mockToggleKey,
      refetch: vi.fn(),
    });

    render(<ApiKeysTab />);

    const input = screen.getByLabelText('Key Name');
    await user.type(input, 'My New Key');
    await user.click(screen.getByTestId('add-key-button'));

    expect(mockAddKey).toHaveBeenCalledWith('My New Key');
  });
});
