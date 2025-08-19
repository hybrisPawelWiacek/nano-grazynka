# nano-Grazynka 🎙️
**Last Updated**: August 19, 2025
**Version**: 3.0

A voice note transcription and summarization platform with knowledge management, supporting English and Polish with intelligent AI-powered summaries, key points extraction, and domain-specific entity recognition.

## ✨ Key Features

### Core Capabilities
- **Voice Note Upload** - Drag-and-drop or click to upload audio files
- **Multi-language Support** - English and Polish transcription with auto-detection
- **Multi-Model Transcription** - Choose between:
  - GPT-4o-transcribe: Fast processing, 224 token prompts ($0.006/min)
  - Gemini 2.0 Flash: Context-aware, 1M token prompts ($0.0015/min - 75% cheaper)
- **AI Summarization** - Automatic summary generation with key points and action items
- **Custom Prompt Regeneration** - Regenerate summaries with your own instructions
- **Template System** - Pre-built prompts for meetings, technical docs, podcasts
- **Export Options** - Download as Markdown or JSON

### User Tiers & Access
- **Anonymous Users** - 5 free transcriptions, no signup required, session persistence
- **Free Tier (Logged In)** - 5 monthly credits, project/entity management
- **Pro Tier** - 50 monthly credits, 60 requests/min rate limit
- **Business Tier** - 200 monthly credits, 120 requests/min rate limit

### Knowledge Management (Entity-Project System)
- **Projects** - Organize voice notes by context or topic
- **Entities** - Define domain-specific terms, names, and acronyms
- **Context Injection** - Improve transcription accuracy with custom vocabulary
- **Bulk Operations** - Manage multiple entities across projects
- **Usage Tracking** - Monitor which entities were used in transcriptions

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- API Keys (see configuration below)

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd nano-grazynka_CC
```

2. **Configure API keys**
```bash
# Create .env file in project root
touch .env

# Add required keys (choose your transcription provider):

# Option A: For GPT-4o transcription
echo "OPENAI_API_KEY=sk-your-openai-key-here" >> .env

# Option B: For Gemini 2.0 Flash transcription (direct API)
echo "GEMINI_API_KEY=AIza-your-gemini-key-here" >> .env

# Required for summarization (all users)
echo "OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key" >> .env

