# Cross-Server Integration Patterns

## Overview

The true power of MCP servers emerges when they work together. This document outlines proven patterns for combining MCP servers to create powerful agentic workflows.

## Usage Policies & Best Practices

### Documentation Hierarchy
1. **Context7** (Primary): Official framework/library documentation
2. **Firecrawl** (Fallback): When you have specific documentation URLs not in Context7
3. **Perplexity** (Research): When documentation needs synthesis from multiple sources

### Research Strategy
1. **Perplexity** (Primary): Open-ended research, best practices, comparisons
2. **Brave Search** (Fallback): Privacy-focused or when Perplexity unavailable
3. **WebSearch** (Last Resort): Basic web searching

### Code Context
1. **Serena** (Local Only): YOUR project's codebase - 37% faster than grep
2. **GitHub** (External): Public repo research, implementation examples
3. **Never**: Use Serena for external code or GitHub for local code

## Core Integration Patterns

### 1. Knowledge Retrieval + Execution
**Servers**: Context7/Perplexity → GitHub/Serena
**Pattern**: Get documentation → Find examples → Apply in code

Example workflow:
1. Agent needs to implement OAuth
2. **Context7** fetches OAuth2 specification
3. **GitHub MCP** checks "panva/node-oidc-provider" for examples
4. **Serena MCP** finds existing auth patterns locally
5. **Sequential Thinking** plans integration
6. **Memory** stores implementation decisions

### 2. Planning + Acting
**Servers**: Sequential Thinking → Context7/Serena/Docker
**Pattern**: Break down task → Execute with right tool

Example workflow:
1. **Sequential Thinking** decomposes: "Upgrade logging library"
2. Step 1: **Context7** fetches new library docs
3. Step 2: **Serena** finds all old library usage
4. Step 3: **Serena** performs semantic refactoring
5. Step 4: **Docker** runs tests in container
6. Step 5: **GitHub** creates PR with changes

### 3. Dual Memory Pattern (Knowledge Graph + Project Notes)
**Servers**: Memory MCP (Knowledge Graph) + Serena Memory (Markdown)
**Pattern**: Global structured knowledge + Project-specific documentation

Example workflow:
1. **Serena** discovers authentication pattern in project
2. **Serena Memory** saves: "auth_patterns.md" with project-specific notes
3. **Memory MCP** creates entity: "OAuth Implementation" with relationships
4. **Memory MCP** links to entities: "JWT", "RefreshToken", "ProjectX"
5. Next project queries **Memory MCP** for OAuth patterns (global)
6. Current project uses **Serena Memory** for local conventions

**Key Distinction**:
- **Memory MCP**: Knowledge graph with entities/relations (global, structured)
- **Serena Memory**: Markdown files per project (local, free-form)

### 4. Memory + Reasoning
**Servers**: Memory MCP ↔ Sequential Thinking
**Pattern**: Store structured insights → Retrieve for future decisions

Example workflow:
1. Debugging session finds root cause
2. **Memory MCP** creates entity: "BugPattern-Y100" 
3. **Memory MCP** adds observation: "Function X fails when Y > 100"
4. **Memory MCP** creates relation: "BugPattern-Y100" → "affects" → "LoggingModule"
5. Week later, similar bug appears
6. **Memory MCP** graph search finds related patterns
7. Agent traverses relationships to understand full context

### 5. DevOps Loop Automation
**Servers**: GitHub → Docker → Playwright → Slack → Atlassian
**Pattern**: Code → Test → Verify → Notify → Track

Example workflow:
1. **GitHub MCP** commits feature branch
2. **Docker MCP** spins up test environment
3. **Playwright MCP** runs E2E tests
4. **Slack MCP** posts results to #qa channel
5. **Atlassian MCP** updates Jira ticket status

### 5. UI to Backend Traceability
**Servers**: Playwright/Puppeteer + PostgreSQL + Firecrawl
**Pattern**: Simulate user action → Verify backend → Check UI

Example workflow:
1. **Playwright** clicks "Submit Order" button
2. **PostgreSQL MCP** queries DB for new order record
3. **Firecrawl** scrapes confirmation page
4. Validates data consistency across layers

### 6. Parallel Search & Scrape
**Servers**: Brave Search → Firecrawl → Memory
**Pattern**: Find sources → Extract content → Store knowledge

Example workflow:
1. **Brave Search** finds 5 relevant documentation pages
2. **Firecrawl** scrapes detailed content from each
3. **Memory Service** stores synthesized information
4. Agent avoids duplicate searches in future

### 7. Public Info + Private Context
**Servers**: Perplexity + Notion + Serena
**Pattern**: External best practices + Internal standards + Code context

Example workflow:
1. **Perplexity** fetches latest security best practices
2. **Notion MCP** retrieves company coding standards
3. **Serena** analyzes current codebase patterns
4. Agent creates solution aligned with all three contexts

### 8. Human Handoff and Return
**Servers**: Slack/Atlassian for async collaboration
**Pattern**: Request clarification → Pause → Resume on response

Example workflow:
1. Agent uncertain about requirement
2. **Slack MCP** posts: "Need clarification on feature X"
3. Agent pauses task
4. Human responds in Slack
5. Agent detects response, resumes with new context

