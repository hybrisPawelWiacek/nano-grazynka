# System Architecture
**Last Updated**: August 15, 2025
**Version**: 2.0

## Overview

nano-Grazynka is a voice note transcription and summarization system built with Domain-Driven Design (DDD) principles. The system processes audio files through a pipeline that includes transcription, language detection, and intelligent summarization.

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Next.js UI    │────▶│  Fastify API    │
│   (Port 3100)   │     │   (Port 3101)   │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼──────┐         ┌───────▼────────┐
              │             │         │                │
              │   SQLite    │         │  External APIs │
              │  Database   │         │  (OpenAI/LLM)  │
              │             │         │                │
              └─────────────┘         └────────────────┘
```

## Domain-Driven Design Implementation

### Layer Architecture

```
/backend/src
├── domain/              # Core Business Logic (Pure)
│   ├── entities/       # Business Entities
│   ├── value-objects/  # Immutable Values
│   ├── events/         # Domain Events
│   └── repositories/   # Repository Interfaces
│
├── application/        # Use Cases & Orchestration
│   ├── use-cases/     # Business Operations
│   └── services/      # Process Coordination
│
├── infrastructure/     # External Dependencies
│   ├── persistence/   # Database Implementation
│   ├── external/      # Third-party APIs
│   └── storage/       # File System
│
└── presentation/      # API Layer
    ├── routes/        # HTTP Endpoints
    └── middleware/    # Cross-cutting Concerns
```

### Layer Responsibilities

#### Domain Layer
- **Purpose**: Contains pure business logic with no external dependencies
- **Components**:
  - **Entities**: VoiceNote, Transcription, Summary - mutable objects with identity
  - **Value Objects**: Language, ProcessingStatus, VoiceNoteId - immutable values
  - **Domain Events**: State change notifications for event-driven architecture
  - **Repository Interfaces**: Contracts for data persistence (no implementation)
- **Key Principle**: Framework-agnostic, testable in isolation

#### Application Layer
- **Purpose**: Orchestrates use cases and coordinates domain operations
- **Components**:
  - **Use Cases**: Single business operations (Upload, Process, Export, etc.)
  - **ProcessingOrchestrator**: Coordinates the transcription → summarization pipeline
  - **Result Type**: Explicit error handling without exceptions
- **Key Principle**: Transaction boundaries, dependency injection

#### Infrastructure Layer
- **Purpose**: Implements interfaces and handles external dependencies
- **Components**:
  - **Prisma Repositories**: Database persistence implementation
  - **WhisperAdapter**: Multi-model transcription support
    - `transcribe()`: GPT-4o-transcribe via OpenAI API
    - `transcribeWithGemini()`: Gemini 2.0 Flash via OpenRouter with base64 encoding
  - **LLMAdapter**: Language model integration for summarization
  - **LocalStorageAdapter**: File system operations
  - **TitleGenerationAdapter**: AI-powered title generation from transcripts
    - Extracts meaningful titles automatically
    - Supports brief descriptions and date extraction
  - **AudioMetadataExtractor**: Audio file metadata extraction
    - Uses music-metadata library for duration extraction
    - Supports various audio formats (mp3, m4a, wav, etc.)
  - **PromptLoader**: YAML-based prompt management with variable interpolation and hot-reload
    - Centralizes all AI prompts in `backend/prompts.yaml`
    - Supports variable interpolation using lodash templates
    - Hot-reload in development mode for rapid iteration
    - See [PROMPTS_GUIDE.md](../development/PROMPTS_GUIDE.md) for details
- **Key Principle**: Adapters and implementations of domain contracts

#### Presentation Layer
- **Purpose**: HTTP API and request/response handling
- **Components**:
  - **Fastify Routes**: RESTful endpoints
  - **Middleware**: Error handling, logging, CORS, rate limiting
  - **Dependency Container**: Service composition and injection
- **Key Principle**: Thin layer, delegates to application layer

## Authentication Architecture

### User System Components
- **User Entity**: Core user model with email, password hash, tier, credits
- **Session Management**: JWT-based sessions with httpOnly cookies
- **UsageLog**: Tracks every transcription for billing and analytics
- **AnonymousSession**: Enables usage without registration

### Middleware Chain
```
Request → CORS → OptionalAuth → UsageLimit → Route Handler
                      ↓
                Check JWT Cookie
                      ↓
            Valid? → Set req.user
            Invalid? → Continue as anonymous
