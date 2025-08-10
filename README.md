# nano-Grazynka

Voice note transcription and summarization utility with English/Polish support.

## Features

- 🎙️ Audio file upload (MP3, WAV, M4A, OGG, WebM, MP4)
- 🔤 Automatic transcription using Whisper AI
- 📝 Smart summarization with key points and action items
- 🌍 English and Polish language support
- 🔄 Reprocessing with custom prompts
- 📂 Export to Markdown or JSON
- 🔍 Search and filter capabilities

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key or OpenRouter API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nano-grazynka_CC
   ```

2. **Configure API keys**
   ```bash
   cp .env.example .env
   # Edit .env and add your API key:
   # OPENAI_API_KEY=sk-your-key-here
   # or
   # OPENROUTER_API_KEY=sk-your-key-here
   ```

3. **Start the application**
   ```bash
   ./start.sh
   ```
   
   Or manually:
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3100
   - Backend API: http://localhost:3101

## Usage

1. **Upload a voice note**
   - Navigate to http://localhost:3100
   - Drag and drop or click to upload an audio file
   - The file will be automatically processed

2. **View your library**
   - Click "Library" to see all voice notes
   - Use search and filters to find specific notes
   - Click on a note to view details

3. **Export notes**
   - From the detail page, export to Markdown or JSON
   - Use exported files for documentation or further processing

4. **Reprocess with custom prompts**
   - Click "Reprocess" on the detail page
   - Enter a custom prompt for different summarization
   - View version history of summaries

## Configuration

Edit `config.yaml` for application settings:

```yaml
transcription:
  provider: openai
  model: whisper-1
  
summarization:
  provider: openai
  model: gpt-4-turbo-preview
  
storage:
  uploadDir: /data/uploads
  maxFileAgeDays: 30
```

## Development

### Project Structure
```
├── frontend/          # Next.js frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── lib/          # API client and utilities
├── backend/          # Node.js/Fastify backend
│   ├── domain/       # Business logic (DDD)
│   ├── application/  # Use cases
│   ├── infrastructure/ # External services
│   └── presentation/ # API layer
├── data/            # SQLite database and uploads
└── config.yaml      # Application configuration
```

### Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after changes
docker compose build
docker compose up -d

# Run backend tests
docker compose exec backend npm test

# Database migrations
docker compose exec backend npm run prisma:migrate
```

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and has sufficient credits
- Check `.env` file has the correct format
- Restart services after changing environment variables

### Upload Failures
- Check file size (max 500MB)
- Verify file format is supported
- Check `data/uploads` directory permissions

### Processing Errors
- View backend logs: `docker compose logs backend`
- Check API rate limits
- Verify network connectivity

## License

MIT