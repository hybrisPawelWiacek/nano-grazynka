#!/usr/bin/env node

/**
 * Simple test for custom summary prompt using curl commands
 */

const { execSync } = require('child_process');
const path = require('path');

const API_BASE = 'http://localhost:3101';
const sessionId = 'test-session-' + Date.now();
const testFile = path.join(__dirname, '..', 'test-data', 'zabka.m4a');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch (e) {
    console.error('Command failed:', cmd);
    console.error('Error:', e.message);
    throw e;
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Custom Prompt Test ===\n');
  
  try {
    // 1. Upload file
    console.log('📤 Uploading voice note...');
    const uploadResult = runCommand(
      `curl -s -X POST "${API_BASE}/api/voice-notes" \
        -H "x-session-id: ${sessionId}" \
        -F "file=@${testFile}"`
    );
    
    const uploadData = JSON.parse(uploadResult);
    const noteId = uploadData.id;
    console.log('✅ Upload successful! Note ID:', noteId);
    
    // 2. Wait for processing
    console.log('⏳ Waiting for transcription...');
    let status = 'processing';
    let attempts = 0;
    
    while (status === 'processing' && attempts < 60) {
      await delay(2000);
      const statusResult = runCommand(
        `curl -s "${API_BASE}/api/voice-notes/${noteId}" \
          -H "x-session-id: ${sessionId}"`
      );
      const statusData = JSON.parse(statusResult);
      status = statusData.status;
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`   Status: ${status} (attempt ${attempts}/60)`);
      }
    }
    
    if (status !== 'completed') {
      throw new Error(`Processing failed or timed out. Status: ${status}`);
    }
    console.log('✅ Transcription completed!');
    
    // 3. Generate initial summary (default prompt)
    console.log('\n📝 Generating initial summary...');
    const summaryResult = runCommand(
      `curl -s -X POST "${API_BASE}/api/voice-notes/${noteId}/regenerate-summary" \
        -H "x-session-id: ${sessionId}" \
        -H "Content-Type: application/json" \
        -d '{}'`
    );
    
    const summaryData = JSON.parse(summaryResult);
    if (summaryData.summary) {
      const summary = typeof summaryData.summary === 'string' 
        ? JSON.parse(summaryData.summary) 
        : summaryData.summary;
      
      console.log('Initial summary structure:');
      console.log('- Has summary field:', 'summary' in summary);
      console.log('- Has key_points field:', 'key_points' in summary);
      console.log('- Has action_items field:', 'action_items' in summary);
    }
    
    // 4. Test custom prompt
    console.log('\n🔄 Testing custom prompt...');
    const customPrompt = '2 sentences summary plz';
    console.log(`Custom prompt: "${customPrompt}"`);
    
    const customResult = runCommand(
      `curl -s -X POST "${API_BASE}/api/voice-notes/${noteId}/regenerate-summary" \
        -H "x-session-id: ${sessionId}" \
        -H "Content-Type: application/json" \
        -d '{"userPrompt": "${customPrompt}"}'`
    );
    
    const customData = JSON.parse(customResult);
    console.log('✅ Custom summary generated!');
    
    if (customData.summary) {
      const customSummary = typeof customData.summary === 'string' 
        ? JSON.parse(customData.summary) 
        : customData.summary;
      
      console.log('\nCustom summary structure:');
      console.log('- Has summary field:', 'summary' in customSummary);
      console.log('- Has key_points field:', 'key_points' in customSummary);
      console.log('- Has action_items field:', 'action_items' in customSummary);
      
      if (customSummary.summary && !customSummary.key_points && !customSummary.action_items) {
        console.log('\n🎉 SUCCESS: Custom prompt produced flexible JSON!');
        console.log('Summary content:', customSummary.summary);
      } else {
        console.log('\n⚠️  WARNING: Summary still has rigid structure');
        console.log('Full summary:', JSON.stringify(customSummary, null, 2));
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);