interface ScrollToBottomPillProps {
  newTurnCount: number;
  onScrollToBottom: () => void;
  visible: boolean;
}

export default function ScrollToBottomPill({
  newTurnCount,
  onScrollToBottom,
  visible,
}: ScrollToBottomPillProps) {
  if (!visible || newTurnCount <= 0) return null;

  return (
    <>
      <style>{`
        @keyframes pill-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <button
        onClick={onScrollToBottom}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-muted-foreground/30 rounded-full shadow-lg text-sm text-foreground hover:bg-surface-elevated transition-all duration-200"
        style={{ animation: 'pill-enter 200ms ease-out' }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        {newTurnCount} new turn{newTurnCount !== 1 ? 's' : ''}
      </button>
    </>
  );
}
