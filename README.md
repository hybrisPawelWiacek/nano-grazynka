# nano-Grazynka 🎙️

A voice note transcription and summarization utility that processes audio files in English and Polish, generating intelligent summaries with key points and action items.

## ✨ Features

- **Voice Note Upload** - Drag-and-drop or click to upload audio files
- **Multi-language Support** - English and Polish transcription
- **AI Summarization** - Automatic summary generation with:
  - Brief overview (2-3 sentences)
  - Key points extraction
  - Action items identification
- **Multiple AI Models** - Supports Gemini (via OpenRouter) and GPT-4o-mini (via OpenAI)
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

### Primary: Gemini 2.0 Flash (via OpenRouter)
- Cost-effective: ~$0.0002/1K tokens
- Fast response times
- Get API key: https://openrouter.ai/keys

### Fallback: GPT-4o-mini (via OpenAI)
- Alternative when OpenRouter unavailable
- Get API key: https://platform.openai.com/api-keys

## 📖 Documentation

- [Project Status](./PROJECT_STATUS.md) - Current state and roadmap
- [Architecture](./docs/architecture/ARCHITECTURE.md) - System design
- [API Contract](./docs/api/api-contract.md) - API endpoints
- [Development Guide](./docs/development/DEVELOPMENT.md) - Local setup
- [Gemini Setup](./docs/development/GEMINI_SETUP.md) - AI configuration
- [Changelog](./CHANGELOG.md) - Version history

## 🐛 Recent Fixes (August 11, 2025)

- ✅ Fixed userId requirement error
- ✅ Fixed route navigation after upload
- ✅ Fixed transcription/summary display
- ✅ Added Gemini model support
- ✅ Improved error handling

## 🏷️ MVP Limitations

This is an MVP with intentional simplifications:
- Single-user design (hardcoded userId)
- SQLite database (not production-ready)
- No authentication system
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
- Adding user authentication
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

**Status**: ✅ MVP Complete and Functional  
**Version**: 1.0.0  
**Last Updated**: August 11, 2025