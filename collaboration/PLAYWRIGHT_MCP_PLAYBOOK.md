# Playwright MCP Playbook

## Introduction

This playbook provides a comprehensive reference for using Playwright MCP (Model Context Protocol) tools for E2E testing through Claude. These patterns and tools are project-agnostic and can be applied to any web application testing scenario.

**For project-specific test implementations, refer to your project's test documentation.**

## Table of Contents
1. [MCP Tool Reference](#mcp-tool-reference)
2. [Common Test Patterns](#common-test-patterns)
3. [Troubleshooting](#troubleshooting)
4. [Best Practices](#best-practices)
5. [Migration Reference](#migration-reference)

## MCP Tool Reference

### Core Navigation Tools

#### browser_navigate
Navigate to a URL:
```javascript
mcp__playwright__browser_navigate
  url: "http://your-app-url"
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
  element: "Description of the element to click"
  ref: "[data-testid='element-id']"  // CSS selector
```

#### browser_type
Type text into an input:
```javascript
mcp__playwright__browser_type
  element: "Description of the input field"
  ref: "input[type='email']"  // CSS selector
  text: "text-to-type"
  submit: false  // Set true to press Enter after typing
```

#### browser_file_upload
Upload files:
```javascript
mcp__playwright__browser_file_upload
  paths: ["/absolute/path/to/file.ext"]
```

#### browser_select_option
Select dropdown option:
```javascript
mcp__playwright__browser_select_option
  element: "Description of the dropdown"
  ref: "select[name='options']"
  values: ["option1"]  // Can select multiple for multi-select
```

#### browser_drag
Drag and drop between elements:
```javascript
mcp__playwright__browser_drag
  startElement: "Source element description"
  startRef: "[data-testid='draggable']"
  endElement: "Target element description"
  endRef: "[data-testid='droppable']"
```

#### browser_hover
Hover over an element:
```javascript
mcp__playwright__browser_hover
  element: "Element to hover over"
  ref: "button.tooltip-trigger"
```

### Information Retrieval

#### browser_snapshot
Get page accessibility tree (best for understanding page structure):
```javascript
mcp__playwright__browser_snapshot
// Returns structured representation of page elements
```

#### browser_evaluate
Execute JavaScript in browser context:
```javascript
mcp__playwright__browser_evaluate
  function: () => {
    // JavaScript code to execute
    return {
      data: document.querySelector('.selector')?.textContent,
      count: document.querySelectorAll('.items').length
    };
  }
```

With element context:
```javascript
mcp__playwright__browser_evaluate
  element: "Target element description"
  ref: "[data-testid='container']"
  function: (element) => {
    // element is the DOM element matching the ref
    return element.children.length;
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
Wait for conditions:
```javascript
mcp__playwright__browser_wait_for
  text: "Text to wait for"  // Wait for text to appear
  // OR
  textGone: "Loading..."  // Wait for text to disappear
  // OR
  time: 5  // Wait for 5 seconds
```

#### browser_take_screenshot
Capture screenshot:
```javascript
mcp__playwright__browser_take_screenshot
  filename: "screenshot-name.png"
  fullPage: false  // Set true for full page screenshot
  type: "png"  // or "jpeg"
```

Screenshot specific element:
```javascript
mcp__playwright__browser_take_screenshot
  element: "Element to screenshot"
  ref: "[data-testid='component']"
  filename: "element-screenshot.png"
```

### Dialog Handling

#### browser_handle_dialog
Handle browser dialogs (alert, confirm, prompt):
```javascript
mcp__playwright__browser_handle_dialog
  accept: true  // Accept or dismiss
  promptText: "Text for prompt dialogs"  // Optional
```

### Browser Management

#### browser_close
Close the browser:
```javascript
mcp__playwright__browser_close
// Closes current page/browser
```

#### browser_resize
Resize browser window:
```javascript
mcp__playwright__browser_resize
  width: 1280
  height: 720
```

### Tab Management

#### browser_tab_list
List all open tabs:
```javascript
mcp__playwright__browser_tab_list
// Returns list of tabs with titles and URLs
```

#### browser_tab_new
Open a new tab:
```javascript
mcp__playwright__browser_tab_new
  url: "http://url-to-open"  // Optional
```

#### browser_tab_select
Switch to a specific tab:
```javascript
mcp__playwright__browser_tab_select
  index: 1  // Tab index (0-based)
```

#### browser_tab_close
Close a tab:
```javascript
mcp__playwright__browser_tab_close
  index: 1  // Optional, closes current if not provided
```

### Keyboard Input

#### browser_press_key
Press keyboard keys:
```javascript
mcp__playwright__browser_press_key
  key: "Enter"  // Key name or character
```

Common keys: Enter, Tab, Escape, ArrowUp, ArrowDown, Space, Backspace, Delete

## Common Test Patterns

### Pattern: Form Submission
```javascript
// 1. Fill form fields
mcp__playwright__browser_type
  element: "Email input"
  ref: "input[name='email']"
  text: "user@example.com"

mcp__playwright__browser_type
  element: "Password input"
  ref: "input[name='password']"
  text: "password123"

// 2. Submit form
mcp__playwright__browser_click
  element: "Submit button"
  ref: "button[type='submit']"

// 3. Wait for response
mcp__playwright__browser_wait_for
  text: "Success message"
```

### Pattern: File Upload
```javascript
// 1. Take snapshot to understand page structure
mcp__playwright__browser_snapshot

// 2. Click upload area (not the hidden input)
mcp__playwright__browser_click
  element: "Upload dropzone"
  ref: "[data-testid='dropzone']"

// 3. Upload file when chooser appears
mcp__playwright__browser_file_upload
  paths: ["/path/to/test-file.ext"]

// 4. Wait for upload completion
mcp__playwright__browser_wait_for
  text: "Upload complete"
```

### Pattern: Authentication Flow
```javascript
// 1. Navigate to login
mcp__playwright__browser_navigate
  url: "http://app-url/login"

// 2. Enter credentials
mcp__playwright__browser_type
  element: "Username field"
  ref: "input[name='username']"
  text: "testuser"

mcp__playwright__browser_type
  element: "Password field"
  ref: "input[name='password']"
  text: "testpass"
  submit: true  // Press Enter to submit

// 3. Verify logged in state
mcp__playwright__browser_evaluate
  function: () => {
    return {
      token: localStorage.getItem('authToken'),
      user: localStorage.getItem('userId')
    };
  }
```

### Pattern: Dynamic Content Waiting
```javascript
// Wait for specific element count
mcp__playwright__browser_evaluate
  function: () => {
    const checkCondition = () => {
      return document.querySelectorAll('.item').length >= 5;
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
        }, 10000);  // 10 second timeout
      }
    });
  }
```

### Pattern: API Response Verification
```javascript
// 1. Perform action that triggers API call
mcp__playwright__browser_click
  element: "Save button"
  ref: "[data-testid='save']"

// 2. Check network requests
mcp__playwright__browser_network_requests

// Look for specific API call in the response
// Check status codes, headers, payloads
```

### Pattern: Multi-Step Validation
```javascript
// Validate multiple conditions at once
mcp__playwright__browser_evaluate
  function: () => {
    const tests = {
      hasElement: document.querySelector('.required-element') !== null,
      correctText: document.querySelector('h1')?.textContent === 'Expected Title',
      itemCount: document.querySelectorAll('.list-item').length,
      noErrors: document.querySelectorAll('.error').length === 0
    };
    
    const allPassed = Object.values(tests).every(test => 
      typeof test === 'boolean' ? test : true
    );
    
    return { passed: allPassed, details: tests };
  }
```

## Troubleshooting

### Issue: Element Not Found

**Solution**: Use browser_snapshot to understand page structure
```javascript
// 1. Get page structure
mcp__playwright__browser_snapshot

// 2. Review the snapshot to find correct selector
// 3. Retry with correct selector
mcp__playwright__browser_click
  element: "Correct element description"
  ref: "correct-selector"
```

### Issue: Timing Problems

**Solution**: Add appropriate waits
```javascript
// Wait for specific text
mcp__playwright__browser_wait_for
  text: "Content loaded"

// Or wait for element to be present
mcp__playwright__browser_evaluate
  function: () => {
    return document.querySelector('.target-element') !== null;
  }
```

### Issue: File Upload Fails

**Solution**: Ensure correct approach
```javascript
// 1. Click the visible upload trigger, not hidden input
mcp__playwright__browser_click
  element: "Visible upload button or dropzone"
  ref: "[data-testid='upload-trigger']"

// 2. Use absolute path for file
mcp__playwright__browser_file_upload
  paths: ["/absolute/path/to/file"]
```

### Issue: Authentication/Session Problems

**Solution**: Debug storage and headers
```javascript
// Check local storage
mcp__playwright__browser_evaluate
  function: () => {
    return {
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      cookies: document.cookie
    };
  }

// Check network headers
mcp__playwright__browser_network_requests
// Review Authorization headers, cookies, session tokens
```

### Debug Utilities

#### Inspect Page State
```javascript
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
          id: el.id,
          classes: el.className,
          text: el.textContent?.substring(0, 50)
        }))
    };
  }
