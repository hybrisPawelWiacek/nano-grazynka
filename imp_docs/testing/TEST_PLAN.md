# nano-Grazynka Test Plan
**Last Updated**: January 18, 2025
**Version**: 4.3
**Status**: UPDATED - Configuration Fixes Applied & 100% Pass Rate Achieved

## 🚨 CRITICAL TEST ENVIRONMENT SETUP

### Pre-Test Checklist (MANDATORY)
1. **Frontend MUST run via Docker** - NOT `npm run dev`
   - ✅ Use: `docker compose up frontend` (maps to port 3100)
   - ❌ DON'T: `cd frontend && npm run dev` (runs on wrong port 3000)
2. **Backend may need restart** after code changes
   - Run: `docker compose restart backend` if routes return 404
   - Watch for SQLite disk I/O errors - restart backend if they occur
3. **Correct API endpoints**:
   - Upload: `POST /api/voice-notes/upload`
   - Get single: `GET /api/voice-notes/:id`
   - List: `GET /api/voice-notes?sessionId=xxx`
   - Delete: `DELETE /api/voice-notes/:id`
   - Migration: `/api/anonymous/migrate` (NOT `/api/auth/migrate-anonymous`)
   - Anonymous usage: `/api/anonymous/usage/:sessionId`
4. **Frontend routes (IMPORTANT)**:
   - Note detail: `/note/{id}` (SINGULAR, not `/notes/{id}`)
   - Library: `/library`
   - Dashboard: `/dashboard`

### Test Data Location
**CRITICAL**: All test files are located in the `tests/test-data/` directory, NOT in the project root.
- **Correct Path**: `tests/test-data/` (relative from project root)
- **Absolute Path**: `/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/`
- **Files Available**:
  - `zabka.m4a` - Polish audio file (451KB)
  - `zabka.mp3` - Polish audio file (MP3 format)
  - `test-audio.mp3` - English audio file
  - `test-file.txt` - Text file for invalid upload tests
- **IMPORTANT**: ALL TESTS MUST BE RUN FROM PROJECT ROOT DIRECTORY
- **Script Usage**: When running from root, use `tests/test-data/filename`

### Pre-Test Configuration Validation
Before running any tests, verify:
- [ ] Test files exist in `tests/test-data/` directory
- [ ] Docker services are running (`docker compose ps`)
- [ ] Frontend is accessible at http://localhost:3100
- [ ] Backend is accessible at http://localhost:3101
- [ ] Migration endpoint path is `/api/anonymous/migrate` (NOT `/api/auth/migrate-anonymous`)
- [ ] All test scripts use correct relative paths to test data

## Test Execution Guide

Each test suite below can be executed individually. Run tests in order from Suite 1 to Suite 13 for best results.

### Quick Start - Running All Tests
To run all test suites, execute the commands listed in each suite section below, or use the complete sequential list at the bottom of this document.

**Important**: All commands should be run from the project root directory.

### Known Playwright MCP Limitations
**File Upload Issue**: Playwright MCP cannot maintain file chooser modal state between tool calls.

**Technical Explanation**: 
- Playwright MCP tools are atomic operations - each tool call is independent
- File chooser modal is a browser state that exists between the `click` and `file_upload` actions
- When `browser_click` completes, the tool returns and the modal state is lost
- The subsequent `browser_file_upload` call cannot access the already-closed modal

**Workaround - Hybrid Testing Pattern**:
```javascript
// ❌ DOESN'T WORK - Modal closes between calls
await mcp__playwright__browser_click(element: "upload button")
await mcp__playwright__browser_file_upload(paths: ["/path/to/file"])  // Fails

// ✅ WORKS - Use API for file upload
await mcp__playwright__browser_navigate(url: "http://localhost:3100")
// Navigate UI with Playwright MCP
const uploadResponse = await axios.post('/api/voice-notes/upload', formData)
// Verify results with Playwright MCP
await mcp__playwright__browser_navigate(url: `/note/${noteId}`)
```

**Testing Matrix**:
| Test Type | Tool to Use | Reason |
|-----------|------------|---------|
| Navigation | Playwright MCP | Works perfectly for page navigation |
| Button Clicks | Playwright MCP | Works for all non-file buttons |
| Form Input | Playwright MCP | Works for text inputs, dropdowns |
| File Upload | API (axios) | Modal state limitation |
| Verification | Playwright MCP | Works for checking results |

## 🚨 CRITICAL: Use Playwright MCP Server for ALL E2E Testing

**MANDATORY TESTING APPROACH:**
- ✅ **USE**: Playwright MCP server tools (`mcp__playwright__*`)
- ❌ **DO NOT**: Install npm Playwright packages
- ❌ **DO NOT**: Run `npm install @playwright/test`
- ❌ **DO NOT**: Create test files with `require('@playwright/test')`

The Playwright MCP server is already configured in the Docker environment.
All browser automation MUST use MCP tools directly (except file uploads - use API).

## Test Strategy Overview

### Testing Levels
1. **L1: Backend API Tests** - Direct API testing (existing scripts)
2. **L2: Frontend E2E Tests** - UI automation with **Playwright MCP Server** (NOT npm packages)
3. **L3: Integration Tests** - Full stack user journeys using **Playwright MCP**
4. **L4: Performance Tests** - Load and stress testing

