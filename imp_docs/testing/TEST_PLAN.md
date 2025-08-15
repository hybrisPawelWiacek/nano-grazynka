# nano-Grazynka Test Plan
**Last Updated**: August 15, 2025
**Version**: 4.0
**Status**: UPDATED - AI Features & Bug Fix Tests Added

## 🚨 CRITICAL: Use Playwright MCP Server for ALL E2E Testing

**MANDATORY TESTING APPROACH:**
- ✅ **USE**: Playwright MCP server tools (`mcp__playwright__*`)
- ❌ **DO NOT**: Install npm Playwright packages
- ❌ **DO NOT**: Run `npm install @playwright/test`
- ❌ **DO NOT**: Create test files with `require('@playwright/test')`

The Playwright MCP server is already configured in the Docker environment.
All browser automation MUST use MCP tools directly.

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

### Suite 4: Frontend E2E Tests with Playwright MCP Server (20 min)
**Purpose**: Validate all UI functionality

| Test ID | Test Case | Steps | Validation |
|---------|-----------|-------|------------|
| F3.1 | Upload via drag-drop | 1. Navigate to home<br>2. Drag zabka.m4a<br>3. Drop on zone | File accepted, upload starts |
| F3.2 | Upload via file picker | 1. Click upload button<br>2. Select file<br>3. Confirm | File uploads, redirects to library |
| F3.3 | View library | 1. Navigate to /library<br>2. Wait for load | All voice notes displayed |
| F3.4 | Search by content | 1. Type "Żabka"<br>2. Press Enter | Filtered results shown |
| F3.5 | Filter by status | 1. Select "Completed"<br>2. Apply filter | Only completed notes shown |
| F3.6 | Filter by language | 1. Select "Polish"<br>2. Apply filter | Only PL notes shown |
| F3.7 | View note details | 1. Click note card<br>2. Navigate to detail | Transcription & summary shown |
| F3.8 | Export as Markdown | 1. Click export<br>2. Select Markdown | File downloads |
| F3.9 | Export as JSON | 1. Click export<br>2. Select JSON | File downloads |
| F3.10 | Processing status | 1. Upload file<br>2. Watch status | Updates: pending → processing → completed |
| F3.11 | Error handling | 1. Upload invalid file | Error message displayed |
| F3.12 | Empty state | 1. View empty library | "No notes yet" message |
| F3.13 | Login flow | 1. Click login<br>2. Enter credentials<br>3. Submit | Redirects to dashboard |
| F3.14 | Register flow | 1. Click register<br>2. Fill form<br>3. Submit | Account created, logged in |
| F3.15 | Logout | 1. Click logout button | Session cleared, redirect to home |
| F3.16 | Anonymous limit | 1. Upload 5 files<br>2. Try 6th upload | Shows upgrade modal |

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

### Suite 6: Performance Tests (15 min)
**Purpose**: Validate system performance

| Test ID | Test Case | Metric | Target |
|---------|-----------|--------|--------|
| P5.1 | Page load time | Home page | < 2s |
| P5.2 | Upload response | 10MB file | < 3s |
| P5.3 | Library load | 100 notes | < 2s |
| P5.4 | Search response | Complex query | < 500ms |
| P5.5 | Concurrent uploads | 5 simultaneous | All succeed |
| P5.6 | Memory usage | After 10 uploads | < 500MB |

### Suite 7: Multi-Model Transcription Tests (25 min)
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

**Test Script**: `tests/scripts/test-multi-model.js`
**E2E Tests**: `tests/e2e/multi-model-transcription.spec.js`

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

### Suite 9: AI-Generated Names Tests (10 min)
**Purpose**: Test AI title and description generation

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| AI9.1 | Upload with AI title generation | Title generated and displayed |
| AI9.2 | Brief description accuracy | 10-15 word summary created |
| AI9.3 | Date extraction from content | Date parsed if mentioned |
| AI9.4 | Fallback to original filename | Original shown if generation fails |
| AI9.5 | UI display hierarchy | AI title primary, original secondary |

### Suite 10: Duration Display Tests (5 min)
**Purpose**: Test audio duration extraction and display

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| D10.1 | Duration extraction m4a | Shows MM:SS format |
| D10.2 | Duration extraction mp3 | Shows MM:SS format |
| D10.3 | Long audio (>1hr) | Shows HH:MM:SS format |
| D10.4 | File size removed | No file size in UI |
| D10.5 | Duration in list view | All cards show duration |

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

### Suite 12: Gemini 2.0 Flash Tests (15 min)
**Purpose**: Test Gemini 2.0 Flash transcription model

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| G12.1 | Gemini model selection | Processes with Gemini 2.0 |
| G12.2 | Large prompt handling | 1M token prompts work |
| G12.3 | Base64 audio encoding | Audio properly encoded |
| G12.4 | Cost calculation | Shows 75% savings |
| G12.5 | Proof of work | Validation succeeds |

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

## Tools & Scripts

### Existing Scripts (in /tests)
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

---

**READY FOR APPROVAL**

Please review and confirm if you want to proceed with this test plan.