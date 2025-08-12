const fs = require('fs');
const FormData = require('form-data');
const http = require('http');
const crypto = require('crypto');

async function uploadFileAnonymous() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    // Read zabka.m4a from tests directory
    const fileStream = fs.createReadStream('./tests/zabka.m4a');
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    // Generate session ID for anonymous user
    const sessionId = crypto.randomUUID();
    console.log('Generated sessionId:', sessionId);
    
    form.append('sessionId', sessionId);
    form.append('language', 'AUTO');  // Test AUTO language handling
    form.append('tags', 'test,anonymous,zabka');
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    console.log('Uploading zabka.m4a as anonymous user...');
    console.log('Request headers:', options.headers);
    
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
          console.log('Message:', result.message);
          
          // Now trigger processing
          processVoiceNote(result.voiceNote.id);
        } else {
          console.log('\n❌ Upload failed');
          try {
            const error = JSON.parse(data);
            console.log('Error:', error.error);
            console.log('Message:', error.message);
          } catch (e) {
            console.log('Raw error:', data);
          }
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

function processVoiceNote(voiceNoteId) {
  const postData = JSON.stringify({ language: 'PL' });
  
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${voiceNoteId}/process`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('\nTriggering transcription processing...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Processing status:', res.statusCode);
      console.log('Processing response:', data);
      
      if (res.statusCode === 200) {
        console.log('\n✅ Processing started successfully');
      } else {
        console.log('\n❌ Processing failed');
      }
    });
  });
  
  req.on('error', console.error);
  req.write(postData);
  req.end();
}

// Make sure backend is running
console.log('Testing anonymous upload to nano-Grazynka backend...');
console.log('Make sure Docker is running: docker compose up\n');

uploadFileAnonymous().catch(console.error);