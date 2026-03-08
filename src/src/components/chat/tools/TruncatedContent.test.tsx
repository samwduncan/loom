import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TruncatedContent } from './TruncatedContent';

const items = Array.from({ length: 10 }, (_, i) => `item-${i}`);

function renderLine(item: string, index: number) {
  return <div key={index} data-testid={`line-${index}`}>{item}</div>;
}

describe('TruncatedContent', () => {
  it('renders all items when count is below threshold', () => {
    const { container } = render(
      <TruncatedContent items={items.slice(0, 3)} threshold={5} unit="lines" renderItem={renderLine} />,
    );
    expect(container.querySelectorAll('[data-testid^="line-"]')).toHaveLength(3);
    expect(container.querySelector('button')).toBeNull();
  });

  it('truncates items above threshold', () => {
    const { container } = render(
      <TruncatedContent items={items} threshold={3} unit="lines" renderItem={renderLine} />,
    );
    expect(container.querySelectorAll('[data-testid^="line-"]')).toHaveLength(3);
  });

  it('shows "Show N more" button with exact remaining count', () => {
    const { container } = render(
      <TruncatedContent items={items} threshold={3} unit="lines" renderItem={renderLine} />,
    );
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show 7 more lines');
  });

  it('expands to show all items and "Show less" button', () => {
    const { container } = render(
      <TruncatedContent items={items} threshold={3} unit="lines" renderItem={renderLine} />,
    );
    const expandBtn = container.querySelector('button');
    fireEvent.click(expandBtn!); // ASSERT: expand button exists when threshold < items.length

    expect(container.querySelectorAll('[data-testid^="line-"]')).toHaveLength(10);
    const collapseBtn = container.querySelector('button');
    expect(collapseBtn?.textContent).toBe('Show less');
  });

  it('collapses back after clicking Show less', () => {
    const { container } = render(
      <TruncatedContent items={items} threshold={3} unit="lines" renderItem={renderLine} />,
    );
    fireEvent.click(container.querySelector('button')!); // ASSERT: expand button exists when threshold < items.length
    fireEvent.click(container.querySelector('button')!); // ASSERT: collapse button exists after expansion

    expect(container.querySelectorAll('[data-testid^="line-"]')).toHaveLength(3);
    expect(container.querySelector('button')?.textContent).toBe('Show 7 more lines');
  });

  it('uses custom unit label', () => {
    const { container } = render(
      <TruncatedContent items={items} threshold={5} unit="files" renderItem={renderLine} />,
    );
    expect(container.querySelector('button')?.textContent).toBe('Show 5 more files');
  });
});
