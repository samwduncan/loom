import { Edit3, Globe, Plus, Server, Terminal, Trash2, Zap } from 'lucide-react';
import { Badge } from '../../../../../../ui/badge';
import { Button } from '../../../../../../ui/button';
import type { McpServer, McpToolsResult, McpTestResult } from '../../../../../types/types';

const getTransportIcon = (type: string | undefined) => {
  if (type === 'stdio') {
    return <Terminal className="w-4 h-4" />;
  }

  if (type === 'sse') {
    return <Zap className="w-4 h-4" />;
  }

  if (type === 'http') {
    return <Globe className="w-4 h-4" />;
  }

  return <Server className="w-4 h-4" />;
};

const maskSecret = (value: unknown): string => {
  const normalizedValue = String(value ?? '');
  if (normalizedValue.length <= 4) {
    return '****';
  }

  return `${normalizedValue.slice(0, 2)}****${normalizedValue.slice(-2)}`;
};

type ClaudeMcpServersProps = {
  agent: 'claude';
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (serverId: string, scope?: string) => void;
  onTest: (serverId: string, scope?: string) => void;
  onDiscoverTools: (serverId: string, scope?: string) => void;
  testResults: Record<string, McpTestResult>;
  serverTools: Record<string, McpToolsResult>;
  toolsLoading: Record<string, boolean>;
  deleteError?: string | null;
};

function ClaudeMcpServers({
  servers,
  onAdd,
  onEdit,
  onDelete,
  testResults,
  serverTools,
  deleteError,
}: Omit<ClaudeMcpServersProps, 'agent' | 'onTest' | 'onDiscoverTools' | 'toolsLoading'>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-medium text-foreground">{"MCP Servers"}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{"Model Context Protocol servers provide additional tools and data sources to Claude"}</p>

      <div className="flex justify-between items-center">
        <Button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {"Add MCP Server"}
        </Button>
      </div>
      {deleteError && (
        <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {deleteError}
        </div>
      )}

      <div className="space-y-2">
        {servers.map((server) => {
          const serverId = server.id || server.name;
          const testResult = testResults[serverId];
          const toolsResult = serverTools[serverId];

          return (
            <div key={serverId} className="bg-surface-raised border border-border/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTransportIcon(server.type)}
                    <span className="font-medium text-foreground">{server.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {server.type || 'stdio'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {server.scope === 'local'
                        ? "local"
                        : server.scope === 'user'
                        ? "user"
                        : server.scope}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {server.type === 'stdio' && server.config?.command && (
                      <div>
                        {"Command"}:{' '}
                        <code className="bg-surface-elevated px-1 rounded text-xs">{server.config.command}</code>
                      </div>
                    )}
                    {(server.type === 'sse' || server.type === 'http') && server.config?.url && (
                      <div>
                        {"URL"}:{' '}
                        <code className="bg-surface-elevated px-1 rounded text-xs">{server.config.url}</code>
                      </div>
                    )}
                    {server.config?.args && server.config.args.length > 0 && (
                      <div>
                        {"Args"}:{' '}
                        <code className="bg-surface-elevated px-1 rounded text-xs">{server.config.args.join(' ')}</code>
                      </div>
                    )}
                  </div>

                  {testResult && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      testResult.success
                        ? 'bg-status-connected/10 text-status-connected'
                        : 'bg-status-error/10 text-status-error'
                    }`}
                    >
                      <div className="font-medium">{testResult.message}</div>
                    </div>
                  )}

                  {toolsResult && toolsResult.tools && toolsResult.tools.length > 0 && (
                    <div className="mt-2 p-2 rounded text-xs bg-status-info/10 text-status-info">
                      <div className="font-medium">
                        {"Tools"} {`(${toolsResult.tools.length}):`}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {toolsResult.tools.slice(0, 5).map((tool, index) => (
                          <code key={`${tool.name}-${index}`} className="bg-status-info/20 px-1 rounded">
                            {tool.name}
                          </code>
                        ))}
                        {toolsResult.tools.length > 5 && (
                          <span className="text-xs opacity-75">
                            {`+${toolsResult.tools.length - 5} more`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => onEdit(server)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    title="Edit server"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(serverId, server.scope)}
                    variant="ghost"
                    size="sm"
                    className="text-status-error hover:text-status-error"
                    title="Delete server"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {servers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">{"No MCP servers configured"}</div>
        )}
      </div>
    </div>
  );
}

type CodexMcpServersProps = {
  agent: 'codex';
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (serverId: string) => void;
  deleteError?: string | null;
};

function CodexMcpServers({ servers, onAdd, onEdit, onDelete, deleteError }: Omit<CodexMcpServersProps, 'agent'>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground">{"MCP Servers"}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{"Model Context Protocol servers provide additional tools and data sources to Codex"}</p>

      <div className="flex justify-between items-center">
        <Button onClick={onAdd} className="bg-surface-elevated hover:bg-muted text-white" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {"Add MCP Server"}
        </Button>
      </div>
      {deleteError && (
        <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {deleteError}
        </div>
      )}

      <div className="space-y-2">
        {servers.map((server) => (
          <div key={server.name} className="bg-surface-raised border border-border/10 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium text-foreground">{server.name}</span>
                  <Badge variant="outline" className="text-xs">stdio</Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  {server.config?.command && (
                    <div>
                      {"Command"}:{' '}
                      <code className="bg-surface-elevated px-1 rounded text-xs">{server.config.command}</code>
                    </div>
                  )}
                  {server.config?.args && server.config.args.length > 0 && (
                    <div>
                      {"Args"}:{' '}
                      <code className="bg-surface-elevated px-1 rounded text-xs">{server.config.args.join(' ')}</code>
                    </div>
                  )}
                  {server.config?.env && Object.keys(server.config.env).length > 0 && (
                    <div>
                      {"Environment"}:{' '}
                      <code className="bg-surface-elevated px-1 rounded text-xs">
                        {Object.entries(server.config.env).map(([key, value]) => `${key}=${maskSecret(value)}`).join(', ')}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onEdit(server)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit server"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(server.name)}
                  variant="ghost"
                  size="sm"
                  className="text-status-error hover:text-status-error"
                  title="Delete server"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">{"No MCP servers configured"}</div>
        )}
      </div>

      <div className="bg-surface-raised border border-border/10 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">{"About Codex MCP"}</h4>
        <p className="text-sm text-muted-foreground">{"Codex supports stdio-based MCP servers. You can add servers that extend Codex's capabilities with additional tools and resources."}</p>
      </div>
    </div>
  );
}

type McpServersContentProps = ClaudeMcpServersProps | CodexMcpServersProps;

export default function McpServersContent(props: McpServersContentProps) {
  if (props.agent === 'claude') {
    return <ClaudeMcpServers {...props} />;
  }

  return <CodexMcpServers {...props} />;
}
