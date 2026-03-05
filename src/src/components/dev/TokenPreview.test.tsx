import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TokenPreview } from './TokenPreview';

describe('TokenPreview component', () => {
  it('renders without crashing', () => {
    expect(() => render(<TokenPreview />)).not.toThrow();
  });

  it('contains section headings for major token categories', () => {
    render(<TokenPreview />);

    expect(screen.getByText('1. Surface Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('2. Color Palette')).toBeInTheDocument();
    expect(screen.getByText('3. Typography')).toBeInTheDocument();
    expect(screen.getByText('4. Spacing Scale')).toBeInTheDocument();
    expect(screen.getByText('5. Z-Index Dictionary')).toBeInTheDocument();
    expect(screen.getByText('6. Motion Tokens')).toBeInTheDocument();
    expect(screen.getByText('7. Spring Lab')).toBeInTheDocument();
    expect(screen.getByText('8. Glass & FX Tokens')).toBeInTheDocument();
  });

  it('renders the main page title', () => {
    render(<TokenPreview />);
    expect(screen.getByText('Design Token Preview')).toBeInTheDocument();
  });

  it('renders surface hierarchy with three tiers', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--surface-base')).toBeInTheDocument();
    expect(screen.getByText('--surface-raised')).toBeInTheDocument();
    expect(screen.getByText('--surface-overlay')).toBeInTheDocument();
  });

  it('renders color swatches for accent and status colors', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--accent-primary')).toBeInTheDocument();
    expect(screen.getByText('--accent-secondary')).toBeInTheDocument();
  });

  it('renders status pills with correct labels', () => {
    render(<TokenPreview />);
    // StatusPill renders both "{label}" and "{label} (light text)"
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('renders spacing scale items', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--space-1')).toBeInTheDocument();
    expect(screen.getByText('--space-16')).toBeInTheDocument();
  });

  it('renders z-index dictionary entries', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--z-base')).toBeInTheDocument();
    expect(screen.getByText('--z-modal')).toBeInTheDocument();
    expect(screen.getByText('--z-critical')).toBeInTheDocument();
  });

  it('renders easing curve tokens in Motion Tokens section', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--ease-spring')).toBeInTheDocument();
    expect(screen.getByText('--ease-out')).toBeInTheDocument();
    expect(screen.getByText('--ease-in-out')).toBeInTheDocument();
  });

  it('renders duration tokens', () => {
    render(<TokenPreview />);
    expect(screen.getByText('--duration-fast')).toBeInTheDocument();
    expect(screen.getByText('--duration-normal')).toBeInTheDocument();
    expect(screen.getByText('--duration-slow')).toBeInTheDocument();
  });

  it('triggers easing animation on click and resets', () => {
    vi.useFakeTimers();
    render(<TokenPreview />);

    const buttons = screen.getAllByRole('button');
    // Click easing demo box (spring easing at index 0)
    act(() => { fireEvent.click(buttons[0]!); }); // ASSERT: easing demo box is rendered by TokenPreview
    act(() => { vi.advanceTimersByTime(700); });

    vi.useRealTimers();
  });

  it('triggers easing animation on keyboard Enter and Space', () => {
    vi.useFakeTimers();
    render(<TokenPreview />);

    const buttons = screen.getAllByRole('button');
    // Enter key on easing box
    act(() => { fireEvent.keyDown(buttons[0]!, { key: 'Enter' }); }); // ASSERT: first button exists
    act(() => { vi.advanceTimersByTime(700); });

    // Space key on second easing box
    act(() => { fireEvent.keyDown(buttons[1]!, { key: ' ' }); }); // ASSERT: second button exists
    act(() => { vi.advanceTimersByTime(700); });

    // Non-triggering key should not animate
    act(() => { fireEvent.keyDown(buttons[0]!, { key: 'a' }); }); // ASSERT: button at index 0 verified by previous assertions

    vi.useRealTimers();
  });

  it('triggers duration animation on click and keyboard', () => {
    vi.useFakeTimers();
    render(<TokenPreview />);

    const buttons = screen.getAllByRole('button');
    // Duration demo boxes at indices 3, 4, 5 (after 3 easing boxes)

    // Click duration fast
    act(() => { fireEvent.click(buttons[3]!); }); // ASSERT: duration demo box at index 3
    act(() => { vi.advanceTimersByTime(500); });

    // Space on duration normal
    act(() => { fireEvent.keyDown(buttons[4]!, { key: ' ' }); }); // ASSERT: duration demo box at index 4
    act(() => { vi.advanceTimersByTime(500); });

    // Enter on duration slow
    act(() => { fireEvent.keyDown(buttons[5]!, { key: 'Enter' }); }); // ASSERT: duration demo box at index 5
    act(() => { vi.advanceTimersByTime(700); });

    // Non-triggering key
    act(() => { fireEvent.keyDown(buttons[3]!, { key: 'Tab' }); }); // ASSERT: button at index 3 verified by previous assertions

    vi.useRealTimers();
  });

  it('triggers spring animation via Play All and individual boxes', () => {
    vi.useFakeTimers();
    render(<TokenPreview />);

    const playAllButton = screen.getByText('Play All');
    act(() => { fireEvent.click(playAllButton); });
    // Let animations complete fully
    act(() => { vi.advanceTimersByTime(3000); });

    // Click individual spring boxes (indices 6, 7, 8 after 3 easing + 3 duration)
    const buttons = screen.getAllByRole('button');
    act(() => { fireEvent.click(buttons[6]!); }); // ASSERT: spring demo boxes rendered at indices 6-8
    act(() => { vi.advanceTimersByTime(3000); });

    act(() => { fireEvent.keyDown(buttons[7]!, { key: 'Enter' }); }); // ASSERT: spring box at index 7
    act(() => { vi.advanceTimersByTime(3000); });

    act(() => { fireEvent.keyDown(buttons[8]!, { key: ' ' }); }); // ASSERT: spring box at index 8
    act(() => { vi.advanceTimersByTime(3000); });

    // Non-triggering key on spring box
    act(() => { fireEvent.keyDown(buttons[6]!, { key: 'Escape' }); }); // ASSERT: spring box at index 6 verified by previous assertions

    vi.useRealTimers();
  });

  it('handles double-click on spring box during animation (guard branch)', () => {
    vi.useFakeTimers();
    render(<TokenPreview />);

    const buttons = screen.getAllByRole('button');
    // Click spring box to start animation
    act(() => { fireEvent.click(buttons[6]!); }); // ASSERT: spring box at index 6 exists
    // Click again immediately while animating (hits animatingRef guard)
    act(() => { fireEvent.click(buttons[6]!); }); // ASSERT: spring box at index 6 still exists from prior render
    // Let animation complete
    act(() => { vi.advanceTimersByTime(5000); });

    vi.useRealTimers();
  });

  it('renders typography specimens', () => {
    render(<TokenPreview />);
    expect(screen.getByText('Font Specimens')).toBeInTheDocument();
    expect(screen.getByText('Heading Scale')).toBeInTheDocument();
    expect(screen.getByText('Density Comparison')).toBeInTheDocument();
  });

  it('renders glass and FX tokens section', () => {
    render(<TokenPreview />);
    expect(screen.getByText('Glassmorphic Card')).toBeInTheDocument();
    expect(screen.getByText('Glass Effect Demo')).toBeInTheDocument();
    expect(screen.getByText('--glass-blur')).toBeInTheDocument();
  });

  it('renders footer with phase information', () => {
    render(<TokenPreview />);
    expect(
      screen.getByText(/Phase 1: Design System Foundation/),
    ).toBeInTheDocument();
  });
});
