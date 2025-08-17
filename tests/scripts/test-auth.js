#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3101/api';
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'Test123!',
  name: 'Test User'
};

let authToken = null;
let testResults = [];

async function runTest(testId, testName, testFn) {
  try {
    console.log(`\nRunning ${testId}: ${testName}...`);
    const result = await testFn();
    console.log(`✅ ${testId} PASSED`);
    testResults.push({ testId, testName, status: 'PASSED', result });
    return result;
  } catch (error) {
    console.error(`❌ ${testId} FAILED:`, error.message);
    testResults.push({ testId, testName, status: 'FAILED', error: error.message });
    throw error;
  }
}

// A2.1: Register new user
async function testRegister() {
  const response = await axios.post(`${API_URL}/auth/register`, TEST_USER);
  if (response.status !== 200 || !response.data.user) {
    throw new Error(`Expected 200 with user, got ${response.status}`);
  }
  return response.data;
}

// A2.2: Login with credentials
async function testLogin() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  if (response.status !== 200 || !response.data.token) {
    throw new Error(`Expected 200 with token, got ${response.status}`);
  }
  authToken = response.data.token;
  return response.data;
}

// A2.3: Access protected route
async function testProtectedRoute() {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (response.status !== 200 || !response.data.id) {
    throw new Error(`Expected 200 with user data, got ${response.status}`);
  }
  return response.data;
}

// A2.4: Access without auth
async function testUnauthorized() {
  try {
    await axios.get(`${API_URL}/auth/me`);
    throw new Error('Should have returned 401');
  } catch (error) {
    if (error.response?.status === 401) {
      return { status: 401 };
    }
    throw error;
  }
}

// A2.5: Logout
async function testLogout() {
  const response = await axios.post(`${API_URL}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  return response.data;
}

// A2.6: Anonymous upload
async function testAnonymousUpload() {
  const sessionId = `anon-${Date.now()}`;
  const form = new FormData();
  const filePath = path.join(__dirname, '../test-data/zabka.m4a');
  
  form.append('file', fs.createReadStream(filePath));
  form.append('language', 'pl');
  form.append('tags', JSON.stringify(['anonymous', 'test']));
  
  const response = await axios.post(`${API_URL}/voice-notes`, form, {
    headers: {
      ...form.getHeaders(),
      'x-session-id': sessionId
    }
  });
  
  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }
  return { ...response.data, sessionId };
}

// A2.7: Anonymous usage limit
async function testAnonymousLimit() {
  const sessionId = `limit-test-${Date.now()}`;
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const form = new FormData();
      const filePath = path.join(__dirname, '../test-data/zabka.m4a');
      form.append('file', fs.createReadStream(filePath));
      form.append('language', 'pl');
      
      const response = await axios.post(`${API_URL}/voice-notes`, form, {
        headers: {
          ...form.getHeaders(),
          'x-session-id': sessionId
        }
      });
      
      results.push({ attempt: i, status: response.status });
    } catch (error) {
      if (i === 6 && error.response?.status === 403) {
        return { limitEnforced: true, attempts: results };
      }
      results.push({ attempt: i, status: error.response?.status || 'error' });
    }
  }
  
  throw new Error('Limit not enforced after 6 uploads');
}

// A2.8: Migrate anonymous to user
async function testMigrateAnonymous() {
  // First create anonymous note
  const sessionId = `migrate-${Date.now()}`;
  const form = new FormData();
  const filePath = path.join(__dirname, '../test-data/zabka.m4a');
  
  form.append('file', fs.createReadStream(filePath));
  form.append('language', 'pl');
  
  const uploadResponse = await axios.post(`${API_URL}/voice-notes`, form, {
    headers: {
      ...form.getHeaders(),
      'x-session-id': sessionId
    }
  });
  
  const noteId = uploadResponse.data.voiceNote.id;
  
  // Register new user for migration
  const migrationUser = {
    email: `migrate-${Date.now()}@example.com`,
    password: 'Migrate123!',
    name: 'Migration User'
  };
  
  const registerResponse = await axios.post(`${API_URL}/auth/register`, migrationUser);
  const migrationToken = registerResponse.data.token;
  
  // Migrate anonymous notes
  const migrateResponse = await axios.post(
    `${API_URL}/auth/migrate-anonymous`,
    { sessionId },
    { headers: { Authorization: `Bearer ${migrationToken}` } }
  );
  
  if (migrateResponse.status !== 200) {
    throw new Error(`Expected 200, got ${migrateResponse.status}`);
  }
  
  // Verify migration
  const notesResponse = await axios.get(`${API_URL}/voice-notes`, {
    headers: { Authorization: `Bearer ${migrationToken}` }
  });
  
  const migratedNote = notesResponse.data.voiceNotes.find(n => n.id === noteId);
  if (!migratedNote || migratedNote.userId !== registerResponse.data.user.id) {
    throw new Error('Note not properly migrated');
  }
  
  return { migrated: true, noteId, userId: registerResponse.data.user.id };
}

async function runAuthTests() {
  console.log('='.repeat(60));
  console.log('SUITE 2: AUTHENTICATION TESTS');
  console.log('='.repeat(60));
  
  try {
    await runTest('A2.1', 'Register new user', testRegister);
    await runTest('A2.2', 'Login with credentials', testLogin);
    await runTest('A2.3', 'Access protected route', testProtectedRoute);
    await runTest('A2.4', 'Access without auth', testUnauthorized);
    await runTest('A2.5', 'Logout', testLogout);
    await runTest('A2.6', 'Anonymous upload', testAnonymousUpload);
    await runTest('A2.7', 'Anonymous usage limit', testAnonymousLimit);
    await runTest('A2.8', 'Migrate anonymous to user', testMigrateAnonymous);
  } catch (error) {
    console.error('\nSuite halted due to failure');
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('AUTHENTICATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(t => t.status === 'PASSED').length;
  const failed = testResults.filter(t => t.status === 'FAILED').length;
  
  console.log(`Total: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    testResults.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`- ${t.testId}: ${t.testName} - ${t.error}`);
    });
  }
}

runAuthTests().catch(console.error);