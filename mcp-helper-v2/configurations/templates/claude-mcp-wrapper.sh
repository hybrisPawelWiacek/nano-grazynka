#!/bin/bash
# MCP Server Wrapper Script for Per-Project Exclusion
# Place this at ~/.claude-mcp-wrapper.sh and make executable
# 
# Usage in ~/.claude.json:
#   "command": "bash",
#   "args": ["~/.claude-mcp-wrapper.sh", "server-name", "original", "command", "args"]
#
# To disable a server in a project, add to .env:
#   export DISABLE_SERVERNAME_MCP=true

SERVER_NAME="$1"
shift

# Convert server name to uppercase and replace hyphens
DISABLE_VAR="DISABLE_${SERVER_NAME^^}_MCP"
DISABLE_VAR="${DISABLE_VAR//-/_}"

if [ "${!DISABLE_VAR}" = "true" ]; then
  echo "[MCP] Server '$SERVER_NAME' disabled for this project" >&2
  # Keep running but do nothing
  while true; do
    sleep 3600
  done
fi

# Not disabled, execute the original command
exec "$@"