# nano-Grazynka Test Suite

## Overview
This directory contains all test suites for the nano-Grazynka voice transcription application. Tests are organized by type and purpose, with a single comprehensive test runner as the primary entry point.

## Quick Start

### Running All Tests
```bash
# From project root directory:
node tests/scripts/run-comprehensive-tests.js
```

This runs the complete test suite including:
- Smoke Tests (health checks)
- Authentication Tests (user system)
- Backend API Tests (endpoints)
- Entity System Tests (projects & entities)

## Directory Structure

```
tests/
├── scripts/              # Test scripts and runners
│   ├── run-comprehensive-tests.js    # 🎯 MAIN TEST RUNNER
│   ├── run-all-mcp-tests.js         # MCP/Playwright coordinator
│   ├── test-*.js                    # Individual test files
│   └── archive/                     # Old/deprecated test runners
├── test-data/           # Test audio files
│   ├── zabka.m4a       # Polish audio (451KB)
│   ├── zabka.mp3       # Polish audio (MP3 format)
│   ├── test-audio.mp3  # English audio
│   └── test-file.txt   # Invalid file for error tests
├── e2e/                # End-to-end test specs
├── integration/        # Integration test suites
└── python/            # Python test scripts
```

## Test Runners

### Primary Test Runner
**`scripts/run-comprehensive-tests.js`**
- Complete test suite with 19 test cases
- Automatic dependency installation
- Colored output and detailed reporting
- Must be run from project root
- Returns exit code 0 (pass) or 1 (fail)

### Specialized Runners
**`scripts/run-all-mcp-tests.js`**
- Coordinates MCP/Playwright tests
- Provides instructions for Claude AI
- Used for UI automation testing

### Individual Test Scripts
Located in `scripts/` directory:
- `test-anonymous-upload.js` - Anonymous user flows
- `test-auth.js` - Authentication system
- `test-backend-api.js` - API endpoint validation
- `test-sessions.js` - Session management
- `test-entity-*.sh` - Entity system tests
- `test-multi-model-mcp.js` - Model selection tests

## Prerequisites

### Environment Setup
1. **Start Docker services**:
   ```bash
   docker compose up
   ```

2. **Verify services**:
   - Frontend: http://localhost:3100
   - Backend: http://localhost:3101
   - Database: SQLite at `/data/nano-grazynka.db`

3. **Install test dependencies** (if needed):
   ```bash
   cd tests/scripts
   npm install
   ```

## Running Specific Test Suites

### Smoke Tests Only
```bash
node tests/scripts/test-backend-api.js
```

### Authentication Tests
```bash
node tests/scripts/test-auth.js
```

### Entity System Tests
```bash
./tests/scripts/test-entity-project-api.sh
```

### MCP/Playwright Tests
```bash
node tests/scripts/run-all-mcp-tests.js
```

## Test Data

All test files are in `test-data/` directory:
- **zabka.m4a**: Polish audio file containing "Microsoft" mention
- **zabka.mp3**: Same content in MP3 format
- **test-audio.mp3**: English audio for basic tests
- **test-file.txt**: Text file for invalid upload tests

**Important**: Always run tests from project root to ensure correct path resolution.

## Common Issues

### 1. File Not Found Errors
- **Cause**: Running from wrong directory
- **Fix**: Always run from project root, not from `tests/` or `tests/scripts/`

### 2. Docker Not Running
- **Symptoms**: Connection refused errors
- **Fix**: Run `docker compose up` first

### 3. Backend Needs Restart
- **Symptoms**: 404 errors on known endpoints
- **Fix**: `docker compose restart backend`

### 4. SQLite Disk I/O Errors
- **Symptoms**: 500 errors during operations
- **Fix**: `docker compose restart backend`

## Test Results

Test results are saved to:
- Console output (colored for readability)
- `imp_docs/testing/results/` for historical tracking

### Success Criteria
- **Deployment Ready**: ≥90% pass rate
- **Needs Work**: 70-89% pass rate
- **Critical Issues**: <70% pass rate

## Writing New Tests

1. Add test file to `scripts/` directory
2. Use consistent naming: `test-{feature}.js`
3. Include in comprehensive test runner if applicable
4. Update this README with new test information

## Archived Test Runners

The following test runners have been archived to `scripts/archive/`:
- `comprehensive-test.js` - Duplicate of main runner
- `run-tests.sh` - Outdated bash version
- `run-all-tests.sh` - Redundant bash runner

**Do not use archived runners** - they contain outdated paths and configurations.

## Support

For test-related issues:
1. Check this README first
2. Review TEST_PLAN.md for detailed test specifications
3. Check recent test results in `imp_docs/testing/results/`