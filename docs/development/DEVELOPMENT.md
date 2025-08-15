# Development Guide
**Last Updated**: August 15, 2025
**Version**: 2.0

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)
- OpenAI or OpenRouter API key

### Initial Setup

1. **Clone and install**
```bash
git clone <repository-url>
cd nano-grazynka_CC
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=sk-xxx
# or OPENROUTER_API_KEY=sk-xxx
```

3. **Start with Docker**
```bash
docker compose up
```

4. **Access application**
- Frontend: http://localhost:3100
- Backend API: http://localhost:3101
- Health check: http://localhost:3101/health

## Development Workflow

### Local Development (without Docker)

#### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

#### Start services
```bash
docker compose up         # Foreground with logs
docker compose up -d      # Background mode
```

#### View logs
```bash
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs -f            # All logs
```

#### Restart services
```bash
docker compose restart backend    # Restart backend only
docker compose down && docker compose up  # Full restart
```

## Code Style & Conventions

### TypeScript Guidelines
```typescript
// ✅ Good: Clear, typed, functional
export const processVoiceNote = async (
  id: VoiceNoteId,
  options: ProcessingOptions
): Promise<Result<VoiceNote, ProcessingError>> => {
  // Implementation
}

// ❌ Bad: Unclear types, any usage
export async function process(id: any, opts: any) {
  // Implementation
}
```

### File Naming
- **Domain entities**: PascalCase (e.g., `VoiceNote.ts`)
- **Use cases**: PascalCase with suffix (e.g., `ProcessVoiceNoteUseCase.ts`)
- **Utilities**: camelCase (e.g., `validateFile.ts`)
- **Tests**: Same as source with `.test.ts` (e.g., `VoiceNote.test.ts`)

### Directory Structure
```
src/
├── domain/           # Pure business logic
├── application/      # Use cases
├── infrastructure/   # External integrations
└── presentation/     # API layer
```

### Git Commit Messages
```bash
# Format: <type>: <description>

feat: add voice note export functionality
fix: correct transcription language detection
refactor: simplify processing orchestrator
test: add unit tests for Summary entity
docs: update API documentation
```

## Testing Strategy

### Running Tests

#### All tests
```bash
npm test                  # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

#### Specific tests
```bash
npm test VoiceNote       # Test specific file
npm test -- --testPathPattern=domain  # Test directory
```

### Test Structure

**Updated Test Organization (2025-08-13)**:
```
tests/
├── e2e/                        # Playwright E2E tests
│   ├── multi-model-transcription.spec.js  # Model selection tests
│   └── two-pass-transcription.spec.js     # Two-pass flow tests
├── integration/                # API integration tests
├── python/                     # Python test scripts
├── scripts/                    # Active test utilities
│   ├── test-multi-model.js    # Multi-model transcription test
│   ├── test-multi-model-node.js
│   └── run-all-tests.sh       # Master test runner
├── debug-archive/              # Archived debug scripts (cleaned up)
└── test-data/                  # Test audio files
    └── zabka.m4a              # Primary test file
```

#### Unit Tests (Domain Layer)
```typescript
describe('VoiceNote', () => {
  describe('create', () => {
    it('should create a valid voice note', () => {
      // Arrange
      const title = 'Test Note';
      
      // Act
      const voiceNote = VoiceNote.create(title, /*...*/);
      
      // Assert
      expect(voiceNote.getTitle()).toBe(title);
    });
  });
});
```

#### Integration Tests (Infrastructure)
```typescript
describe('VoiceNoteRepository', () => {
  let repository: VoiceNoteRepository;
  
  beforeEach(() => {
    // Setup with mocked Prisma
  });
  
  it('should save and retrieve voice note', async () => {
    // Test database operations
  });
});
```

#### E2E Tests (Full Pipeline)
```python
# test_pipeline.py
def test_complete_processing():
    # Upload file
    response = upload_voice_note('test.m4a')
    assert response.status_code == 200
    
    # Trigger processing
    process_response = trigger_processing(response.json()['id'])
    assert process_response.status_code == 200
    
    # Verify completion
    status = check_status(response.json()['id'])
    assert status['status'] == 'completed'
```

### Test Coverage Goals
- Domain Layer: > 90%
- Application Layer: > 80%
- Infrastructure Layer: > 70%
- Overall: > 80%

## Debugging Tips

### Common Issues & Solutions

#### 1. Database Connection Issues
```bash
# Check database file exists
ls -la backend/prisma/dev.db

# Reset database
cd backend
npx prisma migrate reset

# View database content
npx prisma studio
```

#### 2. File Upload Failures
```typescript
// Check multipart configuration
fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024  // 50MB
  }
});

// Verify file path
console.log('Upload path:', process.env.STORAGE_PATH);
```

#### 3. Transcription Errors
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API directly
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@test.m4a" \
  -F model="whisper-1"
```

#### 4. Docker Issues
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up

# Check container status
docker ps -a

# Enter container
docker exec -it nano-grazynka-backend sh
```

### Logging & Tracing

#### Enable debug logging
```typescript
// backend/src/index.ts
const fastify = Fastify({
  logger: {
    level: 'debug',
    prettyPrint: true
  }
});
```

#### Add trace IDs
```typescript
// Every request gets a trace ID
fastify.addHook('onRequest', async (request) => {
  request.id = generateTraceId();
});
```

#### View logs
```bash
# Docker logs
docker compose logs -f backend | grep ERROR
docker compose logs -f --tail=100 backend

