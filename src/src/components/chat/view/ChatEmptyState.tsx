/**
 * ChatEmptyState -- empty state for new/blank chat.
 *
 * Centered "Loom" wordmark in Instrument Serif + subtitle in muted text.
 * Vertically centered in the content area.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

export function ChatEmptyState() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      data-testid="chat-empty-state"
    >
      <div className="text-center">
        <h1 className="font-serif italic text-3xl text-foreground">Loom</h1>
        <p className="mt-2 text-sm text-muted">
          What would you like to work on?
        </p>
      </div>
    </div>
  );
}
