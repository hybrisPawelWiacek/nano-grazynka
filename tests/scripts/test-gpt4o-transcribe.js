#!/usr/bin/env node

/**
 * Test script for GPT-4o-Transcribe model
 * Tests the new transcription model configuration
 */

const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:3101';
const TEST_AUDIO = './zabka.m4a';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGPT4oTranscribe() {
  log('\n🎯 Testing GPT-4o-Transcribe Model Configuration', 'blue');
  log('==========================================\n', 'blue');

  // Check if test audio exists
  if (!fs.existsSync(TEST_AUDIO)) {
    log(`❌ Test audio file not found: ${TEST_AUDIO}`, 'red');
    log('Please ensure zabka.m4a is in the current directory', 'yellow');
    process.exit(1);
  }

  try {
    // Step 1: Create anonymous session
    log('📝 Creating anonymous session...', 'yellow');
    const sessionRes = await fetch(`${API_URL}/api/anonymous/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const { sessionId } = await sessionRes.json();
    log(`✅ Session created: ${sessionId}`, 'green');

    // Step 2: Upload file with model info request
    log('\n📤 Uploading audio file for transcription...', 'yellow');
    log('   Using: gpt-4o-audio-preview (OpenAI)', 'magenta');
    
    const form = new FormData();
    form.append('audio', fs.createReadStream(TEST_AUDIO));
    form.append('title', 'GPT-4o Transcribe Test');
    form.append('language', 'AUTO');
    
    // Add a whisper prompt to test the new model
    form.append('whisperPrompt', 'Zabu corporation, MCP servers, nano-Grazynka project');

    const uploadRes = await fetch(`${API_URL}/api/anonymous/voice-notes/upload`, {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
        ...form.getHeaders()
      },
      body: form
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const uploadData = await uploadRes.json();
    const noteId = uploadData.voiceNote.id;
    log(`✅ Upload successful: ${noteId}`, 'green');

    // Step 3: Poll for completion
    log('\n⏳ Processing with GPT-4o-Transcribe...', 'yellow');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusRes = await fetch(`${API_URL}/api/voice-notes/${noteId}`, {
        headers: { 'x-session-id': sessionId }
      });
      
      const noteData = await statusRes.json();
      
      if (noteData.voiceNote.status === 'completed') {
        log('✅ Transcription completed!', 'green');
        
        // Display results
        log('\n📊 Results:', 'blue');
        log('===========', 'blue');
        
        // Check if model info is available in response
        if (noteData.transcription?.model) {
          log(`Model Used: ${noteData.transcription.model}`, 'magenta');
        }
        
        log('\n📝 Transcription:', 'yellow');
        console.log(noteData.transcription.text.substring(0, 200) + '...');
        
        log('\n📋 Summary:', 'yellow');
        console.log(noteData.summary.summary.substring(0, 200) + '...');
        
        // Verify the transcription quality
        const text = noteData.transcription.text.toLowerCase();
        log('\n🔍 Quality Check:', 'blue');
        
        // Check for common corrections that GPT-4o should handle better
        const checks = [
          { term: 'zabu', expected: true, found: text.includes('zabu') },
          { term: 'zubu', expected: false, found: text.includes('zubu') },
          { term: 'mcp', expected: true, found: text.includes('mcp') },
          { term: 'nano-grazynka', expected: true, found: text.includes('grazynka') || text.includes('grażynka') }
        ];
        
        checks.forEach(check => {
          const status = (check.expected === check.found) ? '✅' : '❌';
          const result = check.found ? 'found' : 'not found';
          log(`  ${status} "${check.term}" - ${result}`, check.expected === check.found ? 'green' : 'red');
        });
        
        log('\n✨ GPT-4o-Transcribe test complete!', 'green');
        break;
      } else if (noteData.voiceNote.status === 'failed') {
        throw new Error(`Processing failed: ${noteData.voiceNote.error}`);
      }
      
      process.stdout.write('.');
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Timeout waiting for transcription');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
testGPT4oTranscribe().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});