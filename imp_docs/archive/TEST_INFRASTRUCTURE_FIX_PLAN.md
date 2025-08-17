# Test Infrastructure Fix Plan
**Created**: August 17, 2025
**Priority**: P1 - Critical for deployment validation

## Executive Summary
The test infrastructure is broken due to missing dependencies, archived scripts, and structural issues. This plan provides a systematic approach to restore full testing capabilities.

## Current State Analysis

### Problems Identified
1. **Missing Dependencies**: No package.json in tests/scripts directory
2. **Archived Scripts**: 28 test scripts moved to tests/scripts/archive/ without replacement
3. **Permission Issues**: Shell scripts lack execute permissions
4. **Path Issues**: Scripts use incorrect relative paths
5. **MCP Limitations**: Playwright MCP cannot handle file uploads properly

### Failed Scripts Requiring Fixes
Based on test execution, these scripts failed and needed workarounds:

| Script | Issue | Workaround Used |
|--------|-------|-----------------|
| test-anonymous-upload.js | Not in scripts dir (archived) | Used curl commands |
| test-backend-api.js | Missing dependencies | Created new script, still failed |
| test-sessions.js | Script doesn't exist | Manual curl testing |
| test-entity-project-api.sh | Permission denied | Manual API calls |
| test-entity-simple.sh | Execution failed | Manual testing |
| comprehensive-test.js | Missing npm modules | N/A - couldn't run |

### Working Components
- test-auth.js (5/6 tests pass) - One of the few working scripts
- Direct curl commands - Most reliable approach
- Playwright MCP for UI navigation - Works for UI testing
- SQLite direct queries - Database verification works
- test-utils.js helper functions - Utilities are functional

## Fix Implementation Plan

### Phase 1: Restore Test Infrastructure (30 min)

#### 1.1 Create package.json for tests/scripts
```bash
cd tests/scripts
```

Create `package.json`:
```json
{
  "name": "nano-grazynka-test-scripts",
  "version": "1.0.0",
  "description": "Test scripts for nano-Grazynka",
  "scripts": {
    "test:all": "./run-all-tests.sh",
    "test:backend": "node test-backend-api.js",
    "test:auth": "node test-auth.js",
    "test:entity": "./test-entity-project-api.sh",
    "test:anonymous": "node test-anonymous-upload.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "form-data": "^4.0.4",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}
```

#### 1.2 Install Dependencies
```bash
cd tests/scripts
npm install
```

#### 1.3 Fix Execute Permissions
```bash
chmod +x *.sh
```

### Phase 2: Restore Critical Test Scripts (45 min)

#### 2.1 Restore from Archive
The scripts are archived in `tests/scripts/archive/`. Priority scripts to restore:

1. `test-anonymous-upload.js` - Core functionality for anonymous uploads
2. `test-anonymous-limit.js` - Usage tracking and limits
3. `test-library-flow-mcp.js` - Library functionality testing
4. `test-logged-in-flow-mcp.js` - Authenticated user flow
5. `test-entity-aware-transcription-mcp.js` - Entity system testing
6. `test-multi-model-mcp.js` - Multi-model support testing
7. `test-endpoints.sh` - API endpoint testing

```bash
# Navigate to scripts directory
cd tests/scripts

# Restore critical scripts from archive
cp archive/test-anonymous-upload.js .
cp archive/test-anonymous-limit.js .
cp archive/test-library-flow-mcp.js .
cp archive/test-logged-in-flow-mcp.js .
cp archive/test-entity-aware-transcription-mcp.js .
cp archive/test-multi-model-mcp.js .
cp archive/test-endpoints.sh .

# Also restore helper scripts
cp archive/check-anonymous-sessions.js .
cp archive/run-all-mcp-tests.js .
```

#### 2.2 Fix Path Issues in Scripts
Update all restored scripts to use correct paths:
- Change `../test-data/` to `../test-data/`
- Change `../../backend/` to `../../backend/`
- Ensure API_BASE = `http://localhost:3101/api`

### Phase 3: Create Missing Test Scripts (60 min)

#### 3.1 test-backend-api.js (Enhanced)
```javascript
#!/usr/bin/env node
const { runBackendTests } = require('./test-utils');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function testBackendAPI() {
  const results = [];
  const API_BASE = 'http://localhost:3101/api';
  
  // Test suite implementation
  // Use test-utils.js helpers
  // Include all B3.x tests from TEST_PLAN.md
  
  return results;
}

if (require.main === module) {
  testBackendAPI()
    .then(results => {
      console.log('Test Results:', results);
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(console.error);
}

module.exports = { testBackendAPI };
```

