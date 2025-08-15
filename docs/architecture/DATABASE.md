# Database Schema Documentation
**Last Updated**: August 15, 2025
**Version**: 2.0

## Overview

nano-Grazynka uses SQLite as its database engine with Prisma ORM for type-safe database access. The schema follows Domain-Driven Design principles with clear aggregate boundaries and relationships.

## Database Configuration

- **Engine**: SQLite 3
- **Location**: `/data/nano-grazynka.db` (Docker volume)
- **ORM**: Prisma 5.x
- **Migration Strategy**: Prisma Migrate

## Entity Relationship Diagram

```
┌─────────────────┐      ┌─────────────────┐
│      User       │      │AnonymousSession │
│─────────────────│      │─────────────────│
│ id (PK)         │      │ id (PK)         │
│ email           │      │ sessionId       │
│ passwordHash    │      │ usageCount      │
│ tier            │      │ createdAt       │
│ credits         │      │ updatedAt       │
│ createdAt       │      └─────────────────┘
│ updatedAt       │
└────────┬────────┘
         │ 1:n
    ┌────┴───────────────┐
    │                    │
┌───▼────────┐    ┌─────▼────┐
│  Session   │    │ UsageLog │
│────────────│    │──────────│
│ id (PK)    │    │ id (PK)  │
│ userId     │    │ userId   │
│ token      │    │ action   │
│ expiresAt  │    │ credits  │
│ createdAt  │    │ metadata │
└────────────┘    │ createdAt│
                  └──────────┘
                        
┌─────────────────┐
│   VoiceNote     │
│─────────────────│
│ id (PK)         │
│ title           │
│ status          │
│ filePath        │
│ fileSize        │
│ duration        │
│ language        │
│ userId?         │◄── Optional (anonymous support)
│ sessionId?      │◄── For anonymous users
│ tags[]          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:n
    ┌────┴────┬──────────┐
    │         │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐
│Trans- │ │Summ- │ │ Event   │
│cript  │ │ary   │ │         │
└───────┘ └──────┘ └─────────┘
```

## Tables

### User

Core user entity for authentication and authorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| email | String | UNIQUE, NOT NULL | User email address |
| passwordHash | String | NOT NULL | Bcrypt hashed password |
| tier | String | DEFAULT 'free' | User tier (free/pro/business) |
| credits | Int | DEFAULT 5 | Monthly transcription credits |
| createdAt | DateTime | NOT NULL | Account creation timestamp |
| updatedAt | DateTime | NOT NULL | Last update timestamp |

**Indexes:**
- Unique constraint on (email)
- `idx_user_tier` on (tier)

**Relations:**
- Has many Sessions (1:n)
- Has many UsageLogs (1:n)
- Has many VoiceNotes (1:n)

### Session

JWT session management for authenticated users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| userId | String | FK, NOT NULL | Reference to User |
| token | String | UNIQUE, NOT NULL | JWT token |
| expiresAt | DateTime | NOT NULL | Token expiration time |
| createdAt | DateTime | NOT NULL | Session creation timestamp |

**Indexes:**
- Unique constraint on (token)
- `idx_session_userid` on (userId)
- `idx_session_expires` on (expiresAt)

**Relations:**
- Belongs to User

### UsageLog

Tracks user actions for billing and analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| userId | String | FK, NOT NULL | Reference to User |
| action | String | NOT NULL | Action type (transcription/summary) |
| credits | Int | DEFAULT 1 | Credits consumed |
| metadata | String | JSON | Additional data |
| createdAt | DateTime | NOT NULL | Action timestamp |

**Indexes:**
- `idx_usagelog_userid` on (userId)
- `idx_usagelog_created` on (createdAt)

**Relations:**
- Belongs to User

### AnonymousSession

Tracks usage for non-authenticated users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| sessionId | String | UNIQUE, NOT NULL | Browser session ID |
| usageCount | Int | DEFAULT 0 | Number of transcriptions |
| createdAt | DateTime | NOT NULL | Session creation timestamp |
| updatedAt | DateTime | NOT NULL | Last activity timestamp |

**Indexes:**
- Unique constraint on (sessionId)

### VoiceNote

