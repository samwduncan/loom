/**
 * CACHE WARMER
 * ============
 *
 * Background startup indexer that populates the MessageCache from JSONL files.
 * Runs non-blocking after server startup. The server is fully functional without
 * the cache (JSONL fallback works); this just makes things faster.
 *
 * MUST NOT import from projects.js (circular dependency avoidance).
 * Does its own JSONL parsing with a shape optimized for cache population.
 */

import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';
import messageCache from './message-cache.js';

/**
 * Parse a single JSONL file and extract session metadata + raw entries.
 * This is intentionally separate from parseJsonlSessions in projects.js:
 * different output shape optimized for cache population, no circular dep.
 *
 * @param {string} filePath - Absolute path to the JSONL file
 * @returns {Promise<{ sessions: Map<string, Object>, entries: Object[] }>}
 */
async function parseJsonlForCache(filePath) {
  const sessions = new Map();
  const entries = [];
  const pendingSummaries = new Map();

  try {
    const fileStream = fsSync.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        entries.push(entry);

        // Handle summary entries without sessionId (linked by leafUuid)
        if (entry.type === 'summary' && entry.summary && !entry.sessionId && entry.leafUuid) {
          pendingSummaries.set(entry.leafUuid, entry.summary);
        }

        if (!entry.sessionId) continue;

        if (!sessions.has(entry.sessionId)) {
          sessions.set(entry.sessionId, {
            id: entry.sessionId,
            summary: 'New Session',
            messageCount: 0,
            lastActivity: null,
            cwd: entry.cwd || null,
            lastUserMessage: null,
            lastAssistantMessage: null,
          });
        }

        const session = sessions.get(entry.sessionId);

        // Apply pending summary via parentUuid linkage
        if (session.summary === 'New Session' && entry.parentUuid && pendingSummaries.has(entry.parentUuid)) {
          session.summary = pendingSummaries.get(entry.parentUuid);
        }

        // Direct summary entry with sessionId
        if (entry.type === 'summary' && entry.summary) {
          session.summary = entry.summary;
        }

        // Track CWD from first entry that has it
        if (!session.cwd && entry.cwd) {
          session.cwd = entry.cwd;
        }

        // Track last user message (skip system/command messages)
        if (entry.message?.role === 'user' && entry.message?.content) {
          const content = entry.message.content;
          let textContent = content;
          if (Array.isArray(content) && content.length > 0 && content[0].type === 'text') {
            textContent = content[0].text;
          }

          const isSystemMessage = typeof textContent === 'string' && (
            textContent.startsWith('<command-name>') ||
            textContent.startsWith('<command-message>') ||
            textContent.startsWith('<command-args>') ||
            textContent.startsWith('<local-command-stdout>') ||
            textContent.startsWith('<system-reminder>') ||
            textContent.startsWith('Caveat:') ||
            textContent.startsWith('This session is being continued from a previous') ||
            textContent.startsWith('Invalid API key') ||
            textContent.includes('{"subtasks":') ||
            textContent.includes('CRITICAL: You MUST respond with ONLY a JSON') ||
            textContent === 'Warmup'
          );

          if (typeof textContent === 'string' && textContent.length > 0 && !isSystemMessage) {
            session.lastUserMessage = textContent;
          }
        } else if (entry.message?.role === 'assistant' && entry.message?.content) {
          if (entry.isApiErrorMessage !== true) {
            let assistantText = null;

            if (Array.isArray(entry.message.content)) {
              for (const part of entry.message.content) {
                if (part.type === 'text' && part.text) {
                  assistantText = part.text;
                }
              }
            } else if (typeof entry.message.content === 'string') {
              assistantText = entry.message.content;
            }

            const isSystemAssistantMessage = typeof assistantText === 'string' && (
              assistantText.startsWith('Invalid API key') ||
              assistantText.includes('{"subtasks":') ||
              assistantText.includes('CRITICAL: You MUST respond with ONLY a JSON')
            );

            if (assistantText && !isSystemAssistantMessage) {
              session.lastAssistantMessage = assistantText;
            }
          }
        }

        session.messageCount++;

        if (entry.timestamp) {
          const ts = new Date(entry.timestamp);
          if (!session.lastActivity || ts > new Date(session.lastActivity)) {
            session.lastActivity = entry.timestamp;
          }
        }
      } catch {
        // Skip malformed lines silently
      }
    }

    // Set fallback summaries from last message content
    for (const session of sessions.values()) {
      if (session.summary === 'New Session') {
        const lastMessage = session.lastUserMessage || session.lastAssistantMessage;
        if (lastMessage) {
          session.summary = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
        }
      }
    }
  } catch (error) {
    console.warn(`[CACHE] Error parsing JSONL file ${filePath}:`, error.message);
  }

  return { sessions, entries };
}

/**
 * Warm the message cache by scanning all JSONL project directories.
 * Runs in the background after server startup, yielding between files
 * to avoid blocking the event loop.
 *
 * @param {Function|null} progressCallback - Optional (processedFiles, totalFiles, cachedSessions)
 */
