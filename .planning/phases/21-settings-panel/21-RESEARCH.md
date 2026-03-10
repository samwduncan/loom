# Phase 21: Settings Panel - Research

**Researched:** 2026-03-10
**Domain:** Settings UI, shadcn primitives, backend API integration (REST)
**Confidence:** HIGH

## Summary

Phase 21 builds a full-screen settings modal with 5 tabs (Agents, API Keys, Appearance, Git, MCP) accessible from the sidebar gear icon. The backend already has complete REST endpoints for every feature: CLI auth status (`/api/cli/{provider}/status`), API key CRUD (`/api/settings/api-keys`), credentials CRUD (`/api/settings/credentials`), git config (`/api/user/git-config`), and MCP server management (`/api/mcp/cli/*` for Claude, `/api/codex/mcp/cli/*` for Codex). No backend work is needed.

The frontend needs 8-10 new shadcn primitives installed (tabs, input, label, select, slider, switch, alert-dialog, card) plus the settings component tree. The existing `radix-ui` package (v1.4.3) is already installed as a unified dependency, and shadcn's `components.json` is configured (`new-york` style, `@/components/ui` path). The existing Dialog component already uses OKLCH tokens and z-index dictionary tokens correctly -- this is the pattern for all new primitives.

**Primary recommendation:** Install shadcn primitives first (plan 1), then build the settings modal shell + tab navigation (plan 2), then implement individual tab content panels (plan 3). The existing `apiFetch<T>` wrapper in `lib/api-client.ts` handles auth injection -- use it for all settings API calls.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SET-01 | Full-screen modal overlay via portal, accessible from sidebar gear + Cmd+K | Use existing Dialog (shadcn) with full-screen variant. Add gear icon to Sidebar footer. UI store `openModal({type:'settings'})` already exists. |
| SET-02 | 5 tabs: Agents, API Keys, Appearance, Git, MCP | New shadcn Tabs primitive. Radix Tabs provides keyboard nav + ARIA. |
| SET-03 | Close on Escape or backdrop click | Dialog component handles Escape natively. Overlay click-to-close is built-in. |
| SET-04 | Agent connection status with colored dots | Backend: `GET /api/cli/{claude,codex,gemini}/status` returns `{authenticated, email, error}`. Map to status token colors. |
| SET-05 | Provider version/model info when connected | Backend: CLI status + model constants from `shared/modelConstants.js`. |
| SET-06 | API keys listed masked except last 4 chars with delete | Backend: `GET /api/settings/api-keys` already masks keys (first 10 chars + `...`). |
| SET-07 | Add API Key form with name/key/provider validation | Backend: `POST /api/settings/api-keys` with `{keyName}`. Use shadcn Input + Label. |
| SET-08 | Delete confirmation dialog | New shadcn AlertDialog primitive. |
| SET-09 | Success/error toast after add/delete | Sonner already installed. `toast.success()` / `toast.error()`. |
| SET-10 | Git user name/email editable with Save | Backend: `GET/POST /api/user/git-config` with `{gitName, gitEmail}`. |
| SET-11 | Git save success/error feedback | Sonner toast on save response. |
| SET-12 | Font size slider 12-20px with live preview | UI store `setTheme({fontSize})` already exists, persisted to localStorage. New shadcn Slider. Apply via CSS custom property on root. |
| SET-13 | Code font selection (JetBrains Mono default) | Extend ThemeConfig with `codeFontFamily`. Use shadcn Select. |
| SET-14 | Appearance persists to localStorage, applies without reload | UI store uses Zustand persist middleware -- already does this for fontSize/density. Extend partialize to include new fields. |
| SET-15 | MCP servers listed per provider with name/status | Claude: `GET /api/mcp/config/read`. Codex: `GET /api/codex/mcp/config/read`. |
| SET-16 | Add MCP Server form per provider | Claude: `POST /api/mcp/cli/add` with `{name, command, args, env}`. Codex: `POST /api/codex/mcp/cli/add`. |
| SET-17 | Remove MCP server with confirmation | `DELETE /api/mcp/cli/remove/:name`. AlertDialog for confirmation. |
| SET-18 | Loading skeletons while fetching | CSS skeleton animation per tab content area. |
| SET-19 | "(requires restart)" indicator for server-affecting settings | Static label on MCP add/remove, git config changes. |
| SET-20 | GitHub/GitLab credentials with token masking | Backend: `GET/POST/DELETE /api/settings/credentials` with `credentialType: 'github_token'`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| radix-ui | 1.4.3 | Accessible primitives (Dialog, Tabs, Select, Slider, Switch, AlertDialog) | Already installed. All shadcn components use Radix. |
| sonner | 2.0.7 | Toast notifications | Already installed. Constitution 8.4 mandates portal toasts. |
| lucide-react | 0.577.0 | Icons (Settings gear, status dots, provider logos) | Already installed. Standard icon lib. |
| zustand | 5.0.11 | UI store for theme/modal state | Already installed. Persist middleware for appearance prefs. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Variant-based component styling | Already installed. Use for button/input variants in settings forms. |
| tailwind-merge + clsx | via cn() | Class composition | Already installed. All className construction uses cn(). |

