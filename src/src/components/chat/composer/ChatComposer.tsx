/**
 * ChatComposer -- multiline floating pill composer with send/stop FSM.
 *
 * Replaces M1 single-line input. Auto-resize textarea, 5-state send/stop
 * morph, keyboard shortcuts (Enter/Shift+Enter/Escape/Cmd+.), message
 * queuing during streaming, floating pill layout, and @ file mentions.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2), cn() (3.6).
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Square } from 'lucide-react';
import { cn } from '@/utils/cn';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import { useUIStore } from '@/stores/ui';
import { useAutoResize } from './useAutoResize';
import { useComposerState } from './useComposerState';
import { useDraftPersistence } from './useDraftPersistence';
import { useImageAttachments } from './useImageAttachments';
import { useFileMentions } from '@/hooks/useFileMentions';
import { extractSessionTitle } from '@/lib/extract-session-title';
import { useSlashCommands } from '@/hooks/useSlashCommands';
import { ComposerKeyboardHints } from './ComposerKeyboardHints';
import { ImagePreviewRow } from './ImagePreviewRow';
import { MentionChipRow } from './MentionChipRow';
import { MentionPicker } from './MentionPicker';
import { SlashCommandPicker } from './SlashCommandPicker';
import { DragOverlay } from './DragOverlay';
import { ComposerStatusBar } from './ComposerStatusBar';
import { ElectricBorder } from '@/components/effects/ElectricBorder';
import type { FileMention } from '@/types/mention';
import type { SlashCommand } from '@/types/slash-command';
import type { Message } from '@/types/message';
import type { ClaudeCommandOptions } from '@/types/websocket';
import './composer.css';

interface ChatComposerProps {
  projectName: string;
  sessionId: string | null;
  /** Scroll container ref for scroll-position stability during resize */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Text from suggestion chip click -- populates input when set */
  suggestionText?: string | null;
}

