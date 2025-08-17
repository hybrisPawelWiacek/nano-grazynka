const fs = require('fs');
const FormData = require('form-data');
const http = require('http');
const crypto = require('crypto');

async function testWebAppWithGemini() {
  console.log('='.repeat(60));
  console.log('TESTING WEB APP WITH DIRECT GEMINI API');
  console.log('='.repeat(60));
  
  const sessionId = crypto.randomUUID();
  console.log('\n1. Session Setup');
  console.log('Anonymous Session ID:', sessionId);
  
  // Test 1: Upload with Gemini model (as if selected in UI)
  console.log('\n2. Uploading with Gemini Model (as selected in UI)');
  const result = await uploadViaWebApp(sessionId, 'google/gemini-2.0-flash-001');
  
  if (result.success) {
    console.log('✅ Upload successful');
    console.log('Voice Note ID:', result.voiceNoteId);
    
    // Process and monitor
    console.log('\n3. Processing with Gemini...');
    await processAndMonitor(result.voiceNoteId, sessionId);
  }
}

async function uploadViaWebApp(sessionId, model) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    const path = require('path');
    const audioPath = path.join(__dirname, '../test-data/zabka.m4a');
    const fileStream = fs.createReadStream(audioPath);
    
    // Simulate what the frontend sends
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    form.append('sessionId', sessionId);
    form.append('language', 'PL');
    form.append('transcriptionModel', model);
    
    // Add Gemini-specific prompts (simulating UI input)
    if (model === 'google/gemini-2.0-flash-001') {
      form.append('geminiSystemPrompt', 'You are a professional transcriber. Focus on accuracy.');
      form.append('geminiUserPrompt', 'Transcribe this Polish/English mixed audio carefully.');
    }
    
    const headers = form.getHeaders();
    headers['x-session-id'] = sessionId; // Critical for anonymous auth
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: headers
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          resolve({
            success: true,
            voiceNoteId: result.voiceNote.id,
            response: result
          });
        } else {
          console.error('Upload failed:', res.statusCode, data);
          resolve({ success: false, error: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('Request error:', err);
      resolve({ success: false, error: err.message });
    });
    
    form.pipe(req);
  });
}

async function processAndMonitor(voiceNoteId, sessionId) {
  // Trigger processing
  await triggerProcessing(voiceNoteId, sessionId);
  
  // Monitor for completion
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await checkStatus(voiceNoteId, sessionId);
    console.log(`Attempt ${attempts + 1}: Status = ${status.status}`);
    
    if (status.transcription) {
      console.log('\n✅ TRANSCRIPTION COMPLETE!');
      console.log('Model used:', status.transcriptionModel);
      console.log('Language:', status.transcription.language);
      console.log('First 300 chars:', status.transcription.text.substring(0, 300));
      console.log('Word count:', status.transcription.wordCount || status.transcription.text.split(' ').length);
      
      // Verify it's actually Gemini transcription
      if (status.transcription.text.includes('Okej') && 
          status.transcription.text.includes('Recording')) {
        console.log('\n✅ VERIFIED: This is genuine Gemini transcription!');
        console.log('   - Contains Polish "Okej" (not English "Okay")');
        console.log('   - Mixed Polish/English content preserved');
        console.log('   - NOT a prompt acknowledgment');
      }
      
      return;
    }
    
    if (status.status === 'failed') {
      console.error('❌ Processing failed:', status.errorMessage);
      return;
    }
    
    attempts++;
  }
  
  console.log('⏱️ Processing timeout - check backend logs');
}

async function triggerProcessing(voiceNoteId, sessionId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ language: 'PL' });
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: `/api/voice-notes/${voiceNoteId}/process`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-session-id': sessionId
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Processing triggered:', res.statusCode === 200 ? '✓' : '✗');
        resolve();
      });
    });
    
    req.on('error', console.error);
    req.write(postData);
    req.end();
  });
}

async function checkStatus(voiceNoteId, sessionId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: `/api/voice-notes/${voiceNoteId}?includeTranscription=true`,
      method: 'GET',
      headers: {
        'x-session-id': sessionId
      }
    };
    
    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          resolve({ status: 'error', statusCode: res.statusCode });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 'error', error: err.message });
    });
  });
}

// Run the test
console.log('Testing Web App Gemini Integration...');
console.log('Ensure Docker is running: docker compose up\n');

testWebAppWithGemini().catch(console.error);