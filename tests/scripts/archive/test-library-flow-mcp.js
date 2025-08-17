/**
 * MCP Test: Library Functionality
 * 
 * This test uses Playwright MCP server to test library operations.
 * Execute through Claude with MCP enabled.
 * 
 * Prerequisites:
 * - Application running at http://localhost:3100
 * - At least one transcription already created
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
    description: "Create a transcription for library testing",
    steps: [
      "1. Navigate to home page",
      "2. Upload and process a test file",
      "3. Wait for transcription to complete"
    ],
    mcp_sequence: `
      // Navigate to home
      mcp__playwright__browser_navigate
        url: "${TEST_URL}"
      
      // Upload file
      mcp__playwright__browser_click
        element: "Upload dropzone"
        ref: [find upload area]
      
      mcp__playwright__browser_file_upload
        paths: ["${TEST_FILE}"]
      
      // Select language and process
      mcp__playwright__browser_click
        element: "Polish button"
        ref: [find Polish language button]
      
      mcp__playwright__browser_click
        element: "Upload and Process"
        ref: [find process button]
      
      // Wait for completion
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
    `
  },

  navigateToLibrary: {
    description: "Navigate to library page",
    steps: [
      "1. Click Library link or button",
      "2. Verify URL changes to /library",
      "3. Verify library header appears"
    ],
    mcp_sequence: `
      // Multiple ways to navigate to library
      mcp__playwright__browser_click
        element: "Library navigation link"
        ref: [find link with text "Library" or href="/library"]
      
      // Alternative: direct navigation
      mcp__playwright__browser_navigate
        url: "${TEST_URL}/library"
      
      // Verify we're on library page
      mcp__playwright__browser_evaluate
        function: () => {
          const isLibraryPage = window.location.pathname.includes('library');
          const hasHeader = !!document.querySelector('h1, h2').textContent.includes('Library');
          return { isLibraryPage, hasHeader };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  viewNotesList: {
    description: "View list of transcribed notes",
    steps: [
      "1. Check for note cards in library",
      "2. Verify note has AI-generated title",
      "3. Check for preview text",
      "4. Verify duration and date display"
    ],
    mcp_sequence: `
      // Check for note cards
      mcp__playwright__browser_evaluate
        function: () => {
          const cards = document.querySelectorAll('.note-card, .library-item, [class*="card"]');
          const notes = Array.from(cards).map(card => ({
            title: card.querySelector('h3, .title')?.textContent,
            preview: card.querySelector('.preview, p')?.textContent?.substring(0, 100),
            duration: card.querySelector('[class*="duration"]')?.textContent,
            date: card.querySelector('time, .date')?.textContent
          }));
          return { 
            noteCount: cards.length,
            notes: notes.slice(0, 3), // First 3 notes
            hasNotes: cards.length > 0
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  searchFunctionality: {
    description: "Test search within library",
    steps: [
      "1. Find search input field",
      "2. Enter search term 'zabka'",
      "3. Verify filtered results"
    ],
    mcp_sequence: `
      // Find and use search
      mcp__playwright__browser_type
        element: "Search input field"
        ref: [find input with placeholder containing "Search"]
        text: "zabka"
      
      // Submit search (Enter key)
      mcp__playwright__browser_press_key
        key: "Enter"
      
      // Wait for filter to apply
      mcp__playwright__browser_wait_for
        time: 1
      
      // Check filtered results
      mcp__playwright__browser_evaluate
        function: () => {
          const cards = document.querySelectorAll('.note-card, .library-item');
          const visibleCards = Array.from(cards).filter(card => 
            card.style.display !== 'none' && 
            card.offsetParent !== null
          );
          const zabkaCards = visibleCards.filter(card => 
            card.textContent.toLowerCase().includes('zabka')
          );
          return {
            totalVisible: visibleCards.length,
            matchingZabka: zabkaCards.length,
            searchWorking: zabkaCards.length > 0
          };
        }
    `
  },

  filterByStatus: {
    description: "Filter notes by processing status",
    steps: [
      "1. Look for status filter options",
      "2. Select 'Completed' filter",
      "3. Verify only completed notes shown"
    ],
    mcp_sequence: `
      // Check for filter controls
      mcp__playwright__browser_evaluate
        function: () => {
          const filters = Array.from(document.querySelectorAll('button, select')).filter(
            el => el.textContent.match(/Completed|Processing|All/i)
          );
          return { hasFilters: filters.length > 0 };
        }
      
      // Click completed filter if exists
      mcp__playwright__browser_click
        element: "Completed filter"
        ref: [find button or option with text "Completed"]
      
      // Verify filtered results
      mcp__playwright__browser_evaluate
        function: () => {
          const cards = document.querySelectorAll('.note-card, .library-item');
          const visibleCards = Array.from(cards).filter(card => 
            card.offsetParent !== null
          );
          return { filteredCount: visibleCards.length };
        }
    `
  },

  filterByLanguage: {
    description: "Filter notes by language",
    steps: [
      "1. Look for language filter",
      "2. Select Polish language filter",
      "3. Verify filtered results"
    ],
    mcp_sequence: `
      // Look for language filter
      mcp__playwright__browser_evaluate
        function: () => {
          const filters = Array.from(document.querySelectorAll('button, select')).filter(
            el => el.textContent.match(/Polish|English|Language/i)
          );
          return { hasLanguageFilter: filters.length > 0 };
        }
      
      // Select Polish filter
      mcp__playwright__browser_click
        element: "Polish language filter"
        ref: [find filter with text "Polish"]
      
      // Check results
      mcp__playwright__browser_snapshot
    `
  },

  openIndividualNote: {
    description: "Open a specific note for viewing",
    steps: [
      "1. Click on a note card",
      "2. Verify navigation to note detail page",
      "3. Check full transcription visible"
    ],
    mcp_sequence: `
      // Click first note card
      mcp__playwright__browser_click
        element: "First note card"
        ref: [find first .note-card or .library-item]
      
      // Verify navigation
      mcp__playwright__browser_evaluate
        function: () => {
          const url = window.location.pathname;
          const hasTranscription = document.querySelector('.transcription-content, [class*="transcription"]');
          const hasSummary = document.querySelector('.summary-content, [class*="summary"]');
          return {
            isDetailPage: url.includes('/notes/') || url.includes('/voice-notes/'),
            hasTranscription: !!hasTranscription,
            hasSummary: !!hasSummary
          };
        }
      
      mcp__playwright__browser_snapshot
    `
  },

  deleteNote: {
    description: "Delete a note from library",
    steps: [
      "1. Find delete button on note",
      "2. Click delete",
      "3. Confirm deletion if prompted",
      "4. Verify note removed from list"
    ],
    mcp_sequence: `
      // Find delete button
      mcp__playwright__browser_click
        element: "Delete button"
        ref: [find button with trash icon or text "Delete"]
      
      // Handle confirmation dialog if appears
      mcp__playwright__browser_evaluate
        function: () => {
          const confirmDialog = document.querySelector('[role="dialog"], .confirm-dialog');
          if (confirmDialog) {
            const confirmBtn = confirmDialog.querySelector('button:has-text("Confirm"), button:has-text("Delete")');
            if (confirmBtn) confirmBtn.click();
          }
          return { hadConfirmation: !!confirmDialog };
        }
      
      // Wait for deletion
      mcp__playwright__browser_wait_for
        time: 2
      
      // Verify note removed
      mcp__playwright__browser_snapshot
    `
  },

  reprocessNote: {
    description: "Reprocess an existing note",
    steps: [
      "1. Open a note detail page",
      "2. Find reprocess button",
      "3. Change settings (e.g., language)",
      "4. Start reprocessing",
      "5. Verify new transcription"
    ],
    mcp_sequence: `
      // On note detail page, find reprocess
      mcp__playwright__browser_click
        element: "Reprocess button"
        ref: [find button with text "Reprocess" or icon]
      
      // Change language to English
      mcp__playwright__browser_click
        element: "English language option"
        ref: [find English button in reprocess dialog]
      
      // Start reprocessing
      mcp__playwright__browser_click
        element: "Start Reprocess button"
        ref: [find confirm reprocess button]
      
      // Wait for completion
      mcp__playwright__browser_wait_for
        text: "Processing"
        time: 10
      
      mcp__playwright__browser_wait_for
        text: "Transcription"
        time: 60
      
      // Verify updated
      mcp__playwright__browser_evaluate
        function: () => {
          const transcription = document.querySelector('[class*="transcription"]');
          return {
            hasNewTranscription: !!transcription,
            language: transcription?.getAttribute('data-language') || 'unknown'
          };
        }
    `
  },

  exportFunctionality: {
    description: "Export notes in different formats",
    steps: [
      "1. Find export button",
      "2. Select Markdown format",
      "3. Verify download initiated",
      "4. Try JSON export"
    ],
    mcp_sequence: `
      // Find export options
      mcp__playwright__browser_click
        element: "Export button"
        ref: [find button with text "Export" or download icon]
      
      // Select Markdown
      mcp__playwright__browser_click
        element: "Markdown export option"
        ref: [find option with text "Markdown" or ".md"]
      
      // Note: Can't verify actual download in MCP, but can check UI feedback
      mcp__playwright__browser_evaluate
        function: () => {
          // Check for download feedback
          const feedback = document.querySelector('.download-success, .toast, [role="alert"]');
          return { 
            exportInitiated: !!feedback,
            message: feedback?.textContent
          };
        }
    `
  },

  emptyState: {
    description: "Test empty library state",
    steps: [
      "1. Clear all notes (if possible)",
      "2. View empty library",
      "3. Verify empty state message"
    ],
    mcp_sequence: `
      // Check for empty state
      mcp__playwright__browser_evaluate
        function: () => {
          const cards = document.querySelectorAll('.note-card, .library-item');
          const emptyMessage = Array.from(document.querySelectorAll('*')).find(
            el => el.textContent.match(/No notes yet|Empty library|No transcriptions/i)
          );
          return {
            isEmpty: cards.length === 0,
            hasEmptyMessage: !!emptyMessage,
            emptyText: emptyMessage?.textContent
          };
        }
    `
  }
};

// Test execution instructions
const executionGuide = {
  order: [
    'setup',
    'navigateToLibrary',
    'viewNotesList',
    'searchFunctionality',
    'filterByStatus',
    'filterByLanguage',
    'openIndividualNote',
    'reprocessNote',
    'deleteNote',
    'exportFunctionality',
    'emptyState'
  ],
  notes: [
    "Setup creates a fresh transcription for testing",
    "Some features (filters, export) may not be implemented",
    "Delete operation is destructive - run near end",
    "Empty state test depends on having deleted all notes",
    "Reprocess takes time similar to original processing"
  ]
};

// Export for use in master runner
module.exports = { 
  testScenarios, 
  executionGuide,
  testName: 'Library Functionality',
  estimatedTime: '20 minutes'
};

// Documentation for manual execution
console.log(`
==========================================
MCP Test: Library Functionality
==========================================

This test validates:
✓ Library navigation
✓ Note list display
✓ Search functionality
✓ Filter by status/language
✓ Open individual notes
✓ Delete notes
✓ Reprocess notes
✓ Export functionality
✓ Empty state handling

To execute:
1. Ensure application is running at ${TEST_URL}
2. Use Claude with Playwright MCP enabled
3. Execute each scenario in order
4. Verify expected outcomes

Test file: ${TEST_FILE}
`);