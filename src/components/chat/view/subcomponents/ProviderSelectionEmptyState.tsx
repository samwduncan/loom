import React, { useState } from 'react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import NextTaskBanner from '../../../NextTaskBanner.jsx';
import type { ProjectSession, SessionProvider } from '../../../../types/app';

interface ProviderSelectionEmptyStateProps {
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  provider: SessionProvider;
  setProvider: (next: SessionProvider) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  codexModel: string;
  setCodexModel: (model: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  onShowAllTasks?: (() => void) | null;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

const PROVIDER_INFO: Array<{ id: SessionProvider; name: string; maker: string }> = [
  { id: 'claude', name: 'Claude', maker: 'Anthropic' },
  { id: 'codex', name: 'Codex', maker: 'OpenAI' },
  { id: 'gemini', name: 'Gemini', maker: 'Google' },
];

export default function ProviderSelectionEmptyState({
  selectedSession,
  currentSessionId,
  textareaRef,
  tasksEnabled,
  isTaskMasterInstalled,
  onShowAllTasks,
  setInput,
}: ProviderSelectionEmptyStateProps) {
  const nextTaskPrompt = 'Start the next task';

  // Track whether the welcome has been dismissed this render (for immediate reactivity)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('loom-welcomed') === 'true',
  );

  const handleDismissWelcome = () => {
    localStorage.setItem('loom-welcomed', 'true');
    setDismissed(true);
    // Focus the textarea so the user can start typing immediately
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  /* -- Existing session: continue prompt -- */
  if (selectedSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 max-w-md">
          <p className="text-lg font-semibold text-foreground mb-1.5">Continue your conversation</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ask questions about your code, request changes, or get help with development tasks
          </p>

          {tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <NextTaskBanner onStartTask={() => setInput(nextTaskPrompt)} onShowAllTasks={onShowAllTasks} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -- New session, already welcomed: minimal empty state -- */
  if (!selectedSession && !currentSessionId && dismissed) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 max-w-md">
          <p className="text-lg font-semibold text-foreground mb-1.5">Start a new conversation</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ask questions about your code, request changes, or get help with development tasks.
            Switch providers anytime from the header dropdown.
          </p>

          {tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <NextTaskBanner onStartTask={() => setInput(nextTaskPrompt)} onShowAllTasks={onShowAllTasks} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -- New session, first time: welcome screen -- */
  if (!selectedSession && !currentSessionId && !dismissed) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Welcome to Loom
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Your AI-powered development companion
            </p>
          </div>

          {/* Description */}
          <p className="text-center text-sm text-muted-foreground/80 leading-relaxed mb-8 max-w-sm mx-auto">
            Loom defaults to Claude for a great out-of-the-box experience.
            You can switch between Claude, Codex, and Gemini anytime using the
            provider dropdown in the header.
          </p>

          {/* Provider logos — informational, not a selector */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {PROVIDER_INFO.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-card border border-border/40 flex items-center justify-center">
                  <SessionProviderLogo provider={p.id} className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.maker}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Start chatting button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleDismissWelcome}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 focus:ring-offset-background active:scale-[0.98]"
            >
              Start chatting
            </button>
          </div>

          {/* Task banner */}
          {tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-6">
              <NextTaskBanner onStartTask={() => setInput(nextTaskPrompt)} onShowAllTasks={onShowAllTasks} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
