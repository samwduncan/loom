-- Schema version 1 (tracked via PRAGMA user_version)
-- This file is the DDL for cache.db, a DISPOSABLE cache of JSONL data.
-- Deleting cache.db causes rebuild from JSONL on next request.

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  summary TEXT DEFAULT 'New Session',
  message_count INTEGER DEFAULT 0,
  last_activity TEXT,
  cwd TEXT,
  last_user_message TEXT,
  last_assistant_message TEXT,
  jsonl_file TEXT,
  jsonl_mtime REAL,
  jsonl_size INTEGER,
  cached_at TEXT NOT NULL,
  is_junk INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  message_id TEXT,
  uuid TEXT UNIQUE,
  parent_uuid TEXT,
  timestamp TEXT,
  raw_json TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_name, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_not_junk ON sessions(project_name, is_junk, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(session_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_messages_uuid ON messages(uuid);
