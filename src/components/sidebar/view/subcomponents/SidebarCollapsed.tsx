import { Settings, Sparkles, PanelLeftOpen, Plus } from 'lucide-react';

type SidebarCollapsedProps = {
  onExpand: () => void;
  onShowSettings: () => void;
  onNewSession: () => void;
  updateAvailable: boolean;
  onShowVersionModal: () => void;
};

export default function SidebarCollapsed({
  onExpand,
  onShowSettings,
  onNewSession,
  updateAvailable,
  onShowVersionModal,
}: SidebarCollapsedProps) {
  return (
    <div className="h-full flex flex-col items-center py-3 gap-1 bg-background/80 backdrop-blur-sm w-12">
      {/* Expand button with brand logo */}
      <button
        onClick={onExpand}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors group"
        aria-label={"Show sidebar"}
        title={"Show sidebar"}
      >
        <PanelLeftOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* New session button */}
      <button
        onClick={onNewSession}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors group"
        aria-label={"New session"}
        title={"New session"}
      >
        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <div className="nav-divider w-6 my-1" />

      {/* Settings */}
      <button
        onClick={onShowSettings}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors group"
        aria-label={"Settings"}
        title={"Settings"}
      >
        <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* Update indicator */}
      {updateAvailable && (
        <button
          onClick={onShowVersionModal}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors"
          aria-label={"Update available"}
          title={"Update available"}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        </button>
      )}
    </div>
  );
}
