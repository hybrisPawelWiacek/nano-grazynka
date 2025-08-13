# Test Scripts Audit Results

## Files to KEEP (Have Utility)

### 1. **backend_api_test.py** ✅
- **Purpose**: Comprehensive backend API testing
- **Status**: Needs auth header updates
- **Action**: Move to `scripts/` folder
- **Why Keep**: Good API coverage, just needs sessionId support

### 2. **integration_test.py** ✅
- **Purpose**: Full pipeline integration test
- **Status**: Works but needs auth updates
- **Action**: Move to `scripts/` folder  
- **Why Keep**: Tests complete upload → process → retrieve flow

### 3. **performance_test.py** ✅
- **Purpose**: Performance and load testing
- **Status**: Functional, needs auth updates
- **Action**: Move to `scripts/` folder
- **Why Keep**: Important for benchmarking

### 4. **edge_cases_test.py** ✅
- **Purpose**: Boundary conditions and error handling
- **Status**: Good test coverage
- **Action**: Move to `scripts/` folder
- **Why Keep**: Tests important edge cases (empty files, large files, etc.)

### 5. **verify_fix.js** ✅
- **Purpose**: Quick verification of API fixes
- **Status**: Working
- **Action**: Move to `scripts/` folder
- **Why Keep**: Useful for quick API validation

## Files to ARCHIVE (Redundant/Outdated)

### 1. **e2e_playwright_test.py** ❌
- **Reason**: Just a placeholder, no actual Playwright implementation
- **Replaced by**: `e2e/anonymous-flow.spec.js`
- **Action**: Archive

### 2. **test-validation.py** ❌
- **Reason**: Duplicate of validation tests in edge_cases_test.py
- **Has path issues**: References `../backend/zabka.m4a`
- **Action**: Archive

### 3. **test_api_fix.py** ❌
- **Reason**: Duplicate of verify_fix.js, path issues
- **Action**: Archive

### 4. **e2e/frontend_e2e_test.js** ❌
- **Reason**: Old implementation, replaced by anonymous-flow.spec.js
- **Uses deprecated approach**: Not using @playwright/test
- **Action**: Archive

### 5. **e2e/page-objects/** ❌
- **Reason**: Old Page Object Model files for deprecated test
- **Files**: LibraryPage.js, UploadPage.js
- **Action**: Archive entire folder

## Migration Actions

### Step 1: Move Python tests to scripts/
```bash
mv backend_api_test.py scripts/backend-api-test.py
mv integration_test.py scripts/integration-test.py
mv performance_test.py scripts/performance-test.py
mv edge_cases_test.py scripts/edge-cases-test.py
mv verify_fix.js scripts/verify-fix.js
```

### Step 2: Archive outdated files
```bash
mv e2e_playwright_test.py archive/
mv test-validation.py archive/
mv test_api_fix.py archive/
mv e2e/frontend_e2e_test.js archive/
mv e2e/page-objects archive/
```

### Step 3: Update Python scripts for auth
All Python scripts need this update:
```python
# Add session ID support
headers = {'x-session-id': 'test-session-id'}
response = requests.post(url, headers=headers, ...)
```

## Final Structure After Cleanup

```
tests/
├── README.md
├── package.json
├── test-data/
│   ├── zabka.m4a
│   └── test-audio.mp3
├── e2e/
│   ├── anonymous-flow.spec.js (KEEP - modern Playwright)
│   └── playwright.config.js
├── integration/
│   └── api-integration.test.js
├── scripts/
│   ├── run-all-tests.sh
│   ├── test-endpoints.sh
│   ├── test-reprocess.js
│   ├── test-reprocess-simple.sh
│   ├── backend-api-test.py (MOVED)
│   ├── integration-test.py (MOVED)
│   ├── performance-test.py (MOVED)
│   ├── edge-cases-test.py (MOVED)
│   └── verify-fix.js (MOVED)
└── archive/
    ├── [existing archived files]
    ├── e2e_playwright_test.py (NEW)
    ├── test-validation.py (NEW)
    ├── test_api_fix.py (NEW)
    ├── frontend_e2e_test.js (NEW)
    └── page-objects/ (NEW)
```

## Summary

- **Keep**: 5 useful Python/JS test scripts → Move to `scripts/`
- **Archive**: 5 outdated/duplicate files
- **Update needed**: Add sessionId headers to Python scripts
- **Result**: Cleaner, more organized test structure