# Adversarial Review — Phase 58 Execution

**Tier:** Deep
**Agents:** Guard (Sonnet) + Hunter (Opus) + Architect (Opus)
**Target:** server/index.js, deploy.sh
**Raw findings:** 33 | **After dedup:** 25

## Security (SS) — 3 findings

### SS-1: Wildcard CORS allows cross-origin API exploitation
- **File:** server/index.js:326
- **Found by:** Guard (SS) + Hunter (S) — **High confidence**
- **Bug:** `app.use(cors())` accepts all origins. Combined with JWT in localStorage, any website can make API calls.
- **Fix:** Restrict to `['https://samsara.tailad2401.ts.net:5443', 'http://100.86.4.57:5184']`
- **Scope:** Pre-existing

### SS-2: Path traversal in deleteProject
- **File:** server/projects.js:1374
- **Found by:** Hunter — **Moderate confidence**
- **Bug:** `projectName` from URL params not sanitized before `path.join` + `fs.rm({recursive, force})`. `..` as projectName deletes `~/.claude/`.
- **Fix:** Add `sanitizeProjectName()` call + path prefix check
- **Scope:** Pre-existing, out-of-phase file

### SS-3: Arbitrary filesystem enumeration via file tree endpoint
- **File:** server/index.js:888, server/projects.js:354
- **Found by:** Hunter — **Moderate confidence**
- **Bug:** `extractProjectDirectory` fallback converts dashes to slashes, enabling arbitrary directory listing.
- **Fix:** Return 404 on ENOENT instead of guessing path
- **Scope:** Pre-existing

## Bugs (S) — 5 findings

### S-1: showHidden parameter ignored in getFileTree
- **File:** server/index.js:2050
- **Found by:** Guard (S) + Hunter (A) + Architect (A) — **High confidence**
- **Bug:** Parameter accepted but never checked. Hidden files always returned.
- **Fix:** Add `if (!showHidden && entry.name.startsWith('.')) continue;`

### S-2: PORT defaults to 3001 (conflicts with RowLab)
- **File:** server/index.js:2126
- **Found by:** Guard — **Moderate confidence**
- **Bug:** Default 3001 conflicts with RowLab and contradicts all docs saying 5555.
- **Fix:** Change to `process.env.PORT || 5555`

### S-3: Hardcoded JWT secret in production
- **File:** server/middleware/auth.js:6
- **Found by:** Hunter — **Moderate confidence**
- **Bug:** Default secret `'claude-ui-dev-secret-change-in-production'` used if JWT_SECRET unset.
- **Fix:** Refuse to start in NODE_ENV=production without JWT_SECRET
- **Scope:** Pre-existing, out-of-phase file

### S-4: Duplicated orphan-check logic
- **File:** server/index.js:1146-1161, 1183-1197
- **Found by:** Architect — **Moderate confidence**
- **Bug:** Same "is any client watching this session?" loop duplicated.
- **Fix:** Extract `unwatchIfOrphaned()` helper

### S-5: Path traversal in file read/write with dash fallback
- **File:** server/index.js:763-768
- **Found by:** Hunter — **Medium confidence**
- **Bug:** Containment check fragile when extractProjectDirectory returns root-like paths.
- **Related to:** SS-3 (same root cause — dash-to-slash fallback)

## Edge Cases (A) — 8 findings

### A-1: Graceful shutdown can fire twice (SIGTERM + SIGINT race)
- **File:** server/index.js:2264-2265
- **Found by:** Hunter — **Moderate confidence**
- **Bug:** No guard prevents double-execution. Double messageCache.close() can throw.
- **Fix:** Add `let shuttingDown = false` guard
- **Scope:** Phase 58-introduced

### A-2: Dead hiddenFiles variable
- **File:** server/index.js:911
- **Found by:** Guard + Architect — **High confidence**
- **Fix:** Delete line

### A-3: Dynamic imports on every request (multer, openai, form-data)
- **File:** server/index.js:1572, 1635, 1721
- **Found by:** Guard + Architect — **High confidence**
- **Fix:** Move to top-level imports

### A-4: Re-imports of path, fs, os already at top of file
- **File:** server/index.js:1722-1724
- **Found by:** Architect — **Moderate confidence**
- **Fix:** Delete, use existing top-level imports

### A-5: Shell command builder dead win32 branches
- **File:** server/index.js:1306-1383
- **Found by:** Architect — **Moderate confidence**
- **Note:** Defer — structural, server is Linux-only

### A-6: permToRwx computed but never consumed by frontend
- **File:** server/index.js:2043-2048, 2087-2088
- **Found by:** Architect — **Moderate confidence**
- **Fix:** Remove dead computation

### A-7: System update endpoint double-response race
- **File:** server/index.js:447-470
- **Found by:** Hunter — **Medium confidence**
- **Fix:** Add `responded` flag

### A-8: WebSocketWriter duck-typing via marker booleans
- **File:** server/index.js:960-981
- **Found by:** Architect — **Medium confidence**
- **Note:** Defer — structural, works correctly today

## Quality (B) — 5 findings

### B-1: fs.existsSync in hot path (SPA fallback)
- **File:** server/index.js:2030
- **Found by:** Guard + Architect — **High confidence**
- **Fix:** Check once at startup

### B-2: NaN from unparsed query params
- **File:** server/index.js:492-493
- **Found by:** Hunter — **Moderate confidence**
- **Fix:** `parseInt(limit, 10) || 5`

### B-3: Deploy health check window too tight (5s)
- **File:** deploy.sh:13-14
- **Found by:** Hunter — **Medium confidence**
- **Fix:** Increase HEALTH_RETRIES to 15
- **Scope:** Phase 58-introduced

### B-4: Deploy vendor chunk validation brittle
- **File:** deploy.sh:89-98
- **Found by:** Architect — **Medium confidence**
- **Note:** Acceptable — chunks are stable, deploy.sh is maintained alongside vite config

### B-5: Express static serving redundant with nginx
- **File:** server/index.js:392-408
- **Found by:** Architect — **Medium confidence**
- **Note:** Keep for dev fallback. No action needed.

## Nits (C) — 3 findings

### C-1: Emoji in console.log (inconsistent with [INFO] pattern)
- **File:** server/index.js (various)
- **Found by:** Guard + Architect — **High confidence**
- **Note:** Defer — cosmetic, 30+ lines to change, separate cleanup

### C-2: Deploy.sh hardcoded URL
- **File:** deploy.sh:155
- **Found by:** Guard + Architect — **High confidence**
- **Fix:** Extract to variable

### C-3: Deploy copies dev artifacts into dist/
- **File:** deploy.sh:78
- **Found by:** Hunter — **Moderate confidence**
- **Fix:** Selective copy instead of wildcard

## Cross-Validation Summary
- High-confidence (multi-agent): 7
- Moderate (single Opus): 12
- Medium (single source, needs triage): 4
- Deferred (structural): 2

## Action Plan
Fix: SS-1, S-1, S-2, S-4, A-1, A-2, A-3, A-4, A-6, A-7, B-1, B-2, B-3, C-2, C-3
Defer: SS-2 (projects.js), SS-3 (projects.js), S-3 (auth.js), S-5 (related to SS-3), A-5 (win32), A-8 (marker), B-4 (acceptable), B-5 (keep), C-1 (cosmetic bulk)
