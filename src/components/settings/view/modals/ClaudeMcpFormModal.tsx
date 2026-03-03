import { FolderOpen, Globe, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { DEFAULT_CLAUDE_MCP_FORM } from '../../constants/constants';
import type { ClaudeMcpFormState, McpServer, McpScope, McpTransportType, SettingsProject } from '../../types/types';

type ClaudeMcpFormModalProps = {
  isOpen: boolean;
  editingServer: McpServer | null;
  projects: SettingsProject[];
  onClose: () => void;
  onSubmit: (formData: ClaudeMcpFormState, editingServer: McpServer | null) => Promise<void>;
};

const getSafeTransportType = (value: unknown): McpTransportType => {
  if (value === 'sse' || value === 'http') {
    return value;
  }

  return 'stdio';
};

const getSafeScope = (value: unknown): McpScope => (value === 'local' ? 'local' : 'user');

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : 'Unknown error'
);

const createFormStateFromServer = (server: McpServer): ClaudeMcpFormState => ({
  name: server.name || '',
  type: getSafeTransportType(server.type),
  scope: getSafeScope(server.scope),
  projectPath: server.projectPath || '',
  config: {
    command: server.config?.command || '',
    args: server.config?.args || [],
    env: server.config?.env || {},
    url: server.config?.url || '',
    headers: server.config?.headers || {},
    timeout: server.config?.timeout || 30000,
  },
  importMode: 'form',
  jsonInput: '',
  raw: server.raw,
});

