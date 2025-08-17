/**
 * MCP Test: Logged-In User Flow
 * 
 * This test uses Playwright MCP server to test registered user functionality.
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

// Generate unique test user
const timestamp = Date.now();
const TEST_USER = {
  email: `test_${timestamp}@example.com`,
  password: 'TestPassword123!',
  name: `Test User ${timestamp}`
};

// Test scenarios documented for Claude execution
const testScenarios = {
  setup: {
    description: "Navigate to registration page",
    steps: [
      "1. Navigate to home page",
      "2. Click Sign Up or Register link",
      "3. Verify registration form appears"
    ],
    mcp_sequence: `
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Find and click registration link
      mcp__playwright__browser_click
        element: "Sign Up or Register link"
        ref: [find link with text "Sign Up" or "Register"]
      
      // Verify on registration page
      mcp__playwright__browser_evaluate
        function: () => {
          const isRegisterPage = window.location.pathname.includes('register') ||
                                window.location.pathname.includes('signup');
          const hasEmailField = !!document.querySelector('input[type="email"]');
          return { isRegisterPage, hasEmailField };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  userRegistration: {
    description: "Register a new user account",
    steps: [
      "1. Fill email field with timestamp email",
      "2. Fill password field",
      "3. Fill name field",
      "4. Submit registration",
      "5. Verify auto-login"
    ],
    mcp_sequence: `
      // Fill registration form
      mcp__playwright__browser_type
        element: "Email input"
        ref: [find input[type="email"]]
        text: "${TEST_USER.email}"
      
      mcp__playwright__browser_type
        element: "Password input"
        ref: [find input[type="password"]]
        text: "${TEST_USER.password}"
      
      mcp__playwright__browser_type
        element: "Name input"
        ref: [find input with placeholder containing "name"]
        text: "${TEST_USER.name}"
      
      // Submit registration
      mcp__playwright__browser_click
        element: "Register/Sign Up button"
        ref: [find submit button]
      
      // Wait for redirect/success
      mcp__playwright__browser_wait_for
        time: 3
      
      // Verify logged in
      mcp__playwright__browser_evaluate
        function: () => {
          const authToken = localStorage.getItem('authToken') || 
                           sessionStorage.getItem('authToken');
          const userInfo = localStorage.getItem('user') ||
                          sessionStorage.getItem('user');
          return {
            isLoggedIn: !!authToken,
            hasUserInfo: !!userInfo,
            currentPath: window.location.pathname
          };
        }
    `
  },

  checkCreditsDisplay: {
    description: "Verify credits display for logged-in user",
    steps: [
      "1. Look for credits counter",
      "2. Verify initial credit amount",
      "3. Check for dashboard link"
    ],
    mcp_sequence: `
      mcp__playwright__browser_evaluate
        function: () => {
          const creditsElement = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/credits|Credits|balance/i)
          );
          const dashboardLink = document.querySelector('a[href*="dashboard"]');
          return {
            hasCreditsDisplay: !!creditsElement,
            creditsText: creditsElement?.textContent,
            hasDashboardLink: !!dashboardLink
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  uploadAsLoggedIn: {
    description: "Upload file as logged-in user",
    steps: [
      "1. Navigate to upload page",
      "2. Upload test file",
      "3. Process file",
      "4. Verify credits decremented"
    ],
    mcp_sequence: `
      // Navigate to home/upload
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Upload file
      mcp__playwright__browser_click
        element: "Upload dropzone"
        ref: [find upload area]
      
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Get credits before processing
      mcp__playwright__browser_evaluate
        function: () => {
          const creditsEl = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/\\d+.*credits/i)
          );
          const match = creditsEl?.textContent.match(/\\d+/);
          return { creditsBefore: match ? parseInt(match[0]) : null };
        }
      
      // Process
      mcp__playwright__browser_click
        element: "Polish button"
        ref: [find Polish language]
      
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
      
      // Wait for completion
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
      
      // Check credits after
      mcp__playwright__browser_evaluate
        function: () => {
          const creditsEl = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent?.match(/\\d+.*credits/i)
          );
          const match = creditsEl?.textContent.match(/\\d+/);
          return { creditsAfter: match ? parseInt(match[0]) : null };
        }
    `
  },

  accessDashboard: {
    description: "Access user dashboard",
    steps: [
      "1. Click Dashboard link",
      "2. Verify dashboard loads",
      "3. Check stats display"
    ],
    mcp_sequence: `
      // Navigate to dashboard
      mcp__playwright__browser_click
        element: "Dashboard link"
        ref: [find link with text "Dashboard"]
      
      // Alternative: direct navigation
      mcp__playwright__browser_navigate
        url: "${TEST_URL}/dashboard"
      
      // Verify dashboard content
      mcp__playwright__browser_evaluate
        function: () => {
          const isDashboard = window.location.pathname.includes('dashboard');
          const stats = {
            totalNotes: document.querySelector('[class*="total"]')?.textContent,
            creditsRemaining: document.querySelector('[class*="credits"]')?.textContent,
            recentActivity: !!document.querySelector('[class*="recent"], [class*="activity"]')
          };
          return { isDashboard, stats };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  accessSettings: {
    description: "Access user settings page",
    steps: [
      "1. Navigate to settings",
      "2. Verify settings options",
      "3. Check API key section"
    ],
    mcp_sequence: `
      // Navigate to settings
      mcp__playwright__browser_click
        element: "Settings link"
        ref: [find link with text "Settings"]
      
      // Alternative: direct navigation  
      mcp__playwright__browser_navigate
        url: "${TEST_URL}/settings"
      
      // Verify settings page
      mcp__playwright__browser_evaluate
        function: () => {
          const isSettings = window.location.pathname.includes('settings');
          const hasApiSection = !!document.querySelector('[class*="api"], [class*="API"]');
          const hasProfileSection = !!document.querySelector('[class*="profile"]');
          return { isSettings, hasApiSection, hasProfileSection };
        }
    `
  },

  testLogout: {
    description: "Test logout functionality",
    steps: [
      "1. Click Logout button",
      "2. Verify auth token cleared",
      "3. Verify redirected to home",
      "4. Verify anonymous session restored"
    ],
    mcp_sequence: `
      // Click logout
      mcp__playwright__browser_click
        element: "Logout button"
        ref: [find button or link with text "Logout" or "Sign Out"]
      
      // Verify logged out
      mcp__playwright__browser_evaluate
        function: () => {
          const authToken = localStorage.getItem('authToken') || 
                           sessionStorage.getItem('authToken');
          const anonymousSession = localStorage.getItem('anonymousSessionId');
          return {
            isLoggedOut: !authToken,
            hasAnonymousSession: !!anonymousSession,
            currentPath: window.location.pathname
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  testLogin: {
    description: "Test login with existing account",
    steps: [
      "1. Navigate to login page",
      "2. Enter test user credentials",
      "3. Submit login",
      "4. Verify successful login"
    ],
    mcp_sequence: `
      // Navigate to login
      mcp__playwright__browser_click
        element: "Login link"
        ref: [find link with text "Login" or "Sign In"]
      
      // Fill login form
      mcp__playwright__browser_type
        element: "Email input"
        ref: [find email input]
        text: "${TEST_USER.email}"
      
      mcp__playwright__browser_type
        element: "Password input"
        ref: [find password input]
        text: "${TEST_USER.password}"
      
      // Submit
      mcp__playwright__browser_click
        element: "Login button"
        ref: [find submit button]
      
      // Verify logged in
      mcp__playwright__browser_wait_for
        time: 2
      
      mcp__playwright__browser_evaluate
        function: () => {
          const authToken = localStorage.getItem('authToken');
          return { isLoggedIn: !!authToken };
        }
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'userRegistration',
    'checkCreditsDisplay',
    'uploadAsLoggedIn',
    'accessDashboard',
    'accessSettings',
    'testLogout',
    'testLogin'
  ],
  notes: [
    "Uses timestamp-based email for unique test user",
    "Registration should auto-login user",
    "Credits should decrement after upload",
    "Dashboard only accessible to logged-in users",
    "Logout should restore anonymous session"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Logged-In User Flow',
  estimatedTime: '15 minutes',
  testUser: TEST_USER
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Logged-In User Flow
==========================================

This test validates:
✓ User registration
✓ Auto-login after registration
✓ Credits display and decrement
✓ Upload as logged-in user
✓ Dashboard access
✓ Settings page
✓ Logout functionality
✓ Login with existing account

Test User:
- Email: ${TEST_USER.email}
- Password: ${TEST_USER.password}

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test file: ${TEST_FILE}
`);