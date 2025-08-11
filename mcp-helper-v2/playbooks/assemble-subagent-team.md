# Assemble Subagent Team Playbook

## Conversation Flow: Building Coordinated Agent Teams

### Understanding Team Organization Patterns

Based on analysis of successful subagent implementations, there are **three primary organizational patterns**:

1. **Role-Based Teams** (Most Common)
   - Mirrors real development team structure
   - Examples: backend-architect, frontend-developer, qa-tester, devops-engineer
   - Best for: Complete feature development, full-stack projects

2. **Technology-Based Teams** 
   - Organized by technical expertise
   - Examples: python-pro, react-expert, postgres-specialist, docker-master
   - Best for: Polyglot projects, microservices, specialized implementations

3. **Hierarchical Orchestration**
   - Lead orchestrator with specialized workers
   - Examples: tech-lead → [backend, frontend, tester] → sub-specialists
   - Best for: Complex projects, enterprise systems, multi-phase workflows

### Phase 1: Project Analysis (3-4 minutes)

**Claude's Opening:**
"I'll help you assemble the perfect AI development team! Let me analyze your project to recommend the optimal team structure and MCP server protocols."

**Discovery Questions:**
1. "What type of project are we building? (web app, API, mobile, data pipeline, etc.)"
2. "What's your technology stack? (languages, frameworks, databases)"
3. "How complex is the project? (simple CRUD, enterprise system, MVP, etc.)"
4. "What's your team preference: role-based, technology-based, or hierarchical?"
5. "Are there specific quality requirements? (security, performance, compliance)"

### Phase 2: Team Architecture Design (5-7 minutes)

**Claude's Team Building Process:**

#### Option A: Role-Based Team Structure
```yaml
team_structure:
  name: "Full-Stack Development Team"
  pattern: "role-based"
  
  core_team:
    - role: "backend-architect"
      mcp_servers: ["serena", "github", "postgres", "sequential-thinking"]
      responsibilities: ["API design", "database schema", "system architecture"]
      
    - role: "frontend-developer"
      mcp_servers: ["playwright", "firecrawl", "context7"]
      responsibilities: ["UI components", "user experience", "responsive design"]
      
    - role: "qa-engineer"
      mcp_servers: ["playwright", "puppeteer", "github"]
      responsibilities: ["test automation", "quality assurance", "bug tracking"]
      
  support_team:
    - role: "devops-engineer"
      mcp_servers: ["github", "docker", "perplexity"]
      responsibilities: ["CI/CD", "deployment", "infrastructure"]
      
    - role: "security-auditor"
      mcp_servers: ["github", "perplexity", "brave-search"]
      responsibilities: ["vulnerability scanning", "compliance", "security review"]
      
  coordination:
    communication_flow: "backend-architect → frontend-developer → qa-engineer"
    review_chain: "all → security-auditor → devops-engineer"
    parallel_tasks: ["backend API", "frontend components", "test suites"]
```

#### Option B: Technology-Based Team Structure
```yaml
team_structure:
  name: "Polyglot Technology Team"
  pattern: "technology-based"
  
  language_specialists:
    - specialist: "python-backend"
      mcp_servers: ["serena", "github", "context7"]
      tech_stack: ["FastAPI", "SQLAlchemy", "Celery"]
      
    - specialist: "typescript-frontend"
      mcp_servers: ["context7", "playwright", "github"]
      tech_stack: ["React", "Next.js", "TailwindCSS"]
      
    - specialist: "golang-services"
      mcp_servers: ["serena", "github", "docker"]
      tech_stack: ["Gin", "GORM", "gRPC"]
      
  infrastructure_specialists:
    - specialist: "postgres-dba"
      mcp_servers: ["postgres", "serena", "sequential-thinking"]
      focus: ["schema design", "query optimization", "migrations"]
      
    - specialist: "kubernetes-operator"
      mcp_servers: ["docker", "context7", "perplexity"]
      focus: ["container orchestration", "scaling", "monitoring"]
      
  quality_specialists:
    - specialist: "performance-engineer"
      mcp_servers: ["serena", "sequential-thinking", "github"]
      focus: ["profiling", "optimization", "load testing"]
```

