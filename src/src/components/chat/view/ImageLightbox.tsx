/**
 * ImageLightbox -- fullscreen image viewer using shadcn Dialog.
 *
 * Renders a centered image over a dark backdrop (bg-black/80).
 * Dismisses on backdrop click, Escape key, or X button.
 * No zoom controls -- displays image at natural size constrained to viewport.
 *
 * Constitution: Named export (2.2), token-based z-index (3.1), cn() for classes (3.6).
 */

import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  if (src === null) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[50%] left-[50%] z-[var(--z-modal)] translate-x-[-50%] translate-y-[-50%] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">
            {alt || 'Image preview'}
          </DialogPrimitive.Title>
          <img
            src={src}
            alt={alt ?? ''}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
          <DialogPrimitive.Close
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon className="text-white" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
