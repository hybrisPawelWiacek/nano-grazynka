#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:3101';

// Generate a unique session ID
const sessionId = `test-session-${Date.now()}`;

async function testGeminiTranscription() {
  console.log('Testing Gemini 2.0 Flash transcription...');
  console.log('Session ID:', sessionId);
  
  try {
    // Step 1: Upload a test file
    const testAudioPath = path.join(__dirname, '../test-data/zabka.m4a');
    
    if (!fs.existsSync(testAudioPath)) {
      console.error('Test audio file not found:', testAudioPath);
      process.exit(1);
    }
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath), 'zabka.m4a');
    formData.append('language', 'PL');
    formData.append('transcriptionModel', 'gemini-2.0-flash');
    
    console.log('\n1. Uploading audio file...');
    const uploadResponse = await fetch(`${API_BASE_URL}/api/voice-notes`, {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${error}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload successful:', uploadResult.voiceNote.id);
    
    // Step 2: Process the voice note with Gemini
    console.log('\n2. Processing with Gemini 2.0 Flash...');
    const processResponse = await fetch(`${API_BASE_URL}/api/voice-notes/${uploadResult.voiceNote.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({
        language: 'PL'
      })
    });
    
    if (!processResponse.ok) {
      const error = await processResponse.text();
      throw new Error(`Processing failed: ${error}`);
    }
    
    const processResult = await processResponse.json();
    console.log('Processing completed:', processResult);
    
    // Step 3: Get the transcription
    console.log('\n3. Fetching transcription...');
    const transcriptionResponse = await fetch(`${API_BASE_URL}/api/voice-notes/${uploadResult.voiceNote.id}/transcription`, {
      method: 'GET',
      headers: {
        'x-session-id': sessionId,
      }
    });
    
    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Failed to get transcription: ${error}`);
    }
    
    const transcription = await transcriptionResponse.json();
    console.log('\nTranscription result:');
    console.log('Text:', transcription.transcription.text);
    console.log('Model used:', transcription.transcription.model);
    
    console.log('\n✅ Gemini transcription test successful!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGeminiTranscription();