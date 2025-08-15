# nano-Grazynka 🎙️
**Last Updated**: August 15, 2025
**Version**: 2.0

A voice note transcription and summarization utility that processes audio files in English and Polish, generating intelligent summaries with key points and action items.

## ✨ Features

- **Voice Note Upload** - Drag-and-drop or click to upload audio files
- **Multi-language Support** - English and Polish transcription
- **Multi-Model Transcription** - Choose between:
  - GPT-4o-transcribe: Fast processing, 224 token prompts ($0.006/min)
  - Gemini 2.0 Flash: Context-aware, 1M token prompts ($0.0015/min - 75% cheaper)
- **AI-Generated Titles** - Smart naming from transcription content
- **Duration Display** - Audio duration instead of file size
- **AI Summarization** - Automatic summary generation with:
  - Brief overview (2-3 sentences)
  - Key points extraction
  - Action items identification
- **Custom Prompt Regeneration** - Regenerate summaries with your own instructions
- **Template System** - Pre-built prompts for meetings, technical docs, podcasts
- **Export Options** - Download as Markdown or JSON
- **Clean Architecture** - Domain-Driven Design with clear boundaries
- **Docker Ready** - Single command deployment

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenRouter API key (for Gemini) OR OpenAI API key

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd nano-grazynka
```

2. **Configure API keys**
```bash
# Create .env file in project root
echo "OPENROUTER_API_KEY=sk-or-v1-your-key-here" > .env
# OR use OpenAI
echo "OPENAI_API_KEY=sk-your-openai-key-here" > .env
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
│   └── lib/          # Utilities & types
├── backend/          # Node.js + Fastify
│   ├── domain/       # Business logic
│   ├── application/  # Use cases
│   ├── infrastructure/ # External services
│   └── presentation/ # API layer
└── docs/            # Documentation
```

## 🤖 AI Models

### Transcription Models
#### GPT-4o-transcribe (OpenAI)
- Fast, reliable transcription
- 224 token prompt limit
- $0.006/minute audio
- Best for: Quick transcriptions with brief context

#### Gemini 2.0 Flash (OpenRouter)
- Context-aware transcription
- 1M token prompt capacity
- $0.0015/minute audio (75% cheaper)
- Best for: Detailed prompts, templates, extensive context

### Summarization Model
#### Gemini 2.5 Flash (OpenRouter)
- Cost-effective: ~$0.0002/1K tokens
- Fast response times
- Get API key: https://openrouter.ai/keys

## 📖 Documentation

- [Project Status](./PROJECT_STATUS.md) - Current state and roadmap
- [Architecture](./docs/architecture/ARCHITECTURE.md) - System design
- [API Contract](./docs/api/api-contract.md) - API endpoints
- [Development Guide](./docs/development/DEVELOPMENT.md) - Local setup
- [AI Models Setup](./docs/development/AI_MODELS_SETUP.md) - AI configuration
- [UI/UX Design](./docs/design/UI_UX_DESIGN.md) - Design system & guidelines

## 🚀 Recent Updates (August 15, 2025)

- ✅ AI-generated titles and descriptions
- ✅ Audio duration display (replaces file size)
- ✅ Custom prompt regeneration fixes
- ✅ Production stability improvements
- ✅ Fixed intermittent library loading errors
- ✅ Fixed anonymous session authentication

## 🏷️ MVP Limitations

This is an MVP with the following features:
- Multi-user support with JWT authentication
- Anonymous usage (5 free transcriptions)
- SQLite database (suitable for MVP)
- Basic error handling
- No rate limiting

## 🛠️ Development

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
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
cd backend
npm test
```

### Database Management
```bash
cd backend
npx prisma studio  # GUI for database
```

## 📝 Usage

1. **Upload** - Drag and drop audio file or click to browse
2. **Process** - Automatic transcription and summarization
3. **View** - See transcription, summary, key points, and action items
4. **Export** - Download as Markdown or JSON

## 🤝 Contributing

This is an MVP project. For production use, consider:
- Switching to PostgreSQL
- Implementing rate limiting
- Adding monitoring and logging
- Setting up CI/CD pipeline

## 📄 License

Private project - not for public distribution

## 🙏 Acknowledgments

- Built with Domain-Driven Design principles
- Powered by OpenAI Whisper and Google Gemini
- Deployed with Docker Compose

---

**Status**: ✅ MVP Complete with Multi-Model Transcription  
**Version**: 2.0.0  
**Last Updated**: August 13, 2025