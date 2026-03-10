/**
 * GitTab tests -- loading, pre-fill, save button state, toast, restart indicator.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitTab } from './GitTab';
import { toast } from 'sonner';

const mockSaveGitConfig = vi.fn();
const mockUseGitConfig = vi.fn();

vi.mock('@/hooks/useSettingsData', () => ({
  useGitConfig: () => mockUseGitConfig(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GitTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when isLoading', () => {
    mockUseGitConfig.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);
    expect(screen.getByTestId('settings-tab-skeleton')).toBeInTheDocument();
  });

  it('pre-fills inputs with existing git config', () => {
    mockUseGitConfig.mockReturnValue({
      data: { success: true, gitName: 'John Doe', gitEmail: 'john@example.com' },
      isLoading: false,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);
    expect(screen.getByLabelText('Git User Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Git Email')).toHaveValue('john@example.com');
  });

  it('save button disabled when no changes', () => {
    mockUseGitConfig.mockReturnValue({
      data: { success: true, gitName: 'John Doe', gitEmail: 'john@example.com' },
      isLoading: false,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);
    expect(screen.getByTestId('git-save-button')).toBeDisabled();
  });

  it('save button enabled after editing', async () => {
    const user = userEvent.setup();
    mockUseGitConfig.mockReturnValue({
      data: { success: true, gitName: 'John Doe', gitEmail: 'john@example.com' },
      isLoading: false,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);

    const nameInput = screen.getByLabelText('Git User Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');

    expect(screen.getByTestId('git-save-button')).toBeEnabled();
  });

  it('successful save shows success toast', async () => {
    const user = userEvent.setup();
    mockSaveGitConfig.mockResolvedValue(undefined);
    mockUseGitConfig.mockReturnValue({
      data: { success: true, gitName: 'John Doe', gitEmail: 'john@example.com' },
      isLoading: false,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);

    const nameInput = screen.getByLabelText('Git User Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');
    await user.click(screen.getByTestId('git-save-button'));

    expect(mockSaveGitConfig).toHaveBeenCalledWith('Jane Doe', 'john@example.com');
    expect(toast.success).toHaveBeenCalledWith('Git config saved');
  });

  it('(requires restart) indicator is visible', () => {
    mockUseGitConfig.mockReturnValue({
      data: { success: true, gitName: 'John Doe', gitEmail: 'john@example.com' },
      isLoading: false,
      error: null,
      saveGitConfig: mockSaveGitConfig,
      refetch: vi.fn(),
    });

    render(<GitTab />);
    expect(screen.getByTestId('restart-indicator')).toHaveTextContent('(requires restart)');
  });
});
