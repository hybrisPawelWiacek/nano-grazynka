#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');

async function testMultiModelTranscription() {
  console.log('Testing Multi-Model Transcription Feature\n');
  console.log('==========================================\n');

  const audioFile = './tests/scripts/zabka.m4a';
  
  // Test 1: GPT-4o-transcribe with whisper prompt
  console.log('Test 1: GPT-4o-transcribe with whisper prompt');
  console.log('-----------------------------------------------');
  
  try {
    const formData1 = new FormData();
    const fileBuffer1 = fs.readFileSync(audioFile);
    formData1.append('file', fileBuffer1, 'zabka.m4a');
    formData1.append('language', 'PL');
    formData1.append('transcriptionModel', 'gpt-4o-transcribe');
    formData1.append('whisperPrompt', 'Żabka, sklep convenience, hot dog');
    formData1.append('sessionId', 'test-session-' + Date.now());

    const response1 = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      headers: {
        'x-session-id': 'test-session-' + Date.now(),
        ...formData1.getHeaders()
      },
      body: formData1
    });

    const result1 = await response1.json();
    console.log('✅ Upload successful');
    console.log('Voice Note ID:', result1.voiceNote?.id);
    console.log('Model used:', result1.voiceNote?.transcriptionModel);
    console.log('Whisper prompt:', result1.voiceNote?.whisperPrompt);
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n');

  // Test 2: Gemini 2.0 Flash with extended prompts
  console.log('Test 2: Gemini 2.0 Flash with extended prompts');
  console.log('-----------------------------------------------');
  
  try {
    const formData2 = new FormData();
    const fileBuffer2 = fs.readFileSync(audioFile);
    formData2.append('file', fileBuffer2, 'zabka.m4a');
    formData2.append('language', 'PL');
    formData2.append('transcriptionModel', 'google/gemini-2.0-flash-001');
    formData2.append('geminiSystemPrompt', 'You are transcribing a casual Polish conversation about shopping.');
    formData2.append('geminiUserPrompt', 'This is a conversation at a Żabka convenience store about hot dogs. Common terms: Żabka, hot dog, parówka, bułka.');
    formData2.append('sessionId', 'test-session-' + Date.now());

    const response2 = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      headers: {
        'x-session-id': 'test-session-' + Date.now(),
        ...formData2.getHeaders()
      },
      body: formData2
    });

    const result2 = await response2.json();
    console.log('✅ Upload successful');
    console.log('Voice Note ID:', result2.voiceNote?.id);
    console.log('Model used:', result2.voiceNote?.transcriptionModel);
    console.log('System prompt:', result2.voiceNote?.geminiSystemPrompt?.substring(0, 50) + '...');
    console.log('User prompt:', result2.voiceNote?.geminiUserPrompt?.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n==========================================');
  console.log('Multi-Model Transcription Tests Complete');
}

// Run the test
testMultiModelTranscription().catch(console.error);