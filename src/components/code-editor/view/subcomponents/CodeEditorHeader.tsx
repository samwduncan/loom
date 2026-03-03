import { Code2, Download, Eye, Maximize2, Minimize2, Save, Settings as SettingsIcon, X } from 'lucide-react';
import type { CodeEditorFile } from '../../types/types';

type CodeEditorHeaderProps = {
  file: CodeEditorFile;
  isSidebar: boolean;
  isFullscreen: boolean;
  isMarkdownFile: boolean;
  markdownPreview: boolean;
  saving: boolean;
  saveSuccess: boolean;
  onToggleMarkdownPreview: () => void;
  onOpenSettings: () => void;
  onDownload: () => void;
  onSave: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  labels: {
    showingChanges: string;
    editMarkdown: string;
    previewMarkdown: string;
    settings: string;
    download: string;
    save: string;
    saving: string;
    saved: string;
    fullscreen: string;
    exitFullscreen: string;
    close: string;
  };
};

export default function CodeEditorHeader({
  file,
  isSidebar,
  isFullscreen,
  isMarkdownFile,
  markdownPreview,
  saving,
  saveSuccess,
  onToggleMarkdownPreview,
  onOpenSettings,
  onDownload,
  onSave,
  onToggleFullscreen,
  onClose,
  labels,
}: CodeEditorHeaderProps) {
  const saveTitle = saveSuccess ? labels.saved : saving ? labels.saving : labels.save;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10 bg-surface-raised flex-shrink-0 min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{file.name}</h3>
            {file.diffInfo && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded whitespace-nowrap">
                {labels.showingChanges}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{file.path}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
        {isMarkdownFile && (
          <button
            type="button"
            onClick={onToggleMarkdownPreview}
            className={`p-1.5 rounded-md min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center transition-colors ${
              markdownPreview
                ? 'text-primary bg-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
            title={markdownPreview ? labels.editMarkdown : labels.previewMarkdown}
          >
            {markdownPreview ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          title={labels.settings}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDownload}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          title={labels.download}
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`p-1.5 rounded-md disabled:opacity-50 flex items-center justify-center transition-colors min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 ${
            saveSuccess
              ? 'text-status-connected bg-status-connected/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
          }`}
          title={saveTitle}
        >
          {saveSuccess ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>

        {!isSidebar && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden md:flex p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated items-center justify-center"
            title={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          title={labels.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
