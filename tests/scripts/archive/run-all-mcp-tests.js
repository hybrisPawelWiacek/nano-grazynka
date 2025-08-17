/**
 * MCP Test Master Runner
 * 
 * This script coordinates the execution of all MCP-based E2E tests for nano-Grazynka.
 * It provides instructions for Claude to run tests sequentially using Playwright MCP.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - Playwright MCP server enabled in Claude
 * - Test data available in tests/test-data/
 * 
 * Created: August 16, 2025
 * Part of TEST_ALIGNMENT_PLAN migration from npm to MCP Playwright
 */

// Import all test scenarios from individual test files
const anonymousFlow = require('./test-anonymous-flow-mcp');
const mainFlow = require('./test-main-flow-mcp');
const libraryFlow = require('./test-library-flow-mcp');
const multiModel = require('./test-multi-model-mcp');
const twoPass = require('./test-two-pass-mcp');
const loggedInFlow = require('./test-logged-in-flow-mcp');

// Test suite configuration
const TEST_SUITES = {
  core: {
    name: 'Core Functionality Tests',
    description: 'Essential features that must work for MVP',
    tests: [
      {
        file: 'test-anonymous-flow-mcp.js',
        scenarios: anonymousFlow.testScenarios,
        priority: 1,
        expectedDuration: '5-10 minutes'
      },
      {
        file: 'test-main-flow-mcp.js',
        scenarios: mainFlow.testScenarios,
        priority: 1,
        expectedDuration: '10-15 minutes'
      }
    ]
  },
  advanced: {
    name: 'Advanced Features Tests',
    description: 'Extended functionality and edge cases',
    tests: [
      {
        file: 'test-library-flow-mcp.js',
        scenarios: libraryFlow.testScenarios,
        priority: 2,
        expectedDuration: '10-15 minutes'
      },
      {
        file: 'test-multi-model-mcp.js',
        scenarios: multiModel.testScenarios,
        priority: 2,
        expectedDuration: '10-15 minutes'
      },
      {
        file: 'test-two-pass-mcp.js',
        scenarios: twoPass.testScenarios,
        priority: 3,
        expectedDuration: '5-10 minutes'
      }
    ]
  },
  authentication: {
    name: 'User Authentication Tests',
    description: 'Registration, login, and user-specific features',
    tests: [
      {
        file: 'test-logged-in-flow-mcp.js',
        scenarios: loggedInFlow.testScenarios,
        priority: 3,
        expectedDuration: '10-15 minutes'
      }
    ]
  }
};

// Execution instructions for Claude
const CLAUDE_INSTRUCTIONS = `
╔════════════════════════════════════════════════════════════════════╗
║                    MCP TEST EXECUTION GUIDE                        ║
╚════════════════════════════════════════════════════════════════════╝

This master runner coordinates all MCP-based E2E tests for nano-Grazynka.

PREREQUISITES:
1. Ensure application is running: docker compose up
2. Verify Playwright MCP is enabled
3. Application accessible at http://localhost:3100

EXECUTION ORDER:
1. Core Tests (Priority 1) - MUST PASS
   - Anonymous flow (session, uploads, limits)
   - Main flow (transcription, summary)

2. Advanced Tests (Priority 2) - SHOULD PASS
   - Library operations
   - Multi-model selection
   
3. Extended Tests (Priority 3) - NICE TO HAVE
   - Two-pass transcription
   - User authentication

RUNNING TESTS:

To run all tests sequentially:
1. Start with test-anonymous-flow-mcp.js scenarios
2. Clear browser state between test files
3. Document results for each scenario
4. Continue with next test file

To run specific suite:
- Core only: Run anonymous + main flow tests
- Advanced only: Run library + multi-model tests
- Full regression: Run all 6 test files

RESULT AGGREGATION:

Track for each test:
- ✅ PASS: Feature works as expected
- ⚠️ PARTIAL: Some scenarios fail
- ❌ FAIL: Critical functionality broken
- ⏭️ SKIP: Blocked by earlier failure

TROUBLESHOOTING:

Common issues:
1. Session errors → Check localStorage['anonymousSessionId']
2. Upload fails → Verify test file exists at path
3. 401 errors → Session ID not sent in headers
4. Timeouts → Increase wait times for AI processing

DEBUG TOOLS:
- mcp__playwright__browser_console_messages
- mcp__playwright__browser_network_requests
- mcp__playwright__browser_snapshot
- mcp__playwright__browser_evaluate
`;