### Test Environment
- **Frontend**: http://localhost:3100
- **Backend**: http://localhost:3101
- **Database**: SQLite at /data/nano-grazynka.db
- **Test Data**: zabka.m4a (Polish), test-audio.mp3 (English)

## Test Suite Organization

### Suite 1: Smoke Tests (5 min)
**Purpose**: Quick validation that system is operational

| Test ID | Test Case | Tool | Priority |
|---------|-----------|------|----------|
| S1.1 | Backend health check | curl/bash | P1 |
| S1.2 | Frontend loads homepage | Playwright MCP | P1 |
| S1.3 | Database connection | backend test | P1 |
| S1.4 | Basic file upload | test-upload.js | P1 |

**Execute:**
```bash
# S1.1 - Backend health check
curl -s http://localhost:3101/health

# S1.2 - Frontend loads homepage  
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100

# S1.3 - Database connection
docker exec nano-grazynka_cc-backend-1 sqlite3 /data/nano-grazynka.db 'SELECT 1;'

# S1.4 - Basic file upload
node tests/scripts/test-anonymous-upload.js
```

### Suite 2: Authentication Tests (10 min)
**Purpose**: Validate authentication and anonymous flow

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| A2.1 | Register new user | 200 OK, user created |
| A2.2 | Login with credentials | 200 OK, JWT cookie set |
| A2.3 | Access protected route | 200 OK with valid JWT |
| A2.4 | Access without auth | 401 Unauthorized |
| A2.5 | Logout | 200 OK, cookie cleared |
| A2.6 | Anonymous upload | 201 Created with sessionId |
| A2.7 | Anonymous usage limit | 403 after 5 uploads |
| A2.8 | Migrate anonymous to user | 200 OK, notes transferred |

**Execute:**
```bash
# Run complete authentication test suite
node tests/scripts/test-auth.js

# Run anonymous tests
node tests/scripts/test-anonymous-upload.js
node tests/scripts/test-anonymous-limit.js

# Run session management tests
node tests/scripts/test-sessions.js
```

### Suite 3: Backend API Tests (15 min)
**Purpose**: Validate all API endpoints and contracts

| Test ID | Test Case | Script | Expected Result |
|---------|-----------|--------|-----------------|
| B2.1 | Health endpoints | curl | 200 OK, healthy status |
| B2.2 | Upload voice note | upload_test.py | 201 Created, returns ID |
| B2.3 | Process transcription (PL) | upload_zabka.py | Status: processing → completed |
| B2.4 | Process transcription (EN) | test_upload.js | Status: processing → completed |
| B2.5 | List voice notes | curl GET | Array of notes with pagination |
| B2.6 | Get single note | final-test.js | Full note with relations |
| B2.7 | Delete voice note | curl DELETE | 204 No Content |
| B2.8 | Invalid file upload | debug-upload.js | 400 Bad Request |
| B2.9 | Large file rejection | new test | 413 Payload Too Large |
| B2.10 | Concurrent uploads | new test | All succeed |

**Execute:**
```bash
# Run complete backend API test suite
node tests/scripts/test-backend-api.js

# Individual API tests (examples)
curl http://localhost:3101/health
python tests/python/upload_test.py
python tests/python/upload_zabka.py
```

### Suite 4: Frontend E2E Tests with Playwright MCP Server (30 min)
**Purpose**: Validate all UI functionality for both anonymous and logged-in users

#### 4A: Anonymous User Happy Path (10 min)
**Reference**: [PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md](./PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md)
**MCP Tool Reference**: [Playwright MCP Playbook](../../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md)

| Test ID | Test Case | Steps | Validation |
|---------|-----------|-------|------------|
| F4A.1 | Anonymous session creation | 1. Navigate to home<br>2. Check localStorage | anonymousSessionId created |
| F4A.2 | Anonymous file upload | 1. Click upload area<br>2. Select zabka.m4a<br>3. Upload and Process | Redirects to note page |
| F4A.3 | Generate summary (anonymous) | 1. Click Summary tab<br>2. Generate Summary | Full JSON structure displayed |
| F4A.4 | Custom prompt (anonymous) | 1. Click Regenerate<br>2. Enter "2 sentence summary"<br>3. Submit | Flexible JSON: 2 sentences only |
| F4A.5 | Library access (anonymous) | 1. Navigate to /library<br>2. View notes | Notes displayed with session |
| F4A.6 | Session persistence | Throughout test | Session ID remains consistent |

**Execute:**
```bash
# Use Playwright MCP tools for anonymous user testing
# Reference: PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md
# Start by navigating to http://localhost:3100
# Then follow the test steps in the documentation
```

#### 4B: Logged-In User Happy Path (10 min)
**Reference**: [PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md](./PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md)
**MCP Tool Reference**: [Playwright MCP Playbook](../../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md)

| Test ID | Test Case | Steps | Validation |
|---------|-----------|-------|------------|
| F4B.1 | User registration | 1. Navigate to /register<br>2. Use timestamp email<br>3. Submit | Account created, auto-login |
| F4B.2 | Upload as logged-in user | 1. Upload zabka.m4a<br>2. Process | Credits decremented |
| F4B.3 | Generate summary (logged-in) | 1. Click Summary tab<br>2. Generate | Full JSON structure |
| F4B.4 | Custom prompt (logged-in) | 1. Regenerate<br>2. "2 sentence summary" | Flexible JSON response |
| F4B.5 | Dashboard access | Navigate to /dashboard | Shows stats and credits |
| F4B.6 | Logout verification | Click Logout | Auth token cleared |

