# Playbook: Add Novel Server (Advanced)

## Personality Configuration

This playbook uses the MCP Helper personality dimension system. Check CLAUDE.md for user preferences or prompt for them if not found. Apply the user's selected verbosity, tone, and depth settings throughout this conversation.

See [personalities/dimension-system.md](../personalities/dimension-system.md) for details.

## Prerequisites Check

### Step 0: Foundation Servers Verification

**Say:**
"This is an advanced feature that requires foundation servers for research and configuration. Let me check your setup."

**Check for:**
1. Sequential Thinking - For planning
2. Perplexity - For research
3. Memory - For tracking progress
4. Serena - For code analysis
5. Context7 - For documentation

**If missing:**
"I notice you're missing some foundation servers. We need these to properly research and configure a novel server. Would you like to:
1. Set up the foundation servers first (recommended)
2. Proceed with limited capabilities
3. Cancel and come back later"

## Conversation Flow

### Step 1: Server Identification

**Say:**
"I'll help you add a completely new MCP server that's not in our catalog. This requires research and custom configuration."

**Ask:**
"What's the name of the MCP server you want to add? (e.g., 'sigma-mcp', 'custom-analytics-server')"

**Research Actions:**
```
Using perplexity, research:
- "[server-name] MCP server"
- "[server-name] Model Context Protocol"
- "GitHub [server-name] MCP"
```

### Step 2: Discovery Phase

**Say:**
"Let me research this server to understand its requirements and capabilities."

**Use foundation servers:**

1. **Perplexity Research:**
   ```
   "Find information about [server-name] MCP server including:
   - GitHub repository
   - Installation method
   - Required dependencies
   - Configuration requirements
   - API keys or credentials needed"
   ```

2. **GitHub Search (if available):**
   ```
   Using github, search repositories:
   - Query: "[server-name] MCP"
   - Look for official implementations
   - Check stars, recent updates
   ```

3. **Context7 Documentation:**
   ```
   Using context7, get documentation for:
   - Technologies used by the server
   - Framework requirements
   - Protocol specifications
   ```

### Step 3: Implementation Analysis

**Say:**
"I've found the server. Now let me analyze its implementation to understand how to configure it."

**Use Serena for code analysis:**
```
Using serena, analyze:
- Package.json / requirements.txt
- Configuration files
- Environment variables
- Entry points
- MCP protocol implementation
```

**Use Sequential Thinking:**
```
Plan the configuration strategy:
1. Installation method (npm, docker, pip)
2. Required environment variables
3. Configuration format
4. Integration approach
```

### Step 4: Requirements Gathering

**Say:**
"Based on my research, here's what this server does and what we'll need to configure it."

**Present findings:**
- **Purpose**: What the server does
- **Capabilities**: Features and tools it provides
- **Requirements**: 
  - Runtime (Node.js, Python, Docker)
  - Dependencies
  - API keys or credentials
  - System requirements

**Ask:**
"Do you have these requirements ready?
- [List specific requirements]
- [API keys needed]
- [Access credentials]"

### Step 5: Configuration Design

**Say:**
"Now I'll create a custom configuration for this server."

**Use Memory to track:**
```
Using memory, save:
- Server name and purpose
- Configuration decisions
- Installation steps
- Troubleshooting notes
```

**Design configuration:**

For **NPX-based server:**
```json
{
  "command": "npx",
  "args": ["-y", "@org/server-name"],
  "env": {
    "API_KEY": "${SERVER_NAME_API_KEY}",
    "CONFIG_PATH": "${HOME}/.server-name"
  }
}
```

