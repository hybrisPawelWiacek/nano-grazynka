# MCP Server Best Practices & Usage Policies

## Overview
This playbook establishes best practices and usage policies for MCP servers, helping you choose the right tool for each task and understand fallback strategies when primary tools aren't available.

## Personality: Best Practices Advisor
*Strategic, efficiency-focused, pattern-aware. I help you optimize tool selection for maximum performance and minimal token usage.*

## Core Principles

### 1. Right Tool for the Right Job
Every MCP server has an optimal use case. Using the wrong tool wastes tokens and time.

### 2. Fallback Chains
Always have a backup plan when primary tools fail or lack required information.

### 3. Context Awareness
Consider what information you have (URLs, repo names, search terms) to choose tools.

### 4. Token Efficiency
Minimize token usage by choosing precise tools over broad searches.

## Primary Use Cases & Policies

### 📚 Documentation & Research

#### Context7 (Primary for Framework Docs)
**When to use:**
- You need official framework/library documentation
- Looking for API references for known libraries
- Need up-to-date docs to prevent hallucination

**Example scenarios:**
```
"How do I use React hooks?" → Context7
"What's the latest Next.js routing?" → Context7
"Python asyncio documentation" → Context7
```

#### Firecrawl (Fallback for Known URLs)
**When to use:**
- Context7 doesn't have the documentation
- You have a specific documentation URL
- Need to scrape complex documentation sites
- Extracting structured data from web pages

**Example scenarios:**
```
"Context7 missing docs for CustomLib, but I have docs.customlib.com" → Firecrawl
"Extract API endpoints from api.example.com/docs" → Firecrawl
"Parse the changelog at releases.project.com" → Firecrawl
```

**Fallback Chain:**
```
Context7 → Firecrawl (with URL) → Perplexity (web search)
```

### 🔍 Web Research

#### Perplexity (Primary for Research)
**When to use:**
- Open-ended research questions
- Need multiple sources synthesized
- Looking for best practices or comparisons
- Don't know specific URLs or sources

**Example scenarios:**
```
"Best practices for microservices in 2024" → Perplexity
"Compare GraphQL vs REST performance" → Perplexity
"How do other companies handle rate limiting?" → Perplexity
```

#### Brave Search (Fallback/Alternative)
**When to use:**
- Perplexity unavailable or rate-limited
- Need privacy-focused search
- Want raw search results without synthesis
- Looking for very recent information

**Fallback Chain:**
```
Perplexity → Brave Search → WebSearch
```

### 💻 Code & Repository Context

#### Git CLI vs GitHub MCP - Best Practice Policy

**Use Git CLI (native Bash) for:**
- Local operations: commits, branches, staging, stashing
- History management: rebase, amend, bisect
- Local analysis: diff, blame, log, status
- Tags: Creating and managing version tags
- Basic push/pull: Syncing with remote

**Use GitHub MCP for:**
- Pull Requests: Create, review, merge, checkout
- Issues: Create, search, triage, label
- Code Review: Comments, approvals, suggestions
- Repository Research: Analyzing public repos for patterns
- Cross-repo queries: Finding similar implementations
- Releases: Publishing with notes and assets
- CI/CD status: Checking workflow runs

**Example scenarios:**
```
# Git CLI (Bash)
"Commit my changes" → git add . && git commit -m "message"
"Check what changed" → git diff
"Create a feature branch" → git checkout -b feature-branch
"Rebase on main" → git rebase main

# GitHub MCP
"Create a PR from this branch" → GitHub MCP
"Show me how Vercel implements caching in Next.js repo" → GitHub MCP
"Find authentication examples in the Supabase repo" → GitHub MCP
"Check if there's an issue about this error" → GitHub MCP
"Review and approve PR #123" → GitHub MCP
```

**Best Practice:**
When working on a task that involves a specific library/framework, proactively check its GitHub repo for:
- Implementation patterns
- Test examples
- Issue discussions about your problem
- Contributing guidelines if extending

#### Serena (Primary for Local Code)
**When to use:**
- Navigating YOUR project's codebase
- Understanding local code structure
- Finding symbols and dependencies
- 37% faster than grep for code search

**Never use for:**
- Searching external repositories (use GitHub)
- General code examples (use Perplexity)

### 🧠 Planning & Memory

#### Sequential Thinking (Complex Planning)
**When to use:**
- Multi-step problem solving
- Architecture decisions
- Debugging complex issues
- Need to reason through options

**Best Practice:**
Always use BEFORE implementing complex features to plan approach.

#### Memory (Persistent Context)
**When to use:**
- Storing project decisions
- Remembering user preferences
- Tracking recurring patterns
- Cross-session context

**Best Practice:**
Save after every major decision or problem solution.

