#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');

async function testCustomPrompt() {
  console.log('Testing custom prompt feature...\n');

  // Test with custom prompt
  console.log('Test: Upload WITH custom prompt');
  const form = new FormData();
  form.append('file', fs.createReadStream('backend/zabka.m4a'));
  form.append('userId', 'default-user');
  form.append('customPrompt', 'Focus on identifying all locations and proper names mentioned. Extract key information.');
  
  try {
    console.log('Uploading file...');
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return;
    }
    
    if (!data.voiceNote) {
      console.error('No voiceNote in response');
      return;
    }
    
    console.log('✅ Upload successful:', data.voiceNote.id);
    console.log('   Status:', data.voiceNote.status);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCustomPrompt().catch(console.error);