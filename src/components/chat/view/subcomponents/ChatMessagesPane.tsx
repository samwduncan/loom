import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import MessageComponent from './MessageComponent';
import TurnBlock from './TurnBlock';
import { TurnToolbar } from './TurnToolbar';
import ProviderSelectionEmptyState from './ProviderSelectionEmptyState';
import type { ChatMessage, Turn } from '../../types/types';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import AssistantThinkingIndicator from './AssistantThinkingIndicator';
import { useTurnGrouping } from '../../hooks/useTurnGrouping';
import { getIntrinsicMessageKey } from '../../utils/messageKeys';

interface ChatMessagesPaneProps {
  scrollContainerRef: RefObject<HTMLDivElement>;
  onWheel: () => void;
  onTouchMove: () => void;
  isLoadingSessionMessages: boolean;
  chatMessages: ChatMessage[];
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  provider: SessionProvider;
  setProvider: (provider: SessionProvider) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  codexModel: string;
  setCodexModel: (model: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  onShowAllTasks?: (() => void) | null;
  setInput: Dispatch<SetStateAction<string>>;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  totalMessages: number;
  sessionMessagesCount: number;
  visibleMessageCount: number;
  visibleMessages: ChatMessage[];
  loadEarlierMessages: () => void;
  loadAllMessages: () => void;
  allMessagesLoaded: boolean;
  isLoadingAllMessages: boolean;
  loadAllJustFinished: boolean;
  showLoadAllOverlay: boolean;
  createDiff: any;
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  onShowSettings?: () => void;
  onGrantToolPermission: (suggestion: { entry: string; toolName: string }) => { success: boolean };
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  selectedProject: Project;
  isLoading: boolean;
}

export default function ChatMessagesPane({
  scrollContainerRef,
  onWheel,
  onTouchMove,
  isLoadingSessionMessages,
  chatMessages,
  selectedSession,
  currentSessionId,
  provider,
  setProvider,
  textareaRef,
  claudeModel,
  setClaudeModel,
  codexModel,
  setCodexModel,
  geminiModel,
  setGeminiModel,
  tasksEnabled,
  isTaskMasterInstalled,
  onShowAllTasks,
  setInput,
  isLoadingMoreMessages,
  hasMoreMessages,
  totalMessages,
  sessionMessagesCount,
  visibleMessageCount,
  visibleMessages,
  loadEarlierMessages,
  loadAllMessages,
  allMessagesLoaded,
  isLoadingAllMessages,
  loadAllJustFinished,
  showLoadAllOverlay,
  createDiff,
  onFileOpen,
  onShowSettings,
  onGrantToolPermission,
  autoExpandTools,
  showRawParameters,
  showThinking,
  selectedProject,
  isLoading,
}: ChatMessagesPaneProps) {
  const messageKeyMapRef = useRef<WeakMap<ChatMessage, string>>(new WeakMap());
  const allocatedKeysRef = useRef<Set<string>>(new Set());
  const generatedMessageKeyCounterRef = useRef(0);

  // Keep keys stable across prepends so existing MessageComponent instances retain local state.
  const getMessageKey = useCallback((message: ChatMessage) => {
    const existingKey = messageKeyMapRef.current.get(message);
    if (existingKey) {
      return existingKey;
    }

    const intrinsicKey = getIntrinsicMessageKey(message);
    let candidateKey = intrinsicKey;

    if (!candidateKey || allocatedKeysRef.current.has(candidateKey)) {
      do {
        generatedMessageKeyCounterRef.current += 1;
        candidateKey = intrinsicKey
          ? `${intrinsicKey}-${generatedMessageKeyCounterRef.current}`
          : `message-generated-${generatedMessageKeyCounterRef.current}`;
      } while (allocatedKeysRef.current.has(candidateKey));
    }

    allocatedKeysRef.current.add(candidateKey);
    messageKeyMapRef.current.set(message, candidateKey);
    return candidateKey;
  }, []);

  // Turn grouping
  const { items, turnCount } = useTurnGrouping(visibleMessages);
  const [expandedTurns, setExpandedTurns] = useState<Set<string>>(new Set());
  const prevStreamingTurnIdRef = useRef<string | null>(null);

  // Auto-collapse previous turns when a new streaming turn starts
  const currentStreamingTurnId = useMemo(() => {
    for (const item of items) {
      if ('messages' in item && (item as Turn).isStreaming) {
        return (item as Turn).id;
      }
    }
    return null;
  }, [items]);

  useEffect(() => {
    if (
      currentStreamingTurnId &&
      currentStreamingTurnId !== prevStreamingTurnIdRef.current
    ) {
      // New streaming turn detected -- collapse all previous turns
      setExpandedTurns(new Set());
    }
    prevStreamingTurnIdRef.current = currentStreamingTurnId;
  }, [currentStreamingTurnId]);

  const handleTurnToggle = useCallback((turnId: string) => {
    setExpandedTurns((prev) => {
      const next = new Set(prev);
      if (next.has(turnId)) {
        next.delete(turnId);
      } else {
        next.add(turnId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allTurnIds = new Set<string>();
    for (const item of items) {
      if ('messages' in item) {
        allTurnIds.add((item as Turn).id);
      }
    }
    setExpandedTurns(allTurnIds);
  }, [items]);

  const handleCollapseAll = useCallback(() => {
    setExpandedTurns(new Set());
  }, []);

  const messageProps = useMemo(() => ({
    createDiff,
    onFileOpen,
    onShowSettings,
    onGrantToolPermission,
    autoExpandTools,
    showRawParameters,
    showThinking,
    selectedProject,
    provider,
  }), [createDiff, onFileOpen, onShowSettings, onGrantToolPermission, autoExpandTools, showRawParameters, showThinking, selectedProject, provider]);

  return (
    <div
      ref={scrollContainerRef}
      onWheel={onWheel}
      onTouchMove={onTouchMove}
      className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-3 sm:p-4 space-y-3 sm:space-y-4 relative"
    >
      {isLoadingSessionMessages && chatMessages.length === 0 ? (
        <div className="text-center text-gray-500 text-gray-400 mt-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
            <p>Loading session messages...</p>
          </div>
        </div>
      ) : chatMessages.length === 0 ? (
        <ProviderSelectionEmptyState
          selectedSession={selectedSession}
          currentSessionId={currentSessionId}
          provider={provider}
          setProvider={setProvider}
          textareaRef={textareaRef}
          claudeModel={claudeModel}
          setClaudeModel={setClaudeModel}
          codexModel={codexModel}
          setCodexModel={setCodexModel}
          geminiModel={geminiModel}
          setGeminiModel={setGeminiModel}
          tasksEnabled={tasksEnabled}
          isTaskMasterInstalled={isTaskMasterInstalled}
          onShowAllTasks={onShowAllTasks}
          setInput={setInput}
        />
      ) : (
        <>
          {/* Loading indicator for older messages (hide when load-all is active) */}
          {isLoadingMoreMessages && !isLoadingAllMessages && !allMessagesLoaded && (
            <div className="text-center text-gray-500 text-gray-400 py-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                <p className="text-sm">Loading older messages...</p>
              </div>
            </div>
          )}

          {/* Indicator showing there are more messages to load (hide when all loaded) */}
          {hasMoreMessages && !isLoadingMoreMessages && !allMessagesLoaded && (
            <div className="text-center text-gray-500 text-gray-400 text-sm py-2 border-b border-gray-200 border-gray-700">
              {totalMessages > 0 && (
                <span>
                  {`Showing ${sessionMessagesCount} of ${totalMessages} messages`}{' '}
                  <span className="text-xs">Scroll up to load more</span>
                </span>
              )}
            </div>
          )}

          {/* Floating "Load all messages" overlay */}
          {(showLoadAllOverlay || isLoadingAllMessages || loadAllJustFinished) && (
            <div className="sticky top-2 z-20 flex justify-center pointer-events-none">
              {loadAllJustFinished ? (
                <div className="px-4 py-1.5 text-xs font-medium text-white bg-green-600 bg-green-500 rounded-full shadow-lg flex items-center space-x-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All messages loaded</span>
                </div>
              ) : (
                <button
                  className="pointer-events-auto px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-75 disabled:cursor-wait flex items-center space-x-2"
                  onClick={loadAllMessages}
                  disabled={isLoadingAllMessages}
                >
                  {isLoadingAllMessages && (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
                  )}
                  <span>
                    {isLoadingAllMessages
                      ? 'Loading all messages...'
                      : <>Load all messages {totalMessages > 0 && `(${totalMessages})`}</>
                    }
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Performance warning when all messages are loaded */}
          {allMessagesLoaded && (
            <div className="text-center text-amber-600 text-amber-400 text-xs py-1.5 bg-amber-50 bg-amber-900/20 border-b border-amber-200 border-amber-800">
              All messages loaded — scrolling may be slower. Click "Scroll to bottom" to restore performance.
            </div>
          )}

          {/* Legacy message count indicator (for non-paginated view) */}
          {!hasMoreMessages && chatMessages.length > visibleMessageCount && (
            <div className="text-center text-gray-500 text-gray-400 text-sm py-2 border-b border-gray-200 border-gray-700">
              {`Showing last ${visibleMessageCount} messages (${chatMessages.length} total)`} |
              <button className="ml-1 text-blue-600 hover:text-blue-700 underline" onClick={loadEarlierMessages}>
                Load earlier messages
              </button>
              {' | '}
              <button
                className="text-blue-600 hover:text-blue-700 text-blue-400 hover:text-blue-300 underline"
                onClick={loadAllMessages}
              >
                Load all messages
              </button>
            </div>
          )}

          {/* Turn toolbar */}
          <TurnToolbar
            turnCount={turnCount}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />

          {items.map((item) => {
            if ('messages' in item) {
              // It's a Turn
              const turn = item as Turn;
              const isExpanded = turn.isStreaming || expandedTurns.has(turn.id);
              return (
                <TurnBlock
                  key={turn.id}
                  turn={turn}
                  isExpanded={isExpanded}
                  onToggle={() => handleTurnToggle(turn.id)}
                  messageProps={messageProps}
                  getMessageKey={getMessageKey}
                />
              );
            } else {
              // Standalone user message
              const message = item as ChatMessage;
              return (
                <MessageComponent
                  key={getMessageKey(message)}
                  message={message}
                  index={0}
                  prevMessage={null}
                  createDiff={createDiff}
                  onFileOpen={onFileOpen}
                  onShowSettings={onShowSettings}
                  onGrantToolPermission={onGrantToolPermission}
                  autoExpandTools={autoExpandTools}
                  showRawParameters={showRawParameters}
                  showThinking={showThinking}
                  selectedProject={selectedProject}
                  provider={provider}
                />
              );
            }
          })}
        </>
      )}

      {isLoading && <AssistantThinkingIndicator selectedProvider={provider} />}
    </div>
  );
}

