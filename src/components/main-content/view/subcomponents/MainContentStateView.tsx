import { Folder } from 'lucide-react';
import MobileMenuButton from './MobileMenuButton';
import type { MainContentStateViewProps } from '../../types/types';

export default function MainContentStateView({ mode, isMobile, onMenuClick }: MainContentStateViewProps) {
  const isLoading = mode === 'loading';

  return (
    <div className="h-full flex flex-col">
      {isMobile && (
        <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 p-2 sm:p-3 pwa-header-safe flex-shrink-0">
          <MobileMenuButton onMenuClick={onMenuClick} compact />
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-10 h-10 mx-auto mb-4">
              <div
                className="w-full h-full rounded-full border-[3px] border-muted border-t-primary"
                style={{
                  animation: 'spin 1s linear infinite',
                  WebkitAnimation: 'spin 1s linear infinite',
                  MozAnimation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Loading Claude Code UI</h2>
            <p className="text-sm">Setting up your workspace...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-14 h-14 mx-auto mb-5 bg-muted/50 rounded-2xl flex items-center justify-center">
              <Folder className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Choose Your Project</h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Select a project from the sidebar to start coding with Claude. Each project contains your chat sessions and file history.</p>
            <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/10">
              <p className="text-sm text-primary">
                <strong>Tip:</strong> {isMobile ? 'Tap the menu button above to access projects' : 'Create a new project by clicking the folder icon in the sidebar'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
