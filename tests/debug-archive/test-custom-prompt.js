#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');

async function testCustomPrompt() {
  console.log('Testing custom prompt feature...\n');

  // Test 1: Upload without custom prompt
  console.log('Test 1: Upload WITHOUT custom prompt');
  const form1 = new FormData();
  form1.append('file', fs.createReadStream('backend/zabka.m4a'));
  form1.append('userId', 'default-user');
  
  try {
    const response1 = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      body: form1,
      headers: form1.getHeaders()
    });
    
    const data1 = await response1.json();
    console.log('✅ Upload successful:', data1.voiceNote.id);
    console.log('   Status:', data1.voiceNote.status);
    
    // Process the file
    const processResponse1 = await fetch(`http://localhost:3101/api/voice-notes/${data1.voiceNote.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const processData1 = await processResponse1.json();
    console.log('✅ Processing started');
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the result
    const resultResponse1 = await fetch(`http://localhost:3101/api/voice-notes/${data1.voiceNote.id}?includeTranscription=true&includeSummary=true`);
    const result1 = await resultResponse1.json();
    
    console.log('   Summary:', result1.summary?.summary?.substring(0, 100) + '...');
    console.log('   Key Points:', result1.summary?.keyPoints?.length || 0, 'items');
    console.log('   Action Items:', result1.summary?.actionItems?.length || 0, 'items\n');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Upload WITH custom prompt
  console.log('Test 2: Upload WITH custom prompt');
  const form2 = new FormData();
  form2.append('file', fs.createReadStream('backend/zabka.m4a'));
  form2.append('userId', 'default-user');
  form2.append('customPrompt', 'Focus on identifying all locations and proper names mentioned. Summarize in Polish language.');
  
  try {
    const response2 = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      body: form2,
      headers: form2.getHeaders()
    });
    
    const data2 = await response2.json();
    console.log('✅ Upload successful:', data2.voiceNote.id);
    console.log('   Status:', data2.voiceNote.status);
    console.log('   Custom prompt was sent');
    
    // Process the file
    const processResponse2 = await fetch(`http://localhost:3101/api/voice-notes/${data2.voiceNote.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const processData2 = await processResponse2.json();
    console.log('✅ Processing started with custom prompt');
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the result
    const resultResponse2 = await fetch(`http://localhost:3101/api/voice-notes/${data2.voiceNote.id}?includeTranscription=true&includeSummary=true`);
    const result2 = await resultResponse2.json();
    
    console.log('   Summary:', result2.summary?.summary?.substring(0, 100) + '...');
    console.log('   Key Points:', result2.summary?.keyPoints?.length || 0, 'items');
    console.log('   Action Items:', result2.summary?.actionItems?.length || 0, 'items');
    console.log('   Language detected:', result2.summary?.language || 'unknown');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  console.log('\n✅ All tests completed!');
}

testCustomPrompt().catch(console.error);