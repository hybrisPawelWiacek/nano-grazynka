# Changelog

## [2025-08-11] - Major Fixes and Gemini Integration

### 🐛 Bug Fixes

#### Frontend Issues
- **Fixed userId requirement error** - Added hardcoded 'default-user' for MVP phase
  - Location: `frontend/lib/api/voiceNotes.ts`
  - TODO: Replace with actual user authentication in future

- **Fixed 404 route error** - Corrected redirect path from `/notes/[id]` to `/note/[id]`
  - Location: `frontend/app/page.tsx`
  - Ensures proper navigation after upload

- **Fixed missing transcription/summary display** - Resolved data structure mismatch
  - Changed from plural arrays (`transcriptions`, `summaries`) to singular objects
  - Location: `frontend/app/note/[id]/page.tsx`
  - Updated TypeScript types to support both patterns

#### Backend Issues
- **Fixed OpenAI API errors**
  - Corrected model name from 'gpt-5-mini' to 'gpt-4o-mini'
  - Changed parameter from 'max_tokens' to 'max_completion_tokens' for gpt-4o-mini
  - Location: `backend/src/infrastructure/external/LLMAdapter.ts`

- **Fixed API response structure**
  - Added query parameters support (`includeTranscription`, `includeSummary`)
  - Location: `frontend/lib/api/voiceNotes.ts`

### ✨ New Features

#### Gemini Model Integration via OpenRouter
- **Added support for Google Gemini models**
  - Primary model: Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)
  - Alternative: Gemini 2.5 Pro (`google/gemini-2.5-pro-exp-03-25`)
  - Location: `backend/src/infrastructure/external/LLMAdapter.ts`

- **Intelligent API routing**
  - Automatically detects OpenRouter configuration
  - Falls back to OpenAI if OpenRouter not available
  - Uses mock data if neither API is configured

- **Cost optimization**
  - Gemini 2.0 Flash: ~$0.0002/1K tokens (80% cheaper than GPT-4o-mini output)
  - Maintains quality while reducing operational costs

### 📚 Documentation

- Created `docs/development/GEMINI_SETUP.md` - Complete Gemini integration guide
- Created `backend/.env.example` - Environment variable template
- Updated `docker-compose.yml` - Added OpenRouter API key support

### 🏗️ Technical Debt (MVP Simplifications)

1. **Hardcoded userId** - Temporary solution until user authentication is implemented
2. **Mock data fallbacks** - Ensures system works without API keys during development
3. **Single-user design** - No multi-tenancy in MVP phase

### 🔧 Configuration Changes

- Added `OPENROUTER_API_KEY` environment variable support
- Updated Docker configuration for API key passthrough
- Maintained backward compatibility with OpenAI API

## [2025-08-09] - Initial Release

### Features
- Voice note upload (English/Polish)
- Automatic transcription via Whisper API
- AI-powered summarization with key points and action items
- Domain-Driven Design architecture
- Docker Compose deployment
- SQLite database with Prisma ORM