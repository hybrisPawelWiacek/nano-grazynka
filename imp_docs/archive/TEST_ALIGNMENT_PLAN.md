# Test Strategy Alignment Plan
**Created**: August 16, 2025  
**Author**: Claude (AI Assistant)  
**Status**: READY FOR EXECUTION  
**Goal**: Migrate all E2E tests from npm Playwright to MCP Playwright approach

## Executive Summary
Align all E2E testing to use Playwright MCP server as mandated in TEST_PLAN.md. This eliminates npm Playwright dependencies and creates a unified testing approach executable through Claude with MCP.

## Current State Analysis

### Existing Test Locations
1. **Backend E2E Tests** (`backend/src/tests/e2e/`)
   - `user-flow.test.ts` - 452 lines, uses npm Playwright, duplicates other tests

2. **Project E2E Tests** (`tests/e2e/`)
   - `anonymous-flow.spec.js` - 112 lines - Anonymous user journey
   - `main-flow.spec.js` - 212 lines - Complete transcription flow
   - `main-flow-simple.spec.js` - Simplified main flow
   - `library-flow.spec.js` - 362 lines - Library functionality
   - `multi-model-transcription.spec.js` - 243 lines - Model selection
   - `two-pass-transcription.spec.js` - 211 lines - Advanced options
   - `playwright.config.js` - Configuration file

3. **MCP Test Documentation** (`imp_docs/testing/`)
   - `PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md` - MCP test steps documented
   - `PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md` - MCP test steps documented
   - `TEST_PLAN.md` - Mandates MCP-only approach

## Phase 1: Cleanup & Archive (15 minutes)

### 1.1 Remove Duplicate Backend Tests
- [ ] Delete `backend/src/tests/e2e/user-flow.test.ts`
- [ ] Delete `backend/src/tests/e2e/` directory if empty

### 1.2 Archive npm-based Tests
- [ ] Create directory `tests/e2e/archive/npm-based/`
- [ ] Move `tests/e2e/*.spec.js` to archive:
  - [ ] `anonymous-flow.spec.js`
  - [ ] `main-flow.spec.js`
  - [ ] `main-flow-simple.spec.js`
  - [ ] `library-flow.spec.js`
  - [ ] `multi-model-transcription.spec.js`
  - [ ] `two-pass-transcription.spec.js`
- [ ] Move `tests/e2e/playwright.config.js` to archive
- [ ] Add `tests/e2e/archive/README.md` explaining why archived

## Phase 2: MCP Test Creation (3-4 hours)

### 2.1 Anonymous Flow Tests (30 min)
**Create**: `tests/scripts/test-anonymous-flow-mcp.js`
- [ ] Implement session generation test
- [ ] Implement free uses display (5/5 remaining)
- [ ] Implement file upload as anonymous
- [ ] Implement usage limit enforcement (after 5 uploads)
- [ ] Test session persistence across pages
- **Source**: `anonymous-flow.spec.js` (112 lines)
- **Reference**: `PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md`

### 2.2 Main Flow Tests (45 min)
**Create**: `tests/scripts/test-main-flow-mcp.js`
- [ ] Implement complete upload flow
- [ ] Language selection (Polish/English)
- [ ] Processing status monitoring
- [ ] Transcription result verification
- [ ] Summary generation
- [ ] Custom prompt testing
- **Source**: `main-flow.spec.js` (212 lines)

### 2.3 Library Flow Tests (45 min)
**Create**: `tests/scripts/test-library-flow-mcp.js`
- [ ] Navigate to library
- [ ] View list of notes
- [ ] Open individual note
- [ ] Delete note functionality
- [ ] Reprocess note
- [ ] Filter and search
- **Source**: `library-flow.spec.js` (362 lines)

### 2.4 Multi-Model Tests (30 min)
**Create**: `tests/scripts/test-multi-model-mcp.js`
- [ ] Advanced options visibility
- [ ] GPT-4o selection and features
- [ ] Gemini 2.0 selection and features
- [ ] Model switching
- [ ] Entity/Project context for Gemini
- **Source**: `multi-model-transcription.spec.js` (243 lines)

### 2.5 Two-Pass Transcription Tests (30 min)
**Create**: `tests/scripts/test-two-pass-mcp.js`
- [ ] Toggle advanced options
- [ ] Whisper prompt input
- [ ] Initial vs correction prompts
- [ ] Model-specific prompts
- **Source**: `two-pass-transcription.spec.js` (211 lines)

