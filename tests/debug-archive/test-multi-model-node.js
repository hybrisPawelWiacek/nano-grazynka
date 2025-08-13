#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function testMultiModelTranscription() {
  console.log('Testing Multi-Model Transcription Feature\n');
  console.log('==========================================\n');

  const audioFile = path.join(__dirname, 'zabka.m4a');
  
  // Test with native FormData (Node.js 18+)
  console.log('Test: Multi-model fields in upload');
  console.log('-----------------------------------------------');
  
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
    
    if (response.ok) {
      console.log('✅ Upload successful');
      console.log('Voice Note ID:', result.voiceNote?.id);
      console.log('Status:', result.voiceNote?.status);
      console.log('Full voiceNote object:', JSON.stringify(result.voiceNote, null, 2));
      
      // Now fetch the voice note details to verify fields were saved
      const detailResponse = await fetch(`http://localhost:3101/api/voice-notes/${result.voiceNote?.id}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      const details = await detailResponse.json();
      console.log('\nFetched details:');
      console.log('- transcriptionModel:', details.voiceNote?.transcriptionModel || 'NOT FOUND');
      console.log('- whisperPrompt:', details.voiceNote?.whisperPrompt || 'NOT FOUND');
      console.log('- geminiSystemPrompt:', details.voiceNote?.geminiSystemPrompt || 'NOT FOUND');
      console.log('- geminiUserPrompt:', details.voiceNote?.geminiUserPrompt || 'NOT FOUND');
      
    } else {
      console.error('❌ Upload failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMultiModelTranscription().catch(console.error);