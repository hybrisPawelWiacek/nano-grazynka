const http = require('http');
const crypto = require('crypto');

console.log('🚀 Running Test Suites...\n');

// Suite 2: Authentication Tests
async function testAuth() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Test123!';
  
  // Test registration
  const registerData = JSON.stringify({
    email: email,
    password: password,
    name: 'Test User'
  });
  
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3101,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': registerData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('A2.1 Register:', res.statusCode === 201 ? '✅ PASSED' : `❌ FAILED (${res.statusCode})`);
        if (res.statusCode === 201) {
          console.log('Response:', data.substring(0, 100));
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('A2.1 Register: ❌ FAILED -', e.message);
      resolve();
    });
    
    req.write(registerData);
    req.end();
  });
}

// Suite 3: Backend API test
async function testBackendAPI() {
  return new Promise((resolve) => {
    http.get('http://localhost:3101/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('B2.1 Health:', res.statusCode === 200 ? '✅ PASSED' : `❌ FAILED (${res.statusCode})`);
        resolve();
      });
    }).on('error', (e) => {
      console.error('B2.1 Health: ❌ FAILED -', e.message);
      resolve();
    });
  });
}

async function runTests() {
  console.log('## Suite 2: Authentication Tests');
  await testAuth();
  
  console.log('\n## Suite 3: Backend API Tests');
  await testBackendAPI();
  
  console.log('\n✅ Test run completed!');
}

runTests();