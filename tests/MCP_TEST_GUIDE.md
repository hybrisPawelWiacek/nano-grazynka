# MCP Test Guide for nano-Grazynka

## Introduction

This guide provides comprehensive instructions for running E2E tests using Playwright MCP (Model Context Protocol) server through Claude. This approach eliminates npm dependencies and provides a consistent testing interface.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MCP Tool Reference](#mcp-tool-reference)
3. [Common Test Patterns](#common-test-patterns)
4. [Running Tests](#running-tests)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

## Prerequisites

### 1. Environment Setup
```bash
# Start the application
docker compose up

# Verify it's running
curl http://localhost:3101/health
```

### 2. Claude Configuration
- Ensure Playwright MCP server is enabled in Claude settings
- MCP tools should be available (prefix: `mcp__playwright__`)

### 3. Test Data
Verify test files exist:
```bash
ls -la tests/test-data/
# Should see: zabka.m4a, test-audio.mp3, test-file.txt
```

## MCP Tool Reference

### Core Navigation Tools

#### browser_navigate
Navigate to a URL:
```javascript
mcp__playwright__browser_navigate
  url: "http://localhost:3100"
```

#### browser_navigate_back / browser_navigate_forward
Navigate browser history:
```javascript
mcp__playwright__browser_navigate_back
// No parameters needed

mcp__playwright__browser_navigate_forward
// No parameters needed
```

### Interaction Tools

#### browser_click
Click an element:
```javascript
mcp__playwright__browser_click
  element: "Button with text 'Upload and Process'"
  ref: "[data-testid='upload-button']"
```

#### browser_type
Type text into an input:
```javascript
mcp__playwright__browser_type
  element: "Email input field"
  ref: "input[type='email']"
  text: "test@example.com"
  submit: false  // Set true to press Enter after typing
```

#### browser_file_upload
Upload files:
```javascript
mcp__playwright__browser_file_upload
  paths: ["/absolute/path/to/test-data/zabka.m4a"]
```

#### browser_select_option
Select dropdown option:
```javascript
mcp__playwright__browser_select_option
  element: "Language dropdown"
  ref: "select[name='language']"
  values: ["pl"]  // Can select multiple for multi-select
```

### Information Retrieval

#### browser_snapshot
Get page accessibility tree:
```javascript
mcp__playwright__browser_snapshot
// Returns structured representation of page elements
```

#### browser_evaluate
Execute JavaScript in browser:
```javascript
mcp__playwright__browser_evaluate
  function: () => {
    return {
      sessionId: localStorage.getItem('anonymousSessionId'),
      noteCount: document.querySelectorAll('.note-card').length
    };
  }
```

#### browser_console_messages
Get console output:
```javascript
mcp__playwright__browser_console_messages
// Returns array of console messages
```

#### browser_network_requests
Get network activity:
```javascript
mcp__playwright__browser_network_requests
// Returns array of network requests with headers, status, etc.
```

### Waiting & Screenshots

#### browser_wait_for
Wait for condition:
```javascript
mcp__playwright__browser_wait_for
  text: "Processing complete"  // Wait for text to appear
  // OR
  textGone: "Loading..."  // Wait for text to disappear
  // OR
  time: 5  // Wait for 5 seconds
```

#### browser_take_screenshot
Capture screenshot:
```javascript
mcp__playwright__browser_take_screenshot
  filename: "test-result.png"
  fullPage: false  // Set true for full page screenshot
```

## Common Test Patterns

### Pattern 1: Upload Flow
```javascript
// 1. Navigate to app
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// 2. Click upload area (not the hidden input)
mcp__playwright__browser_snapshot
// Find the dropzone element in snapshot

mcp__playwright__browser_click
  element: "Upload dropzone with 'Click to upload' text"
  ref: "[data-testid='dropzone']"

// 3. Upload file
mcp__playwright__browser_file_upload
  paths: ["/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a"]

// 4. Select language
mcp__playwright__browser_click
  element: "Polish language button"
  ref: "button:has-text('Polish')"

// 5. Process
mcp__playwright__browser_click
  element: "Upload and Process button"
  ref: "[data-testid='upload-button']"

// 6. Wait for completion
mcp__playwright__browser_wait_for
  time: 10  // Allow time for processing
```

### Pattern 2: Session Verification
```javascript
// Check if anonymous session exists
mcp__playwright__browser_evaluate
  function: () => {
    const sessionId = localStorage.getItem('anonymousSessionId');
    console.log('Session ID:', sessionId);
    return sessionId !== null;
  }
```

### Pattern 3: Form Filling
```javascript
// Registration form example
mcp__playwright__browser_type
  element: "Email input"
  ref: "input[name='email']"
  text: "user@example.com"

mcp__playwright__browser_type
  element: "Password input"
  ref: "input[name='password']"
  text: "SecurePassword123!"

mcp__playwright__browser_click
  element: "Submit button"
  ref: "button[type='submit']"
```

### Pattern 4: Error Handling
```javascript
// Check for error messages
mcp__playwright__browser_snapshot

// Look for error in snapshot, then:
mcp__playwright__browser_evaluate
  function: () => {
    const errorElement = document.querySelector('.error-message');
    return errorElement ? errorElement.textContent : null;
  }
```

### Pattern 5: Navigation Verification
```javascript
// Verify navigation to library
mcp__playwright__browser_navigate
  url: "http://localhost:3100/library"

// Check if page loaded correctly
mcp__playwright__browser_evaluate
  function: () => {
    return {
      url: window.location.href,
      title: document.title,
      hasNotes: document.querySelectorAll('.note-card').length > 0
    };
  }
```

## Running Tests

### Step-by-Step Execution

#### 1. Start Test Session
```javascript
// Clear browser state
mcp__playwright__browser_close  // If browser already open
mcp__playwright__browser_navigate
  url: "http://localhost:3100"
```

#### 2. Run Test Scenarios
For each test file in `tests/scripts/*-mcp.js`:

```javascript
// Example: Running anonymous flow test
// Open test-anonymous-flow-mcp.js
// Execute scenarios in order:
1. setup
2. sessionGeneration
3. freeUsesDisplay
4. fileUpload
5. usageTracking
6. sessionPersistence
7. usageLimit
```

#### 3. Document Results
After each scenario:
```javascript
// Take screenshot for evidence
mcp__playwright__browser_take_screenshot
  filename: "scenario-name-result.png"

// Get console logs for debugging
mcp__playwright__browser_console_messages

// Check network requests if needed
mcp__playwright__browser_network_requests
```

### Using the Master Runner

```bash
# View all available tests
node tests/scripts/run-all-mcp-tests.js

# This shows:
# - 6 test files
# - 56 total scenarios
# - Execution order
# - Time estimates
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Element Not Found
```javascript
// Solution: Use browser_snapshot to see page structure
mcp__playwright__browser_snapshot

// Then find correct selector and retry
mcp__playwright__browser_click
  element: "Correct element description"
  ref: "correct-selector"
```

#### Issue: Session ID Missing
```javascript
// Debug session storage
mcp__playwright__browser_evaluate
  function: () => {
    return {
      localStorage: Object.keys(localStorage),
      sessionId: localStorage.getItem('anonymousSessionId'),
      cookies: document.cookie
    };
  }
```

#### Issue: Upload Fails
```javascript
// Verify file path
// Make sure to use absolute path
const filePath = "/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a";

// Check if file exists (in separate terminal)
ls -la [filePath]

// Then retry upload
mcp__playwright__browser_file_upload
  paths: [filePath]
```

#### Issue: Timeout on Processing
```javascript
// Increase wait time for AI processing
mcp__playwright__browser_wait_for
  time: 15  // Increase from default 5-10 seconds
```

#### Issue: 401 Authentication Error
```javascript
// Check if session ID is being sent
mcp__playwright__browser_network_requests

// Look for x-session-id header in API calls
// If missing, may need to refresh page or clear storage
```

### Debug Tools

#### Check Page State
```javascript
// Full page analysis
mcp__playwright__browser_evaluate
  function: () => {
    return {
      url: window.location.href,
      title: document.title,
      bodyClasses: document.body.className,
      visibleElements: Array.from(document.querySelectorAll('*'))
        .filter(el => el.offsetParent !== null)
        .slice(0, 10)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.substring(0, 50)
        }))
    };
  }
