# Library Page Fix Plan - Anonymous User Notes Not Showing
**Date**: 2025-08-14
**Issue**: Library page shows 0 notes for anonymous users despite notes existing in database

## Root Cause Analysis

### Investigation Summary
1. **Frontend**: Correctly sends `x-session-id` header with API requests
2. **Backend**: Properly filters notes by sessionId in the API endpoint
3. **Database**: Contains the correct data (5 notes for session `9c7ef6f6-cae9-456c-8444-a4d2692b2f12`)
4. **Problem**: Database synchronization issue between Docker container and host system

### Technical Details
- Host database at `/data/nano-grazynka.db` has correct data
- Docker container sees outdated database state
- SQLite WAL (Write-Ahead Logging) file not syncing properly
- Host WAL file: 4MB with changes
- Docker WAL file: 0 bytes (no changes)

## Fix Implementation

### Immediate Fix (Quick Solution)

#### 1. Restart Docker Compose to Force Database Sync
```bash
docker compose down
docker compose up
```
This will remount the volume and ensure the container sees the latest database state.

### Long-term Fix (Proper Solution)

#### 1. Fix Database Connection Configuration
- Ensure Prisma uses proper SQLite journal mode for Docker environments
- Add WAL mode configuration to handle concurrent access properly

#### 2. Update Prisma Configuration
Add to `backend/prisma/schema.prisma` datasource:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // Add journal_mode for better Docker compatibility
}
```

#### 3. Fix Volume Mounting in docker-compose.yml
Ensure the volume is mounted with proper permissions and sync options:
```yaml
volumes:
  - ./data:/data:delegated  # Use delegated for better performance on macOS
```

#### 4. Add Database Connection Pooling
Update the Prisma client initialization to handle SQLite WAL mode properly in production.

## Testing Checklist

- [ ] Restart Docker containers
- [ ] Navigate to library page as anonymous user
- [ ] Verify the 5 existing notes appear for session `9c7ef6f6-cae9-456c-8444-a4d2692b2f12`
- [ ] Upload a new note as anonymous user
- [ ] Verify new note appears immediately in library
- [ ] Check that usage counter correctly shows usage count (e.g., 5/5 or 6/5)
- [ ] Test with a fresh anonymous session (clear localStorage)
- [ ] Verify new session can create and view notes

## Prevention Measures

1. **Health Checks**: Add database connectivity health checks
2. **Monitoring**: Add logging for database sync issues
3. **Architecture**: Consider PostgreSQL for production to avoid SQLite concurrency issues
4. **Testing**: Add E2E tests for anonymous user flow

## Files to Modify

1. `docker-compose.yml` - Update volume mount options
2. `backend/src/infrastructure/database/DatabaseClient.ts` - Add WAL mode configuration
3. `backend/prisma/schema.prisma` - Update datasource configuration (optional)

## Context for Future Execution

When executing this plan after context compaction:
1. The database already has the AnonymousSession table
2. The issue is database sync, not missing schema
3. Session ID `9c7ef6f6-cae9-456c-8444-a4d2692b2f12` has 5 notes that should be visible
4. The backend code is correct, just reading outdated data