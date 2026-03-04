# Gemini Architect Integration Design

**Date:** 2026-03-04
**Status:** Approved
**Approach:** MCP Tool + Skill + CLAUDE.md GSD hooks

## Problem

The Gemini "Grumpy Architect" is currently invoked via shell scripts (`spawn-agent`, `ask-agent`) called through Claude's Bash tool. This has several issues:
- No real-time visibility into Gemini's response (buried in Bash output with stderr noise)
- Manual session management (user must run `spawn-agent` before first use)
- No automatic integration with GSD workflows
- Shell script invocation lacks the structured parameters and clean output of MCP tools

## Solution

Three components that work together:

### Component 1: `gemini_architect` MCP Tool

Add a new tool to the existing `gemini-research-mcp/index.js` server.

**Tool definition:**
```javascript
{
  name: 'gemini_architect',
  description: 'Consult the persistent Gemini Architect for architectural review, quality gates, or design consultations. Auto-manages session persistence.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The question, review request, or gate check prompt'
      },
      context_files: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths to attach as @file references (relative to project root)'
      },
      mode: {
        type: 'string',
        enum: ['review', 'consult', 'gate'],
        description: 'Framing mode: review (critical plan/code review), consult (architectural guidance), gate (pass/fail quality check)'
      },
      project_dir: {
        type: 'string',
        description: 'Project root directory (defaults to CWD). Used to find .gemini-agent-id and .planning/'
      }
    },
    required: ['query']
  }
}
```

**Session management logic:**
1. Read `{project_dir}/.gemini-agent-id` for existing session ID
2. If exists: attempt `gemini --resume {id} -p "{prompt}"`
3. If resume fails (exit code != 0 or error output): spawn fresh session
4. Fresh spawn: run `gemini --output-format stream-json "{priming_prompt}"`, extract session ID from init message, save to `.gemini-agent-id`, then resume with the actual query
5. Return Gemini's response text

**Mode-specific prompt prefixes:**
- `review`: "You are reviewing this as the Grumpy Architect. Be ruthlessly critical. Flag: Constitution violations, Interface-First Schema deviations, dependency chain violations, anything below 10/10 quality. Cite specific requirement IDs."
- `consult`: "You are consulting as the Grumpy Architect. Provide blunt, opinionated architectural guidance. Reference project documents and requirement IDs."
- `gate`: "This is a quality gate. You MUST respond with PASS or FAIL followed by specific findings. For each finding, cite the requirement ID and explain the violation."

**Priming prompt (for fresh sessions):**
```
You are the Grumpy Architect, the expert lead consultant for this project.
You are NOT a yes-man. You are an elite, highly opinionated systems engineer.
[... full persona from spawn-agent ...]

Review the project context: @.planning/PROJECT.md @.planning/MILESTONES.md @.planning/REQUIREMENTS.md @.planning/ROADMAP.md @.planning/V2_CONSTITUTION.md @.planning/BACKEND_API_CONTRACT.md @.planning/research/SUMMARY.md
```

Scans `.planning/` recursively for `*.md` files and includes all of them.

**Timeout:** 300s for resumed sessions, 360s for fresh sessions (extra 60s for priming).

**Error handling:**
- Session resume failure: auto-spawn fresh (transparent to caller)
- Gemini CLI not found: return clear error suggesting installation
- Timeout: return partial output if any, with timeout notice
- Rate limit (429): retry once after 5s backoff

### Component 2: `/consult-architect` Skill

New file: `~/.claude/commands/consult-architect.md`

```yaml
---
name: consult-architect
description: Consult the persistent Gemini Architect for review, guidance, or quality gate checks
argument-hint: '"Your question" [--review|--gate] [--files file1.md file2.md]'
---
```

**Behavior:**
1. Parse arguments for query text, mode flag, and optional file paths
2. If no query provided, read STATE.md to determine current phase and auto-generate a contextual query
3. Auto-gather context files based on current GSD state:
   - Always: ROADMAP.md, REQUIREMENTS.md (relevant section), STATE.md
   - If in a phase: PLAN.md files, CONTEXT.md, RESEARCH.md from current phase dir
   - If files specified via `--files`: add those too
4. Call `gemini_architect` MCP tool with gathered parameters
5. Display response with visual framing:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    GEMINI ARCHITECT — [MODE]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Gemini's response]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
6. If mode is `gate` and response contains "FAIL": highlight failures prominently

**Examples:**
- `/consult-architect "Should we use Tailwind v3.4 or v4 for OKLCH tokens?"`
- `/consult-architect --review` (auto-generates "Review current phase plans")
- `/consult-architect --gate` (auto-generates gate check for current phase)
- `/consult-architect --files src/styles/tokens.css "Review this token file"`

### Component 3: CLAUDE.md GSD Integration

Add instructions to the project CLAUDE.md that tell Claude when to automatically invoke `gemini_architect`:

```markdown
## Automatic Gemini Architect Consultation

During GSD workflows, AUTOMATICALLY call the gemini_architect MCP tool at these points:

1. **After plan-phase creates plans** (before presenting to user):
   - mode: "review"
   - query: "Review Phase {N} plans against requirements [{REQ-IDs}]. Flag Constitution violations, dependency chain issues, and anything below 10/10."
   - context_files: all PLAN.md files from the phase directory

2. **After execute-phase completes all waves** (before verification):
   - mode: "gate"
   - query: "Gate check for Phase {N}: {phase_name}. Verify deliverables against success criteria."
   - context_files: GATE-REPORT files from the phase directory

3. **During verify-work** (as second opinion on quality):
   - mode: "gate"
   - query: "Independent quality assessment of Phase {N}. Pass or fail against ROADMAP success criteria."

Present Gemini's findings alongside your own assessment. If Gemini flags issues you missed, acknowledge them.
```

## Migration from Shell Scripts

The existing `spawn-agent` and `ask-agent` scripts remain functional as standalone tools. They are NOT deprecated — they're useful for direct terminal access to the Gemini architect outside of Claude Code.

The MCP tool is the preferred path within Claude Code because:
- Structured parameters vs string concatenation
- Automatic session management vs manual `spawn-agent`
- Clean output vs stderr noise
- Available to all Claude tools (agents, skills, main conversation)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `~/gemini-research-mcp/index.js` | Modify | Add `gemini_architect` tool with session management |
| `~/.claude/commands/consult-architect.md` | Create | Slash command skill for manual invocation |
| `~/CLAUDE.md` | Modify | Add automatic GSD consultation instructions |
| `~/bin/spawn-agent` | Keep | Unchanged — still useful for terminal access |
| `~/bin/ask-agent` | Keep | Unchanged — still useful for terminal access |

## Testing

1. **MCP tool — fresh session**: Call `gemini_architect` with no existing `.gemini-agent-id`. Verify it spawns a session, primes it, saves the ID, and returns a response.
2. **MCP tool — resume session**: Call again. Verify it resumes the existing session (faster response, no re-priming).
3. **MCP tool — expired session**: Delete the session from Gemini's side, call again. Verify it auto-spawns fresh.
4. **Skill — manual**: Run `/consult-architect "What phase does DS-01 belong to?"`. Verify formatted response.
5. **Skill — auto-context**: Run `/consult-architect --review` during a phase. Verify it gathers phase files automatically.
6. **GSD integration**: Run `/gsd:plan-phase 1`. Verify Gemini architect is consulted after plans are created.

---
*Design approved: 2026-03-04*
