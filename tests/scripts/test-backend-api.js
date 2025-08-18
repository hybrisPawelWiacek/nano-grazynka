#!/usr/bin/env node
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3101/api';
const TEST_DATA_DIR = path.join(__dirname, '../test-data');

async function testBackendAPI() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const sessionId = uuidv4();
  console.log(`\n=== Backend API Test Suite ===`);
  console.log(`Session ID: ${sessionId}\n`);

  // Test B3.1: Health endpoints
  try {
    const response = await axios.get(`http://localhost:3101/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      results.passed++;
      results.tests.push({ id: 'B3.1', name: 'Health check', status: 'PASS' });
      console.log('✅ B3.1: Health check - PASS');
    } else {
      throw new Error('Unexpected health response');
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'B3.1', name: 'Health check', status: 'FAIL', error: error.message });
    console.log('❌ B3.1: Health check - FAIL:', error.message);
  }

  // Test B3.2: Upload voice note
  let uploadedNoteId = null;
  try {
    const form = new FormData();
    const testFile = path.join(TEST_DATA_DIR, 'zabka.m4a');
    
    if (!fs.existsSync(testFile)) {
      throw new Error(`Test file not found: ${testFile}`);
    }
    
    form.append('file', fs.createReadStream(testFile));
    form.append('userId', 'anonymous');
    
    const response = await axios.post(`${API_BASE}/voice-notes`, form, {
      headers: {
        ...form.getHeaders(),
        'x-session-id': sessionId
      }
    });
    
    if (response.status === 201 && response.data.voiceNote?.id) {
      uploadedNoteId = response.data.voiceNote.id;
      results.passed++;
      results.tests.push({ id: 'B3.2', name: 'Upload voice note', status: 'PASS' });
      console.log('✅ B3.2: Upload voice note - PASS');
    } else {
      throw new Error('Unexpected upload response');
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'B3.2', name: 'Upload voice note', status: 'FAIL', error: error.message });
    console.log('❌ B3.2: Upload voice note - FAIL:', error.message);
  }

  // Test B3.3: Get single note
  if (uploadedNoteId) {
    try {
      const response = await axios.get(`${API_BASE}/voice-notes/${uploadedNoteId}`, {
        headers: { 'x-session-id': sessionId }
      });
      
      if (response.status === 200 && response.data.id === uploadedNoteId) {
        results.passed++;
        results.tests.push({ id: 'B3.3', name: 'Get single note', status: 'PASS' });
        console.log('✅ B3.3: Get single note - PASS');
      } else {
        throw new Error('Unexpected get response');
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ id: 'B3.3', name: 'Get single note', status: 'FAIL', error: error.message });
      console.log('❌ B3.3: Get single note - FAIL:', error.message);
    }
  }

  // Test B3.4: List voice notes
  try {
    const response = await axios.get(`${API_BASE}/voice-notes?sessionId=${sessionId}`);
    
    if (response.status === 200 && Array.isArray(response.data.items) && response.data.pagination) {
      results.passed++;
      results.tests.push({ id: 'B3.4', name: 'List voice notes', status: 'PASS' });
      console.log('✅ B3.4: List voice notes - PASS');
    } else {
      throw new Error('Unexpected list response');
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'B3.4', name: 'List voice notes', status: 'FAIL', error: error.message });
    console.log('❌ B3.4: List voice notes - FAIL:', error.message);
  }

  // Test B3.5: Delete voice note
  if (uploadedNoteId) {
    try {
      const response = await axios.delete(`${API_BASE}/voice-notes/${uploadedNoteId}`, {
        headers: { 'x-session-id': sessionId }
      });
      
      if (response.status === 204 || response.status === 200) {
        results.passed++;
        results.tests.push({ id: 'B3.5', name: 'Delete voice note', status: 'PASS' });
        console.log('✅ B3.5: Delete voice note - PASS');
      } else {
        throw new Error('Unexpected delete response');
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ id: 'B3.5', name: 'Delete voice note', status: 'FAIL', error: error.message });
      console.log('❌ B3.5: Delete voice note - FAIL:', error.message);
    }
  }

  // Test B3.6: Invalid file upload
  try {
    const form = new FormData();
    form.append('file', Buffer.from('invalid data'), 'test.txt');
    form.append('userId', 'anonymous');
    
    await axios.post(`${API_BASE}/voice-notes`, form, {
      headers: {
        ...form.getHeaders(),
        'x-session-id': sessionId
      }
    });
    
    // Should have failed
    results.failed++;
    results.tests.push({ id: 'B3.6', name: 'Invalid file rejection', status: 'FAIL', error: 'Should have rejected invalid file' });
    console.log('❌ B3.6: Invalid file rejection - FAIL: Should have rejected');
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 415) {
      results.passed++;
      results.tests.push({ id: 'B3.6', name: 'Invalid file rejection', status: 'PASS' });
      console.log('✅ B3.6: Invalid file rejection - PASS');
    } else {
      results.failed++;
      results.tests.push({ id: 'B3.6', name: 'Invalid file rejection', status: 'FAIL', error: error.message });
      console.log('❌ B3.6: Invalid file rejection - FAIL:', error.message);
    }
  }

  // Test B3.7: Anonymous usage check
  try {
    const response = await axios.get(`${API_BASE}/anonymous/usage/${sessionId}`);
    
    if (response.status === 200 && typeof response.data.usageCount === 'number') {
      results.passed++;
      results.tests.push({ id: 'B3.7', name: 'Anonymous usage tracking', status: 'PASS' });
      console.log('✅ B3.7: Anonymous usage tracking - PASS');
    } else {
      throw new Error('Unexpected usage response');
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ id: 'B3.7', name: 'Anonymous usage tracking', status: 'FAIL', error: error.message });
    console.log('❌ B3.7: Anonymous usage tracking - FAIL:', error.message);
  }

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Total: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);
  
  return results;
}

if (require.main === module) {
  testBackendAPI()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { testBackendAPI };