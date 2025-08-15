# API Contract Documentation
**Last Updated**: August 15, 2025
**Version**: 2.0

## Overview
This document serves as the single source of truth for the API contract between the frontend (Next.js) and backend (Fastify) services of the nano-Grazynka application. All API endpoints, request/response formats, and data types are defined here.

## Base Configuration

### API URLs
- **Development Frontend → Backend**: `http://localhost:3101`
- **Docker Internal**: `http://backend:3101`
- **Frontend Port**: `3100`
- **Backend Port**: `3101`

### Headers
All requests must include:
```
Content-Type: application/json (except file uploads)
Accept: application/json
```

File uploads use:
```
Content-Type: multipart/form-data
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Create a new user account.

**Request:**
```typescript
{
  email: string,      // Valid email address
  password: string,   // Minimum 8 characters
  tier?: "free" | "pro" | "business" // Default: "free"
}
```

**Response:**
```typescript
{
  user: {
    id: string,
    email: string,
    tier: string,
    credits: number
  }
}
```

**Errors:**
- 400: Invalid input or email already exists
- 500: Server error

#### POST /api/auth/login
Authenticate user and create session.

**Request:**
```typescript
{
  email: string,
  password: string
}
```

**Response:**
```typescript
{
  user: {
    id: string,
    email: string,
    tier: string,
    credits: number
  }
}
```

**Side Effect:** Sets httpOnly JWT cookie

**Errors:**
- 401: Invalid credentials
- 500: Server error

#### POST /api/auth/logout
Invalidate current session.

**Response:**
```typescript
{
  message: "Logged out successfully"
}
```

**Side Effect:** Clears JWT cookie

#### GET /api/auth/me
Get current authenticated user.

**Response:**
```typescript
{
  user: {
    id: string,
    email: string,
    tier: string,
    credits: number,
    createdAt: string
  }
}
```

**Errors:**
- 401: Not authenticated

### Anonymous Session Endpoints

#### GET /api/anonymous/usage
Check anonymous session usage count.

**Request Headers:**
```
X-Session-Id: string // From localStorage
```

**Response:**
```typescript
{
  sessionId: string,
  usageCount: number,
  remainingCredits: number,
  limit: number
}
```

#### POST /api/anonymous/migrate
Migrate anonymous session voice notes to a registered user account.
This endpoint transfers all voice notes from an anonymous session to a user account
in an atomic transaction. The anonymous session is deleted after successful migration.

**Authentication:** Not required (allows migration during auth flow)

**Request:**
```typescript
{
  sessionId: string,  // Anonymous session ID from localStorage
  userId: string      // Target user ID to migrate notes to
}
```

**Response:**
```typescript
{
  migrated: number,   // Number of notes successfully migrated
  message: string,    // Success message
  noteIds?: string[]  // Array of migrated note IDs (optional)
}
```

**Behavior:**
- Atomic transaction ensures all-or-nothing migration
- Updates user's creditsUsed count
- Deletes anonymous session after successful migration
- Creates audit log entry for compliance

**Errors:**
- 404: Session or user not found
- 500: Migration failed (transaction rolled back)

### 1. Health Check

#### GET /health
Check if the backend service is running.

**Response:**
```typescript
{
  status: "ok",
  timestamp: string, // ISO 8601
  database: "connected" | "disconnected",
  observability: {
    langSmith: boolean,
    openLLMetry: boolean
  }
}
```

### 2. Voice Notes

#### POST /api/voice-notes
Upload a new voice note file with optional transcription model selection.

**Request:** `multipart/form-data`
- `file`: Audio file (required)
  - Supported formats: `mp3`, `m4a`, `wav`, `flac`, `ogg`, `webm`
  - Max size: 50MB
- `title`: string (optional) - Custom title for the note
- `tags`: string (optional) - Comma-separated tags
- `sessionId`: string (optional) - Session ID for anonymous users
- `language`: string (optional) - Language code ("en" | "pl")
- `transcriptionModel`: string (optional) - Model selection
  - `"gpt-4o-transcribe"` (default) - Fast, 224 token prompt limit, $0.006/min
  - `"google/gemini-2.0-flash-001"` - Context-aware, 1M token prompts, $0.0015/min (75% cheaper)
- `whisperPrompt`: string (optional) - Hints for GPT-4o transcription
  - Used only when `transcriptionModel` is "gpt-4o-transcribe"
  - Maximum 224 tokens (~900 characters)
  - Example: "Technical terms: API, JWT, OAuth. Names: John Smith, Żabka"
- `geminiSystemPrompt`: string (optional) - System instructions for Gemini
  - Used only when `transcriptionModel` is "google/gemini-2.0-flash-001"
  - Defines the transcriber's role and behavior
- `geminiUserPrompt`: string (optional) - Context and instructions for Gemini
  - Used only when `transcriptionModel` is "google/gemini-2.0-flash-001"
  - Can include extensive context, glossaries, templates (up to 1M tokens)
  - Supports template placeholders for meetings, technical discussions, podcasts

**Request Headers (for anonymous users):**
```
X-Session-Id: string // From localStorage
```

**Response:** `201 Created`
```typescript
{
  voiceNote: {
    id: string,           // UUID
    title: string,
    status: "pending" | "processing" | "completed" | "failed",
    createdAt: string,    // ISO 8601
    updatedAt: string,    // ISO 8601
    duration: number | null,
    fileSize: number,
    filePath: string,
    tags: string[],
    language: "EN" | "PL" | null,
    userId: string,
    transcriptionModel: string,  // "gpt-4o-transcribe" or "google/gemini-2.0-flash-001"
    transcriptions: [],
    summaries: []
  },
  message: string
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file format or size
- `500 Internal Server Error`: Storage or database error

#### GET /api/voice-notes
List all voice notes with pagination and filtering.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `search`: string (optional) - Search in title and transcription
- `status`: string (optional) - Filter by status
- `language`: "EN" | "PL" (optional)
- `tags`: string (optional) - Comma-separated tags
- `sortBy`: "createdAt" | "updatedAt" | "title" (default: "createdAt")
- `sortOrder`: "asc" | "desc" (default: "desc")

**Response:** `200 OK`
```typescript
{
  data: VoiceNote[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

#### GET /api/voice-notes/:id
Get a specific voice note with all related data.

**Response:** `200 OK`
```typescript
{
  id: string,
  title: string,
  status: ProcessingStatus,
  createdAt: string,
  updatedAt: string,
  duration: number | null,
  fileSize: number,
  filePath: string,
  tags: string[],
  language: "EN" | "PL" | null,
  userId: string,
  transcriptions: Transcription[],
  summaries: Summary[]
}
```

**Error Responses:**
- `404 Not Found`: Voice note not found

#### DELETE /api/voice-notes/:id
Delete a voice note and all related data.

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found`: Voice note not found
- `500 Internal Server Error`: Deletion failed

### 3. Processing

#### POST /api/voice-notes/:id/process
Trigger processing for a voice note (transcription + summarization).

**Request Body:** (optional)
```typescript
{
  language?: "EN" | "PL",           // Override detected language
  systemPrompt?: string,             // Custom system prompt
  classificationPrompt?: string,    // Custom classification prompt
  summaryPrompt?: string            // Custom summary prompt
}
```

**Response:** `202 Accepted`
```typescript
{
  voiceNote: VoiceNote,  // Updated voice note with status "processing"
  message: string
}
```

**Error Responses:**
- `404 Not Found`: Voice note not found
- `409 Conflict`: Already processing or completed
- `500 Internal Server Error`: Processing failed

#### POST /api/voice-notes/:id/reprocess
Reprocess a voice note with new prompts (creates new version).

**Request Body:**
```typescript
{
  systemPrompt?: string,
  classificationPrompt?: string,
  summaryPrompt?: string,
  reason?: string  // Reason for reprocessing
}
```

**Response:**
```typescript
{
  voiceNote: VoiceNote,
  message: string
}
```

#### POST /api/voice-notes/:id/regenerate-summary
Regenerate the summary with a custom prompt. Supports flexible JSON parsing.

**Request Body:**
```typescript
{
  customPrompt: string  // Custom prompt for summary regeneration
}
```

**Response:** `202 Accepted`
```typescript
{
  voiceNote: VoiceNote,
  message: string,
  version: number  // New version number
}
```

### 4. Export

#### GET /api/voice-notes/:id/export
Export a voice note in different formats.

**Query Parameters:**
- `format`: "markdown" | "json" (default: "markdown")
- `includeTranscription`: boolean (default: true)
- `includeSummary`: boolean (default: true)

**Response for Markdown:** `200 OK`
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="voice-note-{id}.md"

# {title}

## Metadata
- Date: {createdAt}
- Language: {language}
...
```

**Response for JSON:** `200 OK`
```typescript
{
  metadata: {...},
  transcription: {...},
  summary: {...}
}
```

## Data Types

### VoiceNote
```typescript
interface VoiceNote {
  id: string;
  title: string;
  status: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  duration: number | null;        // Audio duration in milliseconds
  fileSize: number;
  filePath: string;
  tags: string[];
  language: Language | null;
  userId?: string;                // Optional for anonymous users
  sessionId?: string;              // For anonymous users
  transcriptionModel?: string;     // "gpt-4o-transcribe" | "google/gemini-2.0-flash-001"
  whisperPrompt?: string;          // Prompt for GPT-4o transcription (224 tokens max)
  geminiSystemPrompt?: string;     // System prompt for Gemini transcription
  geminiUserPrompt?: string;       // User prompt for Gemini (1M tokens max)
  aiGeneratedTitle?: string;       // AI-generated title from transcript
  briefDescription?: string;       // AI-generated brief description
  derivedDate?: string;            // Date extracted from transcript content
  transcriptions: Transcription[];
  summaries: Summary[];
}
```

### Transcription
```typescript
interface Transcription {
  id: string;
  voiceNoteId: string;
  content: string;
  language: Language;
  createdAt: string;
  provider: string;
  model: string;
  version: number;
}
```

### Summary
```typescript
interface Summary {
  id: string;
  voiceNoteId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: string;
  provider: string;
  model: string;
  version: number;
}
```

### ProcessingStatus
```typescript
type ProcessingStatus = "pending" | "processing" | "completed" | "failed";
```

### Language
```typescript
type Language = "EN" | "PL";
```

## Error Response Format

All error responses follow this structure:
```typescript
{
  error: {
    code: string,        // e.g., "VALIDATION_ERROR"
    message: string,     // Human-readable message
    details?: any,       // Additional error details
    traceId?: string     // Request trace ID for debugging
  }
}
```

## Field Naming Conventions

### Backend (Domain/DDD)
- `originalName`: Original filename
- `mimeType`: MIME type of the file
- `voiceNoteId`: Foreign key references

### Frontend (Browser/Web Standards)
- `filename`: File name from form data
- `mimetype`: MIME type from form data
- `voice_note_id`: Snake case in URLs

### Transformation Rules
When data crosses the boundary:
1. Frontend `filename` → Backend `originalName`
2. Frontend `mimetype` → Backend `mimeType`
3. Backend API params use kebab-case: `/api/voice-notes/:id`
4. Frontend routes use different pattern: `/note/:id` (NOT `/voice-notes/:id`)
5. Query params use camelCase: `?sortBy=createdAt`
6. Response bodies use camelCase throughout

### Important: Frontend Routes vs Backend API
- **Backend API**: `/api/voice-notes/:id` (kebab-case, plural)
- **Frontend Route**: `/note/:id` (singular, no "voice-")
- See [FRONTEND_ROUTES.md](./FRONTEND_ROUTES.md) for complete frontend routing documentation

## Versioning

API version is included in response headers:
```
X-API-Version: 1.0.0
```

Future versions will use URL versioning: `/api/v2/voice-notes`

## Rate Limiting

Default rate limits:
- 100 requests per minute per IP
- File uploads: 10 per minute per IP

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736500000000
```

## Flexible JSON Parsing

As of August 14, 2025, the API supports flexible JSON parsing for summary regeneration:

1. **Automatic Recovery**: If JSON parsing fails, the system attempts to extract valid JSON from the response
2. **Fallback to Text**: If no valid JSON is found, plain text summaries are accepted
3. **Error Tolerance**: Partial responses are preserved rather than failing completely

Example handling:
```typescript
try {
  // Try standard JSON parse
  return JSON.parse(response);
} catch {
  // Extract JSON from markdown code blocks
  const match = response.match(/```json\s*([\s\S]*?)```/);
  if (match) return JSON.parse(match[1]);
  
  // Fallback to plain text
  return { summary: response, keyPoints: [], actionItems: [] };
}
```

## CORS Configuration

Allowed origins in development:
- `http://localhost:3100`
- `http://localhost:3000`

Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
Allowed headers: `Content-Type, Authorization, X-Trace-Id`

## Known Issues

### Issue #1: Missing Transcription/Summary in API Response
- **Endpoint**: GET /api/voice-notes/:id
- **Status**: Active (as of 2025-08-11)
- **Description**: Transcription and summary data are successfully saved to database but not returned in API response
- **Impact**: Frontend cannot display transcription or summary content
- **Workaround**: Data exists in database and can be retrieved directly
- **Fix**: Update GetVoiceNoteUseCase to properly include relations when fetching