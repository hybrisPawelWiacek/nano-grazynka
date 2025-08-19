# Playwright Logged-In User Happy Path Test

## Overview
This document provides a step-by-step guide for testing the complete logged-in user flow using Playwright MCP. This "happy path" test verifies user registration, authentication, and all features available to authenticated users including credit tracking and custom prompt regeneration with flexible JSON.

**For MCP tool reference and troubleshooting, see [Playwright MCP Playbook](../../collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md)**

## Test File Location
- **Test Audio File**: `/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a`
- **Application URL**: `http://localhost:3100`

## Prerequisites
1. Application running: `docker compose up`
2. Playwright MCP server enabled in Claude
3. Test file `zabka.m4a` exists in the test-data directory

## Test Steps

### 0. Clear Session State (CRITICAL)
```javascript
// CRITICAL: Start with clean browser state
// Navigate to the application first
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// Clear ALL localStorage to ensure no session conflicts
mcp__playwright__browser_evaluate
  function: () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Browser storage cleared - starting fresh');
    return { cleared: true };
  }
```

### 1. Create Unique User Account
```javascript
// Navigate to registration page
mcp__playwright__browser_navigate
  url: "http://localhost:3100/register"

// Generate unique email with timestamp to avoid conflicts
mcp__playwright__browser_evaluate
  function: () => {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    console.log('Creating user with email:', email);
    return { email, timestamp };
  }

// Fill registration form with unique email
mcp__playwright__browser_type
  element: "Email address textbox"
  ref: [find textbox with name "Email address"]
  text: [use generated email from above]

// Enter password
mcp__playwright__browser_type
  element: "Password textbox"
  ref: [find textbox with name "Password"]
  text: "TestPassword123!"

// Confirm password
mcp__playwright__browser_type
  element: "Confirm Password textbox"
  ref: [find textbox with name "Confirm Password"]
  text: "TestPassword123!"

// Submit registration
mcp__playwright__browser_click
  element: "Sign up button"
  ref: [find button with text "Sign up"]

// Wait for redirect to dashboard/home after successful registration
mcp__playwright__browser_wait_for
  time: 3
```

### 2. Verify Logged-In State
```javascript
// Should be redirected to home page after registration
// Verify user is logged in by checking for logout button
mcp__playwright__browser_snapshot
// Look for:
// - "Logout" button in navigation
// - "Credits: X / 5" indicator (Free tier starts with 5 credits)
// - User email or profile indicator

// Verify localStorage has auth token
mcp__playwright__browser_evaluate
  function: () => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    console.log('Auth token present:', !!token);
    console.log('User ID:', userId);
    return { hasToken: !!token, userId };
  }
```

### 3. Upload Voice Note as Logged-In User
```javascript
// Click on the upload dropzone area
mcp__playwright__browser_click
  element: "Upload dropzone area"
  ref: [find element with "Click to upload or drag and drop"]

// Upload the test file when file chooser appears
mcp__playwright__browser_file_upload
  paths: ["/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a"]

// Verify file is selected (should show filename "zabka.m4a")
// Should also see "Free tier: X transcriptions remaining this month"

// Optional: Add context/instructions
mcp__playwright__browser_type
  element: "Context textarea"
  ref: [find textarea with placeholder about context/instructions]
  text: "Meeting notes with action items"
  
// Click Upload and Process button
mcp__playwright__browser_click
  element: "Upload and Process button"
  ref: [find button with text "Upload and Process"]

// Wait for processing to complete (redirect to note page)
mcp__playwright__browser_wait_for
  time: 10  // Allow time for transcription
```

### 4. Generate and Verify Summary
```javascript
// Verify we're on the note page with transcription
// URL should be: http://localhost:3100/note/{note-id}

// Click on Summary tab
mcp__playwright__browser_click
  element: "Summary tab button"
  ref: [find button with text "Summary"]

// Generate initial summary with default settings
mcp__playwright__browser_click
  element: "Generate Summary button"
  ref: [find button with text "Generate Summary"]

// Wait for summary generation
mcp__playwright__browser_wait_for
  time: 5

// Verify summary has full structure (summary, key points, action items)
mcp__playwright__browser_snapshot
// Should see:
// - Summary paragraph with markdown formatting
// - "Key Points" section with bullet points
// - "Action Items" section with checkboxes
```

