import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn() className composition utility', () => {
  it('merges multiple class names', () => {
    expect(cn('px-3', 'py-2')).toBe('px-3 py-2');
  });

  it('handles conditional classes (false, undefined, null)', () => {
    const isHidden = false;
    const isVisible = true;
    expect(cn('base', isHidden && 'hidden', isVisible && 'visible')).toBe(
      'base visible',
    );
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('resolves Tailwind conflicts with last-wins behavior', () => {
    expect(cn('px-3', 'px-4')).toBe('px-4');
    // eslint-disable-next-line loom/no-hardcoded-colors -- testing tailwind-merge conflict resolution
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });

  it('handles array inputs', () => {
    expect(cn(['px-3', 'py-2'])).toBe('px-3 py-2');
  });
});
