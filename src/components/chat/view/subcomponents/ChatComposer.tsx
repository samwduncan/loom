import CommandMenu from './CommandMenu';
import StatusLine from './StatusLine';
import MicButton from '../../../mic-button/view/MicButton';
import ImageAttachment from './ImageAttachment';
import PermissionRequestsBanner from './PermissionRequestsBanner';
import ChatInputControls from './ChatInputControls';
import ComposerProviderPicker from './ComposerProviderPicker';
import type {
  ChangeEvent,
  ClipboardEvent,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  SetStateAction,
  TouchEvent,
} from 'react';
import type { PendingPermissionRequest, PermissionMode, Provider } from '../../types/types';
import type { SessionProvider } from '../../../../types/app';

interface MentionableFile {
  name: string;
  path: string;
}

interface SlashCommand {
  name: string;
  description?: string;
  namespace?: string;
  path?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ChatComposerProps {
  pendingPermissionRequests: PendingPermissionRequest[];
  handlePermissionDecision: (
    requestIds: string | string[],
    decision: { allow?: boolean; message?: string; rememberEntry?: string | null; updatedInput?: unknown },
  ) => void;
  handleGrantToolPermission: (suggestion: { entry: string; toolName: string }) => { success: boolean };
  claudeStatus: { text: string; tokens: number; can_interrupt: boolean; toolName?: string; toolInput?: Record<string, unknown> | string } | null;
  isLoading: boolean;
  onAbortSession: () => void;
  provider: Provider | string;
  permissionMode: PermissionMode | string;
  onModeSwitch: () => void;
  thinkingMode: string;
  setThinkingMode: Dispatch<SetStateAction<string>>;
  tokenBudget: { used?: number; total?: number } | null;
  slashCommandsCount: number;
  onToggleCommandMenu: () => void;
  hasInput: boolean;
  onClearInput: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => void;
  isDragActive: boolean;
  attachedImages: File[];
  onRemoveImage: (index: number) => void;
  uploadingImages: Map<string, number>;
  imageErrors: Map<string, string>;
  showFileDropdown: boolean;
  filteredFiles: MentionableFile[];
  selectedFileIndex: number;
  onSelectFile: (file: MentionableFile) => void;
  filteredCommands: SlashCommand[];
  selectedCommandIndex: number;
  onCommandSelect: (command: SlashCommand, index: number, isHover: boolean) => void;
  onCloseCommandMenu: () => void;
  isCommandMenuOpen: boolean;
  frequentCommands: SlashCommand[];
  getRootProps: (...args: unknown[]) => Record<string, unknown>;
  getInputProps: (...args: unknown[]) => Record<string, unknown>;
  openImagePicker: () => void;
  inputHighlightRef: RefObject<HTMLDivElement>;
  renderInputWithMentions: (text: string) => ReactNode;
  textareaRef: RefObject<HTMLTextAreaElement>;
  input: string;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onTextareaClick: (event: MouseEvent<HTMLTextAreaElement>) => void;
  onTextareaKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onTextareaPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onTextareaScrollSync: (target: HTMLTextAreaElement) => void;
  onTextareaInput: (event: FormEvent<HTMLTextAreaElement>) => void;
  onInputFocusChange?: (focused: boolean) => void;
  isInputFocused?: boolean;
  placeholder: string;
  isTextareaExpanded: boolean;
  sendByCtrlEnter?: boolean;
  onTranscript: (text: string) => void;
  onProviderChange?: (provider: SessionProvider) => void;
  modelLabel?: string;
  sessionCost?: number | null;
}

export default function ChatComposer({
  pendingPermissionRequests,
  handlePermissionDecision,
  handleGrantToolPermission,
  claudeStatus,
  isLoading,
  onAbortSession,
  provider,
  permissionMode,
  onModeSwitch,
  thinkingMode,
  setThinkingMode,
  tokenBudget,
  slashCommandsCount,
  onToggleCommandMenu,
  hasInput,
  onClearInput,
  onSubmit,
  isDragActive,
  attachedImages,
  onRemoveImage,
  uploadingImages,
  imageErrors,
  showFileDropdown,
  filteredFiles,
  selectedFileIndex,
  onSelectFile,
  filteredCommands,
  selectedCommandIndex,
  onCommandSelect,
  onCloseCommandMenu,
  isCommandMenuOpen,
  frequentCommands,
  getRootProps,
  getInputProps,
  openImagePicker,
  inputHighlightRef,
  renderInputWithMentions,
  textareaRef,
  input,
  onInputChange,
  onTextareaClick,
  onTextareaKeyDown,
  onTextareaPaste,
  onTextareaScrollSync,
  onTextareaInput,
  onInputFocusChange,
  isInputFocused,
  placeholder,
  isTextareaExpanded,
  sendByCtrlEnter,
  onTranscript,
  onProviderChange,
  modelLabel,
  sessionCost,
}: ChatComposerProps) {
  const textareaRect = textareaRef.current?.getBoundingClientRect();
  const commandMenuPosition = {
    top: textareaRect ? Math.max(16, textareaRect.top - 316) : 0,
    left: textareaRect ? textareaRect.left : 16,
    bottom: textareaRect ? window.innerHeight - textareaRect.top + 8 : 90,
  };

  // Detect if the AskUserQuestion interactive panel is active
  const hasQuestionPanel = pendingPermissionRequests.some(
    (r) => r.toolName === 'AskUserQuestion'
  );

  // On mobile, when input is focused, float the input box at the bottom
  const mobileFloatingClass = isInputFocused
    ? 'max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-[var(--z-sticky)] max-sm:bg-background max-sm:shadow-[0_-4px_20px_rgba(0,0,0,0.15)]'
    : '';

  return (
    <div className={`p-2 sm:p-4 md:p-4 flex-shrink-0 pb-2 sm:pb-4 md:pb-6 ${mobileFloatingClass}`}>
      <div className="max-w-4xl mx-auto mb-3">
        <PermissionRequestsBanner
          pendingPermissionRequests={pendingPermissionRequests}
          handlePermissionDecision={handlePermissionDecision}
          handleGrantToolPermission={handleGrantToolPermission}
        />

        {!hasQuestionPanel && <ChatInputControls
          permissionMode={permissionMode}
          onModeSwitch={onModeSwitch}
          provider={provider}
          thinkingMode={thinkingMode}
          setThinkingMode={setThinkingMode}
          slashCommandsCount={slashCommandsCount}
          onToggleCommandMenu={onToggleCommandMenu}
          hasInput={hasInput}
          onClearInput={onClearInput}
        />}
      </div>

      {!hasQuestionPanel && <form onSubmit={onSubmit as (event: FormEvent<HTMLFormElement>) => void} className="relative max-w-4xl mx-auto">
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/15 border-2 border-dashed border-primary/50 rounded-2xl flex items-center justify-center z-[var(--z-modal)]">
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border/30">
              <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium">Drop images here</p>
            </div>
          </div>
        )}

        {attachedImages.length > 0 && (
          <div className="mb-2 p-2 bg-muted/40 rounded-xl">
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((file, index) => (
                <ImageAttachment
                  key={index}
                  file={file}
                  onRemove={() => onRemoveImage(index)}
                  uploadProgress={uploadingImages.get(file.name)}
                  error={imageErrors.get(file.name)}
                />
              ))}
            </div>
          </div>
        )}

