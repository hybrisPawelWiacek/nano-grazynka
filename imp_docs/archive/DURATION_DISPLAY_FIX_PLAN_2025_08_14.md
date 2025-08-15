# Duration Display Feature - Fix Plan
**Date**: August 14, 2025
**Status**: In Progress
**Priority**: High

## Executive Summary
The duration display feature is 95% implemented but has two critical blockers:
1. Database migration not applied in Docker container
2. music-metadata module ESM compatibility issues

## Critical Issues

### Issue 1: Database Migration Not Applied
**Error**: "The column `duration` does not exist in the current database"
- Migration file exists: `20250814212611_add_duration_field`
- Migration not executed in Docker container
- Causes crash when trying to save duration during upload

### Issue 2: music-metadata Module Issues
**Error**: ESM module compatibility in Docker
- Package installed but has import issues
- Solution implemented: Dynamic import in AudioMetadataExtractor
- Needs verification after container restart

## Current Implementation Status

### ✅ Completed Components
- **Database Schema**: Duration field defined in schema.prisma (Float, nullable)
- **Migration File**: Created but not applied
- **VoiceNote Entity**: Has getDuration() and setDuration() methods
- **AudioMetadataExtractor**: Class with dynamic import for music-metadata
- **UploadVoiceNoteUseCase**: Calls extractDuration during upload
- **ListVoiceNotesUseCase**: Returns duration in API response
- **VoiceNoteRepositoryImpl**: Persists duration field
- **Frontend VoiceNoteCard**: Displays duration with formatDuration()
- **File Size Removal**: No longer displayed in UI

### ❌ Pending Issues
- Database migration not applied
- music-metadata extraction not verified in Docker

## Implementation Steps (Priority Order)

### Step 1: Apply Database Migration (CRITICAL)
```bash
docker exec nano-grazynka_cc-backend-1 npx prisma migrate deploy
```
This adds the duration column to the VoiceNote table.

### Step 2: Verify AudioMetadataExtractor
Current implementation uses dynamic import to handle ESM:
```typescript
const musicMetadata = await import('music-metadata');
const { parseStream } = musicMetadata;
```

### Step 3: Restart Backend
```bash
docker compose restart backend
```

### Step 4: Verify Complete Flow
1. Upload audio file
2. Check duration extraction in logs
3. Verify duration saved to database
4. Confirm duration displays in UI

## Test Scenarios
1. **OpenAI Transcription**: Upload voice note → verify duration appears
2. **Gemini Transcription**: Upload voice note → verify duration appears
3. **UI Validation**: Confirm file size removed, duration shown
4. **Format Testing**: Verify MM:SS and HH:MM:SS formats
5. **Audio Formats**: Test m4a, mp3, wav files

## Expected Outcome
- Duration extracted during upload (10-50ms latency)
- Duration displayed immediately in library
- Format: MM:SS for < 1 hour, HH:MM:SS for longer
- No file size displayed anywhere
- Works with both transcription models

## Technical Details

### Files Modified
- `/backend/src/infrastructure/adapters/AudioMetadataExtractor.ts`
- `/backend/src/domain/entities/VoiceNote.ts`
- `/backend/src/application/use-cases/UploadVoiceNoteUseCase.ts`
- `/backend/src/application/use-cases/ListVoiceNotesUseCase.ts`
- `/backend/src/infrastructure/persistence/VoiceNoteRepositoryImpl.ts`
- `/frontend/components/VoiceNoteCard.tsx`
- `/backend/prisma/schema.prisma`

### Database Changes
```sql
ALTER TABLE VoiceNote ADD COLUMN duration FLOAT;
```

## Context Continuation Prompt

When continuing after context compaction, use this prompt:

```
Please complete the duration display feature implementation from DURATION_DISPLAY_FIX_PLAN_2025_08_14.md.

The feature is mostly implemented but needs:
1. Apply database migration: docker exec nano-grazynka_cc-backend-1 npx prisma migrate deploy
2. Verify AudioMetadataExtractor works with dynamic import for music-metadata
3. Test that duration displays instead of file size on voice note cards

The main blocker is the unapplied database migration causing "column duration does not exist" error.

Test at http://localhost:3100 after fixes.
```

## Notes
- Feature was initially confused with AI-generated titles feature
- Duration extraction is synchronous (10-50ms acceptable latency)
- Duration stored at VoiceNote entity level, not Transcription
- Replaces file size as primary metric in library view