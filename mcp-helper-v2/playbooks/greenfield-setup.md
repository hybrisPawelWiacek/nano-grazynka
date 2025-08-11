# Playbook: Greenfield Setup

## Personality Configuration

This playbook uses the MCP Helper personality dimension system. Check CLAUDE.md for user preferences or prompt for them if not found. Apply the user's selected verbosity, tone, and depth settings throughout this conversation.

See [personalities/dimension-system.md](../personalities/dimension-system.md) for details.

## Conversation Flow

### Step 1: Welcome and Project Understanding

**Say:**
"Welcome! I'm thrilled to help you set up MCP servers for your new project! Let's discover the perfect configuration together."

**Ask:**
1. "What type of project are you building? (e.g., web app, CLI tool, data analysis, API service)"
2. "What's your primary programming language?"
3. "Will this project involve team collaboration?"

### Step 2: Capability Discovery

**Say:**
"Based on your project type, let me understand what capabilities you'll need."

**Ask these questions based on project type:**

For **Web/App Development**:
- "Will you need to interact with GitHub for version control?"
- "Do you need web scraping or content extraction?"
- "Will you be working with documentation from frameworks?"
- "Do you need semantic code navigation?"

For **Data/API Projects**:
- "Will you need database access?"
- "Do you need to fetch data from websites?"
- "Will you integrate with third-party APIs?"

For **All Projects**:
- "Do you want AI-assisted research capabilities?"
- "Would persistent memory across sessions be helpful?"
- "Do you need team communication integration (Slack)?"

### Step 3: Server Recommendations

Based on answers, recommend servers using our **Agentic Usefulness Ratings** (see [rating-explanation.md](../rating-explanation.md) for details):

#### Essential Servers (Always Recommend - AI Rating ≥ 4)
1. **Serena** (AI: 5, Human: 4) - Semantic code navigation
2. **Sequential Thinking** (AI: 5, Human: 4) - Complex problem planning
3. **Memory** (AI: 5, Human: 3) - Persistent context
4. **Context7** (AI: 5, Human: 3) - Up-to-date documentation
5. **GitHub Official** (AI: 5, Human: 4) - Full development workflow

#### High-Value Development Servers (AI Rating 4+)
- **Perplexity Ask** (AI: 4, Human: 2) - Deep research capabilities
- **Firecrawl** (AI: 4, Human: 2) - Web scraping and extraction

#### Team Collaboration (High Human Rating)
- **Slack** (AI: 3, Human: 5) - Critical for team communication
- **Atlassian** (AI: 3, Human: 4) - Jira/Confluence tracking
- **Notion** (AI: 3, Human: 4) - Documentation management

#### Specialized Servers
- **PostgreSQL** (AI: 3, Human: 2) - Database operations
- **Brave Search** (AI: 3, Human: 2) - Privacy-focused search
- **Playwright/Puppeteer** (AI: 3, Human: 2) - Browser automation

### Step 4: Recommend Based on Workflow Type

**Say:**
"Based on your needs, here's my recommendation:"

**For Solo Developers (Maximize AI Autonomy):**
"I recommend focusing on servers with AI Rating ≥ 4:
- Essential: Serena, Sequential Thinking, Memory, GitHub, Context7
- These will give you maximum AI assistance and automation"

**For Team Projects (Balance Human & AI):**
"I recommend a balanced approach:
- AI Power: Serena (5), GitHub (5), Sequential Thinking (5)
- Human Collaboration: Slack (Human: 5), Atlassian (Human: 4)
- This ensures both powerful AI assistance and team visibility"

**For Review-Heavy Workflows (Human Oversight):**
"I recommend prioritizing Human Verification ratings:
- Slack (Human: 5) for notifications
- GitHub (Human: 4) for PR workflow
- Sequential Thinking (Human: 4) for transparent reasoning"

### Step 5: Configuration Scope