```

#### Monitor Console Output
```javascript
// Inject debug logging
mcp__playwright__browser_evaluate
  function: () => {
    console.log('Debug checkpoint', {
      timestamp: Date.now(),
      state: document.readyState
    });
  }

// Retrieve logs
mcp__playwright__browser_console_messages
```

## Best Practices

### 1. Element Selection Strategy

**Best to Worst Order**:
1. **data-testid attributes**: Most reliable
   ```javascript
   ref: "[data-testid='submit-button']"
   ```

2. **Unique IDs**: Stable if properly maintained
   ```javascript
   ref: "#unique-element-id"
   ```

3. **Specific attributes**: Good for forms
   ```javascript
   ref: "input[name='email']"
   ```

4. **Text content**: Useful but can change
   ```javascript
   element: "Button with text 'Submit'"
   ```

5. **Generic selectors**: Avoid when possible
   ```javascript
   ref: "button"  // Too broad
   ```

### 2. Waiting Strategies

**Prefer specific conditions over fixed waits**:
```javascript
// ✅ Good: Wait for specific condition
mcp__playwright__browser_wait_for
  text: "Processing complete"

// ✅ Good: Wait for element
mcp__playwright__browser_evaluate
  function: () => document.querySelector('.result') !== null

// ⚠️ Avoid: Fixed time waits (unless necessary)
mcp__playwright__browser_wait_for
  time: 10  // Only when no better option
