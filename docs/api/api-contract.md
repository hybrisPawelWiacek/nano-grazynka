# API Contract Documentation

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
Upload a new voice note file.

**Request:** `multipart/form-data`
- `file`: Audio file (required)
  - Supported formats: `mp3`, `m4a`, `wav`, `flac`, `ogg`, `webm`
  - Max size: 50MB
- `title`: string (optional) - Custom title for the note
- `tags`: string (optional) - Comma-separated tags

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
  duration: number | null;
  fileSize: number;
  filePath: string;
  tags: string[];
  language: Language | null;
  userId: string;
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
3. URL params use kebab-case: `/voice-notes/:id`
4. Query params use camelCase: `?sortBy=createdAt`
5. Response bodies use camelCase throughout

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