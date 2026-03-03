import { useState } from 'react';
import { AlertTriangle, Plus, Shield, X } from 'lucide-react';
import { Button } from '../../../../../../ui/button';
import { Input } from '../../../../../../ui/input';
import type { CodexPermissionMode, GeminiPermissionMode } from '../../../../../types/types';

const COMMON_CLAUDE_TOOLS = [
  'Bash(git log:*)',
  'Bash(git diff:*)',
  'Bash(git status:*)',
  'Write',
  'Read',
  'Edit',
  'Glob',
  'Grep',
  'MultiEdit',
  'Task',
  'TodoWrite',
  'TodoRead',
  'WebFetch',
  'WebSearch',
];

const addUnique = (items: string[], value: string): string[] => {
  const normalizedValue = value.trim();
  if (!normalizedValue || items.includes(normalizedValue)) {
    return items;
  }

  return [...items, normalizedValue];
};

const removeValue = (items: string[], value: string): string[] => (
  items.filter((item) => item !== value)
);

type ClaudePermissionsProps = {
  agent: 'claude';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedTools: string[];
  onAllowedToolsChange: (value: string[]) => void;
  disallowedTools: string[];
  onDisallowedToolsChange: (value: string[]) => void;
};

function ClaudePermissions({
  skipPermissions,
  onSkipPermissionsChange,
  allowedTools,
  onAllowedToolsChange,
  disallowedTools,
  onDisallowedToolsChange,
}: Omit<ClaudePermissionsProps, 'agent'>) {
  const [newAllowedTool, setNewAllowedTool] = useState('');
  const [newDisallowedTool, setNewDisallowedTool] = useState('');

  const handleAddAllowedTool = (tool: string) => {
    const updated = addUnique(allowedTools, tool);
    if (updated.length === allowedTools.length) {
      return;
    }

    onAllowedToolsChange(updated);
    setNewAllowedTool('');
  };

  const handleAddDisallowedTool = (tool: string) => {
    const updated = addUnique(disallowedTools, tool);
    if (updated.length === disallowedTools.length) {
      return;
    }

    onDisallowedToolsChange(updated);
    setNewDisallowedTool('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">{"Permission Settings"}</h3>
        </div>
        <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={skipPermissions}
              onChange={(event) => onSkipPermissionsChange(event.target.checked)}
              className="w-4 h-4 text-primary bg-surface-raised border-border/10 rounded focus:ring-primary focus:ring-2"
            />
            <div>
              <div className="font-medium text-orange-100">
                {"Skip permission prompts (use with caution)"}
              </div>
              <div className="text-sm text-orange-300">
                {"Equivalent to --dangerously-skip-permissions flag"}
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-status-connected" />
          <h3 className="text-lg font-medium text-foreground">{"Allowed Tools"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Tools that are automatically allowed without prompting for permission"}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newAllowedTool}
            onChange={(event) => setNewAllowedTool(event.target.value)}
            placeholder={'e.g., "Bash(git log:*)" or "Write"'}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAllowedTool(newAllowedTool);
              }
            }}
            className="flex-1 h-10"
          />
          <Button
            onClick={() => handleAddAllowedTool(newAllowedTool)}
            disabled={!newAllowedTool.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">{"Add"}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {"Quick add common tools:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CLAUDE_TOOLS.map((tool) => (
              <Button
                key={tool}
                variant="outline"
                size="sm"
                onClick={() => handleAddAllowedTool(tool)}
                disabled={allowedTools.includes(tool)}
                className="text-xs h-8"
              >
                {tool}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allowedTools.map((tool) => (
            <div key={tool} className="flex items-center justify-between bg-status-connected/10 border border-status-connected/30 rounded-lg p-3">
              <span className="font-mono text-sm text-status-connected">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedToolsChange(removeValue(allowedTools, tool))}
                className="text-status-connected hover:text-status-connected"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {allowedTools.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              {"No allowed tools configured"}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-status-error" />
          <h3 className="text-lg font-medium text-foreground">{"Blocked Tools"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Tools that are automatically blocked without prompting for permission"}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newDisallowedTool}
            onChange={(event) => setNewDisallowedTool(event.target.value)}
            placeholder={'e.g., "Bash(rm:*)"'}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddDisallowedTool(newDisallowedTool);
              }
            }}
            className="flex-1 h-10"
          />
          <Button
            onClick={() => handleAddDisallowedTool(newDisallowedTool)}
            disabled={!newDisallowedTool.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">{"Add"}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {disallowedTools.map((tool) => (
            <div key={tool} className="flex items-center justify-between bg-status-error/10 border border-status-error/30 rounded-lg p-3">
              <span className="font-mono text-sm text-status-error">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedToolsChange(removeValue(disallowedTools, tool))}
                className="text-status-error hover:text-status-error"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {disallowedTools.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              {"No blocked tools configured"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-status-info/10 border border-status-info/30 rounded-lg p-4">
        <h4 className="font-medium text-status-info mb-2">
          {"Tool Pattern Examples:"}
        </h4>
        <ul className="text-sm text-status-info space-y-1">
          <li><code className="bg-status-info/20 px-1 rounded">"Bash(git log:*)"</code> {"- Allow all git log commands"}</li>
          <li><code className="bg-status-info/20 px-1 rounded">"Bash(git diff:*)"</code> {"- Allow all git diff commands"}</li>
          <li><code className="bg-status-info/20 px-1 rounded">"Write"</code> {"- Allow all Write tool usage"}</li>
          <li><code className="bg-status-info/20 px-1 rounded">"Bash(rm:*)"</code> {"- Block all rm commands (dangerous)"}</li>
        </ul>
      </div>
    </div>
  );
}

type CodexPermissionsProps = {
  agent: 'codex';
  permissionMode: CodexPermissionMode;
  onPermissionModeChange: (value: CodexPermissionMode) => void;
};

function CodexPermissions({ permissionMode, onPermissionModeChange }: Omit<CodexPermissionsProps, 'agent'>) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-status-connected" />
          <h3 className="text-lg font-medium text-foreground">{"Permission Mode"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Controls how Codex handles file modifications and command execution"}</p>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'default'
            ? 'bg-surface-elevated border-border/20'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('default')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 w-4 h-4 text-status-connected"
            />
            <div>
              <div className="font-medium text-foreground">{"Default"}</div>
              <div className="text-sm text-muted-foreground">
                {"Only trusted commands (ls, cat, grep, git status, etc.) run automatically. Other commands are skipped. Can write to workspace."}
              </div>
            </div>
          </label>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'acceptEdits'
            ? 'bg-status-connected/10 border-status-connected/40'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('acceptEdits')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'acceptEdits'}
              onChange={() => onPermissionModeChange('acceptEdits')}
              className="mt-1 w-4 h-4 text-status-connected"
            />
            <div>
              <div className="font-medium text-status-connected">{"Accept Edits"}</div>
              <div className="text-sm text-status-connected/70">
                {"All commands run automatically within the workspace. Full auto mode with sandboxed execution."}
              </div>
            </div>
          </label>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'bypassPermissions'
            ? 'bg-orange-900/20 border-orange-600'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('bypassPermissions')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'bypassPermissions'}
              onChange={() => onPermissionModeChange('bypassPermissions')}
              className="mt-1 w-4 h-4 text-orange-600"
            />
            <div>
              <div className="font-medium text-orange-100 flex items-center gap-2">
                {"Bypass Permissions"}
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-sm text-orange-300">
                {"Full system access with no restrictions. All commands run automatically with full disk and network access. Use with caution."}
              </div>
            </div>
          </label>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {"Technical details"}
          </summary>
          <div className="mt-2 p-3 bg-surface-raised rounded-lg text-xs text-muted-foreground space-y-2">
            <p><strong>{"Default"}:</strong> {"sandboxMode=workspace-write, approvalPolicy=untrusted. Trusted commands: cat, cd, grep, head, ls, pwd, tail, git status/log/diff/show, find (without -exec), etc."}</p>
            <p><strong>{"Accept Edits"}:</strong> {"sandboxMode=workspace-write, approvalPolicy=never. All commands auto-execute within project directory."}</p>
            <p><strong>{"Bypass Permissions"}:</strong> {"sandboxMode=danger-full-access, approvalPolicy=never. Full system access, use only in trusted environments."}</p>
            <p className="text-xs opacity-75">{"You can override this per-session using the mode button in the chat interface."}</p>
          </div>
        </details>
      </div>
    </div>
  );
}

type GeminiPermissionsProps = {
  agent: 'gemini';
  permissionMode: GeminiPermissionMode;
  onPermissionModeChange: (value: GeminiPermissionMode) => void;
};

function GeminiPermissions({ permissionMode, onPermissionModeChange }: Omit<GeminiPermissionsProps, 'agent'>) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-status-connected" />
          <h3 className="text-lg font-medium text-foreground">
            {"Permission Mode"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {"Controls how Gemini handles file modifications and command execution"}
        </p>

        {/* Default Mode */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'default'
            ? 'bg-surface-elevated border-border/20'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('default')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 w-4 h-4 text-status-connected"
            />
            <div>
              <div className="font-medium text-foreground">{"Default"}</div>
              <div className="text-sm text-muted-foreground">
                {"Only trusted commands run automatically. Other commands require approval."}
              </div>
            </div>
          </label>
        </div>

        {/* Auto Edit Mode */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'auto_edit'
            ? 'bg-status-connected/10 border-status-connected/40'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('auto_edit')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'auto_edit'}
              onChange={() => onPermissionModeChange('auto_edit')}
              className="mt-1 w-4 h-4 text-status-connected"
            />
            <div>
              <div className="font-medium text-status-connected">{"Auto Edit"}</div>
              <div className="text-sm text-status-connected/70">
                {"All commands run automatically within the workspace."}
              </div>
            </div>
          </label>
        </div>

        {/* YOLO Mode */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'yolo'
            ? 'bg-orange-900/20 border-orange-600'
            : 'bg-surface-raised border-border/10 hover:border-border/20'
            }`}
          onClick={() => onPermissionModeChange('yolo')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'yolo'}
              onChange={() => onPermissionModeChange('yolo')}
              className="mt-1 w-4 h-4 text-orange-600"
            />
            <div>
              <div className="font-medium text-orange-100 flex items-center gap-2">
                {"YOLO Mode"}
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-sm text-orange-300">
                {"Full system access with no restrictions. Use with caution."}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

type PermissionsContentProps = ClaudePermissionsProps | CodexPermissionsProps | GeminiPermissionsProps;

export default function PermissionsContent(props: PermissionsContentProps) {
  if (props.agent === 'claude') {
    return <ClaudePermissions {...props} />;
  }

  if (props.agent === 'gemini') {
    return <GeminiPermissions {...props} />;
  }

  return <CodexPermissions {...props} />;
}