**Execute:**
```bash
# Use Playwright MCP tools for logged-in user testing
# Reference: PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md
node tests/scripts/test-logged-in-flow-mcp.js
```

#### 4C: General UI Tests (10 min)

| Test ID | Test Case | Steps | Validation |
|---------|-----------|-------|------------|
| F4C.1 | Upload via drag-drop | 1. Navigate to home<br>2. Drag zabka.m4a<br>3. Drop on zone | File accepted, upload starts |
| F4C.2 | Search by content | 1. Type "Żabka"<br>2. Press Enter | Filtered results shown |
| F4C.3 | Filter by status | 1. Select "Completed"<br>2. Apply filter | Only completed notes shown |
| F4C.4 | Filter by language | 1. Select "Polish"<br>2. Apply filter | Only PL notes shown |
| F4C.5 | Export as Markdown | 1. Click export<br>2. Select Markdown | File downloads |
| F4C.6 | Export as JSON | 1. Click export<br>2. Select JSON | File downloads |
| F4C.7 | Processing status | 1. Upload file<br>2. Watch status | Updates: pending → processing → completed |
| F4C.8 | Error handling | 1. Upload invalid file | Error message displayed |
| F4C.9 | Empty state | 1. View empty library | "No notes yet" message |
| F4C.10 | Anonymous limit | 1. Upload 5 files<br>2. Try 6th upload | Shows upgrade modal |

**Execute:**
```bash
# Test anonymous limit
node tests/scripts/test-anonymous-limit.js

# Use Playwright MCP for UI testing of filters and exports
# Navigate and test using mcp__playwright__browser_* tools
```

#### 4D: Entity-Enhanced User Flow (15 min)
**Purpose**: Complete user journey with entity system from setup to improved transcription

| Test ID | Test Case | Steps | Validation |
|---------|-----------|-------|------------|
| F4D.1 | Initial entity setup | 1. Login<br>2. Navigate to Settings<br>3. Create 5 entities | Entities saved and displayed |
| F4D.2 | Create project with entities | 1. Create "Tech Meeting" project<br>2. Add all entities<br>3. Save | Project created with associations |
| F4D.3 | Upload without project (baseline) | 1. Navigate to home<br>2. Upload test audio<br>3. Check transcription | Note baseline accuracy |
| F4D.4 | Upload with project context | 1. Select "Tech Meeting" project<br>2. Verify entity pills<br>3. Upload same audio | Improved accuracy with entities |
| F4D.5 | Compare transcriptions | 1. Open both notes<br>2. Compare entity names | Entity names correctly transcribed |
| F4D.6 | Entity usage tracking | 1. Check entity usage stats<br>2. Verify counts | Usage recorded for entities |
| F4D.7 | Switch projects mid-session | 1. Select different project<br>2. Upload new audio | Context updates correctly |
| F4D.8 | End-to-end verification | Full flow validation | 30%+ accuracy improvement |

**Execute:**
```bash
# Run entity-aware transcription tests
node tests/scripts/test-entity-aware-transcription-mcp.js

# Use Playwright MCP for entity UI testing
# Navigate to Settings and test entity management
```

### Suite 5: Integration Tests (30 min)
**Purpose**: Test complete user journeys

| Test ID | Test Case | Scenario | Tools |
|---------|-----------|----------|-------|
| I4.1 | Polish audio journey | Upload → Process → View → Export zabka.m4a | Playwright MCP + API |
| I4.2 | English audio journey | Upload → Process → View → Export test.mp3 | Playwright MCP + API |
| I4.3 | Reprocess flow | Upload → Process → Reprocess with different language | Playwright MCP + API |
| I4.4 | Multi-file workflow | Upload 3 files → View library → Search → Export all | Playwright MCP + API |
| I4.5 | Error recovery | Upload → Fail processing → Retry → Success | Playwright MCP + API |
| I4.6 | Session persistence | Upload → Refresh → Data persists | Playwright MCP |
| I4.7 | Concurrent users | 2 users upload simultaneously | Playwright MCP + API |
| I4.8 | Entity-aware transcription | Create project → Add entities → Upload → Verify accuracy | Playwright MCP + API |

**Execute:**
```bash
# Integration tests combine UI and API testing
# Run library flow tests
node tests/scripts/test-library-flow-mcp.js

# Test reprocessing functionality
node tests/scripts/archive/test-reprocess.js

# For concurrent user testing, run multiple instances
```

### Suite 6: Performance Tests (20 min)
**Purpose**: Validate system performance including Entity System overhead

| Test ID | Test Case | Metric | Target |
|---------|-----------|--------|--------|
| P5.1 | Page load time | Home page | < 2s |
| P5.2 | Upload response | 10MB file | < 3s |
| P5.3 | Library load | 100 notes | < 2s |
| P5.4 | Search response | Complex query | < 500ms |
| P5.5 | Concurrent uploads | 5 simultaneous | All succeed |
| P5.6 | Memory usage | After 10 uploads | < 500MB |
| P5.7 | Entity context building | 100 entities | < 100ms |
| P5.8 | Project load time | Project with 50 entities | < 200ms |
| P5.9 | Entity search response | 1000 entities | < 300ms |
| P5.10 | Transcription with entities | 50 entity context | < 10% overhead |

