#!/usr/bin/env node

/**
 * E2E Test for Entity-Aware Transcription
 * Test ID: I4.8 (Integration Test Suite 4)
 * 
 * Purpose: Validate the complete entity system flow:
 * 1. Create a project
 * 2. Add entities to the project
 * 3. Upload audio with project context
 * 4. Verify entity injection in transcription
 * 
 * This test uses Playwright MCP server tools directly as per TEST_PLAN.md requirements.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100 (frontend) and :3101 (backend)
 * - Playwright MCP server enabled in claude-mcp-env.sh
 * - Test audio file: zabka.m4a
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:3100';
const BACKEND_URL = 'http://localhost:3101';
const TEST_AUDIO = path.join(__dirname, '../test-data/zabka.m4a');
const TEST_TIMEOUT = 60000; // 60 seconds

// Test data
const TEST_PROJECT = {
  name: `Test Project ${Date.now()}`,
  description: 'E2E test project for entity-aware transcription'
};

const TEST_ENTITIES = [
  {
    name: 'Żabka',
    type: 'company',
    value: 'Żabka',
    aliases: ['Zabka', 'Żabka Store'],
    description: 'Polish convenience store chain'
  },
  {
    name: 'Claude API',
    type: 'technical',
    value: 'Claude API',
    aliases: ['Claude SDK', 'Anthropic API'],
    description: 'Anthropic AI API'
  },
  {
    name: 'Dario Amodei',
    type: 'person',
    value: 'Dario Amodei',
    aliases: ['Dario', 'Darry-o'],
    description: 'CEO of Anthropic'
  },
  {
    name: 'RLHF',
    type: 'technical',
    value: 'RLHF',
    aliases: ['RLH', 'Reinforcement Learning from Human Feedback'],
    description: 'AI training technique'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const typeColors = {
    'info': colors.cyan,
    'success': colors.green,
    'error': colors.red,
    'warning': colors.yellow,
    'step': colors.blue
  };
  
  const color = typeColors[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(stepNumber, stepName) {
  console.log(`\n${colors.bright}${colors.blue}═══ Step ${stepNumber}: ${stepName} ═══${colors.reset}\n`);
}

/**
 * Test execution plan using Playwright MCP
 * 
 * Note: This is a documentation of the test steps.
 * In actual execution with Claude, these would be MCP tool calls.
 */
