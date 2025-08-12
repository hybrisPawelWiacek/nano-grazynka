#!/usr/bin/env node

/**
 * Test script for whisperPrompt functionality
 * Tests the new /api/voice-notes/:id/regenerate-summary endpoint
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3101';
const sessionId = `test-whisper-${Date.now()}`;

async function uploadTestFile() {
  console.log('📤 Uploading test file...');
  
  const audioFile = path.join(__dirname, '../test-data/zabka.m4a');
  if (!fs.existsSync(audioFile)) {
    console.error('❌ Test file zabka.m4a not found');
    process.exit(1);
  }
  
  const form = new FormData();
  form.append('file', fs.createReadStream(audioFile));
  form.append('sessionId', sessionId);
  form.append('language', 'PL');
  
  const response = await fetch(`${API_BASE}/api/voice-notes`, {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'x-session-id': sessionId
    },
    body: form
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Upload successful, ID:', result.voiceNote.id);
  return result.voiceNote.id;
}

async function processVoiceNote(id) {
  console.log('⚙️ Processing voice note...');
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${id}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Processing failed: ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Processing started');
  
  // Wait for processing to complete
  await waitForCompletion(id);
}

async function waitForCompletion(id) {
  console.log('⏳ Waiting for processing to complete...');
  
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${API_BASE}/api/voice-notes/${id}?includeTranscription=true&includeSummary=true`, {
      headers: {
        'x-session-id': sessionId
      }
    });
    
    if (!response.ok) {
      continue;
    }
    
    const voiceNote = await response.json();
    if (voiceNote.status === 'completed') {
      console.log('✅ Processing completed');
      console.log('📝 Original transcription:', voiceNote.transcription?.text?.substring(0, 100) + '...');
      return voiceNote;
    } else if (voiceNote.status === 'failed') {
      throw new Error('Processing failed: ' + voiceNote.errorMessage);
    }
  }
  
  throw new Error('Processing timeout');
}

async function regenerateWithWhisperPrompt(id) {
  console.log('🔄 Regenerating with Whisper prompt...');
  
  const whisperPrompt = 'This is a conversation in Polish about a convenience store called Żabka. Focus on proper Polish names and places.';
  const userPrompt = 'Extract key information about the Żabka store and any mentioned products or services.';
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${id}/regenerate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({
      whisperPrompt,
      userPrompt
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Regeneration failed: ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Regeneration completed');
  console.log('📝 New transcription:', result.voiceNote?.transcription?.text?.substring(0, 100) + '...');
  console.log('📋 New summary:', result.voiceNote?.summary?.summary?.substring(0, 200) + '...');
  
  return result;
}

async function main() {
  try {
    console.log('🧪 Testing Whisper Prompt Functionality\n');
    console.log('Session ID:', sessionId);
    console.log('-----------------------------------\n');
    
    // Step 1: Upload file
    const voiceNoteId = await uploadTestFile();
    
    // Step 2: Process without prompt
    await processVoiceNote(voiceNoteId);
    
    // Step 3: Regenerate with Whisper prompt
    await regenerateWithWhisperPrompt(voiceNoteId);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();