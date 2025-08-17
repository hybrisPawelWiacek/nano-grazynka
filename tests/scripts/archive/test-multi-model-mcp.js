/**
 * MCP Test: Multi-Model Transcription
 * 
 * This test uses Playwright MCP server to test GPT-4o vs Gemini 2.0 Flash model selection.
 * Execute through Claude with MCP enabled.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - Playwright MCP server enabled
 * - Test data in tests/test-data/
 * - Both GPT-4o and Gemini API keys configured
 */

// Test configuration
const TEST_URL = 'http://localhost:3100';
const TEST_FILE = '/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/tests/test-data/zabka.m4a';

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate and prepare for model testing",
    steps: [
      "1. Navigate to home page",
      "2. Upload test file",
      "3. Expand Advanced Options"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Upload file
      mcp__playwright__browser_click
        element: "Upload dropzone"
        ref: [find upload area]
      
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Expand advanced options
      mcp__playwright__browser_click
        element: "Advanced Options button"
        ref: [find button with text "Advanced Options" or chevron icon]
      
      mcp__playwright__browser_snapshot
    `
  },

  checkModelOptions: {
    description: "Verify both model options are available",
    steps: [
      "1. Check for model selection radio buttons",
      "2. Verify GPT-4o option exists",
      "3. Verify Gemini 2.0 Flash option exists"
    ],
    mcp_sequence: `
      mcp__playwright__browser_evaluate
        function: () => {
          const gpt4o = Array.from(document.querySelectorAll('input[type="radio"], label')).find(
            el => el.textContent?.includes('GPT-4o') || el.value === 'gpt-4o'
          );
          const gemini = Array.from(document.querySelectorAll('input[type="radio"], label')).find(
            el => el.textContent?.includes('Gemini') || el.value === 'gemini'
          );
          return {
            hasGPT4o: !!gpt4o,
            hasGemini: !!gemini,
            gpt4oText: gpt4o?.textContent,
            geminiText: gemini?.textContent
          };
        }
    `
  },

  selectGPT4o: {
    description: "Select GPT-4o model and verify features",
    steps: [
      "1. Click GPT-4o radio button",
      "2. Verify whisper prompt field appears",
      "3. Check token limit display (224 tokens)",
      "4. Verify cost estimator"
    ],
    mcp_sequence: `
      // Select GPT-4o
      mcp__playwright__browser_click
        element: "GPT-4o radio button or label"
        ref: [find element with text "GPT-4o"]
      
      // Check whisper prompt field appears
      mcp__playwright__browser_evaluate
        function: () => {
          const whisperPrompt = document.querySelector('textarea[placeholder*="whisper"], textarea[name*="whisper"]');
          const tokenDisplay = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/224.*tokens|token.*limit.*224/i)
          );
          const costDisplay = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/cost|price|\\$/i)
          );
          return {
            hasWhisperPrompt: !!whisperPrompt,
            hasTokenLimit: !!tokenDisplay,
            hasCostDisplay: !!costDisplay,
            tokenText: tokenDisplay?.textContent
          };
        }
      
      // Add whisper prompt
      mcp__playwright__browser_type
        element: "Whisper prompt textarea"
        ref: [find whisper prompt field]
        text: "Focus on Polish convenience store terms like 'żabka', 'paragon', prices in złoty"
    `
  },

  selectGemini: {
    description: "Select Gemini 2.0 Flash and verify features",
    steps: [
      "1. Click Gemini 2.0 Flash radio button",
      "2. Verify template selector appears",
      "3. Check available templates",
      "4. Verify entity/project context fields"
    ],
    mcp_sequence: `
      // Select Gemini
      mcp__playwright__browser_click
        element: "Gemini 2.0 Flash radio button or label"
        ref: [find element with text "Gemini"]
      
      // Check template selector
      mcp__playwright__browser_evaluate
        function: () => {
          const templateSelect = document.querySelector('select[name*="template"], select[aria-label*="template"]');
          const templates = templateSelect ? Array.from(templateSelect.options).map(opt => opt.text) : [];
          const entityField = document.querySelector('textarea[placeholder*="entity"], textarea[placeholder*="Entity"]');
          const projectField = document.querySelector('textarea[placeholder*="project"], textarea[placeholder*="Project"]');
          return {
            hasTemplateSelector: !!templateSelect,
            templates: templates,
            hasEntityContext: !!entityField,
            hasProjectContext: !!projectField
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  testMeetingTemplate: {
    description: "Test Gemini with Meeting template",
    steps: [
      "1. Select Meeting template",
      "2. Verify prompt preview updates",
      "3. Add entity context",
      "4. Process with Meeting template"
    ],
    mcp_sequence: `
      // Select Meeting template
      mcp__playwright__browser_select_option
        element: "Template selector"
        ref: [find template select]
        values: ["Meeting"]
      
      // Add entity context
      mcp__playwright__browser_type
        element: "Entity context field"
        ref: [find entity textarea]
        text: "John Smith - Store Manager, Anna Kowalska - Customer"
      
      // Process
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
      
      // Wait for transcription
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
      
      // Verify speaker identification
      mcp__playwright__browser_evaluate
        function: () => {
          const transcription = document.querySelector('[class*="transcription"]');
          const hasSpeakers = transcription?.textContent.includes('Speaker') || 
                             transcription?.textContent.includes('John Smith') ||
                             transcription?.textContent.includes('Anna');
          return {
            hasSpeakerIdentification: hasSpeakers,
            preview: transcription?.textContent.substring(0, 200)
          };
        }
    `
  },

  testTechnicalTemplate: {
    description: "Test Gemini with Technical Documentation template",
    steps: [
      "1. Navigate back to upload",
      "2. Select Technical Documentation template",
      "3. Process with technical focus"
    ],
    mcp_sequence: `
      // Navigate back
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Upload and select Gemini again
      // ... (repeat upload steps)
      
      // Select Technical template
      mcp__playwright__browser_select_option
        element: "Template selector"
        ref: [find template select]
        values: ["Technical Documentation"]
      
      // Process and verify technical terms highlighted
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
    `
  },

  testPodcastTemplate: {
    description: "Test Gemini with Podcast/Interview template",
    steps: [
      "1. Select Podcast/Interview template",
      "2. Verify Q&A format in transcription"
    ],
    mcp_sequence: `
      // Select Podcast template
      mcp__playwright__browser_select_option
        element: "Template selector"
        ref: [find template select]
        values: ["Podcast/Interview"]
      
      // Process and verify Q&A format
      // ... (similar to above)
    `
  },

  testCustomGeminiPrompt: {
    description: "Test Gemini with custom prompt",
    steps: [
      "1. Enter custom prompt instead of template",
      "2. Verify custom instructions followed"
    ],
    mcp_sequence: `
      // Clear template selection or select "Custom"
      mcp__playwright__browser_select_option
        element: "Template selector"
        ref: [find template select]
        values: ["Custom"]
      
      // Enter custom prompt
      mcp__playwright__browser_type
        element: "Custom prompt textarea"
        ref: [find custom prompt field]
        text: "Transcribe this as a shopping list with items and prices"
      
      // Process and verify format
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
    `
  },

  compareTokenLimits: {
    description: "Compare token limits between models",
    steps: [
      "1. Switch to GPT-4o, note 224 token limit",
      "2. Switch to Gemini, note 1M token limit",
      "3. Verify warning for GPT-4o with long prompts"
    ],
    mcp_sequence: `
      // Select GPT-4o
      mcp__playwright__browser_click
        element: "GPT-4o option"
        ref: [find GPT-4o radio]
      
      // Try to enter long prompt
      mcp__playwright__browser_type
        element: "Whisper prompt"
        ref: [find whisper prompt]
        text: [very long text over 224 tokens]
      
      // Check for warning
      mcp__playwright__browser_evaluate
        function: () => {
          const warning = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/exceeds.*limit|too.*long|224.*tokens/i)
          );
          return { hasWarning: !!warning, warningText: warning?.textContent };
        }
      
      // Switch to Gemini - no warning
      mcp__playwright__browser_click
        element: "Gemini option"
        ref: [find Gemini radio]
    `
  },

  verifyCostDisplay: {
    description: "Verify cost estimation display",
    steps: [
      "1. Check GPT-4o shows higher cost",
      "2. Check Gemini shows 75% savings",
      "3. Verify cost updates with file duration"
    ],
    mcp_sequence: `
      mcp__playwright__browser_evaluate
        function: () => {
          const costElements = Array.from(document.querySelectorAll('*')).filter(
            el => el.textContent?.match(/\\$|cost|price|savings/i)
          );
          return {
            costInfo: costElements.map(el => el.textContent),
            hasSavingsInfo: costElements.some(el => el.textContent.includes('75%'))
          };
        }
    `
  },

  testModelPersistence: {
    description: "Test model selection persists on collapse/expand",
    steps: [
      "1. Select Gemini with settings",
      "2. Collapse Advanced Options",
      "3. Expand again",
      "4. Verify selection preserved"
    ],
    mcp_sequence: `
      // Select Gemini with specific settings
      mcp__playwright__browser_click
        element: "Gemini option"
        ref: [find Gemini radio]
      
      // Collapse advanced options
      mcp__playwright__browser_click
        element: "Advanced Options toggle"
        ref: [find collapse button]
      
      // Expand again
      mcp__playwright__browser_click
        element: "Advanced Options toggle"
        ref: [find expand button]
      
      // Verify selection preserved
      mcp__playwright__browser_evaluate
        function: () => {
          const geminiSelected = document.querySelector('input[value="gemini"]:checked');
          return { geminiStillSelected: !!geminiSelected };
        }
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'checkModelOptions',
    'selectGPT4o',
    'selectGemini',
    'testMeetingTemplate',
    'testTechnicalTemplate',
    'testPodcastTemplate',
    'testCustomGeminiPrompt',
    'compareTokenLimits',
    'verifyCostDisplay',
    'testModelPersistence'
  ],
  notes: [
    "Advanced Options must be expanded to see model selection",
    "GPT-4o limited to 224 token whisper prompts",
    "Gemini supports 1M tokens and templates",
    "Each model test requires full processing (30-60s)",
    "Cost display depends on audio file duration"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Multi-Model Transcription',
  estimatedTime: '25 minutes'
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Multi-Model Transcription
==========================================

This test validates:
✓ GPT-4o model selection
✓ Gemini 2.0 Flash selection
✓ Whisper prompt for GPT-4o
✓ Template selection for Gemini
✓ Entity/Project context
✓ Token limit validation
✓ Cost estimation display
✓ Model persistence

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test file: ${TEST_FILE}
`);