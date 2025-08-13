#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function testMultiModelTranscription() {
  console.log('Testing Multi-Model Transcription Feature\n');
  console.log('==========================================\n');

  const audioFile = path.join(__dirname, 'zabka.m4a');
  
  try {
    const fileBuffer = fs.readFileSync(audioFile);
    const blob = new Blob([fileBuffer], { type: 'audio/m4a' });
    
    const formData = new FormData();
    formData.append('file', blob, 'zabka.m4a');
    formData.append('language', 'PL');
    formData.append('transcriptionModel', 'gpt-4o-transcribe');
    formData.append('whisperPrompt', 'Żabka, sklep convenience, hot dog');
    
    const sessionId = 'test-session-' + Date.now();
    
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      headers: {
        'x-session-id': sessionId
      },
      body: formData
    });

    const result = await response.json();
    
    console.log('Upload Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.voiceNote?.id) {
      // Fetch details
      const detailResponse = await fetch(`http://localhost:3101/api/voice-notes/${result.voiceNote.id}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      const details = await detailResponse.json();
      console.log('\nFetch Details Response:', JSON.stringify(details, null, 2));
      
      // Also check the database directly
      const dbCheckResponse = await fetch(`http://localhost:3101/api/voice-notes/${result.voiceNote.id}?includeTranscription=false&includeSummary=false`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      const dbCheck = await dbCheckResponse.json();
      console.log('\nDatabase Check:', JSON.stringify(dbCheck, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMultiModelTranscription().catch(console.error);