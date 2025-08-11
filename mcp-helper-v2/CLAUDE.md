# CLAUDE.md - MCP Helper V2

## Project Overview
MCP Helper V2 is a conversational framework for configuring MCP (Model Context Protocol) servers and creating specialized subagents. When cloned into a host project, it provides Claude Code with guided workflows, personalities, and templates for optimal MCP server setup.

## Architecture & Purpose
- **Type**: Conversational framework (NOT a tool or CLI)
- **Paradigm**: Documentation-driven conversations
- **Integration**: Cloned as subproject within host projects
- **Purpose**: Guide users through MCP server configuration via structured conversations

## How to Start
When this project is cloned into your host project, start conversations with:
> "I found MCP-Helper V2 in my project. Show me the available options."

Or directly:
> "There is a CLAUDE.md file in mcp-helper-v2, tell me what options I have"

## Quick Start Guide

### First Time? Set Your Preferences
I'll ask about your preferred interaction style:
- **Verbosity**: How detailed should responses be? (1=minimal to 5=comprehensive)
- **Tone**: Communication style (professional, friendly, casual, technical, mentoring)
- **Depth**: Context level (quick, balanced, thorough)

### Available Conversations

#### 🎨 Interaction Preferences
1. **"Set my interaction preferences"** → [Set Interaction Preferences](playbooks/set-interaction-preferences.md)
   - Configure verbosity (1-5), tone, and depth
   - Natural language adjustments ("be more casual")
   - Saves to CLAUDE.md for persistence

#### 🛠️ MCP Server Configuration
2. **"Set up MCP servers for a new project"** → [Greenfield Setup](playbooks/greenfield-setup.md)
3. **"Override global server configuration locally"** → [Global to Local](playbooks/reconfigure-global-to-local.md)
4. **"Reconfigure an existing MCP server"** → [Reconfigure Existing](playbooks/reconfigure-existing.md)
5. **"Add a server not in catalog"** → [Add Novel Server](playbooks/add-novel-server.md)
6. **"Disable a global server for this project"** → [Disable Project Server](playbooks/disable-project-server.md)

#### 🤖 Subagent Configuration
7. **"Create a specialized subagent"** → [Create Subagent](playbooks/create-subagent.md)
8. **"Optimize MCP protocols for agents"** → [Configure MCP Protocols](playbooks/configure-mcp-protocols.md)
9. **"Assemble a team of subagents"** → [Assemble Subagent Team](playbooks/assemble-subagent-team.md)
10. **"Import agents from community"** → [Import Existing Agents](playbooks/import-existing-agents.md)

#### 📁 Project Organization
11. **"Set up CLAUDE.md files for subprojects"** → [Setup Project CLAUDE.md](playbooks/setup-project-claude-md.md)

#### 📖 Best Practices & Guides
12. **"Show MCP server best practices"** → [MCP Server Best Practices](playbooks/mcp-server-best-practices.md)
   - Tool selection hierarchy and fallback chains
   - When to use Context7 vs Firecrawl vs Perplexity
   - GitHub for public repo research patterns
   - Token optimization strategies

## Project Structure
```
mcp-helper-v2/
├── CLAUDE.md                    # This file - main instructions
├── README.md                    # Project overview
├── quick-start-guide.md         # Legacy guide (content moved here)
├── minimum-requirements.md      # Foundation server requirements
├── subagent-configuration-guide.md # Subagent system overview
├── cross-server-integration-patterns.md # MCP server synergies
├── rating-explanation.md        # Agentic usefulness ratings
│
├── playbooks/                   # Conversation workflows
│   ├── greenfield-setup.md
│   ├── reconfigure-global-to-local.md
│   ├── reconfigure-existing.md
│   ├── add-novel-server.md
│   ├── disable-project-server.md
│   ├── create-subagent.md
│   ├── configure-mcp-protocols.md
│   ├── assemble-subagent-team.md
│   ├── import-existing-agents.md
│   └── setup-project-claude-md.md
│
├── personalities/               # Conversation personalities
│   ├── enthusiastic-guide.md   # For greenfield setups
│   ├── efficient-expert.md     # For reconfiguration
│   ├── patient-teacher.md      # For existing configs
│   ├── research-assistant.md   # For novel servers
│   └── subagent-architect.md   # For subagent creation
│
├── server-cards/               # 18 MCP server configurations
│   ├── README.md               # Server index
│   ├── serena.md               # Primary code navigation
│   ├── github.md               # Repository operations
│   ├── perplexity.md           # Research capabilities
│   └── ... (15 more servers)
│
├── agent-cards/                # 10+ agent archetypes
│   ├── README.md               # Agent index
│   ├── backend-architect.md    # Backend specialist
│   ├── frontend-developer.md   # UI/UX specialist
│   ├── devops-engineer.md      # Infrastructure specialist
│   └── ... (7+ more agents)
│
├── configurations/             # Configuration templates
│   └── templates/
│       ├── .env.template
│       └── .mcp.json.template
│
├── schemas/                    # JSON schemas
│   └── subagent-schema.json
│
└── templates/                  # Quick-start templates
    └── ...
```

## Conversation Personalities

