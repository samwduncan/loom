/**
 * useFileSave -- saves file content via PUT endpoint with toast feedback.
 *
 * On success: shows toast, marks file as clean in file store.
 * On error: shows error toast with backend reason.
 *
 * Constitution: Named export (2.2), selector hooks for store access (4.2/4.5).
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { useFileStore } from '@/stores/file';
import { originalCache } from '@/components/editor/content-cache';

export function useFileSave(projectName: string): {
  save: (filePath: string, content: string) => Promise<boolean>;
  saving: boolean;
} {
  const [saving, setSaving] = useState(false);
  const setDirty = useFileStore((s) => s.setDirty);

  const save = useCallback(
    async (filePath: string, content: string): Promise<boolean> => {
      if (!projectName || !filePath) return false;

      setSaving(true);
      try {
        await apiFetch<{ success: boolean; path: string; message: string }>(
          `/api/projects/${projectName}/file`,
          {
            method: 'PUT',
            body: JSON.stringify({ filePath, content }),
          },
        );
        setDirty(filePath, false);
        originalCache.set(filePath, content);
        toast.success('File saved');
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Save failed: ${message}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [projectName, setDirty],
  );

  return { save, saving };
}
