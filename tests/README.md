# nano-Grazynka Test Suite

## Test Organization

### Active Test Suites

| File | Purpose | Run Command |
|------|---------|-------------|
| `integration_test.py` | Main integration test - uploads and processes zabka.m4a | `python3 integration_test.py` |
| `backend_api_test.py` | Backend API endpoint tests | `python3 backend_api_test.py` |
| `performance_test.py` | Performance and load testing | `python3 performance_test.py` |
| `edge_cases_test.py` | Edge case and error handling tests | `python3 edge_cases_test.py` |
| `e2e_playwright_test.py` | Frontend E2E test placeholder | `python3 e2e_playwright_test.py` |

### E2E Test Infrastructure

| Directory | Purpose |
|-----------|---------|
| `e2e/` | Playwright-based E2E tests |
| `e2e/frontend_e2e_test.js` | Main E2E test suite |
| `e2e/page-objects/` | Page Object Models for E2E tests |

### Test Assets

| File | Purpose |
|------|---------|
| `zabka.m4a` | Polish audio file for testing |
| `test-audio.mp3` | English audio file for testing |

### Archived Tests

The `archive/` directory contains older test implementations and utilities that have been superseded by the current test suite.

## Running Tests

### Quick Test
```bash
# Run integration test (main pipeline test)
python3 integration_test.py
```

### Full Test Suite
```bash
# Run all Python tests
python3 backend_api_test.py
python3 integration_test.py
python3 performance_test.py
python3 edge_cases_test.py
```

### E2E Tests with Playwright
```bash
# Using Playwright MCP or directly
node e2e/frontend_e2e_test.js
```

## Test Results

For detailed test results and history, see:
- [TEST_PLAN.md](../docs/testing/TEST_PLAN.md) - Test planning documentation
- [TEST_RESULTS.md](../docs/testing/TEST_RESULTS.md) - Latest test execution results