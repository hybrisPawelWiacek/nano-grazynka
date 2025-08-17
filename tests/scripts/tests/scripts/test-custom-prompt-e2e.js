#!/usr/bin/env node

/**
 * E2E test for custom summary prompt functionality
 * Tests upload -> transcription -> summary -> custom regeneration
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3101';
const sessionId = 'test-session-' + Date.now();

// Use an existing test file
const testFilePath = path.join(__dirname, '..', 'test-data', 'zabka.m4a');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadVoiceNote() {
  console.log('📤 Uploading voice note...');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(testFilePath));
  
  const response = await fetch(`${API_BASE}/api/voice-notes`, {
    method: 'POST',
    headers: {
      'x-session-id': sessionId,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed (${response.status}): ${error}`);
  }

  const result = await response.json();
  console.log('✅ Upload successful! Note ID:', result.id);
  return result.id;
}

async function waitForProcessing(noteId) {
  console.log('⏳ Waiting for transcription to complete...');
  
  let attempts = 0;
  const maxAttempts = 60;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`${API_BASE}/api/voice-notes/${noteId}`, {
      headers: {
        'x-session-id': sessionId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get note status: ${response.status}`);
    }
    
    const note = await response.json();
    
    if (note.status === 'completed') {
      console.log('✅ Transcription completed!');
      return note;
    } else if (note.status === 'failed') {
      throw new Error('Processing failed: ' + note.errorMessage);
    }
    
    await delay(2000);
    attempts++;
  }
  
  throw new Error('Processing timeout');
}

async function generateInitialSummary(noteId) {
  console.log('📝 Generating initial summary...');
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${noteId}/regenerate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({}) // No custom prompt for initial summary
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summary generation failed (${response.status}): ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Initial summary generated!');
  
  if (result.summary) {
    const summary = typeof result.summary === 'string' ? JSON.parse(result.summary) : result.summary;
    console.log('Initial summary structure:');
    console.log('- Has summary field:', 'summary' in summary);
    console.log('- Has key_points field:', 'key_points' in summary);
    console.log('- Has action_items field:', 'action_items' in summary);
  }
  
  return result;
}

async function testCustomPrompt(noteId) {
  console.log('\n🔄 Testing custom prompt regeneration...');
  const customPrompt = '2 sentences summary plz';
  console.log(`Custom prompt: "${customPrompt}"`);
  
  const response = await fetch(`${API_BASE}/api/voice-notes/${noteId}/regenerate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({
      userPrompt: customPrompt
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Response body:', error);
    throw new Error(`Custom prompt failed (${response.status}): ${error}`);
  }
  
  const result = await response.json();
  console.log('✅ Custom summary generated!');
  
  if (result.summary) {
    const summary = typeof result.summary === 'string' ? JSON.parse(result.summary) : result.summary;
    console.log('\nCustom summary structure:');
    console.log('- Has summary field:', 'summary' in summary);
    console.log('- Has key_points field:', 'key_points' in summary);
    console.log('- Has action_items field:', 'action_items' in summary);
    
    if (summary.summary && !summary.key_points && !summary.action_items) {
      console.log('\n🎉 SUCCESS: Custom prompt produced flexible JSON!');
      console.log('Summary content:', summary.summary);
    } else {
      console.log('\n⚠️  WARNING: Summary still has rigid structure');
      console.log('Full summary:', JSON.stringify(summary, null, 2));
    }
  }
  
  return result;
}

async function runE2ETest() {
  try {
    console.log('=== Custom Prompt E2E Test ===\n');
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }
    
    // 1. Upload
    const noteId = await uploadVoiceNote();
    
    // 2. Wait for transcription
    await waitForProcessing(noteId);
    
    // 3. Generate initial summary
    await generateInitialSummary(noteId);
    
    // 4. Test custom prompt
    await testCustomPrompt(noteId);
    
    console.log('\n✅ E2E test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ E2E test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runE2ETest().catch(console.error);