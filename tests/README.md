# nano-Grazynka Test Suite

## 🚨 CRITICAL: MCP-Only Testing Approach

**As of August 16, 2025, ALL E2E tests use Playwright MCP Server exclusively.**

### ✅ USE ONLY
- **Playwright MCP server tools** (`mcp__playwright__*`)
- **MCP test scripts** in `tests/scripts/*-mcp.js`
- **Claude with MCP enabled** for test execution

### ❌ DO NOT USE (ARCHIVED)
- npm Playwright packages (`@playwright/test`)
- npm install playwright commands
- .spec.js files (moved to `tests/e2e/archive/npm-based/`)

## Overview
Comprehensive test suite for nano-Grazynka voice transcription application using MCP-based testing approach.

## Quick Start

### Run All MCP Tests Through Claude
```javascript
// In Claude with MCP enabled:
node tests/scripts/run-all-mcp-tests.js

// This will show execution plan for all 56 test scenarios
// across 6 test files
```

### Run Specific Test Suites

#### Core Tests (Priority 1)
```javascript
// Run these first - essential functionality
- test-anonymous-flow-mcp.js (7 scenarios)
- test-main-flow-mcp.js (10 scenarios)
```

#### Advanced Tests (Priority 2)
```javascript
// Extended functionality
- test-library-flow-mcp.js (11 scenarios)
- test-multi-model-mcp.js (11 scenarios)
```

#### Extended Tests (Priority 3)
```javascript
// Nice-to-have features
- test-two-pass-mcp.js (8 scenarios)
- test-logged-in-flow-mcp.js (9 scenarios)
```

## Test Structure

```
tests/
├── scripts/                    # Active MCP test scripts
│   ├── run-all-mcp-tests.js   # Master test runner
│   ├── test-anonymous-flow-mcp.js
│   ├── test-main-flow-mcp.js
│   ├── test-library-flow-mcp.js
│   ├── test-multi-model-mcp.js
│   ├── test-two-pass-mcp.js
│   └── test-logged-in-flow-mcp.js
├── e2e/
│   └── archive/               # Archived npm-based tests
│       └── npm-based/         # Old .spec.js files (reference only)
├── test-data/                 # Test audio files
│   ├── zabka.m4a             # Polish sample
│   ├── test-audio.mp3        # English sample
│   └── test-file.txt         # Invalid file for error testing
├── integration/               # Integration tests  
├── python/                    # Python test scripts
└── debug-archive/             # Archived debug scripts
```

## MCP Test Execution Guide

### Prerequisites
1. **Application running**: `docker compose up`
2. **Playwright MCP enabled**: In Claude settings
3. **Test data available**: Files in `tests/test-data/`

### Running Tests with Claude

#### Step 1: Open Master Runner
```bash
node tests/scripts/run-all-mcp-tests.js
```

#### Step 2: Execute Test Scenarios
Each test file contains a `testScenarios` object with MCP tool sequences:

```javascript
// Example from test-anonymous-flow-mcp.js
testScenarios: {
  setup: {
    description: "Navigate to homepage",
    tools: [
      "mcp__playwright__browser_navigate",
      "mcp__playwright__browser_evaluate"
    ]
  },
  sessionGeneration: {
    description: "Verify session ID created",
    tools: ["mcp__playwright__browser_evaluate"]
  }
  // ... more scenarios
}
```

#### Step 3: Document Results
Track each scenario result:
- ✅ **PASS**: Feature works as expected
- ⚠️ **PARTIAL**: Some steps fail
- ❌ **FAIL**: Critical functionality broken
- ⏭️ **SKIP**: Blocked by earlier failure

## MCP Tool Reference

### Common MCP Tools for Testing

| Tool | Purpose | Example |
|------|---------|---------|
| `browser_navigate` | Navigate to URL | `{ url: "http://localhost:3100" }` |
| `browser_click` | Click element | `{ element: "button", ref: "..." }` |
| `browser_file_upload` | Upload file | `{ paths: ["/path/to/file"] }` |
| `browser_evaluate` | Run JS in browser | `{ function: "() => localStorage.getItem('key')" }` |
| `browser_wait_for` | Wait for condition | `{ text: "Processing complete" }` |
| `browser_snapshot` | Capture state | Get accessibility tree |
| `browser_type` | Enter text | `{ element: "input", text: "value" }` |
| `browser_select_option` | Select dropdown | `{ element: "select", values: ["option"] }` |