async function warmCache(progressCallback = null) {
  const startTime = Date.now();
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');

  let totalFiles = 0;
  let processedFiles = 0;
  let cachedSessions = 0;
  let cachedMessages = 0;
  let lastLogTime = 0;

  try {
    let entries;
    try {
      entries = await fs.readdir(claudeProjectsDir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[CACHE] No ~/.claude/projects/ directory found, skipping cache warm');
        return;
      }
      throw error;
    }

    const projectDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    // Count total JSONL files across all projects for progress tracking
    const projectFileMap = new Map(); // projectName -> [{ file, filePath }]
    for (const projectName of projectDirs) {
      const projectDir = path.join(claudeProjectsDir, projectName);
      try {
        const files = await fs.readdir(projectDir);
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));
        if (jsonlFiles.length > 0) {
          projectFileMap.set(projectName, jsonlFiles.map(f => ({
            file: f,
            filePath: path.join(projectDir, f),
          })));
          totalFiles += jsonlFiles.length;
        }
      } catch {
        // Skip inaccessible project directories
      }
    }

    if (totalFiles === 0) {
      console.log('[CACHE] No JSONL files found to warm');
      return;
    }

    console.log(`[CACHE] Warming: found ${totalFiles} JSONL files across ${projectFileMap.size} projects`);

    for (const [projectName, fileEntries] of projectFileMap) {
      // Build file stats map for freshness checking
      const fileStatsMap = new Map();
      for (const { file, filePath } of fileEntries) {
        try {
          const stat = await fs.stat(filePath);
          fileStatsMap.set(file, { mtimeMs: stat.mtimeMs, size: stat.size });
        } catch {
          // File may have been deleted between readdir and stat
        }
      }

      // Check which files need (re)indexing
      const allFilenames = fileEntries.map(e => e.file);
      const uncachedFiles = messageCache.getUncachedFiles(projectName, allFilenames);
      const staleSessions = messageCache.getStaleSessionsForProject(projectName, fileStatsMap);

      // Invalidate stale sessions
      for (const sessionId of staleSessions) {
        messageCache.invalidateSession(sessionId);
      }

      // Determine which files to process:
      // - All uncached files
      // - Files that contained stale sessions (need to find which files those are)
      const filesToProcess = new Set(uncachedFiles);

      // If there are stale sessions, we need to re-process the files they came from
      // The stale sessions were already invalidated above, but we need to re-parse their files
      if (staleSessions.length > 0) {
        // Re-process all files for this project if any sessions are stale
        // (we don't track session-to-file mapping at this point)
        for (const { file } of fileEntries) {
          filesToProcess.add(file);
        }
      }

      if (filesToProcess.size === 0) {
        processedFiles += fileEntries.length;
        continue;
      }

      for (const { file, filePath } of fileEntries) {
        if (!filesToProcess.has(file)) {
          processedFiles++;
          continue;
        }

        try {
          const { sessions, entries } = await parseJsonlForCache(filePath);
          const stats = fileStatsMap.get(file);

          // Upsert sessions from this file
          for (const [sessionId, sessionMeta] of sessions) {
            // Filter out junk sessions (JSON-like summaries)
            const isJunk = sessionMeta.summary.startsWith('{ "') ? 1 : 0;

            messageCache.upsertSession({
              id: sessionId,
              projectName,
              summary: sessionMeta.summary,
              messageCount: sessionMeta.messageCount,
              lastActivity: sessionMeta.lastActivity,
              cwd: sessionMeta.cwd,
              lastUserMessage: sessionMeta.lastUserMessage,
              lastAssistantMessage: sessionMeta.lastAssistantMessage,
              jsonlFile: file,
              jsonlMtime: stats?.mtimeMs || null,
              jsonlSize: stats?.size || null,
              isJunk,
            });
            cachedSessions++;
          }

          // Insert messages for sessions from this file
          // Group entries by sessionId for batch insert
          const entriesBySession = new Map();
          for (const entry of entries) {
            if (!entry.sessionId) continue;
            if (!entriesBySession.has(entry.sessionId)) {
              entriesBySession.set(entry.sessionId, []);
            }
            entriesBySession.get(entry.sessionId).push(entry);
          }

          for (const [sessionId, sessionEntries] of entriesBySession) {
            messageCache.insertMessages(projectName, sessionId, sessionEntries);
            cachedMessages += sessionEntries.length;
          }
        } catch (error) {
          console.warn(`[CACHE] Error processing ${file} in ${projectName}:`, error.message);
        }

        processedFiles++;

        // Progress logging: every 10 files or every 5 seconds
        const now = Date.now();
        if (processedFiles % 10 === 0 || (now - lastLogTime > 5000)) {
          console.log(`[CACHE] Warming: ${processedFiles}/${totalFiles} files, ${cachedSessions} sessions cached`);
          lastLogTime = now;

          if (progressCallback) {
            progressCallback(processedFiles, totalFiles, cachedSessions);
          }
        }

        // Yield to event loop between files
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CACHE] Warming complete: ${cachedSessions} sessions, ${cachedMessages} messages in ${elapsed}s`);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[CACHE] Warming failed after ${elapsed}s:`, error.message);
  }
}

export { warmCache, parseJsonlForCache };
