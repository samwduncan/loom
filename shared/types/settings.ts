/**
 * Settings types -- API response interfaces for all settings-related endpoints.
 *
 * Covers: CLI auth status, API keys, credentials, Git config, MCP servers,
 * provider status, and settings tab navigation.
 */

export interface CliAuthStatus {
  authenticated: boolean;
  email: string | null;
  error?: string;
  method?: string;
}

export interface ApiKeyResponse {
  id: number;
  key_name: string;
  api_key: string;
  created_at: string;
  last_used: string | null;
  is_active: 0 | 1;
}

export interface CredentialResponse {
  id: number;
  credential_name: string;
  credential_type: string;
  description: string | null;
  created_at: string;
  is_active: 0 | 1;
}

export interface GitConfigResponse {
  success: boolean;
  gitName: string | null;
  gitEmail: string | null;
}

export interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface McpServer {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'sse';
  scope: 'user' | 'local';
  projectPath?: string;
  config: McpServerConfig;
}

export interface McpConfigReadResponse {
  success: boolean;
  configPath?: string;
  servers: McpServer[];
}

export interface ProviderStatus {
  provider: 'claude' | 'codex' | 'gemini';
  authenticated: boolean;
  email: string | null;
  error?: string;
}

export type SettingsTabId = 'agents' | 'api-keys' | 'appearance' | 'git' | 'mcp';
