#!/usr/bin/env bash
# Launch Claude Code with project-specific MCP overrides
# Usage: ./claude-mcp-env.sh [claude-args]

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Launching Claude Code for nano-grazynka project${NC}"

# Load global environment first (if exists)
if [ -f ~/.claude-env ]; then
    echo -e "${YELLOW}Loading global Claude environment...${NC}"
    source ~/.claude-env
fi

# Apply project-specific overrides
if [ -f .env.mcp ]; then
    echo -e "${GREEN}Applying project-specific MCP configuration...${NC}"
    source .env.mcp
else
    echo -e "${YELLOW}Warning: .env.mcp not found. Using global config only.${NC}"
fi

# Display active configuration
echo -e "${GREEN}Active MCP Configuration:${NC}"
echo "  - Serena: Code analysis at ${SERENA_PROJECT_PATH}"
echo "  - Memory: Auto-save at ${MEMORY_CONTEXT_THRESHOLD}% context"
echo "  - GitHub: Default repo ${GITHUB_DEFAULT_REPO}"
echo "  - Frontend: ${FRONTEND_URL}"
echo "  - Backend: ${BACKEND_URL}"
echo ""

# Launch Claude Code with all arguments passed through
exec claude "$@"