### 🎯 Critical Distinction: Memory MCP vs Serena Memory

#### Memory MCP (Knowledge Graph System)
**What it is:**
- Full knowledge graph with entities and relations
- Global scope across all projects
- Structured data with semantic relationships
- Graph traversal and semantic search capabilities

**When to use Memory MCP:**
- Building knowledge graphs about concepts, people, systems
- Creating semantic relationships between entities
- Cross-project knowledge that needs structure
- Complex queries requiring graph traversal
- When you need: "Show me all entities related to authentication"

**Example:**
```
Entity: "OAuth2.0" 
Relations: implements → "Authentication"
          used_by → "ProjectX API"
          requires → "Client Credentials"
```

#### Serena Memory (Project Markdown Files)
**What it is:**
- Simple markdown files (.md) in project's .serena folder
- Project-specific scope only
- Free-form documentation and notes
- File-based retrieval (no graph queries)

**When to use Serena Memory:**
- Project-specific code patterns and conventions
- Architecture decisions for THIS project
- Local development notes and TODOs
- Code snippets and examples specific to project
- When you need: "What was our decision about error handling?"

**Example:**
```markdown
# error_handling_patterns.md
We use Result<T, E> pattern throughout the codebase...
```

#### Synergetic Usage Pattern
```
1. Use Memory MCP for:
   - Global knowledge graphs
   - Cross-project patterns
   - Semantic relationships
   
2. Use Serena Memory for:
   - Project-specific notes
   - Local conventions
   - Code pattern documentation
   
3. Together they provide:
   - Memory MCP: "What authentication methods exist?"
   - Serena: "How does THIS project implement auth?"
```

**Never confuse:**
- Memory MCP ≠ Serena memory (completely different systems)
- Knowledge graphs ≠ Markdown files
- Global scope ≠ Project scope

## Advanced Patterns

### Pattern 1: Documentation Waterfall
```
1. Try Context7 for official docs
2. If missing → Check GitHub repo's docs folder
3. If insufficient → Firecrawl known documentation URL
4. If no URL → Perplexity for research
5. Save findings to Memory
```

### Pattern 2: Implementation Research
```
1. Sequential Thinking to plan approach
2. Context7 for official patterns
3. GitHub for real-world examples (public repos)
4. Serena for local codebase patterns
5. Synthesize with Perplexity if needed
```

### Pattern 3: Problem Solving
```
1. Serena to understand local context
2. GitHub to check if it's a known issue
3. Perplexity for solutions from multiple sources
4. Sequential Thinking to plan fix
5. Memory to document solution
```

### Pattern 4: Library Integration
```
1. Context7 for official documentation
2. GitHub for library source and examples
3. Perplexity for tutorials and best practices
4. Serena to find similar patterns locally
5. Firecrawl for any missing documentation
```

## Fallback Strategies

### Primary → Secondary → Tertiary

**Documentation:**
- Context7 → Firecrawl → Perplexity → WebSearch

**Research:**
- Perplexity → Brave Search → WebSearch → WebFetch

**Code Examples:**
- GitHub (specific repo) → Perplexity → Context7

**Local Code:**
- Serena → Grep → Read

**Web Scraping:**
- Firecrawl → WebFetch → Puppeteer/Playwright

**Planning:**
- Sequential Thinking → Memory lookup → Manual planning

## Token Optimization Strategies

### 1. Start Specific, Go Broad
```
Bad: Perplexity → "How to implement authentication"
Good: Context7 → "NextAuth.js" → GitHub → "nextauthjs/next-auth"
```

### 2. Cache with Memory
```
After research: Memory → Save findings
Next time: Memory → Retrieve instead of researching again
```

### 3. Use Known Sources
```
Bad: Perplexity → "React hooks documentation"
Good: Context7 → "React hooks" (uses official docs)
```

### 4. Batch Operations
```
Bad: Multiple Perplexity searches
Good: One comprehensive Perplexity query with all questions
```

## Common Mistakes to Avoid

### ❌ Using Perplexity for Known Documentation
**Wrong:** Perplexity → "React useState documentation"
**Right:** Context7 → React → useState

### ❌ Using Serena for External Code
**Wrong:** Serena → Search "express middleware examples"
**Right:** GitHub → "expressjs/express" → examples folder

### ❌ Not Checking GitHub for Context
**Wrong:** Implementing feature without checking library repo
**Right:** GitHub → Check implementation → Understand patterns → Implement

### ❌ Using WebFetch When Firecrawl Available
**Wrong:** WebFetch → Complex documentation site
**Right:** Firecrawl → Structured extraction with markdown

### ❌ Forgetting Memory
**Wrong:** Research same thing multiple times
**Right:** Memory → Check first → Research if needed → Save findings

## Quick Decision Tree