**Execute:**
```bash
# Performance testing with timing
time curl http://localhost:3101/health

# Load test with multiple requests
for i in {1..10}; do time curl http://localhost:3101/health; done

# Monitor Docker resource usage
docker stats --no-stream
```

### Suite 7: Entity Project System Tests (45 min)
**Purpose**: Validate entity context injection for improved transcription accuracy

#### Test Setup Requirements
**Database Migration (Verification)**:
```bash
# Entity/Project tables exist as of 2025-08-17
# Verify with:
sqlite3 data/nano-grazynka.db '.tables' | grep -E '(Entity|Project)'
```

**Test Data Creation**:
1. Create test user with authentication
2. Create multiple projects
3. Create entities of all types (person, company, technical, product)
4. Associate entities with projects
5. Test with zabka.m4a (contains "Microsoft" mention)

#### 7A: Backend API Tests (15 min)
**Purpose**: Validate API endpoints for entity-project system

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| EP7A.1 | Create project via API | 201 Created, returns project ID |
| EP7A.2 | Create entities (all 4 types) | 201 Created for each entity |
| EP7A.3 | Associate entities to project | 200 OK, entities linked |
| EP7A.4 | Upload with projectId (GPT-4o) | Entity context injected in prompt |
| EP7A.5 | Verify transcription accuracy | "Microsoft" correctly transcribed |
| EP7A.6 | Check entity usage tracking | EntityUsage records created |
| EP7A.7 | Upload with projectId (Gemini) | Entity context in expanded format |
| EP7A.8 | Token optimization validation | Compressed for GPT-4o, expanded for Gemini |
| EP7A.9 | Remove entities from project | 200 OK, associations removed |
| EP7A.10 | Delete project | 204 No Content, project deleted |

**Execute:**
```bash
# Run entity project API tests
bash tests/scripts/test-entity-project-api.sh
bash tests/scripts/test-entity-project-authenticated.sh
bash tests/scripts/test-entity-simple.sh
```

#### 7B: Frontend Entity Management Tests (15 min)
**Purpose**: Validate entity CRUD operations through the UI

| Test ID | Test Case | Tool | Expected Result |
|---------|-----------|------|-----------------|
| EP7B.1 | Login and navigate to Settings | Playwright MCP | Settings page loads with EntityManager |
| EP7B.2 | Create entity via UI | Playwright MCP | Entity appears in list immediately |
| EP7B.3 | Edit entity name/value | Playwright MCP | Changes saved and displayed |
| EP7B.4 | Delete entity | Playwright MCP | Entity removed from list |
| EP7B.5 | Filter entities by type | Playwright MCP | Only selected type shown |
| EP7B.6 | Search entities | Playwright MCP | Matching entities displayed |
| EP7B.7 | Create entities of all types | Playwright MCP | Person, company, technical, product work |
| EP7B.8 | Handle duplicate entity names | Playwright MCP | Error message for duplicates |

**Execute:**
```bash
# Use Playwright MCP for entity management UI testing
# Navigate to Settings page and test entity CRUD operations
# Reference the EntityManager component testing patterns
```

#### 7C: Frontend Project Management Tests (15 min)
**Purpose**: Validate project operations and entity associations

| Test ID | Test Case | Tool | Expected Result |
|---------|-----------|------|-----------------|
| EP7C.1 | Open ProjectSelector dropdown | Playwright MCP | Projects list displayed |
| EP7C.2 | Create new project via modal | Playwright MCP | Project created and selected |
| EP7C.3 | Switch between projects | Playwright MCP | Selection updates correctly |
| EP7C.4 | View project entities (pills) | Playwright MCP | Entity pills shown below selector |
| EP7C.5 | Edit project description | Playwright MCP | Changes saved |
| EP7C.6 | Delete/archive project | Playwright MCP | Project removed from list |
| EP7C.7 | Add entities to project | Playwright MCP | Entities associated successfully |
| EP7C.8 | Remove entities from project | Playwright MCP | Association removed |

**Execute:**
```bash
# Use Playwright MCP for project management UI testing
# Test ProjectSelector dropdown and project operations
```

#### 7D: Frontend Upload with Entity Context (20 min)
**Purpose**: Validate entity context improves transcription

| Test ID | Test Case | Tool | Expected Result |
|---------|-----------|------|-----------------|
| EP7D.1 | Select project before upload | Playwright MCP | Project selected in dropdown |
| EP7D.2 | Verify entity pills display | Playwright MCP | Shows "Active entities: X" |
| EP7D.3 | Upload with project context | Playwright MCP + API | projectId in FormData |
| EP7D.4 | Verify improved transcription | API verification | "Microsoft" correctly transcribed |
| EP7D.5 | Check entity usage in UI | Playwright MCP | Usage stats updated |
| EP7D.6 | Upload without project | Playwright MCP | Uses global entities if available |
| EP7D.7 | Anonymous user sees no selector | Playwright MCP | ProjectSelector hidden for anonymous |
| EP7D.8 | Switch project mid-session | Playwright MCP | Context updates for next upload |

**Execute:**
```bash
# Full entity system frontend testing
bash tests/scripts/test-entity-project-api.sh

# Use Playwright MCP for UI verification
# Navigate to upload page and test with project context
```

### Suite 8: Multi-Model Transcription Tests (25 min)
**Purpose**: Validate GPT-4o vs Gemini 2.0 Flash transcription paths

