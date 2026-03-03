import React, { memo, useMemo, useState } from 'react';
import { Copy, Check, HelpCircle, XCircle } from 'lucide-react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type {
  ChatMessage,
  ClaudePermissionSuggestion,
  PermissionGrantResult,
  Provider,
} from '../../types/types';
import { Markdown } from './Markdown';
import { ThinkingDisclosure } from './ThinkingDisclosure';
import { ToolActionCard } from './ToolActionCard';
import { SystemStatusMessage } from './SystemStatusMessage';
import type { StatusTier } from './SystemStatusMessage';
import { formatUsageLimitText } from '../../utils/chatFormatting';
import { getClaudePermissionSuggestion } from '../../utils/chatPermissions';
import { copyTextToClipboard } from '../../../../utils/clipboard';
import type { Project } from '../../../../types/app';
import { ToolRenderer, shouldHideToolResult } from '../../tools';
import { ImageLightbox } from './ImageLightbox';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

interface MessageComponentProps {
  message: ChatMessage;
  index: number;
  prevMessage: ChatMessage | null;
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

type InteractiveOption = {
  number: string;
  text: string;
  isSelected: boolean;
};

type PermissionGrantState = 'idle' | 'granted' | 'error';

const MessageComponent = memo(({ message, index, prevMessage, createDiff, onFileOpen, onShowSettings, onGrantToolPermission, autoExpandTools, showRawParameters, showThinking, selectedProject, provider }: MessageComponentProps) => {
  const isGrouped = prevMessage && prevMessage.type === message.type &&
    ((prevMessage.type === 'assistant') ||
      (prevMessage.type === 'user') ||
      (prevMessage.type === 'tool') ||
      (prevMessage.type === 'error'));
  const messageRef = React.useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const permissionSuggestion = getClaudePermissionSuggestion(message, provider);
  const [permissionGrantState, setPermissionGrantState] = React.useState<PermissionGrantState>('idle');
  const [messageCopied, setMessageCopied] = React.useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);


  React.useEffect(() => {
    setPermissionGrantState('idle');
  }, [permissionSuggestion?.entry, message.toolId]);

  React.useEffect(() => {
    const node = messageRef.current;
    if (!autoExpandTools || !node || !message.isToolUse) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isExpanded) {
            setIsExpanded(true);
            const details = node.querySelectorAll<HTMLDetailsElement>('details');
            details.forEach((detail) => {
              detail.open = true;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [autoExpandTools, isExpanded, message.isToolUse]);

  const formattedTime = useMemo(() => new Date(message.timestamp).toLocaleTimeString(), [message.timestamp]);
  const shouldHideThinkingMessage = Boolean(message.isThinking && !showThinking);

  if (shouldHideThinkingMessage) {
    return null;
  }

  // System status messages -- render as muted inline status
  if (message.type === 'system' || (message.type === 'info' && !message.isToolUse)) {
    const tier: StatusTier = (message.content || '').toLowerCase().includes('error') ? 'error'
      : (message.content || '').toLowerCase().includes('warning') ? 'warning'
      : 'info';
    return (
      <div className="px-3 sm:px-0 my-1">
        <SystemStatusMessage
          tier={tier}
          content={String(message.content || '')}
          timestamp={formattedTime}
        />
      </div>
    );
  }

  // Error messages (non-tool) -- inline terracotta banner
  if (message.type === 'error' && !message.isToolUse) {
    const content = String(message.content || '');
    const lines = content.split('\n');
    const isLongError = lines.length > 3;
    return (
      <div className="px-3 sm:px-0 my-1">
        <div className="rounded-lg border-l-[3px] border-l-status-error bg-status-error/8 px-3 py-2">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-status-error flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground font-mono whitespace-pre-wrap">
              {isLongError ? lines.slice(0, 3).join('\n') : content}
            </div>
          </div>
          {isLongError && (
            <details className="mt-1">
              <summary className="text-[10px] text-status-error/60 cursor-pointer hover:text-status-error/80">
                Show full error ({lines.length} lines)
              </summary>
              <pre className="mt-1 text-xs text-foreground/80 font-mono whitespace-pre-wrap overflow-x-auto">
                {content}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`chat-message ${message.type} ${isGrouped ? 'grouped' : ''} ${message.type === 'user' ? 'flex justify-end px-3 sm:px-0' : 'px-3 sm:px-0'}`}
    >
      {message.type === 'user' ? (
        /* User message -- warm amber tint, right-aligned, no avatar */
        <div className="relative group max-w-[85%] sm:max-w-[75%] flex items-start gap-1.5">
          <div className="bg-amber-900/15 text-foreground rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm leading-relaxed break-words border border-amber-700/20 flex-1">
            <div className="text-[10px] text-muted-foreground/60 mb-0.5">{formattedTime}</div>
            {message.images && message.images.length > 0 && (
              <div className="mt-1 mb-2 grid grid-cols-2 gap-2">
                {message.images.map((img, idx) => (
                  <button
                    key={img.name || idx}
                    type="button"
                    onClick={() => setLightboxSrc(img.data)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={img.data}
                      alt={img.name || `Attached image ${idx + 1}`}
                      className="max-w-[200px] max-h-[150px] rounded-md object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          {/* Copy button -- hover reveal, positioned outside message */}
          <button
            type="button"
            onClick={() => {
              const text = String(message.content || '');
              copyTextToClipboard(text).then((success) => {
                if (!success) return;
                setMessageCopied(true);
                setTimeout(() => setMessageCopied(false), 2000);
              });
            }}
            className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex-shrink-0 self-center p-1 rounded hover:bg-surface-elevated/50 text-muted-foreground/50 hover:text-muted-foreground"
            title={messageCopied ? "Message copied" : "Copy message"}
            aria-label={messageCopied ? "Message copied" : "Copy message"}
          >
            {messageCopied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ) : message.isTaskNotification ? (
        /* Compact task notification on the left */
        <div className="w-full">
          <div className="flex items-center gap-2 py-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${message.taskStatus === 'completed' ? 'bg-status-connected' : 'bg-status-reconnecting'}`} />
            <span className="text-xs text-muted-foreground">{message.content}</span>
          </div>
        </div>
      ) : (
        /* Claude/Error/Tool messages on the left */
        <div className="w-full">
          {!isGrouped && (
            <div className="flex items-center space-x-3 mb-2">
              {message.type === 'error' ? (
                <div className="w-8 h-8 bg-status-error rounded-full flex items-center justify-center text-foreground text-sm flex-shrink-0">
                  !
                </div>
              ) : message.type === 'tool' ? (
                <div className="w-8 h-8 bg-surface-elevated rounded-full flex items-center justify-center text-foreground text-sm flex-shrink-0">
                  🔧
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-sm flex-shrink-0 p-1">
                  <SessionProviderLogo provider={provider} className="w-full h-full" />
                </div>
              )}
              <div className="text-sm font-medium text-foreground">
                {message.type === 'error' ? 'Error' : message.type === 'tool' ? 'Tool' : (provider === 'codex' ? 'Codex' : provider === 'gemini' ? 'Gemini' : 'Claude')}
              </div>
            </div>
          )}

          <div className="w-full">

            {message.isToolUse ? (
              <>
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <Markdown className="prose prose-sm max-w-none prose-invert">
                      {String(message.displayText || '')}
                    </Markdown>
                  </div>
                </div>

                {/* Subagent containers use their dedicated SubagentContainer component via ToolRenderer */}
                {message.isSubagentContainer && message.toolInput && (
                  <ToolRenderer
                    toolName={message.toolName || 'UnknownTool'}
                    toolInput={message.toolInput}
                    toolResult={message.toolResult}
                    toolId={message.toolId}
                    mode="input"
                    onFileOpen={onFileOpen}
                    createDiff={createDiff}
                    selectedProject={selectedProject}
                    autoExpandTools={autoExpandTools}
                    showRawParameters={showRawParameters}
                    rawToolInput={typeof message.toolInput === 'string' ? message.toolInput : undefined}
                    isSubagentContainer={message.isSubagentContainer}
                    subagentState={message.subagentState}
                  />
                )}

                {/* Non-subagent tool calls: unified ToolActionCard handles input + result display */}
                {!message.isSubagentContainer && message.toolInput && (
                  <ToolActionCard
                    toolName={message.toolName || 'UnknownTool'}
                    toolInput={message.toolInput}
                    toolResult={message.toolResult}
                    toolId={message.toolId}
                    onFileOpen={onFileOpen}
                    createDiff={createDiff}
                    selectedProject={selectedProject}
                    showRawParameters={showRawParameters}
                    permissionUI={
                      permissionSuggestion && message.toolResult?.isError ? (
                        <div className="mt-3 border-t border-red-800/60 pt-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!onGrantToolPermission) return;
                                const result = onGrantToolPermission(permissionSuggestion);
                                if (result?.success) {
                                  setPermissionGrantState('granted');
                                } else {
                                  setPermissionGrantState('error');
                                }
                              }}
                              disabled={permissionSuggestion.isAllowed || permissionGrantState === 'granted'}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                                ? 'bg-status-connected/30 border-status-connected/60 text-foreground cursor-default'
                                : 'bg-surface-base/40 border-status-error/60 text-foreground hover:bg-surface-base/70'
                                }`}
                            >
                              {permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                                ? 'Permission added'
                                : `Grant permission for ${permissionSuggestion.toolName}`}
                            </button>
                            {onShowSettings && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onShowSettings(); }}
                                className="text-xs text-status-error underline hover:text-foreground"
                              >
                                Open settings
                              </button>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-foreground/80">
                            {`Adds ${permissionSuggestion.entry} to Allowed Tools.`}
                          </div>
                          {permissionGrantState === 'error' && (
                            <div className="mt-2 text-xs text-status-error">
                              Unable to update permissions. Please try again.
                            </div>
                          )}
                          {(permissionSuggestion.isAllowed || permissionGrantState === 'granted') && (
                            <div className="mt-2 text-xs text-status-connected">
                              Permission saved. Retry the request to use the tool.
                            </div>
                          )}
                        </div>
                      ) : undefined
                    }
                  />
                )}
              </>
            ) : message.isInteractivePrompt ? (
              // -----------------------------------------------------------------------
              // DEAD CODE PATH: Interactive prompt display card
              //
              // The 'claude-interactive-prompt' message type is NEVER sent by the server.
              // Interactive prompts are handled via the AskUserQuestion tool through the
              // SDK's canUseTool permission system. The actual user interaction happens in
              // AskUserQuestionPanel (rendered by PermissionRequestsBanner), NOT here.
              //
              // This card exists as a display-only historical record in case the message
              // type is enabled in the future. Buttons are intentionally disabled since
              // no websocket handler exists for this code path and none is needed.
              //
              // See: plan 06-06 backend investigation for full analysis.
              // See: PermissionRequestsBanner > AskUserQuestionPanel for live interaction.
              // -----------------------------------------------------------------------
              <div className="bg-surface-raised border border-status-reconnecting/40 border-l-3 border-l-status-reconnecting rounded-lg p-4">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-status-reconnecting flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm mb-2">
                      Interactive Prompt
                    </h4>
                    {(() => {
                      const lines = (message.content || '').split('\n').filter((line) => line.trim());
                      const questionLine = lines.find((line) => line.includes('?')) || lines[0] || '';
                      const options: InteractiveOption[] = [];

                      // Parse the menu options
                      lines.forEach((line) => {
                        // Match lines like "❯ 1. Yes" or "  2. No"
                        const optionMatch = line.match(/[❯\s]*(\d+)\.\s+(.+)/);
                        if (optionMatch) {
                          const isSelected = line.includes('❯');
                          options.push({
                            number: optionMatch[1],
                            text: optionMatch[2].trim(),
                            isSelected
                          });
                        }
                      });

                      return (
                        <>
                          <p className="text-sm text-muted-foreground mb-3">
                            {questionLine}
                          </p>

                          {/* Option buttons -- disabled (dead code path). Interactive responses
                              are handled via AskUserQuestionPanel in PermissionRequestsBanner,
                              not through this display card. See comment block above. */}
                          <div className="space-y-1.5 mb-3">
                            {options.map((option) => (
                              <button
                                key={option.number}
                                className={`w-full text-left px-3 py-2 rounded-md border transition-all text-sm ${
                                  option.isSelected
                                    ? 'bg-status-reconnecting/20 text-foreground border-status-reconnecting/60'
                                    : 'bg-surface-base text-muted-foreground border-border/10 hover:border-status-reconnecting/40 hover:bg-status-reconnecting/10'
                                } cursor-not-allowed opacity-75`}
                                disabled
                              >
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-status-reconnecting/20 text-status-reconnecting">
                                    {option.number}
                                  </span>
                                  <span className="font-medium flex-1">{option.text}</span>
                                </div>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-3 text-xs text-status-reconnecting/60">
                            <div className="w-2 h-2 rounded-full bg-status-reconnecting/60 animate-pulse" />
                            <span>Waiting for response...</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : message.isThinking ? (
              /* Thinking messages - ThinkingDisclosure with smooth animation */
              <div className="text-sm text-foreground-secondary">
                <ThinkingDisclosure
                  content={message.content || ''}
                  isStreaming={message.isStreaming}
                  showByDefault={showThinking}
                />
              </div>
            ) : (
              <div className="text-sm text-foreground-secondary">
                {/* Thinking disclosure for reasoning */}
                {message.reasoning && (
                  <ThinkingDisclosure
                    content={message.reasoning}
                    isStreaming={false}
                    showByDefault={showThinking}
                  />
                )}

                {(() => {
                  const content = formatUsageLimitText(String(message.content || ''));

                  // Detect if content is pure JSON (starts with { or [)
                  const trimmedContent = content.trim();
                  if ((trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) &&
                    (trimmedContent.endsWith('}') || trimmedContent.endsWith(']'))) {
                    try {
                      const parsed = JSON.parse(trimmedContent);
                      const formatted = JSON.stringify(parsed, null, 2);

                      return (
                        <div className="my-2">
                          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">JSON Response</span>
                          </div>
                          <div className="bg-surface-raised border border-border/10 rounded-lg overflow-hidden">
                            <pre className="p-4 overflow-x-auto">
                              <code className="text-foreground text-sm font-mono block whitespace-pre">
                                {formatted}
                              </code>
                            </pre>
                          </div>
                        </div>
                      );
                    } catch {
                      // Not valid JSON, fall through to normal rendering
                    }
                  }

                  // Normal rendering for non-JSON content
                  return message.type === 'assistant' ? (
                    <Markdown className="prose prose-sm max-w-none prose-invert prose-gray" isStreaming={message.isStreaming}>
                      {content}
                    </Markdown>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {content}
                    </div>
                  );
                })()}
              </div>
            )}

            {!isGrouped && (
              <div className="text-[11px] text-muted-foreground mt-1">
                {formattedTime}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image lightbox overlay */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
});

export default MessageComponent;