I adapt my personality based on your chosen path:
- **Enthusiastic Guide** (Greenfield): Excited, encouraging, celebratory
- **Efficient Expert** (Reconfigure): Direct, focused, time-conscious
- **Patient Teacher** (Existing): Educational, thorough, explanatory
- **Research Assistant** (Novel): Methodical, investigative, comprehensive
- **Subagent Architect** (Subagents): Strategic, systematic, optimization-focused

## MCP Server Ratings

### Agentic Usefulness System
Each server has two ratings:
- **Human Verification (1-5)**: Aids human oversight and collaboration
- **AI Agent (1-5)**: Essential for autonomous AI tasks

### Essential Servers (Rating 5)
- **Serena**: Semantic code navigation (37% faster than grep)
- **Sequential Thinking**: Complex problem planning
- **Memory**: Persistent context across sessions
- **GitHub**: Full development workflow
- **Context7**: Up-to-date documentation

## Subagent System

### Agent Archetypes Available
- **Code Development**: backend-architect, frontend-developer, fullstack-engineer, database-specialist
- **Analysis & Research**: code-reviewer, security-auditor, performance-optimizer, documentation-writer
- **Infrastructure**: devops-engineer, cloud-architect, monitoring-specialist

### MCP Protocol Optimization
Each agent has optimized tool hierarchies:
```yaml
backend-architect:
  primary: [serena, github, postgres]
  secondary: [perplexity, memory]
  restricted: [puppeteer, playwright]
```

### Team Patterns
- **Role-Based**: Traditional dev team structure
- **Technology-Based**: Specialized by tech stack
- **Hierarchical**: Lead agents coordinate specialists

## Integration with Host Project

When cloned into a host project:
```
host-project/
├── CLAUDE.md                    # Host project instructions
├── src/                         # Host project code
└── mcp-helper-v2/
    └── CLAUDE.md                # This file
```

### Accessing Features
From host project, reference this framework:
- "Use mcp-helper-v2 to configure my MCP servers"
- "Follow the greenfield setup in mcp-helper-v2"
- "Create a backend-architect subagent using mcp-helper-v2"

## Common Tasks

### Configure New Project
1. Choose conversation type (1-5)
2. Follow the personality's guidance
3. Review generated configurations
4. Test with sample commands
5. Iterate based on results

### Create Subagent Team
1. Choose team pattern (role/tech/hierarchical)
2. Select agent archetypes
3. Configure MCP protocols
4. Set up coordination patterns
5. Test team workflows

### Add Novel MCP Server
1. Ensure foundation servers configured
2. Provide server documentation/repo
3. Review generated configuration
4. Test integration
5. Create server card

## Development Conventions

### For Contributors
- **Markdown Format**: All content in markdown
- **Personality Consistency**: Match personality to playbook
- **Template Updates**: Keep configurations current
- **Documentation**: Update when adding features

### File Naming
- Playbooks: `kebab-case.md`
- Server cards: `server-name.md`
- Agent cards: `role-name.md`
- Personalities: `adjective-noun.md`

## Testing & Validation

### Test Conversations
```bash
# Test greenfield setup
"I want to set up MCP servers for a new TypeScript project"

# Test subagent creation
"Create a security-focused code review agent"

# Test team assembly
"Build a full-stack development team with Python backend"
```

### Validation Checklist
- [ ] All playbooks have matching personalities
- [ ] Server cards include all config details
- [ ] Agent cards have MCP protocols defined
- [ ] Templates are up-to-date
- [ ] Cross-references work correctly

## External Resources
- **MCP Protocol Spec**: [Anthropic MCP Documentation](https://modelcontextprotocol.io)
- **Claude Code Docs**: [docs.anthropic.com/claude-code](https://docs.anthropic.com/claude-code)
- **Repository**: [github.com/hybrisPawelWiacek/mcp-helper-v2](https://github.com/hybrisPawelWiacek/mcp-helper-v2)

## DO NOT
- Don't use deprecated V1 (slash commands)
- Don't modify generated configs manually without understanding
- Don't skip foundation servers for advanced features
- Don't create subagents without clear purpose
- Don't ignore security best practices in configurations

## Frequently Used Commands

### In Host Project
```bash
# Clone MCP-Helper V2
git clone https://github.com/hybrisPawelWiacek/mcp-helper-v2

# Start Claude Code
claude

# Begin conversation
"I found mcp-helper-v2, what can it do?"
```

### Quick Configurations
```bash
# Minimal setup (3 essential servers)
"Set up minimal MCP servers for quick prototyping"

# Full setup (all 18 servers)
"Configure all recommended MCP servers"

# Team setup
"Create a 3-person dev team with backend, frontend, and QA"
```

## Support & Troubleshooting

### Common Issues

1. **"I don't see mcp-helper-v2"**
   - Ensure it's cloned into your project
   - Check directory name matches exactly
   - Verify CLAUDE.md exists

2. **"Conversations don't match personalities"**
   - Check you're using correct playbook
   - Verify personality file exists
   - Report issue on GitHub

3. **"Server configuration fails"**
   - Check environment variables set
   - Verify Docker/npm installed
   - Review server-specific requirements

## Next Steps

After initial setup:
1. **Test your configuration** with sample tasks
2. **Customize agent cards** for your team
3. **Create project-specific playbooks**
4. **Document patterns** that work well
5. **Share improvements** via pull requests

---
*MCP-Helper V2 - Conversational Framework for MCP Server Configuration*
*Version: 2.0.0 | Last Updated: 2025-01-11*