| Test ID | Test Case | Model | Expected Result |
|---------|-----------|-------|-----------------|
| M7.1 | Select GPT-4o model | GPT-4o | Radio button selected, whisper prompt shown |
| M7.2 | Select Gemini model | Gemini | Radio button selected, template selector shown |
| M7.3 | GPT-4o with whisper prompt | GPT-4o | Transcription includes prompted terms |
| M7.4 | Gemini with Meeting template | Gemini | Speaker identification in transcription |
| M7.5 | Gemini with Technical template | Gemini | Technical terms highlighted |
| M7.6 | Gemini with Podcast template | Gemini | Q&A format transcription |
| M7.7 | Custom Gemini prompts | Gemini | Follows custom instructions |
| M7.8 | Token limit validation (GPT-4o) | GPT-4o | Warning at 224 tokens |
| M7.9 | Token limit validation (Gemini) | Gemini | Handles 1M tokens |
| M7.10 | Cost estimator display | Both | Shows correct pricing |
| M7.11 | Model persistence | Both | Selection persists on collapse/expand |
| M7.12 | Concurrent model uploads | Both | Both process successfully |

**Execute:**
```bash
# Run multi-model transcription tests
node tests/scripts/test-multi-model-mcp.js

# Test Gemini integration specifically
node tests/scripts/archive/test-webapp-gemini.js
```

#### 4E: Session 3 - Entity-to-Project Assignment Enhancement (20 min)
**Purpose**: Validate bulk assignment and project management features in EntityManager
**Reference**: Lines 292-314 of ENTITY_PROJECT_TEST_RESULTS.md

| Test ID | Test Case | Tool | Expected Result |
|---------|-----------|------|-----------------|
| F4E.1 | Bulk entity selection | Playwright MCP | Checkboxes appear on each entity card and are functional |
| F4E.2 | Multi-select entities | Playwright MCP | Multiple entities can be selected simultaneously |
| F4E.3 | Project badges display | Playwright MCP | Project names appear as badges on entity cards |
| F4E.4 | Remove badge functionality | Playwright MCP | Click × on badge removes entity from project |
| F4E.5 | Three-dot menu - Edit | Playwright MCP | Menu opens, Edit option opens entity edit modal |
| F4E.6 | Three-dot menu - Manage Projects | Playwright MCP | Opens modal with project checkboxes |
| F4E.7 | Three-dot menu - Delete | Playwright MCP | Deletes entity with confirmation |
| F4E.8 | Filter by project | Playwright MCP | Dropdown filters entities by selected project |
| F4E.9 | Filter unassigned entities | Playwright MCP | Shows only entities with no project associations |
| F4E.10 | Bulk assign with button | Playwright MCP | "Assign to Project" button assigns selected entities |
| F4E.11 | Success message display | Playwright MCP | Green success message appears after operations |
| F4E.12 | Project management modal save | Playwright MCP | Updates entity's project associations and badges |

**Execute:**
```bash
# Use Playwright MCP for bulk entity assignment testing
# Navigate to EntityManager and test bulk operations
```

### Suite 8: Edge Cases (10 min)
**Purpose**: Test boundary conditions

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| E6.1 | Empty file | 0 bytes | Rejection with error |
| E6.2 | Huge file | 100MB | Rejection with error |
| E6.3 | Wrong format | .txt file | Rejection with error |
| E6.4 | Special characters | Filename with émojis 🎵 | Handles gracefully |
| E6.5 | Long transcription | 30 min audio | Processes successfully |
| E6.6 | Network interruption | Kill connection mid-upload | Error recovery |

**Execute:**
```bash
# Edge case testing
# Test empty file
touch /tmp/empty.m4a && curl -X POST http://localhost:3101/api/voice-notes/upload -F "file=@/tmp/empty.m4a"

# Test wrong format
curl -X POST http://localhost:3101/api/voice-notes/upload -F "file=@tests/test-data/test-file.txt"
```

### Suite 9: AI-Generated Names Tests (10 min)
**Purpose**: Test AI title and description generation

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| AI9.1 | Upload with AI title generation | Title generated and displayed |
| AI9.2 | Brief description accuracy | 10-15 word summary created |
| AI9.3 | Date extraction from content | Date parsed if mentioned |
| AI9.4 | Fallback to original filename | Original shown if generation fails |
| AI9.5 | UI display hierarchy | AI title primary, original secondary |

**Execute:**
```bash
# AI-generated names are tested as part of upload flow
# Upload a file and verify AI title generation
curl -X POST http://localhost:3101/api/voice-notes/upload \
  -H "x-session-id: test-ai-$(date +%s)" \
  -F "file=@tests/test-data/zabka.m4a"
```

### Suite 10: Duration Display Tests (5 min)
**Purpose**: Test audio duration extraction and display

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| D10.1 | Duration extraction m4a | Shows MM:SS format |
| D10.2 | Duration extraction mp3 | Shows MM:SS format |
| D10.3 | Long audio (>1hr) | Shows HH:MM:SS format |
| D10.4 | File size removed | No file size in UI |
| D10.5 | Duration in list view | All cards show duration |

**Execute:**
```bash
# Duration display testing through UI
# Use Playwright MCP to navigate to library
# Verify duration format in note cards
```

