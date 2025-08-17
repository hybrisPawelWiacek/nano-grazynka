# nano-Grazynka Test Infrastructure

**Last Updated**: August 17, 2025  
**Status**: Reorganized - Active scripts separated from archived

## Test Organization

```
tests/
├── scripts/              # Active test scripts (9 files)
│   ├── archive/          # Deprecated scripts (32 files)
│   ├── run-tests.sh      # Main test orchestrator
│   ├── run-all-tests.sh  # Legacy runner (being phased out)
│   ├── test-backend-api.js
│   ├── test-utils.js
│   ├── test-auth.js      # Stub - to be implemented
│   ├── test-sessions.js  # Stub - to be implemented
│   ├── test-entity-project-api.sh
│   ├── test-entity-project-authenticated.sh
│   └── test-entity-simple.sh
├── test-data/            # Test audio and data files
│   ├── zabka.m4a         # Polish audio (451KB)
│   ├── test-audio.mp3    # English audio
│   └── test-file.txt     # Invalid file for error testing
├── debug-archive/        # Debug scripts (15 files)
├── e2e/                  # E2E test specifications
│   └── archive/          # Old npm Playwright tests
├── integration/          # Integration test specs
├── unit/                 # Unit test specs
└── python/               # Python test scripts (legacy)
```

## Active Test Infrastructure

### Core Test Runners (2 files)

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-tests.sh` | Main test orchestrator with pre-flight checks | `./tests/scripts/run-tests.sh` |
| `run-all-tests.sh` | Legacy test runner (references old scripts) | Being phased out |

### Backend API Tests (4 files)

| Script | Purpose | Coverage |
|--------|---------|----------|
| `test-backend-api.js` | Core backend API tests | Upload, processing, CRUD operations |
| `test-utils.js` | Shared test utilities | Session management, API helpers |
| `test-auth.js` | Authentication tests (stub) | To be implemented |
| `test-sessions.js` | Session management tests (stub) | To be implemented |

### Entity/Project System Tests (3 files)

| Script | Purpose | Coverage |
|--------|---------|----------|
| `test-entity-project-api.sh` | Entity-project API tests | Backend entity system |
| `test-entity-project-authenticated.sh` | Authenticated entity tests | User-specific operations |
| `test-entity-simple.sh` | Basic entity operations | Simple CRUD for entities |

## Archived Scripts (32 files)

Located in `/tests/scripts/archive/`:

### MCP Test Scripts (7 files)
Replaced by direct Playwright MCP tool usage:
- test-anonymous-flow-mcp.js
- test-entity-aware-transcription-mcp.js  
- test-library-flow-mcp.js
- test-logged-in-flow-mcp.js
- test-main-flow-mcp.js
- test-multi-model-mcp.js
- test-two-pass-mcp.js

### Old Implementation Scripts (25 files)
Outdated or replaced functionality:
- Anonymous tests: test-anonymous-limit.js, test-anonymous-upload.js
- Custom prompt tests: test-custom-prompt*.js (4 files)
- Gemini tests: test-gemini-*.js (3 files), test-webapp-gemini.js
- Other: test-hot-reload.js, test-library-abort.js, test-mp3-upload.js, etc.

## Testing Approach

### 1. Backend API Testing
Use Node.js scripts with proper session management:
```bash
node tests/scripts/test-backend-api.js
```

### 2. Frontend E2E Testing  
Use Playwright MCP tools directly in Claude (no npm packages):
- Navigate: `mcp__playwright__browser_navigate`
- Interact: `mcp__playwright__browser_click`
- Validate: `mcp__playwright__browser_snapshot`

### 3. Entity System Testing
Run shell scripts for comprehensive testing:
```bash
./tests/scripts/test-entity-project-api.sh
./tests/scripts/test-entity-project-authenticated.sh
```

## Environment Setup

### Prerequisites
```bash
# 1. Start Docker environment
docker compose up

# 2. Verify services
Frontend: http://localhost:3100
Backend: http://localhost:3101
Database: /data/nano-grazynka.db
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| SQLite I/O errors | `docker compose restart backend` |
| 404 on routes after code changes | Restart backend container |
| Session ID mismatches | Use test-utils.js helpers |
| File upload issues with Playwright MCP | Use API-based uploads instead |

## Running Tests

### Quick Validation
```bash
# Test backend API
node tests/scripts/test-backend-api.js

# Test entity system
./tests/scripts/test-entity-project-api.sh
```

### Full Test Suite
```bash
# Run all active tests with reporting
./tests/scripts/run-tests.sh
```

### Frontend Testing with MCP
In Claude with MCP enabled:
1. Navigate to http://localhost:3100
2. Use Playwright MCP tools for interactions
3. Validate with snapshots and evaluations

## Test Data Files

Located in `/tests/test-data/`:
- `zabka.m4a` - Polish audio containing "Microsoft" mention
- `test-audio.mp3` - English audio sample
- `test-file.txt` - Invalid file for error testing

## Debug Archive (15 files)

Located in `/tests/debug-archive/`:
Debug scripts preserved for reference but not part of active testing:
- Database debugging: check-db-schema.js, test-db-*.js
- Model testing: test-gpt4o-transcribe.js, test-multi-model-*.js
- API debugging: test-403-fix.js, test-openrouter-fix.js
- Direct testing: test-prisma-*.js, test-whisper-prompt.js

## Other Test Directories

### E2E Archive
`/tests/e2e/archive/npm-based/` - Old Playwright npm tests (deprecated)

### Integration Tests
`/tests/integration/` - Integration test specifications

### Unit Tests  
`/tests/unit/` - Unit test specifications

### Python Tests
`/tests/python/` - Legacy Python test scripts

## Future Improvements

1. **Implement Missing Tests**
   - Complete test-auth.js implementation
   - Complete test-sessions.js implementation

2. **Consolidate Test Runners**
   - Retire run-all-tests.sh
   - Update run-tests.sh to be comprehensive

3. **Clean Up Legacy Code**
   - Remove Python tests once fully migrated
   - Archive additional obsolete scripts

4. **Add New Test Suites**
   - Performance benchmarking
   - Load testing
   - Security testing

## Maintenance Tasks

### Weekly Cleanup
```bash
# Clean test uploads
rm -f data/uploads/test-*

# Clean WAL files
rm -f data/*.db-wal data/*.db-shm

# Check for new obsolete scripts
ls -la tests/scripts/*.js | grep -v -E "(test-utils|test-backend-api|test-auth|test-sessions)"
```

### Before Major Releases
1. Run full test suite
2. Archive any newly obsolete scripts
3. Update this README
4. Document any new test patterns

---

**Total Active Scripts**: 9  
**Total Archived Scripts**: 32  
**Test Coverage**: Backend API ✅ | Frontend MCP ✅ | Entity System ✅