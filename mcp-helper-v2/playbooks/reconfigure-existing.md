# Playbook: Reconfigure Existing Server

## Personality Configuration

This playbook uses the MCP Helper personality dimension system. Check CLAUDE.md for user preferences or prompt for them if not found. Apply the user's selected verbosity, tone, and depth settings throughout this conversation.

See [personalities/dimension-system.md](../personalities/dimension-system.md) for details.

## Conversation Flow

### Step 1: Discovery

**Say:**
"I'll help you reconfigure your existing MCP server. Let's first understand your current setup and what you'd like to change."

**Actions:**
1. Check `~/.claude.json` for global servers
2. Check `.env.mcp` for local overrides
3. List all configured servers

**Ask:**
"Which server would you like to reconfigure? I can see you have: [list servers]"

### Step 2: Current Configuration Review

**Say:**
"Let me show you the current configuration for [server name]."

**Display:**
- Current configuration from `~/.claude.json`
- Current environment variables in use
- Whether it's global or local
- Current capabilities/features enabled

**Ask:**
"What aspect would you like to change?
- Credentials (API keys, tokens)
- Connection settings (URLs, ports)
- Features (enable/disable capabilities)
- Scope (global vs local)
- Something else?"

### Step 3: Change Planning

**Based on the type of change:**

### For Credential Changes

**Explain:**
"Credentials are stored as environment variables for security. Here's how we'll update them safely."

**Ask:**
- "Do you have the new credential ready?"
- "Should this apply globally or just for this project?"
- "Do you want to keep the old credential as backup?"

### For Connection Changes

**Explain:**
"Connection settings determine how Claude connects to the service."

**Examples:**
- PostgreSQL: "We can change the database, host, port, or user"
- GitHub: "We can point to a different GitHub instance (enterprise)"
- Slack: "We can connect to a different workspace"

### For Feature Changes

**Explain:**
"Let me explain what each feature does and how changing it affects behavior."

**For each feature:**
- Explain what it does
- Show current setting
- Explain implications of changing

### For Scope Changes

**Explain:**
"We can move this server from global to local (or vice versa). Here's what that means:"
- Global: Available in all projects
- Local: Only in this specific project

### Step 4: Implementation

**Say:**
"Now I'll make the changes. Here's exactly what I'm doing:"

### Updating Environment Variables

**If changing credentials:**
```bash
# In ~/.claude-env (global) or .env.mcp (local)
export OLD_GITHUB_PAT="ghp_old..."  # Backup
export GITHUB_PAT="ghp_new..."      # New credential
```

### Updating Configuration

**If changing server config:**
1. Show the current JSON configuration
2. Explain each change being made
3. Show the new JSON configuration
4. Write the updated configuration

**Example for PostgreSQL:**
```json
// Before
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "DATABASE_URL": "${POSTGRES_CONNECTION_STRING}"
  }
}

// After (with additional options)
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "DATABASE_URL": "${POSTGRES_CONNECTION_STRING}",
    "POSTGRES_POOL_MAX": "20",
    "POSTGRES_TIMEOUT": "30000"
  }
}
```

### Step 5: Migration (if needed)

**If moving from global to local:**

**Say:**
"I'll help you migrate this server from global to project-specific configuration."

**Steps:**
1. Copy global configuration
2. Create local `.env.mcp`
3. Create `claude-mcp-env.sh`
4. Optionally remove from global
5. Test local configuration

**If moving from local to global:**

**Say:**
"I'll help you make this server available in all your projects."

**Steps:**
1. Copy local configuration to `~/.claude.json`
2. Move credentials to `~/.claude-env`
3. Remove from local `.env.mcp`
4. Test global configuration

### Step 6: Validation

**Say:**
"Let's make sure everything is working with the new configuration."

**Test sequence:**
1. "Exit Claude Code"
2. "Restart with new config"
3. "Check server is available: `/mcp list`"
4. "Test the specific change we made"

**Specific tests by server:**

**GitHub:**
- "Using github, what's my username?"
- "Using github, list my recent repositories"

**PostgreSQL:**
- "Using postgres, show tables"
- "Using postgres, test connection"

**Perplexity:**
- "Using perplexity, research MCP servers"

### Step 7: Rollback Plan

**Say:**
"I've saved your previous configuration. If you need to rollback:"

**Provide:**
- Location of backup (`.claude.json.backup`)
- Old environment variables (commented in `.env`)
- Rollback commands

**Instructions:**
```bash
# To rollback:
cp ~/.claude.json.backup ~/.claude.json
# Uncomment old variables in ~/.claude-env
# Restart Claude Code
```

### Step 8: Documentation

**Say:**
"I've updated your documentation with the changes."

**Update CLAUDE.md with:**
- What was changed
- Why it was changed
- New configuration details
- How to use the reconfigured server

## Decision Trees

### If credential is invalid:
- Explain the error
- Show how to obtain valid credential
- Offer to configure with placeholder
- Create TODO for obtaining credential

### If change breaks other servers:
- Warn about dependencies
- Explain the impact
- Offer alternatives
- Ask for confirmation

### If unsure about change:
- Explain pros and cons
- Show examples of each option
- Recommend based on use case
- Let user decide

## Common Reconfigurations

### Adding Project-Specific Database
```bash
# Original: Uses global database
export POSTGRES_CONNECTION_STRING="postgresql://global@localhost/globaldb"

# Reconfigured: Project-specific
export POSTGRES_CONNECTION_STRING="postgresql://project@localhost:5433/projectdb"
```

### Switching GitHub Accounts
```bash
# Original: Personal account
export GITHUB_PAT="ghp_personal..."

# Reconfigured: Work account  
export GITHUB_PAT="ghp_work..."
```

### Enabling Advanced Features
```json
// Adding advanced Serena features
{
  "command": "uvx",
  "args": ["serena"],
  "env": {
    "SERENA_PROJECT_PATH": "${PWD}",
    "SERENA_ADVANCED_MODE": "true",
    "SERENA_CACHE_SIZE": "1000"
  }
}
```

## Success Criteria

The conversation is successful when:
- [ ] User understands current configuration
- [ ] User knows what each setting does
- [ ] Changes are implemented correctly
- [ ] New configuration is tested
- [ ] Rollback plan is available
- [ ] Documentation is updated
- [ ] User can use reconfigured server