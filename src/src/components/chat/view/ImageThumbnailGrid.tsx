/**
 * ImageThumbnailGrid -- horizontal row of image thumbnails.
 *
 * Renders inside user message bubble when message.attachments exists.
 * Each thumbnail is clickable, opening the ImageLightbox.
 * Keys on attachment.id (not URL) for lifecycle stability across
 * optimistic -> persisted URL changes.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import type { ImageAttachment } from '@/types/message';

interface ImageThumbnailGridProps {
  attachments: ImageAttachment[];
  onImageClick: (attachment: ImageAttachment) => void;
}

export function ImageThumbnailGrid({ attachments, onImageClick }: ImageThumbnailGridProps) {
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {attachments.map((attachment) => (
        <img
          key={attachment.id}
          src={attachment.url}
          alt={attachment.name}
          className="max-w-[calc(50%-0.25rem)] md:max-w-[200px] max-h-[200px] rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
          onClick={() => onImageClick(attachment)}
        />
      ))}
    </div>
  );
}
