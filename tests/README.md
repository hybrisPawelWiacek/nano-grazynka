# nano-Grazynka Test Suite

## 🚨 CRITICAL: Use Playwright MCP Server for ALL E2E Testing

**MANDATORY REQUIREMENTS:**
- ✅ **USE**: Playwright MCP server tools (`mcp__playwright__*`)
- ❌ **DO NOT**: Install npm Playwright packages (`@playwright/test`)
- ❌ **DO NOT**: Run `npm install playwright` or `npx playwright`
- ❌ **DO NOT**: Create .spec.js files that require('@playwright/test')

**The Playwright MCP server is already running in Docker and provides all browser automation through MCP tools.**

## Overview
Comprehensive test suite for the nano-Grazynka voice transcription application using Playwright MCP for E2E testing.

## Quick Start

### Run All Tests
```bash
cd tests/scripts
./run-all-tests.sh
```

### Run Specific Test Suites

#### Smoke Tests (Quick validation)
```bash
curl http://localhost:3101/health
node ../test-anonymous-upload.js
```

#### E2E Tests (Playwright MCP)
```yaml
# NO npm install needed! Use MCP tools directly:
mcp__playwright__browser_navigate(url: "http://localhost:3100")
mcp__playwright__browser_click(element: "Upload button")
mcp__playwright__browser_file_upload(paths: ["test-data/zabka.m4a"])
mcp__playwright__browser_wait_for(time: 5)
mcp__playwright__browser_snapshot()
```

#### Integration Tests
```bash
cd tests
npm run test:integration
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
├── integration/            # Integration tests  
├── performance/            # Performance tests
├── python/                 # Python test scripts
│   ├── backend-api-test.py
│   ├── edge-cases-test.py
│   ├── integration-test.py
│   └── performance-test.py
├── scripts/                # Active test scripts
│   ├── run-all-tests.sh
│   ├── test-endpoints.sh
│   ├── test-anonymous-upload.js
│   ├── test-anonymous-limit.js
│   └── test-reprocess.js
├── test-data/              # Test audio files
│   ├── zabka.m4a
│   ├── test-audio.mp3
│   └── test-file.txt
├── debug-archive/          # Archived debug scripts (reference only)
└── unit/                   # Unit tests
    ├── backend/
    └── frontend/
```

## Maintenance

### Automated Cleanup
Run the cleanup script to remove old test data:
```bash
./scripts/cleanup-test-data.sh
```

This script will:
- Remove uploads older than 7 days
- Clean old database WAL files
- Remove test results older than 30 days

### Python Tests
Python test scripts are located in `tests/python/`:
- `backend-api-test.py` - Backend API testing
- `integration-test.py` - Integration testing
- `performance-test.py` - Performance testing
- `edge-cases-test.py` - Edge case testing

Run Python tests:
```bash
cd tests/python
python3 backend-api-test.py
python3 integration-test.py
```

## Test Categories

### 1. Smoke Tests (L1)
Quick validation that system is operational:
- Backend health check
- Frontend loads
- Database connection
- Basic upload

### 2. API Tests (L2)
Direct API endpoint testing:
- Upload endpoints
- Processing endpoints
- Authentication
- Error handling

### 3. E2E Tests (L3)
Full user journey testing with **Playwright MCP Server**:
- Anonymous user flow (tested and working ✅)
- File upload via UI (fixed authentication ✅)
- Status tracking (now working with optionalAuth ✅)
- Error scenarios

### 4. Integration Tests (L4)
Cross-component testing:
- Upload to transcription flow
- Database operations
- Session management

## Test Setup

### Using Playwright MCP (NO INSTALLATION NEEDED)
```yaml
# Playwright MCP is already running!
# Access it through MCP tools:
- mcp__playwright__browser_navigate
- mcp__playwright__browser_click
- mcp__playwright__browser_type
- mcp__playwright__browser_file_upload
- mcp__playwright__browser_snapshot
- mcp__playwright__browser_wait_for

# NO npm install required!
# NO npx playwright install required!
```

## Fixed Issues ✅

### ✅ FIXED - Anonymous Session Management
1. **Solution Applied**:
   - Changed backend to use `optionalAuthMiddleware`
   - GET `/api/voice-notes/:id` now supports anonymous
   - POST `/api/voice-notes/:id/process` supports anonymous
   - Tested with Playwright MCP - working!

### 🟡 Major
- No user-friendly error messages for auth failures
- Console errors exposed to users

### 🟢 Minor
- Dev tools badge showing issues
- React DevTools warnings

## Test Coverage Status

| Category | Coverage | Status |
|----------|----------|--------|
| Health Endpoints | ✅ 100% | Working |
| Anonymous Upload | ✅ 100% | Fixed & Working |
| File Processing | ✅ 80% | API works |
| UI Components | ❌ 30% | Needs auth fix |
| Error Handling | ✅ 70% | Good coverage |
| Performance | ⏸️ 0% | Not tested |

## Running Legacy Tests

### Python Tests (being migrated to JS)
```bash
python3 backend_api_test.py      # Backend API tests
python3 integration_test.py      # Integration scenarios
python3 performance_test.py      # Performance benchmarks
python3 edge_cases_test.py       # Edge case handling
```

## Test Data

### Available Test Files
- `test-data/zabka.m4a` - Polish audio sample (451KB)
- `test-data/test-audio.mp3` - English audio sample (11 bytes)

### Creating Additional Test Data
```bash
# Large file for stress testing
ffmpeg -f lavfi -i anoisesrc=d=60:c=pink -t 60 test-data/large-file.m4a

# Corrupted file for error testing
echo "not audio" > test-data/corrupt.m4a
```

## Docker Testing

### Running Tests in Container
```bash
# Backend unit tests
docker exec nano-grazynka_cc-backend-1 npm test

# Database queries
docker exec nano-grazynka_cc-backend-1 npx prisma studio

# Check logs
docker compose logs -f backend
```

## CI/CD Integration (Future)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker compose up -d
      - name: Run tests
        run: |
          cd tests
          npm install
          npm run test:all
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: tests/test-results/
```

## Test Results & Documentation

- [Test Results](../imp_docs/testing/TEST_RESULTS_2025_08_13.md) - Latest execution report
- [Test Plan](../imp_docs/testing/TEST_PLAN.md) - Comprehensive test strategy

## Contributing

When adding new tests:
1. Place in appropriate category folder (e2e/, integration/, etc.)
2. Follow naming: `*.spec.js` for E2E, `*.test.js` for unit/integration
3. Update this README with new test info
4. Run full suite before committing: `./scripts/run-all-tests.sh`

## Troubleshooting

### Common Issues

**401 Errors**: Anonymous session not working
- Check `x-session-id` header is sent
- Verify localStorage has `anonymousSessionId`

**E2E Testing**: 
```text
USE PLAYWRIGHT MCP SERVER!
Do NOT install npm playwright packages.
Access through mcp__playwright__* tools.
```

**Docker Not Running**:
```bash
docker compose up -d
```

**Tests Timeout**: Increase timeout in config
```javascript
// playwright.config.js
timeout: 120000 // 2 minutes
```