# Local logs
npm run dev 2>&1 | tee debug.log
```

## Database Management

### Prisma Commands

#### Schema management
```bash
# After schema changes
npx prisma generate        # Update client
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Apply in production
```

#### Database inspection
```bash
npx prisma studio          # GUI browser
npx prisma db pull         # Introspect database
npx prisma validate        # Validate schema
```

#### Reset and seed
```bash
npx prisma migrate reset   # Full reset
npx prisma db seed         # Run seed script
```

### Common Queries

#### Using Prisma Client
```typescript
// Get with relations
const voiceNote = await prisma.voiceNote.findUnique({
  where: { id },
  include: {
    transcriptions: true,
    summaries: true
  }
});

// Paginated search
const results = await prisma.voiceNote.findMany({
  where: {
    OR: [
      { title: { contains: query } },
      { tags: { has: query } }
    ]
  },
  skip: offset,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

## API Testing

### Using curl

#### Upload file
```bash
curl -X POST http://localhost:3101/api/voice-notes \
  -F "file=@test.m4a" \
  -F "title=Test Recording" \
  -F "language=EN"
```

#### Trigger processing
```bash
curl -X POST http://localhost:3101/api/voice-notes/{id}/process
```

#### Check status
```bash
curl http://localhost:3101/api/voice-notes/{id}
```

### Using HTTPie
```bash
# Install HTTPie
pip install httpie

# Upload
http -f POST :3101/api/voice-notes \
  file@test.m4a \
  title="Test Recording"

# Get status
http :3101/api/voice-notes/{id}
```

### Postman Collection
Import `postman_collection.json` for pre-configured requests.

## Performance Profiling

### Backend Profiling
```typescript
// Add timing middleware
fastify.addHook('onRequest', async (request) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  console.log(`${request.method} ${request.url}: ${duration}ms`);
});
```

### Database Query Analysis
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Log slow queries
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  if (duration > 100) {
    console.warn(`Slow query (${duration}ms):`, params);
  }
  
  return result;
});
```

## Environment Variables

### Required Variables
```bash
# API Keys (one required)
OPENAI_API_KEY=sk-xxx
OPENROUTER_API_KEY=sk-xxx

# Optional
LANGSMITH_API_KEY=xxx
OPENLLMETRY_API_KEY=xxx
```

### Configuration Files
- `.env` - Local overrides (git ignored)
- `.env.example` - Template with defaults
- `config.yaml` - Application configuration

### Docker Environment
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=development
  - DATABASE_URL=file:/data/nano-grazynka.db
  - STORAGE_PATH=/data/uploads
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

### Pre-commit Hooks
```bash
# Install husky
npm install -D husky
npx husky install

# Add hooks
npx husky add .husky/pre-commit "npm test"
npx husky add .husky/pre-commit "npm run lint"
```

## Deployment

### Production Build

#### Backend
```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

### Docker Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Health Monitoring
```bash
# Check health endpoint
curl http://localhost:3101/health

# Monitor with watch
watch -n 5 'curl -s http://localhost:3101/health | jq'
```

## Code Cleanup Guidelines (2025-08-13)

### Recent Cleanup Completed
- Removed 322 lines of duplicate/debug code from backend
- Consolidated repository implementations (kept `/infrastructure/persistence/`)
- Removed debug console.log statements
- Archived old test scripts to `tests/debug-archive/`
- Fixed duplicate file issues in infrastructure layer

### Cleanup Checklist
Before committing:
1. Remove all `console.log` debug statements
2. Check for duplicate implementations
3. Verify imports use correct paths
4. Clean test upload files: `rm data/uploads/*.m4a`
5. Archive temporary test scripts

### Common Cleanup Locations
```bash
# Find debug logs
grep -r "console.log" backend/src/ frontend/app/

# Find duplicate files
find . -name "*.ts" -o -name "*.js" | xargs basename | sort | uniq -d

# Clean test artifacts
./scripts/cleanup-test-data.sh
```

## Troubleshooting Checklist

### When things don't work:

1. **Check Docker status**
   ```bash
   docker compose ps
   docker compose logs --tail=50
   ```

2. **Verify API keys**
   ```bash
   grep API_KEY .env
   ```

3. **Check database**
   ```bash
   npx prisma studio
   ```

4. **Test endpoints**
   ```bash
   curl http://localhost:3101/health
   ```

5. **Clear and rebuild**
   ```bash
   docker compose down -v
   docker compose build --no-cache
   docker compose up
   ```

## Common Tasks

### Add new domain entity
1. Create entity in `/domain/entities/`
2. Add value objects in `/domain/value-objects/`
3. Define repository interface
4. Update Prisma schema
5. Generate migration
6. Implement repository
7. Create use cases
8. Add API routes
9. Write tests

### Add new API endpoint
1. Define route in `/presentation/routes/`
2. Create/update use case
3. Update API documentation
4. Add integration test
5. Update Postman collection

### Debug processing pipeline
1. Check upload succeeded
2. Verify file exists on disk
3. Check transcription API call
4. Verify database updates
5. Check event emissions
6. Review error logs

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DATABASE.md](./DATABASE.md) - Database schema
- [api-contract.md](./api-contract.md) - API specifications
- [integration-testing.md](./integration-testing.md) - Testing guide