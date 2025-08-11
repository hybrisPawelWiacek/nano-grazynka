# Disable Global MCP Server for Project

## Conversation Purpose
Guide users through disabling specific global MCP servers for their project while keeping them available globally.

## Target User
Developers who have global MCP servers configured but want to exclude specific ones from certain projects.

## Use Cases
- Security-sensitive projects that shouldn't access certain services
- Client projects with different API requirements
- Testing environments that need isolation
- Projects with conflicting server configurations

## Important: Use Serena for Code Search
**ALWAYS use Serena MCP server for searching through code and configuration files!** Serena provides semantic code understanding and is much more efficient than basic grep or file search. When looking for MCP configurations or understanding project structure, activate Serena first:

```bash
# Activate Serena for the project
mcp__serena__activate_project /path/to/project

# Then use Serena's semantic search capabilities
mcp__serena__search_for_pattern "mcpServers"
mcp__serena__find_symbol ".mcp.json"
```

## Conversation Flow

### 1. Initial Assessment
```
I'll help you disable specific MCP servers for this project. First, let me understand your setup:

1. Which global MCP server(s) do you want to disable for this project?
2. Do you want to replace it with a project-specific alternative, or completely exclude it?
3. Should this configuration be shared with your team (project scope) or just for you (local scope)?
```

### 2. Check Current Configuration (Using Serena When Possible)

**For code-heavy projects, use Serena first:**
```bash
# Activate Serena for semantic search
mcp__serena__activate_project .

# Search for MCP configurations
mcp__serena__search_for_pattern "mcpServers|mcp.*config"
```

**Fallback to standard commands if Serena unavailable:**
```bash
# Check global servers
claude mcp list --scope user

# Check project servers
claude mcp list --scope project
claude mcp list --scope local
```

### 3. Implementation Strategy

#### Option A: Override with Empty Configuration (Recommended)
Create a local or project-scoped "null" configuration that overrides the global server:

```bash
# Create project-specific override (shared with team)
echo '{
  "mcpServers": {
    "SERVER_NAME_TO_DISABLE": {
      "disabled": true,
      "comment": "Disabled for this project - conflicts with client requirements"
    }
  }
}' > .mcp.json

# Or for local-only override (just for you)
claude mcp add null-override --scope local --config '{"disabled": true}' --name SERVER_NAME_TO_DISABLE
```

#### Option B: Remove and Re-add Selectively
Remove the global server and re-add only where needed:

```bash
# Remove from global scope
claude mcp remove SERVER_NAME_TO_DISABLE --scope user

# Add back only to specific projects that need it
cd /path/to/project-that-needs-it
claude mcp add SERVER_NAME_TO_DISABLE --scope project /path/to/server
```

#### Option C: Use Tool Restrictions
If you can't modify MCP configuration, use Claude Code's tool restrictions:

```bash
# Create .claude/settings.json in project root
mkdir -p .claude
cat > .claude/settings.json << 'EOF'
{
  "permissions": {
    "deny": ["mcp__SERVER_NAME__*"]
  }
}
EOF
```

### 4. Verification (Use Serena for Deep Analysis)

**Using Serena to verify configuration:**
```bash
# Use Serena to find all MCP-related configurations
mcp__serena__search_for_pattern "mcp|SERVER_NAME"
mcp__serena__get_symbols_overview ".mcp.json"
```

**Standard verification:**
```bash
# List available MCP servers in this project
claude mcp list

# Test that the server is not accessible
claude "List available MCP tools" | grep -i SERVER_NAME
```

### 5. Documentation

**Create project documentation:**
```bash
cat >> PROJECT_MCP_CONFIG.md << 'EOF'
# MCP Server Configuration for This Project

## Disabled Global Servers
- **SERVER_NAME**: Disabled because [REASON]
  - Global configuration conflicts with [SPECIFIC REQUIREMENT]
  - To re-enable: Remove the override from .mcp.json

## Project-Specific Servers
[List any project-specific replacements]

## Team Instructions
This project has custom MCP server configurations. After cloning:
1. Review .mcp.json for project-specific settings
2. Run `claude mcp list` to verify your configuration
3. Contact [CONTACT] if you need access to disabled servers

## Code Search
For searching through configurations, use Serena MCP:
- Activate: `mcp__serena__activate_project .`
- Search: `mcp__serena__search_for_pattern "pattern"`
EOF
```

### 6. Common Scenarios

#### Scenario: Disable GitHub server for client project
```json
// .mcp.json
{
  "mcpServers": {
    "github-official": {
      "disabled": true,
      "comment": "Client uses GitLab, not GitHub"
    },
    "gitlab-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "${GITLAB_TOKEN}"
      }
    }
  }
}
```

#### Scenario: Disable memory server for ephemeral testing
```json
// .mcp.json
{
  "mcpServers": {
    "memory": {
      "disabled": true,
      "comment": "Testing environment - no persistence needed"
    }
  }
}
```

#### Scenario: Different database per project
```json
// .mcp.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${PROJECT_DATABASE_URL}"
      },
      "comment": "Override global postgres with project-specific database"
    }
  }
}
```

## Dimension Prompts

### Quick (Low Verbosity, Professional, Quick Depth)
"I'll disable [SERVER] for this project. Creating .mcp.json override... Done. The server is now excluded from this project while remaining available globally."

### Balanced (Medium Verbosity, Friendly, Balanced Depth)
"Let me help you disable [SERVER] for this project. I'll create a project-specific override that prevents this server from being used here, while keeping it available in your other projects. This is useful for [REASON]. Setting this up now... Perfect! The server is disabled for this project."

### Thorough (High Verbosity, Mentoring, Thorough Depth)
"I understand you want to disable [SERVER] for this specific project while maintaining it globally. This is a common requirement in professional development where different projects have different security or integration needs. Let me explain what we'll do:

1. First, we'll use Serena to search for existing configurations
2. Create a project-specific configuration that overrides the global setting
3. This uses Claude Code's scope hierarchy where local/project configs take precedence
4. The server remains available in your other projects but is excluded here

[Detailed implementation steps with explanations]

This approach ensures clean separation of concerns and makes your configuration intent clear to other developers."

## Troubleshooting

### Issue: Server still appears after disabling
- Use Serena to search for conflicting configurations: `mcp__serena__search_for_pattern "SERVER_NAME"`
- Check scope hierarchy: `claude mcp list --all-scopes`
- Ensure .mcp.json is in project root
- Restart Claude Code after configuration changes

### Issue: Team member can't replicate configuration
- Verify .mcp.json is committed to version control
- Use Serena to find all environment variable references
- Check environment variables are documented
- Run `claude mcp reset-project-choices` to clear cached approvals

### Issue: Need to temporarily re-enable
```bash
# Temporarily rename the override
mv .mcp.json .mcp.json.disabled
# Use the server
claude "Do something with the server"
# Restore the override
mv .mcp.json.disabled .mcp.json
```

## Best Practices

1. **Use Serena for code search** instead of grep/find when available
2. **Document the reason** for disabling in .mcp.json comments
3. **Use project scope** for team-wide restrictions
4. **Use local scope** for personal preferences
5. **Commit .mcp.json** to version control for team consistency
6. **Create a PROJECT_MCP_CONFIG.md** to explain non-standard configurations
7. **Test the configuration** with `claude mcp list` after changes
8. **Use meaningful comments** in override configurations

## Related Documentation
- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Scope Hierarchy Guide](../docs/mcp-scope-hierarchy.md)
- [Tool Permissions](../docs/tool-permissions.md)
- [Serena MCP Server](../server-cards/serena.json)