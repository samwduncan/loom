#!/bin/bash
# Autonomous Dynamic Colleague Bridge (Loom V2)
# This script manages a persistent Gemini architect session for Claude.

PROJECT_ROOT="/home/swd/loom"
SESSION_FILE="$PROJECT_ROOT/.planning/.colleague-session-id"

# Ensure we run from project root to find GEMINI.md
cd "$PROJECT_ROOT" || exit 1

# Handle --reset flag
if [ "$1" == "--reset" ]; then
  rm -f "$SESSION_FILE"
  echo "Architect session reset. A fresh one will be created on next call."
  exit 0
fi

if [ -z "$1" ]; then
  echo "Usage: ./ask-gemini.sh \"Your question\" [--reset]"
  exit 1
fi

# Function to initialize a new session
init_session() {
  # Start a session, capture the init JSON, extract the ID
  # We use a dummy prompt "Hello" to kickstart it.
  # The GEMINI.md will handle the project soul loading.
  INIT_OUTPUT=$(gemini --output-format stream-json "Hello, I am the persistent Lead Architect for Loom V2. Let's build something world-class." 2>/dev/null | grep '"type":"init"' | head -n 1)
  
  # Extract session_id using sed
  NEW_ID=$(echo "$INIT_OUTPUT" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')
  
  if [ -z "$NEW_ID" ]; then
    echo "Error: Failed to capture new Gemini session ID." >&2
    exit 1
  fi
  
  echo "$NEW_ID" > "$SESSION_FILE"
  echo "$NEW_ID"
}

# Get current ID or init
if [ -f "$SESSION_FILE" ]; then
  CURRENT_ID=$(cat "$SESSION_FILE")
else
  # Use stderr for status to not pollute Claude's data
  echo "Initializing a fresh Gemini Lead Architect session..." >&2
  CURRENT_ID=$(init_session)
fi

# Resume the session and pipe output back to Claude
# We use --quiet to avoid preamble/postamble noise
gemini --resume "$CURRENT_ID" --quiet "$1"