export function ChatComposer({ projectName, sessionId, scrollContainerRef, suggestionText }: ChatComposerProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [mentions, setMentions] = useState<FileMention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;
  const pendingTitleRef = useRef<string | null>(null);
  const hasMessageSentRef = useRef(false);
  const prevSessionIdRef = useRef<string | null>(sessionId);

  // Draft persistence
  const { saveDraft, loadDraft, clearDraft } = useDraftPersistence();

  // Stream store selectors
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const streamSessionId = useStreamStore((s) => s.activeSessionId);

  // UI store selectors
  const permissionMode = useUIStore((s) => s.permissionMode);

  // Timeline store selectors
  const addMessage = useTimelineStore((s) => s.addMessage);
  const addSession = useTimelineStore((s) => s.addSession);
  const updateSessionTitle = useTimelineStore((s) => s.updateSessionTitle);
  const clearSession = useTimelineStore((s) => s.clearSession);

  // FSM
  const { state: composerState, dispatch, canSend, canStop } = useComposerState();

  // Image attachments
  const {
    attachments,
    removeImage,
    clearAll: clearImages,
    getBase64ForSend,
    addFromClipboard,
    addFromDrop,
  } = useImageAttachments();

  // File mentions
  const {
    isOpen: mentionPickerOpen,
    results: mentionResults,
    selectedIndex: mentionSelectedIndex,
    isLoading: mentionLoading,
    detectAndOpen,
    close: closeMentionPicker,
    moveUp: mentionMoveUp,
    moveDown: mentionMoveDown,
    selectCurrent: mentionSelectCurrent,
  } = useFileMentions({ enabled: true, projectName });

  // Slash commands
  const {
    isOpen: slashPickerOpen,
    results: slashResults,
    selectedIndex: slashSelectedIndex,
    detectAndOpen: slashDetectAndOpen,
    close: closeSlashPicker,
    moveUp: slashMoveUp,
    moveDown: slashMoveDown,
    selectCurrent: slashSelectCurrent,
  } = useSlashCommands();

  // Drag-and-drop overlay state (dragCounter pattern prevents flicker)
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Populate input from suggestion chip click
  useEffect(() => {
    if (suggestionText) {
      setInput(suggestionText);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [suggestionText]);

  // Scroll stability: capture scroll position BEFORE React re-renders and
  // useAutoResize fires its useLayoutEffect. We store the snapshot in a ref
  // so the restore layout effect can compare against the pre-resize state.
  const prevScrollRef = useRef<{ top: number; height: number } | null>(null);

  // Auto-resize textarea
  useAutoResize(textareaRef, input, 200);

  // Restore scroll position after auto-resize layout effect has fired
  useLayoutEffect(() => {
    const container = scrollContainerRef?.current;
    const prev = prevScrollRef.current;
    if (container && prev) {
      const heightDelta = container.scrollHeight - prev.height;
      if (heightDelta !== 0) {
        container.scrollTop = prev.top + heightDelta;
      }
    }
    prevScrollRef.current = null;
  });

  // When a new chat session is created, update sidebar title
  useEffect(() => {
    if (streamSessionId && pendingTitleRef.current) {
      updateSessionTitle(streamSessionId, pendingTitleRef.current);
      pendingTitleRef.current = null;
    }
  }, [streamSessionId, updateSessionTitle]);

  // Draft persistence: save old session draft, restore new session draft on switch
  useEffect(() => {
    const prevId = prevSessionIdRef.current;
    if (prevId !== sessionId) {
      // Save draft for the session we're leaving
      if (prevId) {
        saveDraft(prevId, input);
      }
      // Load draft for the session we're entering
      if (sessionId) {
        setInput(loadDraft(sessionId));
      } else {
        setInput('');
      }
      prevSessionIdRef.current = sessionId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, saveDraft, loadDraft]);

  // On mount: load draft for initial session
  useEffect(() => {
    if (sessionId) {
      const draft = loadDraft(sessionId);
      if (draft) setInput(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus on session switch
  useEffect(() => {
    textareaRef.current?.focus();
  }, [sessionId]);

  // Global Cmd+. / Ctrl+. keyboard shortcut for stop
  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        if (!canStop) return;
        e.preventDefault();
        handleStop();
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStop, streamSessionId]);

  // Keyboard avoidance fallback for browsers without interactive-widget support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    function handleResize() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      // When keyboard is open, visualViewport.height < window.innerHeight
      const keyboardHeight = window.innerHeight - viewport.height;
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        keyboardHeight > 50 ? `${keyboardHeight}px` : '0px',
      );
    }

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  // Handle mention selection: add to mentions array, remove @query from input
  const handleMentionSelect = useCallback(
    (file: FileMention | null) => {
      if (!file) return;

      // Deduplicate by path
      setMentions((prev) => {
        if (prev.some((m) => m.path === file.path)) return prev;
        return [...prev, file];
      });

      // Remove the @query text from input (read from ref to avoid stale closure)
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const currentInput = inputRef.current;
        const before = currentInput.slice(0, cursorPos);
        const after = currentInput.slice(cursorPos);

        // Find the @ position by scanning backward
        const atIndex = before.lastIndexOf('@');
        if (atIndex !== -1) {
          const newInput = before.slice(0, atIndex) + after;
          setInput(newInput);
        }
      }

      closeMentionPicker();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [closeMentionPicker],
  );

  // Handle slash command selection: execute the command action
  const handleSlashSelect = useCallback(
    (cmd: SlashCommand | null) => {
      if (!cmd) return;

      setInput('');
      closeSlashPicker();

      const effectiveId = sessionId ?? streamSessionId;
      if (!effectiveId) {
        requestAnimationFrame(() => textareaRef.current?.focus());
        return;
      }

      if (cmd.id === 'clear') {
        clearSession(effectiveId);
      } else {
        wsClient.send({
          type: 'claude-command',
          command: `/${cmd.id}`,
          options: { projectPath: projectName, sessionId: effectiveId },
        });
      }

      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [sessionId, streamSessionId, projectName, clearSession, closeSlashPicker],
  );

  // Remove a mention chip
  const handleRemoveMention = useCallback((path: string) => {
    setMentions((prev) => prev.filter((m) => m.path !== path));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    const hasImages = attachments.length > 0;
    if (!trimmed && !hasImages) return;

    // Command text is always the user's raw input — file content injection
    // happens server-side via the fileMentions field in options.
    const commandText = trimmed;

    // Message queuing during streaming: send immediately, add optimistic with queued flag
    if (isStreaming) {
      const effectiveId = sessionId ?? streamSessionId;
      if (!effectiveId) return;

      const options: ClaudeCommandOptions = { projectPath: projectName };
      options.sessionId = effectiveId;
      if (permissionMode !== 'default') options.permissionMode = permissionMode;

      // Include images if attached (convert to base64)
      if (hasImages) {
        options.images = await getBase64ForSend();
      }

      // Include file mentions for server-side content injection
      if (mentions.length > 0) {
        options.fileMentions = mentions.map((m) => m.path);
      }

      wsClient.send({
        type: 'claude-command',
        command: commandText,
        options,
      });

      const queuedMessage: Message = {
        id: Math.random().toString(36).slice(2, 10),
        role: 'user',
        content: trimmed,
        metadata: {
          timestamp: new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cost: null,
          duration: null,
          queued: true,
        },
        providerContext: {
          providerId: 'claude',
          modelId: '',
          agentName: null,
        },
      };
      addMessage(effectiveId, queuedMessage);
      setInput('');
      setMentions([]);
      clearDraft(effectiveId);
      if (hasImages) clearImages();
      requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }

    // Normal send: must be in idle state
    if (!canSend) return;

    // Dispatch SEND to FSM synchronously (enters 'sending' state, prevents double-send)
    dispatch({ type: 'SEND' });

    // Determine effective session ID
    let effectiveSessionId = sessionId;

    if (!sessionId) {
      // Create stub session for optimistic display
      const stubId = 'stub-' + Math.random().toString(36).slice(2, 10);
      addSession({
        id: stubId,
        title: extractSessionTitle(trimmed) || 'New Chat',
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
      });
      effectiveSessionId = stubId;
      navigate(`/chat/${stubId}`);
    }

    // Build options -- omit sessionId for new chat
    const options: ClaudeCommandOptions = { projectPath: projectName };
    if (sessionId) {
      options.sessionId = sessionId;
    }
    if (permissionMode !== 'default') options.permissionMode = permissionMode;

    // Convert images to base64 for WebSocket transport (async)
    if (hasImages) {
      options.images = await getBase64ForSend();
    }

    // Include file mentions for server-side content injection
    if (mentions.length > 0) {
      options.fileMentions = mentions.map((m) => m.path);
    }

    // Store pending title for new chats
    if (!sessionId) {
      pendingTitleRef.current = extractSessionTitle(trimmed) || 'New Chat';
    }

    wsClient.send({
      type: 'claude-command',
      command: commandText,
      options,
    });

    // Optimistic user message (show original text, not the prefixed command)
    if (effectiveSessionId) {
      const userMessage: Message = {
        id: Math.random().toString(36).slice(2, 10),
        role: 'user',
        content: trimmed,
        metadata: {
          timestamp: new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cost: null,
          duration: null,
        },
        providerContext: {
          providerId: 'claude',
          modelId: '',
          agentName: null,
        },
      };
      addMessage(effectiveSessionId, userMessage);
    }

    hasMessageSentRef.current = true;
    setInput('');
    setMentions([]);
    if (effectiveSessionId) clearDraft(effectiveSessionId);
    if (hasImages) clearImages();
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [input, mentions, attachments, isStreaming, canSend, projectName, sessionId, streamSessionId, permissionMode, addMessage, addSession, navigate, dispatch, clearDraft, getBase64ForSend, clearImages]);

  const handleStop = useCallback(() => {
    if (!canStop) return;
    const sid = streamSessionId ?? sessionId;
    if (sid) {
      wsClient.send({
        type: 'abort-session',
        sessionId: sid,
        provider: 'claude',
      });
      dispatch({ type: 'STOP' });
    }
  }, [canStop, streamSessionId, sessionId, dispatch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // When slash picker is open, intercept navigation/selection keys
      if (slashPickerOpen) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          slashMoveUp();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          slashMoveDown();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSlashSelect(slashSelectCurrent());
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          handleSlashSelect(slashSelectCurrent());
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeSlashPicker();
          return;
        }
      }

      // When mention picker is open, intercept navigation/selection keys
      if (mentionPickerOpen) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          mentionMoveUp();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          mentionMoveDown();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleMentionSelect(mentionSelectCurrent());
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          handleMentionSelect(mentionSelectCurrent());
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMentionPicker();
          return;
        }
      }

      // Normal keyboard behavior
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Escape') {
        if (input.trim()) {
          // First press: clear input
          setInput('');
        } else {
          // Second press (already empty): blur
          textareaRef.current?.blur();
        }
      }
    },
    [slashPickerOpen, slashMoveUp, slashMoveDown, slashSelectCurrent, handleSlashSelect, closeSlashPicker, mentionPickerOpen, handleSend, input, mentionMoveUp, mentionMoveDown, mentionSelectCurrent, handleMentionSelect, closeMentionPicker],
  );

  const isStreamingState = composerState === 'active' || composerState === 'aborting';

  const hasContent = input.trim() || attachments.length > 0;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2 composer-safe-area">
      <ElectricBorder isActive={isStreaming}>
      <div
        className="composer-pill relative p-3"
        data-streaming={isStreamingState}
        data-testid="chat-composer"
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounterRef.current++;
          if (dragCounterRef.current === 1) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounterRef.current--;
          if (dragCounterRef.current === 0) setIsDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dragCounterRef.current = 0;
          setIsDragOver(false);
          addFromDrop(e);
        }}
      >
        {/* Slash command picker popup (above composer) */}
        {slashPickerOpen && (
          <SlashCommandPicker
            results={slashResults}
            selectedIndex={slashSelectedIndex}
            onSelect={handleSlashSelect}
          />
        )}

        {/* Mention picker popup (above composer) */}
        {mentionPickerOpen && (
          <MentionPicker
            results={mentionResults}
            selectedIndex={mentionSelectedIndex}
            isLoading={mentionLoading}
            onSelect={handleMentionSelect}
          />
        )}

        {/* Image preview row */}
        <ImagePreviewRow attachments={attachments} onRemove={removeImage} />

        {/* File mention chips */}
        <MentionChipRow mentions={mentions} onRemove={handleRemoveMention} />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            // Capture scroll position BEFORE setInput triggers re-render + useAutoResize
            const container = scrollContainerRef?.current;
            if (container) {
              prevScrollRef.current = {
                top: container.scrollTop,
                height: container.scrollHeight,
              };
            }
            setInput(e.target.value);
            if (sessionId) saveDraft(sessionId, e.target.value);

            // Detect pickers (mutually exclusive — slash only at position 0, mention elsewhere)
            const cursorPos = e.target.selectionStart ?? e.target.value.length;
            const val = e.target.value;
            if (val.startsWith('/') && !mentionPickerOpen) {
              slashDetectAndOpen(val, cursorPos);
            } else {
              if (slashPickerOpen) closeSlashPicker();
              detectAndOpen(val, cursorPos);
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={addFromClipboard}
          placeholder="Send a message..."
          aria-label="Message input"
          aria-expanded={mentionPickerOpen || slashPickerOpen}
          aria-controls={
            slashPickerOpen ? 'slash-picker-list' :
            mentionPickerOpen ? 'mention-picker-list' :
            undefined
          }
          rows={1}
          className={cn(
            'w-full resize-none overflow-y-hidden bg-transparent text-base md:text-sm text-foreground',
            'placeholder:text-muted',
            'focus:outline-none',
          )}
        />

        <div className="mt-2 flex items-end justify-between">
          <ComposerKeyboardHints
            hasMessageSent={hasMessageSentRef.current}
            isStreaming={isStreamingState}
          />

          <div className="composer-button-cell">
            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || !hasContent}
              aria-label="Send message"
              data-visible={canSend && !isStreamingState ? 'true' : 'false'}
              className={cn(
                'flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded-lg',
                'bg-primary text-surface-base',
                'disabled:opacity-50 disabled:pointer-events-none',
                'hover:opacity-80 transition-opacity',
              )}
            >
              <Send size={16} aria-hidden="true" />
            </button>

            {/* Stop button */}
            <button
              type="button"
              onClick={handleStop}
              disabled={!canStop}
              aria-label="Stop generation"
              data-visible={isStreamingState ? 'true' : 'false'}
              className={cn(
                'flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded-lg',
                'bg-destructive text-foreground',
                'disabled:opacity-50 disabled:pointer-events-none',
                'hover:opacity-80 transition-opacity',
              )}
            >
              {composerState === 'aborting' ? (
                <div className="composer-abort-spinner" aria-hidden="true" />
              ) : (
                <Square size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Drag-and-drop overlay */}
        <DragOverlay isDragOver={isDragOver} />
      </div>
      </ElectricBorder>
      <ComposerStatusBar projectName={projectName} sessionId={sessionId} />
    </div>
  );
}

// ChatComposerProps is used by ChatView for prop threading
