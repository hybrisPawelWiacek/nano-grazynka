#!/usr/bin/env node
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3101/api';
const TEST_DATA_DIR = path.join(__dirname, '../test-data');

async function testSessions() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  console.log(`\n=== Session Management Test Suite ===\n`);

  // Test S1: Anonymous session creation and persistence
  const sessionId1 = uuidv4();
  const sessionId2 = uuidv4();
  
  try {
    // Upload with session 1
    const form1 = new FormData();
    const testFile = path.join(TEST_DATA_DIR, 'zabka.m4a');
    form1.append('file', fs.createReadStream(testFile));
    form1.append('userId', 'anonymous');
    
    const upload1 = await axios.post(`${API_BASE}/voice-notes`, form1, {
      headers: {
        ...form1.getHeaders(),
        'x-session-id': sessionId1
      }
    });
    
    // Upload with session 2
    const form2 = new FormData();
    form2.append('file', fs.createReadStream(testFile));
    form2.append('userId', 'anonymous');
    
    const upload2 = await axios.post(`${API_BASE}/voice-notes`, form2, {
      headers: {
        ...form2.getHeaders(),
        'x-session-id': sessionId2
      }
    });
    
    // List for session 1
    const list1 = await axios.get(`${API_BASE}/voice-notes?sessionId=${sessionId1}`);
    
    // List for session 2
    const list2 = await axios.get(`${API_BASE}/voice-notes?sessionId=${sessionId2}`);
    
    // Verify isolation
    const session1HasOnlyItsNote = list1.data.items.length === 1 && 
                                   list1.data.items[0].id === upload1.data.voiceNote.id;
    const session2HasOnlyItsNote = list2.data.items.length === 1 && 
                                   list2.data.items[0].id === upload2.data.voiceNote.id;
    
    if (session1HasOnlyItsNote && session2HasOnlyItsNote) {
      results.passed++;
      results.tests.push({ id: 'S1', name: 'Session isolation', status: 'PASS' });
      console.log('✅ S1: Session isolation - PASS');
    } else {
      throw new Error('Sessions not properly isolated');
    }
    
    // Cleanup
    await axios.delete(`${API_BASE}/voice-notes/${upload1.data.voiceNote.id}`, {
      headers: { 'x-session-id': sessionId1 }
    });
    await axios.delete(`${API_BASE}/voice-notes/${upload2.data.voiceNote.id}`, {
      headers: { 'x-session-id': sessionId2 }
    });
    
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'S1', name: 'Session isolation', status: 'FAIL', error: error.message });
    console.log('❌ S1: Session isolation - FAIL:', error.message);
  }

  // Test S2: Anonymous usage tracking
  const sessionId3 = uuidv4();
  try {
    // Check initial usage
    const usage1 = await axios.get(`${API_BASE}/anonymous/usage/${sessionId3}`);
    const initialCount = usage1.data.usageCount || 0;
    
    // Upload a file
    const form = new FormData();
    const testFile = path.join(TEST_DATA_DIR, 'zabka.m4a');
    form.append('file', fs.createReadStream(testFile));
    form.append('userId', 'anonymous');
    
    const upload = await axios.post(`${API_BASE}/voice-notes`, form, {
      headers: {
        ...form.getHeaders(),
        'x-session-id': sessionId3
      }
    });
    
    // Check usage after upload
    const usage2 = await axios.get(`${API_BASE}/anonymous/usage/${sessionId3}`);
    const newCount = usage2.data.usageCount || 0;
    
    if (newCount > initialCount) {
      results.passed++;
      results.tests.push({ id: 'S2', name: 'Usage tracking', status: 'PASS' });
      console.log('✅ S2: Usage tracking - PASS');
    } else {
      throw new Error('Usage count not incremented');
    }
    
    // Cleanup
    if (upload.data.voiceNote?.id) {
      await axios.delete(`${API_BASE}/voice-notes/${upload.data.voiceNote.id}`, {
        headers: { 'x-session-id': sessionId3 }
      });
    }
    
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'S2', name: 'Usage tracking', status: 'FAIL', error: error.message });
    console.log('❌ S2: Usage tracking - FAIL:', error.message);
  }

  // Test S3: Session migration (if auth endpoints available)
  // This would test /api/anonymous/migrate endpoint
  // Skipping for now as it requires auth setup

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Total: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);
  
  return results;
}

if (require.main === module) {
  testSessions()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { testSessions };