#### 3.2 test-sessions.js (New)
```javascript
#!/usr/bin/env node
const { generateSessionId, createClient } = require('./test-utils');

async function testSessions() {
  // Test anonymous sessions
  // Test session persistence
  // Test session migration
  // Test usage tracking
}

module.exports = { testSessions };
```

#### 3.3 test-entity-project-api.sh (Fixed)
```bash
#!/bin/bash

# Entity Project System API Tests
API_BASE="http://localhost:3101/api"
TEST_DATA_DIR="../test-data"

echo "=========================================="
echo "ENTITY PROJECT SYSTEM API TESTS"
echo "=========================================="

# Test EP7A.1-10 from TEST_PLAN.md
# Use proper error handling
# Generate test report

exit $EXIT_CODE
```

### Phase 4: Create Hybrid Test Runner (30 min)

#### 4.1 Create test-runner.js
Combines multiple test approaches:
```javascript
const { spawn } = require('child_process');
const axios = require('axios');

class TestRunner {
  constructor() {
    this.results = [];
  }
  
  async runCurlTest(name, command) {
    // Execute curl command and parse result
  }
  
  async runNodeScript(name, scriptPath) {
    // Execute Node.js test script
  }
  
  async runShellScript(name, scriptPath) {
    // Execute shell script with proper permissions
  }
  
  async runAPITest(name, config) {
    // Direct axios API call
  }
  
  generateReport() {
    // Create comprehensive test report
  }
}
```

### Phase 5: Implement Fallback Strategies (20 min)

#### 5.1 File Upload Fallback
Since Playwright MCP can't handle file uploads:
```javascript
// upload-helper.js
async function uploadViaAPI(filePath, sessionId, projectId = null) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('userId', 'anonymous');
  if (projectId) form.append('projectId', projectId);
  
  return axios.post(`${API_BASE}/voice-notes/upload`, form, {
    headers: {
      ...form.getHeaders(),
      'x-session-id': sessionId
    }
  });
}
```

#### 5.2 Create MCP-Compatible Tests
```javascript
// test-frontend-mcp.js
// Uses Playwright MCP for navigation
// Falls back to API for uploads
// Validates UI state after operations
```

### Phase 6: Documentation and CI Integration (15 min)

#### 6.1 Update Documentation
- Create tests/README.md with test execution guide
- Document each test script's purpose
- Add troubleshooting section

#### 6.2 Create GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd tests/scripts && npm install
      - run: docker compose up -d
      - run: npm run test:all
```

## Execution Timeline

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| 1. Infrastructure | 30 min | P1 | None |
| 2. Restore Scripts | 45 min | P1 | Phase 1 |
| 3. Create Scripts | 60 min | P1 | Phase 1 |
| 4. Hybrid Runner | 30 min | P2 | Phase 1-3 |
| 5. Fallbacks | 20 min | P2 | Phase 1-3 |
| 6. Documentation | 15 min | P3 | All phases |

**Total Time**: ~3.5 hours

## Success Criteria

### Must Have (P1)
- [ ] All scripts have required dependencies installed
- [ ] Core test scripts (upload, auth, entity) working
- [ ] Shell scripts have execute permissions
- [ ] API tests can run independently

### Should Have (P2)
- [ ] Hybrid test runner operational
- [ ] File upload fallback implemented
- [ ] MCP-compatible test suite

### Nice to Have (P3)
- [ ] Full CI/CD integration
- [ ] Performance test suite
- [ ] Automated regression tests

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scripts still fail after fixes | Maintain curl command fallbacks |
| MCP limitations persist | Use API-only testing for uploads |
| Path issues continue | Use absolute paths in CI environment |
| Dependencies conflict | Pin versions in package.json |

## Rollback Plan
If fixes introduce new issues:
1. Keep archive directory intact
2. Document working curl commands
3. Maintain manual test procedures
4. Use Playwright MCP for UI-only tests

## Post-Implementation Validation
1. Run each test script individually
2. Execute full test suite via runner
3. Verify in fresh Docker environment
4. Test in CI pipeline
5. Document any remaining issues

---

**Ready for Implementation**
This plan will restore full testing capabilities and provide multiple fallback strategies for robust testing.