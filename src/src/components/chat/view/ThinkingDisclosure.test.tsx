/**
 * ThinkingDisclosure component tests — covers thinking block display.
 * Tests new prop shape (blocks + isStreaming + globalExpanded), collapsed
 * label with char count, monospace styling, global toggle behavior.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import type { ThinkingBlock } from '@/types/message';

const BLOCKS: ThinkingBlock[] = [
  { id: 'tb-1', text: 'Analyzing the problem...', isComplete: true },
  { id: 'tb-2', text: 'Considering approaches...', isComplete: false },
];

describe('ThinkingDisclosure', () => {
  it('renders nothing when blocks array is empty', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={[]} isStreaming={false} />,
    );
    expect(container.querySelector('.thinking-disclosure')).toBeNull();
  });

  it('shows pulsing "Thinking..." label when isStreaming is true', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} />,
    );
    const pulse = container.querySelector('.thinking-pulse');
    expect(pulse).not.toBeNull();
    expect(pulse?.textContent).toBe('Thinking...');
  });

  it('is expanded when isStreaming is true', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} />,
    );
    const content = container.querySelector('.thinking-disclosure-content');
    expect(content).not.toBeNull();
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('shows "Thinking (N chars)" with character count when not streaming', () => {
    const totalChars = BLOCKS.reduce((sum, b) => sum + b.text.length, 0);
    render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} />,
    );
    expect(
      screen.getByText(`Thinking (${totalChars.toLocaleString()} chars)`),
    ).toBeInTheDocument();
  });

  it('formats large char counts with locale separators', () => {
    const longBlock: ThinkingBlock[] = [
      { id: 'tb-big', text: 'x'.repeat(12345), isComplete: true },
    ];
    render(
      <ThinkingDisclosure blocks={longBlock} isStreaming={false} />,
    );
    expect(
      screen.getByText(`Thinking (${(12345).toLocaleString()} chars)`),
    ).toBeInTheDocument();
  });

  it('renders thinking text with monospace italic muted styling', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} />,
    );
    const paragraphs = container.querySelectorAll('.thinking-disclosure-content p');
    expect(paragraphs.length).toBe(2);
    for (const p of paragraphs) {
      expect(p.className).toContain('italic');
      expect(p.className).toContain('text-muted');
      expect(p.className).toContain('font-mono');
      expect(p.className).toContain('text-sm');
    }
  });

  it('click toggles expansion regardless of streaming state', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} />,
    );

    const trigger = container.querySelector('.thinking-disclosure-trigger');
    expect(trigger).not.toBeNull();

    // By default when not streaming, follows globalExpanded (default true)
    let content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');

    // Click to collapse
    fireEvent.click(trigger!); // ASSERT: trigger confirmed non-null by expect on line 85
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');

    // Click to expand
    fireEvent.click(trigger!); // ASSERT: trigger confirmed non-null by expect on line 85
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('globalExpanded=false collapses non-streaming disclosures', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} globalExpanded={false} />,
    );
    const content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');
  });

  it('individual click overrides globalExpanded=false', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} globalExpanded={false} />,
    );

    const trigger = container.querySelector('.thinking-disclosure-trigger');
    // Initially collapsed due to globalExpanded=false
    let content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');

    // Click to override
    fireEvent.click(trigger!); // ASSERT: trigger exists since component rendered with non-empty blocks
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('resets userToggled when globalExpanded changes', () => {
    const { container, rerender } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} globalExpanded={true} />,
    );

    const trigger = container.querySelector('.thinking-disclosure-trigger');

    // User manually collapses
    fireEvent.click(trigger!); // ASSERT: trigger exists since component rendered with non-empty blocks
    let content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');

    // Global toggle changes — should reset user override, now follow global
    act(() => {
      rerender(
        <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} globalExpanded={false} />,
      );
    });
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');

    // Toggle back to true — user override was cleared, should expand
    act(() => {
      rerender(
        <ThinkingDisclosure blocks={BLOCKS} isStreaming={false} globalExpanded={true} />,
      );
    });
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('streaming always starts expanded regardless of globalExpanded', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} globalExpanded={false} />,
    );
    const content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('renders each thinking block as a paragraph', () => {
    render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} />,
    );
    expect(screen.getByText('Analyzing the problem...')).toBeInTheDocument();
    expect(screen.getByText('Considering approaches...')).toBeInTheDocument();
  });

  it('disclosure arrow has data-expanded attribute', () => {
    const { container } = render(
      <ThinkingDisclosure blocks={BLOCKS} isStreaming={true} />,
    );
    const arrow = container.querySelector('.thinking-disclosure-arrow');
    expect(arrow).not.toBeNull();
    expect(arrow?.getAttribute('data-expanded')).toBe('true');
  });
});
