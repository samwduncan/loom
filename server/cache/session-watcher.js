import { watch, statSync, createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { EventEmitter } from 'events';

/**
 * SessionWatcher -- tails JSONL files using fs.watch + byte-offset delta reads.
 *
 * Designed for live session attach: watches active JSONL files being appended to
 * by Claude CLI and emits parsed entries as they arrive.
 *
 * Key behaviors:
 * - Byte-offset tracking: only reads new data appended since last read
 * - Partial line buffering: holds incomplete lines for next read cycle
 * - Per-session debounce (100ms): coalesces rapid fs.watch events
 * - Hard cap of 5 simultaneous watches
 * - Idempotent watch(): calling twice for same sessionId is a no-op
 */
class SessionWatcher extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, { filePath: string, offset: number, watcher: fs.FSWatcher, buffer: string, debounceTimer: NodeJS.Timeout|null }>} */
    this.watched = new Map();
    this.MAX_WATCHES = 5;
  }

  /**
   * Start watching a JSONL file for a session.
   * Sets the initial offset to current file size (only new data will be emitted).
   * @param {string} sessionId
   * @param {string} filePath - Absolute path to the JSONL file
   */
  watch(sessionId, filePath) {
    // Idempotent -- don't double-watch
    if (this.watched.has(sessionId)) return;

    // Enforce capacity
    if (this.watched.size >= this.MAX_WATCHES) {
      throw new Error('Maximum simultaneous watches reached');
    }

    // Start from current file size -- only emit new appended data
    const initialOffset = statSync(filePath).size;

    const fsWatcher = watch(filePath, (eventType) => {
      if (eventType === 'change') {
        const entry = this.watched.get(sessionId);
        if (!entry) return;

        // Debounce: coalesce rapid change events (100ms per session)
        if (entry.debounceTimer) {
          clearTimeout(entry.debounceTimer);
        }
        entry.debounceTimer = setTimeout(() => {
          entry.debounceTimer = null;
          this._readNewLines(sessionId);
        }, 100);
      }
    });

    // Handle watcher errors (e.g. file deleted while watching)
    fsWatcher.on('error', (err) => {
      console.error(`[SessionWatcher] Watcher error for ${sessionId}:`, err.message);
      this.unwatch(sessionId);
    });

    this.watched.set(sessionId, {
      filePath,
      offset: initialOffset,
      watcher: fsWatcher,
      buffer: '',
      debounceTimer: null,
    });
  }

  /**
   * Stop watching a session's JSONL file.
   * @param {string} sessionId
   */
  unwatch(sessionId) {
    const entry = this.watched.get(sessionId);
    if (!entry) return;

    entry.watcher.close();
    if (entry.debounceTimer) {
      clearTimeout(entry.debounceTimer);
    }
    this.watched.delete(sessionId);

    this.emit('unwatched', { sessionId });
  }

  /**
   * Stop watching all sessions.
   */
  unwatchAll() {
    // Collect keys first to avoid mutation during iteration
    const sessionIds = Array.from(this.watched.keys());
    for (const sessionId of sessionIds) {
      this.unwatch(sessionId);
    }
  }

  /**
   * Get list of currently watched session IDs.
   * @returns {string[]}
   */
  getActiveWatches() {
    return Array.from(this.watched.keys());
  }

  /**
   * Check if a session is currently being watched.
   * @param {string} sessionId
   * @returns {boolean}
   */
  isWatching(sessionId) {
    return this.watched.has(sessionId);
  }

  /**
   * Read new bytes from the JSONL file since last offset.
   * Handles partial lines via buffering and truncation via offset reset.
   * @param {string} sessionId
   * @private
   */
  async _readNewLines(sessionId) {
    const entry = this.watched.get(sessionId);
    if (!entry) return;

    try {
      const currentStat = await stat(entry.filePath);
      const currentSize = currentStat.size;

      // Truncation detection: file got smaller (shouldn't happen with JSONL, but defensive)
      if (currentSize < entry.offset) {
        entry.offset = 0;
      }

      // No new data
      if (currentSize <= entry.offset) return;

      // Read only the new bytes
      const stream = createReadStream(entry.filePath, {
        start: entry.offset,
        encoding: 'utf8',
      });

      let rawData = '';
      for await (const chunk of stream) {
        rawData += chunk;
      }

      // Prepend any buffered partial line from previous read
      const combined = entry.buffer + rawData;

      // Split by newline
      const parts = combined.split('\n');

      // If the last element is non-empty, it's a partial line -- buffer it
      const lastPart = parts[parts.length - 1];
      if (lastPart !== '') {
        entry.buffer = lastPart;
      } else {
        entry.buffer = '';
      }

      // Parse complete lines (all except the last element, which is either '' or buffered)
      const entries = [];
      for (let i = 0; i < parts.length - 1; i++) {
        const line = parts[i].trim();
        if (!line) continue;
        try {
          entries.push(JSON.parse(line));
        } catch {
          console.warn(`[SessionWatcher] Failed to parse JSONL line for session ${sessionId}`);
        }
      }

      // Update offset to current file size
      entry.offset = currentSize;

      // Emit parsed entries
      if (entries.length > 0) {
        this.emit('entries', { sessionId, entries });
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // File was deleted -- clean up
        console.warn(`[SessionWatcher] File deleted for session ${sessionId}, unwatching`);
        this.unwatch(sessionId);
        this.emit('error', { sessionId, error: 'File deleted' });
      } else {
        console.error(`[SessionWatcher] Read error for session ${sessionId}:`, err.message);
        this.emit('error', { sessionId, error: err.message });
      }
    }
  }
}

// Singleton instance -- one watcher per server
const sessionWatcher = new SessionWatcher();
export default sessionWatcher;
export { SessionWatcher };