# Optional
echo "JWT_SECRET=your-secret-key" >> .env  # Auto-generated if not provided
```

3. **Start the application**
```bash
docker compose up --build
```

4. **Access the app**
- Frontend: http://localhost:3100
- Backend API: http://localhost:3101

## 🏗️ Architecture

```
nano-grazynka/
├── frontend/          # Next.js 15 + TypeScript
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   └── lib/          # Utilities & API client
├── backend/          # Node.js + Fastify
│   ├── domain/       # Business logic & entities
│   ├── application/  # Use cases & orchestration
│   ├── infrastructure/ # External services & DB
│   └── presentation/ # API layer & middleware
├── data/            # SQLite database & uploads
└── docs/            # Documentation
```

### Database Schema
- **Users** - Authentication and tier management
- **VoiceNotes** - Audio file metadata and processing status
- **Transcriptions** - Transcribed text with confidence scores
- **Summaries** - AI-generated summaries and key points
- **Projects** - User-defined project contexts
- **Entities** - Domain-specific vocabulary
- **ProjectEntities** - Many-to-many entity-project associations
- **EntityUsage** - Tracking entity usage in transcriptions
- **AnonymousSessions** - Temporary session management

## 🤖 AI Models Configuration

### Transcription Models

#### GPT-4o-transcribe (OpenAI)
- **Requirements**: `OPENAI_API_KEY`
- **Cost**: $0.006/minute audio
- **Prompt Limit**: 224 tokens
- **Best for**: Quick transcriptions with brief context

#### Gemini 2.0 Flash (Google Direct API)
- **Requirements**: `GEMINI_API_KEY`
- **Cost**: $0.0015/minute audio (75% cheaper)
- **Prompt Capacity**: 1M tokens
- **Best for**: Detailed prompts, templates, extensive context

### Summarization Model

#### Gemini 2.5 Flash (OpenRouter)
- **Requirements**: `OPENROUTER_API_KEY`
- **Cost**: ~$0.0002/1K tokens
- **Get API key**: https://openrouter.ai/keys

## 📖 Documentation

- [Project Status](./PROJECT_STATUS.md) - Current implementation state
- [Architecture](./docs/architecture/ARCHITECTURE.md) - System design
- [Database Schema](./docs/architecture/DATABASE.md) - Data models
- [API Contract](./docs/api/api-contract.md) - API endpoints
- [Development Guide](./docs/development/DEVELOPMENT.md) - Local setup
- [Test Plan](./imp_docs/testing/TEST_PLAN.md) - Test strategy & scenarios

## 🚀 Recent Updates (Version 3.0 - August 2025)

### Major Features
- ✅ **Entity-Project System** - Knowledge management for improved transcription accuracy
- ✅ **Multi-tier User System** - Anonymous, Free, Pro, and Business tiers
- ✅ **Direct Gemini API Integration** - Native Gemini 2.0 Flash support
- ✅ **YAML Prompt Configuration** - Externalized prompts for easy customization
- ✅ **Anonymous-to-User Migration** - Seamless transition preserving work

### Improvements
- ✅ Test infrastructure restoration (100% pass rate)
- ✅ Rate limiting by user tier
- ✅ Session persistence for anonymous users
- ✅ AI-generated titles and descriptions
- ✅ Audio duration display
- ✅ Custom prompt regeneration
- ✅ Template system for common scenarios

### Known Limitations
- Entity-Project UI is partially complete (backend 100%, frontend 40%)
- Some advanced entity management features pending
- Project classification automation not yet implemented

## 🏷️ Features by User Tier

### Anonymous Users (No Signup)
- 5 free transcriptions
- Session persistence across browser visits
- Full transcription and summarization features
- Export to Markdown/JSON
- Seamless upgrade path to registered account

### Free Tier (Registered)
- 5 monthly credits (resets 1st of month)
- 10 requests/minute rate limit
- Create and manage projects
- Define custom entities
- Basic usage tracking

### Pro Tier ($9.99/month)
- 50 monthly credits
- 60 requests/minute rate limit
- Priority processing
- Advanced entity management
- Bulk operations

### Business Tier ($29.99/month)
- 200 monthly credits
- 120 requests/minute rate limit
- Fastest processing
- Full feature access
- Priority support

## 🛠️ Development

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate dev
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Run all MCP-based tests
cd tests/scripts
node run-all-mcp-tests.js

# Run specific test suite
node test-anonymous-upload.js
node test-entity-project-api.js
```

### Database Management
```bash
cd backend
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma studio
```

## 📝 Usage Guide

### Basic Workflow
1. **Upload** - Drag and drop audio file or click to browse
2. **Configure** - Select transcription model and add optional context
3. **Process** - Automatic transcription and summarization
4. **Review** - View transcription, summary, key points, and action items
5. **Export** - Download as Markdown or JSON

### Using Entity-Project System (Logged-in Users)
1. **Create Project** - Define a context (e.g., "Q3 Planning", "Product Reviews")
2. **Add Entities** - Define important terms, names, acronyms
3. **Link Entities** - Associate entities with projects
4. **Select Project** - Choose active project before transcription
5. **Enhanced Accuracy** - Entities improve transcription of domain-specific terms

## 🔐 Security

- JWT authentication with httpOnly cookies
- bcrypt password hashing (10 salt rounds)
- Rate limiting by user tier
- CORS properly configured
- Session management with automatic cleanup
- Input validation and sanitization

## 🤝 Contributing

This is a production-ready MVP. For enhancements, consider:
- Completing Entity-Project UI components
- Adding project templates
- Implementing email notifications
- Adding collaborative features
- Extending language support

## 📄 License

Private project - not for public distribution

## 🙏 Acknowledgments

- Built with Domain-Driven Design principles
- Powered by OpenAI GPT-4o and Google Gemini
- Deployed with Docker Compose
- Testing via Playwright MCP server

---

**Status**: ✅ MVP Complete with Entity-Project System (Backend Complete, Frontend Partial)
**Version**: 3.0.0  
**Last Updated**: August 19, 2025