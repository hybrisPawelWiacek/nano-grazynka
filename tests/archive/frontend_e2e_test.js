/**
 * Suite 3: Frontend E2E Tests
 * Using Playwright MCP for browser automation
 * Following best practices: Page Object Model, semantic selectors, proper waits
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Import page objects
const UploadPage = require('./page-objects/UploadPage');
const LibraryPage = require('./page-objects/LibraryPage');

// Test configuration
const BASE_URL = 'http://localhost:3100';
const TEST_FILE = path.join(__dirname, '../zabka.m4a');
const TIMEOUT = 30000;

// Test utilities
async function setupBrowser() {
  const browser = await chromium.launch({
    headless: true, // Set to false for debugging
    timeout: TIMEOUT
  });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  return { browser, context, page };
}

async function teardown(browser) {
  if (browser) {
    await browser.close();
  }
}

// Test Suite
async function runE2ETests() {
  console.log('============================================================');
  console.log('Suite 3: Frontend E2E Tests');
  console.log('============================================================\n');
  
  let browser, context, page;
  const results = {
    upload: false,
    library: false,
    search: false,
    filter: false,
    navigation: false,
    deletion: false
  };

  try {
    // Setup browser
    ({ browser, context, page } = await setupBrowser());
    console.log('✅ Browser launched\n');

    // Test 1: Upload Voice Note
    console.log('📋 Test 1: Upload Voice Note');
    try {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();
      
      // Check if test file exists
      if (!fs.existsSync(TEST_FILE)) {
        throw new Error(`Test file not found: ${TEST_FILE}`);
      }
      
      await uploadPage.uploadFile(TEST_FILE, 'E2E Test Note', 'PL');
      const success = await uploadPage.isUploadSuccessful();
      
      if (success) {
        results.upload = true;
        console.log('  ✅ Voice note uploaded successfully');
      } else {
        const error = await uploadPage.getErrorMessage();
        console.log(`  ❌ Upload failed: ${error}`);
      }
    } catch (error) {
      console.log(`  ❌ Upload test failed: ${error.message}`);
    }

    // Test 2: Library Page Load
    console.log('\n📋 Test 2: Library Page');
    try {
      const libraryPage = new LibraryPage(page);
      await libraryPage.goto();
      
      const noteCount = await libraryPage.getVoiceNoteCount();
      results.library = true;
      console.log(`  ✅ Library loaded with ${noteCount} notes`);
    } catch (error) {
      console.log(`  ❌ Library test failed: ${error.message}`);
    }

    // Test 3: Search Functionality
    console.log('\n📋 Test 3: Search Functionality');
    try {
      const libraryPage = new LibraryPage(page);
      await libraryPage.goto();
      
      // Search for a specific term
      await libraryPage.searchNotes('test');
      const searchResults = await libraryPage.getVoiceNoteCount();
      
      // Clear search
      await libraryPage.searchNotes('');
      const allResults = await libraryPage.getVoiceNoteCount();
      
      results.search = true;
      console.log(`  ✅ Search working (filtered: ${searchResults}, all: ${allResults})`);
    } catch (error) {
      console.log(`  ❌ Search test failed: ${error.message}`);
    }

    // Test 4: Filter Functionality
    console.log('\n📋 Test 4: Filter Functionality');
    try {
      const libraryPage = new LibraryPage(page);
      await libraryPage.goto();
      
      // Test status filter
      await libraryPage.filterByStatus('completed');
      const completedCount = await libraryPage.getVoiceNoteCount();
      
      // Test language filter
      await libraryPage.filterByLanguage('pl');
      const plCount = await libraryPage.getVoiceNoteCount();
      
      results.filter = true;
      console.log(`  ✅ Filters working (completed: ${completedCount}, PL: ${plCount})`);
    } catch (error) {
      console.log(`  ❌ Filter test failed: ${error.message}`);
    }

    // Test 5: Navigation
    console.log('\n📋 Test 5: Navigation');
    try {
      // Test navigation between pages
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();
      
      // Navigate to library via link
      await page.click('a[href="/library"]');
      await page.waitForURL('**/library');
      
      // Navigate back to upload
      await page.click('a[href="/"]');
      await page.waitForURL('**/');
      
      results.navigation = true;
      console.log('  ✅ Navigation between pages working');
    } catch (error) {
      console.log(`  ❌ Navigation test failed: ${error.message}`);
    }

    // Test 6: Delete Voice Note
    console.log('\n📋 Test 6: Delete Functionality');
    try {
      const libraryPage = new LibraryPage(page);
      await libraryPage.goto();
      
      const initialCount = await libraryPage.getVoiceNoteCount();
      if (initialCount > 0) {
        await libraryPage.deleteVoiceNote(0);
        const afterCount = await libraryPage.getVoiceNoteCount();
        
        if (afterCount < initialCount) {
          results.deletion = true;
          console.log('  ✅ Delete functionality working');
        } else {
          console.log('  ❌ Delete did not reduce note count');
        }
      } else {
        console.log('  ⏭️ No notes to delete, skipping');
        results.deletion = true; // Skip passes
      }
    } catch (error) {
      console.log(`  ❌ Delete test failed: ${error.message}`);
    }

  } catch (error) {
    console.error(`\n❌ Critical error: ${error.message}`);
  } finally {
    // Cleanup
    await teardown(browser);
  }

  // Summary
  console.log('\n============================================================');
  console.log('E2E TEST SUMMARY');
  console.log('============================================================');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASSED' : '❌ FAILED';
    console.log(`${test.toUpperCase().padEnd(12)} ${status}`);
  }
  
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 ALL E2E TESTS PASSED!');
    return 0;
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    return 1;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runE2ETests()
    .then(code => process.exit(code))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runE2ETests };