```

### 3. Error Recovery

**Always verify actions succeeded**:
```javascript
// 1. Perform action
mcp__playwright__browser_click
  element: "Submit button"
  ref: "[data-testid='submit']"

// 2. Verify result
mcp__playwright__browser_evaluate
  function: () => {
    const success = document.querySelector('.success-message');
    const error = document.querySelector('.error-message');
    return { success: !!success, error: error?.textContent };
  }

// 3. Handle failure if needed
```

### 4. Test Isolation

**Keep tests independent**:
```javascript
// Start each test with clean state
mcp__playwright__browser_close  // If needed
mcp__playwright__browser_navigate
  url: "http://app-url"

// Clear storage if needed
mcp__playwright__browser_evaluate
  function: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
```

### 5. Documentation

**Document test results**:
```javascript
// After each scenario, capture evidence
mcp__playwright__browser_take_screenshot
  filename: "test-scenario-result.png"

// Get final state
mcp__playwright__browser_evaluate
  function: () => {
    return {
      testName: 'scenario-name',
      timestamp: new Date().toISOString(),
      passed: true,
      details: { /* test-specific data */ }
    };
  }
```

## Migration Reference

### npm Playwright → MCP Mapping

| npm Playwright | MCP Equivalent |
|----------------|----------------|
| `await page.goto(url)` | `browser_navigate { url }` |
| `await page.click(selector)` | `browser_click { element, ref }` |
| `await page.fill(selector, text)` | `browser_type { element, ref, text }` |
| `await page.type(selector, text)` | `browser_type { element, ref, text, slowly: true }` |
| `await page.selectOption(selector, value)` | `browser_select_option { element, ref, values }` |
| `await page.evaluate(() => {})` | `browser_evaluate { function }` |
| `await page.waitForSelector(selector)` | `browser_wait_for` or `browser_snapshot` |
| `await page.waitForTimeout(ms)` | `browser_wait_for { time: seconds }` |
| `await page.screenshot()` | `browser_take_screenshot { filename }` |
| `await page.reload()` | `browser_navigate` to current URL |
| `await page.goBack()` | `browser_navigate_back` |
| `await page.goForward()` | `browser_navigate_forward` |
| `await fileChooser.setFiles(path)` | `browser_file_upload { paths }` |
| `await page.hover(selector)` | `browser_hover { element, ref }` |
| `await page.dragAndDrop(source, target)` | `browser_drag { startRef, endRef }` |
| `await page.keyboard.press('Enter')` | `browser_press_key { key: 'Enter' }` |
| `await browser.newPage()` | `browser_tab_new` |
| `await page.close()` | `browser_tab_close` or `browser_close` |
| `expect(element).toBeVisible()` | `browser_snapshot` + check in evaluation |
| `expect(element).toHaveText(text)` | `browser_evaluate` + text comparison |

### Common Assertions

Convert Playwright assertions to MCP evaluations:

```javascript
// Playwright: expect(page).toHaveTitle('Title')
mcp__playwright__browser_evaluate
  function: () => document.title === 'Title'

