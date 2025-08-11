# Playbook: Global to Local Reconfiguration

## Personality Configuration

This playbook uses the MCP Helper personality dimension system. Check CLAUDE.md for user preferences or prompt for them if not found. Apply the user's selected verbosity, tone, and depth settings throughout this conversation.

See [personalities/dimension-system.md](../personalities/dimension-system.md) for details.

## Conversation Flow

### Step 1: Quick Assessment

**Say:**
"I'll help you override global MCP server configurations for this specific project. Let's quickly identify what needs to be customized."

**Actions:**
1. Check for existing `~/.claude.json` (global config)
2. Check for existing `.env.mcp` (local config)
3. List currently configured global servers

**Ask:**
"Which global server(s) do you need to override locally? (e.g., 'GitHub with a different PAT', 'PostgreSQL with project database')"

### Step 2: Identify Override Reasons

**For each server to override, ask:**

**GitHub**:
- "Different GitHub account or organization?"
- "Different access permissions needed?"
- "Project-specific PAT?"

**PostgreSQL**:
- "Different database for this project?"
- "Different connection string?"
- "Project-specific credentials?"

**API-based servers** (Perplexity, Brave, etc.):
- "Different API key?"
- "Different rate limits?"
- "Project-specific account?"

### Step 3: Override Strategy

**Explain:**
"I'll create a local configuration that takes precedence over your global settings when you're in this project directory."

**Determine override type:**

1. **Environment Variable Override** (Most Common)
   - Server uses same config but different credentials
   - Example: Same GitHub server, different PAT

2. **Full Server Override** (Less Common)
   - Server needs different configuration
   - Example: Different PostgreSQL host/port

3. **Additional Configuration** (Hybrid)
   - Keep global but add project-specific settings
   - Example: Additional environment variables

### Step 4: Implementation

**Say:**
"Creating your local override configuration now."

**Actions:**

1. **Create `.env.mcp`** with project-specific variables:
   ```bash
   # Project-specific overrides
   export GITHUB_PAT="ghp_projectspecific123..."
   export POSTGRES_CONNECTION_STRING="postgresql://proj:pass@localhost:5433/projdb"
   export SERENA_PROJECT_PATH="${PWD}"
   ```

2. **Create `claude-mcp-env.sh`** launch script:
   ```bash
   #!/usr/bin/env bash
   # Load global environment first
   [ -f ~/.claude-env ] && source ~/.claude-env
   # Override with project-specific
   source .env.mcp
   # Launch Claude Code
   claude "$@"
   ```

3. **Update `.gitignore`**:
   ```
   .env.mcp
   ```

4. **Create project `CLAUDE.md`**:
   ```markdown
   # Project-Specific MCP Configuration
   
   This project overrides the following global servers:
   - GitHub: Using project-specific PAT
   - PostgreSQL: Connected to project database
   
   ## Launch Instructions
   Always start Claude Code using: `./claude-mcp-env.sh`
   
   ## Overridden Variables
   - GITHUB_PAT: Project-specific token
   - POSTGRES_CONNECTION_STRING: Project database
   ```

### Step 5: Advanced Overrides

**If user needs complex overrides:**

**Option A: Disable Global Server**
```bash
# In .env.mcp
export DISABLE_GITHUB_MCP=true  # Custom logic in launch script
```

**Option B: Add Project-Only Server**
```bash
# In launch script, modify ~/.claude.json temporarily
# Or use project-local .claude.json with merged configs
```

**Option C: Conditional Configuration**
```bash
# Based on project type, branch, etc.
if [ "$GIT_BRANCH" = "production" ]; then
    export DATABASE_URI="$PROD_DB"
else
    export DATABASE_URI="$DEV_DB"
fi
```

### Step 6: Validation

**Say:**
"Let's verify your overrides are working correctly."

**Guide through:**
1. "Exit Claude Code if running"
2. "Run: `./claude-mcp-env.sh`"
3. "Test overridden server: `/mcp list` (check it's still there)"
4. "Verify override: 'Using github, what's my username?' (should reflect project account)"

### Step 7: Documentation

**Say:**
"I've documented your configuration. Here's what you need to remember:"

**Provide summary:**
- Which servers are overridden
- What values are project-specific
- How to launch (always use `./claude-mcp-env.sh`)
- How to update overrides (edit `.env.mcp`)

## Decision Trees

### If no global config exists:
- Suggest running greenfield setup first
- Offer to create both global and local together
- Explain the override concept for future use

### If server doesn't support env override:
- Explain limitation
- Suggest alternative approaches
- Consider full local server installation

### If override conflicts with team:
- Discuss `.env.mcp.example` for team sharing
- Explain secret management best practices
- Suggest using same variable names across team

## Configuration Templates

Use these templates from `configurations/templates/`:

**`.env.mcp.template`**:
```bash
# Project-Specific MCP Server Overrides
# Copy to .env.mcp and fill in your values

# Override global GitHub PAT
export GITHUB_PAT="ghp_your_project_token"

# Override global database
export POSTGRES_CONNECTION_STRING="postgresql://user:pass@host:port/db"

# Project-specific API keys
export PERPLEXITY_API_KEY="pplx_project_key"
```

**`claude-mcp-env.sh.template`**:
```bash
#!/usr/bin/env bash
# Launch Claude Code with project overrides

# Load global defaults
[ -f ~/.claude-env ] && source ~/.claude-env

# Apply project overrides
source .env.mcp

# Launch Claude Code
exec claude "$@"
```

## Success Criteria

The conversation is successful when:
- [ ] User understands override mechanism
- [ ] Local overrides are configured
- [ ] Launch script works correctly
- [ ] Overrides take precedence over global
- [ ] Documentation is clear
- [ ] User can switch between global and local