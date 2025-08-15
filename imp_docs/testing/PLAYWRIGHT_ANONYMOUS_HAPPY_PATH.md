# Playwright Anonymous User Happy Path Test

## Overview
This document provides a step-by-step guide for testing the complete anonymous user flow using Playwright MCP. This "happy path" test verifies that anonymous users can successfully upload, process, view, and manage voice notes without authentication issues.

## Test File Location
- **Test Audio File**: `/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a`
- **Application URL**: `http://localhost:3100`

## Prerequisites
1. Application running: `docker compose up`
2. Playwright MCP server enabled in Claude
3. Test file `zabka.m4a` exists in the test-data directory

## Test Steps

### 1. Start Fresh Session
```javascript
// Navigate to homepage as new anonymous user
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// Verify session ID is created in localStorage
mcp__playwright__browser_evaluate
  function: () => {
    const sessionId = localStorage.getItem('anonymousSessionId');
    console.log('Session ID:', sessionId);
    return { sessionId };
  }
```

### 2. Upload Voice Note
```javascript
// Click on the upload area to trigger file selector
mcp__playwright__browser_evaluate
  function: () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
      return 'File input clicked';
    }
  }

// Upload the test file
mcp__playwright__browser_file_upload
  paths: ["/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a"]

// Click Upload and Process button
mcp__playwright__browser_click
  element: "Upload and Process button"
  ref: [get from snapshot]

// Wait for processing to complete (redirect to note page)
mcp__playwright__browser_wait_for
  time: 5
```

### 3. Verify Note Page and Generate Summary
```javascript
// Verify we're on the note page with transcription
// URL should be: http://localhost:3100/note/{note-id}

// Click on Summary tab
mcp__playwright__browser_click
  element: "Summary tab"
  ref: [get from snapshot]

// If no summary exists, click Generate Summary
mcp__playwright__browser_click
  element: "Generate Summary button"
  ref: [get from snapshot]

// Wait for summary generation
mcp__playwright__browser_wait_for
  time: 3
```

### 4. Verify Library Access
```javascript
// Navigate to library
mcp__playwright__browser_navigate
  url: "http://localhost:3100/library"

// Verify note appears in library
// Should see: "1 note in your collection"
// Note should be visible with title and preview
```

### 5. Test Summary Regeneration with Custom Prompt
```javascript
// Click on the note in library to open it
mcp__playwright__browser_click
  element: "Note link in library"
  ref: [get from snapshot]

// Switch to Summary tab
mcp__playwright__browser_click
  element: "Summary tab"
  ref: [get from snapshot]

// Click Customize instructions button
mcp__playwright__browser_click
  element: "Customize instructions"
  ref: [get from snapshot]

// Enter custom prompt
mcp__playwright__browser_type
  element: "Custom prompt textarea"
  ref: [get from snapshot]
  text: "provide just 2 sentence summary"

// Click Generate Summary with custom prompt
mcp__playwright__browser_click
  element: "Generate Summary button"
  ref: [get from snapshot]

// Wait for regeneration
mcp__playwright__browser_wait_for
  time: 3

// Verify summary is now shorter (2 sentences)
```

### 6. Session Persistence Verification
```javascript
// Throughout the test, verify session ID remains consistent
mcp__playwright__browser_evaluate
  function: () => {
    const sessionId = localStorage.getItem('anonymousSessionId');
    console.log('Final session ID:', sessionId);
    return { sessionId, noteCount: document.querySelectorAll('[data-note-id]').length };
  }
```

## Expected Results

### Success Criteria
1. ✅ Session ID created and persists throughout the flow
2. ✅ File uploads successfully
3. ✅ Transcription completes and displays
4. ✅ Summary generation works on first attempt
5. ✅ Note appears in library with correct session
6. ✅ Note is accessible when clicked from library
7. ✅ Custom prompt summary regeneration works
8. ✅ New summary reflects the custom prompt (shorter, 2 sentences)
9. ✅ No 401 errors for anonymous user operations
10. ✅ No session ID mismatches

### Common Failure Points to Watch
1. **Session Reset on Navigation**: Check if session ID changes between pages
2. **API Response Mismatches**: Watch for "Untitled Note" or "Invalid Date" appearing
3. **Library Access**: Ensure notes are visible without authentication
4. **Summary Generation**: Verify both initial and custom prompt generation work

## Debugging Tips

### Check Session ID Consistency
```javascript
// Run this at any point to verify session
mcp__playwright__browser_console_messages
// Look for session ID logs

mcp__playwright__browser_network_requests
// Check x-session-id headers in API calls
```

### Verify Database State
```bash
# Check note ownership in database
sqlite3 data/nano-grazynka.db "SELECT id, sessionId, title FROM VoiceNote WHERE title LIKE '%Zabka%';"
```

### Monitor Backend Logs
```bash
# Watch for session validation errors
docker compose logs backend --tail=50 | grep -i session
```

## Automation Script

For future automation, this test can be converted into a Playwright test script:

```typescript
// tests/e2e/anonymous-happy-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Anonymous User Happy Path', () => {
  test('should complete full anonymous user flow', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('http://localhost:3100');
    
    // 2. Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/test-data/zabka.m4a');
    await page.click('button:has-text("Upload and Process")');
    
    // 3. Wait for processing and verify transcription
    await page.waitForURL(/\/note\//);
    await expect(page.locator('h1')).toContainText('Workflow Organization');
    
    // 4. Generate summary
    await page.click('button:has-text("Summary")');
    await page.click('button:has-text("Generate Summary")');
    await page.waitForSelector('[data-summary-content]');
    
    // 5. Check library
    await page.goto('http://localhost:3100/library');
    await expect(page.locator('text=/1 note/')).toBeVisible();
    
    // 6. Test custom prompt
    await page.click('[data-note-link]');
    await page.click('button:has-text("Customize")');
    await page.fill('textarea', 'provide just 2 sentence summary');
    await page.click('button:has-text("Generate")');
    
    // 7. Verify session persistence
    const sessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
    expect(sessionId).toBeTruthy();
  });
});
```

## Related Documentation
- [Test Plan](./TEST_PLAN.md)
- [Test Results](./TEST_RESULTS_2025_08_13.md)
- [API Contract](../../docs/api/api-contract.md)