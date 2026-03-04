import React from 'react';
import ThinkingModeSelector from './ThinkingModeSelector';
import type { PermissionMode, Provider } from '../../types/types';

interface ChatInputControlsProps {
  permissionMode: PermissionMode | string;
  onModeSwitch: () => void;
  provider: Provider | string;
  thinkingMode: string;
  setThinkingMode: React.Dispatch<React.SetStateAction<string>>;
  slashCommandsCount: number;
  onToggleCommandMenu: () => void;
  hasInput: boolean;
  onClearInput: () => void;
}

export default function ChatInputControls({
  permissionMode,
  onModeSwitch,
  provider,
  thinkingMode,
  setThinkingMode,
  slashCommandsCount,
  onToggleCommandMenu,
  hasInput,
  onClearInput,
}: ChatInputControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <button
        type="button"
        onClick={onModeSwitch}
        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
          permissionMode === 'default'
            ? 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
            : permissionMode === 'acceptEdits'
              ? 'bg-green-900/15 text-green-300 border-green-600/40 hover:bg-green-900/25'
              : permissionMode === 'bypassPermissions'
                ? 'bg-orange-900/15 text-orange-300 border-orange-600/40 hover:bg-orange-900/25'
                : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
        }`}
        title="Click to change permission mode (or press Tab in input)"
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              permissionMode === 'default'
                ? 'bg-muted-foreground'
                : permissionMode === 'acceptEdits'
                  ? 'bg-green-500'
                  : permissionMode === 'bypassPermissions'
                    ? 'bg-orange-500'
                    : 'bg-primary'
            }`}
          />
          <span>
            {permissionMode === 'default' && 'Default Mode'}
            {permissionMode === 'acceptEdits' && 'Accept Edits'}
            {permissionMode === 'bypassPermissions' && 'Bypass Permissions'}
            {permissionMode === 'plan' && 'Plan Mode'}
          </span>
        </div>
      </button>

      {provider === 'claude' && (
        <ThinkingModeSelector selectedMode={thinkingMode} onModeChange={setThinkingMode} onClose={() => {}} className="" />
      )}

      <button
        type="button"
        onClick={onToggleCommandMenu}
        className="relative w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-colors hover:bg-accent/60"
        title="Show all commands"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        {slashCommandsCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
          >
            {slashCommandsCount}
          </span>
        )}
      </button>

      {hasInput && (
        <button
          type="button"
          onClick={onClearInput}
          className="w-7 h-7 sm:w-8 sm:h-8 bg-card hover:bg-accent/60 border border-border/50 rounded-lg flex items-center justify-center transition-all duration-200 group shadow-sm"
          title="Clear input"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

    </div>
  );
}