async function runEntityAwareTranscriptionTest() {
  log('Starting Entity-Aware Transcription E2E Test', 'step');
  
  const testSteps = [
    {
      step: 1,
      name: 'Navigate to Homepage',
      mcp_tool: 'mcp__playwright__browser_navigate',
      params: { url: FRONTEND_URL },
      validation: 'Homepage loads with upload area visible'
    },
    {
      step: 2,
      name: 'Check Anonymous Session',
      mcp_tool: 'mcp__playwright__browser_evaluate',
      params: { 
        function: '() => localStorage.getItem("anonymousSessionId")'
      },
      validation: 'Anonymous session ID exists'
    },
    {
      step: 3,
      name: 'Navigate to Settings',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'Settings link',
        ref: 'nav-settings'
      },
      validation: 'Settings page loads'
    },
    {
      step: 4,
      name: 'Access Entity Manager',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'Entity Manager section',
        ref: 'entity-manager-section'
      },
      validation: 'Entity Manager component visible'
    },
    {
      step: 5,
      name: 'Create New Project',
      substeps: [
        {
          action: 'Click Projects tab',
          mcp_tool: 'mcp__playwright__browser_click',
          params: { element: 'Projects', ref: 'projects-tab' }
        },
        {
          action: 'Click New Project button',
          mcp_tool: 'mcp__playwright__browser_click',
          params: { element: 'New Project', ref: 'new-project-btn' }
        },
        {
          action: 'Enter project name',
          mcp_tool: 'mcp__playwright__browser_type',
          params: { 
            element: 'Project name input',
            ref: 'project-name-input',
            text: TEST_PROJECT.name
          }
        },
        {
          action: 'Enter project description',
          mcp_tool: 'mcp__playwright__browser_type',
          params: { 
            element: 'Project description input',
            ref: 'project-desc-input',
            text: TEST_PROJECT.description
          }
        },
        {
          action: 'Submit project creation',
          mcp_tool: 'mcp__playwright__browser_click',
          params: { element: 'Create Project', ref: 'create-project-btn' }
        }
      ],
      validation: 'Project created and appears in list'
    },
    {
      step: 6,
      name: 'Add Entities to Project',
      substeps: TEST_ENTITIES.map((entity, index) => ({
        action: `Add entity: ${entity.name}`,
        substeps: [
          {
            action: 'Click Add Entity',
            mcp_tool: 'mcp__playwright__browser_click',
            params: { element: 'Add Entity', ref: 'add-entity-btn' }
          },
          {
            action: 'Enter entity name',
            mcp_tool: 'mcp__playwright__browser_type',
            params: { 
              element: 'Entity name',
              ref: 'entity-name-input',
              text: entity.name
            }
          },
          {
            action: 'Select entity type',
            mcp_tool: 'mcp__playwright__browser_select_option',
            params: { 
              element: 'Entity type',
              ref: 'entity-type-select',
              values: [entity.type]
            }
          },
          {
            action: 'Enter entity value',
            mcp_tool: 'mcp__playwright__browser_type',
            params: { 
              element: 'Entity value',
              ref: 'entity-value-input',
              text: entity.value
            }
          },
          {
            action: 'Enter aliases',
            mcp_tool: 'mcp__playwright__browser_type',
            params: { 
              element: 'Entity aliases',
              ref: 'entity-aliases-input',
              text: entity.aliases.join(', ')
            }
          },
          {
            action: 'Enter description',
            mcp_tool: 'mcp__playwright__browser_type',
            params: { 
              element: 'Entity description',
              ref: 'entity-desc-input',
              text: entity.description
            }
          },
          {
            action: 'Save entity',
            mcp_tool: 'mcp__playwright__browser_click',
            params: { element: 'Save Entity', ref: 'save-entity-btn' }
          }
        ]
      })),
      validation: 'All entities added and visible in list'
    },
    {
      step: 7,
      name: 'Associate Entities with Project',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'Add entities to project',
        ref: 'add-to-project-btn'
      },
      validation: 'Entities associated with project'
    },
    {
      step: 8,
      name: 'Navigate to Upload Page',
      mcp_tool: 'mcp__playwright__browser_navigate',
      params: { url: FRONTEND_URL },
      validation: 'Homepage loads'
    },
    {
      step: 9,
      name: 'Select Project for Upload',
      mcp_tool: 'mcp__playwright__browser_select_option',
      params: { 
        element: 'Project selector',
        ref: 'project-selector',
        values: [TEST_PROJECT.name]
      },
      validation: 'Project selected, entity pills visible'
    },
    {
      step: 10,
      name: 'Verify Entity Pills Display',
      mcp_tool: 'mcp__playwright__browser_snapshot',
      validation: `Should see ${TEST_ENTITIES.length} entity pills`
    },
    {
      step: 11,
      name: 'Upload Audio File',
      substeps: [
        {
          action: 'Click upload area',
          mcp_tool: 'mcp__playwright__browser_click',
          params: { element: 'Click to upload', ref: 'upload-area' }
        },
        {
          action: 'Select file',
          mcp_tool: 'mcp__playwright__browser_file_upload',
          params: { paths: [TEST_AUDIO] }
        }
      ],
      validation: 'File selected and ready for upload'
    },
    {
      step: 12,
      name: 'Select Transcription Model',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'GPT-4o transcribe radio',
        ref: 'model-gpt4o'
      },
      validation: 'GPT-4o model selected'
    },
    {
      step: 13,
      name: 'Process with Entity Context',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'Upload and Process',
        ref: 'upload-btn'
      },
      validation: 'Upload starts, processing begins'
    },
    {
      step: 14,
      name: 'Wait for Processing',
      mcp_tool: 'mcp__playwright__browser_wait_for',
      params: { 
        text: 'Completed',
        time: 30
      },
      validation: 'Processing completed successfully'
    },
    {
      step: 15,
      name: 'Verify Transcription Accuracy',
      substeps: [
        {
          action: 'Get transcription text',
          mcp_tool: 'mcp__playwright__browser_evaluate',
          params: { 
            function: '() => document.querySelector(".transcription-content").textContent'
          }
        },
        {
          action: 'Check for correct entities',
          validation: [
            'Transcription contains "Żabka" (not "Zabka" or "clawed")',
            'Contains "Claude API" (not "clawed API")',
            'Contains "Dario Amodei" (not "Darry-o")',
            'Contains "RLHF" (not "RLH")'
          ]
        }
      ],
      validation: 'All entities correctly transcribed'
    },
    {
      step: 16,
      name: 'Generate Summary',
      mcp_tool: 'mcp__playwright__browser_click',
      params: { 
        element: 'Generate Summary',
        ref: 'generate-summary-btn'
      },
      validation: 'Summary generated with entity context'
    },
    {
      step: 17,
      name: 'Verify Summary Contains Entities',
      mcp_tool: 'mcp__playwright__browser_evaluate',
      params: { 
        function: '() => document.querySelector(".summary-content").textContent'
      },
      validation: 'Summary correctly uses entity names'
    },
    {
      step: 18,
      name: 'Check Entity Usage Tracking',
      description: 'Verify backend tracked entity usage',
      api_call: {
        method: 'GET',
        url: `${BACKEND_URL}/api/entity-usage`,
        params: { voiceNoteId: 'latest' }
      },
      validation: 'Entity usage logged for all detected entities'
    },
    {
      step: 19,
      name: 'Test Entity Context Compression',
      description: 'Verify GPT-4o compression (top 20 entities)',
      substeps: [
        {
          action: 'Add 25 more test entities',
          validation: 'Total entities > 20'
        },
        {
          action: 'Upload another file',
          validation: 'Only top 20 entities in prompt'
        }
      ]
    },
    {
      step: 20,
      name: 'Test Gemini Expansion',
      substeps: [
        {
          action: 'Select Gemini 2.0 Flash',
          mcp_tool: 'mcp__playwright__browser_click',
          params: { element: 'Gemini 2.0 Flash', ref: 'model-gemini' }
        },
        {
          action: 'Upload with Gemini',
          validation: 'Full detailed entity context used'
        }
      ]
    }
  ];
  
  // Test Results Summary
  const testResults = {
    testId: 'I4.8',
    testName: 'Entity-Aware Transcription E2E Test',
    timestamp: new Date().toISOString(),
    steps: testSteps.length,
    expectedOutcomes: [
      'Project created successfully',
      'Entities added and associated with project',
      'Entity pills displayed on upload page',
      'Transcription uses entity context for accuracy',
      'Summary includes correct entity names',
      'Entity usage tracked in database',
      'GPT-4o compression works (top 20)',
      'Gemini expansion includes all entities'
    ],
    successCriteria: {
      transcriptionAccuracy: '95% for known entities',
      performanceOverhead: '< 100ms',
      userExperience: 'Seamless entity selection',
      dataIntegrity: 'All entities persisted correctly'
    }
  };
  
  // Log test plan
  console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}   Entity-Aware Transcription E2E Test Plan${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}Test ID:${colors.reset} ${testResults.testId}`);
  console.log(`${colors.yellow}Test Suite:${colors.reset} Integration Tests (Suite 4)`);
  console.log(`${colors.yellow}Total Steps:${colors.reset} ${testResults.steps}`);
  console.log(`${colors.yellow}Estimated Time:${colors.reset} 10-15 minutes\n`);
  
  console.log(`${colors.bright}Expected Outcomes:${colors.reset}`);
  testResults.expectedOutcomes.forEach((outcome, i) => {
    console.log(`  ${i + 1}. ${outcome}`);
  });
  
  console.log(`\n${colors.bright}Success Criteria:${colors.reset}`);
  Object.entries(testResults.successCriteria).forEach(([key, value]) => {
    console.log(`  • ${key}: ${value}`);
  });
  
  console.log(`\n${colors.bright}Test Steps:${colors.reset}`);
  testSteps.forEach(step => {
    console.log(`\n  ${colors.blue}Step ${step.step}:${colors.reset} ${step.name}`);
    console.log(`    Tool: ${step.mcp_tool || 'Multiple tools'}`);
    console.log(`    Validation: ${step.validation}`);
  });
  
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Instructions for execution
  console.log(`${colors.bright}${colors.green}EXECUTION INSTRUCTIONS:${colors.reset}\n`);
  console.log('To execute this test with Claude and Playwright MCP:');
  console.log('\n1. Ensure the application is running:');
  console.log('   docker compose up');
  console.log('\n2. Launch Claude with MCP servers:');
  console.log('   ./claude-mcp-env.sh');
  console.log('\n3. Execute each step using the corresponding MCP tool');
  console.log('   Example: mcp__playwright__browser_navigate({ url: "http://localhost:3100" })');
  console.log('\n4. Validate each step before proceeding');
  console.log('\n5. Document any failures or issues\n');
  
  // Performance metrics to track
  console.log(`${colors.bright}${colors.yellow}METRICS TO TRACK:${colors.reset}\n`);
  console.log('• Time to create project and entities');
  console.log('• Entity context injection overhead (target: <100ms)');
  console.log('• Transcription accuracy for known entities');
  console.log('• Summary quality with entity context');
  console.log('• Database write performance for entity usage\n');
  
  // Known issues or edge cases
  console.log(`${colors.bright}${colors.red}EDGE CASES TO TEST:${colors.reset}\n`);
  console.log('• Entity with special characters (ź, ż, ł)');
  console.log('• Entity name conflicts (same name, different type)');
  console.log('• Project with no entities');
  console.log('• Project with 100+ entities');
  console.log('• Concurrent uploads with same project');
  console.log('• Entity deletion during processing\n');
  
  return testResults;
}

// Validation helper functions
function validateTranscriptionAccuracy(transcription, entities) {
  const errors = [];
  entities.forEach(entity => {
    if (!transcription.includes(entity.value)) {
      errors.push(`Missing entity: ${entity.value}`);
    }
    // Check that common misrecognitions are NOT present
    entity.aliases.forEach(alias => {
      const wrongVariants = getWrongVariants(alias);
      wrongVariants.forEach(wrong => {
        if (transcription.includes(wrong)) {
          errors.push(`Found incorrect variant: ${wrong} (should be ${entity.value})`);
        }
      });
    });
  });
  return errors;
}

function getWrongVariants(entityName) {
  // Common misrecognitions to check
  const variants = {
    'Claude API': ['clawed API', 'cloud API', 'clod API'],
    'Dario Amodei': ['Darry-o', 'Dario Amodi', 'Dario A Modi'],
    'RLHF': ['RLH', 'RLHS', 'RL HF'],
    'Żabka': ['Zabka', 'Jabka', 'Sabka']
  };
  return variants[entityName] || [];
}

// Execute test plan documentation
if (require.main === module) {
  runEntityAwareTranscriptionTest()
    .then(results => {
      console.log(`${colors.green}Test plan generated successfully!${colors.reset}`);
      
      // Save test plan to file
      const testPlanPath = path.join(__dirname, '..', 'e2e', 'entity-aware-transcription-test-plan.json');
      fs.writeFileSync(testPlanPath, JSON.stringify(results, null, 2));
      console.log(`Test plan saved to: ${testPlanPath}`);
    })
    .catch(error => {
      console.error(`${colors.red}Error generating test plan:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { runEntityAwareTranscriptionTest, validateTranscriptionAccuracy };