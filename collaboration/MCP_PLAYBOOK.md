# MCP Playbook for nano-grazynka

> **Note:** This playbook extends the MCP configuration in [CLAUDE.md](/CLAUDE.md) with practical examples and workflows.
> CLAUDE.md is the source of truth for configuration; this document provides implementation guidance.

## Project-Specific MCP Usage Guidelines

This playbook shows how to effectively use MCP servers for developing nano-grazynka, your voice note transcription and summarization MVP.

## 🚫 Do's and Don'ts

### ✅ DO's
1. **DO use Serena before Read/Grep** - 37% faster, reads only necessary symbols
2. **DO use Context7 first** - Official docs prevent hallucination
3. **DO use Memory for patterns** - Store solutions to avoid solving twice
4. **DO use Sequential Thinking for complex tasks** - Break down before executing
5. **DO check GitHub for examples** - Learn from public implementations
6. **DO batch MCP operations** - Multiple searches in parallel when possible

### ❌ DON'Ts
1. **DON'T use Read for code exploration** - Use Serena's semantic navigation
2. **DON'T use Grep for symbol search** - Use Serena's find_symbol
3. **DON'T use GitHub MCP for local commits** - Use Git CLI via Bash
4. **DON'T use Perplexity when you have URLs** - Use Firecrawl directly
5. **DON'T skip root cause analysis** - Always use Sequential Thinking for bugs
6. **DON'T solve same problem twice** - Check Memory first

## 🎯 Core Development Servers

### 1. Serena (Code Analysis & Navigation)
**When to use:**
- Exploring the codebase structure without reading entire files
- Finding symbol definitions (classes, functions, methods)
- Refactoring code across multiple files
- Understanding dependencies between components

**Best practices for nano-grazynka:**
```
# Find transcription-related code
Use: serena.find_symbol("TranscriptionService")
Use: serena.search_for_pattern("whisper|transcription")

# Navigate domain models efficiently
Use: serena.get_symbols_overview("/backend/src/domain/entities/VoiceNote.ts")

# Track code changes
Use: serena.write_memory("audio_processing_flow", "Description of how audio flows through the system")
```

**DON'T:**
- Read entire files when you only need specific functions
- Use file reading for code when symbolic tools are available

### 2. Memory (Project Context)
**When to use:**
- Storing architectural decisions
- Tracking processing optimization findings
- Recording API integration patterns
- Maintaining test scenarios

**Best practices for nano-grazynka:**
```
# Store transcription API configurations
memory.create_entities([{
  name: "whisper-api-config",
  entityType: "configuration",
  observations: ["Using OpenRouter for Whisper", "25MB file limit", "Supports EN/PL"]
}])

# Track performance insights
memory.create_entities([{
  name: "audio-processing-performance",
  entityType: "optimization",
  observations: ["Chunking improves latency", "Parallel processing for multiple files"]
}])
```

### 3. Context7 (Documentation)
**When to use:**
- Looking up Next.js App Router patterns
- Finding Fastify middleware documentation
- Researching Prisma query optimizations
- Understanding Docker Compose configurations

**Best practices for nano-grazynka:**
```
# Get Next.js file upload documentation
context7.get_library_docs("/vercel/next.js", topic="file-upload")

# Research Prisma transactions for voice note saving
context7.get_library_docs("/prisma/prisma", topic="transactions")

# Find Fastify streaming patterns for audio
context7.get_library_docs("/fastify/fastify", topic="streams")
```

### 4. GitHub Official (Version Control)
**When to use:**
- Creating feature branches for new functionality
- Opening PRs for code review
- Tracking issues for bugs/features
- Managing releases

**Best practices for nano-grazynka:**
```
# Create feature branch
github.create_branch("feature/batch-audio-upload")

# Open PR with comprehensive description
github.create_pull_request(
  title="Add batch audio upload support",
  body="## Changes\n- Multi-file upload UI\n- Queue processing\n- Progress tracking\n\n## Testing\n- Unit tests for queue\n- E2E for upload flow"
)

# Track processing issues
github.create_issue(
  title="Audio files >20MB fail silently",
  labels=["bug", "transcription"]
)
```

