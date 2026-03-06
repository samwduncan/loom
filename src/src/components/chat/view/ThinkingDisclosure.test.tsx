/**
 * ThinkingDisclosure component tests — covers STRM-04 thinking block display.
 * Tests expand/collapse, auto-collapse on thinking completion, null/empty handling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import type { ThinkingState } from '@/types/stream';
import type { ThinkingBlock } from '@/types/message';

function makeThinkingState(
  overrides: Partial<ThinkingState> = {},
): ThinkingState {
  return {
    isThinking: true,
    blocks: [
      { id: 'tb-1', text: 'Analyzing the problem...', isComplete: true },
      { id: 'tb-2', text: 'Considering approaches...', isComplete: false },
    ],
    ...overrides,
  };
}

describe('ThinkingDisclosure', () => {
  it('renders nothing when thinkingState is null', () => {
    const { container } = render(
      <ThinkingDisclosure thinkingState={null} />,
    );
    expect(container.querySelector('.thinking-disclosure')).toBeNull();
  });

  it('renders nothing when thinkingState has zero blocks', () => {
    const { container } = render(
      <ThinkingDisclosure thinkingState={{ isThinking: false, blocks: [] }} />,
    );
    expect(container.querySelector('.thinking-disclosure')).toBeNull();
  });

  it('shows pulsing "Thinking..." label when isThinking is true', () => {
    const { container } = render(
      <ThinkingDisclosure thinkingState={makeThinkingState({ isThinking: true })} />,
    );
    const pulse = container.querySelector('.thinking-pulse');
    expect(pulse).not.toBeNull();
    expect(pulse?.textContent).toBe('Thinking...');
  });

  it('is expanded when isThinking is true', () => {
    const { container } = render(
      <ThinkingDisclosure thinkingState={makeThinkingState({ isThinking: true })} />,
    );
    const content = container.querySelector('.thinking-disclosure-content');
    expect(content).not.toBeNull();
    // Grid row is 1fr when expanded
    expect(content?.getAttribute('style')).toContain('1fr');
  });

  it('shows "Thinking (N blocks)" when isThinking is false', () => {
    const blocks: ThinkingBlock[] = [
      { id: 'tb-1', text: 'First thought', isComplete: true },
      { id: 'tb-2', text: 'Second thought', isComplete: true },
    ];
    render(
      <ThinkingDisclosure thinkingState={{ isThinking: false, blocks }} />,
    );
    expect(screen.getByText('Thinking (2 blocks)')).toBeInTheDocument();
  });

  it('shows singular "block" for 1 block', () => {
    const blocks: ThinkingBlock[] = [
      { id: 'tb-1', text: 'Only thought', isComplete: true },
    ];
    render(
      <ThinkingDisclosure thinkingState={{ isThinking: false, blocks }} />,
    );
    expect(screen.getByText('Thinking (1 block)')).toBeInTheDocument();
  });

  it('auto-collapses when isThinking transitions from true to false', () => {
    const { container, rerender } = render(
      <ThinkingDisclosure
        thinkingState={makeThinkingState({ isThinking: true })}
      />,
    );

    // Initially expanded
    let content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');

    // Transition to not thinking
    act(() => {
      rerender(
        <ThinkingDisclosure
          thinkingState={makeThinkingState({ isThinking: false })}
        />,
      );
    });

    // Should be collapsed
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');
  });

  it('click toggles expansion regardless of thinking state', () => {
    const { container } = render(
      <ThinkingDisclosure
        thinkingState={makeThinkingState({ isThinking: false })}
      />,
    );

    const trigger = container.querySelector('.thinking-disclosure-trigger');
    expect(trigger).not.toBeNull();

    // Initially collapsed (thinking is false)
    let content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');

    // Click to expand
    fireEvent.click(trigger!); // ASSERT: trigger exists since component rendered with non-empty blocks
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('1fr');

    // Click to collapse
    fireEvent.click(trigger!); // ASSERT: trigger confirmed non-null above
    content = container.querySelector('.thinking-disclosure-content');
    expect(content?.getAttribute('style')).toContain('0fr');
  });

  it('renders each thinking block as a paragraph', () => {
    render(
      <ThinkingDisclosure thinkingState={makeThinkingState({ isThinking: true })} />,
    );
    expect(screen.getByText('Analyzing the problem...')).toBeInTheDocument();
    expect(screen.getByText('Considering approaches...')).toBeInTheDocument();
  });

  it('disclosure arrow has data-expanded attribute', () => {
    const { container } = render(
      <ThinkingDisclosure thinkingState={makeThinkingState({ isThinking: true })} />,
    );
    const arrow = container.querySelector('.thinking-disclosure-arrow');
    expect(arrow).not.toBeNull();
    expect(arrow?.getAttribute('data-expanded')).toBe('true');
  });
});
