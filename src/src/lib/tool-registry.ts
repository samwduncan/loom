/**
 * Tool-call component registry -- pluggable config for any tool name.
 *
 * Pure TypeScript module with a Map-based registry. Components (icon, renderCard)
 * use createElement to avoid JSX requirement, keeping this as .ts not .tsx.
 *
 * 6 registered tools (Bash, Read, Edit, Write, Glob, Grep) self-register at
 * module scope with Lucide icons and per-tool card components.
 * Unknown tools get a graceful default config with Wrench icon.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { createElement } from 'react';
import type { ComponentType } from 'react';
import type { ToolCallStatus } from '@/types/stream';

// Lucide icons
import {
  Terminal,
  FileText,
  FilePen,
  FilePlus,
  FolderSearch,
  Search,
  Wrench,
} from 'lucide-react';

// Per-tool card components
import { BashToolCard } from '@/components/chat/tools/BashToolCard';
import { ReadToolCard } from '@/components/chat/tools/ReadToolCard';
import { EditToolCard } from '@/components/chat/tools/EditToolCard';
import { WriteToolCard } from '@/components/chat/tools/WriteToolCard';
import { GlobToolCard } from '@/components/chat/tools/GlobToolCard';
import { GrepToolCard } from '@/components/chat/tools/GrepToolCard';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface ToolCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  status: ToolCallStatus;
}

export interface ToolConfig {
  displayName: string;
  icon: ComponentType;
  getChipLabel: (input: Record<string, unknown>) => string;
  stateColors?: Partial<Record<ToolCallStatus, string>>;
  renderCard: ComponentType<ToolCardProps>;
}

// ---------------------------------------------------------------------------
// Truncation helpers (private)
// ---------------------------------------------------------------------------

function truncatePath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(-(maxLen - 3));
}

function truncateCommand(cmd: string, maxLen = 40): string {
  if (cmd.length <= maxLen) return cmd;
  return cmd.slice(0, maxLen - 3) + '...';
}

function defaultChipLabel(input: Record<string, unknown>): string {
  const json = JSON.stringify(input);
  if (json.length <= 40) return json;
  return json.slice(0, 37) + '...';
}

// ---------------------------------------------------------------------------
// Icon components (Lucide icons via createElement -- no JSX needed)
// ---------------------------------------------------------------------------

function BashIcon() {
  return createElement(Terminal, { size: 14 });
}
function ReadIcon() {
  return createElement(FileText, { size: 14 });
}
function EditIcon() {
  return createElement(FilePen, { size: 14 });
}
function WriteIcon() {
  return createElement(FilePlus, { size: 14 });
}
function GlobIcon() {
  return createElement(FolderSearch, { size: 14 });
}
function GrepIcon() {
  return createElement(Search, { size: 14 });
}
function DefaultIcon() {
  return createElement(Wrench, { size: 14 });
}

// ---------------------------------------------------------------------------
// Default tool card (fallback for unregistered tools)
// ---------------------------------------------------------------------------

function DefaultToolCard(props: ToolCardProps) {
  const { input, output, isError } = props;

  // Structured key-value rows for input
  const inputRows = Object.entries(input).map(([key, value]) => {
    const displayValue =
      typeof value === 'string'
        ? value
        : JSON.stringify(value, null, 2);

    return createElement(
      'div',
      { className: 'default-tool-card-row', key },
      createElement('span', { className: 'default-tool-card-key' }, key),
      createElement('span', { className: 'default-tool-card-value' }, displayValue),
    );
  });

  return createElement(
    'div',
    { className: 'tool-card default-tool-card' },
    createElement(
      'div',
      { className: 'tool-card-input' },
      ...inputRows,
    ),
    output != null
      ? createElement(
          'div',
          {
            className: isError
              ? 'tool-card-output tool-card-output--error default-tool-card-output default-tool-card-output--error'
              : 'tool-card-output default-tool-card-output',
          },
          createElement('pre', null, output),
        )
      : null,
  );
}

// ---------------------------------------------------------------------------
// Registry internals
// ---------------------------------------------------------------------------

const registry = new Map<string, ToolConfig>();

export function registerTool(toolName: string, config: ToolConfig): void {
  registry.set(toolName, config);
}

export function getToolConfig(toolName: string): ToolConfig {
  const config = registry.get(toolName);
  if (config) return config;

  // Default fallback -- never crashes, uses toolName as displayName
  return {
    displayName: toolName,
    icon: DefaultIcon,
    getChipLabel: defaultChipLabel,
    renderCard: DefaultToolCard,
  };
}

export function getRegisteredToolNames(): string[] {
  return [...registry.keys()];
}

// ---------------------------------------------------------------------------
// Chip label extractors (per-tool)
// ---------------------------------------------------------------------------

function bashChipLabel(input: Record<string, unknown>): string {
  const cmd = typeof input.command === 'string' ? input.command : null;
  if (!cmd) return 'Bash';
  return truncateCommand(cmd);
}

function filePathChipLabel(
  fallbackName: string,
  input: Record<string, unknown>,
): string {
  const fp = typeof input.file_path === 'string' ? input.file_path : null;
  if (!fp) return fallbackName;
  return truncatePath(fp);
}

function patternChipLabel(
  fallbackName: string,
  input: Record<string, unknown>,
): string {
  const pat = typeof input.pattern === 'string' ? input.pattern : null;
  if (!pat) return fallbackName;
  return pat.length > 40 ? pat.slice(0, 37) + '...' : pat;
}

// ---------------------------------------------------------------------------
// Self-registration at module scope
// ---------------------------------------------------------------------------

registerTool('Bash', {
  displayName: 'Bash',
  icon: BashIcon,
  getChipLabel: bashChipLabel,
  renderCard: BashToolCard,
});

registerTool('Read', {
  displayName: 'Read',
  icon: ReadIcon,
  getChipLabel: (input) => filePathChipLabel('Read', input),
  renderCard: ReadToolCard,
});

registerTool('Edit', {
  displayName: 'Edit',
  icon: EditIcon,
  getChipLabel: (input) => filePathChipLabel('Edit', input),
  renderCard: EditToolCard,
});

registerTool('Write', {
  displayName: 'Write',
  icon: WriteIcon,
  getChipLabel: (input) => filePathChipLabel('Write', input),
  renderCard: WriteToolCard,
});

registerTool('Glob', {
  displayName: 'Glob',
  icon: GlobIcon,
  getChipLabel: (input) => patternChipLabel('Glob', input),
  renderCard: GlobToolCard,
});

registerTool('Grep', {
  displayName: 'Grep',
  icon: GrepIcon,
  getChipLabel: (input) => patternChipLabel('Grep', input),
  renderCard: GrepToolCard,
});
