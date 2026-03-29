/**
 * DeleteSessionDialog -- confirmation dialog for session deletion.
 *
 * On native (iOS): uses native action sheet via showDestructiveConfirmation().
 * On web: uses Radix AlertDialog.
 *
 * Dynamic title and message based on count (single vs bulk delete).
 *
 * Extracted from SessionList to keep it under the 200-line Constitution limit.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IS_NATIVE } from '@/lib/platform';
import { showDestructiveConfirmation } from '@/lib/native-actions';
import { hapticEvent } from '@/lib/haptics';

interface DeleteSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Number of sessions to delete. Defaults to 1 (singular text). */
  count?: number;
}

export function DeleteSessionDialog({ isOpen, onOpenChange, onConfirm, count = 1 }: DeleteSessionDialogProps) {
  const isPlural = count > 1;

  // Native path: show iOS action sheet instead of Radix dialog
  useEffect(() => {
    if (!isOpen || !IS_NATIVE) return;
    void showDestructiveConfirmation({
      title: isPlural ? `Delete ${count} sessions?` : 'Delete Session',
      message: isPlural
        ? `${count} sessions and their history will be permanently removed.`
        : 'This session and its history will be permanently removed.',
      destructiveText: 'Delete',
      cancelText: 'Cancel',
    }).then((confirmed) => {
      if (confirmed) {
        hapticEvent('deleteConfirm');
        onConfirm();
      } else {
        onOpenChange(false);
      }
    });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally only reacts to isOpen

  // On native, don't render the Radix AlertDialog
  if (IS_NATIVE) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPlural ? `Delete ${count} sessions?` : 'Delete session?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPlural
              ? `This will permanently delete ${count} sessions and all their messages. This cannot be undone.`
              : 'This will permanently delete this session and all its messages. This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
