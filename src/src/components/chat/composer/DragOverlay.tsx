/**
 * DragOverlay -- dashed border drop overlay covering the composer pill.
 *
 * Shows centered "Drop image here" with icon when dragging images over the composer.
 * Hidden via opacity when not active, with fast transition.
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6), design tokens only.
 */

import { ImageIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DragOverlayProps {
  isDragOver: boolean;
}

export function DragOverlay({ isDragOver }: DragOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-[var(--z-sticky)] flex flex-col items-center justify-center gap-2 rounded-xl',
        'border-2 border-dashed border-primary/40 bg-primary/10',
        'transition-opacity duration-[var(--duration-fast)]',
        isDragOver ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <ImageIcon size={24} className="text-primary/60" aria-hidden="true" />
      <span className="text-sm text-primary/60">Drop image here</span>
    </div>
  );
}
