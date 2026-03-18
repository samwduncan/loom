/**
 * ApiKeysTab -- API key CRUD with masked display, delete confirmation, and credentials section.
 *
 * Two sections separated by Separator:
 * 1. API Keys - list, add form, toggle active, delete with confirmation
 * 2. Credentials - GitHub/GitLab tokens via CredentialsSection
 *
 * SET-07 note: Backend POST /api/settings/api-keys only accepts {keyName} and
 * generates the API key server-side. No provider field in the schema.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useApiKeys } from '@/hooks/useSettingsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { SettingsTabSkeleton } from './SettingsTabSkeleton';
import { CredentialsSection } from './CredentialsSection';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

export function ApiKeysTab() {
  const { data: keys, isLoading, addKey, deleteKey, toggleKey } = useApiKeys();

  const [keyName, setKeyName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const isKeyNameValid = keyName.trim().length > 0 && keyName.trim().length <= 50;

  async function handleAddKey() {
    if (!isKeyNameValid) return;
    setIsAdding(true);
    try {
      await addKey(keyName.trim());
      toast.success('API key added');
      setKeyName('');
    } catch {
      toast.error('Failed to add API key');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteKey(deleteTarget.id);
      toast.success('API key deleted');
    } catch {
      toast.error('Failed to delete key');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleToggle(id: number, checked: boolean) {
    try {
      await toggleKey(id, checked);
    } catch {
      toast.error('Failed to update key status');
    }
  }

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  return (
    <div className="space-y-6 p-1" data-testid="api-keys-tab">
      {/* Section 1: API Keys */}
      <div className="space-y-4">
        <div>
          <h3 className="text-foreground text-base font-medium">API Keys</h3>
          <p className="text-muted-foreground text-sm mt-0.5">Manage API keys for direct provider access</p>
        </div>

        {/* Add Key Form */}
        <div className="flex items-end gap-2" data-testid="add-key-form">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="key-name">Key Name</Label>
            <Input
              id="key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Claude Direct Access"
              maxLength={50}
            />
          </div>
          <Button
            onClick={handleAddKey}
            disabled={!isKeyNameValid || isAdding}
            size="sm"
            data-testid="add-key-button"
          >
            <Plus className="size-4" />
            {isAdding ? 'Adding...' : 'Add Key'}
          </Button>
        </div>

        {/* Key List */}
        {keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No API keys configured.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
                data-testid={`key-row-${key.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">{key.key_name}</span>
                  <code className="text-xs text-muted-foreground font-mono">{key.api_key}</code>
                  <span className="text-xs text-muted-foreground">{formatRelativeDate(key.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={key.is_active === 1}
                    onCheckedChange={(checked) => handleToggle(key.id, checked)}
                    aria-label={`Toggle ${key.key_name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteTarget({ id: key.id, name: key.key_name })}
                    aria-label={`Delete ${key.key_name}`}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Section 2: Credentials */}
      <CredentialsSection />

      {/* AlertDialog rendered as sibling to avoid Radix focus trap conflicts */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API key</AlertDialogTitle>
            <AlertDialogDescription>
              Delete API key "{deleteTarget?.name}"? This cannot be undone.
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
