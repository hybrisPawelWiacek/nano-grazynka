# Frontend-Backend Interface Mapping

## Overview
This document maps the type definitions and interfaces between the frontend (Next.js) and backend (Fastify) to ensure consistency and prevent interface mismatches.

## Type Mapping Reference

### Frontend → Backend Transformation

| Frontend Type/Field | Backend Type/Field | Location | Notes |
|--------------------|--------------------|----------|-------|
| `filename` | `originalName` | File upload | Browser FormData uses `filename` |
| `mimetype` | `mimeType` | File upload | Standard MIME type field |
| `voice_note_id` | `voiceNoteId` | URL params | Snake case in URLs, camelCase in code |
| `created_at` | `createdAt` | JSON responses | Database uses snake_case, API uses camelCase |
| `updated_at` | `updatedAt` | JSON responses | Database uses snake_case, API uses camelCase |

## Frontend Type Definitions

### Location: `/frontend/lib/types.ts`

```typescript
// Processing Status
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Language
export type Language = 'EN' | 'PL';

// Voice Note Type
export interface VoiceNote {
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

// Transcription Type
export interface Transcription {
  id: string;
  voiceNoteId: string;
  content: string;
  language: Language;
  createdAt: string;
  provider: string;
  model: string;
  version: number;
}

// Summary Type
export interface Summary {
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

// API Response Types
export interface UploadResponse {
  voiceNote: VoiceNote;
  message: string;
}

export interface ProcessResponse {
  voiceNote: VoiceNote;
  message: string;
}

export interface ListResponse {
  data: VoiceNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    traceId?: string;
  };
}
```

## Backend Type Definitions

### Domain Value Objects
Location: `/backend/src/domain/value-objects/`

```typescript
// ProcessingStatus.ts
export enum ProcessingStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Language.ts
export enum LanguageEnum {
  EN = 'EN',
  PL = 'PL'
}
```

### Domain Entities
Location: `/backend/src/domain/entities/`

```typescript
// VoiceNote.ts
export class VoiceNote {
  private readonly _id: VoiceNoteId;
  private _title: string;
  private _status: ProcessingStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _duration: number | null;
  private readonly _fileSize: number;
  private readonly _filePath: string;
  private _tags: string[];
  private _language: Language | null;
  private readonly _userId: string;
  private _transcriptions: Transcription[];
  private _summaries: Summary[];
  // ... methods
}
```

### API DTOs
Location: `/backend/src/presentation/api/routes/voiceNotes.ts`

```typescript
// Upload endpoint transformation
const file = req.file as MultipartFile;
const uploadDto = {
  file: {
    buffer: await file.toBuffer(),
    mimeType: file.mimetype,    // Frontend: mimetype
    originalName: file.filename, // Frontend: filename
    size: buffer.length
  },
  title: req.body.title,
  tags: req.body.tags?.split(','),
  userId: 'default-user'
};

// Response transformation
const response = {
  voiceNote: {
    id: voiceNote.id.value,
    title: voiceNote.title,
    status: voiceNote.status.value,
    createdAt: voiceNote.createdAt.toISOString(),
    updatedAt: voiceNote.updatedAt.toISOString(),
    // ... other fields
  }
};
```

## Prisma Schema Mapping

Location: `/backend/prisma/schema.prisma`

```prisma
model VoiceNote {
  id          String   @id @default(cuid())
  title       String
  status      String
  created_at  DateTime @default(now()) @map("created_at")
  updated_at  DateTime @updatedAt @map("updated_at")
  duration    Int?
  file_size   Int      @map("file_size")
  file_path   String   @map("file_path")
  tags        String   // JSON array stored as string
  language    String?
  user_id     String   @map("user_id")
  
  // Relations use plural naming
  transcriptions Transcription[]
  summaries     Summary[]
  
  @@map("voice_notes")
}
```

## Critical Transformation Points

### 1. File Upload Handler
```typescript
// Frontend sends (FormData)
{
  file: File,
  filename: "recording.mp3",
  mimetype: "audio/mpeg"
}

// Backend expects (Domain)
{
  file: {
    buffer: Buffer,
    originalName: "recording.mp3",  // Mapped from filename
    mimeType: "audio/mpeg",         // Mapped from mimetype
    size: 1024000
  }
}
```

### 2. Response Wrapping
```typescript
// Backend returns (Domain Entity)
const voiceNote = VoiceNote.create(/*...*/);

// API transforms to (DTO)
{
  voiceNote: voiceNote.toDTO(),  // Must wrap in object
  message: "Success"
}

// Frontend expects
{
  voiceNote: { /*...*/ },  // Nested, not flat
  message: "Success"
}
```

### 3. Database to API
```typescript
// Prisma returns (snake_case)
{
  id: "abc123",
  created_at: Date,
  updated_at: Date,
  file_size: 1024000,
  file_path: "/uploads/abc123.mp3",
  user_id: "user123"
}

// API returns (camelCase)
{
  id: "abc123",
  createdAt: "2024-01-10T10:00:00Z",
  updatedAt: "2024-01-10T10:00:00Z",
  fileSize: 1024000,
  filePath: "/uploads/abc123.mp3",
  userId: "user123"
}
```

## Validation Rules

### Frontend Validation
- File size: Max 50MB (checked before upload)
- File types: `mp3`, `m4a`, `wav`, `flac`, `ogg`, `webm`
- Title: Optional, max 255 characters
- Tags: Optional, comma-separated string

### Backend Validation
- File size: Max 50MB (enforced in use case)
- File types: Validated by extension and MIME type
- Title: Defaults to filename if not provided
- Tags: Parsed from comma-separated to array
- Language: Must be 'EN' or 'PL' if provided

## Common Interface Issues and Solutions

### Issue 1: Field Name Mismatch
**Problem**: Frontend sends `filename`, backend expects `originalName`
**Solution**: Transform in route handler before passing to use case

### Issue 2: Response Format
**Problem**: Backend returns flat object, frontend expects nested
**Solution**: Always wrap domain objects in response structure

### Issue 3: Date Formats
**Problem**: Database uses Date objects, API needs ISO strings
**Solution**: Transform dates to ISO 8601 strings in API layer

### Issue 4: Array Storage
**Problem**: SQLite doesn't support arrays natively
**Solution**: Store as JSON string in database, parse in repository layer

## Testing Interface Contracts

### Unit Tests
```typescript
// Test field transformation
expect(transformUploadDto(frontendData).file.originalName)
  .toBe(frontendData.filename);

// Test response structure
expect(response).toHaveProperty('voiceNote');
expect(response.voiceNote).toHaveProperty('id');
```

### Integration Tests
```typescript
// Test full upload flow
const formData = new FormData();
formData.append('file', audioFile);
const response = await apiClient.post('/api/voice-notes', formData);
expect(response.data).toMatchObject({
  voiceNote: expect.objectContaining({
    id: expect.any(String),
    status: 'pending'
  })
});
```

## Interface Change Protocol

1. **Update API Contract**: Modify `/docs/api-contract.md`
2. **Update Type Definitions**: Change both frontend and backend types
3. **Update Transformations**: Modify mapping functions
4. **Update Tests**: Ensure contract tests pass
5. **Version API**: Increment version if breaking change
6. **Document in Memory**: Use Memory MCP to persist change