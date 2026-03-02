import { Eye, EyeOff, Github, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../../ui/button';
import { Input } from '../../../../../ui/input';
import type { GithubCredentialItem } from '../types';

type GithubCredentialsSectionProps = {
  githubCredentials: GithubCredentialItem[];
  showNewGithubForm: boolean;
  showNewTokenPlainText: boolean;
  newGithubName: string;
  newGithubToken: string;
  newGithubDescription: string;
  onShowNewGithubFormChange: (value: boolean) => void;
  onNewGithubNameChange: (value: string) => void;
  onNewGithubTokenChange: (value: string) => void;
  onNewGithubDescriptionChange: (value: string) => void;
  onToggleNewTokenVisibility: () => void;
  onCreateGithubCredential: () => void;
  onCancelCreateGithubCredential: () => void;
  onToggleGithubCredential: (credentialId: string, isActive: boolean) => void;
  onDeleteGithubCredential: (credentialId: string) => void;
};

export default function GithubCredentialsSection({
  githubCredentials,
  showNewGithubForm,
  showNewTokenPlainText,
  newGithubName,
  newGithubToken,
  newGithubDescription,
  onShowNewGithubFormChange,
  onNewGithubNameChange,
  onNewGithubTokenChange,
  onNewGithubDescriptionChange,
  onToggleNewTokenVisibility,
  onCreateGithubCredential,
  onCancelCreateGithubCredential,
  onToggleGithubCredential,
  onDeleteGithubCredential,
}: GithubCredentialsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{"GitHub Tokens"}</h3>
        </div>
        <Button size="sm" onClick={() => onShowNewGithubFormChange(!showNewGithubForm)}>
          <Plus className="h-4 w-4 mr-1" />
          {"Add Token"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{"Add GitHub Personal Access Tokens to clone private repositories. You can also pass tokens directly in API requests without storing them."}</p>

      {showNewGithubForm && (
        <div className="mb-4 p-4 border rounded-lg bg-card space-y-3">
          <Input
            placeholder={"Token Name (e.g., Personal Repos)"}
            value={newGithubName}
            onChange={(event) => onNewGithubNameChange(event.target.value)}
          />

          <div className="relative">
            <Input
              type={showNewTokenPlainText ? 'text' : 'password'}
              placeholder={"GitHub Personal Access Token (ghp_...)"}
              value={newGithubToken}
              onChange={(event) => onNewGithubTokenChange(event.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={onToggleNewTokenVisibility}
              aria-label={showNewTokenPlainText ? 'Hide token' : 'Show token'}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showNewTokenPlainText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            placeholder={"Description (optional)"}
            value={newGithubDescription}
            onChange={(event) => onNewGithubDescriptionChange(event.target.value)}
          />

          <div className="flex gap-2">
            <Button onClick={onCreateGithubCredential}>{"Add Token"}</Button>
            <Button variant="outline" onClick={onCancelCreateGithubCredential}>
              {"Cancel"}
            </Button>
          </div>

          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline block"
          >
            {"How to create a GitHub Personal Access Token \u2192"}
          </a>
        </div>
      )}

      <div className="space-y-2">
        {githubCredentials.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{"No GitHub tokens added yet."}</p>
        ) : (
          githubCredentials.map((credential) => (
            <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{credential.credential_name}</div>
                {credential.description && (
                  <div className="text-xs text-muted-foreground">{credential.description}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {"Added:"} {new Date(credential.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={credential.is_active ? 'outline' : 'secondary'}
                  onClick={() => onToggleGithubCredential(credential.id, credential.is_active)}
                >
                  {credential.is_active ? "Active" : "Inactive"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDeleteGithubCredential(credential.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
