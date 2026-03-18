/**
 * DeleteSessionDialog -- confirmation dialog for session deletion.
 *
 * Extracted from SessionList to keep it under the 200-line Constitution limit.
 *
 * Constitution: Named export (2.2), no default export.
 */

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

interface DeleteSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Number of sessions to delete. Defaults to 1 (singular text). */
  count?: number;
}

export function DeleteSessionDialog({ isOpen, onOpenChange, onConfirm, count = 1 }: DeleteSessionDialogProps) {
  const isPlural = count > 1;
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
