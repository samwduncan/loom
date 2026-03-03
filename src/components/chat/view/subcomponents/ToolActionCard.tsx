import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  FileEdit,
  Search,
  Terminal,
  ListTodo,
  ListChecks,
  Bot,
  Wrench,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getToolConfig } from '../../tools/configs/toolConfigs';
import { getToolCategory } from '../../tools/ToolRenderer';
import { Markdown } from './Markdown';
import type { ToolResult } from '../../types/types';
import type { Project } from '../../../../types/app';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

interface ToolActionCardProps {
  toolName: string;
  toolInput: unknown;
  toolResult?: ToolResult | null;
  toolId?: string;
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  createDiff?: (oldStr: string, newStr: string) => DiffLine[];
  selectedProject?: Project | null;
  showRawParameters?: boolean;
  /**
   * Permission suggestion UI rendered externally and passed in to avoid
   * coupling ToolActionCard to the permission system.
   */
  permissionUI?: React.ReactNode;
}

// Icon map per tool category
const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
  edit: FileEdit,
  search: Search,
  bash: Terminal,
  todo: ListTodo,
  task: ListChecks,
  agent: Bot,
  default: Wrench,
};

// Background tint per tool category
const categoryBg: Record<string, string> = {
  edit: 'bg-blue-500/5',
  bash: 'bg-muted/5',
  search: 'bg-purple-500/5',
  todo: 'bg-violet-500/5',
  agent: 'bg-purple-500/[0.08]',
  default: 'bg-muted/[0.03]',
};

/**
 * Extract the key argument for the compact single-line display.
 * Falls back to the getValue from toolConfigs, with truncation for long values.
 */
function getCompactValue(toolName: string, toolInput: unknown): string {
  const config = getToolConfig(toolName);
  const parsed =
    typeof toolInput === 'string'
      ? (() => {
          try {
            return JSON.parse(toolInput);
          } catch {
            return toolInput;
          }
        })()
      : toolInput;

  // For edit/write tools, show filename only
  if (['Edit', 'Write', 'ApplyPatch'].includes(toolName)) {
    const filePath = (parsed as any)?.file_path || '';
    return filePath.split('/').pop() || filePath;
  }

  // Use the existing config getValue if available
  if (config.input.getValue) {
    const val = config.input.getValue(parsed);
    if (val && val.length > 60) {
      return val.slice(0, 57) + '...';
    }
    return val || '';
  }

  return '';
}

/**
 * Format the expanded tool input for display.
 */
function formatToolInput(toolName: string, toolInput: unknown): string {
  const parsed =
    typeof toolInput === 'string'
      ? (() => {
          try {
            return JSON.parse(toolInput);
          } catch {
            return toolInput;
          }
        })()
      : toolInput;

  if (typeof parsed === 'object' && parsed !== null) {
    return JSON.stringify(parsed, null, 2);
  }
  return String(parsed || '');
}

/**
 * Unified compact tool action card with expand/collapse.
 *
 * Renders as a single-line card showing icon + tool name + key argument + status.
 * Clicking expands to reveal full input and result inline.
 * Uses CSS grid 0fr/1fr animation for smooth height transitions.
 */
export const ToolActionCard: React.FC<ToolActionCardProps> = memo(
  ({
    toolName,
    toolInput,
    toolResult,
    toolId,
    onFileOpen,
    createDiff,
    selectedProject,
    showRawParameters,
    permissionUI,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const category = useMemo(() => getToolCategory(toolName), [toolName]);
    const IconComponent = categoryIcons[category] || categoryIcons.default;
    const bgTint = categoryBg[category] || categoryBg.default;
    const compactValue = useMemo(
      () => getCompactValue(toolName, toolInput),
      [toolName, toolInput]
    );

    const isError = toolResult?.isError === true;
    const hasResult = toolResult != null;

    const handleToggle = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    // Build error border class
    const errorBorder = isError ? 'border-l-2 border-red-500' : '';

    return (
      <div
        className={`rounded-md ${bgTint} ${errorBorder} my-0.5`}
      >
        {/* Compact header -- clickable single line */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left select-none group/card hover:bg-white/5 rounded-md transition-colors"
          aria-expanded={isExpanded}
          aria-controls={toolId ? `tool-detail-${toolId}` : undefined}
        >
          {/* Expand chevron */}
          <ChevronRight
            className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />

          {/* Category icon */}
          <IconComponent className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

          {/* Tool name */}
          <span className="text-xs font-medium text-foreground-secondary flex-shrink-0">
            {toolName}
          </span>

          {/* Key argument */}
          {compactValue && (
            <span className="text-xs font-mono text-muted-foreground truncate min-w-0 flex-1">
              {compactValue}
            </span>
          )}

          {/* Status icon */}
          <span className="flex-shrink-0 ml-auto">
            {hasResult && !isError && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            )}
            {hasResult && isError && (
              <XCircle className="w-3.5 h-3.5 text-red-500" />
            )}
          </span>
        </button>

        {/* Expanded detail pane with CSS grid animation */}
        <div
          id={toolId ? `tool-detail-${toolId}` : undefined}
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 200ms ease-out',
          }}
        >
          <div className="overflow-hidden">
            <div className="px-2 pb-2 pt-1 ml-5 border-l border-border/10">
              {/* Full tool input */}
              <div className="mb-2">
                <div className="text-[11px] text-muted-foreground mb-0.5 font-medium">
                  Input
                </div>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words bg-surface-base/30 rounded p-2 max-h-64 overflow-y-auto">
                  {formatToolInput(toolName, toolInput)}
                </pre>
              </div>

              {/* Tool result */}
              {toolResult && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-0.5 font-medium">
                    Result
                  </div>
                  {isError ? (
                    <div className="bg-red-950/20 border border-red-800/40 rounded p-2">
                      <Markdown className="prose prose-sm max-w-none prose-red prose-invert text-xs">
                        {String(toolResult.content || '')}
                      </Markdown>
                      {permissionUI}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-surface-base/30 rounded p-2 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words font-mono">
                        {typeof toolResult.content === 'string'
                          ? toolResult.content.length > 2000
                            ? toolResult.content.slice(0, 2000) + '\n... (truncated)'
                            : toolResult.content
                          : JSON.stringify(toolResult.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ToolActionCard.displayName = 'ToolActionCard';
