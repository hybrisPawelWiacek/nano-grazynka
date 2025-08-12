# Test Suite Reorganization Plan

## Current Structure Analysis

### Files to Archive (Old/Redundant)
```
archive/
  ✓ debug-upload.js - Old debugging script
  ✓ final-test.js - Outdated, path issues
  ✓ final_test.py - Duplicate of JS version
  ✓ simple-upload.js - Basic version, superseded
  ✓ test-upload.html - HTML test, not needed
  ✓ test-upload.js - Old version
  ✓ test-upload.mjs - Module version, not used
  ✓ test_upload.js - Duplicate
  ✓ test_upload.py - Python duplicate
  ✓ upload-test.js - Another duplicate
  ✓ upload-zabka.js - Specific test, outdated
  ✓ upload_test.py - Python version
  ✓ upload_zabka.py - Polish specific, old
```

### Files to Update
```
- backend_api_test.py - Add auth headers support
- test-anonymous-upload.js - Working, keep as reference
- test-anonymous-limit.js - Update for current API
- verify_fix.js - Update for current endpoints
- test-validation.py - Add sessionId support
```

### Files to Keep As-Is
```
- zabka.m4a - Test audio file (Polish)
- test-audio.mp3 - Test audio file (English)
- test-endpoints.sh - Comprehensive bash tests
- test-reprocess.js - Reprocessing tests
- test-reprocess-simple.sh - Simple reprocess test
```

### Files to Create
```
- e2e/
  - anonymous-flow.spec.js - Complete anonymous user journey
  - auth-flow.spec.js - Login/register/logout tests
  - upload-flow.spec.js - File upload scenarios
  - library-view.spec.js - Library and search tests
  - error-handling.spec.js - Error scenarios
  
- integration/
  - api-integration.test.js - API contract tests
  - database-integration.test.js - DB operations
  - file-processing.test.js - Upload to completion
  
- performance/
  - load-test.js - Concurrent uploads
  - stress-test.js - Large file handling
  - benchmark.js - Response time measurements
  
- unit/
  - backend/
    - use-cases.test.js
    - repositories.test.js
  - frontend/
    - components.test.js
    - hooks.test.js
```

## Proposed New Structure

```
tests/
├── README.md                     # Test documentation
├── test-data/                    # Test files
│   ├── zabka.m4a
│   ├── test-audio.mp3
│   └── large-file.m4a (to create)
│
├── e2e/                         # Playwright E2E tests
│   ├── playwright.config.js
│   ├── anonymous-flow.spec.js
│   ├── auth-flow.spec.js
│   ├── upload-flow.spec.js
│   ├── library-view.spec.js
│   └── error-handling.spec.js
│
├── integration/                 # Integration tests
│   ├── api-integration.test.js
│   ├── database-integration.test.js
│   └── file-processing.test.js
│
├── performance/                 # Performance tests
│   ├── load-test.js
│   ├── stress-test.js
│   └── benchmark.js
│
├── unit/                       # Unit tests
│   ├── backend/
│   │   ├── use-cases.test.js
│   │   └── repositories.test.js
│   └── frontend/
│       ├── components.test.js
│       └── hooks.test.js
│
├── scripts/                    # Test utilities
│   ├── test-endpoints.sh
│   ├── test-anonymous.js
│   ├── test-reprocess.js
│   └── setup-test-data.js
│
└── archive/                    # Old tests (reference only)
    └── [all old files]
```

## Test Framework Updates

### Dependencies to Add
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "supertest": "^6.3.0",
    "k6": "^0.48.0"
  }
}
```

### Configuration Files Needed
1. `playwright.config.js` - Playwright configuration
2. `jest.config.js` - Jest configuration
3. `.env.test` - Test environment variables

## Migration Steps

1. **Create new directory structure**
2. **Move test data files**
3. **Archive old tests**
4. **Create Playwright tests**
5. **Set up Jest for unit tests**
6. **Create integration test suite**
7. **Add performance tests**
8. **Update package.json scripts**
9. **Create test documentation**
10. **Set up CI/CD integration**

## Test Scripts to Add to package.json

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## Priority Order

1. **P1 - Critical** (Do First)
   - Fix anonymous auth flow
   - Create basic E2E tests
   - Update test-anonymous scripts

2. **P2 - Important** (Do Second)
   - Reorganize folder structure
   - Create integration tests
   - Add Jest unit tests

3. **P3 - Nice to Have** (Do Last)
   - Performance tests
   - Stress tests
   - CI/CD integration