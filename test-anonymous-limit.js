const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

// Use the same sessionId for all uploads to test the limit
const sessionId = '213ed722-c764-4483-8bfb-2c7f2dfcfb62';
let uploadCount = 0;

async function uploadFile() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    // Read zabka.m4a from tests directory
    const fileStream = fs.createReadStream('./tests/zabka.m4a');
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    form.append('sessionId', sessionId);
    form.append('language', 'AUTO');
    form.append('tags', `test,attempt-${uploadCount + 1}`);
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    uploadCount++;
    console.log(`\n📤 Upload attempt #${uploadCount} with sessionId: ${sessionId}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('✅ Upload successful!');
          console.log('Voice note ID:', result.voiceNote.id);
          resolve({ success: true, data: result });
        } else if (res.statusCode === 403) {
          const error = JSON.parse(data);
          console.log('🚫 Usage limit reached!');
          console.log('Message:', error.message);
          console.log('Usage count:', error.usageCount);
          console.log('Limit:', error.limit);
          resolve({ success: false, limitReached: true, data: error });
        } else {
          console.log('❌ Upload failed');
          const error = JSON.parse(data);
          console.log('Error:', error);
          resolve({ success: false, data: error });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Connection error:', error);
      reject(error);
    });
    
    form.pipe(req);
  });
}

async function testUsageLimit() {
  console.log('Testing anonymous usage limit (should allow 5 uploads)...');
  console.log('Using sessionId:', sessionId);
  console.log('Note: This session already has 1 upload from previous test\n');
  
  for (let i = 0; i < 6; i++) {
    const result = await uploadFile();
    
    if (result.limitReached) {
      console.log('\n✅ Test passed! Limit correctly enforced after 5 uploads.');
      break;
    } else if (!result.success) {
      console.log('\n❌ Test failed with unexpected error');
      break;
    }
    
    // Wait a bit between uploads
    if (i < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\nTest complete!');
}

testUsageLimit().catch(console.error);