**Ask:**
"Would you like these servers configured:
1. **Globally** - Available for all your projects (recommended for first-time setup)
2. **Locally** - Only for this specific project
3. **Mixed** - Some global, some local (I'll help you decide which)"

### Step 5: Gather Credentials

**Say:**
"Perfect! Now I'll need some API keys and credentials. Don't worry if you don't have them all - I'll show you how to get each one."

For each selected server, ask for required credentials:

**GitHub**: 
- "Do you have a GitHub Personal Access Token? (I can show you how to create one)"

**Perplexity**:
- "Do you have a Perplexity API key? (Sign up at perplexity.ai)"
- "I'll configure Perplexity with persona-based system prompts for targeted research (Senior Developer, Architect, etc.)"

**Brave Search**:
- "Do you have a Brave Search API key? (Free tier available)"

**Slack**:
- "Do you have a Slack Bot Token and Team ID?"

### Step 6: Implementation

**Say:**
"Excellent! Let me set everything up for you. I'll configure this for optimal performance using native Claude Code tools."

**Important Performance Note:**
"I'm setting this up to use Claude Code's native tools directly, which gives you **37% faster performance** compared to the `claude mcp serve` approach. This is the recommended configuration for most developers."

**Actions to take:**

1. **For Global Configuration (Native Tools - Recommended):**
   ```bash
   # Create ~/.claude.json with server configurations
   # Create ~/.claude-env-template with placeholders
   # Guide user to fill in ~/.claude-env
   # Note: No 'claude mcp serve' needed - just 'claude'
   ```

2. **For Local Configuration (Native Tools - Recommended):**
   ```bash
   # Create .env.mcp in project root
   # Create claude-env.sh launch script (uses native tools)
   # Add .env.mcp to .gitignore
   # Launch with: source .env.mcp && claude
   ```

3. **Alternative: If Claude Desktop Integration Needed:**
   ```bash
   # Only if user specifically requests Claude Desktop integration
   # Warn about 18+ second delays and process issues
   # Configure 'claude mcp serve' approach
   ```

3. **Configure Perplexity Personas** (if Perplexity selected):
   - Senior Developer: For debugging and implementation
   - Solution Architect: For system design decisions
   - DevOps Engineer: For deployment and infrastructure
   - Security Expert: For security considerations
   - MVP Builder: For rapid prototyping
   
4. **Create CLAUDE.md** with:
   - List of configured servers
   - Their purposes
   - How to use them
   - Required environment variables
   - Perplexity persona guidelines (if applicable)

### Step 7: Validation

**Say:**
"Let's make sure everything is working perfectly!"

**Guide user through:**
1. "Exit Claude Code (if running)"
2. "Source your environment: `source ~/.claude-env` (global) or `./claude-mcp-env.sh` (local)"
3. "Start Claude Code: `claude`"
4. "Run: `/mcp list` to see all configured servers"
5. "Test a server: 'Using serena, what files are in this project?'"

### Step 8: Success & Next Steps

**Say:**
"🎉 Fantastic! Your MCP servers are all set up and ready to supercharge your development!"

**Provide:**
- Summary of configured servers
- Quick reference card of useful commands
- Tips for using each server effectively

**Ask:**
"Is there any specific server you'd like to learn more about, or shall we test one of them together?"

## Decision Trees

### If user doesn't have Docker Desktop:
- Explain importance
- Provide installation link
- Offer to continue with non-Docker servers only
- Mark Docker-based servers for later setup

### If user doesn't have API keys:
- Provide sign-up links
- Offer to configure server with placeholder
- Create TODO list for obtaining keys
- Continue with servers that don't need keys

### If user is unsure about server selection:
- Recommend starter pack: Serena, GitHub, Memory, Perplexity
- Explain each server's benefit
- Offer to start minimal and expand later

## Configuration Templates

Reference templates from `configurations/templates/`:
- `claude.json.template`
- `env.mcp.template`
- `claude-mcp-env.sh.template`
- `CLAUDE.md.template`

## Success Criteria

The conversation is successful when:
- [ ] User understands what MCP servers do
- [ ] Appropriate servers are selected for project needs
- [ ] All configurations are created
- [ ] Environment variables are set
- [ ] User can start Claude Code with servers
- [ ] At least one server is tested successfully
- [ ] User knows how to use the servers