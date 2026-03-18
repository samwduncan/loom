/**
 * CredentialsSection -- GitHub/GitLab credential management with add/delete.
 *
 * Renders existing credentials in a list with delete confirmation,
 * plus an expandable form to add new credentials.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState } from 'react';
import { Trash2, Plus, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useCredentials } from '@/hooks/useSettingsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/utils/cn';
import { SettingsTabSkeleton } from './SettingsTabSkeleton';

export function CredentialsSection() {
  const { data: credentials, isLoading, addCredential, deleteCredential } = useCredentials();

  const [showForm, setShowForm] = useState(false);
  const [credName, setCredName] = useState('');
  const [credType, setCredType] = useState<string>('github_token');
  const [credValue, setCredValue] = useState('');
  const [credDesc, setCredDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const isFormValid = credName.trim().length > 0 && credValue.trim().length >= 5;

  async function handleAdd() {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      await addCredential({
        credential_name: credName.trim(),
        credential_type: credType,
        credential_value: credValue.trim(),
        description: credDesc.trim() || undefined,
      });
      toast.success('Credential added');
      setCredName('');
      setCredValue('');
      setCredDesc('');
      setShowForm(false);
    } catch {
      toast.error('Failed to add credential');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCredential(deleteTarget.id);
      toast.success('Credential deleted');
    } catch {
      toast.error('Failed to delete credential');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (isLoading) return <SettingsTabSkeleton />;

  return (
    <div className="space-y-4" data-testid="credentials-section">
      <h3 className="text-foreground text-base font-medium">Credentials (GitHub / GitLab)</h3>

      {credentials.length === 0 && !showForm && (
        <p className="text-muted-foreground text-sm">No credentials configured.</p>
      )}

      {credentials.length > 0 && (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
              data-testid={`credential-row-${cred.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{cred.credential_name}</span>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  'bg-surface-raised text-muted-foreground',
                )}>
                  {cred.credential_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(cred.created_at).toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteTarget({ id: cred.id, name: cred.credential_name })}
                aria-label={`Delete ${cred.credential_name}`}
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(!showForm)}
        data-testid="toggle-add-credential"
      >
        {showForm ? <ChevronUp className="size-4" /> : <Plus className="size-4" />}
        {showForm ? 'Cancel' : 'Add Credential'}
      </Button>

      {showForm && (
        <div className="space-y-3 rounded-md border p-4" data-testid="add-credential-form">
          <div className="space-y-1.5">
            <Label htmlFor="cred-name">Credential Name</Label>
            <Input
              id="cred-name"
              value={credName}
              onChange={(e) => setCredName(e.target.value)}
              placeholder="e.g. GitHub Personal Token"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-type">Type</Label>
            <Select value={credType} onValueChange={setCredType}>
              <SelectTrigger className="w-full" id="cred-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github_token">GitHub Token</SelectItem>
                <SelectItem value="gitlab_token">GitLab Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-value">Token Value</Label>
            <Input
              id="cred-value"
              type="password"
              value={credValue}
              onChange={(e) => setCredValue(e.target.value)}
              placeholder="Paste token here (min 5 chars)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-desc">Description (optional)</Label>
            <Input
              id="cred-desc"
              value={credDesc}
              onChange={(e) => setCredDesc(e.target.value)}
              placeholder="What this credential is used for"
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={!isFormValid || isSubmitting}
            size="sm"
            data-testid="submit-credential"
          >
            {isSubmitting ? 'Adding...' : 'Add Credential'}
          </Button>
        </div>
      )}

      {/* AlertDialog rendered as sibling to avoid Radix focus trap conflicts */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete credential</AlertDialogTitle>
            <AlertDialogDescription>
              Delete credential "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
