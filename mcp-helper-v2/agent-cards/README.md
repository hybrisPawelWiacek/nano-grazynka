# Agent Cards Directory

## Overview
This directory contains standardized agent configuration cards for the MCP-Helper V2 Subagent Configuration System. Each card defines an agent archetype with specific MCP server protocols, performance metrics, and integration patterns.

## Agent Archetypes

### Code Development Agents
- **[Backend Architect](backend-architect.md)** - System design and API architecture
- **[Frontend Developer](frontend-developer.md)** - UI/UX implementation
- **[DevOps Engineer](devops-engineer.md)** - Infrastructure and automation
- **[QA Engineer](qa-engineer.md)** - Testing and quality assurance
- **[Code Reviewer](code-reviewer.md)** - Code quality and standards

### Specialized Domain Agents
- **[Data Scientist](data-scientist.md)** - ML models and data analysis
- **[Security Auditor](security-auditor.md)** - Security and compliance
- **[Documentation Writer](documentation-writer.md)** - Technical documentation
- **[Research Analyst](research-analyst.md)** - Technology research

### Management & Coordination
- **[Project Manager](project-manager.md)** - Project coordination and delivery

## Card Structure

Each agent card contains:
1. **Overview** - Role description
2. **Primary Responsibilities** - Key tasks
3. **MCP Server Protocol** - Tool hierarchy
4. **Perplexity System Prompt** - Research personality
5. **Personality Traits** - Communication style
6. **Integration Patterns** - Team collaboration
7. **Performance Metrics** - Success criteria
8. **Example Workflows** - Common sequences
9. **Configuration Template** - JSON config

## Usage

### In Playbooks
Reference agent cards when assembling teams:
```markdown
See [Backend Architect](../agent-cards/backend-architect.md) for MCP protocol
```

### In Configurations
Use the JSON templates from cards:
```json
{
  "agents": [
    // Copy from agent card Configuration Template
  ]
}
```

### Performance Optimization
- **Primary tools**: Use first for best performance
- **Secondary tools**: Use when primary unavailable
- **Restricted tools**: Avoid or minimize usage

## MCP Server Performance Notes
- **Serena**: 37% faster than native grep for code search
- **Parallel execution**: Use multiple tools simultaneously
- **Caching**: Memory server reduces repeated lookups by 60%

## Creating New Agent Cards

Template for new agents:
```markdown
# [Agent Name] Agent

## Overview
[Role description]

## Primary Responsibilities
- [Task 1]
- [Task 2]

## MCP Server Protocol
### Primary Tools (Use First)
1. **[Server]** - [Purpose]

### Secondary Tools
- **[Server]** - [Purpose]

### Restricted Tools
- [What to avoid and why]

## Perplexity System Prompt
```json
{
  "role": "system",
  "content": "[Specialized prompt]"
}
```

## Personality Traits
- **Tone**: [Style]
- **Depth**: [Level]
- **Focus**: [Priority]

## Integration Patterns
- [Collaboration points]

## Performance Metrics
- [Metric]: [Target]

## Example Workflows
1. **[Workflow]**: [Tool sequence]

## Configuration Template
```json
{
  "agent_type": "[type]",
  "mcp_servers": {
    "primary": [],
    "secondary": [],
    "restricted": []
  }
}
```
```

## Organizational Patterns

### Role-Based Organization
Group agents by function (Development, QA, Operations)

### Technology-Based Organization
Group agents by stack (Frontend, Backend, Data)

### Hierarchical Organization
Lead agents coordinate specialist teams

See [Assemble Subagent Team](../playbooks/assemble-subagent-team.md) for detailed patterns.