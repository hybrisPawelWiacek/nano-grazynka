# Agentic Usefulness Rating System

## Performance Note: Native Tools vs `claude mcp serve`

**IMPORTANT**: We strongly recommend using Claude Code's native tools directly (just `claude`) rather than the `claude mcp serve` approach:
- **Native tools are 37% faster** with minimal latency
- **Avoid 18+ second delays** that plague MCP server configurations
- **No process management issues** or connection problems

See [Native vs MCP Serve Guide](../../docs/canonical/native-vs-mcp-serve.md) for detailed performance comparison.

## Overview

Each MCP server in our catalog is evaluated on two key dimensions that determine its value in AI-assisted development workflows:

1. **Human Verification Rating (1-5)**: How well the server aids human oversight, verification, and collaboration
2. **AI Agent Rating (1-5)**: How essential the server is for autonomous AI agent tasks

These ratings help you make informed decisions about which servers to install based on your workflow needs.

## Rating Scale

### Human Verification Rating
- **5 - Critical**: Essential for human oversight and team collaboration (e.g., Slack for notifications)
- **4 - High**: Significantly improves human verification workflow (e.g., GitHub for PR reviews)
- **3 - Moderate**: Useful for occasional verification needs
- **2 - Low**: Limited human verification value
- **1 - Minimal**: Rarely needed for human oversight

### AI Agent Rating
- **5 - Essential**: Core functionality that AI agents need constantly (e.g., Serena for code navigation)
- **4 - Very High**: Frequently needed for AI effectiveness (e.g., Context7 for documentation)
- **3 - Moderate**: Useful for specific AI tasks
- **2 - Low**: Occasionally helpful for AI agents
- **1 - Minimal**: Rarely beneficial for AI autonomy

## High-Value Server Categories

### Essential for AI Agents (Rating 4-5)

#### Code Understanding & Navigation
- **Serena (5)**: Semantic code analysis, symbol navigation, refactoring
- **Sequential Thinking (5)**: Complex problem decomposition, planning

#### Knowledge & Context
- **Memory (5)**: Persistent context across sessions
- **Context7 (5)**: Up-to-date documentation, prevents hallucination
- **Perplexity-Ask (4)**: Deep research capabilities

#### Development Workflow
- **GitHub (5)**: Full repository and PR workflow integration
- **Firecrawl (4)**: Documentation extraction and analysis

### Essential for Human Verification (Rating 4-5)

#### Collaboration & Communication
- **Slack (5)**: Team notifications, collaboration
- **Atlassian (4)**: JIRA/Confluence for project tracking

#### Review & Oversight
- **GitHub (4)**: PR review workflow, code review
- **Notion (4)**: Documentation and project management

#### Transparency
- **Sequential Thinking (4)**: Visible reasoning chains
- **Serena (4)**: Semantic understanding verification

## Usage Recommendations

### For Maximum AI Autonomy
**Install these servers first:**
1. Serena - Code navigation
2. Sequential Thinking - Planning
3. Memory - Persistence
4. GitHub - Development workflow
5. Context7 - Documentation

### For Human-in-the-Loop Workflows
**Prioritize these servers:**
1. Slack - Team collaboration
2. GitHub - Review workflow
3. Atlassian/Notion - Project tracking
4. Sequential Thinking - Transparent reasoning

### For Balanced Workflows
**Core set for both humans and AI:**
1. GitHub (Human: 4, AI: 5)
2. Serena (Human: 4, AI: 5)
3. Sequential Thinking (Human: 4, AI: 5)
4. Memory (Human: 3, AI: 5)
5. Slack (Human: 5, AI: 3)

## Integration Synergies

Some servers work exceptionally well together:

### Research & Implementation Stack
- **Perplexity + Context7 + Firecrawl**: Complete research pipeline
- Perplexity for broad research → Context7 for official docs → Firecrawl for detailed extraction

### Code Understanding Stack
- **Serena + Sequential Thinking + Memory**: Deep code comprehension
- Serena for navigation → Sequential for planning → Memory for persistence

### Development Workflow Stack
- **GitHub + Slack + Atlassian**: Complete development lifecycle
- GitHub for code → Slack for communication → Atlassian for tracking

## Decision Framework

When deciding which servers to install, consider:

1. **Your Role**:
   - Solo developer: Prioritize AI Agent ratings
   - Team lead: Balance both ratings
   - Code reviewer: Prioritize Human Verification ratings

2. **Project Phase**:
   - Research/Planning: Perplexity, Context7, Sequential Thinking
   - Implementation: Serena, GitHub, Memory
   - Review/Deployment: Slack, GitHub, Atlassian

3. **Automation Level**:
   - High automation: Install all servers with AI rating ≥ 4
   - Supervised automation: Balance servers with both ratings ≥ 3
   - Manual with AI assist: Focus on Human rating ≥ 4

## Interpreting Server Cards

Each server card includes:
- `agenticUsefulness.humanVerificationRating`: 1-5 scale
- `agenticUsefulness.aiAgentRating`: 1-5 scale
- `agenticUsefulness.ratingRationale`: Explanation for ratings
- `agenticUsefulness.bestPractices`: How to use effectively
- `agenticUsefulness.humanRole`: What humans should focus on
- `agenticUsefulness.aiRole`: What AI excels at with this server

Use these ratings to build your optimal MCP server stack!