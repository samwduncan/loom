/**
 * PlaceholderView tests — Generic placeholder for empty route states.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PlaceholderView } from './PlaceholderView';

describe('PlaceholderView', () => {
  it('renders title with consistent styling', () => {
    render(<PlaceholderView title="Dashboard" />);
    const title = screen.getByText('Dashboard');
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('text-muted');
  });

  it('renders optional message below title', () => {
    render(<PlaceholderView title="Chat" message="session-123" />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('session-123')).toBeInTheDocument();
  });

  it('does not render message element when message is not provided', () => {
    const { container } = render(<PlaceholderView title="Settings" />);
    const paragraphs = container.querySelectorAll('p');
    // Only title paragraph, no message paragraph
    expect(paragraphs).toHaveLength(1);
  });
});
