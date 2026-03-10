/**
 * GitTab -- Git config form with save functionality and restart indicator.
 *
 * Editable name/email fields pre-filled from backend. Save button disabled
 * when values unchanged. Shows "(requires restart)" since git config changes
 * affect CLI processes.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useGitConfig } from '@/hooks/useSettingsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsTabSkeleton } from './SettingsTabSkeleton';

export function GitTab() {
  const { data: config, isLoading, saveGitConfig } = useGitConfig();

  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local state from fetched config
  useEffect(() => {
    if (config) {
      setGitName(config.gitName ?? '');
      setGitEmail(config.gitEmail ?? '');
    }
  }, [config]);

  const hasChanges =
    config !== null &&
    (gitName !== (config.gitName ?? '') || gitEmail !== (config.gitEmail ?? ''));

  async function handleSave() {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await saveGitConfig(gitName, gitEmail);
      toast.success('Git config saved');
    } catch {
      toast.error('Failed to save git config');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  return (
    <div className="space-y-6 p-1" data-testid="git-tab">
      <div>
        <h3 className="text-foreground text-base font-medium">Git Configuration</h3>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure your Git identity for commits made through Loom.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="git-name">Git User Name</Label>
          <Input
            id="git-name"
            value={gitName}
            onChange={(e) => setGitName(e.target.value)}
            placeholder="Your Name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="git-email">Git Email</Label>
          <Input
            id="git-email"
            type="email"
            value={gitEmail}
            onChange={(e) => setGitEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="sm"
          data-testid="git-save-button"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <span className="text-xs text-muted-foreground" data-testid="restart-indicator">
          (requires restart)
        </span>
      </div>
    </div>
  );
}