```

#### Monitor Network
```javascript
// Get recent API calls
mcp__playwright__browser_network_requests

// Filter for specific endpoints
// Look for status codes, headers, payloads
```

#### Console Debugging
```javascript
// Inject debug logging
mcp__playwright__browser_evaluate
  function: () => {
    console.log('Debug: Current state', {
      session: localStorage.getItem('anonymousSessionId'),
      notes: document.querySelectorAll('.note-card').length
    });
  }

// Then retrieve logs
mcp__playwright__browser_console_messages
```

## Best Practices

### 1. Test Organization
- Keep scenarios focused and independent
- Clear browser state between test files
- Document expected vs actual results

### 2. Waiting Strategies
```javascript
// Good: Wait for specific condition
mcp__playwright__browser_wait_for
  text: "Upload complete"

// Avoid: Fixed time waits (unless necessary)
mcp__playwright__browser_wait_for
  time: 10  // Only when no better option
```

### 3. Element Selection
```javascript
// Best: Use data-testid attributes
ref: "[data-testid='upload-button']"

// Good: Specific selectors
ref: "button[type='submit']"

// Okay: Text content
element: "Button with text 'Submit'"

// Avoid: Generic selectors
ref: "button"  // Too broad
```

### 4. Error Recovery
```javascript
// Always check if action succeeded
mcp__playwright__browser_click
  element: "Submit button"
  ref: "[data-testid='submit']"

