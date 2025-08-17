/**
 * MCP Test: Main Application Flow
 * 
 * This test uses Playwright MCP server to test the complete transcription flow.
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
const TEST_FILE_MP3 = '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.mp3';

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate and prepare test environment",
    steps: [
      "1. Navigate to TEST_URL",
      "2. Ensure session is created",
      "3. Take initial snapshot"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      mcp__playwright__browser_evaluate
        function: () => {
          const sessionId = localStorage.getItem('anonymousSessionId');
          return { sessionId, hasSession: !!sessionId };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  uploadFile: {
    description: "Upload audio file for transcription",
    steps: [
      "1. Click upload dropzone",
      "2. Select zabka.m4a file",
      "3. Verify file name appears"
    ],
    mcp_sequence: `
      // Click upload area
      mcp__playwright__browser_click
        element: "Upload dropzone with 'Click to upload' text"
        ref: [find clickable upload area]
      
      // Upload file
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Verify file selected
      mcp__playwright__browser_wait_for
        text: "zabka.m4a"
      
      mcp__playwright__browser_snapshot
    `
  },

  configureLanguage: {
    description: "Select language for transcription",
    steps: [
      "1. Click Polish language button",
      "2. Verify Polish is selected"
    ],
    mcp_sequence: `
      // Select Polish language
      mcp__playwright__browser_click
        element: "Polish language button"
        ref: [find button with text "Polish"]
      
      // Verify selection
      mcp__playwright__browser_evaluate
        function: () => {
          const polishBtn = document.querySelector('button[aria-pressed="true"]') || 
                           document.querySelector('button.selected');
          return polishBtn ? polishBtn.textContent : 'No language selected';
        }
    `
  },

  advancedOptions: {
    description: "Configure advanced transcription options (if available)",
    steps: [
      "1. Check if Advanced Options button exists",
      "2. If yes, click to expand",
      "3. Configure whisper model and prompts"
    ],
    mcp_sequence: `
      // Check for advanced options
      mcp__playwright__browser_evaluate
        function: () => {
          const advBtn = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent.includes('Advanced Options')
          );
          return { hasAdvancedOptions: !!advBtn };
        }
      
      // If available, click to expand
      mcp__playwright__browser_click
        element: "Advanced Options button"
        ref: [if exists, find button with text "Advanced Options"]
      
      // Select whisper model if available
      mcp__playwright__browser_select_option
        element: "Whisper model select"
        ref: [find select with aria-label="Whisper model"]
        values: ["turbo"]
      
      // Add initial prompt if field exists
      mcp__playwright__browser_type
        element: "Initial transcription prompt textarea"
        ref: [find textarea with placeholder containing "initial transcription"]
        text: "Transcribe this Polish audio about a convenience store visit"
    `
  },

  startProcessing: {
    description: "Begin upload and transcription process",
    steps: [
      "1. Click Upload and Process button",
      "2. Verify processing status appears",
      "3. Monitor status changes"
    ],
    mcp_sequence: `
      // Click process button
      mcp__playwright__browser_click
        element: "Upload and Process button"
        ref: [find button with text "Upload and Process"]
      
      // Wait for processing indicator
      mcp__playwright__browser_wait_for
        text: "Processing"
        time: 10
      
      // Monitor status
      mcp__playwright__browser_evaluate
        function: () => {
          const statusElements = Array.from(document.querySelectorAll('*'));
          const status = statusElements.find(el => 
            el.textContent && el.textContent.match(/Processing|Transcribing|Analyzing/i)
          );
          return status ? status.textContent : 'No status found';
        }
    `
  },

  waitForTranscription: {
    description: "Wait for transcription to complete",
    steps: [
      "1. Wait up to 60 seconds for completion",
      "2. Check for transcription result",
      "3. Verify transcription content exists"
    ],
    mcp_sequence: `
      // Wait for transcription result (longer timeout)
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
      
      // Check transcription appeared
      mcp__playwright__browser_evaluate
        function: () => {
          const transcription = document.querySelector('.transcription-result') ||
                               document.querySelector('[data-testid="transcription-result"]') ||
                               document.querySelector('[class*="transcription"]');
          const content = transcription ? transcription.textContent : '';
          return {
            hasTranscription: !!transcription,
            contentLength: content.length,
            preview: content.substring(0, 100)
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  checkPostDialog: {
    description: "Check for and handle post-transcription dialog",
    steps: [
      "1. Check if summary dialog appears",
      "2. If yes, can generate summary or close",
      "3. Verify navigation to note page"
    ],
    mcp_sequence: `
      // Check for dialog
      mcp__playwright__browser_evaluate
        function: () => {
          const dialog = document.querySelector('[role="dialog"]') ||
                        document.querySelector('.modal') ||
                        document.querySelector('[class*="dialog"]');
          return { hasDialog: !!dialog, dialogText: dialog ? dialog.textContent : '' };
        }
      
      // If dialog exists, check options
      mcp__playwright__browser_snapshot
      
      // Can click "Generate Summary" or "Skip"
      mcp__playwright__browser_click
        element: "Generate Summary button (if desired)"
        ref: [find button with text "Generate Summary" or "Skip"]
    `
  },

  verifySummary: {
    description: "Verify summary generation (if selected)",
    steps: [
      "1. Wait for summary to generate",
      "2. Check summary content",
      "3. Verify summary structure"
    ],
    mcp_sequence: `
      // Wait for summary
      mcp__playwright__browser_wait_for
        text: "Summary"
        time: 30
      
      // Check summary content
      mcp__playwright__browser_evaluate
        function: () => {
          const summaryElement = document.querySelector('.summary-content') ||
                                document.querySelector('[data-testid="summary"]') ||
                                document.querySelector('[class*="summary"]');
          if (!summaryElement) return { hasSummary: false };
          
          const content = summaryElement.textContent;
          return {
            hasSummary: true,
            hasKeyPoints: content.includes('Key Points') || content.includes('key_points'),
            hasActionItems: content.includes('Action Items') || content.includes('action_items'),
            contentLength: content.length
          };
        }
    `
  },

  customPromptRegeneration: {
    description: "Test summary regeneration with custom prompt",
    steps: [
      "1. Click Regenerate or edit button",
      "2. Enter custom prompt",
      "3. Submit and verify new summary"
    ],
    mcp_sequence: `
      // Find regenerate button
      mcp__playwright__browser_click
        element: "Regenerate summary button"
        ref: [find button with text "Regenerate" or icon button near summary]
      
      // Enter custom prompt
      mcp__playwright__browser_type
        element: "Custom prompt input"
        ref: [find input or textarea for custom prompt]
        text: "Provide a 2 sentence summary only"
      
      // Submit
      mcp__playwright__browser_click
        element: "Submit/Generate button"
        ref: [find submit button]
      
      // Wait for new summary
      mcp__playwright__browser_wait_for
        text: "Summary"
        time: 20
      
      // Verify it's shorter (2 sentences)
      mcp__playwright__browser_evaluate
        function: () => {
          const summary = document.querySelector('[class*="summary"]');
          const sentences = summary ? summary.textContent.split(/[.!?]+/).length : 0;
          return { sentenceCount: sentences, isShort: sentences <= 3 };
        }
    `
  },

  navigationToLibrary: {
    description: "Navigate to library to see processed note",
    steps: [
      "1. Navigate to library page",
      "2. Verify note appears in list",
      "3. Check note has AI-generated title"
    ],
    mcp_sequence: `
      // Navigate to library
      mcp__playwright__browser_navigate
        url: "${TEST_URL}/library"
      
      // Check note appears
      mcp__playwright__browser_wait_for
        text: "zabka"
        time: 5
      
      // Verify AI title exists
      mcp__playwright__browser_evaluate
        function: () => {
          const noteCards = Array.from(document.querySelectorAll('[class*="note-card"]'));
          const zabkaNote = noteCards.find(card => 
            card.textContent.toLowerCase().includes('zabka') ||
            card.textContent.toLowerCase().includes('convenience store')
          );
          return {
            hasNote: !!zabkaNote,
            noteTitle: zabkaNote ? zabkaNote.querySelector('h3')?.textContent : null
          };
        }
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'uploadFile',
    'configureLanguage',
    'advancedOptions',
    'startProcessing',
    'waitForTranscription',
    'checkPostDialog',
    'verifySummary',
    'customPromptRegeneration',
    'navigationToLibrary'
  ],
  notes: [
    "Run each scenario sequentially",
    "Advanced options may not always be visible",
    "Processing can take 30-60 seconds",
    "Summary dialog is optional based on user flow",
    "Custom prompt regeneration tests flexible JSON parsing"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Main Application Flow',
  estimatedTime: '15 minutes'
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Main Application Flow
==========================================

This test validates:
✓ Complete file upload process
✓ Language selection (Polish/English)
✓ Advanced options configuration
✓ Transcription processing
✓ Summary generation
✓ Custom prompt regeneration
✓ Navigation to library

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test files: 
- ${TEST_FILE}
- ${TEST_FILE_MP3}
`);