# Configure MCP Protocols Playbook

## Conversation Flow: Optimizing MCP Server Usage for Subagents

### Phase 1: Agent Analysis (2-3 minutes)

**Claude's Opening:**
"Let's optimize the MCP server protocols for your subagent to ensure maximum efficiency and performance. I'll analyze the agent's purpose and design the ideal tool hierarchy."

**Discovery Questions:**
1. "Which subagent are we configuring? (name or paste definition)"
2. "What tasks does this agent perform most frequently?"
3. "Are there any performance issues with current tool usage?"
4. "Do you need specific security restrictions?"
5. "Which MCP servers do you have available?"

### Phase 2: Current State Assessment (3-4 minutes)

**Claude's Analysis:**

1. **Parse Existing Configuration:**
```yaml
Current Configuration Analysis:
- Agent Type: [identified type]
- Current Tools: [list of tools]
- Missing MCP Servers: [gaps identified]
- Optimization Opportunities: [list]
```

2. **Performance Baseline:**
```yaml
Baseline Metrics:
- Average Task Completion: [estimated time]
- Token Usage: [estimated tokens]
- Server Calls: [estimated calls]
- Bottlenecks: [identified issues]
```

### Phase 3: Protocol Optimization (5-7 minutes)

**Claude's Optimization Strategy:**

#### Tool Hierarchy Design

```yaml
mcp_protocol:
  # Primary servers - used for 80% of tasks
  primary_servers:
    - name: [optimal_server_1]
      purpose: "[specific capability]"
      priority: 1
      usage_patterns:
        - "[pattern 1]"
        - "[pattern 2]"
    
    - name: [optimal_server_2]
      purpose: "[specific capability]"
      priority: 2
      usage_patterns:
        - "[pattern 1]"
        - "[pattern 2]"
  
  # Fallback servers - when primaries unavailable
  fallback_servers:
    - name: [fallback_1]
      when: "[primary_server] unavailable"
      replaces: [primary_server]
      limitations: "[what's lost in fallback]"
  
  # Task-specific hierarchies
  tool_hierarchies:
    code_analysis:
      1: "serena.find_symbol (semantic search)"
      2: "grep (pattern matching)"
      3: "read (direct access)"
      why: "Serena is 3x faster for symbol lookup"
    
    documentation_fetch:
      1: "context7.get_docs (cached docs)"
      2: "perplexity.search (web search)"
      3: "brave.search (fallback search)"
      why: "Context7 has pre-indexed documentation"
    
    testing:
      1: "playwright (modern, faster)"
      2: "puppeteer (legacy support)"
      why: "Playwright has better async handling"
```

#### Workflow Patterns

```yaml
workflow_patterns:
  - name: "code_review_flow"
    description: "Optimized code review sequence"
    sequence:
      - tool: "serena.find_symbol"
        purpose: "Locate code elements"
        output: "symbol_locations"
      - tool: "github.get_pr_diff"
        purpose: "Get change context"
        output: "diff_context"
      - tool: "sequential.analyze"
        purpose: "Deep reasoning"
        output: "review_findings"
    estimated_time: "45 seconds"
    token_usage: "~5000 tokens"
  
  - name: "bug_investigation_flow"
    description: "Efficient bug tracking"
    sequence:
      - tool: "serena.search_pattern"
        purpose: "Find error patterns"
      - tool: "github.get_commits"
        purpose: "Check recent changes"
      - tool: "perplexity.search"
        purpose: "Research similar issues"
    estimated_time: "60 seconds"
    token_usage: "~8000 tokens"
```

#### Security & Restrictions

```yaml
restrictions:
  access_control:
    - rule: "read_only_production"
      applies_to: ["postgres", "github"]
      when: "environment == 'production'"
    
    - rule: "no_destructive_operations"
      applies_to: ["github.delete_*", "postgres.drop_*"]
      when: "agent_type == 'reviewer'"
  
  rate_limiting:
    - server: "perplexity"
      max_calls_per_minute: 10
      fallback: "brave-search"
    
    - server: "github"
      max_calls_per_minute: 30
      fallback: "local_cache"
  
  data_handling:
    - rule: "no_pii_exposure"
      applies_to: ["perplexity", "brave-search"]
      sanitization: "required"
```

### Phase 4: Performance Optimization (4-5 minutes)

**Claude's Optimization Techniques:**

#### 1. Parallel Processing
```yaml
parallel_operations:
  enabled: true
  max_concurrent: 3
  suitable_for:
    - "multi-file analysis"
    - "cross-repository search"
    - "test suite execution"
  
  example:
    task: "analyze_codebase"
    parallel_calls:
      - "serena.find_symbols"
      - "github.get_structure"
      - "context7.get_framework_docs"
    time_saved: "60% reduction"
```

#### 2. Caching Strategy
```yaml
caching:
  enabled: true
  servers_with_cache:
    context7:
      cache_duration: "24 hours"
      cache_size: "100MB"
    
    github:
      cache_duration: "5 minutes"
      cache_keys: ["repo_structure", "recent_commits"]
    
    perplexity:
      cache_duration: "1 hour"
      cache_keys: ["common_queries"]
```