// Verify result
mcp__playwright__browser_evaluate
  function: () => {
    return document.querySelector('.success-message') !== null;
  }

// If failed, try alternative approach
```

### 5. Documentation
```javascript
// Document each test run
const testRun = {
  date: new Date().toISOString(),
  environment: 'http://localhost:3100',
  scenarios: {
    'anonymous-flow': { 
      'setup': 'PASS',
      'sessionGeneration': 'PASS',
      'fileUpload': 'FAIL - 401 error'
    }
  }
};
```

## Advanced Patterns

### Custom Wait Conditions
```javascript
// Wait for specific element count
mcp__playwright__browser_evaluate
  function: () => {
    const checkCondition = () => {
      const elements = document.querySelectorAll('.note-card');
      return elements.length >= 3;
    };
    
    return new Promise(resolve => {
      if (checkCondition()) {
        resolve(true);
      } else {
        const interval = setInterval(() => {
          if (checkCondition()) {
            clearInterval(interval);
            resolve(true);
          }
        }, 500);
        
        setTimeout(() => {
          clearInterval(interval);
          resolve(false);
        }, 10000);
      }
    });
  }
```

### Batch Operations
```javascript
// Fill multiple form fields
mcp__playwright__browser_evaluate
  function: () => {
    document.querySelector('input[name="email"]').value = 'test@example.com';
    document.querySelector('input[name="password"]').value = 'password123';
    document.querySelector('input[name="confirmPassword"]').value = 'password123';
    document.querySelector('input[type="checkbox"]').checked = true;
    return 'Form filled';
  }
```

### Complex Assertions
```javascript
// Validate multiple conditions
mcp__playwright__browser_evaluate
  function: () => {
    const tests = {
      hasSession: localStorage.getItem('anonymousSessionId') !== null,
      noteCount: document.querySelectorAll('.note-card').length,
      hasUploadButton: document.querySelector('[data-testid="upload-button"]') !== null,
      currentUrl: window.location.pathname,
      hasErrors: document.querySelectorAll('.error').length === 0
    };
    
    const passed = tests.hasSession && 
                   tests.noteCount > 0 && 
                   tests.hasUploadButton && 
                   tests.hasErrors;
    
    return { passed, details: tests };
  }
```

## Migration Reference

### npm Playwright → MCP Mapping

| npm Playwright | MCP Equivalent |
|----------------|----------------|
| `await page.goto(url)` | `browser_navigate { url }` |
| `await page.click(selector)` | `browser_click { element, ref }` |
| `await page.fill(selector, text)` | `browser_type { element, ref, text }` |
| `await page.selectOption(selector, value)` | `browser_select_option { element, ref, values }` |
| `await page.evaluate(() => {})` | `browser_evaluate { function }` |
| `await page.waitForSelector(selector)` | `browser_wait_for { text }` or `browser_snapshot` |
| `await page.screenshot()` | `browser_take_screenshot { filename }` |
| `await page.reload()` | `browser_navigate` to current URL |
| `await fileChooser.setFiles(path)` | `browser_file_upload { paths }` |
| `expect(element).toBeVisible()` | `browser_snapshot` + check in evaluation |

## Resources

### Test Files
- Master Runner: `tests/scripts/run-all-mcp-tests.js`
- Anonymous Flow: `tests/scripts/test-anonymous-flow-mcp.js`
- Main Flow: `tests/scripts/test-main-flow-mcp.js`
- Library Flow: `tests/scripts/test-library-flow-mcp.js`
- Multi-Model: `tests/scripts/test-multi-model-mcp.js`
- Two-Pass: `tests/scripts/test-two-pass-mcp.js`
- Logged-In: `tests/scripts/test-logged-in-flow-mcp.js`

### Documentation
- [Test Plan](../imp_docs/testing/TEST_PLAN.md)
- [Test Alignment Plan](../imp_docs/planning/TEST_ALIGNMENT_PLAN.md)
- [Test README](./README.md)

---
**Version**: 1.0.0  
**Last Updated**: August 16, 2025  
**Author**: Claude (AI Assistant)