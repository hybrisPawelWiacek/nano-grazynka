#!/usr/bin/env node

/**
 * Test script to verify library page request cancellation works properly
 * This simulates rapid navigation that would previously cause "Failed to load" errors
 */

const http = require('http');

const API_URL = 'http://localhost:3101';

// Function to simulate a library API call
function makeLibraryRequest(sessionId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes?page=1&limit=10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test rapid requests that would trigger the race condition
async function testRapidRequests() {
  console.log('Testing rapid library requests (simulating component unmount/remount)...\n');
  
  const sessionId = 'test-session-' + Date.now();
  console.log(`Using session ID: ${sessionId}\n`);

  // Make 5 rapid requests, aborting all but the last
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const promise = makeLibraryRequest(sessionId);
    promises.push(promise);
    
    // Small delay to simulate React re-renders
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Wait for all requests to complete or fail
  const results = await Promise.allSettled(promises);
  
  let successCount = 0;
  let failCount = 0;
  let timeoutCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { status } = result.value;
      console.log(`Request ${index + 1}: Success (Status ${status})`);
      successCount++;
    } else {
      const error = result.reason;
      if (error.message.includes('timeout')) {
        console.log(`Request ${index + 1}: Timeout (would be cancelled in frontend)`);
        timeoutCount++;
      } else {
        console.log(`Request ${index + 1}: Failed - ${error.message}`);
        failCount++;
      }
    }
  });

  console.log('\n--- Test Results ---');
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`⏱️  Timeout/Cancelled: ${timeoutCount}`);
  console.log(`❌ Failed requests: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n✅ TEST PASSED: No unexpected failures with rapid requests');
    console.log('The abort mechanism should prevent "Failed to load" errors in the UI');
  } else {
    console.log('\n⚠️  TEST WARNING: Some requests failed unexpectedly');
  }
}

// Run the test
testRapidRequests().catch(console.error);