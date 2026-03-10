# CloudCLI Backend API Contract

> **Audit date:** 2026-03-04
> **Source:** `/home/swd/loom/server/` (commit `5e0845e` on `main`)
> **Server framework:** Express 4 + WebSocket (`ws`) on a single `http.Server`
> **Database:** better-sqlite3 (`server/database/auth.db`)
> **Port:** `process.env.PORT` (default `5555` from `.env`, fallback `3001` in code)

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [REST Endpoints](#2-rest-endpoints)
3. [WebSocket Protocol](#3-websocket-protocol)
4. [Database Schema](#4-database-schema)
5. [Data Models (TypeScript Interfaces)](#5-data-models-typescript-interfaces)
6. [Environment Variables](#6-environment-variables)
7. [Transport Summary](#7-transport-summary)

---

## 1. Authentication & Authorization

**Source:** `server/middleware/auth.js`, `server/constants/config.js`

### Two operating modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **OSS (self-hosted)** | `VITE_IS_PLATFORM !== 'true'` | JWT + optional API_KEY |
| **Platform (hosted)** | `VITE_IS_PLATFORM === 'true'` | Bypass JWT, use first DB user |

### JWT Authentication (`authenticateToken` middleware)

```typescript
// Token payload (never expires)
interface JWTPayload {
  userId: number;
  username: string;
}
```

- **Header:** `Authorization: Bearer <token>`
- **Fallback:** Query param `?token=<token>` (for SSE/EventSource)
- **Secret:** `process.env.JWT_SECRET || 'claude-ui-dev-secret-change-in-production'`
- **Expiry:** None (tokens never expire)

### Optional API Key Gate (`validateApiKey` middleware)

Applied to all `/api/*` routes before any other middleware.

- **Header:** `X-Api-Key: <key>`
- **Behavior:** If `process.env.API_KEY` is set, all API requests must include it. If not set, this middleware is a no-op.

### External Agent API Key (`validateExternalApiKey` in `routes/agent.js`)

Used exclusively by `/api/agent` routes.

- **Header:** `X-Api-Key: <ck_...>` or query param `?apiKey=<ck_...>`
- **Validation:** Checked against `api_keys` table via `apiKeysDb.validateApiKey()`
- **Platform mode:** Bypasses validation, uses first DB user

### WebSocket Authentication

```typescript
// server/index.js line 282-317
// Token from: ?token=<jwt> query param OR Authorization header
// Platform mode: auto-authenticates as first user
```

---

## 2. REST Endpoints

### Legend

- **Auth:** `JWT` = `authenticateToken`, `API_KEY` = `validateExternalApiKey`, `PUBLIC` = no auth
- All protected routes under `/api/*` also pass through the optional `validateApiKey` gate

---

### 2.1 Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | PUBLIC | Server health check |

**Response:**
```typescript
interface HealthResponse {
  status: 'ok';
  timestamp: string; // ISO 8601
  installMode: 'git' | 'npm';
}
```

---

### 2.2 Auth Routes (`/api/auth`)

**Source:** `server/routes/auth.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/status` | PUBLIC | Check if setup is needed |
| `POST` | `/api/auth/register` | PUBLIC | Create first user (setup) |
| `POST` | `/api/auth/login` | PUBLIC | Login with username/password |
| `GET` | `/api/auth/user` | JWT | Get current user |
| `POST` | `/api/auth/logout` | JWT | Logout (client-side) |

**`GET /api/auth/status` Response:**
```typescript
interface AuthStatusResponse {
  needsSetup: boolean;
  isAuthenticated: false; // Always false server-side
}
```

**`POST /api/auth/register` Request/Response:**
```typescript
interface RegisterRequest {
  username: string; // min 3 chars
  password: string; // min 6 chars
}
interface RegisterResponse {
  success: true;
  user: { id: number; username: string };
  token: string; // JWT
}
```

**`POST /api/auth/login` Request/Response:**
```typescript
interface LoginRequest {
  username: string;
  password: string;
}
interface LoginResponse {
  success: true;
  user: { id: number; username: string };
  token: string; // JWT
}
```

**`GET /api/auth/user` Response:**
```typescript
interface UserResponse {
  user: {
    id: number;
    username: string;
    created_at: string;
    last_login: string;
  };
}
```

---

### 2.3 Projects Routes

**Source:** `server/index.js` (inline routes) + `server/routes/projects.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/projects` | JWT | List all projects (scans Claude/Codex/Gemini dirs) |
| `GET` | `/api/projects/:projectName/sessions` | JWT | List sessions for a project |
| `GET` | `/api/projects/:projectName/sessions/:sessionId/messages` | JWT | Get session messages |
| `PUT` | `/api/projects/:projectName/rename` | JWT | Rename project display name |
| `DELETE` | `/api/projects/:projectName/sessions/:sessionId` | JWT | Delete a session |
| `DELETE` | `/api/projects/:projectName` | JWT | Delete a project (`?force=true`) |
| `POST` | `/api/projects/create` | JWT | Add project manually by path |
| `POST` | `/api/projects/create-workspace` | JWT | Create/add workspace (with optional git clone) |
| `GET` | `/api/projects/clone-progress` | JWT | SSE: stream git clone progress |
| `GET` | `/api/projects/:projectName/file` | JWT | Read file content (text) |
| `GET` | `/api/projects/:projectName/files/content` | JWT | Read file content (binary, streamed) |
| `PUT` | `/api/projects/:projectName/file` | JWT | Save file content |
| `GET` | `/api/projects/:projectName/files` | JWT | Get file tree for project |
| `GET` | `/api/projects/:projectName/sessions/:sessionId/token-usage` | JWT | Get token usage stats |

**`GET /api/projects` Response:**
```typescript
// Returns output of getProjects() from projects.js
// UNCLEAR - needs investigation: exact shape depends on projects.js parsing logic
// Projects are scanned from ~/.claude/projects, ~/.codex/sessions, ~/.gemini/projects
type ProjectsResponse = Project[];

interface Project {
  name: string;       // encoded project identifier
  displayName: string;
  path: string;
  provider: 'claude' | 'codex' | 'gemini';
  sessionCount: number;
  lastActivity: string;
  // UNCLEAR - needs investigation: full shape in projects.js
}
```

**`GET /api/projects/:projectName/sessions` Query params:**
```typescript
interface SessionsQuery {
  limit?: number;  // default 5
  offset?: number; // default 0
}
interface SessionsResponse {
  sessions: Session[];
  total: number;
  hasMore: boolean;
}
```

**`GET /api/projects/:projectName/sessions/:sessionId/messages` Query params:**
```typescript
interface MessagesQuery {
  limit?: number;  // optional
  offset?: number; // default 0
}
// Response: { messages: Message[] } or { messages, total, hasMore, offset, limit }
```

**`POST /api/projects/create-workspace` Request:**
```typescript
interface CreateWorkspaceRequest {
  workspaceType: 'existing' | 'new';
  path: string;
  githubUrl?: string;
  githubTokenId?: number;
  newGithubToken?: string;
}
```

**`GET /api/projects/clone-progress` - SSE (Server-Sent Events):**
```typescript
// Query params: path, githubUrl, githubTokenId?, newGithubToken?
// SSE events (data: JSON):
interface CloneProgressEvent { type: 'progress'; message: string }
interface CloneCompleteEvent { type: 'complete'; project: Project; message: string }
interface CloneErrorEvent { type: 'error'; message: string }
```

**`GET /api/projects/:projectName/sessions/:sessionId/token-usage` Response:**
```typescript
interface TokenUsageResponse {
  used: number;
  total: number;
  breakdown?: {
    input: number;
    cacheCreation: number;
    cacheRead: number;
  };
  unsupported?: boolean;    // Gemini: token tracking unavailable
  message?: string;
}
```

---

### 2.4 Filesystem Routes (inline in index.js)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/browse-filesystem` | JWT | Browse directories for suggestions |
| `POST` | `/api/create-folder` | JWT | Create a new folder |

**`GET /api/browse-filesystem` Query & Response:**
```typescript
interface BrowseQuery { path?: string } // defaults to WORKSPACES_ROOT (home dir)
interface BrowseResponse {
  path: string;
  suggestions: Array<{ path: string; name: string; type: 'directory' }>;
}
```

---

### 2.5 Git Routes (`/api/git`)

**Source:** `server/routes/git.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/git/status` | JWT | Git status for project |
| `GET` | `/api/git/diff` | JWT | Diff for a specific file |
| `GET` | `/api/git/file-with-diff` | JWT | File content + old content for CodeEditor |
| `POST` | `/api/git/initial-commit` | JWT | Create initial commit |
| `POST` | `/api/git/commit` | JWT | Commit selected files |
| `GET` | `/api/git/branches` | JWT | List branches |
| `POST` | `/api/git/checkout` | JWT | Checkout branch |
| `POST` | `/api/git/create-branch` | JWT | Create and checkout new branch |
| `GET` | `/api/git/commits` | JWT | Recent commit log |
| `GET` | `/api/git/commit-diff` | JWT | Diff for a specific commit |
| `POST` | `/api/git/generate-commit-message` | JWT | AI-generated commit message |
| `GET` | `/api/git/remote-status` | JWT | Ahead/behind remote |
| `POST` | `/api/git/fetch` | JWT | Fetch from remote |
| `POST` | `/api/git/pull` | JWT | Pull from remote |
| `POST` | `/api/git/push` | JWT | Push to remote |
| `POST` | `/api/git/publish` | JWT | Push + set upstream |
| `POST` | `/api/git/discard` | JWT | Discard changes for file |
| `POST` | `/api/git/delete-untracked` | JWT | Delete untracked file |

**`GET /api/git/status` Response:**
```typescript
interface GitStatusResponse {
  branch: string;
  hasCommits: boolean;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}
```

**`POST /api/git/commit` Request:**
```typescript
interface CommitRequest {
  project: string;
  message: string;
  files: string[];
}
```

**`GET /api/git/commits` Response:**
```typescript
interface CommitsResponse {
  commits: Array<{
    hash: string;
    author: string;
    email: string;
    date: string;     // relative (e.g. "2 hours ago")
    message: string;
    stats: string;    // summary line from git show --stat
  }>;
}
```

**`GET /api/git/remote-status` Response:**
```typescript
interface RemoteStatusResponse {
  hasRemote: boolean;
  hasUpstream: boolean;
  branch: string;
  remoteBranch?: string;
  remoteName?: string;
  ahead?: number;
  behind?: number;
  isUpToDate?: boolean;
  message?: string;
}
```

---

### 2.6 Settings Routes (`/api/settings`)

**Source:** `server/routes/settings.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/settings/api-keys` | JWT | List API keys (masked) |
| `POST` | `/api/settings/api-keys` | JWT | Create new API key |
| `DELETE` | `/api/settings/api-keys/:keyId` | JWT | Delete API key |
| `PATCH` | `/api/settings/api-keys/:keyId/toggle` | JWT | Toggle API key active |
| `GET` | `/api/settings/credentials` | JWT | List credentials (values hidden) |
| `POST` | `/api/settings/credentials` | JWT | Create credential |
| `DELETE` | `/api/settings/credentials/:credentialId` | JWT | Delete credential |
| `PATCH` | `/api/settings/credentials/:credentialId/toggle` | JWT | Toggle credential active |

**`POST /api/settings/api-keys` Request/Response:**
```typescript
interface CreateApiKeyRequest { keyName: string }
interface CreateApiKeyResponse {
  success: true;
  apiKey: { id: number; keyName: string; apiKey: string }; // Full key shown only once
}
```

**`POST /api/settings/credentials` Request:**
```typescript
interface CreateCredentialRequest {
  credentialName: string;
  credentialType: string; // 'github_token', 'gitlab_token', etc.
  credentialValue: string;
  description?: string;
}
```

---

### 2.7 User Routes (`/api/user`)

**Source:** `server/routes/user.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/user/git-config` | JWT | Get git name/email |
| `POST` | `/api/user/git-config` | JWT | Set git name/email (also writes git config --global) |
| `POST` | `/api/user/complete-onboarding` | JWT | Mark onboarding complete |
| `GET` | `/api/user/onboarding-status` | JWT | Check onboarding status |

---

### 2.8 CLI Auth Routes (`/api/cli`)

**Source:** `server/routes/cli-auth.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/cli/claude/status` | JWT | Check Claude CLI auth status |
| `GET` | `/api/cli/codex/status` | JWT | Check Codex CLI auth status |
| `GET` | `/api/cli/gemini/status` | JWT | Check Gemini CLI auth status |

**Response (all three):**
```typescript
interface CliAuthStatusResponse {
  authenticated: boolean;
  email: string | null;
  error?: string;
  method?: string; // 'credentials_file', 'api_key', etc.
}
```

---

### 2.9 MCP Routes (`/api/mcp`)

**Source:** `server/routes/mcp.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/mcp/cli/list` | JWT | List MCP servers via `claude mcp list` |
| `POST` | `/api/mcp/cli/add` | JWT | Add MCP server via CLI |
| `POST` | `/api/mcp/cli/add-json` | JWT | Add MCP server via JSON config |
| `DELETE` | `/api/mcp/cli/remove/:name` | JWT | Remove MCP server via CLI |
| `GET` | `/api/mcp/cli/get/:name` | JWT | Get MCP server details via CLI |
| `GET` | `/api/mcp/config/read` | JWT | Read MCP servers from config files |

---

### 2.10 MCP Utils Routes (`/api/mcp-utils`)

**Source:** `server/routes/mcp-utils.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/mcp-utils/taskmaster-server` | JWT | Check TaskMaster MCP server |
| `GET` | `/api/mcp-utils/all-servers` | JWT | Get all configured MCP servers |

---

### 2.11 Commands Routes (`/api/commands`)

**Source:** `server/routes/commands.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/commands/list` | JWT | List all commands (built-in + custom) |
| `POST` | `/api/commands/load` | JWT | Load a specific command file |
| `POST` | `/api/commands/execute` | JWT | Execute a command (built-in or custom) |

**`POST /api/commands/list` Request/Response:**
```typescript
interface ListCommandsRequest { projectPath?: string }
interface ListCommandsResponse {
  builtIn: Command[];
  custom: Command[];
  count: number;
}
interface Command {
  name: string;         // e.g. '/help', '/mycommand'
  description: string;
  namespace: 'builtin' | 'project' | 'user';
  metadata: Record<string, any>;
  path?: string;        // file path for custom commands
  relativePath?: string;
}
```

**`POST /api/commands/execute` Request/Response:**
```typescript
interface ExecuteCommandRequest {
  commandName: string;
  commandPath?: string;  // required for custom commands
  args?: string[];
  context?: {
    provider?: string;
    model?: string;
    tokenUsage?: Record<string, number>;
    projectPath?: string;
  };
}
// Built-in commands return: { type: 'builtin', action: string, data: any, command: string }
// Custom commands return: { type: 'custom', command: string, content: string, metadata: any, hasFileIncludes: boolean, hasBashCommands: boolean }
```

---

### 2.12 Codex Routes (`/api/codex`)

**Source:** `server/routes/codex.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/codex/config` | JWT | Get Codex config |
| `GET` | `/api/codex/sessions` | JWT | List Codex sessions |
| `GET` | `/api/codex/sessions/:sessionId/messages` | JWT | Get Codex session messages |
| `DELETE` | `/api/codex/sessions/:sessionId` | JWT | Delete Codex session |
| `GET` | `/api/codex/mcp/cli/list` | JWT | List Codex MCP servers |
| `POST` | `/api/codex/mcp/cli/add` | JWT | Add Codex MCP server |
| `DELETE` | `/api/codex/mcp/cli/remove/:name` | JWT | Remove Codex MCP server |
| `GET` | `/api/codex/mcp/cli/get/:name` | JWT | Get Codex MCP server details |
| `GET` | `/api/codex/mcp/config/read` | JWT | Read Codex MCP config |

---

### 2.13 Gemini Routes (`/api/gemini`)

**Source:** `server/routes/gemini.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/gemini/sessions/:sessionId/messages` | JWT | Get Gemini session messages |
| `DELETE` | `/api/gemini/sessions/:sessionId` | JWT | Delete Gemini session |

---

### 2.14 TaskMaster Routes (`/api/taskmaster`)

**Source:** `server/routes/taskmaster.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/taskmaster/installation-status` | JWT | Check TaskMaster CLI installed |
| `GET` | `/api/taskmaster/detect/:projectName` | JWT | Detect .taskmaster in project |
| `GET` | `/api/taskmaster/detect-all` | JWT | Detect TaskMaster across all projects |
| `POST` | `/api/taskmaster/initialize/:projectName` | JWT | Initialize TaskMaster in project |
| `GET` | `/api/taskmaster/next/:projectName` | JWT | Get next task |
| `GET` | `/api/taskmaster/tasks/:projectName` | JWT | Get all tasks |
| `GET` | `/api/taskmaster/prd/:projectName` | JWT | List PRD files |
| `POST` | `/api/taskmaster/prd/:projectName` | JWT | Upload PRD file |
| `GET` | `/api/taskmaster/prd/:projectName/:fileName` | JWT | Get PRD content |
| `DELETE` | `/api/taskmaster/prd/:projectName/:fileName` | JWT | Delete PRD file |
| `POST` | `/api/taskmaster/init/:projectName` | JWT | Run task-master init |
| `POST` | `/api/taskmaster/add-task/:projectName` | JWT | Add a task |
| `PUT` | `/api/taskmaster/update-task/:projectName/:taskId` | JWT | Update a task |
| `POST` | `/api/taskmaster/parse-prd/:projectName` | JWT | Parse PRD into tasks |
| `GET` | `/api/taskmaster/prd-templates` | JWT | Get PRD templates |
| `POST` | `/api/taskmaster/apply-template/:projectName` | JWT | Apply a PRD template |

---

### 2.15 Agent Routes (`/api/agent`)

**Source:** `server/routes/agent.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/agent` | API_KEY | External agent API endpoint |

**Note:** This is the only route group that uses `validateExternalApiKey` (API key from `api_keys` table) instead of JWT. All other protected routes use JWT.

**`POST /api/agent` Request:**
```typescript
interface AgentRequest {
  command: string;           // prompt text
  provider?: 'claude' | 'codex' | 'gemini';
  model?: string;
  projectPath?: string;
  sessionId?: string;
  // Additional provider-specific options
}
```

---

### 2.16 System Routes (inline in index.js)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/system/update` | JWT | Trigger git pull + npm install |
| `POST` | `/api/transcribe` | JWT | Audio transcription via Whisper |
| `POST` | `/api/projects/:projectName/upload-images` | JWT | Upload images (multipart) |

**`POST /api/transcribe` - multipart/form-data:**
```typescript
// Fields:
// - audio: File (audio file)
// - mode: 'default' | 'prompt' | 'vibe' | 'instructions' | 'architect'
interface TranscribeResponse { text: string }
```

**`POST /api/projects/:projectName/upload-images` Response:**
```typescript
interface UploadImagesResponse {
  images: Array<{
    name: string;
    data: string;      // data:mime;base64,...
    size: number;
    mimeType: string;
  }>;
}
```

---

### 2.17 Catch-all

```
GET * -> serves dist/index.html (SPA) or redirects to Vite dev server
```

---

## 3. WebSocket Protocol

**Source:** `server/index.js` lines 282-1396

**Single WebSocket server** on the HTTP server, routing by URL path:

| Path | Purpose | Handler |
|------|---------|---------|
| `/ws` | Chat/AI interaction | `handleChatConnection()` |
| `/shell` | Terminal/PTY session | `handleShellConnection()` |

### Connection URL

```
ws://<host>:<port>/ws?token=<jwt>
ws://<host>:<port>/shell?token=<jwt>
```

Authentication via `?token=` query param or `Authorization` header (checked in `verifyClient`).

---

### 3.1 Chat WebSocket (`/ws`)

#### Client -> Server Messages

```typescript
// 1. Send prompt to Claude
interface ClaudeCommand {
  type: 'claude-command';
  command: string;           // user prompt text
  options: {
    projectPath?: string;
    sessionId?: string;      // to resume session
    cwd?: string;
    model?: string;          // 'sonnet' | 'opus' | 'haiku' | 'opusplan' | 'sonnet[1m]'
    permissionMode?: string; // 'default' | 'plan' | 'bypassPermissions'
    toolsSettings?: {
      allowedTools: string[];
      disallowedTools: string[];
      skipPermissions: boolean;
    };
    images?: Array<{ data: string }>; // base64 data URIs
  };
}

// 2. Send prompt to Codex
interface CodexCommand {
  type: 'codex-command';
  command: string;
  options: {
    projectPath?: string;
    cwd?: string;
    sessionId?: string;
    model?: string;
  };
}

// 3. Send prompt to Gemini
interface GeminiCommand {
  type: 'gemini-command';
  command: string;
  options: {
    projectPath?: string;
    cwd?: string;
    sessionId?: string;
    model?: string;
  };
}

// 4. Abort a running session
interface AbortSession {
  type: 'abort-session';
  sessionId: string;
  provider?: 'claude' | 'codex' | 'gemini'; // default 'claude'
}

// 5. Respond to tool permission request
interface PermissionResponse {
  type: 'claude-permission-response';
  requestId: string;
  allow: boolean;
  updatedInput?: any;
  message?: string;
  rememberEntry?: string; // e.g. 'Bash(npm:*)' to auto-allow in future
}

// 6. Check if a session is active
interface CheckSessionStatus {
  type: 'check-session-status';
  sessionId: string;
  provider?: 'claude' | 'codex' | 'gemini';
}

// 7. Get all active sessions
interface GetActiveSessions {
  type: 'get-active-sessions';
}
```

#### Server -> Client Messages

```typescript
// === Session lifecycle ===

interface SessionCreated {
  type: 'session-created';
  sessionId: string;
}

interface SessionAborted {
  type: 'session-aborted';
  sessionId: string;
  provider: string;
  success: boolean;
}

interface SessionStatus {
  type: 'session-status';
  sessionId: string;
  provider: string;
  isProcessing: boolean;
}

interface ActiveSessions {
  type: 'active-sessions';
  sessions: {
    claude: string[];
    codex: string[];
    gemini: string[];
  };
}

// === Claude SDK streaming ===

// Each message from the Claude Agent SDK is wrapped and forwarded:
interface ClaudeResponse {
  type: 'claude-response';
  data: SDKMessage;        // Raw SDK message (see below)
  sessionId: string | null;
}

// SDK message types observed (from @anthropic-ai/claude-agent-sdk):
// - { type: 'assistant', message: { content: ContentBlock[], usage: Usage } }
// - { type: 'result', modelUsage: Record<string, ModelUsage> }
// - Tool use messages with tool_name, input, etc.
// - Messages may include parent_tool_use_id (mapped to parentToolUseId)

interface ClaudeComplete {
  type: 'claude-complete';
  sessionId: string;
  exitCode: number;        // 0 on success
  isNewSession: boolean;
}

interface ClaudeError {
  type: 'claude-error';
  error: string;
  sessionId: string | null;
}

// === Tool permissions ===

interface PermissionRequest {
  type: 'claude-permission-request';
  requestId: string;       // UUID to correlate response
  toolName: string;        // e.g. 'Bash', 'Edit', 'AskUserQuestion'
  input: any;              // tool input object
  sessionId: string | null;
}

interface PermissionCancelled {
  type: 'claude-permission-cancelled';
  requestId: string;
  reason: 'timeout' | 'cancelled';
  sessionId: string | null;
}

// === Token budget ===

interface TokenBudget {
  type: 'token-budget';
  data: {
    used: number;          // total tokens used
    total: number;         // context window budget
  };
  sessionId: string | null;
}

// === Project updates (from file watchers) ===

interface ProjectsUpdated {
  type: 'projects_updated';
  projects: Project[];
  timestamp: string;       // ISO 8601
  changeType: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  changedFile: string;     // relative path
  watchProvider: 'claude' | 'codex' | 'gemini' | 'gemini_sessions';
}

// === Loading progress ===

interface LoadingProgress {
  type: 'loading_progress';
  // Additional progress fields from broadcastProgress()
  [key: string]: any;
}

// === Generic error ===

interface WsError {
  type: 'error';
  error: string;
}
```

---

### 3.2 Shell WebSocket (`/shell`)

#### Client -> Server Messages

```typescript
// 1. Initialize shell session
interface ShellInit {
  type: 'init';
  projectPath?: string;    // defaults to process.cwd()
  sessionId?: string;
  hasSession?: boolean;    // true to resume
  provider?: 'claude' | 'codex' | 'gemini' | 'plain-shell';
  initialCommand?: string; // custom command to run
  isPlainShell?: boolean;
  cols?: number;           // terminal columns (default 80)
  rows?: number;           // terminal rows (default 24)
}

// 2. Send keystrokes/input to PTY
interface ShellInput {
  type: 'input';
  data: string;            // raw terminal input
}

// 3. Resize terminal
interface ShellResize {
  type: 'resize';
  cols: number;
  rows: number;
}
```

#### Server -> Client Messages

```typescript
// 1. Terminal output
interface ShellOutput {
  type: 'output';
  data: string;  // raw terminal output with ANSI codes
}

// 2. Auth URL detected in terminal output
interface ShellAuthUrl {
  type: 'auth_url';
  url: string;
  autoOpen: boolean;
}
```

**PTY Session Persistence:**
- Sessions are kept alive for 30 minutes after WebSocket disconnect
- Reconnecting to the same session restores buffered output (up to 5000 messages)
- Session key: `${projectPath}_${sessionId}${commandSuffix}`

---

## 4. Database Schema

**Source:** `server/database/init.sql`

```sql
-- Users table (single user system)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    git_name TEXT,              -- added via migration
    git_email TEXT,             -- added via migration
    has_completed_onboarding BOOLEAN DEFAULT 0  -- added via migration
);

-- API Keys table for external API access
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,  -- format: 'ck_' + 64 hex chars
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User credentials table (GitHub tokens, GitLab tokens, etc.)
CREATE TABLE IF NOT EXISTS user_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_name TEXT NOT NULL,
    credential_type TEXT NOT NULL,  -- 'github_token', 'gitlab_token', etc.
    credential_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Note:** This is a single-user system. Registration is only allowed if no users exist.

---

## 5. Data Models (TypeScript Interfaces)

### User

```typescript
interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  last_login: string | null;
  is_active: 0 | 1;
  git_name: string | null;
  git_email: string | null;
  has_completed_onboarding: 0 | 1;
}

// Subset returned to frontend (getUserById)
interface PublicUser {
  id: number;
  username: string;
  created_at: string;
  last_login: string;
}
```

### API Key

```typescript
interface ApiKey {
  id: number;
  user_id: number;
  key_name: string;
  api_key: string;       // 'ck_' + 64 hex chars
  created_at: string;
  last_used: string | null;
  is_active: 0 | 1;
}
```

### Credential

```typescript
interface UserCredential {
  id: number;
  user_id: number;
  credential_name: string;
  credential_type: string;
  credential_value: string;
  description: string | null;
  created_at: string;
  is_active: 0 | 1;
}
```

### Gemini Session (in-memory, via SessionManager)

```typescript
interface GeminiSession {
  id: string;
  projectPath: string;
  messages: GeminiMessage[];
  createdAt: Date;
  lastActivity: Date;
  cliSessionId?: string;  // native Gemini CLI session ID
}

interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### Claude SDK Options (internal)

```typescript
interface ClaudeSDKOptions {
  cwd?: string;
  permissionMode?: 'default' | 'plan' | 'bypassPermissions';
  allowedTools: string[];
  disallowedTools: string[];
  tools: { type: 'preset'; preset: 'claude_code' };
  model: string;           // 'sonnet' | 'opus' | 'haiku' | 'opusplan' | 'sonnet[1m]'
  systemPrompt: { type: 'preset'; preset: 'claude_code' };
  settingSources: ['project', 'user', 'local'];
  resume?: string;         // session ID to resume
  mcpServers?: Record<string, MCPServerConfig>;
  canUseTool?: (toolName: string, input: any, context: any) => Promise<ToolDecision>;
}

interface ToolDecision {
  behavior: 'allow' | 'deny';
  updatedInput?: any;
  message?: string;
}
```

---

## 6. Environment Variables

**Source:** `.env`, `server/index.js`, `server/middleware/auth.js`, `server/constants/config.js`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` (code), `5555` (.env) | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `JWT_SECRET` | `'claude-ui-dev-secret-change-in-production'` | JWT signing secret |
| `API_KEY` | (none) | Optional global API key gate for all `/api/*` |
| `VITE_IS_PLATFORM` | (none) | `'true'` enables platform mode (bypass JWT) |
| `VITE_PORT` | `5173` | Vite dev server port (for dev redirect) |
| `CONTEXT_WINDOW` | `160000` | Token budget limit |
| `DATABASE_PATH` | `server/database/auth.db` | SQLite database path |
| `WORKSPACES_ROOT` | `os.homedir()` | Root for workspace browsing |
| `OPENAI_API_KEY` | (none) | Required for audio transcription |
| `GEMINI_API_KEY` | (none) | Gemini API key auth |
| `ANTHROPIC_API_KEY` | (none) | Claude API key auth |
| `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS` | `55000` | Tool permission timeout |
| `CLAUDE_CODE_STREAM_CLOSE_TIMEOUT` | `300000` | SDK stream close timeout |

---

## 7. Transport Summary

| Feature | Transport | Evidence |
|---------|-----------|----------|
| AI chat streaming | **WebSocket** (`/ws`) | `server/index.js:892` - `handleChatConnection()` |
| Terminal sessions | **WebSocket** (`/shell`) | `server/index.js:1041` - `handleShellConnection()` |
| Project file watching | **WebSocket** (broadcast) | `server/index.js:144-158` - `projects_updated` message |
| Git clone progress | **SSE** (Server-Sent Events) | `server/routes/projects.js:337` - `clone-progress` |
| All other data | **REST** (HTTP JSON) | Standard Express routes |

**No SSE is used for AI streaming.** The planning docs mention SSE but the actual implementation uses WebSocket exclusively for chat/AI interaction. The `WebSocketWriter` class (`server/index.js:903-924`) wraps the WS connection to match an `SSEStreamWriter` interface, suggesting SSE was the original transport that was later replaced with WebSocket.

---

## Appendix: File-to-Route Mapping

| File | Route Prefix | Key Exports |
|------|-------------|-------------|
| `server/index.js` | `/api/projects`, `/api/browse-filesystem`, `/api/create-folder`, `/api/system/update`, `/api/transcribe`, `/ws`, `/shell` | inline routes + WS handlers |
| `server/routes/auth.js` | `/api/auth` | register, login, logout, status |
| `server/routes/projects.js` | `/api/projects` | create-workspace, clone-progress |
| `server/routes/git.js` | `/api/git` | status, diff, commit, branches, push/pull |
| `server/routes/settings.js` | `/api/settings` | api-keys, credentials CRUD |
| `server/routes/user.js` | `/api/user` | git-config, onboarding |
| `server/routes/cli-auth.js` | `/api/cli` | claude/codex/gemini auth status |
| `server/routes/mcp.js` | `/api/mcp` | MCP server management via Claude CLI |
| `server/routes/mcp-utils.js` | `/api/mcp-utils` | taskmaster-server, all-servers |
| `server/routes/commands.js` | `/api/commands` | slash command listing/execution |
| `server/routes/codex.js` | `/api/codex` | Codex sessions, MCP management |
| `server/routes/gemini.js` | `/api/gemini` | Gemini session messages |
| `server/routes/taskmaster.js` | `/api/taskmaster` | TaskMaster integration |
| `server/routes/agent.js` | `/api/agent` | External agent API |
| `server/claude-sdk.js` | (internal) | `queryClaudeSDK`, `abortClaudeSDKSession` |
| `server/openai-codex.js` | (internal) | `queryCodex`, `abortCodexSession` |
| `server/gemini-cli.js` | (internal) | `spawnGemini`, `abortGeminiSession` |
| `server/sessionManager.js` | (internal) | Gemini session persistence |
| `server/database/db.js` | (internal) | `userDb`, `apiKeysDb`, `credentialsDb` |
| `server/middleware/auth.js` | (internal) | `authenticateToken`, `validateApiKey`, `authenticateWebSocket` |
| `server/constants/config.js` | (internal) | `IS_PLATFORM` |
| `shared/modelConstants.js` | (shared) | `CLAUDE_MODELS`, `CODEX_MODELS`, `GEMINI_MODELS` |