Primary entity representing an uploaded audio file with multi-model transcription support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| userId | String? | NULL | User identifier (optional for anonymous) |
| sessionId | String? | NULL | Session ID for anonymous users |
| title | String | NOT NULL | User-provided or extracted title |
| originalFilePath | String | NOT NULL | Path to uploaded audio file |
| fileSize | Int | NOT NULL | File size in bytes |
| mimeType | String | NOT NULL | MIME type of the file |
| language | String | NOT NULL | Detected language (EN/PL) |
| status | String | NOT NULL | Processing status enum |
| tags | String | JSON Array | Categorization tags |
| errorMessage | String? | NULL | Error message if processing failed |
| transcriptionModel | String? | NULL | Model used: 'gpt-4o-transcribe' or 'google/gemini-2.0-flash-001' |
| whisperPrompt | String? | NULL | Hints for GPT-4o transcription (224 tokens max) |
| geminiSystemPrompt | String? | NULL | System instructions for Gemini transcription |
| geminiUserPrompt | String? | NULL | Context/template for Gemini (1M tokens max) |
| createdAt | DateTime | NOT NULL | Creation timestamp |
| updatedAt | DateTime | NOT NULL | Last update timestamp |
| version | Int | DEFAULT 1 | Version number for tracking |
| aiGeneratedTitle | String? | NULL | AI-generated title from transcript |
| briefDescription | String? | NULL | AI-generated brief description |
| derivedDate | DateTime? | NULL | Date extracted from transcript content |
| duration | Int? | NULL | Audio duration in milliseconds |

**Indexes:**
- `idx_voicenote_userid` on (userId) - for authenticated users
- `idx_voicenote_sessionid` on (sessionId) - for anonymous users
- `idx_voicenote_status` on (status)
- `idx_voicenote_created` on (createdAt)

**Relations:**
- Has many Transcriptions (1:n)
- Has many Summaries (1:n)

### Transcription

Stores transcribed text from audio processing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| voiceNoteId | String | FK, UNIQUE | Reference to VoiceNote |
| text | String | NOT NULL | Transcribed text |
| language | String | NOT NULL | Language of transcription |
| duration | Float | NOT NULL | Audio duration in seconds |
| confidence | Float | DEFAULT 0.0 | Transcription confidence score |
| wordCount | Int | DEFAULT 0 | Number of words in transcription |
| timestamp | DateTime | NOT NULL | Processing timestamp |

**Indexes:**
- Unique constraint on (voiceNoteId)

**Relations:**
- Belongs to VoiceNote
- Has many Summaries (1:n)

### Summary

Stores generated summaries with extracted information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| transcriptionId | String | FK | Reference to Transcription |
| summary | String | NOT NULL | Executive summary text |
| keyPoints | String | JSON Array | Extracted key points |
| actionItems | String | JSON Array | Extracted action items |
| language | String | NOT NULL | Summary language |
| model | String | DEFAULT | AI model used |
| version | Int | DEFAULT 1 | Version for reprocessing |
| timestamp | DateTime | NOT NULL | Generation timestamp |

**Indexes:**
- `idx_summary_transcription` on (transcriptionId)

**Relations:**
- Belongs to Transcription

### Event

Stores domain events for audit and event sourcing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| aggregateId | String | NOT NULL | Related entity ID |
| eventType | String | NOT NULL | Event type name |
| eventData | String | JSON | Event payload |
| occurredAt | DateTime | NOT NULL | Event timestamp |

**Indexes:**
- `idx_event_aggregate` on (aggregateId)
- `idx_event_type` on (eventType)
- `idx_event_occurred` on (occurredAt)

## Data Types & Conventions

### Primary Keys
- **Type**: CUID (Collision-resistant Unique Identifier)
- **Format**: String, ~25 characters
- **Generation**: Prisma default CUID function
- **Rationale**: Better than UUID for SQLite indexing

### Timestamps
- **Type**: DateTime (ISO 8601)
- **Timezone**: UTC
- **Auto-update**: updatedAt via Prisma

### JSON Fields
SQLite doesn't have native JSON support, so arrays are stored as JSON strings:
- `tags`: `["project-a", "meeting", "urgent"]`
- `keyPoints`: `["Point 1", "Point 2"]`
- `actionItems`: `["Task 1", "Task 2"]`

### Enumerations

#### ProcessingStatus
```typescript
type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
```

#### Language
```typescript
type Language = 'EN' | 'PL'
```

## Relationships

### VoiceNote → Transcription (1:n in model, 1:1 in practice)
- Model supports multiple Transcriptions per VoiceNote
- UNIQUE constraint on voiceNoteId enforces 1:1 in practice
- Cascade delete: Deleting VoiceNote deletes all Transcriptions

### VoiceNote → Summary (1:n in model, 1:1 in practice)
- Model supports multiple Summaries per VoiceNote (for versions)
- UNIQUE constraint on voiceNoteId enforces 1:1 in practice
- Cascade delete: Deleting VoiceNote deletes all Summaries

### Transcription → Summary (1:n)
- One Transcription can have multiple Summaries
- Each Summary must reference both VoiceNote and Transcription
- Cascade delete on both relationships

### VoiceNote → Event (1:n)
- One VoiceNote generates multiple Events
- Events track state changes and processing steps
- Used for audit trail and debugging

## Cascade Rules

### On Delete
- **VoiceNote deletion**:
  - Cascades to Transcriptions
  - Cascades to Summaries (via Transcription)
  - Preserves Events (for audit)

### On Update
- No cascade updates (IDs are immutable)

## Migration Management

