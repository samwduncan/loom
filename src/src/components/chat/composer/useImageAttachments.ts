/**
 * useImageAttachments -- manages image attachment lifecycle for the composer.
 *
 * Handles paste, drag-drop, validation (type/size/count), ObjectURL previews,
 * base64 conversion at send time, and proper cleanup/revocation.
 *
 * Constitution: Named exports (2.2), no default export.
 */

import { useState, useCallback, useEffect, useRef, type ClipboardEvent, type DragEvent } from 'react';
import { toast } from 'sonner';

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageAttachment {
  id: string;
  file: File;
  previewUrl: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useImageAttachments() {
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const attachmentsRef = useRef(attachments);

  // Sync ref with state for use in callbacks and cleanup
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const addImages = useCallback((files: File[]) => {
    const current = attachmentsRef.current;
    const toAdd: ImageAttachment[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only images are supported');
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        toast.error(`Image too large: ${sizeMB}MB (max 5MB)`);
        continue;
      }

      if (current.length + toAdd.length >= MAX_IMAGES) {
        toast.error('Maximum 5 images per message');
        break;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = Math.random().toString(36).slice(2, 10);
      toAdd.push({ id, file, previewUrl });
    }

    if (toAdd.length > 0) {
      setAttachments((prev) => [...prev, ...toAdd]);
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setAttachments((prev) => {
      for (const a of prev) {
        URL.revokeObjectURL(a.previewUrl);
      }
      return [];
    });
  }, []);

  const getBase64ForSend = useCallback(async (): Promise<Array<{ data: string; name: string }>> => {
    const current = attachmentsRef.current;
    return Promise.all(
      current.map(async (a) => ({
        data: await fileToBase64(a.file),
        name: a.file.name,
      })),
    );
  }, []);

  const addFromClipboard = useCallback(
    (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        addImages(imageFiles);
      }
    },
    [addImages],
  );

  const addFromDrop = useCallback(
    (e: DragEvent) => {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages],
  );

  // Cleanup all preview URLs on unmount
  useEffect(() => {
    return () => {
      for (const a of attachmentsRef.current) {
        URL.revokeObjectURL(a.previewUrl);
      }
    };
  }, []);

  return {
    attachments,
    addImages,
    removeImage,
    clearAll,
    getBase64ForSend,
    addFromClipboard,
    addFromDrop,
  };
}
