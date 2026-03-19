/**
 * Skeleton -- unit tests for the shimmer skeleton primitive.
 *
 * Constitution: Vitest + React Testing Library (2.5).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a div with skeleton-shimmer class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el.className).toContain('skeleton-shimmer');
  });

  it('sets aria-hidden="true"', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('variant="circle" includes rounded-full', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el.className).toContain('rounded-full');
  });

  it('variant="block" includes rounded-md', () => {
    const { container } = render(<Skeleton variant="block" />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el.className).toContain('rounded-md');
  });

  it('default variant="line" does not include rounded-full or rounded-md', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el.className).not.toContain('rounded-full');
    expect(el.className).not.toContain('rounded-md');
  });

  it('merges custom className via cn()', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const el = container.firstElementChild!; // ASSERT: Skeleton always renders a root div
    expect(el.className).toContain('skeleton-shimmer');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-24');
  });
});
