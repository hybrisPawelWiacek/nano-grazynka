#!/usr/bin/env node

/**
 * Test script to verify 403 fix for anonymous users
 * Tests the complete flow: upload -> process -> regenerate-summary
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3101';
const TEST_FILE = path.join(__dirname, 'zabka.m4a');

// Generate a unique session ID for this test
const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
console.log('🔑 Using sessionId:', sessionId);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadFile() {
  console.log('\n📤 Step 1: Uploading file...');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(TEST_FILE));
  form.append('language', 'PL');
  form.append('sessionId', sessionId);
  
  const response = await fetch(`${API_BASE}/api/voice-notes`, {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'x-session-id': sessionId  // Include header for consistency
    },
    body: form
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log('✅ Upload successful, voiceNoteId:', data.voiceNote.id);
  console.log('   sessionId stored:', data.voiceNote.sessionId);
  return data.voiceNote.id;
}

async function processVoiceNote(voiceNoteId) {
  console.log('\n⚙️  Step 2: Processing voice note...');
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${voiceNoteId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({ language: 'PL' })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Process failed: ${response.status} - ${error}`);
  }
  
  console.log('✅ Processing started');
}

async function waitForTranscription(voiceNoteId) {
  console.log('\n⏳ Step 3: Waiting for transcription...');
  
  for (let i = 0; i < 30; i++) {
    const response = await fetch(`${API_BASE}/api/voice-notes/${voiceNoteId}?includeTranscription=true&includeSummary=true`, {
      headers: {
        'x-session-id': sessionId
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Status check failed: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    
    if (data.transcription && !data.summary) {
      console.log('✅ Transcription complete, no summary yet');
      return true;
    } else if (data.transcription && data.summary) {
      console.log('✅ Both transcription and summary complete');
      return false; // Don't need to regenerate
    }
    
    process.stdout.write('.');
    await sleep(2000);
  }
  
  throw new Error('Timeout waiting for transcription');
}

async function regenerateSummary(voiceNoteId) {
  console.log('\n✨ Step 4: Regenerating summary...');
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${voiceNoteId}/regenerate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({
      userPrompt: 'Test summary generation'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Regenerate summary failed:', response.status);
    console.error('   Error:', error);
    throw new Error(`Regenerate summary failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log('✅ Summary regenerated successfully');
  return data;
}

async function runTest() {
  try {
    console.log('🧪 Testing 403 Fix for Anonymous Users');
    console.log('=====================================');
    
    // Step 1: Upload
    const voiceNoteId = await uploadFile();
    
    // Step 2: Process
    await processVoiceNote(voiceNoteId);
    
    // Step 3: Wait for transcription
    const needsRegenerate = await waitForTranscription(voiceNoteId);
    
    // Step 4: Regenerate summary if needed
    if (needsRegenerate) {
      await regenerateSummary(voiceNoteId);
    }
    
    console.log('\n🎉 SUCCESS! All steps completed without 403 errors');
    console.log('The fix is working correctly!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTest();