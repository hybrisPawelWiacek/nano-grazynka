#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3101/api';
const TEST_DATA_DIR = path.join(__dirname, '../test-data');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper to log test results
function logTest(testId, description, passed, error = null) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testId}: ${description}`);
  if (error) console.log(`   Error: ${error}`);
  
  results.tests.push({ testId, description, passed, error });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper to create axios instance with session
function createClient(sessionId = null) {
  const headers = {};
  if (sessionId) headers['x-session-id'] = sessionId;
  return axios.create({
    baseURL: API_BASE,
    headers,
    validateStatus: () => true // Don't throw on any status
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('COMPREHENSIVE TEST SUITE EXECUTION');
  console.log('============================================================\n');

  // Suite 1: Smoke Tests
  console.log('SUITE 1: SMOKE TESTS');
  console.log('--------------------');
  
  try {
    const health = await axios.get(`${API_BASE.replace('/api', '/health')}`);
    logTest('S1.1', 'Backend health check', health.status === 200 && health.data.status === 'healthy');
  } catch (error) {
    logTest('S1.1', 'Backend health check', false, error.message);
  }

  // Suite 3: Backend API Tests
  console.log('\nSUITE 3: BACKEND API TESTS');
  console.log('---------------------------');

  const sessionId = uuidv4();
  const client = createClient(sessionId);

  // B3.1: Health endpoints
  try {
    const readiness = await axios.get(`${API_BASE.replace('/api', '/readiness')}`);
    logTest('B3.1', 'Readiness endpoint', readiness.status === 200);
  } catch (error) {
    logTest('B3.1', 'Readiness endpoint', false, error.message);
  }

  // B3.2: Upload voice note
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(path.join(TEST_DATA_DIR, 'test-audio.mp3')));
    form.append('userId', 'anonymous');
    
    const upload = await client.post('/voice-notes/upload', form, {
      headers: form.getHeaders()
    });
    
    const noteId = upload.data?.voiceNote?.id;
    logTest('B3.2', 'Upload voice note', upload.status === 201 && noteId);
    
    if (noteId) {
      // B3.5: List voice notes
      const list = await client.get(`/voice-notes?sessionId=${sessionId}`);
      logTest('B3.5', 'List voice notes', list.status === 200 && Array.isArray(list.data.voiceNotes));
      
      // B3.6: Get single note
      const single = await client.get(`/voice-notes/${noteId}`);
      logTest('B3.6', 'Get single note', single.status === 200 && single.data.voiceNote?.id === noteId);
      
      // B3.7: Delete voice note
      const del = await client.delete(`/voice-notes/${noteId}`);
      logTest('B3.7', 'Delete voice note', del.status === 204);
    }
  } catch (error) {
    logTest('B3.2', 'Upload voice note', false, error.message);
  }

  // B3.3: Process transcription (Polish)
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(path.join(TEST_DATA_DIR, 'zabka.m4a')));
    form.append('userId', 'anonymous');
    form.append('languageCode', 'pl');
    
    const upload = await client.post('/voice-notes/upload', form, {
      headers: form.getHeaders()
    });
    
    logTest('B3.3', 'Process transcription (PL)', upload.status === 201);
  } catch (error) {
    logTest('B3.3', 'Process transcription (PL)', false, error.message);
  }

  // B3.8: Invalid file upload
  try {
    const form = new FormData();
    form.append('file', Buffer.from('invalid'), { filename: 'test.txt' });
    form.append('userId', 'anonymous');
    
    const upload = await client.post('/voice-notes/upload', form, {
      headers: form.getHeaders()
    });
    
    logTest('B3.8', 'Invalid file upload rejection', upload.status === 400);
  } catch (error) {
    logTest('B3.8', 'Invalid file upload rejection', false, error.message);
  }

  // Suite 7: Entity Project System Tests
  console.log('\nSUITE 7: ENTITY PROJECT SYSTEM TESTS');
  console.log('-------------------------------------');

  // First, create a test user and authenticate
  const testEmail = `test-${Date.now()}@example.com`;
  try {
    // Register user
    const register = await client.post('/auth/register', {
      email: testEmail,
      password: 'TestPass123!',
      name: 'Test User'
    });
    
    if (register.status === 201) {
      const authToken = register.headers['set-cookie']?.[0];
      const authClient = axios.create({
        baseURL: API_BASE,
        headers: {
          Cookie: authToken
        },
        validateStatus: () => true
      });

      // EP7A.1: Create project
      const project = await authClient.post('/projects', {
        name: 'Test Project',
        description: 'Test project for entity system'
      });
      logTest('EP7A.1', 'Create project via API', project.status === 201);

      if (project.data?.project?.id) {
        const projectId = project.data.project.id;

        // EP7A.2: Create entities
        const entities = [];
        const entityTypes = [
          { name: 'Microsoft', type: 'company', value: 'Microsoft' },
          { name: 'John Doe', type: 'person', value: 'John Doe' },
          { name: 'Claude API', type: 'technical', value: 'Claude API' },
          { name: 'iPhone', type: 'product', value: 'iPhone' }
        ];

        for (const entityData of entityTypes) {
          const entity = await authClient.post('/entities', entityData);
          if (entity.status === 201) {
            entities.push(entity.data.entity);
          }
        }
        logTest('EP7A.2', 'Create entities (all 4 types)', entities.length === 4);

        // EP7A.3: Associate entities to project
        if (entities.length > 0) {
          const associate = await authClient.put(`/projects/${projectId}/entities`, {
            entityIds: entities.map(e => e.id)
          });
          logTest('EP7A.3', 'Associate entities to project', associate.status === 200);
        }

        // EP7A.9: Remove entities from project
        const remove = await authClient.put(`/projects/${projectId}/entities`, {
          entityIds: []
        });
        logTest('EP7A.9', 'Remove entities from project', remove.status === 200);

        // EP7A.10: Delete project
        const deleteProject = await authClient.delete(`/projects/${projectId}`);
        logTest('EP7A.10', 'Delete project', deleteProject.status === 204);
      }
    }
  } catch (error) {
    logTest('EP7A.1', 'Entity system tests', false, error.message);
  }

  // Print summary
  console.log('\n============================================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`- ${t.testId}: ${t.description}`);
      if (t.error) console.log(`  Error: ${t.error}`);
    });
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});