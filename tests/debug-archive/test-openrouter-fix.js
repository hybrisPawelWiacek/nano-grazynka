#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:3101';

async function testOpenRouterFix() {
  console.log('Testing OpenRouter API key fix...\n');
  
  // Create a test voice note with transcription
  const testNoteId = 'test-' + Date.now();
  
  // Create a voice note with transcription
  const createResponse = await fetch(`${API_BASE_URL}/api/voice-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': 'test-session-' + Date.now()
    },
    body: JSON.stringify({
      id: testNoteId,
      title: 'Test OpenRouter Fix',
      originalFilePath: '/test/path.mp3',
      fileSize: 1000,
      mimeType: 'audio/mp3',
      language: 'en',
      transcription: {
        text: 'This is a test transcription to verify that OpenRouter API key is properly configured and the summarization service works correctly with the Gemini model.',
        language: 'en',
        duration: 10,
        confidence: 0.95
      }
    })
  });

  if (!createResponse.ok) {
    console.error('Failed to create voice note:', await createResponse.text());
    return;
  }

  console.log('✅ Voice note created with transcription\n');

  // Test regenerate summary endpoint
  console.log('Testing summary generation with OpenRouter...');
  const summaryResponse = await fetch(`${API_BASE_URL}/api/voice-notes/${testNoteId}/regenerate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': 'test-session-' + Date.now()
    },
    body: JSON.stringify({
      summaryPrompt: 'Create a brief summary of this transcription focusing on the main point about API configuration.'
    })
  });

  if (!summaryResponse.ok) {
    const error = await summaryResponse.text();
    console.error('❌ Summary generation failed:', error);
    
    // Check logs for debug output
    console.log('\nCheck docker logs for debug output:');
    console.log('docker compose logs backend --tail 50 | grep "OpenRouter API Key Debug" -A10');
    return;
  }

  const result = await summaryResponse.json();
  console.log('✅ Summary generated successfully!\n');
  console.log('Summary:', result.voiceNote?.summary?.summary || 'No summary found');
  console.log('\nKey Points:', result.voiceNote?.summary?.keyPoints || []);
  
  // Clean up
  await fetch(`${API_BASE_URL}/api/voice-notes/${testNoteId}`, {
    method: 'DELETE',
    headers: {
      'x-session-id': 'test-session-' + Date.now()
    }
  });
  
  console.log('\n✅ Test completed successfully! OpenRouter API is working.');
}

testOpenRouterFix().catch(console.error);