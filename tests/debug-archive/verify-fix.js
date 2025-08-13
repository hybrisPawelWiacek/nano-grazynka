#!/usr/bin/env node

/**
 * Simple verification script to confirm transcription/summary fix
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3101';
const FILE_PATH = './zabka.m4a';

async function verifyFix() {
  console.log('🔍 Verifying Transcription/Summary Fix\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Upload file
    console.log('\n1️⃣  Uploading file...');
    const form = new FormData();
    form.append('audio', fs.createReadStream(FILE_PATH));
    form.append('userId', 'test-user-123');
    form.append('language', 'pl');
    
    const uploadResponse = await fetch(`${BASE_URL}/api/voice-notes/upload`, {
      method: 'POST',
      body: form
    });
    
    const uploadData = await uploadResponse.json();
    console.log(`   ✅ Upload successful! ID: ${uploadData.voiceNote.id}`);
    
    // Step 2: Process the file
    console.log('\n2️⃣  Processing voice note...');
    const processResponse = await fetch(`${BASE_URL}/api/voice-notes/${uploadData.voiceNote.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'pl' })
    });
    
    const processData = await processResponse.json();
    
    // Step 3: Check if transcription and summary are returned
    console.log('\n3️⃣  Checking response data...');
    console.log('   Response keys:', Object.keys(processData));
    
    if (processData.transcription) {
      console.log('   ✅ Transcription found!');
      console.log(`      - Language: ${processData.transcription.language}`);
      console.log(`      - Word count: ${processData.transcription.wordCount}`);
      console.log(`      - Text preview: ${processData.transcription.text.substring(0, 50)}...`);
    } else {
      console.log('   ❌ Transcription NOT found');
    }
    
    if (processData.summary) {
      console.log('   ✅ Summary found!');
      console.log(`      - Language: ${processData.summary.language}`);
      console.log(`      - Key points: ${processData.summary.keyPoints.length}`);
      console.log(`      - Action items: ${processData.summary.actionItems.length}`);
      console.log(`      - Summary preview: ${processData.summary.summary.substring(0, 50)}...`);
    } else {
      console.log('   ❌ Summary NOT found');
    }
    
    // Step 4: Verify by fetching the voice note
    console.log('\n4️⃣  Fetching voice note to double-check...');
    const getResponse = await fetch(`${BASE_URL}/api/voice-notes/${uploadData.voiceNote.id}?includeTranscription=true&includeSummary=true`);
    const getData = await getResponse.json();
    
    const hasTranscription = !!getData.voiceNote?.transcription;
    const hasSummary = !!getData.voiceNote?.summary;
    
    console.log(`   Transcription in GET response: ${hasTranscription ? '✅' : '❌'}`);
    console.log(`   Summary in GET response: ${hasSummary ? '✅' : '❌'}`);
    
    // Final verdict
    console.log('\n' + '=' .repeat(50));
    if (processData.transcription && processData.summary && hasTranscription && hasSummary) {
      console.log('🎉 FIX VERIFIED! Transcription and summary are working correctly!');
      return true;
    } else {
      console.log('⚠️  Issue still present - transcription/summary not fully working');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run verification
verifyFix().then(success => {
  process.exit(success ? 0 : 1);
});