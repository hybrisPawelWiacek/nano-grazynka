/**
 * MCP Test: Anonymous User Flow
 * 
 * This test uses Playwright MCP server to test anonymous user functionality.
 * Execute through Claude with MCP enabled.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - Backend API at http://localhost:3101
 * - Playwright MCP server enabled
 * - Test data in tests/test-data/
 */

// Test configuration
const TEST_URL = 'http://localhost:3100';
const API_URL = 'http://localhost:3101';
const TEST_FILE = '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a';

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate and prepare test environment",
    steps: [
      "1. Navigate to TEST_URL using mcp__playwright__browser_navigate",
      "2. Clear localStorage if needed using mcp__playwright__browser_evaluate",
      "3. Verify page loaded with mcp__playwright__browser_snapshot"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      mcp__playwright__browser_evaluate
        function: () => { localStorage.clear(); return 'Storage cleared'; }
    `
  },

  sessionGeneration: {
    description: "Test anonymous session creation",
    steps: [
      "1. Reload page to trigger session creation",
      "2. Check localStorage for anonymousSessionId",
      "3. Verify session ID is valid UUID format"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      mcp__playwright__browser_evaluate
        function: () => {
          const sessionId = localStorage.getItem('anonymousSessionId');
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sessionId);
          return { 
            sessionId, 
            isValidUUID,
            message: isValidUUID ? 'Valid session ID created' : 'Invalid or missing session ID'
          };
        }
    `
  },

  freeUsesDisplay: {
    description: "Verify free uses counter shows 5/5",
    steps: [
      "1. Take snapshot to see UI state",
      "2. Look for 'Free uses: X / 5 remaining' text",
      "3. Verify it shows 5 remaining for new session"
    ],
    mcp_sequence: `
      mcp__playwright__browser_snapshot
      
      mcp__playwright__browser_evaluate
        function: () => {
          const elements = Array.from(document.querySelectorAll('*'));
          const freeUsesElement = elements.find(el => 
            el.textContent && el.textContent.match(/Free uses:.*\\d+.*\\/.*5.*remaining/i)
          );
          return freeUsesElement ? freeUsesElement.textContent : 'Free uses text not found';
        }
    `
  },

  fileUpload: {
    description: "Upload file as anonymous user",
    steps: [
      "1. Click on upload dropzone area",
      "2. Select test file zabka.m4a",
      "3. Select Polish language",
      "4. Click Upload and Process",
      "5. Verify processing starts"
    ],
    mcp_sequence: `
      mcp__playwright__browser_snapshot
      
      // Click the upload dropzone (look for "Click to upload" text)
      mcp__playwright__browser_click
        element: "Upload dropzone with 'Click to upload' text"
        ref: [find the clickable area element]
      
      // Upload the test file
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Wait for file to be selected
      mcp__playwright__browser_wait_for
        text: "zabka.m4a"
      
      // Select Polish language
      mcp__playwright__browser_click
        element: "Polish language button"
        ref: [find button with text "Polish"]
      
      // Click Upload and Process
      mcp__playwright__browser_click
        element: "Upload and Process button"
        ref: [find button with text "Upload and Process"]
      
      // Wait for processing to start
      mcp__playwright__browser_wait_for
        text: "Processing"
        time: 10
    `
  },

  usageTracking: {
    description: "Verify usage count decrements",
    steps: [
      "1. Check initial usage (should be 4/5 after one upload)",
      "2. Upload another file",
      "3. Verify usage is now 3/5"
    ],
    mcp_sequence: `
      // Check current usage in UI
      mcp__playwright__browser_evaluate
        function: () => {
          const elements = Array.from(document.querySelectorAll('*'));
          const freeUsesElement = elements.find(el => 
            el.textContent && el.textContent.match(/Free uses:.*\\d+.*\\/.*5.*remaining/i)
          );
          return freeUsesElement ? freeUsesElement.textContent : 'Usage counter not found';
        }
      
      // Alternative: Check via API
      mcp__playwright__browser_evaluate
        function: async () => {
          const sessionId = localStorage.getItem('anonymousSessionId');
          const response = await fetch('${API_URL}/api/anonymous/usage', {
            headers: { 'x-session-id': sessionId }
          });
          const data = await response.json();
          return { remaining: data.remaining, used: data.used };
        }
    `
  },

  sessionPersistence: {
    description: "Verify session persists across page navigation",
    steps: [
      "1. Store current session ID",
      "2. Navigate to library page",
      "3. Navigate back to home",
      "4. Verify session ID unchanged"
    ],
    mcp_sequence: `
      // Get current session ID
      mcp__playwright__browser_evaluate
        function: () => localStorage.getItem('anonymousSessionId')
      
      // Navigate to library
      mcp__playwright__browser_navigate
        url: "${TEST_URL}/library"
      
      // Navigate back to home
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Check session ID is same
      mcp__playwright__browser_evaluate
        function: () => localStorage.getItem('anonymousSessionId')
    `
  },

  usageLimit: {
    description: "Test usage limit enforcement after 5 uploads",
    steps: [
      "1. Upload 5 files total (may need to repeat upload)",
      "2. Attempt 6th upload",
      "3. Verify upgrade modal or limit message appears"
    ],
    mcp_sequence: `
      // This would need to be run after 5 successful uploads
      // Try to upload 6th file
      mcp__playwright__browser_click
        element: "Upload dropzone"
        ref: [find upload area]
      
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Should see upgrade modal or limit message
      mcp__playwright__browser_wait_for
        text: "upgrade"
        time: 5
      
      mcp__playwright__browser_snapshot
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'sessionGeneration',
    'freeUsesDisplay',
    'fileUpload',
    'usageTracking',
    'sessionPersistence',
    'usageLimit'
  ],
  notes: [
    "Run each scenario sequentially",
    "Take screenshots at key points for verification",
    "Session ID should remain consistent throughout",
    "Usage counter should decrement with each upload",
    "The usageLimit test requires 5 uploads to test properly"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Anonymous User Flow',
  estimatedTime: '10 minutes'
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Anonymous User Flow
==========================================

This test validates:
✓ Anonymous session generation
✓ Free uses counter (5 free uploads)
✓ File upload without authentication
✓ Usage tracking and limits
✓ Session persistence

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test file: ${TEST_FILE}
`);