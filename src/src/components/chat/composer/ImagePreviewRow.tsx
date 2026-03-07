/**
 * ImagePreviewRow -- horizontal scroll row of thumbnail cards with counter badge.
 *
 * Returns null when no attachments. Shows N/5 counter that turns warning at 5/5.
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6), design tokens only.
 */

import { cn } from '@/utils/cn';
import { ImagePreviewCard } from './ImagePreviewCard';
import type { ImageAttachment } from './useImageAttachments';

interface ImagePreviewRowProps {
  attachments: ImageAttachment[];
  onRemove: (id: string) => void;
}

export function ImagePreviewRow({ attachments, onRemove }: ImagePreviewRowProps) {
  if (attachments.length === 0) return null;

  const isFull = attachments.length >= 5;

  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {attachments.map((a) => (
          <ImagePreviewCard
            key={a.id}
            previewUrl={a.previewUrl}
            fileName={a.file.name}
            onRemove={() => onRemove(a.id)}
          />
        ))}
      </div>
      <span
        className={cn(
          'flex-shrink-0 text-xs tabular-nums',
          isFull ? 'text-warning' : 'text-muted',
        )}
      >
        {attachments.length}/5
      </span>
    </div>
  );
}
