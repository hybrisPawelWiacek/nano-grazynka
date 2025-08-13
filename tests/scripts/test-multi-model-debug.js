const fs = require('fs');
const FormData = require('form-data');

async function testMultiModelUpload() {
  const fetch = (await import('node-fetch')).default;
  console.log('Testing multi-model transcription upload...\n');

  const sessionId = 'test-session-' + Date.now();
  const audioFile = fs.readFileSync('./tests/scripts/zabka.m4a');

  // Test 1: GPT-4o-transcribe with Whisper prompt
  console.log('Test 1: GPT-4o-transcribe with Whisper prompt');
  const formData1 = new FormData();
  formData1.append('file', audioFile, {
    filename: 'test-gpt4o.m4a',
    contentType: 'audio/m4a'
  });
  formData1.append('language', 'pl');
  formData1.append('sessionId', sessionId);
  formData1.append('transcriptionModel', 'gpt-4o-transcribe');
  formData1.append('whisperPrompt', 'This is a Polish audio about shopping.');

  try {
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
        ...formData1.getHeaders()
      },
      body: formData1
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.voiceNote) {
      console.log('\n📊 Received fields:');
      console.log('  - transcriptionModel:', result.voiceNote.transcriptionModel);
      console.log('  - whisperPrompt:', result.voiceNote.whisperPrompt);
      console.log('  - geminiSystemPrompt:', result.voiceNote.geminiSystemPrompt);
      console.log('  - geminiUserPrompt:', result.voiceNote.geminiUserPrompt);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Gemini with custom prompts
  console.log('\n\nTest 2: Gemini 2.0 Flash with custom prompts');
  const formData2 = new FormData();
  formData2.append('file', audioFile, {
    filename: 'test-gemini.m4a',
    contentType: 'audio/m4a'
  });
  formData2.append('language', 'pl');
  formData2.append('sessionId', sessionId);
  formData2.append('transcriptionModel', 'google/gemini-2.0-flash-001');
  formData2.append('geminiSystemPrompt', 'You are a transcription expert.');
  formData2.append('geminiUserPrompt', 'Transcribe this Polish conversation about shopping.');

  try {
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
        ...formData2.getHeaders()
      },
      body: formData2
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.voiceNote) {
      console.log('\n📊 Received fields:');
      console.log('  - transcriptionModel:', result.voiceNote.transcriptionModel);
      console.log('  - whisperPrompt:', result.voiceNote.whisperPrompt);
      console.log('  - geminiSystemPrompt:', result.voiceNote.geminiSystemPrompt);
      console.log('  - geminiUserPrompt:', result.voiceNote.geminiUserPrompt);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testMultiModelUpload();