const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:3101';
const sessionId = 'test-frontend-fix-' + Date.now();

async function testCustomPromptFrontendFix() {
  console.log('Testing custom prompt frontend fix...\n');
  
  try {
    // Step 1: Upload and process zabka.m4a
    console.log('1. Uploading zabka.m4a...');
    const form = new FormData();
    const filePath = path.join(__dirname, '../test-data/zabka.m4a');
    form.append('file', fs.createReadStream(filePath));
    
    const uploadResponse = await fetch(`${API_URL}/api/voice-notes`, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'x-session-id': sessionId
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
    }

    const uploadData = await uploadResponse.json();
    const voiceNoteId = uploadData.voiceNote.id;
    console.log(`✓ Voice note created: ${voiceNoteId}`);

    // Step 2: Process the transcription
    console.log('\n2. Processing transcription...');
    const processResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({})
    });

    if (!processResponse.ok) {
      throw new Error(`Process failed: ${processResponse.status} ${await processResponse.text()}`);
    }

    await processResponse.json();
    console.log('✓ Transcription completed');

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Generate default summary
    console.log('\n3. Generating default summary...');
    const summaryResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}/regenerate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({})
    });

    if (!summaryResponse.ok) {
      throw new Error(`Summary generation failed: ${summaryResponse.status} ${await summaryResponse.text()}`);
    }

    const summaryData = await summaryResponse.json();
    console.log('✓ Default summary generated');
    console.log('Summary preview:', summaryData.voiceNote.summary?.summary?.substring(0, 100) + '...');

    // Step 4: Regenerate with custom prompt
    console.log('\n4. Regenerating with custom prompt: "2 sentences only"...');
    const customResponse = await fetch(`${API_URL}/api/voice-notes/${voiceNoteId}/regenerate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        userPrompt: '2 sentences only'
      })
    });

    if (!customResponse.ok) {
      throw new Error(`Custom regeneration failed: ${customResponse.status} ${await customResponse.text()}`);
    }

    const customData = await customResponse.json();
    console.log('✓ Custom summary generated');
    console.log('\n=== CUSTOM SUMMARY RESULT ===');
    console.log('Summary:', customData.voiceNote.summary?.summary);
    console.log('Key Points:', customData.voiceNote.summary?.keyPoints || 'None');
    console.log('Action Items:', customData.voiceNote.summary?.actionItems || 'None');
    
    // Verify it's actually different and shorter
    const customSummary = customData.voiceNote.summary?.summary || '';
    const sentences = customSummary.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    console.log('\n=== VERIFICATION ===');
    console.log(`Number of sentences: ${sentences.length}`);
    console.log(`Summary changed: ${customSummary !== summaryData.voiceNote.summary?.summary}`);
    
    if (sentences.length <= 3 && customSummary !== summaryData.voiceNote.summary?.summary) {
      console.log('\n✅ TEST PASSED: Custom prompt works correctly!');
    } else {
      console.log('\n❌ TEST FAILED: Custom prompt did not produce expected result');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testCustomPromptFrontendFix();