### Suite 11: Custom Prompt Regeneration Tests (10 min)
**Purpose**: Test summary regeneration with custom prompts

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| CP11.1 | Regenerate with custom prompt | New summary generated |
| CP11.2 | UI updates after regeneration | Summary refreshes without reload |
| CP11.3 | API client consistency | Uses lib/api not direct fetch |
| CP11.4 | Error handling | Shows error if regeneration fails |
| CP11.5 | Loading state | Shows spinner during regeneration |
| CP11.6 | Flexible JSON parsing | "2 sentences only" works |

**Execute:**
```bash
# Custom prompt testing
# Test through the frontend using Playwright MCP
# Or run archived test:
node tests/scripts/archive/test-custom-prompt-e2e.js
```

### Suite 12: Gemini 2.0 Flash Tests (15 min)
**Purpose**: Test Gemini 2.0 Flash transcription model

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| G12.1 | Gemini model selection | Processes with Gemini 2.0 |
| G12.2 | Large prompt handling | 1M token prompts work |
| G12.3 | Base64 audio encoding | Audio properly encoded |
| G12.4 | Cost calculation | Shows 75% savings |
| G12.5 | Proof of work | Validation succeeds |

**Execute:**
```bash
# Gemini 2.0 Flash testing
node tests/scripts/archive/test-gemini-transcription.js
node tests/scripts/archive/test-gemini-proof.js
```

### Suite 13: YAML Prompt System Tests (20 min)
**Purpose**: Validate externalized prompt system with variable interpolation

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| Y13.1 | PromptLoader initialization | Loads prompts.yaml successfully |
| Y13.2 | YAML parsing and validation | Valid YAML structure parsed correctly |
| Y13.3 | Variable interpolation - entities | {{entities.*}} placeholders replaced |
| Y13.4 | Variable interpolation - project | {{project.*}} placeholders replaced |
| Y13.5 | Variable interpolation - user | {{user.customPrompt}} passed through |
| Y13.6 | Hot-reload in development | Prompts reload on file change |
| Y13.7 | Fallback to defaults | Uses hardcoded prompts if YAML missing |
| Y13.8 | Template resolution | Gemini templates load correctly |
| Y13.9 | WhisperAdapter integration | Transcription uses prompts.yaml |
| Y13.10 | LLMAdapter integration | Summarization uses prompts.yaml |
| Y13.11 | TitleGenerationAdapter integration | Title generation uses prompts.yaml |
| Y13.12 | Malformed YAML handling | Graceful error on invalid YAML |
| Y13.13 | Missing variables handling | Empty string for undefined variables |
| Y13.14 | Nested variable paths | Supports {{entities.people.detailed}} |
| Y13.15 | End-to-end prompt flow | Upload → Transcribe → Summarize with YAML |

**Execute:**
```bash
# YAML prompt system testing
# Test prompt interpolation
node tests/scripts/archive/test-prompt-interpolation.js

# Check PromptLoader initialization
docker compose logs backend | grep PromptLoader

# Verify prompts.yaml is loaded
cat backend/config/prompts.yaml
```

## Common Test Issues & Solutions

### Known Issues
1. **SQLite Disk I/O Errors**
   - **Symptom**: 500 errors during upload, "disk I/O error" in logs
   - **Solution**: Restart backend container: `docker compose restart backend`
   - **Root Cause**: Transient SQLite locking issues in Docker volumes

2. **Session ID Mismatches**
   - **Symptom**: 403 Forbidden on delete, empty results on list
   - **Solution**: Ensure same session ID used for upload and subsequent operations
   - **Prevention**: Use test-utils.js helper functions for consistent sessions

3. **Wrong Route Paths**
   - **Symptom**: 404 on `/notes/{id}` frontend routes
   - **Solution**: Use `/note/{id}` (singular) not `/notes/{id}` (plural)
   - **Prevention**: Reference test-utils.js for correct route patterns

4. **Playwright MCP File Upload**
   - **Symptom**: Cannot maintain file chooser modal between tool calls
   - **Solution**: Use API-based uploads for testing file operations
   - **Prevention**: Hybrid approach - UI navigation with Playwright, uploads with API

5. **Backend Not Reflecting Code Changes**
   - **Symptom**: Routes return 404 after code updates
   - **Solution**: `docker compose restart backend`
   - **Prevention**: Always restart backend after significant changes

6. **Test File Location Errors**
   - **Symptom**: ENOENT errors when running tests
   - **Solution**: Use `../../test-data/` path from `tests/scripts/`
   - **Prevention**: All test files must be in `tests/test-data/` directory

7. **Migration Endpoint Path**
   - **Symptom**: 404 error on `/api/auth/migrate-anonymous`
   - **Solution**: Use correct path `/api/anonymous/migrate`
   - **Prevention**: Check endpoint documentation in API contract

## Test Execution Plan

### Phase 1: Backend Validation (Day 1)
1. Run Suite 1 (Smoke) - 5 min
2. Run Suite 2 (Backend API) - 15 min
3. Fix any API issues
4. Rerun failed tests

### Phase 2: Frontend Validation (Day 1)
1. Use existing Playwright MCP server (no setup needed)
2. Run Suite 3 (Frontend E2E) using MCP tools - 20 min
3. Document any UI bugs
4. Fix critical issues

### Phase 3: Integration Testing (Day 2)
1. Run Suite 4 (Integration) - 30 min
2. Run Suite 5 (Performance) - 15 min
3. Run Suite 6 (Edge Cases) - 10 min
4. Create bug report

### Phase 4: Regression Testing (Day 2)
1. Fix all P1 bugs
2. Rerun failed tests
3. Full regression suite
4. Sign-off

