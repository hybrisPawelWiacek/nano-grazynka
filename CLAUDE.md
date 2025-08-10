# Claude AI Assistant Guidelines for nano-Grazynka Project

## Project Overview
nano-Grazynka is a voice note transcription and summarization utility that processes audio files (EN/PL), generates summaries, and extracts action points following strict rules where transcription is the sole source of truth.

## Working with Paweł (Product Manager)
- I have strong technical understanding but delegate implementation details
- I value simplicity and MVP-focused development
- I expect you to make technology/architecture decisions within my requirements
- I appreciate when you follow best practices (DDD, separation of concerns)
- I don't want over-engineering or premature optimization

## Key Development Rules

### 1. MVP Mindset is Critical
- Build only what's specified in the PRD
- No features for hypothetical future needs  
- Choose boring, proven technology
- Simplicity > Cleverness
- If it's not in the PRD, don't build it

### 2. Architecture Principles
- Follow Domain-Driven Design
- Maintain clear separation of concerns
- Keep business logic framework-agnostic
- Use dependency injection appropriately
- Prefer composition over inheritance

### 3. Technology Stack (Fixed per PRD)
```
Frontend: Next.js (App Router) + TypeScript
Backend: Node.js with Fastify  
Database: SQLite via Prisma
Deployment: Docker Compose
Testing: Unit + Integration + E2E (Playwright/Puppeteer)
```

### 4. Core Features (MVP Phase)
- Local file upload only (no cloud storage)
- Whisper transcription via OpenRouter/OpenAI
- LLM summarization with configurable prompts
- Version history for reprocessing
- Library view with search/filter
- Export to Markdown
- EN/PL language support

### 5. What NOT to Build
- Multi-user authentication
- Cloud integrations (Google Drive, etc.)
- Real-time recording
- Team features
- Local Whisper runtime
- Vector search
- Complex caching layers

### 6. Code Style Guidelines
- Write clear, readable TypeScript
- Small, focused functions
- Descriptive variable names
- Document complex business logic only
- Consistent formatting
- No unnecessary abstractions

### 7. UI/UX Requirements
- Light theme, minimal colors (no blue/purple)
- Apple-inspired design
- To-doist as secondary reference  
- Keyboard navigation support
- Basic ARIA accessibility

### 8. Error Handling
- Use canonical failure message for processing errors
- Structured logging with trace IDs
- User-friendly error messages
- Graceful degradation

### 9. Configuration
- YAML for user settings
- .env for secrets
- All limits/timeouts configurable
- Clear documentation

### 10. Testing Approach
- Test critical business logic
- Integration tests for workflows
- Stub external services
- E2E for key user journeys

## Decision Making Framework

When making choices, ask:
1. Is it required by the PRD?
2. Is it the simplest solution that works?
3. Does it follow established patterns?
4. Will it scale to our MVP needs (not beyond)?
5. Is it maintainable and clear?

## Communication Style
- Be concise and direct
- Explain "why" for non-obvious decisions
- Suggest simpler alternatives when I over-specify
- Ask for clarification on ambiguous requirements
- Focus on implementation, not theory

## File Organization
```
/src
  /domain        # Business logic
  /infrastructure # External integrations
  /application   # Use cases
  /presentation  # UI components
  /shared        # Common utilities
```

## MCP Server Usage Guidelines

### Primary Tool Selection Hierarchy
When working on this project, follow this tool selection order:

#### 1. Code Navigation & Analysis (PRIMARY: Serena)
**ALWAYS use Serena MCP first for code exploration:**
- `get_symbols_overview` - Start here to understand file structure
- `find_symbol` - Navigate to specific classes/functions/methods
- `find_referencing_symbols` - Analyze impact before changes
- `search_for_pattern` - Find code patterns across codebase
- **Fallback**: Use native Read/Grep only for non-code files or quick checks

**Example Workflow:**
```
1. serena.get_symbols_overview(file) → Understand structure
2. serena.find_symbol("ProcessingOrchestrator") → Navigate to class
3. serena.find_referencing_symbols("ProcessingOrchestrator") → Check usage
4. Make changes with confidence
```

#### 2. Persistent Memory (PRIMARY: Memory MCP)
**Use Memory MCP for all architectural decisions:**
- Store API contract changes
- Document interface mappings
- Track breaking changes
- Persist design decisions
- Save integration patterns

**What to persist:**
- API endpoint changes
- Type/interface modifications  
- Configuration updates
- Architecture decisions
- Integration fixes