## Synergy Recommendations

### For Code Understanding
**Primary**: Serena
**Support**: Context7 (framework docs), Memory (persist understanding)
**Pattern**: Serena navigates → Context7 validates → Memory stores

### For Testing & Validation
**Primary**: Playwright/Puppeteer
**Support**: Docker (sandboxing), PostgreSQL (data checks)
**Pattern**: Docker isolates → Playwright tests → PostgreSQL verifies

### For Research & Documentation
**Primary**: Perplexity/Brave Search
**Support**: Firecrawl (extraction), Notion (storage)
**Pattern**: Search broadly → Scrape deeply → Document permanently

### For Team Collaboration
**Primary**: GitHub (code), Slack (chat), Atlassian (tracking)
**Support**: Memory (context persistence)
**Pattern**: GitHub for artifacts → Slack for discussion → Jira for progress

## Best Practices

### 1. Layer Your Tools
- **Knowledge Layer**: Context7, Perplexity, Brave Search
- **Execution Layer**: Serena, GitHub, Docker
- **Verification Layer**: Playwright, PostgreSQL
- **Communication Layer**: Slack, Atlassian, Notion

### 2. Create Feedback Loops
- Testing results → Memory storage
- Memory retrieval → Better testing
- Continuous improvement through persistence

### 3. Implement Checkpoints
- Use Slack/GitHub PRs as human verification points
- Never bypass these in critical paths
- Design workflows with natural pause points

### 4. Optimize Tool Selection
- Prefer specialized tools (Context7 for docs vs general search)
- Use memory to avoid redundant operations
- Batch similar operations together

## Anti-Patterns to Avoid

### 1. Tool Redundancy
❌ Using both Playwright and Puppeteer in same workflow
✅ Choose one browser automation tool

### 2. Missing Memory
❌ Solving same problem repeatedly without storing solution
✅ Always store valuable insights in Memory/OpenMemory

### 3. Skipping Planning
❌ Jumping directly to execution without Sequential Thinking
✅ Plan complex tasks first, then execute

### 4. Ignoring Human Checkpoints
❌ Automating everything without verification points
✅ Use GitHub PRs and Slack for human oversight

## Implementation Examples

### Example 1: Feature Implementation
```
1. Atlassian MCP: Read Jira ticket requirements
2. Sequential Thinking: Plan implementation steps
3. Context7: Fetch relevant API documentation
4. Serena: Navigate and understand existing code
5. Memory: Recall similar implementations
6. Serena: Implement changes with refactoring
7. Docker: Run unit tests in container
8. Playwright: Run integration tests
9. GitHub: Create PR with changes
10. Slack: Notify team for review
11. Atlassian: Update ticket status
```

### Example 2: Bug Investigation (Enhanced Pattern)
```
1. Slack/Issue: Receive bug report from team
2. Memory: Check if similar bug was seen before
3. Serena: Analyze code at error location (semantic understanding)
4. Sequential Thinking: Form hypotheses about root cause
5. Perplexity: Research error with "Senior developer debugging X" persona
6. GitHub Search: Find how other projects solved similar issues
7. Context7: Check if framework docs mention this behavior
8. Serena: Navigate to all affected code paths
9. Sequential Thinking: Synthesize external solutions with codebase
10. Serena: Implement fix using semantic refactoring
11. Docker: Verify fix in isolation
12. GitHub: Create PR with detailed explanation
13. Slack: Report resolution with learnings
14. Memory: Store root cause and solution for future
```

### Example 3: Advanced Bug Root Cause Analysis
```
Phase 1 - Understanding the Problem:
1. Serena: Semantic analysis of error location and call stack
2. Sequential Thinking: Break down possible causes
3. Memory: Retrieve similar past issues

Phase 2 - External Research:
4. Perplexity (Senior Dev persona): "Production bug: [error details]"
5. GitHub Search: Search across repos for similar error patterns
6. Context7: Check framework/library known issues

Phase 3 - Solution Synthesis:
7. Sequential Thinking: Compare external solutions with codebase
8. Serena: Identify all code paths needing changes
9. Perplexity (Architect persona): "Best practices for [solution approach]"

Phase 4 - Implementation:
10. Serena: Refactor with semantic understanding
11. Docker/Tests: Validate fix
12. GitHub: PR with comprehensive explanation
13. Memory: Document pattern for future reference
```

## Measuring Success

Track these metrics to evaluate integration effectiveness:
- Reduction in duplicate work (via Memory hits)
- Decrease in human intervention (via automation)
- Faster resolution times (via proper tool selection)
- Higher code quality (via automated testing)
- Better team communication (via Slack/Atlassian integration)

## Conclusion

Effective MCP server integration transforms Claude from a coding assistant into a full-stack development partner. By combining servers strategically, you create workflows that are:
- More reliable (through verification layers)
- More efficient (through memory and planning)
- More transparent (through communication tools)
- More maintainable (through proper documentation)

The key is selecting complementary servers and designing workflows that leverage each server's strengths while maintaining human oversight at critical junctures.