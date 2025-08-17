#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3101';

async function testReprocess() {
  console.log('🧪 Testing Reprocess Endpoint...\n');
  
  // First, upload a test file
  console.log('1️⃣ Uploading test audio file...');
  const formData = new FormData();
  const audioBuffer = fs.readFileSync(path.join(__dirname, 'zabka.m4a'));
  const blob = new Blob([audioBuffer], { type: 'audio/mp4' });
  
  formData.append('audio', blob, 'zabka.m4a');
  formData.append('userId', 'test-user-reprocess');
  formData.append('language', 'pl');
  
  const uploadResponse = await fetch(`${API_URL}/api/voice-notes`, {
    method: 'POST',
    body: formData
  });
  
  if (!uploadResponse.ok) {
    console.error('❌ Upload failed:', await uploadResponse.text());
    process.exit(1);
  }
  
  const uploadResult = await uploadResponse.json();
  const voiceNoteId = uploadResult.voiceNote.id;
  console.log(`✅ Uploaded successfully! ID: ${voiceNoteId}\n`);
  
  // Process the voice note first
  console.log('2️⃣ Processing voice note...');
  const processResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'pl' })
  });
  
  if (!processResponse.ok) {
    console.error('❌ Processing failed:', await processResponse.text());
    process.exit(1);
  }
  
  console.log('✅ Processing completed!\n');
  
  // Wait a bit for processing to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Now test reprocessing
  console.log('3️⃣ Testing reprocess endpoint...');
  const reprocessResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}/reprocess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: 'You are a specialized assistant for extracting key business insights.',
      userPrompt: 'Focus on identifying action items and business opportunities.',
      language: 'PL'
    })
  });
  
  if (!reprocessResponse.ok) {
    const errorText = await reprocessResponse.text();
    console.error('❌ Reprocess failed:', errorText);
    console.error('Status:', reprocessResponse.status);
    process.exit(1);
  }
  
  const reprocessResult = await reprocessResponse.json();
  console.log('✅ Reprocess response:', JSON.stringify(reprocessResult, null, 2));
  
  // Check the updated voice note
  console.log('\n4️⃣ Fetching updated voice note...');
  const getResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}?includeTranscription=true&includeSummary=true`);
  
  if (!getResponse.ok) {
    console.error('❌ Failed to fetch voice note:', await getResponse.text());
    process.exit(1);
  }
  
  const voiceNote = await getResponse.json();
  console.log('✅ Voice note status:', voiceNote.status);
  
  if (voiceNote.summary) {
    console.log('✅ New summary generated:', voiceNote.summary.content.substring(0, 200) + '...');
  }
  
  console.log('\n✨ Reprocess endpoint test completed successfully!');
}

// Run the test
testReprocess().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});