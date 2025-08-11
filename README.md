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
   
   **Development:**
   ```bash
   docker compose up -d
   ```
   
   **Production (recommended):**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   
   # With monitoring stack (Prometheus + Grafana)
   docker compose -f docker-compose.prod.yml --profile monitoring up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3100
   - Backend API: http://localhost:3101
   - Health Check: http://localhost:3101/health
   - Metrics: http://localhost:3101/metrics
   - Prometheus (if enabled): http://localhost:9090
   - Grafana (if enabled): http://localhost:3000 (admin/admin)

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

## Production Deployment

### Environment Variables

Create a `.env` file with your API keys:

```env
# Required for transcription/summarization
OPENAI_API_KEY=sk-...

# Optional - Alternative LLM provider
OPENROUTER_API_KEY=sk-or-...

# Optional - LLM Observability
LANGSMITH_API_KEY=ls-...
OPENLLMETRY_API_KEY=otel-...
```

### Production Features

#### Health Monitoring
- **Health Check**: `http://localhost:3101/health` - Basic health status
- **Readiness Check**: `http://localhost:3101/ready` - Database connectivity check
- **Metrics**: `http://localhost:3101/metrics` - Prometheus-compatible metrics

#### LLM Observability

**LangSmith Integration** (when `LANGSMITH_API_KEY` is set):
- All LLM calls are traced automatically
- View traces at https://smith.langchain.com
- Project name: `nano-grazynka-prod`

**OpenLLMetry Integration** (when `OPENLLMETRY_API_KEY` is set):
- OpenTelemetry traces for all LLM operations
- Automatic latency and token usage tracking
- View at https://app.traceloop.com

#### Metrics Collection

The `/metrics` endpoint exposes:
```
nano_grazynka_up 1
nano_grazynka_uptime_seconds 3600
nano_grazynka_voice_notes_total 42
nano_grazynka_voice_notes_processing 2
nano_grazynka_voice_notes_completed 38
nano_grazynka_voice_notes_failed 2
```

### Production Commands

```bash
# Start production
docker compose -f docker-compose.prod.yml up -d

# With monitoring (Prometheus + Grafana)
docker compose -f docker-compose.prod.yml --profile monitoring up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Production Checklist

- [ ] Set `NODE_ENV=production` in docker-compose.prod.yml
- [ ] Configure API keys in `.env`
- [ ] Enable LangSmith for LLM tracing (optional)
- [ ] Enable OpenLLMetry for observability (optional)
- [ ] Test health endpoints are responding
- [ ] Verify metrics endpoint is working
- [ ] Set up monitoring alerts (optional)
- [ ] Configure log rotation

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

## Documentation

### 📚 Complete Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | AI collaboration guide & documentation map |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Implementation progress tracker |
| **Architecture** | |
| [System Design](./docs/architecture/ARCHITECTURE.md) | System design, DDD implementation, patterns |
| [Database Schema](./docs/architecture/DATABASE.md) | Database schema, relationships, queries |
| [Product Requirements](./docs/architecture/PRD.md) | Product requirements document |
| **Development** | |
| [Development Guide](./docs/development/DEVELOPMENT.md) | Development setup, debugging, testing |
| [MCP Best Practices](./docs/development/MCP_BEST_PRACTICES.md) | MCP server integration guide |
| **API & Testing** | |
| [API Contract](./docs/api/api-contract.md) | API specifications and endpoints |
| [Integration Testing](./docs/testing/integration-testing.md) | Docker testing and E2E guide |

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
├── docs/            # Technical documentation
├── data/            # SQLite database and uploads
└── config.yaml      # Application configuration
```

### Quick Commands

```bash
# Start development
docker compose up

# View logs
docker compose logs -f

# Run tests
docker compose exec backend npm test

# Database GUI
docker compose exec backend npx prisma studio

# Rebuild after changes
docker compose down
docker compose build --no-cache
docker compose up
```

For detailed development instructions, see [docs/development/DEVELOPMENT.md](./docs/development/DEVELOPMENT.md).

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

### Production Issues

#### Check Service Health
```bash
curl http://localhost:3101/health
curl http://localhost:3101/ready
curl http://localhost:3101/metrics
```

#### View LangSmith Traces
1. Go to https://smith.langchain.com
2. Select project: `nano-grazynka-prod`
3. View traces for debugging

#### Database Access
```bash
# Access database GUI
docker exec -it nano-grazynka_cc-backend-1 npx prisma studio

# Run migrations
docker exec -it nano-grazynka_cc-backend-1 npm run prisma:migrate
```

### Security Notes
- **Never commit** `.env` file to version control
- **Rotate API keys** regularly
- **Backup database** from `./data/` directory regularly
- Consider using **reverse proxy** (nginx/traefik) for production
- Enable **log rotation** to prevent disk fill

## License

MIT