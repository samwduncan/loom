/**
 * ImagePreviewCard -- 64x64 thumbnail with hover X remove button.
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6), design tokens only.
 */

import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImagePreviewCardProps {
  previewUrl: string;
  fileName: string;
  onRemove: () => void;
}

export function ImagePreviewCard({ previewUrl, fileName, onRemove }: ImagePreviewCardProps) {
  return (
    <div className="group relative h-16 w-16 flex-shrink-0">
      <img
        src={previewUrl}
        alt={fileName}
        className="h-16 w-16 rounded-lg object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${fileName}`}
        className={cn(
          'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full',
          'bg-surface-0/80 backdrop-blur-sm',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'hover:bg-surface-0',
        )}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}
