/**
 * Editor content cache -- stores in-progress edits when switching tabs.
 *
 * Separate file from CodeEditor.tsx for react-refresh compatibility
 * (components-only exports rule).
 *
 * Used by CodeEditor (read/write) and EditorTabs (read for save-on-close).
 */

/** Cached in-progress content per file path */
export const contentCache = new Map<string, string>();

/** Original (fetched) content per file path, for dirty detection */
export const originalCache = new Map<string, string>();

/** Evict both caches for a file path (call on tab close) */
export function evictFileCache(path: string): void {
  contentCache.delete(path);
  originalCache.delete(path);
}
