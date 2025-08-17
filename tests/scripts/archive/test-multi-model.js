#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// Use native FormData (Node.js 18+)

// Configuration
const API_URL = 'http://localhost:3101';
const TEST_AUDIO = path.join(__dirname, '../test-data/zabka.m4a');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-session-id': 'test-session-' + Date.now(),
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test GPT-4o transcription
async function testGPT4oTranscription() {
  console.log(`\n${colors.blue}Testing GPT-4o Transcription...${colors.reset}`);
  
  const form = new FormData();
  const audioBuffer = fs.readFileSync(TEST_AUDIO);
  const blob = new Blob([audioBuffer], { type: 'audio/m4a' });
  
  form.append('file', blob, 'test.m4a');
  form.append('language', 'pl');
  form.append('transcriptionModel', 'gpt-4o-transcribe');
  form.append('whisperPrompt', 'Żabka, sklep, zakupy');
  
  try {
    const result = await apiCall('/api/voice-notes', {
      method: 'POST',
      body: form
    });
    
    if (result.status === 200 || result.status === 201) {
      console.log(`${colors.green}✓ GPT-4o upload successful${colors.reset}`);
      console.log(`  Voice Note ID: ${result.data.voiceNote?.id}`);
      console.log(`  Model: ${result.data.voiceNote?.transcriptionModel}`);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Check status
      const statusResult = await apiCall(`/api/voice-notes/${result.data.voiceNote?.id}`);
      console.log(`  Status: ${statusResult.data.voiceNote?.status}`);
      console.log(`  Has transcription: ${!!statusResult.data.voiceNote?.transcriptionText}`);
      console.log(`  Has summary: ${!!statusResult.data.voiceNote?.summaryText}`);
      
      return result.data.voiceNote?.id;
    } else {
      console.log(`${colors.red}✗ GPT-4o upload failed: ${result.data.error}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ GPT-4o test error: ${error.message}${colors.reset}`);
    return null;
  }
}

// Test Gemini transcription
async function testGeminiTranscription() {
  console.log(`\n${colors.blue}Testing Gemini 2.0 Flash Transcription...${colors.reset}`);
  
  const form = new FormData();
  const audioBuffer = fs.readFileSync(TEST_AUDIO);
  const blob = new Blob([audioBuffer], { type: 'audio/m4a' });
  
  // Gemini template example
  const geminiPrompt = `=== CONTEXT ===
This is a recording from a Polish convenience store called Żabka.

=== GLOSSARY ===
- Żabka: Popular Polish convenience store chain
- Sklep: Store in Polish
- Zakupy: Shopping in Polish

=== INSTRUCTIONS ===
1. Transcribe accurately in Polish
2. Include timestamps every 10 seconds
3. Note any background sounds
4. Preserve the original language`;
  
  form.append('file', blob, 'test.m4a');
  form.append('language', 'pl');
  form.append('transcriptionModel', 'google/gemini-2.0-flash-001');
  form.append('geminiSystemPrompt', 'You are a professional Polish transcriber.');
  form.append('geminiUserPrompt', geminiPrompt);
  
  try {
    const result = await apiCall('/api/voice-notes', {
      method: 'POST',
      body: form
    });
    
    if (result.status === 200 || result.status === 201) {
      console.log(`${colors.green}✓ Gemini upload successful${colors.reset}`);
      console.log(`  Voice Note ID: ${result.data.voiceNote?.id}`);
      console.log(`  Model: ${result.data.voiceNote?.transcriptionModel}`);
      
      // Wait for processing (Gemini takes longer)
      await new Promise(resolve => setTimeout(resolve, 25000));
      
      // Check status
      const statusResult = await apiCall(`/api/voice-notes/${result.data.voiceNote?.id}`);
      console.log(`  Status: ${statusResult.data.voiceNote?.status}`);
      console.log(`  Has transcription: ${!!statusResult.data.voiceNote?.transcriptionText}`);
      console.log(`  Has summary: ${!!statusResult.data.voiceNote?.summaryText}`);
      
      return result.data.voiceNote?.id;
    } else {
      console.log(`${colors.red}✗ Gemini upload failed: ${result.data.error}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Gemini test error: ${error.message}${colors.reset}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.yellow}=== Multi-Model Transcription Test ===${colors.reset}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Audio: ${TEST_AUDIO}`);
  
  // Check if test file exists
  if (!fs.existsSync(TEST_AUDIO)) {
    console.log(`${colors.red}Error: Test audio file not found at ${TEST_AUDIO}${colors.reset}`);
    process.exit(1);
  }
  
  // Test both models
  const gpt4oId = await testGPT4oTranscription();
  const geminiId = await testGeminiTranscription();
  
  // Summary
  console.log(`\n${colors.yellow}=== Test Summary ===${colors.reset}`);
  console.log(`GPT-4o Test: ${gpt4oId ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Gemini Test: ${geminiId ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  
  if (gpt4oId && geminiId) {
    console.log(`\n${colors.green}All tests passed! Both transcription models are working.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}Some tests failed. Check the logs above for details.${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});