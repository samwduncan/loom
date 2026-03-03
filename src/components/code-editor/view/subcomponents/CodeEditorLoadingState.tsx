import { OverlayPortal } from '../../../ui/overlay-portal';
import { getEditorLoadingStyles } from '../../utils/editorStyles';

type CodeEditorLoadingStateProps = {
  isDarkMode: boolean;
  isSidebar: boolean;
  loadingText: string;
};

export default function CodeEditorLoadingState({
  isDarkMode,
  isSidebar,
  loadingText,
}: CodeEditorLoadingStateProps) {
  const loadingContent = (
    <>
      <style>{getEditorLoadingStyles(isDarkMode)}</style>
      {isSidebar ? (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="text-foreground">{loadingText}</span>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[var(--z-modal)] md:bg-black/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center">
          <div className="code-editor-loading w-full h-full md:rounded-lg md:w-auto md:h-auto p-8 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-foreground">{loadingText}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return isSidebar ? loadingContent : <OverlayPortal>{loadingContent}</OverlayPortal>;
}
