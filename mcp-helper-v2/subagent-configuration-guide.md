# Subagent Configuration Guide with MCP Protocols

## Welcome to Advanced Subagent Configuration! 🚀

You're about to unlock the full potential of Claude Code CLI by creating specialized AI assistants with optimized MCP server protocols. This guide will help you configure subagents that leverage the right tools for maximum efficiency.

## What are Subagents with MCP Protocols?

Subagents are specialized AI assistants that extend Claude Code's capabilities. With MCP (Model Context Protocol) server integration, each subagent can be configured with specific tools and workflows optimized for their domain expertise.

### Key Benefits:
- **Isolated Context Windows**: Each subagent maintains its own context, preventing pollution
- **Optimized Tool Selection**: MCP protocols ensure subagents use the most efficient tools
- **Parallel Execution**: Multiple subagents can work simultaneously on different aspects
- **Domain Expertise**: Each subagent specializes with curated MCP server access

## Configuration Options

### 1. 🎨 **Create New Subagent** (subagent-architect personality)
Create a brand new subagent with custom MCP protocol configuration.
- **When to use**: Building specialized agents for your project
- **Personality**: Methodical architect who designs optimal agent configurations
- **Playbook**: [playbooks/create-subagent.md](playbooks/create-subagent.md)

### 2. 🔧 **Configure MCP Protocols** (protocol-designer personality)
Define or modify MCP server usage protocols for existing subagents.
- **When to use**: Optimizing tool usage for specific agent types
- **Personality**: Technical expert focused on efficiency and performance
- **Playbook**: [playbooks/configure-mcp-protocols.md](playbooks/configure-mcp-protocols.md)

### 3. 👥 **Assemble Subagent Team** (team-orchestrator personality)
Create a coordinated team of subagents for complex projects.
- **When to use**: Multi-faceted projects requiring diverse expertise
- **Personality**: Strategic coordinator who optimizes team collaboration
- **Playbook**: [playbooks/assemble-subagent-team.md](playbooks/assemble-subagent-team.md)

### 4. 🏗️ **Import Existing Agents** (migration-specialist personality)
Import and enhance subagents from community repositories with MCP protocols.
- **When to use**: Leveraging existing agent collections (lst97, wshobson, etc.)
- **Personality**: Integration expert who adapts and enhances existing agents
- **Playbook**: [playbooks/import-existing-agents.md](playbooks/import-existing-agents.md)

## Subagent Archetypes with MCP Protocols

We've pre-configured optimal MCP server protocols for common subagent types:

### Development Specialists
- **backend-architect**: GitHub, Postgres, Serena, Sequential Thinking
- **frontend-designer**: Playwright, Firecrawl, Context7, Puppeteer
- **mobile-developer**: Context7, GitHub, Playwright
- **api-designer**: Context7, GitHub, Serena, Postgres

### Quality & Security
- **security-auditor**: GitHub (read-only), Perplexity, Brave-search
- **code-reviewer**: Serena, GitHub, Sequential Thinking
- **test-automator**: Playwright, Puppeteer, GitHub

### Infrastructure & Operations  
- **devops-engineer**: GitHub, Docker, Serena
- **database-optimizer**: Postgres, Serena, Sequential Thinking
- **cloud-architect**: Context7, Perplexity, GitHub

### Data & AI
- **data-scientist**: Postgres, Context7, Perplexity
- **ai-engineer**: Context7, Perplexity, Memory
- **ml-engineer**: GitHub, Context7, Sequential Thinking

## MCP Protocol Structure

Each subagent's MCP protocol configuration includes:

```yaml
mcp_protocol:
  primary_servers:
    - name: serena
      purpose: "Semantic code understanding and navigation"
      priority: 1
    - name: github
      purpose: "Repository operations and version control"
      priority: 2
      
  fallback_servers:
    - name: grep
      when: "serena unavailable"
      replaces: serena
      
  tool_hierarchies:
    code_search:
      1: "serena (semantic search)"
      2: "grep (pattern matching)"
      3: "read (direct file access)"
      
  workflow_patterns:
    - name: "code_review"
      sequence: ["serena.find_symbol", "github.get_pr_diff", "sequential_thinking.analyze"]
      
  restrictions:
    - "No write access to production databases"
    - "Read-only GitHub access for security reviews"
```

## Quick Start Examples

### Example 1: Create a Code Reviewer with MCP Protocols
```
Claude: "I'll help you create a code reviewer subagent. Which MCP servers should it prioritize?"
You: "Focus on Serena for code understanding and GitHub for PR context"
```

### Example 2: Configure Security Auditor Protocols
```
Claude: "Let's configure your security auditor. Should it have write access to fix issues?"
You: "No, read-only access. It should report findings only."
```

### Example 3: Build a Performance Team
```
Claude: "I'll assemble a performance optimization team. How many agents do you need?"
You: "Three: performance-engineer, database-optimizer, and frontend-optimizer"
```

## Foundation Requirements

For advanced subagent features, ensure these MCP servers are configured:
- **Sequential Thinking**: For complex reasoning in agent logic
- **Memory**: For persistent agent knowledge
- **Context7**: For up-to-date documentation access
- **Serena**: For semantic code understanding

## Next Steps

Choose your path:
1. Say: "Let's create a new subagent with MCP protocols"
2. Say: "Help me configure MCP protocols for my existing agents"
3. Say: "I need to assemble a subagent team for my project"
4. Say: "Import and enhance agents from [repository name]"

---

*Ready to supercharge your development workflow with specialized AI assistants? Let's begin!*