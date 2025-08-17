const fs = require('fs');
const FormData = require('form-data');
const http = require('http');
const crypto = require('crypto');

async function uploadFileAnonymous(filePath, mimeType) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    // Read file from provided path
    const fileStream = fs.createReadStream(filePath);
    const filename = filePath.split('/').pop();
    
    form.append('file', fileStream, {
      filename: filename,
      contentType: mimeType
    });
    
    // Generate session ID for anonymous user
    const sessionId = crypto.randomUUID();
    console.log('Generated sessionId:', sessionId);
    
    form.append('sessionId', sessionId);
    form.append('language', 'AUTO');
    form.append('tags', 'test,anonymous,mp3');
    
    // Add x-session-id header for anonymous authentication
    const headers = form.getHeaders();
    headers['x-session-id'] = sessionId;
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: headers
    };
    
    console.log(`Uploading ${filename} as anonymous user...`);
    console.log('MIME type:', mimeType);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nStatus:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('\n✅ Upload successful!');
          console.log('Voice note ID:', result.voiceNote.id);
          console.log('Status:', result.voiceNote.status);
          console.log('Duration:', result.voiceNote.duration, 'seconds');
          console.log('AI Title:', result.voiceNote.aiGeneratedTitle);
          console.log('Brief Description:', result.voiceNote.briefDescription);
          resolve(result);
        } else {
          console.log('\n❌ Upload failed');
          try {
            const error = JSON.parse(data);
            console.log('Error:', error.error);
            console.log('Message:', error.message);
          } catch (e) {
            console.log('Raw error:', data);
          }
          reject(new Error(`Upload failed with status ${res.statusCode}`));
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

// Test with MP3 file
console.log('Testing MP3 upload to nano-Grazynka backend...');
console.log('Make sure Docker is running: docker compose up\n');

uploadFileAnonymous('./tests/test-data/zabka.mp3', 'audio/mpeg')
  .then(() => {
    console.log('\n--- Testing M4A file for comparison ---\n');
    return uploadFileAnonymous('./tests/test-data/zabka.m4a', 'audio/m4a');
  })
  .catch(console.error);