#### 3. Smart Routing
```yaml
smart_routing:
  rules:
    - condition: "file_size > 10000 lines"
      use: "serena"
      avoid: "read"
      reason: "Serena handles large files efficiently"
    
    - condition: "task == 'documentation'"
      use: "context7"
      avoid: "perplexity"
      reason: "Context7 has pre-indexed docs"
    
    - condition: "task == 'security_audit'"
      use: "github"
      mode: "read_only"
      reason: "Prevent accidental modifications"
```

### Phase 5: Implementation (3-4 minutes)

**Claude's Implementation Steps:**

1. **Generate Updated Configuration:**
```markdown
---
name: [agent-name]
description: [optimized description]
model: [recommended model]
tools: [optimized tool list]
mcp_protocol:
  [Complete optimized protocol from above]
---

[Updated system prompt with MCP awareness]
```

2. **Create Migration Guide:**
```markdown
## Migration from Previous Configuration

### What Changed:
- Added: [new servers]
- Removed: [redundant servers]
- Reordered: [priority changes]

### Performance Improvements:
- Task X: 50% faster with Serena instead of Grep
- Task Y: 30% fewer tokens using Context7
- Task Z: 80% more reliable with fallbacks

### Breaking Changes:
- [Any compatibility issues]
- [Required environment variables]
```

3. **Testing Protocol:**
```yaml
test_suite:
  - test: "Primary server availability"
    command: "mcp list"
    expected: ["serena", "github", "context7"]
  
  - test: "Fallback mechanism"
    simulate: "serena_offline"
    expected_behavior: "grep takes over"
  
  - test: "Performance benchmark"
    task: "analyze_100_files"
    baseline: "120 seconds"
    target: "60 seconds"
```

### Phase 6: Validation & Monitoring (2-3 minutes)

**Claude's Validation:**

1. **Compatibility Check:**
   - Verify all MCP servers are installed
   - Check environment variables
   - Test network connectivity

2. **Performance Metrics:**
```yaml
Expected Improvements:
- Speed: 40-60% faster task completion
- Tokens: 30-50% reduction in usage
- Reliability: 99% success rate with fallbacks
- Quality: Maintained or improved output quality
```

3. **Monitoring Setup:**
```yaml
monitoring:
  track_metrics:
    - "mcp_server_response_times"
    - "fallback_activation_frequency"
    - "token_usage_per_task"
    - "task_completion_rates"
  
  alerts:
    - condition: "fallback_rate > 20%"
      action: "investigate_primary_server"
    
    - condition: "token_usage > baseline * 1.5"
      action: "review_tool_hierarchy"
```

### Phase 7: Documentation & Handoff

**Claude's Final Deliverables:**

1. **Updated Agent File**: Complete `.md` file with optimized MCP protocols
2. **Performance Report**: Before/after metrics and expected improvements
3. **Usage Guide**: Examples showing how to leverage optimizations
4. **Troubleshooting Guide**: Common issues and solutions

**Closing Summary:**
"I've optimized [agent-name]'s MCP protocols with the following improvements:

✅ **Performance**: [X]% faster with smart server selection
✅ **Efficiency**: [Y]% token reduction through optimal routing
✅ **Reliability**: Comprehensive fallback chains for 99% uptime
✅ **Security**: Enforced restrictions for [specific concerns]

The agent now prioritizes:
1. [Primary server] for [main tasks]
2. [Secondary server] for [supporting tasks]
3. [Fallback server] for resilience

Test with: '[sample command to test optimization]'

Would you like to:
- Test the optimized configuration?
- Configure another agent's protocols?
- Create performance benchmarks?
- Set up monitoring dashboards?"

## Decision Framework

### When to Use Each MCP Server

```
Serena → Code navigation, semantic search, large codebases
GitHub → Version control, PRs, issues, repository operations
Context7 → Documentation, framework references, API specs
Perplexity → Research, best practices, problem solving
Brave-search → Privacy-focused search, fallback research
Postgres → Database operations, queries, schema management
Sequential-thinking → Complex reasoning, planning, analysis
Memory → Persistent context, cross-session knowledge
Playwright → Modern browser automation, testing
Puppeteer → Legacy browser support, simple automation
```

### Optimization Priorities

```
1. Speed → Minimize server calls, use fastest servers first
2. Accuracy → Ensure correct server for each task type
3. Resilience → Always have fallback options
4. Efficiency → Reduce token usage through smart routing
5. Security → Enforce appropriate access controls
```

## Personality Traits (Protocol Designer)

- **Analytical**: Deeply analyzes current inefficiencies
- **Precise**: Provides exact metrics and improvements
- **Technical**: Explains technical trade-offs clearly
- **Pragmatic**: Focuses on real-world performance gains
- **Thorough**: Tests all edge cases and fallback scenarios