// Test result template
const RESULT_TEMPLATE = {
  timestamp: new Date().toISOString(),
  environment: 'http://localhost:3100',
  suites: {
    core: { status: 'pending', tests: {} },
    advanced: { status: 'pending', tests: {} },
    authentication: { status: 'pending', tests: {} }
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Export execution guide for Claude
function generateExecutionPlan(options = {}) {
  const { suite = 'all', verbose = false } = options;
  
  console.log(CLAUDE_INSTRUCTIONS);
  
  if (suite === 'all' || suite === 'core') {
    console.log('\n=== CORE TEST SUITE ===');
    TEST_SUITES.core.tests.forEach(test => {
      console.log(`\n📋 ${test.file}`);
      console.log(`   Priority: ${test.priority}`);
      console.log(`   Duration: ${test.expectedDuration}`);
      console.log(`   Scenarios: ${Object.keys(test.scenarios).length}`);
      
      if (verbose) {
        console.log('   Scenarios to test:');
        Object.entries(test.scenarios).forEach(([name, scenario]) => {
          console.log(`   - ${name}: ${scenario.description}`);
        });
      }
    });
  }
  
  if (suite === 'all' || suite === 'advanced') {
    console.log('\n=== ADVANCED TEST SUITE ===');
    TEST_SUITES.advanced.tests.forEach(test => {
      console.log(`\n📋 ${test.file}`);
      console.log(`   Priority: ${test.priority}`);
      console.log(`   Duration: ${test.expectedDuration}`);
      console.log(`   Scenarios: ${Object.keys(test.scenarios).length}`);
      
      if (verbose) {
        console.log('   Scenarios to test:');
        Object.entries(test.scenarios).forEach(([name, scenario]) => {
          console.log(`   - ${name}: ${scenario.description}`);
        });
      }
    });
  }
  
  if (suite === 'all' || suite === 'authentication') {
    console.log('\n=== AUTHENTICATION TEST SUITE ===');
    TEST_SUITES.authentication.tests.forEach(test => {
      console.log(`\n📋 ${test.file}`);
      console.log(`   Priority: ${test.priority}`);
      console.log(`   Duration: ${test.expectedDuration}`);
      console.log(`   Scenarios: ${Object.keys(test.scenarios).length}`);
      
      if (verbose) {
        console.log('   Scenarios to test:');
        Object.entries(test.scenarios).forEach(([name, scenario]) => {
          console.log(`   - ${name}: ${scenario.description}`);
        });
      }
    });
  }
  
  console.log('\n=== EXECUTION SUMMARY ===');
  const allTests = [
    ...TEST_SUITES.core.tests,
    ...TEST_SUITES.advanced.tests,
    ...TEST_SUITES.authentication.tests
  ];
  
  const totalScenarios = allTests.reduce((sum, test) => 
    sum + Object.keys(test.scenarios).length, 0
  );
  
  console.log(`Total test files: ${allTests.length}`);
  console.log(`Total scenarios: ${totalScenarios}`);
  console.log(`Estimated duration: 50-80 minutes for full suite`);
  
  return RESULT_TEMPLATE;
}

// Quick test selector for common scenarios
const QUICK_TESTS = {
  smoke: ['test-anonymous-flow-mcp.js', 'test-main-flow-mcp.js'],
  library: ['test-library-flow-mcp.js'],
  models: ['test-multi-model-mcp.js', 'test-two-pass-mcp.js'],
  auth: ['test-logged-in-flow-mcp.js'],
  all: Object.values(TEST_SUITES).flatMap(suite => 
    suite.tests.map(t => t.file)
  )
};

// CLI interface (for documentation purposes)
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                  NANO-GRAZYNKA MCP TEST RUNNER                     ║
╚════════════════════════════════════════════════════════════════════╝

This is the master test runner for MCP-based Playwright tests.

USAGE INSTRUCTIONS FOR CLAUDE:

1. To see all available tests:
   node run-all-mcp-tests.js

2. To run specific suite:
   - Core tests: Focus on anonymous + main flow
   - Advanced tests: Focus on library + models
   - Full regression: Run all 6 test files

3. For each test file:
   a) Open the specific test file (e.g., test-anonymous-flow-mcp.js)
   b) Read the testScenarios object
   c) Execute each scenario using MCP tools
   d) Document the results

AVAILABLE TEST FILES:
${QUICK_TESTS.all.map(f => `  - ${f}`).join('\n')}

TOTAL SCENARIOS: 56 test scenarios across 6 files

For detailed execution, use generateExecutionPlan() with options:
- suite: 'all' | 'core' | 'advanced' | 'authentication'
- verbose: true | false
`);
  
  // Generate default execution plan
  generateExecutionPlan({ suite: 'all', verbose: false });
}

// Export for use in other scripts
module.exports = {
  TEST_SUITES,
  QUICK_TESTS,
  RESULT_TEMPLATE,
  generateExecutionPlan,
  allScenarios: {
    anonymous: anonymousFlow.testScenarios,
    main: mainFlow.testScenarios,
    library: libraryFlow.testScenarios,
    multiModel: multiModel.testScenarios,
    twoPass: twoPass.testScenarios,
    loggedIn: loggedInFlow.testScenarios
  }
};