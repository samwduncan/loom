#!/bin/bash
# Loom V2: Colleague Spawning Engine
# This script initializes a high-context Gemini Architect session.

PROJECT_ROOT="/home/swd/loom"
PLANNING_DIR="$PROJECT_ROOT/.planning"
SESSION_FILE="$PLANNING_DIR/.colleague-session-id"
MANIFEST_FILE="$PLANNING_DIR/COLLEAGUE_MANIFEST.md"

cd "$PROJECT_ROOT" || exit 1

echo "--- SPAWNING GEMINI ARCHITECT ---" >&2

# 1. Gather Context (Optimized for tokens)
# We identify the core files that define the project's logic and architecture.
CORE_FILES=(
  ".planning/PROJECT_SOUL.md"
  ".planning/audit/UX_ARCHITECTURE_DEEP_DIVE.md"
  ".planning/audit/UI_COMPONENT_ARCHITECTURE.md"
  ".planning/audit/V2_REWRITE_PLAYBOOK.md"
  ".planning/audit/WEBSOCKET_SCHEMA.md"
  ".planning/CLOUDCLI_FEATURE_SYNTHESIS.md"
  "GEMINI.md"
)

# 2. Create the Manifest for Claude
echo "# Gemini Architect: Active Context Manifest" > "$MANIFEST_FILE"
echo "This session has been primed with the following foundational documents:" >> "$MANIFEST_FILE"
for file in "${CORE_FILES[@]}"; do
  echo "- $file" >> "$MANIFEST_FILE"
done
echo -e "\n*Use this colleague to offload conceptual reasoning and preserve your own context window tokens.*" >> "$MANIFEST_FILE"

# 3. Initialize the Gemini Session
# We use a custom priming prompt that tells Gemini exactly who it is.
PRIMING_PROMPT="I am starting a new persistent session. You are the Lead Systems & UX Architect for Loom V2. Your brain is now primed with the project soul and architecture docs. Acknowledge your role and await Claude's first consultation."

INIT_OUTPUT=$(gemini --output-format stream-json "$PRIMING_PROMPT" 2>/dev/null | grep '"type":"init"' | head -n 1)
NEW_ID=$(echo "$INIT_OUTPUT" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')

if [ -z "$NEW_ID" ]; then
  echo "Error: Failed to spawn Gemini session." >&2
  exit 1
fi

echo "$NEW_ID" > "$SESSION_FILE"

echo "Success: Gemini Architect spawned with Session ID: $NEW_ID" >&2
echo "Context loaded: ${#CORE_FILES[@]} files." >&2
echo "Claude can now use ./loom/.planning/ask-gemini.sh to consult." >&2