## 🔬 Research & Problem-Solving Servers

### 5. Perplexity Ask (Latest Best Practices)
**When to use:**
- Researching current audio transcription APIs
- Finding optimal chunking strategies
- Understanding LLM prompt engineering for summarization
- Investigating accessibility standards for voice apps

**Example queries for nano-grazynka:**
```
"What are the latest Whisper API optimization techniques for 2024?"
"Best practices for handling Polish language transcription"
"How to implement progressive audio upload with Next.js"
"Optimal prompts for extracting action items from transcripts"
```

### 6. Sequential Thinking (Complex Problem Solving)
**When to use:**
- Designing the audio processing pipeline
- Optimizing database schema for version history
- Planning E2E test scenarios
- Architecting the reprocessing workflow

**Example usage for nano-grazynka:**
```
Thought 1: Analyze current audio flow from upload to storage
Thought 2: Identify bottlenecks in transcription pipeline
Thought 3: Design queue system for parallel processing
Thought 4: Implement progress tracking mechanism
Thought 5: Verify solution handles edge cases
```

### 7. Firecrawl (Web Research)
**When to use:**
- Researching OpenRouter API documentation
- Finding examples of audio processing implementations
- Investigating competitor features
- Gathering UI/UX patterns from similar apps

**Best practices for nano-grazynka:**
```
# Scrape OpenRouter pricing for cost optimization
firecrawl.scrape("https://openrouter.ai/pricing")

# Research To-Doist UI patterns
firecrawl.scrape("https://todoist.com/features")
```

## 🧪 Testing Servers

### 8. Playwright (E2E Testing)
**When to use:**
- Testing file upload flows
- Verifying transcription status updates
- Checking export functionality
- Validating search/filter features

**Test scenarios for nano-grazynka:**
```javascript
// Test voice note upload
playwright.browser_navigate("http://localhost:3100")
playwright.browser_type("#file-input", "test-audio.mp3")
playwright.browser_click("#upload-btn")
playwright.browser_wait_for("Processing complete")

// Test reprocessing
playwright.browser_click(".voice-note-item")
playwright.browser_click("#reprocess-btn")
playwright.browser_take_screenshot("reprocessing-state")
```

## 🔄 Advanced Cross-Server Patterns

### Pattern 1: Knowledge Retrieval + Execution
**Use Case**: Implementing new framework feature
**Servers**: Context7 → GitHub → Serena → Memory

```yaml
Workflow:
  1. Context7.get_library_docs("/vercel/next.js", topic="server-actions")
  2. GitHub.search_code("server actions implementation repo:vercel/next.js")
  3. Serena.find_symbol("ActionHandler") # Apply pattern locally
  4. Memory.create_entity("ServerActionPattern", observations=[...])
  
Why This Works:
  - Context7 provides official spec
  - GitHub shows real implementation
  - Serena applies to your codebase
  - Memory prevents re-learning
```

### Pattern 2: Dual Memory Strategy
**Use Case**: Project-specific patterns vs global knowledge
**Servers**: Memory MCP + Serena Memory

```yaml
Global Knowledge (Memory MCP):
  - Entity: "WhisperAPIPattern"
  - Relations: "uses" → "OpenRouter", "handles" → "AudioFiles"
  - Observations: ["25MB limit", "Supports EN/PL"]

Project Notes (Serena Memory):
  - File: "audio_processing_decisions.md"
  - Content: "We chose chunking strategy X because..."
  
Usage:
  - Query Memory MCP for: "How does Whisper API work?"
  - Query Serena Memory for: "Why did we choose this approach?"
```

### Pattern 3: Bug Root Cause Analysis
**Use Case**: Complex production bug
**Servers**: Serena → Sequential → Perplexity → GitHub → Memory

