const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, './zabka.m4a');
const fileData = fs.readFileSync(filePath);

console.log('File size:', fileData.length, 'bytes');

// Create multipart form data manually
const boundary = '----FormBoundary' + Math.random().toString(36);
const formData = [];

// Add file field
formData.push(`--${boundary}`);
formData.push('Content-Disposition: form-data; name="file"; filename="zabka.m4a"');
formData.push('Content-Type: audio/m4a');
formData.push('');
formData.push(fileData);

// Add other fields
formData.push(`--${boundary}`);
formData.push('Content-Disposition: form-data; name="userId"');
formData.push('');
formData.push('test-user');

formData.push(`--${boundary}`);
formData.push('Content-Disposition: form-data; name="language"');
formData.push('');
formData.push('PL');

formData.push(`--${boundary}`);
formData.push('Content-Disposition: form-data; name="tags"');
formData.push('');
formData.push('test,zabka');

formData.push(`--${boundary}--`);

// Combine all parts
const textParts = [];
const bufferParts = [];
let totalLength = 0;

for (const part of formData) {
  if (Buffer.isBuffer(part)) {
    bufferParts.push(part);
    totalLength += part.length;
  } else {
    const buf = Buffer.from(part + '\r\n');
    bufferParts.push(buf);
    totalLength += buf.length;
  }
}

const body = Buffer.concat(bufferParts, totalLength);

// Make the request
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3101,
  path: '/api/voice-notes',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
};

console.log('Uploading to', options.path);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 201) {
      try {
        const result = JSON.parse(data);
        console.log('\n✅ Upload successful!');
        console.log('Voice note ID:', result.voiceNote.id);
        console.log('Status:', result.voiceNote.status);
        console.log('File:', result.voiceNote.originalFilePath);
      } catch (e) {
        console.error('Failed to parse response:', e);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(body);
req.end();