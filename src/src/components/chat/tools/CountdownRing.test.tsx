/**
 * CountdownRing tests -- SVG circular countdown timer.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownRing } from './CountdownRing';

describe('CountdownRing', () => {
  it('renders with correct remaining seconds text', () => {
    render(<CountdownRing totalSeconds={55} remainingSeconds={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('SVG ring-offset custom property changes based on remaining/total ratio', () => {
    const { container } = render(
      <CountdownRing totalSeconds={55} remainingSeconds={27} />,
    );
    const circle = container.querySelector('circle.countdown-ring-track');
    expect(circle).toBeInTheDocument();
    // Offset is set via --ring-offset CSS custom property (Constitution 7.14)
    const style = circle?.getAttribute('style');
    expect(style).toContain('--ring-offset');
  });

  it('pulse class applied when remaining <= 10', () => {
    const { container } = render(
      <CountdownRing totalSeconds={55} remainingSeconds={8} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('countdown-ring-pulse')).toBe(true);
  });

  it('no pulse class when remaining > 10', () => {
    const { container } = render(
      <CountdownRing totalSeconds={55} remainingSeconds={20} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('countdown-ring-pulse')).toBe(false);
  });
});