```
Need Documentation?
├── Know the framework? → Context7
├── Have URL? → Firecrawl
└── Need research? → Perplexity

Need Code Examples?
├── Your codebase? → Serena
├── Specific repo? → GitHub
└── General examples? → Perplexity

Need Web Content?
├── Know URL? → Firecrawl
├── Need search? → Perplexity/Brave
└── Need interaction? → Puppeteer/Playwright

Need Planning?
├── Complex problem? → Sequential Thinking
├── Past solution? → Memory
└── Architecture? → Sequential Thinking + Memory
```

## Performance Metrics

### Speed Comparison
- Serena: 0.8s (local code)
- Context7: 1.2s (documentation)
- GitHub: 1.5s (repository)
- Firecrawl: 2-3s (web scraping)
- Perplexity: 3-5s (research)
- Grep: 2.3s (local code - 37% slower than Serena)

### Token Usage (Average)
- Context7: 500-1000 tokens
- GitHub: 1000-2000 tokens
- Serena: 200-500 tokens
- Firecrawl: 2000-5000 tokens
- Perplexity: 3000-8000 tokens

Choose tools based on speed vs completeness needs.

## Integration Examples

### Example 1: Implementing OAuth
```bash
1. Sequential Thinking → Plan OAuth flow
2. Context7 → OAuth2 specification
3. GitHub → "panva/node-oidc-provider" for implementation
4. Serena → Check existing auth patterns
5. Perplexity → "OAuth best practices 2024"
6. Memory → Save implementation decisions
```

### Example 2: Debugging Performance Issue
```bash
1. Serena → Identify slow functions
2. GitHub → Check if known issue in dependencies
3. Perplexity → "Node.js performance profiling techniques"
4. Sequential Thinking → Plan optimization
5. Memory → Document fix for team
```

### Example 3: Learning New Framework
```bash
1. Context7 → Official tutorial
2. GitHub → Framework repo + examples
3. Perplexity → "Common pitfalls with [framework]"
4. Firecrawl → Community tutorials (if URLs known)
5. Memory → Save learning notes
```

## Team Collaboration Patterns

### For Solo Developers
- Heavy use of Memory for context
- Perplexity for broad research
- Sequential Thinking for all planning

### For Team Projects
- GitHub for PR workflows
- Slack for notifications
- Memory for shared knowledge
- Atlassian for tracking

### For Open Source
- GitHub as primary
- Context7 for documentation
- Perplexity for community practices

## Monitoring & Optimization

### Track Your Usage
```markdown
## MCP Server Usage Stats (Weekly)
- Serena: 145 searches (37% faster than grep)
- Context7: 89 documentation lookups
- GitHub: 67 repo operations
- Perplexity: 23 research queries
- Memory: 156 save/retrieve operations
```

### Optimize Based on Patterns
- If repeatedly searching same docs → Save to Memory
- If always using Perplexity → Consider Context7 first
- If GitHub rate-limited → Cache findings in Memory

## Security Considerations

### Public vs Private
- GitHub: Only access public repos for research
- Perplexity: Don't share sensitive information
- Memory: Be careful with secrets
- Firecrawl: Respect robots.txt

### Rate Limiting
- GitHub: 5000 requests/hour authenticated
- Perplexity: Varies by plan
- Context7: Generous limits
- Firecrawl: Based on API key tier

## Troubleshooting

### "Context7 doesn't have my library"
1. Check GitHub repo directly
2. Use Firecrawl on official docs
3. Fall back to Perplexity

### "GitHub rate limited"
1. Use Memory for cached data
2. Space out requests
3. Use Perplexity for general info

### "Perplexity giving outdated info"
1. Check Context7 for latest
2. Go directly to GitHub repo
3. Firecrawl recent documentation

## Best Practices Checklist

Before starting any task:
- [ ] Check Memory for similar past work
- [ ] Identify primary information sources
- [ ] Plan fallback chain
- [ ] Consider token budget
- [ ] Use Sequential Thinking for complex tasks

During the task:
- [ ] Start with most specific tool
- [ ] Fall back gracefully when needed
- [ ] Batch similar operations
- [ ] Save important findings to Memory

After completion:
- [ ] Document solution in Memory
- [ ] Note which tools were most effective
- [ ] Update team on best approaches

## Summary

The key to effective MCP server usage is understanding each tool's strengths and having clear fallback strategies. Always start with the most specific tool for your need, then broaden your search if necessary. Remember:

1. **Context7** for official docs, **Firecrawl** when you have URLs
2. **Perplexity** for research, **Brave** for privacy
3. **GitHub** for repo context and public examples
4. **Serena** for local code only
5. **Memory** for everything worth remembering

---
*This playbook is part of MCP-Helper V2. See [CLAUDE.md](../CLAUDE.md) for more options.*