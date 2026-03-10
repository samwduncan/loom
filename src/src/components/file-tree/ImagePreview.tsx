/**
 * ImagePreview -- lightbox dialog for image file preview.
 *
 * Controlled component (open/onOpenChange props). Displays an image from
 * the backend file content endpoint inside a shadcn Dialog.
 *
 * Constitution: Named export (2.2), design tokens (3.1), cn() for classes (3.6).
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ImagePreviewProps {
  filePath: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

export const ImagePreview = function ImagePreview({
  filePath,
  fileName,
  open,
  onOpenChange,
  projectName,
}: ImagePreviewProps) {
  const [hasError, setHasError] = useState(false);

  const imageUrl = `/api/projects/${encodeURIComponent(projectName)}/files/content?path=${encodeURIComponent(filePath)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw] w-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">{fileName}</DialogTitle>
          <DialogDescription className="sr-only">Image preview for {fileName}</DialogDescription>
        </DialogHeader>
        {hasError ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Failed to load image preview
            </p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-[80vw] max-h-[70vh] object-contain rounded-md"
            onError={() => setHasError(true)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