### 5. Test Custom Prompt with Flexible JSON
```javascript
// Click Regenerate button to show custom prompt field
mcp__playwright__browser_click
  element: "Regenerate button"
  ref: [find button with regenerate icon or "Regenerate" text]

// Clear default prompt template
mcp__playwright__browser_evaluate
  function: () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

// Enter simple custom prompt to test flexible JSON
mcp__playwright__browser_type
  element: "Custom prompt textarea"
  ref: [find textarea for custom instructions]
  text: "provide just 2 sentence summary"

// Submit custom prompt
mcp__playwright__browser_click
  element: "Regenerate Summary button"
  ref: [find button with text "Regenerate Summary"]

// Wait for regeneration
mcp__playwright__browser_wait_for
  time: 5

// Verify flexible JSON response (should be just 2 sentences, no key points/action items)
mcp__playwright__browser_snapshot
// Should see only a simple paragraph with 2 sentences
// No "Key Points" or "Action Items" sections
```

### 6. Verify Library and Note Management
```javascript
// Navigate to library
mcp__playwright__browser_navigate
  url: "http://localhost:3100/library"

// Verify notes appear in library
// Should see: "X notes in your collection" (at least 1)
// Note should be visible with title derived from content

// Click on the note to open it
mcp__playwright__browser_click
  element: "Note link"
  ref: [find first note link in library]

// Verify note opens correctly with all data
// Should see transcription, summary (if generated), and metadata
```

### 7. Check Dashboard and Credit Usage
```javascript
// Navigate to dashboard
mcp__playwright__browser_navigate
  url: "http://localhost:3100/dashboard"

// Verify dashboard shows:
// - User statistics (notes created, summaries generated)
// - Credit usage (should show credits consumed)
// - Recent activity

// Check remaining credits in navigation
mcp__playwright__browser_snapshot
// Should see "Credits: X / 5" where X is less than 5 after processing
```

### 8. Test Entity Management in Settings
```javascript
// Navigate to settings
mcp__playwright__browser_navigate
  url: "http://localhost:3100/settings"

// Verify settings page shows EntityManager component
mcp__playwright__browser_snapshot
// Should see:
// - User email
// - Account tier (Free)
// - Entity Manager section
// - Project management options

// Create test entities
// Add a person entity
mcp__playwright__browser_type
  element: "Entity name input"
  ref: [find input with placeholder "Entity name"]
  text: "Dario Amodei"

mcp__playwright__browser_select_option
  element: "Entity type select"
  ref: [find select for entity type]
  values: ["person"]

mcp__playwright__browser_type
  element: "Entity value input"
  ref: [find input with placeholder "Value (how it should appear)"]
  text: "Dario Amodei"

mcp__playwright__browser_click
  element: "Add Entity button"
  ref: [find button with text "Add Entity"]

// Add a company entity
mcp__playwright__browser_type
  element: "Entity name input"
  ref: [find input with placeholder "Entity name"]
  text: "Microsoft"

mcp__playwright__browser_select_option
  element: "Entity type select"
  ref: [find select for entity type]
  values: ["company"]

mcp__playwright__browser_type
  element: "Entity value input"
  ref: [find input with placeholder "Value (how it should appear)"]
  text: "Microsoft"

mcp__playwright__browser_click
  element: "Add Entity button"
  ref: [find button with text "Add Entity"]

// Add a technical term entity
mcp__playwright__browser_type
  element: "Entity name input"
  ref: [find input with placeholder "Entity name"]
  text: "Claude API"

mcp__playwright__browser_select_option
  element: "Entity type select"
  ref: [find select for entity type]
  values: ["technical"]

mcp__playwright__browser_type
  element: "Entity value input"
  ref: [find input with placeholder "Value (how it should appear)"]
  text: "Claude API"

mcp__playwright__browser_click
  element: "Add Entity button"
  ref: [find button with text "Add Entity"]

// Verify entities appear in list
mcp__playwright__browser_snapshot
// Should see all three entities listed with their types

// Test entity deletion
mcp__playwright__browser_click
  element: "Delete entity button for Claude API"
  ref: [find delete button (×) for Claude API entity]

// Verify entity removed
mcp__playwright__browser_snapshot
// Claude API should be removed from list
```