### New shadcn Primitives to Install
| Primitive | Purpose | Radix Dependency |
|-----------|---------|------------------|
| tabs | Settings tab navigation | @radix-ui/react-tabs (bundled in radix-ui) |
| input | API key, git config, MCP server fields | Native HTML input styled |
| label | Form field labels | @radix-ui/react-label (bundled) |
| select | Code font selection, MCP provider picker | @radix-ui/react-select (bundled) |
| slider | Font size slider | @radix-ui/react-slider (bundled) |
| switch | Toggle settings (future-proof) | @radix-ui/react-switch (bundled) |
| alert-dialog | Delete confirmation dialogs | @radix-ui/react-alert-dialog (bundled) |
| card | Structured content sections | Pure HTML/CSS |
| separator | Visual section dividers within tabs | Already installed |

**Installation:**
```bash
cd src && npx shadcn@latest add tabs input label select slider switch alert-dialog card
```

All use the unified `radix-ui` v1.4.3 package already installed. No new npm dependencies needed beyond what shadcn generates.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Tabs | Custom tabs | Lose keyboard nav, ARIA, animation. Not worth it. |
| shadcn AlertDialog | window.confirm() | Ugly, no styling, breaks UX. |
| Zustand persist for appearance | Separate localStorage calls | Store already persists theme -- extending it is cleaner. |

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  components/
    settings/
      SettingsModal.tsx          # Dialog shell + tab routing
      SettingsModal.test.tsx
      AgentsTab.tsx              # Provider status display
      AgentsTab.test.tsx
      ApiKeysTab.tsx             # CRUD for API keys
      ApiKeysTab.test.tsx
      AppearanceTab.tsx          # Font size slider, code font select
      AppearanceTab.test.tsx
      GitTab.tsx                 # Git name/email config
      GitTab.test.tsx
      McpTab.tsx                 # MCP server management
      McpTab.test.tsx
      CredentialsSection.tsx     # GitHub/GitLab token section (in ApiKeysTab or own tab)
      SettingsTabSkeleton.tsx    # Shared loading skeleton
  hooks/
    useSettingsData.ts           # Data fetching hooks for each settings domain
    useSettingsData.test.ts
  types/
    settings.ts                  # API response types for settings endpoints
