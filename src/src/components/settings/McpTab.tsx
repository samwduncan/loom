/**
 * McpTab -- MCP server management for Claude and Codex providers.
 *
 * Two sections (Claude, Codex) each with server list, add form, remove confirmation.
 * Uses useMcpServers hook for data fetching and mutations.
 * "(requires restart)" indicator on add/remove operations (SET-19).
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * cn() for classes (3.6), no default export.
 */

import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMcpServers } from '@/hooks/useSettingsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { McpServer } from '@/types/settings';

interface ServerToRemove {
  provider: 'claude' | 'codex';
  name: string;
}

interface AddFormState {
  name: string;
  command: string;
  args: string;
  env: string;
}

const EMPTY_FORM: AddFormState = { name: '', command: '', args: '', env: '' };

function parseEnvPairs(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return env;
}

function parseArgs(text: string): string[] {
  return text
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
}

function ProviderSection({
  provider,
  servers,
  isLoading,
  error,
  addServer,
  refetch,
  onRemoveRequest,
}: {
  provider: 'claude' | 'codex';
  servers: McpServer[];
  isLoading: boolean;
  error: string | null;
  addServer: (data: { name: string; type: 'stdio' | 'http' | 'sse'; config: Record<string, unknown> }) => Promise<void>;
  refetch: () => void;
  onRemoveRequest: (server: ServerToRemove) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);

  const label = provider === 'claude' ? 'Claude' : 'Codex';
  const isFormValid = form.name.trim().length > 0 && form.command.trim().length > 0;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setIsAdding(true);

    const args = parseArgs(form.args);
    const env = parseEnvPairs(form.env);
    const config: Record<string, unknown> = { command: form.command.trim() };
    if (args.length > 0) config['args'] = args;
    if (Object.keys(env).length > 0) config['env'] = env;

    try {
      await addServer({ name: form.name.trim(), type: 'stdio', config });
      toast.success(`MCP server "${form.name.trim()}" added`);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error('Failed to add MCP server');
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-2" data-testid={`mcp-${provider}-error`}>
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch} data-testid={`mcp-${provider}-retry`}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid={`mcp-${provider}-section`}>
      <div className="flex items-center gap-2">
        <h3 className="text-foreground text-base font-medium">{label}</h3>
        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted-foreground">
          {servers.length}
        </span>
      </div>

      {/* Server list */}
      {servers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No MCP servers configured.</p>
      ) : (
        <div className="space-y-2">
          {servers.map((server: McpServer) => (
            <div
              key={server.id}
              className="flex items-start justify-between rounded-md border px-3 py-2"
              data-testid={`mcp-server-${server.id}`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{server.name}</span>
                  <span className="rounded bg-surface-raised px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                    {server.type}
                  </span>
                  <span className="rounded bg-surface-raised px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                    {server.scope}
                  </span>
                </div>
                {server.type === 'stdio' && server.config.command && (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {server.config.command}
                    {server.config.args?.length ? ` ${server.config.args.join(' ')}` : ''}
                  </p>
                )}
                {(server.type === 'http' || server.type === 'sse') && server.config.url && (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {server.config.url}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">(requires restart)</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemoveRequest({ provider, name: server.name })}
                  aria-label={`Remove ${server.name}`}
                  data-testid={`mcp-remove-${server.id}`}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add server form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-3 rounded-md border p-3" data-testid={`mcp-${provider}-add-form`}>
          <div className="space-y-1.5">
            <Label htmlFor={`mcp-${provider}-name`}>Server Name</Label>
            <Input
              id={`mcp-${provider}-name`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. filesystem"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`mcp-${provider}-command`}>Command</Label>
            <Input
              id={`mcp-${provider}-command`}
              value={form.command}
              onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
              placeholder="e.g. npx -y @modelcontextprotocol/server-filesystem"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`mcp-${provider}-args`}>Args (comma-separated)</Label>
            <Input
              id={`mcp-${provider}-args`}
              value={form.args}
              onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))}
              placeholder="e.g. /home/user/docs, /tmp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`mcp-${provider}-env`}>Environment (KEY=VALUE, one per line)</Label>
            <textarea
              id={`mcp-${provider}-env`}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden"
              value={form.env}
              onChange={(e) => setForm((f) => ({ ...f, env: e.target.value }))}
              placeholder={"NODE_ENV=production\nDEBUG=true"}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={!isFormValid || isAdding} data-testid={`mcp-${provider}-add-submit`}>
              <Plus className="size-4" />
              {isAdding ? 'Adding...' : 'Add Server'}
            </Button>
            <span className="text-xs text-muted-foreground">(requires restart)</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          data-testid={`mcp-${provider}-add-button`}
        >
          <Plus className="size-4" />
          Add Server
        </Button>
      )}
    </div>
  );
}

export function McpTab() {
  const [serverToRemove, setServerToRemove] = useState<ServerToRemove | null>(null);
  const claude = useMcpServers('claude');
  const codex = useMcpServers('codex');

  async function handleRemove() {
    if (!serverToRemove) return;
    const hook = serverToRemove.provider === 'claude' ? claude : codex;
    try {
      await hook.removeServer(serverToRemove.name);
      toast.success(`MCP server "${serverToRemove.name}" removed`);
    } catch {
      toast.error('Failed to remove MCP server');
    } finally {
      setServerToRemove(null);
    }
  }

  return (
    <div className="space-y-6 p-1" data-testid="mcp-tab">
      <ProviderSection
        provider="claude"
        servers={claude.data}
        isLoading={claude.isLoading}
        error={claude.error}
        addServer={claude.addServer}
        refetch={claude.refetch}
        onRemoveRequest={setServerToRemove}
      />
      <div className="border-t" />
      <ProviderSection
        provider="codex"
        servers={codex.data}
        isLoading={codex.isLoading}
        error={codex.error}
        addServer={codex.addServer}
        refetch={codex.refetch}
        onRemoveRequest={setServerToRemove}
      />

      {/* AlertDialog as sibling — same pattern as ApiKeysTab for Radix focus trap avoidance */}
      <AlertDialog
        open={serverToRemove !== null}
        onOpenChange={(open) => !open && setServerToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove MCP server</AlertDialogTitle>
            <AlertDialogDescription>
              Remove MCP server &quot;{serverToRemove?.name}&quot;? This will update the configuration file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