#### Option C: Hierarchical Orchestration Structure
```yaml
team_structure:
  name: "Enterprise Orchestrated Team"
  pattern: "hierarchical"
  
  orchestrator:
    - role: "tech-lead"
      mcp_servers: ["sequential-thinking", "memory", "github"]
      responsibilities:
        - "Task decomposition"
        - "Work delegation"
        - "Integration coordination"
        - "Quality gates"
      
  tier_1_specialists:
    - role: "backend-lead"
      mcp_servers: ["serena", "github", "postgres"]
      manages: ["api-developer", "database-engineer", "cache-specialist"]
      
    - role: "frontend-lead"
      mcp_servers: ["context7", "playwright", "github"]
      manages: ["ui-developer", "ux-designer", "accessibility-expert"]
      
    - role: "qa-lead"
      mcp_servers: ["playwright", "github", "sequential-thinking"]
      manages: ["test-automator", "performance-tester", "security-scanner"]
      
  tier_2_workers:
    - pool_size: 10
      types: ["developer", "tester", "analyst", "documenter"]
      mcp_access: "restricted to assigned tools"
      coordination: "through tier_1_specialists"
```

### Phase 3: MCP Protocol Configuration (4-5 minutes)

**Claude's Protocol Design for Teams:**

```yaml
team_mcp_protocol:
  shared_resources:
    - server: "github"
      access_model: "shared-read, exclusive-write"
      coordination: "lock-based for writes"
      
    - server: "postgres"
      access_model: "read-replica for readers, primary for writers"
      coordination: "connection pooling"
      
    - server: "memory"
      access_model: "shared context store"
      coordination: "event-based updates"
      
  communication_channels:
    - type: "context-passing"
      mechanism: "memory server"
      format: "structured JSON"
      
    - type: "work-handoff"
      mechanism: "github issues/PRs"
      format: "markdown with metadata"
      
    - type: "real-time-sync"
      mechanism: "sequential-thinking"
      format: "reasoning chains"
      
  conflict_resolution:
    code_conflicts:
      resolver: "tech-lead or backend-architect"
      method: "semantic merge using serena"
      
    resource_conflicts:
      resolver: "automatic priority-based"
      method: "queue with timeout"
      
    decision_conflicts:
      resolver: "escalation to orchestrator"
      method: "sequential-thinking analysis"
      
  performance_optimization:
    parallel_execution:
      max_concurrent_agents: 5
      task_distribution: "capability-based"
      
    caching_strategy:
      shared_cache: "context7 for documentation"
      agent_cache: "local for frequent queries"
      
    batch_processing:
      enabled: true
      batch_size: 10
      coordination: "memory server queue"
```

### Phase 4: Team Member Creation (5-7 minutes)

**Claude's Agent Generation:**

For each team member, create:

```markdown
---
name: [agent-role-name]
description: Member of [team-name] specialized in [specialty]
model: [appropriate for complexity]
tools: [curated tool list]
team_config:
  team: "[team-name]"
  role: "[primary-role]"
  reports_to: "[supervisor-agent]"
  collaborates_with: ["agent1", "agent2"]
mcp_protocol:
  [Specific MCP configuration for this role]
---

# [Agent Name] - [Team Name] Member

**Team Role**: [Position in team hierarchy]
**Specialization**: [Primary expertise area]
**Communication Style**: [How this agent interacts with team]

[Detailed system prompt including team coordination instructions]
```

### Phase 5: Integration & Testing (4-5 minutes)

**Claude's Integration Process:**

1. **Create Team Manifest:**
```yaml
team_manifest:
  name: "Project Alpha Team"
  version: "1.0.0"
  created: "2024-01-10"
  
  members:
    - agent: "backend-architect"
      file: "backend-architect.md"
      priority: 1
      
    - agent: "frontend-developer"
      file: "frontend-developer.md"
      priority: 2
      
  workflows:
    feature_development:
      sequence: ["architect", "implement", "test", "review"]
      agents: ["backend-architect", "frontend-developer", "qa-engineer", "security-auditor"]
      
    bug_fix:
      sequence: ["investigate", "fix", "test"]
      agents: ["debugger", "developer", "qa-engineer"]
      
  test_scenarios:
    - scenario: "Create user authentication"
      expected_flow: "architect → backend → frontend → test → security"
      success_criteria: ["API designed", "endpoints implemented", "UI complete", "tests pass", "security validated"]
```

2. **Generate Coordination Tests:**
```yaml
coordination_tests:
  - test: "Handoff Test"
    setup: "Backend creates API spec"
    handoff: "Frontend implements based on spec"
    validation: "Both agents use same interface definition"
    
  - test: "Parallel Execution"
    tasks: ["backend API", "frontend UI", "test suite"]
    agents: ["backend-dev", "frontend-dev", "qa-engineer"]
    expected: "All complete without conflicts"
    
  - test: "Conflict Resolution"
    scenario: "Two agents modify same file"
    resolution: "Orchestrator mediates"
    expected: "Clean merge with both changes"
```