## Test Categories

### 1. Anonymous User Tests
**File**: `test-anonymous-flow-mcp.js`
- Session generation and persistence
- Free uses counter (5/5)
- Upload limits enforcement
- Session tracking across pages

### 2. Main Flow Tests
**File**: `test-main-flow-mcp.js`
- Complete upload to transcription
- Language selection (Polish/English)
- Summary generation
- Custom prompt handling
- Error scenarios

### 3. Library Tests
**File**: `test-library-flow-mcp.js`
- View all notes
- Search functionality
- Filter by language
- Sort by date
- Delete notes
- Reprocess transcriptions

### 4. Multi-Model Tests
**File**: `test-multi-model-mcp.js`
- GPT-4o selection
- Gemini 2.0 Flash selection
- Template variables for Gemini
- Entity/Project context
- Token limit handling

### 5. Two-Pass Tests
**File**: `test-two-pass-mcp.js`
- Advanced options toggle
- Initial whisper prompt
- Correction prompt
- Model-specific prompts

### 6. Authentication Tests
**File**: `test-logged-in-flow-mcp.js`
- User registration
- Login flow
- Credits tracking
- Dashboard access
- Logout functionality

## Test Data

### Available Test Files
```
tests/test-data/
├── zabka.m4a           # Polish audio (451KB) - main test file
├── test-audio.mp3      # English sample
└── test-file.txt       # Invalid file for error testing
```

### File Paths for MCP Tests
```javascript
const TEST_FILES = {
  polish: '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a',
  english: '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/test-audio.mp3',
  invalid: '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/test-file.txt'
};
```

## Maintenance

### Cleanup Old Test Data
```bash
./scripts/cleanup-test-data.sh
```

### Check Test Coverage
```bash
# View all test scenarios
node tests/scripts/run-all-mcp-tests.js

# Total: 56 scenarios across 6 files
```

## Migration from npm Playwright

### What Changed
- **Before**: npm-based Playwright with .spec.js files
- **After**: MCP-based approach with documented scenarios

### Archived Files
All npm-based tests are archived in `tests/e2e/archive/npm-based/`:
- `anonymous-flow.spec.js`
- `main-flow.spec.js`
- `library-flow.spec.js`
- `multi-model-transcription.spec.js`
- `two-pass-transcription.spec.js`
- `playwright.config.js`

### Rollback (if needed)
```bash
# Restore npm-based tests
cp -r tests/e2e/archive/npm-based/*.spec.js tests/e2e/
cp tests/e2e/archive/npm-based/playwright.config.js tests/e2e/
```

## Troubleshooting

### Common Issues

**Session Errors**
```javascript
// Check session in browser
mcp__playwright__browser_evaluate
  function: () => localStorage.getItem('anonymousSessionId')
```

**Upload Failures**
```javascript
// Verify file path exists
ls -la /path/to/test/file
```

**401 Errors**
```javascript
// Check headers in network requests
mcp__playwright__browser_network_requests
// Look for x-session-id header
```

**Timeouts**
```javascript
// Increase wait times for AI processing
mcp__playwright__browser_wait_for
  time: 10  // Increase from 5 to 10 seconds
```

## Test Results & Documentation

- [Test Plan](../imp_docs/testing/TEST_PLAN.md) - Overall test strategy
- [Test Alignment Plan](../imp_docs/planning/TEST_ALIGNMENT_PLAN.md) - MCP migration plan
- [Playwright MCP Playbook](../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md) - Generic MCP patterns and tool reference
- [Anonymous Happy Path](../imp_docs/testing/PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md) - Anonymous user test implementation
- [Logged-In Happy Path](../imp_docs/testing/PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md) - Authenticated user test implementation
- [Test Results](../imp_docs/testing/TEST_RESULTS_2025_08_13.md) - Latest execution report

## Contributing

When adding new MCP tests:
1. Create test file: `test-[feature]-mcp.js`
2. Follow existing pattern with `testScenarios` object
3. Include MCP tool sequences
4. Add to master runner: `run-all-mcp-tests.js`
5. Update this README

## Support

For MCP testing questions:
- Review [Playwright MCP Playbook](../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md)
- Check example patterns in existing test files
- Reference Playwright MCP documentation

---
**Last Updated**: August 16, 2025
**Migration Status**: ✅ Complete - All E2E tests now use MCP approach