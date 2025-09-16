# nano-Grazynka

## Overview

nano-Grazynka is a voice note transcription and summarization platform built with Domain-Driven Design principles. The system processes audio files through a pipeline that includes transcription, AI-powered summarization, and knowledge management features. It supports both anonymous and authenticated users with tier-based usage limits.

The platform offers multi-language support (English and Polish), multiple AI model options for transcription (GPT-4o and Gemini 2.0 Flash), and an entity-project system for context-aware transcriptions. Users can organize voice notes by projects, define custom entities for better transcription accuracy, and export results in multiple formats.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15.4.6 with React 19.1.0
- **Styling**: CSS Modules with Apple-inspired design system
- **State Management**: React Context API for authentication
- **Routing**: App Router with middleware-based route protection
- **UI Components**: Custom component library following iOS/macOS design patterns
- **Authentication**: JWT-based with automatic token refresh and session persistence

### Backend Architecture
- **Framework**: Fastify 5.4.0 with TypeScript
- **Architecture Pattern**: Domain-Driven Design (DDD) with clear layer separation
- **Dependency Injection**: TSyringe for service management
- **Database ORM**: Prisma with SQLite
- **API Design**: RESTful endpoints with Zod validation
- **File Processing**: Multipart upload handling with music-metadata for audio analysis

### Layer Structure
The backend follows strict DDD principles:
- **Domain Layer**: Pure business logic, entities, and repository interfaces
- **Application Layer**: Use cases and service orchestration
- **Infrastructure Layer**: Database implementations, external APIs, file storage
- **Presentation Layer**: API controllers and route handlers

### Data Storage
- **Primary Database**: SQLite with Prisma ORM
- **File Storage**: Local filesystem with Docker volume mounting
- **Session Management**: JWT tokens with refresh capability
- **Anonymous Sessions**: Session-based tracking for non-authenticated users

### Authentication & Authorization
- **User Types**: Anonymous (session-based), Free Tier, Pro Tier, Business Tier
- **Rate Limiting**: Per-minute request limits based on user tier
- **Session Handling**: Dual approach supporting both authenticated and anonymous workflows
- **Middleware Protection**: Route-based access control with automatic redirects

### AI Processing Pipeline
- **Transcription Models**: GPT-4o Transcribe and Google Gemini 2.0 Flash with user selection
- **Summarization**: Multi-model support via OpenRouter and direct OpenAI API
- **Template System**: Pre-built prompts for meetings, technical docs, and podcasts
- **Context Injection**: Entity-aware transcription with custom vocabulary
- **Prompt Management**: YAML-based prompt system with variable interpolation

### Knowledge Management System
- **Projects**: Organizational containers for voice notes with entity associations
- **Entities**: Domain-specific terms categorized by type (person, company, technical, product)
- **Context Awareness**: Automatic injection of relevant entities into transcription prompts
- **Usage Tracking**: Monitor which entities were utilized in transcriptions

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o transcription model and fallback summarization
- **Google Gemini API**: Gemini 2.0 Flash for cost-effective transcription with large context windows
- **OpenRouter**: Primary route for Gemini models and other LLM providers

### Development Tools
- **Docker**: Containerization with multi-service orchestration
- **Prisma**: Database schema management and type-safe queries
- **MCP (Model Context Protocol)**: Integration with Claude Code CLI for development workflow
- **Testing Infrastructure**: Custom MCP-based testing with Playwright for E2E scenarios

### Third-Party Libraries
- **Audio Processing**: music-metadata for file analysis and validation
- **File Handling**: multer-style multipart processing via Fastify
- **Validation**: Zod for runtime type checking and API validation
- **Authentication**: bcrypt for password hashing, jsonwebtoken for session management
- **Configuration**: js-yaml for external prompt management with hot-reload capability

### Infrastructure Requirements
- **Container Runtime**: Docker and Docker Compose for local development
- **Node.js**: Version 20+ for both frontend and backend services
- **Database**: SQLite (embedded, no external database server required)
- **Reverse Proxy**: Built-in Next.js rewrites for API routing in production