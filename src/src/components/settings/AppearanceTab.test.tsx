/**
 * AppearanceTab tests -- font size slider, code font selector, CSS variable updates.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppearanceTab } from './AppearanceTab';

const mockSetTheme = vi.fn();
const mockTheme = {
  fontSize: 14,
  density: 'comfortable' as const,
  codeFontFamily: 'JetBrains Mono',
};

vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      theme: mockTheme,
      setTheme: mockSetTheme,
    }),
}));

// Mock Select portal to render inline for testing
vi.mock('radix-ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('radix-ui');
  return {
    ...actual,
    Select: {
      // ASSERT: actual.Select exists from radix-ui
      ...(actual['Select'] as Record<string, unknown>),
      Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
  };
});

describe('AppearanceTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset CSS custom properties
    document.documentElement.style.removeProperty('--text-body');
    document.documentElement.style.removeProperty('--font-code');
  });

  it('renders font size slider with current value', () => {
    render(<AppearanceTab />);
    expect(screen.getByTestId('appearance-tab')).toBeInTheDocument();
    expect(screen.getByTestId('font-size-value')).toHaveTextContent('14px');
    expect(screen.getByText('Font Size')).toBeInTheDocument();
  });

  it('renders code font selector with current value', () => {
    render(<AppearanceTab />);
    expect(screen.getByTestId('code-font-select')).toBeInTheDocument();
    expect(screen.getByText('Code Font')).toBeInTheDocument();
  });

  it('renders code font preview block', () => {
    render(<AppearanceTab />);
    const preview = screen.getByTestId('code-font-preview');
    expect(preview).toHaveTextContent('const hello = "world";');
    // Font applied via CSS variable --font-code with quotes for multi-word names
    expect(document.documentElement.style.getPropertyValue('--font-code')).toBe('"JetBrains Mono"');
  });

  it('applies CSS custom properties on mount', () => {
    render(<AppearanceTab />);
    expect(document.documentElement.style.getPropertyValue('--text-body')).toBe('0.875rem');
    expect(document.documentElement.style.getPropertyValue('--font-code')).toBe('"JetBrains Mono"');
  });

  it('slider renders with correct min/max range labels', () => {
    render(<AppearanceTab />);
    expect(screen.getByText('12px')).toBeInTheDocument();
    expect(screen.getByText('20px')).toBeInTheDocument();
  });
});
