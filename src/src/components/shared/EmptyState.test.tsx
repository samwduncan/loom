/**
 * EmptyState -- unit tests for empty state layout component.
 *
 * Constitution: Vitest + React Testing Library (2.5).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders icon, heading, and description', () => {
    render(
      <EmptyState
        icon={<span data-testid="icon">IC</span>}
        heading="No items"
        description="Try adding something"
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Try adding something')).toBeInTheDocument();
  });

  it('renders optional action slot', () => {
    render(
      <EmptyState
        icon={<span>IC</span>}
        heading="Empty"
        action={<button type="button">Create</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(
      <EmptyState icon={<span>IC</span>} heading="Empty" />,
    );
    // No paragraph element for description
    const paragraphs = container.querySelectorAll('p');
    // Only heading text should be present, no description paragraph
    const descParagraphs = Array.from(paragraphs).filter(
      (p) => p.textContent !== 'Empty',
    );
    expect(descParagraphs).toHaveLength(0);
  });

  it('does not render action when not provided', () => {
    render(<EmptyState icon={<span>IC</span>} heading="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(
      <EmptyState icon={<span>IC</span>} heading="Empty" className="my-custom" />,
    );
    expect(container.firstElementChild!.className).toContain('my-custom'); // ASSERT: EmptyState always renders a root div
  });
});
