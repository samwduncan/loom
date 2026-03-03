import React, { memo, useMemo } from 'react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import MessageComponent from './MessageComponent';
import { ToolCallGroup } from './ToolCallGroup';
import { TurnUsageFooter } from './TurnUsageFooter';
import { groupConsecutiveToolCalls } from '../../utils/groupConsecutiveToolCalls';
import type { Turn, ChatMessage } from '../../types/types';
import type { Project } from '../../../../types/app';
import type {
  ClaudePermissionSuggestion,
  PermissionGrantResult,
  Provider,
} from '../../types/types';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

interface TurnBlockMessageProps {
  createDiff: (oldStr: string, newStr: string) => DiffLine[];
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  onShowSettings?: () => void;
  onGrantToolPermission?: (suggestion: ClaudePermissionSuggestion) => PermissionGrantResult | null | undefined;
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  selectedProject?: Project | null;
  provider: Provider | string;
}

interface TurnBlockProps {
  turn: Turn;
  isExpanded: boolean;
  onToggle: () => void;
  messageProps: TurnBlockMessageProps;
  getMessageKey: (message: ChatMessage) => string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

const TurnBlock = memo(function TurnBlock({
  turn,
  isExpanded,
  onToggle,
  messageProps,
  getMessageKey,
}: TurnBlockProps) {
  // Skip empty turns
  if (turn.messages.length === 0) return null;

  // Group consecutive tool calls (3+) under summary headers
  const groupedItems = useMemo(
    () => groupConsecutiveToolCalls(turn.messages),
    [turn.messages]
  );

  const canCollapse = !turn.isStreaming;

  const handleToggle = () => {
    if (canCollapse) {
      onToggle();
    }
  };

  return (
    <div
      className={`turn-block rounded-lg transition-colors duration-200 ${
        turn.isStreaming
          ? 'border-l-2 border-amber-500 bg-amber-500/5 pl-2'
          : 'pl-0'
      }`}
    >
      {/* Turn header -- always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 px-3 sm:px-0 py-1.5 text-left group ${
          canCollapse ? 'cursor-pointer hover:bg-surface-raised/30 rounded' : 'cursor-default'
        }`}
        aria-expanded={isExpanded}
        disabled={!canCollapse}
      >
        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>

        {/* Provider logo */}
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 p-0.5">
          <SessionProviderLogo provider={messageProps.provider} className="w-full h-full" />
        </div>

        {/* First line of prose */}
        <span className="text-sm text-foreground-secondary truncate flex-1 min-w-0">
          {turn.firstProseContent}
        </span>

        {/* Tool call badge */}
        {turn.toolCallCount > 0 && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
              turn.failedToolCount > 0
                ? 'bg-status-error/30 text-status-error'
                : 'bg-surface-raised text-muted-foreground'
            }`}
          >
            {turn.failedToolCount > 0 ? (
              <>
                <span>{turn.toolCallCount} tools</span>
                <span className="text-status-error"> - {turn.failedToolCount} failed</span>
              </>
            ) : (
              <span>+{turn.toolCallCount} tool{turn.toolCallCount !== 1 ? 's' : ''}</span>
            )}
          </span>
        )}

        {/* Duration */}
        {!turn.isStreaming && turn.durationMs != null && turn.durationMs > 0 && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            took {formatDuration(turn.durationMs)}
          </span>
        )}
      </button>

      {/* Collapsible content with CSS grid animation */}
      <div
        className="collapsible-turn-content"
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms ease-out',
        }}
      >
        <div className="overflow-hidden">
          <div className="pt-1">
            {groupedItems.map((item, index) => {
              if (Array.isArray(item)) {
                // Grouped tool calls (3+ consecutive) -- render as ToolCallGroup
                const groupKey = item
                  .map((m) => getMessageKey(m))
                  .join('|');
                return (
                  <React.Fragment key={groupKey}>
                    {index > 0 && (
                      <div className="border-t border-border/8 mx-3" />
                    )}
                    <ToolCallGroup
                      messages={item}
                      messageProps={{
                        onFileOpen: messageProps.onFileOpen,
                        createDiff: messageProps.createDiff,
                        selectedProject: messageProps.selectedProject,
                        showRawParameters: messageProps.showRawParameters,
                      }}
                    />
                  </React.Fragment>
                );
              }

              // Individual message -- render normally
              const message = item;
              // Find the previous non-grouped message for context
              const prevItem = index > 0 ? groupedItems[index - 1] : null;
              const prevMessage = prevItem && !Array.isArray(prevItem) ? prevItem : null;
              return (
                <React.Fragment key={getMessageKey(message)}>
                  {index > 0 && (
                    <div className="border-t border-border/8 mx-3" />
                  )}
                  <MessageComponent
                    message={message}
                    index={index}
                    prevMessage={prevMessage}
                    createDiff={messageProps.createDiff}
                    onFileOpen={messageProps.onFileOpen}
                    onShowSettings={messageProps.onShowSettings}
                    onGrantToolPermission={messageProps.onGrantToolPermission}
                    autoExpandTools={messageProps.autoExpandTools}
                    showRawParameters={messageProps.showRawParameters}
                    showThinking={messageProps.showThinking}
                    selectedProject={messageProps.selectedProject}
                    provider={messageProps.provider}
                  />
                </React.Fragment>
              );
            })}

            {/* Usage footer -- always visible at bottom of completed turns */}
            {!turn.isStreaming && turn.usage && turn.model && (
              <TurnUsageFooter usage={turn.usage} model={turn.model} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom memo comparison for performance
  return (
    prevProps.turn.id === nextProps.turn.id &&
    prevProps.turn.isStreaming === nextProps.turn.isStreaming &&
    prevProps.turn.messages.length === nextProps.turn.messages.length &&
    prevProps.turn.toolCallCount === nextProps.turn.toolCallCount &&
    prevProps.turn.failedToolCount === nextProps.turn.failedToolCount &&
    prevProps.turn.usage === nextProps.turn.usage &&
    prevProps.turn.model === nextProps.turn.model &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.messageProps.provider === nextProps.messageProps.provider &&
    prevProps.messageProps.autoExpandTools === nextProps.messageProps.autoExpandTools &&
    prevProps.messageProps.showRawParameters === nextProps.messageProps.showRawParameters &&
    prevProps.messageProps.showThinking === nextProps.messageProps.showThinking
  );
});

export default TurnBlock;