### 9. Test Project Management (Enhanced with Entity Association)
```javascript
// Navigate back to home page to test project selector
mcp__playwright__browser_navigate
  url: "http://localhost:3100"

// Open project selector dropdown
mcp__playwright__browser_click
  element: "Project selector dropdown"
  ref: [find select element with project options]

// Select "New Project" option
mcp__playwright__browser_select_option
  element: "Project selector"
  ref: [find select element]
  values: ["new"]

// Fill new project modal with entity selection
mcp__playwright__browser_type
  element: "Project name input"
  ref: [find input with placeholder "Project name"]
  text: "Tech Meeting Notes"

mcp__playwright__browser_type
  element: "Project description textarea"
  ref: [find textarea for project description]
  text: "Weekly technical discussion transcriptions"

// NEW: Select entities to add to project during creation
mcp__playwright__browser_click
  element: "Dario Amodei checkbox"
  ref: [find checkbox for Dario Amodei entity]

mcp__playwright__browser_click
  element: "Microsoft checkbox"
  ref: [find checkbox for Microsoft entity]

// Save project with entities
mcp__playwright__browser_click
  element: "Create Project button"
  ref: [find button with text "Create Project"]

// Verify project created with entity pills displayed
mcp__playwright__browser_snapshot
// Should see:
// - "Tech Meeting Notes" selected in dropdown
// - Entity pills showing "Dario Amodei" and "Microsoft" below selector
// - "Active entities: 2" indicator

// Create second project for testing
mcp__playwright__browser_select_option
  element: "Project selector"
  ref: [find select element]
  values: ["new"]

mcp__playwright__browser_type
  element: "Project name input"
  ref: [find input with placeholder "Project name"]
  text: "Polish Business"

mcp__playwright__browser_type
  element: "Project description textarea"
  ref: [find textarea for project description]
  text: "Polish market analysis"

// Don't select any entities for this project
mcp__playwright__browser_click
  element: "Create Project button"
  ref: [find button with text "Create Project"]

// Switch between projects
mcp__playwright__browser_select_option
  element: "Project selector"
  ref: [find select element]
  values: ["Tech Meeting Notes"]

// Verify entity pills update
mcp__playwright__browser_snapshot
// Should see entity pills for "Dario Amodei" and "Microsoft"

mcp__playwright__browser_select_option
  element: "Project selector"
  ref: [find select element]
  values: ["Polish Business"]

// Verify no entity pills for this project
mcp__playwright__browser_snapshot
// Should see no entity pills or "No entities" message
```

### 10. Test Upload with Entity Context
```javascript
// Keep "Tech Meeting Notes" project selected
mcp__playwright__browser_select_option
  element: "Project selector"
  ref: [find select element]
  values: ["Tech Meeting Notes"]

// Verify entity pills are displayed
mcp__playwright__browser_snapshot
// Should see "Active entities: 2" with pills for Dario Amodei and Microsoft

// Upload test file with project context
mcp__playwright__browser_click
  element: "Upload dropzone area"
  ref: [find element with "Click to upload or drag and drop"]

mcp__playwright__browser_file_upload
  paths: ["/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a"]

// The file actually contains "Microsoft" in Polish context
// Entity context should help with accurate transcription

mcp__playwright__browser_click
  element: "Upload and Process button"
  ref: [find button with text "Upload and Process"]

// Wait for processing with entity context
mcp__playwright__browser_wait_for
  time: 10

// Verify transcription includes correctly transcribed entities
mcp__playwright__browser_snapshot
// Should see "Microsoft" correctly transcribed (not "Mikrosoft" or other variations)
// This demonstrates entity context improving transcription accuracy

// Check entity usage tracking (if visible in UI)
// Navigate back to settings to see if entity usage stats updated
mcp__playwright__browser_navigate
  url: "http://localhost:3100/settings"

// Look for entity usage indicators
mcp__playwright__browser_snapshot
// May show usage counts or last used timestamps for entities
```

### 11. Logout and Verify
```javascript
// Click logout button
mcp__playwright__browser_click
  element: "Logout button"
  ref: [find button with text "Logout"]

// Verify redirect to login or home page
// Check that auth token is cleared
mcp__playwright__browser_evaluate
  function: () => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    console.log('Auth token cleared:', !token);
    console.log('User ID cleared:', !userId);
    return { tokenCleared: !token, userIdCleared: !userId };
  }
```

## Expected Results

### Success Criteria
1. ✅ Unique user account created successfully with timestamp
2. ✅ User automatically logged in after registration
3. ✅ Auth token stored in localStorage
4. ✅ File uploads successfully as logged-in user
5. ✅ Transcription completes and displays
6. ✅ Default summary generation with full JSON structure
7. ✅ Custom prompt returns flexible JSON (just 2 sentences)
8. ✅ Library shows user's notes correctly
9. ✅ Dashboard displays user statistics and credit usage
10. ✅ Settings page shows account information