#### 3. Complex Planning (SYNERGY: TodoWrite + Sequential Thinking)
**TodoWrite owns task management, Sequential Thinking owns deep reasoning:**

**Regular Mode Pattern:**
```
1. TodoWrite → Create task list
2. Mark task as in_progress
3. Sequential Thinking → Deep dive into HOW to implement
4. Execute implementation
5. Mark task as completed
```

**Plan Mode Pattern (when user asks for planning):**
```
1. Sequential Thinking → Break down complex problem
2. ExitPlanMode → Transition to execution
3. TodoWrite → Track execution tasks
```

**Key Principle:** Sequential Thinking works WITHIN TodoWrite tasks, never replaces them

#### 4. Documentation Research (PRIMARY: Context7 + Perplexity)
**Context7 for framework docs:**
- Next.js 15 documentation
- Fastify API references
- Prisma schema guides
- TypeScript patterns

**Perplexity for best practices:**
- Architecture patterns research
- Security best practices
- Performance optimization strategies
- Industry standards

**Workflow:**
```
1. Context7 → Get latest framework docs
2. Perplexity → Research best practices
3. Implement with confidence
```

#### 5. Web Scraping (PRIMARY: Firecrawl)
**Use for external documentation:**
- API documentation not in Context7
- Blog posts with solutions
- GitHub issues and discussions
- Stack Overflow answers

### Integration Workflows

#### Feature Implementation Flow
```
1. Sequential Thinking → Plan approach (within TodoWrite task)
2. Context7/Perplexity → Research requirements
3. Serena → Navigate and understand existing code
4. Implementation → Make changes
5. Serena → Verify impact with find_referencing_symbols
6. Memory → Persist decisions and changes
```

#### Bug Fix Flow
```
1. Serena.search_for_pattern → Locate issue
2. Serena.find_referencing_symbols → Understand dependencies
3. Fix implementation
4. Memory → Document fix and reasoning
```

#### API Contract Update Flow
```
1. Memory → Check existing contracts
2. Update implementation
3. Serena → Find all references to update
4. Memory → Persist new contract
```

### Tool Selection Rules

1. **Serena First Rule**: Always try Serena for code navigation before Read/Grep
2. **Memory Always Rule**: Always persist architectural changes to Memory
3. **Research Before Implementation**: Use Context7/Perplexity before implementing new patterns
4. **TodoWrite for Tracking**: All multi-step tasks go through TodoWrite
5. **Sequential Thinking for Complexity**: Use within tasks for deep reasoning, not for general planning

### Anti-Patterns to Avoid