```

### Key Endpoints
- **POST /api/auth/register**: Create new user account
- **POST /api/auth/login**: Authenticate and create session
- **POST /api/auth/logout**: Invalidate session
- **GET /api/auth/me**: Get current user info
- **GET /api/anonymous/usage**: Check anonymous usage count
- **POST /api/anonymous/migrate**: Convert anonymous to registered

## Data Flow

### Voice Note Processing Pipeline

```
1. File Upload with Model Selection
   └─> Presentation: Multipart form with transcriptionModel field
       └─> Application: UploadVoiceNoteUseCase
           └─> Domain: VoiceNote.create() with model metadata
               └─> Infrastructure: Save file & entity with prompts

2. Multi-Model Processing Trigger
   └─> Application: ProcessVoiceNoteUseCase
       └─> ProcessingOrchestrator.process()
           ├─> Model Router: Check transcriptionModel field
           │   ├─> GPT-4o Path:
           │   │   └─> WhisperAdapter.transcribe()
           │   │       └─> OpenAI API with whisperPrompt (224 tokens)
           │   └─> Gemini 2.0 Path:
           │       └─> WhisperAdapter.transcribeWithGemini()
           │           ├─> Base64 encode audio
           │           └─> OpenRouter API with system/user prompts (1M tokens)
           ├─> Classification: LLMAdapter → Categorization
           └─> Summarization: LLMAdapter → Summary generation

3. Status Transitions
   pending → processing → completed/failed
   (Each transition emits domain events)
