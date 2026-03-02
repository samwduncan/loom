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

const COMMON_CURSOR_COMMANDS = [
  'Shell(ls)',
  'Shell(mkdir)',
  'Shell(cd)',
  'Shell(cat)',
  'Shell(echo)',
  'Shell(git status)',
  'Shell(git diff)',
  'Shell(git log)',
  'Shell(npm install)',
  'Shell(npm run)',
  'Shell(python)',
  'Shell(node)',
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
        <div className="bg-orange-50 bg-orange-900/20 border border-orange-200 border-orange-800 rounded-lg p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={skipPermissions}
              onChange={(event) => onSkipPermissionsChange(event.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 bg-gray-700 border-gray-300 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div>
              <div className="font-medium text-orange-900 text-orange-100">
                {"Skip permission prompts (use with caution)"}
              </div>
              <div className="text-sm text-orange-700 text-orange-300">
                {"Equivalent to --dangerously-skip-permissions flag"}
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-500" />
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
          <p className="text-sm font-medium text-gray-700 text-gray-300">
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
            <div key={tool} className="flex items-center justify-between bg-green-50 bg-green-900/20 border border-green-200 border-green-800 rounded-lg p-3">
              <span className="font-mono text-sm text-green-800 text-green-200">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedToolsChange(removeValue(allowedTools, tool))}
                className="text-green-600 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {allowedTools.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-gray-400">
              {"No allowed tools configured"}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
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
            <div key={tool} className="flex items-center justify-between bg-red-50 bg-red-900/20 border border-red-200 border-red-800 rounded-lg p-3">
              <span className="font-mono text-sm text-red-800 text-red-200">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedToolsChange(removeValue(disallowedTools, tool))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {disallowedTools.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-gray-400">
              {"No blocked tools configured"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 bg-blue-900/20 border border-blue-200 border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 text-blue-100 mb-2">
          {"Tool Pattern Examples:"}
        </h4>
        <ul className="text-sm text-blue-800 text-blue-200 space-y-1">
          <li><code className="bg-blue-100 bg-blue-800 px-1 rounded">"Bash(git log:*)"</code> {"- Allow all git log commands"}</li>
          <li><code className="bg-blue-100 bg-blue-800 px-1 rounded">"Bash(git diff:*)"</code> {"- Allow all git diff commands"}</li>
          <li><code className="bg-blue-100 bg-blue-800 px-1 rounded">"Write"</code> {"- Allow all Write tool usage"}</li>
          <li><code className="bg-blue-100 bg-blue-800 px-1 rounded">"Bash(rm:*)"</code> {"- Block all rm commands (dangerous)"}</li>
        </ul>
      </div>
    </div>
  );
}

type CursorPermissionsProps = {
  agent: 'cursor';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedCommands: string[];
  onAllowedCommandsChange: (value: string[]) => void;
  disallowedCommands: string[];
  onDisallowedCommandsChange: (value: string[]) => void;
};

function CursorPermissions({
  skipPermissions,
  onSkipPermissionsChange,
  allowedCommands,
  onAllowedCommandsChange,
  disallowedCommands,
  onDisallowedCommandsChange,
}: Omit<CursorPermissionsProps, 'agent'>) {
  const [newAllowedCommand, setNewAllowedCommand] = useState('');
  const [newDisallowedCommand, setNewDisallowedCommand] = useState('');

  const handleAddAllowedCommand = (command: string) => {
    const updated = addUnique(allowedCommands, command);
    if (updated.length === allowedCommands.length) {
      return;
    }

    onAllowedCommandsChange(updated);
    setNewAllowedCommand('');
  };

  const handleAddDisallowedCommand = (command: string) => {
    const updated = addUnique(disallowedCommands, command);
    if (updated.length === disallowedCommands.length) {
      return;
    }

    onDisallowedCommandsChange(updated);
    setNewDisallowedCommand('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">{"Permission Settings"}</h3>
        </div>
        <div className="bg-orange-50 bg-orange-900/20 border border-orange-200 border-orange-800 rounded-lg p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={skipPermissions}
              onChange={(event) => onSkipPermissionsChange(event.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 bg-gray-700 border-gray-300 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <div>
              <div className="font-medium text-orange-900 text-orange-100">
                {"Skip permission prompts (use with caution)"}
              </div>
              <div className="text-sm text-orange-700 text-orange-300">
                {"Equivalent to -f flag in Cursor CLI"}
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{"Allowed Shell Commands"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Shell commands that are automatically allowed without prompting"}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newAllowedCommand}
            onChange={(event) => setNewAllowedCommand(event.target.value)}
            placeholder={'e.g., "Shell(ls)" or "Shell(git status)"'}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAllowedCommand(newAllowedCommand);
              }
            }}
            className="flex-1 h-10"
          />
          <Button
            onClick={() => handleAddAllowedCommand(newAllowedCommand)}
            disabled={!newAllowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">{"Add"}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 text-gray-300">
            {"Quick add common commands:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CURSOR_COMMANDS.map((command) => (
              <Button
                key={command}
                variant="outline"
                size="sm"
                onClick={() => handleAddAllowedCommand(command)}
                disabled={allowedCommands.includes(command)}
                className="text-xs h-8"
              >
                {command}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allowedCommands.map((command) => (
            <div key={command} className="flex items-center justify-between bg-green-50 bg-green-900/20 border border-green-200 border-green-800 rounded-lg p-3">
              <span className="font-mono text-sm text-green-800 text-green-200">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedCommandsChange(removeValue(allowedCommands, command))}
                className="text-green-600 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {allowedCommands.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-gray-400">
              {"No allowed commands configured"}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-foreground">{"Blocked Shell Commands"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Shell commands that are automatically blocked"}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newDisallowedCommand}
            onChange={(event) => setNewDisallowedCommand(event.target.value)}
            placeholder={'e.g., "Shell(rm -rf)" or "Shell(sudo)"'}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddDisallowedCommand(newDisallowedCommand);
              }
            }}
            className="flex-1 h-10"
          />
          <Button
            onClick={() => handleAddDisallowedCommand(newDisallowedCommand)}
            disabled={!newDisallowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">{"Add"}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {disallowedCommands.map((command) => (
            <div key={command} className="flex items-center justify-between bg-red-50 bg-red-900/20 border border-red-200 border-red-800 rounded-lg p-3">
              <span className="font-mono text-sm text-red-800 text-red-200">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedCommandsChange(removeValue(disallowedCommands, command))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {disallowedCommands.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-gray-400">
              {"No blocked commands configured"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-purple-50 bg-purple-900/20 border border-purple-200 border-purple-800 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 text-purple-100 mb-2">
          {"Shell Command Examples:"}
        </h4>
        <ul className="text-sm text-purple-800 text-purple-200 space-y-1">
          <li><code className="bg-purple-100 bg-purple-800 px-1 rounded">"Shell(ls)"</code> {"- Allow ls command"}</li>
          <li><code className="bg-purple-100 bg-purple-800 px-1 rounded">"Shell(git status)"</code> {"- Allow git status"}</li>
          <li><code className="bg-purple-100 bg-purple-800 px-1 rounded">"Shell(npm install)"</code> {"- Allow npm install"}</li>
          <li><code className="bg-purple-100 bg-purple-800 px-1 rounded">"Shell(rm -rf)"</code> {"- Block recursive delete"}</li>
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
          <Shield className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{"Permission Mode"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{"Controls how Codex handles file modifications and command execution"}</p>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'default'
            ? 'bg-gray-100 bg-gray-800 border-gray-400 border-gray-500'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
            }`}
          onClick={() => onPermissionModeChange('default')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 w-4 h-4 text-green-600"
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
            ? 'bg-green-50 bg-green-900/20 border-green-400 border-green-600'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
            }`}
          onClick={() => onPermissionModeChange('acceptEdits')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'acceptEdits'}
              onChange={() => onPermissionModeChange('acceptEdits')}
              className="mt-1 w-4 h-4 text-green-600"
            />
            <div>
              <div className="font-medium text-green-900 text-green-100">{"Accept Edits"}</div>
              <div className="text-sm text-green-700 text-green-300">
                {"All commands run automatically within the workspace. Full auto mode with sandboxed execution."}
              </div>
            </div>
          </label>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'bypassPermissions'
            ? 'bg-orange-50 bg-orange-900/20 border-orange-400 border-orange-600'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
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
              <div className="font-medium text-orange-900 text-orange-100 flex items-center gap-2">
                {"Bypass Permissions"}
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-sm text-orange-700 text-orange-300">
                {"Full system access with no restrictions. All commands run automatically with full disk and network access. Use with caution."}
              </div>
            </div>
          </label>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {"Technical details"}
          </summary>
          <div className="mt-2 p-3 bg-gray-50 bg-gray-900/50 rounded-lg text-xs text-muted-foreground space-y-2">
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
          <Shield className="w-5 h-5 text-green-500" />
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
            ? 'bg-gray-100 bg-gray-800 border-gray-400 border-gray-500'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
            }`}
          onClick={() => onPermissionModeChange('default')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 w-4 h-4 text-green-600"
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
            ? 'bg-green-50 bg-green-900/20 border-green-400 border-green-600'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
            }`}
          onClick={() => onPermissionModeChange('auto_edit')}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'auto_edit'}
              onChange={() => onPermissionModeChange('auto_edit')}
              className="mt-1 w-4 h-4 text-green-600"
            />
            <div>
              <div className="font-medium text-green-900 text-green-100">{"Auto Edit"}</div>
              <div className="text-sm text-green-700 text-green-300">
                {"All commands run automatically within the workspace."}
              </div>
            </div>
          </label>
        </div>

        {/* YOLO Mode */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'yolo'
            ? 'bg-orange-50 bg-orange-900/20 border-orange-400 border-orange-600'
            : 'bg-gray-50 bg-gray-900/50 border-gray-200 border-gray-700 hover:border-gray-300 hover:border-gray-600'
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
              <div className="font-medium text-orange-900 text-orange-100 flex items-center gap-2">
                {"YOLO Mode"}
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-sm text-orange-700 text-orange-300">
                {"Full system access with no restrictions. Use with caution."}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

type PermissionsContentProps = ClaudePermissionsProps | CursorPermissionsProps | CodexPermissionsProps | GeminiPermissionsProps;

export default function PermissionsContent(props: PermissionsContentProps) {
  if (props.agent === 'claude') {
    return <ClaudePermissions {...props} />;
  }

  if (props.agent === 'cursor') {
    return <CursorPermissions {...props} />;
  }

  if (props.agent === 'gemini') {
    return <GeminiPermissions {...props} />;
  }

  return <CodexPermissions {...props} />;
}
