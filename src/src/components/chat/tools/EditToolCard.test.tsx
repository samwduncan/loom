/**
 * EditToolCard tests -- covers TOOL-12 unified diff card rendering.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EditToolCard } from './EditToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Edit',
    input: {
      file_path: 'src/utils/auth.ts',
      old_string: 'const foo = 1;\nconst bar = 2;',
      new_string: 'const foo = 1;\nconst baz = 3;',
    },
    output: 'File edited successfully',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('EditToolCard', () => {
  it('renders file path with icon', () => {
    const { container } = render(<EditToolCard {...makeProps()} />);
    expect(container.textContent).toContain('src/utils/auth.ts');
    // FilePen SVG should be present
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders addition lines with bg-diff-added class and + sign', () => {
    const { container } = render(<EditToolCard {...makeProps()} />);
    const addedRows = container.querySelectorAll('.bg-diff-added');
    expect(addedRows.length).toBeGreaterThan(0);
    // At least one row should contain the + sign
    const hasPlus = Array.from(addedRows).some((row) =>
      row.textContent?.includes('+'),
    );
    expect(hasPlus).toBe(true);
  });

  it('renders deletion lines with bg-diff-removed class and - sign', () => {
    const { container } = render(<EditToolCard {...makeProps()} />);
    const removedRows = container.querySelectorAll('.bg-diff-removed');
    expect(removedRows.length).toBeGreaterThan(0);
    const hasMinus = Array.from(removedRows).some((row) =>
      row.textContent?.includes('-'),
    );
    expect(hasMinus).toBe(true);
  });

  it('renders context lines with no diff background', () => {
    const { container } = render(<EditToolCard {...makeProps()} />);
    // Context line "const foo = 1;" should exist without diff bg
    const allRows = container.querySelectorAll('.flex');
    const contextRows = Array.from(allRows).filter(
      (row) =>
        !row.classList.contains('bg-diff-added') &&
        !row.classList.contains('bg-diff-removed') &&
        row.textContent?.includes('const foo = 1;'),
    );
    expect(contextRows.length).toBeGreaterThan(0);
  });

  it('displays dual line numbers', () => {
    const { container } = render(<EditToolCard {...makeProps()} />);
    // Should have line number elements
    const text = container.textContent ?? '';
    // Old and new line numbers should appear
    expect(text).toContain('1');
    expect(text).toContain('2');
  });

  it('handles empty old_string (pure addition)', () => {
    const { container } = render(
      <EditToolCard
        {...makeProps({
          input: {
            file_path: 'src/new.ts',
            old_string: '',
            new_string: 'line1\nline2',
          },
        })}
      />,
    );
    const addedRows = container.querySelectorAll('.bg-diff-added');
    // All lines should be additions
    expect(addedRows.length).toBeGreaterThan(0);
    // No removed lines
    const removedRows = container.querySelectorAll('.bg-diff-removed');
    expect(removedRows.length).toBe(0);
  });

  it('handles missing input fields gracefully (falls back to plain text)', () => {
    const { container } = render(
      <EditToolCard
        {...makeProps({
          input: { file_path: 'src/test.ts' },
          output: 'Some raw output',
        })}
      />,
    );
    expect(container.textContent).toContain('Some raw output');
  });

  it('shows "No changes" for identical strings', () => {
    const { container } = render(
      <EditToolCard
        {...makeProps({
          input: {
            file_path: 'src/same.ts',
            old_string: 'identical',
            new_string: 'identical',
          },
        })}
      />,
    );
    expect(container.textContent).toContain('No changes');
  });

  it('handles missing new_string (pure deletion)', () => {
    const { container } = render(
      <EditToolCard
        {...makeProps({
          input: {
            file_path: 'src/delete.ts',
            old_string: 'removed line',
          },
        })}
      />,
    );
    const removedRows = container.querySelectorAll('.bg-diff-removed');
    expect(removedRows.length).toBeGreaterThan(0);
  });

  it('shows "No content" when both diff and output are absent', () => {
    const { container } = render(
      <EditToolCard
        {...makeProps({
          input: { file_path: 'src/empty.ts' },
          output: null,
        })}
      />,
    );
    expect(container.textContent).toContain('No content');
  });
});
