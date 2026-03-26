import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_VERSION = 1;

class MessageCache {
  /**
   * @param {string} [dbPath] - Path to the cache database file.
   *   Defaults to server/database/cache.db (alongside auth.db).
   */
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, '..', 'database', 'cache.db');

    // Ensure parent directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    // Performance pragmas — cache.db is disposable, so we favor speed
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');

    this._ensureSchema();
    this._prepareStatements();
  }

  /**
   * Check schema version via user_version pragma.
   * If outdated or missing, drop all tables and recreate from schema.sql.
   */
  _ensureSchema() {
    const currentVersion = this.db.pragma('user_version', { simple: true });

    if (currentVersion < SCHEMA_VERSION) {
      // Drop existing tables (safe — cache is fully rebuildable from JSONL)
      this.db.exec('DROP TABLE IF EXISTS messages');
      this.db.exec('DROP TABLE IF EXISTS sessions');

      // Read and execute schema DDL
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schemaSql);

      // Set schema version
      this.db.pragma(`user_version = ${SCHEMA_VERSION}`);
    }
  }

  /**
   * Pre-compile commonly-used prepared statements for reuse.
   */
  _prepareStatements() {
    this._stmts = {
      upsertSession: this.db.prepare(`
        INSERT OR REPLACE INTO sessions
          (id, project_name, summary, message_count, last_activity, cwd,
           last_user_message, last_assistant_message, jsonl_file,
           jsonl_mtime, jsonl_size, cached_at, is_junk)
        VALUES
          (@id, @projectName, @summary, @messageCount, @lastActivity, @cwd,
           @lastUserMessage, @lastAssistantMessage, @jsonlFile,
           @jsonlMtime, @jsonlSize, @cachedAt, @isJunk)
      `),

      insertMessage: this.db.prepare(`
        INSERT OR IGNORE INTO messages
          (session_id, project_name, entry_type, message_id, uuid, parent_uuid, timestamp, raw_json)
        VALUES
          (@sessionId, @projectName, @entryType, @messageId, @uuid, @parentUuid, @timestamp, @rawJson)
      `),

      getSessionsByProject: this.db.prepare(`
        SELECT * FROM sessions
        WHERE project_name = ? AND is_junk = 0
        ORDER BY last_activity DESC
        LIMIT ? OFFSET ?
      `),

      countSessionsByProject: this.db.prepare(`
        SELECT COUNT(*) as total FROM sessions
        WHERE project_name = ? AND is_junk = 0
      `),

      getMessagesBySession: this.db.prepare(`
        SELECT raw_json FROM messages
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `),

      getSessionMeta: this.db.prepare(`
        SELECT * FROM sessions WHERE id = ?
      `),

      deleteMessagesBySession: this.db.prepare(`
        DELETE FROM messages WHERE session_id = ?
      `),

      deleteSession: this.db.prepare(`
        DELETE FROM sessions WHERE id = ?
      `),

      deleteMessagesByProject: this.db.prepare(`
        DELETE FROM messages WHERE project_name = ?
      `),

      deleteSessionsByProject: this.db.prepare(`
        DELETE FROM sessions WHERE project_name = ?
      `),

      getSessionsForProject: this.db.prepare(`
        SELECT id, jsonl_file, jsonl_mtime, jsonl_size FROM sessions
        WHERE project_name = ?
      `),

      getCachedFiles: this.db.prepare(`
        SELECT DISTINCT jsonl_file FROM sessions WHERE project_name = ?
      `),

      countSessions: this.db.prepare(`SELECT COUNT(*) as count FROM sessions`),
      countMessages: this.db.prepare(`SELECT COUNT(*) as count FROM messages`),
    };
  }

  // ─── Session CRUD ──────────────────────────────────────────────

  /**
   * Insert or replace a session metadata row.
   * @param {Object} session
   */
  upsertSession(session) {
    this._stmts.upsertSession.run({
      id: session.id,
      projectName: session.projectName,
      summary: session.summary || 'New Session',
      messageCount: session.messageCount || 0,
      lastActivity: session.lastActivity || null,
      cwd: session.cwd || null,
      lastUserMessage: session.lastUserMessage || null,
      lastAssistantMessage: session.lastAssistantMessage || null,
      jsonlFile: session.jsonlFile || null,
      jsonlMtime: session.jsonlMtime || null,
      jsonlSize: session.jsonlSize || null,
      cachedAt: new Date().toISOString(),
      isJunk: session.isJunk || 0,
    });
  }

  /**
   * Batch-upsert multiple sessions inside a single transaction.
   * @param {Object[]} sessions
   */
  upsertSessionBatch(sessions) {
    const batchFn = this.db.transaction((items) => {
      for (const session of items) {
        this.upsertSession(session);
      }
    });
    batchFn(sessions);
  }

  // ─── Message CRUD ──────────────────────────────────────────────

  /**
   * Bulk-insert raw JSONL entries for a session.
   * Uses INSERT OR IGNORE for dedup on uuid UNIQUE constraint.
   * Wrapped in a transaction for performance (100x faster than individual inserts).
   * @param {string} projectName
   * @param {string} sessionId
   * @param {Object[]} entries - Raw JSONL entry objects
   */
  insertMessages(projectName, sessionId, entries) {
    const batchFn = this.db.transaction((items) => {
      for (const entry of items) {
        this._stmts.insertMessage.run({
          sessionId,
          projectName,
          entryType: entry.type || 'unknown',
          messageId: entry.message?.id || null,
          uuid: entry.uuid || null,
          parentUuid: entry.parentUuid || null,
          timestamp: entry.timestamp || null,
          rawJson: JSON.stringify(entry),
        });
      }
    });
    batchFn(entries);
  }

  // ─── Queries ───────────────────────────────────────────────────

  /**
   * Get sessions for a project, sorted by last_activity DESC.
   * @param {string} projectName
   * @param {number} [limit=50]
   * @param {number} [offset=0]
   * @returns {{ sessions: Object[], total: number }}
   */
  getSessionsByProject(projectName, limit = 50, offset = 0) {
    const sessions = this._stmts.getSessionsByProject.all(projectName, limit, offset);
    const { total } = this._stmts.countSessionsByProject.get(projectName);
    return { sessions, total };
  }

  /**
   * Get all raw JSONL entries for a session, parsed from JSON.
   * @param {string} sessionId
   * @returns {Object[]}
   */
  getMessagesBySession(sessionId) {
    const rows = this._stmts.getMessagesBySession.all(sessionId);
    return rows.map(row => JSON.parse(row.raw_json));
  }

  /**
   * Get session metadata row by ID.
   * @param {string} sessionId
   * @returns {Object|undefined}
   */
  getSessionMeta(sessionId) {
    return this._stmts.getSessionMeta.get(sessionId);
  }

  // ─── Cache Freshness ──────────────────────────────────────────

  /**
   * Check whether the cached data for a session is still fresh.
   * Compares stored mtime (mtimeMs float) and size against current values.
   * @param {string} sessionId
   * @param {number} currentMtime - fs.stat().mtimeMs
   * @param {number} currentSize - fs.stat().size
   * @returns {boolean} true if cache is fresh
   */
  checkFreshness(sessionId, currentMtime, currentSize) {
    const session = this._stmts.getSessionMeta.get(sessionId);
    if (!session) return false;
    return session.jsonl_mtime === currentMtime && session.jsonl_size === currentSize;
  }

  // ─── Invalidation ─────────────────────────────────────────────

  /**
   * Remove a session and all its messages from cache.
   * @param {string} sessionId
   */
  invalidateSession(sessionId) {
    const fn = this.db.transaction(() => {
      this._stmts.deleteMessagesBySession.run(sessionId);
      this._stmts.deleteSession.run(sessionId);
    });
    fn();
  }

  /**
   * Remove all sessions and messages for a project from cache.
   * @param {string} projectName
   */
  invalidateProject(projectName) {
    const fn = this.db.transaction(() => {
      this._stmts.deleteMessagesByProject.run(projectName);
      this._stmts.deleteSessionsByProject.run(projectName);
    });
    fn();
  }

  // ─── Staleness Detection ──────────────────────────────────────

  /**
   * Find sessions whose cached mtime/size doesn't match current file stats.
   * @param {string} projectName
   * @param {Map<string, {mtimeMs: number, size: number}>} fileStats - jsonlFile -> stat
   * @returns {string[]} Array of stale session IDs
   */
  getStaleSessionsForProject(projectName, fileStats) {
    const rows = this._stmts.getSessionsForProject.all(projectName);
    const stale = [];

    for (const row of rows) {
      const stat = fileStats.get(row.jsonl_file);
      if (!stat || row.jsonl_mtime !== stat.mtimeMs || row.jsonl_size !== stat.size) {
        stale.push(row.id);
      }
    }

    return stale;
  }

  /**
   * Find JSONL files not yet represented in the cache.
   * @param {string} projectName
   * @param {string[]} allJsonlFiles
   * @returns {string[]} Files not in cache
   */
  getUncachedFiles(projectName, allJsonlFiles) {
    const cached = this.getAllCachedFiles(projectName);
    return allJsonlFiles.filter(f => !cached.has(f));
  }

  /**
   * Get the set of JSONL filenames currently cached for a project.
   * @param {string} projectName
   * @returns {Set<string>}
   */
  getAllCachedFiles(projectName) {
    const rows = this._stmts.getCachedFiles.all(projectName);
    return new Set(rows.map(r => r.jsonl_file));
  }

  // ─── Lifecycle ─────────────────────────────────────────────────

  /**
   * Close the database connection.
   */
  close() {
    this.db.close();
  }

  /**
   * Return cache statistics.
   * @returns {{ sessionCount: number, messageCount: number, dbSizeBytes: number }}
   */
  stats() {
    const { count: sessionCount } = this._stmts.countSessions.get();
    const { count: messageCount } = this._stmts.countMessages.get();
    let dbSizeBytes = 0;
    try {
      dbSizeBytes = fs.statSync(this.dbPath).size;
    } catch {
      // db file may not exist yet
    }
    return { sessionCount, messageCount, dbSizeBytes };
  }
}

// Singleton instance — import `messageCache` for shared use,
// or import `MessageCache` class for custom instances (e.g. testing).
const messageCache = new MessageCache();

export default messageCache;
export { MessageCache };