// Playwright: expect(element).toBeVisible()
mcp__playwright__browser_evaluate
  function: () => {
    const el = document.querySelector('.selector');
    return el && el.offsetParent !== null;
  }

// Playwright: expect(element).toHaveText('text')
mcp__playwright__browser_evaluate
  function: () => {
    const el = document.querySelector('.selector');
    return el?.textContent === 'text';
  }

// Playwright: expect(element).toHaveClass('class-name')
mcp__playwright__browser_evaluate
  function: () => {
    const el = document.querySelector('.selector');
    return el?.classList.contains('class-name');
  }
```

## Advanced Patterns

### Batch Operations
```javascript
// Fill multiple form fields at once
mcp__playwright__browser_evaluate
  function: () => {
    const fields = {
      'input[name="field1"]': 'value1',
      'input[name="field2"]': 'value2',
      'select[name="field3"]': 'option1'
    };
    
    Object.entries(fields).forEach(([selector, value]) => {
      const el = document.querySelector(selector);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.value = value;
        } else {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });
    
    return 'Form filled';
  }
```

### Custom Wait Conditions
```javascript
// Wait for complex conditions
mcp__playwright__browser_evaluate
  function: () => {
    return new Promise(resolve => {
      const check = () => {
        // Your custom condition
        const ready = document.querySelector('.spinner') === null &&
                     document.querySelectorAll('.item').length > 0;
        
        if (ready) {
          resolve(true);
        } else {
          setTimeout(check, 500);
        }
      };
      
      check();
      
      // Timeout after 15 seconds
      setTimeout(() => resolve(false), 15000);
    });
  }
```

### Intercepting Network Requests
```javascript
// Monitor specific API calls
mcp__playwright__browser_network_requests

// Then filter and analyze in your test logic:
// - Look for specific endpoints
// - Check response status codes
// - Verify request/response payloads
// - Check authentication headers
```

---
**Version**: 2.0.0  
**Last Updated**: August 16, 2025  
**Purpose**: Generic Playwright MCP reference for any project