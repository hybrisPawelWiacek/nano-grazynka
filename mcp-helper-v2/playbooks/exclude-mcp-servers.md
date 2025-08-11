# Exclude MCP Servers Per Project

## Overview
This playbook guides you through excluding specific MCP servers on a per-project basis when Claude Code's global configuration makes all servers available.

## Personality: Troubleshooting Expert
*Methodical, precise, solution-focused. I help you surgically disable specific MCP servers without affecting your global setup.*

## The Problem

All MCP servers configured in `~/.claude.json` are globally available to every project. Sometimes you need to:
- Disable claude-code MCP to use native tools only
- Remove GitHub MCP for non-code projects
- Exclude specific servers that conflict with project requirements
- Create minimal MCP configurations for testing

**Current Reality**: Claude Code has no native per-project exclusion mechanism.

## Solution: Environment Variable Exclusion

### Step 1: Install the Wrapper Script

Create `~/.claude-mcp-wrapper.sh`:

```bash
#!/bin/bash
# MCP Server Wrapper for Per-Project Exclusion

SERVER_NAME="$1"
shift

# Convert server name to disable variable
# e.g., "claude-code" → "DISABLE_CLAUDE_CODE_MCP"
DISABLE_VAR="DISABLE_${SERVER_NAME^^}_MCP"
DISABLE_VAR="${DISABLE_VAR//-/_}"

# Check if disabled
if [ "${!DISABLE_VAR}" = "true" ]; then
  echo "[MCP] Server '$SERVER_NAME' disabled for this project" >&2
  # Keep running but do nothing
  while true; do
    sleep 3600
  done
fi

# Not disabled, run normally
exec "$@"
```

Make it executable:
```bash
chmod +x ~/.claude-mcp-wrapper.sh
```

### Step 2: Update ~/.claude.json

Wrap the servers you want to be excludable:

```json
{
  "mcpServers": {
    "claude-code": {
      "command": "bash",
      "args": [
        "~/.claude-mcp-wrapper.sh",
        "claude-code",
        "npx",
        "-y",
        "@anthropic/claude-code-mcp-server"
      ]
    },
    "github-official": {
      "command": "bash",
      "args": [
        "~/.claude-mcp-wrapper.sh",
        "github-official",
        "npx",
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
    // Wrap other servers similarly
  }
}
```

### Step 3: Exclude in Your Project

In your project's `.env`:

```bash
# Disable specific MCP servers
export DISABLE_CLAUDE_CODE_MCP=true
export DISABLE_GITHUB_OFFICIAL_MCP=true
export DISABLE_PUPPETEER_MCP=true

# Format: DISABLE_<SERVER_NAME>_MCP=true
# Server name uppercase, hyphens to underscores
```

### Step 4: Launch and Verify

```bash
# From your project directory
source .env && claude

# In Claude Code, verify exclusion
/mcp list
# Disabled servers won't appear or will show as inactive
```

## Common Exclusion Patterns

### Pattern 1: Native Tools Only
Disable all MCP servers, use Claude Code's built-in tools:

```bash
# .env
export DISABLE_CLAUDE_CODE_MCP=true
export DISABLE_GITHUB_OFFICIAL_MCP=true
export DISABLE_PUPPETEER_MCP=true
export DISABLE_PLAYWRIGHT_MCP=true
export DISABLE_FIRECRAWL_MCP=true
# ... disable all others
```

### Pattern 2: Minimal Documentation Project
Keep only documentation-related servers:

```bash
# .env
export DISABLE_CLAUDE_CODE_MCP=true
export DISABLE_GITHUB_OFFICIAL_MCP=true
export DISABLE_POSTGRES_MCP=true
export DISABLE_DOCKER_MCP_TOOLKIT_MCP=true
# Keep: Context7, Perplexity, Firecrawl
```

### Pattern 3: Security-Conscious Project
Disable servers that access external resources:

```bash
# .env
export DISABLE_GITHUB_OFFICIAL_MCP=true
export DISABLE_SLACK_MCP=true
export DISABLE_ATLASSIAN_MCP=true
export DISABLE_LINKEDIN_MCP_SERVER_MCP=true
export DISABLE_NOTION_MCP=true
# Keep only local tools
```

## Alternative Approaches

### Option 1: Multiple Configuration Files

Maintain separate configs:
- `~/.claude.json` - Full configuration
- `~/.claude-minimal.json` - Subset of servers
- `~/.claude-testing.json` - Testing configuration

Launch with specific config:
```bash
CLAUDE_CONFIG_PATH=~/.claude-minimal.json claude
```

### Option 2: Project Launch Scripts

Create `project-claude.sh`:
```bash
#!/bin/bash
# Custom launcher with specific servers

# Backup current config
cp ~/.claude.json ~/.claude.json.bak

# Use project config
cp ./.project-claude.json ~/.claude.json

# Launch
claude

# Restore on exit
trap "mv ~/.claude.json.bak ~/.claude.json" EXIT
```

## Troubleshooting

### Servers Still Appearing
1. Verify wrapper script is executable
2. Check environment variable naming (uppercase, underscores)
3. Ensure you sourced `.env` before launching
4. Restart Claude Code completely

### Wrapper Script Errors
- Check bash path: `which bash`
- Verify script permissions: `ls -l ~/.claude-mcp-wrapper.sh`
- Test manually: `DISABLE_TEST_MCP=true ~/.claude-mcp-wrapper.sh test echo "should not print"`

### Performance Impact
- Wrapper adds minimal overhead (<1ms)
- Disabled servers still consume a process slot (sleeping)
- For many exclusions, consider separate config files

## Best Practices

1. **Document Exclusions**: Add comments in `.env` explaining why servers are disabled
2. **Team Alignment**: Share exclusion patterns with team in README
3. **Test Thoroughly**: Verify critical functionality works without excluded servers
4. **Use Sparingly**: Only exclude when necessary; servers are useful
5. **Consider Alternatives**: Sometimes configuring the server differently is better than excluding

## Quick Reference Card

```bash
# Disable format
export DISABLE_<SERVER_NAME>_MCP=true

# Common servers
DISABLE_CLAUDE_CODE_MCP          # Claude Code MCP tools
DISABLE_GITHUB_OFFICIAL_MCP      # GitHub operations
DISABLE_SERENA_MCP               # Semantic code search
DISABLE_MEMORY_MCP               # Knowledge graphs
DISABLE_SEQUENTIALTHINKING_MCP   # Planning
DISABLE_PERPLEXITY_ASK_MCP       # Web research
DISABLE_CONTEXT7_MCP             # Documentation
DISABLE_FIRECRAWL_MCP            # Web scraping
DISABLE_POSTGRES_MCP             # Database
DISABLE_SLACK_MCP                # Slack integration
```

## When This Isn't Enough

If you need more complex exclusion logic:
1. Request native support: File issue with Claude Code team
2. Use MCP proxies: Build a proxy that filters server access
3. Container isolation: Run Claude Code in containers with different configs
4. Dynamic configs: Script that generates `.claude.json` based on project

## Next Steps

After setting up exclusions:
1. Test core functionality without excluded servers
2. Document which servers are essential vs optional
3. Create project templates with standard exclusions
4. Monitor for native exclusion support in Claude Code updates

---
*This playbook is part of MCP-Helper V2. For more configuration patterns, see the other playbooks.*