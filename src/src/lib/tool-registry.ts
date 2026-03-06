/**
 * Tool-call component registry -- pluggable config for any tool name.
 *
 * Pure TypeScript module with a Map-based registry. Components (icon, renderCard)
 * use createElement to avoid JSX requirement, keeping this as .ts not .tsx.
 *
 * 6 registered tools (Bash, Read, Edit, Write, Glob, Grep) self-register at
 * module scope. Unknown tools get a graceful default config.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { createElement } from 'react';
import type { ComponentType } from 'react';
import type { ToolCallStatus } from '@/types/stream';

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
// Icon components (createElement -- no JSX needed)
// ---------------------------------------------------------------------------

function BashIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\u25B6');
}
function ReadIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\uD83D\uDCC4');
}
function EditIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\u270F\uFE0F');
}
function WriteIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\uD83D\uDCDD');
}
function GlobIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\uD83D\uDD0D');
}
function GrepIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\uD83D\uDD0E');
}
function DefaultIcon() {
  return createElement('span', { className: 'tool-chip-icon' }, '\u2699\uFE0F');
}

// ---------------------------------------------------------------------------
// Default tool card (shared in M1 for all tools)
// ---------------------------------------------------------------------------

function DefaultToolCard(props: ToolCardProps) {
  const { input, output, isError } = props;

  // Show the most relevant input field, truncated
  const inputStr = JSON.stringify(input, null, 2);
  const truncatedInput =
    inputStr.length > 200 ? inputStr.slice(0, 197) + '...' : inputStr;

  const truncatedOutput =
    output && output.length > 500 ? output.slice(0, 497) + '...' : output;

  return createElement(
    'div',
    { className: 'tool-card' },
    createElement(
      'div',
      { className: 'tool-card-input' },
      createElement('pre', { style: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }, truncatedInput),
    ),
    truncatedOutput != null
      ? createElement(
          'div',
          {
            className: isError
              ? 'tool-card-output tool-card-output--error'
              : 'tool-card-output',
          },
          createElement('pre', { style: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }, truncatedOutput),
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
  renderCard: DefaultToolCard,
});

registerTool('Read', {
  displayName: 'Read',
  icon: ReadIcon,
  getChipLabel: (input) => filePathChipLabel('Read', input),
  renderCard: DefaultToolCard,
});

registerTool('Edit', {
  displayName: 'Edit',
  icon: EditIcon,
  getChipLabel: (input) => filePathChipLabel('Edit', input),
  renderCard: DefaultToolCard,
});

registerTool('Write', {
  displayName: 'Write',
  icon: WriteIcon,
  getChipLabel: (input) => filePathChipLabel('Write', input),
  renderCard: DefaultToolCard,
});

registerTool('Glob', {
  displayName: 'Glob',
  icon: GlobIcon,
  getChipLabel: (input) => patternChipLabel('Glob', input),
  renderCard: DefaultToolCard,
});

registerTool('Grep', {
  displayName: 'Grep',
  icon: GrepIcon,
  getChipLabel: (input) => patternChipLabel('Grep', input),
  renderCard: DefaultToolCard,
});