        {showFileDropdown && filteredFiles.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/80 backdrop-blur-[16px] backdrop-saturate-[1.4] border border-border/50 rounded-xl shadow-lg max-h-48 overflow-y-auto z-[var(--z-dropdown)]">
            {filteredFiles.map((file, index) => (
              <div
                key={file.path}
                className={`px-4 py-3 cursor-pointer border-b border-border/30 last:border-b-0 touch-manipulation ${
                  index === selectedFileIndex
                    ? 'bg-primary/8 text-primary'
                    : 'hover:bg-accent/50 text-foreground'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectFile(file);
                }}
              >
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{file.path}</div>
              </div>
            ))}
          </div>
        )}

        <CommandMenu
          commands={filteredCommands}
          selectedIndex={selectedCommandIndex}
          onSelect={onCommandSelect}
          onClose={onCloseCommandMenu}
          position={commandMenuPosition}
          isOpen={isCommandMenuOpen}
          frequentCommands={frequentCommands}
        />

        <div
          {...getRootProps()}
          className={`relative bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-border/50 focus-within:shadow-md focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/15 transition-all duration-200 overflow-hidden ${
            isTextareaExpanded ? 'chat-input-expanded' : ''
          }`}
        >
          <input {...getInputProps()} />
          <div ref={inputHighlightRef} aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="chat-input-placeholder block w-full pl-12 pr-20 sm:pr-40 py-1.5 sm:py-4 text-transparent text-base leading-6 whitespace-pre-wrap break-words">
              {renderInputWithMentions(input)}
            </div>
          </div>

          <div className="relative z-10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInputChange}
              onClick={onTextareaClick}
              onKeyDown={onTextareaKeyDown}
              onPaste={onTextareaPaste}
              onScroll={(event) => onTextareaScrollSync(event.target as HTMLTextAreaElement)}
              onFocus={() => onInputFocusChange?.(true)}
              onBlur={() => onInputFocusChange?.(false)}
              onInput={onTextareaInput}
              placeholder={placeholder}
              disabled={isLoading}
              className="chat-input-placeholder block w-full pl-12 pr-20 sm:pr-40 py-1.5 sm:py-4 bg-transparent rounded-2xl focus:outline-none text-foreground placeholder-muted-foreground/50 disabled:opacity-50 resize-none min-h-[50px] sm:min-h-[80px] max-h-[40vh] sm:max-h-[300px] overflow-y-auto text-base leading-6 transition-all duration-200"
              style={{ height: '50px' }}
            />

            <button
              type="button"
              onClick={openImagePicker}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-accent/60 rounded-xl transition-colors"
              title="Attach images"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            <div className="absolute right-16 sm:right-16 top-1/2 transform -translate-y-1/2" style={{ display: 'none' }}>
              <MicButton onTranscript={onTranscript} className="w-10 h-10 sm:w-10 sm:h-10" />
            </div>

            {/* Provider mini-picker near send button */}
            {onProviderChange && (
              <div className="absolute right-14 sm:right-[60px] top-1/2 transform -translate-y-1/2">
                <ComposerProviderPicker
                  provider={provider as SessionProvider}
                  onProviderChange={onProviderChange}
                />
              </div>
            )}

            <button
              type={isLoading ? 'button' : 'submit'}
              disabled={!isLoading && !input.trim()}
              onClick={isLoading ? onAbortSession : undefined}
              onMouseDown={isLoading ? undefined : (event) => {
                event.preventDefault();
                onSubmit(event);
              }}
              onTouchStart={isLoading ? undefined : (event) => {
                event.preventDefault();
                onSubmit(event);
              }}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background ${
                isLoading
                  ? 'bg-destructive hover:bg-destructive/90 focus:ring-destructive/30'
                  : 'bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed focus:ring-primary/30'
              }`}
            >
              {/* Send icon (arrow) — fades out when loading */}
              <svg
                className="absolute w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary-foreground transform rotate-90 transition-opacity duration-200"
                style={{ opacity: isLoading ? 0 : 1 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {/* Stop icon (square) — fades in when loading */}
              <svg
                className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive-foreground transition-opacity duration-200"
                style={{ opacity: isLoading ? 1 : 0 }}
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <rect x="1" y="1" width="8" height="8" rx="1" />
              </svg>
            </button>

            <div
              className={`absolute bottom-1 left-12 right-14 sm:right-40 text-xs text-muted-foreground/50 pointer-events-none hidden sm:block transition-opacity duration-200 ${
                input.trim() ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {sendByCtrlEnter ? 'Ctrl+Enter to send \u2022 Shift+Enter for new line \u2022 Tab to change modes \u2022 / for slash commands' : 'Enter to send \u2022 Shift+Enter for new line \u2022 Tab to change modes \u2022 / for slash commands'}
            </div>
          </div>
        </div>
      </form>}

      {/* Always-visible status line below the composer */}
      <StatusLine
        claudeStatus={claudeStatus}
        isLoading={isLoading}
        onAbort={onAbortSession}
        provider={typeof provider === 'string' ? provider : String(provider)}
        modelLabel={modelLabel || ''}
        sessionCost={sessionCost}
        tokenBudget={tokenBudget}
      />
    </div>
  );
}
