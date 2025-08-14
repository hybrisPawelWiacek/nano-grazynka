const fs = require('fs');
const FormData = require('form-data');
const http = require('http');
const crypto = require('crypto');

async function testGeminiDirectly() {
  console.log('='.repeat(60));
  console.log('PROOF OF GEMINI DIRECT API USAGE');
  console.log('='.repeat(60));
  
  // Step 1: Upload with Gemini model
  const sessionId = crypto.randomUUID();
  console.log('\n1. UPLOAD PHASE');
  console.log('Session ID:', sessionId);
  console.log('Selected Model: google/gemini-2.0-flash-001');
  
  const uploadResult = await uploadFile(sessionId, 'google/gemini-2.0-flash-001');
  
  // Step 2: Process and wait for transcription
  console.log('\n2. PROCESSING PHASE');
  await processAndWait(uploadResult.voiceNote.id, sessionId);
  
  // Step 3: Compare with GPT-4o
  console.log('\n3. COMPARISON TEST - Now testing GPT-4o');
  const gptSessionId = crypto.randomUUID();
  const gptUploadResult = await uploadFile(gptSessionId, 'gpt-4o-transcribe');
  await processAndWait(gptUploadResult.voiceNote.id, gptSessionId);
}

async function uploadFile(sessionId, model) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    const path = require('path');
    const audioPath = path.join(__dirname, '../test-data/zabka.m4a');
    const fileStream = fs.createReadStream(audioPath);
    
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    form.append('sessionId', sessionId);
    form.append('language', 'PL');
    form.append('transcriptionModel', model);
    
    const headers = form.getHeaders();
    headers['x-session-id'] = sessionId;
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: headers
    };
    
    console.log(`Uploading with model: ${model}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log(`✅ Upload successful with ${model}`);
          console.log('Voice note ID:', result.voiceNote.id);
          resolve(result);
        } else {
          reject(new Error(`Upload failed: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

async function processAndWait(voiceNoteId, sessionId) {
  // Trigger processing
  await triggerProcessing(voiceNoteId, sessionId);
  
  // Wait and check result
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Get final result
  const result = await getVoiceNote(voiceNoteId, sessionId);
  
  if (result.transcription) {
    console.log('\n📝 TRANSCRIPTION RESULT:');
    console.log('Model used:', result.transcriptionModel);
    console.log('First 200 chars:', result.transcription.text.substring(0, 200));
    console.log('Total length:', result.transcription.text.length, 'characters');
    console.log('Word count:', result.transcription.wordCount);
    
    // Check for telltale signs
    if (result.transcription.text.includes('Okej') && result.transcription.text.includes('Recording')) {
      console.log('✅ Contains expected Polish/English mixed content');
    }
    
    // Check if it's NOT the GPT-4o response pattern
    if (!result.transcription.text.includes('I understand') && !result.transcription.text.includes("I'm ready")) {
      console.log('✅ NOT a prompt acknowledgment response');
    }
  }
  
  return result;
}

async function triggerProcessing(voiceNoteId, sessionId) {
  return new Promise((resolve, reject) => {
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
        if (res.statusCode === 200) {
          console.log('Processing triggered successfully');
          resolve();
        } else {
          reject(new Error(`Processing failed: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getVoiceNote(voiceNoteId, sessionId) {
  return new Promise((resolve, reject) => {
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
          reject(new Error(`Failed to get voice note: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// Run the test
testGeminiDirectly().catch(console.error);