### Entity Management Success Criteria
11. ✅ **Entity CRUD**: Create, view, edit, and delete entities in Settings
12. ✅ **Entity Types**: Support for person, company, technical, product types
13. ✅ **Entity Search/Filter**: Filter by type and search by name
14. ✅ **Bulk Selection**: Multiple entities can be selected with checkboxes
15. ✅ **Project Badges**: Entities show which projects they belong to
16. ✅ **Three-dot Menu**: Edit, Manage Projects, Delete actions work

### Project Management Success Criteria
17. ✅ **Project Creation**: Create projects with name, description, and entities
18. ✅ **Entity Association at Creation**: Select entities when creating project
19. ✅ **Project Selector**: Dropdown shows all projects plus "New Project"
20. ✅ **Entity Pills Display**: Active entities shown below project selector
21. ✅ **Project Switching**: Pills update when switching projects
22. ✅ **ProjectManager Component**: Edit projects in Settings > Projects tab
23. ✅ **Bulk Entity Operations**: Add/remove multiple entities from projects
24. ✅ **Project Deletion**: Delete projects with confirmation dialog

### Entity-Aware Transcription Success Criteria  
25. ✅ **Upload with Context**: ProjectId included in upload FormData
26. ✅ **Improved Transcription**: "Microsoft" correctly transcribed with entity context
27. ✅ **Entity Usage Tracking**: Usage stats updated after transcription
28. ✅ **Context Switching**: Can change project mid-session for different context
29. ✅ Logout clears authentication data
30. ✅ Credits tracked and decremented properly

### Known Issues & Common Failure Points
1. **User Already Exists**: Using timestamp in email prevents this issue
2. **✅ FIXED: Custom Prompt Flexible JSON**: Now works correctly with simple responses
3. **Credit Limits**: Free tier has 5 credits, test may fail if exceeded
4. **Session Persistence**: Auth token should persist across page navigation
5. **Processing Times**: Allow sufficient time for AI operations

## Debugging Tips

### Check User Creation
```javascript
// Verify unique email was generated
mcp__playwright__browser_console_messages
// Look for "Creating user with email: testuser_[timestamp]@example.com"
```

### Verify Authentication State
```javascript
// Check auth headers in API calls
mcp__playwright__browser_network_requests
// Look for Authorization headers with Bearer token
```

### Check Database for User
```bash
# Verify user was created in database
sqlite3 data/nano-grazynka.db "SELECT id, email, tier FROM User WHERE email LIKE 'testuser_%';"

# Check user's notes
sqlite3 data/nano-grazynka.db "SELECT id, userId, title FROM VoiceNote WHERE userId = '[user-id]';"
```

### Monitor Backend Logs
```bash
# Watch for authentication and user creation
docker compose logs backend --tail=50 | grep -E "user|auth|register"
```

## Automation Script

For future automation, this test can be converted into a Playwright test script:

```typescript
// tests/e2e/logged-in-happy-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Logged-In User Happy Path', () => {
  test('should complete full logged-in user flow', async ({ page }) => {
    // 1. Create unique user
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'TestPassword123!';
    
    await page.goto('http://localhost:3100/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button:has-text("Sign up")');
    
    // 2. Wait for redirect and verify logged in
    await page.waitForURL('http://localhost:3100');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // 3. Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/test-data/zabka.m4a');
    await page.click('button:has-text("Upload and Process")');
    
    // 4. Wait for processing
    await page.waitForURL(/\/note\//);
    
    // 5. Generate summary
    await page.click('button:has-text("Summary")');
    await page.click('button:has-text("Generate Summary")');
    await page.waitForSelector('[data-summary-content]');
    
    // 6. Test custom prompt
    await page.click('button:has-text("Regenerate")');
    await page.fill('textarea', 'provide just 2 sentence summary');
    await page.click('button:has-text("Regenerate Summary")');
    
    // 7. Verify flexible JSON response
    const summaryText = await page.textContent('[data-summary-content]');
    const sentences = summaryText.split('.').filter(s => s.trim());
    expect(sentences.length).toBeLessThanOrEqual(3); // 2 sentences + possible partial
    
    // 8. Check library
    await page.goto('http://localhost:3100/library');
    await expect(page.locator('text=/notes in your collection/')).toBeVisible();
    
    // 9. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/(login|$)/);
  });
});
```

## Related Documentation
- [Anonymous User Happy Path](./PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md)
- [Test Plan](./TEST_PLAN.md)
- [Test Results](./TEST_RESULTS_2025_08_13.md)
- [API Contract](../../docs/api/api-contract.md)