### 2.6 Logged-In User Tests (30 min)
**Create**: `tests/scripts/test-logged-in-flow-mcp.js`
- [ ] User registration
- [ ] Login flow
- [ ] Credits display and decrement
- [ ] Dashboard access
- [ ] Settings page
- [ ] Logout
- **Reference**: `PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md`

### 2.7 Master Test Runner (15 min)
**Create**: `tests/scripts/run-all-mcp-tests.js`
- [ ] Sequential test execution instructions
- [ ] Results aggregation format
- [ ] Error handling guidance
- [ ] Report generation template

## Phase 3: Documentation Updates (30 min)

### 3.1 Update Test README
- [ ] Update `tests/README.md`:
  - Remove npm Playwright references
  - Add MCP test execution guide
  - List all MCP test scripts
  - Explain archive structure

### 3.2 Update TEST_PLAN.md References
- [ ] Update test script references in Suite 4
- [ ] Add MCP test script mappings
- [ ] Update execution instructions

### 3.3 Create MCP Test Guide
- [ ] Create `tests/MCP_TEST_GUIDE.md`:
  - How to run MCP tests through Claude
  - Common MCP patterns
  - Troubleshooting guide
  - Best practices

## Phase 4: Validation (1 hour)

### 4.1 Test Each Script
- [ ] Run `test-anonymous-flow-mcp.js`
- [ ] Run `test-main-flow-mcp.js`
- [ ] Run `test-library-flow-mcp.js`
- [ ] Run `test-multi-model-mcp.js`
- [ ] Run `test-two-pass-mcp.js`
- [ ] Run `test-logged-in-flow-mcp.js`

### 4.2 Integration Check
- [ ] Verify no broken references in codebase
- [ ] Confirm Jest still runs unit tests
- [ ] Check CI/CD scripts don't reference old tests

## MCP Pattern Library

### Common npm → MCP Conversions

| npm Playwright | MCP Equivalent | Example |
|---------------|----------------|---------|
| `page.goto(url)` | `mcp__playwright__browser_navigate` | `{ url: "http://localhost:3100" }` |
| `page.click(selector)` | `mcp__playwright__browser_click` | `{ element: "button text", ref: "..." }` |
| `page.evaluate(() => {...})` | `mcp__playwright__browser_evaluate` | `{ function: "() => { return localStorage.getItem('key') }" }` |
| `fileChooser.setFiles(path)` | `mcp__playwright__browser_file_upload` | `{ paths: ["/path/to/file"] }` |
| `page.waitForSelector(sel)` | `mcp__playwright__browser_wait_for` | `{ text: "Processing complete" }` |
| `expect(el).toBeVisible()` | `mcp__playwright__browser_snapshot` + check | Take snapshot, verify element present |
| `page.selectOption(sel, val)` | `mcp__playwright__browser_select_option` | `{ element: "select", values: ["option"] }` |
| `page.fill(sel, text)` | `mcp__playwright__browser_type` | `{ element: "input", text: "value" }` |
| `page.reload()` | `mcp__playwright__browser_navigate` | Navigate to current URL again |
| `page.locator(sel).textContent()` | `mcp__playwright__browser_evaluate` | `{ function: "(el) => el.textContent", element: "..." }` |

### MCP Test Structure Template
```javascript
// tests/scripts/test-[name]-mcp.js

/**
 * MCP Test: [Test Name]
 * 
 * This test uses Playwright MCP server to test [functionality].
 * Execute through Claude with MCP enabled.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - Playwright MCP server enabled
 * - Test data in tests/test-data/
 */

// Test configuration
const TEST_URL = 'http://localhost:3100';
const TEST_FILE = '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a';

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate and prepare test environment",
    steps: [
      "1. Navigate to TEST_URL",
      "2. Clear localStorage if needed",
      "3. Verify page loaded"
    ]
  },
  // ... more scenarios
};

// Export for use in master runner
module.exports = { testScenarios };
```

## Success Criteria
- ✅ All npm Playwright tests archived
- ✅ All test functionality preserved in MCP tests
- ✅ No npm Playwright dependencies remain
- ✅ Tests executable through Claude MCP
- ✅ Documentation updated
- ✅ No impact on non-test code

## Risk Assessment
- **Low Risk**: Changes isolated to test directory
- **No Production Impact**: Tests are separate from application code
- **Rollback Plan**: Archived tests can be restored if needed

## Execution Notes
- Execute phases sequentially
- Test each MCP script before moving to next
- Update Memory MCP after each phase
- Approximately 5 hours total execution time
- Can pause between phases

## Dependencies
- Playwright MCP server must be enabled
- Application must be running for test execution
- Claude must have file system access for test data

---
**END OF PLAN**