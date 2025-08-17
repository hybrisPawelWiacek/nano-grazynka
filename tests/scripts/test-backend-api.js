#!/usr/bin/env node

/**
 * Backend API Test Suite
 * Tests all backend API endpoints with proper session management
 */

const TestUtils = require('./test-utils');

async function runTests() {
  const utils = new TestUtils();
  const results = { passed: 0, failed: 0, tests: [] };
  
  console.log('🧪 Backend API Test Suite\n');
  console.log('================================\n');

  try {
    // Test 1: Health Check
    console.log('Test B1: Health Check');
    const health = await utils.checkHealth();
    const healthPassed = health.status === 200 && health.data.status === 'healthy';
    utils.logResult('B1: Health Check', healthPassed, `Status: ${health.status}`);
    results[healthPassed ? 'passed' : 'failed']++;
    
    // Test 2: Upload Voice Note
    console.log('\nTest B2: Upload Voice Note');
    const upload = await utils.uploadTestFile('zabka.m4a');
    const uploadPassed = upload.status === 201 && upload.noteId;
    utils.logResult('B2: Upload', uploadPassed, `Note ID: ${upload.noteId}`);
    results[uploadPassed ? 'passed' : 'failed']++;
    
    if (upload.noteId) {
      // Test 3: Get Voice Note
      console.log('\nTest B3: Get Voice Note');
      const getNote = await utils.getVoiceNote(upload.noteId);
      const getPassed = getNote.status === 200 && getNote.data.id === upload.noteId;
      utils.logResult('B3: Get Note', getPassed, `Status: ${getNote.data.status}`);
      results[getPassed ? 'passed' : 'failed']++;
      
      // Test 4: List Voice Notes
      console.log('\nTest B4: List Voice Notes');
      const list = await utils.listVoiceNotes({ limit: 5 });
      const listPassed = list.status === 200 && Array.isArray(list.data.items);
      utils.logResult('B4: List Notes', listPassed, `Count: ${list.data.items?.length}`);
      results[listPassed ? 'passed' : 'failed']++;
      
      // Test 5: List with Query Parameters
      console.log('\nTest B5: List with Query Parameters');
      const listWithParams = await utils.listVoiceNotes({ limit: 2, page: 1 });
      const paramsPassed = listWithParams.status === 200 && 
                          listWithParams.data.pagination?.limit === 2;
      utils.logResult('B5: Query Params', paramsPassed, 
        `Limit applied: ${listWithParams.data.pagination?.limit}`);
      results[paramsPassed ? 'passed' : 'failed']++;
      
      // Test 6: Delete Voice Note
      console.log('\nTest B6: Delete Voice Note');
      const deleteResult = await utils.deleteVoiceNote(upload.noteId);
      const deletePassed = deleteResult.status === 204;
      utils.logResult('B6: Delete Note', deletePassed, `Status: ${deleteResult.status}`);
      results[deletePassed ? 'passed' : 'failed']++;
      
      // Test 7: Verify Deletion
      console.log('\nTest B7: Verify Deletion');
      const getDeleted = await utils.getVoiceNote(upload.noteId);
      const deletionVerified = getDeleted.status === 404 || 
                              (getDeleted.status === 200 && getDeleted.data.error);
      utils.logResult('B7: Deletion Verified', deletionVerified, 
        `Note not found: ${deletionVerified}`);
      results[deletionVerified ? 'passed' : 'failed']++;
    }
    
    // Test 8: Invalid File Upload
    console.log('\nTest B8: Invalid File Upload');
    try {
      await utils.uploadTestFile('test-file.txt'); // Text file, should fail
      utils.logResult('B8: Invalid Upload', false, 'Should have rejected text file');
      results.failed++;
    } catch (error) {
      // Expected to fail - text files not allowed
      utils.logResult('B8: Invalid Upload', true, 'Correctly rejected text file');
      results.passed++;
    }
    
    // Test 9: Session Consistency
    console.log('\nTest B9: Session Consistency');
    const session1 = utils.createTestSession('consistency');
    const upload1 = await utils.uploadTestFile('zabka.m4a', { sessionId: session1 });
    const list1 = await utils.listVoiceNotes({ sessionId: session1 });
    
    const session2 = utils.createTestSession('different');
    const list2 = await utils.listVoiceNotes({ sessionId: session2 });
    
    const sessionPassed = list1.data.items?.length > 0 && 
                         list2.data.items?.length === 0;
    utils.logResult('B9: Session Isolation', sessionPassed, 
      `Session 1: ${list1.data.items?.length} notes, Session 2: ${list2.data.items?.length} notes`);
    results[sessionPassed ? 'passed' : 'failed']++;
    
    // Cleanup
    if (upload1.noteId) {
      await utils.deleteVoiceNote(upload1.noteId, { sessionId: session1 });
    }
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    results.failed++;
  }
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Pass Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);