# Playwright Anonymous User Happy Path Test

## Overview
This document provides a step-by-step guide for testing the complete anonymous user flow using Playwright MCP. This "happy path" test verifies that anonymous users can successfully upload, process, view, and manage voice notes without authentication issues.

**For MCP tool reference and troubleshooting, see [Playwright MCP Playbook](../../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md)**

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
// CRITICAL: Clear localStorage to ensure fresh session
// This prevents reusing exhausted sessions from previous test runs
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// Clear all localStorage items to force new session creation
mcp__playwright__browser_evaluate
  function: () => {
    localStorage.clear();
    console.log('LocalStorage cleared - forcing new session');
    return { cleared: true };
  }

// Reload page to trigger new session creation
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// Verify NEW session ID is created in localStorage
mcp__playwright__browser_evaluate
  function: () => {
    const sessionId = localStorage.getItem('anonymousSessionId');
    console.log('New Session ID:', sessionId);
    return { sessionId };
  }

// Verify we have 5 free uses available
// Should see "Free uses: 5 / 5 remaining" in navigation
```

### 2. Upload Voice Note

**IMPORTANT**: The Playwright MCP file upload requires a two-step process:
1. First click the visible dropzone to trigger the file chooser
2. Then immediately use file_upload tool while the chooser is open

```javascript
// Step 1: Click on the upload dropzone area (NOT the hidden file input)
// This triggers the file chooser dialog
mcp__playwright__browser_click
  element: "Upload dropzone area with text 'Click to upload'"
  ref: [find ref for element containing "Click to upload or drag and drop"]
  // Note: Click the visible dropzone label, not the hidden input

// Step 2: Upload the file while file chooser is open
// This must be done immediately after clicking the dropzone
mcp__playwright__browser_file_upload
  paths: ["/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a"]

// Verify file is selected (should show filename "zabka.m4a")
// Then click Upload and Process button
mcp__playwright__browser_click
  element: "Upload and Process button"
  ref: [find button with text "Upload and Process"]

// Wait for processing to complete (redirect to note page)
mcp__playwright__browser_wait_for
  time: 10  // Increased from 5 to allow for processing
```

### 3. Verify Note Page and Generate Summary
```javascript
// Verify we're on the note page with transcription
// URL should be: http://localhost:3100/note/{note-id}

// Click on Summary tab (button with text "Summary")
mcp__playwright__browser_click
  element: "Summary tab button"
  ref: [find button with text "Summary"]

// When Summary tab is active, click Generate Summary button
mcp__playwright__browser_click
  element: "Generate Summary button"
  ref: [find button with text "Generate Summary"]

// Wait for summary generation to complete
mcp__playwright__browser_wait_for
  time: 5  // Increased to allow for AI processing
```

### 4. Verify Library Access
```javascript
// Navigate to library
mcp__playwright__browser_navigate
  url: "http://localhost:3100/library"

// IMPORTANT: Library may fail with 401 on first load
// If you see "Failed to load voice notes", click "Try Again"
mcp__playwright__browser_click
  element: "Try Again button (if visible)"
  ref: [find button with text "Try Again" if error occurs]

// Verify notes appear in library
// Should see: "X notes in your collection" (at least 1)
// Note should be visible with title "Workflow Organization Plan"
```

### 5. Test Summary Regeneration with Custom Prompt
```javascript
// Click on the note in library to open it
// Look for link with the note title "Workflow Organization Plan"
mcp__playwright__browser_click
  element: "Note link with title 'Workflow Organization Plan'"
  ref: [find link element containing the note title]

// Switch to Summary tab if not already active
mcp__playwright__browser_click
  element: "Summary tab button"
  ref: [find button with text "Summary"]

// Click Regenerate button to show custom prompt field
// NOTE: There's no separate "Customize" button - click "Regenerate" directly
mcp__playwright__browser_click
  element: "Regenerate button"
  ref: [find button with "Regenerate" text or regenerate icon]

// Clear existing prompt and enter custom prompt
mcp__playwright__browser_evaluate
  function: () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

// Type new custom prompt
mcp__playwright__browser_type
  element: "Custom prompt textarea"
  ref: [find textarea for custom instructions]
  text: "provide just 2 sentence summary"

// Click Regenerate Summary button (in the custom prompt area)
mcp__playwright__browser_click
  element: "Regenerate Summary button"
  ref: [find button with text "Regenerate Summary"]

// Wait for regeneration
mcp__playwright__browser_wait_for
  time: 5

// NOTE: Custom prompt regeneration currently returns 500 error - known bug
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

### Known Issues & Common Failure Points
1. **✅ FIXED: Library Initial Load (401 Error)**: Library now loads correctly on first attempt
2. **✅ FIXED: Custom Prompt Regeneration (500 Error)**: Custom prompt regeneration now works correctly with flexible JSON structure
3. **File Upload Click Target**: Must click the visible dropzone label, not the hidden file input
4. **Processing Wait Times**: Allow sufficient time for AI processing (10s for upload, 5s for summary)
5. **Session Reset on Navigation**: Check if session ID changes between pages
6. **API Response Mismatches**: Watch for "Untitled Note" or "Invalid Date" appearing

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