## Test Data Requirements

### Audio Files
- `zabka.m4a` - Polish audio (451KB) ✓ Available
- `test-audio.mp3` - English audio (11 bytes) ✓ Available
- `large-test.m4a` - Large file (50MB) - To create
- `corrupt.m4a` - Corrupted file - To create

### Test User Data
```json
{
  "testUser1": {
    "id": "test-user-1",
    "name": "Test User One"
  },
  "testUser2": {
    "id": "test-user-2",
    "name": "Test User Two"
  }
}
```

### Entity Test Data
```json
{
  "entities": [
    {
      "name": "Microsoft",
      "type": "company",
      "value": "Microsoft",
      "description": "Technology company",
      "aliases": ["MSFT", "Microsoft Corporation"]
    },
    {
      "name": "Żabka",
      "type": "company",
      "value": "Żabka",
      "description": "Polish convenience store chain",
      "aliases": ["Zabka", "Żabka Polska"]
    },
    {
      "name": "Claude API",
      "type": "technical",
      "value": "Claude API",
      "description": "Anthropic's AI API",
      "aliases": ["Claude SDK", "Anthropic API"]
    },
    {
      "name": "Dario Amodei",
      "type": "person",
      "value": "Dario Amodei",
      "description": "CEO of Anthropic",
      "aliases": ["Dario", "D. Amodei"]
    },
    {
      "name": "RLHF",
      "type": "technical",
      "value": "RLHF",
      "description": "Reinforcement Learning from Human Feedback",
      "aliases": ["RL from Human Feedback"]
    }
  ],
  "projects": [
    {
      "name": "Tech Meeting",
      "description": "Weekly technical discussion project",
      "entityIds": ["entity1", "entity3", "entity4", "entity5"]
    },
    {
      "name": "Polish Business",
      "description": "Polish market analysis project",
      "entityIds": ["entity2"]
    }
  ]
}
```

## Tools & Scripts

### Test Infrastructure (RESTORED - August 17, 2025)
**Infrastructure Status**: ✅ FIXED
- Dependencies installed via `tests/scripts/package.json`
- Critical scripts restored from archive
- Execute permissions set on shell scripts

**Package Management** (`tests/scripts/package.json`):
- Contains all required dependencies (axios, form-data, uuid, dotenv)
- Run `npm install` in tests/scripts to setup
- npm scripts for running test suites

**Test Utilities** (`tests/scripts/test-utils.js`):
- Provides consistent session management across tests
- Corrects frontend routes (`/note/` not `/notes/`)
- Key functions:
  - `generateSessionId()` - Creates unique session IDs
  - `uploadTestFile()` - Handles file uploads with proper session
  - `listVoiceNotes()` - Lists notes for a session
  - `deleteVoiceNote()` - Deletes with permission checks
  - `getVoiceNote()` - Retrieves single note

### Core Test Suites (RESTORED)

**Backend API Test Suite** (`tests/scripts/test-backend-api.js`):
- ✅ RESTORED - Enhanced version with full test coverage
- Tests health, upload, get, list, delete, invalid files, usage tracking
- Proper session isolation validation
- Usage: `node tests/scripts/test-backend-api.js` or `npm run test:backend`

**Session Management Tests** (`tests/scripts/test-sessions.js`):
- ✅ CREATED - New comprehensive session test suite
- Tests session isolation and usage tracking
- Usage: `node tests/scripts/test-sessions.js` or `npm run test:sessions`

**Authentication Tests** (`tests/scripts/test-auth.js`):
- ✅ WORKING - One of the few originally working scripts
- Tests user registration, login, JWT, logout
- Usage: `node tests/scripts/test-auth.js` or `npm run test:auth`

**Anonymous Upload Tests** (`tests/scripts/test-anonymous-upload.js`):
- ✅ RESTORED from archive
- Tests anonymous user upload flow
- Usage: `node tests/scripts/test-anonymous-upload.js` or `npm run test:anonymous`

**Library Flow Tests** (`tests/scripts/test-library-flow-mcp.js`):
- ✅ RESTORED from archive
- Tests library viewing and management with MCP
- Usage: `node tests/scripts/test-library-flow-mcp.js`

**Entity-Aware Tests** (`tests/scripts/test-entity-aware-transcription-mcp.js`):
- ✅ RESTORED from archive
- Tests entity system integration
- Usage: `node tests/scripts/test-entity-aware-transcription-mcp.js`

**Multi-Model Tests** (`tests/scripts/test-multi-model-mcp.js`):
- ✅ RESTORED from archive
- Tests GPT-4o vs Gemini model selection
- Usage: `node tests/scripts/test-multi-model-mcp.js`

### Shell Scripts (RESTORED)

**Endpoint Tests** (`tests/scripts/test-endpoints.sh`):
- ✅ RESTORED from archive with execute permissions
- API endpoint validation via curl
- Usage: `./tests/scripts/test-endpoints.sh`

**Entity Project API Tests** (`tests/scripts/test-entity-project-api.sh`):
- ✅ FIXED - Execute permissions set
- Tests entity-project system via API
- Usage: `./tests/scripts/test-entity-project-api.sh`

### Test Runners

**Run All Tests** (`tests/scripts/run-all-tests.sh`):
- ✅ AVAILABLE - Pre-flight checks and orchestration
- Usage: `./tests/scripts/run-all-tests.sh`