```yaml
Phase 1 - Local Analysis:
  1. Serena.get_symbols_overview(error_file)
  2. Serena.find_referencing_symbols("problematic_function")
  3. Sequential.think("What could cause this error?")

Phase 2 - External Research:  
  4. Perplexity.ask("Production bug: [error] in Node.js Fastify")
  5. GitHub.search_code("error message repo:fastify/fastify")
  
Phase 3 - Solution:
  6. Sequential.synthesize("Best fix given our constraints")
  7. Memory.create_entity("BugFix-[ID]", solution_pattern)
```

## 📋 Workflow Patterns

### Feature Development Workflow
1. **Research** with Perplexity (latest practices)
2. **Plan** with Sequential Thinking (architecture)
3. **Explore** with Serena (codebase navigation)
4. **Document** with Memory (decisions/patterns)
5. **Reference** with Context7 (framework docs)
6. **Implement** using native tools
7. **Test** with Playwright (E2E scenarios)
8. **Commit** with GitHub (version control)

### Bug Investigation Workflow
1. **Analyze** with Serena (find relevant code)
2. **Think** with Sequential Thinking (root cause)
3. **Research** with Perplexity (known issues)
4. **Fix** using native tools
5. **Test** with Playwright
6. **Track** with GitHub (issue/PR)

### Performance Optimization Workflow
1. **Profile** with native tools
2. **Research** with Perplexity (optimization techniques)
3. **Plan** with Sequential Thinking (approach)
4. **Document** with Memory (baseline metrics)
5. **Implement** improvements
6. **Verify** with tests

## ⚠️ Important Notes

### Prefer Native Tools When:
- Reading/writing files (use native Read/Edit/Write)
- Running commands (use native Bash)
- Simple file operations (use native LS/Glob/Grep)

### Use MCP Servers When:
- You need intelligent code analysis (Serena)
- You need persistent context (Memory)
- You need documentation (Context7)
- You need research (Perplexity/Firecrawl)
- You need complex reasoning (Sequential Thinking)
- You need version control (GitHub)
- You need browser automation (Puppeteer)

### Resource Efficiency Tips:
1. Use Serena's symbolic tools instead of reading entire files
2. Cache Context7 documentation lookups in Memory
3. Batch GitHub operations when possible
4. Reuse Playwright sessions for multiple tests
5. Store Perplexity research findings in Memory

## 🎨 Server Synergies

### Power Combinations

#### 🧠 "The Thinker" Combo
**Sequential + Memory + Perplexity**
- Plan complex tasks
- Store insights
- Research best practices

#### 🔍 "The Explorer" Combo  
**Serena + GitHub + Context7**
- Navigate local code
- Find external examples
- Verify against docs

#### 🧪 "The Validator" Combo
**Playwright + Memory**
- Run tests
- Store failing scenarios
- Track test patterns

#### 📚 "The Researcher" Combo
**Perplexity + Firecrawl + Memory**
- Broad research
- Deep extraction
- Knowledge persistence

## 🚀 Quick Reference

### Primary → Fallback Chains

| Task | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Find code locally | Serena | Native Grep | Native Read |
| Get framework docs | Context7 | Firecrawl (with URL) | Perplexity |
| Store knowledge | Memory MCP | Serena Memory | Local files |
| Web research | Perplexity | Firecrawl | - |
| Complex planning | Sequential | Manual breakdown | - |
| Public repo search | GitHub MCP | Perplexity | - |
| Local git ops | Git CLI | - | - |
| E2E testing | Playwright | - | - |
| Code editing | Native tools | - | - |

### Decision Tree

```
Need to understand code?
├─ Local code? → Serena
├─ Public repo? → GitHub MCP
└─ Framework docs? → Context7

Need to research?
├─ Have URL? → Firecrawl
├─ Need synthesis? → Perplexity
└─ Need examples? → GitHub MCP

Need to remember?
├─ Global knowledge? → Memory MCP
├─ Project notes? → Serena Memory
└─ Quick note? → Local file
```

Remember: This is an MVP. Use MCP servers to accelerate development, not to over-engineer. Focus on shipping working features that match the PRD requirements.