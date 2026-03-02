import { Check, GitBranch } from 'lucide-react';
import { useGitSettings } from '../../../hooks/useGitSettings';
import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';

export default function GitSettingsTab() {
  const {
    gitName,
    setGitName,
    gitEmail,
    setGitEmail,
    isLoading,
    isSaving,
    saveStatus,
    saveGitConfig,
  } = useGitSettings();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{"Git Configuration"}</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{"Configure your git identity for commits. These settings will be applied globally via git config --global"}</p>

        <div className="p-4 border rounded-lg bg-card space-y-3">
          <div>
            <label htmlFor="settings-git-name" className="block text-sm font-medium text-foreground mb-2">
              {"Git Name"}
            </label>
            <Input
              id="settings-git-name"
              type="text"
              value={gitName}
              onChange={(event) => setGitName(event.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
              className="w-full"
            />
            <p className="mt-1 text-xs text-muted-foreground">{"Your name for git commits"}</p>
          </div>

          <div>
            <label htmlFor="settings-git-email" className="block text-sm font-medium text-foreground mb-2">
              {"Git Email"}
            </label>
            <Input
              id="settings-git-email"
              type="email"
              value={gitEmail}
              onChange={(event) => setGitEmail(event.target.value)}
              placeholder="john@example.com"
              disabled={isLoading}
              className="w-full"
            />
            <p className="mt-1 text-xs text-muted-foreground">{"Your email for git commits"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={saveGitConfig}
              disabled={isSaving || !gitName.trim() || !gitEmail.trim()}
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>

            {saveStatus === 'success' && (
              <div className="text-sm text-green-600 text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {"Saved successfully"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
