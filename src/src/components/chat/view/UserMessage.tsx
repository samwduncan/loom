/**
 * UserMessage -- user message bubble (right-aligned).
 *
 * Renders content as plain text inside MessageContainer (bg-card bubble).
 * Shows relative timestamp on hover below the bubble (zero layout shift).
 * Displays image thumbnails above text when message.attachments exists.
 * Clicking a thumbnail opens the ImageLightbox.
 *
 * Constitution: Named exports (2.2), token-based styling (3.1).
 */

import { useState, memo, type ReactNode } from 'react';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { ImageThumbnailGrid } from '@/components/chat/view/ImageThumbnailGrid';
import { ImageLightbox } from '@/components/chat/view/ImageLightbox';
import { formatRelativeTime } from '@/lib/formatTime';
import type { Message, ImageAttachment } from '@/types/message';

export interface UserMessageProps {
  message: Message;
  /** Highlight function to wrap matching search text in <mark> elements */
  highlightText?: (text: string) => ReactNode;
}

export const UserMessage = memo(function UserMessage({ message, highlightText }: UserMessageProps) {
  const [lightboxAttachment, setLightboxAttachment] = useState<ImageAttachment | null>(null);

  return (
    <div className="pb-5">
      <MessageContainer role="user">
        <div className="group relative">
          {message.attachments && message.attachments.length > 0 && (
            <ImageThumbnailGrid
              attachments={message.attachments}
              onImageClick={setLightboxAttachment}
            />
          )}
          <div className="whitespace-pre-wrap break-words">
            {highlightText ? highlightText(message.content) : message.content}
          </div>
          <span className="absolute -bottom-5 right-0 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
            {formatRelativeTime(message.metadata.timestamp)}
          </span>
        </div>
      </MessageContainer>
      <ImageLightbox
        src={lightboxAttachment?.url ?? null}
        alt={lightboxAttachment?.name}
        open={lightboxAttachment !== null}
        onClose={() => setLightboxAttachment(null)}
      />
    </div>
  );
});
