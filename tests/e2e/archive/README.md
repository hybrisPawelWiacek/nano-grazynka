# Archived NPM-based Playwright Tests

## Archival Date
August 16, 2025

## Reason for Archival
These tests were archived as part of the Test Strategy Alignment Plan to migrate from npm-based Playwright to MCP Playwright approach.

### Background
- **Previous Approach**: Tests used npm-installed Playwright with traditional JavaScript test runners
- **New Approach**: Tests use Playwright MCP server executed through Claude with MCP tools
- **Mandate**: TEST_PLAN.md mandates MCP-only testing approach to eliminate npm dependencies

### Archived Files
- `anonymous-flow.spec.js` - Anonymous user journey tests
- `main-flow.spec.js` - Complete transcription flow tests
- `main-flow-simple.spec.js` - Simplified main flow tests
- `library-flow.spec.js` - Library functionality tests
- `multi-model-transcription.spec.js` - Model selection tests
- `two-pass-transcription.spec.js` - Advanced transcription options tests
- `playwright.config.js` - Playwright configuration

### Migration Status
All functionality from these tests has been preserved in new MCP test scripts located in `tests/scripts/`:
- `test-anonymous-flow-mcp.js`
- `test-main-flow-mcp.js`
- `test-library-flow-mcp.js`
- `test-multi-model-mcp.js`
- `test-two-pass-mcp.js`
- `test-logged-in-flow-mcp.js`

### Rollback Instructions
If needed, these tests can be restored by moving them back to `tests/e2e/` and reinstalling npm Playwright dependencies. However, this would contradict the MCP-only testing strategy.