```

## Design Patterns

### 1. Repository Pattern
- **Purpose**: Abstract data access from domain logic
- **Implementation**: Interfaces in domain, implementations in infrastructure
- **Benefit**: Testability and database independence

### 2. Factory Pattern
- **Purpose**: Controlled entity creation with validation
- **Implementation**: Private constructors with static factory methods
- **Example**: `VoiceNote.create()`, `Summary.create()`

### 3. Value Object Pattern
- **Purpose**: Represent concepts without identity
- **Implementation**: Immutable objects with equality by value
- **Example**: `Language`, `ProcessingStatus`, `VoiceNoteId`

### 4. Domain Events
- **Purpose**: Decouple state changes from side effects
- **Implementation**: Events emitted on state transitions
- **Use Case**: Audit logging, future webhook notifications

### 5. Result Pattern
- **Purpose**: Explicit error handling without exceptions
- **Implementation**: `Result<T, E>` type with success/failure states
- **Benefit**: Forced error handling, better type safety

### 6. Dependency Injection
- **Purpose**: Loose coupling and testability
- **Implementation**: Constructor injection with container
- **Benefit**: Easy mocking, clear dependencies

### 7. Unit of Work (via Transactions)
- **Purpose**: Ensure data consistency
- **Implementation**: Prisma transactions for related entities
- **Example**: Saving VoiceNote with Transcription and Summary

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high performance, schema validation)
- **Database**: SQLite via Prisma ORM
- **Testing**: Jest with ts-jest

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks and context

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **File Storage**: Local filesystem (MVP phase)
- **API Integration**: OpenAI/OpenRouter for AI services

## Processing Pipeline Details

### 1. Multi-Model Transcription
- **Primary Models**: 
  - **GPT-4o-transcribe** (Default): Fast, 224 token prompt limit, $0.006/min
  - **Gemini 2.0 Flash**: Context-aware, 1M token prompts, $0.0015/min (75% cheaper)
- **Languages**: English, Polish (auto-detected)
- **Model Selection Logic**:
  ```typescript
  if (transcriptionModel === 'google/gemini-2.0-flash-001') {
    // Base64 encode audio
    // Send to Gemini via OpenRouter with system/user prompts
  } else {
    // Use GPT-4o-transcribe via OpenAI API with whisper prompt
  }
  ```
- **Output**: Plain text transcription with model metadata

### 2. Classification
- **Service**: GPT-4/Claude for categorization
- **Purpose**: Identify project/context from transcription
- **Output**: Project tag for organization

### 3. Summarization
- **Service**: Configurable LLM (GPT-4/Claude)
- **Components**:
  - Executive summary
  - Key points extraction
  - Action items identification
- **Language**: Mirrors transcription language

## Security Considerations

### Current Implementation
- **JWT Authentication** with httpOnly cookies for secure session management
- **Multi-user support** with User, Session, and UsageLog tables
- **Anonymous sessions** allowing 5 free transcriptions without registration
- **Bcrypt password hashing** with configurable salt rounds
- **API keys** in environment variables
- **CORS configured** for production domains
- **Rate limiting** (100 req/min baseline, tier-specific limits planned)

### Authentication Flow
1. **Registration**: `/api/auth/register` creates user with hashed password
2. **Login**: `/api/auth/login` validates credentials, creates session, sets JWT cookie
3. **Session validation**: Middleware verifies JWT on protected routes
4. **Logout**: `/api/auth/logout` invalidates session and clears cookie

### Anonymous User Flow
1. **Session creation**: First visit generates unique sessionId in localStorage
2. **Usage tracking**: Anonymous uploads tracked via AnonymousSession table
3. **Limit enforcement**: 5 free transcriptions, then 403 with upgrade prompt
4. **Migration path**: Anonymous notes linked to user account on registration

### User Tiers
- **Free**: 5 transcriptions/month, auto-reset on 1st
- **Pro**: Unlimited transcriptions ($9.99/month)
- **Business**: Unlimited + priority support ($29.99/month)

### Security Best Practices
- Passwords never stored in plain text
- JWT secrets rotated regularly
- Session timeout after 30 days
- HTTPS enforced in production
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM

## Performance Metrics

### Target Performance
- **File Upload**: < 100ms response
- **Transcription**: 2-3s for 30s audio
- **Summarization**: 1-2s processing
- **Total Pipeline**: < 5s end-to-end
- **Database Queries**: < 10ms single entity

### Optimization Strategies
- Database indexes on frequently queried fields
- File streaming for large uploads
- Async processing with status polling
- Connection pooling for database
- Caching for repeated operations (future)
- **SQLite WAL Mode**: 2-3x faster write performance
- **Synchronous=NORMAL**: Balanced durability vs speed
- **Prisma Auto-regeneration**: Ensures schema consistency in Docker

## Scalability Considerations

### Current Limitations (MVP)
- Single SQLite database
- Local file storage
- Synchronous processing
- No horizontal scaling

### Future Scaling Path
- PostgreSQL for concurrent access
- S3/CloudStorage for files
- Queue-based async processing
- Microservice decomposition
- Load balancing

## Error Handling Strategy

### Canonical Failure Message
```
"Processing failed. Please try again or contact support if the issue persists."
```

### Error Categories
1. **Validation Errors**: User input issues
2. **Processing Errors**: Transcription/summarization failures
3. **System Errors**: Database/filesystem issues
4. **External Service Errors**: API failures

### Error Recovery
- Automatic retries for transient failures
- Graceful degradation for non-critical features
- Comprehensive logging with trace IDs
- User-friendly error messages

## Event-Driven Architecture

### Domain Events
```typescript
VoiceNoteUploadedEvent
VoiceNoteProcessingStartedEvent
VoiceNoteTranscribedEvent
VoiceNoteSummarizedEvent
VoiceNoteProcessingCompletedEvent
VoiceNoteProcessingFailedEvent
VoiceNoteReprocessedEvent
```

### Future Event Usage
- Webhook notifications
- Real-time UI updates via WebSocket
- Audit logging
- Analytics and metrics
- Workflow automation

## Configuration Management

### Configuration Hierarchy
1. `config.yaml` - Default settings
2. `.env` - Environment overrides
3. Runtime parameters - Dynamic configuration

### Configurable Elements
- API endpoints and keys
- Model selection (GPT-4o, Gemini 2.0 Flash, Claude, etc.)
- File size limits
- Timeout values
- Language settings
- Proof of work difficulty (for rate limiting)
- Custom prompt regeneration support

**Note**: System prompts have been externalized to `backend/prompts.yaml` with variable interpolation support. See [PROMPTS_GUIDE.md](../development/PROMPTS_GUIDE.md) for details.

## Monitoring & Observability

### Current Implementation
- Health check endpoints
- Structured logging with trace IDs
- LangSmith integration (when configured)
- OpenLLMetry support (when configured)

### Metrics to Track
- Processing success/failure rates
- API response times
- Transcription accuracy
- User engagement metrics
- Resource utilization

## Testing Strategy

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed testing approach.

## API Documentation

See [api-contract.md](./api-contract.md) for complete API specifications.

## Database Schema

See [DATABASE.md](./DATABASE.md) for schema details and relationships.