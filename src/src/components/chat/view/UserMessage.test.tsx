import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from './UserMessage';
import type { Message } from '@/types/message';

vi.mock('./ImageLightbox', () => ({
  ImageLightbox: () => <div data-testid="image-lightbox" />,
}));

vi.mock('./ImageThumbnailGrid', () => ({
  ImageThumbnailGrid: ({ attachments }: { attachments: unknown[] }) => (
    <div data-testid="image-thumbnail-grid">{attachments.length} images</div>
  ),
}));

const baseMessage: Message = {
  id: 'msg-1',
  role: 'user',
  content: 'Hello world',
  metadata: {
    timestamp: new Date().toISOString(),
    tokenCount: null,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cost: null,
    duration: null,
  },
  providerContext: {
    providerId: 'claude',
    modelId: 'opus',
    agentName: null,
  },
};

describe('UserMessage', () => {
  it('renders message content as text', () => {
    render(<UserMessage message={baseMessage} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('shows timestamp element with opacity-0 class (hidden by default, shown on hover)', () => {
    render(<UserMessage message={baseMessage} />);
    // Timestamp should exist in the DOM with opacity-0 (hidden until hover)
    const timestamp = document.querySelector('[class*="opacity-0"]');
    expect(timestamp).toBeTruthy();
  });

  it('renders ImageThumbnailGrid when attachments exist', () => {
    const withAttachments: Message = {
      ...baseMessage,
      attachments: [
        { id: 'img-1', url: 'https://example.com/1.png', name: 'image1.png' },
        { id: 'img-2', url: 'https://example.com/2.png', name: 'image2.png' },
      ],
    };
    render(<UserMessage message={withAttachments} />);
    expect(screen.getByTestId('image-thumbnail-grid')).toBeTruthy();
    expect(screen.getByText('2 images')).toBeTruthy();
  });

  it('does NOT render ImageThumbnailGrid when no attachments', () => {
    render(<UserMessage message={baseMessage} />);
    expect(screen.queryByTestId('image-thumbnail-grid')).toBeNull();
  });

  it('does NOT render ImageThumbnailGrid when attachments is empty array', () => {
    const emptyAttachments: Message = { ...baseMessage, attachments: [] };
    render(<UserMessage message={emptyAttachments} />);
    expect(screen.queryByTestId('image-thumbnail-grid')).toBeNull();
  });
});