For **Docker-based server:**
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "-e", "API_KEY=${SERVER_NAME_API_KEY}",
    "-v", "${HOME}/mcp-data/server-name:/data",
    "org/server-name:latest"
  ]
}
```

For **Python/UV-based server:**
```json
{
  "command": "uvx",
  "args": ["server-name"],
  "env": {
    "SERVER_CONFIG": "${HOME}/.config/server-name"
  }
}
```

### Step 6: Server Card Creation

**Say:**
"I'll create a server card to document this server for future use."

**Create comprehensive server card:**
```json
{
  "id": "server-name",
  "name": "Server Display Name",
  "version": "1.0.0",
  "description": "[From research]",
  "author": "[From research]",
  "repository": "[GitHub URL]",
  "homepage": "[If available]",
  "license": "[From repository]",
  
  "runtime": "node|docker|python",
  "deployment": "npx|docker|pip|uv",
  "status": "experimental",
  
  "capabilities": [
    "[List from research]"
  ],
  
  "configuration": {
    "command": "[Determined above]",
    "args": "[Determined above]",
    "env": {
      "[Variables needed]": "${ENV_VAR}"
    }
  },
  
  "environment_variables": {
    "ENV_VAR": {
      "description": "[What it does]",
      "required": true,
      "example": "[Example value]"
    }
  },
  
  "use_cases": [
    "[From research and analysis]"
  ],
  
  "pros": [
    "[Discovered benefits]"
  ],
  
  "cons": [
    "[Discovered limitations]"
  ],
  
  "ratings": {
    "human_verification": 3,
    "ai_agent": 3
  }
}
```

### Step 7: Implementation

**Say:**
"Now I'll configure the server in your environment."

**Steps:**

1. **Add to configuration:**
   - Update `~/.claude.json` or create local config
   - Add environment variables to `.env.mcp`

2. **Install dependencies:**
   ```bash
   # If npm-based
   npm install -g @org/server-name
   
   # If Docker-based
   docker pull org/server-name:latest
   
   # If Python-based
   pip install server-name
   ```

3. **Create supporting files:**
   - Configuration files
   - Data directories
   - Credential storage

### Step 8: Testing

**Say:**
"Let's test the newly configured server to ensure it's working."

**Test sequence:**
1. "Exit Claude Code"
2. "Set environment variables"
3. "Restart Claude Code"
4. "Check server appears: `/mcp list`"
5. "Test basic functionality"

**If errors occur:**
- Use Sequential Thinking to diagnose
- Use Perplexity to research error messages
- Use Memory to track troubleshooting steps

### Step 9: Documentation

**Say:**
"I'll document this server configuration for future reference."

**Create documentation:**

1. **Save server card** to `server-cards/`
2. **Update CLAUDE.md** with usage instructions
3. **Create README** for the server:
   ```markdown
   # [Server Name] MCP Server
   
   ## Purpose
   [What it does]
   
   ## Installation
   [Steps taken]
   
   ## Configuration
   [Required settings]
   
   ## Usage
   [How to use with Claude]
   
   ## Troubleshooting
   [Common issues and solutions]
   ```

### Step 10: Knowledge Preservation

**Say:**
"I'll save what we learned for future configurations."

**Use Memory:**
```
Using memory, create entities:
- Server configuration pattern
- Troubleshooting solutions
- Integration approach
- Lessons learned
```

## Decision Trees

### If server not found:
- Try alternative search terms
- Check for similar servers
- Ask for more information
- Suggest creating from scratch

### If incompatible runtime:
- Explain limitation
- Suggest alternatives
- Offer containerization
- Document for future support

### If complex dependencies:
- Break down requirements
- Prioritize essentials
- Create phased implementation
- Document dependencies

## Research Patterns

### NPM Package Research:
```
1. Search: "npm @modelcontextprotocol/server-[name]"
2. Check: package.json for dependencies
3. Review: README for configuration
4. Test: Installation locally
```

### Docker Image Research:
```
1. Search: "docker hub MCP [name]"
2. Check: Dockerfile for requirements
3. Review: Environment variables
4. Test: Container locally
```

### GitHub Repository Research:
```
1. Search: "github MCP server [name]"
2. Check: Implementation language
3. Review: Issues for common problems
4. Test: Clone and run locally
```

## Success Criteria

The conversation is successful when:
- [ ] Server is properly researched
- [ ] Requirements are understood
- [ ] Configuration is created
- [ ] Server is installed
- [ ] Server appears in `/mcp list`
- [ ] Basic functionality works
- [ ] Documentation is complete
- [ ] Knowledge is preserved in Memory
- [ ] Server card is created