/**
 * MCP Test: Two-Pass Transcription
 * 
 * This test uses Playwright MCP server to test advanced transcription options.
 * Execute through Claude with MCP enabled.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - Playwright MCP server enabled  
 * - Test data in tests/test-data/
 */

// Test configuration
const TEST_URL = 'http://localhost:3100';
const TEST_FILE = '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a';

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate and prepare for two-pass testing",
    steps: [
      "1. Navigate to home page",
      "2. Upload test file",
      "3. Toggle Advanced Options"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      mcp__playwright__browser_click
        element: "Upload dropzone"
        ref: [find upload area]
      
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      mcp__playwright__browser_click
        element: "Advanced Options"
        ref: [find Advanced Options button]
      
      mcp__playwright__browser_snapshot
    `
  },

  checkWhisperPrompts: {
    description: "Verify whisper prompt fields are available",
    steps: [
      "1. Check for initial transcription prompt",
      "2. Check for correction prompt field",
      "3. Verify placeholders and labels"
    ],
    mcp_sequence: `
      mcp__playwright__browser_evaluate
        function: () => {
          const initialPrompt = document.querySelector('textarea[placeholder*="initial"], textarea[name*="initial"]');
          const correctionPrompt = document.querySelector('textarea[placeholder*="correction"], textarea[name*="correction"]');
          return {
            hasInitialPrompt: !!initialPrompt,
            hasCorrectionPrompt: !!correctionPrompt,
            initialPlaceholder: initialPrompt?.placeholder,
            correctionPlaceholder: correctionPrompt?.placeholder
          };
        }
    `
  },

  enterInitialPrompt: {
    description: "Enter initial transcription prompt",
    steps: [
      "1. Enter specific terms for initial pass",
      "2. Verify token count updates"
    ],
    mcp_sequence: `
      mcp__playwright__browser_type
        element: "Initial transcription prompt"
        ref: [find initial prompt textarea]
        text: "This is Polish audio. Focus on: żabka, paragon, złoty, grosz"
      
      // Check token count
      mcp__playwright__browser_evaluate
        function: () => {
          const tokenCount = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/\\d+.*tokens|tokens.*\\d+/i)
          );
          return { tokenDisplay: tokenCount?.textContent };
        }
    `
  },

  enterCorrectionPrompt: {
    description: "Enter correction prompt for second pass",
    steps: [
      "1. Enter correction instructions",
      "2. Focus on specific improvements"
    ],
    mcp_sequence: `
      mcp__playwright__browser_type
        element: "Correction prompt"
        ref: [find correction prompt textarea]
        text: "Correct any Polish store names, price amounts should be in złoty (zł)"
    `
  },

  processWithTwoPass: {
    description: "Process audio with two-pass configuration",
    steps: [
      "1. Click Upload and Process",
      "2. Monitor both transcription passes",
      "3. Verify corrections applied"
    ],
    mcp_sequence: `
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
      
      // Wait for first pass
      mcp__playwright__browser_wait_for
        text: "Transcribing"
        time: 30
      
      // Check for correction phase indicator
      mcp__playwright__browser_evaluate
        function: () => {
          const status = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/Correcting|Second pass|Refining/i)
          );
          return { hasCorrectionPhase: !!status, statusText: status?.textContent };
        }
      
      // Wait for completion
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
    `
  },

  verifyImprovedTranscription: {
    description: "Verify transcription includes prompted terms",
    steps: [
      "1. Check transcription contains Polish terms",
      "2. Verify prices in złoty",
      "3. Check overall quality"
    ],
    mcp_sequence: `
      mcp__playwright__browser_evaluate
        function: () => {
          const transcription = document.querySelector('[class*="transcription"]');
          const text = transcription?.textContent || '';
          return {
            hasZabka: text.toLowerCase().includes('żabka'),
            hasZloty: text.includes('zł') || text.toLowerCase().includes('złot'),
            hasParagon: text.toLowerCase().includes('paragon'),
            transcriptionLength: text.length,
            preview: text.substring(0, 200)
          };
        }
    `
  },

  testModelSpecificPrompts: {
    description: "Test different prompts for GPT-4o vs Gemini",
    steps: [
      "1. Select GPT-4o model",
      "2. Enter GPT-4o specific prompt",
      "3. Switch to Gemini",
      "4. Enter Gemini specific prompt"
    ],
    mcp_sequence: `
      // Select GPT-4o
      mcp__playwright__browser_click
        element: "GPT-4o radio"
        ref: [find GPT-4o option]
      
      // Enter GPT-4o prompt (limited to 224 tokens)
      mcp__playwright__browser_type
        element: "Whisper prompt for GPT-4o"
        ref: [find whisper prompt]
        text: "Polish convenience store conversation"
      
      // Switch to Gemini
      mcp__playwright__browser_click
        element: "Gemini radio"
        ref: [find Gemini option]
      
      // Enter longer Gemini prompt (1M token limit)
      mcp__playwright__browser_type
        element: "Gemini prompt"
        ref: [find Gemini prompt field]
        text: [much longer, detailed prompt with examples]
    `
  },

  testPromptPersistence: {
    description: "Test prompts persist across sessions",
    steps: [
      "1. Enter prompts",
      "2. Collapse Advanced Options",
      "3. Expand again",
      "4. Verify prompts retained"
    ],
    mcp_sequence: `
      // Enter prompts
      mcp__playwright__browser_type
        element: "Initial prompt"
        ref: [find initial prompt]
        text: "Test prompt persistence"
      
      // Collapse
      mcp__playwright__browser_click
        element: "Advanced Options toggle"
        ref: [find collapse button]
      
      // Expand
      mcp__playwright__browser_click
        element: "Advanced Options toggle"
        ref: [find expand button]
      
      // Check prompts still there
      mcp__playwright__browser_evaluate
        function: () => {
          const initial = document.querySelector('textarea[name*="initial"]');
          return {
            promptRetained: initial?.value === "Test prompt persistence"
          };
        }
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'checkWhisperPrompts',
    'enterInitialPrompt',
    'enterCorrectionPrompt',
    'processWithTwoPass',
    'verifyImprovedTranscription',
    'testModelSpecificPrompts',
    'testPromptPersistence'
  ],
  notes: [
    "Two-pass transcription may take longer",
    "Correction prompt helps refine initial transcription",
    "GPT-4o limited to 224 tokens per prompt",
    "Gemini supports much longer prompts",
    "Prompts should persist during UI interactions"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Two-Pass Transcription',
  estimatedTime: '15 minutes'
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Two-Pass Transcription
==========================================

This test validates:
✓ Initial transcription prompt
✓ Correction prompt (second pass)
✓ Token counting
✓ Model-specific prompts
✓ Prompt persistence
✓ Two-pass processing
✓ Transcription improvements

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test file: ${TEST_FILE}
`);