### Prisma Commands
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# View database
npx prisma studio
```

### Migration Files
Located in `/backend/prisma/migrations/`

Recent migrations:
- `20250813065752_add_multi_model_transcription` - Added multi-model transcription fields:
  - `transcriptionModel`: Support for GPT-4o vs Gemini 2.0 Flash
  - `whisperPrompt`: Hints for GPT-4o transcription (224 token limit)
  - `geminiSystemPrompt`: System instructions for Gemini
  - `geminiUserPrompt`: Context/templates for Gemini (1M token capacity)
- `20250814_add_ai_generated_fields` - Added AI-generated metadata:
  - `aiGeneratedTitle`: AI-generated title from transcript analysis
  - `briefDescription`: Short description for better context
  - `derivedDate`: Date extracted from transcript content
- `20250814_add_duration` - Added duration field for audio playback:
  - `duration`: Audio duration in milliseconds for UI display

### Schema Location
`/backend/prisma/schema.prisma`

## Performance Considerations

### Indexes
Strategic indexes for common queries:
1. **userId**: Filter by user (future multi-user)
2. **status**: Find pending/processing notes
3. **createdAt**: Sort by recency
4. **aggregateId**: Event lookups
5. **transcriptionId**: Summary lookups

### Query Optimization
- Use `select` to limit returned fields
- Use `include` sparingly (avoid N+1)
- Batch operations where possible
- Use transactions for consistency

### Size Limitations
- **SQLite database**: 281TB theoretical max
- **Text fields**: 1GB max per field
- **Practical limit**: ~100GB for good performance
- **Concurrent writes**: Limited (SQLite limitation)

### SQLite Performance Configuration

#### WAL Mode (Write-Ahead Logging)
Enabled for better concurrent access:
```sql
PRAGMA journal_mode = WAL;
```
- Allows readers and writers to work concurrently
- Improves write performance by 2-3x
- Reduces database locking issues
- Automatically managed by Prisma on connection

#### Synchronous Mode
Set to NORMAL for balanced performance:
```sql
PRAGMA synchronous = NORMAL;
```
- Good balance between safety and performance
- Prevents data loss in most scenarios
- Significantly faster than FULL mode

#### Benefits of Optimizations
- **Write Performance**: 2-3x faster operations
- **Concurrency**: Better handling of simultaneous reads/writes
- **Lock Reduction**: Fewer "database is locked" errors
- **Data Integrity**: Maintained with acceptable performance

## Data Integrity

### Constraints
- Foreign key constraints enabled
- NOT NULL on required fields
- UNIQUE on natural keys
- CHECK constraints via application

### Validation
- Domain layer validates before persistence
- Prisma schema validates at ORM level
- Database constraints as final guard

## Backup & Recovery

### Backup Strategy
```bash
# Backup database
sqlite3 /data/nano-grazynka.db ".backup /backup/backup.db"

# Export as SQL
sqlite3 /data/nano-grazynka.db .dump > backup.sql
```

### Recovery
```bash
# Restore from backup
cp /backup/backup.db /data/nano-grazynka.db

# Restore from SQL
sqlite3 /data/nano-grazynka.db < backup.sql
```

## Common Queries

### Get VoiceNote with Relations
```typescript
prisma.voiceNote.findUnique({
  where: { id },
  include: {
    transcriptions: true,
    summaries: {
      orderBy: { version: 'desc' },
      take: 1
    }
  }
})
```

### Find Pending VoiceNotes
```typescript
prisma.voiceNote.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'asc' }
})
```

### Get Latest Summary
```typescript
prisma.summary.findFirst({
  where: { transcriptionId },
  orderBy: { version: 'desc' }
})
```

## Future Considerations

### Multi-tenancy
- Add `organizationId` to VoiceNote
- Row-level security via Prisma middleware
- Separate databases per tenant (alternative)

### PostgreSQL Migration
When scaling beyond SQLite:
1. Export data as SQL
2. Update Prisma schema provider
3. Run migrations on PostgreSQL
4. Import data with transformations

### Audit Trail
- Event table ready for event sourcing
- Consider separate audit database
- Implement event replay capability

### Search Optimization
- Full-text search on transcriptions
- Consider PostgreSQL tsvector
- Alternative: Elasticsearch integration

## Troubleshooting

### Common Issues

#### Foreign Key Constraint Violation
- Ensure Transcription exists before creating Summary
- Check cascade delete configuration

#### JSON Parsing Errors
- Validate JSON strings before storage
- Handle empty arrays: `JSON.parse(field || '[]')`

#### Migration Failures
- Check for data conflicts
- Use `prisma migrate reset` in development
- Manual intervention for production

### Database Inspection
```bash
# Open SQLite CLI
sqlite3 /data/nano-grazynka.db

# Show tables
.tables

# Describe table
.schema VoiceNote

# Count records
SELECT COUNT(*) FROM VoiceNote;

# Check indexes
.indexes VoiceNote
```

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
- [api-contract.md](./api-contract.md) - API specifications