export default function ClaudeMcpFormModal({
  isOpen,
  editingServer,
  projects,
  onClose,
  onSubmit,
}: ClaudeMcpFormModalProps) {
  const [formData, setFormData] = useState<ClaudeMcpFormState>(DEFAULT_CLAUDE_MCP_FORM);
  const [jsonValidationError, setJsonValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingServer);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setJsonValidationError('');
    if (editingServer) {
      setFormData(createFormStateFromServer(editingServer));
      return;
    }

    setFormData(DEFAULT_CLAUDE_MCP_FORM);
  }, [editingServer, isOpen]);

  const canSubmit = useMemo(() => {
    if (!formData.name.trim()) {
      return false;
    }

    if (formData.importMode === 'json') {
      return Boolean(formData.jsonInput.trim()) && !jsonValidationError;
    }

    if (formData.scope === 'local' && !formData.projectPath.trim()) {
      return false;
    }

    if (formData.type === 'stdio') {
      return Boolean(formData.config.command.trim());
    }

    return Boolean(formData.config.url.trim());
  }, [formData, jsonValidationError]);

  if (!isOpen) {
    return null;
  }

  const updateConfig = <K extends keyof ClaudeMcpFormState['config']>(
    key: K,
    value: ClaudeMcpFormState['config'][K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const handleJsonValidation = (value: string) => {
    if (!value.trim()) {
      setJsonValidationError('');
      return;
    }

    try {
      const parsed = JSON.parse(value) as { type?: string; command?: string; url?: string };
      if (!parsed.type) {
        setJsonValidationError('Missing required field: type');
      } else if (parsed.type === 'stdio' && !parsed.command) {
        setJsonValidationError('stdio type requires a command field');
      } else if ((parsed.type === 'http' || parsed.type === 'sse') && !parsed.url) {
        setJsonValidationError(`${parsed.type} type requires a url field`);
      } else {
        setJsonValidationError('');
      }
    } catch {
      setJsonValidationError('Invalid JSON format');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData, editingServer);
    } catch (error) {
      alert(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            {isEditing ? "Edit MCP Server" : "Add MCP Server"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isEditing && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, importMode: 'form' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.importMode === 'form'
                    ? 'bg-primary text-white'
                    : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
                }`}
              >
                {"Form Input"}
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, importMode: 'json' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.importMode === 'json'
                    ? 'bg-primary text-white'
                    : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
                }`}
              >
                {"JSON Import"}
              </button>
            </div>
          )}

          {formData.importMode === 'form' && isEditing && (
            <div className="bg-surface-raised border border-border/10 rounded-lg p-3">
              <label className="block text-sm font-medium text-foreground mb-2">
                {"Scope"}
              </label>
              <div className="flex items-center gap-2">
                {formData.scope === 'user' ? <Globe className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                <span className="text-sm">
                  {formData.scope === 'user' ? "User (Global)" : "Project (Local)"}
                </span>
                {formData.scope === 'local' && formData.projectPath && (
                  <span className="text-xs text-muted-foreground">- {formData.projectPath}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{"Scope cannot be changed when editing an existing server"}</p>
            </div>
          )}

          {formData.importMode === 'form' && !isEditing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {"Scope"} *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, scope: 'user', projectPath: '' }))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.scope === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{"User (Global)"}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, scope: 'local' }))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.scope === 'local'
                        ? 'bg-primary text-white'
                        : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>{"Project (Local)"}</span>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.scope === 'user'
                    ? "User scope: Available across all projects on your machine"
                    : "Local scope: Only available in the selected project"}
                </p>
              </div>

              {formData.scope === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {"Select a project..."} *
                  </label>
                  <select
                    value={formData.projectPath}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, projectPath: event.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-border/10 bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="">{"Select a project..."}...</option>
                    {projects.map((project) => (
                      <option key={project.name} value={project.path || project.fullPath}>
                        {project.displayName || project.name}
                      </option>
                    ))}
                  </select>
                  {formData.projectPath && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {`Path: ${formData.projectPath}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={formData.importMode === 'json' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-foreground mb-2">
                {"Server Name"} *
              </label>
              <Input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="my-server"
                required
              />
            </div>

            {formData.importMode === 'form' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {"Transport Type"} *
                </label>
                <select
                  value={formData.type}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      type: getSafeTransportType(event.target.value),
                    }));
                  }}
                  className="w-full px-3 py-2 border border-border/10 bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="stdio">stdio</option>
                  <option value="sse">SSE</option>
                  <option value="http">HTTP</option>
                </select>
              </div>
            )}
          </div>

          {isEditing && Boolean(formData.raw) && formData.importMode === 'form' && (
            <div className="bg-surface-raised border border-border/10 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {`Configuration Details (from ${editingServer?.scope === 'global' ? '~/.claude.json' : 'project config'})`}
              </h4>
              <pre className="text-xs bg-surface-elevated p-3 rounded overflow-x-auto">
                {JSON.stringify(formData.raw, null, 2)}
              </pre>
            </div>
          )}

          {formData.importMode === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {"JSON Configuration"} *
                </label>
                <textarea
                  value={formData.jsonInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData((prev) => ({ ...prev, jsonInput: value }));
                    handleJsonValidation(value);
                  }}
                  className={`w-full px-3 py-2 border ${
                    jsonValidationError ? 'border-status-error' : 'border-border/10'
                  } bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary font-mono text-sm`}
                  rows={8}
                  placeholder={'{\n  "type": "stdio",\n  "command": "/path/to/server",\n  "args": ["--api-key", "abc123"],\n  "env": {\n    "CACHE_DIR": "/tmp"\n  }\n}'}
                  required
                />
                {jsonValidationError && (
                  <p className="text-xs text-status-error mt-1">{jsonValidationError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {"Paste your MCP server configuration in JSON format. Example formats:"}
                  <br />
                  - stdio: {`{"type":"stdio","command":"npx","args":["@upstash/context7-mcp"]}`}
                  <br />
                  - http/sse: {`{"type":"http","url":"https://api.example.com/mcp"}`}
                </p>
              </div>
            </div>
          )}

          {formData.importMode === 'form' && formData.type === 'stdio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {"Command"} *
                </label>
                <Input
                  value={formData.config.command}
                  onChange={(event) => updateConfig('command', event.target.value)}
                  placeholder="/path/to/mcp-server"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {"Arguments (one per line)"}
                </label>
                <textarea
                  value={formData.config.args.join('\n')}
                  onChange={(event) => {
                    const args = event.target.value.split('\n').filter((arg) => arg.trim());
                    updateConfig('args', args);
                  }}
                  className="w-full px-3 py-2 border border-border/10 bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="--api-key&#10;abc123"
                />
              </div>
            </div>
          )}

          {formData.importMode === 'form' && (formData.type === 'sse' || formData.type === 'http') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {"URL"} *
              </label>
              <Input
                value={formData.config.url}
                onChange={(event) => updateConfig('url', event.target.value)}
                placeholder="https://api.example.com/mcp"
                type="url"
                required
              />
            </div>
          )}

          {formData.importMode === 'form' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {"Environment Variables (KEY=value, one per line)"}
              </label>
              <textarea
                value={Object.entries(formData.config.env).map(([key, value]) => `${key}=${value}`).join('\n')}
                onChange={(event) => {
                  const env: Record<string, string> = {};
                  event.target.value.split('\n').forEach((line) => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && key.trim()) {
                      env[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  updateConfig('env', env);
                }}
                className="w-full px-3 py-2 border border-border/10 bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="API_KEY=your-key&#10;DEBUG=true"
              />
            </div>
          )}

          {formData.importMode === 'form' && (formData.type === 'sse' || formData.type === 'http') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {"Headers (KEY=value, one per line)"}
              </label>
              <textarea
                value={Object.entries(formData.config.headers).map(([key, value]) => `${key}=${value}`).join('\n')}
                onChange={(event) => {
                  const headers: Record<string, string> = {};
                  event.target.value.split('\n').forEach((line) => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && key.trim()) {
                      headers[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  updateConfig('headers', headers);
                }}
                className="w-full px-3 py-2 border border-border/10 bg-surface-raised text-foreground rounded-lg focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="Authorization=Bearer token&#10;X-API-Key=your-key"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {"Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Server"
                : "Add Server"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