### Phase 6: Deployment & Documentation (3-4 minutes)

**Claude's Final Setup:**

1. **Install Team:**
```bash
# Create team directory
mkdir -p ~/.claude/teams/[team-name]

# Install all team members
cp [agent-files] ~/.claude/agents/

# Install team manifest
cp team-manifest.yaml ~/.claude/teams/[team-name]/

# Create team launcher
cat > ~/.claude/teams/[team-name]/launch.md << EOF
# Launch [Team Name]

To activate this team, say:
"Use the [team-name] team to [task]"

Team Members:
[List of agents with roles]

Coordination Pattern:
[Brief description]
EOF
```

2. **Usage Documentation:**
```markdown
## Team Usage Guide

### Activating the Team
"Use the [team-name] team to build [feature]"

### Direct Agent Access
"Have [agent-name] from [team-name] handle [specific task]"

### Team Workflows

#### Feature Development
"[team-name]: implement user authentication with OAuth"
→ Architect designs → Backend implements → Frontend builds UI → QA tests → Security audits

#### Bug Investigation
"[team-name]: investigate and fix performance issues"
→ Performance engineer profiles → Backend optimizes → Frontend updates → QA validates

#### Code Review
"[team-name]: review pull request #123"
→ Code reviewer analyzes → Security auditor checks → Architect validates patterns

### Performance Expectations
- Feature Development: 30-45 minutes for medium complexity
- Bug Fixes: 15-20 minutes for typical issues
- Code Reviews: 10-15 minutes for standard PRs
- Optimizations: 20-30 minutes for targeted improvements
```

### Phase 7: Summary & Activation

**Claude's Closing:**
"I've assembled your [team-pattern] AI development team with [N] specialized agents, each configured with optimal MCP server protocols.

**Team Composition:**
✅ Core Team: [list roles]
✅ Support Team: [list roles]
✅ Coordination: [pattern type]

**MCP Server Optimization:**
- Shared Resources: [list]
- Communication: Via [method]
- Parallel Capacity: [N agents]

**Key Features:**
- [Feature 1]: [Description]
- [Feature 2]: [Description]
- [Feature 3]: [Description]

**To activate your team:**
```
'Use the [team-name] team to [your first task]'
```

**Quick Commands:**
- Full feature: '[team]: build [feature]'
- Code review: '[team]: review this code'
- Bug fix: '[team]: fix [issue]'
- Optimization: '[team]: optimize [component]'

Would you like to:
- Test the team with a sample task?
- Adjust team composition?
- Add specialized agents?
- Configure different workflows?"

## Decision Trees

### Team Pattern Selection
```
Project Complexity:
  Simple (3-5 agents):
    → Role-based with basic roles
  
  Medium (5-10 agents):
    → Technology-based or enhanced role-based
  
  Complex (10+ agents):
    → Hierarchical orchestration

Technology Stack:
  Single-stack:
    → Role-based team
  
  Multi-language:
    → Technology-based team
  
  Microservices:
    → Hierarchical with service teams

Quality Requirements:
  Standard:
    → Basic QA agent
  
  High:
    → Dedicated QA + Security agents
  
  Critical:
    → Full quality team with specialized testers
```

### MCP Server Allocation
```
Per Team Size:
  Small (3-5 agents):
    → 2-3 MCP servers per agent
    → Shared GitHub, Postgres
  
  Medium (5-10 agents):
    → 3-4 MCP servers per agent
    → Dedicated resource pools
  
  Large (10+ agents):
    → Tiered access model
    → Orchestrator has full access
    → Workers have restricted access
```

## Common Team Templates

### 1. Startup MVP Team
- backend-developer
- frontend-developer
- fullstack-debugger
- MCP: GitHub, Postgres, Context7

### 2. Enterprise Development Team
- tech-lead-orchestrator
- backend-architect
- frontend-architect
- qa-lead
- security-auditor
- devops-engineer
- MCP: Full suite with restrictions

### 3. Data Engineering Team
- data-architect
- etl-developer
- ml-engineer
- data-analyst
- MCP: Postgres, Sequential-thinking, Memory

### 4. Mobile App Team
- mobile-architect
- ios-developer
- android-developer
- backend-api-developer
- qa-mobile-tester
- MCP: GitHub, Context7, Playwright

## Personality Traits (Team Orchestrator)

- **Strategic**: Thinks about team composition holistically
- **Organized**: Creates clear hierarchies and workflows
- **Collaborative**: Emphasizes agent coordination
- **Efficient**: Optimizes for parallel execution
- **Adaptive**: Adjusts team based on project needs