```

### Pattern 1: Settings Modal as Dialog with Full-Screen Variant
**What:** Reuse existing shadcn Dialog but with a full-screen content variant.
**When to use:** Settings modal is the only full-screen dialog in the app currently.
**Example:**
```typescript
// SettingsModal.tsx — uses Dialog with full-screen DialogContent
export function SettingsModal() {
  const modalState = useUIStore((s) => s.modalState);
  const closeModal = useUIStore((s) => s.closeModal);
  const isOpen = modalState?.type === 'settings';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className={cn(
          'sm:max-w-3xl max-h-[85vh]',
          'flex flex-col overflow-hidden',
        )}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="agents" className="flex-1 overflow-hidden">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="git">Git</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>
          <TabsContent value="agents"><AgentsTab /></TabsContent>
          {/* ... */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: Per-Tab Data Fetching with Custom Hooks
**What:** Each tab has a dedicated hook that fetches data on mount, with loading/error states.
**When to use:** All 5 settings tabs fetch from different backend endpoints.
**Example:**
```typescript
// hooks/useSettingsData.ts
export function useAgentStatuses() {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiFetch<CliAuthStatus>('/api/cli/claude/status', {}, controller.signal),
      apiFetch<CliAuthStatus>('/api/cli/codex/status', {}, controller.signal),
      apiFetch<CliAuthStatus>('/api/cli/gemini/status', {}, controller.signal),
    ]).then(([claude, codex, gemini]) => {
      setStatuses([
        { provider: 'claude', ...claude },
        { provider: 'codex', ...codex },
        { provider: 'gemini', ...gemini },
      ]);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return { statuses, isLoading };
}
```

### Pattern 3: Live Preview for Appearance Settings
**What:** Font size changes apply immediately to the document by setting CSS custom properties on `:root`.
**When to use:** SET-12, SET-14 — appearance changes must be instant without reload.
**Example:**
```typescript
// AppearanceTab.tsx — slider onChange updates CSS variable + store
function handleFontSizeChange(value: number[]) {
  const size = value[0]; // Slider returns array
  document.documentElement.style.setProperty('--text-body', `${size / 16}rem`);
  setTheme({ fontSize: size });
}
```

### Pattern 4: Gear Icon in Sidebar Footer
**What:** Add a settings gear icon at the bottom of the sidebar that opens the settings modal.
**When to use:** SET-01 — primary entry point to settings.
**Example:**
```typescript
// In Sidebar.tsx — add footer section before </aside>
<footer className="mt-auto p-3 border-t border-border">
  <button onClick={() => openModal({ type: 'settings', props: {} })}>
    <Settings size={18} className="text-muted hover:text-foreground transition-colors" />
  </button>
</footer>
```

### Anti-Patterns to Avoid
- **Building custom tab components:** shadcn Tabs wraps Radix with full keyboard navigation (arrow keys, Home/End) and ARIA. Hand-rolling this is a month of accessibility work.
- **Fetching all settings data on modal open:** Fetch per-tab on tab activation. MCP server listing can be slow (spawns CLI child process). Don't block the modal.
- **Storing settings in component state only:** Appearance preferences MUST go through the UI store's `setTheme()` so they persist via Zustand middleware.
- **Using Dialog for confirmations:** Use AlertDialog (not Dialog) for delete confirmations. AlertDialog prevents backdrop-click dismissal, which is correct for destructive actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation with keyboard | Custom tab switching | shadcn Tabs (Radix) | Arrow keys, Home/End, ARIA roles, roving tabindex |
| Confirmation dialogs | Custom modal with "Are you sure?" | shadcn AlertDialog | Prevents accidental dismissal, proper focus trap |
| Range slider | Custom `<input type="range">` | shadcn Slider (Radix) | Thumb keyboard control, ARIA, touch support |
| Dropdown selection | Custom `<select>` | shadcn Select (Radix) | Styled consistently, keyboard nav, portal rendering |
| Toast notifications | Custom notification system | Sonner (already installed) | Stacking, auto-dismiss, accessibility |
| Form validation | Manual if/else checking | HTML5 required + pattern + onInvalid | Browsers handle basic validation well |

**Key insight:** The settings panel is 80% standard form UI that shadcn already solves. Custom work should focus on the domain-specific parts: provider status display, MCP server configuration forms, and live appearance preview.

## Common Pitfalls

### Pitfall 1: Radix Dialog Focus Trap + Nested AlertDialog
**What goes wrong:** AlertDialog inside Dialog creates nested focus traps that can break keyboard navigation.
**Why it happens:** Radix manages focus trapping per-dialog. Nesting creates competing traps.
**How to avoid:** Render AlertDialog as a sibling portal, not inside DialogContent. Use state to toggle between showing settings vs. showing the confirmation.
**Warning signs:** Tab key stops working, focus jumps unexpectedly.

### Pitfall 2: MCP CLI Commands Are Slow
**What goes wrong:** `GET /api/mcp/cli/list` spawns `claude mcp list` as a child process which does health checks. Can take 5-10+ seconds.
**Why it happens:** The backend literally runs `claude mcp list` and parses stdout.
**How to avoid:** Use `GET /api/mcp/config/read` (reads JSON config files directly, sub-100ms) for listing. Only use CLI commands for add/remove operations. Show skeletons during add/remove.
**Warning signs:** MCP tab feels frozen on open.

### Pitfall 3: API Key Masking Inconsistency
**What goes wrong:** Backend masks keys as `first10chars...` but requirements say "masked except last 4 chars".
**Why it happens:** Backend `settings.js` line 16: `key.api_key.substring(0, 10) + '...'` -- shows prefix, not suffix.
**How to avoid:** Either: (a) change backend to mask differently, or (b) accept the backend's masking as-is (it's a security-reasonable approach -- showing prefix `ck_...` lets users identify which key is which without exposing the secret part). Recommend accepting as-is.
**Warning signs:** Design mismatch between requirement and implementation.

### Pitfall 4: Zustand Persist Migration When Extending ThemeConfig
**What goes wrong:** Adding new fields to ThemeConfig (like `codeFontFamily`) causes existing persisted state to lack the new field.
**Why it happens:** Zustand persist loads old state from localStorage which doesn't have the new field.
**How to avoid:** Bump persist version (currently 4 -> 5) and add migration that sets default values for new fields. The migration pattern is already established in `ui.ts`.
**Warning signs:** New appearance settings show as undefined on first load after upgrade.

### Pitfall 5: Settings Modal Not Lazy-Loaded
**What goes wrong:** Settings panel code (all 5 tabs + shadcn primitives) gets bundled into the main chunk.
**Why it happens:** Importing SettingsModal directly in AppShell.
**How to avoid:** Constitution 10.6 mandates lazy loading for Settings modal. Use `React.lazy()` + `<Suspense>`.
**Warning signs:** Initial bundle grows significantly.

### Pitfall 6: Codex MCP Config Uses TOML, Not JSON
**What goes wrong:** Assuming Codex MCP config is the same format as Claude.
**Why it happens:** Claude uses `.claude.json` (JSON), Codex uses `.codex/config.toml` (TOML).
**How to avoid:** Use the backend endpoints which abstract this difference. `GET /api/codex/mcp/config/read` handles TOML parsing server-side.
**Warning signs:** MCP tab shows no Codex servers even when configured.

## Code Examples

### API Types for Settings Endpoints
```typescript
// types/settings.ts
export interface CliAuthStatus {
  authenticated: boolean;
  email: string | null;
  error?: string;
  method?: string;
}

export interface ApiKeyResponse {
  id: number;
  key_name: string;
  api_key: string;       // masked: "ck_12345678..."
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
  // credential_value is NOT returned by GET endpoint (security)
}

export interface GitConfigResponse {
  success: boolean;
  gitName: string | null;
  gitEmail: string | null;
}

export interface McpServer {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'sse';
  scope: 'user' | 'local';
  projectPath?: string;
  config: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
  };
}

export interface McpConfigReadResponse {
  success: boolean;
  configPath?: string;
  servers: McpServer[];
}
```

### Sidebar Gear Icon Addition
```typescript
// Sidebar.tsx footer addition
import { Settings } from 'lucide-react';

// Inside the expanded sidebar, before </aside>:
<footer className="mt-auto p-3 border-t border-border flex items-center">
  <button
    onClick={() => openModal({ type: 'settings', props: {} })}
    className={cn(
      'p-2 rounded-md',
      'text-muted hover:text-foreground',
      'transition-colors',
    )}
    aria-label="Open settings"
    type="button"
  >
    <Settings size={18} />
  </button>
</footer>
```

### Agent Status Display Pattern
```typescript
// AgentsTab.tsx — status dot with provider info
const STATUS_COLORS = {
  connected: 'bg-success',
  disconnected: 'bg-destructive',
  error: 'bg-warning',
} as const;

function ProviderRow({ provider, status }: ProviderRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-surface-raised">
      <ProviderLogo provider={provider} size={24} />
      <div className="flex-1">
        <span className="text-foreground font-medium capitalize">{provider}</span>
        {status.email && (
          <span className="text-muted text-sm ml-2">{status.email}</span>
        )}
      </div>
      <span className={cn(
        'w-2 h-2 rounded-full',
        status.authenticated ? STATUS_COLORS.connected : STATUS_COLORS.disconnected,
      )} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shadcn uses individual @radix-ui/* packages | Unified `radix-ui` package (v1.4.3) | 2025 | Single install, shared code, smaller bundle |
| shadcn init generates tailwind.config.js references | Works with Tailwind v4 @theme | Late 2025 | Already configured in this project |
| Separate CSS variable themes per shadcn | Our OKLCH tokens in tokens.css + @theme inline | Project-specific | All shadcn primitives auto-inherit our tokens |

**Current state:** The project is on the latest shadcn v4-compatible setup with `components.json` configured. The `npx shadcn@latest add` command works correctly with the existing setup (verified by 9 already-installed primitives using the same pattern).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3.2 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-01 | Settings modal opens/closes | unit | `cd src && npx vitest run src/components/settings/SettingsModal.test.tsx -x` | Wave 0 |
| SET-02 | 5 tabs render and switch | unit | `cd src && npx vitest run src/components/settings/SettingsModal.test.tsx -x` | Wave 0 |
| SET-03 | Escape closes modal | unit | `cd src && npx vitest run src/components/settings/SettingsModal.test.tsx -x` | Wave 0 |
| SET-04 | Agent status dots render correctly | unit | `cd src && npx vitest run src/components/settings/AgentsTab.test.tsx -x` | Wave 0 |
| SET-05 | Provider version info displayed | unit | `cd src && npx vitest run src/components/settings/AgentsTab.test.tsx -x` | Wave 0 |
| SET-06 | API keys listed masked | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | Wave 0 |
| SET-07 | Add API key form validation | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | Wave 0 |
| SET-08 | Delete confirmation dialog | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | Wave 0 |
| SET-09 | Toast on add/delete | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | Wave 0 |
| SET-10 | Git config editable | unit | `cd src && npx vitest run src/components/settings/GitTab.test.tsx -x` | Wave 0 |
| SET-11 | Git save feedback | unit | `cd src && npx vitest run src/components/settings/GitTab.test.tsx -x` | Wave 0 |
| SET-12 | Font size slider live preview | unit | `cd src && npx vitest run src/components/settings/AppearanceTab.test.tsx -x` | Wave 0 |
| SET-13 | Code font selection | unit | `cd src && npx vitest run src/components/settings/AppearanceTab.test.tsx -x` | Wave 0 |
| SET-14 | Appearance persists to localStorage | unit | `cd src && npx vitest run src/stores/ui.test.ts -x` | Existing (extend) |
| SET-15 | MCP servers listed | unit | `cd src && npx vitest run src/components/settings/McpTab.test.tsx -x` | Wave 0 |
| SET-16 | Add MCP server form | unit | `cd src && npx vitest run src/components/settings/McpTab.test.tsx -x` | Wave 0 |
| SET-17 | Remove MCP with confirmation | unit | `cd src && npx vitest run src/components/settings/McpTab.test.tsx -x` | Wave 0 |
| SET-18 | Loading skeletons | unit | Per-tab tests check isLoading state | Wave 0 |
| SET-19 | Restart indicator shown | unit | `cd src && npx vitest run src/components/settings/McpTab.test.tsx -x` | Wave 0 |
| SET-20 | Credentials CRUD | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/settings/SettingsModal.test.tsx` -- covers SET-01, SET-02, SET-03
- [ ] `src/components/settings/AgentsTab.test.tsx` -- covers SET-04, SET-05
- [ ] `src/components/settings/ApiKeysTab.test.tsx` -- covers SET-06, SET-07, SET-08, SET-09, SET-20
- [ ] `src/components/settings/AppearanceTab.test.tsx` -- covers SET-12, SET-13
- [ ] `src/components/settings/GitTab.test.tsx` -- covers SET-10, SET-11
- [ ] `src/components/settings/McpTab.test.tsx` -- covers SET-15, SET-16, SET-17, SET-19
- [ ] `src/hooks/useSettingsData.test.ts` -- covers data fetching logic
- [ ] Extend `src/stores/ui.test.ts` -- covers SET-14 (ThemeConfig persistence)

## Backend API Summary

All endpoints exist and are tested in production (V1). Zero backend changes required.

### Agents Tab
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cli/claude/status` | GET | Claude auth status |
| `/api/cli/codex/status` | GET | Codex auth status |
| `/api/cli/gemini/status` | GET | Gemini auth status |

### API Keys Tab
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/settings/api-keys` | GET | List keys (masked) |
| `/api/settings/api-keys` | POST | Create key `{keyName}` |
| `/api/settings/api-keys/:id` | DELETE | Delete key |
| `/api/settings/api-keys/:id/toggle` | PATCH | Toggle active `{isActive}` |

### Credentials Tab (SET-20)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/settings/credentials` | GET | List credentials (values hidden) |
| `/api/settings/credentials` | POST | Create `{credentialName, credentialType, credentialValue, description}` |
| `/api/settings/credentials/:id` | DELETE | Delete credential |
| `/api/settings/credentials/:id/toggle` | PATCH | Toggle active `{isActive}` |

### Git Tab
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/git-config` | GET | Get git name/email |
| `/api/user/git-config` | POST | Set git name/email `{gitName, gitEmail}` |

### MCP Tab
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mcp/config/read` | GET | Read Claude MCP config (FAST - reads files) |
| `/api/mcp/cli/add` | POST | Add Claude MCP server |
| `/api/mcp/cli/add-json` | POST | Add Claude MCP via JSON config |
| `/api/mcp/cli/remove/:name` | DELETE | Remove Claude MCP server |
| `/api/codex/mcp/config/read` | GET | Read Codex MCP config |
| `/api/codex/mcp/cli/add` | POST | Add Codex MCP server |
| `/api/codex/mcp/cli/remove/:name` | DELETE | Remove Codex MCP server |

## Open Questions

1. **API Key masking format**
   - What we know: Backend masks as `ck_12345678...` (prefix). Requirement says "last 4 chars".
   - What's unclear: Whether to change backend or accept current masking.
   - Recommendation: Accept backend's current masking. Showing the `ck_` prefix helps users identify keys without exposing secrets. This is a standard pattern (Stripe, GitHub).

2. **Codex MCP via TOML vs CLI**
   - What we know: Codex config is TOML-based, backend has both config read and CLI endpoints.
   - What's unclear: Whether `codex mcp list` CLI command exists/works the same as `claude mcp list`.
   - Recommendation: Use `/api/codex/mcp/config/read` for listing (reads TOML directly). Use CLI endpoints for add/remove.

3. **Gemini MCP support**
   - What we know: No `/api/gemini/mcp/*` routes exist in the backend.
   - What's unclear: Whether Gemini CLI supports MCP server management.
   - Recommendation: Show MCP tab with Claude and Codex providers only. Gemini row can show "MCP not supported" or be omitted.

## Sources

### Primary (HIGH confidence)
- `server/routes/settings.js` -- API key and credentials CRUD (read directly)
- `server/routes/cli-auth.js` -- Provider auth status endpoints (read directly)
- `server/routes/user.js` -- Git config endpoints (read directly)
- `server/routes/mcp.js` -- MCP server management via Claude CLI (read directly)
- `server/routes/codex.js` -- Codex MCP management (read directly)
- `src/src/components/ui/dialog.tsx` -- Existing Dialog pattern with OKLCH tokens (read directly)
- `src/src/stores/ui.ts` -- UI store with theme persistence (read directly)
- `src/components.json` -- shadcn configuration (read directly)
- `shared/modelConstants.js` -- Provider model definitions (read directly)

### Secondary (MEDIUM confidence)
- `.planning/COMPONENT_ADOPTION_MAP.md` -- shadcn primitive plan for M3 settings
- `.planning/BACKEND_API_CONTRACT.md` -- Full API documentation

### Tertiary (LOW confidence)
- None -- all findings verified against source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, shadcn pattern established
- Architecture: HIGH -- backend APIs verified, component patterns established in prior phases
- Pitfalls: HIGH -- identified from direct code inspection of backend routes and existing patterns

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- backend and frontend stack are pinned)