❌ **DON'T:**
- Use Read for entire source files (use Serena's symbolic tools)
- Use Grep for code search (use Serena's search_for_pattern)
- Use Sequential Thinking for simple task planning (use TodoWrite)
- Skip Memory when making architectural changes
- Navigate code without understanding structure first

✅ **DO:**
- Start with Serena.get_symbols_overview for new files
- Use Memory to persist all API/interface changes
- Use TodoWrite for task management
- Use Sequential Thinking within complex TodoWrite tasks
- Research with Context7/Perplexity before implementing patterns

### MCP Server Fallback Strategy

If primary tool fails, follow this fallback order:
1. **Code Navigation**: Serena → Grep → Read
2. **Documentation**: Context7 → Perplexity → WebSearch → Firecrawl
3. **Planning**: TodoWrite + Sequential Thinking → TodoWrite alone
4. **Memory**: Memory MCP → Create local documentation file

### Integration Points for nano-Grazynka

**Critical MCP Usage for This Project:**
1. **Serena**: Navigate DDD architecture (domain/application/infrastructure)
2. **Memory**: Track API contracts between frontend/backend
3. **Context7**: Next.js 15 App Router and Fastify documentation
4. **Sequential Thinking**: Within tasks for processing pipeline design
5. **Perplexity**: Research Whisper API and LLM best practices

**Project-Specific Patterns:**
- Use Serena to navigate between use cases and domain entities
- Memory stores all interface mappings (frontend ↔ backend)
- Context7 for Prisma schema and Next.js patterns
- Sequential Thinking for complex processing orchestration logic

## Context Management & Auto-Save System

### When to Save Context (Triggers)
Save project state to Memory MCP when:
1. **Context Warning**: "/compact" message appears or context feels heavy
2. **Before Major Changes**: Starting new feature or significant refactoring
3. **Session End**: Before closing or switching projects
4. **Milestone Completion**: After completing major todos or features
5. **Context at ~94%**: When approaching auto-compact threshold

### Context Save Pattern
When triggered, automatically save these entities to Memory:

#### 1. PROJECT_STATUS Entity
```javascript
{
  name: "nano-grazynka-status-[timestamp]",
  entityType: "project-status",
  observations: [
    "Current date: [date]",
    "Active branch: [branch]",
    "Last completed task: [task]",
    "Current work focus: [description]",
    "Pending issues: [list]",
    "Next planned action: [action]"
  ]
}
```

#### 2. ACTIVE_TODOS Entity
```javascript
{
  name: "nano-grazynka-todos-[timestamp]",
  entityType: "todo-state",
  observations: [
    "Todo #1: [content] - Status: [status]",
    "Todo #2: [content] - Status: [status]",
    // ... all active todos from TodoWrite
  ]
}
```

#### 3. TECHNICAL_CONTEXT Entity
```javascript
{
  name: "nano-grazynka-technical-[timestamp]",
  entityType: "technical-state",
  observations: [
    "Files modified: [list]",
    "API endpoints touched: [list]",
    "Current errors/issues: [list]",
    "Dependencies added: [list]",
    "Configuration changes: [list]"
  ]
}
```

### Auto-Save Command Sequence
When context is low, execute this sequence:
```bash
# 1. Save current TodoWrite state to Memory
memory.create_entities([project_status, active_todos, technical_context])

# 2. Create relations between entities
memory.create_relations([
  {from: "project_status", to: "active_todos", relationType: "has-todos"},
  {from: "project_status", to: "technical_context", relationType: "uses-tech"}
])

# 3. Add checkpoint observation to main project entity
memory.add_observations({
  entityName: "nano-grazynka-continuation-plan",
  contents: ["Checkpoint created at [timestamp] due to low context"]
})
```

### Recovery After Compaction
After context compaction, restore by:
1. `memory.search_nodes("nano-grazynka status todos technical")`
2. Load most recent checkpoint entities
3. Restore TodoWrite state from saved todos
4. Continue from last active task

### Manual Trigger Command
If you notice context getting full, say:
> "Save context checkpoint to memory"

This will trigger the full save sequence above.

## Remember
This is an MVP. Every line of code should directly support a requirement in the PRD. When in doubt, choose the simpler option.

## API Contract-First Development Rules

### 1. Single Source of Truth
- **OpenAPI Specification (`/api-spec.yaml`)** is the canonical API contract
- All frontend-backend interfaces MUST match the specification exactly
- No ad-hoc field renaming or response format changes

### 2. Documentation Structure
```
/api-spec.yaml           # OpenAPI specification (source of truth)
/docs/api-contract.md    # Human-readable API documentation
/docs/interface-mapping.md # Frontend-backend type mappings
/docs/integration-testing.md # Docker & testing guidelines
```

### 3. Required Validation Steps Before Implementation
1. **Check API spec first**: `cat /api-spec.yaml` for endpoint definition
2. **Verify field names**: Use exact names from OpenAPI schema
3. **Match response format**: Responses must match nested structure
4. **Test in Docker**: Always verify integration in Docker environment

### 4. Common Interface Patterns
```typescript
// ✅ CORRECT: Nested response format
{
  voiceNote: { id, title, status, ... },
  message: "Success"
}

// ❌ WRONG: Flat response format
{
  id, title, status, ...,
  message: "Success"
}

// ✅ CORRECT: Field mapping in route handler
const domainFile = {
  originalName: formData.filename,  // Map frontend field
  mimeType: formData.mimetype,      // Map frontend field
  buffer: await file.toBuffer()
}

// ❌ WRONG: Direct pass-through without mapping
const domainFile = formData  // Will fail due to field mismatches
```

### 5. Pre-commit Checklist
- [ ] Does API implementation match `/api-spec.yaml`?
- [ ] Are all field names consistent with specification?
- [ ] Is response format properly nested?
- [ ] Does Prisma client generation run in Docker?
- [ ] Have you tested the full flow in Docker?

### 6. When Adding New Endpoints
1. **Update `/api-spec.yaml` FIRST**
2. Generate types from OpenAPI spec
3. Implement backend following the spec
4. Implement frontend using generated types
5. Test end-to-end in Docker environment

### 7. Error Prevention
- Never rename fields at the route level without updating spec
- Always wrap single entities in response objects
- Include `RUN npx prisma generate` in Dockerfiles
- Test multipart form data handling thoroughly

## Project Progress Report

### Step 1: Initial Setup ✅ COMPLETED

#### Tasks Accomplished:
1. **Project Scaffolding** ✅
   - Created monorepo structure with `/frontend` (Next.js) and `/backend` (Fastify)
   - Set up TypeScript configurations for both services
   - Initialized package.json with appropriate dependencies
   - Created proper DDD folder structure in backend

2. **Docker Configuration** ✅
   - Created `docker-compose.yml` with frontend and backend services
   - Set up development Dockerfiles with hot reloading
   - Configured volume mounts for development
   - Changed ports to 3100 (frontend) and 3101 (backend) to avoid conflicts
   - SQLite database volume configured at `/data`

3. **YAML Configuration System** ✅
   - Implemented comprehensive Zod schema for validation
   - Created ConfigLoader that merges YAML with environment variables
   - Environment variables properly override YAML settings
   - Configuration includes all required sections: server, database, transcription, summarization, storage, processing
   - Default prompts configured for EN/PL support

4. **Observability Hooks** ✅
   - Created stub implementations for LangSmith and OpenLLMetry
   - Composite pattern allows multiple providers
   - Auto-enables based on API key presence in environment
   - Health check endpoint reports observability status

#### Current Status:
- Application running successfully via `docker compose up`
- Frontend accessible at http://localhost:3100
- Backend health check at http://localhost:3101/health
- Both observability providers showing as enabled
- Configuration loaded from `config.yaml` with .env overrides working

#### Key Technical Decisions:
- Used non-standard ports (3100/3101) to avoid conflicts
- Chose file-based SQLite for simplicity (as per PRD)
- Implemented configuration hierarchy: YAML → Environment variables
- Created stub observability that's ready for real implementation later

### Step 2: Domain Models & Testing Infrastructure ✅ COMPLETED

#### Tasks Accomplished:
1. **Core Domain Entities** ✅
   - Created VoiceNote entity with full business logic
   - Created Transcription entity for storing transcription results
   - Created Summary entity with sections (summary, key_points, action_items)
   - All entities follow DDD principles with private constructors and factory methods

2. **Value Objects** ✅
   - VoiceNoteId: UUID-based identifier with validation
   - Language: Enum-based value object supporting EN/PL
   - ProcessingStatus: Status tracking (pending, processing, completed, failed)
   - All value objects are immutable with proper equality checks

3. **Domain Events** ✅
   - Created base DomainEvent interface and BaseDomainEvent class
   - Implemented all voice note lifecycle events:
     - VoiceNoteUploadedEvent
     - VoiceNoteProcessingStartedEvent
     - VoiceNoteTranscribedEvent
     - VoiceNoteSummarizedEvent
     - VoiceNoteProcessingCompletedEvent
     - VoiceNoteProcessingFailedEvent
     - VoiceNoteReprocessedEvent

4. **Repository Interfaces** ✅
   - VoiceNoteRepository with pagination and filtering support
   - EventStore for domain event persistence
   - Interfaces are framework-agnostic following DDD principles

5. **Prisma Schema Setup** ✅
   - Configured SQLite database at /data/nano-grazynka.db
   - Created all necessary tables: VoiceNote, Transcription, Summary, Event
   - Added proper indexes for performance
   - Set up cascade deletes for data integrity
   - Added Prisma scripts to package.json

6. **Testing Infrastructure** ✅
   - Set up Jest with TypeScript support (ts-jest)
   - Created comprehensive test suite for all domain models
   - Achieved 100% test coverage for value objects
   - Achieved 85% test coverage for domain entities
   - All 49 tests passing successfully
   - Added npm scripts for testing (test, test:watch, test:coverage)

#### Key Technical Decisions:
- Used CUID for primary keys (better than UUIDs for SQLite)
- JSON storage for tags and event payloads (SQLite doesn't have native arrays)
- Separate Event table for event sourcing capability
- Indexes on commonly queried fields (userId, status, dates)
- Jest for testing framework (simple, well-supported, TypeScript-friendly)

### Step 3: Infrastructure Layer ✅ COMPLETED

#### Tasks Accomplished:
1. **Database Client Setup** ✅
   - Created Prisma client singleton to manage database connections
   - Configured with proper logging for development mode
   - Ensures single database connection instance

2. **Repository Implementations** ✅
   - VoiceNoteRepositoryImpl with full CRUD operations
   - Implements pagination with proper offset calculations
   - Handles complex queries with filtering and search
   - Proper transaction handling for related entities
   - EventStoreImpl for domain event persistence
   - JSON serialization for event payloads

3. **External Service Adapters** ✅
   - WhisperAdapter for OpenAI/OpenRouter transcription
   - LLMAdapter for summarization with configurable models
   - LocalStorageAdapter for file system operations
   - All adapters implement proper error handling

4. **Observability Integration** ✅
   - LangSmithObservabilityProvider with trace tracking
   - OpenLLMetryObservabilityProvider for metrics
   - CompositeObservabilityProvider to support multiple providers
   - Auto-enables based on API key presence

5. **Integration Tests** ✅
   - Comprehensive test coverage for repositories
   - Mocked Prisma client for database operations
   - All 13 infrastructure tests passing
   - Total of 67 tests passing across the backend

#### Key Technical Decisions:
- Used transactions for saving related entities (VoiceNote + Transcription + Summary)
- JSON serialization for arrays in SQLite (tags, keyPoints, actionItems)
- Stub implementations for external services ready for real integration
- Composite pattern for observability to support multiple providers
- Proper separation between domain interfaces and infrastructure implementations

### Step 4: Application Layer ✅ COMPLETED

#### Tasks Accomplished:
1. **Base Abstractions** ✅
   - UseCase abstract class for all use cases
   - Result type for consistent error handling
   - Application-specific error types (ValidationError, NotFoundError, etc.)

2. **Core Use Cases** ✅
   - UploadVoiceNoteUseCase: File validation, storage, entity creation
   - ProcessVoiceNoteUseCase: Full processing pipeline orchestration
   - GetVoiceNoteUseCase: Retrieve with transcriptions/summaries
   - ListVoiceNotesUseCase: Search, filter, paginate library
   - DeleteVoiceNoteUseCase: Cascade delete with file cleanup
   - ReprocessVoiceNoteUseCase: New LLM run with version tracking
   - ExportVoiceNoteUseCase: Generate Markdown/JSON exports

3. **ProcessingOrchestrator** ✅
   - Coordinates complete processing pipeline
   - Transcription → Classification → Summarization flow
   - Handles reprocessing with new prompts
   - Implements canonical failure handling
   - Manages domain events at each stage

4. **Key Features Implemented** ✅
   - File validation (formats, size limits)
   - Automatic title extraction from filenames
   - Language detection and mirroring
   - Project classification using GPT-5-nano
   - System prompt templating with variables
   - Version tracking for reprocessing
   - Export to Markdown with proper formatting

#### Key Technical Decisions:
- Dependency injection for all services
- Transactional boundaries in use cases
- Domain events emitted for state changes
- Result pattern for explicit error handling
- Separation between orchestration and business logic

### Step 5: API Layer ✅ COMPLETED

#### Tasks Accomplished:
1. **Middleware Setup** ✅
   - Error handler middleware with structured error responses
   - Request/response logging with trace IDs
   - CORS configuration for cross-origin requests
   - Rate limiting (100 requests per minute)
   - Multipart form data handling for file uploads

2. **Dependency Injection Container** ✅
   - Singleton container pattern
   - Manages all service instances
   - Provides dependency resolution
   - Lazy initialization of services

3. **API Routes Implementation** ✅
   - Health check endpoints (/health, /ready)
   - Voice note CRUD operations
   - File upload endpoint with validation
   - Processing trigger endpoint
   - Reprocessing endpoint
   - Export endpoint (Markdown/JSON)
   - Search and filter endpoints

4. **Request/Response DTOs** ✅
   - Input validation schemas (removed Zod due to Fastify incompatibility)
   - Consistent response formats
   - Error response standardization
   - Pagination metadata in responses

5. **Fixed Critical Issues** ✅
   - Fixed ProcessingOrchestrator compilation errors (method names, event store interface)
   - Fixed use case compilation errors (value object ID access)
   - Fixed configuration loading and validation
   - Fixed Fastify schema validation incompatibility
   - Fixed repository implementation to match domain interfaces
   - Fixed Prisma relation names (transcriptions/summaries plural)
   - Added proper error handling for all routes

#### Key Technical Decisions:
- Removed Zod schema validation from routes (Fastify expects JSON Schema)
- Used Result pattern for consistent error handling
- Implemented proper repository interface alignment
- Fixed domain entity method calls (addTranscription vs setTranscription)

#### Current Status:
- Backend API server running successfully on port 3101
- All endpoints operational and tested
- Health check shows database connected and observability enabled
- Ready for frontend integration

### Next Steps:
Ready to proceed to Step 6 - Frontend Implementation (Next.js UI) when requested.