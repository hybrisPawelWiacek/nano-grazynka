#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚀 Starting transcription test for zabka.m4a\n');

// Step 1: Upload the file
function uploadFile() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream('./zabka.m4a'), {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    form.append('title', 'Zabka Test Recording');
    form.append('language', 'PL');
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    console.log('📤 Uploading file...');
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('✅ Upload successful!');
          console.log('   Voice Note ID:', result.voiceNote.id);
          resolve(result.voiceNote.id);
        } else {
          console.error('❌ Upload failed with status:', res.statusCode);
          console.error('   Response:', data);
          reject(new Error('Upload failed'));
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });
    
    form.pipe(req);
  });
}

// Step 2: Trigger processing
function processVoiceNote(id) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ language: 'PL' });
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: `/api/voice-notes/${id}/process`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    console.log('\n🔄 Triggering processing...');
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Processing started!');
          resolve(id);
        } else {
          console.error('❌ Processing failed with status:', res.statusCode);
          console.error('   Response:', responseData);
          reject(new Error('Processing failed'));
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });
    
    req.write(data);
    req.end();
  });
}

// Step 3: Check status and get transcription
function checkStatus(id, attempts = 0) {
  return new Promise((resolve, reject) => {
    if (attempts > 10) {
      reject(new Error('Timeout waiting for processing'));
      return;
    }
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: `/api/voice-notes/${id}?includeTranscription=true&includeSummary=true`,
      method: 'GET'
    };
    
    console.log(`\n🔍 Checking status (attempt ${attempts + 1})...`);
    
    http.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(data);
        console.log('   Status:', result.status);
        
        if (result.status === 'completed') {
          console.log('\n🎉 PROCESSING COMPLETE!\n');
          
          if (result.transcriptions && result.transcriptions[0]) {
            console.log('═══════════════════════════════════════════════════════');
            console.log('📝 TRANSCRIPTION');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Language:', result.transcriptions[0].language);
            console.log('Content:\n');
            console.log(result.transcriptions[0].content);
            console.log('═══════════════════════════════════════════════════════\n');
          }
          
          if (result.summaries && result.summaries[0]) {
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 SUMMARY');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Summary:', result.summaries[0].summary);
            console.log('\nKey Points:');
            result.summaries[0].keyPoints?.forEach((point, i) => {
              console.log(`  ${i + 1}. ${point}`);
            });
            console.log('\nAction Items:');
            result.summaries[0].actionItems?.forEach((item, i) => {
              console.log(`  ${i + 1}. ${item}`);
            });
            console.log('═══════════════════════════════════════════════════════');
          }
          
          resolve(result);
        } else if (result.status === 'failed') {
          console.error('❌ Processing failed:', result.errorMessage);
          reject(new Error(result.errorMessage));
        } else {
          // Still processing, check again
          setTimeout(() => {
            checkStatus(id, attempts + 1).then(resolve).catch(reject);
          }, 2000);
        }
      });
    }).on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });
  });
}

// Main execution
async function main() {
  try {
    // Check if file exists
    if (!fs.existsSync('./zabka.m4a')) {
      console.error('❌ zabka.m4a not found!');
      process.exit(1);
    }
    
    const fileStats = fs.statSync('./zabka.m4a');
    console.log(`📁 File: zabka.m4a (${fileStats.size} bytes)\n`);
    
    // Execute the workflow
    const voiceNoteId = await uploadFile();
    await processVoiceNote(voiceNoteId);
    await checkStatus(voiceNoteId);
    
    console.log('\n✅ ALL DONE! Transcription retrieved successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();