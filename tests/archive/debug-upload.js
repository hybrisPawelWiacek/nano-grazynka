const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

console.log('Starting upload test...\n');

// Check if file exists
if (!fs.existsSync('./zabka.m4a')) {
  console.error('ERROR: zabka.m4a not found!');
  process.exit(1);
}

const fileStats = fs.statSync('./zabka.m4a');
console.log(`File: zabka.m4a`);
console.log(`Size: ${fileStats.size} bytes\n`);

// Create form
const form = new FormData();
form.append('file', fs.createReadStream('./zabka.m4a'), {
  filename: 'zabka.m4a',
  contentType: 'audio/m4a'
});
form.append('title', 'Zabka Test');
form.append('language', 'PL');

const options = {
  hostname: 'localhost',
  port: 3101,
  path: '/api/voice-notes',
  method: 'POST',
  headers: form.getHeaders(),
  timeout: 30000
};

console.log('Request options:', options);
console.log('\nSending request...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.voiceNote && json.voiceNote.id) {
        console.log('\n✅ SUCCESS! Voice Note ID:', json.voiceNote.id);
        console.log('\nNow triggering processing...');
        processNote(json.voiceNote.id);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.on('timeout', () => {
  console.error('Request timeout!');
  req.destroy();
});

form.pipe(req);

function processNote(id) {
  const data = JSON.stringify({ language: 'PL' });
  
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${id}/process`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Processing response:', responseData);
      
      // Check status after 3 seconds
      setTimeout(() => {
        checkStatus(id);
      }, 3000);
    });
  });
  
  req.write(data);
  req.end();
}

function checkStatus(id) {
  http.get(`http://localhost:3101/api/voice-notes/${id}?includeTranscription=true`, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('\n=== FINAL STATUS ===');
      console.log('Status:', result.status);
      
      if (result.transcriptions && result.transcriptions[0]) {
        console.log('\n🎉 TRANSCRIPTION SUCCESSFUL!');
        console.log('Language:', result.transcriptions[0].language);
        console.log('\n--- TRANSCRIPT ---');
        console.log(result.transcriptions[0].content);
        console.log('--- END ---');
      } else if (result.errorMessage) {
        console.log('❌ ERROR:', result.errorMessage);
      }
    });
  });
}