**Run MCP Tests** (`tests/scripts/run-all-mcp-tests.js`):
- ✅ RESTORED from archive
- Orchestrates all MCP-based tests
- Usage: `node tests/scripts/run-all-mcp-tests.js`

### Python Scripts (in /tests)
- `upload_test.py` - Basic upload test
- `upload_zabka.py` - Polish file upload
- `test_upload.js` - JS upload test
- `final-test.js` - Complete flow test
- `debug-upload.js` - Debug version

### Testing with Playwright MCP
**NO TEST SCRIPTS NEEDED!** Use Playwright MCP tools directly:
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_type` - Type text
- `mcp__playwright__browser_file_upload` - Upload files
- `mcp__playwright__browser_snapshot` - Get page state
- `mcp__playwright__browser_wait_for` - Wait for conditions

### Example Playwright MCP Test Flow
```yaml
# NO JS FILES! Use MCP tools directly:
1. Navigate to app:
   mcp__playwright__browser_navigate(url: "http://localhost:3100")

2. Click upload area:
   mcp__playwright__browser_click(element: "Click to upload", ref: "e24")

3. Upload file:
   mcp__playwright__browser_file_upload(paths: ["/path/to/zabka.m4a"])

4. Click process button:
   mcp__playwright__browser_click(element: "Upload and Process", ref: "e36")

5. Wait for completion:
   mcp__playwright__browser_wait_for(time: 5)

6. Verify results:
   mcp__playwright__browser_snapshot()
```

## Success Criteria

### Must Pass (P1)
- All smoke tests pass
- Core upload flow works
- Processing pipeline completes
- Data persists correctly
- No data loss

### Should Pass (P2)
- Search and filters work
- Export functionality works
- UI responsive
- Error messages clear

### Nice to Pass (P3)
- Performance targets met
- Edge cases handled
- Concurrent operations work

## Test Report Template

```markdown
## Test Execution Report
Date: [DATE]
Tester: [NAME]
Environment: [ENV]

### Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X
- Pass Rate: X%

### Failed Tests
| Test ID | Issue | Severity | Notes |
|---------|-------|----------|-------|
| | | | |

### Recommendations
- [ ] Fix P1 issues before deployment
- [ ] Document known limitations
- [ ] Create follow-up tickets
```

## Approval Checklist

- [ ] Test coverage adequate for MVP
- [ ] Critical user journeys covered
- [ ] Performance criteria defined
- [ ] Test data available
- [ ] Tools and scripts ready
- [ ] Execution timeline realistic

## Complete Sequential Test Execution Commands

Run these commands in order from the project root directory to execute all test suites:

```bash
# Suite 1: Smoke Tests
curl -s http://localhost:3101/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100
docker exec nano-grazynka_cc-backend-1 sqlite3 /data/nano-grazynka.db 'SELECT 1;'
node tests/scripts/test-anonymous-upload.js

# Suite 2: Authentication Tests  
node tests/scripts/test-auth.js
node tests/scripts/test-anonymous-upload.js
node tests/scripts/test-anonymous-limit.js
node tests/scripts/test-sessions.js

# Suite 3: Backend API Tests
node tests/scripts/test-backend-api.js
curl http://localhost:3101/health
python tests/python/upload_test.py
python tests/python/upload_zabka.py

# Suite 4: Frontend E2E Tests
# Use Playwright MCP tools for anonymous user testing
# Use Playwright MCP tools for logged-in user testing
node tests/scripts/test-logged-in-flow-mcp.js
node tests/scripts/test-anonymous-limit.js
node tests/scripts/test-entity-aware-transcription-mcp.js

# Suite 5: Integration Tests
node tests/scripts/test-library-flow-mcp.js
node tests/scripts/archive/test-reprocess.js

# Suite 6: Performance Tests
time curl http://localhost:3101/health
for i in {1..10}; do time curl http://localhost:3101/health; done
docker stats --no-stream

# Suite 7: Entity Project System Tests
bash tests/scripts/test-entity-project-api.sh
bash tests/scripts/test-entity-project-authenticated.sh
bash tests/scripts/test-entity-simple.sh

# Suite 8: Multi-Model Transcription Tests
node tests/scripts/test-multi-model-mcp.js
node tests/scripts/archive/test-webapp-gemini.js

# Suite 9: Edge Cases
touch /tmp/empty.m4a && curl -X POST http://localhost:3101/api/voice-notes/upload -F "file=@/tmp/empty.m4a"
curl -X POST http://localhost:3101/api/voice-notes/upload -F "file=@tests/test-data/test-file.txt"

# Suite 10: AI-Generated Names
curl -X POST http://localhost:3101/api/voice-notes/upload \
  -H "x-session-id: test-ai-$(date +%s)" \
  -F "file=@tests/test-data/zabka.m4a"

# Suite 11: Duration Display
# Use Playwright MCP to navigate to library and verify duration format

# Suite 12: Custom Prompt Regeneration
node tests/scripts/archive/test-custom-prompt-e2e.js

# Suite 13: Gemini 2.0 Flash Tests
node tests/scripts/archive/test-gemini-transcription.js
node tests/scripts/archive/test-gemini-proof.js

# Suite 14: YAML Prompt System Tests
node tests/scripts/archive/test-prompt-interpolation.js
docker compose logs backend | grep PromptLoader
cat backend/config/prompts.yaml
```

---

**READY FOR APPROVAL**

Please review and confirm if you want to proceed with this test plan.